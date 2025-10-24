# CRM Device QA Testing Checklist

**Last Updated**: 2025-10-15
**Status**: Ready for Testing
**Phase**: 7 - QA & Accessibility Validation
**Target Devices**: iOS (iPhone/iPad), Android (Phone/Tablet)

---

## Overview

This checklist covers manual device testing for the CRM interface across mobile and tablet devices. Physical device testing is required to validate touch interactions, gestures, and mobile-specific features that cannot be fully simulated in browser emulators.

## Test Devices

### Minimum Device Requirements

**iOS Devices**:
- iPhone 12 or later (iOS 15+)
- iPad Air or later (iPadOS 15+)
- Safari browser (required for iOS testing)

**Android Devices**:
- Samsung Galaxy S21 or later (Android 11+)
- Google Pixel 5 or later (Android 11+)
- Tablet: Samsung Galaxy Tab S7+ or similar (Android 11+)
- Chrome browser (primary), Samsung Internet (secondary)

### Viewport Testing Matrix

| Device Type | Orientation | Width | Height | Notes |
|-------------|-------------|--------|--------|-------|
| iPhone 14 Pro | Portrait | 393px | 852px | Primary mobile |
| iPhone 14 Pro | Landscape | 852px | 393px | Mobile landscape |
| iPad Pro 11" | Portrait | 834px | 1194px | Primary tablet |
| iPad Pro 11" | Landscape | 1194px | 834px | Tablet landscape |
| Galaxy S23 | Portrait | 360px | 780px | Android mobile |
| Galaxy Tab S8 | Portrait | 800px | 1280px | Android tablet |

---

## Pre-Testing Setup

### 1. Environment Preparation

- [ ] App deployed to staging environment accessible from mobile devices
- [ ] Staging URL: `https://staging.standupsy dney.com` (or appropriate test URL)
- [ ] Test user accounts created with different roles (comedian, promoter, admin)
- [ ] Sample data populated (customers, deals, tasks, events)
- [ ] SSL certificate valid (no security warnings)

### 2. Device Preparation

- [ ] Devices fully charged or connected to power
- [ ] OS updated to latest stable version
- [ ] Browsers updated to latest version
- [ ] Screen brightness set to 50-75% for consistent testing
- [ ] Do Not Disturb mode enabled to prevent interruptions
- [ ] Developer tools enabled (if needed for debugging)
- [ ] Clear browser cache and cookies before starting

### 3. Testing Tools

- [ ] Screen recording software enabled (iOS: native, Android: built-in recorder)
- [ ] Note-taking app ready for bug reports
- [ ] Camera ready for screenshots of visual issues
- [ ] Stopwatch or timer for performance testing

---

## Core Functional Testing

### Test 1: Authentication & Onboarding

**Objective**: Verify login flow and initial user experience

**Steps**:
1. [ ] Open staging URL in mobile browser
2. [ ] Tap "Sign In" button
3. [ ] Enter test credentials
4. [ ] Verify successful login and redirect to dashboard
5. [ ] Check for any layout issues on login screen
6. [ ] Test "Remember Me" checkbox functionality
7. [ ] Test password visibility toggle (eye icon)
8. [ ] Verify error messages display correctly on invalid credentials

**Pass Criteria**:
- All touch targets are at least 44x44px
- Text is readable without zooming
- No horizontal scrolling required
- Form inputs focus correctly and trigger appropriate keyboard
- Error messages are visible and readable

**Devices**: iPhone, iPad, Android Phone, Android Tablet

---

### Test 2: Navigation & Layout

**Objective**: Verify navigation system and responsive layout

**Steps**:
1. [ ] Test desktop sidebar on tablet (iPad landscape, Galaxy Tab landscape)
2. [ ] Verify sidebar collapses to mobile navigation on phone
3. [ ] Test bottom navigation on mobile (iPhone portrait, Galaxy S23 portrait)
4. [ ] Tap each navigation item and verify correct page loads
5. [ ] Verify active nav item is highlighted
6. [ ] Test sidebar toggle on tablet (Cmd+B equivalent gesture)
7. [ ] Rotate device and verify layout adapts correctly
8. [ ] Test navigation while scrolled down on page

