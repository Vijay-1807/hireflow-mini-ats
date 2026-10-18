import { useCallback, useEffect, useRef, useState } from 'react';
import { candidatesApi, metricsApi } from '../api/client';

export function useAsync(fn, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const mounted = useRef(true);
  const reqId = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const execute = useCallback(async (...args) => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fn(...args);
      if (mounted.current && id === reqId.current) setData(result);
      return result;
    } catch (err) {
      if (mounted.current && id === reqId.current) setError(err);
      throw err;
    } finally {
      if (mounted.current && id === reqId.current) setLoading(false);
    }
  }, deps);

  useEffect(() => {
    if (immediate) execute().catch(() => {});
  }, [execute, immediate]);

  return { data, loading, error, execute, setData };
}

export function useMetrics() {
  return useAsync(() => metricsApi.get(), []);
}

export function useCandidateList(params) {
  const key = JSON.stringify(params);
  return useAsync(() => candidatesApi.list(params), [key]);
}

export function useFilterOptions() {
  return useAsync(() => candidatesApi.filterOptions(), []);
}

export function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
