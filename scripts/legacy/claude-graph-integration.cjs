#!/usr/bin/env node

/**
 * Knowledge Graph Integration System for Claude Code
 * Manages debugging session documentation, issue tracking, and solutions
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  ENTRIES_DIR: '/root/agents/knowledge-graph-entries',
  SIMILARITY_THRESHOLD: 0.8, // 80% similarity threshold for duplicate detection
  MAX_SEARCH_RESULTS: 10,
  SEVERITY_LEVELS: ['low', 'medium', 'high', 'critical'],
  DEFAULT_SEVERITY: 'medium'
};

/**
 * Generate a unique ID using crypto.randomBytes
 */
function generateUniqueId() {
  const timestamp = Date.now();
  const randomHex = crypto.randomBytes(4).toString('hex');
  return `${timestamp}-${randomHex}`;
}

/**
 * Calculate Levenshtein distance for string similarity
 */
function levenshteinDistance(str1, str2) {
  if (!str1 || !str2) return Math.max(str1?.length || 0, str2?.length || 0);
  
  const matrix = [];
  const len1 = str1.length;
  const len2 = str2.length;

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity percentage between two strings
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return (maxLength - distance) / maxLength;
}

/**
 * Get all existing entries from the knowledge graph
 */
async function getAllEntries() {
  try {
    await fs.access(CONFIG.ENTRIES_DIR);
    const files = await fs.readdir(CONFIG.ENTRIES_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    const entries = [];
    for (const file of jsonFiles) {
      try {
        const content = await fs.readFile(path.join(CONFIG.ENTRIES_DIR, file), 'utf8');
        const entry = JSON.parse(content);
        entry._filename = file;
        entries.push(entry);
      } catch (error) {
        console.warn(`Warning: Could not parse ${file}: ${error.message}`);
      }
    }
    
    return entries;
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(CONFIG.ENTRIES_DIR, { recursive: true });
      return [];
    }
    throw error;
  }
}

/**
 * Find similar existing issues to prevent duplicates
 */
