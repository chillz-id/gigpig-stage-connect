#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pdikjpfulhhpqpxzpgtu.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testEventPublishing() {
    console.log('🔍 Testing event publishing functionality...')
    
    try {
        // 1. Get current events
        console.log('\n1. Fetching current events...')
        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('id, title, status, stage_manager_id, created_at')
            .limit(5)
            .order('created_at', { ascending: false })
        
        if (eventsError) {
            console.log('❌ Error fetching events:', eventsError.message)
            return
        }
        
        console.log(`✅ Found ${events.length} events:`)
        events.forEach(event => {
            console.log(`   - ${event.title} (${event.status}) - ID: ${event.id.substring(0, 8)}...`)
        })
        
        // 2. Find a draft event to test publishing
        const draftEvent = events.find(e => e.status === 'draft')
        
        if (draftEvent) {
            console.log(`\n2. Testing publish on draft event: "${draftEvent.title}"`)
            
            // Try with anon key first (simulating frontend)
            const supabaseAnon = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNjY4NjEsImV4cCI6MjA2NTg0Mjg2MX0.5L8mD4I3MP22p8bcGUFo6EiVHesfvahfYpPPXjGdy54')
            
            // Simulate being logged in as admin
            const { data: adminAuth, error: authError } = await supabaseAnon.auth.signInWithPassword({
                email: 'info@standupsydney.com',
                password: 'password123' // You'll need the actual password
            })
            
            if (authError) {
                console.log('   ❌ Cannot test with real auth (need password)')
                console.log('   Testing with service key instead...')
                
                // Test with service key
                const { data: updated, error: updateError } = await supabase
                    .from('events')
                    .update({ status: 'published' })
                    .eq('id', draftEvent.id)
                    .select()
                    .single()
                
                if (updateError) {
                    console.log('   ❌ Update failed:', updateError.message)
                } else {
                    console.log('   ✅ Event published successfully!')
                    console.log(`      Status changed: ${draftEvent.status} → ${updated.status}`)
                    
                    // Revert for testing
                    await supabase
                        .from('events')
                        .update({ status: 'draft' })
                        .eq('id', draftEvent.id)
                    console.log('   ✅ Reverted to draft for future testing')
                }
            }
        } else {
            console.log('\n2. No draft events found to test publishing')
            
            // Check if we can update existing published events
            if (events.length > 0) {
                const testEvent = events[0]
                console.log(`\n3. Testing update on event: "${testEvent.title}"`)
                
                const { data: updated, error: updateError } = await supabase
                    .from('events')
                    .update({ 
                        updated_at: new Date().toISOString() 
                    })
                    .eq('id', testEvent.id)
                    .select('id, updated_at')
                    .single()
                
                if (updateError) {
                    console.log('   ❌ Update failed:', updateError.message)
                    console.log('   This might indicate RLS policy issues')
                } else {
                    console.log('   ✅ Event updated successfully')
                }
            }
        }
        
        // 3. Check RLS policies
        console.log('\n3. Checking potential RLS issues...')
        console.log('   - Events table likely has Row Level Security enabled')
        console.log('   - Users must be authenticated and authorized to update events')
        console.log('   - Check if user is stage_manager_id or has admin role')
        
    } catch (error) {
        console.log('❌ Test failed:', error.message)
    }
}

testEventPublishing()