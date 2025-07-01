# 🚀 **Stand Up Sydney Platform - Implementation PRD**

## **📋 Executive Summary**
Comprehensive platform improvements focusing on authentication, event management, user experience, and admin analytics. Priority on getting core functionality working for immediate event publishing and user onboarding.

---

## **🎯 Priority 1: Critical Authentication & Event Publishing** 
*Must be completed first - blocking current operations*

### **P1.1: Google Authentication System**
**Problem:** New users not saving properly, testing blocked
**Files:** `src/lib/auth.ts`, `src/components/Auth/`, `src/hooks/useAuth.ts`
**Acceptance Criteria:**
- Google Sign Up/In fully functional
- User profiles persist in Supabase after Google auth
- Role assignment (Comedian/Promoter/Admin) working
- Test user creation and login flow end-to-end

### **P1.2: Event Creation Authentication**
**Problem:** "Authentication Required" error when publishing events
**Files:** `src/pages/EventCreation.tsx`, `src/components/Events/CreateEventForm.tsx`
**Acceptance Criteria:**
- Authenticated users can successfully publish events
- Error message resolves and events save to database
- Event creation flow works for all user roles

### **P1.3: Google Maps Integration**
**Problem:** Maps component broken in event creation
**Files:** `src/components/Maps/`, event creation components
**Acceptance Criteria:**
- Google Maps displays in event creation form
- Address autocomplete working
- Coordinates save with event data
- Mobile-responsive map display

---

## **🎯 Priority 2: User Experience Core Features**

### **P2.1: Social Media Link Intelligence**
**Problem:** Manual URL entry required for social media
**Files:** `src/utils/socialLinks.ts`, profile components
**Expected Logic:**
- Instagram: `@chillzy` → `https://instagram.com/chillzy`
- TikTok: `@chillzy` → `https://tiktok.com/@chillzy`
- Works for all major platforms

### **P2.2: Media Upload Functionality**
**Problem:** Photo & Video buttons non-functional
**Files:** Profile components, media upload components
**Acceptance Criteria:**
- Photo upload working with preview
- Video upload with file type validation
- Files stored in Supabase Storage

### **P2.3: Invoice System Consolidation**
**Problem:** Duplicate invoice pages causing confusion
**Files:** Dashboard and Profile invoice components
**Acceptance Criteria:**
- Single unified invoice interface in Profile section
- Filter and search functionality moved from Dashboard
- Dashboard invoice page redirects to Profile invoices

---

## **🎯 Priority 3: Business Logic & Data Integrity**

### **P3.1: Vouches System Enhancement**
**Problem:** Users can give multiple vouches to same comedian
**Acceptance Criteria:**
- One vouch per comedian pair maximum
- Edit functionality through Vouch History
- Clear error message for duplicate attempts

### **P3.2: Event Application System**
**Problem:** Apply button needs state management
**Files:** Event detail pages, application components
**Acceptance Criteria:**
- "Apply" button changes to "Applied" after click
- Application recorded in database
- State persists on page refresh

### **P3.3: Date Range Filtering**
**Problem:** Earnings need time-based filtering
**Acceptance Criteria:**
- Date range picker with month/year controls
- Filter works on Total Earnings
- Default to current month

---

## **🎯 Priority 4: Dashboard & Admin Enhancements**

### **P4.1: Calendar Integration**
**Problem:** No calendar view for upcoming gigs
**Acceptance Criteria:**
- Calendar button on dashboard
- Shows upcoming confirmed gigs from Profile/Calendar
- Calendar view with event details

### **P4.2: Admin Analytics Overhaul**
**Problem:** Current analytics don't match business needs
**Changes Needed:**
- Replace user growth with tickets by provider
- Add tickets by suburb wheel chart
- Facebook Ads ROAS if API available
- Total Tickets Sold instead of Total Users

### **P4.3: Enhanced User Management**
**Problem:** Admin can't access user profiles easily
**Acceptance Criteria:**
- Clickable user names in admin panel
- Different icons: 😂 (Comedian), 🏴‍☠️ (Promoter)
- Quick access to user actions

---

## **🎯 Priority 5: Advanced Features & Polish**

### **P5.1: Event Management Enhancement**
**Acceptance Criteria:**
- Date range filtering for events
- Clickable events showing details
- Additional "New Event" button

### **P5.2: Financial Integration**
**Acceptance Criteria:**
- XERO disconnect button under "Connected" status
- Confirmation dialog for disconnect

### **P5.3: Interactive Notifications & Messages**
**Acceptance Criteria:**
- Notification bell with blinking red dot for new items
- Message icon with red dot for unread messages
- Purple theme consistency

### **P5.4: Navigation & Theme Improvements**
**Acceptance Criteria:**
- Business/Pleasure toggle with rose icon (filled/outlined)
- Animated hover text
- Profile picture in navigation
- Magic UI Dock implementation

---

## **🔧 Technical Stack**
- **Frontend:** Vite + React + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Deployment:** Vercel
- **Maps:** Google Maps API
- **UI Components:** Magic UI, shadcn/ui

## **📅 Implementation Order**
1. **Critical Path:** P1.1 → P1.2 → P1.3 (Get events publishing working)
2. **User Experience:** P2.1 → P2.2 → P2.3 (Improve core UX)
3. **Business Logic:** P3.1 → P3.2 → P3.3 (Data integrity)
4. **Admin Tools:** P4.1 → P4.2 → P4.3 (Admin functionality)
5. **Polish:** P5.1 → P5.2 → P5.3 → P5.4 (Final touches)

---

*Focus on getting Priority 1 working first - this unblocks event publishing and user registration.*