#!/usr/bin/env node

/**
 * Comprehensive Problem & Solution Tracking System
 * Master integration of all tracking components to prevent duplicate mistakes
 * 
 * Integrated Components:
 * - Enhanced Knowledge Graph Integration (bi-directional Linear sync)
 * - Linear Webhook Handler (real-time status sync)
 * - Unified Problem Registry (cross-system correlation)
 * - Compliance Checker (mandatory workflow enforcement)
 * - Duplicate Detection System (advanced similarity analysis)
 * 
 * Workflow:
 * 1. Pre-task compliance check and KG consultation
 * 2. Multi-source duplicate detection with warnings
 * 3. Real-time problem and solution logging
 * 4. Automated cross-system synchronization
 * 5. Session compliance reporting and analytics
 */

const fs = require('fs');
const path = require('path');

// Import all integrated components
const EnhancedClaudeGraphIntegration = require('/root/.claude-multi-agent/scripts/enhanced-claude-graph-integration.js');
const UnifiedProblemRegistry = require('/root/agents/unified-problem-registry.cjs');
const ComplianceChecker = require('/root/.claude-multi-agent/scripts/compliance-checker.js');
const DuplicateDetectionSystem = require('/root/agents/duplicate-detection-system.cjs');

class ComprehensiveTrackingSystem {
  constructor() {
    this.systemDir = '/root/agents/comprehensive-tracking';
    this.configFile = path.join(this.systemDir, 'system-config.json');
    
    // Initialize all components
    this.kgIntegration = new EnhancedClaudeGraphIntegration();
    this.problemRegistry = new UnifiedProblemRegistry();
    this.complianceChecker = new ComplianceChecker();
    this.duplicateDetector = new DuplicateDetectionSystem();
    
    this.ensureDirectories();
    this.initializeSystem();
  }
  
  ensureDirectories() {
    if (!fs.existsSync(this.systemDir)) {
      fs.mkdirSync(this.systemDir, { recursive: true });
    }
  }
  
  initializeSystem() {
    // Initialize system configuration
    if (!fs.existsSync(this.configFile)) {
      const initialConfig = {
        version: '1.0.0',
        initialized: new Date().toISOString(),
        components: {
          kg_integration: true,
          problem_registry: true,
          compliance_checker: true,
          duplicate_detector: true,
          linear_webhook: false // Requires manual setup
        },
        settings: {
          auto_create_linear_issues: true,
          auto_sync_status: true,
          strict_compliance_mode: true,
          duplicate_detection_threshold: 0.7,
          session_tracking: true
        },
        statistics: {
          total_sessions: 0,
          problems_logged: 0,
          solutions_logged: 0,
          duplicates_prevented: 0,
          linear_issues_synced: 0
        }
      };
      
      fs.writeFileSync(this.configFile, JSON.stringify(initialConfig, null, 2));
      console.log('✅ Comprehensive tracking system initialized');
    }
  }
  
