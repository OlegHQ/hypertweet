/**
 * Injection Diagnostics and Debugging Tools
 *
 * Provides comprehensive diagnostic capabilities for troubleshooting
 * injection failures, performance issues, and system health monitoring.
 */

import { DOMUtils } from './domUtils.js';
import {
  type Platform,
  type PlatformDetectionError,
  type SelectorConfig,
  isPlatform,
} from './types.js';

/**
 * Diagnostic test types
 */
export type DiagnosticTest = 
  | 'platform_detection'
  | 'dom_readiness'
  | 'selector_availability'
  | 'element_suitability'
  | 'css_conflicts'
  | 'browser_compatibility'
  | 'permissions'
  | 'network_connectivity'
  | 'performance'
  | 'memory_usage';

/**
 * Diagnostic severity levels
 */
export type DiagnosticSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Diagnostic test result
 */
export interface DiagnosticResult {
  readonly test: DiagnosticTest;
  readonly passed: boolean;
  readonly severity: DiagnosticSeverity;
  readonly message: string;
  readonly details: Record<string, unknown>;
  readonly suggestions: readonly string[];
  readonly timestamp: number;
}

/**
 * System health information
 */
export interface SystemHealth {
  readonly platform: Platform | null;
  readonly url: string;
  readonly userAgent: string;
  readonly viewport: {
    readonly width: number;
    readonly height: number;
  };
  readonly memory: {
    readonly used: number;
    readonly total: number;
  };
  readonly performance: {
    readonly domContentLoaded: number;
    readonly loadComplete: number;
  };
  readonly extensions: readonly string[];
}

/**
 * Element inspection report
 */
export interface ElementInspection {
  readonly selector: string;
  readonly found: boolean;
  readonly element?: HTMLElement;
  readonly computedStyle?: Partial<CSSStyleDeclaration>;
  readonly boundingRect?: DOMRect;
  readonly isVisible: boolean;
  readonly isInteractive: boolean;
  readonly conflicts: readonly string[];
}

/**
 * Comprehensive diagnostic report
 */
export interface DiagnosticReport {
  readonly timestamp: number;
  readonly url: string;
  readonly platform: Platform | null;
  readonly systemHealth: SystemHealth;
  readonly testResults: readonly DiagnosticResult[];
  readonly elementInspections: readonly ElementInspection[];
  readonly recommendations: readonly string[];
  readonly severity: DiagnosticSeverity;
}

/**
 * Injection Diagnostics namespace
 */
export namespace InjectionDiagnostics {
  
  /**
   * Run comprehensive diagnostic tests
   */
  export async function runFullDiagnostics(
    platform?: Platform,
    selectors?: readonly string[]
  ): Promise<DiagnosticReport> {
    const timestamp = Date.now();
    const url = window.location.href;
    const detectedPlatform = platform ?? detectPlatform();
    
    // Run all diagnostic tests
    const testResults = await Promise.all([
      runPlatformDetectionTest(detectedPlatform),
      runDOMReadinessTest(),
      runSelectorAvailabilityTest(selectors ?? getDefaultSelectors(detectedPlatform)),
      runElementSuitabilityTest(selectors ?? getDefaultSelectors(detectedPlatform)),
      runCSSConflictsTest(),
      runBrowserCompatibilityTest(),
      runPermissionsTest(),
      runNetworkConnectivityTest(),
      runPerformanceTest(),
      runMemoryUsageTest(),
    ]);
    
    // Inspect elements if selectors provided
    const elementInspections = selectors ? 
      await inspectElements(selectors) : 
      await inspectElements(getDefaultSelectors(detectedPlatform));
    
    // Generate system health report
    const systemHealth = await getSystemHealth(detectedPlatform);
    
    // Generate recommendations
    const recommendations = generateRecommendations(testResults, elementInspections);
    
    // Calculate overall severity
    const severity = calculateOverallSeverity(testResults);
    
    return {
      timestamp,
      url,
      platform: detectedPlatform,
      systemHealth,
      testResults,
      elementInspections,
      recommendations,
      severity,
    };
  }

