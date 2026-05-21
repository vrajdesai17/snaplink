// Node.js 22+ exposes an experimental `localStorage` global via
// --localstorage-file. Without a valid backing file the Storage methods throw,
// which causes Prisma Client (and recharts) to crash during SSR because they
// assume any environment with `localStorage` defined is a browser.
// This polyfill replaces the broken object with a safe in-memory no-op so
// server-side code continues to work normally.
export function register() {
  if (
    typeof globalThis.localStorage !== "undefined" &&
    typeof (globalThis.localStorage as { getItem?: unknown }).getItem !== "function"
  ) {
    const noop = {
      getItem: (_k: string) => null,
      setItem: (_k: string, _v: string) => {},
      removeItem: (_k: string) => {},
      clear: () => {},
      key: (_i: number) => null,
      length: 0,
    } as Storage;

    Object.defineProperty(globalThis, "localStorage", {
      value: noop,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, "sessionStorage", {
      value: noop,
      writable: true,
      configurable: true,
    });
  }
}
