import path from 'node:path';
import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';

// Target browsers, see: https://github.com/browserslist/browserslist
const targets = ['last 2 versions', '> 0.2%', 'not dead', 'Firefox ESR'];

export default function (env: any = {}, argv: Record<string, any> = {}) {
  const isProduction =
    env.production === true ||
    env === 'production' ||
    (typeof env === 'object' && Object.keys(env).includes('production')) ||
    argv.mode === 'production';

  const isDevelopment = !isProduction;
  const mode = isDevelopment ? 'development' : 'production';

  return defineConfig({
    mode,
    entry: {
      popup: './src/popup/popup.ts',
      background: './src/background.ts',
    },
    resolve: {
      extensions: ['...', '.ts'],
      tsConfig: path.resolve(__dirname, './tsconfig.json'),
    },
    module: {
      rules: [
        {
          test: /\.svg$/,
          type: 'asset',
        },
        {
          test: /\.js$/,
          use: [
            {
              loader: 'builtin:swc-loader',
              options: {
                jsc: {
                  parser: {
                    syntax: 'ecmascript',
                  },
                },
                env: { targets },
              },
            },
          ],
        },
        {
          test: /\.ts$/,
          exclude: [/node_modules/],
          use: [
            {
              loader: 'builtin:swc-loader',
              options: {
                jsc: {
                  parser: {
                    syntax: 'typescript',
                  },
                },
                env: { targets },
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new rspack.HtmlRspackPlugin({
        template: './src/popup/popup.html',
        filename: 'popup.html',
        chunks: ['popup'],
        minify: !isDevelopment,
      }),
      new rspack.CopyRspackPlugin({
        patterns: [
          {
            from: 'src/manifest.json',
            to: 'manifest.json',
            transform: (content) => {
              const manifest = JSON.parse(content.toString());
              const packageJson = require('./package.json');
              // Update the manifest version to match the package version
              manifest.version = packageJson.version;

              if (isDevelopment) {
                // version: MMDD.HHMMSS
                const version = new Date()
                  .toISOString()
                  .slice(5, 19)
                  .replace(/[-:T]/g, '')
                  .replace(/(.{4})(.{6})/, '$1.$2');
                manifest.name += ` [${version}]`;

                // Add looser CSP for development to support source maps
                manifest.content_security_policy = {
                  extension_pages:
                    "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'",
                };
              }

              manifest.description =
                packageJson.description || manifest.description;
              return JSON.stringify(manifest, null, 2);
            },
          },
        ],
      }),
    ],
    output: {
      path: path.resolve(__dirname, 'dist'),
      clean: true,
    },
    optimization: {
      minimize: !isDevelopment,
      minimizer: !isDevelopment
        ? [
            new rspack.SwcJsMinimizerRspackPlugin(),
            new rspack.LightningCssMinimizerRspackPlugin({
              minimizerOptions: { targets },
            }),
          ]
        : [],
    },
    devtool: isDevelopment ? 'cheap-module-source-map' : 'source-map',
    experiments: {
      css: true,
    },
  });
}
