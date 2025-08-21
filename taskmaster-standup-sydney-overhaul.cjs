#!/usr/bin/env node

/**
 * Taskmaster AI - Stand Up Sydney Platform Overhaul
 * 
 * Complete task breakdown for the massive platform overhaul including:
 * - Homepage redesign with video hero
 * - Comedian navigation system
 * - Profile & dashboard overhaul
 * - Calendar system integration
 * - Invoicing system
 * - Vouch system enhancement
 * - Shows page fixes
 * - Messaging system
 * - Performance optimizations
 */

const fs = require('fs');
const path = require('path');

class StandUpSydneyTaskmaster {
  constructor() {
    this.taskQueue = '/root/agents/.agent-comms/task-queue';
    this.tasks = [];
    this.dependencies = new Map();
    
    // Task priorities based on business impact and technical dependencies
    this.priorities = {
      'critical-foundation': 1,    // Database, auth, core systems
      'navigation-ux': 2,         // Navigation and user experience
      'content-pages': 3,         // Core content pages
      'features': 4,              // Feature implementations
      'integration': 5,           // System integrations
      'polish': 6,                // UI polish and optimization
      'testing': 7                // Comprehensive testing
    };
  }

  generateComprehensiveTaskBreakdown() {
    console.log('\n🎯 TASKMASTER AI: Stand Up Sydney Platform Overhaul');
    console.log('📋 Generating comprehensive task breakdown...\n');
    
    this.tasks = [];
    
    // PHASE 1: CRITICAL FOUNDATION & FIXES
    this.addFoundationTasks();
    
    // PHASE 2: HOMEPAGE REDESIGN
    this.addHomepageOverhaulTasks();
    
    // PHASE 3: COMEDIAN NAVIGATION SYSTEM
    this.addComedianNavigationTasks();
    
    // PHASE 4: PROFILE & DASHBOARD OVERHAUL
    this.addProfileDashboardTasks();
    
    // PHASE 5: CALENDAR SYSTEM
    this.addCalendarSystemTasks();
    
    // PHASE 6: INVOICING SYSTEM
    this.addInvoicingSystemTasks();
    
    // PHASE 7: VOUCH SYSTEM ENHANCEMENT
    this.addVouchSystemTasks();
    
    // PHASE 8: SHOWS PAGE FIXES
    this.addShowsPageTasks();
    
    // PHASE 9: MESSAGING SYSTEM
    this.addMessagingSystemTasks();
    
    // PHASE 10: PERFORMANCE & OPTIMIZATION
    this.addOptimizationTasks();
    
    // PHASE 11: TESTING & VALIDATION
    this.addTestingTasks();
    
    // Sort tasks by priority and dependencies
    const sortedTasks = this.sortTasksByPriority();
    
    return {
      totalTasks: sortedTasks.length,
      tasks: sortedTasks,
      estimatedHours: this.calculateEstimatedTime(sortedTasks),
      phases: this.getPhaseBreakdown(sortedTasks)
    };
  }

  addFoundationTasks() {
    // Critical system fixes first
    this.addTask({
      id: 'fix-profile-system',
      title: 'Fix Profile System Foundation',
      description: 'Ensure profile creation trigger exists and all users have profiles',
      priority: 'critical-foundation',
      agent: 'backend',
      estimatedHours: 2,
      dependencies: [],
      files: ['supabase/migrations/', 'handle_new_user trigger'],
      acceptance: [
        'All users have associated profiles',
        'Profile creation trigger is working',
        'No zero-profile situations'
      ]
    });

    this.addTask({
      id: 'audit-database-integrity',
      title: 'Database Integrity Audit',
      description: 'Comprehensive audit of all database tables, policies, and relationships',
      priority: 'critical-foundation',
      agent: 'backend',
      estimatedHours: 3,
      dependencies: ['fix-profile-system'],
      files: ['supabase/migrations/', 'database schemas'],
      acceptance: [
        'All tables have proper RLS policies',
        'Foreign key relationships are correct',
        'No missing critical tables'
      ]
    });

    this.addTask({
      id: 'fix-authentication-flow',
      title: 'Authentication Flow Fixes',
      description: 'Ensure Google OAuth and user signup flow works correctly',
      priority: 'critical-foundation',
      agent: 'backend',
      estimatedHours: 2,
      dependencies: ['audit-database-integrity'],
      files: ['src/contexts/AuthContext.tsx', 'supabase auth config'],
      acceptance: [
        'Google OAuth signup works',
        'User creation flow is seamless',
        'Profile completion check works'
      ]
    });
  }

