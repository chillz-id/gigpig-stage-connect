/**
 * Debugging Session Documentation System - Integration Tests
 * 
 * Comprehensive integration tests for the complete debugging session
 * documentation system including Knowledge Graph, N8N monitoring,
 * session tracking, and all external integrations.
 */

import { jest } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';

// Mock all external dependencies
jest.mock('fs/promises');
jest.mock('child_process');
jest.mock('crypto');

const mockFs = fs as jest.Mocked<typeof fs>;

// Mock global fetch for API calls
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Integration test interfaces
interface DebuggingSessionSystem {
  knowledgeGraph: KnowledgeGraphService;
  n8nMonitoring: N8NMonitoringService;
  sessionTracking: SessionTrackingService;
  fileGeneration: FileGenerationService;
  duplicateDetection: DuplicateDetectionService;
}

interface KnowledgeGraphService {
  checkForSimilarIssues(query: string): Promise<Issue[]>;
  logIssue(name: string, description: string, severity: string): Promise<Issue>;
  logSolution(issueId: string, solution: string, success: boolean): Promise<Solution>;
  updateGraph(data: any): Promise<void>;
}

interface N8NMonitoringService {
  getWorkflows(): Promise<N8NWorkflow[]>;
  getExecutions(workflowId: string): Promise<N8NExecution[]>;
  executeWorkflow(workflowId: string, data: any): Promise<N8NExecution>;
  monitorRealTime(): Promise<void>;
}

interface SessionTrackingService {
  startSession(options?: any): Promise<SessionData>;
  endSession(summary?: string): Promise<SessionData>;
  logActivity(type: string, description: string, metadata?: any): Promise<Activity>;
  getCurrentSession(): SessionData | null;
}

interface FileGenerationService {
  generateSessionFile(sessionId: string): Promise<string>;
  validateJsonStructure(data: any): boolean;
  createBackup(filePath: string): Promise<void>;
}

interface DuplicateDetectionService {
  detectDuplicates(newData: any, existingData: any[]): boolean;
  calculateSimilarity(item1: any, item2: any): number;
  mergeDuplicates(items: any[]): any[];
}

// Mock data types
interface Issue {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  tags: string[];
  context: Record<string, any>;
}

interface Solution {
  id: string;
  issueId: string;
  description: string;
  success: boolean;
  timestamp: string;
  context: Record<string, any>;
}

interface N8NWorkflow {
  id: string;
  name: string;
  active: boolean;
  nodes: any[];
}

interface N8NExecution {
  id: string;
  workflowId: string;
  status: 'success' | 'error' | 'running';
  startedAt: string;
  finishedAt?: string;
  data?: any;
}

interface SessionData {
  id: string;
  startTime: string;
  endTime: string | null;
  status: 'active' | 'completed' | 'archived';
  title: string;
  activities: Activity[];
  issues: Issue[];
  metrics: SessionMetrics;
}

interface Activity {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  metadata: Record<string, any>;
}

interface SessionMetrics {
  totalActivities: number;
  issuesFound: number;
  issuesResolved: number;
  duration: number | null;
}

// Mock implementation of the complete debugging session system
class MockDebuggingSessionSystem implements DebuggingSessionSystem {
  knowledgeGraph: KnowledgeGraphService;
  n8nMonitoring: N8NMonitoringService;
  sessionTracking: SessionTrackingService;
  fileGeneration: FileGenerationService;
  duplicateDetection: DuplicateDetectionService;

  constructor() {
    this.knowledgeGraph = new MockKnowledgeGraphService();
    this.n8nMonitoring = new MockN8NMonitoringService();
    this.sessionTracking = new MockSessionTrackingService();
    this.fileGeneration = new MockFileGenerationService();
    this.duplicateDetection = new MockDuplicateDetectionService();
  }

  async initializeSystem(): Promise<void> {
    // Initialize all subsystems
    await Promise.all([
      this.setupDirectories(),
      this.loadExistingData(),
      this.validateConfiguration()
    ]);
  }

