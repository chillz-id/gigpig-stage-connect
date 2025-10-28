# Quick Reference - Lineup & Deals Components

## Import Statements

```typescript
// Lineup Components
import {
  SpotCard,
  SpotCardContainer,
  SpotList,
  SpotListContainer,
  LineupTimeline
} from '@/components/lineup';

// Deals Components
import {
  DealCard,
  DealCardContainer,
  DealList,
  DealListContainer,
  ParticipantList,
  SplitCalculator
} from '@/components/deals';

// Types
import type { SpotData, SpotType, SpotStatus } from '@/types/spot';
import type {
  DealData,
  ParticipantData,
  SplitParticipant,
  DealStatus,
  ParticipantStatus
} from '@/types/deal';
```

## Component Props Cheatsheet

### Lineup

```typescript
// SpotCard
<SpotCard
  spot={spotData}
  onEdit={() => {}}
  onDelete={() => {}}
  onAssign={() => {}}
  isLoading={false}
/>

// SpotCardContainer
<SpotCardContainer
  spotId="uuid"
  eventId="uuid"
  spotData={spotData} // optional
/>

// SpotList
<SpotList
  spots={spotsArray}
  renderCard={(spot) => <SpotCard spot={spot} />}
  emptyMessage="No spots yet"
  onReorder={(sourceId, destId) => {}} // optional
/>

// SpotListContainer
<SpotListContainer
  eventId="uuid"
  spotsData={spotsArray} // optional
/>

// LineupTimeline
<LineupTimeline
  spots={spotsArray}
  eventStartTime="2025-01-01T19:00:00Z"
  eventEndTime="2025-01-01T22:00:00Z"
/>
```

### Deals

```typescript
// DealCard
<DealCard
  deal={dealData}
  participants={participantsArray}
  onConfirm={() => {}}
  onReject={() => {}}
  onEdit={() => {}}
  canConfirm={true}
  hasConfirmed={false}
  canViewFinancials={true}
  isLoading={false}
/>

// DealCardContainer
<DealCardContainer
  dealId="uuid"
  userId="uuid"
  eventOwnerId="uuid"
  dealData={dealData} // optional
/>

// DealList
<DealList
  deals={dealsArray}
  renderCard={(deal) => <DealCard deal={deal} />}
  emptyMessage="No deals yet"
/>

// DealListContainer
<DealListContainer
  eventId="uuid"
  userId="uuid"
  eventOwnerId="uuid"
  dealsData={dealsArray} // optional
/>

// ParticipantList
<ParticipantList
  participants={participantsArray}
  dealAmount={1000}
  canViewFinancials={true}
/>

// SplitCalculator
<SplitCalculator
  totalAmount={1000}
  participants={participantsArray}
  onSplitChange={(participantId, amount) => {}}
/>
```

## Type Definitions Quick Reference

```typescript
// Spot Types
type SpotType = 'MC' | 'Feature' | 'Headliner' | 'Guest';
type SpotStatus = 'available' | 'assigned' | 'confirmed' | 'cancelled';

interface SpotData {
  id: string;
  event_id: string;
  position: number;
  time: string;
  type: SpotType;
  comedian_id?: string;
  comedian_name?: string;
  comedian_avatar?: string;
  payment_amount?: number;
  status: SpotStatus;
  duration_minutes?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Deal Types
type DealStatus = 'pending' | 'confirmed' | 'rejected';
type ParticipantStatus = 'pending' | 'confirmed' | 'rejected';

interface DealData {
  id: string;
  event_id: string;
  title: string;
  total_amount: number;
  status: DealStatus;
  participants: ParticipantData[];
  created_by: string;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  rejected_at?: string;
}

interface ParticipantData {
  id: string;
  deal_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  split_amount: number;
  split_percentage: number;
  status: ParticipantStatus;
  confirmed_at?: string;
  created_at: string;
  updated_at: string;
}

interface SplitParticipant {
  id?: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  split_amount: number;
  split_percentage: number;
}
```

## Common Patterns

### Full Lineup Tab Implementation

```typescript
import { SpotListContainer, LineupTimeline } from '@/components/lineup';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

function LineupTab({ eventId, event }: { eventId: string; event: Event }) {
  return (
    <Tabs defaultValue="list">
      <TabsList>
        <TabsTrigger value="list">List View</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
      </TabsList>

      <TabsContent value="list">
        <SpotListContainer eventId={eventId} />
      </TabsContent>

      <TabsContent value="timeline">
        <LineupTimeline
          spots={event.spots}
          eventStartTime={event.start_time}
          eventEndTime={event.end_time}
        />
      </TabsContent>
    </Tabs>
  );
}
```

