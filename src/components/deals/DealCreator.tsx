/**
 * DealCreator Component
 *
 * Single-page deal creator that replaces the multi-step wizard.
 * Supports three deal modes:
 * - flat_split: Simple percentage splits between participants
 * - full_terms: Detailed terms with payment schedules and notes
 * - tiered: Revenue-based tiers with different split ratios
 */

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useMobileLayout } from '@/hooks/useMobileLayout';
import { cn } from '@/lib/utils';
import {
  Plus,
  Trash2,
  DollarSign,
  Percent,
  CheckCircle,
  AlertCircle,
  Search,
  Loader2,
  User,
  Building,
  Mail,
} from 'lucide-react';
import type { GSTMode } from '@/utils/gst-calculator';

// ============================================================================
// TYPES
// ============================================================================

type DealMode = 'flat_split' | 'full_terms' | 'tiered';
type SplitType = 'percentage' | 'flat_fee' | 'door_split' | 'guaranteed_minimum';
type ParticipantType = 'comedian' | 'organization' | 'venue' | 'promoter' | 'other';

interface DealTerm {
  id: string;
  participantId?: string;
  participantEmail?: string;
  participantName: string;
  participantAvatar?: string;
  participantType: ParticipantType;
  splitType: SplitType;
  splitPercentage: number;
  flatFeeAmount?: number;
  gstMode: GSTMode;
  notes?: string;
  isInvitation: boolean;
}

interface RevenueTier {
  id: string;
  minRevenue: number;
  maxRevenue: number | null; // null = unlimited
  splits: Array<{ termId: string; percentage: number }>;
}

interface FoundProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  gst_registered: boolean;
  type: ParticipantType;
}

interface DealCreatorProps {
  eventId: string;
  userId: string;
  onComplete: () => void;
  onCancel: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DealCreator({ eventId, userId, onComplete, onCancel }: DealCreatorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isMobile } = useMobileLayout();

  // Form state
  const [dealName, setDealName] = useState('');
  const [dealMode, setDealMode] = useState<DealMode>('flat_split');
  const [terms, setTerms] = useState<DealTerm[]>([]);
  const [tiers, setTiers] = useState<RevenueTier[]>([]);

