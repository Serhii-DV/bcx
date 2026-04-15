import { console } from './console';

type AppMountMeasureOptions = {
  label: string;
  setupStartMark?: string;
};

const getPerformance = (): Performance | null => {
  if (typeof globalThis.performance === 'undefined') {
    return null;
  }

  return globalThis.performance;
};

const scheduleFirstFrameMeasurement = (callback: () => void): void => {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(callback);
    return;
  }

  setTimeout(callback, 0);
};

const getLatestMeasure = (name: string): PerformanceEntry | undefined => {
  return performance.getEntriesByName(name).at(-1);
};

const logMeasure = (name: string): void => {
  const measure = getLatestMeasure(name);

  if (!measure) {
    return;
  }

  console.log('[performance]', name, Number(measure.duration.toFixed(2)), 'ms');
};

export const markAppSetupStart = (label: string): string | undefined => {
  const perf = getPerformance();

  if (!perf) {
    return undefined;
  }

  const setupStartMark = `${label}:setup-start`;
  perf.mark(setupStartMark);

  return setupStartMark;
};

export const measureAppMount = <T>(
  options: AppMountMeasureOptions,
  mountApp: () => T,
): T => {
  const perf = getPerformance();

  if (!perf) {
    return mountApp();
  }

  const mountStartMark = `${options.label}:mount-start`;
  const mountEndMark = `${options.label}:mount-end`;
  const firstFrameMark = `${options.label}:first-frame`;
  const setupMeasure = `${options.label}:setup-before-mount`;
  const synchronousMountMeasure = `${options.label}:mount-sync`;
  const firstFrameDelayMeasure = `${options.label}:mount-end-to-first-frame`;
  const mountMeasure = `${options.label}:mount-to-first-frame`;
  const totalMeasure = `${options.label}:total-startup`;

  perf.mark(mountStartMark);
  const app = mountApp();
  perf.mark(mountEndMark);
  perf.measure(synchronousMountMeasure, mountStartMark, mountEndMark);
  logMeasure(synchronousMountMeasure);

  scheduleFirstFrameMeasurement(() => {
    perf.mark(firstFrameMark);
    perf.measure(firstFrameDelayMeasure, mountEndMark, firstFrameMark);
    perf.measure(mountMeasure, mountStartMark, firstFrameMark);
    logMeasure(firstFrameDelayMeasure);
    logMeasure(mountMeasure);

    if (options.setupStartMark) {
      perf.measure(setupMeasure, options.setupStartMark, mountStartMark);
      perf.measure(totalMeasure, options.setupStartMark, firstFrameMark);
      logMeasure(setupMeasure);
      logMeasure(totalMeasure);
    }
  });

  return app;
};
