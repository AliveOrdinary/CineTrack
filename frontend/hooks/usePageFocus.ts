import { useState, useEffect } from 'react';

/**
 * Custom hook to track whether the browser tab/window currently has focus.
 * @returns boolean indicating if the page is focused.
 */
export function usePageFocus(): boolean {
  const [isFocused, setIsFocused] = useState(true); // Assume focused initially

  useEffect(() => {
    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    // Check for document visibility API support
    let hidden: string | undefined;
    let visibilityChange: string | undefined;
    if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
      hidden = "hidden";
      visibilityChange = "visibilitychange";
    // @ts-ignore - Checking for prefixed versions
    } else if (typeof document.msHidden !== "undefined") {
      hidden = "msHidden";
      visibilityChange = "msvisibilitychange";
    // @ts-ignore
    } else if (typeof document.webkitHidden !== "undefined") {
      hidden = "webkitHidden";
      visibilityChange = "webkitvisibilitychange";
    }

    const handleVisibilityChange = () => {
       // @ts-ignore - Using potentially prefixed property
      if (document[hidden]) {
        setIsFocused(false);
      } else {
        setIsFocused(true);
      }
    };

    // Set initial state
    // @ts-ignore
    setIsFocused(!document[hidden]);

    // Listen to visibility change
    if (visibilityChange) {
      document.addEventListener(visibilityChange, handleVisibilityChange, false);
    } else {
        // Fallback for older browsers: use focus/blur
        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);
    }

    // Cleanup
    return () => {
      if (visibilityChange) {
          document.removeEventListener(visibilityChange, handleVisibilityChange);
      } else {
          window.removeEventListener('focus', handleFocus);
          window.removeEventListener('blur', handleBlur);
      }
    };
  }, []);

  return isFocused;
} 