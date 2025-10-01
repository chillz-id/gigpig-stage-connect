#!/usr/bin/env node
/**
 * N8N Debugging Monitoring System
 * Continuous monitoring with 30-second polling intervals
 * Tracks specific workflow ID: XQ8bFr8gSIOQjWC5
 * Auto-logs findings to Knowledge Graph
 * 
 * Features:
 * - Real-time workflow execution monitoring
 * - Node-level execution progress tracking  
 * - Automatic Knowledge Graph integration
 * - Transform Orders → Check Order Duplicates failure detection
 * - Performance metrics and timing analysis
 * - Background service capability
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// Handle __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import Knowledge Graph integration (CommonJS module)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ClaudeGraphIntegration = require('/root/.claude-multi-agent/scripts/claude-graph-integration.js');

class N8NDebugMonitor {
  constructor(options = {}) {
    // N8N Configuration
    this.apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzYWYzNjQ3ZC1hMTQzLTQ3MzctOWI3Yi0zMDVkNGM4ZmE4NTYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1Nzg5NjQ4fQ.jIPgXdpfgkUOa4We46nfaN-NgaHh4TbQIjGcwU5K57I';
    this.baseUrl = 'http://localhost:5678/api/v1';
    
    // Multi-workflow Configuration
    this.monitoringStrategy = options.strategy || 'single'; // 'single', 'all', 'active', 'selective'
    this.targetWorkflowId = options.workflowId || 'XQ8bFr8gSIOQjWC5'; // For backward compatibility
    this.monitoredWorkflows = new Map(); // workflowId -> WorkflowConfig
    this.workflowFilters = options.filters || {};
    
    // Monitoring Configuration
    this.pollingInterval = options.pollingInterval || 30000; // 30 seconds
    this.pollingIntervals = {
      critical: options.criticalInterval || 15000,    // 15 seconds
      standard: options.standardInterval || 30000,    // 30 seconds
      inactive: options.inactiveInterval || 300000    // 5 minutes
    };
    this.isMonitoring = false;
    this.executionHistory = new Map(); // workflowId -> Map<executionId, status>
    this.nodeFailurePatterns = new Map(); // workflowId -> Map<pattern, count>
    this.globalPatterns = new Map(); // Global failure patterns across all workflows
    
    // Performance limits
    this.limits = {
      maxConcurrentRequests: options.maxConcurrentRequests || 5,
      maxExecutionHistory: options.maxExecutionHistory || 1000,
      maxWorkflows: options.maxWorkflows || 50
    };
    
    // Knowledge Graph Integration
    this.kg = new ClaudeGraphIntegration();
    
    // API Headers
    this.headers = {
      'X-N8N-API-KEY': this.apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // Critical failure patterns to monitor
    this.criticalPatterns = [
      'Transform Orders → Check Order Duplicates',
      'Connection timeout',
      'Database error',
      'HTTP 500',
      'Webhook failed',
      'Supabase error',
      'Authentication failed'
    ];
    
    console.log('🔍 N8N Multi-Workflow Debug Monitor initialized');
    console.log(`📊 Strategy: ${this.monitoringStrategy}`);
    if (this.monitoringStrategy === 'single') {
      console.log(`📋 Target Workflow: ${this.targetWorkflowId}`);
    }
    console.log(`⏰ Polling Interval: ${this.pollingInterval/1000}s`);
  }

  /**
   * Core API request wrapper with comprehensive error handling
   */
  async apiRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      method: 'GET',
      headers: this.headers,
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      return { success: true, data };
      
    } catch (error) {
      console.error(`❌ API Request failed [${config.method} ${endpoint}]:`, error.message);
      
      // Log API errors to Knowledge Graph
      await this.kg.logIssue(
        `N8N API Error: ${endpoint}`,
        `API request failed: ${error.message}`,
        'high'
      );
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all workflows from N8N instance
   */
  async getAllWorkflows() {
    console.log('🔄 Fetching all workflows...');
    
    const result = await this.apiRequest('/workflows');
    
    if (!result.success) {
      console.error('❌ Failed to get workflows:', result.error);
      return [];
    }
    
    const workflows = result.data.data || [];
    console.log(`📊 Found ${workflows.length} workflows`);
    
    return workflows.map(workflow => ({
      id: workflow.id,
      name: workflow.name,
      active: workflow.active,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
      nodeCount: workflow.nodes?.length || 0,
      nodes: workflow.nodes || [],
      tags: workflow.tags || []
    }));
  }

  /**
   * Get active workflows only
   */
  async getActiveWorkflows() {
    const allWorkflows = await this.getAllWorkflows();
    const activeWorkflows = allWorkflows.filter(workflow => workflow.active);
    
    console.log(`✅ Found ${activeWorkflows.length} active workflows`);
    return activeWorkflows;
  }

  /**
   * Filter workflows based on monitoring strategy and filters
   */
  async getWorkflowsToMonitor() {
    let workflows = [];
    
    switch (this.monitoringStrategy) {
      case 'all':
        workflows = await this.getAllWorkflows();
        break;
        
      case 'active':
        workflows = await this.getActiveWorkflows();
        break;
        
      case 'selective':
        workflows = await this.getFilteredWorkflows();
        break;
        
      case 'single':
      default:
        // Single workflow mode (backward compatibility)
        const singleWorkflow = await this.getWorkflowStatus();
        workflows = singleWorkflow ? [singleWorkflow] : [];
        break;
    }
    
    // Apply workflow limits
    if (workflows.length > this.limits.maxWorkflows) {
      console.log(`⚠️  Limiting to ${this.limits.maxWorkflows} workflows (found ${workflows.length})`);
      workflows = workflows.slice(0, this.limits.maxWorkflows);
    }
    
    // Initialize monitoring for each workflow
    workflows.forEach(workflow => {
      if (!this.monitoredWorkflows.has(workflow.id)) {
        this.monitoredWorkflows.set(workflow.id, {
          ...workflow,
          priority: this.determineWorkflowPriority(workflow),
          lastChecked: null,
          failureCount: 0
        });
        
        // Initialize execution history for this workflow
        if (!this.executionHistory.has(workflow.id)) {
          this.executionHistory.set(workflow.id, new Map());
        }
      }
    });
    
    console.log(`🎯 Monitoring ${workflows.length} workflows`);
    return workflows;
  }

  /**
   * Apply filters to get selective workflows
   */
  async getFilteredWorkflows() {
    const allWorkflows = await this.getAllWorkflows();
    const filters = this.workflowFilters;
    
    let filtered = allWorkflows;
    
    // Include patterns
    if (filters.includePatterns && filters.includePatterns.length > 0) {
      filtered = filtered.filter(workflow => 
        filters.includePatterns.some(pattern => 
          workflow.name.toLowerCase().includes(pattern.toLowerCase())
        )
      );
    }
    
    // Exclude patterns
    if (filters.excludePatterns && filters.excludePatterns.length > 0) {
      filtered = filtered.filter(workflow => 
        !filters.excludePatterns.some(pattern => 
          workflow.name.toLowerCase().includes(pattern.toLowerCase())
        )
      );
    }
    
    // Active only filter
    if (filters.activeOnly) {
      filtered = filtered.filter(workflow => workflow.active);
    }
    
    console.log(`🔍 Filtered to ${filtered.length} workflows (from ${allWorkflows.length})`);
    return filtered;
  }

  /**
   * Determine workflow monitoring priority
   */
  determineWorkflowPriority(workflow) {
    const name = workflow.name.toLowerCase();
    
    // Critical workflows (debugging, monitoring, important business processes)
    if (name.includes('debug') || name.includes('monitor') || 
        name.includes('critical') || name.includes('order') ||
        name.includes('payment') || name.includes('sync')) {
      return 'critical';
    }
    
    // Standard active workflows
    if (workflow.active) {
      return 'standard';
    }
    
    // Inactive workflows
    return 'inactive';
  }

  /**
   * Get workflow details and current status
   */
  async getWorkflowStatus() {
    console.log(`🔄 Checking workflow status: ${this.targetWorkflowId}`);
    
    const result = await this.apiRequest(`/workflows/${this.targetWorkflowId}`);
    
    if (!result.success) {
      console.error('❌ Failed to get workflow status:', result.error);
      return null;
    }
    
    const workflow = result.data;
    console.log(`📋 Workflow: ${workflow.name} | Active: ${workflow.active ? '✅' : '❌'}`);
    
    return {
      id: workflow.id,
      name: workflow.name,
      active: workflow.active,
      updatedAt: workflow.updatedAt,
      nodeCount: workflow.nodes?.length || 0,
      nodes: workflow.nodes || []
    };
  }

  /**
   * Get recent executions for the target workflow
   */
  async getExecutions(limit = 20) {
    console.log(`📊 Fetching executions for workflow: ${this.targetWorkflowId}`);
    
    const result = await this.apiRequest(`/executions?workflowId=${this.targetWorkflowId}&limit=${limit}`);
    
    if (!result.success) {
      console.error('❌ Failed to get executions:', result.error);
      return [];
    }
    
    const executions = result.data.data || [];
    console.log(`📈 Found ${executions.length} executions`);
    
    return executions.map(exec => ({
      id: exec.id,
      workflowId: exec.workflowId,
      mode: exec.mode,
      status: exec.status,
      startedAt: exec.startedAt,
      stoppedAt: exec.stoppedAt,
      duration: exec.stoppedAt && exec.startedAt ? 
        new Date(exec.stoppedAt) - new Date(exec.startedAt) : null,
      waitTill: exec.waitTill
    }));
  }

  /**
   * Get executions for multiple workflows
   */
  async getExecutionsForWorkflows(workflowIds, limit = 20) {
    console.log(`📊 Fetching executions for ${workflowIds.length} workflows...`);
    
    const allExecutions = [];
    const concurrentRequests = Math.min(workflowIds.length, this.limits.maxConcurrentRequests);
    
    // Process workflows in batches to respect rate limits
    for (let i = 0; i < workflowIds.length; i += concurrentRequests) {
      const batch = workflowIds.slice(i, i + concurrentRequests);
      
      const promises = batch.map(async workflowId => {
        try {
          const result = await this.apiRequest(`/executions?workflowId=${workflowId}&limit=${limit}`);
          if (!result.success) {
            console.error(`❌ Failed to get executions for ${workflowId}:`, result.error);
            return [];
          }
          
          const executions = result.data.data || [];
          return executions.map(exec => ({
            id: exec.id,
            workflowId: exec.workflowId,
            mode: exec.mode,
            status: exec.status,
            startedAt: exec.startedAt,
            stoppedAt: exec.stoppedAt,
            duration: exec.stoppedAt && exec.startedAt ? 
              new Date(exec.stoppedAt) - new Date(exec.startedAt) : null,
            waitTill: exec.waitTill
          }));
        } catch (error) {
          console.error(`❌ Failed to get executions for workflow ${workflowId}:`, error.message);
          return [];
        }
      });
      
      const batchResults = await Promise.all(promises);
      allExecutions.push(...batchResults.flat());
    }
    
    // Sort by most recent first
    allExecutions.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
    
    console.log(`📈 Found ${allExecutions.length} total executions across workflows`);
    return allExecutions;
  }

  /**
   * Get executions for all monitored workflows
   */
  async getAllMonitoredExecutions(limit = 20) {
    if (this.monitoringStrategy === 'single') {
      return await this.getExecutions(limit);
    }
    
    const workflowIds = Array.from(this.monitoredWorkflows.keys());
    if (workflowIds.length === 0) {
      console.log('📭 No workflows being monitored');
      return [];
    }
    
    return await this.getExecutionsForWorkflows(workflowIds, limit);
  }

  /**
   * Track execution status changes across multiple workflows
   */
  async trackMultiWorkflowExecutionChanges(executions) {
    const newFailures = [];
    const statusChanges = [];
    const workflowSummary = new Map(); // workflowId -> { successes, failures, total }
    
    for (const execution of executions) {
      const workflowId = execution.workflowId;
      const executionId = execution.id;
      
      // Initialize workflow history if needed
      if (!this.executionHistory.has(workflowId)) {
        this.executionHistory.set(workflowId, new Map());
      }
      
      const workflowHistory = this.executionHistory.get(workflowId);
      const prevStatus = workflowHistory.get(executionId);
      
      // Track status changes
      if (prevStatus && prevStatus !== execution.status) {
        statusChanges.push({
          workflowId,
          executionId,
          from: prevStatus,
          to: execution.status,
          timestamp: new Date().toISOString()
        });
        
        console.log(`🔄 Status change [${workflowId}]: ${executionId} | ${prevStatus} → ${execution.status}`);
      }
      
      // Track new failures
      if (execution.status === 'failed' && prevStatus !== 'failed') {
        newFailures.push(execution);
        console.log(`🚨 New failure [${workflowId}]: ${executionId}`);
      }
      
      // Update history
      workflowHistory.set(executionId, execution.status);
      
      // Update workflow summary
      if (!workflowSummary.has(workflowId)) {
        workflowSummary.set(workflowId, { successes: 0, failures: 0, total: 0 });
      }
      const summary = workflowSummary.get(workflowId);
      summary.total++;
      if (execution.status === 'success') summary.successes++;
      if (execution.status === 'failed') summary.failures++;
      
      // Cleanup old execution history to prevent memory issues
      if (workflowHistory.size > this.limits.maxExecutionHistory) {
        const entries = Array.from(workflowHistory.entries());
        entries.sort((a, b) => b[0].localeCompare(a[0])); // Sort by execution ID (newer first)
        const toKeep = entries.slice(0, this.limits.maxExecutionHistory);
        workflowHistory.clear();
        toKeep.forEach(([id, status]) => workflowHistory.set(id, status));
      }
    }
    
    return { newFailures, statusChanges, workflowSummary };
  }

  /**
   * Get detailed execution information including node-level data
   */
  async getExecutionDetails(executionId) {
    console.log(`🔍 Getting execution details: ${executionId}`);
    
    const result = await this.apiRequest(`/executions/${executionId}`);
    
    if (!result.success) {
      console.error('❌ Failed to get execution details:', result.error);
      return null;
    }
    
    const execution = result.data;
    const nodeData = execution.data?.resultData?.runData || {};
    
    // Analyze node execution
    const nodeAnalysis = {};
    for (const [nodeName, nodeExecution] of Object.entries(nodeData)) {
      const nodeRuns = nodeExecution || [];
      const lastRun = nodeRuns[nodeRuns.length - 1];
      
      nodeAnalysis[nodeName] = {
        executed: nodeRuns.length > 0,
        runs: nodeRuns.length,
        lastStatus: lastRun?.error ? 'failed' : 'success',
        error: lastRun?.error || null,
        executionTime: lastRun?.executionTime || null,
        data: lastRun?.data || null
      };
    }
    
    return {
      id: execution.id,
      status: execution.status,
      mode: execution.mode,
      startedAt: execution.startedAt,
      stoppedAt: execution.stoppedAt,
      duration: execution.stoppedAt && execution.startedAt ? 
        new Date(execution.stoppedAt) - new Date(execution.startedAt) : null,
      nodes: nodeAnalysis,
      error: execution.data?.resultData?.error || null
    };
  }

  /**
   * Analyze execution for critical failure patterns
   */
  analyzeExecution(executionDetails) {
    const issues = [];
    const patterns = [];
    
    // Check for Transform Orders → Check Order Duplicates failure
    if (executionDetails.nodes) {
      for (const [nodeName, nodeData] of Object.entries(executionDetails.nodes)) {
        if (nodeName.includes('Transform Orders') && nodeData.lastStatus === 'failed') {
          issues.push({
            type: 'critical_node_failure',
            node: nodeName,
            error: nodeData.error,
            pattern: 'Transform Orders → Check Order Duplicates failure point'
          });
          patterns.push('Transform Orders → Check Order Duplicates');
        }
        
        if (nodeData.error) {
          const errorMsg = JSON.stringify(nodeData.error).toLowerCase();
          
          // Check for critical patterns in error messages
          this.criticalPatterns.forEach(pattern => {
            if (errorMsg.includes(pattern.toLowerCase())) {
              issues.push({
                type: 'critical_pattern',
                node: nodeName,
                error: nodeData.error,
                pattern: pattern
              });
              patterns.push(pattern);
            }
          });
        }
      }
    }
    
    // Check overall execution status
    if (executionDetails.status === 'failed' || executionDetails.status === 'error') {
      issues.push({
        type: 'execution_failure',
        status: executionDetails.status,
        error: executionDetails.error,
        duration: executionDetails.duration
      });
    }
    
    return { issues, patterns };
  }

  /**
   * Track execution status changes and detect new failures
   */
  async trackExecutionChanges(executions) {
    const newFailures = [];
    const statusChanges = [];
    
    for (const execution of executions) {
      const prevStatus = this.executionHistory.get(execution.id);
      
      if (prevStatus && prevStatus !== execution.status) {
        statusChanges.push({
          id: execution.id,
          from: prevStatus,
          to: execution.status,
          timestamp: new Date().toISOString()
        });
        
        console.log(`🔄 Status change: ${execution.id} | ${prevStatus} → ${execution.status}`);
      }
      
      // Track new failures
      if (execution.status === 'failed' && prevStatus !== 'failed') {
        newFailures.push(execution);
        console.log(`🚨 New failure detected: ${execution.id}`);
      }
      
      // Update history
      this.executionHistory.set(execution.id, execution.status);
    }
    
    return { newFailures, statusChanges };
  }

  /**
   * Log critical findings to Knowledge Graph
   */
  async logToKnowledgeGraph(executionDetails, analysis) {
    if (analysis.issues.length === 0) return;
    
    const timestamp = new Date().toISOString();
    const issueTitle = `N8N Workflow Failure: ${this.targetWorkflowId}`;
    
    let description = `Execution ${executionDetails.id} failed with ${analysis.issues.length} issues:\n\n`;
    
    analysis.issues.forEach((issue, index) => {
      description += `${index + 1}. ${issue.type}: ${issue.pattern || 'General failure'}\n`;
      if (issue.node) description += `   Node: ${issue.node}\n`;
      if (issue.error) description += `   Error: ${JSON.stringify(issue.error, null, 2)}\n`;
      description += '\n';
    });
    
    description += `Execution Details:\n`;
    description += `- ID: ${executionDetails.id}\n`;
    description += `- Status: ${executionDetails.status}\n`;
    description += `- Duration: ${executionDetails.duration}ms\n`;
    description += `- Started: ${executionDetails.startedAt}\n`;
    description += `- Stopped: ${executionDetails.stoppedAt}\n`;
    
    // Determine severity based on patterns
    let severity = 'medium';
    if (analysis.patterns.includes('Transform Orders → Check Order Duplicates')) {
      severity = 'critical';
    } else if (analysis.patterns.some(p => ['Database error', 'HTTP 500', 'Supabase error'].includes(p))) {
      severity = 'high';
    }
    
    try {
      await this.kg.logIssue(issueTitle, description, severity);
      console.log(`📝 Logged issue to Knowledge Graph: ${severity} severity`);
    } catch (error) {
      console.error('❌ Failed to log to Knowledge Graph:', error.message);
    }
  }

  /**
   * Update node failure pattern tracking
   */
  updateFailurePatterns(analysis) {
    analysis.patterns.forEach(pattern => {
      const current = this.nodeFailurePatterns.get(pattern) || 0;
      this.nodeFailurePatterns.set(pattern, current + 1);
    });
  }

  /**
   * Generate monitoring summary report
   */
  generateSummaryReport() {
    const timestamp = new Date().toISOString();
    const totalExecutions = this.executionHistory.size;
    
    console.log('\n📊 MONITORING SUMMARY REPORT');
    console.log('='.repeat(50));
    console.log(`Timestamp: ${timestamp}`);
    console.log(`Target Workflow: ${this.targetWorkflowId}`);
    console.log(`Total Executions Tracked: ${totalExecutions}`);
    console.log(`Polling Interval: ${this.pollingInterval/1000}s`);
    
    if (this.nodeFailurePatterns.size > 0) {
      console.log('\n🚨 Failure Patterns Detected:');
      for (const [pattern, count] of this.nodeFailurePatterns.entries()) {
        console.log(`  • ${pattern}: ${count} occurrences`);
      }
    } else {
      console.log('\n✅ No failure patterns detected');
    }
    
    console.log('='.repeat(50));
  }

  /**
   * Enhanced monitoring cycle supporting multiple workflows
   */
  async runMonitoringCycle() {
    try {
      console.log(`\n🔄 Starting monitoring cycle: ${new Date().toISOString()}`);
      console.log(`📊 Strategy: ${this.monitoringStrategy}`);
      
      // Get workflows to monitor based on strategy
      const workflows = await this.getWorkflowsToMonitor();
      if (workflows.length === 0) {
        console.log('📭 No workflows to monitor');
        return;
      }
      
      console.log(`🎯 Monitoring ${workflows.length} workflows`);
      
      // Check workflow status for each monitored workflow
      const inactiveWorkflows = [];
      for (const workflow of workflows) {
        if (!workflow.active) {
          inactiveWorkflows.push(workflow);
        }
      }
      
      if (inactiveWorkflows.length > 0) {
        console.log(`⚠️  Found ${inactiveWorkflows.length} inactive workflows`);
        for (const workflow of inactiveWorkflows) {
          await this.kg.logIssue(
            'N8N Workflow Inactive',
            `Workflow ${workflow.id} (${workflow.name}) is not active`,
            'medium'
          );
        }
      }
      
      // Get recent executions for all monitored workflows
      const executions = await this.getAllMonitoredExecutions(10);
      if (executions.length === 0) {
        console.log('📭 No executions found across all workflows');
        return;
      }
      
      console.log(`📈 Found ${executions.length} executions across ${workflows.length} workflows`);
      
      // Track status changes across multiple workflows
      const { newFailures, statusChanges, workflowSummary } = await this.trackMultiWorkflowExecutionChanges(executions);
      
      if (statusChanges.length > 0) {
        console.log(`📈 Detected ${statusChanges.length} status changes across workflows`);
      }
      
      // Show workflow summary
      console.log('\n📊 Workflow Execution Summary:');
      for (const [workflowId, summary] of workflowSummary) {
        const workflow = this.monitoredWorkflows.get(workflowId);
        const workflowName = workflow ? workflow.name : workflowId;
        const successRate = summary.total > 0 ? ((summary.successes / summary.total) * 100).toFixed(1) : '0.0';
        console.log(`  📋 ${workflowName}: ${summary.successes}✅ ${summary.failures}❌ (${successRate}% success)`);
      }
      
      // Analyze new failures in detail
      for (const failure of newFailures) {
        console.log(`🔍 Analyzing failure: ${failure.id} [${failure.workflowId}]`);
        
        const executionDetails = await this.getExecutionDetails(failure.id);
        if (!executionDetails) continue;
        
        const analysis = this.analyzeExecution(executionDetails);
        
        if (analysis.issues.length > 0) {
          console.log(`🚨 Found ${analysis.issues.length} issues in execution ${failure.id}`);
          
          // Log to Knowledge Graph with workflow context
          await this.logToKnowledgeGraphWithWorkflow(executionDetails, analysis, failure.workflowId);
          
          // Update failure patterns for this workflow
          this.updateWorkflowFailurePatterns(failure.workflowId, analysis);
        }
      }
      
      // Detect cross-workflow patterns
      await this.detectCrossWorkflowPatterns(newFailures);
      
      // Show latest execution summary
      if (executions.length > 0) {
        const latest = executions[0];
        const workflow = this.monitoredWorkflows.get(latest.workflowId);
        const workflowName = workflow ? workflow.name : latest.workflowId;
        console.log(`\n📊 Latest execution: ${latest.id} [${workflowName}]`);
        console.log(`   Status: ${latest.status} | Duration: ${latest.duration || 'N/A'}ms`);
      }
      
    } catch (error) {
      console.error('💥 Error in monitoring cycle:', error.message);
      
      await this.kg.logIssue(
        'N8N Monitor Cycle Error',
        `Monitoring cycle failed: ${error.message}\nStack: ${error.stack}`,
        'high'
      );
    }
  }

  /**
   * Enhanced Knowledge Graph logging with workflow context
   */
  async logToKnowledgeGraphWithWorkflow(executionDetails, analysis, workflowId) {
    if (analysis.issues.length === 0) return;
    
    const workflow = this.monitoredWorkflows.get(workflowId);
    const workflowName = workflow ? workflow.name : workflowId;
    
    const timestamp = new Date().toISOString();
    const issueTitle = `N8N Workflow Failure: ${workflowName} (${workflowId})`;
    
    let description = `Execution ${executionDetails.id} failed in workflow "${workflowName}" with ${analysis.issues.length} issues:\n\n`;
    
    analysis.issues.forEach((issue, index) => {
      description += `${index + 1}. ${issue.type}: ${issue.pattern || 'General failure'}\n`;
      if (issue.node) description += `   Node: ${issue.node}\n`;
      if (issue.error) description += `   Error: ${JSON.stringify(issue.error, null, 2)}\n`;
      description += '\n';
    });
    
    description += `Workflow Details:\n`;
    description += `- Workflow ID: ${workflowId}\n`;
    description += `- Workflow Name: ${workflowName}\n`;
    description += `- Active: ${workflow ? workflow.active : 'Unknown'}\n`;
    description += `- Priority: ${workflow ? workflow.priority : 'Unknown'}\n`;
    description += `- Node Count: ${workflow ? workflow.nodeCount : 'Unknown'}\n\n`;
    
    description += `Execution Details:\n`;
    description += `- Execution ID: ${executionDetails.id}\n`;
    description += `- Status: ${executionDetails.status}\n`;
    description += `- Duration: ${executionDetails.duration}ms\n`;
    description += `- Started: ${executionDetails.startedAt}\n`;
    description += `- Stopped: ${executionDetails.stoppedAt}\n`;
    
    // Determine severity based on patterns and workflow priority
    let severity = 'medium';
    if (workflow && workflow.priority === 'critical') {
      severity = 'critical';
    } else if (analysis.patterns.includes('Transform Orders → Check Order Duplicates')) {
      severity = 'critical';
    } else if (analysis.patterns.some(p => ['Database error', 'HTTP 500', 'Supabase error'].includes(p))) {
      severity = 'high';
    }
    
    try {
      await this.kg.logIssue(issueTitle, description, severity);
      console.log(`📝 Logged issue to Knowledge Graph: ${severity} severity`);
    } catch (error) {
      console.error('❌ Failed to log to Knowledge Graph:', error.message);
    }
  }

  /**
   * Update failure patterns for specific workflow
   */
  updateWorkflowFailurePatterns(workflowId, analysis) {
    if (!this.nodeFailurePatterns.has(workflowId)) {
      this.nodeFailurePatterns.set(workflowId, new Map());
    }
    
    const workflowPatterns = this.nodeFailurePatterns.get(workflowId);
    
    analysis.patterns.forEach(pattern => {
      const current = workflowPatterns.get(pattern) || 0;
      workflowPatterns.set(pattern, current + 1);
      
      // Also update global patterns
      const globalCurrent = this.globalPatterns.get(pattern) || 0;
      this.globalPatterns.set(pattern, globalCurrent + 1);
    });
  }

  /**
   * Detect patterns across multiple workflows
   */
  async detectCrossWorkflowPatterns(newFailures) {
    if (newFailures.length === 0) return;
    
    // Group failures by time window (5 minutes)
    const now = Date.now();
    const timeWindow = 5 * 60 * 1000; // 5 minutes
    const recentFailures = newFailures.filter(failure => {
      const failureTime = new Date(failure.startedAt).getTime();
      return (now - failureTime) <= timeWindow;
    });
    
    if (recentFailures.length < 2) return;
    
    // Check for system-wide issues
    const affectedWorkflows = new Set(recentFailures.map(f => f.workflowId));
    
    if (affectedWorkflows.size >= 2) {
      console.log(`🚨 Cross-workflow failure detected: ${affectedWorkflows.size} workflows affected`);
      
      const workflowNames = Array.from(affectedWorkflows).map(id => {
        const workflow = this.monitoredWorkflows.get(id);
        return workflow ? workflow.name : id;
      });
      
      await this.kg.logIssue(
        'N8N System-wide Failure Pattern',
        `Multiple workflows failing simultaneously: ${workflowNames.join(', ')}. This may indicate a system-wide issue such as database connectivity, API rate limiting, or infrastructure problems.`,
        'critical'
      );
    }
    
    // Check for common error patterns
    const errorPatterns = new Map();
    for (const failure of recentFailures) {
      const executionDetails = await this.getExecutionDetails(failure.id);
      if (executionDetails && executionDetails.error) {
        const errorMsg = JSON.stringify(executionDetails.error).toLowerCase();
        for (const pattern of this.criticalPatterns) {
          if (errorMsg.includes(pattern.toLowerCase())) {
            const count = errorPatterns.get(pattern) || 0;
            errorPatterns.set(pattern, count + 1);
          }
        }
      }
    }
    
    // Log patterns that appear across multiple workflows
    for (const [pattern, count] of errorPatterns) {
      if (count >= 2) {
        await this.kg.logIssue(
          `N8N Cross-Workflow Pattern: ${pattern}`,
          `Pattern "${pattern}" detected in ${count} workflows within the last 5 minutes. This suggests a common underlying issue.`,
          'high'
        );
      }
    }
  }

  /**
   * Start continuous monitoring
   */
  async startMonitoring() {
    if (this.isMonitoring) {
      console.log('⚠️  Monitoring is already running');
      return;
    }
    
    this.isMonitoring = true;
    console.log('🚀 Starting N8N Debug Monitor');
    console.log(`🎯 Monitoring workflow: ${this.targetWorkflowId}`);
    console.log(`⏰ Polling every ${this.pollingInterval/1000} seconds`);
    
    // Log startup to Knowledge Graph
    await this.kg.logIssue(
      'N8N Monitor Started',
      `Started monitoring workflow ${this.targetWorkflowId} with ${this.pollingInterval/1000}s intervals`,
      'low'
    );
    
    // Initial cycle
    await this.runMonitoringCycle();
    
    // Set up continuous monitoring
    this.monitoringInterval = setInterval(async () => {
      if (this.isMonitoring) {
        await this.runMonitoringCycle();
      }
    }, this.pollingInterval);
    
    console.log('✅ Monitoring started successfully');
  }

  /**
   * Stop monitoring
   */
  async stopMonitoring() {
    if (!this.isMonitoring) {
      console.log('⚠️  Monitoring is not running');
      return;
    }
    
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    // Generate final report
    this.generateSummaryReport();
    
    // Log shutdown to Knowledge Graph
    await this.kg.logIssue(
      'N8N Monitor Stopped',
      `Stopped monitoring workflow ${this.targetWorkflowId}. Total executions tracked: ${this.executionHistory.size}`,
      'low'
    );
    
    console.log('🛑 Monitoring stopped');
  }

  /**
   * Manual analysis of specific execution
   */
  async analyzeExecution(executionId) {
    console.log(`🔍 Manual analysis of execution: ${executionId}`);
    
    const executionDetails = await this.getExecutionDetails(executionId);
    if (!executionDetails) {
      console.log('❌ Could not retrieve execution details');
      return;
    }
    
    const analysis = this.analyzeExecution(executionDetails);
    
    console.log('\n📊 EXECUTION ANALYSIS REPORT');
    console.log('='.repeat(40));
    console.log(`Execution ID: ${executionDetails.id}`);
    console.log(`Status: ${executionDetails.status}`);
    console.log(`Duration: ${executionDetails.duration}ms`);
    console.log(`Issues Found: ${analysis.issues.length}`);
    
    if (analysis.issues.length > 0) {
      console.log('\n🚨 Issues:');
      analysis.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.type}: ${issue.pattern || 'General'}`);
        if (issue.node) console.log(`     Node: ${issue.node}`);
        if (issue.error) console.log(`     Error: ${JSON.stringify(issue.error, null, 2)}`);
      });
      
      // Log to Knowledge Graph
      await this.logToKnowledgeGraph(executionDetails, analysis);
    } else {
      console.log('\n✅ No issues detected');
    }
    
    console.log('='.repeat(40));
    
    return analysis;
  }

  /**
   * Get current monitoring status
   */
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      targetWorkflow: this.targetWorkflowId,
      pollingInterval: this.pollingInterval,
      executionsTracked: this.executionHistory.size,
      failurePatterns: Object.fromEntries(this.nodeFailurePatterns),
      uptime: this.isMonitoring ? Date.now() - this.startTime : 0
    };
  }
}

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new N8NDebugMonitor();
  const command = process.argv[2];
  
  // Handle process termination gracefully
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, stopping monitor...');
    await monitor.stopMonitoring();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, stopping monitor...');
    await monitor.stopMonitoring();
    process.exit(0);
  });

  switch (command) {
    case 'start':
      monitor.startTime = Date.now();
      monitor.startMonitoring().catch(error => {
        console.error('💥 Failed to start monitoring:', error.message);
        process.exit(1);
      });
      break;
      
    case 'status':
      monitor.getWorkflowStatus().then(status => {
        if (status) {
          console.log('📊 Workflow Status:', JSON.stringify(status, null, 2));
        }
        process.exit(0);
      });
      break;
      
    case 'executions':
      const limit = parseInt(process.argv[3]) || 10;
      monitor.getExecutions(limit).then(executions => {
        console.log(`📈 Recent Executions (${executions.length}):`);
        executions.forEach(exec => {
          console.log(`  ${exec.id} | ${exec.status} | ${exec.duration || 'N/A'}ms | ${exec.startedAt}`);
        });
        process.exit(0);
      });
      break;
      
    case 'analyze':
      const executionId = process.argv[3];
      if (!executionId) {
        console.error('❌ Usage: node n8n-debugging-monitor.js analyze <execution-id>');
        process.exit(1);
      }
      monitor.analyzeExecution(executionId).then(() => {
        process.exit(0);
      });
      break;
      
    case 'list-workflows':
      monitor.getAllWorkflows().then(workflows => {
        console.log(`\n📊 Found ${workflows.length} workflows:\n`);
        workflows.forEach(workflow => {
          const status = workflow.active ? '✅ Active' : '❌ Inactive';
          console.log(`  📋 ${workflow.name}`);
          console.log(`     ID: ${workflow.id}`);
          console.log(`     Status: ${status}`);
          console.log(`     Nodes: ${workflow.nodeCount}`);
          console.log(`     Updated: ${workflow.updatedAt}`);
          console.log('');
        });
        process.exit(0);
      });
      break;
      
    case 'monitor-all':
      // Monitor all workflows
      const allMonitor = new N8NDebugMonitor({ strategy: 'all' });
      allMonitor.startTime = Date.now();
      allMonitor.startMonitoring().catch(error => {
        console.error('💥 Failed to start all-workflow monitoring:', error.message);
        process.exit(1);
      });
      break;
      
    case 'monitor-active':
      // Monitor only active workflows
      const activeMonitor = new N8NDebugMonitor({ strategy: 'active' });
      activeMonitor.startTime = Date.now();
      activeMonitor.startMonitoring().catch(error => {
        console.error('💥 Failed to start active-workflow monitoring:', error.message);
        process.exit(1);
      });
      break;
      
    case 'monitor-selective':
      // Monitor selective workflows based on filters
      const includePatterns = process.argv[3] ? process.argv[3].split(',') : ['debug', 'monitor', 'sync'];
      const selectiveMonitor = new N8NDebugMonitor({ 
        strategy: 'selective',
        filters: {
          includePatterns,
          activeOnly: true
        }
      });
      selectiveMonitor.startTime = Date.now();
      console.log(`🎯 Starting selective monitoring with patterns: ${includePatterns.join(', ')}`);
      selectiveMonitor.startMonitoring().catch(error => {
        console.error('💥 Failed to start selective monitoring:', error.message);
        process.exit(1);
      });
      break;
      
    case 'workflow-stats':
      // Show statistics across all workflows
      monitor.getAllWorkflows().then(async workflows => {
        console.log('\n📊 N8N Workflow Statistics\n');
        console.log(`Total Workflows: ${workflows.length}`);
        
        const active = workflows.filter(w => w.active);
        const inactive = workflows.filter(w => !w.active);
        
        console.log(`Active: ${active.length} (${((active.length/workflows.length)*100).toFixed(1)}%)`);
        console.log(`Inactive: ${inactive.length} (${((inactive.length/workflows.length)*100).toFixed(1)}%)`);
        
        // Get recent executions for analysis
        const allExecutions = await monitor.getExecutionsForWorkflows(
          workflows.map(w => w.id), 
          50
        );
        
        const successCount = allExecutions.filter(e => e.status === 'success').length;
        const failureCount = allExecutions.filter(e => e.status === 'failed').length;
        const totalExecutions = allExecutions.length;
        
        if (totalExecutions > 0) {
          console.log(`\nRecent Executions (last 50 per workflow):`);
          console.log(`Success: ${successCount} (${((successCount/totalExecutions)*100).toFixed(1)}%)`);
          console.log(`Failed: ${failureCount} (${((failureCount/totalExecutions)*100).toFixed(1)}%)`);
          console.log(`Total: ${totalExecutions}`);
        }
        
        process.exit(0);
      });
      break;
      
    case 'global-analysis':
      // Cross-workflow failure analysis
      monitor.getAllWorkflows().then(async workflows => {
        console.log('\n🔍 Global N8N Analysis\n');
        
        const allExecutions = await monitor.getExecutionsForWorkflows(
          workflows.map(w => w.id), 
          20
        );
        
        const failures = allExecutions.filter(e => e.status === 'failed');
        
        if (failures.length === 0) {
          console.log('✅ No recent failures detected across all workflows');
          process.exit(0);
          return;
        }
        
        console.log(`🚨 Found ${failures.length} failures across ${workflows.length} workflows\n`);
        
        // Group by workflow
        const failuresByWorkflow = new Map();
        failures.forEach(failure => {
          if (!failuresByWorkflow.has(failure.workflowId)) {
            failuresByWorkflow.set(failure.workflowId, []);
          }
          failuresByWorkflow.get(failure.workflowId).push(failure);
        });
        
        console.log('Failures by workflow:');
        for (const [workflowId, workflowFailures] of failuresByWorkflow) {
          const workflow = workflows.find(w => w.id === workflowId);
          const name = workflow ? workflow.name : workflowId;
          console.log(`  📋 ${name}: ${workflowFailures.length} failures`);
        }
        
        // Time-based analysis
        const now = Date.now();
        const recentFailures = failures.filter(f => {
          const failureTime = new Date(f.startedAt).getTime();
          return (now - failureTime) <= (60 * 60 * 1000); // Last hour
        });
        
        if (recentFailures.length > 0) {
          console.log(`\n⚠️  ${recentFailures.length} failures in the last hour`);
          if (recentFailures.length >= 3) {
            console.log('🚨 HIGH FAILURE RATE DETECTED - Consider investigating system-wide issues');
          }
        }
        
        process.exit(0);
      });
      break;
      
    case 'background':
      // Run as background service (daemon mode)
      console.log('🌙 Starting in background mode...');
      monitor.startTime = Date.now();
      monitor.startMonitoring().catch(error => {
        console.error('💥 Background monitoring failed:', error.message);
        process.exit(1);
      });
      
      // Keep process alive
      setInterval(() => {
        if (!monitor.isMonitoring) {
          console.log('🛑 Monitor stopped, exiting...');
          process.exit(0);
        }
      }, 5000);
      break;
      
    default:
      console.log(`
🎭 N8N Multi-Workflow Debugging Monitor - Stand Up Sydney
========================================================

Supports single workflow or multi-workflow monitoring
Auto-logs to Knowledge Graph with cross-workflow pattern detection

Usage: node n8n-debugging-monitor.js <command> [options]

Single Workflow Commands (Backward Compatible):
  start                       - Start monitoring single workflow (XQ8bFr8gSIOQjWC5)
  background                  - Start as background service (single workflow)
  status                      - Check single workflow status
  executions [limit]          - Show recent executions (default: 10)
  analyze <execution-id>      - Analyze specific execution

Multi-Workflow Commands:
  list-workflows              - List all available workflows
  monitor-all                 - Monitor ALL workflows (use with caution)
  monitor-active             - Monitor only active workflows
  monitor-selective [patterns] - Monitor workflows matching patterns
  workflow-stats             - Show statistics across all workflows
  global-analysis            - Cross-workflow failure analysis

Examples:
  # Single workflow (backward compatible)
  node n8n-debugging-monitor.js start
  node n8n-debugging-monitor.js background &
  
  # Multi-workflow monitoring
  node n8n-debugging-monitor.js list-workflows
  node n8n-debugging-monitor.js monitor-active
  node n8n-debugging-monitor.js monitor-selective "debug,sync,order"
  node n8n-debugging-monitor.js workflow-stats
  node n8n-debugging-monitor.js global-analysis

Enhanced Features:
  • Multi-workflow monitoring with intelligent resource management
  • Cross-workflow failure pattern detection
  • System-wide issue identification
  • Workflow prioritization (critical/standard/inactive)
  • Real-time execution monitoring across all workflows
  • Advanced Knowledge Graph integration with workflow context
  • Performance metrics and timing analysis
  • Background service capability with graceful shutdown
  • Configurable monitoring strategies and filters

Monitoring Strategies:
  • single    - Monitor one specific workflow (default, backward compatible)
  • all       - Monitor all workflows (resource intensive)
  • active    - Monitor only active workflows (recommended)
  • selective - Monitor workflows matching include/exclude patterns

Press Ctrl+C to stop monitoring gracefully.
`);
      process.exit(1);
  }
}

export default N8NDebugMonitor;