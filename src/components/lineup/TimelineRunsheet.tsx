/**
 * TimelineRunsheet Component
 *
 * Clean, professional timeline-style lineup display.
 * Shows spots as a vertical runsheet with times on the left.
 */

import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  Pencil,
  Trash2,
  DoorOpen,
  Coffee,
  Camera,
  Video,
  DoorClosed,
  Volume2,
  Lightbulb,
  Users,
  GripVertical,
  Plus,
  DollarSign,
} from 'lucide-react';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';
import { cn } from '@/lib/utils';
import { useEventSpots } from '@/hooks/useEventSpots';
import { useAllSpotLineItems } from '@/hooks/useSpotLineItems';
import { AssignComedianDialog } from './AssignComedianDialog';
import { AssignExtraDialog } from './AssignExtraDialog';
import { EditSpotDialog } from './EditSpotDialog';
import { EditBreakDialog } from './EditBreakDialog';
import { EditExtraDialog } from './EditExtraDialog';
import { AddLineItemDialog } from './AddLineItemDialog';
import type { SpotData, ExtraType, SpotCategory, SpotLineItem, GstType } from '@/types/spot';
import { EXTRA_TYPE_LABELS, GST_RATE } from '@/types/spot';

 
type RawSpot = SpotData & Record<string, any>;

/**
 * Helper to get category from raw DB or mapped SpotData
 * DB uses spot_category, SpotData uses category
 */
function getSpotCategory(spot: RawSpot): SpotCategory {
  return (spot.spot_category || spot.category || 'act') as SpotCategory;
}

/**
 * Helper to get spot kind (act vs extra) from raw DB or mapped SpotData
 */
function getSpotKind(spot: RawSpot): 'act' | 'extra' {
  return (spot.spot_type || 'act') as 'act' | 'extra';
}

/**
 * Helper to get spot name/label from raw DB or mapped SpotData
 * DB uses spot_name for everything
 */
function getSpotName(spot: RawSpot): string {
  return spot.spot_name || spot.label || spot.type || 'Spot';
}

/**
 * Helper to get comedian name - handles both raw DB (comedian object) and mapped SpotData
 */
function getComedianName(spot: RawSpot): string | undefined {
  if (spot.comedian_name) return spot.comedian_name;
  if (spot.comedian?.stage_name) return spot.comedian.stage_name;
  return undefined;
}

/**
 * Helper to get comedian avatar
 */
function getComedianAvatar(spot: RawSpot): string | undefined {
  if (spot.comedian_avatar) return spot.comedian_avatar;
  if (spot.comedian?.avatar_url) return spot.comedian.avatar_url;
  return undefined;
}

interface TimelineRunsheetProps {
  eventId: string;
  eventStartTime?: Date | null;
}

// Icon mapping for extra types
const EXTRA_ICONS: Record<ExtraType, React.ComponentType<{ className?: string }>> = {
  photographer: Camera,
  videographer: Video,
  door_staff: DoorClosed,
  audio_tech: Volume2,
  lighting_tech: Lightbulb,
};

/**
 * Format time as "7:00pm"
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).toLowerCase();
}

/**
 * Format scheduled time string (HH:MM) to display format
 */
function formatScheduledTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return formatTime(date);
}

/**
 * Format hours as "2h" or "2h 30m"
 */
function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format currency with decimals for GST breakdown
 */
