#!/usr/bin/env node

/**
 * Remove Unused Imports - Script to clean up unused imports based on analysis
 * This addresses the 284 unused imports across 149 files identified in the codebase analysis
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Files with known unused imports from the analysis
const filesToClean = [
  'analyze-financial-data.js',
  'apply-event-migration.js',
  'scripts/apply-customer-fields-migration.js',
  'scripts/apply-customers-migration.js',
  'scripts/complete-enhanced-deployment.js',
  'scripts/humanitix-event-analysis.js',
  'scripts/migrate-customers-to-brevo.js',
  'scripts/n8n-automation.js',
  'simple-mcp-client.js',
  'src/App.tsx',
  'src/components/ApplicationForm.tsx',
  'src/components/BrandingCustomization.tsx',
  'src/components/CalendarSync.tsx',
  'src/components/CalendarView.tsx',
  'src/components/CardCalendar.tsx',
  'src/components/CommissionSplitManager.tsx',
  'src/components/ConnectionRequest.tsx',
  'src/components/ContactSettings.tsx',
  'src/components/CustomRecurrencePicker.tsx',
  'src/components/DockNavigation.tsx'
];

// Known unused imports mapping
const unusedImportMappings = {
  'analyze-financial-data.js': {
    'path from \'path\'': 9
  },
  'apply-event-migration.js': {
    'readFileSync from \'fs\'': 4
  },
  'scripts/apply-customer-fields-migration.js': {
    'promises from \'fs\'': 9
  },
  'scripts/apply-customers-migration.js': {
    'promises from \'fs\'': 9
  },
  'scripts/complete-enhanced-deployment.js': {
    'promises from \'fs\'': 9
  },
  'scripts/humanitix-event-analysis.js': {
    'promisify from \'util\'': 11
  },
  'scripts/migrate-customers-to-brevo.js': {
    'promises from \'fs\'': 12
  },
  'scripts/n8n-automation.js': {
    'execSync from \'child_process\'': 8,
    'readFileSync from \'fs\'': 9,
    'writeFileSync from \'fs\'': 9
  },
  'simple-mcp-client.js': {
    'spawn from \'child_process\'': 8
  },
  'src/App.tsx': {
    'BrowserRouter from \'react-router-dom\'': 2
  },
  'src/components/ApplicationForm.tsx': {
    'useNavigate from \'react-router-dom\'': 2
  },
  'src/components/BrandingCustomization.tsx': {
    'Badge from \'@/components/ui/badge\'': 8,
    'Avatar from \'@/components/ui/avatar\'': 9,
    'AvatarFallback from \'@/components/ui/avatar\'': 9,
    'AvatarImage from \'@/components/ui/avatar\'': 9
  },
  'src/components/CalendarSync.tsx': {
    'useEffect from \'react\'': 2
  }
};

class UnusedImportCleaner {
  constructor() {
    this.cleanedFiles = [];
    this.errorFiles = [];
    this.totalImportsRemoved = 0;
  }

  async cleanFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        return;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const fileName = path.basename(filePath);
      const mappings = unusedImportMappings[filePath] || unusedImportMappings[fileName];

      if (!mappings) {
        console.log(`ℹ️  No unused import mappings for: ${filePath}`);
        return;
      }

      let modifiedContent = content;
      let importsRemoved = 0;

      // Process each unused import
      for (const [unusedImport, lineNumber] of Object.entries(mappings)) {
        const patterns = this.generateRemovalPatterns(unusedImport);
        
        for (const pattern of patterns) {
          const originalLength = modifiedContent.length;
          modifiedContent = modifiedContent.replace(pattern.regex, pattern.replacement);
          
          if (modifiedContent.length !== originalLength) {
            importsRemoved++;
            console.log(`  ✓ Removed: ${unusedImport}`);
            break; // Move to next import
          }
        }
      }

      if (importsRemoved > 0) {
        // Clean up any empty import lines or malformed imports
        modifiedContent = this.cleanupImportLines(modifiedContent);
        
        fs.writeFileSync(filePath, modifiedContent);
        this.cleanedFiles.push(filePath);
        this.totalImportsRemoved += importsRemoved;
        console.log(`✅ Cleaned ${filePath}: ${importsRemoved} imports removed`);
      } else {
        console.log(`ℹ️  No imports removed from ${filePath}`);
      }

    } catch (error) {
      console.error(`❌ Error cleaning ${filePath}:`, error.message);
      this.errorFiles.push(filePath);
    }
  }

  generateRemovalPatterns(unusedImport) {
    const [importName, fromModule] = unusedImport.split(' from ');
    const cleanImportName = importName.trim();
    const cleanModule = fromModule.replace(/['"]/g, '');

    return [
      // Single import on its own line
      {
        regex: new RegExp(`^import\\s+${this.escapeRegExp(cleanImportName)}\\s+from\\s+['"]${this.escapeRegExp(cleanModule)}['"];?\\s*$`, 'gm'),
        replacement: ''
      },
      // Part of a destructured import (with comma after)
      {
        regex: new RegExp(`\\b${this.escapeRegExp(cleanImportName)},\\s*`, 'g'),
        replacement: ''
      },
      // Part of a destructured import (with comma before)
      {
        regex: new RegExp(`,\\s*${this.escapeRegExp(cleanImportName)}\\b`, 'g'),
        replacement: ''
      },
      // Only import in destructured import (remove entire line)
      {
        regex: new RegExp(`^import\\s*{\\s*${this.escapeRegExp(cleanImportName)}\\s*}\\s+from\\s+['"]${this.escapeRegExp(cleanModule)}['"];?\\s*$`, 'gm'),
        replacement: ''
      }
    ];
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  cleanupImportLines(content) {
    return content
      // Remove empty import lines
      .replace(/^import\s*{\s*}\s+from\s+['"'][^'"]+['"];\s*$/gm, '')
      // Remove lines with only whitespace
      .replace(/^\s*$/gm, '')
      // Normalize multiple empty lines to single empty line
      .replace(/\n\n\n+/g, '\n\n');
  }

  async run() {
    console.log('🧹 Starting Unused Import Cleanup');
    console.log('='.repeat(50));
    
    let processedFiles = 0;
    
    for (const file of filesToClean) {
      console.log(`\n📂 Processing: ${file}`);
      await this.cleanFile(file);
      processedFiles++;
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 CLEANUP SUMMARY');
    console.log('='.repeat(50));
    console.log(`📁 Files processed: ${processedFiles}`);
    console.log(`✅ Files cleaned: ${this.cleanedFiles.length}`);
    console.log(`❌ Files with errors: ${this.errorFiles.length}`);
    console.log(`🗑️  Total imports removed: ${this.totalImportsRemoved}`);
    
    if (this.cleanedFiles.length > 0) {
      console.log('\n✅ Successfully cleaned files:');
      this.cleanedFiles.forEach(file => console.log(`   ${file}`));
    }

    if (this.errorFiles.length > 0) {
      console.log('\n❌ Files with errors:');
      this.errorFiles.forEach(file => console.log(`   ${file}`));
    }

    console.log(`\n🎉 Unused import cleanup completed!`);
    console.log(`   Estimated cleanup: ${this.totalImportsRemoved} imports removed`);
  }
}

// Execute cleanup
const cleaner = new UnusedImportCleaner();
cleaner.run().catch(console.error);