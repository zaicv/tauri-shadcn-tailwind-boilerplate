import { useState, useCallback, useRef, useEffect } from "react";

export function useOptimizedInput(initialValue = "") {
  const [displayValue, setDisplayValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  
  const rafRef = useRef<number>();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleChange = useCallback((newValue: string) => {
    setDisplayValue(newValue);

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(newValue);
      }, 150);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const setValue = useCallback((value: string) => {
    setDisplayValue(value);
    setDebouncedValue(value);
  }, []);

  return {
    value: displayValue,
    debouncedValue,
    onChange: handleChange,
    setValue
  };
}
