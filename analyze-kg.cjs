#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const KG_DIR = '/root/agents/knowledge-graph-entries';

// Categories for analysis
const categories = {
  mistakes: [],
  criticalIssues: [],
  solutions: [],
  patterns: [],
  authIssues: [],
  databaseIssues: [],
  buildIssues: [],
  apiIssues: [],
  configIssues: [],
  performanceIssues: []
};

// Read all JSON files
const files = fs.readdirSync(KG_DIR).filter(f => f.endsWith('.json'));

console.log(`\n📊 KNOWLEDGE GRAPH ANALYSIS (${files.length} entries)\n`);
console.log('=' .repeat(70));

files.forEach(file => {
  try {
    const content = JSON.parse(fs.readFileSync(path.join(KG_DIR, file), 'utf8'));
    const title = content.title || content.description || 'Untitled';
    const severity = content.severity || 'unknown';
    const status = content.status || 'open';
    
    // Categorize by keywords
    const text = JSON.stringify(content).toLowerCase();
    
    if (text.includes('mistake') || text.includes('wrong') || text.includes('should not') || 
        text.includes('guessing') || text.includes('wasted time')) {
      categories.mistakes.push({ title, severity, status, file });
    }
    
    if (severity === 'critical' || severity === 'high') {
      categories.criticalIssues.push({ title, severity, status, file });
    }
    
    if (content.solution && content.solution.successful) {
      categories.solutions.push({ title, solution: content.solution.description, file });
    }
    
    if (text.includes('auth') || text.includes('ssh') || text.includes('login') || text.includes('password')) {
      categories.authIssues.push({ title, severity, status, file });
    }
    
    if (text.includes('database') || text.includes('supabase') || text.includes('sql') || text.includes('migration')) {
      categories.databaseIssues.push({ title, severity, status, file });
    }
    
    if (text.includes('build') || text.includes('vite') || text.includes('compile') || text.includes('bundle')) {
      categories.buildIssues.push({ title, severity, status, file });
    }
    
    if (text.includes('api') || text.includes('mcp') || text.includes('n8n') || text.includes('webhook')) {
      categories.apiIssues.push({ title, severity, status, file });
    }
    
    if (text.includes('config') || text.includes('env') || text.includes('settings')) {
      categories.configIssues.push({ title, severity, status, file });
    }
    
    if (text.includes('performance') || text.includes('slow') || text.includes('optimize')) {
      categories.performanceIssues.push({ title, severity, status, file });
    }
    
  } catch (err) {
    // Skip invalid JSON files
  }
});

// Print analysis
console.log('\n🚨 CRITICAL MISTAKES TO AVOID:');
console.log('-'.repeat(70));
categories.mistakes.forEach(m => {
  console.log(`❌ ${m.title}`);
  console.log(`   Severity: ${m.severity} | Status: ${m.status}`);
});

console.log('\n⚠️ HIGH/CRITICAL ISSUES:');
console.log('-'.repeat(70));
categories.criticalIssues.forEach(i => {
  console.log(`🔴 ${i.title}`);
  console.log(`   Severity: ${i.severity} | Status: ${i.status}`);
});

console.log('\n✅ SUCCESSFUL SOLUTIONS:');
console.log('-'.repeat(70));
categories.solutions.slice(0, 10).forEach(s => {
  console.log(`✓ ${s.title}`);
  if (s.solution) {
    console.log(`  Solution: ${s.solution.substring(0, 100)}...`);
  }
});

console.log('\n📈 ISSUE PATTERNS:');
console.log('-'.repeat(70));
console.log(`Authentication Issues: ${categories.authIssues.length}`);
console.log(`Database Issues: ${categories.databaseIssues.length}`);
console.log(`Build/Compile Issues: ${categories.buildIssues.length}`);
console.log(`API/Integration Issues: ${categories.apiIssues.length}`);
console.log(`Configuration Issues: ${categories.configIssues.length}`);
console.log(`Performance Issues: ${categories.performanceIssues.length}`);

console.log('\n🔑 KEY LESSONS:');
console.log('-'.repeat(70));

// Extract key patterns
const lessons = new Set();

categories.mistakes.forEach(m => {
  if (m.title.includes('SSH')) lessons.add('SSH: Research client requirements before generating keys');
  if (m.title.includes('Notion')) lessons.add('API: Check for breaking changes in third-party APIs');
  if (m.title.includes('MCP')) lessons.add('MCP: Verify tool names from documentation, not assumptions');
  if (m.title.includes('build')) lessons.add('Build: Check dependency conflicts before major changes');
});

categories.databaseIssues.forEach(d => {
  if (d.title.includes('profile')) lessons.add('Database: Always verify triggers and constraints exist');
  if (d.title.includes('migration')) lessons.add('Database: Test migrations locally before production');
});

Array.from(lessons).forEach(lesson => {
  console.log(`• ${lesson}`);
});

console.log('\n📋 TOP RECURRING ISSUES:');
console.log('-'.repeat(70));

// Count recurring themes
const themes = {};
[...categories.mistakes, ...categories.criticalIssues].forEach(item => {
  const words = item.title.toLowerCase().split(/\s+/);
  words.forEach(word => {
    if (word.length > 4) {
      themes[word] = (themes[word] || 0) + 1;
    }
  });
});

Object.entries(themes)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([theme, count]) => {
    if (count > 1) {
      console.log(`• "${theme}" appears ${count} times`);
    }
  });

console.log('\n💡 RECOMMENDATIONS:');
console.log('-'.repeat(70));
console.log('1. ALWAYS run startup check at beginning of session');
console.log('2. RESEARCH before implementing - check docs, not guess');
console.log('3. CHECK Knowledge Graph for similar issues before starting');
console.log('4. LOG all issues and solutions immediately');
console.log('5. TEST locally before applying to production');
console.log('6. VERIFY assumptions with actual documentation');
console.log('7. USE existing patterns and solutions from KG');

console.log('\n=' .repeat(70));
console.log('Knowledge Graph analysis complete!');