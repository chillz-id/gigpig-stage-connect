#!/usr/bin/env node

/**
 * Genuine Analysis Engine
 * Actually analyzes the real codebase using real tools
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const crypto = require('crypto');

class GenuineAnalysisEngine {
  constructor() {
    this.rootDir = '/root/agents';
    this.results = {};
    this.startTime = Date.now();
  }

  log(message) {
    const elapsed = Math.round((Date.now() - this.startTime) / 1000);
    console.log(`[${elapsed}s] ${message}`);
  }

  /**
   * REAL file scanning - actually reads and processes files
   */
  async scanRealFiles() {
    this.log('🔍 Starting REAL file system scan...');
    
    const files = [];
    
    const scanDir = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        // Skip directories we don't want to analyze
        if (entry.name.match(/^(node_modules|\.git|dist|build|\.next|coverage)$/)) {
          continue;
        }
        
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.name.match(/\.(js|jsx|ts|tsx|json|css|scss|html|md|sql)$/)) {
          try {
            const stats = fs.statSync(fullPath);
            const content = fs.readFileSync(fullPath, 'utf8');
            
            files.push({
              path: fullPath,
              relativePath: path.relative(this.rootDir, fullPath),
              size: stats.size,
              extension: path.extname(entry.name),
              content: content,
              lines: content.split('\n').length,
              hash: crypto.createHash('md5').update(content).digest('hex'),
              lastModified: stats.mtime
            });
          } catch (error) {
            this.log(`❌ Could not read ${fullPath}: ${error.message}`);
          }
        }
      }
    };

    scanDir(this.rootDir);
    
    this.log(`📊 Scanned ${files.length} actual files`);
    return files;
  }

  /**
   * REAL duplicate detection - compares actual file contents
   */
  async findRealDuplicates(files) {
    this.log('🔍 Finding REAL duplicate files by content hash...');
    
    const hashGroups = new Map();
    const duplicates = [];
    
    // Group files by hash
    for (const file of files) {
      if (!hashGroups.has(file.hash)) {
        hashGroups.set(file.hash, []);
      }
      hashGroups.get(file.hash).push(file);
    }
    
    // Find groups with multiple files (duplicates)
    for (const [hash, fileGroup] of hashGroups) {
      if (fileGroup.length > 1) {
        // Skip tiny files (likely just imports or empty)
        if (fileGroup[0].size > 100) {
          duplicates.push({
            hash: hash,
            files: fileGroup.map(f => f.relativePath),
            size: fileGroup[0].size,
            lines: fileGroup[0].lines
          });
        }
      }
    }
    
    this.log(`📋 Found ${duplicates.length} REAL duplicate file groups`);
    return duplicates;
  }

  /**
   * REAL complexity analysis - counts actual lines, functions, etc.
   */
  async analyzeRealComplexity(files) {
    this.log('🔍 Analyzing REAL component complexity...');
    
    const complexFiles = [];
    
    for (const file of files) {
      if (file.extension.match(/\.(js|jsx|ts|tsx)$/)) {
        const content = file.content;
        
        // Real metrics
        const functionCount = (content.match(/function\s+\w+|const\s+\w+\s*=\s*\(|\w+\s*=>\s*{|async\s+function/g) || []).length;
        const ifStatements = (content.match(/if\s*\(/g) || []).length;
        const forLoops = (content.match(/for\s*\(/g) || []).length;
        const whileLoops = (content.match(/while\s*\(/g) || []).length;
        const switchStatements = (content.match(/switch\s*\(/g) || []).length;
        const classCount = (content.match(/class\s+\w+/g) || []).length;
        const importCount = (content.match(/^import\s+/gm) || []).length;
        
        // Simple cyclomatic complexity approximation
        const cyclomaticComplexity = 1 + ifStatements + forLoops + whileLoops + switchStatements;
        
        // Consider files complex if they meet certain thresholds
        const isComplex = (
          file.lines > 300 ||
          functionCount > 20 ||
          cyclomaticComplexity > 15 ||
          file.size > 20000
        );
        
        if (isComplex) {
          complexFiles.push({
            path: file.relativePath,
            lines: file.lines,
            size: file.size,
            functions: functionCount,
            cyclomaticComplexity: cyclomaticComplexity,
            classes: classCount,
            imports: importCount,
            complexity_score: Math.round((cyclomaticComplexity * 0.4) + (file.lines * 0.01) + (functionCount * 0.2))
          });
        }
      }
    }
    
    // Sort by complexity score
    complexFiles.sort((a, b) => b.complexity_score - a.complexity_score);
    
    this.log(`📊 Found ${complexFiles.length} REAL complex files`);
    return complexFiles;
  }

  /**
   * REAL unused import detection
   */
  async findRealUnusedImports(files) {
    this.log('🔍 Finding REAL unused imports...');
    
    const filesWithUnused = [];
    
    for (const file of files) {
      if (file.extension.match(/\.(js|jsx|ts|tsx)$/)) {
        const content = file.content;
        const lines = content.split('\n');
        
        const imports = [];
        const unusedImports = [];
        
        // Extract import statements
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          // Match various import patterns
          const importMatch = line.match(/^import\s+(.+?)\s+from\s+['"](.+?)['"]/);
          if (importMatch) {
            const importedItems = importMatch[1];
            const moduleName = importMatch[2];
            
            // Extract individual imported items
            let items = [];
            if (importedItems.includes('{')) {
              // Named imports: import { a, b, c } from 'module'
              const namedImports = importedItems.match(/\{([^}]+)\}/);
              if (namedImports) {
                items = namedImports[1].split(',').map(item => item.trim().split(' as ')[0].trim());
              }
            } else if (!importedItems.includes('*')) {
              // Default import: import Something from 'module'
              items = [importedItems.trim()];
            }
            
            // Check if each imported item is actually used
            for (const item of items) {
              if (item && item !== 'React') { // Skip React as it's often used implicitly
                const usageRegex = new RegExp(`\\b${item}\\b`, 'g');
                const contentWithoutImports = content.replace(/^import.*$/gm, '');
                
                if (!usageRegex.test(contentWithoutImports)) {
                  unusedImports.push({
                    item: item,
                    module: moduleName,
                    line: i + 1
                  });
                }
              }
            }
          }
        }
        
        if (unusedImports.length > 0) {
          filesWithUnused.push({
            path: file.relativePath,
            unusedImports: unusedImports,
            count: unusedImports.length
          });
        }
      }
    }
    
    this.log(`📊 Found ${filesWithUnused.length} files with REAL unused imports`);
    return filesWithUnused;
  }

  /**
   * REAL bundle analysis using actual build tools
   */
  async analyzeRealBundle() {
    this.log('🔍 Running REAL bundle analysis...');
    
    try {
      // Check if we have a build script
      const packageJson = JSON.parse(fs.readFileSync(path.join(this.rootDir, 'package.json'), 'utf8'));
      
      if (packageJson.scripts && packageJson.scripts.build) {
        this.log('📦 Running npm run build to analyze bundle...');
        
        // Run the actual build command
        const buildResult = execSync('npm run build', { 
          cwd: this.rootDir, 
          encoding: 'utf8',
          timeout: 120000, // 2 minute timeout
          stdio: 'pipe'
        });
        
        // Check for build output files
        const distDir = path.join(this.rootDir, 'dist');
        if (fs.existsSync(distDir)) {
          const distFiles = fs.readdirSync(distDir, { recursive: true })
            .filter(file => file.endsWith('.js') || file.endsWith('.css'))
            .map(file => {
              const filePath = path.join(distDir, file);
              const stats = fs.statSync(filePath);
              return {
                name: file,
                size: stats.size,
                sizeKB: Math.round(stats.size / 1024)
              };
            });
          
          const totalSize = distFiles.reduce((sum, file) => sum + file.size, 0);
          
          this.log(`📊 Build completed - Total bundle size: ${Math.round(totalSize / 1024)}KB`);
          
          return {
            success: true,
            totalSize: totalSize,
            totalSizeKB: Math.round(totalSize / 1024),
            files: distFiles,
            buildOutput: buildResult
          };
        }
      }
      
      return {
        success: false,
        error: 'No build script or dist directory found'
      };
      
    } catch (error) {
      this.log(`❌ Bundle analysis failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * REAL test coverage using actual Jest
   */
  async analyzeRealTestCoverage() {
    this.log('🔍 Running REAL test coverage analysis...');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(this.rootDir, 'package.json'), 'utf8'));
      
      if (packageJson.scripts && (packageJson.scripts['test:coverage'] || packageJson.scripts.test)) {
        const testCommand = packageJson.scripts['test:coverage'] || packageJson.scripts.test + ' --coverage';
        
        this.log('🧪 Running test coverage command...');
        
        const testResult = execSync(testCommand, {
          cwd: this.rootDir,
          encoding: 'utf8',
          timeout: 180000, // 3 minute timeout
          stdio: 'pipe'
        });
        
        // Parse coverage output
        const coverageMatch = testResult.match(/All files\s+\|\s+(\d+\.?\d*)\s+\|\s+(\d+\.?\d*)\s+\|\s+(\d+\.?\d*)\s+\|\s+(\d+\.?\d*)/);
        
        if (coverageMatch) {
          return {
            success: true,
            statements: parseFloat(coverageMatch[1]),
            branches: parseFloat(coverageMatch[2]),
            functions: parseFloat(coverageMatch[3]),
            lines: parseFloat(coverageMatch[4]),
            output: testResult
          };
        }
        
        return {
          success: true,
          output: testResult,
          note: 'Coverage metrics not parsed - check output'
        };
      }
      
      return {
        success: false,
        error: 'No test script found'
      };
      
    } catch (error) {
      this.log(`❌ Test coverage failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute comprehensive REAL analysis
   */
  async executeRealAnalysis() {
    this.log('🚀 Starting GENUINE codebase analysis...');
    this.log('⚠️  This will take several minutes as it actually analyzes your code');
    
    const startTime = Date.now();
    
    // Phase 1: File scanning
    const files = await this.scanRealFiles();
    
    // Phase 2: Analysis tasks
    const [duplicates, complexFiles, unusedImports] = await Promise.all([
      this.findRealDuplicates(files),
      this.analyzeRealComplexity(files),
      this.findRealUnusedImports(files)
    ]);
    
    // Phase 3: Build analysis (sequential due to resource usage)
    const bundleAnalysis = await this.analyzeRealBundle();
    
    // Phase 4: Test coverage
    const testCoverage = await this.analyzeRealTestCoverage();
    
    const endTime = Date.now();
    const durationMinutes = Math.round((endTime - startTime) / 60000);
    
    const results = {
      analysis_type: 'GENUINE_CODEBASE_ANALYSIS',
      generated_at: new Date().toISOString(),
      duration_minutes: durationMinutes,
      total_files: files.length,
      
      file_statistics: {
        total_files: files.length,
        by_extension: this.groupFilesByExtension(files),
        largest_files: files.sort((a, b) => b.size - a.size).slice(0, 10)
          .map(f => ({ path: f.relativePath, size: f.size, lines: f.lines }))
      },
      
      duplicate_analysis: {
        total_duplicates: duplicates.length,
        duplicates: duplicates
      },
      
      complexity_analysis: {
        total_complex_files: complexFiles.length,
        most_complex: complexFiles.slice(0, 10),
        average_complexity: complexFiles.length > 0 
          ? Math.round(complexFiles.reduce((sum, f) => sum + f.complexity_score, 0) / complexFiles.length)
          : 0
      },
      
      unused_imports: {
        total_files_with_unused: unusedImports.length,
        total_unused_imports: unusedImports.reduce((sum, f) => sum + f.count, 0),
        files: unusedImports.slice(0, 20) // Top 20
      },
      
      bundle_analysis: bundleAnalysis,
      test_coverage: testCoverage
    };
    
    // Save results
    fs.writeFileSync('/root/agents/genuine-analysis-results.json', JSON.stringify(results, null, 2));
    
    this.log(`✅ GENUINE analysis completed in ${durationMinutes} minutes`);
    this.log(`📊 Results saved to: genuine-analysis-results.json`);
    
    // Print summary
    console.log('\n📊 GENUINE ANALYSIS SUMMARY:');
    console.log(`📁 Total Files: ${results.total_files}`);
    console.log(`🔄 Duplicates: ${results.duplicate_analysis.total_duplicates}`);
    console.log(`🧩 Complex Files: ${results.complexity_analysis.total_complex_files}`);
    console.log(`📦 Bundle Size: ${bundleAnalysis.success ? bundleAnalysis.totalSizeKB + 'KB' : 'Analysis failed'}`);
    console.log(`🧪 Test Coverage: ${testCoverage.success ? testCoverage.lines + '%' : 'Analysis failed'}`);
    console.log(`⏱️  Duration: ${durationMinutes} minutes`);
    
    return results;
  }

  groupFilesByExtension(files) {
    const groups = {};
    for (const file of files) {
      const ext = file.extension || 'no-extension';
      groups[ext] = (groups[ext] || 0) + 1;
    }
    return groups;
  }
}

// Run if called directly
if (require.main === module) {
  const engine = new GenuineAnalysisEngine();
  
  engine.executeRealAnalysis()
    .then(results => {
      console.log('\n🎉 GENUINE analysis completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ GENUINE analysis failed:', error);
      process.exit(1);
    });
}

module.exports = GenuineAnalysisEngine;