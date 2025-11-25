# Manual Testing Checklist: Comedian Lite Profile Page

**Date Created**: 2025-11-10
**Last Updated**: 2025-11-10
**Tested By**: ________________
**Date Tested**: ________________
**Build/Version**: ________________

## Prerequisites

- [ ] Test account with `comedian_lite` role created
- [ ] Test account has verified email
- [ ] Browser DevTools open (Network tab, Console tab)
- [ ] Screenshots prepared for bug reports (if needed)

## Test Environment

- **Environment**: [ ] Local Dev | [ ] Staging | [ ] Production
- **Browser**: ________________ (version: ________)
- **OS**: ________________
- **Screen Resolution**: ________________
- **Device**: [ ] Desktop | [ ] Tablet | [ ] Mobile

---

## Profile Page Access

### Basic Navigation

- [ ] Navigate to `/profile` - page loads without errors
- [ ] Page displays within 3 seconds
- [ ] No console errors in DevTools
- [ ] Profile header renders correctly
- [ ] All tabs are visible (Profile, Calendar, Invoices, Vouches, Settings)

### URL Handling

- [ ] Direct URL access to `/profile` works
- [ ] Direct URL access to `/profile?tab=calendar` works and opens Calendar tab
- [ ] Direct URL access to `/profile?tab=vouches` works and opens Vouches tab
- [ ] Direct URL access to `/profile?tab=settings` works and opens Settings tab
- [ ] Invalid tab parameter (e.g., `/profile?tab=invalid`) defaults to Profile tab
- [ ] URL updates when switching tabs
- [ ] Browser back button works correctly between tabs

---

## Profile Tabs

### Tab Visibility and Count

- [ ] Exactly 5 tabs visible: Profile, Calendar, Invoices, Vouches, Settings
- [ ] No "Tickets" tab visible (comedian_lite is industry user)
- [ ] All tab labels are readable
- [ ] Tab icons display correctly

### Tab Interaction

- [ ] Click Profile tab - content loads
- [ ] Click Calendar tab - content loads
- [ ] Click Invoices tab - **DOES NOT navigate** (tab is disabled)
- [ ] Click Vouches tab - content loads
- [ ] Click Settings tab - content loads
- [ ] Active tab has visual indication (highlighted/different color)
- [ ] Tab transitions are smooth (no flicker)

### Keyboard Navigation

- [ ] Press Tab key - focus moves to first tab
- [ ] Press Arrow Right - focus moves to next tab
- [ ] Press Arrow Left - focus moves to previous tab
- [ ] Press Enter on focused tab - activates that tab
- [ ] Tab order is logical (Profile → Calendar → Invoices → Vouches → Settings)
- [ ] Disabled Invoices tab can be focused but not activated

---

## Invoices Tab - Coming Soon State (CRITICAL FOR COMEDIAN_LITE)

### Visual State

- [ ] Invoices tab shows "(Coming Soon)" label
- [ ] Invoices tab appears grayed out / disabled
- [ ] Invoices tab has reduced opacity compared to other tabs
- [ ] Tab cursor changes to "not-allowed" on hover

### Interaction

- [ ] **CRITICAL**: Clicking Invoices tab does NOT navigate
- [ ] **CRITICAL**: Invoices tab cannot be activated
- [ ] Keyboard navigation skips activating Invoices tab (but can focus on it)

### Coming Soon Content (if accessed via URL)

- [ ] Navigate to `/profile?tab=invoices`
- [ ] Coming soon card is displayed
- [ ] Card shows "Invoices - Coming Soon" title
- [ ] Card shows explanation: "Invoice management will be available once the system is complete"
- [ ] Card lists future features:
  - Generate professional invoices for your gigs
  - Track payments and outstanding amounts
  - Sync with Xero accounting software
  - View detailed payment history
- [ ] Card shows "Check back soon" message
- [ ] Card has professional styling matching the theme

### Regular Comedian Comparison (if possible)

If you have access to a regular `comedian` (not `comedian_lite`) account:

- [ ] Regular comedian can click Invoices tab
- [ ] Regular comedian sees InvoiceManagement component (not coming soon card)
- [ ] Regular comedian does NOT see "(Coming Soon)" label on Invoices tab

---

## Profile Tab Content

### ProfileInformation Component

