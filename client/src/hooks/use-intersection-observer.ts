import { useCallback, useRef } from 'react';

interface UseIntersectionObserverProps {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  onIntersect: (entry: IntersectionObserverEntry) => void;
}

export function useIntersectionObserver({
  root = null,
  rootMargin = '0px',
  threshold = 0,
  onIntersect,
}: UseIntersectionObserverProps) {
  // Save observer instance to a ref so it doesn't get recreated on re-renders
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Callback to observe elements
  const observeElements = useCallback((elements: Element | NodeListOf<Element>) => {
    // If we already have an observer, disconnect it
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create a new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onIntersect(entry);
          }
        });
      },
      { root, rootMargin, threshold }
    );

    // Start observing each element
    if (elements instanceof Element) {
      observerRef.current.observe(elements);
    } else {
      elements.forEach((element) => {
        observerRef.current?.observe(element);
      });
    }

    // Return a cleanup function
    return () => {
      observerRef.current?.disconnect();
    };
  }, [root, rootMargin, threshold, onIntersect]);

  return { observeElements };
}
