/**
 * Whether a value is a promise, or anything else with a `then`, such as a promise from another frame.
 *
 * Internal: ConfirmDialog's confirm and SaveBar's action read their result this way. Not exported from the package.
 */
export function isThenable(value: unknown): value is PromiseLike<unknown> {
  return typeof value === 'object' && value !== null && 'then' in value && typeof value.then === 'function';
}

/**
 * Hands an error to the page as if nothing had caught it, so it reaches the console and the page's `error`
 * listeners. `reportError` does that in every browser the library supports; where it is missing, the error is
 * thrown again from a microtask, where no handler can catch it.
 *
 * Internal: ConfirmDialog reports a rejected confirm and SaveBar a rejected action this way. Not exported from the
 * package.
 */
export function report(error: unknown): void {
  if (typeof reportError === 'function') reportError(error);
  else
    queueMicrotask(() => {
      throw error;
    });
}