  /**
   * MAIN WORKFLOW: Complete task analysis and tracking
   */
  async analyzeTask(taskTitle, taskDescription = '', severity = 'medium', options = {}) {
    console.log('🚀 Starting comprehensive task analysis...');
    console.log(`Task: ${taskTitle}`);
    
    const startTime = Date.now();
    const analysisResults = {
      task: { title: taskTitle, description: taskDescription, severity: severity },
      timestamp: new Date().toISOString(),
      stages: {}
    };
    
    try {
      // STAGE 1: Compliance Check
      console.log('\\n📋 STAGE 1: Compliance Check');
      this.complianceChecker.recordInteraction('task_analysis_start', taskTitle);
      
      const complianceStatus = this.complianceChecker.currentSession.compliance_status;
      if (complianceStatus === 'non_compliant') {
        const intervention = this.complianceChecker.generateIntervention();
        if (intervention) {
          console.error(intervention);
          return { error: 'Compliance intervention required', intervention };
        }
      }
      
      analysisResults.stages.compliance = { status: complianceStatus };
      
      // STAGE 2: Knowledge Graph Check
      console.log('\\n🧠 STAGE 2: Knowledge Graph Analysis');
      const kgResults = await this.kgIntegration.check(taskTitle + ' ' + taskDescription);
      this.complianceChecker.recordKGCheck(taskTitle, kgResults);
      
      analysisResults.stages.knowledge_graph = {
        entries_found: kgResults.entries?.length || 0,
        linear_issues_found: kgResults.linearIssues?.length || 0,
        warnings: kgResults.duplicateWarnings?.length || 0
      };
      
      // STAGE 3: Duplicate Detection
      console.log('\\n🔍 STAGE 3: Duplicate Detection Analysis');
      const duplicateResults = await this.duplicateDetector.detectDuplicates(taskTitle, taskDescription, severity);
      
      analysisResults.stages.duplicate_detection = {
        probability: duplicateResults.duplicate_probability,
        recommendation: duplicateResults.recommendation,
        warnings: duplicateResults.warnings?.length || 0
      };
      
      // STAGE 4: Registry Consultation
      console.log('\\n📊 STAGE 4: Problem Registry Search');
      const registryResults = this.problemRegistry.searchProblems(taskTitle, { limit: 10 });
      
      analysisResults.stages.problem_registry = {
        matches_found: registryResults.length,
        resolved_matches: registryResults.filter(p => p.status === 'resolved').length
      };
      
      // STAGE 5: Decision Analysis
      console.log('\\n⚖️ STAGE 5: Decision Analysis');
      const decision = this.makeDecision(kgResults, duplicateResults, registryResults);
      analysisResults.decision = decision;
      
      // STAGE 6: Recommendations
      console.log('\\n💡 STAGE 6: Generate Recommendations');
      const recommendations = this.generateRecommendations(analysisResults);
      analysisResults.recommendations = recommendations;
      
      // Save analysis results
      analysisResults.processing_time_ms = Date.now() - startTime;
      this.saveAnalysisResults(analysisResults);
      
      // Display final results
      this.displayComprehensiveResults(analysisResults);
      
      return analysisResults;
      
    } catch (error) {
      console.error('❌ Error in comprehensive analysis:', error);
      return { error: error.message, partial_results: analysisResults };
    }
  }
  
  /**
   * Log a new problem with full system integration
   */
  async logProblem(title, description, severity = 'medium', autoCreateLinear = true) {
    console.log(`📝 Logging problem with full system integration: "${title}"`);
    
    try {
      // Log to Knowledge Graph (with automatic Linear creation)
      const kgIssue = await this.kgIntegration.logIssue(title, description, severity, autoCreateLinear);
      
      // Record compliance
      this.complianceChecker.recordIssueLog(title, severity);
      
      // Update statistics
      this.updateStatistics('problems_logged', 1);
      
      // Rebuild registry to include new problem
      setTimeout(() => {
        this.problemRegistry.buildRegistry().catch(console.error);
      }, 1000);
      
      console.log('✅ Problem logged across all systems');
      return kgIssue;
      
    } catch (error) {
      console.error('❌ Error logging problem:', error);
      throw error;
    }
  }
  
  /**
   * Log a solution with full system integration
   */
  async logSolution(problemTitle, solutionDescription, successful = true, updateLinear = true) {
    console.log(`🔧 Logging solution with full system integration: "${problemTitle}"`);
    
    try {
      // Log to Knowledge Graph (with automatic Linear sync)
      const solution = await this.kgIntegration.logSolution(problemTitle, solutionDescription, successful, updateLinear);
      
      // Record compliance
      this.complianceChecker.recordSolutionLog(problemTitle, successful);
      
      // Update statistics
      this.updateStatistics('solutions_logged', 1);
      if (updateLinear) {
        this.updateStatistics('linear_issues_synced', 1);
      }
      
      // Rebuild registry to reflect updated status
      setTimeout(() => {
        this.problemRegistry.buildRegistry().catch(console.error);
      }, 1000);
      
      console.log('✅ Solution logged across all systems');
      return solution;
      
    } catch (error) {
      console.error('❌ Error logging solution:', error);
      throw error;
    }
  }
  