function formatCurrencyDecimal(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format base payment with GST breakdown
 * - Excluded/null: "$100 Fee"
 * - Included: "$100 Fee (incl. GST $9.09)"
 * - Addition: "$110 Fee ($100 + GST $10)"
 */
function formatBasePaymentWithGst(amount: number, gstType: GstType | null | undefined, label: string = 'Fee'): string {
  if (!gstType || gstType === 'excluded') {
    return `${formatCurrency(amount)} ${label}`;
  } else if (gstType === 'included') {
    // GST is included: amount = base + gst
    const base = amount / (1 + GST_RATE);
    const gst = amount - base;
    return `${formatCurrency(amount)} ${label} (incl. GST ${formatCurrencyDecimal(gst)})`;
  } else {
    // GST is addition: total = amount + gst
    const gst = amount * GST_RATE;
    const total = amount + gst;
    return `${formatCurrency(total)} ${label} (${formatCurrency(amount)} + GST ${formatCurrencyDecimal(gst)})`;
  }
}

/**
 * Format line item with GST breakdown
 * - Excluded: "$50 Travel"
 * - Included: "$100 Fee (incl. GST $9.09)"
 * - Addition: "$110 Fee ($100 + GST $10)"
 */
function formatLineItemWithGst(item: SpotLineItem): { display: string; total: number; hasGst: boolean } {
  const amount = Math.abs(item.amount);
  const isNegative = item.amount < 0;
  const sign = isNegative ? '-' : '';

  if (item.gst_type === 'excluded') {
    return {
      display: `${sign}${formatCurrency(amount)} ${item.label}`,
      total: item.amount,
      hasGst: false,
    };
  } else if (item.gst_type === 'included') {
    // GST is included: amount = base + gst
    const base = amount / (1 + GST_RATE);
    const gst = amount - base;
    return {
      display: `${sign}${formatCurrency(amount)} ${item.label} (incl. GST ${formatCurrencyDecimal(gst)})`,
      total: item.amount,
      hasGst: true,
    };
  } else {
    // GST is addition: total = amount + gst
    const gst = amount * GST_RATE;
    const total = amount + gst;
    return {
      display: `${sign}${formatCurrency(total)} ${item.label} (${formatCurrency(amount)} + GST ${formatCurrencyDecimal(gst)})`,
      total: isNegative ? -total : total,
      hasGst: true,
    };
  }
}

/**
 * AddSpotZone Component
 * Droppable zone between spots on the timeline.
 * - Click to add a new spot at that position
 * - Drop a comedian to create + assign in one action
 */
interface AddSpotZoneProps {
  position: number;
  onAddSpot: (position: number) => void;
}

function AddSpotZone({ position, onAddSpot }: AddSpotZoneProps) {
  const { setNodeRef, isOver, active } = useDroppable({
    id: `add-zone-${position}`,
    data: {
      type: 'add-zone',
      position,
    },
  });

  // Only show when hovering or when dragging a comedian
  const isDraggingComedian = active?.data?.current?.type === 'comedian';
  const showZone = isOver || isDraggingComedian;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex items-center gap-4 transition-all duration-200 cursor-pointer group/addzone',
        'h-0 opacity-0 overflow-hidden',
        showZone && 'h-10 opacity-100 py-1',
        isOver && 'bg-primary/5 rounded-lg'
      )}
      onClick={() => onAddSpot(position)}
    >
      {/* Spacer for drag handle area */}
      <div className="w-5" />
      {/* Time column spacer */}
      <div className="w-20 shrink-0" />
      {/* Timeline connector with plus button */}
      <div className="relative flex items-center">
        <div className="w-3 h-px bg-border" />
        <div className={cn(
          'w-6 h-6 rounded-full border-2 border-dashed flex items-center justify-center transition-all',
          'text-muted-foreground/50 border-muted-foreground/30',
          'hover:border-primary hover:text-primary',
          isOver && 'border-primary text-primary bg-primary/10 scale-110'
        )}>
          <Plus className="h-4 w-4" />
        </div>
        <div className="w-3 h-px bg-border" />
      </div>
      {/* Label */}
      <span className={cn(
        'text-xs text-muted-foreground transition-opacity',
        'opacity-0 group-hover/addzone:opacity-100',
        isOver && 'opacity-100 text-primary font-medium'
      )}>
        {isOver ? 'Drop to add & assign' : 'Add spot'}
      </span>
    </div>
  );
}

/**
 * Single timeline row for a spot
 */
interface TimelineRowProps {
  spot: RawSpot;
  time: string;
  onAssign: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddLineItem: () => void;
  isExtra?: boolean;
  lineItems?: SpotLineItem[];
}

