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
};
