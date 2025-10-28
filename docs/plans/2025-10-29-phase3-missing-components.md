# Phase 3: Missing Components Implementation Plan

**Date:** 2025-10-29
**Status:** Ready for Implementation
**Working Directory:** `/root/agents/.worktrees/event-management-system`

---

## Context

Phase 3 audit revealed 82% completion (18/22 components). This plan addresses the 4 missing components identified as critical gaps.

**Audit Report:** Based on comprehensive codebase analysis showing:
- DealBuilder, DealParticipantSelector, SettleButton, SpotPaymentEditor all ✅ complete
- ApplicationCard, ShortlistPanel, SpotCard, EventManagementHeader all ✅ complete
- Missing: 4 components needed for complete Phase 3

---

## Task 1: Implement DealApprovalPanel Component

**Priority:** P1 - CRITICAL (blocks production deal approval workflow)

**File:** `src/components/event-management/DealApprovalPanel.tsx`

**Purpose:** Allow deal participants to view their terms and take action (approve, request changes, decline)

**Props Interface:**
```typescript
interface DealApprovalPanelProps {
  dealParticipant: {
    id: string;
    deal_id: string;
    participant_id: string;
    participant_type: string;
    split_percentage: number;
    split_type: 'percentage' | 'flat_fee' | 'door_split' | 'guaranteed_minimum';
    flat_fee_amount?: number;
    door_split_percentage?: number;
    guaranteed_minimum?: number;
    approval_status: 'pending' | 'approved' | 'declined' | 'changes_requested';
    notes?: string;
    gst_mode: 'inclusive' | 'exclusive' | 'none';
  };
  dealDetails: {
    deal_name: string;
    deal_type: string;
    total_amount?: number;
    description?: string;
  };
  managerCommission?: {
    rate: number;
    amount: number;
  };
  onApprove: () => void;
  onRequestChanges: (editNotes: string, newSplit?: number) => void;
  onDecline: (reason: string) => void;
  isLoading?: boolean;
}
```

**Requirements:**

1. **Terms Display Section:**
   - Show deal name and type prominently
   - Display participant's split clearly (percentage OR fixed amount)
   - Show GST mode badge (inclusive/exclusive/none)
   - If manager commission applies, show: "Manager commission: X% (${amount})"
   - Calculate and show participant's expected payment:
     - For percentage splits: `total_amount * split_percentage / 100`
     - For flat fees: `flat_fee_amount`
     - Subtract manager commission if applicable
   - Use Card component with proper spacing

2. **Action Buttons:**
   - "Approve Deal" button (primary/green)
   - "Request Changes" button (secondary/yellow)
   - "Decline Deal" button (destructive/red)
   - All buttons show loading state when `isLoading` true
   - Buttons disabled if status is not 'pending'

3. **Request Changes Modal:**
   - Dialog component opens on "Request Changes" click
   - Textarea for edit notes (required, min 10 characters)
   - Optional: Input for proposed new split percentage (0-100 validation)
   - "Submit" and "Cancel" buttons
   - Use React Hook Form + Zod validation

4. **Decline Confirmation:**
   - AlertDialog opens on "Decline" click
   - Textarea for decline reason (required)
   - Warning text: "This action cannot be undone"
   - "Confirm Decline" (destructive) and "Cancel" buttons

5. **Status Badge:**
   - Show current status at top: pending/approved/declined/changes_requested
   - Color-coded badge (gray/green/red/yellow)

**Testing Requirements:**
- Render all three action buttons for pending status
- Disable buttons for non-pending status
- Request Changes modal validation (min 10 chars)
- Decline confirmation dialog
- Calculate expected payment correctly (with/without manager commission)
- Display split types correctly (percentage vs flat fee)

---

## Task 2: Implement DealNegotiationHistory Component

**Priority:** P2 - HIGH (important for transparency and audit trail)

**File:** `src/components/event-management/DealNegotiationHistory.tsx`

**Purpose:** Show timeline of deal term changes, approval actions, and edit history

**Props Interface:**
```typescript
interface DealNegotiationHistoryProps {
  dealParticipants: Array<{
    id: string;
    version: number;
    split_percentage: number;
    flat_fee_amount?: number;
    approval_status: string;
    approved_at?: string;
    edit_notes?: string;
    edited_by?: string;
    edited_at?: string;
    participant: {
      name: string;
      email: string;
    };
  }>;
}
```

**Requirements:**

1. **Timeline Layout:**
   - Use Accordion component (shadcn/ui)
   - One accordion item per version (collapsed by default)
   - Trigger shows: "Version X - [status] - [date]"
   - Most recent version expanded by default

2. **Version Details:**
   - Show version number prominently
   - Display participant name and split terms
   - Show approval status badge
   - If edited: Show "Edited by [name] on [date]"
   - If edit notes exist: Display in info box
   - If approved/declined: Show timestamp and action

3. **Empty State:**
   - If no history: Show message "No changes yet"

4. **Formatting:**
   - Dates: Use `format(new Date(timestamp), 'MMM d, yyyy h:mm a')` from date-fns
   - Split display: "X%" or "$X"
   - Status colors: pending (gray), approved (green), declined (red), changes_requested (yellow)

**Testing Requirements:**
- Render multiple versions correctly
- Display edit notes when present
- Format dates properly
- Show empty state when no history
- Most recent version expanded by default

---

## Task 3: Implement ConfirmationStatusBadge Component

**Priority:** P2 - HIGH (consolidates duplicated badge logic)

**File:** `src/components/event-management/ConfirmationStatusBadge.tsx`

