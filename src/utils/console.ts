import pkg from '../../package.json';

const PREFIX = `[${pkg.name}:${pkg.version}]`;

// Note: Due to JavaScript limitations, any console wrapper will show up in stack traces.
// For better debugging experience, consider using the exported logger instead of patched console.

// Create prefixed console that preserves stack traces better
export const console = {
  log: globalThis.console.log.bind(globalThis.console, PREFIX),
  error: globalThis.console.error.bind(globalThis.console, PREFIX),
  debug: globalThis.console.debug.bind(globalThis.console, PREFIX),
  warn: globalThis.console.warn.bind(globalThis.console, PREFIX),
  info: globalThis.console.info.bind(globalThis.console, PREFIX),
  time: (label?: string) => globalThis.console.time.bind(globalThis.console, PREFIX + ' ' + label)(),
  timeEnd: (label?: string) => globalThis.console.timeEnd.bind(globalThis.console, PREFIX + ' ' + label)(),
};

export function arrayPreview<T>(arr: T[], limit = 5): [string, T[]] {
  const preview = arr.slice(0, limit);
  const summary = `(${Math.min(limit, arr.length)} of ${arr.length})`;
  return [summary, preview];
}
