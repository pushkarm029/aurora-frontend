// Advanced Performance utility functions for Aurora Learning Platform

/**
 * Enhanced lazy loading with IntersectionObserver and performance monitoring
 */
export const createAdvancedLazyLoader = (options = {}) => {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    onLoad = null,
    onError = null,
    enablePerfMonitoring = true,
  } = options;

  const observerOptions = {
    rootMargin,
    threshold,
  };

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const startTime = performance.now();

        img.src = img.dataset.src;
        img.classList.remove('lazy');

        img.addEventListener('load', () => {
          if (enablePerfMonitoring) {
            const loadTime = performance.now() - startTime;
            console.log(`🖼️ Image loaded: ${img.src} (${loadTime.toFixed(2)}ms)`);
          }
          if (onLoad) onLoad(img);
        });

        img.addEventListener('error', () => {
          console.error(`❌ Failed to load image: ${img.dataset.src}`);
          if (onError) onError(img);
        });

        imageObserver.unobserve(img);
      }
    });
  }, observerOptions);

  return {
    observe: (element) => imageObserver.observe(element),
    unobserve: (element) => imageObserver.unobserve(element),
    disconnect: () => imageObserver.disconnect(),
  };
};

/**
 * Smart resource preloading with priority and performance tracking
 */
export const createResourcePreloader = () => {
  const preloadedResources = new Set();
  const loadingResources = new Map();

  const preloadResource = (href, options = {}) => {
    const {
      as = 'script',
      crossorigin = null,
      priority = 'low',
      onLoad = null,
      onError = null,
    } = options;

    if (preloadedResources.has(href)) {
      console.log(`🔄 Resource already preloaded: ${href}`);
      return Promise.resolve();
    }

    if (loadingResources.has(href)) {
      return loadingResources.get(href);
    }

    const startTime = performance.now();
    const link = document.createElement('link');

    const promise = new Promise((resolve, reject) => {
      link.addEventListener('load', () => {
        const loadTime = performance.now() - startTime;
        console.log(`✅ Preloaded: ${href} (${loadTime.toFixed(2)}ms)`);
        preloadedResources.add(href);
        loadingResources.delete(href);
        if (onLoad) onLoad(link);
        resolve(link);
      });

      link.addEventListener('error', () => {
        console.error(`❌ Failed to preload: ${href}`);
        loadingResources.delete(href);
        if (onError) onError(link);
        reject(new Error(`Failed to preload ${href}`));
      });
    });

    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (crossorigin) link.crossOrigin = crossorigin;
    if (priority !== 'low') link.setAttribute('fetchpriority', priority);

    document.head.appendChild(link);
    loadingResources.set(href, promise);

    return promise;
  };

  const prefetchResource = (href, options = {}) => {
    if (preloadedResources.has(href)) return Promise.resolve();

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;

    if (options.crossorigin) link.crossOrigin = options.crossorigin;

    document.head.appendChild(link);
    preloadedResources.add(href);

    console.log(`🔮 Prefetched: ${href}`);
    return Promise.resolve(link);
  };

  return {
    preload: preloadResource,
    prefetch: prefetchResource,
    getPreloadedResources: () => Array.from(preloadedResources),
    clearCache: () => {
      preloadedResources.clear();
      loadingResources.clear();
    },
  };
};

/**
 * Advanced bundle analysis and reporting
 */