  /**
   * Run a specific diagnostic test
   */
  export async function runTest(test: DiagnosticTest): Promise<DiagnosticResult> {
    switch (test) {
      case 'platform_detection':
        return await runPlatformDetectionTest();
      case 'dom_readiness':
        return await runDOMReadinessTest();
      case 'selector_availability':
        return await runSelectorAvailabilityTest([]);
      case 'element_suitability':
        return await runElementSuitabilityTest([]);
      case 'css_conflicts':
        return await runCSSConflictsTest();
      case 'browser_compatibility':
        return await runBrowserCompatibilityTest();
      case 'permissions':
        return await runPermissionsTest();
      case 'network_connectivity':
        return await runNetworkConnectivityTest();
      case 'performance':
        return await runPerformanceTest();
      case 'memory_usage':
        return await runMemoryUsageTest();
      default:
        throw new Error(`Unknown diagnostic test: ${test}`);
    }
  }

  /**
   * Export diagnostic report as JSON
   */
  export function exportReport(report: DiagnosticReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Create a user-friendly diagnostic summary
   */
  export function createSummary(report: DiagnosticReport): string {
    const { testResults, severity, recommendations } = report;
    const passed = testResults.filter(r => r.passed).length;
    const total = testResults.length;
    
    let summary = `🔍 Injection Diagnostics Summary\n\n`;
    summary += `Platform: ${report.platform ?? 'Unknown'}\n`;
    summary += `URL: ${report.url}\n`;
    summary += `Tests Passed: ${passed}/${total}\n`;
    summary += `Overall Status: ${severity.toUpperCase()}\n\n`;
    
    if (testResults.some(r => !r.passed)) {
      summary += `❌ Failed Tests:\n`;
      testResults
        .filter(r => !r.passed)
        .forEach(r => {
          summary += `- ${r.test}: ${r.message}\n`;
        });
      summary += '\n';
    }
    
    if (recommendations.length > 0) {
      summary += `💡 Recommendations:\n`;
      recommendations.forEach(rec => {
        summary += `- ${rec}\n`;
      });
    }
    
    return summary;
  }

  /**
   * Test: Platform Detection
   */
  async function runPlatformDetectionTest(expectedPlatform?: Platform | null): Promise<DiagnosticResult> {
    await Promise.resolve(); // Ensure function is properly async
    const detected = detectPlatform();
    const passed = detected !== null;
    
    return {
      test: 'platform_detection',
      passed,
      severity: passed ? 'info' : 'error',
      message: passed 
        ? `Platform detected: ${detected}`
        : 'Unable to detect platform',
      details: {
        detected,
        expected: expectedPlatform,
        url: window.location.href,
        hostname: window.location.hostname,
      },
      suggestions: passed 
        ? []
        : [
            'Check if the URL matches supported platform patterns',
            'Verify you are on a supported social media platform',
            'Try refreshing the page',
          ],
      timestamp: Date.now(),
    };
  }

  /**
   * Test: DOM Readiness
   */
  async function runDOMReadinessTest(): Promise<DiagnosticResult> {
    await Promise.resolve(); // Ensure function is properly async
    const readyState = document.readyState;
    const passed = readyState === 'complete';
    
    return {
      test: 'dom_readiness',
      passed,
      severity: passed ? 'info' : 'warning',
      message: `DOM ready state: ${readyState}`,
      details: {
        readyState,
        documentLoaded: document.readyState === 'complete',
        windowLoaded: document.readyState === 'complete',
      },
      suggestions: passed 
        ? []
        : [
            'Wait for the page to fully load',
            'Check if the page is still loading content',
            'Try again after page load completes',
          ],
      timestamp: Date.now(),
    };
  }

  /**
   * Test: Selector Availability
   */
  async function runSelectorAvailabilityTest(selectors: readonly string[]): Promise<DiagnosticResult> {
    await Promise.resolve(); // Ensure function is properly async
    const results = selectors.map(selector => ({
      selector,
      found: document.querySelector(selector) !== null,
    }));
    
    const found = results.filter(r => r.found).length;
    const passed = found > 0;
    
    return {
      test: 'selector_availability',
      passed,
      severity: passed ? 'info' : 'error',
      message: `Found ${found}/${selectors.length} selectors`,
      details: {
        selectors: results,
        totalSelectors: selectors.length,
        foundSelectors: found,
      },
      suggestions: passed 
        ? []
        : [
            'Check if the page structure has changed',
            'Try alternative selectors',
            'Wait for dynamic content to load',
            'Check if you are on the correct page type',
          ],
      timestamp: Date.now(),
    };
  }

  /**
   * Test: Element Suitability
   */
  async function runElementSuitabilityTest(selectors: readonly string[]): Promise<DiagnosticResult> {
    await Promise.resolve(); // Ensure function is properly async
    const elements = selectors
      .map(selector => document.querySelector(selector) as HTMLElement)
      .filter(Boolean);
    
    const suitable = elements.filter(el => isElementSuitableForInjection(el));
    const passed = suitable.length > 0;
    
    return {
      test: 'element_suitability',
      passed,
      severity: passed ? 'info' : 'warning',
      message: `${suitable.length}/${elements.length} elements are suitable`,
      details: {
        totalElements: elements.length,
        suitableElements: suitable.length,
        issues: elements.map(el => ({
          tagName: el.tagName,
          suitable: isElementSuitableForInjection(el),
          visible: DOMUtils.isElementVisible(el),
          interactive: isElementInteractive(el),
        })),
      },
      suggestions: passed 
        ? []
        : [
            'Check if elements are visible',
            'Verify elements are interactive',
            'Look for elements that might be overlapped',
            'Check if elements have appropriate sizes',
          ],
      timestamp: Date.now(),
    };
  }

  /**
   * Test: CSS Conflicts
   */
  async function runCSSConflictsTest(): Promise<DiagnosticResult> {
    await Promise.resolve(); // Ensure function is properly async
    const conflicts = detectCSSConflicts();
    const passed = conflicts.length === 0;
    
    return {
      test: 'css_conflicts',
      passed,
      severity: passed ? 'info' : 'warning',
      message: `Found ${conflicts.length} potential CSS conflicts`,
      details: {
        conflicts,
        affectedSelectors: conflicts.map(c => c.selector),
      },
      suggestions: passed 
        ? []
        : [
            'Check for z-index conflicts',
            'Look for CSS rules that might interfere',
            'Consider using more specific CSS selectors',
            'Review third-party CSS that might conflict',
          ],
      timestamp: Date.now(),
    };
  }

  /**
   * Test: Browser Compatibility
   */
  async function runBrowserCompatibilityTest(): Promise<DiagnosticResult> {
    await Promise.resolve(); // Ensure function is properly async
    const compatibility = checkBrowserCompatibility();
    const passed = compatibility.score >= 0.8; // 80% compatible
    
    return {
      test: 'browser_compatibility',
      passed,
      severity: passed ? 'info' : 'warning',
      message: `Browser compatibility: ${Math.round(compatibility.score * 100)}%`,
      details: {
        ...compatibility,
        userAgent: navigator.userAgent,
      },
      suggestions: passed 
        ? []
        : [
            'Consider updating your browser',
            'Enable JavaScript if disabled',
            'Check browser extension conflicts',
            'Try in an incognito/private window',
          ],
      timestamp: Date.now(),
    };
  }

  /**
   * Test: Permissions
   */
  async function runPermissionsTest(): Promise<DiagnosticResult> {
    await Promise.resolve(); // Ensure function is properly async
    // Check for extension permissions and content script access
    const hasAccess = typeof chrome !== 'undefined' && chrome.runtime;
    const canAccessDOM = document.querySelector !== undefined;
    const canCreateElements = (() => {
      try {
        document.createElement('div');
        return true;
      } catch {
        return false;
      }
    })();
    
    const passed = hasAccess && canAccessDOM && canCreateElements;
    
    return {
      test: 'permissions',
      passed,
      severity: passed ? 'info' : 'critical',
      message: passed ? 'All permissions available' : 'Missing required permissions',
      details: {
        hasExtensionAccess: hasAccess,
        canAccessDOM,
        canCreateElements,
        origin: window.location.origin,
      },
      suggestions: passed 
        ? []
        : [
            'Check extension permissions in browser settings',
            'Ensure the extension is enabled for this site',
            'Try reloading the page',
            'Check if content scripts are blocked',
          ],
      timestamp: Date.now(),
    };
  }

  /**
   * Test: Network Connectivity
   */
  async function runNetworkConnectivityTest(): Promise<DiagnosticResult> {
    const online = navigator.onLine;
    let responseTime = 0;
    
    try {
      const start = Date.now();
      await fetch(window.location.origin, { 
        method: 'HEAD',
        cache: 'no-cache',
      });
      responseTime = Date.now() - start;
    } catch {
      // Ignore fetch errors for this test
    }
    
    const passed = online && responseTime < 5000;
    
    return {
      test: 'network_connectivity',
      passed,
      severity: passed ? 'info' : 'warning',
      message: online 
        ? `Network online, response time: ${responseTime}ms`
        : 'Network appears offline',
      details: {
        online,
        responseTime,
        connection: (navigator as any).connection,
      },
      suggestions: passed 
        ? []
        : [
            'Check your internet connection',
            'Try refreshing the page',
            'Check if the site is accessible',
            'Consider offline functionality',
          ],
      timestamp: Date.now(),
    };
  }

  /**
   * Test: Performance
   */
  async function runPerformanceTest(): Promise<DiagnosticResult> {
    await Promise.resolve(); // Ensure function is properly async
    const timing = performance.timing;
    const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
    const loadComplete = timing.loadEventEnd - timing.navigationStart;
    
    const passed = domContentLoaded < 5000 && loadComplete < 10000;
    
    return {
      test: 'performance',
      passed,
      severity: passed ? 'info' : 'warning',
      message: `Page load: DOM ${domContentLoaded}ms, Complete ${loadComplete}ms`,
      details: {
        domContentLoaded,
        loadComplete,
        timing: {
          domContentLoaded,
          loadComplete,
          firstPaint: (performance as any).getEntriesByType?.('paint')?.[0]?.startTime ?? 0,
        },
      },
      suggestions: passed 
        ? []
        : [
            'Page is loading slowly, which may affect injection',
            'Consider waiting for better network conditions',
            'Check for performance bottlenecks',
            'Try disabling other extensions temporarily',
          ],
      timestamp: Date.now(),
    };
  }

  /**
   * Test: Memory Usage
   */
  async function runMemoryUsageTest(): Promise<DiagnosticResult> {
    await Promise.resolve(); // Ensure function is properly async
    const memory = (performance as any).memory;
    const hasMemoryInfo = !!memory;
    
    let passed = true;
    let memoryDetails = {};
    
    if (hasMemoryInfo) {
      const usedRatio = memory.usedJSHeapSize / memory.totalJSHeapSize;
      passed = usedRatio < 0.9; // Less than 90% memory usage
      
      memoryDetails = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        usagePercent: Math.round(usedRatio * 100),
      };
    }
    
    return {
      test: 'memory_usage',
      passed,
      severity: passed ? 'info' : 'warning',
      message: hasMemoryInfo 
        ? `Memory usage: ${Math.round(((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100))}%`
        : 'Memory info not available',
      details: {
        available: hasMemoryInfo,
        ...memoryDetails,
      },
      suggestions: passed 
        ? []
        : [
            'High memory usage detected',
            'Consider closing other tabs',
            'Refresh the page to free memory',
            'Check for memory leaks in other extensions',
          ],
      timestamp: Date.now(),
    };
  }

