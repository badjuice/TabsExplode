// Firefox exposes a `chrome` shim, but it is callback-based, so awaiting it
// yields undefined instead of a result and fails silently. `browser` is the
// promise-based namespace there. In Chromium `browser` is undefined and
// `chrome` is already promise-based under MV3, so this resolves correctly on
// both without any browser sniffing.
export const api = globalThis.browser ?? globalThis.chrome;

// True on Gecko. Used only where a capability cannot be feature-detected,
// such as the absence of any navigable bookmark-manager URL.
export const isGecko = globalThis.browser !== undefined;
