# P4.1: Calendar Integration

## **🎯 TASK OVERVIEW**
**Priority:** MEDIUM - Dashboard enhancement
**Component:** Calendar button and gig calendar view
**Current Issue:** No calendar view for upcoming confirmed gigs

## **🔍 PROBLEM DETAILS**
- Dashboard lacks calendar functionality
- No way to view upcoming confirmed gigs in calendar format
- Need Calendar button on dashboard
- Should link to Profile/Calendar section
- Calendar should show only confirmed gigs

## **📁 FILES TO CHECK**
- `src/pages/Dashboard/ComedianDashboard.tsx` - Main dashboard page
- `src/pages/Profile/Calendar.tsx` - Profile calendar section
- `src/components/Calendar/GigCalendar.tsx` - Calendar component
- `src/hooks/useGigCalendar.ts` - Calendar data management
- Gig/event data with status filtering

## **✅ ACCEPTANCE CRITERIA**
1. Calendar button added to comedian dashboard
2. Button links to Profile/Calendar section
3. Calendar displays upcoming confirmed gigs
4. Month/week/day view options
5. Click on gig shows event details
6. Mobile-friendly calendar interface
7. Proper loading and empty states

## **🔧 TECHNICAL REQUIREMENTS**
1. **Dashboard calendar button:**
   - Prominent placement on dashboard
   - Clear calendar icon with label
   - Navigate to `/profile/calendar`
   - Show count of upcoming gigs

2. **Calendar component:**
   - Month view as default
   - Week and day view options
   - Gig events displayed clearly
   - Click events for details
   - Navigation between months

3. **Gig filtering:**
   ```typescript
   // Only show confirmed gigs
   const confirmedGigs = gigs.filter(gig => 
     gig.status === 'confirmed' && 
     gig.date >= new Date()
   );
   ```

## **🔍 IMPLEMENTATION STRATEGY**
1. **Calendar button on dashboard:**
   ```typescript
   // src/pages/Dashboard/ComedianDashboard.tsx
   const CalendarButton = ({ upcomingGigCount }) => (
     <Link to="/profile/calendar" className="calendar-button">
       <CalendarIcon className="w-6 h-6" />
       <div>
         <h3>Calendar</h3>
         <p>{upcomingGigCount} upcoming gigs</p>
       </div>
     </Link>
   );
   ```

2. **Calendar component implementation:**
   ```typescript
   // src/components/Calendar/GigCalendar.tsx
   interface GigEvent {
     id: string;
     title: string;
     date: Date;
     venue: string;
     time: string;
     status: 'confirmed' | 'pending' | 'cancelled';
   }
   
   const GigCalendar = ({ gigs }) => {
     const [view, setView] = useState<'month' | 'week' | 'day'>('month');
     const [currentDate, setCurrentDate] = useState(new Date());
     
     return (
       <div className="gig-calendar">
         <CalendarHeader 
           view={view} 
           setView={setView}
           currentDate={currentDate}
           setCurrentDate={setCurrentDate}
         />
         <CalendarGrid 
           gigs={gigs}
           view={view}
           currentDate={currentDate}
         />
       </div>
     );
   };
   ```

3. **Gig data hook:**
   ```typescript
   // src/hooks/useGigCalendar.ts
   export const useGigCalendar = () => {
     const [gigs, setGigs] = useState([]);
     const [loading, setLoading] = useState(true);
     
     const fetchUpcomingGigs = useCallback(async () => {
       const { data } = await supabase
         .from('gigs')
         .select('*, events(*)')
         .eq('comedian_id', user.id)
         .eq('status', 'confirmed')
         .gte('date', new Date().toISOString())
         .order('date', { ascending: true });
       
       setGigs(data);
       setLoading(false);
     }, [user.id]);
     
     return { gigs, loading, fetchUpcomingGigs };
   };
   ```

## **🎨 UI/UX REQUIREMENTS**
1. **Dashboard calendar button:**
   ```
   [📅 Calendar]
   [ 5 upcoming gigs ]
   ```
   - Clear calendar icon
   - Gig count indicator
   - Hover state with preview
   - Click navigates to Profile/Calendar

2. **Calendar view features:**
   - **Month view:** Full month grid with gig indicators
   - **Week view:** Week timeline with detailed gig info
   - **Day view:** Single day with full gig details
   - **Gig indicators:** Color-coded by venue or type

3. **Calendar interactions:**
   - Click gig → show gig details modal
   - Navigate months with arrow buttons
   - Today button to return to current date
   - View toggle buttons (Month/Week/Day)

## **📱 MOBILE CONSIDERATIONS**
1. **Responsive calendar:**
   - Month view adapts to small screens
   - Week view scrolls horizontally
   - Touch-friendly navigation
   - Swipe gestures for month navigation

2. **Mobile optimizations:**
   - Simplified view for small screens
   - Touch-friendly gig selection
   - Optimized loading for mobile data
   - Proper text sizing and contrast

## **🔗 INTEGRATION FEATURES**
1. **Gig details modal:**
   - Event name and description
   - Venue and address
   - Performance time
   - Payment details
   - Contact information

2. **Calendar actions:**
   - Add to personal calendar (Google/Apple)
   - Get directions to venue
   - Contact event organizer
   - View lineup for event

3. **Filtering options:**
   - Filter by venue
   - Filter by event type
   - Show/hide past events
   - Search by event name

## **📊 CALENDAR DATA STRUCTURE**
```typescript
interface CalendarGig {
  id: string;
  eventId: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  venue: {
    name: string;
    address: string;
    coordinates: { lat: number; lng: number };
  };
  payment: {
    amount: number;
    status: 'pending' | 'paid';
  };
  status: 'confirmed' | 'pending' | 'cancelled';
  type: 'recurring' | 'oneTime';
}
```

## **🧪 TESTING INSTRUCTIONS**
1. **Test dashboard integration:**
   - Calendar button displays on dashboard
   - Shows correct count of upcoming gigs
   - Click navigates to Profile/Calendar
   - Button updates when gigs change

2. **Test calendar functionality:**
   - Month view shows all gigs correctly
   - Week view displays detailed timeline
   - Day view shows full gig information
   - Navigation between dates works

3. **Test gig interactions:**
   - Click gig opens details modal
   - Modal shows all relevant information
   - Actions (directions, contact) work
   - Modal closes properly

4. **Test mobile experience:**
   - Calendar responsive on mobile
   - Touch navigation works
   - Gig selection easy on touch
   - Performance acceptable on mobile

## **📋 DEFINITION OF DONE**
- [ ] Calendar button added to dashboard
- [ ] Button shows upcoming gig count
- [ ] Links to Profile/Calendar section
- [ ] Calendar displays confirmed gigs only
- [ ] Month/week/day view options
- [ ] Click gigs for details modal
- [ ] Mobile-responsive calendar interface
- [ ] Proper loading states
- [ ] Empty state for no upcoming gigs
- [ ] Navigation between months/weeks works