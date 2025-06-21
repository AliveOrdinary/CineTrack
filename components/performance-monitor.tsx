'use client';

import { useEffect } from 'react';

export function PerformanceMonitor() {
  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV !== 'production') return;

    // Web Vitals monitoring
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        let metricValue = 0;
        
        // Get the appropriate value based on entry type
        if ('value' in entry) {
          metricValue = (entry as any).value;
        } else if ('startTime' in entry) {
          metricValue = entry.startTime;
        } else if ('duration' in entry) {
          metricValue = (entry as any).duration;
        }
        
        // Track Core Web Vitals
        switch (entry.name) {
          case 'first-contentful-paint':
            console.log('FCP:', metricValue);
            break;
          case 'largest-contentful-paint':
            console.log('LCP:', metricValue);
            break;
          case 'first-input-delay':
            console.log('FID:', metricValue);
            break;
          case 'cumulative-layout-shift':
            console.log('CLS:', metricValue);
            break;
        }

        // Send to analytics if available
        if (typeof window !== 'undefined' && 'gtag' in window) {
          (window as any).gtag('event', entry.name, {
            event_category: 'Web Vitals',
            value: Math.round(metricValue),
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