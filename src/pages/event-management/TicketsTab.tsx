/**
 * TicketsTab Component
 *
 * Displays ticket sales data for an event, including:
 * - Summary cards (total tickets, revenue, net revenue, fees)
 * - Platform breakdown (Humanitix, Eventbrite)
 * - Partner sales breakdown (FEVER, GetYourGuide, etc.)
 * - Manual entry list with ability to add new entries
 *
 * Route: /events/:eventId/manage?tab=tickets
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Ticket,
  DollarSign,
  TrendingUp,
  Users,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useManualTicketEntries } from '@/hooks/useManualTicketEntries';
import { ManualTicketEntryDialog } from '@/components/admin/event-detail/ManualTicketEntryDialog';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TicketsTabProps {
  eventId: string;
}

interface SessionData {
  humanitix_ticket_count: number | null;
  humanitix_gross_dollars: string | null;
  humanitix_net_dollars: string | null;
  humanitix_fees_dollars: string | null;
  humanitix_tax_dollars: string | null;
  humanitix_rebate_dollars: string | null;
  humanitix_last_order_at: string | null;
  eventbrite_ticket_count: number | null;
  eventbrite_gross_dollars: string | null;
  eventbrite_net_dollars: string | null;
  eventbrite_fees_dollars: string | null;
  eventbrite_tax_dollars: string | null;
  eventbrite_last_order_at: string | null;
  fever_ticket_count: number | null;
  total_ticket_count: number | null;
  total_gross_dollars: string | null;
  total_net_dollars: string | null;
  total_fees_dollars: string | null;
  total_tax_dollars: string | null;
  total_rebate_dollars: string | null;
  last_order_at: string | null;
  ingested_at: string | null;
}

interface EventData {
  source_id: string | null;
  humanitix_event_id: string | null;
  eventbrite_event_id: string | null;
  source: string | null;
}

export default function TicketsTab({ eventId }: TicketsTabProps) {
  const [showManualEntryDialog, setShowManualEntryDialog] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  // Manual ticket entries hook
  const {
    entries: manualEntries,
    breakdownByPartner,
    totals: manualTotals,
    isLoading: manualEntriesLoading,
    deleteEntry,
    isDeleting,
  } = useManualTicketEntries(eventId);

  // Fetch event to get source_id
  const { data: event, isLoading: eventLoading } = useQuery<EventData>({
    queryKey: ['event-source', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('source_id, humanitix_event_id, eventbrite_event_id, source')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const sourceId = event?.source_id || event?.humanitix_event_id || event?.eventbrite_event_id;
  const isSyncedEvent = event?.source === 'humanitix' || event?.source === 'eventbrite';

  // Fetch session data from session_complete view
  const { data: sessionData, isLoading: sessionLoading } = useQuery<SessionData>({
    queryKey: ['session-tickets', sourceId],
    queryFn: async () => {
      if (!sourceId) return null;

      const { data, error } = await supabase
        .from('session_complete')
        .select(`
          humanitix_ticket_count,
          humanitix_gross_dollars,
          humanitix_net_dollars,
          humanitix_fees_dollars,
          humanitix_tax_dollars,
          humanitix_rebate_dollars,
          humanitix_last_order_at,
          eventbrite_ticket_count,
          eventbrite_gross_dollars,
          eventbrite_net_dollars,
          eventbrite_fees_dollars,
          eventbrite_tax_dollars,
          eventbrite_last_order_at,
          fever_ticket_count,
          total_ticket_count,
          total_gross_dollars,
          total_net_dollars,
          total_fees_dollars,
          total_tax_dollars,
          total_rebate_dollars,
          last_order_at,
          ingested_at
        `)
        .eq('canonical_session_source_id', sourceId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!sourceId,
  });

  // Build platform breakdown from session data
  const platformBreakdown = useMemo(() => {
    if (!sessionData) return [];

    const platforms: Array<{
      name: string;
      ticketCount: number;
      grossRevenue: number;
      fees: number;
      tax: number;
      netRevenue: number;
      lastOrderAt: string | null;
    }> = [];

    if (sessionData.humanitix_ticket_count && sessionData.humanitix_ticket_count > 0) {
      platforms.push({
        name: 'Humanitix',
        ticketCount: sessionData.humanitix_ticket_count,
        grossRevenue: parseFloat(sessionData.humanitix_gross_dollars || '0'),
        fees: parseFloat(sessionData.humanitix_fees_dollars || '0'),
        tax: parseFloat(sessionData.humanitix_tax_dollars || '0'),
        netRevenue: parseFloat(sessionData.humanitix_net_dollars || '0'),
        lastOrderAt: sessionData.humanitix_last_order_at,
      });
    }

    if (sessionData.eventbrite_ticket_count && sessionData.eventbrite_ticket_count > 0) {
      platforms.push({
        name: 'Eventbrite',
        ticketCount: sessionData.eventbrite_ticket_count,
        grossRevenue: parseFloat(sessionData.eventbrite_gross_dollars || '0'),
        fees: parseFloat(sessionData.eventbrite_fees_dollars || '0'),
        tax: parseFloat(sessionData.eventbrite_tax_dollars || '0'),
        netRevenue: parseFloat(sessionData.eventbrite_net_dollars || '0'),
        lastOrderAt: sessionData.eventbrite_last_order_at,
      });
    }

    return platforms;
  }, [sessionData]);

  // Calculate combined totals (platform + manual entries)
  const combinedTotals = useMemo(() => {
    const platformTickets = sessionData?.total_ticket_count || 0;
    const platformGross = parseFloat(sessionData?.total_gross_dollars || '0');
    const platformFees = parseFloat(sessionData?.total_fees_dollars || '0');
    const platformTax = parseFloat(sessionData?.total_tax_dollars || '0');
    const platformNet = parseFloat(sessionData?.total_net_dollars || '0');

    return {
      totalTickets: platformTickets + manualTotals.ticketCount,
      totalGross: platformGross + manualTotals.grossRevenue,
      totalFees: platformFees + manualTotals.commissionAmount,
      totalTax: platformTax,
      totalNet: platformNet + manualTotals.netRevenue,
    };
  }, [sessionData, manualTotals]);

  // Delete manual entry handler
  const handleDeleteEntry = () => {
    if (entryToDelete) {
      deleteEntry(entryToDelete, {
        onSuccess: () => {
          setEntryToDelete(null);
        },
      });
    }
  };

  const isLoading = eventLoading || sessionLoading || manualEntriesLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ticket Sales</h2>
          <p className="text-sm text-muted-foreground">
            View ticket sales from all platforms and partners
            {sessionData?.last_order_at && (
              <span className="ml-2">
                • Last order: {format(new Date(sessionData.last_order_at), 'MMM d, yyyy HH:mm')}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setShowManualEntryDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Manual Sale
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Ticket className="w-4 h-4" />
                Total Tickets Sold
              </div>
              <div className="text-3xl font-bold">{combinedTotals.totalTickets}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <DollarSign className="w-4 h-4" />
                Gross Revenue
              </div>
              <div className="text-3xl font-bold">{formatCurrency(combinedTotals.totalGross)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                Fees, Tax & Commissions
              </div>
              <div className="text-3xl font-bold text-red-600">
                -{formatCurrency(combinedTotals.totalFees + combinedTotals.totalTax)}
              </div>
              {combinedTotals.totalTax > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(combinedTotals.totalFees)} fees • {formatCurrency(combinedTotals.totalTax)} tax
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingUp className="w-4 h-4" />
                Net Revenue
              </div>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(combinedTotals.totalNet)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Platform Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            Platform Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : platformBreakdown.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Ticket className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No platform ticket sales yet</p>
              {!isSyncedEvent && (
                <p className="text-sm mt-1">
                  This event is not synced with Humanitix or Eventbrite
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {platformBreakdown.map((platform) => (
                <div
                  key={platform.name}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{platform.name}</Badge>
                    <div>
                      <div className="font-medium">{platform.ticketCount} tickets</div>
                      <div className="text-sm text-muted-foreground">
                        {platform.lastOrderAt
                          ? `Last sale: ${format(new Date(platform.lastOrderAt), 'MMM d, yyyy HH:mm')}`
                          : 'No recent sales'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">{formatCurrency(platform.netRevenue)} net</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(platform.grossRevenue)} gross
                      {platform.fees > 0 && ` • -${formatCurrency(platform.fees)} fees`}
                      {platform.tax > 0 && ` • -${formatCurrency(platform.tax)} tax`}
                    </div>
                  </div>
                </div>
              ))}

              {/* Platform Totals */}
              {platformBreakdown.length > 1 && (
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted border mt-2">
                  <div className="font-medium">Platform Sales Total</div>
                  <div className="text-right">
                    <div className="font-bold">
                      {sessionData?.total_ticket_count || 0} tickets •{' '}
                      {formatCurrency(parseFloat(sessionData?.total_net_dollars || '0'))} net
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Partner Sales */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            Partner Sales
          </CardTitle>
          <Button variant="secondary" size="sm" onClick={() => setShowManualEntryDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Entry
          </Button>
        </CardHeader>
        <CardContent>
          {manualEntriesLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : breakdownByPartner.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ExternalLink className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No partner sales recorded</p>
              <p className="text-sm mt-1">
                Add manual ticket entries from partners like FEVER or GetYourGuide
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => setShowManualEntryDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Entry
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {breakdownByPartner.map((partner) => (
                <div
                  key={partner.partnerId}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                >
                  <div>
                    <div className="font-medium">{partner.partnerName}</div>
                    <div className="text-sm text-muted-foreground">
                      {partner.ticketCount} tickets • {formatCurrency(partner.grossRevenue)} gross
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">
                      {formatCurrency(partner.netRevenue)} net
                    </div>
                    <div className="text-sm text-red-500">
                      -{formatCurrency(partner.commissionAmount)} commission
                    </div>
                  </div>
                </div>
              ))}

              {/* Partner Totals */}
              {breakdownByPartner.length > 0 && (
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted border mt-2">
                  <div className="font-medium">Partner Sales Total</div>
                  <div className="text-right">
                    <div className="font-bold">
                      {manualTotals.ticketCount} tickets •{' '}
                      {formatCurrency(manualTotals.netRevenue)} net
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(manualTotals.grossRevenue)} gross • -
                      {formatCurrency(manualTotals.commissionAmount)} commission
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Entries Detail */}
      {manualEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Manual Entry Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left font-medium p-3">Date</th>
                    <th className="text-left font-medium p-3">Partner</th>
                    <th className="text-left font-medium p-3">Tickets</th>
                    <th className="text-left font-medium p-3">Gross</th>
                    <th className="text-left font-medium p-3">Commission</th>
                    <th className="text-left font-medium p-3">Net</th>
                    <th className="text-left font-medium p-3">Reference</th>
                    <th className="text-right font-medium p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {manualEntries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 text-sm">
                        {format(new Date(entry.entry_date), 'MMM d, yyyy')}
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary">{entry.partner?.name || 'Unknown'}</Badge>
                      </td>
                      <td className="p-3">{entry.ticket_count}</td>
                      <td className="p-3">{formatCurrency(entry.gross_revenue)}</td>
                      <td className="p-3 text-red-500">
                        -{formatCurrency(entry.commission_amount)} ({entry.commission_rate}%)
                      </td>
                      <td className="p-3 text-green-600 font-medium">
                        {formatCurrency(entry.net_revenue)}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {entry.reference_id || '-'}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEntryToDelete(entry.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Alert */}
      <Alert>
        <AlertDescription>
          <strong>Ticket Management:</strong> Platform sales are automatically synced from connected
          ticketing platforms (Humanitix, Eventbrite). Partner sales from third-party ticketing
          partners (FEVER, GetYourGuide, etc.) should be added manually using the "Add Manual Sale"
          button. Commission rates are pulled from the partner settings configured in Admin
          Settings.
          <br />
          <span className="text-muted-foreground text-sm">
            Note: Net revenue is calculated after platform fees and tax. Numbers may differ slightly from
            platform dashboards which show different views. Data syncs periodically from ticketing platforms.
          </span>
        </AlertDescription>
      </Alert>

      {/* Manual Ticket Entry Dialog */}
      <ManualTicketEntryDialog
        open={showManualEntryDialog}
        onClose={() => setShowManualEntryDialog(false)}
        eventId={eventId}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!entryToDelete} onOpenChange={() => setEntryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Manual Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this manual ticket entry? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEntry}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
