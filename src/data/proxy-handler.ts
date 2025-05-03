type CallFn = (path: string, args: any[]) => Promise<unknown>;

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
 * Creates an onCall‑style function that looks up the path on `target`
 * and invokes it with `args`.
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
      throw new Error(`Path "${path}" is not a function on the target object`);
    }

    // Call with the correct this‑binding and wrap in a Promise
    const result = fn.apply(ctx, args);
    return result instanceof Promise ? result : (result as V | Promise<V>);
  };
}