**Pass Criteria**:
- Sidebar visible and functional on tablet landscape
- Bottom navigation appears on mobile (<768px viewport)
- Navigation items are large enough for easy tapping
- Active state is clearly visible
- Layout does not break during rotation
- No content hidden or inaccessible

**Devices**: All devices, both orientations

---

### Test 3: Deal Pipeline (Kanban Board)

**Objective**: Validate drag-and-drop and touch interactions on kanban board

#### 3.1 Mouse/Touch Drag-and-Drop

**Steps**:
1. [ ] Navigate to Deals page
2. [ ] Touch and hold a deal card
3. [ ] Drag card to adjacent column
4. [ ] Release to drop
5. [ ] Verify deal status updates and success toast appears
6. [ ] Test dragging to multiple columns (left to right, right to left)
7. [ ] Test dragging multiple deals in sequence
8. [ ] Verify visual feedback during drag (card opacity, column highlight)

**Pass Criteria**:
- Cards are draggable with natural touch gestures
- Drop zones are clearly indicated
- Status updates reflected immediately
- No jittery or laggy drag animation
- Toast notifications are readable and don't cover content

#### 3.2 Keyboard Navigation (On-Screen Keyboard + Bluetooth)

**Steps** (requires Bluetooth keyboard for iPad/tablet):
1. [ ] Connect Bluetooth keyboard to device
2. [ ] Focus on kanban board container
3. [ ] Use arrow keys to navigate between columns and deals
4. [ ] Press Space to select a deal (green ring appears)
5. [ ] Press Shift + Arrow Right to move deal to next column
6. [ ] Verify status updates and toast notification
7. [ ] Press Escape to deselect
8. [ ] Press Enter on a deal to open details modal

**Pass Criteria**:
- Focus indicators visible (blue ring for focus, green for selection)
- Arrow key navigation works smoothly
- Shift + Arrow moves deals between columns
- Screen reader announces status changes (if VoiceOver/TalkBack enabled)

**Devices**: iPhone (portrait), iPad (landscape), Android Phone, Android Tablet

---

### Test 4: Task Management (Kanban Board)

**Objective**: Validate task kanban interactions identical to deal pipeline

**Steps**:
1. [ ] Navigate to Tasks page
2. [ ] Test drag-and-drop of task cards across columns
3. [ ] Verify keyboard navigation (same as Deal Pipeline Test 3.2)
4. [ ] Test swipe gestures on task cards (if implemented)
5. [ ] Verify task status updates reflect immediately
6. [ ] Test filtering tasks by assignee or due date

**Pass Criteria**:
- Same as Deal Pipeline test
- Task-specific features work correctly (assignee, due date)

**Devices**: iPhone, iPad, Android Phone, Android Tablet

---

### Test 5: Customers & Relationships

**Objective**: Validate customer list, profiles, and relationship management

**Steps**:
1. [ ] Navigate to Customers page
2. [ ] Scroll through customer list smoothly
3. [ ] Tap on a customer to open profile
4. [ ] Verify profile loads without layout shift
5. [ ] Test swipe-to-reveal actions on customer cards (if implemented)
6. [ ] Add a new customer using mobile form
7. [ ] Verify all form fields accessible and keyboard appears correctly
8. [ ] Test date picker on mobile (if applicable)
9. [ ] Verify customer avatar/photo displays correctly

**Pass Criteria**:
- Smooth 60fps scrolling on customer list
- Profile modal opens without delay
- Forms are usable without horizontal scrolling
- Native date/time pickers appear on mobile
- Touch targets are appropriately sized

**Devices**: All devices, both orientations

---

### Test 6: Analytics Dashboard

**Objective**: Validate data visualization and responsive charts

**Steps**:
1. [ ] Navigate to Analytics page
2. [ ] Verify all charts render correctly on mobile
3. [ ] Test chart interactions (tap on data points, legends)
4. [ ] Verify responsive behavior of chart containers
5. [ ] Test date range selector on mobile
6. [ ] Scroll through dashboard and verify no layout breaks
7. [ ] Rotate device and verify charts re-render correctly

