# P3.2: Event Application System

## **🎯 TASK OVERVIEW**
**Priority:** HIGH - Core comedian functionality
**Component:** Event application system at /Shows
**Current Issue:** Apply button doesn't change state or record applications

## **🔍 PROBLEM DETAILS**
- Comedian clicks "Apply" on event at /Shows
- Button doesn't change to "Applied" state
- Application is not recorded in database
- No feedback to user about application status
- Can potentially apply multiple times to same event

## **📁 FILES TO CHECK**
- `src/pages/Shows.tsx` - Shows listing page
- `src/components/Events/EventCard.tsx` - Event card with apply button
- `src/components/Events/ApplyButton.tsx` - Apply button component
- `src/hooks/useEventApplications.ts` - Application state management
- Application-related API calls and database schema

## **✅ ACCEPTANCE CRITERIA**
1. Comedian clicks "Apply" on event
2. Button immediately changes to "Applied" (optimistic update)
3. Application is recorded in database
4. Button state persists on page refresh
5. Cannot apply multiple times to same event
6. Clear success feedback to user
7. Application appears in comedian's dashboard

## **🔧 TECHNICAL REQUIREMENTS**
1. **Database schema for applications:**
   ```sql
   CREATE TABLE event_applications (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     event_id UUID REFERENCES events(id) NOT NULL,
     comedian_id UUID REFERENCES users(id) NOT NULL,
     status VARCHAR DEFAULT 'pending', -- pending, approved, rejected, hidden
     applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     
     -- Prevent duplicate applications
     CONSTRAINT unique_application UNIQUE (event_id, comedian_id)
   );
   ```

2. **Application state management:**
   - Check existing applications on page load
   - Optimistic UI updates for better UX
   - Handle network errors gracefully
   - Sync state across components

3. **Button state logic:**
   ```typescript
   const getButtonState = (eventId: string, applications: Application[]) => {
     const existingApp = applications.find(app => app.event_id === eventId);
     
     if (existingApp) {
       return { text: 'Applied', disabled: true, variant: 'success' };
     }
     return { text: 'Apply', disabled: false, variant: 'primary' };
   };
   ```

## **🔍 IMPLEMENTATION STRATEGY**
1. **Application hook:**
   ```typescript
   // src/hooks/useEventApplications.ts
   export const useEventApplications = () => {
     const [applications, setApplications] = useState([]);
     const [loading, setLoading] = useState(false);
     
     const applyToEvent = async (eventId: string) => {
       // Optimistic update
       setApplications(prev => [...prev, { event_id: eventId, status: 'pending' }]);
       
       try {
         await supabase.from('event_applications').insert({
           event_id: eventId,
           comedian_id: user.id
         });
       } catch (error) {
         // Revert optimistic update on error
         setApplications(prev => prev.filter(app => app.event_id !== eventId));
         throw error;
       }
     };
     
     return { applications, applyToEvent, loading };
   };
   ```

2. **Apply button component:**
   ```typescript
   // src/components/Events/ApplyButton.tsx
   const ApplyButton = ({ eventId, applications, onApply }) => {
     const hasApplied = applications.some(app => app.event_id === eventId);
     
     return (
       <button
         onClick={() => onApply(eventId)}
         disabled={hasApplied}
         className={hasApplied ? 'btn-success' : 'btn-primary'}
       >
         {hasApplied ? 'Applied ✓' : 'Apply Now'}
       </button>
     );
   };
   ```

## **🎨 UI/UX REQUIREMENTS**
1. **Button states:**
   - **Default:** "Apply Now" (blue/primary color)
   - **Applied:** "Applied ✓" (green/success color, disabled)
   - **Loading:** "Applying..." (disabled with spinner)
   - **Error:** "Apply" (red border, retry option)

2. **Success feedback:**
   - Button changes immediately (optimistic)
   - Toast notification: "Successfully applied to [Event Name]"
   - Optional: Show application in comedian dashboard

3. **Error handling:**
   - Network error → show retry option
   - Already applied → show "Already Applied" message
   - Event full → show "Event Full" message
   - Not eligible → show eligibility message

## **📊 APPLICATION TRACKING**
```typescript
// Application status workflow:
'pending' → Initial state when comedian applies
'approved' → Event organizer approves application  
'rejected' → Event organizer rejects application
'hidden' → Soft delete (positive language instead of "rejected")

// Comedian dashboard should show:
- Pending applications
- Approved gigs (upcoming performances)
- Application history
```

## **🔗 INTEGRATION POINTS**
1. **Admin dashboard:**
   - Show applications for each event
   - Approve/reject functionality
   - Application notifications

2. **Comedian dashboard:**
   - List all applications with status
   - Filter by status (pending, approved)
   - Quick apply to recommended events

3. **Event details:**
   - Show application count
   - Lineup management based on approved applications

## **🧪 TESTING INSTRUCTIONS**
1. **Test application flow:**
   - Navigate to /Shows as comedian
   - Click "Apply" on an event
   - Verify button changes to "Applied"
   - Refresh page → state should persist

2. **Test duplicate prevention:**
   - Try to apply to same event again
   - Should show "Already Applied" state
   - Database should not have duplicate entries

3. **Test error scenarios:**
   - Apply with no internet connection
   - Apply to non-existent event
   - Apply when event is full
   - Verify error messages are clear

4. **Test admin workflow:**
   - View applications in admin dashboard
   - Approve/reject applications
   - Verify comedian sees status updates

## **📋 DEFINITION OF DONE**
- [ ] Apply button changes state correctly
- [ ] Applications saved to database
- [ ] No duplicate applications possible
- [ ] State persists across page refreshes
- [ ] Success notifications implemented
- [ ] Error handling with retry options
- [ ] Applications visible in comedian dashboard
- [ ] Admin can view and manage applications
- [ ] Mobile-responsive apply interface
- [ ] Performance optimized for large event lists