**Purpose:** Reusable badge component for confirmation statuses with optional countdown

**Props Interface:**
```typescript
interface ConfirmationStatusBadgeProps {
  status: 'confirmed' | 'pending' | 'declined' | 'expired' | 'unfilled';
  deadline?: string; // ISO timestamp
  showCountdown?: boolean;
  size?: 'sm' | 'md' | 'lg';
}
```

**Requirements:**

1. **Badge Styling:**
   - Use shadcn Badge component
   - Status colors:
     - confirmed: green (bg-green-100 text-green-800)
     - pending: yellow (bg-yellow-100 text-yellow-800)
     - declined: red (bg-red-100 text-red-800)
     - expired: gray (bg-gray-100 text-gray-800)
     - unfilled: slate (bg-slate-100 text-slate-800)

2. **Icon Display:**
   - confirmed: CheckCircle2 icon
   - pending: Clock icon
   - declined: XCircle icon
   - expired: AlertCircle icon
   - unfilled: User icon
   - Icons from lucide-react

3. **Countdown Timer:**
   - If `showCountdown` true and `deadline` provided:
   - Calculate time remaining until deadline
   - Display format: "2d 5h" or "5h 30m" or "30m"
   - Update every minute (use setInterval)
   - Show countdown only for pending status
   - If expired: automatically show "expired" status

4. **Size Variants:**
   - sm: text-xs px-2 py-0.5
   - md: text-sm px-2.5 py-1 (default)
   - lg: text-base px-3 py-1.5

**Testing Requirements:**
- Render correct icon for each status
- Apply correct colors for each status
- Calculate countdown correctly
- Handle expired deadline
- Size variants work
- Cleanup interval on unmount

---

## Task 4: Implement ManagerCommissionSelector Component

**Priority:** P3 - MEDIUM (enhances UX, logic exists in DealParticipantSelector)

**File:** `src/components/event-management/ManagerCommissionSelector.tsx`

**Purpose:** Reusable UI for selecting manager commission rate with validation

**Props Interface:**
```typescript
interface ManagerCommissionSelectorProps {
  defaultRate?: number; // 0-30, from manager profile
  amount: number; // Total amount to calculate commission from
  onSelect: (rate: number) => void;
  disabled?: boolean;
}
```

**Requirements:**

1. **Input Method:**
   - Use Slider component (shadcn/ui) for 0-30% range
   - Also provide Input field for precise entry
   - Sync slider and input values

2. **Display:**
   - Label: "Manager Commission Rate"
   - Show default rate if provided: "(Default: X%)"
   - Live preview: "Commission: $X.XX"
   - Live preview: "Your net: $Y.YY"

3. **Validation:**
   - Min: 0%
   - Max: 30%
   - Show error if outside range
   - Prevent non-numeric input

4. **Calculation:**
   - Commission amount: `amount * (rate / 100)`
   - Net amount: `amount - commission_amount`
   - Format as currency (2 decimal places)
   - Round to cents

5. **Styling:**
   - Use Card component for container
   - Info icon with tooltip: "Manager commission is 0-30% of your payment"
   - Preview text should update immediately on rate change

**Testing Requirements:**
- Slider and input stay in sync
- Validation prevents >30% or <0%
- Commission calculation accurate
- Net amount calculation accurate
- Default rate displayed correctly
- Currency formatting works

---

## Implementation Order

1. **Task 1: DealApprovalPanel** (8 hours) - CRITICAL
2. **Task 2: DealNegotiationHistory** (4 hours) - HIGH
3. **Task 3: ConfirmationStatusBadge** (2 hours) - HIGH
4. **Task 4: ManagerCommissionSelector** (3 hours) - MEDIUM

**Total Estimated Time:** 17 hours

---

## Testing Strategy

Each component should have:
1. **Unit tests** for rendering and user interactions
2. **Integration tests** with React Testing Library
3. **ThemeProvider wrapper** for component tests
4. **Mock data** for all props
5. **Edge case testing** (empty states, loading states, error states)

**Test file locations:**
- `tests/components/event-management/DealApprovalPanel.test.tsx`
- `tests/components/event-management/DealNegotiationHistory.test.tsx`
- `tests/components/event-management/ConfirmationStatusBadge.test.tsx`
- `tests/components/event-management/ManagerCommissionSelector.test.tsx`

---

## Verification Checklist

After implementation, verify:
- [ ] All 4 components exist in `src/components/event-management/`
- [ ] All components use TypeScript with proper interfaces
- [ ] All components use shadcn/ui + Tailwind CSS
- [ ] All components have container versions if needed
- [ ] All components have comprehensive tests
- [ ] Tests follow Phase 2 patterns (ThemeProvider wrapper, Supabase mocks)
- [ ] All tests passing (100%)
- [ ] Components integrated with existing pages/tabs
- [ ] TypeScript compilation passes
- [ ] ESLint passes

---

## Success Criteria

Phase 3 marked as **100% complete** when:
1. All 4 missing components implemented
2. All tests passing
3. Components integrated into deal workflow
4. Deal approval workflow functional end-to-end
5. No TypeScript errors
6. No ESLint errors

---

## Notes

- **Existing patterns**: Follow DealParticipantSelector and DealTermsConfigurator patterns from Phase 2
- **Styling**: Use existing component library (shadcn/ui, no custom CSS)
- **State management**: Use React Hook Form for forms, local state for UI
- **Data fetching**: Containers use TanStack Query hooks (if needed)
- **Validation**: Zod schemas for all forms
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
