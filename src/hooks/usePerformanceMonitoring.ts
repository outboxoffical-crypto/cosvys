import { useEffect } from 'react';

interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  cls?: number; // Cumulative Layout Shift
  fid?: number; // First Input Delay (deprecated, use INP)
  inp?: number; // Interaction to Next Paint
  ttfb?: number; // Time to First Byte
  navigationTiming?: number; // Time from navigation start to full load
}

export const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Monitor Core Web Vitals
    if ('web-vital' in window) {
      try {
        // Use sendBeacon for performance data (low overhead)
        const sendMetric = (metric: any) => {
          const data = JSON.stringify({
            name: metric.name,
            value: metric.value,
            url: window.location.href,
            timestamp: new Date().toISOString(),
          });

          // Only send if in production and not too many requests
          if (import.meta.env.PROD) {
            navigator.sendBeacon('/api/metrics', data);
          }
        };

        // Monitor performance entries
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            sendMetric(entry);
          }
        });

        observer.observe({
          entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift', 'first-input', 'navigation'],
        });

        return () => observer.disconnect();
      } catch (error) {
        console.error('Performance monitoring error:', error);
      }
    }

    // Measure navigation timing
    window.addEventListener('load', () => {
      const perfData = window.performance.timing;
      const navigationTime = perfData.loadEventEnd - perfData.navigationStart;

      if (import.meta.env.DEV) {
        console.log(`Page load time: ${navigationTime}ms`);
      }
    });
  }, []);
};