  addHomepageOverhaulTasks() {
    this.addTask({
      id: 'homepage-video-hero',
      title: 'Homepage Video Hero Component',
      description: 'Auto-looping video showreel with high-energy clips from Stand Up Sydney shows',
      priority: 'content-pages',
      agent: 'frontend',
      estimatedHours: 4,
      dependencies: ['fix-authentication-flow'],
      files: ['src/components/HomePage/VideoHero.tsx'],
      acceptance: [
        'Auto-looping video showreel',
        'High-energy clips from live shows',
        'Responsive design',
        'Loading states handled'
      ]
    });

    this.addTask({
      id: 'homepage-dark-theme',
      title: 'Dark Theme Implementation',
      description: 'Implement dark theme for homepage (no purple)',
      priority: 'content-pages',
      agent: 'frontend',
      estimatedHours: 3,
      dependencies: ['homepage-video-hero'],
      files: ['src/contexts/ThemeContext.tsx', 'tailwind.config.ts'],
      acceptance: [
        'Dark theme applied to homepage',
        'No purple color usage',
        'Consistent color scheme',
        'Theme persistence'
      ]
    });

    this.addTask({
      id: 'homepage-signup-cta',
      title: 'Central Sign Up CTA',
      description: 'Primary call-to-action button labeled "Sign Up" prominently placed',
      priority: 'content-pages',
      agent: 'frontend',
      estimatedHours: 2,
      dependencies: ['homepage-dark-theme'],
      files: ['src/components/HomePage/SignUpCTA.tsx'],
      acceptance: [
        'Central "Sign Up" button',
        'Prominent placement',
        'Clear call-to-action',
        'Links to auth flow'
      ]
    });

    this.addTask({
      id: 'homepage-saas-sections',
      title: 'SaaS Info Sections',
      description: 'Scroll-down sections explaining platform (who it\'s for, how it works, benefits)',
      priority: 'content-pages',
      agent: 'frontend',
      estimatedHours: 4,
      dependencies: ['homepage-signup-cta'],
      files: ['src/components/HomePage/InfoSections.tsx'],
      acceptance: [
        'Who it\'s for section',
        'How it works section',
        'Benefits section',
        'Smooth scrolling',
        'Engaging content'
      ]
    });

    this.addTask({
      id: 'homepage-magic-ui-components',
      title: 'Magic UI Components Integration',
      description: 'Feature slideshow, testimonials, company social proof, FAQ, footer, CTAs',
      priority: 'content-pages',
      agent: 'frontend',
      estimatedHours: 6,
      dependencies: ['homepage-saas-sections'],
      files: ['src/components/HomePage/MagicUIComponents.tsx'],
      acceptance: [
        'Feature slideshow component',
        '3 social proof testimonials',
        '3 social proof companies',
        '4 FAQ items',
        'Footer with 7 sections',
        'Call To Action (3 & 5 variants)'
      ]
    });
  }

  addComedianNavigationTasks() {
    this.addTask({
      id: 'comedian-navigation-bar',
      title: 'Comedian Navigation Bar',
      description: 'Customizable navigation with tabs: Shows, Calendar, Dashboard, Invoices, Vouches, Settings, Profile, Sign Out',
      priority: 'navigation-ux',
      agent: 'frontend',
      estimatedHours: 5,
      dependencies: ['fix-authentication-flow'],
      files: ['src/components/ComedianNavigation.tsx'],
      acceptance: [
        'All required tabs present',
        'Customizable tab visibility',
        'Settings/Profile/Sign Out always visible',
        'Role-based access (not for members)',
        'Responsive design'
      ]
    });

    this.addTask({
      id: 'navigation-customization',
      title: 'Navigation Customization System',
      description: 'Allow comedians to show/hide navigation tabs except protected ones',
      priority: 'navigation-ux',
      agent: 'frontend',
      estimatedHours: 3,
      dependencies: ['comedian-navigation-bar'],
      files: ['src/components/NavigationCustomization.tsx', 'src/hooks/useNavigationPrefs.ts'],
      acceptance: [
        'Toggle visibility for most tabs',
        'Settings/Profile/Sign Out protected',
        'Preferences saved per user',
        'Clean UI for customization'
      ]
    });
  }

