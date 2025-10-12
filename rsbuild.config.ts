import path from 'node:path';
import { defineConfig } from '@rsbuild/core';
import { pluginSvelte } from '@rsbuild/plugin-svelte';
import pkg from './package.json';
import { manifestPlugin } from './src/build/manifestPlugin';

export default function (env: any = {}, argv: Record<string, any> = {}) {
  const isProd = process.env.NODE_ENV === 'production';

  return defineConfig({
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
        popup: './src/popup/main.ts',
        background: {
          import: './src/background.ts',
          html: false,
        },
        'bandcamp.content.all': {
          import: './src/bandcamp/content/app.all.ts',
          html: false,
        },
        'bandcamp.content.pageMusic': {
          import: './src/bandcamp/content/app.pageMusic.ts',
          html: false,
        },
        'bandcamp.content.album': {
          import: './src/bandcamp/content/app.album.ts',
          html: false,
        },
        'bandcamp.content.track': {
          import: './src/bandcamp/content/app.track.ts',
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
      cleanDistPath: true,
      distPath: {
        js: '',
        css: '',
      },
      filename: {
        js: isProd ? '[name].js?v=[contenthash:8]' : `[name].js`,
        css: isProd ? '[name].css?v=[contenthash:8]' : `[name].css`,
      },
      minify: isProd,
      sourceMap: {
        js: isProd ? 'source-map' : 'cheap-module-source-map',
      },
      assetPrefix: './',
    },
    html: {
      outputStructure: 'flat',
    },
    performance: {
      buildCache: false, // Disable cache for browser extensions
      chunkSplit: {
        strategy: 'all-in-one', // Bundle everything in one file. Fix issue with loading content script.
      },
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
