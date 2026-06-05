import path from 'node:path';
import { defineConfig } from '@rsbuild/core';
import { pluginSvelte } from '@rsbuild/plugin-svelte';
import pkg from './package.json';
import { manifestPlugin } from './src/build/manifestPlugin';

export default function (env: any = {}, argv: Record<string, any> = {}) {
  const isProd = env.envMode === 'production';

  return defineConfig({
    splitChunks: false, // Disable code splitting for browser extensions
    plugins: [
      pluginSvelte(),
      manifestPlugin({
        appendDevData: !isProd,
        minify: isProd,
        customFields: {
          version: pkg.version,
          description: pkg.description,
        },
      }),
    ],
    source: {
      entry: {
        bcx: {
          import: './src/app/bcx/bcx.ts',
          html: false,
        },
        popup: './src/popup/main.ts',
        sidepanel: './src/sidepanel/main.ts',
        background: {
          import: './src/background.ts',
          html: false,
        },
        'bandcamp.content.app': {
          import: './src/bandcamp/content/app.ts',
          html: false,
        },
        'bandcamp.content.page.music': {
          import: './src/bandcamp/content/pages/app.pageMusic.ts',
          html: false,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        $lib: path.resolve(__dirname, './src/lib'),
      },
    },
    output: {
      filename: {
        js: '[name].js?v=[contenthash:8]',
        css: '[name].css?v=[contenthash:8]',
      },
      assetPrefix: './',
      copy: [
        {
          from: './src/assets',
          to: './assets',
        },
      ],
    },
    dev: {
      writeToDisk: true, // Write files to disk for browser extension development
      hmr: false, // Disable HMR for browser extension content scripts
      liveReload: false, // Disable live reload to prevent WebSocket connections
    },

    tools: {
      rspack: (config) => {
        // Just ignore specific warning patterns
        config.ignoreWarnings = [
          /state_referenced_locally/,
          /node_modules/,
          /runed/,
          /mode-watcher/,
        ];

        return config;
      },

      postcss: (opts) => {
        opts.postcssOptions = {
          plugins: ['@tailwindcss/postcss', 'autoprefixer'],
        };
      },
    },
  });
}
