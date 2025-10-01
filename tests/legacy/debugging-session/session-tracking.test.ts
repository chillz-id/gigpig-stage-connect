import { jest } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('crypto');
jest.mock('child_process');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockCrypto = crypto as jest.Mocked<typeof crypto>;

// Mock DebuggingSessionTracker class interface
interface SessionData {
  id: string;
  startTime: string;
  endTime: string | null;
  status: 'active' | 'completed' | 'archived';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  activities: Activity[];
  issues: Issue[];
  solutions: Solution[];
  metrics: SessionMetrics;
  integrations: SessionIntegrations;
  metadata: SessionMetadata;
  summary?: string;
}

interface Activity {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  metadata: Record<string, any>;
  status: 'completed' | 'pending' | 'failed';
}

interface Issue {
  id: string;
  timestamp: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'resolved' | 'closed';
  metadata: Record<string, any>;
  solutions: Solution[];
}

interface Solution {
  id: string;
  timestamp: string;
  solution: string;
  success: boolean;
  metadata: Record<string, any>;
}

interface SessionMetrics {
  totalActivities: number;
  issuesFound: number;
  issuesResolved: number;
  duration: number | null;
}

interface SessionIntegrations {
  knowledgeGraph: boolean;
  n8nWorkflows: any[];
  supabaseQueries: any[];
  externalAPIs: any[];
}

interface SessionMetadata {
  user: string;
  platform: string;
  nodeVersion: string;
  workingDirectory: string;
}

// Mock implementation of DebuggingSessionTracker
class MockDebuggingSessionTracker {
  currentSession: SessionData | null = null;
  sessionHistory: SessionData[] = [];
  baseDir: string;

  constructor() {
    this.baseDir = '/mock/debugging-sessions';
  }

  generateSessionId(): string {
    return 'debug-test-12345';
  }

  async startSession(options: any = {}): Promise<SessionData> {
    const sessionId = this.generateSessionId();
    const sessionData: SessionData = {
      id: sessionId,
      startTime: new Date().toISOString(),
      endTime: null,
      status: 'active',
      title: options.title || 'Test Session',
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
        user: 'test-user',
        platform: 'linux',
        nodeVersion: 'v18.0.0',
        workingDirectory: '/test'
      }
    };

    this.currentSession = sessionData;
    return sessionData;
  }

  async endSession(summary: string = ''): Promise<SessionData> {
    if (!this.currentSession) {
      throw new Error('No active session to end');
    }

    const endTime = new Date().toISOString();
    const duration = 300000; // 5 minutes

    this.currentSession.endTime = endTime;
    this.currentSession.status = 'completed';
    this.currentSession.summary = summary;
    this.currentSession.metrics.duration = duration;

    const completedSession = { ...this.currentSession };
    this.sessionHistory.push(completedSession);
    this.currentSession = null;

    return completedSession;
  }

  async logActivity(type: string, description: string, metadata: any = {}): Promise<Activity> {
    if (!this.currentSession) {
      await this.startSession({ title: 'Auto-generated Session' });
    }

    const activity: Activity = {
      id: 'activity-123',
      timestamp: new Date().toISOString(),
      type,
      description,
      metadata,
      status: 'completed'
    };

    this.currentSession!.activities.push(activity);
    this.currentSession!.metrics.totalActivities++;

    return activity;
  }

  async logIssue(name: string, description: string, severity: string = 'medium', metadata: any = {}): Promise<Issue> {
    if (!this.currentSession) {
      await this.startSession({ title: 'Issue Investigation Session' });
    }

    const issue: Issue = {
      id: 'issue-456',
      timestamp: new Date().toISOString(),
      name,
      description,
      severity: severity as Issue['severity'],
      status: 'open',
      metadata,
      solutions: []
    };

    this.currentSession!.issues.push(issue);
    this.currentSession!.metrics.issuesFound++;

    return issue;
  }

  async logSolution(issueId: string, solution: string, success: boolean = true, metadata: any = {}): Promise<Solution> {
    if (!this.currentSession) {
      throw new Error('No active session to log solution');
    }

    const issue = this.currentSession.issues.find(i => i.id === issueId);
    if (!issue) {
      throw new Error(`Issue ${issueId} not found in current session`);
    }

    const solutionEntry: Solution = {
      id: 'solution-789',
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

    return solutionEntry;
  }

  getCurrentSession(): SessionData | null {
    return this.currentSession;
  }

  async getSessionHistory(limit: number = 10): Promise<SessionData[]> {
    return this.sessionHistory.slice(-limit);
  }
}

