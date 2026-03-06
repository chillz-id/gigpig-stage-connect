/**
 * SeriesDealsTab Component
 *
 * Manages series-level deals with financial terms, participant management,
 * and revenue tracking across all events in the series.
 */

import { useState, useCallback } from 'react';
import {
  Plus,
  DollarSign,
  Users,
  CheckCircle,
  Calendar,
  AlertCircle,
  Trash2,
  RefreshCw,
  Search,
  Loader2,
  Mail,
  Percent,
  TrendingUp,
} from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';
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
  useSeriesDealRevenue,
  type SeriesDealWithDetails,
  type CreateSeriesDealParticipantInput,
  type GstMode,
  type DealFrequency,
} from '@/hooks/useSeriesDeals';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import type { GSTMode } from '@/utils/gst-calculator';

interface SeriesDealsTabProps {
  seriesId: string;
  userId: string;
}

type DealType = 'revenue_share' | 'fixed_split' | 'tiered' | 'custom';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SeriesDealsTab({ seriesId, userId }: SeriesDealsTabProps) {
  const [showCreateDeal, setShowCreateDeal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedDealId, setExpandedDealId] = useState<string | null>(null);

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

  const handleDeleteDeal = async (dealId: string) => {
    if (confirm('Are you sure you want to delete this deal?')) {
      await deleteDeal.mutateAsync({ dealId, seriesId });
    }
  };

  const handleApplyToEvents = async (dealId: string) => {
    await applyToEvents.mutateAsync({ dealId, seriesId });
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

            {['all', 'draft', 'active'].map(tab => (
              <TabsContent key={tab} value={tab} className="space-y-4">
                <DealsList
                  deals={filteredDeals}
                  isLoading={isLoading}
                  onDelete={handleDeleteDeal}
                  onApply={handleApplyToEvents}
                  expandedDealId={expandedDealId}
                  onToggleExpand={(id) => setExpandedDealId(prev => prev === id ? null : id)}
                  isApplying={applyToEvents.isPending}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Deal Dialog */}
      {showCreateDeal && (
        <CreateDealDialog
          seriesId={seriesId}
          onClose={() => setShowCreateDeal(false)}
          createDeal={createDeal}
        />
      )}
    </div>
  );
}

// ============================================================================
// DEALS LIST
// ============================================================================

interface DealsListProps {
  deals: SeriesDealWithDetails[] | undefined;
  isLoading: boolean;
  onDelete: (dealId: string) => void;
  onApply: (dealId: string) => void;
  expandedDealId: string | null;
  onToggleExpand: (dealId: string) => void;
  isApplying: boolean;
}

function DealsList({ deals, isLoading, onDelete, onApply, expandedDealId, onToggleExpand, isApplying }: DealsListProps) {
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
        <DealCard
          key={deal.id}
          deal={deal}
          onDelete={onDelete}
          onApply={onApply}
          isExpanded={expandedDealId === deal.id}
          onToggleExpand={() => onToggleExpand(deal.id)}
          isApplying={isApplying}
        />
      ))}
    </div>
  );
}

// ============================================================================
// DEAL CARD
// ============================================================================

