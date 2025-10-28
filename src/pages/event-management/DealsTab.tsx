import { useState } from 'react';
import { Plus, DollarSign, Users, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ExportMenu } from '@/components/event-management/ExportMenu';
import DealListContainer from '@/components/deals/DealListContainer';
import DealBuilderContainer from '@/components/deals/DealBuilderContainer';
import { useDealStats } from '@/hooks/useDealStats';
import { formatCurrency } from '@/lib/utils';
import type { DealStatus, DealType } from '@/types/deal';

interface DealsTabProps {
  eventId: string;
  userId: string;
  isOwner: boolean;
}

interface FilterState {
  status: DealStatus | 'all';
  type: DealType | 'all';
}

export default function DealsTab({ eventId, userId, isOwner }: DealsTabProps) {
  const [showDealBuilder, setShowDealBuilder] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    type: 'all',
  });

  // Fetch event title for export
  const { data: event } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('title')
        .eq('id', eventId)
        .single();
      return data;
    },
  });

  // Fetch deal statistics
  const { data: stats, isLoading: statsLoading } = useDealStats(eventId, userId, isOwner);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Event Deals</h2>
          <p className="text-sm text-muted-foreground">
            Manage revenue shares, payment splits, and financial agreements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu
            eventId={eventId}
            eventTitle={event?.title || 'Event'}
            userId={userId}
            isOwner={isOwner}
            exportType="financial"
          />
          {isOwner && (
            <Button onClick={() => setShowDealBuilder(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Deal
            </Button>
          )}
        </div>
      </div>

      {/* Revenue Visibility Alert */}
      {!isOwner && (
        <Alert>
          <DollarSign className="h-4 w-4" />
          <AlertTitle>Revenue Visibility</AlertTitle>
          <AlertDescription>
            You can view full revenue details for deals you're part of once all
            participants have confirmed. Other deals show limited information.
          </AlertDescription>
        </Alert>
      )}

      {/* Deal Builder Dialog */}
      {showDealBuilder && (
        <DealBuilderContainer
          eventId={eventId}
          userId={userId}
          onComplete={() => setShowDealBuilder(false)}
          onCancel={() => setShowDealBuilder(false)}
        />
      )}

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalDeals || 0}</div>
            )}
            {statsLoading ? (
              <Skeleton className="mt-1 h-4 w-40" />
            ) : (
              <p className="text-xs text-muted-foreground">
                {stats?.draftDeals || 0} draft, {stats?.pendingDeals || 0} pending, {stats?.approvedDeals || 0} approved
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {isOwner ? 'All deals' : 'Your confirmed deals'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settled</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.settledDeals || 0}</div>
            )}
            {statsLoading ? (
              <Skeleton className="mt-1 h-4 w-48" />
            ) : (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats?.settledRevenue || 0)} settled, {formatCurrency(stats?.pendingRevenue || 0)} pending
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Deals List with Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Deal List</CardTitle>
          <CardDescription>
            View and manage all financial deals for this event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger
                value="all"
                onClick={() => handleFilterChange({ status: 'all' })}
              >
                All Deals
              </TabsTrigger>
              <TabsTrigger
                value="pending"
                onClick={() => handleFilterChange({ status: 'pending_approval' })}
              >
                Pending
              </TabsTrigger>
              <TabsTrigger
                value="approved"
                onClick={() => handleFilterChange({ status: 'fully_approved' })}
              >
                Approved
              </TabsTrigger>
              <TabsTrigger
                value="settled"
                onClick={() => handleFilterChange({ status: 'settled' })}
              >
                Settled
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <DealListContainer
                eventId={eventId}
                userId={userId}
                isOwner={isOwner}
                statusFilter={filters.status}
                typeFilter={filters.type}
              />
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              <DealListContainer
                eventId={eventId}
                userId={userId}
                isOwner={isOwner}
                statusFilter="pending_approval"
                typeFilter={filters.type}
              />
            </TabsContent>

            <TabsContent value="approved" className="space-y-4">
              <DealListContainer
                eventId={eventId}
                userId={userId}
                isOwner={isOwner}
                statusFilter="fully_approved"
                typeFilter={filters.type}
              />
            </TabsContent>

            <TabsContent value="settled" className="space-y-4">
              <DealListContainer
                eventId={eventId}
                userId={userId}
                isOwner={isOwner}
                statusFilter="settled"
                typeFilter={filters.type}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Deal Types Guide */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Deal Types</CardTitle>
          <CardDescription>
            Understanding different deal structures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium">Revenue Share</p>
              <p className="text-muted-foreground">
                Split ticket/door revenue by percentage. Ideal for promoters, venues,
                and headliners working together.
              </p>
            </div>
            <div>
              <p className="font-medium">Fixed Split</p>
              <p className="text-muted-foreground">
                Predetermined amounts for each participant. Good for guaranteed
                payments and clear expectations.
              </p>
            </div>
            <div>
              <p className="font-medium">Tiered</p>
              <p className="text-muted-foreground">
                Different percentages based on revenue thresholds. Protects downside
                while sharing upside.
              </p>
            </div>
            <div>
              <p className="font-medium">Custom</p>
              <p className="text-muted-foreground">
                Flexible arrangements for unique situations. Requires manual
                calculation and approval.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approval Flow Info */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Deal Approval Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>How deals work:</strong></p>
            <ol className="list-inside list-decimal space-y-1 pl-4">
              <li>
                <strong>Draft:</strong> Creator edits details, adds participants
              </li>
              <li>
                <strong>Pending Approval:</strong> All participants must confirm or
                request changes
              </li>
              <li>
                <strong>Fully Approved:</strong> All confirmed, awaiting settlement
              </li>
              <li>
                <strong>Settled:</strong> Payments processed, deal complete
              </li>
            </ol>
            <p className="mt-4">
              <strong>Note:</strong> Only participants in fully approved deals can
              view event revenue details. This ensures financial transparency while
              protecting sensitive information.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