async function findSimilarIssues(title, description) {
  const entries = await getAllEntries();
  const similar = [];
  
  for (const entry of entries) {
    const entryTitle = entry.title || entry.task || '';
    const entryDesc = entry.description || '';
    
    const titleSimilarity = calculateSimilarity(title, entryTitle);
    const descSimilarity = calculateSimilarity(description, entryDesc);
    const maxSimilarity = Math.max(titleSimilarity, descSimilarity);
    
    if (maxSimilarity >= CONFIG.SIMILARITY_THRESHOLD) {
      similar.push({
        entry,
        similarity: maxSimilarity,
        matchType: titleSimilarity > descSimilarity ? 'title' : 'description'
      });
    }
  }
  
  return similar.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Create ISO timestamp string
 */
function createTimestamp() {
  return new Date().toISOString();
}

/**
 * Create ISO date string (YYYY-MM-DD)
 */
function createDateString() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Log a new issue to the knowledge graph
 */
async function logIssue(title, description, severity = CONFIG.DEFAULT_SEVERITY) {
  try {
    // Validate severity
    if (!CONFIG.SEVERITY_LEVELS.includes(severity)) {
      console.warn(`Invalid severity "${severity}". Using default: ${CONFIG.DEFAULT_SEVERITY}`);
      severity = CONFIG.DEFAULT_SEVERITY;
    }
    
    // Check for similar existing issues
    const similar = await findSimilarIssues(title, description);
    
    if (similar.length > 0) {
      console.log(`\n🔍 Found ${similar.length} similar existing issue(s):`);
      for (const match of similar.slice(0, 3)) { // Show top 3 matches
        const entryTitle = match.entry.title || match.entry.task || 'Untitled';
        console.log(`  - ${entryTitle.substring(0, 80)}... (${Math.round(match.similarity * 100)}% similar)`);
        console.log(`    File: ${match.entry._filename}`);
      }
      
      console.log(`\nProceeding to create new issue. Consider referencing similar issues above.`);
    }
    
    // Create new issue entry
    const id = `issue-${generateUniqueId()}`;
    const timestamp = createTimestamp();
    const date = createDateString();
    
    const issue = {
      id,
      type: 'issue',
      severity,
      title,
      description,
      date,
      timestamp,
      status: 'open',
      investigation_time: null,
      solution: null,
      related_files: [],
      tags: extractTags(title, description),
      linear_issue_id: null,
      cross_references: similar.length > 0 ? similar.slice(0, 3).map(s => s.entry.id).filter(Boolean) : []
    };
    
    // Save to file
    const filename = `${id}.json`;
    const filepath = path.join(CONFIG.ENTRIES_DIR, filename);
    await fs.writeFile(filepath, JSON.stringify(issue, null, 2));
    
    console.log(`✅ Issue logged successfully:`);
    console.log(`   ID: ${id}`);
    console.log(`   Severity: ${severity}`);
    console.log(`   File: ${filename}`);
    if (similar.length > 0) {
      console.log(`   Cross-references: ${issue.cross_references.length} similar issues`);
    }
    
    return issue;
    
  } catch (error) {
    console.error(`❌ Failed to log issue: ${error.message}`);
    throw error;
  }
}

/**
 * Log a solution to an existing issue
 */
async function logSolution(issueIdentifier, solutionDescription, wasSuccessful = true) {
  try {
    const entries = await getAllEntries();
    
    // Find the issue by title, ID, or partial match
    let targetIssue = null;
    let targetFile = null;
    
    for (const entry of entries) {
      if (entry.id === issueIdentifier || 
          (entry.title && entry.title.toLowerCase().includes(issueIdentifier.toLowerCase())) ||
          (entry.task && entry.task.toLowerCase().includes(issueIdentifier.toLowerCase()))) {
        targetIssue = entry;
        targetFile = entry._filename;
        break;
      }
    }
    
    if (!targetIssue) {
      // Create a new solution entry if issue not found
      console.log(`⚠️  Issue "${issueIdentifier}" not found. Creating new solution entry.`);
      
      const id = `solution-${generateUniqueId()}`;
      const timestamp = createTimestamp();
      const date = createDateString();
      
      const solution = {
        id,
        type: 'solution',
        severity: 'medium',
        title: `Solution: ${issueIdentifier}`,
        description: solutionDescription,
        date,
        timestamp,
        status: wasSuccessful ? 'resolved' : 'attempted',
        investigation_time: null,
        solution: solutionDescription,
        success: wasSuccessful,
        related_files: [],
        tags: extractTags(issueIdentifier, solutionDescription),
        linear_issue_id: null,
        cross_references: []
      };
      
      const filename = `${id}.json`;
      const filepath = path.join(CONFIG.ENTRIES_DIR, filename);
      await fs.writeFile(filepath, JSON.stringify(solution, null, 2));
      
      console.log(`✅ Solution logged as new entry:`);
      console.log(`   ID: ${id}`);
      console.log(`   Status: ${solution.status}`);
      console.log(`   File: ${filename}`);
      
      return solution;
    }
    
    // Update existing issue with solution
    targetIssue.solution = solutionDescription;
    targetIssue.status = wasSuccessful ? 'resolved' : 'in-progress';
    targetIssue.solution_timestamp = createTimestamp();
    
    // Add solution success flag
    if (typeof wasSuccessful === 'boolean') {
      targetIssue.solution_successful = wasSuccessful;
    }
    
    // Remove filename from entry before saving
    delete targetIssue._filename;
    
    const filepath = path.join(CONFIG.ENTRIES_DIR, targetFile);
    await fs.writeFile(filepath, JSON.stringify(targetIssue, null, 2));
    
    console.log(`✅ Solution logged for existing issue:`);
    console.log(`   Issue: ${targetIssue.title || targetIssue.task || 'Untitled'}`);
    console.log(`   Status: ${targetIssue.status}`);
    console.log(`   Success: ${wasSuccessful}`);
    console.log(`   File: ${targetFile}`);
    
    return targetIssue;
    
  } catch (error) {
    console.error(`❌ Failed to log solution: ${error.message}`);
    throw error;
  }
}

/**
 * Extract relevant tags from title and description
 */
function extractTags(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  const tags = [];
  
  // Common issue types
  const tagPatterns = {
    'error': /error|fail|crash|bug/,
    'auth': /auth|login|token|permission/,
    'api': /api|endpoint|request|response/,
    'database': /database|table|query|sql/,
    'ui': /component|render|display|ui/,
    'performance': /slow|performance|optimize|speed/,
    'security': /security|vulnerability|expose/,
    'config': /config|setup|environment|env/,
    'test': /test|spec|coverage/,
    'deployment': /deploy|build|production/,
    'mcp': /mcp|tool|integration/,
    'supabase': /supabase/,
    'react': /react|component|hook/,
    'typescript': /typescript|type|interface/
  };
  
  for (const [tag, pattern] of Object.entries(tagPatterns)) {
    if (pattern.test(text)) {
      tags.push(tag);
    }
  }
  
  return tags;
}

/**
 * Query the knowledge graph for issues matching search terms
 */
async function queryGraph(searchTerms) {
  try {
    const entries = await getAllEntries();
    
    if (entries.length === 0) {
      console.log('📊 Knowledge graph is empty. No entries found.');
      return [];
    }
    
    const searchLower = searchTerms.toLowerCase();
    const matches = [];
    
    for (const entry of entries) {
      let score = 0;
      let matchFields = [];
      
      // Search in title/task
      const title = entry.title || entry.task || '';
      if (title.toLowerCase().includes(searchLower)) {
        score += 3;
        matchFields.push('title');
      }
      
      // Search in description
      if (entry.description && entry.description.toLowerCase().includes(searchLower)) {
        score += 2;
        matchFields.push('description');
      }
      
      // Search in tags
      if (entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(searchLower))) {
        score += 1;
        matchFields.push('tags');
      }
      
      if (score > 0) {
        matches.push({
          entry,
          score,
          matchFields
        });
      }
    }
    
    // Sort by relevance score
    matches.sort((a, b) => b.score - a.score);
    
    console.log(`\n🔍 Found ${matches.length} matching entries for "${searchTerms}":\n`);
    
    const topMatches = matches.slice(0, CONFIG.MAX_SEARCH_RESULTS);
    
    for (const match of topMatches) {
      const entry = match.entry;
      const title = entry.title || entry.task || 'Untitled';
      const status = entry.status || 'unknown';
      const severity = entry.severity || 'unknown';
      const date = entry.date || 'unknown';
      
      console.log(`📋 ${title.substring(0, 80)}${title.length > 80 ? '...' : ''}`);
      console.log(`   Status: ${status} | Severity: ${severity} | Date: ${date}`);
      console.log(`   Matches: ${match.matchFields.join(', ')} | Score: ${match.score}`);
      console.log(`   File: ${entry._filename || 'unknown'}`);
      
      if (entry.description) {
        const desc = entry.description.substring(0, 150);
        console.log(`   Description: ${desc}${entry.description.length > 150 ? '...' : ''}`);
      }
      
      console.log('');
    }
    
    return topMatches;
    
  } catch (error) {
    console.error(`❌ Failed to query knowledge graph: ${error.message}`);
    throw error;
  }
}