interface DealCardProps {
  deal: SeriesDealWithDetails;
  onDelete: (dealId: string) => void;
  onApply: (dealId: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isApplying: boolean;
}

function DealCard({ deal, onDelete, onApply, isExpanded, onToggleExpand, isApplying }: DealCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDealTypeBadge = (type: string | null) => {
    switch (type) {
      case 'revenue_share':
        return <Badge variant="secondary" className="border-blue-500 text-blue-600">Revenue Share</Badge>;
      case 'fixed_split':
        return <Badge variant="secondary" className="border-purple-500 text-purple-600">Fixed Fee</Badge>;
      case 'tiered':
        return <Badge variant="secondary" className="border-orange-500 text-orange-600">Tiered</Badge>;
      case 'custom':
        return <Badge variant="secondary" className="border-gray-500 text-gray-600">Custom</Badge>;
      default:
        return null;
    }
  };

  const getDealSummary = () => {
    if (deal.deal_type === 'fixed_split' && deal.fixed_fee_amount) {
      const amount = formatCurrency(deal.fixed_fee_amount);
      const gst = deal.gst_mode === 'exclusive' ? ' + GST' :
        deal.gst_mode === 'inclusive' ? ' (inc. GST)' : '';
      const freq = deal.frequency === 'weekly' ? `every ${DAY_NAMES[deal.day_of_week ?? 0]}` :
        deal.frequency === 'fortnightly' ? 'fortnightly' :
        deal.frequency === 'monthly' ? 'monthly' :
        deal.frequency === 'per_event' ? 'per event' : '';
      return `${amount}${gst} ${freq}`;
    }
    if (deal.deal_type === 'revenue_share' && deal.participants && deal.participants.length > 0) {
      return deal.participants
        .map(p => `${p.participant?.name || p.participant_email || 'TBD'}: ${p.split_percentage}%`)
        .join(', ');
    }
    return deal.description || null;
  };

  const summary = getDealSummary();

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div
          className="space-y-1 flex-1 cursor-pointer"
          onClick={onToggleExpand}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{deal.title}</h3>
            {getStatusBadge(deal.status)}
            {getDealTypeBadge(deal.deal_type)}
          </div>

          {summary && (
            <p className="text-sm font-medium text-muted-foreground">{summary}</p>
          )}

          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {deal.participants && deal.participants.length > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {deal.participants.length} participant{deal.participants.length !== 1 ? 's' : ''}
              </span>
            )}
            {deal.apply_to_all_events && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                All events
              </span>
            )}
            {deal.apply_to_future_only && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Future events only
              </span>
            )}
            {deal.recurring_invoice_id && (
              <span className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                Auto-invoicing active
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onApply(deal.id)}
            disabled={isApplying}
          >
            {isApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
            Sync to Events
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(deal.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Expanded: Participants & Revenue */}
      {isExpanded && (
        <div className="space-y-4 pt-2 border-t">
          {/* Participants */}
          {deal.participants && deal.participants.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Participants</h4>
              <div className="space-y-2">
                {deal.participants.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <OptimizedAvatar
                        src={p.participant?.avatar_url ?? undefined}
                        name={p.participant?.name || p.participant_email || '?'}
                        className="h-7 w-7"
                      />
                      <span>{p.participant?.name || p.participant_email || 'Pending invite'}</span>
                      <Badge variant="secondary" className="text-xs">{p.participant_type}</Badge>
                    </div>
                    <div className="text-right">
                      {p.split_type === 'percentage' && (
                        <span className="font-medium">{p.split_percentage}%</span>
                      )}
                      {p.split_type === 'flat_fee' && p.flat_fee_amount && (
                        <span className="font-medium">{formatCurrency(p.flat_fee_amount)}</span>
                      )}
                      {p.gst_mode !== 'none' && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({p.gst_mode === 'exclusive' ? '+GST' : 'inc. GST'})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Revenue Tracker */}
          <SeriesDealRevenueTracker dealId={deal.id} />

          {deal.notes && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Notes:</span> {deal.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// REVENUE TRACKER
// ============================================================================

function SeriesDealRevenueTracker({ dealId }: { dealId: string }) {
  const { data: revenue, isLoading } = useSeriesDealRevenue(dealId);

  if (isLoading) return <Skeleton className="h-16 w-full" />;
  if (!revenue || revenue.event_count === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No events synced yet. Click "Sync to Events" to apply this deal.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium flex items-center gap-1">
        <TrendingUp className="h-3 w-3" />
        Revenue ({revenue.event_count} event{revenue.event_count !== 1 ? 's' : ''})
      </h4>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground">Total</p>
          <p className="font-medium">{formatCurrency(revenue.total_revenue)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Settled</p>
          <p className="font-medium text-green-600">{formatCurrency(revenue.settled_revenue)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Pending</p>
          <p className="font-medium text-amber-600">{formatCurrency(revenue.pending_revenue)}</p>
        </div>
      </div>
      {revenue.per_participant.length > 0 && (
        <div className="space-y-1 pt-1">
          {revenue.per_participant.map(p => (
            <div key={p.participant_id} className="flex justify-between text-xs">
              <span>{p.participant_name}</span>
              <span className="font-medium">
                {formatCurrency(p.earned)}
                {p.settled > 0 && (
                  <span className="text-green-600 ml-1">({formatCurrency(p.settled)} settled)</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CREATE DEAL DIALOG
// ============================================================================

interface CreateDealDialogProps {
  seriesId: string;
  onClose: () => void;
  createDeal: ReturnType<typeof useCreateSeriesDeal>;
}

interface ParticipantFormData {
  id: string;
  participant_id?: string;
  participant_email?: string;
  participant_name: string;
  participant_avatar?: string;
  participant_type: 'comedian' | 'manager' | 'organization' | 'venue' | 'promoter' | 'other';
  split_type: 'percentage' | 'flat_fee';
  split_percentage: number;
  flat_fee_amount?: number;
  gst_mode: GstMode;
  is_invitation: boolean;
}

function CreateDealDialog({ seriesId, onClose, createDeal }: CreateDealDialogProps) {
  // Form state
  const [title, setTitle] = useState('');
  const [dealType, setDealType] = useState<DealType>('revenue_share');
  const [description, setDescription] = useState('');
  const [fixedFeeAmount, setFixedFeeAmount] = useState<string>('');
  const [gstMode, setGstMode] = useState<GstMode>('none');
  const [frequency, setFrequency] = useState<DealFrequency>('per_event');
  const [dayOfWeek, setDayOfWeek] = useState<number>(3); // Wednesday
  const [notes, setNotes] = useState('');
  const [applyToAllEvents, setApplyToAllEvents] = useState(true);
  const [applyToFutureOnly, setApplyToFutureOnly] = useState(false);

  // Participants
  const [participants, setParticipants] = useState<ParticipantFormData[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    id: string; name: string; email: string; avatar_url?: string; type: 'comedian' | 'organization';
  } | null>(null);
  const [searchNotFound, setSearchNotFound] = useState(false);

  const totalPercentage = participants.reduce((sum, p) => sum + (p.split_percentage || 0), 0);
  const isValidSplit = dealType !== 'revenue_share' || Math.abs(totalPercentage - 100) < 0.01;

  // Search participant by email
  const handleSearch = useCallback(async () => {
    if (!searchEmail || !searchEmail.includes('@')) return;
    setIsSearching(true);
    setSearchResult(null);
    setSearchNotFound(false);

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url')
        .eq('email', searchEmail.toLowerCase().trim())
        .maybeSingle();

      if (profile) {
        setSearchResult({
          id: profile.id,
          name: profile.name || profile.email,
          email: profile.email,
          avatar_url: profile.avatar_url ?? undefined,
          type: 'comedian',
        });
      } else {
        setSearchNotFound(true);
      }
    } catch {
      setSearchNotFound(true);
    } finally {
      setIsSearching(false);
    }
  }, [searchEmail]);

  const handleAddParticipant = useCallback((profile?: typeof searchResult) => {
    const p = profile || searchResult;
    if (!p) return;

    if (participants.some(x => x.participant_id === p.id || x.participant_email === p.email)) return;

    setParticipants(prev => [...prev, {
      id: `p-${Date.now()}`,
      participant_id: p.id,
      participant_email: p.email,
      participant_name: p.name,
      participant_avatar: p.avatar_url,
      participant_type: p.type,
      split_type: dealType === 'fixed_split' ? 'flat_fee' : 'percentage',
      split_percentage: 0,
      gst_mode: 'none',
      is_invitation: false,
    }]);
    setSearchEmail('');
    setSearchResult(null);
    setSearchNotFound(false);
  }, [searchResult, participants, dealType]);

  const handleInviteByEmail = useCallback(() => {
    const email = searchEmail.toLowerCase().trim();
    if (participants.some(x => x.participant_email === email)) return;

    setParticipants(prev => [...prev, {
      id: `p-${Date.now()}`,
      participant_email: email,
      participant_name: email,
      participant_type: 'other',
      split_type: dealType === 'fixed_split' ? 'flat_fee' : 'percentage',
      split_percentage: 0,
      gst_mode: 'none',
      is_invitation: true,
    }]);
    setSearchEmail('');
    setSearchResult(null);
    setSearchNotFound(false);
  }, [searchEmail, participants, dealType]);

  const handleRemoveParticipant = (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdateParticipant = (id: string, updates: Partial<ParticipantFormData>) => {
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleCreate = async () => {
    const participantInputs: CreateSeriesDealParticipantInput[] = participants.map(p => ({
      participant_id: p.participant_id,
      participant_email: p.participant_email,
      participant_type: p.participant_type,
      split_type: p.split_type,
      split_percentage: p.split_percentage,
      flat_fee_amount: p.flat_fee_amount,
      gst_mode: p.gst_mode,
    }));

    await createDeal.mutateAsync({
      series_id: seriesId,
      title,
      deal_type: dealType,
      description: description || undefined,
      fixed_fee_amount: dealType === 'fixed_split' ? parseFloat(fixedFeeAmount) || undefined : undefined,
      gst_mode: gstMode,
      frequency: dealType === 'fixed_split' ? frequency : 'per_event',
      day_of_week: frequency === 'weekly' || frequency === 'fortnightly' ? dayOfWeek : undefined,
      notes: notes || undefined,
      apply_to_all_events: applyToAllEvents,
      apply_to_future_only: applyToFutureOnly,
      participants: participantInputs.length > 0 ? participantInputs : undefined,
    });
    onClose();
  };

  const canSubmit = title.trim() && isValidSplit && !createDeal.isPending;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Series Deal</DialogTitle>
          <DialogDescription>
            Set up financial terms that apply across events in this series
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Deal Title</Label>
              <Input
                placeholder="e.g., Venue Revenue Share"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Deal Type</Label>
              <Select value={dealType} onValueChange={(v) => setDealType(v as DealType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue_share">Revenue Share (%)</SelectItem>
                  <SelectItem value="fixed_split">Fixed Fee ($)</SelectItem>
                  <SelectItem value="tiered">Tiered</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fixed Fee Options */}
          {dealType === 'fixed_split' && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Amount ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="200.00"
                    value={fixedFeeAmount}
                    onChange={(e) => setFixedFeeAmount(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>GST</Label>
                <Select value={gstMode} onValueChange={(v) => setGstMode(v as GstMode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No GST</SelectItem>
                    <SelectItem value="exclusive">+ GST (Exclusive)</SelectItem>
                    <SelectItem value="inclusive">Inc. GST (Inclusive)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as DealFrequency)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_event">Per Event</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="fortnightly">Fortnightly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(frequency === 'weekly' || frequency === 'fortnightly') && (
                <div className="space-y-2">
                  <Label>Day</Label>
                  <Select value={String(dayOfWeek)} onValueChange={(v) => setDayOfWeek(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAY_NAMES.map((name, i) => (
                        <SelectItem key={i} value={String(i)}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Participants */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Participants</h3>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Search by email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
              <Button variant="secondary" onClick={handleSearch} disabled={!searchEmail || isSearching}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
              </Button>
            </div>

            {/* Search result */}
            {searchResult && (
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <OptimizedAvatar src={searchResult.avatar_url} name={searchResult.name} className="h-8 w-8" />
                      <div>
                        <p className="font-medium text-sm">{searchResult.name}</p>
                        <p className="text-xs text-muted-foreground">{searchResult.email}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleAddParticipant()}>Add</Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {searchNotFound && (
              <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                <Mail className="h-4 w-4 text-amber-600" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <p className="text-sm">No profile found. Invite by email?</p>
                    <Button size="sm" variant="secondary" onClick={handleInviteByEmail}>
                      <Mail className="mr-1 h-3 w-3" /> Invite
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Participant list */}
            {participants.length > 0 && (
              <div className="space-y-3">
                {dealType === 'revenue_share' && (
                  <div className="flex justify-end">
                    <span className={`text-sm font-medium ${isValidSplit ? 'text-green-600' : 'text-red-600'}`}>
                      Total: {totalPercentage.toFixed(1)}%
                      {isValidSplit ? (
                        <CheckCircle className="inline ml-1 h-3 w-3" />
                      ) : (
                        <AlertCircle className="inline ml-1 h-3 w-3" />
                      )}
                    </span>
                  </div>
                )}

                {participants.map(p => (
                  <Card key={p.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <OptimizedAvatar
                            src={p.participant_avatar}
                            name={p.participant_name}
                            className="h-8 w-8 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{p.participant_name}</p>
                            <Badge variant="secondary" className="text-xs">{p.participant_type}</Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => handleRemoveParticipant(p.id)}
                          className="text-destructive h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-end gap-3 mt-3">
                        {dealType === 'revenue_share' ? (
                          <div className="space-y-1 flex-1">
                            <Label className="text-xs">Split (%)</Label>
                            <div className="relative">
                              <Input
                                type="number" min={0} max={100} step={0.1}
                                value={p.split_percentage || ''}
                                onChange={(e) => handleUpdateParticipant(p.id, {
                                  split_percentage: parseFloat(e.target.value) || 0
                                })}
                                className="pr-8"
                              />
                              <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        ) : dealType === 'fixed_split' ? (
                          <div className="space-y-1 flex-1">
                            <Label className="text-xs">Amount ($)</Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number" min={0} step={0.01}
                                value={p.flat_fee_amount || ''}
                                onChange={(e) => handleUpdateParticipant(p.id, {
                                  flat_fee_amount: parseFloat(e.target.value) || 0
                                })}
                                className="pl-8"
                              />
                            </div>
                          </div>
                        ) : null}

                        <div className="space-y-1">
                          <Label className="text-xs">GST</Label>
                          <Select
                            value={p.gst_mode}
                            onValueChange={(v) => handleUpdateParticipant(p.id, { gst_mode: v as GstMode })}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No GST</SelectItem>
                              <SelectItem value="exclusive">+ GST</SelectItem>
                              <SelectItem value="inclusive">Inc. GST</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Application Options */}
          <div className="space-y-4">
            <Label>Application Options</Label>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Apply to All Events</p>
                <p className="text-xs text-muted-foreground">
                  Apply this deal to all existing events in the series
                </p>
              </div>
              <Switch
                checked={applyToAllEvents}
                onCheckedChange={setApplyToAllEvents}
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
                checked={applyToFutureOnly}
                onCheckedChange={setApplyToFutureOnly}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Additional deal notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!canSubmit}>
            {createDeal.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
            ) : (
              'Create Deal'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