  addProfileDashboardTasks() {
    this.addTask({
      id: 'comedian-landing-flow',
      title: 'Comedian Landing Flow Logic',
      description: 'First login → Profile Page, after completion → Dashboard, with completion checks',
      priority: 'navigation-ux',
      agent: 'frontend',
      estimatedHours: 4,
      dependencies: ['comedian-navigation-bar'],
      files: ['src/hooks/useComedianLandingFlow.ts', 'src/components/ProtectedRoute.tsx'],
      acceptance: [
        'First login redirects to Profile',
        'Profile completion check works',
        'After completion redirects to Dashboard',
        'Requires profile photo + 1 social handle',
        'Proper completion status tracking'
      ]
    });

    this.addTask({
      id: 'comedian-profile-overhaul',
      title: 'Comedian Profile Page Overhaul',
      description: 'Complete profile page with all fields functional, editable, and clearly labeled',
      priority: 'content-pages',
      agent: 'frontend',
      estimatedHours: 8,
      dependencies: ['comedian-landing-flow'],
      files: ['src/pages/ComedianProfile.tsx', 'src/components/comedian-profile/'],
      acceptance: [
        'All fields functional and editable',
        'Pre-filled data loads correctly',
        'Clear field labels',
        'Stage Name, Legal Name, Display Preference',
        'Location, Bio, Comedy Styles, Show Types',
        'Social media links section',
        'Media uploads with preview',
        'Personal & Manager contacts',
        'Financial info (BSB, Account, ABN)',
        'Security message for financial data',
        'Public URL clickable',
        'Dashboard added to tab list'
      ]
    });

    this.addTask({
      id: 'comedian-dashboard',
      title: 'Comedian Dashboard Implementation',
      description: 'Live, dynamic, personalized dashboard as landing page after profile completion',
      priority: 'content-pages',
      agent: 'frontend',
      estimatedHours: 6,
      dependencies: ['comedian-profile-overhaul'],
      files: ['src/pages/ComedianDashboard.tsx', 'src/components/dashboard/'],
      acceptance: [
        'Welcome message with name',
        'Upcoming Gigs (confirmed only)',
        'Applications (next 30 days)',
        'Total Earnings display',
        'Recent Activity Feed (live)',
        'Customizable Quick Links',
        'Events List with clickable items',
        'Event details: name, location, pay, Maps icon',
        'Real-time updates',
        'Responsive design'
      ]
    });

    this.addTask({
      id: 'remove-xero-comedian',
      title: 'Remove XERO Sync for Comedians',
      description: 'Remove XERO integration from comedian profile interface',
      priority: 'features',
      agent: 'frontend',
      estimatedHours: 1,
      dependencies: ['comedian-profile-overhaul'],
      files: ['src/components/comedian-profile/', 'src/components/XeroSyncButton.tsx'],
      acceptance: [
        'XERO sync removed from comedian view',
        'No XERO-related UI for comedians',
        'Admin-only XERO functionality preserved'
      ]
    });
  }

  addCalendarSystemTasks() {
    this.addTask({
      id: 'calendar-system-restructure',
      title: 'Calendar System Restructure',
      description: 'Move availability calendar from public to internal, add gig calendar',
      priority: 'features',
      agent: 'frontend',
      estimatedHours: 5,
      dependencies: ['comedian-dashboard'],
      files: ['src/components/CalendarView.tsx', 'src/components/ProfileCalendarView.tsx'],
      acceptance: [
        'Availability calendar moved to internal',
        'Gig calendar renamed and implemented',
        'Weekly/Monthly view toggle',
        'Confirmed gigs display',
        'Optional pending gigs toggle'
      ]
    });

    this.addTask({
      id: 'calendar-sync-integration',
      title: 'Calendar Sync Integration',
      description: 'Google Calendar and Apple Calendar sync buttons with proper integration',
      priority: 'integration',
      agent: 'frontend',
      estimatedHours: 6,
      dependencies: ['calendar-system-restructure'],
      files: ['src/components/CalendarSync.tsx', 'src/api/google-calendar.ts'],
      acceptance: [
        'Google Calendar sync working',
        'Apple Calendar sync working',
        'Sync buttons in profile/calendar',
        'Proper OAuth flow',
        'Error handling for sync failures'
      ]
    });

    this.addTask({
      id: 'remove-public-availability',
      title: 'Remove Availability from Public Profile',
      description: 'Remove availability calendar from public comedian profiles',
      priority: 'features',
      agent: 'frontend',
      estimatedHours: 2,
      dependencies: ['calendar-system-restructure'],
      files: ['src/components/comedian-profile/ComedianAvailabilityCalendar.tsx'],
      acceptance: [
        'Availability calendar removed from public view',
        'Internal availability calendar functional',
        'Public profile shows other content properly'
      ]
    });
  }

