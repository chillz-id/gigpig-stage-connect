# 🚀 Claude Code Implementation Guide

## **📋 Complete Task Files Created**
I've created detailed task files for implementing the Stand Up Sydney platform fixes:

### **🎯 Priority 1: Critical (Do First)**
1. **`TASK_P1-1_GoogleAuth.md`** - Fix Google authentication system
2. **`TASK_P1-2_EventPublishing.md`** - Fix event publishing authentication error  
3. **`TASK_P1-3_GoogleMaps.md`** - Fix Google Maps integration

### **🎯 Priority 2: User Experience**
4. **`TASK_P2-1_SocialLinks.md`** - Social media link intelligence (@username conversion)
5. **`TASK_P2-2_MediaUpload.md`** - Photo & Video upload functionality
6. **`TASK_P2-3_InvoiceConsolidation.md`** - Consolidate invoice system

### **🎯 Priority 3: Business Logic**
7. **`TASK_P3-1_VouchesSystem.md`** - One vouch per comedian pair with edit functionality
8. **`TASK_P3-2_EventApplications.md`** - Apply button state management and applications
9. **`TASK_P3-3_DateRangeFiltering.md`** - Date range filtering for earnings

### **🎯 Priority 4: Dashboard & Admin**
10. **`TASK_P4-1_CalendarIntegration.md`** - Calendar button and gig calendar view
11. **`TASK_P4-2_AdminAnalytics.md`** - Admin analytics overhaul (tickets by provider, suburb charts, ROAS)
12. **`TASK_P4-3_UserManagement.md`** - Enhanced user management with clickable profiles and icons

### **🎯 Priority 5: Polish & Advanced Features**
13. **`TASK_P5-1_EventManagement.md`** - Event management enhancement with date filtering
14. **`TASK_P5-2_XeroIntegration.md`** - XERO disconnect functionality
15. **`TASK_P5-3_InteractiveNotifications.md`** - Interactive notifications & messages with blinking indicators
16. **`TASK_P5-4_NavigationTheme.md`** - Navigation improvements with Magic UI Dock and Business/Pleasure toggle

---

## **🔧 How to Use with Claude Code**

### **Option 1: Work Through Priority Order (RECOMMENDED)**
```bash
# Start with Priority 1 (Critical) - Do these first!
claude-code "Implement Priority 1.1 from TASK_P1-1_GoogleAuth.md - fix Google authentication so users save properly"
claude-code "Implement Priority 1.2 from TASK_P1-2_EventPublishing.md - fix the authentication error when publishing events" 
claude-code "Implement Priority 1.3 from TASK_P1-3_GoogleMaps.md - fix Google Maps integration in event creation"

# Then Priority 2 (User Experience)
claude-code "Implement Priority 2.1 from TASK_P2-1_SocialLinks.md - add social media link intelligence"
claude-code "Implement Priority 2.2 from TASK_P2-2_MediaUpload.md - make photo and video upload buttons functional"
claude-code "Implement Priority 2.3 from TASK_P2-3_InvoiceConsolidation.md - consolidate the invoice system"

# Continue with Priority 3, 4, 5...
```

### **Option 2: Focus on Specific Issues**
```bash
# Critical business blockers first
claude-code "I need to fix Google authentication ASAP - users aren't saving after OAuth. Use TASK_P1-1_GoogleAuth.md"
claude-code "Fix event publishing error - 'Authentication Required' appears even when logged in. See TASK_P1-2_EventPublishing.md"

# Quick wins for user experience
claude-code "Add social media link intelligence - convert @username to full URLs. Details in TASK_P2-1_SocialLinks.md"
claude-code "Make photo and video upload buttons functional using TASK_P2-2_MediaUpload.md"
```

### **Option 3: Admin Dashboard Focus**
```bash
# Admin improvements
claude-code "Overhaul admin analytics using TASK_P4-2_AdminAnalytics.md - need tickets by provider and suburb charts"
claude-code "Enhance user management from TASK_P4-3_UserManagement.md - make user names clickable with role icons"
```

---

## **⚡ Quick Start Commands (Copy & Paste)**

### **🚨 CRITICAL - Do These First:**
```bash
claude-code "Work on TASK_P1-1_GoogleAuth.md - Google authentication is broken, users aren't saving after OAuth. This is blocking all testing."

claude-code "Work on TASK_P1-2_EventPublishing.md - fix the 'Authentication Required' error when publishing events. This is blocking event creation."

claude-code "Work on TASK_P1-3_GoogleMaps.md - fix Google Maps integration that's currently broken in event creation."
```

### **🎯 HIGH IMPACT - Do These Next:**
```bash
claude-code "Implement TASK_P2-1_SocialLinks.md - add smart social media link conversion (@username to full URLs)"

claude-code "Implement TASK_P3-2_EventApplications.md - make the Apply button work and change to 'Applied' state"

claude-code "Implement TASK_P2-2_MediaUpload.md - make photo and video upload buttons functional"
```

### **📊 ADMIN IMPROVEMENTS:**
```bash
claude-code "Implement TASK_P4-2_AdminAnalytics.md - overhaul admin analytics with tickets by provider and suburb charts"

claude-code "Implement TASK_P4-3_UserManagement.md - make user names clickable and add role icons (😂 for comedians, 🏴‍☠️ for promoters)"
```

---

## **📁 Project Structure Context**
- **Tech Stack:** Vite + React + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Deployment:** Vercel
- **UI:** Magic UI components + shadcn/ui

---

## **✅ Implementation Checklist**

### **Priority 1 (Critical - Must Complete First):**
- [ ] P1.1: Google Auth - Users saving after OAuth ⚠️ **BLOCKING**
- [ ] P1.2: Event Publishing - Authentication error fix ⚠️ **BLOCKING**  
- [ ] P1.3: Google Maps - Fix integration ⚠️ **BLOCKING**

### **Priority 2 (User Experience):**
- [ ] P2.1: Social Media Links - @username conversion
- [ ] P2.2: Media Upload - Photo/video buttons functional
- [ ] P2.3: Invoice System - Consolidate duplicate pages

### **Priority 3 (Business Logic):**
- [ ] P3.1: Vouches - One per comedian with edit functionality
- [ ] P3.2: Event Applications - Apply button state management
- [ ] P3.3: Date Filtering - Earnings date range picker

### **Priority 4 (Admin & Dashboard):**
- [ ] P4.1: Calendar - Add calendar button and view
- [ ] P4.2: Analytics - Tickets by provider, suburb charts, ROAS
- [ ] P4.3: User Management - Clickable profiles, role icons

### **Priority 5 (Polish & Advanced):**
- [ ] P5.1: Event Management - Date filtering, clickable events
- [ ] P5.2: XERO Integration - Disconnect functionality
- [ ] P5.3: Notifications - Interactive with blinking indicators
- [ ] P5.4: Navigation - Magic UI Dock, Business/Pleasure toggle

---

## **📝 Success Criteria**
- ✅ Users can successfully create and publish events
- ✅ New user registration and profile creation works
- ✅ Admin dashboard provides actionable business insights
- ✅ User experience flows are intuitive and error-free
- ✅ Platform ready for production event publishing

---

## **💡 Pro Tips:**
1. **Start with Priority 1** - These are blocking core functionality
2. **Test after each task** - Verify functionality before moving on
3. **Use the acceptance criteria** - Each task has clear success metrics
4. **Check the files mentioned** - Each task specifies exact files to modify
5. **Mobile test important features** - Many tasks have mobile considerations

**🎯 Goal: Get Priority 1 working first so you can start publishing events and testing the platform!**