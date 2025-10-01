#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pdikjpfulhhpqpxzpgtu.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
    console.log('🔧 Applying event status migration...')

    try {
        // Since we can't execute raw SQL directly, let's check current status
        console.log('\n1. Checking current event statuses...')
        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('id, title, status')

        if (eventsError) {
            console.log('❌ Error fetching events:', eventsError.message)
            return
        }

        console.log(`✅ Found ${events.length} events`)
        const statusCounts = events.reduce((acc, event) => {
            acc[event.status] = (acc[event.status] || 0) + 1
            return acc
        }, {})

        console.log('Current status distribution:')
        Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`   - ${status}: ${count}`)
        })

        console.log('\n⚠️  IMPORTANT: The migration SQL needs to be run directly in Supabase')
        console.log('Please go to your Supabase dashboard:')
        console.log('1. Navigate to SQL Editor')
        console.log('2. Copy and run the contents of migrate-event-status.sql')
        console.log('\nThis will:')
        console.log('- Update the status CHECK constraint')
        console.log('- Create auto-completion trigger for past events')
        console.log('- Create the event_waitlist table')
        console.log('- Set up proper RLS policies')

    } catch (error) {
        console.log('❌ Migration check failed:', error.message)
    }
}

applyMigration()