# Stand Up Sydney -- Comprehensive Email Catalog

**Version:** 1.0
**Date:** 2026-02-17
**Status:** Planning Reference Document

This document catalogs every email the Stand Up Sydney platform needs, organized by audience segment. Each entry describes purpose, trigger, key content, and implementation priority. Emails already implemented in the codebase are marked accordingly.

---

## Table of Contents

1. [Platform / System Emails](#1-platform--system-emails)
2. [Comedian / Performer Emails](#2-comedian--performer-emails)
3. [Promoter / Event Manager Emails](#3-promoter--event-manager-emails)
4. [Photographer / Videographer Emails](#4-photographer--videographer-emails)
5. [Venue / Organization Emails](#5-venue--organization-emails)
6. [Agency / Manager Emails](#6-agency--manager-emails)
7. [Customer / Audience Emails](#7-customer--audience-emails)
8. [Financial / Billing Emails](#8-financial--billing-emails)
9. [Tour Management Emails](#9-tour-management-emails)
10. [Marketing / Lifecycle Emails](#10-marketing--lifecycle-emails)
11. [Admin / Internal Operations Emails](#11-admin--internal-operations-emails)
12. [Implementation Summary](#12-implementation-summary)

---

## 1. Platform / System Emails

These are universal emails that apply to all user types on the platform.

### 1.1 Email Verification
- **ID:** `SYS-001`
- **Priority:** MUST-HAVE
- **Status:** IMPLEMENTED (`emailService.sendEmailConfirmation`)
- **Trigger:** User creates a new account via email/password signup
- **Purpose:** Verify the user owns the email address they registered with
- **Key Content:**
  - Confirmation link (time-limited, single use)
  - Plaintext fallback of the link URL
  - "If you didn't create this account, ignore this email" disclaimer
- **From:** `noreply@standupsydney.com`
- **Notes:** Supabase Auth handles this natively. The custom implementation in `emailService.ts` exists for non-standard auth flows.

### 1.2 Welcome Email (Generic)
- **ID:** `SYS-002`
- **Priority:** MUST-HAVE
- **Status:** PARTIALLY IMPLEMENTED (comedian-specific version exists in `emailService.sendComedianWelcome`)
- **Trigger:** User completes email verification and first profile setup
- **Purpose:** Onboard new users, introduce platform features relevant to their role
- **Key Content:**
  - Personalized greeting using their name
  - Role-specific getting started steps (comedian vs. promoter vs. photographer vs. venue)
  - Link to their dashboard
  - Link to help center / getting started guide
  - Links to complete profile (bio, photos, social accounts)
- **From:** `hello@standupsydney.com`
- **Variants needed:**
  - `SYS-002a` -- Welcome: Comedian
  - `SYS-002b` -- Welcome: Promoter / Event Manager
  - `SYS-002c` -- Welcome: Photographer / Videographer
  - `SYS-002d` -- Welcome: Venue / Organization
  - `SYS-002e` -- Welcome: Agency / Manager

### 1.3 Password Reset
- **ID:** `SYS-003`
- **Priority:** MUST-HAVE
- **Status:** HANDLED BY SUPABASE AUTH
- **Trigger:** User clicks "Forgot Password" on login screen
- **Purpose:** Allow users to securely reset their password
- **Key Content:**
  - Reset link (time-limited, single use)
  - Expiration time (e.g., "This link expires in 1 hour")
  - Security notice ("If you didn't request this...")
  - Link to contact support if they're locked out
- **From:** `noreply@standupsydney.com`

### 1.4 Password Changed Confirmation
- **ID:** `SYS-004`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** User successfully changes their password (via reset or settings)
- **Purpose:** Security notification so user knows if an unauthorized change occurred
- **Key Content:**
  - Confirmation that password was changed
  - Timestamp and approximate location / device
  - "If this wasn't you, contact support immediately" with direct link
- **From:** `security@standupsydney.com`

### 1.5 Account Deactivation / Deletion
- **ID:** `SYS-005`
- **Priority:** NICE-TO-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** User requests account deletion or admin deactivates an account
- **Purpose:** Confirm the account action and provide reactivation window
- **Key Content:**
  - What happens to their data (grace period, permanent deletion timeline)
  - How to reactivate if they change their mind
  - Contact support link
- **From:** `noreply@standupsydney.com`

### 1.6 Login from New Device / Location
- **ID:** `SYS-006`
- **Priority:** NICE-TO-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Successful login from an unrecognized device or IP location
- **Purpose:** Security alert to help users detect unauthorized access
- **Key Content:**
  - Device type, browser, approximate location
  - "If this was you, no action needed"
  - "If this wasn't you" -- link to change password and review sessions
- **From:** `security@standupsydney.com`

### 1.7 Profile Completion Reminder
- **ID:** `SYS-007`
- **Priority:** NICE-TO-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** 3 days after signup if profile is less than 60% complete
- **Purpose:** Encourage users to complete their profile for better platform experience
- **Key Content:**
  - Percentage completion indicator
  - Specific missing items (bio, headshot, social links, videos)
  - Benefits of a complete profile ("Promoters are 3x more likely to book comedians with complete profiles")
  - Direct link to edit profile
- **From:** `hello@standupsydney.com`
- **Cadence:** Send at 3 days, 7 days, 14 days. Stop after 3 attempts or once profile reaches 80%.

---

## 2. Comedian / Performer Emails

### 2.1 Spot Assignment Notification
- **ID:** `COM-001`
- **Priority:** MUST-HAVE
- **Status:** IMPLEMENTED (`spotAssignmentTemplate.ts`)
- **Trigger:** Promoter assigns a comedian to a spot on an event
- **Purpose:** Notify the comedian they have been selected for a show and request confirmation
- **Key Content:**
  - Event name, date, time, venue, address
  - Spot type (MC, opener, feature, headline) and duration
  - Confirmation deadline with countdown
  - CTA: "Confirm Spot" button linking to confirmation URL
  - Secondary CTA: "View Event Details"
  - Promoter name and contact email
  - Special instructions (if any)
- **From:** `shows@standupsydney.com`

### 2.2 Spot Confirmation Deadline Reminders
- **ID:** `COM-002`
- **Priority:** MUST-HAVE
- **Status:** IMPLEMENTED (`spotDeadlineTemplate.ts`, `deadlineReminderTemplates.ts`)
- **Trigger:** Automated countdown: 24 hours, 6 hours, and 1 hour before confirmation deadline
- **Purpose:** Escalating reminders to confirm or decline the spot before it expires
- **Key Content:**
  - Hours remaining (displayed prominently)
  - Event summary (name, date, venue)
  - Confirm/Decline CTAs
  - Warning: spot auto-releases if not confirmed
- **From:** `shows@standupsydney.com`
- **Variants:**
  - `COM-002a` -- 24-hour reminder (blue header, informational tone)
  - `COM-002b` -- 6-hour reminder (red header, urgent tone)
  - `COM-002c` -- 1-hour FINAL NOTICE (dark red, maximum urgency)

### 2.3 Spot Confirmation Received (Comedian Copy)
- **ID:** `COM-003`
- **Priority:** MUST-HAVE
- **Status:** IMPLEMENTED (`spotConfirmationTemplate.ts`)
- **Trigger:** Comedian confirms their spot
- **Purpose:** Acknowledge confirmation and provide show-day logistics
- **Key Content:**
  - Confirmation success message
  - Full event details (date, time, venue, address)
  - Arrival time and sound check time (if applicable)
  - Performance duration
  - Next steps checklist (mark calendar, prepare material, arrive early)
  - Promoter contact info for questions
  - "Add to Calendar" link (iCal / Google Calendar)
- **From:** `shows@standupsydney.com`

### 2.4 Spot Declined Acknowledgment (Comedian Copy)
- **ID:** `COM-004`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Comedian declines a spot
- **Purpose:** Acknowledge the decline and redirect to other opportunities
- **Key Content:**
  - Acknowledgment of decline
  - Reason for decline (if provided)
  - CTA: "Browse Other Events" to keep them engaged
  - Encouragement to apply for future shows
- **From:** `shows@standupsydney.com`

### 2.5 Deadline Extended Notification
- **ID:** `COM-005`
- **Priority:** MUST-HAVE
- **Status:** IMPLEMENTED (`deadlineReminderTemplates.ts` -- `deadlineExtendedTemplate`)
- **Trigger:** Promoter extends the confirmation deadline for a comedian's spot
- **Purpose:** Inform comedian of the new deadline
- **Key Content:**
  - New extended deadline
  - Reason for extension (if provided)
  - Event details
  - CTA: "View Spot Details"
- **From:** `shows@standupsydney.com`

### 2.6 Application Submitted Confirmation
- **ID:** `COM-006`
- **Priority:** MUST-HAVE
- **Status:** IN-APP NOTIFICATION ONLY (`notificationService.notifyApplicationSubmitted`)
- **Trigger:** Comedian submits an application for a show
- **Purpose:** Confirm receipt of application and set expectations for response time
- **Key Content:**
  - Event name, date, venue
  - Application status: "Under Review"
  - Estimated response timeframe
  - Link to view/manage application
  - Tip: "Make sure your profile is up to date -- promoters review your profile when considering applications"
- **From:** `shows@standupsydney.com`

### 2.7 Application Accepted
- **ID:** `COM-007`
- **Priority:** MUST-HAVE
- **Status:** IN-APP NOTIFICATION ONLY (`notificationService.notifyApplicationAccepted`)
- **Trigger:** Promoter accepts a comedian's application
- **Purpose:** Notify comedian their application was successful
- **Key Content:**
  - Congratulations message
  - Event details
  - Next steps (await spot assignment or confirm directly)
  - Link to event details
- **From:** `shows@standupsydney.com`

### 2.8 Application Not Selected
- **ID:** `COM-008`
- **Priority:** MUST-HAVE
- **Status:** IN-APP NOTIFICATION ONLY (`notificationService.notifyApplicationRejected`)
- **Trigger:** Promoter rejects a comedian's application
- **Purpose:** Notify comedian (gracefully) and encourage future applications
- **Key Content:**
  - Tactful "not selected this time" language (never use "rejected")
  - Feedback from promoter (if provided)
  - CTA: "Browse Other Events"
  - Encouragement: "Keep applying -- many of our top comedians were selected on their second or third application"
- **From:** `shows@standupsydney.com`

### 2.9 Application Withdrawn Confirmation
- **ID:** `COM-009`
- **Priority:** NICE-TO-HAVE
- **Status:** IN-APP NOTIFICATION ONLY (`notificationService.notifyApplicationWithdrawn`)
- **Trigger:** Comedian withdraws their own application
- **Purpose:** Confirm withdrawal
- **Key Content:**
  - Confirmation of withdrawal
  - Note that they can reapply if the event still has open spots
  - CTA: "Browse Events"
- **From:** `shows@standupsydney.com`

### 2.10 Gig Confirmation (Legacy)
- **ID:** `COM-010`
- **Priority:** MUST-HAVE
- **Status:** IMPLEMENTED (`emailService.sendGigConfirmation`)
- **Trigger:** Gig is confirmed (alternative flow to spot assignment)
- **Purpose:** Provide confirmed gig details
- **Key Content:**
  - Event name, venue, date, time, spot duration
  - Reminders: arrive early, respect time limit
  - Link to "My Gigs" dashboard
- **From:** `shows@standupsydney.com`

### 2.11 Show Day Reminder
- **ID:** `COM-011`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Morning of the show (e.g., 9:00 AM on show day)
- **Purpose:** Final reminder with all logistics
- **Key Content:**
  - "Tonight's the night!" header
  - Full venue details with Google Maps link
  - Call time / arrival time
  - Sound check time (if applicable)
  - Set length reminder
  - Running order position (if available)
  - Parking info / public transport suggestions
  - Promoter contact (mobile) for day-of emergencies
  - Weather info (if outdoor venue)
- **From:** `shows@standupsydney.com`

### 2.12 Post-Show Recap (Comedian)
- **ID:** `COM-012`
- **Priority:** NICE-TO-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** 24 hours after event end time
- **Purpose:** Provide performance stats and encourage continued engagement
- **Key Content:**
  - "Great show!" acknowledgment
  - Audience size / ticket sales (if applicable)
  - Link to any photos/videos from the show (if photographer was booked)
  - Link to leave a vouch for the promoter/venue
  - CTA: "Update your profile with this credit"
  - Upcoming shows at the same venue
  - Payment info: when to expect payment (if paid gig)
- **From:** `shows@standupsydney.com`

### 2.13 New Gig Opportunities Digest
- **ID:** `COM-013`
- **Priority:** NICE-TO-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Weekly (e.g., Monday morning) or when new events match comedian's preferences
- **Purpose:** Surface relevant open spots and application opportunities
- **Key Content:**
  - List of upcoming events accepting applications
  - Filtered by comedian's location, experience level, and preferences
  - Quick-apply links
  - Number of spots remaining on each show
  - Application deadline for each
- **From:** `hello@standupsydney.com`
- **Cadence:** Weekly digest or real-time alerts (user preference)

### 2.14 Profile View / Interest Notification
- **ID:** `COM-014`
- **Priority:** NICE-TO-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** When a promoter views a comedian's profile or saves them to a shortlist
- **Purpose:** Let comedians know there's interest in their profile
- **Key Content:**
  - "A promoter viewed your profile" (anonymized or named depending on settings)
  - Prompt to ensure profile is up to date
  - Link to edit profile
- **From:** `hello@standupsydney.com`

### 2.15 Spot Cancelled by Promoter
- **ID:** `COM-015`
- **Priority:** MUST-HAVE
- **Status:** IN-APP NOTIFICATION ONLY (`notificationService.notifySpotCancelled`)
- **Trigger:** Promoter removes a comedian from a confirmed spot, or event is cancelled
- **Purpose:** Notify comedian of the cancellation
- **Key Content:**
  - Cancellation notice with reason (if provided)
  - Event details for reference
  - Whether they will still be paid (if applicable)
  - CTA: "Browse Other Events"
  - Apology and encouragement
- **From:** `shows@standupsydney.com`

### 2.16 Vouch Received
- **ID:** `COM-016`
- **Priority:** NICE-TO-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Another user (promoter, comedian, photographer) vouches for a comedian
- **Purpose:** Notify comedian of the endorsement
- **Key Content:**
  - Who vouched and their message
  - Rating given
  - Link to view the vouch on their profile
  - Total vouch count / average rating
- **From:** `hello@standupsydney.com`

### 2.17 Spot Expired (Auto-Released)
- **ID:** `COM-017`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Confirmation deadline passes without response
- **Purpose:** Inform comedian their spot was auto-released
- **Key Content:**
  - "Your spot for [Event] has been released"
  - Explanation that the deadline passed
  - Note: they can contact the promoter if this was an error
  - CTA: "Browse Other Events"
- **From:** `shows@standupsydney.com`

---

## 3. Promoter / Event Manager Emails

### 3.1 Spot Confirmed by Comedian (Promoter Copy)
- **ID:** `PRO-001`
- **Priority:** MUST-HAVE
- **Status:** IMPLEMENTED (`spotConfirmationTemplate.ts` with `isPromoterEmail: true`)
- **Trigger:** Comedian confirms their assigned spot
- **Purpose:** Notify promoter of lineup confirmation progress
- **Key Content:**
  - Comedian name and spot type confirmed
  - Current lineup status (e.g., "4 of 6 spots confirmed")
  - Link to view full lineup
  - Comedian contact email
- **From:** `shows@standupsydney.com`

### 3.2 Spot Declined by Comedian (Promoter Copy)
- **ID:** `PRO-002`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Comedian declines their assigned spot
- **Purpose:** Alert promoter to find a replacement
- **Key Content:**
  - Comedian name and which spot was declined
  - Reason for decline (if given)
  - CTA: "Find Replacement" linking to applications
  - Next steps: review pending applications, contact alternates
- **From:** `shows@standupsydney.com`

### 3.3 New Application Received
- **ID:** `PRO-003`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** A comedian submits an application for the promoter's event
- **Purpose:** Alert promoter of new applications to review
- **Key Content:**
  - Comedian name, experience level, location
  - Application message preview
  - Quick link to comedian's profile
  - CTA: "Review Application"
  - Current application count for the event
- **From:** `shows@standupsydney.com`
- **Notes:** Consider batching if many applications arrive at once (e.g., within a 15-minute window, send a summary instead of individual emails).

### 3.4 Lineup Complete Notification
- **ID:** `PRO-004`
- **Priority:** MUST-HAVE
- **Status:** IN-APP NOTIFICATION ONLY (`notificationService.notifyEventLineupComplete`)
- **Trigger:** All spots on an event are confirmed
- **Purpose:** Confirm lineup is locked and ready
- **Key Content:**
  - Full lineup list with spot types and durations
  - Event date/venue summary
  - CTA: "View Full Lineup"
  - Reminder to promote the show
  - Next steps: share lineup graphic, update ticketing platforms
- **From:** `shows@standupsydney.com`

### 3.5 Event Created Confirmation
- **ID:** `PRO-005`
- **Priority:** NICE-TO-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Promoter creates a new event
- **Purpose:** Confirm event creation and prompt next steps
- **Key Content:**
  - Event summary (title, date, venue, spots)
  - Current status (draft/open)
  - Next steps: open for applications, assign comedians, connect ticketing
  - Link to event management page
- **From:** `shows@standupsydney.com`

### 3.6 Event Reminder (Promoter)
- **ID:** `PRO-006`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** 48 hours before event, and morning of event
- **Purpose:** Ensure promoter is prepared for the show
- **Key Content:**
  - Full lineup confirmation status
  - Ticket sales summary (total sold, revenue, capacity remaining)
  - Unfilled spots warning (if any)
  - Photographer/videographer booking status
  - Venue contact details
  - Day-of checklist (sound check, doors, show start)
- **From:** `shows@standupsydney.com`

### 3.7 Ticket Sales Milestone
- **ID:** `PRO-007`
- **Priority:** NICE-TO-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** When ticket sales hit 25%, 50%, 75%, and 100% of capacity
- **Purpose:** Keep promoter informed of sales progress
- **Key Content:**
  - Current sold count and percentage
  - Revenue so far
  - Milestone celebration ("You're halfway there!")
  - If below target: promotional tips
  - If selling fast: consider adding a second show
- **From:** `shows@standupsydney.com`

### 3.8 Spot Confirmation Deadline Approaching (Promoter)
- **ID:** `PRO-008`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** A comedian's confirmation deadline is approaching and they haven't responded
- **Purpose:** Alert promoter so they can follow up or prepare alternatives
- **Key Content:**
  - Comedian name and event
  - Hours remaining until deadline
  - Options: extend deadline, send reminder, find replacement
  - Link to manage lineup
- **From:** `shows@standupsydney.com`

### 3.9 Post-Show Summary (Promoter)
- **ID:** `PRO-009`
- **Priority:** NICE-TO-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** 24 hours after event end time
- **Purpose:** Provide show performance summary and outstanding actions
- **Key Content:**
  - Audience/ticket metrics (sold, attended, no-shows)
  - Revenue breakdown (gross, fees, net)
  - Platform fee breakdown (Humanitix/Eventbrite/GYG commissions)
  - Outstanding comedian payments
  - Photographer/videographer deliverables expected
  - CTA: "View Settlement" and "Generate Invoices"
  - Prompt to leave vouches for performers
- **From:** `shows@standupsydney.com`

### 3.10 Waitlist Notification (Promoter)
- **ID:** `PRO-010`
- **Priority:** NICE-TO-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** New person joins the audience waitlist for a sold-out event
- **Purpose:** Inform promoter of waitlist demand
- **Key Content:**
  - Number of people on waitlist
  - Suggestion to consider a second show if demand is high
  - Link to manage waitlist
- **From:** `shows@standupsydney.com`

---

## 4. Photographer / Videographer Emails

### 4.1 Event Booking Request
- **ID:** `PHO-001`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Promoter sends a booking request to a photographer/videographer
- **Purpose:** Invite photographer to cover an event
- **Key Content:**
  - Event name, date, time, venue
  - Role requested (photographer, videographer, or both)
  - Agreed rate (if pre-negotiated)
  - Expected deliverables (number of photos, turnaround time)
  - CTA: "Accept Booking" / "Decline"
  - Promoter contact details
- **From:** `shows@standupsydney.com`

### 4.2 Booking Confirmed
- **ID:** `PHO-002`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Photographer accepts a booking request
- **Purpose:** Confirm booking details and logistics
- **Key Content:**
  - Full event details
  - Agreed rate and payment terms
  - Equipment/access requirements
  - Arrival/setup time
  - Venue contact for day-of coordination
  - Deliverables timeline
- **From:** `shows@standupsydney.com`

### 4.3 Show Day Reminder (Photographer)
- **ID:** `PHO-003`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Morning of the event
- **Purpose:** Day-of logistics reminder
- **Key Content:**
  - Venue details with map link
  - Arrival/setup time
  - Event lineup (for shot planning)
  - Lighting conditions / venue layout notes
  - Promoter mobile number for day-of
  - Deliverables reminder (number of photos, editing style, deadline)
- **From:** `shows@standupsydney.com`

### 4.4 Deliverables Reminder
- **ID:** `PHO-004`
- **Priority:** NICE-TO-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** N days after event (based on agreed turnaround time, e.g., 3 days before due)
- **Purpose:** Remind photographer to submit deliverables
- **Key Content:**
  - Event name and date
  - Deliverables due date
  - Upload link (media library)
  - Formatting/quality requirements
- **From:** `shows@standupsydney.com`

### 4.5 Payment Processed (Photographer)
- **ID:** `PHO-005`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED (but invoice templates exist for general use)
- **Trigger:** Payment is processed for a completed booking
- **Purpose:** Confirm payment
- **Key Content:**
  - Payment amount and method
  - Invoice reference
  - Event details for their records
  - Link to payment history
- **From:** `accounts@standupsydney.com`

---

## 5. Venue / Organization Emails

### 5.1 New Event at Your Venue
- **ID:** `VEN-001`
- **Priority:** NICE-TO-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** A promoter creates an event listing at a venue registered on the platform
- **Purpose:** Notify venue of upcoming event and allow them to confirm/flag issues
- **Key Content:**
  - Event details (title, date, time, expected capacity)
  - Promoter name and contact
  - CTA: "Confirm Event" / "Flag an Issue"
  - Venue calendar link
- **From:** `shows@standupsydney.com`

### 5.2 Event Summary (Venue)
- **ID:** `VEN-002`
- **Priority:** NICE-TO-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Day after an event at the venue
- **Purpose:** Provide event performance data to the venue
- **Key Content:**
  - Attendance numbers
  - Show time compliance (started on time, ended on time)
  - Any incidents or notes
  - Upcoming events at the venue
- **From:** `shows@standupsydney.com`

### 5.3 Weekly Venue Schedule
- **ID:** `VEN-003`
- **Priority:** NICE-TO-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Weekly (e.g., Monday morning)
- **Purpose:** Provide venues with a consolidated view of their upcoming week
- **Key Content:**
  - List of all events at the venue in the coming week
  - Promoter names and contact info for each
  - Expected attendance for each event
  - Any special requirements (extra sound equipment, seating configuration)
- **From:** `shows@standupsydney.com`

### 5.4 Settlement Report (Venue)
- **ID:** `VEN-004`
- **Priority:** MUST-HAVE (if venue gets a revenue share)
- **Status:** NOT IMPLEMENTED
- **Trigger:** After event settlement is completed
- **Purpose:** Provide venue with their share of ticket revenue / door split
- **Key Content:**
  - Event name and date
  - Total ticket sales / door revenue
  - Venue's share (based on agreed split)
  - Deductions (if any)
  - Net payment amount and expected payment date
  - Invoice attachment (PDF)
- **From:** `accounts@standupsydney.com`

---

## 6. Agency / Manager Emails

### 6.1 New Deal / Booking Offer
- **ID:** `AGN-001`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** A promoter proposes a deal for one of the agency's artists
- **Purpose:** Alert manager of a new booking opportunity
- **Key Content:**
  - Artist name and proposed event
  - Proposed fee and terms
  - Event details (date, venue, expected audience)
  - Deal deadline
  - CTA: "Review Deal" / "Counter Offer" / "Decline"
  - Negotiation strategy suggestion (based on artist's market rate)
- **From:** `deals@standupsydney.com`

### 6.2 Deal Status Change
- **ID:** `AGN-002`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Deal status changes (counter offered, accepted, declined, expired)
- **Purpose:** Keep all parties informed of deal progression
- **Key Content:**
  - Deal title and current status
  - Summary of latest offer/counter-offer
  - Next steps based on new status
  - Link to deal details
- **From:** `deals@standupsydney.com`
- **Recipients:** Manager, promoter, and optionally the artist

### 6.3 Deal Expiring Soon
- **ID:** `AGN-003`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Deal deadline is within 24 hours
- **Purpose:** Urgent reminder to respond before deal expires
- **Key Content:**
  - Deal summary
  - Current offer on the table
  - Hours remaining
  - CTA: "Respond Now"
- **From:** `deals@standupsydney.com`

### 6.4 Artist Roster Update
- **ID:** `AGN-004`
- **Priority:** NICE-TO-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** New artist joins the agency, or contract status changes
- **Purpose:** Confirm roster changes
- **Key Content:**
  - Artist name and relationship status
  - Contract details summary
  - Commission rate
  - Link to artist management page
- **From:** `hello@standupsydney.com`

### 6.5 Weekly Agency Digest
- **ID:** `AGN-005`
- **Priority:** NICE-TO-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Weekly (e.g., Monday morning)
- **Purpose:** Summary of agency activity
- **Key Content:**
  - Pending deals requiring action
  - Upcoming shows for managed artists
  - Revenue summary for the period
  - New opportunities matching artist profiles
  - Outstanding invoices
- **From:** `hello@standupsydney.com`

### 6.6 Collaboration Invite (Tour)
- **ID:** `AGN-006`
- **Priority:** MUST-HAVE
- **Status:** IN-APP NOTIFICATION ONLY (`notificationService.notifyCollaborationInvite`)
- **Trigger:** Tour manager invites a collaborator
- **Purpose:** Invite an external collaborator to participate in a tour
- **Key Content:**
  - Tour name and description
  - Inviter's name and role
  - Proposed collaboration role and responsibilities
  - Revenue/expense share terms
  - Invitation expiry date
  - CTA: "Accept" / "Decline" / "Discuss Terms"
- **From:** `tours@standupsydney.com`

---

## 7. Customer / Audience Emails

These target ticket buyers who may not have platform accounts.

### 7.1 Ticket Purchase Confirmation
- **ID:** `CUS-001`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED (currently handled by Humanitix/Eventbrite/GYG natively)
- **Trigger:** Customer completes a ticket purchase
- **Purpose:** Confirm the booking and provide all attendance details
- **Key Content:**
  - Order number and ticket details (quantity, type, total paid)
  - Event name, date, time
  - Venue name, address, Google Maps link
  - QR code / e-ticket attachment
  - Doors open time vs. show start time
  - Age restriction / dress code (if any)
  - Parking / transport info
  - Refund policy summary
  - "Add to Calendar" button
  - "Share with friends" social links
- **From:** `tickets@standupsydney.com`
- **Notes:** If ticketing is handled by third-party platforms, this serves as a supplementary branded email. Consider whether to duplicate or enhance what Humanitix/Eventbrite already send.

### 7.2 Event Reminder (Audience)
- **ID:** `CUS-002`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** 24 hours before the event, and 2 hours before doors open
- **Purpose:** Reduce no-shows and build excitement
- **Key Content:**
  - "See you tomorrow / tonight!" messaging
  - Event details and venue address
  - Lineup preview (comedian names, headliner highlight)
  - Doors open time
  - Parking / transport info
  - "Running late?" -- venue late entry policy
  - Weather-appropriate tips (if outdoor venue)
- **From:** `tickets@standupsydney.com`
- **Variants:**
  - `CUS-002a` -- 24-hour reminder (anticipation builder)
  - `CUS-002b` -- 2-hour reminder (logistics focused)

### 7.3 Post-Show Thank You
- **ID:** `CUS-003`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Day after the event
- **Purpose:** Thank attendees, collect feedback, promote future shows
- **Key Content:**
  - "Thanks for coming!" message
  - Event photo gallery link (if photographer was booked)
  - Review / feedback request (star rating + optional comment)
  - "Who was your favourite comedian?" poll
  - Next show at the same venue / by the same promoter
  - Early bird discount code for their next booking
  - Social sharing: "Share your experience" links
- **From:** `hello@standupsydney.com`

### 7.4 Refund Confirmation
- **ID:** `CUS-004`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED (refunds handled by ticketing platforms)
- **Trigger:** Refund is processed for a cancelled/changed event or customer request
- **Purpose:** Confirm the refund and set expectations for processing time
- **Key Content:**
  - Refund amount and original payment method
  - Expected processing time (e.g., "3-5 business days")
  - Original order reference
  - Reason for refund (event cancelled, customer request, etc.)
  - Credit/voucher option (if offered as alternative)
  - Contact support link for questions
- **From:** `tickets@standupsydney.com`

### 7.5 Event Cancelled / Rescheduled
- **ID:** `CUS-005`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Promoter cancels or reschedules an event
- **Purpose:** Inform ticket holders and provide options
- **Key Content:**
  - Clear "EVENT CANCELLED" or "EVENT RESCHEDULED" header
  - Original event details
  - New date/time (if rescheduled)
  - Options: automatic refund, transfer to new date, credit for future show
  - Deadline to choose (if applicable)
  - Apology from the promoter
  - CTA for each option
- **From:** `tickets@standupsydney.com`

### 7.6 Waitlist Spot Available
- **ID:** `CUS-006`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED (waitlist exists in types but no email)
- **Trigger:** A ticket becomes available for a sold-out event and the person is next on the waitlist
- **Purpose:** Offer the spot before it goes to the general public
- **Key Content:**
  - "A spot just opened up!"
  - Event details
  - Time-limited CTA: "Claim Your Ticket" (e.g., 4-hour hold)
  - Expiry warning: "This offer expires in 4 hours"
  - If they miss it: "Don't worry, we'll let you know if more spots open up"
- **From:** `tickets@standupsydney.com`

### 7.7 Waitlist Confirmation
- **ID:** `CUS-007`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Person joins the waitlist for a sold-out event
- **Purpose:** Confirm waitlist position and set expectations
- **Key Content:**
  - Waitlist position number
  - Event details
  - How the process works (notified when spot available, time-limited claim window)
  - Alternative shows they might enjoy
- **From:** `tickets@standupsydney.com`

### 7.8 Early Bird / Presale Access
- **ID:** `CUS-008`
- **Priority:** NICE-TO-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** New event announced with presale period, sent to subscribers/past attendees
- **Purpose:** Reward loyal customers with early access
- **Key Content:**
  - Exclusive presale announcement
  - Event details and lineup preview
  - Presale code (if applicable)
  - Presale window (start/end times)
  - CTA: "Get Your Tickets First"
- **From:** `hello@standupsydney.com`

### 7.9 Birthday / Special Occasion Email
- **ID:** `CUS-009`
- **Priority:** NICE-TO-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Customer's birthday (if date of birth is collected)
- **Purpose:** Personal touch with a special offer
- **Key Content:**
  - Birthday greeting
  - Special discount code (e.g., 20% off next booking)
  - Recommended upcoming shows
  - Code validity period
- **From:** `hello@standupsydney.com`

### 7.10 Re-engagement Email
- **ID:** `CUS-010`
- **Priority:** NICE-TO-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Customer hasn't attended a show in 90+ days
- **Purpose:** Win back lapsed customers
- **Key Content:**
  - "We miss you!" messaging
  - What they've been missing (highlight recent shows, new comedians)
  - Incentive: discount code or free ticket upgrade
  - Curated show recommendations based on past attendance
  - Easy unsubscribe option
- **From:** `hello@standupsydney.com`

### 7.11 Event Lineup Announced
- **ID:** `CUS-011`
- **Priority:** NICE-TO-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Full lineup is confirmed for an event the customer has tickets for
- **Purpose:** Build excitement by revealing who's performing
- **Key Content:**
  - Full lineup with comedian photos and short bios
  - Headliner highlight
  - Show format (number of comedians, set lengths, interval)
  - Social sharing links
  - "Bring a friend" referral link
- **From:** `tickets@standupsydney.com`

---

## 8. Financial / Billing Emails

### 8.1 Invoice
- **ID:** `FIN-001`
- **Priority:** MUST-HAVE
- **Status:** IMPLEMENTED (`invoiceEmailTemplate.ts` -- `createInvoiceEmail`)
- **Trigger:** Invoice is generated (manually or automatically post-event)
- **Purpose:** Deliver invoice for services rendered
- **Key Content:**
  - Invoice number, issue date, due date
  - Sender and recipient details (name, email, ABN)
  - Itemized line items with quantities, rates, totals
  - Total amount due with currency
  - Payment instructions (bank details, payment link)
  - Notes (if any)
  - PDF attachment option
  - Company information (address, phone, ABN)
- **From:** `accounts@standupsydney.com`

### 8.2 Invoice Payment Reminder
- **ID:** `FIN-002`
- **Priority:** MUST-HAVE
- **Status:** IMPLEMENTED (`invoiceEmailTemplate.ts` -- `createInvoiceReminderEmail`)
- **Trigger:** Invoice due date approaches or passes (first reminder, urgent, final notice)
- **Purpose:** Prompt payment of outstanding invoices
- **Key Content:**
  - Urgency level header (REMINDER / URGENT / FINAL NOTICE)
  - Invoice number and original due date
  - Days overdue (if applicable)
  - Amount due
  - Payment instructions
  - Escalation warning (for final notice)
- **From:** `accounts@standupsydney.com`
- **Variants:**
  - `FIN-002a` -- Friendly first reminder (due date day)
  - `FIN-002b` -- Urgent (7 days overdue)
  - `FIN-002c` -- Final notice (14+ days overdue)

### 8.3 Payment Receipt
- **ID:** `FIN-003`
- **Priority:** MUST-HAVE
- **Status:** IMPLEMENTED (`invoiceEmailTemplate.ts` -- `createPaymentReceiptEmail`)
- **Trigger:** Payment is received and recorded
- **Purpose:** Confirm payment and provide receipt
- **Key Content:**
  - Invoice number
  - Payment amount, date, and method
  - Remaining balance (if partial payment)
  - "Paid in Full" confirmation (if complete)
- **From:** `accounts@standupsydney.com`

### 8.4 Settlement Summary
- **ID:** `FIN-004`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Event settlement is calculated and finalized
- **Purpose:** Provide all parties with the financial breakdown
- **Key Content:**
  - Event name and date
  - Gross ticket revenue (broken down by platform: Humanitix, Eventbrite, GYG, door sales)
  - Platform fees and commissions
  - Net ticket revenue
  - Comedian payments breakdown
  - Photographer/videographer payments
  - Venue costs
  - Other expenses
  - Commission splits (if applicable)
  - Net profit/loss
  - PDF attachment of full settlement report
- **From:** `accounts@standupsydney.com`
- **Recipients:** Promoter (always), Venue (if revenue share), Organization (if applicable)

### 8.5 Xero Sync Confirmation
- **ID:** `FIN-005`
- **Priority:** NICE-TO-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Invoice or payment is successfully synced to Xero
- **Purpose:** Confirm accounting system integration is working
- **Key Content:**
  - Items synced (invoice number, contact, amount)
  - Xero reference number
  - Link to view in Xero
  - Any sync errors or warnings
- **From:** `accounts@standupsydney.com`

### 8.6 Payout Notification (Comedian)
- **ID:** `FIN-006`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Payment is initiated to a comedian for a completed gig
- **Purpose:** Notify comedian that their payment is on the way
- **Key Content:**
  - Event name and date
  - Payment amount
  - Payment method (bank transfer, etc.)
  - Expected arrival date
  - Invoice/receipt reference
  - Breakdown: base fee, bonuses, deductions (if any)
- **From:** `accounts@standupsydney.com`

### 8.7 Commission Report (Agency)
- **ID:** `FIN-007`
- **Priority:** NICE-TO-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Monthly or per-event, based on agency settings
- **Purpose:** Provide agency with commission earned from artist bookings
- **Key Content:**
  - Period covered
  - List of bookings with fees and commission rates
  - Total commission earned
  - Payment schedule
  - PDF attachment
- **From:** `accounts@standupsydney.com`

### 8.8 Reconciliation Alert
- **ID:** `FIN-008`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Reconciliation process finds critical discrepancies between platform sales data and local records
- **Purpose:** Alert admin/promoter of data discrepancies needing attention
- **Key Content:**
  - Event name and platform (Humanitix/Eventbrite/GYG)
  - Number of discrepancies found
  - Severity level
  - Summary of issues (missing sales, amount mismatches, duplicates)
  - CTA: "Review Discrepancies"
- **From:** `system@standupsydney.com`

---

## 9. Tour Management Emails

### 9.1 Tour Created
- **ID:** `TOR-001`
- **Priority:** NICE-TO-HAVE
- **Status:** IN-APP NOTIFICATION ONLY (`notificationService.notifyTourCreated`)
- **Trigger:** Tour manager creates a new tour
- **Purpose:** Confirm tour creation
- **Key Content:**
  - Tour name, dates, type
  - Number of stops
  - Budget summary
  - Link to tour dashboard
  - Next steps: add stops, invite participants, set up logistics
- **From:** `tours@standupsydney.com`

### 9.2 Tour Participant Invitation
- **ID:** `TOR-002`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Tour manager invites a comedian/crew member to join a tour
- **Purpose:** Invite participant and present terms
- **Key Content:**
  - Tour name, dates, cities/venues
  - Role offered (headliner, support, MC, crew)
  - Payment terms (per show, flat rate, revenue share)
  - Travel/accommodation coverage
  - Special requirements
  - CTA: "Accept Invitation" / "Discuss Terms" / "Decline"
  - Contract details (if applicable)
- **From:** `tours@standupsydney.com`

### 9.3 Tour Schedule Update
- **ID:** `TOR-003`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Tour stop is added, removed, or rescheduled
- **Purpose:** Keep all tour participants informed of schedule changes
- **Key Content:**
  - What changed (new stop added, date changed, venue changed, stop cancelled)
  - Updated itinerary for affected dates
  - Impact on travel/logistics
  - CTA: "View Updated Schedule"
- **From:** `tours@standupsydney.com`
- **Recipients:** All tour participants and collaborators

### 9.4 Tour Stop Reminder
- **ID:** `TOR-004`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** 48 hours and morning-of before each tour stop
- **Purpose:** Provide logistics for the next stop
- **Key Content:**
  - Venue details with map
  - Load-in, sound check, doors, show times
  - Accommodation details (if applicable)
  - Travel arrangements (flight info, ground transport)
  - Local contacts
  - Emergency contact info
- **From:** `tours@standupsydney.com`

### 9.5 Tour Financial Summary
- **ID:** `TOR-005`
- **Priority:** NICE-TO-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Weekly during active tour, and after tour completion
- **Purpose:** Running financial summary of tour performance
- **Key Content:**
  - Revenue by stop (tickets, merch)
  - Expenses by category
  - Net P&L to date
  - Budget vs. actual comparison
  - Upcoming payments due
  - PDF attachment
- **From:** `accounts@standupsydney.com`

---

## 10. Marketing / Lifecycle Emails

### 10.1 New Show Announcement
- **ID:** `MKT-001`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Promoter publishes a new event and opts to announce it
- **Purpose:** Promote new shows to the subscriber base
- **Key Content:**
  - Show name and headline comedian (if known)
  - Date, time, venue
  - Show format description
  - Ticket price and booking link
  - Lineup preview or "lineup TBA" teaser
  - Early bird pricing (if applicable)
- **From:** `hello@standupsydney.com`
- **Recipients:** Subscribers in the relevant geographic area, past attendees at the venue

### 10.2 Weekly Newsletter
- **ID:** `MKT-002`
- **Priority:** NICE-TO-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Weekly (e.g., Thursday afternoon, ahead of the weekend)
- **Purpose:** Curated guide to the week's comedy in Sydney
- **Key Content:**
  - Featured shows this week
  - "Hot tickets" (shows selling fast)
  - New comedians on the platform
  - Comedy news / industry updates
  - Spotlight interview or profile
  - Social media highlights
- **From:** `hello@standupsydney.com`

### 10.3 Monthly Comedian Newsletter
- **ID:** `MKT-003`
- **Priority:** NICE-TO-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Monthly (first Monday of the month)
- **Purpose:** Industry newsletter for comedians
- **Key Content:**
  - Upcoming competition deadlines (Raw Comedy, etc.)
  - New venues added to the platform
  - Tips and advice (writing, performing, business)
  - Workshop and course announcements
  - Platform feature updates
  - Success stories from the community
- **From:** `hello@standupsydney.com`

### 10.4 Abandoned Cart / Incomplete Booking
- **ID:** `MKT-004`
- **Priority:** NICE-TO-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Customer starts ticket checkout but doesn't complete within 1 hour
- **Purpose:** Recover abandoned purchases
- **Key Content:**
  - "Forget something?" header
  - Show they were about to book
  - Number of tickets remaining ("Only 12 tickets left!")
  - CTA: "Complete Your Booking"
  - Alternative show recommendations
- **From:** `tickets@standupsydney.com`
- **Notes:** Only possible if ticketing is handled on-platform (not for Humanitix/Eventbrite hosted checkout).

### 10.5 Referral Program
- **ID:** `MKT-005`
- **Priority:** NICE-TO-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** After a customer attends their first show
- **Purpose:** Encourage word-of-mouth growth
- **Key Content:**
  - "Share the laughs" messaging
  - Unique referral code/link
  - Reward structure (e.g., "Give $10, Get $10")
  - How it works (3 simple steps)
  - Social sharing buttons
- **From:** `hello@standupsydney.com`

---

## 11. Admin / Internal Operations Emails

### 11.1 Daily Operations Summary
- **ID:** `ADM-001`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Daily (7:00 AM AEST)
- **Purpose:** Morning briefing for platform operators
- **Key Content:**
  - Tonight's events with lineup status
  - Unconfirmed spots expiring today
  - Ticket sales summary across all events
  - New user signups (last 24 hours)
  - Outstanding issues (reconciliation alerts, support tickets)
  - Revenue dashboard link
- **From:** `system@standupsydney.com`
- **Recipients:** Admin team

### 11.2 Critical System Alert
- **ID:** `ADM-002`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** System error, integration failure, security incident
- **Purpose:** Immediate alert for critical issues requiring attention
- **Key Content:**
  - Alert type and severity
  - Affected system/service
  - Error details
  - Timestamp
  - Suggested remediation steps
  - Link to monitoring dashboard
- **From:** `alerts@standupsydney.com`
- **Recipients:** Technical team / on-call

### 11.3 Webhook Failure Alert
- **ID:** `ADM-003`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** Humanitix, Eventbrite, or GYG webhook fails or returns errors
- **Purpose:** Alert to ticket sync issues that could cause data loss
- **Key Content:**
  - Platform affected
  - Error type and message
  - Affected event (if identifiable)
  - Number of failed webhook calls
  - Retry status
  - Manual sync instructions
- **From:** `alerts@standupsydney.com`

### 11.4 New User Requires Verification
- **ID:** `ADM-004`
- **Priority:** NICE-TO-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** New comedian, photographer, or venue registers and requests verified status
- **Purpose:** Alert admin to review and verify the profile
- **Key Content:**
  - User name, role, profile link
  - Profile completeness score
  - Social media links for cross-reference
  - CTA: "Review Profile" / "Verify" / "Request More Info"
- **From:** `system@standupsydney.com`

### 11.5 Reconciliation Summary
- **ID:** `ADM-005`
- **Priority:** MUST-HAVE
- **Status:** NOT IMPLEMENTED
- **Trigger:** After scheduled reconciliation run (or if critical discrepancies found)
- **Purpose:** Admin overview of data integrity across ticketing platforms
- **Key Content:**
  - Events reconciled
  - Discrepancies found by platform
  - Auto-resolved vs. requiring manual review
  - Revenue variance
  - Link to reconciliation dashboard
- **From:** `system@standupsydney.com`

---

## 12. Implementation Summary

### Currently Implemented (in codebase)

| ID | Email | File |
|----|-------|------|
| SYS-001 | Email Verification | `src/services/emailService.ts` |
| SYS-002a | Welcome: Comedian | `src/services/emailService.ts` |
| COM-001 | Spot Assignment | `src/templates/email/spotAssignmentTemplate.ts` |
| COM-002 | Spot Deadline Reminders (24h, 6h, 1h) | `src/templates/email/spotDeadlineTemplate.ts`, `deadlineReminderTemplates.ts` |
| COM-003 | Spot Confirmation (Comedian) | `src/templates/email/spotConfirmationTemplate.ts` |
| COM-004 | Spot Declined (Comedian) | NOT IMPLEMENTED |
| COM-005 | Deadline Extended | `src/templates/email/deadlineReminderTemplates.ts` |
| COM-010 | Gig Confirmation | `src/services/emailService.ts` |
| PRO-001 | Spot Confirmed (Promoter) | `src/templates/email/spotConfirmationTemplate.ts` |
| PRO-002 | Spot Declined (Promoter) | NOT IMPLEMENTED |
| FIN-001 | Invoice | `src/templates/email/invoiceEmailTemplate.ts` |
| FIN-002 | Invoice Reminder | `src/templates/email/invoiceEmailTemplate.ts` |
| FIN-003 | Payment Receipt | `src/templates/email/invoiceEmailTemplate.ts` |

### In-App Notification Only (need email counterpart)

| ID | Email | Service |
|----|-------|---------|
| COM-006 | Application Submitted | `notificationService.notifyApplicationSubmitted` |
| COM-007 | Application Accepted | `notificationService.notifyApplicationAccepted` |
| COM-008 | Application Not Selected | `notificationService.notifyApplicationRejected` |
| COM-009 | Application Withdrawn | `notificationService.notifyApplicationWithdrawn` |
| COM-015 | Spot Cancelled | `notificationService.notifySpotCancelled` |
| PRO-004 | Lineup Complete | `notificationService.notifyEventLineupComplete` |
| AGN-006 | Collaboration Invite | `notificationService.notifyCollaborationInvite` |
| TOR-001 | Tour Created | `notificationService.notifyTourCreated` |

### Not Implemented -- MUST-HAVE (Build Next)

| ID | Email | Audience |
|----|-------|----------|
| SYS-003 | Password Reset | All users |
| SYS-004 | Password Changed | All users |
| COM-011 | Show Day Reminder | Comedians |
| COM-015 | Spot Cancelled (email) | Comedians |
| COM-017 | Spot Expired / Auto-Released | Comedians |
| PRO-003 | New Application Received | Promoters |
| PRO-006 | Event Reminder (Promoter) | Promoters |
| PRO-008 | Spot Deadline Approaching (Promoter) | Promoters |
| PHO-001 | Event Booking Request | Photographers |
| PHO-002 | Booking Confirmed | Photographers |
| PHO-003 | Show Day Reminder (Photographer) | Photographers |
| PHO-005 | Payment Processed | Photographers |
| VEN-004 | Settlement Report | Venues |
| AGN-001 | New Deal / Booking Offer | Agencies |
| AGN-002 | Deal Status Change | Agencies |
| AGN-003 | Deal Expiring Soon | Agencies |
| CUS-001 | Ticket Purchase Confirmation | Customers |
| CUS-002 | Event Reminder (Audience) | Customers |
| CUS-003 | Post-Show Thank You | Customers |
| CUS-004 | Refund Confirmation | Customers |
| CUS-005 | Event Cancelled / Rescheduled | Customers |
| CUS-006 | Waitlist Spot Available | Customers |
| CUS-007 | Waitlist Confirmation | Customers |
| FIN-004 | Settlement Summary | Promoters / Venues |
| FIN-006 | Payout Notification | Comedians |
| FIN-008 | Reconciliation Alert | Admin |
| TOR-002 | Tour Participant Invitation | Tour participants |
| TOR-003 | Tour Schedule Update | Tour participants |
| TOR-004 | Tour Stop Reminder | Tour participants |
| ADM-001 | Daily Operations Summary | Admin |
| ADM-002 | Critical System Alert | Admin |
| ADM-003 | Webhook Failure Alert | Admin |
| ADM-005 | Reconciliation Summary | Admin |

### Not Implemented -- NICE-TO-HAVE (Future Enhancement)

| ID | Email | Audience |
|----|-------|----------|
| SYS-005 | Account Deactivation | All users |
| SYS-006 | Login from New Device | All users |
| SYS-007 | Profile Completion Reminder | All users |
| COM-012 | Post-Show Recap | Comedians |
| COM-013 | Gig Opportunities Digest | Comedians |
| COM-014 | Profile View Notification | Comedians |
| COM-016 | Vouch Received | Comedians |
| PRO-005 | Event Created Confirmation | Promoters |
| PRO-007 | Ticket Sales Milestone | Promoters |
| PRO-009 | Post-Show Summary | Promoters |
| PRO-010 | Waitlist Growth Notification | Promoters |
| PHO-004 | Deliverables Reminder | Photographers |
| VEN-001 | New Event at Venue | Venues |
| VEN-002 | Event Summary (Venue) | Venues |
| VEN-003 | Weekly Venue Schedule | Venues |
| AGN-004 | Artist Roster Update | Agencies |
| AGN-005 | Weekly Agency Digest | Agencies |
| CUS-008 | Early Bird / Presale | Customers |
| CUS-009 | Birthday Email | Customers |
| CUS-010 | Re-engagement | Customers |
| CUS-011 | Lineup Announced | Customers |
| FIN-005 | Xero Sync Confirmation | Admin |
| FIN-007 | Commission Report | Agencies |
| TOR-001 | Tour Created (email) | Tour managers |
| TOR-005 | Tour Financial Summary | Tour managers |
| MKT-001 | New Show Announcement | Subscribers |
| MKT-002 | Weekly Newsletter | Subscribers |
| MKT-003 | Monthly Comedian Newsletter | Comedians |
| MKT-004 | Abandoned Cart | Customers |
| MKT-005 | Referral Program | Customers |
| ADM-004 | New User Verification | Admin |

---

## Email Infrastructure Notes

### Sending Domains

| From Address | Purpose |
|---|---|
| `noreply@standupsydney.com` | System / transactional (no replies expected) |
| `hello@standupsydney.com` | Marketing, newsletters, welcome emails |
| `shows@standupsydney.com` | Event-related transactional (spots, lineups, applications) |
| `tickets@standupsydney.com` | Customer ticket-related communications |
| `accounts@standupsydney.com` | Financial / billing / invoicing |
| `deals@standupsydney.com` | Agency deal negotiations |
| `tours@standupsydney.com` | Tour management |
| `security@standupsydney.com` | Security alerts (password changes, new devices) |
| `alerts@standupsydney.com` | System alerts (admin/technical team) |
| `system@standupsydney.com` | Automated reports and summaries |

### Current Infrastructure
- **Sending:** AWS SES via Supabase Edge Function (`send-email`)
- **Templates:** TypeScript template functions in `src/templates/email/`
- **Notifications:** Supabase-backed notification system with real-time subscriptions

### Recommended Additions
- **Email preference center:** Allow users to control which email categories they receive
- **Unsubscribe handling:** One-click unsubscribe in all marketing emails (CAN-SPAM / Australian Spam Act compliance)
- **Email logging:** Track sends, opens, clicks, bounces for deliverability monitoring
- **Template engine:** Consider migrating to a shared template system (e.g., React Email, MJML) for consistent branding across all emails
- **Batch sending:** For marketing emails and digests, use queued batch sending to avoid rate limits

### Total Email Count

| Category | Must-Have | Nice-to-Have | Total |
|----------|-----------|--------------|-------|
| Platform / System | 4 | 3 | 7 |
| Comedian / Performer | 11 | 6 | 17 |
| Promoter / Event Manager | 5 | 5 | 10 |
| Photographer / Videographer | 4 | 1 | 5 |
| Venue / Organization | 1 | 3 | 4 |
| Agency / Manager | 4 | 2 | 6 |
| Customer / Audience | 7 | 4 | 11 |
| Financial / Billing | 5 | 3 | 8 |
| Tour Management | 4 | 1 | 5 |
| Marketing / Lifecycle | 1 | 4 | 5 |
| Admin / Internal | 4 | 1 | 5 |
| **TOTAL** | **50** | **33** | **83** |