- [ ] First Name field is visible and editable
- [ ] Last Name field is visible and editable
- [ ] Stage Name field is visible and editable (if applicable)
- [ ] Bio textarea is visible and editable
- [ ] Location field is visible and editable
- [ ] Years of experience field (if present) is editable
- [ ] Name display preference selector works (Real Name / Stage Name)
- [ ] Form has "Save" button
- [ ] Form has "Cancel" button (if applicable)

### ProfileInformation - Editing

- [ ] Edit First Name - changes are reflected
- [ ] Edit Last Name - changes are reflected
- [ ] Edit Bio with multiple lines - formatting preserved
- [ ] Edit Location - accepts various formats
- [ ] Required field validation works (try to save with empty First Name)
- [ ] Click "Save" - success message appears
- [ ] Page reload - changes persist

### ComedianMedia Component

- [ ] ComedianMedia section is visible
- [ ] Can upload photos (if implemented)
- [ ] Can upload videos (if implemented)
- [ ] Media displays correctly

### ContactInformation Component

- [ ] Email field is visible
- [ ] Phone field is visible (if applicable)
- [ ] Can edit contact information
- [ ] Email validation works (try invalid email format)

### FinancialInformation Component

- [ ] Financial information section is visible
- [ ] BSB field (if applicable)
- [ ] Account number field (if applicable)
- [ ] ABN field (if applicable)
- [ ] Can edit financial information
- [ ] Sensitive data is handled securely (password fields masked, etc.)

### Social Media Links

- [ ] Instagram URL field
- [ ] Twitter URL field
- [ ] YouTube URL field
- [ ] Facebook URL field
- [ ] TikTok URL field
- [ ] Website URL field
- [ ] Can save social media links
- [ ] Invalid URL format shows validation error

---

## Calendar Tab Content

### ProfileCalendarView Component

- [ ] Calendar renders correctly
- [ ] Current month is displayed
- [ ] Can navigate to next month
- [ ] Can navigate to previous month
- [ ] Dates are clickable
- [ ] Events are displayed (if any)
- [ ] No console errors

---

## Vouches Tab Content

### Give a Vouch Section

- [ ] "Give a Vouch" card is visible
- [ ] User search/selector is present
- [ ] Vouch message field is present
- [ ] Can select a user to vouch for
- [ ] Can write vouch message
- [ ] "Submit" or "Give Vouch" button is present
- [ ] Submitting vouch shows success message

### Vouch History Section

- [ ] "Vouch History" card is visible
- [ ] Two sub-tabs: "Received" and "Given"
- [ ] Click "Received" tab - shows vouches received
- [ ] Click "Given" tab - shows vouches given
- [ ] Each vouch shows: name, message, date
- [ ] Empty state message if no vouches
- [ ] Can toggle between Received and Given

---

## Settings Tab Content

### AccountSettings Component (NOT MemberAccountSettings)

- [ ] **CRITICAL**: Comedian_lite sees AccountSettings (industry user settings)
- [ ] **CRITICAL**: Does NOT see MemberAccountSettings (member-specific settings)
- [ ] Settings form renders
- [ ] Can change account settings
- [ ] Can save settings changes
- [ ] Settings changes persist after reload

---

## Profile Header

### Avatar/Profile Picture

- [ ] Avatar displays (or placeholder if not set)
- [ ] Avatar is clickable to upload new image
- [ ] Click avatar - image upload dialog appears
- [ ] Can select image file
- [ ] Image crop modal appears
- [ ] Can crop image
- [ ] Can save cropped image
- [ ] New avatar displays immediately after save
- [ ] Avatar updates across entire app (check sidebar, header)

### Profile Information Display

- [ ] Name displays correctly (respects name display preference)
- [ ] Role displays as "Comedian" (not "Comedian Lite")
- [ ] Verification badge (if verified)
- [ ] Member since date
- [ ] Location (if set)
- [ ] Shows performed count (if applicable)

### Logout Button

- [ ] Logout button is visible
- [ ] Click logout - confirmation dialog (if applicable)
- [ ] Logout - redirects to home page
- [ ] Logout - clears auth state
- [ ] Logout - success message appears

---

## Responsive Design

### Desktop (1920x1080)