  /**
   * Start a critical task with full compliance and duplicate checking
   */
  async startCriticalTask(taskDescription) {
    console.log(`🚨 Starting critical task: "${taskDescription}"`);
    
    try {
      // Check compliance first
      const kgCheck = this.complianceChecker.recordCriticalTaskStart(taskDescription);
      
      if (!kgCheck.kg_checked) {
        console.error('🚨 CRITICAL: Knowledge Graph not consulted before critical task!');
        console.error('   This could lead to catastrophic oversights.');
        console.error('   Please run analyzeTask() first or check Knowledge Graph manually.');
        
        return {
          error: 'KG_NOT_CONSULTED',
          message: 'Critical task blocked - Knowledge Graph consultation required',
          action: 'Run analyzeTask() or kgIntegration.check() first'
        };
      }
      
      // Run duplicate detection as safety check
      const duplicateResults = await this.duplicateDetector.detectDuplicates(taskDescription);
      
      if (duplicateResults.duplicate_probability >= 0.8) {
        console.error('🚨 HIGH DUPLICATE PROBABILITY DETECTED!');
        console.error(`   Probability: ${(duplicateResults.duplicate_probability * 100).toFixed(1)}%`);
        console.error(`   Recommendation: ${duplicateResults.recommendation.action}`);
        
        return {
          error: 'HIGH_DUPLICATE_PROBABILITY',
          probability: duplicateResults.duplicate_probability,
          recommendation: duplicateResults.recommendation,
          warnings: duplicateResults.warnings
        };
      }
      
      console.log('✅ Critical task safety checks passed');
      return { approved: true, duplicate_probability: duplicateResults.duplicate_probability };
      
    } catch (error) {
      console.error('❌ Error in critical task check:', error);
      throw error;
    }
  }
  
  /**
   * Make decision based on all analysis results
   */
  makeDecision(kgResults, duplicateResults, registryResults) {
    const decision = {
      action: 'PROCEED',
      confidence: 'high',
      reasons: [],
      blocking_issues: []
    };
    
    // Check for exact duplicates
    if (duplicateResults.duplicate_probability >= 0.9) {
      decision.action = 'STOP';
      decision.confidence = 'high';
      decision.blocking_issues.push('Very high duplicate probability detected');
    }
    
    // Check for existing solutions
    const resolvedInRegistry = registryResults.filter(p => p.status === 'resolved');
    if (resolvedInRegistry.length > 0) {
      decision.action = 'REVIEW_SOLUTIONS';
      decision.confidence = 'high';
      decision.blocking_issues.push(`${resolvedInRegistry.length} similar resolved problems found`);
    }
    
    // Check for critical KG warnings
    if (kgResults.duplicateWarnings?.some(w => w.type === 'resolved_kg_issue')) {
      decision.action = 'REVIEW_KG';
      decision.confidence = 'medium';
      decision.reasons.push('Similar resolved issues in Knowledge Graph');
    }
    
    // Check for compliance issues
    if (kgResults.entries?.length === 0 && kgResults.linearIssues?.length === 0) {
      decision.reasons.push('No similar work found - proceed with caution');
    }
    
    return decision;
  }
  
