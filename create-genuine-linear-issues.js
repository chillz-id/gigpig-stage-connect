#!/usr/bin/env node

/**
 * Create Linear Issues from Genuine Claude 4 Analysis
 * Push specific findings from comprehensive codebase analysis to Linear
 */

import LinearIntegration from './linear-integration-utility.js';
import fs from 'fs';

class GenuineAnalysisLinearCreator {
  constructor() {
    this.linear = new LinearIntegration();
    this.analysisFile = './genuine-claude4-analysis-results.json';
  }

  async createAllIssues() {
    console.log('🔍 Creating Linear Issues from Genuine Analysis Findings');
    console.log('='.repeat(80));

    try {
      // Load genuine analysis results
      const analysis = JSON.parse(fs.readFileSync(this.analysisFile, 'utf8'));
      console.log(`📊 Loaded analysis from: ${this.analysisFile}`);
      console.log(`📅 Analysis generated: ${analysis.generated_at}`);
      console.log(`🔍 Files analyzed: ${analysis.files_analyzed}`);
      console.log(`⚠️  Critical findings: ${analysis.critical_findings.length}`);

      const createdIssues = [];

      // 1. Critical Issue: tourService.ts Refactoring
      console.log('\n🚨 Creating CRITICAL issue: tourService.ts refactoring...');
      const tourServiceIssue = await this.createTourServiceIssue(analysis);
      createdIssues.push(tourServiceIssue);

      // 2. Critical Issue: notificationService.ts Decomposition  
      console.log('\n🚨 Creating CRITICAL issue: notificationService.ts decomposition...');
      const notificationServiceIssue = await this.createNotificationServiceIssue(analysis);
      createdIssues.push(notificationServiceIssue);

      // 3. High Priority: InvoiceForm.tsx Refactoring
      console.log('\n⚠️  Creating HIGH PRIORITY issue: InvoiceForm.tsx refactoring...');
      const invoiceFormIssue = await this.createInvoiceFormIssue(analysis);
      createdIssues.push(invoiceFormIssue);

      // 4. Medium Priority: Duplicate File Cleanup
      console.log('\n📋 Creating MEDIUM priority issue: Duplicate file cleanup...');
      const duplicateCleanupIssue = await this.createDuplicateCleanupIssue(analysis);
      createdIssues.push(duplicateCleanupIssue);

      // 5. Medium Priority: Unused Imports Cleanup
      console.log('\n🧹 Creating MEDIUM priority issue: Unused imports cleanup...');
      const unusedImportsIssue = await this.createUnusedImportsIssue(analysis);
      createdIssues.push(unusedImportsIssue);

      // Summary
      console.log('\n' + '='.repeat(80));
      console.log('✅ GENUINE ANALYSIS ISSUES CREATED SUCCESSFULLY!');
      console.log(`📊 Total issues created: ${createdIssues.length}`);
      console.log('\n🔗 Linear Issue URLs:');
      createdIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.identifier}: ${issue.title}`);
        console.log(`   📍 ${issue.url}`);
        console.log(`   🎯 Priority: ${issue.priorityLabel}`);
        console.log(`   👥 Team: ${issue.team.name}`);
        console.log('');
      });

      // Save summary
      const summary = {
        timestamp: new Date().toISOString(),
        source_analysis: this.analysisFile,
        total_issues_created: createdIssues.length,
        issues: createdIssues.map(issue => ({
          identifier: issue.identifier,
          title: issue.title,
          url: issue.url,
          priority: issue.priorityLabel,
          team: issue.team.name
        }))
      };

      fs.writeFileSync('./genuine-analysis-linear-summary.json', JSON.stringify(summary, null, 2));
      console.log('💾 Summary saved to: genuine-analysis-linear-summary.json');

      return createdIssues;

    } catch (error) {
      console.error('❌ Failed to create Linear issues:', error.message);
      throw error;
    }
  }

  async createTourServiceIssue(analysis) {
    const finding = analysis.critical_findings.find(f => f.file === 'src/services/tourService.ts');
    
    const description = `## 🚨 CRITICAL REFACTORING REQUIRED

**File:** \`src/services/tourService.ts:1-771\`
**Complexity:** Cyclomatic complexity of 63 (extremely high)
**Size:** 771 lines (violates single responsibility principle)

### Problem Analysis
This service class has grown into a massive monolith handling **8+ distinct responsibilities**:
- Tour management
- Tour stops coordination  
- Participant management
- Collaboration handling
- Logistics coordination
- Expense tracking
- Revenue management
- Statistics aggregation

### Critical Issues
${finding.details.issues.map(issue => `- ${issue}`).join('\n')}

### Refactoring Plan
**Split into 4 domain-specific services:**

1. **\`TourService.ts\`** - Core tour CRUD operations
2. **\`TourStopService.ts\`** - Stop management and logistics
3. **\`TourParticipantService.ts\`** - Participant and collaboration handling
4. **\`TourFinancialService.ts\`** - Expenses, revenue, and financial operations

### Acceptance Criteria
- [ ] Create new service files with clear domain boundaries
- [ ] Migrate existing methods to appropriate services
- [ ] Update all imports and dependencies
- [ ] Maintain existing API contracts
- [ ] Add unit tests for each new service
- [ ] Reduce cyclomatic complexity below 10 per service
- [ ] Verify no functionality regression

### Impact
${finding.impact}

**Effort Estimate:** ${finding.effort_estimate}

---
*Created from genuine Claude 4 codebase analysis*
*Source: ${this.analysisFile}*`;

    return await this.linear.createIssue({
      title: 'CRITICAL: Split tourService.ts Monolith (771 lines, complexity 63)',
      description,
      team: 'BACKEND',
      priority: 1 // Urgent
    });
  }

