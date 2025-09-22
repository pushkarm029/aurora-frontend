import { useEffect } from 'react';
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor';
import { initializePerformanceOptimizations } from '@/lib/performance-utils';

const PerformanceReporter = () => {
  const {
    metrics,
    trackRouteChange,
    getPerformanceSummary,
    isApplicationHealthy,
    exportMetrics,
  } = usePerformanceMonitor();

  useEffect(() => {
    // Initialize all performance optimizations
    const optimizations = initializePerformanceOptimizations();

    // Clean up loading state
    document.body.classList.remove('loading');

    // Set up global performance tracking
    window.auroraPerformance = {
      trackRouteChange,
      getPerformanceSummary,
      isApplicationHealthy,
      exportMetrics,
      bundleAnalyzer: optimizations.bundleAnalyzer,
      budgetMonitor: optimizations.budgetMonitor,
    };

    // Report initial metrics after component mounts
    const timer = setTimeout(() => {
      const summary = getPerformanceSummary();
      const health = isApplicationHealthy();

      console.group('🎯 Aurora Performance Report');
      console.log('Core Web Vitals:', summary.coreWebVitals);
      console.log('Load Times:', summary.loadTimes);
      console.log('Resource Count:', summary.resourceCount);
      console.log('Application Health:', health);
      console.groupEnd();

      // Generate bundle analysis report
      optimizations.bundleAnalyzer.report();

      // Check performance budgets
      if (metrics.fcp) optimizations.budgetMonitor.check('fcp', metrics.fcp);
      if (metrics.lcp) optimizations.budgetMonitor.check('lcp', metrics.lcp);
      if (metrics.fid) optimizations.budgetMonitor.check('fid', metrics.fid);
      if (metrics.cls) optimizations.budgetMonitor.check('cls', metrics.cls);

      // Report to service worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'PERFORMANCE_METRICS',
          metrics: summary,
        });
      }
    }, 5000);

    return () => {
      clearTimeout(timer);
      // Clean up optimizations if needed
      optimizations.lazyLoader.disconnect();
    };
  }, [metrics, trackRouteChange, getPerformanceSummary, isApplicationHealthy, exportMetrics]);

  // This component doesn't render anything visible
  return null;
};

// Export performance utilities for global access
export const getGlobalPerformanceData = () => {
  return window.auroraPerformance || {};
};

export default PerformanceReporter;