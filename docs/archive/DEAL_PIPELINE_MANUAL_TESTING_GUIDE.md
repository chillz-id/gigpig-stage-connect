# Deal Pipeline Manual Testing Guide

**Status**: 🚀 Ready to Test
**Server**: Running on http://localhost:8080
**Date**: 2025-10-13

---

## Quick Start

✅ **Development server is RUNNING**
✅ **Database configured with 10 test deals**
✅ **RLS enabled and policies active**

### Access the Deal Pipeline

1. **Open Browser**: http://localhost:8080
2. **Log In**: Use an account with role: admin, agency_manager, promoter, or venue_manager
   - Test account: `info@standupsydney.com` (Stand Up Sydney Admin)
3. **Navigate**: Click **CRM** → **Active Deals** in sidebar
   - Or go directly to: http://localhost:8080/crm/deals

---

## What to Expect

### Pipeline Metrics (Top Cards)
- **Total Pipeline Value**: $5,950
- **Active Deals**: 10
- **High Priority**: 3 deals
- **Closing This Week**: 1 deal (Comedy Night - Chillz, deadline 2025-10-20)

### Kanban Board (6 Columns)

| Column | Expected Count | Deal Examples |
|--------|---------------|---------------|
| **Proposed** | 2 | Comedy Night - Chillz ($500), Thursday Headliner ($750) |
| **Negotiating** | 2 | Friday Laughs ($600), Management Deal ($850) |
| **Counter Offered** | 2 | Comedy Store Special ($450), New Year Show ($1,200) |
| **Accepted** | 2 | Weekend Showcase ($550), Holiday Special ($900) |
| **Declined** | 1 | Early Week Spot ($300) |
| **Expired** | 1 | Past Opportunity ($400) |

---

## Testing Checklist

### Phase 1: Visual Verification ✅

- [ ] **Page Loads Successfully**
  - No console errors
  - CRM layout renders with sidebar
  - "Deal Pipeline" header visible

- [ ] **Pipeline Metrics Display**
  - 4 metric cards render
  - Values match expected (Total: $5,950, Active: 10, etc.)
  - Icons and colors appropriate

- [ ] **Kanban Board Renders**
  - All 6 columns visible
  - Column headers labeled correctly
  - Deals appear in correct columns
  - 10 total deal cards visible

- [ ] **Deal Cards Show Correct Info**
  - Deal title
  - Artist name (Chillz Skinner or Comedian Test)
  - Promoter name (Stand Up Sydney Admin)
  - Proposed fee formatted as currency
  - Performance date formatted
  - Deal type badge (booking, management, etc.)
  - Deadline warnings (yellow/red for urgent)

### Phase 2: Filtering & Sorting ✅

- [ ] **Search Filter**
  - Type "Chillz" → 5 deals appear
  - Type "Comedy" → 7 deals appear
  - Type "New Year" → 1 deal appears
  - Clear search → All 10 deals return

- [ ] **Priority Filter**
  - Select "High Priority" → 3 deals appear
  - Select "Medium Priority" → 2 deals appear
  - Select "Low Priority" → 5 deals appear
  - Select "All Priorities" → All 10 deals return

- [ ] **Sort Options**
  - Sort by "Value (High to Low)" → New Year Show first ($1,200)
  - Sort by "Value (Low to High)" → Early Week Spot first ($300)
  - Sort by "Date (Newest First)" → Most recent at top
  - Sort by "Date (Oldest First)" → Oldest at top
  - Sort by "Recently Updated" → Latest updates first

- [ ] **Active Filter Pills**
  - Filter pills appear when filters applied
  - Click X on pill → Filter removes
  - "Clear all" button appears
  - Click "Clear all" → All filters reset

### Phase 3: Drag-and-Drop ✅

- [ ] **Visual Feedback During Drag**
  - Card opacity changes when dragging
  - Target column highlights
  - Cursor changes to grabbing

- [ ] **Status Update**
  - Drag "Comedy Night - Chillz" from Proposed to Negotiating
  - Toast notification appears: "Deal status updated"
  - Card moves to new column
  - Refresh page → Card stays in new column (database updated)

- [ ] **Rollback on Error**
  - Disconnect internet (simulate error)
  - Drag a card
  - Toast error notification appears
  - Card returns to original column

- [ ] **Multiple Drag Operations**
  - Drag 3-5 cards between columns
  - All moves complete successfully
  - No UI glitches or stuck cards

### Phase 4: Negotiation Modal ✅

- [ ] **Open Modal**
  - Click any deal card
  - Modal/Dialog opens
  - DealNegotiationEngine component renders
  - Deal info displays (title, artist, promoter, fee)

- [ ] **Negotiation Interface**
  - Message history visible (if messages exist)
  - Send message input field present
  - AI strategy panel visible (if enabled)
  - Action buttons present (Accept, Decline, Counter Offer)

- [ ] **Close Modal**
  - Click X or outside modal
  - Modal closes smoothly
  - Can reopen same deal
  - Can open different deal

### Phase 5: Deal Detail Page ✅

- [ ] **Navigate to Detail**
  - Click deal card title or "View Details" link
  - Navigate to `/crm/deals/{dealId}`
  - Detail page loads

