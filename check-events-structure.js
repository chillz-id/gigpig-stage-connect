#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pdikjpfulhhpqpxzpgtu.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkEventsStructure() {
    console.log('🔍 Checking events table structure...')
    
    try {
        // 1. Get one event to see its structure
        console.log('\n1. Fetching sample event...')
        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('*')
            .limit(1)
        
        if (eventsError) {
            console.log('❌ Error fetching events:', eventsError.message)
            return
        }
        
        if (events && events.length > 0) {
            console.log('✅ Event columns:')
            Object.keys(events[0]).forEach(col => {
                console.log(`   - ${col}: ${typeof events[0][col]} (${events[0][col] === null ? 'null' : 'has value'})`)
            })
            
            console.log('\n2. Sample event data:')
            console.log(`   Title: ${events[0].title}`)
            console.log(`   Status: ${events[0].status || 'No status field'}`)
            console.log(`   Created by: ${events[0].created_by || events[0].creator_id || events[0].user_id || 'Unknown field'}`)
        }
        
        // 2. Check all events statuses
        console.log('\n3. Checking event statuses...')
        const { data: allEvents, error: allError } = await supabase
            .from('events')
            .select('id, title, status')
        
        if (allError) {
            console.log('❌ Error fetching all events:', allError.message)
        } else {
            const statusCount = allEvents.reduce((acc, event) => {
                const status = event.status || 'no-status'
                acc[status] = (acc[status] || 0) + 1
                return acc
            }, {})
            
            console.log('✅ Event status distribution:')
            Object.entries(statusCount).forEach(([status, count]) => {
                console.log(`   - ${status}: ${count} events`)
            })
        }
        
    } catch (error) {
        console.log('❌ Check failed:', error.message)
    }
}

checkEventsStructure()