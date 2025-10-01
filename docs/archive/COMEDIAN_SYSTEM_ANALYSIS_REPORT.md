# Stand Up Sydney Comedian System Analysis Report

## Executive Summary

The Comedian System in Stand Up Sydney has been thoroughly analyzed. While the core infrastructure exists, there are critical issues that need immediate attention, particularly around database relationships and RLS policies.

## Current System Status

### ✅ Working Components

1. **Database Tables** - All core tables exist:
   - `profiles` (4 records)
   - `applications` (0 records)
   - `vouches` (0 records)
   - `comedian_media` (0 records)
   - `events` (3 open events)
   - `calendar_integrations` (exists)

2. **Profile System**:
   - 4 profiles exist in the database
   - Profile structure includes all comedian-specific fields:
     - `stage_name`, `bio`, `profile_slug`
     - `custom_show_types`, `years_experience`
     - Social media links
     - Contact preferences
   - 3/4 profiles have custom URL slugs

3. **User Roles**:
   - Role distribution: 3 comedians, 1 admin, 1 promoter, 1 member
   - Proper role assignment system in place

4. **Frontend Components** (19/20 present):
   - ComedianProfileLayout.tsx ✅
   - ComedianHeader.tsx ✅
   - ComedianBio.tsx ✅
   - ComedianMedia.tsx ✅
   - ComedianAvailabilityCalendar.tsx ✅
   - ComedianApplications.tsx ❌ (missing or renamed)
   - Plus 14 other supporting components

### ❌ Critical Issues

1. **Database Relationships**:
   - Foreign key relationships between tables are not properly configured
   - Applications cannot reference profiles (missing FK constraint)
   - Vouches cannot reference profiles (missing FK constraint)
   - This prevents the application and vouch systems from working

2. **RLS (Row Level Security) Policies**:
   - Anonymous users cannot view profiles (returns 0 results)
   - This breaks public comedian profile pages
   - Needs policies to allow public profile viewing

3. **Empty Data**:
   - No applications exist (system untested)
   - No vouches exist (system untested)
   - No media uploaded (system untested)

4. **Frontend Issues**:
   - Dev server has permission issues with .env file
   - ComedianApplications.tsx component appears to be missing

## System Architecture

### Database Schema
```
profiles
├── id (UUID, FK to auth.users)
├── email, name, stage_name
├── bio, location, avatar_url
├── profile_slug (for custom URLs)
├── social media links
└── comedian-specific fields

applications
├── id, comedian_id (FK to profiles)
├── event_id (FK to events)
├── status, message, spot_type
└── timestamps

vouches
├── id, voucher_id (FK to profiles)
├── vouchee_id (FK to profiles)
├── message, rating
└── created_at

comedian_media
├── id, user_id (FK to profiles)
├── media_type, media_url
├── title, description, tags
└── is_featured
```

### Application Flow
1. Comedian creates profile → gets role assignment
2. Views available events → can apply
3. Submits application → promoter reviews
4. Gets accepted/rejected → receives notification
5. Can upload media → build portfolio
6. Can give/receive vouches → build reputation

## Fixes Required

### 1. Database Fixes (CRITICAL)
```sql
-- Fix foreign key relationships
ALTER TABLE applications 
  ADD CONSTRAINT applications_comedian_id_fkey 
  FOREIGN KEY (comedian_id) REFERENCES profiles(id);

ALTER TABLE vouches 
  ADD CONSTRAINT vouches_voucher_id_fkey 
  FOREIGN KEY (voucher_id) REFERENCES profiles(id);

-- Fix RLS policies
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT USING (true);
```

### 2. Missing Components
- Investigate missing ComedianApplications.tsx
- May be integrated into other components or renamed

### 3. Test Data Creation
- Create sample applications to test workflow
- Create sample vouches to test peer recommendations
- Upload sample media to test portfolio system

## Recommendations

### Immediate Actions (Priority 1)
1. Apply database relationship fixes (`fix-comedian-system-*.sql`)
2. Fix RLS policies to allow public profile viewing
3. Test application flow with existing events
4. Resolve dev server permission issues

### Short-term Actions (Priority 2)
1. Create test applications and vouches
2. Upload sample media for testing
3. Verify all profile slugs are properly set
4. Test calendar integration functionality

### Long-term Improvements (Priority 3)
1. Add profile completion tracking
2. Implement comedian analytics dashboard
3. Add automated vouch request system
4. Enhance media gallery with categories

## Testing Checklist

- [ ] Can view comedian profiles without login
- [ ] Can apply to events as comedian
- [ ] Application status updates work
- [ ] Can upload photos/videos to portfolio
- [ ] Can give and receive vouches
- [ ] Profile URLs work (/comedian/slug)
- [ ] Calendar sync functionality
- [ ] Email notifications for applications

## Conclusion

The Comedian System has a solid foundation but requires immediate attention to database relationships and RLS policies. Once these critical issues are resolved, the system should be fully functional. The lack of test data suggests the system hasn't been thoroughly tested in production yet.

**Overall Health Score: 6/10** - Infrastructure exists but needs configuration and testing.