**Pass Criteria**:
- Charts are readable on small screens
- Interactive elements respond to touch
- No charts overflow viewport
- Data labels are readable without zooming
- Performance is acceptable (no lag when loading charts)

**Devices**: iPhone (portrait), iPad (landscape), Android Phone

---

## Accessibility Testing

### Test 7: Screen Reader Support

**Objective**: Validate VoiceOver (iOS) and TalkBack (Android) compatibility

#### iOS VoiceOver Test

**Setup**:
1. [ ] Enable VoiceOver: Settings → Accessibility → VoiceOver → On
2. [ ] Learn basic VoiceOver gestures:
   - One-finger swipe right/left: Navigate elements
   - Double-tap: Activate element
   - Two-finger swipe up: Read from current position

**Steps**:
1. [ ] Navigate to CRM dashboard with VoiceOver enabled
2. [ ] Swipe through navigation items and verify labels are announced
3. [ ] Navigate to Deal Pipeline
4. [ ] Verify kanban board role and usage instructions announced
5. [ ] Verify deal cards announced with title and status
6. [ ] Test keyboard movement with VoiceOver (if Bluetooth keyboard available)
7. [ ] Verify status change announcements via ARIA live region
8. [ ] Test form inputs with VoiceOver and verify labels announced

**Pass Criteria**:
- All interactive elements have meaningful labels
- Headings and landmarks are properly announced
- Form fields announce labels and current values
- Status changes are announced dynamically
- No "unlabeled button" or "clickable" generic announcements

**Devices**: iPhone, iPad

#### Android TalkBack Test

**Setup**:
1. [ ] Enable TalkBack: Settings → Accessibility → TalkBack → On
2. [ ] Learn basic TalkBack gestures:
   - One-finger swipe right/left: Navigate elements
   - Double-tap: Activate element
   - Swipe down then right: Global context menu

**Steps**:
1. [ ] Repeat all VoiceOver test steps with TalkBack
2. [ ] Verify touch exploration works (move finger to hear elements)
3. [ ] Test TalkBack with keyboard navigation
4. [ ] Verify ARIA live region announcements

**Pass Criteria**:
- Same as VoiceOver test
- TalkBack-specific features work correctly

**Devices**: Android Phone, Android Tablet

---

### Test 8: Touch Accessibility

**Objective**: Validate touch target sizes and gesture support

**Steps**:
1. [ ] Measure touch targets using developer tools or visual inspection
2. [ ] Verify all buttons, links, and interactive elements are ≥44x44px
3. [ ] Test touch targets with finger (not stylus) to ensure comfortable tapping
4. [ ] Test swipe gestures on customer/task/contact cards
5. [ ] Verify no accidental activations when scrolling near interactive elements
6. [ ] Test with one-handed use (reaching top navigation, bottom tabs)

**Pass Criteria**:
- All touch targets meet 44x44px minimum
- Adequate spacing between adjacent interactive elements (≥8px)
- Swipe gestures are discoverable and responsive
- No accidental taps during scrolling

**Devices**: All devices

---

### Test 9: Visual Accessibility

**Objective**: Validate focus indicators, contrast, and zoom support

**Steps**:
1. [ ] Enable "Reduce Motion" in device settings
2. [ ] Verify animations are reduced or removed
3. [ ] Test 200% zoom (iOS: Settings → Display & Brightness → View → Zoomed)
4. [ ] Verify all content remains accessible at 200% zoom
5. [ ] Test dark mode toggle
6. [ ] Verify color contrast meets WCAG AA in both light and dark modes
7. [ ] Test focus indicators visible in all themes

**Pass Criteria**:
- Animations respect "Reduce Motion" preference
- Content readable and functional at 200% zoom
- No horizontal scrolling required at 200% zoom
- Dark mode contrast meets WCAG AA (4.5:1 for normal text)
- Focus indicators visible in all color schemes

**Devices**: iPhone, iPad

---