  addInvoicingSystemTasks() {
    this.addTask({
      id: 'invoices-navigation-tab',
      title: 'Invoices Navigation Tab',
      description: 'Add Invoices tab to comedian navigation system',
      priority: 'features',
      agent: 'frontend',
      estimatedHours: 2,
      dependencies: ['comedian-navigation-bar'],
      files: ['src/components/ComedianNavigation.tsx'],
      acceptance: [
        'Invoices tab in navigation',
        'Proper routing to invoices page',
        'Tab visibility in customization'
      ]
    });

    this.addTask({
      id: 'invoice-creation-system',
      title: 'Invoice Creation System',
      description: 'Create invoice functionality with date range, event selection, auto-calculation',
      priority: 'features',
      agent: 'frontend',
      estimatedHours: 8,
      dependencies: ['invoices-navigation-tab'],
      files: ['src/components/invoice/InvoiceForm.tsx', 'src/hooks/useInvoiceOperations.ts'],
      acceptance: [
        'Date range selector',
        'Event selection interface',
        'Auto-calculation of amounts',
        'Link invoices to specific gigs',
        'Professional invoice format',
        'PDF generation capability'
      ]
    });

    this.addTask({
      id: 'invoice-management-ui',
      title: 'Invoice Management UI',
      description: 'View sent/pending invoices, status tracking, management interface',
      priority: 'features',
      agent: 'frontend',
      estimatedHours: 5,
      dependencies: ['invoice-creation-system'],
      files: ['src/components/invoice/InvoiceManagement.tsx', 'src/pages/Invoices.tsx'],
      acceptance: [
        'List of sent invoices',
        'Pending invoices section',
        'Status tracking (sent/paid/overdue)',
        'Invoice editing capability',
        'Search and filter options'
      ]
    });

    this.addTask({
      id: 'xero-admin-sync',
      title: 'XERO Admin Sync',
      description: 'XERO synchronization for admin users only',
      priority: 'integration',
      agent: 'frontend',
      estimatedHours: 4,
      dependencies: ['invoice-management-ui'],
      files: ['src/components/admin/XeroIntegration.tsx'],
      acceptance: [
        'XERO sync for admin users only',
        'Invoice sync to XERO',
        'Error handling for sync issues',
        'Status display for sync operations'
      ]
    });
  }

  addVouchSystemTasks() {
    this.addTask({
      id: 'vouch-system-redesign',
      title: 'Vouch System Redesign',
      description: 'Change from 5 stars to crown icon, binary system implementation',
      priority: 'features',
      agent: 'frontend',
      estimatedHours: 4,
      dependencies: ['comedian-navigation-bar'],
      files: ['src/components/VouchSystem.tsx', 'src/components/VouchButton.tsx'],
      acceptance: [
        'Crown icon instead of 5 stars',
        'Binary system (have vouch or don\'t)',
        'Clean visual design',
        'Proper state management'
      ]
    });

    this.addTask({
      id: 'vouches-navigation-tab',
      title: 'Vouches Navigation Tab',
      description: 'Add Vouches tab to navigation (not default for comedians)',
      priority: 'features',
      agent: 'frontend',
      estimatedHours: 2,
      dependencies: ['vouch-system-redesign'],
      files: ['src/components/ComedianNavigation.tsx'],
      acceptance: [
        'Vouches tab in navigation',
        'Not shown by default for comedians',
        'Can be enabled in customization',
        'Proper routing to vouches page'
      ]
    });

    this.addTask({
      id: 'vouch-submission-system',
      title: 'Vouch Submission System',
      description: 'Submit vouches for other comedians, view vouch history',
      priority: 'features',
      agent: 'frontend',
      estimatedHours: 5,
      dependencies: ['vouches-navigation-tab'],
      files: ['src/components/VouchSubmission.tsx', 'src/hooks/useVouches.ts'],
      acceptance: [
        'Submit vouches for other comedians',
        'View personal vouch history',
        'Ensure submissions are processed',
        'Accurate vouch display',
        'Prevent duplicate vouches'
      ]
    });
  }

