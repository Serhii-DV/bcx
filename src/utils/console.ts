const PREFIX = '[bcx]';
type ConsoleMethod = 'log' | 'error' | 'debug' | 'warn' | 'info';
const PATCHED = Symbol.for('__console_patched__');

if (!(globalThis.console as any)[PATCHED]) {
  (['log', 'error', 'debug', 'warn', 'info'] as ConsoleMethod[]).forEach(
    (method) => {
      const original = console[method].bind(console);
      console[method] = (...args: unknown[]) => {
        original(PREFIX, ...args);
      };
    },
  );
  (globalThis.console as any)[PATCHED] = true;
}
