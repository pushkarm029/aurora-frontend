import { useEffect, useState, useCallback, useRef } from 'react';
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    cls: null,
    fid: null,
    fcp: null,
    lcp: null,
    ttfb: null,
    navigationTiming: null,
    resourceTiming: [],
    memoryUsage: null,
  });

  const [loadTimes, setLoadTimes] = useState({
    domContentLoaded: null,
    loadComplete: null,
    firstPaint: null,
    firstContentfulPaint: null,
    timeToInteractive: null,
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const performanceObserver = useRef(null);
  const navigationStart = useRef(performance.now());

  // Core Web Vitals Collection
  useEffect(() => {
    setIsMonitoring(true);

    // Collect Core Web Vitals
    onCLS((metric) => {
      setMetrics(prev => ({ ...prev, cls: metric.value }));
      reportMetric('CLS', metric.value, metric);
    });

    onFID((metric) => {
      setMetrics(prev => ({ ...prev, fid: metric.value }));
      reportMetric('FID', metric.value, metric);
    });

    onFCP((metric) => {
      setMetrics(prev => ({ ...prev, fcp: metric.value }));
      reportMetric('FCP', metric.value, metric);
    });

    onLCP((metric) => {
      setMetrics(prev => ({ ...prev, lcp: metric.value }));
      reportMetric('LCP', metric.value, metric);
    });

    onTTFB((metric) => {
      setMetrics(prev => ({ ...prev, ttfb: metric.value }));
      reportMetric('TTFB', metric.value, metric);
    });

    // Collect Navigation Timing
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0];

      if (navigation) {
        const timingData = {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          domInteractive: navigation.domInteractive - navigation.navigationStart,
          domComplete: navigation.domComplete - navigation.navigationStart,
          networkLatency: navigation.responseStart - navigation.fetchStart,
          serverResponseTime: navigation.responseEnd - navigation.responseStart,
          domProcessingTime: navigation.domComplete - navigation.responseEnd,
        };

        setMetrics(prev => ({ ...prev, navigationTiming: timingData }));
        setLoadTimes({
          domContentLoaded: timingData.domContentLoaded,
          loadComplete: timingData.loadComplete,
          firstPaint: getFirstPaint(),
          firstContentfulPaint: getFirstContentfulPaint(),
          timeToInteractive: estimateTimeToInteractive(),
        });
      }
    }

    // Monitor Resource Loading
    monitorResourceTiming();

    // Monitor Memory Usage
    monitorMemoryUsage();

    // Monitor Long Tasks
    monitorLongTasks();

    return () => {
      setIsMonitoring(false);
      if (performanceObserver.current) {
        performanceObserver.current.disconnect();
      }
    };
  }, []);

  const reportMetric = useCallback((metricName, value, fullMetric = null) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Performance metric: ${metricName} = ${value}`, fullMetric);
    }

    // Performance budget checking
    const budgets = {
      FCP: 2000,
      LCP: 2500,
      FID: 100,
      CLS: 0.1,
      TTFB: 800,
    };

    const budget = budgets[metricName];
    if (budget && value > budget) {
      console.warn(`⚠️ Performance budget exceeded: ${metricName} = ${value} (budget: ${budget})`);
    }

    // In production, send to analytics
    if (process.env.NODE_ENV === 'production' && window.gtag) {
      window.gtag('event', 'web_vitals', {
        event_category: 'Performance',
        event_label: metricName,
        value: Math.round(value),
        custom_parameter_1: fullMetric?.id,
        custom_parameter_2: fullMetric?.name,
      });
    }
  }, []);

  const getFirstPaint = useCallback(() => {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  }, []);

  const getFirstContentfulPaint = useCallback(() => {
    const paintEntries = performance.getEntriesByType('paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return firstContentfulPaint ? firstContentfulPaint.startTime : null;
  }, []);

  const estimateTimeToInteractive = useCallback(() => {
    // Simplified TTI estimation
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      return navigation.domInteractive - navigation.navigationStart;
    }
    return null;
  }, []);

  const monitorResourceTiming = useCallback(() => {
    const resources = performance.getEntriesByType('resource');
    const resourceData = resources.map(resource => ({
      name: resource.name,
      type: resource.initiatorType,
      duration: resource.duration,
      transferSize: resource.transferSize || 0,
      startTime: resource.startTime,
      isLargeResource: (resource.transferSize || 0) > 100000, // 100KB
    }));

    setMetrics(prev => ({ ...prev, resourceTiming: resourceData }));

    // Report large resources
    resourceData
      .filter(resource => resource.isLargeResource)
      .forEach(resource => {
        console.warn(`📦 Large resource detected: ${resource.name} (${(resource.transferSize / 1024).toFixed(2)}KB)`);
      });
  }, []);

  const monitorMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memoryInfo = {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        usedPercentage: ((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100).toFixed(2),
      };

      setMetrics(prev => ({ ...prev, memoryUsage: memoryInfo }));

      // Warn if memory usage is high
      if (memoryInfo.usedPercentage > 80) {
        console.warn(`🧠 High memory usage: ${memoryInfo.usedPercentage}%`);
      }
    }
  }, []);

  const monitorLongTasks = useCallback(() => {
    if ('PerformanceObserver' in window) {
      try {
        performanceObserver.current = new PerformanceObserver((list) => {
          const longTasks = list.getEntries();
          longTasks.forEach((task) => {
            console.warn(`🐌 Long task detected: ${task.duration.toFixed(2)}ms`, task);
            reportMetric('LongTask', task.duration, task);
          });
        });

        performanceObserver.current.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.warn('Long task monitoring not supported');
      }
    }
  }, [reportMetric]);

  const trackRouteChange = useCallback((routeName) => {
    const startTime = performance.now();
    console.log(`🛣️ Route change started: ${routeName}`);

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`🏁 Route change completed: ${routeName} (${duration.toFixed(2)}ms)`);
      reportMetric(`Route_${routeName}_LoadTime`, duration);
    };
  }, [reportMetric]);

  const trackComponentMount = useCallback((componentName) => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      reportMetric(`Component_${componentName}_MountTime`, duration);
    };
  }, [reportMetric]);

  const trackUserInteraction = useCallback((interactionType, target) => {
    const timestamp = performance.now();
    console.log(`👆 User interaction: ${interactionType} on ${target} at ${timestamp.toFixed(2)}ms`);

    // Track interaction to next frame
    requestAnimationFrame(() => {
      const responseTime = performance.now() - timestamp;
      if (responseTime > 16) { // More than one frame
        console.warn(`⏰ Slow interaction response: ${responseTime.toFixed(2)}ms`);
      }
      reportMetric(`Interaction_${interactionType}_ResponseTime`, responseTime);
    });
  }, [reportMetric]);

  const measureApiCall = useCallback((apiName) => {
    const startTime = performance.now();

    return {
      end: (success = true, statusCode = null) => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        console.log(`🌐 API call: ${apiName} completed in ${duration.toFixed(2)}ms (${success ? 'success' : 'error'})`);
        reportMetric(`API_${apiName}_Duration`, duration, { success, statusCode });
      }
    };
  }, [reportMetric]);

  const getPerformanceSummary = useCallback(() => {
    return {
      coreWebVitals: {
        fcp: metrics.fcp,
        lcp: metrics.lcp,
        fid: metrics.fid,
        cls: metrics.cls,
        ttfb: metrics.ttfb,
      },
      loadTimes: loadTimes,
      resourceCount: metrics.resourceTiming.length,
      largeResourceCount: metrics.resourceTiming.filter(r => r.isLargeResource).length,
      memoryUsage: metrics.memoryUsage,
      isHealthy: isApplicationHealthy(),
    };
  }, [metrics, loadTimes]);

  const isApplicationHealthy = useCallback(() => {
    const issues = [];

    if (metrics.fcp && metrics.fcp > 2000) issues.push('Slow FCP');
    if (metrics.lcp && metrics.lcp > 2500) issues.push('Slow LCP');
    if (metrics.fid && metrics.fid > 100) issues.push('High FID');
    if (metrics.cls && metrics.cls > 0.1) issues.push('High CLS');
    if (metrics.memoryUsage && metrics.memoryUsage.usedPercentage > 80) issues.push('High Memory Usage');

    return {
      healthy: issues.length === 0,
      issues: issues,
      score: Math.max(0, 100 - (issues.length * 20)),
    };
  }, [metrics]);

  const exportMetrics = useCallback(() => {
    const exportData = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: metrics,
      loadTimes: loadTimes,
      summary: getPerformanceSummary(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aurora-performance-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [metrics, loadTimes, getPerformanceSummary]);

  return {
    metrics,
    loadTimes,
    isMonitoring,
    trackRouteChange,
    trackComponentMount,
    trackUserInteraction,
    measureApiCall,
    getPerformanceSummary,
    isApplicationHealthy,
    exportMetrics,
  };
};

export default usePerformanceMonitor;