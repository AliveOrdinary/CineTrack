'use client';

import { useEffect } from 'react';

export function PerformanceMonitor() {
  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV !== 'production') return;

    // Web Vitals monitoring
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const metric = entry as PerformanceEventTiming;
        
        // Track Core Web Vitals
        switch (metric.name) {
          case 'FCP': // First Contentful Paint
            console.log('FCP:', metric.value);
            break;
          case 'LCP': // Largest Contentful Paint
            console.log('LCP:', metric.value);
            break;
          case 'FID': // First Input Delay
            console.log('FID:', metric.value);
            break;
          case 'CLS': // Cumulative Layout Shift
            console.log('CLS:', metric.value);
            break;
          case 'TTFB': // Time to First Byte
            console.log('TTFB:', metric.value);
            break;
        }

        // Send to analytics if available
        if (typeof window !== 'undefined' && 'gtag' in window) {
          (window as any).gtag('event', metric.name, {
            event_category: 'Web Vitals',
            value: Math.round(metric.value),
            non_interaction: true,
          });
        }
      }
    });

    // Observe various performance metrics
    try {
      observer.observe({ entryTypes: ['navigation', 'measure', 'paint'] });
    } catch (e) {
      // Fallback for browsers that don't support all entry types
      try {
        observer.observe({ entryTypes: ['navigation'] });
      } catch (fallbackError) {
        console.warn('Performance Observer not supported');
      }
    }

    // Monitor resource loading performance
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resource = entry as PerformanceResourceTiming;
        
        // Monitor slow loading resources
        const loadTime = resource.responseEnd - resource.requestStart;
        if (loadTime > 1000) { // Resources taking more than 1 second
          console.warn('Slow resource:', resource.name, `${Math.round(loadTime)}ms`);
        }

        // Monitor TMDB API calls specifically
        if (resource.name.includes('api.themoviedb.org')) {
          console.log('TMDB API call:', resource.name, `${Math.round(loadTime)}ms`);
        }
      }
    });

    try {
      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (e) {
      console.warn('Resource timing not supported');
    }

    // Memory usage monitoring
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
          console.warn('High memory usage detected:', {
            used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
            limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + 'MB',
          });
        }
      };

      const memoryInterval = setInterval(checkMemory, 30000); // Check every 30 seconds

      return () => {
        clearInterval(memoryInterval);
        observer.disconnect();
        resourceObserver.disconnect();
      };
    }

    return () => {
      observer.disconnect();
      resourceObserver.disconnect();
    };
  }, []);

  return null;
}