/**
 * Check for similar issues before starting work
 */
async function checkSimilarIssues(plannedWork) {
  try {
    console.log(`\n🔍 Checking for similar issues to: "${plannedWork}"`);
    
    const entries = await getAllEntries();
    const criticalIssues = entries.filter(e => 
      e.severity === 'critical' && 
      (e.status === 'open' || e.status === 'in-progress')
    );
    
    if (criticalIssues.length > 0) {
      console.log(`\n🚨 CRITICAL ISSUES FOUND (${criticalIssues.length}):`);
      for (const issue of criticalIssues.slice(0, 5)) {
        const title = issue.title || issue.task || 'Untitled';
        console.log(`   - ${title.substring(0, 80)}${title.length > 80 ? '...' : ''}`);
        console.log(`     Status: ${issue.status} | Date: ${issue.date || 'unknown'}`);
      }
      console.log(`\n⚠️  Consider addressing critical issues before proceeding with new work.\n`);
    }
    
    // Search for similar work
    const similar = [];
    const searchLower = plannedWork.toLowerCase();
    
    for (const entry of entries) {
      const title = entry.title || entry.task || '';
      const desc = entry.description || '';
      
      const titleSim = calculateSimilarity(plannedWork, title);
      const descSim = calculateSimilarity(plannedWork, desc);
      const maxSim = Math.max(titleSim, descSim);
      
      if (maxSim >= 0.4) { // Lower threshold for checking work
        similar.push({
          entry,
          similarity: maxSim
        });
      }
    }
    
    similar.sort((a, b) => b.similarity - a.similarity);
    
    if (similar.length > 0) {
      console.log(`\n📚 Found ${similar.length} related entries:`);
      for (const match of similar.slice(0, 5)) {
        const entry = match.entry;
        const title = entry.title || entry.task || 'Untitled';
        const status = entry.status || 'unknown';
        const similarity = Math.round(match.similarity * 100);
        
        console.log(`   - ${title.substring(0, 70)}... (${similarity}% similar)`);
        console.log(`     Status: ${status} | File: ${entry._filename || 'unknown'}`);
      }
      console.log(`\n💡 Review these entries to avoid duplicating work or learn from past solutions.\n`);
    } else {
      console.log(`\n✨ No similar work found. This appears to be new territory.\n`);
    }
    
    return {
      critical: criticalIssues,
      similar: similar.slice(0, 10)
    };
    
  } catch (error) {
    console.error(`❌ Failed to check similar issues: ${error.message}`);
    throw error;
  }
}

/**
 * Show knowledge graph status
 */
