import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeadlineCheckResult {
  expired_spots: number
  reminders_sent: number
  emails_queued: number
  sms_queued: number
  tasks_created: number
  errors: string[]
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const result: DeadlineCheckResult = {
      expired_spots: 0,
      reminders_sent: 0,
      emails_queued: 0,
      sms_queued: 0,
      tasks_created: 0,
      errors: []
    }

    // 1. Handle expired spots
    try {
      const { data: expiredData, error: expiredError } = await supabase.rpc('handle_expired_spot_confirmations')
      if (expiredError) throw expiredError
      
      if (expiredData && expiredData.length > 0) {
        result.expired_spots = expiredData[0].expired_count || 0
      }
    } catch (error) {
      result.errors.push(`Failed to handle expired spots: ${error.message}`)
    }

    // 2. Send 24-hour reminders
    try {
      const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      const twentyThreeHoursFromNow = new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString()
      
      const { data: spots24h, error } = await supabase
        .from('event_spots')
        .select('id, confirmation_reminder_sent')
        .eq('confirmation_status', 'pending')
        .eq('is_filled', true)
        .gte('confirmation_deadline', twentyThreeHoursFromNow)
        .lte('confirmation_deadline', twentyFourHoursFromNow)
        .not('comedian_id', 'is', null)

      if (!error && spots24h) {
        for (const spot of spots24h) {
          const reminderSent = spot.confirmation_reminder_sent?.reminder_24h
          if (!reminderSent) {
            const { data, error: reminderError } = await supabase.rpc('send_deadline_reminder', {
              p_spot_id: spot.id,
              p_hours_before: 24,
              p_template_name: 'deadline_24h'
            })
            
            if (!reminderError && data) {
              result.reminders_sent++
              
              // Update reminder sent status
              const newStatus = { ...spot.confirmation_reminder_sent, reminder_24h: true }
              await supabase
                .from('event_spots')
                .update({ confirmation_reminder_sent: newStatus })
                .eq('id', spot.id)
            }
          }
        }
      }
    } catch (error) {
      result.errors.push(`Failed to send 24h reminders: ${error.message}`)
    }

    // 3. Send 6-hour reminders
    try {
      const sixHoursFromNow = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
      const fiveHoursFromNow = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
      
      const { data: spots6h, error } = await supabase
        .from('event_spots')
        .select('id, confirmation_reminder_sent')
        .eq('confirmation_status', 'pending')
        .eq('is_filled', true)
        .gte('confirmation_deadline', fiveHoursFromNow)
        .lte('confirmation_deadline', sixHoursFromNow)
        .not('comedian_id', 'is', null)

      if (!error && spots6h) {
        for (const spot of spots6h) {
          const reminderSent = spot.confirmation_reminder_sent?.reminder_6h
          if (!reminderSent) {
            const { data, error: reminderError } = await supabase.rpc('send_deadline_reminder', {
              p_spot_id: spot.id,
              p_hours_before: 6,
              p_template_name: 'deadline_6h'
            })
            
            if (!reminderError && data) {
              result.reminders_sent++
              
              // Update reminder sent status
              const newStatus = { ...spot.confirmation_reminder_sent, reminder_6h: true }
              await supabase
                .from('event_spots')
                .update({ confirmation_reminder_sent: newStatus })
                .eq('id', spot.id)
            }
          }
        }
      }
    } catch (error) {
      result.errors.push(`Failed to send 6h reminders: ${error.message}`)
    }

    // 4. Send 1-hour reminders
    try {
      const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000).toISOString()
      const thirtyMinutesFromNow = new Date(Date.now() + 30 * 60 * 1000).toISOString()
      
      const { data: spots1h, error } = await supabase
        .from('event_spots')
        .select('id, confirmation_reminder_sent')
        .eq('confirmation_status', 'pending')
        .eq('is_filled', true)
        .gte('confirmation_deadline', thirtyMinutesFromNow)
        .lte('confirmation_deadline', oneHourFromNow)
        .not('comedian_id', 'is', null)

      if (!error && spots1h) {
        for (const spot of spots1h) {
          const reminderSent = spot.confirmation_reminder_sent?.reminder_1h
          if (!reminderSent) {
            const { data, error: reminderError } = await supabase.rpc('send_deadline_reminder', {
              p_spot_id: spot.id,
              p_hours_before: 1,
              p_template_name: 'deadline_1h'
            })
            
            if (!reminderError && data) {
              result.reminders_sent++
              
              // Update reminder sent status
              const newStatus = { ...spot.confirmation_reminder_sent, reminder_1h: true }
              await supabase
                .from('event_spots')
                .update({ confirmation_reminder_sent: newStatus })
                .eq('id', spot.id)
            }
          }
        }
      }
    } catch (error) {
      result.errors.push(`Failed to send 1h reminders: ${error.message}`)
    }

    // 5. Process email queue
    try {
      const { data: emailsProcessed, error } = await supabase.rpc('process_email_queue')
      if (!error && emailsProcessed) {
        result.emails_queued = emailsProcessed
      }
    } catch (error) {
      result.errors.push(`Failed to process email queue: ${error.message}`)
    }

    // 6. Process SMS queue
    try {
      const { data: smsProcessed, error } = await supabase.rpc('process_sms_queue')
      if (!error && smsProcessed) {
        result.sms_queued = smsProcessed
      }
    } catch (error) {
      result.errors.push(`Failed to process SMS queue: ${error.message}`)
    }

    // 7. Create reassignment tasks for recently expired spots
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      
      const { data: recentlyExpired, error } = await supabase
        .from('event_spots')
        .select(`
          id,
          spot_name,
          event_id,
          events!inner (
            id,
            title,
            event_date,
            promoter_id
          )
        `)
        .eq('confirmation_status', 'expired')
        .eq('is_filled', false)
        .is('comedian_id', null)
        .gte('updated_at', oneHourAgo)
        .gte('events.event_date', new Date().toISOString())

      if (!error && recentlyExpired) {
        for (const spot of recentlyExpired) {
          // Check if task already exists
          const { data: existingTask } = await supabase
            .from('tasks')
            .select('id')
            .eq('metadata->>spot_id', spot.id)
            .eq('status', 'pending')
            .single()

          if (!existingTask) {
            const { error: taskError } = await supabase
              .from('tasks')
              .insert({
                title: `Reassign ${spot.spot_name} - ${spot.events.title}`,
                description: `The ${spot.spot_name} spot has expired and needs to be reassigned for the event "${spot.events.title}" on ${new Date(spot.events.event_date).toLocaleDateString()}.`,
                assigned_to: spot.events.promoter_id,
                priority: 'high',
                due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                category: 'spot_reassignment',
                metadata: {
                  event_id: spot.event_id,
                  spot_id: spot.id,
                  spot_type: spot.spot_name
                }
              })

            if (!taskError) {
              result.tasks_created++
            }
          }
        }
      }
    } catch (error) {
      result.errors.push(`Failed to create reassignment tasks: ${error.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})