/**
 * Promise timeout utility
 *
 * Wraps a promise with a timeout that rejects if the promise doesn't
 * resolve within the specified duration. Cleans up the timer on success
 * to avoid leaking timers in serverless environments.
 */

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`TIMEOUT: ${errorMessage}`)),
      timeoutMs
    );
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}