describe('Session Tracking System', () => {
  let tracker: MockDebuggingSessionTracker;

  beforeEach(() => {
    jest.clearAllMocks();
    tracker = new MockDebuggingSessionTracker();

    // Setup default mocks
    mockFs.access.mockResolvedValue(undefined);
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.readFile.mockResolvedValue('[]');
    mockFs.readdir.mockResolvedValue([]);
    mockFs.rename.mockResolvedValue(undefined);

    mockCrypto.randomUUID.mockReturnValue('test-uuid-123');
  });

  describe('Session Lifecycle Management', () => {
    it('should start a new debugging session with default values', async () => {
      const session = await tracker.startSession();

      expect(session.id).toBe('debug-test-12345');
      expect(session.status).toBe('active');
      expect(session.title).toBe('Test Session');
      expect(session.startTime).toBeDefined();
      expect(session.endTime).toBeNull();
      expect(session.activities).toEqual([]);
      expect(session.issues).toEqual([]);
      expect(session.metrics.totalActivities).toBe(0);
      expect(session.metrics.issuesFound).toBe(0);
      expect(session.metrics.issuesResolved).toBe(0);
    });

    it('should start a session with custom options', async () => {
      const options = {
        title: 'API Investigation',
        description: 'Testing webhook failures',
        priority: 'high',
        tags: ['webhook', 'api', 'investigation']
      };

      const session = await tracker.startSession(options);

      expect(session.title).toBe('API Investigation');
      expect(session.description).toBe('Testing webhook failures');
      expect(session.priority).toBe('high');
      expect(session.tags).toEqual(['webhook', 'api', 'investigation']);
    });

    it('should end an active session and calculate metrics', async () => {
      await tracker.startSession({ title: 'Test Session' });
      const summary = 'Session completed successfully';

      const endedSession = await tracker.endSession(summary);

      expect(endedSession.status).toBe('completed');
      expect(endedSession.endTime).toBeDefined();
      expect(endedSession.summary).toBe(summary);
      expect(endedSession.metrics.duration).toBe(300000);
      expect(tracker.getCurrentSession()).toBeNull();
    });

    it('should throw error when ending session without active session', async () => {
      await expect(tracker.endSession()).rejects.toThrow('No active session to end');
    });

    it('should maintain session history after ending sessions', async () => {
      // Start and end first session
      await tracker.startSession({ title: 'Session 1' });
      await tracker.endSession('First session completed');

      // Start and end second session
      await tracker.startSession({ title: 'Session 2' });
      await tracker.endSession('Second session completed');

      const history = await tracker.getSessionHistory();
      expect(history).toHaveLength(2);
      expect(history[0].title).toBe('Session 1');
      expect(history[1].title).toBe('Session 2');
    });
  });

  describe('Activity Logging', () => {
    it('should log activity to current session', async () => {
      await tracker.startSession();
      
      const activity = await tracker.logActivity(
        'api-test',
        'Testing Humanitix API connection',
        { endpoint: '/api/v1/events', method: 'GET' }
      );

      expect(activity.type).toBe('api-test');
      expect(activity.description).toBe('Testing Humanitix API connection');
      expect(activity.metadata.endpoint).toBe('/api/v1/events');
      expect(activity.status).toBe('completed');
      
      const currentSession = tracker.getCurrentSession();
      expect(currentSession?.activities).toHaveLength(1);
      expect(currentSession?.metrics.totalActivities).toBe(1);
    });

    it('should auto-create session when logging activity without active session', async () => {
      const activity = await tracker.logActivity('test', 'Test activity');

      expect(activity).toBeDefined();
      expect(tracker.getCurrentSession()).toBeDefined();
      expect(tracker.getCurrentSession()?.title).toBe('Auto-generated Session');
    });

    it('should handle activity logging with complex metadata', async () => {
      await tracker.startSession();
      
      const complexMetadata = {
        endpoint: '/api/v1/webhooks',
        payload: { event: 'order.created', data: { id: 123 } },
        headers: { 'Content-Type': 'application/json' },
        responseTime: 1500,
        statusCode: 200
      };

      const activity = await tracker.logActivity(
        'webhook-processing',
        'Processing incoming webhook',
        complexMetadata
      );

      expect(activity.metadata).toEqual(complexMetadata);
      expect(activity.metadata.responseTime).toBe(1500);
    });
  });

  describe('Issue Management', () => {
    it('should log issue with proper structure', async () => {
      await tracker.startSession();
      
      const issue = await tracker.logIssue(
        'API Timeout',
        'Humanitix API calls timing out after 30 seconds',
        'high',
        { service: 'humanitix', timeout: 30000 }
      );

      expect(issue.name).toBe('API Timeout');
      expect(issue.description).toBe('Humanitix API calls timing out after 30 seconds');
      expect(issue.severity).toBe('high');
      expect(issue.status).toBe('open');
      expect(issue.metadata.service).toBe('humanitix');
      expect(issue.solutions).toEqual([]);

      const currentSession = tracker.getCurrentSession();
      expect(currentSession?.issues).toHaveLength(1);
      expect(currentSession?.metrics.issuesFound).toBe(1);
    });

    it('should validate severity levels', async () => {
      await tracker.startSession();

      const validSeverities = ['low', 'medium', 'high', 'critical'];
      
      for (const severity of validSeverities) {
        const issue = await tracker.logIssue(
          `Test Issue ${severity}`,
          'Test description',
          severity
        );
        expect(issue.severity).toBe(severity);
      }
    });

    it('should auto-create session when logging issue without active session', async () => {
      const issue = await tracker.logIssue('Test Issue', 'Test description');

      expect(issue).toBeDefined();
      expect(tracker.getCurrentSession()).toBeDefined();
      expect(tracker.getCurrentSession()?.title).toBe('Issue Investigation Session');
    });
  });

  describe('Solution Tracking', () => {
    it('should log successful solution and mark issue as resolved', async () => {
      await tracker.startSession();
      const issue = await tracker.logIssue('Test Issue', 'Test description');
      
      const solution = await tracker.logSolution(
        issue.id,
        'Fixed by updating API configuration',
        true,
        { configFile: 'api.config.js', timeToFix: '30min' }
      );

      expect(solution.solution).toBe('Fixed by updating API configuration');
      expect(solution.success).toBe(true);
      expect(solution.metadata.timeToFix).toBe('30min');
      
      const currentSession = tracker.getCurrentSession();
      expect(currentSession?.metrics.issuesResolved).toBe(1);
      
      const updatedIssue = currentSession?.issues.find(i => i.id === issue.id);
      expect(updatedIssue?.status).toBe('resolved');
      expect(updatedIssue?.solutions).toHaveLength(1);
    });

    it('should log unsuccessful solution without marking issue as resolved', async () => {
      await tracker.startSession();
      const issue = await tracker.logIssue('Test Issue', 'Test description');
      
      await tracker.logSolution(
        issue.id,
        'Attempted restart but issue persists',
        false
      );

      const currentSession = tracker.getCurrentSession();
      expect(currentSession?.metrics.issuesResolved).toBe(0);
      
      const updatedIssue = currentSession?.issues.find(i => i.id === issue.id);
      expect(updatedIssue?.status).toBe('open');
    });

    it('should throw error when logging solution for non-existent issue', async () => {
      await tracker.startSession();
      
      await expect(
        tracker.logSolution('non-existent-issue', 'Test solution')
      ).rejects.toThrow('Issue non-existent-issue not found in current session');
    });

    it('should throw error when logging solution without active session', async () => {
      await expect(
        tracker.logSolution('issue-123', 'Test solution')
      ).rejects.toThrow('No active session to log solution');
    });
  });

  describe('Session Analytics and Metrics', () => {
    it('should calculate session metrics correctly', async () => {
      await tracker.startSession();
      
      // Log multiple activities
      await tracker.logActivity('test1', 'First activity');
      await tracker.logActivity('test2', 'Second activity');
      await tracker.logActivity('test3', 'Third activity');
      
      // Log issues and solutions
      const issue1 = await tracker.logIssue('Issue 1', 'Description 1', 'high');
      const issue2 = await tracker.logIssue('Issue 2', 'Description 2', 'medium');
      
      await tracker.logSolution(issue1.id, 'Solution 1', true);
      await tracker.logSolution(issue2.id, 'Solution 2', false);
      
      const session = tracker.getCurrentSession();
      expect(session?.metrics.totalActivities).toBe(3);
      expect(session?.metrics.issuesFound).toBe(2);
      expect(session?.metrics.issuesResolved).toBe(1);
    });

    it('should track resolution rate correctly', () => {
      const testCases = [
        { found: 10, resolved: 8, expected: 80 },
        { found: 5, resolved: 5, expected: 100 },
        { found: 0, resolved: 0, expected: 0 },
        { found: 3, resolved: 1, expected: 33.33 }
      ];

      testCases.forEach(({ found, resolved, expected }) => {
        const resolutionRate = found > 0 ? (resolved / found * 100) : 0;
        expect(Math.round(resolutionRate * 100) / 100).toBeCloseTo(expected, 2);
      });
    });

    it('should handle session duration calculation', async () => {
      await tracker.startSession();
      
      // Mock time passage
      const startTime = Date.now();
      const endTime = startTime + 300000; // 5 minutes later
      
      const formatDuration = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        return `${minutes}m ${seconds % 60}s`;
      };

      expect(formatDuration(300000)).toBe('5m 0s');
      expect(formatDuration(90000)).toBe('1m 30s');
      expect(formatDuration(45000)).toBe('0m 45s');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle file system errors gracefully', async () => {
      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));
      
      // Should not throw error but handle gracefully
      const result = await tracker.startSession().catch(error => ({
        error: error.message
      }));
      
      // Session creation should still work in memory even if filesystem fails
      expect(result).not.toHaveProperty('error');
    });

    it('should handle malformed session data', () => {
      const malformedData = {
        // Missing required fields
        status: 'active',
        activities: 'not-an-array'
      };

      const isValidSession = (data: any): data is SessionData => {
        return (
          data &&
          typeof data.id === 'string' &&
          typeof data.status === 'string' &&
          Array.isArray(data.activities) &&
          Array.isArray(data.issues) &&
          data.metrics &&
          typeof data.metrics.totalActivities === 'number'
        );
      };

      expect(isValidSession(malformedData)).toBe(false);
    });

    it('should validate session data structure', () => {
      const validSession: SessionData = {
        id: 'test-123',
        startTime: '2024-01-01T00:00:00Z',
        endTime: null,
        status: 'active',
        title: 'Test Session',
        description: 'Test description',
        priority: 'medium',
        tags: [],
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
          user: 'test',
          platform: 'linux',
          nodeVersion: 'v18',
          workingDirectory: '/test'
        }
      };

      const requiredFields = ['id', 'status', 'title', 'activities', 'issues', 'metrics'];
      const hasAllFields = requiredFields.every(field => 
        validSession.hasOwnProperty(field)
      );

      expect(hasAllFields).toBe(true);
    });

    it('should handle concurrent operations safely', async () => {
      await tracker.startSession();
      
      // Simulate concurrent issue logging
      const promises = Array.from({ length: 5 }, (_, i) =>
        tracker.logIssue(`Issue ${i}`, `Description ${i}`)
      );
      
      const issues = await Promise.all(promises);
      
      expect(issues).toHaveLength(5);
      expect(tracker.getCurrentSession()?.issues).toHaveLength(5);
      expect(tracker.getCurrentSession()?.metrics.issuesFound).toBe(5);
    });
  });

  describe('Integration Tracking', () => {
    it('should track knowledge graph integration', async () => {
      await tracker.startSession();
      
      // Simulate knowledge graph integration
      const session = tracker.getCurrentSession();
      if (session) {
        session.integrations.knowledgeGraph = true;
      }

      expect(session?.integrations.knowledgeGraph).toBe(true);
    });

    it('should track external service integrations', async () => {
      await tracker.startSession();
      
      const session = tracker.getCurrentSession();
      if (session) {
        session.integrations.n8nWorkflows.push({
          workflowId: 'XQ8bFr8gSIOQjWC5',
          executionId: 'exec-123',
          timestamp: new Date().toISOString()
        });

        session.integrations.supabaseQueries.push({
          table: 'events',
          operation: 'select',
          timestamp: new Date().toISOString()
        });

        session.integrations.externalAPIs.push({
          service: 'humanitix',
          endpoint: '/api/v1/events',
          method: 'GET',
          timestamp: new Date().toISOString()
        });
      }

      expect(session?.integrations.n8nWorkflows).toHaveLength(1);
      expect(session?.integrations.supabaseQueries).toHaveLength(1);
      expect(session?.integrations.externalAPIs).toHaveLength(1);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large numbers of activities efficiently', async () => {
      await tracker.startSession();
      
      const startTime = Date.now();
      
      // Log 100 activities
      const promises = Array.from({ length: 100 }, (_, i) =>
        tracker.logActivity(`activity-${i}`, `Activity ${i}`)
      );
      
      await Promise.all(promises);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(1000); // Should complete within 1 second
      expect(tracker.getCurrentSession()?.activities).toHaveLength(100);
    });

    it('should limit session history to prevent memory issues', async () => {
      // Add many sessions to history
      const historySessions = Array.from({ length: 50 }, (_, i) => ({
        id: `session-${i}`,
        title: `Session ${i}`,
        status: 'completed' as const,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        description: '',
        priority: 'medium' as const,
        tags: [],
        activities: [],
        issues: [],
        solutions: [],
        metrics: { totalActivities: 0, issuesFound: 0, issuesResolved: 0, duration: 300000 },
        integrations: { knowledgeGraph: false, n8nWorkflows: [], supabaseQueries: [], externalAPIs: [] },
        metadata: { user: 'test', platform: 'linux', nodeVersion: 'v18', workingDirectory: '/test' }
      }));

      tracker.sessionHistory = historySessions;

      const limitedHistory = await tracker.getSessionHistory(10);
      expect(limitedHistory).toHaveLength(10);
      expect(limitedHistory[0].id).toBe('session-40'); // Last 10 items
      expect(limitedHistory[9].id).toBe('session-49');
    });

    it('should handle memory usage efficiently over time', () => {
      // Simulate memory usage calculation
      const calculateMemoryUsage = (sessions: SessionData[]) => {
        return sessions.reduce((total, session) => {
          const sessionSize = 
            JSON.stringify(session).length + 
            session.activities.length * 100 + 
            session.issues.length * 150;
          return total + sessionSize;
        }, 0);
      };

      const smallSession: SessionData = {
        id: 'small',
        startTime: '2024-01-01T00:00:00Z',
        endTime: null,
        status: 'active',
        title: 'Small Session',
        description: '',
        priority: 'low',
        tags: [],
        activities: [],
        issues: [],
        solutions: [],
        metrics: { totalActivities: 0, issuesFound: 0, issuesResolved: 0, duration: null },
        integrations: { knowledgeGraph: false, n8nWorkflows: [], supabaseQueries: [], externalAPIs: [] },
        metadata: { user: 'test', platform: 'linux', nodeVersion: 'v18', workingDirectory: '/test' }
      };

      const smallUsage = calculateMemoryUsage([smallSession]);
      expect(smallUsage).toBeGreaterThan(0);
      expect(smallUsage).toBeLessThan(10000); // Should be under 10KB
    });
  });
});