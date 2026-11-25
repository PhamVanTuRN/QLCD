"use client";

import { useCallback, useEffect, useState } from "react";

type Loader<T> = (signal: AbortSignal) => Promise<T>;
type Outcome<T> = { data: T; error?: never } | { data?: never; error: unknown };

export function useResource<T>(load: Loader<T>, delay = 0) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<{ load: Loader<T>; version: number; outcome: Outcome<T> }>();
  const reload = useCallback(() => setVersion(current => current + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    const finish = (outcome: Outcome<T>) => {
      if (!controller.signal.aborted) setResult({ load, version, outcome });
    };
    const timer = setTimeout(() => {
      load(controller.signal).then(data => finish({ data }), error => finish({ error }));
    }, delay);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [load, version, delay]);

  const current = result?.load === load && result.version === version ? result.outcome : undefined;
  return { data: current?.data, error: current?.error, loading: !current, reload };
}