  // Participant search state
  const [searchEmail, setSearchEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<FoundProfile | null>(null);
  const [searchNotFound, setSearchNotFound] = useState(false);

  // Calculate total percentage
  const totalPercentage = terms.reduce((sum, term) => sum + (term.splitPercentage || 0), 0);
  const isValidSplit = Math.abs(totalPercentage - 100) < 0.01;

  // ============================================================================
  // PARTICIPANT SEARCH
  // ============================================================================

  const handleSearchParticipant = useCallback(async () => {
    if (!searchEmail || !searchEmail.includes('@')) {
      toast({
        variant: 'destructive',
        title: 'Invalid email',
        description: 'Please enter a valid email address',
      });
      return;
    }

    setIsSearching(true);
    setSearchResult(null);
    setSearchNotFound(false);

    try {
      // Search in profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url, gst_registered')
        .eq('email', searchEmail.toLowerCase().trim())
        .maybeSingle();

      if (profile) {
        setSearchResult({
          id: profile.id,
          name: profile.name || profile.email,
          email: profile.email,
          avatar_url: profile.avatar_url ?? undefined,
          gst_registered: profile.gst_registered ?? false,
          type: 'comedian', // Default type, could be refined
        });
      } else {
        // Search in organizations
        const { data: org } = await supabase
          .from('organization_profiles')
          .select('id, name, contact_email, avatar_url')
          .eq('contact_email', searchEmail.toLowerCase().trim())
          .maybeSingle();

        if (org) {
          setSearchResult({
            id: org.id,
            name: org.name,
            email: org.contact_email ?? searchEmail,
            avatar_url: org.avatar_url ?? undefined,
            gst_registered: false,
            type: 'organization',
          });
        } else {
          setSearchNotFound(true);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchNotFound(true);
    } finally {
      setIsSearching(false);
    }
  }, [searchEmail, toast]);

  const handleAddFoundParticipant = useCallback(() => {
    if (!searchResult) return;

    // Check if already added
    const exists = terms.some(
      (t) => t.participantId === searchResult.id || t.participantEmail === searchResult.email
    );
    if (exists) {
      toast({
        variant: 'destructive',
        title: 'Already added',
        description: 'This participant is already in the deal',
      });
      return;
    }

    const newTerm: DealTerm = {
      id: `term-${Date.now()}`,
      participantId: searchResult.id,
      participantEmail: searchResult.email,
      participantName: searchResult.name,
      participantAvatar: searchResult.avatar_url,
      participantType: searchResult.type,
      splitType: 'percentage',
      splitPercentage: 0,
      gstMode: searchResult.gst_registered ? 'inclusive' : 'none',
      isInvitation: false,
    };

    setTerms([...terms, newTerm]);
    setSearchEmail('');
    setSearchResult(null);
    setSearchNotFound(false);
  }, [searchResult, terms, toast]);

  const handleInviteParticipant = useCallback(() => {
    const email = searchEmail.toLowerCase().trim();

    // Check if already added
    const exists = terms.some((t) => t.participantEmail === email);
    if (exists) {
      toast({
        variant: 'destructive',
        title: 'Already added',
        description: 'This participant is already in the deal',
      });
      return;
    }

    const newTerm: DealTerm = {
      id: `term-${Date.now()}`,
      participantEmail: email,
      participantName: email,
      participantType: 'other',
      splitType: 'percentage',
      splitPercentage: 0,
      gstMode: 'none',
      isInvitation: true,
    };

    setTerms([...terms, newTerm]);
    setSearchEmail('');
    setSearchResult(null);
    setSearchNotFound(false);
  }, [searchEmail, terms, toast]);

  // ============================================================================
  // TERM MANAGEMENT
  // ============================================================================

  const handleRemoveTerm = useCallback((termId: string) => {
    setTerms((prev) => prev.filter((t) => t.id !== termId));
  }, []);

  const handleUpdateTerm = useCallback(
    (termId: string, updates: Partial<DealTerm>) => {
      setTerms((prev) =>
        prev.map((t) => (t.id === termId ? { ...t, ...updates } : t))
      );
    },
    []
  );

  // ============================================================================
  // TIER MANAGEMENT (for tiered mode)
  // ============================================================================

  const handleAddTier = useCallback(() => {
    const lastTier = tiers[tiers.length - 1];
    const newTier: RevenueTier = {
      id: `tier-${Date.now()}`,
      minRevenue: lastTier ? (lastTier.maxRevenue ?? 0) + 1 : 0,
      maxRevenue: null,
      splits: terms.map((t) => ({ termId: t.id, percentage: t.splitPercentage })),
    };
    setTiers([...tiers, newTier]);
  }, [tiers, terms]);

  const handleRemoveTier = useCallback((tierId: string) => {
    setTiers((prev) => prev.filter((t) => t.id !== tierId));
  }, []);

  const handleUpdateTierSplit = useCallback(
    (tierId: string, termId: string, percentage: number) => {
      setTiers((prev) =>
        prev.map((tier) =>
          tier.id === tierId
            ? {
                ...tier,
                splits: tier.splits.map((s) =>
                  s.termId === termId ? { ...s, percentage } : s
                ),
              }
            : tier
        )
      );
    },
    []
  );

  // ============================================================================
  // CREATE DEAL
  // ============================================================================

  const createDealMutation = useMutation({
    mutationFn: async () => {
      if (!dealName.trim()) throw new Error('Deal name is required');
      if (terms.length < 2) throw new Error('At least 2 participants are required');
      if (!isValidSplit) throw new Error('Split percentages must equal 100%');

      // Create the deal
      const { data: deal, error: dealError } = await supabase
        .from('event_deals')
        .insert({
          event_id: eventId,
          deal_name: dealName.trim(),
          deal_type: dealMode,
          status: 'draft',
          created_by: userId,
        })
        .select()
        .single();

      if (dealError) throw dealError;
      if (!deal) throw new Error('Failed to create deal');

      // Create participants
      const participantInserts = terms.map((term) => ({
        deal_id: deal.id,
        participant_id: term.participantId || null,
        participant_email: term.participantEmail || null,
        participant_type: term.participantType,
        split_type: term.splitType,
        split_percentage: term.splitPercentage,
        flat_fee_amount: term.flatFeeAmount || null,
        gst_mode: term.gstMode,
        notes: term.notes || null,
        invitation_status: term.isInvitation ? 'pending' : null,
        invited_at: term.isInvitation ? new Date().toISOString() : null,
      }));

      const { error: participantsError } = await supabase
        .from('deal_participants')
        .insert(participantInserts);

      if (participantsError) throw participantsError;

      return deal;
    },
    onSuccess: () => {
      toast({
        title: 'Deal Created',
        description: `"${dealName}" has been created successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['event-deals', eventId] });
      queryClient.invalidateQueries({ queryKey: ['deal-stats', eventId] });
      onComplete();
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create deal',
      });
    },
  });

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent
        className={cn(
          'max-h-[90vh] overflow-y-auto',
          isMobile ? 'max-w-full' : 'max-w-3xl'
        )}
        mobileVariant="fullscreen"
      >
        <DialogHeader>
          <DialogTitle>Create Deal</DialogTitle>
          <DialogDescription>
            Configure revenue sharing and payment terms for event participants
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Deal Name & Type */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="deal-name">Deal Name</Label>
              <Input
                id="deal-name"
                placeholder="e.g., Sydney Comedy Night Split"
                value={dealName}
                onChange={(e) => setDealName(e.target.value)}
                className={cn(isMobile && 'h-11')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deal-type">Deal Type</Label>
              <Select value={dealMode} onValueChange={(v) => setDealMode(v as DealMode)}>
                <SelectTrigger id="deal-type" className={cn(isMobile && 'h-11')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat_split">Flat Split (Simple %)</SelectItem>
                  <SelectItem value="full_terms">Full Terms (Detailed)</SelectItem>
                  <SelectItem value="tiered">Tiered (Revenue-based)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Add Participant */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Deal Participants</h3>

            <div className="space-y-2">
              <Label htmlFor="participant-search">Add Participant by Email</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="participant-search"
                    type="email"
                    placeholder="email@example.com"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchParticipant()}
                    className={cn('pl-9', isMobile && 'h-11')}
                  />
                </div>
                <Button
                  variant="secondary"
                  onClick={handleSearchParticipant}
                  disabled={!searchEmail || isSearching}
                  className={cn(isMobile && 'h-11')}
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Search'
                  )}
                </Button>
              </div>
            </div>

            {/* Search Result - Found */}
            {searchResult && (
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <OptimizedAvatar
                        src={searchResult.avatar_url}
                        name={searchResult.name}
                        className="h-10 w-10"
                      />
                      <div>
                        <p className="font-medium">{searchResult.name}</p>
                        <p className="text-sm text-muted-foreground">{searchResult.email}</p>
                      </div>
                      {searchResult.gst_registered && (
                        <Badge variant="secondary" className="text-xs">GST</Badge>
                      )}
                    </div>
                    <Button size="sm" onClick={handleAddFoundParticipant}>
                      Add to Deal
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Search Result - Not Found */}
            {searchNotFound && (
              <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                <Mail className="h-4 w-4 text-amber-600" />
                <AlertDescription>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-medium">No profile found for {searchEmail}</p>
                      <p className="text-sm text-muted-foreground">
                        Invite them to join - they'll be added once they register.
                      </p>
                    </div>
                    <Button size="sm" variant="secondary" onClick={handleInviteParticipant}>
                      <Mail className="mr-2 h-4 w-4" />
                      Invite
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Terms List */}
          {terms.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Participants ({terms.length})</h4>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isValidSplit ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    Total: {totalPercentage.toFixed(1)}%
                  </span>
                  {isValidSplit ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {terms.map((term) => (
                  <Card key={term.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        {/* Participant Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <OptimizedAvatar
                            src={term.participantAvatar}
                            name={term.participantName}
                            className="h-10 w-10 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{term.participantName}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {term.participantType}
                              </Badge>
                              {term.isInvitation && (
                                <Badge variant="secondary" className="text-xs text-amber-600">
                                  Invited
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveTerm(term.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Term Details */}
                      <div className={cn(
                        'mt-4 gap-4',
                        dealMode === 'full_terms' ? 'grid grid-cols-1 md:grid-cols-2' : 'flex flex-wrap items-end'
                      )}>
                        {/* Split Percentage */}
                        <div className="space-y-1">
                          <Label className="text-xs">Split (%)</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={0.1}
                              value={term.splitPercentage || ''}
                              onChange={(e) =>
                                handleUpdateTerm(term.id, {
                                  splitPercentage: parseFloat(e.target.value) || 0,
                                })
                              }
                              className={cn('pr-8', isMobile && 'h-11')}
                            />
                            <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>

                        {/* Full Terms: Additional Fields */}
                        {dealMode === 'full_terms' && (
                          <>
                            <div className="space-y-1">
                              <Label className="text-xs">Split Type</Label>
                              <Select
                                value={term.splitType}
                                onValueChange={(v) =>
                                  handleUpdateTerm(term.id, { splitType: v as SplitType })
                                }
                              >
                                <SelectTrigger className={cn(isMobile && 'h-11')}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="percentage">Percentage</SelectItem>
                                  <SelectItem value="flat_fee">Flat Fee</SelectItem>
                                  <SelectItem value="door_split">Door Split</SelectItem>
                                  <SelectItem value="guaranteed_minimum">Guaranteed Min</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {term.splitType === 'flat_fee' && (
                              <div className="space-y-1">
                                <Label className="text-xs">Flat Fee ($)</Label>
                                <div className="relative">
                                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={term.flatFeeAmount || ''}
                                    onChange={(e) =>
                                      handleUpdateTerm(term.id, {
                                        flatFeeAmount: parseFloat(e.target.value) || 0,
                                      })
                                    }
                                    className={cn('pl-8', isMobile && 'h-11')}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="space-y-1">
                              <Label className="text-xs">GST Treatment</Label>
                              <Select
                                value={term.gstMode}
                                onValueChange={(v) =>
                                  handleUpdateTerm(term.id, { gstMode: v as GSTMode })
                                }
                              >
                                <SelectTrigger className={cn(isMobile && 'h-11')}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="inclusive">GST Inclusive</SelectItem>
                                  <SelectItem value="exclusive">GST Exclusive</SelectItem>
                                  <SelectItem value="none">No GST</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1 md:col-span-2">
                              <Label className="text-xs">Notes (optional)</Label>
                              <Textarea
                                placeholder="Payment terms, special arrangements..."
                                value={term.notes || ''}
                                onChange={(e) =>
                                  handleUpdateTerm(term.id, { notes: e.target.value })
                                }
                                rows={2}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Validation Message */}
              {!isValidSplit && terms.length >= 2 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Split percentages must equal 100%. Current total: {totalPercentage.toFixed(1)}%
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Tiered Mode: Revenue Tiers */}
          {dealMode === 'tiered' && terms.length >= 2 && (
            <div className="space-y-4">
              <Separator />
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Revenue Tiers</h4>
                <Button variant="secondary" size="sm" onClick={handleAddTier}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Tier
                </Button>
              </div>

              {tiers.length === 0 && (
                <Alert>
                  <AlertDescription>
                    Add revenue tiers to define different split percentages at various revenue levels.
                    The base split above will apply if no tiers are configured.
                  </AlertDescription>
                </Alert>
              )}

              {tiers.map((tier, index) => (
                <Card key={tier.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        Tier {index + 1}: ${tier.minRevenue.toLocaleString()}
                        {tier.maxRevenue ? ` - $${tier.maxRevenue.toLocaleString()}` : '+'}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveTier(tier.id)}
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid gap-2">
                      <div className="flex gap-2">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">Min ($)</Label>
                          <Input
                            type="number"
                            min={0}
                            value={tier.minRevenue}
                            onChange={(e) =>
                              setTiers((prev) =>
                                prev.map((t) =>
                                  t.id === tier.id
                                    ? { ...t, minRevenue: parseInt(e.target.value) || 0 }
                                    : t
                                )
                              )
                            }
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">Max ($)</Label>
                          <Input
                            type="number"
                            min={0}
                            placeholder="Unlimited"
                            value={tier.maxRevenue ?? ''}
                            onChange={(e) =>
                              setTiers((prev) =>
                                prev.map((t) =>
                                  t.id === tier.id
                                    ? {
                                        ...t,
                                        maxRevenue: e.target.value
                                          ? parseInt(e.target.value)
                                          : null,
                                      }
                                    : t
                                )
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="mt-2 space-y-2">
                        {terms.map((term) => {
                          const split = tier.splits.find((s) => s.termId === term.id);
                          return (
                            <div
                              key={term.id}
                              className="flex items-center justify-between gap-2"
                            >
                              <span className="text-sm truncate">{term.participantName}</span>
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  step={0.1}
                                  value={split?.percentage ?? term.splitPercentage}
                                  onChange={(e) =>
                                    handleUpdateTierSplit(
                                      tier.id,
                                      term.id,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-20 h-8 text-center"
                                />
                                <span className="text-sm text-muted-foreground">%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {terms.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                <User className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="font-medium">No participants added yet</p>
                <p className="text-sm mt-1">
                  Search by email to add comedians, organizations, or venues to this deal.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className={cn(isMobile && 'flex-col gap-2')}>
          <Button
            variant="ghost"
            onClick={onCancel}
            className={cn(isMobile && 'w-full order-2')}
          >
            Cancel
          </Button>
          <Button
            onClick={() => createDealMutation.mutate()}
            disabled={
              createDealMutation.isPending ||
              !dealName.trim() ||
              terms.length < 2 ||
              !isValidSplit
            }
            className={cn(isMobile && 'w-full order-1')}
          >
            {createDealMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Deal'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DealCreator;
