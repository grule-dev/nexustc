import { type DependencyList, useEffect, useRef } from "react";

export function useDebounceEffect(
  fn: () => void,
  waitTime: number,
  deps: DependencyList
) {
  // 1. Keep a reference to the latest function
  const fnRef = useRef(fn);

  // 2. Update the ref on every render so it's always fresh
  useEffect(() => {
    fnRef.current = fn;
  }); // No dependency array ensures this runs on every render

  useEffect(() => {
    // 3. The timeout uses the ref, not the closure
    const t = setTimeout(() => {
      fnRef.current();
    }, waitTime);

    return () => {
      clearTimeout(t);
    };
    // biome-ignore lint/correctness/useExhaustiveDependencies: We intentionally defer dependency management to the user
  }, deps);
}
