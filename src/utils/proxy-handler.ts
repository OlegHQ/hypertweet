/**
 * Type definition for the callback function that handles proxy calls.
 * @param path - The dot-notation path of the called function
 * @param args - Array of arguments passed to the function
 * @returns Promise that resolves with the function's result
 */
type CallFn = (path: string, args: any[]) => Promise<unknown>;

/**
 * Creates a proxy object that intercepts all property access and function calls,
 * converting them into path-based function calls.
 * 
 * @example
 * ```typescript
 * const handler = createProxyHandler((path, args) => {
 *   console.log(`Called ${path} with args:`, args);
 *   return Promise.resolve('result');
 * });
 * 
 * // These will all be handled by the proxy:
 * await handler.foo.bar.baz(1, 2, 3);
 * // Logs: "Called foo.bar.baz with args: [1, 2, 3]"
 * ```
 * 
 * @typeParam T - The type of the object to create a proxy for
 * @param onCall - Function that handles all proxy calls
 * @returns A proxy object that intercepts all property access and function calls
 */
export function createProxyHandler<T extends object>(onCall: CallFn): T {
  /** Recursively build a proxy for any property / call chain */
  const makeProxy = (pathParts: string[]): any =>
    new Proxy(() => {}, {
      get(_, prop: string | symbol) {
        // Prevent Proxy from hijacking Promise‑like behavior
        if (prop === "then") return undefined;
        return makeProxy([...pathParts, String(prop)]);
      },
      apply(_, __, args: any[]) {
        const path = pathParts.join(".");
        return onCall(path, args);
      },
    });

  // Cast is safe because every access ends up at our proxy handler
  return makeProxy([]) as unknown as T;
}

/**
 * Creates a function that can invoke methods on an object using dot-notation paths.
 * This is useful for converting path-based function calls back into actual method calls.
 * 
 * @example
 * ```typescript
 * const obj = {
 *   foo: {
 *     bar: {
 *       baz: (x: number) => x * 2
 *     }
 *   }
 * };
 * 
 * const invoker = makePathInvoker(obj);
 * const result = await invoker('foo.bar.baz', [5]);
 * // result === 10
 * ```
 * 
 * @typeParam T - The type of the target object
 * @param target - The object to create an invoker for
 * @returns A function that can invoke methods on the target object using paths
 */
export function makePathInvoker<T extends object>(
  target: T
): <V>(path: string, args: any[]) => Promise<V> {
  return async <V>(path: string, args: any[]): Promise<V> => {
    const parts = path.split(".");
    let ctx: any = target;

    // Walk to the parent of the final property
    for (let i = 0; i < parts.length - 1; i++) {
      ctx = ctx?.[parts?.[i] ?? 0];
    }

    const fnKey = parts[parts.length - 1];
    const fn = ctx?.[fnKey ?? 0];
    if (typeof fn !== "function") {
      throw new Error(
        `Path "${path}" is not a function on the target object, it's ${typeof fn}; ${JSON.stringify(
          ctx,
          null,
          2
        )}; ${parts.join(".")}`
      );
    }

    // Call with the correct this‑binding and wrap in a Promise
    const result = fn.apply(ctx, args);
    return result instanceof Promise ? result : (result as V | Promise<V>);
  };
}
