import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Run an async function whenever `deps` change.
 * Ignores results from stale runs (race-safe) and exposes `reload()`.
 */
export function useAsync(fn, deps, { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: enabled });
  const runId = useRef(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(() => {
    if (!enabled) {
      setState({ data: null, error: null, loading: false });
      return;
    }
    const id = ++runId.current;
    setState((s) => ({ data: s.data, error: null, loading: true }));
    Promise.resolve()
      .then(() => fnRef.current())
      .then(
        (data) => id === runId.current && setState({ data, error: null, loading: false }),
        (error) => id === runId.current && setState({ data: null, error, loading: false }),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(() => {
    // Drop data from the previous inputs so the UI never shows mismatched data.
    setState({ data: null, error: null, loading: enabled });
    run();
  }, [run, enabled]);

  return { ...state, reload: run };
}