- [ ] All tabs visible in single row
- [ ] Profile content uses full width appropriately
- [ ] Forms are readable and well-spaced
- [ ] No horizontal scrolling

### Tablet (768x1024)

- [ ] Tabs still visible (may wrap or shrink)
- [ ] Content adapts to narrower width
- [ ] Forms remain usable
- [ ] Images scale appropriately

### Mobile (375x667)

- [ ] Tab labels may show icons only or abbreviations
- [ ] Content stacks vertically
- [ ] Forms are still editable
- [ ] No elements cut off
- [ ] Touch targets are large enough (minimum 44x44px)

---

## Performance

### Load Times

- [ ] Initial page load < 3 seconds
- [ ] Tab switching < 500ms
- [ ] Form submission < 2 seconds
- [ ] Image upload < 5 seconds (depends on file size)

### Network

- [ ] Check Network tab - no failed requests (all 2xx status codes)
- [ ] No repeated/unnecessary API calls
- [ ] No infinite loops (check network tab for repeated calls)

---

## Error Handling

### Form Validation Errors

- [ ] Required field errors display clearly
- [ ] Invalid email format shows error
- [ ] Error messages are user-friendly
- [ ] Can correct errors and resubmit

### Network Errors

- [ ] Simulate network offline - error message appears
- [ ] Simulate slow network - loading indicators show
- [ ] Failed save attempts show error toast
- [ ] Can retry after network error

### Edge Cases

- [ ] Very long bio text (500+ characters) - handles gracefully
- [ ] Special characters in fields - saved correctly
- [ ] Emoji in bio/name - rendered correctly
- [ ] Multiple rapid tab switches - no crashes
- [ ] Spam clicking Save button - only saves once

---

## Browser Compatibility

Test in each browser:

### Chrome/Edge

- [ ] All features work
- [ ] No visual glitches
- [ ] No console errors

### Firefox

- [ ] All features work
- [ ] No visual glitches
- [ ] No console errors

### Safari (if available)

- [ ] All features work
- [ ] No visual glitches
- [ ] No console errors

---

## Accessibility

### Screen Reader

- [ ] Tab labels are announced correctly
- [ ] Active tab is announced
- [ ] Form fields have proper labels
- [ ] Error messages are announced
- [ ] Success messages are announced

### Keyboard Only

- [ ] Can navigate entire page with keyboard
- [ ] All interactive elements reachable via Tab key
- [ ] Can activate buttons with Enter/Space
- [ ] Focus indicators are visible
- [ ] No keyboard traps

### Color Contrast

- [ ] Text meets WCAG AA contrast ratio (4.5:1 for normal text)
- [ ] Disabled Invoices tab is still readable
- [ ] Error messages have sufficient contrast
- [ ] Links are distinguishable from text

---

## Security

### Data Privacy

- [ ] Sensitive data (financial info) is masked or hidden appropriately
- [ ] No sensitive data visible in URL parameters
- [ ] No sensitive data in browser console logs
- [ ] Session timeout works (test by leaving idle for 15+ minutes)

### Authorization

- [ ] Cannot access admin routes (try `/admin`)
- [ ] Cannot access CRM routes (try `/crm`)
- [ ] Cannot access promoter-only features
- [ ] If logged out, redirects to auth page

---

## Bugs and Issues Found

| # | Severity | Component | Description | Steps to Reproduce | Expected | Actual | Screenshot |
|---|----------|-----------|-------------|-------------------|----------|--------|------------|
| 1 |          |           |             |                   |          |        | [ ] Attached |
| 2 |          |           |             |                   |          |        | [ ] Attached |
| 3 |          |           |             |                   |          |        | [ ] Attached |

**Severity Levels**:
- **Critical**: Blocks core functionality (e.g., can't save profile, app crashes)
- **High**: Important feature broken (e.g., avatar upload fails)
- **Medium**: Minor feature broken (e.g., validation message unclear)
- **Low**: Cosmetic issue (e.g., slight misalignment)

---

## Overall Assessment

- [ ] All critical features work correctly
- [ ] No critical or high-severity bugs found
- [ ] Performance is acceptable
- [ ] User experience is good
- [ ] Ready for production

**Tester Signature**: ________________
**Date**: ________________

**Additional Notes**:

______________________________________________________________________

______________________________________________________________________

______________________________________________________________________
