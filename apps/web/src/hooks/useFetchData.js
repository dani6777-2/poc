import { useState, useCallback, useEffect } from 'react';

export function useFetchData(fetchFn, { immediate = true, deps = [] } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, deps);

  return { data, loading, error, execute, setData };
}

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}


export function useOptimisticMutation(mutationFn, { onSuccess, onError } = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (optimisticValue, { updateState, rollbackValue, ...args } = {}) => {
    setLoading(true);
    setError(null);
    
    if (updateState) {
      updateState(optimisticValue);
    }

    try {
      const result = await mutationFn(args);
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      setError(err);
      if (rollbackValue && updateState) {
        updateState(rollbackValue);
      }
      if (onError) onError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [mutationFn, onSuccess, onError]);

  return { mutate, loading, error };
}


export function useFormPersistence(formId, initialValues = {}) {
  const storageKey = `form_draft_${formId}`;
  
  const saveDraft = useCallback((values) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        values,
        savedAt: new Date().toISOString()
      }));
    } catch (e) {
      console.warn('Failed to save form draft:', e);
    }
  }, [storageKey]);

  const loadDraft = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const { values, savedAt } = JSON.parse(saved);
        const savedDate = new Date(savedAt);
        const now = new Date();
        const hoursDiff = (now - savedDate) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          return values;
        }
      }
    } catch (e) {
      console.warn('Failed to load form draft:', e);
    }
    return null;
  }, [storageKey]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.warn('Failed to clear form draft:', e);
    }
  }, [storageKey]);

  return { saveDraft, loadDraft, clearDraft };
}