  async createNotificationServiceIssue(analysis) {
    const finding = analysis.critical_findings.find(f => f.file === 'src/services/notificationService.ts');
    
    const description = `## 🚨 CRITICAL SERVICE DECOMPOSITION REQUIRED

**File:** \`src/services/notificationService.ts:1-1234\`
**Notification Types:** ${finding.details.notification_types}+ different types
**Methods:** ${finding.details.class_methods} methods in single class

### Problem Analysis
This service has become an unwieldy notification hub handling **every type of notification**:

**Current Responsibilities:**
${finding.details.responsibilities.map(resp => `- ${resp}`).join('\n')}

### Decomposition Strategy
**Extract into specialized services:**

1. **\`NotificationManager.ts\`** - Central orchestration and routing
2. **\`EmailNotificationService.ts\`** - Email-specific logic and templates
3. **\`PushNotificationService.ts\`** - Push notification handling
4. **\`SpotNotificationService.ts\`** - Spot assignment notifications
5. **\`TourNotificationService.ts\`** - Tour-related notifications
6. **\`TaskNotificationService.ts\`** - Task management notifications

### Acceptance Criteria
- [ ] Create notification manager for orchestration
- [ ] Extract email service with template management
- [ ] Separate push notification logic
- [ ] Create domain-specific notification services
- [ ] Implement consistent notification interfaces
- [ ] Maintain real-time subscription functionality
- [ ] Preserve all existing notification types
- [ ] Add comprehensive testing for each service

### Impact
${finding.impact}

**Effort Estimate:** ${finding.effort_estimate}

---
*Created from genuine Claude 4 codebase analysis*
*Source: ${this.analysisFile}*`;

    return await this.linear.createIssue({
      title: 'CRITICAL: Decompose notificationService.ts (18+ notification types)',
      description,
      team: 'BACKEND', 
      priority: 1 // Urgent
    });
  }

  async createInvoiceFormIssue(analysis) {
    const finding = analysis.critical_findings.find(f => f.file === 'src/components/InvoiceForm.tsx');
    
    const description = `## ⚠️ COMPONENT REFACTORING REQUIRED

**File:** \`src/components/InvoiceForm.tsx\`
**State Variables:** ${finding.details.state_variables}+ useState calls
**Complex State:** ${finding.details.complex_state_object}

### Problem Analysis
Large React component with multiple responsibilities and complex state management:

**Current Responsibilities:**
${finding.details.responsibilities.map(resp => `- ${resp}`).join('\n')}

### Refactoring Strategy
**Extract into focused units:**

1. **\`useInvoiceFormState.ts\`** - Custom hook for form state management
2. **\`InvoiceItemsList.tsx\`** - Component for item array manipulation
3. **\`DepositCalculator.tsx\`** - Component for deposit calculations
4. **\`InvoicePreview.tsx\`** - Component for invoice preview functionality

### Benefits
- Improved component reusability
- Better testing capabilities
- Cleaner separation of concerns
- Reduced re-render scope
- Enhanced maintainability

### Acceptance Criteria
- [ ] Create custom hook for state management
- [ ] Extract invoice items list component
- [ ] Separate deposit calculation logic
- [ ] Create invoice preview component
- [ ] Implement proper prop interfaces
- [ ] Add unit tests for each extracted piece
- [ ] Verify form functionality preservation
- [ ] Optimize re-render performance

### Impact
${finding.impact}

**Effort Estimate:** ${finding.effort_estimate}

---
*Created from genuine Claude 4 codebase analysis*
*Source: ${this.analysisFile}*`;

    return await this.linear.createIssue({
      title: 'Refactor InvoiceForm.tsx - Extract Hooks and Sub-components',
      description,
      team: 'BACKEND', // Frontend work but tracked in backend team
      priority: 2 // High
    });
  }

