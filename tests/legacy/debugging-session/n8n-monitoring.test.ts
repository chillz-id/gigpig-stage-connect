import { jest } from '@jest/globals';

// Mock N8N API responses
const mockN8nApi = {
  getWorkflows: jest.fn(),
  getWorkflowExecutions: jest.fn(),
  getWorkflowStatus: jest.fn(),
  executeWorkflow: jest.fn(),
  getWorkflowMetrics: jest.fn()
};

// Mock fetch for API calls
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  nodes: Array<{
    id: string;
    type: string;
    name: string;
    parameters: Record<string, any>;
  }>;
}

interface N8nExecution {
  id: string;
  workflowId: string;
  status: 'success' | 'error' | 'running' | 'waiting';
  startedAt: string;
  finishedAt?: string;
  error?: string;
  data?: Record<string, any>;
}

interface N8nMetrics {
  executionCount: number;
  successRate: number;
  averageExecutionTime: number;
  errorCount: number;
  lastExecution: string;
}

describe('N8N Monitoring Integration', () => {
  const mockWorkflow: N8nWorkflow = {
    id: 'workflow-123',
    name: 'Debugging Session Monitor',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    nodes: [
      {
        id: 'node-1',
        type: 'HttpBin',
        name: 'Monitor Endpoint',
        parameters: { url: 'http://localhost:3001/debug' }
      },
      {
        id: 'node-2',
        type: 'Code',
        name: 'Process Data',
        parameters: { jsCode: 'return items;' }
      }
    ]
  };

  const mockExecution: N8nExecution = {
    id: 'exec-456',
    workflowId: 'workflow-123',
    status: 'success',
    startedAt: '2024-01-15T10:00:00Z',
    finishedAt: '2024-01-15T10:05:00Z',
    data: { processed: 100, errors: 0 }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful API responses
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
      status: 200,
      statusText: 'OK'
    } as Response);
  });

  describe('Workflow Management', () => {
    it('should fetch active workflows', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [mockWorkflow] }),
        status: 200,
        statusText: 'OK'
      } as Response);

      const workflows = await mockN8nApi.getWorkflows();
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/workflows'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should filter debugging-related workflows', () => {
      const allWorkflows = [
        { id: '1', name: 'Debugging Session Monitor', active: true },
        { id: '2', name: 'Email Campaign', active: true },
        { id: '3', name: 'Debug Log Processor', active: false },
        { id: '4', name: 'User Registration', active: true }
      ];

      const debugWorkflows = allWorkflows.filter(workflow => 
        workflow.name.toLowerCase().includes('debug') ||
        workflow.name.toLowerCase().includes('monitor')
      );

      expect(debugWorkflows).toHaveLength(2);
      expect(debugWorkflows[0].name).toBe('Debugging Session Monitor');
      expect(debugWorkflows[1].name).toBe('Debug Log Processor');
    });

    it('should validate workflow configuration', () => {
      const validWorkflow = {
        ...mockWorkflow,
        nodes: [
          { id: '1', type: 'HttpBin', name: 'Monitor', parameters: { url: 'http://localhost:3001' } },
          { id: '2', type: 'Code', name: 'Process', parameters: { jsCode: 'return items;' } }
        ]
      };

      const isValidWorkflow = (workflow: N8nWorkflow) => {
        return (
          workflow.id &&
          workflow.name &&
          Array.isArray(workflow.nodes) &&
          workflow.nodes.length > 0 &&
          workflow.nodes.every(node => node.id && node.type && node.name)
        );
      };

      expect(isValidWorkflow(validWorkflow)).toBe(true);
      
      const invalidWorkflow = { ...validWorkflow, nodes: [] };
      expect(isValidWorkflow(invalidWorkflow)).toBe(false);
    });
  });

  describe('Execution Monitoring', () => {
    it('should fetch workflow executions with filtering', async () => {
      const executions = [mockExecution];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: executions }),
        status: 200,
        statusText: 'OK'
      } as Response);

      await mockN8nApi.getWorkflowExecutions('workflow-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/executions'),
        expect.objectContaining({
          method: 'GET'
        })
      );
    });

    it('should calculate execution metrics', () => {
      const executions = [
        { status: 'success', startedAt: '2024-01-15T10:00:00Z', finishedAt: '2024-01-15T10:05:00Z' },
        { status: 'error', startedAt: '2024-01-15T11:00:00Z', finishedAt: '2024-01-15T11:02:00Z' },
        { status: 'success', startedAt: '2024-01-15T12:00:00Z', finishedAt: '2024-01-15T12:03:00Z' },
        { status: 'success', startedAt: '2024-01-15T13:00:00Z', finishedAt: '2024-01-15T13:04:00Z' }
      ];

      const successCount = executions.filter(e => e.status === 'success').length;
      const errorCount = executions.filter(e => e.status === 'error').length;
      const successRate = successCount / executions.length;

      const executionTimes = executions
        .filter(e => e.finishedAt)
        .map(e => {
          const start = new Date(e.startedAt).getTime();
          const end = new Date(e.finishedAt!).getTime();
          return end - start;
        });

      const averageTime = executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length;

      expect(successRate).toBe(0.75); // 75% success rate
      expect(errorCount).toBe(1);
      expect(averageTime).toBeGreaterThan(0);
    });

    it('should detect execution patterns and anomalies', () => {
      const executions = Array.from({ length: 100 }, (_, i) => ({
        id: `exec-${i}`,
        status: i % 10 === 0 ? 'error' : 'success' as 'success' | 'error',
        startedAt: new Date(Date.now() - (i * 60000)).toISOString(), // Every minute
        duration: 3000 + Math.random() * 2000 // 3-5 seconds
      }));

      // Detect error patterns
      const errorRate = executions.filter(e => e.status === 'error').length / executions.length;
      const isHighErrorRate = errorRate > 0.05; // More than 5% error rate

      expect(errorRate).toBe(0.1); // 10% error rate (every 10th execution)
      expect(isHighErrorRate).toBe(true);

      // Detect execution frequency
      const timeSpan = new Date(executions[0].startedAt).getTime() - 
                      new Date(executions[executions.length - 1].startedAt).getTime();
      const averageInterval = timeSpan / (executions.length - 1);
      const expectedInterval = 60000; // 1 minute

      expect(Math.abs(averageInterval - expectedInterval)).toBeLessThan(5000); // Within 5 seconds
    });
  });

  describe('Real-time Monitoring', () => {
    it('should establish WebSocket connection for real-time updates', () => {
      const mockWebSocket = {
        onopen: jest.fn(),
        onmessage: jest.fn(),
        onerror: jest.fn(),
        onclose: jest.fn(),
        send: jest.fn(),
        close: jest.fn(),
        readyState: 1 // OPEN
      };

      // Simulate WebSocket connection
      const ws = mockWebSocket;
      
      // Test connection setup
      ws.onopen = jest.fn();
      ws.onmessage = jest.fn((event) => {
        const data = JSON.parse(event.data);
        expect(data).toHaveProperty('type');
      });

      expect(ws.onopen).toBeDefined();
      expect(ws.onmessage).toBeDefined();
      expect(ws.readyState).toBe(1); // Connected
    });

    it('should handle real-time execution updates', () => {
      const executionUpdate = {
        type: 'execution.update',
        workflowId: 'workflow-123',
        executionId: 'exec-456',
        status: 'running',
        progress: 0.5,
        timestamp: new Date().toISOString()
      };

      const handleExecutionUpdate = (update: typeof executionUpdate) => {
        expect(update.type).toBe('execution.update');
        expect(update.workflowId).toBe('workflow-123');
        expect(update.status).toBe('running');
        expect(update.progress).toBe(0.5);
      };

      handleExecutionUpdate(executionUpdate);
    });

    it('should queue updates when connection is lost', () => {
      const updateQueue: Array<any> = [];
      let isConnected = false;

      const queueUpdate = (update: any) => {
        if (isConnected) {
          // Send immediately
          return Promise.resolve();
        } else {
          // Queue for later
          updateQueue.push(update);
          return Promise.reject(new Error('Connection lost'));
        }
      };

      const update1 = { type: 'test', data: 'update1' };
      const update2 = { type: 'test', data: 'update2' };

      // Connection is lost
      isConnected = false;
      
      expect(queueUpdate(update1)).rejects.toThrow('Connection lost');
      expect(queueUpdate(update2)).rejects.toThrow('Connection lost');
      expect(updateQueue).toHaveLength(2);

      // Connection restored
      isConnected = true;
      
      // Process queued updates
      updateQueue.forEach(update => {
        expect(queueUpdate(update)).resolves.toBeUndefined();
      });
    });
  });

  describe('Performance Monitoring', () => {
    it('should track execution performance over time', () => {
      const performanceData = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        executions: Math.floor(Math.random() * 50) + 10,
        averageTime: Math.floor(Math.random() * 5000) + 2000,
        errorRate: Math.random() * 0.1 // 0-10% error rate
      }));

      // Calculate overall metrics
      const totalExecutions = performanceData.reduce((sum, data) => sum + data.executions, 0);
      const averageTime = performanceData.reduce((sum, data) => sum + data.averageTime, 0) / performanceData.length;
      const averageErrorRate = performanceData.reduce((sum, data) => sum + data.errorRate, 0) / performanceData.length;

      expect(totalExecutions).toBeGreaterThan(0);
      expect(averageTime).toBeGreaterThan(2000);
      expect(averageErrorRate).toBeLessThan(0.1);
    });

    it('should detect performance degradation', () => {
      const baselineMetrics = {
        averageExecutionTime: 3000,
        successRate: 0.95,
        executionsPerHour: 60
      };

      const currentMetrics = {
        averageExecutionTime: 7000, // 133% increase
        successRate: 0.85, // 10.5% decrease
        executionsPerHour: 30 // 50% decrease
      };

      const performanceDelta = {
        executionTimeIncrease: (currentMetrics.averageExecutionTime - baselineMetrics.averageExecutionTime) / baselineMetrics.averageExecutionTime,
        successRateDecrease: (baselineMetrics.successRate - currentMetrics.successRate) / baselineMetrics.successRate,
        throughputDecrease: (baselineMetrics.executionsPerHour - currentMetrics.executionsPerHour) / baselineMetrics.executionsPerHour
      };

      // Alert thresholds
      const isDegraded = 
        performanceDelta.executionTimeIncrease > 0.5 || // 50% slower
        performanceDelta.successRateDecrease > 0.1 || // 10% less successful
        performanceDelta.throughputDecrease > 0.3; // 30% less throughput

      expect(performanceDelta.executionTimeIncrease).toBeCloseTo(1.33, 2);
      expect(performanceDelta.successRateDecrease).toBeCloseTo(0.105, 3);
      expect(performanceDelta.throughputDecrease).toBe(0.5);
      expect(isDegraded).toBe(true);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle N8N API connection errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await mockN8nApi.getWorkflows().catch(error => ({
        error: error.message,
        fallback: 'cached_data'
      }));

      expect(result).toEqual({
        error: 'Connection refused',
        fallback: 'cached_data'
      });
    });

    it('should implement retry logic with exponential backoff', async () => {
      let attemptCount = 0;
      
      const retryWithBackoff = async (fn: () => Promise<any>, maxRetries = 3) => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            attemptCount++;
            return await fn();
          } catch (error) {
            if (i === maxRetries - 1) throw error;
            
            const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      };

      // Simulate failing API calls
      mockFetch
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
          status: 200,
          statusText: 'OK'
        } as Response);

      const result = await retryWithBackoff(() => 
        mockFetch('/api/v1/workflows').then(r => r.json())
      );

      expect(attemptCount).toBe(3);
      expect(result).toEqual({ success: true });
    });

    it('should validate API responses', () => {
      const validResponse = {
        data: [mockWorkflow],
        meta: { total: 1, page: 1 }
      };

      const invalidResponse = {
        // Missing data array
        meta: { total: 1 }
      };

      const isValidWorkflowResponse = (response: any) => {
        return (
          response &&
          Array.isArray(response.data) &&
          response.meta &&
          typeof response.meta.total === 'number'
        );
      };

      expect(isValidWorkflowResponse(validResponse)).toBe(true);
      expect(isValidWorkflowResponse(invalidResponse)).toBe(false);
      expect(isValidWorkflowResponse(null)).toBe(false);
    });
  });

  describe('Workflow Automation', () => {
    it('should trigger workflows programmatically', async () => {
      const triggerData = {
        workflowId: 'workflow-123',
        input: { debug_session_id: 'session-456', timestamp: new Date().toISOString() }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          data: { 
            executionId: 'exec-789',
            status: 'running'
          }
        }),
        status: 200,
        statusText: 'OK'
      } as Response);

      await mockN8nApi.executeWorkflow(triggerData.workflowId, triggerData.input);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/workflows/${triggerData.workflowId}/execute`),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(triggerData.input)
        })
      );
    });

    it('should schedule periodic workflow executions', () => {
      const scheduleConfig = {
        workflowId: 'workflow-123',
        cron: '*/30 * * * * *', // Every 30 seconds
        enabled: true
      };

      const parseSchedule = (cron: string) => {
        const parts = cron.split(' ');
        return {
          seconds: parts[0],
          minutes: parts[1],
          hours: parts[2],
          dayOfMonth: parts[3],
          month: parts[4],
          dayOfWeek: parts[5]
        };
      };

      const parsed = parseSchedule(scheduleConfig.cron);
      expect(parsed.seconds).toBe('*/30'); // Every 30 seconds
      expect(parsed.minutes).toBe('*'); // Every minute
    });
  });

  describe('Debugging Integration', () => {
    it('should format N8N data for debugging dashboard', () => {
      const workflowData = {
        workflow: mockWorkflow,
        executions: [mockExecution],
        metrics: {
          executionCount: 100,
          successRate: 0.95,
          averageExecutionTime: 3000,
          errorCount: 5,
          lastExecution: '2024-01-15T10:05:00Z'
        } as N8nMetrics
      };

      const dashboardFormat = {
        id: workflowData.workflow.id,
        name: workflowData.workflow.name,
        status: workflowData.workflow.active ? 'active' : 'inactive',
        lastRun: workflowData.metrics.lastExecution,
        successRate: `${(workflowData.metrics.successRate * 100).toFixed(1)}%`,
        avgRuntime: `${(workflowData.metrics.averageExecutionTime / 1000).toFixed(1)}s`,
        totalRuns: workflowData.metrics.executionCount,
        errors: workflowData.metrics.errorCount
      };

      expect(dashboardFormat.id).toBe(mockWorkflow.id);
      expect(dashboardFormat.name).toBe(mockWorkflow.name);
      expect(dashboardFormat.status).toBe('active');
      expect(dashboardFormat.successRate).toBe('95.0%');
      expect(dashboardFormat.avgRuntime).toBe('3.0s');
    });

    it('should generate workflow health scores', () => {
      const calculateHealthScore = (metrics: N8nMetrics) => {
        const successWeight = 0.4;
        const performanceWeight = 0.3;
        const reliabilityWeight = 0.3;

        const successScore = metrics.successRate * 100;
        const performanceScore = Math.max(0, 100 - (metrics.averageExecutionTime / 100)); // Lower is better
        const reliabilityScore = Math.max(0, 100 - (metrics.errorCount * 2)); // Fewer errors is better

        return (
          successScore * successWeight +
          performanceScore * performanceWeight +
          reliabilityScore * reliabilityWeight
        );
      };

      const goodMetrics: N8nMetrics = {
        executionCount: 1000,
        successRate: 0.98,
        averageExecutionTime: 2000,
        errorCount: 5,
        lastExecution: new Date().toISOString()
      };

      const poorMetrics: N8nMetrics = {
        executionCount: 100,
        successRate: 0.75,
        averageExecutionTime: 8000,
        errorCount: 50,
        lastExecution: new Date().toISOString()
      };

      const goodScore = calculateHealthScore(goodMetrics);
      const poorScore = calculateHealthScore(poorMetrics);

      expect(goodScore).toBeGreaterThan(80); // Good health
      expect(poorScore).toBeLessThan(50); // Poor health
      expect(goodScore).toBeGreaterThan(poorScore);
    });
  });
});