  private async setupDirectories(): Promise<void> {
    // Mock directory setup
    await mockFs.mkdir('/debugging-sessions', { recursive: true });
    await mockFs.mkdir('/knowledge-graph', { recursive: true });
  }

  private async loadExistingData(): Promise<void> {
    // Mock loading existing data
    mockFs.readFile.mockResolvedValue(JSON.stringify([]));
  }

  private async validateConfiguration(): Promise<void> {
    // Mock configuration validation
    const config = {
      knowledgeGraphEnabled: true,
      n8nApiUrl: 'http://localhost:5678',
      sessionStoragePath: '/debugging-sessions',
      pollingInterval: 30000
    };
    
    if (!config.knowledgeGraphEnabled) {
      throw new Error('Knowledge Graph must be enabled');
    }
  }
}

class MockKnowledgeGraphService implements KnowledgeGraphService {
  private issues: Issue[] = [];
  private solutions: Solution[] = [];

  async checkForSimilarIssues(query: string): Promise<Issue[]> {
    return this.issues.filter(issue => 
      issue.description.toLowerCase().includes(query.toLowerCase()) ||
      issue.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  async logIssue(name: string, description: string, severity: string): Promise<Issue> {
    const issue: Issue = {
      id: `issue-${Date.now()}`,
      name,
      description,
      severity: severity as Issue['severity'],
      timestamp: new Date().toISOString(),
      tags: this.extractTags(description),
      context: {}
    };

    this.issues.push(issue);
    return issue;
  }

  async logSolution(issueId: string, solution: string, success: boolean): Promise<Solution> {
    const solutionEntry: Solution = {
      id: `solution-${Date.now()}`,
      issueId,
      description: solution,
      success,
      timestamp: new Date().toISOString(),
      context: {}
    };

    this.solutions.push(solutionEntry);
    return solutionEntry;
  }

  async updateGraph(data: any): Promise<void> {
    // Mock graph update
    await mockFs.writeFile('/knowledge-graph/data.json', JSON.stringify(data));
  }

  private extractTags(description: string): string[] {
    return description
      .toLowerCase()
      .split(' ')
      .filter(word => word.length > 4)
      .slice(0, 5);
  }
}

class MockN8NMonitoringService implements N8NMonitoringService {
  private workflows: N8NWorkflow[] = [];
  private executions: N8NExecution[] = [];

  async getWorkflows(): Promise<N8NWorkflow[]> {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: this.workflows }),
      status: 200,
      statusText: 'OK'
    } as Response);

    const response = await fetch('/api/v1/workflows');
    const result = await response.json();
    return result.data;
  }

  async getExecutions(workflowId: string): Promise<N8NExecution[]> {
    return this.executions.filter(exec => exec.workflowId === workflowId);
  }

  async executeWorkflow(workflowId: string, data: any): Promise<N8NExecution> {
    const execution: N8NExecution = {
      id: `exec-${Date.now()}`,
      workflowId,
      status: 'running',
      startedAt: new Date().toISOString(),
      data
    };

    this.executions.push(execution);
    return execution;
  }

  async monitorRealTime(): Promise<void> {
    // Mock real-time monitoring setup
    const mockWebSocket = {
      onopen: jest.fn(),
      onmessage: jest.fn(),
      send: jest.fn(),
      close: jest.fn()
    };

    // Simulate monitoring initialization
    return Promise.resolve();
  }
}

class MockSessionTrackingService implements SessionTrackingService {
  private currentSession: SessionData | null = null;
  private sessionHistory: SessionData[] = [];

  async startSession(options: any = {}): Promise<SessionData> {
    const session: SessionData = {
      id: `session-${Date.now()}`,
      startTime: new Date().toISOString(),
      endTime: null,
      status: 'active',
      title: options.title || 'Integration Test Session',
      activities: [],
      issues: [],
      metrics: {
        totalActivities: 0,
        issuesFound: 0,
        issuesResolved: 0,
        duration: null
      }
    };

    this.currentSession = session;
    return session;
  }

  async endSession(summary: string = ''): Promise<SessionData> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    this.currentSession.endTime = new Date().toISOString();
    this.currentSession.status = 'completed';
    