  /**
   * Generate comprehensive recommendations
   */
  generateRecommendations(analysisResults) {
    const recommendations = [];
    
    // Based on decision
    switch (analysisResults.decision.action) {
      case 'STOP':
        recommendations.push({
          priority: 'CRITICAL',
          action: 'Do not proceed with this task',
          reason: 'High probability of duplicate work detected',
          next_steps: ['Review existing work', 'Consider if new work is actually needed']
        });
        break;
        
      case 'REVIEW_SOLUTIONS':
        recommendations.push({
          priority: 'HIGH',
          action: 'Review existing solutions before proceeding',
          reason: 'Similar problems have already been resolved',
          next_steps: ['Examine existing solutions', 'Determine if they apply to current case']
        });
        break;
        
      case 'REVIEW_KG':
        recommendations.push({
          priority: 'MEDIUM',
          action: 'Review Knowledge Graph entries',
          reason: 'Similar issues found in Knowledge Graph',
          next_steps: ['Study previous attempts', 'Learn from past approaches']
        });
        break;
        
      default:
        recommendations.push({
          priority: 'LOW',
          action: 'Proceed with task',
          reason: 'No significant duplicates detected',
          next_steps: ['Document progress in Knowledge Graph', 'Log issues as they arise']
        });
    }
    
    // Compliance recommendations
    if (analysisResults.stages.compliance.status !== 'compliant') {
      recommendations.push({
        priority: 'CRITICAL',
        action: 'Address compliance violations',
        reason: 'Session is not following mandatory Knowledge Graph workflow',
        next_steps: ['Follow KG consultation guidelines', 'Log all discoveries']
      });
    }
    
    // Duplicate detection recommendations
    if (analysisResults.stages.duplicate_detection.probability >= 0.7) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Investigate potential duplicates',
        reason: `${(analysisResults.stages.duplicate_detection.probability * 100).toFixed(1)}% duplicate probability`,
        next_steps: ['Review flagged similar items', 'Confirm work is not redundant']
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    });
  }
  
  /**
   * Display comprehensive analysis results
   */
  displayComprehensiveResults(results) {
    console.log('\\n🎯 COMPREHENSIVE ANALYSIS RESULTS');
    console.log('='.repeat(70));
    console.log(`Task: ${results.task.title}`);
    console.log(`Analysis Time: ${results.processing_time_ms}ms`);
    
    // Decision
    console.log(`\\n⚖️  DECISION: ${results.decision.action} (${results.decision.confidence} confidence)`);
    if (results.decision.blocking_issues.length > 0) {
      console.log('   Blocking Issues:');
      results.decision.blocking_issues.forEach(issue => {
        console.log(`   🚫 ${issue}`);
      });
    }
    
    // Stage Results
    console.log('\\n📊 STAGE RESULTS:');
    console.log(`   Compliance: ${results.stages.compliance.status}`);
    console.log(`   KG Entries: ${results.stages.knowledge_graph.entries_found} found`);
    console.log(`   Linear Issues: ${results.stages.knowledge_graph.linear_issues_found} found`);
    console.log(`   Duplicate Probability: ${(results.stages.duplicate_detection.probability * 100).toFixed(1)}%`);
    console.log(`   Registry Matches: ${results.stages.problem_registry.matches_found}`);
    
    // Critical Recommendations
    const criticalRecs = results.recommendations.filter(r => r.priority === 'CRITICAL');
    if (criticalRecs.length > 0) {
      console.log('\\n🚨 CRITICAL RECOMMENDATIONS:');
      criticalRecs.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec.action}`);
        console.log(`      Reason: ${rec.reason}`);
      });
    }
    
    // All Recommendations
    if (results.recommendations.length > 0) {
      console.log('\\n💡 ALL RECOMMENDATIONS:');
      results.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. [${rec.priority}] ${rec.action}`);
        console.log(`      ${rec.reason}`);
      });
    }
    
    console.log('\\n' + '='.repeat(70));
  }
  
  /**
   * Generate system status report
   */
  generateSystemReport() {
    const config = this.loadConfig();
    
    console.log('\\n📊 COMPREHENSIVE TRACKING SYSTEM STATUS');
    console.log('='.repeat(60));
    console.log(`Version: ${config.version}`);
    console.log(`Initialized: ${config.initialized.split('T')[0]}`);
    
    console.log('\\n🔧 COMPONENTS:');
    Object.entries(config.components).forEach(([component, enabled]) => {
      const status = enabled ? '✅' : '❌';
      console.log(`   ${status} ${component.replace(/_/g, ' ')}`);
    });
    
    console.log('\\n📈 STATISTICS:');
    Object.entries(config.statistics).forEach(([metric, value]) => {
      console.log(`   ${metric.replace(/_/g, ' ')}: ${value}`);
    });
    
    console.log('\\n⚙️  SETTINGS:');
    Object.entries(config.settings).forEach(([setting, value]) => {
      console.log(`   ${setting.replace(/_/g, ' ')}: ${value}`);
    });
    
    // Component-specific reports
    console.log('\\n🔍 COMPONENT REPORTS:');
    
    try {
      this.complianceChecker.generateComplianceReport();
    } catch (error) {
      console.log('   Compliance report unavailable');
    }
    
    try {
      this.problemRegistry.generateReport();
    } catch (error) {
      console.log('   Registry report unavailable');
    }
    
    console.log('\\n' + '='.repeat(60));
  }
  
  /**
   * End session with comprehensive cleanup
   */
  async endSession() {
    console.log('🏁 Ending comprehensive tracking session...');
    
    try {
      // End compliance session
      const sessionReport = this.complianceChecker.endSession();
      
      // Update system statistics
      this.updateStatistics('total_sessions', 1);
      
      // Generate final reports
      console.log('\\n📋 SESSION SUMMARY:');
      console.log(`   Duration: ${sessionReport.duration_minutes} minutes`);
      console.log(`   Interactions: ${sessionReport.interactions}`);
      console.log(`   KG Checks: ${sessionReport.kg_checks.length}`);
      console.log(`   Issues Logged: ${sessionReport.issue_logs.length}`);
      console.log(`   Solutions Logged: ${sessionReport.solution_logs.length}`);
      console.log(`   Compliance Status: ${sessionReport.compliance_status}`);
      
      return sessionReport;
      
    } catch (error) {
      console.error('❌ Error ending session:', error);
      throw error;
    }
  }
  
  // Utility methods
  
  loadConfig() {
    try {
      const content = fs.readFileSync(this.configFile, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn('⚠️  Could not load system config');
      this.initializeSystem();
      return this.loadConfig();
    }
  }
  
  saveConfig(config) {
    fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
  }
  
  updateStatistics(metric, increment = 1) {
    try {
      const config = this.loadConfig();
      config.statistics[metric] = (config.statistics[metric] || 0) + increment;
      this.saveConfig(config);
    } catch (error) {
      console.warn('⚠️  Could not update statistics:', error.message);
    }
  }
  
  saveAnalysisResults(results) {
    try {
      const filename = `analysis-${Date.now()}.json`;
      const filepath = path.join(this.systemDir, filename);
      fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
    } catch (error) {
      console.warn('⚠️  Could not save analysis results:', error.message);
    }
  }
}