  /**
   * Helper functions
   */

  function detectPlatform(): Platform | null {
    const hostname = window.location.hostname.toLowerCase();
    
    if (hostname.includes('twitter') || hostname.includes('x.com')) {
      return 'twitter';
    }
    if (hostname.includes('linkedin')) {
      return 'linkedin';
    }
    if (hostname.includes('reddit')) {
      return 'reddit';
    }
    
    return null;
  }

  function getDefaultSelectors(platform: Platform | null): readonly string[] {
    if (!platform) return [];
    
    const selectors: Record<Platform, readonly string[]> = {
      twitter: ['[data-testid="tweetTextarea_0"]', '[role="textbox"]'],
      linkedin: ['.ql-editor', '[role="textbox"]'],
      reddit: ['[data-testid="comment-input"]', 'textarea'],
    };
    
    return selectors[platform] ?? [];
  }

  async function inspectElements(selectors: readonly string[]): Promise<readonly ElementInspection[]> {
    await Promise.resolve(); // Ensure function is properly async
    return selectors.map(selector => {
      const element = document.querySelector(selector) as HTMLElement;
      
      if (!element) {
        return {
          selector,
          found: false,
          isVisible: false,
          isInteractive: false,
          conflicts: [],
        };
      }
      
      const computedStyle = window.getComputedStyle(element);
      const boundingRect = element.getBoundingClientRect();
      
      return {
        selector,
        found: true,
        element,
        computedStyle: {
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          position: computedStyle.position,
          zIndex: computedStyle.zIndex,
        },
        boundingRect,
        isVisible: DOMUtils.isElementVisible(element),
        isInteractive: isElementInteractive(element),
        conflicts: detectElementConflicts(element),
      };
    });
  }

