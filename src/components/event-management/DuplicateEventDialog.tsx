import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, MapPin, Ticket, DollarSign, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { SyncBadge, EventSource } from './SyncBadge';
import type { DuplicateCandidate } from '@/hooks/useDuplicateDetection';

interface DuplicateEventDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;

  /**
   * Callback when the dialog should close
   */
  onOpenChange: (open: boolean) => void;

  /**
   * List of duplicate candidates found
   */
  candidates: DuplicateCandidate[];

  /**
   * The event data being created
   */
  newEventData: {
    title: string;
    event_date: string;
    venue?: string;
  };

  /**
   * Callback when user selects a synced event to use instead
   */
  onSelectSyncedEvent: (candidate: DuplicateCandidate) => void;

  /**
   * Callback when user wants to create a new event anyway
   */
  onCreateNew: () => void;

  /**
   * Whether an operation is in progress
   */
  isLoading?: boolean;
}

export function DuplicateEventDialog({
  open,
  onOpenChange,
  candidates,
  newEventData,
  onSelectSyncedEvent,
  onCreateNew,
  isLoading = false,
}: DuplicateEventDialogProps) {
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'EEE, MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Potential Duplicate Found
          </DialogTitle>
          <DialogDescription>
            We found existing events that might match what you're creating.
            Would you like to use one of these instead?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* New Event Being Created */}
          <div className="rounded-lg border border-dashed border-muted-foreground/30 p-4 bg-muted/30">
            <div className="text-sm text-muted-foreground mb-2">Creating:</div>
            <div className="font-medium">{newEventData.title}</div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(newEventData.event_date)}
              </span>
              {newEventData.venue && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {newEventData.venue}
                </span>
              )}
            </div>
          </div>

          {/* Duplicate Candidates */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Existing events on the same date:</div>

            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className={cn(
                  'rounded-lg border p-4 transition-colors cursor-pointer',
                  'hover:border-primary hover:bg-primary/5',
                  candidate.similarity_score === 1.0 && 'border-amber-500 bg-amber-500/5'
                )}
                onClick={() => !isLoading && onSelectSyncedEvent(candidate)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{candidate.title}</span>
                      <SyncBadge
                        source={candidate.source as EventSource}
                        isSynced={true}
                        size="sm"
                      />
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(candidate.event_date)}
                      </span>
                      {candidate.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {candidate.venue}
                        </span>
                      )}
                    </div>

                    {/* Financial Data */}
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      {candidate.ticket_count !== null && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Ticket className="h-3.5 w-3.5" />
                          {candidate.ticket_count} tickets
                        </span>
                      )}
                      {candidate.gross_dollars !== null && (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <DollarSign className="h-3.5 w-3.5" />
                          {formatCurrency(candidate.gross_dollars)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Match indicator */}
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant={candidate.similarity_score === 1.0 ? 'default' : 'secondary'}
                      className={cn(
                        'text-xs',
                        candidate.similarity_score === 1.0 && 'bg-amber-500'
                      )}
                    >
                      {Math.round(candidate.similarity_score * 100)}% match
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {candidate.match_reason}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" />
                    Synced {candidate.synced_at ? format(new Date(candidate.synced_at), 'MMM d, h:mm a') : 'recently'}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSyncedEvent(candidate);
                    }}
                    disabled={isLoading}
                  >
                    Use this event
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={onCreateNew}
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create new anyway'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Compact version for inline display (e.g., in forms)
 */
interface DuplicateWarningBannerProps {
  candidates: DuplicateCandidate[];
  onViewDetails: () => void;
  onDismiss: () => void;
}

export function DuplicateWarningBanner({
  candidates,
  onViewDetails,
  onDismiss,
}: DuplicateWarningBannerProps) {
  if (candidates.length === 0) return null;

  const topMatch = candidates[0];

  return (
    <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">
            Potential duplicate detected
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Found "{topMatch.title}" from {topMatch.source} with {Math.round(topMatch.similarity_score * 100)}% match.
            {candidates.length > 1 && ` (${candidates.length - 1} more)`}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Button size="sm" variant="secondary" onClick={onViewDetails}>
              View matches
            </Button>
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
