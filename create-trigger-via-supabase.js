#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = 'https://pdikjpfulhhpqpxzpgtu.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupTrigger() {
    console.log('🔧 Setting up profile creation trigger...')
    
    try {
        // Read the SQL file
        const sqlContent = readFileSync('/root/agents/add-missing-profile-columns.sql', 'utf8')
        
        // Split into individual statements and execute them
        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'))
        
        console.log(`Found ${statements.length} SQL statements to execute`)
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i]
            if (statement.includes('SELECT') && statement.includes('as section')) {
                console.log(`Skipping verification statement ${i + 1}`)
                continue
            }
            
            console.log(`Executing statement ${i + 1}/${statements.length}...`)
            
            const { data, error } = await supabase.rpc('exec_sql', { sql: statement })
            
            if (error) {
                console.log(`❌ Error in statement ${i + 1}:`, error.message)
                // Continue with next statement
            } else {
                console.log(`✅ Statement ${i + 1} executed successfully`)
            }
        }
        
        console.log('🎉 Trigger setup complete!')
        
    } catch (error) {
        console.log('❌ Setup failed:', error.message)
    }
}

setupTrigger()