  async function getSystemHealth(platform: Platform | null): Promise<SystemHealth> {
    await Promise.resolve(); // Ensure function is properly async
    const memory = (performance as any).memory;
    
    return {
      platform,
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      memory: {
        used: memory?.usedJSHeapSize ?? 0,
        total: memory?.totalJSHeapSize ?? 0,
      },
      performance: {
        domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
        loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart,
      },
      extensions: [], // Would need additional logic to detect other extensions
    };
  }

  function generateRecommendations(
    testResults: readonly DiagnosticResult[],
    elementInspections: readonly ElementInspection[]
  ): readonly string[] {
    const recommendations: string[] = [];
    
    const failedTests = testResults.filter(r => !r.passed);
    
    if (failedTests.some(t => t.test === 'platform_detection')) {
      recommendations.push('Ensure you are on a supported platform (Twitter, LinkedIn, or Reddit)');
    }
    
    if (failedTests.some(t => t.test === 'selector_availability')) {
      recommendations.push('Page structure may have changed - try alternative selectors');
    }
    
    if (failedTests.some(t => t.test === 'element_suitability')) {
      recommendations.push('Target elements may not be suitable for injection');
    }
    
    if (failedTests.some(t => t.test === 'permissions')) {
      recommendations.push('Check browser extension permissions and settings');
    }
    
    if (!elementInspections.some(e => e.found)) {
      recommendations.push('No suitable injection targets found - consider fallback strategies');
    }
    
    return recommendations;
  }

