/**
 * SeriesDealsTab Component
 *
 * Manages series-level deals that can be applied to all events in the series.
 */

import { useState } from 'react';
import { Plus, DollarSign, Users, CheckCircle, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useSeriesDeals,
  useCreateSeriesDeal,
  useDeleteSeriesDeal,
  useApplySeriesDealToEvents,
  type SeriesDeal,
} from '@/hooks/useSeriesDeals';
import { formatCurrency } from '@/lib/utils';

interface SeriesDealsTabProps {
  seriesId: string;
  userId: string;
}

type DealType = 'revenue_share' | 'fixed_split' | 'tiered' | 'custom';

export default function SeriesDealsTab({ seriesId, userId }: SeriesDealsTabProps) {
  const [showCreateDeal, setShowCreateDeal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // New deal form state
  const [newDeal, setNewDeal] = useState({
    title: '',
    deal_type: 'revenue_share' as DealType,
    description: '',
    apply_to_all_events: true,
    apply_to_future_only: false,
  });

  // Queries
  const { data: deals, isLoading } = useSeriesDeals(seriesId);

  // Mutations
  const createDeal = useCreateSeriesDeal();
  const deleteDeal = useDeleteSeriesDeal();
  const applyToEvents = useApplySeriesDealToEvents();

  // Filter deals
  const filteredDeals = deals?.filter(deal => {
    if (filterStatus === 'all') return true;
    return deal.status === filterStatus;
  });

  // Stats
  const draftDeals = deals?.filter(d => d.status === 'draft').length || 0;
  const activeDeals = deals?.filter(d => d.status === 'active').length || 0;

  const handleCreateDeal = async () => {
    await createDeal.mutateAsync({
      series_id: seriesId,
      title: newDeal.title,
      deal_type: newDeal.deal_type,
      apply_to_all_events: newDeal.apply_to_all_events,
      apply_to_future_only: newDeal.apply_to_future_only,
    });
    setShowCreateDeal(false);
    setNewDeal({
      title: '',
      deal_type: 'revenue_share',
      description: '',
      apply_to_all_events: true,
      apply_to_future_only: false,
    });
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (confirm('Are you sure you want to delete this deal?')) {
      await deleteDeal.mutateAsync({ dealId, seriesId });
    }
  };

  const handleApplyToEvents = async (dealId: string) => {
    await applyToEvents.mutateAsync({
      dealId,
      seriesId,
      applyToAll: true,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDealTypeBadge = (type: string) => {
    switch (type) {
      case 'revenue_share':
        return <Badge variant="secondary" className="border-blue-500 text-blue-600">Revenue Share</Badge>;
      case 'fixed_split':
        return <Badge variant="secondary" className="border-purple-500 text-purple-600">Fixed Split</Badge>;
      case 'tiered':
        return <Badge variant="secondary" className="border-orange-500 text-orange-600">Tiered</Badge>;
      case 'custom':
        return <Badge variant="secondary" className="border-gray-500 text-gray-600">Custom</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Series Deals</h2>
          <p className="text-sm text-muted-foreground">
            Create deals that apply across all events in the series
          </p>
        </div>
        <Button onClick={() => setShowCreateDeal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Deal
        </Button>
      </div>

      {/* Series Deals Info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Series-Level Deals</AlertTitle>
        <AlertDescription>
          Deals created here can be applied to all events in this series at once,
          or automatically applied to future events as they're added.
        </AlertDescription>
      </Alert>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{deals?.length || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{activeDeals}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{draftDeals}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Deals List */}
      <Card>
        <CardHeader>
          <CardTitle>Deal List</CardTitle>
          <CardDescription>
            Manage financial deals for this series
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all" onClick={() => setFilterStatus('all')}>
                All Deals
              </TabsTrigger>
              <TabsTrigger value="draft" onClick={() => setFilterStatus('draft')}>
                Draft
              </TabsTrigger>
              <TabsTrigger value="active" onClick={() => setFilterStatus('active')}>
                Active
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <DealsList
                deals={filteredDeals}
                isLoading={isLoading}
                onDelete={handleDeleteDeal}
                onApply={handleApplyToEvents}
                getStatusBadge={getStatusBadge}
                getDealTypeBadge={getDealTypeBadge}
              />
            </TabsContent>

            <TabsContent value="draft" className="space-y-4">
              <DealsList
                deals={filteredDeals}
                isLoading={isLoading}
                onDelete={handleDeleteDeal}
                onApply={handleApplyToEvents}
                getStatusBadge={getStatusBadge}
                getDealTypeBadge={getDealTypeBadge}
              />
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              <DealsList
                deals={filteredDeals}
                isLoading={isLoading}
                onDelete={handleDeleteDeal}
                onApply={handleApplyToEvents}
                getStatusBadge={getStatusBadge}
                getDealTypeBadge={getDealTypeBadge}
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
                Split ticket/door revenue by percentage across all events in the series.
              </p>
            </div>
            <div>
              <p className="font-medium">Fixed Split</p>
              <p className="text-muted-foreground">
                Predetermined amounts for each participant, consistent across events.
              </p>
            </div>
            <div>
              <p className="font-medium">Tiered</p>
              <p className="text-muted-foreground">
                Different percentages based on revenue thresholds, calculated per-event or series-wide.
              </p>
            </div>
            <div>
              <p className="font-medium">Custom</p>
              <p className="text-muted-foreground">
                Flexible arrangements for unique situations with manual calculations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Deal Dialog */}
      <Dialog open={showCreateDeal} onOpenChange={setShowCreateDeal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Series Deal</DialogTitle>
            <DialogDescription>
              Create a deal template that can be applied to events in this series
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Deal Title</Label>
              <Input
                id="title"
                placeholder="e.g., Venue Revenue Share"
                value={newDeal.title}
                onChange={(e) => setNewDeal(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deal_type">Deal Type</Label>
              <Select
                value={newDeal.deal_type}
                onValueChange={(value: DealType) =>
                  setNewDeal(prev => ({ ...prev, deal_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select deal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue_share">Revenue Share</SelectItem>
                  <SelectItem value="fixed_split">Fixed Split</SelectItem>
                  <SelectItem value="tiered">Tiered</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <Label>Application Options</Label>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Apply to All Events</p>
                  <p className="text-xs text-muted-foreground">
                    Apply this deal to all existing events in the series
                  </p>
                </div>
                <Switch
                  checked={newDeal.apply_to_all_events}
                  onCheckedChange={(checked) =>
                    setNewDeal(prev => ({ ...prev, apply_to_all_events: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Future Events Only</p>
                  <p className="text-xs text-muted-foreground">
                    Only apply to events added after this deal is created
                  </p>
                </div>
                <Switch
                  checked={newDeal.apply_to_future_only}
                  onCheckedChange={(checked) =>
                    setNewDeal(prev => ({ ...prev, apply_to_future_only: checked }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowCreateDeal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateDeal}
              disabled={!newDeal.title || createDeal.isPending}
            >
              Create Deal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Deals List Component
interface DealsListProps {
  deals: SeriesDeal[] | undefined;
  isLoading: boolean;
  onDelete: (dealId: string) => void;
  onApply: (dealId: string) => void;
  getStatusBadge: (status: string) => React.ReactNode;
  getDealTypeBadge: (type: string) => React.ReactNode;
}

function DealsList({ deals, isLoading, onDelete, onApply, getStatusBadge, getDealTypeBadge }: DealsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!deals || deals.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No deals found. Create your first series deal to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {deals.map((deal) => (
        <div key={deal.id} className="rounded-lg border p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold">{deal.title}</h3>
                {getStatusBadge(deal.status)}
                {getDealTypeBadge(deal.deal_type)}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {deal.apply_to_all_events && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Applies to all events
                  </span>
                )}
                {deal.apply_to_future_only && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Future events only
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onApply(deal.id)}
              >
                Apply to Events
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(deal.id)}
                className="text-destructive hover:text-destructive"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
