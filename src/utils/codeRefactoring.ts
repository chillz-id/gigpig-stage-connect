// Code Refactoring Utilities - Automated code optimization and refactoring helpers
import { performanceService } from '@/services/performanceService';
import { errorService } from '@/services/errorService';

export interface RefactoringRule {
  name: string;
  description: string;
  category: 'performance' | 'maintainability' | 'security' | 'accessibility' | 'best-practices';
  severity: 'info' | 'warning' | 'error';
  check: (code: string) => boolean;
  fix?: (code: string) => string;
  suggestion: string;
}

export interface RefactoringResult {
  file: string;
  issues: Array<{
    rule: string;
    line: number;
    column: number;
    message: string;
    severity: 'info' | 'warning' | 'error';
    fixable: boolean;
  }>;
  suggestions: string[];
  metrics: {
    complexity: number;
    maintainability: number;
    performance: number;
    security: number;
  };
}

class CodeRefactoringService {
  private rules: RefactoringRule[] = [];

  constructor() {
    this.initializeRules();
  }

  private initializeRules(): void {
    // Performance Rules
    this.rules.push({
      name: 'avoid-inline-styles',
      description: 'Avoid inline styles for better performance',
      category: 'performance',
      severity: 'warning',
      check: (code) => /style\s*=\s*\{/.test(code),
      suggestion: 'Use CSS classes or styled-components instead of inline styles'
    });

    this.rules.push({
      name: 'use-react-memo',
      description: 'Consider using React.memo for expensive components',
      category: 'performance',
      severity: 'info',
      check: (code) => {
        const hasExpensiveOperations = /map\(|filter\(|reduce\(/.test(code);
        const hasReactMemo = /React\.memo|memo\(/.test(code);
        return hasExpensiveOperations && !hasReactMemo;
      },
      suggestion: 'Wrap component with React.memo to prevent unnecessary re-renders'
    });

    this.rules.push({
      name: 'optimize-images',
      description: 'Use optimized image formats and lazy loading',
      category: 'performance',
      severity: 'warning',
      check: (code) => /<img[^>]*src=/.test(code) && !/loading="lazy"/.test(code),
      suggestion: 'Add loading="lazy" to images and use WebP format when possible'
    });

    // Maintainability Rules
    this.rules.push({
      name: 'avoid-long-functions',
      description: 'Functions should be shorter than 50 lines',
      category: 'maintainability',
      severity: 'warning',
      check: (code) => {
        const functionMatches = code.match(/function[^{]*{[^}]*}/gs) || [];
        return functionMatches.some(fn => fn.split('\n').length > 50);
      },
      suggestion: 'Break down large functions into smaller, more focused functions'
    });

    this.rules.push({
      name: 'use-typescript-strict',
      description: 'Use strict TypeScript types',
      category: 'maintainability',
      severity: 'error',
      check: (code) => /:\s*any[\s;,\)]/.test(code),
      suggestion: 'Replace "any" types with specific TypeScript types'
    });

    this.rules.push({
      name: 'consistent-naming',
      description: 'Use consistent naming conventions',
      category: 'maintainability',
      severity: 'warning',
      check: (code) => {
        const variableNames = code.match(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g) || [];
        return variableNames.some(name => /[A-Z]/.test(name) && !/^[A-Z][A-Z0-9_]*$/.test(name));
      },
      suggestion: 'Use camelCase for variables and PascalCase for components'
    });

    // Security Rules
    this.rules.push({
      name: 'avoid-dangerously-set-html',
      description: 'Avoid dangerouslySetInnerHTML to prevent XSS',
      category: 'security',
      severity: 'error',
      check: (code) => /dangerouslySetInnerHTML/.test(code),
      suggestion: 'Use safe DOM manipulation or sanitize HTML content'
    });

    this.rules.push({
      name: 'validate-user-input',
      description: 'Validate all user inputs',
      category: 'security',
      severity: 'error',
      check: (code) => {
        const hasInputElements = /<input|<textarea|<select/.test(code);
        const hasValidation = /required|pattern|minLength|maxLength|validation/.test(code);
        return hasInputElements && !hasValidation;
      },
      suggestion: 'Add validation to all user input fields'
    });

    // Accessibility Rules
    this.rules.push({
      name: 'missing-alt-text',
      description: 'Images should have alt text',
      category: 'accessibility',
      severity: 'error',
      check: (code) => /<img(?![^>]*alt=)/.test(code),
      suggestion: 'Add descriptive alt text to all images'
    });

    this.rules.push({
      name: 'missing-aria-labels',
      description: 'Interactive elements should have proper ARIA labels',
      category: 'accessibility',
      severity: 'warning',
      check: (code) => {
        const hasButtons = /<button|<input[^>]*type="button"/.test(code);
        const hasAriaLabel = /aria-label|aria-labelledby/.test(code);
        return hasButtons && !hasAriaLabel;
      },
      suggestion: 'Add aria-label or aria-labelledby to interactive elements'
    });

    // Best Practices Rules
    this.rules.push({
      name: 'use-error-boundaries',
      description: 'Wrap components in error boundaries',
      category: 'best-practices',
      severity: 'warning',
      check: (code) => {
        const hasAsyncOperations = /useEffect|fetch|axios|api/.test(code);
        const hasErrorBoundary = /ErrorBoundary|componentDidCatch/.test(code);
        return hasAsyncOperations && !hasErrorBoundary;
      },
      suggestion: 'Wrap components with async operations in error boundaries'
    });

    this.rules.push({
      name: 'handle-loading-states',
      description: 'Handle loading and error states',
      category: 'best-practices',
      severity: 'warning',
      check: (code) => {
        const hasAsyncCalls = /useQuery|useMutation|fetch|axios/.test(code);
        const hasLoadingState = /isLoading|loading|pending/.test(code);
        return hasAsyncCalls && !hasLoadingState;
      },
      suggestion: 'Add loading and error state handling for async operations'
    });
  }

  // =====================================
  // CODE ANALYSIS
  // =====================================

  analyzeCode(code: string, filename: string): RefactoringResult {
    const issues: RefactoringResult['issues'] = [];
    const suggestions: string[] = [];
    const lines = code.split('\n');

    // Check each rule
    this.rules.forEach(rule => {
      if (rule.check(code)) {
        // Find line number (simplified - could be more accurate)
        const lineIndex = lines.findIndex(line => 
          rule.name === 'avoid-inline-styles' ? /style\s*=\s*\{/.test(line) :
          rule.name === 'missing-alt-text' ? /<img(?![^>]*alt=)/.test(line) :
          rule.name === 'avoid-dangerously-set-html' ? /dangerouslySetInnerHTML/.test(line) :
          false
        );

        issues.push({
          rule: rule.name,
          line: Math.max(0, lineIndex),
          column: 0,
          message: rule.description,
          severity: rule.severity,
          fixable: !!rule.fix
        });

        suggestions.push(rule.suggestion);
      }
    });

    // Calculate metrics
    const metrics = this.calculateMetrics(code);

    return {
      file: filename,
      issues,
      suggestions: [...new Set(suggestions)], // Remove duplicates
      metrics
    };
  }

  private calculateMetrics(code: string): RefactoringResult['metrics'] {
    const lines = code.split('\n').filter(line => line.trim());
    const codeLines = lines.filter(line => !line.trim().startsWith('//') && !line.trim().startsWith('/*'));
    
    // Cyclomatic Complexity (simplified)
    const complexityKeywords = /if|else|while|for|switch|case|catch|\?|&&|\|\|/g;
    const complexityMatches = code.match(complexityKeywords) || [];
    const complexity = Math.min(100, Math.max(0, 100 - complexityMatches.length * 2));

    // Maintainability (based on various factors)
    const longLines = codeLines.filter(line => line.length > 120).length;
    const functionCount = (code.match(/function|=>/g) || []).length;
    const variableCount = (code.match(/(?:const|let|var)\s+/g) || []).length;
    const maintainability = Math.min(100, Math.max(0, 
      100 - (longLines * 5) - (functionCount > 10 ? 10 : 0) - (variableCount > 20 ? 10 : 0)
    ));

    // Performance Score (based on performance rules)
    const performanceIssues = this.rules
      .filter(rule => rule.category === 'performance')
      .filter(rule => rule.check(code)).length;
    const performance = Math.min(100, Math.max(0, 100 - performanceIssues * 15));

    // Security Score (based on security rules)
    const securityIssues = this.rules
      .filter(rule => rule.category === 'security')
      .filter(rule => rule.check(code)).length;
    const security = Math.min(100, Math.max(0, 100 - securityIssues * 25));

    return {
      complexity,
      maintainability,
      performance,
      security
    };
  }

  // =====================================
  // AUTOMATED FIXES
  // =====================================

  applyFixes(code: string): string {
    let fixedCode = code;

    this.rules.forEach(rule => {
      if (rule.fix && rule.check(fixedCode)) {
        try {
          fixedCode = rule.fix(fixedCode);
        } catch (error) {
          console.warn(`Failed to apply fix for rule ${rule.name}:`, error);
        }
      }
    });

    return fixedCode;
  }

  // =====================================
  // COMPONENT OPTIMIZATION
  // =====================================

  optimizeComponent(componentCode: string): {
    optimizedCode: string;
    optimizations: string[];
  } {
    const optimizations: string[] = [];
    let optimizedCode = componentCode;

    // Add React.memo if not present and component has props
    if (/interface.*Props/.test(componentCode) && !/React\.memo|memo\(/.test(componentCode)) {
      optimizedCode = optimizedCode.replace(
        /export default (\w+);$/,
        'export default React.memo($1);'
      );
      optimizations.push('Added React.memo for performance optimization');
    }

    // Optimize event handlers with useCallback
    const eventHandlerRegex = /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*{/g;
    let match;
    while ((match = eventHandlerRegex.exec(optimizedCode)) !== null) {
      const handlerName = match[1];
      if (handlerName.startsWith('handle') && !/useCallback/.test(match[0])) {
        optimizedCode = optimizedCode.replace(
          match[0],
          `const ${handlerName} = useCallback(${match[0].slice(match[0].indexOf('('))}`
        );
        optimizations.push(`Wrapped ${handlerName} with useCallback`);
      }
    }

    // Add error boundary wrapper suggestion
    if (/useQuery|useMutation|fetch/.test(componentCode) && !/ErrorBoundary/.test(componentCode)) {
      optimizations.push('Consider wrapping component with ErrorBoundary');
    }

    return {
      optimizedCode,
      optimizations
    };
  }

  // =====================================
  // BUNDLE ANALYSIS
  // =====================================

  analyzeBundleSize(imports: string[]): {
    suggestions: string[];
    estimatedSavings: number;
  } {
    const suggestions: string[] = [];
    let estimatedSavings = 0;

    // Check for large libraries that could be optimized
    const heavyLibraries = {
      'lodash': { size: 70, alternative: 'Use individual lodash functions or native JS' },
      'moment': { size: 67, alternative: 'Use date-fns or day.js instead' },
      'antd': { size: 60, alternative: 'Import only needed components' },
      'material-ui': { size: 50, alternative: 'Use tree-shaking imports' }
    };

    imports.forEach(importStatement => {
      Object.entries(heavyLibraries).forEach(([lib, info]) => {
        if (importStatement.includes(lib) && !importStatement.includes(lib + '/')) {
          suggestions.push(`${lib}: ${info.alternative}`);
          estimatedSavings += info.size;
        }
      });
    });

    // Check for duplicate utilities
    const utilityImports = imports.filter(imp => 
      imp.includes('utils') || imp.includes('helpers') || imp.includes('lib')
    );
    if (utilityImports.length > 5) {
      suggestions.push('Consider consolidating utility imports into a single barrel export');
    }

    return {
      suggestions,
      estimatedSavings
    };
  }

  // =====================================
  // ACCESSIBILITY AUDIT
  // =====================================

  auditAccessibility(htmlContent: string): {
    issues: Array<{
      type: string;
      severity: 'error' | 'warning' | 'info';
      description: string;
      element: string;
    }>;
    score: number;
  } {
    const issues: any[] = [];

    // Check for missing alt attributes
    const imgTags = htmlContent.match(/<img[^>]*>/g) || [];
    imgTags.forEach(img => {
      if (!img.includes('alt=')) {
        issues.push({
          type: 'missing-alt',
          severity: 'error' as const,
          description: 'Image missing alt attribute',
          element: img
        });
      }
    });

    // Check for heading hierarchy
    const headings = htmlContent.match(/<h[1-6][^>]*>/g) || [];
    const headingLevels = headings.map(h => parseInt(h.match(/h(\d)/)?.[1] || '1'));
    for (let i = 1; i < headingLevels.length; i++) {
      if (headingLevels[i] - headingLevels[i - 1] > 1) {
        issues.push({
          type: 'heading-hierarchy',
          severity: 'warning' as const,
          description: 'Skipped heading level',
          element: headings[i]
        });
      }
    }

    // Check for form labels
    const inputTags = htmlContent.match(/<input[^>]*type="(?!hidden|submit|button)[^"]*"[^>]*>/g) || [];
    inputTags.forEach(input => {
      if (!input.includes('aria-label') && !input.includes('id=')) {
        issues.push({
          type: 'missing-label',
          severity: 'error' as const,
          description: 'Form input missing label or aria-label',
          element: input
        });
      }
    });

    // Calculate accessibility score
    const totalElements = (htmlContent.match(/<[^>]+>/g) || []).length;
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    
    const score = Math.max(0, Math.min(100, 
      100 - (errorCount * 10) - (warningCount * 5)
    ));

    return {
      issues,
      score
    };
  }

  // =====================================
  // PERFORMANCE SUGGESTIONS
  // =====================================

  getPerformanceSuggestions(componentCode: string): string[] {
    const suggestions: string[] = [];

    // Check for expensive operations in render
    if (/\.map\(.*\.sort\(/.test(componentCode)) {
      suggestions.push('Move sorting operations to useMemo to avoid recalculation on each render');
    }

    // Check for missing dependencies in useEffect
    const useEffectMatches = componentCode.match(/useEffect\([^}]+}/gs) || [];
    useEffectMatches.forEach(effect => {
      const variables = effect.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g) || [];
      const dependencies = effect.match(/\[([^\]]*)\]/)?.[1]?.split(',') || [];
      
      if (variables.length > dependencies.length + 5) { // Rough heuristic
        suggestions.push('Review useEffect dependencies to ensure all variables are included');
      }
    });

    // Check for large bundle imports
    if (/import.*from ['"](?:lodash|moment|antd)['"]/.test(componentCode)) {
      suggestions.push('Use tree-shaking imports to reduce bundle size');
    }

    return suggestions;
  }
}

export const codeRefactoringService = new CodeRefactoringService();

// Utility function to analyze entire project
export const analyzeProject = async (fileContents: Record<string, string>): Promise<{
  summary: {
    totalFiles: number;
    totalIssues: number;
    issuesBySeverity: Record<string, number>;
    overallScore: number;
  };
  fileResults: RefactoringResult[];
  recommendations: string[];
}> => {
  const results: RefactoringResult[] = [];
  
  for (const [filename, content] of Object.entries(fileContents)) {
    if (filename.endsWith('.tsx') || filename.endsWith('.ts')) {
      const result = codeRefactoringService.analyzeCode(content, filename);
      results.push(result);
    }
  }

  const totalIssues = results.reduce((sum, result) => sum + result.issues.length, 0);
  const issuesBySeverity = results.reduce((acc, result) => {
    result.issues.forEach(issue => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const avgScore = results.reduce((sum, result) => {
    return sum + (result.metrics.complexity + result.metrics.maintainability + 
                  result.metrics.performance + result.metrics.security) / 4;
  }, 0) / results.length;

  const recommendations = [
    'Implement error boundaries around async components',
    'Use React.memo for expensive components',
    'Add proper TypeScript types to replace any usage',
    'Implement proper loading and error states',
    'Add accessibility attributes to interactive elements',
    'Optimize bundle size by using tree-shaking imports',
    'Add proper validation to all user inputs',
    'Use performance monitoring to track real-world metrics'
  ];

  return {
    summary: {
      totalFiles: results.length,
      totalIssues,
      issuesBySeverity,
      overallScore: Math.round(avgScore)
    },
    fileResults: results,
    recommendations
  };
};