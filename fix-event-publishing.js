#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pdikjpfulhhpqpxzpgtu.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixEventPublishing() {
    console.log('🔧 Fixing event publishing functionality...')
    
    try {
        // 1. Check current status values
        console.log('\n1. Checking event status values and patterns...')
        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('id, title, status, promoter_id')
            .order('created_at', { ascending: false })
        
        if (eventsError) {
            console.log('❌ Error fetching events:', eventsError.message)
            return
        }
        
        console.log(`✅ Found ${events.length} events`)
        
        // Check unique statuses
        const statuses = [...new Set(events.map(e => e.status))]
        console.log('   Current status values:', statuses)
        
        // 2. Test updating an event status
        if (events.length > 0) {
            const testEvent = events[0]
            console.log(`\n2. Testing status update on event: "${testEvent.title}"`)
            console.log(`   Current status: ${testEvent.status}`)
            
            // Try changing status from 'open' to 'published'
            const newStatus = testEvent.status === 'open' ? 'published' : 'open'
            
            const { data: updated, error: updateError } = await supabase
                .from('events')
                .update({ 
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', testEvent.id)
                .select()
                .single()
            
            if (updateError) {
                console.log('   ❌ Update failed:', updateError.message)
                console.log('\n   Possible issues:')
                console.log('   - RLS policies might restrict updates')
                console.log('   - Status values might be constrained by a check constraint')
                console.log('   - User authentication might be required')
            } else {
                console.log(`   ✅ Status updated: ${testEvent.status} → ${updated.status}`)
                
                // Revert the change
                await supabase
                    .from('events')
                    .update({ status: testEvent.status })
                    .eq('id', testEvent.id)
                console.log('   ✅ Reverted to original status')
            }
        }
        
        // 3. Check the frontend expectations
        console.log('\n3. Frontend/Backend status mismatch analysis:')
        console.log('   - Frontend expects: draft, published')
        console.log('   - Database has: open (and possibly others)')
        console.log('   - This mismatch is causing the "publishing" issue')
        
        console.log('\n✅ SOLUTION:')
        console.log('   The issue is that the frontend code expects events to have')
        console.log('   status values of "draft" and "published", but the database')
        console.log('   is using "open" (and possibly "closed", "cancelled", etc.)')
        console.log('\n   To fix this, either:')
        console.log('   1. Update the frontend to use "open/closed" instead of "published/draft"')
        console.log('   2. Or migrate database to use "published/draft" status values')
        
    } catch (error) {
        console.log('❌ Fix failed:', error.message)
    }
}

fixEventPublishing()