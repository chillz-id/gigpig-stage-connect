# Stand Up Sydney - Manual Testing Checklist

## Pre-Testing Setup

1. **Environment Check**
   - [ ] Development server running on http://localhost:8081
   - [ ] Supabase connection active
   - [ ] No console errors on initial load

## 1. Authentication & Onboarding Flow

### 1.1 Sign Up - New Comedian
- [ ] Navigate to /auth
- [ ] Click "Sign up" tab
- [ ] Enter test email: `comedian.test.{timestamp}@example.com`
- [ ] Enter password (min 6 characters)
- [ ] Select "Comedian" role checkbox
- [ ] Click "Sign up"
- [ ] **Expected**: Redirect to dashboard/profile
- [ ] **Verify**: Profile created with comedian role
- [ ] **Verify**: Can see comedian-specific menu items

### 1.2 Sign Up - New Promoter
- [ ] Repeat above with promoter role
- [ ] **Expected**: Redirect to dashboard
- [ ] **Verify**: Can see promoter dashboard
- [ ] **Verify**: Can access event creation

### 1.3 Google OAuth Sign In
- [ ] Click "Continue with Google" button
- [ ] Complete Google authentication
- [ ] **Expected**: Auto-create profile
- [ ] **Verify**: Profile has Google account data

### 1.4 Sign Out/Sign In
- [ ] Click user menu/avatar
- [ ] Click "Sign out"
- [ ] **Expected**: Redirect to /auth
- [ ] Sign back in with email/password
- [ ] **Expected**: Return to dashboard

## 2. Comedian User Flow

### 2.1 Profile Completion
- [ ] Navigate to /profile
- [ ] Upload profile photo
- [ ] Add bio (test formatting)
- [ ] Add phone number
- [ ] Add social media links
- [ ] Click "Save"
- [ ] **Expected**: Success toast
- [ ] **Verify**: Data persists on refresh

### 2.2 Browse Events
- [ ] Navigate to /events
- [ ] **Verify**: Can see upcoming events
- [ ] **Verify**: Can filter by date/location
- [ ] Click on event for details
- [ ] **Expected**: See full event information

### 2.3 Apply to Event
- [ ] Find an open event
- [ ] Click "Apply" button
- [ ] Fill application form:
  - [ ] Availability confirmation
  - [ ] Performance preferences
  - [ ] Additional notes
- [ ] Submit application
- [ ] **Expected**: Success notification
- [ ] **Verify**: Application appears in "My Applications"

### 2.4 Spot Confirmation
- [ ] When accepted, check notifications
- [ ] Navigate to spot confirmation page
- [ ] Review event details
- [ ] Click "Confirm" or "Decline"
- [ ] **Expected**: Status updated
- [ ] **Verify**: Promoter notified

### 2.5 View Invoices
- [ ] Navigate to /invoices
- [ ] **Verify**: Can see comedian invoices
- [ ] Click invoice to view details
- [ ] **Expected**: Correct amounts and info

## 3. Promoter User Flow

### 3.1 Create Event
- [ ] Navigate to /events/new
- [ ] Fill event details:
  - [ ] Event name
  - [ ] Date and time
  - [ ] Venue details
  - [ ] Upload banner image
  - [ ] Description
  - [ ] Capacity
  - [ ] Application requirements
- [ ] Save as draft
- [ ] **Expected**: Event saved
- [ ] Publish event
- [ ] **Expected**: Event goes live

### 3.2 Event Templates
- [ ] Create event with template option
- [ ] Save as template
- [ ] **Verify**: Template includes banner
- [ ] Create new event from template
- [ ] **Expected**: All fields pre-filled

### 3.3 Manage Applications
- [ ] Navigate to event applications
- [ ] **Verify**: See all applications
- [ ] Review comedian profiles
- [ ] Accept/Reject applications
- [ ] **Expected**: Comedians notified
- [ ] **Verify**: Spot assignment works

### 3.4 Generate Invoices
- [ ] Navigate to /invoices
- [ ] Create new invoice
- [ ] Add line items
- [ ] Set tax treatment
- [ ] Add recipient details
- [ ] Preview invoice
- [ ] Send invoice
- [ ] **Expected**: Invoice created
- [ ] **Verify**: PDF generation works

## 4. Admin User Flow

### 4.1 User Management
- [ ] Navigate to /admin/users
- [ ] **Verify**: See all users
- [ ] Add new user with role
- [ ] Edit user details
- [ ] Change user roles
- [ ] **Expected**: Changes persist

### 4.2 System Overview
- [ ] Check admin dashboard
- [ ] **Verify**: Stats are accurate
- [ ] **Verify**: Recent activity shown

## 5. Critical Features Testing

### 5.1 Ticket Sync (Mock Mode)
- [ ] Navigate to event ticket sales
- [ ] Click "Sync Tickets"
- [ ] **Expected**: Mock data loads
- [ ] **Verify**: Sales data displays

### 5.2 PWA Features
- [ ] Install app on mobile
- [ ] Test offline mode
- [ ] **Verify**: Basic functionality works

### 5.3 Theme System
- [ ] **Verify**: Business theme active
- [ ] Check all pages use consistent theme
- [ ] No time-based theme switching

### 5.4 Search & Filters
- [ ] Test event search
- [ ] Test comedian search
- [ ] Test date filters
- [ ] **Expected**: Accurate results

## 6. Error Handling

### 6.1 Invalid Routes
- [ ] Navigate to /nonexistent
- [ ] **Expected**: 404 or redirect home

### 6.2 Network Errors
- [ ] Disable network briefly
- [ ] Try to submit form
- [ ] **Expected**: Error message
- [ ] **Verify**: No data loss

### 6.3 Validation
- [ ] Submit forms with invalid data
- [ ] **Expected**: Clear error messages
- [ ] **Verify**: No partial saves

## 7. Performance Checks

### 7.1 Page Load Times
- [ ] Homepage < 3 seconds
- [ ] Dashboard < 3 seconds
- [ ] Event list < 3 seconds

### 7.2 Image Loading
- [ ] Profile photos load quickly
- [ ] Event banners optimized
- [ ] Lazy loading works

## Test Results Summary

**Date**: ___________
**Tester**: ___________
**Version**: ___________

### Pass/Fail Summary:
- Authentication: ⬜ Pass / ⬜ Fail
- Comedian Flow: ⬜ Pass / ⬜ Fail  
- Promoter Flow: ⬜ Pass / ⬜ Fail
- Admin Flow: ⬜ Pass / ⬜ Fail
- Critical Features: ⬜ Pass / ⬜ Fail
- Error Handling: ⬜ Pass / ⬜ Fail
- Performance: ⬜ Pass / ⬜ Fail

### Critical Issues Found:
1. _________________________________
2. _________________________________
3. _________________________________

### Recommendations:
_____________________________________
_____________________________________
_____________________________________

## Notes for Onboarding

Before allowing real users:
1. All authentication flows must work
2. Profile creation trigger must be verified
3. Basic comedian/promoter flows must pass
4. No critical errors in console
5. Performance acceptable on mobile