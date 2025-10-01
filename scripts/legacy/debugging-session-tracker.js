#!/usr/bin/env node

/**
 * Master Debugging Session Coordination System
 * 
 * Tracks all debugging activities across the Stand Up Sydney platform
 * Provides centralized session management, persistence, and analytics
 * Integrates with Knowledge Graph and N8N debugging workflows
 */

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DebuggingSessionTracker {
  constructor() {
    this.baseDir = path.join(__dirname, '..', 'debugging-sessions');
    this.currentSession = null;
    this.sessionHistory = [];
    this.knowledgeGraphPath = path.join(__dirname, '..', '..', '.claude-multi-agent', 'scripts');
    
    // Initialize system on startup
    this.init().catch(console.error);
  }

  /**
   * Initialize the debugging session system
   */
  async init() {
    try {
      // Ensure debugging sessions directory exists
      await this.ensureDirectoryStructure();
      
      // Load existing session history
      await this.loadSessionHistory();
      
      // Register with Knowledge Graph if available
      await this.registerWithKnowledgeGraph();
      
      console.log('🔧 Debugging Session Tracker initialized');
    } catch (error) {
      console.error('Failed to initialize debugging session tracker:', error);
    }
  }

  /**
   * Ensure directory structure exists
   */
  async ensureDirectoryStructure() {
    const directories = [
      this.baseDir,
      path.join(this.baseDir, 'active'),
      path.join(this.baseDir, 'completed'),
      path.join(this.baseDir, 'archived'),
      path.join(this.baseDir, 'reports')
    ];

    for (const dir of directories) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
      }
    }
  }

  /**
   * Start a new debugging session
   */
  async startSession(options = {}) {
    const sessionId = this.generateSessionId();
    const timestamp = new Date().toISOString();
    
    const sessionData = {
      id: sessionId,
      startTime: timestamp,
      endTime: null,
      status: 'active',
      title: options.title || 'Debugging Session',
      description: options.description || '',
      priority: options.priority || 'medium',
      tags: options.tags || [],
      activities: [],
      issues: [],
      solutions: [],
      metrics: {
        totalActivities: 0,
        issuesFound: 0,
        issuesResolved: 0,
        duration: null
      },
      integrations: {
        knowledgeGraph: false,
        n8nWorkflows: [],
        supabaseQueries: [],
        externalAPIs: []
      },
      metadata: {
        user: process.env.USER || 'system',
        platform: process.platform,
        nodeVersion: process.version,
        workingDirectory: process.cwd()
      }
    };

    // Save session data
    const sessionDir = path.join(this.baseDir, 'active', sessionId);
    await fs.mkdir(sessionDir, { recursive: true });
    
    await this.saveSessionData(sessionId, sessionData);
    
    this.currentSession = sessionData;
    
    // Log to Knowledge Graph if available
    await this.logToKnowledgeGraph('session-start', {
      sessionId,
      title: sessionData.title,
      timestamp
    });

    console.log(`🚀 Started debugging session: ${sessionId}`);
    console.log(`   Title: ${sessionData.title}`);
    console.log(`   Time: ${timestamp}`);

    return sessionData;
  }

  /**
   * End the current debugging session
   */
  async endSession(summary = '') {
    if (!this.currentSession) {
      throw new Error('No active debugging session to end');
    }

    const endTime = new Date().toISOString();
    const startTime = new Date(this.currentSession.startTime);
    const duration = Date.now() - startTime.getTime();

    this.currentSession.endTime = endTime;
    this.currentSession.status = 'completed';
    this.currentSession.summary = summary;
    this.currentSession.metrics.duration = duration;

    // Move session to completed directory
    const sessionId = this.currentSession.id;
    const activeDir = path.join(this.baseDir, 'active', sessionId);
    const completedDir = path.join(this.baseDir, 'completed', sessionId);
    
    await fs.mkdir(path.dirname(completedDir), { recursive: true });
    await fs.rename(activeDir, completedDir);
    
    // Save final session data
    await this.saveSessionData(sessionId, this.currentSession, 'completed');
    
    // Generate session report
    await this.generateSessionReport(this.currentSession);
    
    // Log to Knowledge Graph
    await this.logToKnowledgeGraph('session-end', {
      sessionId,
      duration: this.formatDuration(duration),
      metrics: this.currentSession.metrics,
      timestamp: endTime
    });

    console.log(`✅ Ended debugging session: ${sessionId}`);
    console.log(`   Duration: ${this.formatDuration(duration)}`);
    console.log(`   Activities: ${this.currentSession.metrics.totalActivities}`);
    console.log(`   Issues Found: ${this.currentSession.metrics.issuesFound}`);
    console.log(`   Issues Resolved: ${this.currentSession.metrics.issuesResolved}`);

    const completedSession = { ...this.currentSession };
    this.currentSession = null;
    
    return completedSession;
  }

  /**
   * Log an activity in the current session
   */
  async logActivity(type, description, metadata = {}) {
    if (!this.currentSession) {
      console.warn('No active session - creating auto-session for activity');
      await this.startSession({ title: 'Auto-generated Session' });
    }

    const activity = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type,
      description,
      metadata,
      status: 'completed'
    };

    this.currentSession.activities.push(activity);
    this.currentSession.metrics.totalActivities++;

    await this.saveSessionData(this.currentSession.id, this.currentSession);

    console.log(`📝 Activity logged: ${type} - ${description}`);
    
    return activity;
  }

  /**
   * Log an issue discovered during debugging
   */
  async logIssue(name, description, severity = 'medium', metadata = {}) {
    if (!this.currentSession) {
      await this.startSession({ title: 'Issue Investigation Session' });
    }

    const issue = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      name,
      description,
      severity,
      status: 'open',
      metadata,
      solutions: []
    };

    this.currentSession.issues.push(issue);
    this.currentSession.metrics.issuesFound++;

    await this.saveSessionData(this.currentSession.id, this.currentSession);

    // Auto-log to Knowledge Graph for critical/high severity issues
    if (['critical', 'high'].includes(severity)) {
      await this.logToKnowledgeGraph('issue-discovered', {
        sessionId: this.currentSession.id,
        issue: { name, description, severity },
        timestamp: issue.timestamp
      });
    }

    console.log(`⚠️  Issue logged: ${name} (${severity})`);
    
    return issue;
  }

  /**
   * Log a solution for an issue
   */
  async logSolution(issueId, solution, success = true, metadata = {}) {
    if (!this.currentSession) {
      throw new Error('No active session to log solution');
    }

    const issue = this.currentSession.issues.find(i => i.id === issueId);
    if (!issue) {
      throw new Error(`Issue ${issueId} not found in current session`);
    }

    const solutionEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      solution,
      success,
      metadata
    };

    issue.solutions.push(solutionEntry);
    
    if (success) {
      issue.status = 'resolved';
      this.currentSession.metrics.issuesResolved++;
    }

    await this.saveSessionData(this.currentSession.id, this.currentSession);

    // Log to Knowledge Graph for successful solutions
    if (success) {
      await this.logToKnowledgeGraph('solution-found', {
        sessionId: this.currentSession.id,
        issue: { name: issue.name, description: issue.description },
        solution,
        timestamp: solutionEntry.timestamp
      });
    }

    console.log(`${success ? '✅' : '❌'} Solution logged for: ${issue.name}`);
    
    return solutionEntry;
  }

  /**
   * Register integration activity
   */
  async registerIntegration(type, details = {}) {
    if (!this.currentSession) {
      return;
    }

    switch (type) {
      case 'knowledge-graph':
        this.currentSession.integrations.knowledgeGraph = true;
        break;
      case 'n8n-workflow':
        this.currentSession.integrations.n8nWorkflows.push(details);
        break;
      case 'supabase-query':
        this.currentSession.integrations.supabaseQueries.push(details);
        break;
      case 'external-api':
        this.currentSession.integrations.externalAPIs.push(details);
        break;
    }

    await this.saveSessionData(this.currentSession.id, this.currentSession);
  }

  /**
   * Get current session status
   */
  getCurrentSession() {
    return this.currentSession;
  }

  /**
   * Get session history
   */
  async getSessionHistory(limit = 10) {
    return this.sessionHistory.slice(-limit);
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId) {
    // Try active sessions first
    try {
      const activeSession = await this.loadSessionData(sessionId, 'active');
      return activeSession;
    } catch {
      // Try completed sessions
      try {
        const completedSession = await this.loadSessionData(sessionId, 'completed');
        return completedSession;
      } catch {
        throw new Error(`Session ${sessionId} not found`);
      }
    }
  }

  /**
   * Generate analytics report
   */
  async generateAnalyticsReport(timeframe = '7d') {
    const sessions = await this.getAllSessions();
    const cutoffDate = this.getTimeframeCutoff(timeframe);
    
    const recentSessions = sessions.filter(s => 
      new Date(s.startTime) >= cutoffDate
    );

    const analytics = {
      timeframe,
      totalSessions: recentSessions.length,
      totalActivities: recentSessions.reduce((sum, s) => sum + s.metrics.totalActivities, 0),
      totalIssues: recentSessions.reduce((sum, s) => sum + s.metrics.issuesFound, 0),
      totalResolutions: recentSessions.reduce((sum, s) => sum + s.metrics.issuesResolved, 0),
      averageDuration: this.calculateAverageDuration(recentSessions),
      resolutionRate: 0,
      topIssueTypes: this.getTopIssueTypes(recentSessions),
      sessionsByDay: this.groupSessionsByDay(recentSessions),
      integrationUsage: this.getIntegrationUsage(recentSessions)
    };

    analytics.resolutionRate = analytics.totalIssues > 0 
      ? (analytics.totalResolutions / analytics.totalIssues * 100).toFixed(2)
      : 0;

    // Save report
    const reportPath = path.join(this.baseDir, 'reports', `analytics-${timeframe}-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(analytics, null, 2));

    return analytics;
  }

  /**
   * Document current session findings from requirements
   */
  async documentCurrentSessionFindings() {
    if (!this.currentSession) {
      await this.startSession({ 
        title: 'Requirements Document Analysis',
        description: 'Documenting findings from debugging requirements document'
      });
    }

    // Log previously resolved issues
    const resolvedIssues = [
      {
        name: 'Database Configuration Error',
        description: 'Supabase database connection and configuration issues',
        severity: 'critical',
        solution: 'Database configuration verified and corrected',
        status: 'FIXED'
      },
      {
        name: '24-Hour Parameter Missing',
        description: 'Missing time parameter in workflow execution',
        severity: 'medium',
        solution: 'Added proper time parameter handling',
        status: 'FIXED'
      },
      {
        name: 'Session API Key Recovery Issue',
        description: 'API key recovery mechanism not working properly',
        severity: 'high',
        solution: 'Implemented robust API key recovery system',
        status: 'RESOLVED'
      },
      {
        name: 'Environment Variable Access',
        description: 'Environment variables not properly accessible in workflows',
        severity: 'medium',
        solution: 'Environment variable access confirmed working',
        status: 'CONFIRMED WORKING'
      },
      {
        name: 'Notion Database Field Verification',
        description: 'Notion database fields and structure verification',
        severity: 'low',
        solution: 'All required fields confirmed present and accessible',
        status: 'CONFIRMED'
      },
      {
        name: 'Humanitix API Connectivity',
        description: 'Connectivity issues with Humanitix API endpoints',
        severity: 'medium',
        solution: 'API connectivity verified and working correctly',
        status: 'CONFIRMED WORKING'
      }
    ];

    // Log current failure point
    await this.logIssue(
      'Transform Orders → Check Order Duplicates',
      'Current workflow failure point in the order processing pipeline. Transform Orders step is not properly passing data to Check Order Duplicates step.',
      'high',
      {
        workflow: 'Order Processing Pipeline',
        step: 'Transform Orders → Check Order Duplicates',
        status: 'ACTIVE INVESTIGATION',
        notes: 'This is the current point of failure requiring immediate attention'
      }
    );

    // Log all resolved issues for historical tracking
    for (const issue of resolvedIssues) {
      const issueEntry = await this.logIssue(
        issue.name,
        issue.description,
        issue.severity,
        { historicalStatus: issue.status }
      );

      await this.logSolution(
        issueEntry.id,
        issue.solution,
        true,
        { historicalResolution: true, status: issue.status }
      );
    }

    // Log session documentation activity
    await this.logActivity(
      'documentation',
      'Documented all findings from requirements document analysis',
      {
        totalIssuesDocumented: resolvedIssues.length + 1,
        currentFailurePoint: 'Transform Orders → Check Order Duplicates',
        documentationSource: 'Requirements Document Analysis'
      }
    );

    console.log('📋 Current session findings documented:');
    console.log(`   - ${resolvedIssues.length} resolved issues logged`);
    console.log('   - 1 active failure point identified');
    console.log('   - Session ready for continued debugging');

    return this.currentSession;
  }

  // Private methods

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `debug-${timestamp}-${random}`;
  }

  /**
   * Save session data to disk
   */
  async saveSessionData(sessionId, data, type = 'active') {
    const sessionDir = path.join(this.baseDir, type, sessionId);
    const sessionFile = path.join(sessionDir, 'session.json');
    
    await fs.mkdir(sessionDir, { recursive: true });
    await fs.writeFile(sessionFile, JSON.stringify(data, null, 2));
  }

  /**
   * Load session data from disk
   */
  async loadSessionData(sessionId, type = 'active') {
    const sessionFile = path.join(this.baseDir, type, sessionId, 'session.json');
    const data = await fs.readFile(sessionFile, 'utf8');
    return JSON.parse(data);
  }

  /**
   * Load session history
   */
  async loadSessionHistory() {
    try {
      const completedDir = path.join(this.baseDir, 'completed');
      const sessions = await fs.readdir(completedDir);
      
      this.sessionHistory = [];
      for (const sessionId of sessions) {
        try {
          const session = await this.loadSessionData(sessionId, 'completed');
          this.sessionHistory.push(session);
        } catch (error) {
          console.warn(`Failed to load session ${sessionId}:`, error.message);
        }
      }
      
      // Sort by start time
      this.sessionHistory.sort((a, b) => 
        new Date(a.startTime) - new Date(b.startTime)
      );
    } catch (error) {
      console.warn('Failed to load session history:', error.message);
    }
  }

  /**
   * Get all sessions (active + completed)
   */
  async getAllSessions() {
    const sessions = [...this.sessionHistory];
    
    // Add current session if active
    if (this.currentSession) {
      sessions.push(this.currentSession);
    }
    
    return sessions;
  }

  /**
   * Generate session report
   */
  async generateSessionReport(session) {
    const report = {
      sessionId: session.id,
      title: session.title,
      duration: this.formatDuration(session.metrics.duration),
      summary: session.summary || 'No summary provided',
      metrics: session.metrics,
      activities: session.activities.map(a => ({
        type: a.type,
        description: a.description,
        timestamp: a.timestamp
      })),
      issues: session.issues.map(i => ({
        name: i.name,
        severity: i.severity,
        status: i.status,
        solutionsCount: i.solutions.length
      })),
      integrations: session.integrations,
      generatedAt: new Date().toISOString()
    };

    const reportPath = path.join(this.baseDir, 'reports', `session-${session.id}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    return report;
  }

  /**
   * Register with Knowledge Graph system
   */
  async registerWithKnowledgeGraph() {
    try {
      const kgScript = path.join(this.knowledgeGraphPath, 'claude-graph-integration.js');
      await fs.access(kgScript);
      
      // Knowledge Graph is available
      await this.logToKnowledgeGraph('system-integration', {
        system: 'debugging-session-tracker',
        status: 'online',
        timestamp: new Date().toISOString()
      });
    } catch {
      console.warn('Knowledge Graph system not available - continuing without integration');
    }
  }

  /**
   * Log to Knowledge Graph if available
   */
  async logToKnowledgeGraph(type, data) {
    try {
      const kgScript = path.join(this.knowledgeGraphPath, 'claude-graph-integration.js');
      
      return new Promise((resolve) => {
        const child = spawn('node', [kgScript, 'log-activity', type, JSON.stringify(data)], {
          stdio: 'ignore'
        });
        
        child.on('close', () => resolve());
        child.on('error', () => resolve()); // Fail silently if KG not available
      });
    } catch {
      // Fail silently if Knowledge Graph not available
    }
  }

  /**
   * Format duration in human-readable format
   */
  formatDuration(ms) {
    if (!ms) return 'Unknown';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Get timeframe cutoff date
   */
  getTimeframeCutoff(timeframe) {
    const now = new Date();
    const cutoffs = {
      '1d': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    };
    
    return cutoffs[timeframe] || cutoffs['7d'];
  }

  /**
   * Calculate average duration
   */
  calculateAverageDuration(sessions) {
    const completedSessions = sessions.filter(s => s.metrics.duration);
    if (completedSessions.length === 0) return 0;
    
    const totalDuration = completedSessions.reduce((sum, s) => sum + s.metrics.duration, 0);
    return Math.round(totalDuration / completedSessions.length);
  }

  /**
   * Get top issue types
   */
  getTopIssueTypes(sessions) {
    const issueTypes = {};
    
    sessions.forEach(session => {
      session.issues.forEach(issue => {
        const type = issue.metadata?.type || 'general';
        issueTypes[type] = (issueTypes[type] || 0) + 1;
      });
    });
    
    return Object.entries(issueTypes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
  }

  /**
   * Group sessions by day
   */
  groupSessionsByDay(sessions) {
    const days = {};
    
    sessions.forEach(session => {
      const day = new Date(session.startTime).toISOString().split('T')[0];
      days[day] = (days[day] || 0) + 1;
    });
    
    return days;
  }

  /**
   * Get integration usage statistics
   */
  getIntegrationUsage(sessions) {
    const usage = {
      knowledgeGraph: 0,
      n8nWorkflows: 0,
      supabaseQueries: 0,
      externalAPIs: 0
    };
    
    sessions.forEach(session => {
      if (session.integrations.knowledgeGraph) usage.knowledgeGraph++;
      usage.n8nWorkflows += session.integrations.n8nWorkflows.length;
      usage.supabaseQueries += session.integrations.supabaseQueries.length;
      usage.externalAPIs += session.integrations.externalAPIs.length;
    });
    
    return usage;
  }
}

// CLI interface
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  const tracker = new DebuggingSessionTracker();
  const command = process.argv[2];

  (async () => {
    try {
      switch (command) {
        case 'start':
          const title = process.argv[3] || 'Debugging Session';
          const description = process.argv[4] || '';
          const session = await tracker.startSession({ title, description });
          console.log(JSON.stringify(session, null, 2));
          break;

        case 'end':
          const summary = process.argv[3] || '';
          const endedSession = await tracker.endSession(summary);
          console.log(JSON.stringify(endedSession, null, 2));
          break;

        case 'activity':
          const type = process.argv[3];
          const activityDesc = process.argv[4];
          const metadata = process.argv[5] ? JSON.parse(process.argv[5]) : {};
          const activity = await tracker.logActivity(type, activityDesc, metadata);
          console.log(JSON.stringify(activity, null, 2));
          break;

        case 'issue':
          const name = process.argv[3];
          const issueDesc = process.argv[4];
          const severity = process.argv[5] || 'medium';
          const issue = await tracker.logIssue(name, issueDesc, severity);
          console.log(JSON.stringify(issue, null, 2));
          break;

        case 'solution':
          const issueId = process.argv[3];
          const solution = process.argv[4];
          const success = process.argv[5] !== 'false';
          const solutionEntry = await tracker.logSolution(issueId, solution, success);
          console.log(JSON.stringify(solutionEntry, null, 2));
          break;

        case 'status':
          const current = tracker.getCurrentSession();
          if (current) {
            console.log(JSON.stringify(current, null, 2));
          } else {
            console.log('No active session');
          }
          break;

        case 'history':
          const limit = parseInt(process.argv[3]) || 10;
          const history = await tracker.getSessionHistory(limit);
          console.log(JSON.stringify(history, null, 2));
          break;

        case 'analytics':
          const timeframe = process.argv[3] || '7d';
          const analytics = await tracker.generateAnalyticsReport(timeframe);
          console.log(JSON.stringify(analytics, null, 2));
          break;

        case 'document-findings':
          const documented = await tracker.documentCurrentSessionFindings();
          console.log(JSON.stringify(documented, null, 2));
          break;

        default:
          console.log(`
Debugging Session Tracker Usage:

Commands:
  start [title] [description]     - Start new debugging session
  end [summary]                   - End current session
  activity <type> <description>   - Log activity
  issue <name> <description> [severity] - Log issue
  solution <issueId> <solution> [success] - Log solution
  status                          - Show current session status
  history [limit]                 - Show session history
  analytics [timeframe]           - Generate analytics report
  document-findings               - Document current session findings

Examples:
  node debugging-session-tracker.js start "API Investigation" "Investigating webhook failures"
  node debugging-session-tracker.js activity "test" "Testing Humanitix API connection"
  node debugging-session-tracker.js issue "API Timeout" "Humanitix API calls timing out" "high"
  node debugging-session-tracker.js analytics "30d"
          `);
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  })();
}

export default DebuggingSessionTracker;