function TimelineRow({ spot, time, onAssign, onEdit, onDelete, onAddLineItem, isExtra, lineItems }: TimelineRowProps) {
  const category = getSpotCategory(spot);
  const isBreak = category !== 'act';
  const hasLineItems = lineItems && lineItems.length > 0;
  const isDoors = category === 'doors';
  const isIntermission = category === 'intermission';

  // Sortable hook for drag-and-drop reordering
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: spot.id,
    data: {
      type: 'spot-item',
      spotId: spot.id,
      eventId: spot.event_id,
      spotData: spot,
    },
  });

  // Droppable for receiving dragged comedians
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `spot-${spot.id}`,
    data: {
      type: 'spot',
      spotId: spot.id,
      isEmpty: !spot.comedian_id && !spot.staff_id,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Build spot label using helper function
  const getLabel = () => {
    if (isExtra && spot.extra_type) {
      return EXTRA_TYPE_LABELS[spot.extra_type] || 'Extra';
    }
    // Use spot_name from DB which stores MC, Feature, Headliner, Doors Open, etc.
    return getSpotName(spot);
  };

  // Build assignment display
  const getAssignment = () => {
    if (isExtra) {
      return spot.staff_name || 'Unassigned';
    }
    if (isBreak) {
      return null; // No assignment for breaks
    }
    return getComedianName(spot) || 'Unassigned';
  };

  // Build duration display - don't show "0mins" for breaks
  const getDuration = () => {
    if (isExtra && spot.hours) {
      return formatHours(spot.hours);
    }
    const duration = spot.duration_minutes;
    if (!duration || duration === 0) {
      return null; // Don't show duration if not set
    }
    return `${duration}mins`;
  };

  const assignment = getAssignment();
  const duration = getDuration();
  const isUnassigned = assignment === 'Unassigned';

  // Icons: Door for doors, Coffee for intermission, none for acts
  const BreakIcon = isDoors ? DoorOpen : isIntermission ? Coffee : null;
  const ExtraIcon = isExtra && spot.extra_type ? EXTRA_ICONS[spot.extra_type] || Users : Users;

  // Get avatar for assigned person
  const avatarUrl = isExtra ? spot.staff_avatar : getComedianAvatar(spot);

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        setDroppableRef(node);
      }}
      style={style}
      className={cn(
        'group flex items-center gap-4 py-2',
        isDragging && 'opacity-50',
        isOver && 'bg-primary/5 rounded-lg'
      )}
    >
      {/* Drag Handle */}
      <div
        className="cursor-grab text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing touch-none opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Time */}
      <div className="w-20 text-sm font-mono text-muted-foreground shrink-0">
        {time}
      </div>

      {/* Timeline connector */}
      <div className="relative flex items-center">
        <div className="w-3 h-px bg-border" />
        <div className={cn(
          'w-2 h-2 rounded-full shrink-0',
          isBreak ? 'bg-amber-500' : isExtra ? 'bg-indigo-500' : 'bg-primary'
        )} />
        <div className="w-6 h-px bg-border" />
      </div>

      {/* Spot Content */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        {/* Icon for breaks only - Door for doors, Coffee for intermission */}
        {isBreak && BreakIcon && <BreakIcon className="h-4 w-4 text-amber-500 shrink-0" />}
        {/* Icon for extras */}
        {isExtra && <ExtraIcon className="h-4 w-4 text-indigo-500 shrink-0" />}

        {/* Spot Type/Label */}
        <span className={cn(
          'font-medium',
          isBreak && 'text-amber-600 dark:text-amber-400',
          isExtra && 'text-indigo-600 dark:text-indigo-400'
        )}>
          {getLabel()}
        </span>

        {/* Assignment (comedian/staff name or Unassigned) */}
        {assignment && (
          <>
            <span className="text-muted-foreground">:</span>
            <div className="flex items-center gap-1.5 shrink-0">
              {avatarUrl && (
                <OptimizedAvatar
                  src={avatarUrl}
                  name={assignment}
                  className="h-5 w-5"
                />
              )}
              {/* Make Unassigned clickable to trigger assign */}
              {isUnassigned ? (
                <button
                  onClick={onAssign}
                  className="text-muted-foreground italic hover:text-primary hover:underline cursor-pointer"
                >
                  {assignment}
                </button>
              ) : (
                <span className="whitespace-nowrap">
                  {assignment}
                </span>
              )}
            </div>
          </>
        )}

        {/* Separator & Duration - only show if duration exists */}
        {duration && (
          <>
            <span className="text-muted-foreground/50">|</span>
            <span className="text-muted-foreground text-sm">
              {duration}
            </span>
          </>
        )}

        {/* Payment Display - Base fee + Line Items with GST breakdown */}
        {!isBreak && (spot.payment_amount > 0 || hasLineItems) && (
          <>
            <span className="text-muted-foreground/50">|</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Base payment amount as Fee with GST breakdown */}
              {spot.payment_amount > 0 && (
                <span className="text-sm text-green-600 dark:text-green-400">
                  {formatBasePaymentWithGst(spot.payment_amount, spot.payment_gst_type as GstType | null)}
                </span>
              )}
              {/* Additional line items with GST breakdown */}
              {hasLineItems && lineItems!.map((item) => {
                const formatted = formatLineItemWithGst(item);
                return (
                  <React.Fragment key={item.id}>
                    <span className="text-muted-foreground/30">|</span>
                    <span className={cn(
                      'text-sm',
                      item.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                    )}>
                      {formatted.display}
                    </span>
                  </React.Fragment>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Action Buttons - Icon only */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!isBreak && (
          <>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={onAssign}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Assign</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Add Line Item Button */}
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30"
                    onClick={onAddLineItem}
                  >
                    <DollarSign className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add Payment Item</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}

        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onEdit}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

export function TimelineRunsheet({ eventId, eventStartTime }: TimelineRunsheetProps) {
  const { spots, deleteSpot, isDeleting } = useEventSpots(eventId);

  // Get all spot IDs for batch fetching line items
  const spotIds = useMemo(() => spots?.map(s => s.id) || [], [spots]);
  const { data: lineItemsBySpot = {} } = useAllSpotLineItems(spotIds);

  // Dialog states
  const [assignSpotId, setAssignSpotId] = useState<string | null>(null);
  const [assignExtraSpotId, setAssignExtraSpotId] = useState<string | null>(null);
  const [editSpotId, setEditSpotId] = useState<string | null>(null);
  const [editBreakId, setEditBreakId] = useState<string | null>(null);
  const [editExtraId, setEditExtraId] = useState<string | null>(null);
  const [addLineItemSpotId, setAddLineItemSpotId] = useState<string | null>(null);

  // Split spots into performers (acts + breaks) and extras
  const { performerSpots, extraSpots, spotTimes, showEndTime } = useMemo(() => {
    if (!spots || spots.length === 0) {
      return { performerSpots: [], extraSpots: [], spotTimes: new Map(), showEndTime: null };
    }

    // Sort by spot_order
    const sorted = [...spots].sort((a, b) => (a.spot_order ?? 0) - (b.spot_order ?? 0));

    const performers: RawSpot[] = [];
    const extras: RawSpot[] = [];
    const times = new Map<string, string>();

    // Calculate times based on event start
    let currentTime = eventStartTime ? new Date(eventStartTime) : new Date();
    let lastEndTime = currentTime;

    for (const spot of sorted) {
      const kind = getSpotKind(spot);
      const category = getSpotCategory(spot);

      if (kind === 'extra') {
        extras.push(spot as RawSpot);
        // Extras use scheduled_start_time if set
        if (spot.scheduled_start_time) {
          times.set(spot.id, formatScheduledTime(spot.scheduled_start_time));
        }
      } else {
        performers.push(spot as RawSpot);

        // Handle doors with "before" start time mode
        if (category === 'doors' && spot.start_time_mode === 'before') {
          const doorsTime = new Date(currentTime);
          doorsTime.setMinutes(doorsTime.getMinutes() - (spot.duration_minutes || 0));
          times.set(spot.id, formatTime(doorsTime));
        } else {
          times.set(spot.id, formatTime(currentTime));
          // Only advance time for included items (not "before" doors)
          if (!(category === 'doors' && spot.start_time_mode === 'before')) {
            currentTime = new Date(currentTime);
            currentTime.setMinutes(currentTime.getMinutes() + (spot.duration_minutes || 0));
            lastEndTime = currentTime;
          }
        }
      }
    }

    return {
      performerSpots: performers,
      extraSpots: extras,
      spotTimes: times,
      showEndTime: lastEndTime ? formatTime(lastEndTime) : null,
    };
  }, [spots, eventStartTime]);

  const handleAssign = (spot: RawSpot) => {
    const kind = getSpotKind(spot);
    if (kind === 'extra') {
      setAssignExtraSpotId(spot.id);
    } else {
      setAssignSpotId(spot.id);
    }
  };

  const handleEdit = (spot: RawSpot) => {
    const kind = getSpotKind(spot);
    const category = getSpotCategory(spot);
    if (kind === 'extra') {
      setEditExtraId(spot.id);
    } else if (category !== 'act') {
      setEditBreakId(spot.id);
    } else {
      setEditSpotId(spot.id);
    }
  };

  const handleDelete = (spotId: string) => {
    if (confirm('Are you sure you want to delete this spot?')) {
      deleteSpot.mutate(spotId);
    }
  };

  // Handler for AddSpotZone click - opens add spot dialog at specific position
  // This callback is passed up to the parent LineupTab via a prop or context
  // For now, we'll use a simple alert - the actual implementation depends on
  // how AddSpotDialog is triggered in LineupTab
  const handleAddSpotAt = (position: number) => {
    // This triggers the AddSpotDialog in LineupTab with the position pre-set
    // For now, we'll dispatch a custom event that LineupTab can listen to
    const event = new CustomEvent('addSpotAtPosition', {
      detail: { position, eventId }
    });
    window.dispatchEvent(event);
  };

  // Get spot data for dialogs
  const selectedSpotForAssign = spots?.find(s => s.id === assignSpotId);
  const selectedSpotForEdit = spots?.find(s => s.id === editSpotId);
  const selectedBreakForEdit = spots?.find(s => s.id === editBreakId);
  const selectedExtraForEdit = spots?.find(s => s.id === editExtraId);
  const selectedExtraForAssign = spots?.find(s => s.id === assignExtraSpotId);

  if (!spots || spots.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No spots in the lineup yet.</p>
        <p className="text-sm mt-1">Add spots using the buttons above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Timeline */}
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-[7.5rem] top-0 bottom-0 w-px bg-border" />

        {/* Performer Spots */}
        <SortableContext
          items={performerSpots.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-0">
            {performerSpots.map((spot, index) => (
              <React.Fragment key={spot.id}>
                {/* Add zone before first spot */}
                {index === 0 && (
                  <AddSpotZone
                    position={1}
                    onAddSpot={handleAddSpotAt}
                  />
                )}
                <TimelineRow
                  spot={spot}
                  time={spotTimes.get(spot.id) || ''}
                  onAssign={() => handleAssign(spot)}
                  onEdit={() => handleEdit(spot)}
                  onDelete={() => handleDelete(spot.id)}
                  onAddLineItem={() => setAddLineItemSpotId(spot.id)}
                  isExtra={false}
                  lineItems={lineItemsBySpot[spot.id]}
                />
                {/* Add zone after each spot */}
                <AddSpotZone
                  position={(spot.spot_order ?? index + 1) + 1}
                  onAddSpot={handleAddSpotAt}
                />
              </React.Fragment>
            ))}
          </div>
        </SortableContext>

        {/* Show End Marker */}
        {showEndTime && performerSpots.length > 0 && (
          <div className="flex items-center gap-4 py-4 mt-2">
            <div className="w-5" /> {/* Spacer for drag handle */}
            <div className="w-20 text-sm font-mono text-muted-foreground shrink-0">
              {showEndTime}
            </div>
            <div className="relative flex items-center flex-1">
              <div className="w-3 h-px bg-border" />
              <div className="w-2 h-2 rounded-full bg-muted-foreground shrink-0" />
              <div className="flex-1 h-px bg-gradient-to-r from-border via-border to-transparent" />
              <span className="ml-4 text-sm font-medium text-muted-foreground">
                Show End
              </span>
              <div className="flex-1 h-px bg-gradient-to-l from-border via-border to-transparent" />
            </div>
          </div>
        )}
      </div>

      {/* Extras Section */}
      {extraSpots.length > 0 && (
        <div className="mt-8 pt-4 border-t border-dashed">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-medium text-muted-foreground">
              Production Staff
            </h3>
            <Badge variant="secondary" className="text-xs">
              {extraSpots.length}
            </Badge>
          </div>

          {/* Extras bracket styling */}
          <div className="relative pl-4 border-l-2 border-indigo-500/30">
            <SortableContext
              items={extraSpots.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-0">
                {extraSpots.map((spot) => (
                  <TimelineRow
                    key={spot.id}
                    spot={spot}
                    time={spotTimes.get(spot.id) || '—'}
                    onAssign={() => handleAssign(spot)}
                    onEdit={() => handleEdit(spot)}
                    onDelete={() => handleDelete(spot.id)}
                    onAddLineItem={() => setAddLineItemSpotId(spot.id)}
                    isExtra
                    lineItems={lineItemsBySpot[spot.id]}
                  />
                ))}
              </div>
            </SortableContext>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {selectedSpotForAssign && (
        <AssignComedianDialog
          open={!!assignSpotId}
          onOpenChange={(open) => !open && setAssignSpotId(null)}
          spotId={assignSpotId!}
          eventId={eventId}
          currentComedianId={selectedSpotForAssign.comedian_id}
          onAssigned={() => setAssignSpotId(null)}
        />
      )}

      {selectedExtraForAssign && (
        <AssignExtraDialog
          open={!!assignExtraSpotId}
          onOpenChange={(open) => !open && setAssignExtraSpotId(null)}
          spotId={assignExtraSpotId!}
          eventId={eventId}
          extraType={selectedExtraForAssign.extra_type || 'photographer'}
          currentStaffId={selectedExtraForAssign.staff_id}
          onAssigned={() => setAssignExtraSpotId(null)}
        />
      )}

      {selectedSpotForEdit && (
        <EditSpotDialog
          open={!!editSpotId}
          onOpenChange={(open) => !open && setEditSpotId(null)}
          spot={selectedSpotForEdit}
          onSaved={() => setEditSpotId(null)}
        />
      )}

      {selectedBreakForEdit && (
        <EditBreakDialog
          open={!!editBreakId}
          onOpenChange={(open) => !open && setEditBreakId(null)}
          spot={selectedBreakForEdit}
          onSaved={() => setEditBreakId(null)}
        />
      )}

      {selectedExtraForEdit && (
        <EditExtraDialog
          open={!!editExtraId}
          onOpenChange={(open) => !open && setEditExtraId(null)}
          eventId={eventId}
          spot={selectedExtraForEdit}
        />
      )}

      {/* Add Line Item Dialog */}
      {addLineItemSpotId && (
        <AddLineItemDialog
          open={!!addLineItemSpotId}
          onOpenChange={(open) => !open && setAddLineItemSpotId(null)}
          spotId={addLineItemSpotId}
          eventId={eventId}
          comedianName={
            spots?.find(s => s.id === addLineItemSpotId)?.comedian_name ||
            (spots?.find(s => s.id === addLineItemSpotId) as RawSpot)?.comedian?.stage_name ||
            spots?.find(s => s.id === addLineItemSpotId)?.staff_name
          }
        />
      )}
    </div>
  );
}

export default TimelineRunsheet;