  addShowsPageTasks() {
    this.addTask({
      id: 'shows-page-diagnosis',
      title: 'Shows Page Issue Diagnosis',
      description: 'Identify and document what\'s broken in the Shows page',
      priority: 'features',
      agent: 'frontend',
      estimatedHours: 2,
      dependencies: ['audit-database-integrity'],
      files: ['src/pages/Shows.tsx'],
      acceptance: [
        'Complete diagnosis of Shows page issues',
        'Document broken functionality',
        'Identify root causes',
        'Plan fix strategy'
      ]
    });

    this.addTask({
      id: 'shows-page-fix',
      title: 'Shows Page Fix Implementation',
      description: 'Fix Shows page with Featured Events on top, All Other Events below',
      priority: 'features',
      agent: 'frontend',
      estimatedHours: 6,
      dependencies: ['shows-page-diagnosis'],
      files: ['src/pages/Shows.tsx', 'src/components/FeaturedEventsCarousel.tsx'],
      acceptance: [
        'Featured Events section on top',
        'All Other Events section below',
        'Same layout as previous version',
        'Proper event loading and display',
        'Responsive design'
      ]
    });

    this.addTask({
      id: 'fix-comedian-marketplace',
      title: 'Fix Comedian Marketplace',
      description: 'Fix profile picture quality scaling issue and public profile integration',
      priority: 'features',
      agent: 'frontend',
      estimatedHours: 4,
      dependencies: ['shows-page-fix'],
      files: ['src/components/ComedianMarketplace.tsx', 'src/components/ComedianCard.tsx'],
      acceptance: [
        'Profile picture quality fixed',
        'No scaling issues',
        'Clicking comedian opens Front-Facing Public Profile',
        'Proper image optimization',
        'Responsive card layout'
      ]
    });
  }

  addMessagingSystemTasks() {
    this.addTask({
      id: 'messaging-system-audit',
      title: 'Messaging System Audit',
      description: 'Audit messaging system for real data accuracy and functionality',
      priority: 'features',
      agent: 'backend',
      estimatedHours: 3,
      dependencies: ['audit-database-integrity'],
      files: ['src/pages/Messages.tsx', 'messaging database tables'],
      acceptance: [
        'Real data accuracy verified',
        'Messaging functionality assessed',
        'Issues documented',
        'Performance bottlenecks identified'
      ]
    });

    this.addTask({
      id: 'messaging-permissions-fix',
      title: 'Messaging Permissions Fix',
      description: 'Fix messaging permissions and approval system',
      priority: 'features',
      agent: 'backend',
      estimatedHours: 4,
      dependencies: ['messaging-system-audit'],
      files: ['messaging policies', 'src/services/messageService.ts'],
      acceptance: [
        'Only approved messaging allowed',
        'Proper permission checks',
        'Status handling working',
        'User role restrictions enforced'
      ]
    });

    this.addTask({
      id: 'messaging-real-time',
      title: 'Messaging Real-time Updates',
      description: 'Implement live request/update logic for messaging system',
      priority: 'features',
      agent: 'frontend',
      estimatedHours: 5,
      dependencies: ['messaging-permissions-fix'],
      files: ['src/pages/Messages.tsx', 'src/hooks/useMessaging.ts'],
      acceptance: [
        'Live request handling',
        'Real-time message updates',
        'Proper WebSocket/subscription setup',
        'Status updates in real-time',
        'Error handling for connection issues'
      ]
    });
  }