async function showStatus() {
  try {
    const entries = await getAllEntries();
    
    if (entries.length === 0) {
      console.log('📊 Knowledge Graph Status: Empty\n');
      return;
    }
    
    // Categorize entries
    const stats = {
      total: entries.length,
      byType: {},
      bySeverity: {},
      byStatus: {},
      recent: []
    };
    
    for (const entry of entries) {
      // Count by type
      const type = entry.type || 'unknown';
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      
      // Count by severity
      const severity = entry.severity || 'unknown';
      stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;
      
      // Count by status
      const status = entry.status || 'unknown';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
      
      // Check if recent (last 7 days)
      const entryDate = new Date(entry.timestamp || entry.date || 0);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (entryDate > weekAgo) {
        stats.recent.push(entry);
      }
    }
    
    // Sort recent entries by date
    stats.recent.sort((a, b) => {
      const dateA = new Date(a.timestamp || a.date || 0);
      const dateB = new Date(b.timestamp || b.date || 0);
      return dateB - dateA;
    });
    
    console.log('📊 Knowledge Graph Status:');
    console.log(`   Total Entries: ${stats.total}`);
    console.log(`   Recent (7 days): ${stats.recent.length}`);
    console.log('');
    
    console.log('📈 By Type:');
    for (const [type, count] of Object.entries(stats.byType)) {
      console.log(`   ${type}: ${count}`);
    }
    console.log('');
    
    console.log('⚡ By Severity:');
    for (const [severity, count] of Object.entries(stats.bySeverity)) {
      const icon = severity === 'critical' ? '🚨' : severity === 'high' ? '⚠️' : severity === 'medium' ? '📋' : '💡';
      console.log(`   ${icon} ${severity}: ${count}`);
    }
    console.log('');
    
    console.log('🔄 By Status:');
    for (const [status, count] of Object.entries(stats.byStatus)) {
      console.log(`   ${status}: ${count}`);
    }
    console.log('');
    
    if (stats.recent.length > 0) {
      console.log('🕒 Recent Activity:');
      for (const entry of stats.recent.slice(0, 5)) {
        const title = entry.title || entry.task || 'Untitled';
        const date = entry.date || 'unknown';
        const status = entry.status || 'unknown';
        console.log(`   - ${title.substring(0, 60)}... (${date}, ${status})`);
      }
      if (stats.recent.length > 5) {
        console.log(`   ... and ${stats.recent.length - 5} more recent entries`);
      }
    }
    
    console.log('');
    
  } catch (error) {
    console.error(`❌ Failed to show status: ${error.message}`);
    throw error;
  }
}

/**
 * Main CLI function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'check':
        if (!args[1]) {
          console.error('❌ Usage: check "planned work description"');
          process.exit(1);
        }
        await checkSimilarIssues(args[1]);
        break;
        
      case 'log-issue':
        if (!args[1] || !args[2]) {
          console.error('❌ Usage: log-issue "title" "description" [severity]');
          console.error('   Severity levels: low, medium, high, critical (default: medium)');
          process.exit(1);
        }
        await logIssue(args[1], args[2], args[3] || CONFIG.DEFAULT_SEVERITY);
        break;
        
      case 'log-solution':
        if (!args[1] || !args[2]) {
          console.error('❌ Usage: log-solution "issue-identifier" "solution description" [success]');
          console.error('   Success: true/false (default: true)');
          process.exit(1);
        }
        const success = args[3] !== undefined ? args[3].toLowerCase() === 'true' : true;
        await logSolution(args[1], args[2], success);
        break;
        
      case 'query':
        if (!args[1]) {
          console.error('❌ Usage: query "search terms"');
          process.exit(1);
        }
        await queryGraph(args[1]);
        break;
        
      case 'status':
        await showStatus();
        break;
        
      default:
        console.log('🧠 Knowledge Graph Integration System');
        console.log('');
        console.log('Commands:');
        console.log('  check "planned work"          - Check for similar issues before starting work');
        console.log('  log-issue "title" "desc" [severity] - Log a new issue');
        console.log('  log-solution "issue" "solution" [success] - Log a solution to an issue');
        console.log('  query "search terms"          - Search the knowledge graph');
        console.log('  status                        - Show knowledge graph statistics');
        console.log('');
        console.log('Examples:');
        console.log('  node claude-graph-integration.js check "implement user authentication"');
        console.log('  node claude-graph-integration.js log-issue "API timeout" "Users experiencing 30s timeouts" high');
        console.log('  node claude-graph-integration.js log-solution "API timeout" "Increased timeout to 60s" true');
        console.log('  node claude-graph-integration.js query "authentication"');
        console.log('  node claude-graph-integration.js status');
    }
    
  } catch (error) {
    console.error(`❌ Command failed: ${error.message}`);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Export functions for programmatic use
module.exports = {
  logIssue,
  logSolution,
  queryGraph,
  checkSimilarIssues,
  showStatus,
  getAllEntries,
  findSimilarIssues,
  calculateSimilarity,
  generateUniqueId
};

// Run CLI if called directly
if (require.main === module) {
  main();
}