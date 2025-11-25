# Remove All `variant="outline"` Buttons Platform-Wide
Created: 2025-11-20
Status: In Progress

## Overview
Remove all white outline button variants from the platform per the design system documented in `/docs/Platform Performance & UI Consistency.md`.

**Documentation Reference (lines 32-43, 95):**
- "Replace all variant='outline' with custom dark background style"
- "Remove white borders: use border-border/50 instead"
- "No white button outlines anywhere"

## Scope
**45 instances across 30 files** need to be updated.

## Replacement Strategy

### Rule 1: Cancel/Close/Dismiss Buttons → `variant="ghost"`
These are secondary actions that dismiss or cancel:
- Cancel buttons in dialogs
- Close buttons in modals
- Dismiss buttons

### Rule 2: Alternative Actions → `variant="secondary"`
These are alternative primary actions:
- Filter toggles
- View mode switches
- Add/Create secondary options
- Edit/Manage buttons

### Rule 3: Context-Specific
Review each instance to determine appropriate variant based on button purpose.

## Files to Update (30 files, 45 instances)

### High Priority - User-Facing Features (18 files, 28 instances)

#### CRM & Organization (5 files, 5 instances)
1. **src/components/organization/OrganizationSettings.tsx** (1)
2. **src/components/organization/BusinessInformation.tsx** (1)
3. **src/components/organization/CompanyHighlightsManager.tsx** (1)
4. **src/components/organization/FinancialDetails.tsx** (1)
5. **src/components/ContactInformation.tsx** (5)

#### Calendar & Gigs (4 files, 8 instances)
6. **src/components/calendar/AddGigModal.tsx** (3)
7. **src/components/calendar/BlockDatesModal.tsx** (3)
8. **src/components/calendar/GigListView.tsx** (1)
9. **src/components/calendar/EventTypeFilter.tsx** (1)

#### Comedian Profile (7 files, 10 instances)
10. **src/components/comedian-profile/BookingInquiryModal.tsx** (1)
11. **src/components/comedian-profile/LinkSectionDialog.tsx** (1)
12. **src/components/comedian-profile/EditMediaTitleDialog.tsx** (1)
13. **src/components/comedian-profile/accomplishments/AccomplishmentDialog.tsx** (1)
14. **src/components/comedian-profile/accomplishments/PressReviewDialog.tsx** (1)
15. **src/components/comedian-profile/CustomLinksManager.tsx** (3)
16. **src/components/comedian-profile/media-layouts/MediaListLayout.tsx** (1)

#### Other User Features (2 files, 5 instances)
17. **src/components/EventBannerUpload.tsx** (2)
18. **src/components/comedian/EditGigDialog.tsx** (1)

### Medium Priority - Settings & Profile (5 files, 9 instances)
19. **src/pages/ProfileManagement.tsx** (1)
20. **src/components/AccountSettings.tsx** (2)
21. **src/components/profile/PressReviewsManager.tsx** (1)
22. **src/components/profile/CareerHighlightsManager.tsx** (1)
23. **src/components/GiveVouchForm.tsx** (2)

### Standard Priority - Notifications & Pages (4 files, 5 instances)
24. **src/pages/Notifications.tsx** (2)
25. **src/pages/ABNChecker.tsx** (2)
26. **src/components/VouchCard.tsx** (1)
27. **src/components/VouchCardSimple.tsx** (1)

### Low Priority - Bug Reporting (3 files, 3 instances)
28. **src/components/bugs/ReportBugDialog.tsx** (1)
29. **src/components/bugs/BugDetailDialog.tsx** (1)
30. **src/components/bugs/BugCard.tsx** (1)

## Implementation Approach

### Option 1: Automated Find & Replace (Fastest)
Use bash script to replace all instances programmatically:
- Cancel/Close keywords → ghost
- Everything else → secondary
- Manual review after

### Option 2: Systematic Manual Review (Safest)
Review each file individually:
- Read context around each button
- Determine appropriate variant
- Apply change with verification

### Option 3: Hybrid Approach (Recommended)
1. Auto-replace obvious patterns (Cancel, Close)
2. Manual review of action buttons
3. Test critical user flows

## Testing Checklist
After replacement, verify:
- [ ] No visual regressions in dialogs
- [ ] Button hierarchy still clear (primary vs secondary actions)
- [ ] Cancel/Close buttons visually distinct but not harsh
- [ ] Filter toggles remain functional and styled correctly
- [ ] Modal footers maintain proper button spacing
- [ ] Mobile view buttons still readable

## Risk Assessment
**Low Risk** - Visual change only, no functionality impact
- Buttons remain clickable
- onClick handlers unchanged
- Only visual appearance affected

## Rollback Plan
If issues arise:
- Git revert commit
- variant="outline" patterns are easily searchable
- Changes are atomic per file

## Notes
- This aligns with existing cleanup in MediaLibraryManager.tsx
- Complements platform design system standardization
- Should be coordinated with any ongoing UI consistency work
- Consider updating Button component defaults if pattern persists