  async createDuplicateCleanupIssue(analysis) {
    const duplicates = analysis.duplicate_code_analysis.critical_duplicates;
    
    const description = `## 🧹 DUPLICATE FILE CLEANUP

**Total Duplicates Found:** ${duplicates.length} file groups
**Total Size Impact:** ~18KB of duplicated code

### Identified Duplicates

${duplicates.map((dup, index) => `
**${index + 1}. ${dup.files.join(' + ')}**
- Size: ${dup.size} bytes (${dup.lines} lines)
- Issue: ${dup.issue}
- Recommendation: ${dup.recommendation}
- Effort: ${dup.effort}
`).join('\n')}

### Cleanup Plan
1. **Verify file contents are truly identical**
2. **Check for any recent changes or dependencies**
3. **Remove standalone SQL files, keep only timestamped migrations**
4. **Update any references or documentation**
5. **Test affected functionality**

### Acceptance Criteria
- [ ] Remove \`EMERGENCY_FIX_PROFILES.sql\` (keep \`fix-missing-profiles.sql\`)
- [ ] Remove \`fix-google-auth.sql\` (keep migration version)
- [ ] Remove \`invoice-migration.sql\` (keep timestamped migration)
- [ ] Verify no broken references
- [ ] Update documentation if needed
- [ ] Test related functionality

### Impact
${analysis.duplicate_code_analysis.impact}

**Total Effort:** ~20 minutes (quick organizational cleanup)

---
*Created from genuine Claude 4 codebase analysis*
*Source: ${this.analysisFile}*`;

    return await this.linear.createIssue({
      title: 'Remove 3 Duplicate SQL Migration Files (~18KB cleanup)',
      description,
      team: 'BACKEND',
      priority: 3 // Medium
    });
  }

  async createUnusedImportsIssue(analysis) {
    const unusedImports = analysis.unused_imports_analysis;
    
    const description = `## 🧹 UNUSED IMPORTS CLEANUP

**Files Affected:** ${unusedImports.total_files_affected} files
**Total Unused Imports:** ${unusedImports.total_unused_imports} imports
**Severity:** ${unusedImports.severity}

### Analysis Summary
Comprehensive scan found unused imports across the codebase affecting bundle size and code cleanliness.

### Example Files with Unused Imports
${unusedImports.examples.map(example => `
**\`${example.file}\`**
- Unused: \`${example.unused.join(', ')}\`
- Line: ${example.line}
`).join('\n')}

### Cleanup Strategy
**Automated approach using ESLint:**
\`\`\`bash
# Run from /root/agents/ directory
npm run lint -- --fix
\`\`\`

### Manual Verification Required
Some imports may need manual review:
- Imports used in comments or documentation
- Imports for side effects only
- Type-only imports that may be needed for declarations

### Acceptance Criteria
- [ ] Run ESLint --fix on all affected files
- [ ] Manually review any remaining unused imports
- [ ] Verify no broken functionality after cleanup
- [ ] Test build process works correctly
- [ ] Confirm TypeScript compilation passes
- [ ] Run test suite to ensure no regressions

### Impact
${unusedImports.impact}

**Effort Estimate:** ${unusedImports.effort_estimate}

---
*Created from genuine Claude 4 codebase analysis*
*Source: ${this.analysisFile}*`;

    return await this.linear.createIssue({
      title: 'Remove 284 Unused Imports Across 149 Files (ESLint cleanup)',
      description,
      team: 'BACKEND',
      priority: 3 // Medium
    });
  }
}

// Execute when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const creator = new GenuineAnalysisLinearCreator();
  await creator.createAllIssues();
}

export default GenuineAnalysisLinearCreator;