// CLI Interface
if (require.main === module) {
  const system = new ComprehensiveTrackingSystem();
  const command = process.argv[2];
  
  if (!command) {
    console.log('Comprehensive Tracking System Usage:');
    console.log('  node comprehensive-tracking-system.js analyze "title" ["description"] [severity]');
    console.log('  node comprehensive-tracking-system.js log-problem "title" "description" [severity]');
    console.log('  node comprehensive-tracking-system.js log-solution "problem" "solution" [successful]');
    console.log('  node comprehensive-tracking-system.js start-critical "task description"');
    console.log('  node comprehensive-tracking-system.js status          # System status report');
    console.log('  node comprehensive-tracking-system.js end-session     # End tracking session');
    process.exit(1);
  }
  
  switch (command) {
    case 'analyze':
      const title = process.argv[3];
      const description = process.argv[4] || '';
      const severity = process.argv[5] || 'medium';
      
      if (!title) {
        console.error('❌ Please provide a task title');
        process.exit(1);
      }
      
      system.analyzeTask(title, description, severity).then(results => {
        if (results.error) {
          console.error(`❌ Analysis failed: ${results.error}`);
          process.exit(1);
        }
        
        // Exit code based on decision
        const exitCodes = {
          'STOP': 2,
          'REVIEW_SOLUTIONS': 1,
          'REVIEW_KG': 1,
          'PROCEED': 0
        };
        
        process.exit(exitCodes[results.decision.action] || 0);
      }).catch(error => {
        console.error(`❌ Analysis error: ${error.message}`);
        process.exit(1);
      });
      break;
      
    case 'log-problem':
      const problemTitle = process.argv[3];
      const problemDesc = process.argv[4];
      const problemSeverity = process.argv[5] || 'medium';
      
      if (!problemTitle || !problemDesc) {
        console.error('❌ Please provide title and description');
        process.exit(1);
      }
      
      system.logProblem(problemTitle, problemDesc, problemSeverity).then(() => {
        console.log('✅ Problem logged successfully');
        process.exit(0);
      }).catch(error => {
        console.error(`❌ Error logging problem: ${error.message}`);
        process.exit(1);
      });
      break;
      
    case 'log-solution':
      const solutionProblem = process.argv[3];
      const solutionDesc = process.argv[4];
      const successful = process.argv[5] !== 'false';
      
      if (!solutionProblem || !solutionDesc) {
        console.error('❌ Please provide problem title and solution description');
        process.exit(1);
      }
      
      system.logSolution(solutionProblem, solutionDesc, successful).then(() => {
        console.log('✅ Solution logged successfully');
        process.exit(0);
      }).catch(error => {
        console.error(`❌ Error logging solution: ${error.message}`);
        process.exit(1);
      });
      break;
      
    case 'start-critical':
      const taskDesc = process.argv[3];
      
      if (!taskDesc) {
        console.error('❌ Please provide task description');
        process.exit(1);
      }
      
      system.startCriticalTask(taskDesc).then(result => {
        if (result.error) {
          console.error(`❌ Critical task blocked: ${result.message}`);
          process.exit(1);
        }
        
        console.log('✅ Critical task approved to proceed');
        process.exit(0);
      }).catch(error => {
        console.error(`❌ Error in critical task check: ${error.message}`);
        process.exit(1);
      });
      break;
      
    case 'status':
      system.generateSystemReport();
      break;
      
    case 'end-session':
      system.endSession().then(() => {
        process.exit(0);
      }).catch(error => {
        console.error(`❌ Error ending session: ${error.message}`);
        process.exit(1);
      });
      break;
      
    default:
      console.error('Unknown command:', command);
      process.exit(1);
  }
}

module.exports = ComprehensiveTrackingSystem;