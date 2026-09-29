import { describe, expect, rstest, test } from '@rstest/core';
import { readFileSync, writeFileSync } from 'fs';
import { manifestPlugin } from './manifestPlugin';

// Mock dependencies
rstest.mock('fs', () => ({
  readFileSync: rstest.fn(),
  writeFileSync: rstest.fn(),
  mkdirSync: rstest.fn(),
}));

describe('manifestPlugin', () => {
  test('creates plugin and generates manifest', () => {
    const manifest = {
      name: 'Test Extension',
      version: '1.0.0',
      permissions: ['storage'],
    };
    rstest
      .mocked(readFileSync)
      .mockReturnValueOnce(JSON.stringify(manifest))
      .mockReturnValueOnce(
        JSON.stringify({
          ...manifest,
          permissions: ['storage', 'unlimitedStorage'],
        }),
      );
    const mockApi = {
      logger: { success: rstest.fn(), info: rstest.fn() },
      getRsbuildConfig: () => ({ output: { distPath: { root: 'dist' } } }),
      onBeforeBuild: rstest.fn((cb) => cb()),
      onBeforeStartDevServer: rstest.fn(),
      onDevCompileDone: rstest.fn((cb) => cb()),
    };

    const plugin = manifestPlugin({ filename: 'manifest.json' });
    plugin.setup(mockApi as any);

    expect(plugin.name).toBe('generate-manifest');
    expect(writeFileSync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('manifest.json'),
      JSON.stringify(manifest),
    );
    expect(writeFileSync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('manifest.json'),
      JSON.stringify({
        ...manifest,
        permissions: ['storage', 'unlimitedStorage'],
      }),
    );
    expect(mockApi.logger.success).toHaveBeenCalledWith(
      expect.stringContaining('manifest.json generated at:'),
    );
  });
});