## Performance Testing

### Test 10: Loading & Rendering Performance

**Objective**: Validate acceptable load times and rendering performance

**Steps**:
1. [ ] Clear browser cache
2. [ ] Navigate to CRM dashboard
3. [ ] Measure time to interactive (TTI) using browser dev tools or stopwatch
4. [ ] Navigate to Deal Pipeline (largest page)
5. [ ] Measure page load time
6. [ ] Test smooth scrolling on customer list (60fps)
7. [ ] Drag multiple deals and verify no frame drops
8. [ ] Monitor memory usage (iOS: Xcode Instruments, Android: Chrome DevTools)

**Pass Criteria**:
- Dashboard TTI < 3 seconds on 4G connection
- Deal Pipeline loads in < 4 seconds
- Scrolling maintains 60fps
- No memory leaks after 5 minutes of interaction
- App remains responsive during background tab switch

**Devices**: All devices (test on 4G cellular, not WiFi)

---

### Test 11: Offline Behavior (PWA)

**Objective**: Validate offline functionality and service worker

**Steps**:
1. [ ] Load CRM app while online
2. [ ] Enable airplane mode on device
3. [ ] Navigate between pages
4. [ ] Verify offline indicator appears
5. [ ] Attempt to perform actions (create deal, update task)
6. [ ] Verify appropriate error messages
7. [ ] Re-enable network connection
8. [ ] Verify app syncs changes (if offline queue implemented)

**Pass Criteria**:
- Offline indicator displays prominently
- Cached pages load instantly while offline
- Error messages are clear and actionable
- App doesn't crash when offline
- Data syncs correctly when connection restored

**Devices**: iPhone, Android Phone

---

## Edge Cases & Error Handling

### Test 12: Network Interruption

**Objective**: Validate behavior during network disruptions

**Steps**:
1. [ ] Start dragging a deal card
2. [ ] Enable airplane mode mid-drag
3. [ ] Drop the card
4. [ ] Verify error message appears
5. [ ] Verify card returns to original position
6. [ ] Re-enable network
7. [ ] Verify app recovers gracefully

**Pass Criteria**:
- Error messages are user-friendly
- No data loss
- App recovers without requiring reload
- Toast notifications explain the issue

---

### Test 13: Low Battery Mode

**Objective**: Validate behavior under power-saving constraints

**Steps** (iOS: Settings → Battery → Low Power Mode):
1. [ ] Enable Low Power Mode
2. [ ] Test app functionality
3. [ ] Verify animations still work (may be slower)
4. [ ] Test drag-and-drop performance
5. [ ] Verify background sync still works

**Pass Criteria**:
- App remains functional in Low Power Mode
- Animations may be reduced but don't break interactions
- No crashes or freezes

**Devices**: iPhone, iPad

---

### Test 14: Multitasking

**Objective**: Validate app behavior during multitasking

**Steps**:
1. [ ] Open CRM app
2. [ ] Switch to another app
3. [ ] Return to CRM app
4. [ ] Verify state is preserved (no unexpected reloads)
5. [ ] Test split-screen mode on iPad/Android tablet
6. [ ] Verify layout adapts correctly

**Pass Criteria**:
- App state is preserved when returning from background
- Split-screen layout is usable
- No memory warnings or crashes

**Devices**: iPad, Android Tablet

---

## Bug Reporting Template

When issues are found, report using this template:

```markdown
**Bug #**: [Auto-increment]
**Severity**: Critical | High | Medium | Low
**Device**: iPhone 14 Pro | iPad Air | Galaxy S23 | etc.
**OS Version**: iOS 16.2 | Android 13 | etc.
**Browser**: Safari 16.2 | Chrome 110 | etc.
**Orientation**: Portrait | Landscape
**Network**: WiFi | 4G | 5G | Offline

**Steps to Reproduce**:
1.
2.
3.

**Expected Behavior**:


**Actual Behavior**:


**Screenshots**: [Attach images]
**Screen Recording**: [Attach video if available]

**Workaround**: [If known]

**Additional Context**:
- Reproducible: Always | Sometimes | Rarely
- Affects all users: Yes | No | Unknown
```

