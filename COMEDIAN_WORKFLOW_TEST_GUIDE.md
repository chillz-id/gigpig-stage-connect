# Comedian Workflow Manual Testing Guide

This guide provides step-by-step instructions to test the complete comedian workflow on the Stand Up Sydney platform.

## Prerequisites
- Platform running at http://localhost:8081 (or your deployment URL)
- Access to create new user accounts
- Browser with developer tools

## Test Scenarios

### 1. Comedian Sign Up ✅

**Steps:**
1. Navigate to `/auth`
2. Click "Sign up" tab
3. Enter email: `comedian.test@example.com` (use unique email)
4. Enter password: `TestPassword123!`
5. Select role: **Comedian**
6. Click "Sign up"

**Expected Result:**
- Redirects to `/dashboard`
- Success message appears
- User is logged in as comedian

**Verification:**
- Check URL is `/dashboard`
- Look for comedian role indicator in navigation/profile

---

### 2. Complete Comedian Profile 👤

**Steps:**
1. Navigate to `/profile`
2. Fill in required fields:
   - Full Name: "Test Comedian"
   - Stage Name: "The Test Comic"
   - Bio: "A hilarious comedian with years of experience"
   - Phone: "+61412345678"
3. Optional fields:
   - Location: "Sydney, NSW"
   - Website: "https://example.com"
   - Social media links
4. Click "Save" or "Update Profile"

**Expected Result:**
- Success toast: "Profile updated successfully"
- Fields retain entered values
- Profile picture upload works (if implemented)

---

### 3. Browse Available Shows 🎭

**Steps:**
1. Navigate to `/shows`
2. Wait for shows to load
3. Observe show cards displaying:
   - Event title
   - Date and time
   - Venue
   - Available spots
   - "Apply" button

**Expected Result:**
- Multiple show cards visible
- Shows are upcoming (not past dates)
- Apply buttons visible for available shows
- Show details are complete

**Filters to Test:**
- Date range filter
- Venue filter
- Search by show name

---

### 4. Apply for Shows 📋

**Steps:**
1. On `/shows` page, find a show with "Apply" button
2. Click "Apply" on first available show
3. If modal appears:
   - Add application notes: "I would love to perform!"
   - Select preferred spot type if asked
4. Submit application
5. Apply to 2-3 different shows

**Expected Result:**
- Success message: "Application submitted successfully"
- Apply button changes to "Applied" or is disabled
- Application appears in comedian's applications list

**Edge Cases:**
- Cannot apply to same show twice
- Cannot apply to past shows
- Cannot apply when spots are full

---

### 5. View Applied Shows 📂

**Steps:**
1. Navigate to `/applications` or `/dashboard`
2. Look for "My Applications" section
3. Filter by status: "Pending"

**Expected Result:**
- List shows all applications with status:
  - Show name
  - Date
  - Venue
  - Status: "Pending"
  - Applied date
- Can view application details
- Can withdraw application (if feature exists)

---

### 6. View Confirmed Shows ✅

**Steps:**
1. Navigate to `/profile` → "Gigs" tab
2. Or navigate to `/dashboard` → "Confirmed Shows"
3. Look for confirmed bookings

**Expected Result:**
- Shows list of confirmed performances
- Each show displays:
  - Event details
  - Performance time
  - Spot type (MC, Feature, etc.)
  - Venue information
- Download/sync calendar options visible

**Note:** New comedians won't have confirmed shows immediately. An admin/promoter must approve applications first.

---

### 7. Calendar Sync Features 📅

**Steps:**
1. Navigate to `/profile` → "Calendar" tab
2. Test Google Calendar:
   - Click "Connect Google Calendar"
   - Complete OAuth flow
   - Verify connection status
3. Test ICS Export:
   - Click "Download Calendar" or "Export to Calendar"
   - Save .ics file
   - Import to calendar app

**Expected Result:**
- Google Calendar: OAuth flow completes, shows "Connected"
- ICS Export: Downloads file with confirmed gigs
- Events contain:
  - Correct dates/times
  - Venue addresses
  - Event descriptions

---

### 8. Availability Management 📆

**Steps:**
1. Navigate to `/profile` → "Availability" tab
2. View availability calendar
3. Click dates to toggle availability
4. Set recurring unavailability (if feature exists)

**Expected Result:**
- Calendar shows current month
- Can toggle individual dates
- Unavailable dates are visually distinct
- Changes save automatically or with "Save" button

---

## Additional Tests

### Mobile Responsiveness 📱
- Test all above flows on mobile viewport (375px width)
- Verify navigation works (hamburger menu or dock)
- Forms are usable on mobile
- Cards stack properly

### Error Handling 🚨
- Try invalid form submissions
- Test with poor network connection
- Verify error messages are helpful

### Performance 🚀
- Page load times < 3 seconds
- Smooth scrolling and interactions
- Images load progressively

## Test Data Recording

Record results in this format:

```
Test: [Test Name]
Date: [Test Date]
Tester: [Your Name]
Result: PASS/FAIL
Notes: [Any issues or observations]
```

## Common Issues to Watch For

1. **Authentication Issues**
   - Session expiry handling
   - Role-based access control
   - Redirect loops

2. **Form Validation**
   - Required fields marked clearly
   - Error messages below fields
   - Success feedback

3. **Data Persistence**
   - Profile changes save correctly
   - Applications tracked properly
   - Calendar sync maintains data

4. **UI/UX Issues**
   - Loading states for async operations
   - Disabled states for unavailable actions
   - Clear navigation paths

## Reporting Issues

When reporting issues, include:
1. Steps to reproduce
2. Expected vs actual behavior
3. Screenshots if applicable
4. Browser console errors
5. Network tab errors (401, 500, etc.)

---

## Quick Checklist

- [ ] Can create comedian account
- [ ] Can complete profile
- [ ] Can view available shows
- [ ] Can apply to shows
- [ ] Can view applications
- [ ] Can see confirmed gigs
- [ ] Calendar sync works
- [ ] Mobile responsive
- [ ] Error handling works
- [ ] Performance acceptable

This completes the comedian workflow testing guide.