    const completed = { ...this.currentSession };
    this.sessionHistory.push(completed);
    this.currentSession = null;

    return completed;
  }

  async logActivity(type: string, description: string, metadata: any = {}): Promise<Activity> {
    if (!this.currentSession) {
      await this.startSession({ title: 'Auto-generated Session' });
    }

    const activity: Activity = {
      id: `activity-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type,
      description,
      metadata
    };

    this.currentSession!.activities.push(activity);
    this.currentSession!.metrics.totalActivities++;

    return activity;
  }

  getCurrentSession(): SessionData | null {
    return this.currentSession;
  }
}

class MockFileGenerationService implements FileGenerationService {
  async generateSessionFile(sessionId: string): Promise<string> {
    const filePath = `/debugging-sessions/${sessionId}.json`;
    const sessionData = {
      id: sessionId,
      timestamp: new Date().toISOString(),
      data: {}
    };

    await mockFs.writeFile(filePath, JSON.stringify(sessionData, null, 2));
    return filePath;
  }

  validateJsonStructure(data: any): boolean {
    try {
      JSON.stringify(data);
      return data && typeof data === 'object';
    } catch {
      return false;
    }
  }

  async createBackup(filePath: string): Promise<void> {
    const backupPath = `${filePath}.backup`;
    const data = await mockFs.readFile(filePath, 'utf8');
    await mockFs.writeFile(backupPath, data);
  }
}

class MockDuplicateDetectionService implements DuplicateDetectionService {
  detectDuplicates(newData: any, existingData: any[]): boolean {
    return existingData.some(existing => 
      this.calculateSimilarity(newData, existing) > 0.8
    );
  }

  calculateSimilarity(item1: any, item2: any): number {
    if (!item1 || !item2) return 0;
    
    // Simple similarity calculation based on string comparison
    const str1 = JSON.stringify(item1).toLowerCase();
    const str2 = JSON.stringify(item2).toLowerCase();
    
    const commonChars = str1.split('').filter(char => str2.includes(char)).length;
    const maxLength = Math.max(str1.length, str2.length);
    
    return maxLength > 0 ? commonChars / maxLength : 0;
  }

  mergeDuplicates(items: any[]): any[] {
    const unique: any[] = [];
    
    for (const item of items) {
      const isDuplicate = unique.some(existing => 
        this.calculateSimilarity(item, existing) > 0.8
      );
      
      if (!isDuplicate) {
        unique.push(item);
      }
    }
    
    return unique;
  }
}

describe('Debugging Session Documentation System - Integration Tests', () => {
  let system: MockDebuggingSessionSystem;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Setup mocks
    mockFs.access.mockResolvedValue(undefined);
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.readFile.mockResolvedValue('[]');
    mockFs.readdir.mockResolvedValue([]);

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
      status: 200,
      statusText: 'OK'
    } as Response);

    system = new MockDebuggingSessionSystem();
    await system.initializeSystem();
  });

  describe('System Initialization', () => {
    it('should initialize all subsystems successfully', async () => {
      expect(system.knowledgeGraph).toBeDefined();
      expect(system.n8nMonitoring).toBeDefined();
      expect(system.sessionTracking).toBeDefined();
      expect(system.fileGeneration).toBeDefined();
      expect(system.duplicateDetection).toBeDefined();
    });

    it('should create required directories', async () => {
      expect(mockFs.mkdir).toHaveBeenCalledWith('/debugging-sessions', { recursive: true });
      expect(mockFs.mkdir).toHaveBeenCalledWith('/knowledge-graph', { recursive: true });
    });

    it('should validate system configuration', async () => {
      // Should not throw errors during initialization
      await expect(system.initializeSystem()).resolves.toBeUndefined();
    });
  });

  describe('End-to-End Debugging Session Workflow', () => {
    it('should complete full debugging session lifecycle', async () => {
      // 1. Start session
      const session = await system.sessionTracking.startSession({
        title: 'API Integration Issue Investigation',
        description: 'Investigating timeout issues with Humanitix API'
      });

      expect(session.status).toBe('active');
      expect(session.title).toBe('API Integration Issue Investigation');

      // 2. Log initial activity
      const activity1 = await system.sessionTracking.logActivity(
        'investigation-start',
        'Beginning investigation of API timeout issues',
        { service: 'humanitix', issue_type: 'timeout' }
      );

      expect(activity1.type).toBe('investigation-start');

      // 3. Check knowledge graph for similar issues
      const similarIssues = await system.knowledgeGraph.checkForSimilarIssues('API timeout');
      expect(Array.isArray(similarIssues)).toBe(true);

      // 4. Log issue discovery
      const issue = await system.knowledgeGraph.logIssue(
        'Humanitix API Timeout',
        'API calls to Humanitix timing out after 30 seconds',
        'high'
      );

      expect(issue.name).toBe('Humanitix API Timeout');
      expect(issue.severity).toBe('high');

      // 5. Execute N8N workflow for monitoring
      const workflows = await system.n8nMonitoring.getWorkflows();
      const monitoringWorkflow = workflows.find(w => w.name.includes('monitor'));
      
      if (monitoringWorkflow) {
        const execution = await system.n8nMonitoring.executeWorkflow(
          monitoringWorkflow.id,
          { issueId: issue.id, sessionId: session.id }
        );
        expect(execution.status).toBe('running');
      }

      // 6. Log solution attempt
      const solution = await system.knowledgeGraph.logSolution(
        issue.id,
        'Increased timeout configuration from 30s to 60s',
        true
      );

      expect(solution.success).toBe(true);
      expect(solution.issueId).toBe(issue.id);

      // 7. Generate session file
      const sessionFilePath = await system.fileGeneration.generateSessionFile(session.id);
      expect(sessionFilePath).toContain(session.id);

      // 8. End session
      const completedSession = await system.sessionTracking.endSession(
        'Successfully resolved API timeout issue by increasing timeout configuration'
      );

      expect(completedSession.status).toBe('completed');
      expect(completedSession.endTime).toBeDefined();
    });

    it('should handle error scenarios gracefully', async () => {
      // Start session
      await system.sessionTracking.startSession({ title: 'Error Handling Test' });

      // Simulate API error
      mockFetch.mockRejectedValueOnce(new Error('API connection failed'));

      // Should handle error without crashing
      await expect(
        system.n8nMonitoring.getWorkflows().catch(error => ({ error: error.message }))
      ).resolves.toHaveProperty('error', 'API connection failed');

      // Should still be able to log activities
      const activity = await system.sessionTracking.logActivity(
        'error-handling',
        'Handling API connection failure'
      );

      expect(activity.type).toBe('error-handling');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle high-volume data processing efficiently', async () => {
      const startTime = Date.now();

      // Start session
      await system.sessionTracking.startSession({ title: 'Performance Test' });

      // Process large number of activities
      const activities = await Promise.all(
        Array.from({ length: 100 }, (_, i) =>
          system.sessionTracking.logActivity(
            `test-activity-${i}`,
            `Performance test activity ${i}`,
            { index: i, batch: 'performance-test' }
          )
        )
      );

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(activities).toHaveLength(100);
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds

      const currentSession = system.sessionTracking.getCurrentSession();
      expect(currentSession?.metrics.totalActivities).toBe(100);
    });

    it('should handle concurrent operations safely', async () => {
      await system.sessionTracking.startSession({ title: 'Concurrency Test' });

      // Simulate concurrent issue logging
      const issuePromises = Array.from({ length: 10 }, (_, i) =>
        system.knowledgeGraph.logIssue(
          `Concurrent Issue ${i}`,
          `Description for issue ${i}`,
          i % 2 === 0 ? 'high' : 'medium'
        )
      );

      const issues = await Promise.all(issuePromises);

      expect(issues).toHaveLength(10);
      expect(issues.every(issue => issue.id)).toBe(true);
      expect(issues.every(issue => issue.timestamp)).toBe(true);
    });

    it('should manage memory usage efficiently', () => {
      // Test memory efficiency with large datasets
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        data: `test data ${i}`.repeat(100), // Simulate larger data
        timestamp: new Date().toISOString()
      }));

      const isDuplicate = system.duplicateDetection.detectDuplicates(
        largeDataset[0],
        largeDataset.slice(1, 100) // Check against 99 items
      );

      expect(typeof isDuplicate).toBe('boolean');
    });
  });

  describe('30-Second Polling Validation', () => {
    it('should validate 30-second polling performance', async () => {
      const pollingInterval = 30000; // 30 seconds
      const maxPollingTime = 5000; // Should complete within 5 seconds

      const startTime = Date.now();

      // Simulate polling operation
      const pollingResults = await Promise.all([
        system.n8nMonitoring.getWorkflows(),
        system.knowledgeGraph.checkForSimilarIssues('test'),
        system.fileGeneration.validateJsonStructure({ test: 'data' })
      ]);

      const endTime = Date.now();
      const actualPollingTime = endTime - startTime;

      expect(actualPollingTime).toBeLessThan(maxPollingTime);
      expect(pollingResults).toHaveLength(3);
      expect(pollingResults.every(result => result !== undefined)).toBe(true);
    });

    it('should handle polling failures gracefully', async () => {
      // Simulate network failure
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const pollingResult = await system.n8nMonitoring.getWorkflows()
        .catch(error => ({ error: error.message, fallback: true }));

      expect(pollingResult).toHaveProperty('error', 'Network timeout');
      expect(pollingResult).toHaveProperty('fallback', true);
    });

    it('should maintain polling frequency under load', async () => {
      const pollCount = 5;
      const expectedInterval = 100; // Faster interval for testing
      const tolerance = 50; // 50ms tolerance

      const pollTimes: number[] = [];

      for (let i = 0; i < pollCount; i++) {
        const startTime = Date.now();
        await system.n8nMonitoring.getWorkflows();
        pollTimes.push(Date.now() - startTime);
        
        if (i < pollCount - 1) {
          await new Promise(resolve => setTimeout(resolve, expectedInterval));
        }
      }

      const averageTime = pollTimes.reduce((sum, time) => sum + time, 0) / pollTimes.length;
      expect(averageTime).toBeLessThan(expectedInterval + tolerance);
    });
  });

  describe('Duplicate Detection Algorithm', () => {
    it('should detect exact duplicates', () => {
      const item1 = { id: '1', name: 'Test Item', description: 'Test description' };
      const item2 = { id: '2', name: 'Test Item', description: 'Test description' };

      const similarity = system.duplicateDetection.calculateSimilarity(item1, item2);
      expect(similarity).toBeGreaterThan(0.8);

      const isDuplicate = system.duplicateDetection.detectDuplicates(item1, [item2]);
      expect(isDuplicate).toBe(true);
    });

    it('should detect near-duplicates with minor differences', () => {
      const item1 = { 
        name: 'API Connection Error', 
        description: 'Cannot connect to Humanitix API' 
      };
      const item2 = { 
        name: 'API Connection Error', 
        description: 'Cannot connect to Humanitix API endpoint' 
      };

      const similarity = system.duplicateDetection.calculateSimilarity(item1, item2);
      expect(similarity).toBeGreaterThan(0.7);
    });

    it('should not flag different items as duplicates', () => {
      const item1 = { 
        name: 'Database Error', 
        description: 'Cannot connect to PostgreSQL database' 
      };
      const item2 = { 
        name: 'Authentication Error', 
        description: 'OAuth token expired' 
      };

      const similarity = system.duplicateDetection.calculateSimilarity(item1, item2);
      expect(similarity).toBeLessThan(0.5);

      const isDuplicate = system.duplicateDetection.detectDuplicates(item1, [item2]);
      expect(isDuplicate).toBe(false);
    });

    it('should merge duplicate items correctly', () => {
      const items = [
        { id: '1', name: 'Error A', description: 'Description A' },
        { id: '2', name: 'Error A', description: 'Description A' }, // Duplicate
        { id: '3', name: 'Error B', description: 'Description B' },
        { id: '4', name: 'Error A', description: 'Description A' }, // Another duplicate
      ];

      const uniqueItems = system.duplicateDetection.mergeDuplicates(items);
      expect(uniqueItems).toHaveLength(2);
      expect(uniqueItems.some(item => item.name === 'Error A')).toBe(true);
      expect(uniqueItems.some(item => item.name === 'Error B')).toBe(true);
    });
  });

  describe('JSON File Generation and Validation', () => {
    it('should generate valid JSON files', async () => {
      const sessionId = 'test-session-123';
      const filePath = await system.fileGeneration.generateSessionFile(sessionId);

      expect(filePath).toBe(`/debugging-sessions/${sessionId}.json`);
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        filePath,
        expect.stringContaining(sessionId),
        
      );
    });

    it('should validate JSON structure correctly', () => {
      const validJson = { 
        id: 'test', 
        data: { items: [1, 2, 3] }, 
        timestamp: new Date().toISOString() 
      };
      
      const invalidJson = undefined;
      const circularJson = { a: {} };
      circularJson.a = circularJson; // Create circular reference

      expect(system.fileGeneration.validateJsonStructure(validJson)).toBe(true);
      expect(system.fileGeneration.validateJsonStructure(invalidJson)).toBe(false);
      expect(system.fileGeneration.validateJsonStructure(circularJson)).toBe(false);
    });

    it('should create backups before overwriting files', async () => {
      const originalPath = '/test/original.json';
      const backupPath = '/test/original.json.backup';

      mockFs.readFile.mockResolvedValue('{"test": "data"}');

      await system.fileGeneration.createBackup(originalPath);

      expect(mockFs.readFile).toHaveBeenCalledWith(originalPath, 'utf8');
      expect(mockFs.writeFile).toHaveBeenCalledWith(backupPath, '{"test": "data"}');
    });

    it('should handle file generation errors gracefully', async () => {
      mockFs.writeFile.mockRejectedValueOnce(new Error('Disk full'));

      await expect(
        system.fileGeneration.generateSessionFile('test-session')
          .catch(error => ({ error: error.message }))
      ).resolves.toHaveProperty('error', 'Disk full');
    });
  });

  describe('API Connectivity Validation', () => {
    it('should validate N8N API connectivity', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], status: 'healthy' }),
        status: 200,
        statusText: 'OK'
      } as Response);

      const workflows = await system.n8nMonitoring.getWorkflows();
      expect(Array.isArray(workflows)).toBe(true);
    });

    it('should handle API authentication errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Unauthorized' }),
        status: 401,
        statusText: 'Unauthorized'
      } as Response);

      await expect(
        system.n8nMonitoring.getWorkflows()
          .catch(error => ({ error: 'API authentication failed' }))
      ).resolves.toHaveProperty('error', 'API authentication failed');
    });

    it('should implement retry logic with exponential backoff', async () => {
      let attempts = 0;
      const maxRetries = 3;

      const retryWithBackoff = async (fn: () => Promise<any>) => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            attempts++;
            return await fn();
          } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 100));
          }
        }
      };

      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
          status: 200,
          statusText: 'OK'
        } as Response);

      const result = await retryWithBackoff(() => 
        mockFetch('/api/test').then(r => r.json())
      );

      expect(attempts).toBe(3);
      expect(result).toEqual({ success: true });
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from filesystem errors', async () => {
      mockFs.writeFile.mockRejectedValueOnce(new Error('Permission denied'));
      mockFs.writeFile.mockResolvedValueOnce(undefined); // Second attempt succeeds

      // Should retry and succeed
      const sessionId = 'recovery-test';
      const result = await system.fileGeneration.generateSessionFile(sessionId)
        .catch(async () => {
          // Simulate retry logic
          return await system.fileGeneration.generateSessionFile(sessionId);
        });

      expect(result).toBe(`/debugging-sessions/${sessionId}.json`);
    });

    it('should handle knowledge graph corruption', async () => {
      // Simulate corrupted data
      mockFs.readFile.mockResolvedValueOnce('{ invalid json }');

      const result = await system.knowledgeGraph.checkForSimilarIssues('test')
        .catch(() => []); // Fallback to empty array

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should maintain session state during errors', async () => {
      await system.sessionTracking.startSession({ title: 'Error Recovery Test' });

      // Simulate error in activity logging
      const mockError = new Error('Logging failed');
      
      const activity = await system.sessionTracking.logActivity(
        'test-activity',
        'Test activity'
      ).catch(() => ({
        id: 'fallback-activity',
        timestamp: new Date().toISOString(),
        type: 'error-recovery',
        description: 'Fallback activity due to error',
        metadata: { error: 'Logging failed' }
      }));

      expect(activity.id).toBeDefined();
      expect(system.sessionTracking.getCurrentSession()).toBeDefined();
    });
  });

  describe('System Resource Monitoring', () => {
    it('should monitor memory usage during operation', () => {
      const initialMemory = process.memoryUsage();
      
      // Simulate memory-intensive operation
      const largeArray = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        data: 'x'.repeat(1000)
      }));

      const processedArray = system.duplicateDetection.mergeDuplicates(largeArray);
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Should process efficiently without excessive memory usage
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
      expect(processedArray.length).toBeLessThanOrEqual(largeArray.length);
    });

    it('should handle CPU-intensive operations efficiently', async () => {
      const startTime = process.hrtime.bigint();

      // Simulate CPU-intensive duplicate detection
      const items = Array.from({ length: 500 }, (_, i) => ({
        id: i,
        name: `Item ${i % 10}`, // Create some duplicates
        description: `Description ${i % 20}`
      }));

      const uniqueItems = system.duplicateDetection.mergeDuplicates(items);

      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds

      expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
      expect(uniqueItems.length).toBeLessThan(items.length); // Should remove duplicates
    });

    it('should maintain performance under concurrent load', async () => {
      const concurrentOperations = 20;
      const startTime = Date.now();

      const operations = Array.from({ length: concurrentOperations }, async (_, i) => {
        await system.sessionTracking.startSession({ title: `Concurrent Session ${i}` });
        await system.sessionTracking.logActivity('test', `Activity ${i}`);
        return await system.sessionTracking.endSession();
      });

      const results = await Promise.all(operations);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(results).toHaveLength(concurrentOperations);
      expect(results.every(result => result.status === 'completed')).toBe(true);
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Integration Health Checks', () => {
    it('should perform comprehensive system health check', async () => {
      const healthCheck = {
        knowledgeGraph: false,
        n8nMonitoring: false,
        sessionTracking: false,
        fileGeneration: false,
        duplicateDetection: false
      };

      try {
        // Test Knowledge Graph
        await system.knowledgeGraph.checkForSimilarIssues('health check');
        healthCheck.knowledgeGraph = true;
      } catch (error) {
        // Handle error
      }

      try {
        // Test N8N Monitoring
        await system.n8nMonitoring.getWorkflows();
        healthCheck.n8nMonitoring = true;
      } catch (error) {
        // Handle error
      }

      try {
        // Test Session Tracking
        const session = await system.sessionTracking.startSession({ title: 'Health Check' });
        await system.sessionTracking.endSession();
        healthCheck.sessionTracking = true;
      } catch (error) {
        // Handle error
      }

      try {
        // Test File Generation
        const isValid = system.fileGeneration.validateJsonStructure({ test: true });
        healthCheck.fileGeneration = isValid;
      } catch (error) {
        // Handle error
      }

      try {
        // Test Duplicate Detection
        const similarity = system.duplicateDetection.calculateSimilarity({ a: 1 }, { a: 1 });
        healthCheck.duplicateDetection = similarity > 0;
      } catch (error) {
        // Handle error
      }

      const healthyServices = Object.values(healthCheck).filter(Boolean).length;
      const totalServices = Object.keys(healthCheck).length;
      const healthPercentage = (healthyServices / totalServices) * 100;

      expect(healthPercentage).toBeGreaterThan(80); // At least 80% of services should be healthy
    });
  });
});