---

## Test Execution Tracking

### Test Session Log

| Test # | Test Name | Device | Status | Date | Tester | Notes |
|--------|-----------|--------|--------|------|--------|-------|
| 1 | Authentication | iPhone 14 Pro | ⏳ | | | |
| 1 | Authentication | iPad Air | ⏳ | | | |
| 2 | Navigation | iPhone 14 Pro | ⏳ | | | |
| 2 | Navigation | Galaxy S23 | ⏳ | | | |
| 3.1 | Deal Pipeline Drag | iPhone 14 Pro | ⏳ | | | |
| 3.2 | Deal Keyboard Nav | iPad Air + Keyboard | ⏳ | | | |
| 4 | Task Management | All devices | ⏳ | | | |
| 5 | Customers | All devices | ⏳ | | | |
| 6 | Analytics | iPhone + iPad | ⏳ | | | |
| 7 | VoiceOver | iPhone + iPad | ⏳ | | | |
| 7 | TalkBack | Galaxy S23 | ⏳ | | | |
| 8 | Touch Accessibility | All devices | ⏳ | | | |
| 9 | Visual Accessibility | iPhone + iPad | ⏳ | | | |
| 10 | Performance | All devices | ⏳ | | | |
| 11 | Offline (PWA) | iPhone + Galaxy | ⏳ | | | |
| 12 | Network Interruption | All devices | ⏳ | | | |
| 13 | Low Battery Mode | iPhone + iPad | ⏳ | | | |
| 14 | Multitasking | iPad + Galaxy Tab | ⏳ | | | |

**Legend**: ⏳ Pending | ✅ Pass | ❌ Fail | ⚠️ Pass with issues | 🔄 Retest

---

## Pass/Fail Criteria

### Minimum Acceptance Criteria

- [ ] **Zero Critical Bugs**: No crashes, data loss, or security issues
- [ ] **<5 High Severity Bugs**: Major functional issues that block workflows
- [ ] **90%+ Tests Passing**: On iOS devices
- [ ] **90%+ Tests Passing**: On Android devices
- [ ] **Accessibility**: VoiceOver and TalkBack tests pass
- [ ] **Performance**: All pages load in <4 seconds on 4G
- [ ] **Touch Targets**: 100% of interactive elements meet 44x44px minimum

### Recommended Criteria

- [ ] **Zero High Severity Bugs**: All major workflows function correctly
- [ ] **95%+ Tests Passing**: Across all devices
- [ ] **Performance**: All pages load in <3 seconds on 4G
- [ ] **60fps**: Smooth scrolling and animations on all devices
- [ ] **Offline**: Basic functionality available offline

---

## Post-Testing Actions

### 1. Bug Triage

- [ ] Categorize all bugs by severity
- [ ] Assign priorities for fixes
- [ ] Create GitHub issues for each bug
- [ ] Link issues to Phase 7 milestone

### 2. Fixes & Retesting

- [ ] Fix critical bugs immediately
- [ ] Fix high severity bugs before Phase 7 completion
- [ ] Retest all failed test cases after fixes
- [ ] Verify regressions haven't occurred

### 3. Documentation

- [ ] Update accessibility checklist with test results
- [ ] Document known issues and workarounds
- [ ] Update user documentation if needed
- [ ] Archive test session logs and screenshots

---

## Resources

- [iOS VoiceOver Gestures](https://support.apple.com/guide/iphone/learn-voiceover-gestures-iph3e2e2281/ios)
- [Android TalkBack Gestures](https://support.google.com/accessibility/android/answer/6151827)
- [WCAG 2.1 Mobile Accessibility](https://www.w3.org/WAI/standards-guidelines/mobile/)
- [Touch Target Size Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [Chrome DevTools Mobile Testing](https://developer.chrome.com/docs/devtools/device-mode/)

---

## Contact

For questions or issues during QA testing:
- Create issues with label `qa` and `device-testing`
- Include device details and reproduction steps
- Tag with `crm` and `phase-7` labels