export const createBundleAnalyzer = () => {
  const analyzeBundles = () => {
    const resources = performance.getEntriesByType('resource');
    const jsResources = resources.filter(resource =>
      resource.name.includes('.js') || resource.name.includes('.jsx')
    );

    const analysis = {
      totalResources: resources.length,
      jsResources: jsResources.length,
      totalSize: 0,
      jsSize: 0,
      largestResources: [],
      chunkAnalysis: {},
      recommendations: [],
    };

    // Calculate sizes
    resources.forEach(resource => {
      const size = resource.transferSize || 0;
      analysis.totalSize += size;

      if (resource.name.includes('.js')) {
        analysis.jsSize += size;
      }

      if (size > 100000) { // 100KB
        analysis.largestResources.push({
          name: resource.name,
          size: size,
          sizeKB: (size / 1024).toFixed(2),
          duration: resource.duration,
        });
      }
    });

    // Analyze chunks
    jsResources.forEach(resource => {
      const url = new URL(resource.name);
      const filename = url.pathname.split('/').pop();
      const chunkType = determineChunkType(filename);

      if (!analysis.chunkAnalysis[chunkType]) {
        analysis.chunkAnalysis[chunkType] = {
          count: 0,
          totalSize: 0,
          files: [],
        };
      }

      analysis.chunkAnalysis[chunkType].count++;
      analysis.chunkAnalysis[chunkType].totalSize += resource.transferSize || 0;
      analysis.chunkAnalysis[chunkType].files.push(filename);
    });

    // Generate recommendations
    if (analysis.jsSize > 2000000) { // 2MB
      analysis.recommendations.push('Consider further code splitting to reduce initial bundle size');
    }

    if (analysis.largestResources.length > 5) {
      analysis.recommendations.push('Multiple large resources detected - consider lazy loading');
    }

    const vendorChunk = analysis.chunkAnalysis.vendor;
    if (vendorChunk && vendorChunk.totalSize > 1000000) { // 1MB
      analysis.recommendations.push('Vendor chunk is large - consider splitting into smaller chunks');
    }

    return analysis;
  };

  const determineChunkType = (filename) => {
    if (filename.includes('vendor')) return 'vendor';
    if (filename.includes('chunk')) return 'dynamic';
    if (filename.includes('index')) return 'main';
    if (filename.includes('react')) return 'react-vendor';
    if (filename.includes('ui')) return 'ui-vendor';
    if (filename.includes('blockchain')) return 'blockchain-vendor';
    return 'other';
  };

  const generateReport = () => {
    const analysis = analyzeBundles();

    console.group('📊 Bundle Analysis Report');
    console.log(`Total Resources: ${analysis.totalResources}`);
    console.log(`JS Resources: ${analysis.jsResources}`);
    console.log(`Total Size: ${(analysis.totalSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`JS Size: ${(analysis.jsSize / 1024 / 1024).toFixed(2)}MB`);

    if (analysis.largestResources.length > 0) {
      console.group('🏋️ Largest Resources:');
      analysis.largestResources.forEach(resource => {
        console.log(`${resource.name}: ${resource.sizeKB}KB`);
      });
      console.groupEnd();
    }

    console.group('📦 Chunk Analysis:');
    Object.entries(analysis.chunkAnalysis).forEach(([type, data]) => {
      console.log(`${type}: ${data.count} files, ${(data.totalSize / 1024).toFixed(2)}KB`);
    });
    console.groupEnd();

    if (analysis.recommendations.length > 0) {
      console.group('💡 Recommendations:');
      analysis.recommendations.forEach(rec => console.log(`• ${rec}`));
      console.groupEnd();
    }

    console.groupEnd();

    return analysis;
  };

  return {
    analyze: analyzeBundles,
    report: generateReport,
  };
};

/**
 * Performance budget monitoring and alerting
 */
export const createPerformanceBudgetMonitor = (customBudgets = {}) => {
  const defaultBudgets = {
    // Core Web Vitals
    fcp: 1800,      // First Contentful Paint
    lcp: 2500,      // Largest Contentful Paint
    fid: 100,       // First Input Delay
    cls: 0.1,       // Cumulative Layout Shift
    ttfb: 800,      // Time to First Byte

    // Resource budgets
    totalJSSize: 2000000,        // 2MB
    totalCSSSize: 300000,        // 300KB
    totalImageSize: 5000000,     // 5MB
    maxResourceSize: 1000000,    // 1MB per resource
    maxResourceCount: 150,       // Max number of resources

    // Performance budgets
    domInteractive: 3000,        // DOM Interactive
    loadComplete: 5000,          // Load event complete
    memoryUsage: 80,             // Memory usage percentage

    ...customBudgets
  };

  const violations = [];

  const checkBudget = (metricName, value, unit = 'ms') => {
    const budget = defaultBudgets[metricName];
    if (!budget) return true;

    const isWithinBudget = value <= budget;

    if (!isWithinBudget) {
      const violation = {
        metric: metricName,
        value,
        budget,
        unit,
        timestamp: Date.now(),
        severity: calculateSeverity(value, budget),
      };

      violations.push(violation);

      console.warn(
        `🚨 Performance budget violation: ${metricName} = ${value}${unit} (budget: ${budget}${unit})`
      );

      // Trigger alerts for severe violations
      if (violation.severity === 'critical') {
        triggerAlert(violation);
      }
    }

    return isWithinBudget;
  };

  const calculateSeverity = (value, budget) => {
    const ratio = value / budget;
    if (ratio >= 2) return 'critical';
    if (ratio >= 1.5) return 'high';
    if (ratio >= 1.2) return 'medium';
    return 'low';
  };

  const triggerAlert = (violation) => {
    // In a real app, this could send to monitoring service
    console.error(`🚨 CRITICAL PERFORMANCE ISSUE: ${violation.metric}`, violation);

    // Show user notification for critical issues
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Performance Issue Detected', {
        body: `${violation.metric} exceeded budget by ${((violation.value / violation.budget - 1) * 100).toFixed(0)}%`,
        icon: '/aurora-logo.png',
      });
    }
  };

  const getViolationReport = () => {
    const report = {
      totalViolations: violations.length,
      criticalViolations: violations.filter(v => v.severity === 'critical').length,
      highViolations: violations.filter(v => v.severity === 'high').length,
      violations: violations.sort((a, b) => b.timestamp - a.timestamp),
    };

    return report;
  };

  const resetViolations = () => {
    violations.length = 0;
  };

  return {
    check: checkBudget,
    getBudgets: () => ({ ...defaultBudgets }),
    getViolations: getViolationReport,
    reset: resetViolations,
  };
};

/**
 * Advanced virtual scrolling implementation
 */
export const createVirtualScrollController = (options = {}) => {
  const {
    itemHeight = 50,
    containerHeight = 400,
    overscan = 5,
    onScroll = null,
  } = options;

  let scrollTop = 0;
  let isScrolling = false;
  let scrollTimeout = null;

  const calculateVisibleRange = (scrollPosition, totalItems) => {
    const startIndex = Math.floor(scrollPosition / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      totalItems - 1
    );

    return {
      startIndex: Math.max(0, startIndex - overscan),
      endIndex: Math.min(totalItems - 1, endIndex + overscan),
      offsetY: startIndex * itemHeight,
      visibleStartIndex: startIndex,
      visibleEndIndex: endIndex,
    };
  };

  const handleScroll = (event) => {
    scrollTop = event.target.scrollTop;
    isScrolling = true;

    if (onScroll) {
      onScroll(scrollTop, isScrolling);
    }

    // Debounce scroll end detection
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
      if (onScroll) {
        onScroll(scrollTop, isScrolling);
      }
    }, 150);
  };

  const getScrollMetrics = () => ({
    scrollTop,
    isScrolling,
    itemHeight,
    containerHeight,
  });

  return {
    calculateVisibleRange,
    handleScroll,
    getScrollMetrics,
  };
};

/**
 * Advanced caching strategy with performance monitoring
 */
export const createAdvancedCache = (options = {}) => {
  const {
    maxSize = 100,
    ttl = 5 * 60 * 1000, // 5 minutes
    onHit = null,
    onMiss = null,
    enableMetrics = true,
  } = options;

  const cache = new Map();
  const metrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalRequests: 0,
  };

  const set = (key, value, customTTL = ttl) => {
    if (cache.size >= maxSize) {
      // LRU eviction
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
      if (enableMetrics) metrics.evictions++;
    }

    cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: customTTL,
    });
  };

  const get = (key) => {
    if (enableMetrics) metrics.totalRequests++;

    const item = cache.get(key);

    if (!item) {
      if (enableMetrics) metrics.misses++;
      if (onMiss) onMiss(key);
      return null;
    }

    // Check TTL
    if (Date.now() - item.timestamp > item.ttl) {
      cache.delete(key);
      if (enableMetrics) metrics.misses++;
      if (onMiss) onMiss(key);
      return null;
    }

    // Move to end (LRU)
    cache.delete(key);
    cache.set(key, item);

    if (enableMetrics) metrics.hits++;
    if (onHit) onHit(key, item.value);

    return item.value;
  };

  const clear = () => {
    cache.clear();
  };

  const getMetrics = () => ({
    ...metrics,
    hitRate: metrics.totalRequests > 0 ? (metrics.hits / metrics.totalRequests * 100).toFixed(2) : 0,
    size: cache.size,
    maxSize,
  });

  return {
    set,
    get,
    clear,
    getMetrics,
    has: (key) => cache.has(key),
    delete: (key) => cache.delete(key),
  };
};

/**
 * Service worker registration and management
 */
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');

      registration.addEventListener('updatefound', () => {
        console.log('🔄 Service worker update found');
        const newWorker = registration.installing;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('✅ New service worker installed, refresh to update');

            // Show update notification
            if (window.confirm('A new version is available. Refresh to update?')) {
              window.location.reload();
            }
          }
        });
      });

      console.log('✅ Service worker registered');
      return registration;
    } catch (error) {
      console.error('❌ Service worker registration failed:', error);
    }
  }
};

/**
 * Initialize all performance optimizations
 */
export const initializePerformanceOptimizations = () => {
  // Initialize resource preloader
  const preloader = createResourcePreloader();

  // Preload critical resources
  preloader.preload('/fonts/inter-var.woff2', { as: 'font', crossorigin: 'anonymous', priority: 'high' });

  // Initialize bundle analyzer
  const bundleAnalyzer = createBundleAnalyzer();

  // Initialize performance budget monitor
  const budgetMonitor = createPerformanceBudgetMonitor();

  // Register service worker
  registerServiceWorker();

  // Initialize lazy loading for all images
  const lazyLoader = createAdvancedLazyLoader();
  document.querySelectorAll('img[data-src]').forEach(img => {
    lazyLoader.observe(img);
  });

  console.log('🚀 Performance optimizations initialized');

  // Return utilities for external use
  return {
    preloader,
    bundleAnalyzer,
    budgetMonitor,
    lazyLoader,
  };
};

export default {
  createAdvancedLazyLoader,
  createResourcePreloader,
  createBundleAnalyzer,
  createPerformanceBudgetMonitor,
  createVirtualScrollController,
  createAdvancedCache,
  registerServiceWorker,
  initializePerformanceOptimizations,
};