  function calculateOverallSeverity(testResults: readonly DiagnosticResult[]): DiagnosticSeverity {
    const severities = testResults.map(r => r.severity);
    
    if (severities.includes('critical')) return 'critical';
    if (severities.includes('error')) return 'error';
    if (severities.includes('warning')) return 'warning';
    return 'info';
  }

  function isElementSuitableForInjection(element: HTMLElement): boolean {
    // Check if element is visible
    if (!DOMUtils.isElementVisible(element)) {
      return false;
    }

    // Check if element is safe to modify
    if (!DOMUtils.isElementSafeToModify(element)) {
      return false;
    }

    // Check minimum size requirements
    const rect = element.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) {
      return false;
    }

    // Check if element is interactive
    if (!isElementInteractive(element)) {
      return false;
    }

    return true;
  }

  function isElementInteractive(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    const isDisabled = 'disabled' in element && (element as HTMLInputElement).disabled;
    return style.pointerEvents !== 'none' && 
           !isDisabled &&
           element.tabIndex >= -1;
  }

  function detectCSSConflicts(): Array<{ selector: string; issue: string }> {
    // This would need more sophisticated CSS conflict detection
    // For now, return empty array
    return [];
  }

  function detectElementConflicts(element: HTMLElement): readonly string[] {
    const conflicts: string[] = [];
    
    const style = window.getComputedStyle(element);
    if (style.position === 'fixed' && parseInt(style.zIndex) > 9999) {
      conflicts.push('High z-index may cause stacking conflicts');
    }
    
    if (style.pointerEvents === 'none') {
      conflicts.push('Element has pointer-events: none');
    }
    
    return conflicts;
  }

  function checkBrowserCompatibility(): { score: number; issues: readonly string[] } {
    const issues: string[] = [];
    let score = 1.0;
    
    if (!window.MutationObserver) {
      issues.push('MutationObserver not supported');
      score -= 0.3;
    }
    
    if (!document.querySelector) {
      issues.push('querySelector not supported');
      score -= 0.3;
    }
    
    if (!Array.from) {
      issues.push('Array.from not supported');
      score -= 0.1;
    }
    
    if (!window.fetch) {
      issues.push('Fetch API not supported');
      score -= 0.1;
    }
    
    return {
      score: Math.max(0, score),
      issues,
    };
  }
}