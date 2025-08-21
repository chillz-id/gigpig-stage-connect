# Complete Fix Plan for Core Functionality

## 1. **Events - Fix Database Query Issues**
**Issue**: Field name mismatches causing 400 errors
- `getEventsWithDetails` uses `date` field but database has `event_date`
- `stage_manager_id` vs `promoter_id` inconsistency
- Missing success handling in CreateEventForm

**Fix**: 
- Update all date queries to use `event_date`
- Fix field name mapping in create methods
- Add proper navigation after event creation

## 2. **Event Templates - Fix Banner Loading**
**Issue**: Banner images don't load in templates
- Bug in `EventBannerUpload.tsx` line 140: uses `bannerUrl` instead of `imageUrl`
- Templates intentionally exclude banner URLs for storage reasons

**Fix**:
- Fix display bug in EventBannerUpload component
- Optionally add banner support to templates

## 3. **Template Delete with Confirmation**
**Issue**: No delete functionality exists
- Need to add 'x' button to each template
- Need confirmation dialog
- Need mobile press-and-hold detection

**Fix**:
- Add delete button to template selection dropdown
- Implement AlertDialog confirmation
- Add mobile touch handlers

## 4. **Applications - Database Schema Issues**
**Issue**: Field mapping inconsistencies and missing integration
- `created_at` vs `applied_at` confusion
- Missing spot assignment integration
- No notification system for status changes

**Fix**:
- Align database field mappings
- Connect application approval to spot assignment
- Add notification system

## 5. **Spot Confirmation - Missing Backend Integration**
**Issue**: 85% implemented but uses mock data
- Database migrations not applied (confirmation fields missing)
- No real confirmation API endpoints
- Mock data instead of real confirmations

**Fix**:
- Apply database migrations for confirmation fields
- Implement real confirmation API endpoints
- Connect UI to real data, remove mock data

## 6. **Ticket Sale Data Sync - Missing API Integrations**
**Issue**: Database schema ready but no sync services
- No external API integrations (Humanitix, Eventbrite, etc.)
- No webhook handlers for real-time updates
- No scheduled sync jobs

**Fix**:
- Implement platform-specific API services
- Create webhook handlers for each platform
- Add scheduled sync jobs for periodic updates

## 7. **Invoices - Database Schema Mismatches**
**Issue**: 90% complete but blocked by schema inconsistencies
- Field name mismatches (`subtotal` vs `subtotal_amount`)
- Missing fields (`invoice_type`, `comedian_id`)
- RLS policies too restrictive (only promoters can access)
- Xero integration not configured

**Fix**:
- Apply database migration to add missing fields
- Fix RLS policies to support comedians
- Configure Xero environment variables
- Align TypeScript types with database schema

## **Priority Order**:
1. **Events** (2-3 hours) - Critical for basic functionality
2. **Invoices** (6-8 hours) - High business value
3. **Spot Confirmation** (15-22 hours) - Complex but mostly built
4. **Applications** (8-12 hours) - Needs workflow integration
5. **Event Templates** (1-2 hours) - Simple bug fixes
6. **Ticket Sync** (20-30 hours) - Requires external integrations

**Total Estimated Time**: 52-75 hours of development work

---

## **Detailed Analysis from Subagents**

### **Events Analysis**
- Database field mismatches causing 400 errors in event queries
- `getEventsWithDetails` function uses wrong field names
- CreateEventForm lacks proper success handling and navigation
- Event editing and publishing workflow needs fixing

### **Event Templates Analysis**
- Banner loading broken due to variable name bug in EventBannerUpload.tsx
- Templates intentionally exclude banner images for storage optimization
- Template system works but lacks delete functionality
- Need confirmation dialogs and mobile interaction support

### **Applications Analysis**
- Database schema mostly correct but field mappings inconsistent
- Application workflow exists but missing integration with spot assignment
- No notification system for status changes
- End-to-end workflow needs completion

### **Spot Confirmation Analysis**
- 85% implemented with excellent UI components
- Database migrations exist but not applied
- Uses mock data instead of real confirmations
- Missing API endpoints for confirmation workflow
- Comprehensive test suite ready but will fail due to missing backend

### **Ticket Sale Data Sync Analysis**
- Database schema well-designed and ready
- Frontend components exist for manual management
- Missing all external API integrations (Humanitix, Eventbrite, etc.)
- No webhook handlers or scheduled sync jobs
- Platform support infrastructure ready but not connected

### **Invoices Analysis**
- 90% complete with comprehensive frontend and backend
- Database schema evolution created field mismatches
- Missing critical fields (invoice_type, comedian_id)
- RLS policies too restrictive for comedian access
- Xero integration code exists but not configured
- Type system mismatches with database schema

## **Next Steps When Ready**
1. Start with Events (quickest wins)
2. Move to Invoices (high business value)
3. Work through remaining items by priority
4. Test each system thoroughly before moving to next

**Status**: Plan saved and ready for implementation when you return!