  addOptimizationTasks() {
    this.addTask({
      id: 'performance-audit',
      title: 'Performance Audit',
      description: 'Comprehensive performance audit of the entire platform',
      priority: 'polish',
      agent: 'frontend',
      estimatedHours: 4,
      dependencies: ['comedian-dashboard', 'shows-page-fix'],
      files: ['entire codebase'],
      acceptance: [
        'Bundle size analysis',
        'Runtime performance metrics',
        'Core Web Vitals assessment',
        'Identified optimization opportunities',
        'Performance baseline established'
      ]
    });

    this.addTask({
      id: 'code-splitting-optimization',
      title: 'Code Splitting Optimization',
      description: 'Optimize code splitting and lazy loading for better performance',
      priority: 'polish',
      agent: 'frontend',
      estimatedHours: 3,
      dependencies: ['performance-audit'],
      files: ['src/App.tsx', 'vite.config.ts'],
      acceptance: [
        'Optimal code splitting implemented',
        'Lazy loading for routes',
        'Reduced initial bundle size',
        'Improved loading times'
      ]
    });

    this.addTask({
      id: 'image-optimization',
      title: 'Image Optimization',
      description: 'Optimize images throughout the platform for better performance',
      priority: 'polish',
      agent: 'frontend',
      estimatedHours: 3,
      dependencies: ['performance-audit'],
      files: ['src/components/ui/optimized-image.tsx', 'image handling'],
      acceptance: [
        'WebP/AVIF format support',
        'Responsive image sizing',
        'Lazy loading implementation',
        'Proper image compression'
      ]
    });
  }

  addTestingTasks() {
    this.addTask({
      id: 'unit-tests-comprehensive',
      title: 'Comprehensive Unit Tests',
      description: 'Write unit tests for all new and modified components',
      priority: 'testing',
      agent: 'testing',
      estimatedHours: 12,
      dependencies: ['comedian-dashboard', 'invoice-management-ui', 'vouch-submission-system'],
      files: ['tests/', 'all component test files'],
      acceptance: [
        'Unit tests for all new components',
        'Test coverage above 80%',
        'Edge cases covered',
        'Mocking external dependencies'
      ]
    });

    this.addTask({
      id: 'integration-tests',
      title: 'Integration Tests',
      description: 'Write integration tests for complete user workflows',
      priority: 'testing',
      agent: 'testing',
      estimatedHours: 8,
      dependencies: ['unit-tests-comprehensive'],
      files: ['tests/integration/'],
      acceptance: [
        'Comedian signup to dashboard flow',
        'Invoice creation to payment flow',
        'Event application to confirmation flow',
        'Profile completion workflow',
        'Navigation customization flow'
      ]
    });

    this.addTask({
      id: 'e2e-tests',
      title: 'End-to-End Tests',
      description: 'Create E2E tests for critical user journeys',
      priority: 'testing',
      agent: 'testing',
      estimatedHours: 10,
      dependencies: ['integration-tests'],
      files: ['tests/e2e/'],
      acceptance: [
        'Complete user journey tests',
        'Cross-browser compatibility',
        'Mobile responsiveness testing',
        'Performance regression tests',
        'Error handling validation'
      ]
    });

    this.addTask({
      id: 'testing-automation',
      title: 'Testing Automation Setup',
      description: 'Set up automated testing pipeline and CI/CD integration',
      priority: 'testing',
      agent: 'testing',
      estimatedHours: 4,
      dependencies: ['e2e-tests'],
      files: ['.github/workflows/', 'test automation config'],
      acceptance: [
        'Automated test execution',
        'CI/CD pipeline integration',
        'Test result reporting',
        'Failed test notifications',
        'Performance benchmarking'
      ]
    });
  }

  addTask(task) {
    this.tasks.push({
      ...task,
      createdAt: new Date().toISOString(),
      status: 'pending'
    });
  }

  sortTasksByPriority() {
    // Create dependency graph
    const graph = new Map();
    this.tasks.forEach(task => {
      graph.set(task.id, task);
    });

    // Topological sort considering priorities
    const sorted = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (taskId) => {
      if (visited.has(taskId)) return;
      if (visiting.has(taskId)) {
        console.warn(`⚠️ Circular dependency detected: ${taskId}`);
        return;
      }

      visiting.add(taskId);
      const task = graph.get(taskId);
      
      if (task && task.dependencies) {
        task.dependencies.forEach(depId => {
          if (graph.has(depId)) {
            visit(depId);
          }
        });
      }

      visiting.delete(taskId);
      visited.add(taskId);
      
      if (task) sorted.push(task);
    };

    // Sort by priority first, then dependencies
    const tasksByPriority = [...this.tasks].sort((a, b) => {
      const priorityA = this.priorities[a.priority] || 999;
      const priorityB = this.priorities[b.priority] || 999;
      return priorityA - priorityB;
    });

    tasksByPriority.forEach(task => visit(task.id));

    return sorted;
  }