### Full Deals Tab Implementation

```typescript
import { DealListContainer } from '@/components/deals';
import { Button } from '@/components/ui/button';

function DealsTab({
  eventId,
  userId,
  eventOwnerId,
  onCreateDeal
}: {
  eventId: string;
  userId: string;
  eventOwnerId: string;
  onCreateDeal: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Revenue Deals</h2>
        <Button onClick={onCreateDeal}>Create Deal</Button>
      </div>

      <DealListContainer
        eventId={eventId}
        userId={userId}
        eventOwnerId={eventOwnerId}
      />
    </div>
  );
}
```

### Create Deal Modal with Split Calculator

```typescript
import { SplitCalculator } from '@/components/deals';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function CreateDealModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [participants, setParticipants] = useState<SplitParticipant[]>([]);

  const handleSplitChange = (participantId: string, amount: number) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.user_id === participantId
          ? {
              ...p,
              split_amount: amount,
              split_percentage: (amount / totalAmount) * 100
            }
          : p
      )
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Revenue Deal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Deal title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Input
            type="number"
            placeholder="Total amount"
            value={totalAmount}
            onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
          />

          <SplitCalculator
            totalAmount={totalAmount}
            participants={participants}
            onSplitChange={handleSplitChange}
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => {/* Create deal */}}>
              Create Deal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## Hooks Required (To Be Implemented)

```typescript
// Lineup Hooks
const { data: spots, isLoading } = useEventSpots(eventId);
const { data: spot, isLoading } = useSpot(spotId);
const deleteMutation = useDeleteSpot();
const assignMutation = useAssignComedian();
const reorderMutation = useReorderSpots();

// Usage:
deleteMutation.mutate({ spotId, eventId });
assignMutation.mutate({ spotId, comedianId });
reorderMutation.mutate({ eventId, sourceId, destinationId });

// Deals Hooks
const { data: deals, isLoading } = useEventDeals(eventId);
const { data: deal, isLoading } = useDeal(dealId);
const confirmMutation = useConfirmDeal();
const rejectMutation = useRejectDeal();
const createMutation = useCreateDeal();
const updateMutation = useUpdateDeal();

// Usage:
confirmMutation.mutate({ dealId, userId });
rejectMutation.mutate({ dealId, userId });
createMutation.mutate({ eventId, title, totalAmount, participants });
updateMutation.mutate({ dealId, title, totalAmount });
```

## Color Codes

```typescript
// Spot Type Colors
const spotTypeColors = {
  MC: 'bg-blue-100 text-blue-800 border-blue-500',
  Feature: 'bg-yellow-100 text-yellow-800 border-yellow-500',
  Headliner: 'bg-purple-100 text-purple-800 border-purple-500',
  Guest: 'bg-green-100 text-green-800 border-green-500'
};

// Status Colors
const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  available: 'bg-gray-100 text-gray-800',
  assigned: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800'
};
```

## Common Utilities

```typescript
// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD'
  }).format(amount);
};

// Format time
const formatTime = (time: string) => {
  const date = new Date(time);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Get initials
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Calculate percentage
const calculatePercentage = (amount: number, total: number) => {
  if (total === 0) return 0;
  return (amount / total) * 100;
};
```

## Testing Examples

```typescript
// SpotCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { SpotCard } from '@/components/lineup';

test('renders spot card with comedian', () => {
  const spot = {
    id: '1',
    position: 1,
    time: '2025-01-01T19:00:00Z',
    type: 'MC' as const,
    comedian_name: 'John Doe',
    status: 'assigned' as const
  };

  render(<SpotCard spot={spot} onEdit={() => {}} onDelete={() => {}} onAssign={() => {}} />);

  expect(screen.getByText('John Doe')).toBeInTheDocument();
  expect(screen.getByText('MC')).toBeInTheDocument();
});

// DealCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { DealCard } from '@/components/deals';

test('hides financials when no permission', () => {
  const deal = {
    id: '1',
    title: 'Revenue Split',
    total_amount: 1000,
    status: 'pending' as const,
    participants: []
  };

  render(
    <DealCard
      deal={deal}
      participants={[]}
      canConfirm={false}
      hasConfirmed={false}
      canViewFinancials={false}
      onConfirm={() => {}}
      onReject={() => {}}
      onEdit={() => {}}
    />
  );

  expect(screen.getByText('****')).toBeInTheDocument();
  expect(screen.queryByText('$1,000.00')).not.toBeInTheDocument();
});
```

---

**Last Updated:** 2025-10-28
**Branch:** `feature/event-management-system`
**Status:** ✅ Ready for Integration