- [ ] **Page Content**
  - Deal overview section visible
  - Artist info, promoter info, event info displayed
  - Performance date, duration, fee shown
  - Negotiation history timeline visible
  - DealNegotiationEngine embedded inline

- [ ] **Navigation**
  - "Back to Pipeline" button works
  - Returns to `/crm/deals`
  - Previous filters preserved (if implemented)

### Phase 6: Performance ✅

- [ ] **Page Load Time**
  - Initial page load < 3 seconds
  - Time to interactive < 3 seconds
  - No visible lag or jank

- [ ] **Drag-and-Drop Performance**
  - Drag response time < 100ms
  - Smooth animation
  - No dropped frames

- [ ] **Filter Performance**
  - Filter changes update < 200ms
  - Search input debounced
  - No lag when typing

- [ ] **Memory**
  - Check DevTools Memory tab
  - No significant memory leaks
  - Drag 20+ cards → Memory stable

### Phase 7: Responsive Design ✅

- [ ] **Desktop (1920x1080)**
  - All columns visible side-by-side
  - No horizontal scroll
  - Cards comfortably sized

- [ ] **Laptop (1366x768)**
  - Columns may compress slightly
  - Still usable without scroll
  - Text remains readable

- [ ] **Tablet (768px)**
  - Sidebar collapses or becomes hamburger menu
  - Kanban columns scroll horizontally
  - Touch targets adequate size

- [ ] **Mobile (375px)**
  - Sidebar hidden or drawer
  - Columns stack or horizontal scroll
  - Modal becomes full-screen
  - Text remains readable

### Phase 8: Error Handling ✅

- [ ] **No Data State**
  - (Skip for now - we have test data)

- [ ] **Loading State**
  - Refresh page
  - Loading spinner appears briefly
  - Smooth transition to data

- [ ] **Error State**
  - Disconnect internet
  - Refresh page
  - Error message appears
  - Retry button works

- [ ] **Authentication**
  - Log out
  - Try to access `/crm/deals`
  - Redirects to login
  - After login → Returns to deals page

---

## Browser Compatibility

Test in multiple browsers:

- [ ] **Chrome/Edge** (Chromium)
  - All features work
  - Drag-and-drop smooth

- [ ] **Firefox**
  - All features work
  - Drag-and-drop smooth

- [ ] **Safari** (if available)
  - All features work
  - Check for any WebKit-specific issues

---

## Known Issues to Ignore

These are documented limitations (not bugs):

1. **Drag-and-drop on mobile**: Not implemented (desktop-only feature)
2. **No pagination**: All deals load at once (acceptable for <100 deals)
3. **No keyboard shortcuts**: Not yet implemented
4. **"New Deal" button**: Handler not implemented (deferred to Phase 7)

---

## Bug Report Template

If you find issues, document them with this format:

```
### Issue: [Short description]

**Severity**: Critical / High / Medium / Low
**Browser**: Chrome 131 / Firefox 132 / Safari 18
**Steps to Reproduce**:
1. Navigate to /crm/deals
2. Click [specific action]
3. Observe [specific behavior]

**Expected**: [What should happen]
**Actual**: [What actually happened]
**Console Errors**: [Copy any error messages]
**Screenshots**: [Attach if relevant]
```

---

## Testing Tips

1. **Open DevTools**: Press F12 to monitor console for errors
2. **Check Network Tab**: Verify API calls succeed (200 status)
3. **Use React DevTools**: Inspect component state and props
4. **Test Edge Cases**: Try empty searches, extreme values, rapid clicking
5. **Test Keyboard Navigation**: Tab through elements, press Enter/Space
6. **Test with Slow 3G**: DevTools → Network → Throttling

---

## Success Criteria

The deal pipeline is ready for production when:

- ✅ All Phase 1-5 tests pass
- ✅ No critical bugs found
- ✅ Performance benchmarks met (Phase 6)
- ✅ Works on desktop and tablet (Phase 7)
- ✅ Error handling works (Phase 8)

---

## Quick Test Script (5 minutes)

If you only have 5 minutes, do this:

1. Navigate to http://localhost:8080/crm/deals
2. Verify 10 deals appear in 6 columns
3. Search for "Chillz" → Should show 5 deals
4. Drag one deal from Proposed to Negotiating
5. Verify toast appears and card moves
6. Click a deal card → Modal opens
7. Close modal → Works smoothly
8. Navigate to detail page → Click card title
9. Back to pipeline → Click back button
10. Check console → No errors

**If all 10 steps pass**: System is working! ✅

---

## Next Steps After Testing

1. **Document Results**: Note any bugs or issues
2. **Update Progress**: Mark manual testing complete in checklist
3. **Performance Testing**: If manual tests pass, test with 50+ deals
4. **Accessibility Audit**: Test keyboard navigation, screen readers
5. **Mobile Testing**: Test on actual mobile devices
6. **Unit Tests**: Write tests for critical functionality

---

**Server Status**: ✅ Running on http://localhost:8080
**Test Data**: ✅ 10 deals ready
**Documentation**: ✅ Complete

**Ready to test!** 🚀

**Last Updated**: 2025-10-13