  calculateEstimatedTime(tasks) {
    const totalHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 4), 0);
    return {
      hours: totalHours,
      days: Math.ceil(totalHours / 8),
      weeks: Math.ceil(totalHours / 40)
    };
  }

  getPhaseBreakdown(tasks) {
    const phases = {};
    
    tasks.forEach(task => {
      if (!phases[task.priority]) {
        phases[task.priority] = {
          name: task.priority,
          tasks: [],
          totalHours: 0
        };
      }
      phases[task.priority].tasks.push(task);
      phases[task.priority].totalHours += task.estimatedHours || 4;
    });

    return phases;
  }

  async generateTaskFiles(tasks) {
    console.log('\n📁 Generating task files...');
    
    // Ensure queue directory exists
    if (!fs.existsSync(this.taskQueue)) {
      fs.mkdirSync(this.taskQueue, { recursive: true });
    }

    let fileCount = 0;
    
    for (const [index, task] of tasks.entries()) {
      const timestamp = Date.now() + (index * 1000);
      const filename = `TASK_${timestamp}_${task.id}.md`;
      const filepath = path.join(this.taskQueue, filename);
      
      const content = `# ${task.title}

## Task Information
- **ID**: ${task.id}
- **Priority**: ${task.priority}
- **Agent**: ${task.agent}
- **Estimated Hours**: ${task.estimatedHours}
- **Status**: ${task.status}
- **Created**: ${task.createdAt}
- **Order**: ${index + 1} of ${tasks.length}

## Description
${task.description}

## Files to Modify
${task.files.map(file => `- ${file}`).join('\n')}

## Dependencies
${task.dependencies.length > 0 ? task.dependencies.map(dep => `- ${dep}`).join('\n') : 'None'}

## Acceptance Criteria
${task.acceptance.map(criterion => `- [ ] ${criterion}`).join('\n')}

## Technical Notes
- Follow existing project architecture and patterns
- Maintain TypeScript type safety
- Ensure mobile responsiveness
- Include proper error handling
- Follow accessibility best practices
- Update tests as needed

## Context
This task is part of the Stand Up Sydney platform overhaul. The goal is to create a modern, efficient, and user-friendly comedy platform that serves comedians, promoters, and venues.

## Execution Log
- Task created by Taskmaster AI
- Ready for ${task.agent} agent processing
- Part of comprehensive platform overhaul

---
*Generated by Taskmaster AI - Stand Up Sydney Platform Overhaul*
`;

      fs.writeFileSync(filepath, content);
      fileCount++;
      
      console.log(`  ${index + 1}. [${task.agent}] ${task.title}`);
    }
    
    console.log(`\n✅ Generated ${fileCount} task files`);
  }

  printSummary(result) {
    console.log('\n🎯 TASKMASTER AI SUMMARY');
    console.log('=' .repeat(50));
    console.log(`📋 Total Tasks: ${result.totalTasks}`);
    console.log(`⏱️ Estimated Time: ${result.estimatedHours.hours} hours (${result.estimatedHours.days} days)`);
    console.log(`📅 Estimated Duration: ${result.estimatedHours.weeks} weeks`);
    
    console.log('\n📊 Phase Breakdown:');
    Object.values(result.phases).forEach(phase => {
      console.log(`  ${phase.name}: ${phase.tasks.length} tasks (${phase.totalHours}h)`);
    });
    
    console.log('\n🎯 Agent Distribution:');
    const agentCounts = {};
    result.tasks.forEach(task => {
      agentCounts[task.agent] = (agentCounts[task.agent] || 0) + 1;
    });
    
    Object.entries(agentCounts).forEach(([agent, count]) => {
      console.log(`  ${agent}: ${count} tasks`);
    });
    
    console.log('\n🚀 Ready to begin implementation!');
  }
}

// Export for use
module.exports = StandUpSydneyTaskmaster;

// Run if called directly
if (require.main === module) {
  const taskmaster = new StandUpSydneyTaskmaster();
  
  const result = taskmaster.generateComprehensiveTaskBreakdown();
  taskmaster.printSummary(result);
  
  // Generate task files
  const sortedTasks = taskmaster.sortTasksByPriority();
  taskmaster.generateTaskFiles(sortedTasks).then(() => {
    console.log('\n✅ Taskmaster AI initialization complete!');
    console.log('📁 Task files generated in:', taskmaster.taskQueue);
  });
}