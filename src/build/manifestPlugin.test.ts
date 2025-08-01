import { describe, expect, rstest, test } from '@rstest/core';
import { manifestPlugin } from './manifestPlugin';

// Mock dependencies
rstest.mock('../manifest.json', () => ({
  default: { name: 'Test Extension', version: '1.0.0' },
}));
rstest.mock('fs', () => ({
  writeFileSync: rstest.fn(),
  mkdirSync: rstest.fn(),
}));

describe('manifestPlugin', () => {
  test('creates plugin and generates manifest', () => {
    const mockApi = {
      logger: { success: rstest.fn(), info: rstest.fn() },
      getRsbuildConfig: () => ({ output: { distPath: { root: 'dist' } } }),
      onBeforeBuild: rstest.fn((cb) => cb()),
      onBeforeStartDevServer: rstest.fn(),
      onDevCompileDone: rstest.fn(),
    };

    const plugin = manifestPlugin({ filename: 'manifest.json' });
    plugin.setup(mockApi as any);

    expect(plugin.name).toBe('generate-manifest');
    expect(mockApi.logger.success).toHaveBeenCalledWith(
      expect.stringContaining('manifest.json generated at:'),
    );
  });
});
