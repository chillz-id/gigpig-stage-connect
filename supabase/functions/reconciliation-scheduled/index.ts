import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReconciliationRequest {
  eventId?: string
  platform?: string
  mode?: 'manual' | 'scheduled'
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { eventId, platform, mode = 'manual' } = await req.json() as ReconciliationRequest

    // If no eventId provided, run for all active events
    let eventsToReconcile: string[] = []
    
    if (eventId) {
      eventsToReconcile = [eventId]
    } else {
      // Get all active events with ticket platforms
      const { data: activeEvents, error: eventsError } = await supabase
        .from('events')
        .select('id')
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .lte('date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
        .not('ticket_platforms', 'is', null)

      if (eventsError) throw eventsError
      eventsToReconcile = activeEvents?.map(e => e.id) || []
    }

    const results = []

    for (const eventIdToProcess of eventsToReconcile) {
      try {
        // Check if reconciliation was already run recently (within last hour for scheduled)
        if (mode === 'scheduled') {
          const { data: recentReport } = await supabase
            .from('reconciliation_reports')
            .select('id')
            .eq('event_id', eventIdToProcess)
            .gte('start_time', new Date(Date.now() - 60 * 60 * 1000).toISOString())
            .single()

          if (recentReport) {
            results.push({
              eventId: eventIdToProcess,
              status: 'skipped',
              reason: 'Recently reconciled'
            })
            continue
          }
        }

        // Get ticket platforms for this event
        const { data: platforms, error: platformsError } = await supabase
          .from('ticket_platforms')
          .select('*')
          .eq('event_id', eventIdToProcess)

        if (platformsError) throw platformsError

        if (!platforms || platforms.length === 0) {
          results.push({
            eventId: eventIdToProcess,
            status: 'skipped',
            reason: 'No ticket platforms configured'
          })
          continue
        }

        // Process each platform
        const platformsToProcess = platform 
          ? platforms.filter(p => p.platform === platform)
          : platforms

        for (const platformConfig of platformsToProcess) {
          const reportId = crypto.randomUUID()
          
          // Create initial report
          await supabase
            .from('reconciliation_reports')
            .insert({
              id: reportId,
              event_id: eventIdToProcess,
              platform: platformConfig.platform,
              start_time: new Date().toISOString(),
              status: 'running',
              total_local_sales: 0,
              total_platform_sales: 0,
              total_local_revenue: 0,
              total_platform_revenue: 0,
              discrepancies_found: 0,
              discrepancies_resolved: 0
            })

          try {
            // Get local sales data
            const { data: localSales, error: localError } = await supabase
              .from('ticket_sales')
              .select('*')
              .eq('event_id', eventIdToProcess)
              .eq('platform', platformConfig.platform)

            if (localError) throw localError

            const totalLocalSales = localSales?.length || 0
            const totalLocalRevenue = localSales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0

            // Create map of local sales by order ID
            const localSalesMap = new Map(
              localSales?.map(sale => [sale.platform_order_id, sale]) || []
            )

            // Get platform data from ticket_platforms summary
            const totalPlatformSales = platformConfig.tickets_sold || 0
            const totalPlatformRevenue = platformConfig.gross_sales || 0

            // Simple discrepancy check based on totals
            const discrepancies = []
            
            // Check for count mismatch
            if (Math.abs(totalLocalSales - totalPlatformSales) > 0) {
              discrepancies.push({
                id: crypto.randomUUID(),
                report_id: reportId,
                event_id: eventIdToProcess,
                platform: platformConfig.platform,
                type: 'data_inconsistency',
                severity: Math.abs(totalLocalSales - totalPlatformSales) > 10 ? 'high' : 'medium',
                local_data: { count: totalLocalSales },
                platform_data: { count: totalPlatformSales },
                difference: {
                  field: 'ticket_count',
                  localValue: totalLocalSales,
                  platformValue: totalPlatformSales
                },
                detected_at: new Date().toISOString()
              })
            }

            // Check for revenue mismatch
            const revenueDiff = Math.abs(totalLocalRevenue - totalPlatformRevenue)
            if (revenueDiff > 0.01) {
              discrepancies.push({
                id: crypto.randomUUID(),
                report_id: reportId,
                event_id: eventIdToProcess,
                platform: platformConfig.platform,
                type: 'amount_mismatch',
                severity: revenueDiff > 100 ? 'high' : revenueDiff > 10 ? 'medium' : 'low',
                local_data: { revenue: totalLocalRevenue },
                platform_data: { revenue: totalPlatformRevenue },
                difference: {
                  field: 'total_revenue',
                  localValue: totalLocalRevenue,
                  platformValue: totalPlatformRevenue
                },
                detected_at: new Date().toISOString()
              })
            }

            // Save discrepancies
            if (discrepancies.length > 0) {
              await supabase
                .from('reconciliation_discrepancies')
                .insert(discrepancies)
            }

            // Calculate sync health
            const discrepancyRate = totalLocalSales > 0 
              ? discrepancies.length / totalLocalSales 
              : 0
            
            let syncHealth = 'healthy'
            if (discrepancyRate > 0.1 || revenueDiff > 100) {
              syncHealth = 'critical'
            } else if (discrepancyRate > 0.05 || revenueDiff > 50) {
              syncHealth = 'warning'
            }

            // Update report
            await supabase
              .from('reconciliation_reports')
              .update({
                end_time: new Date().toISOString(),
                status: 'completed',
                total_local_sales: totalLocalSales,
                total_platform_sales: totalPlatformSales,
                total_local_revenue: totalLocalRevenue,
                total_platform_revenue: totalPlatformRevenue,
                discrepancies_found: discrepancies.length,
                discrepancies_resolved: 0,
                sync_health: syncHealth
              })
              .eq('id', reportId)

            // Update event reconciliation status
            await supabase
              .from('events')
              .update({
                reconciliation_status: syncHealth,
                last_reconciliation: new Date().toISOString()
              })
              .eq('id', eventIdToProcess)

            results.push({
              eventId: eventIdToProcess,
              platform: platformConfig.platform,
              status: 'completed',
              discrepancies: discrepancies.length,
              syncHealth
            })

          } catch (error) {
            // Update report with error
            await supabase
              .from('reconciliation_reports')
              .update({
                end_time: new Date().toISOString(),
                status: 'failed',
                error_message: error.message
              })
              .eq('id', reportId)

            results.push({
              eventId: eventIdToProcess,
              platform: platformConfig.platform,
              status: 'failed',
              error: error.message
            })
          }
        }

        // Log audit entry
        await supabase
          .from('reconciliation_audit_log')
          .insert({
            event_id: eventIdToProcess,
            action: mode === 'scheduled' ? 'scheduled_reconciliation' : 'manual_reconciliation',
            description: `Reconciliation ${mode === 'scheduled' ? 'scheduled' : 'manually triggered'}`,
            metadata: { results }
          })

      } catch (error) {
        results.push({
          eventId: eventIdToProcess,
          status: 'error',
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        processedEvents: eventsToReconcile.length,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Reconciliation error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})