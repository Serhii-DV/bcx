import type { Logger, RsbuildPlugin, RsbuildPluginAPI } from '@rsbuild/core';
import { execSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import baseManifest from '../manifest.json';

export interface ManifestOptions {
  outputDir?: string;
  filename?: string;
  customFields?: Record<string, any>;
  transformer?: (manifest: any) => any;
  generateOnBuild?: boolean;
  generateOnDev?: boolean;
  generateOnDevStart?: boolean;
  appendDevData?: boolean;
  minify?: boolean;
}

function createDynamicManifest(options: ManifestOptions) {
  let dynamicManifest = {
    ...baseManifest,
    ...options.customFields,
  };

  if (options.transformer) {
    dynamicManifest = options.transformer(dynamicManifest);
  }

  if (options.appendDevData) {
    const { branch, commit, dirty } = getGitInfo();
    const date = new Date();
    dynamicManifest.name += ` [DEV:${branch}]`;
    dynamicManifest.description += ` [${branch}][${commit}][${dirty}][${date.toLocaleString()}]`;
  }

  return dynamicManifest;
}

function getGitInfo() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD')
      .toString()
      .trim();
    const commit = execSync('git rev-parse --short HEAD').toString().trim();
    const dirty = execSync('git diff --quiet || echo "*"').toString().trim();
    return { branch, commit, dirty };
  } catch {
    return { branch: 'unknown', commit: 'unknown', dirty: '' };
  }
}

function writeManifestFile(
  manifest: any,
  outputDir: string,
  filename: string,
  minify = false,
  logger?: Logger,
) {
  const distPath = join(process.cwd(), outputDir);
  const manifestPath = join(distPath, filename);

  try {
    mkdirSync(distPath, { recursive: true });

    const jsonString = minify
      ? JSON.stringify(manifest)
      : JSON.stringify(manifest, null, 2);

    writeFileSync(manifestPath, jsonString);

    logger?.success(`${filename} generated at: ${manifestPath}`);
  } catch (error) {
    logger?.error(`Failed to generate ${filename}:`, error);
    throw error;
  }
}

export function manifestPlugin(options: ManifestOptions = {}): RsbuildPlugin {
  const {
    outputDir = 'dist',
    filename = 'manifest.json',
    customFields = {},
    transformer,
    generateOnBuild = true,
    generateOnDev = true,
    generateOnDevStart = true,
    appendDevData = false,
    minify = true,
  } = options;

  return {
    name: 'generate-manifest',
    setup(api: RsbuildPluginAPI) {
      const logger = api.logger;

      const generateManifest = (context?: string) => {
        const actualOutputDir =
          api.getRsbuildConfig().output?.distPath?.root || outputDir;

        const finalManifest = createDynamicManifest({
          customFields,
          transformer,
          appendDevData,
        });

        writeManifestFile(
          finalManifest,
          actualOutputDir,
          filename,
          minify,
          logger,
        );

        if (context) {
          logger.info(`Manifest generated during: ${context}`);
        }

        logger.info(finalManifest.name, finalManifest.version);
      };

      if (generateOnBuild) {
        api.onBeforeBuild(() => {
          generateManifest('build');
        });
      }

      if (generateOnDevStart) {
        api.onBeforeStartDevServer(() => {
          generateManifest('dev server start');
        });
      }

      if (generateOnDev) {
        api.onDevCompileDone(() => {
          generateManifest('dev compilation');
        });
      }
    },
  };
}
