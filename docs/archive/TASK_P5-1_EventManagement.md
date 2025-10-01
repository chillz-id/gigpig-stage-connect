# P5.1: Event Management Enhancement

## **🎯 TASK OVERVIEW**
**Priority:** MEDIUM - Admin workflow improvements
**Component:** Event management in admin dashboard
**Current Issue:** Limited event filtering, organization, and access

## **🔍 PROBLEM DETAILS**
- No date range filtering for events
- Events are not clickable to view details
- Need additional "New Event" button for easier access
- Event information is disorganized and takes up whole screen
- Need better event organization and navigation

## **📁 FILES TO CHECK**
- `src/pages/Admin/Events.tsx` - Admin events page
- `src/components/Admin/EventList.tsx` - Event list component
- `src/components/Admin/EventCard.tsx` - Event card component
- `src/components/Modal/EventDetailsModal.tsx` - Event details modal
- `src/components/Filters/DateRangePicker.tsx` - Date filtering

## **✅ ACCEPTANCE CRITERIA**
1. Date range picker for filtering events
2. Events are clickable to show details
3. Additional "New Event" button in prominent location
4. Organized event information display
5. Event details modal with comprehensive info
6. Improved event list layout and organization
7. Mobile-responsive event management

## **🔧 TECHNICAL REQUIREMENTS**
1. **Date range filtering:**
   ```typescript
   // Filter events by date range
   const filteredEvents = events.filter(event => {
     const eventDate = new Date(event.date);
     return eventDate >= dateRange.start && eventDate <= dateRange.end;
   });
   ```

2. **Clickable events:**
   ```typescript
   const EventCard = ({ event, onClick }) => (
     <div 
       className="event-card cursor-pointer hover:shadow-lg"
       onClick={() => onClick(event)}
     >
       <EventInfo event={event} />
     </div>
   );
   ```

3. **Event details modal:**
   ```typescript
   interface EventDetailsModalProps {
     event: Event;
     isOpen: boolean;
     onClose: () => void;
     onEdit: (event: Event) => void;
   }
   ```

## **🔍 IMPLEMENTATION STRATEGY**
1. **Enhanced events page:**
   ```typescript
   // src/pages/Admin/Events.tsx
   const AdminEvents = () => {
     const [events, setEvents] = useState([]);
     const [dateRange, setDateRange] = useState(getDefaultDateRange());
     const [selectedEvent, setSelectedEvent] = useState(null);
     const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
     
     const handleEventClick = (event) => {
       setSelectedEvent(event);
       setIsDetailsModalOpen(true);
     };
     
     return (
       <div className="admin-events">
         <div className="events-header">
           <h1>Event Management</h1>
           <div className="actions">
             <DateRangePicker value={dateRange} onChange={setDateRange} />
             <NewEventButton />
           </div>
         </div>
         
         <EventList 
           events={filteredEvents} 
           onEventClick={handleEventClick}
         />
         
         <EventDetailsModal
           event={selectedEvent}
           isOpen={isDetailsModalOpen}
           onClose={() => setIsDetailsModalOpen(false)}
         />
       </div>
     );
   };
   ```

2. **Organized event list:**
   ```typescript
   // src/components/Admin/EventList.tsx
   const EventList = ({ events, onEventClick }) => {
     const [viewMode, setViewMode] = useState('grid'); // grid or list
     
     return (
       <div className="event-list">
         <div className="list-controls">
           <ViewToggle mode={viewMode} onChange={setViewMode} />
           <SortOptions />
           <FilterOptions />
         </div>
         
         <div className={`events-container ${viewMode}`}>
           {events.map(event => (
             <EventCard
               key={event.id}
               event={event}
               onClick={onEventClick}
               viewMode={viewMode}
             />
           ))}
         </div>
       </div>
     );
   };
   ```

## **🎨 EVENT CARD DESIGN**
```typescript
// src/components/Admin/EventCard.tsx
const EventCard = ({ event, onClick, viewMode }) => (
  <div 
    className={`event-card ${viewMode} cursor-pointer`}
    onClick={() => onClick(event)}
  >
    <div className="event-image">
      {event.image_url ? (
        <img src={event.image_url} alt={event.title} />
      ) : (
        <div className="placeholder-image">🎤</div>
      )}
    </div>
    
    <div className="event-info">
      <h3 className="event-title">{event.title}</h3>
      <p className="event-date">{formatDate(event.date)}</p>
      <p className="event-venue">{event.venue?.name}</p>
      
      <div className="event-stats">
        <span className="tickets-sold">{event.tickets_sold} tickets</span>
        <span className="revenue">${event.revenue}</span>
      </div>
      
      <div className="event-status">
        <StatusBadge status={event.status} />
      </div>
    </div>
    
    <div className="event-actions" onClick={(e) => e.stopPropagation()}>
      <QuickActions event={event} />
    </div>
  </div>
);
```

## **📋 EVENT DETAILS MODAL**
```typescript
// src/components/Modal/EventDetailsModal.tsx
const EventDetailsModal = ({ event, isOpen, onClose, onEdit }) => {
  if (!event) return null;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <div className="event-details-modal">
        <div className="modal-header">
          <h2>{event.title}</h2>
          <div className="header-actions">
            <button onClick={() => onEdit(event)}>Edit Event</button>
            <button onClick={onClose}>×</button>
          </div>
        </div>
        
        <div className="modal-content">
          <div className="content-grid">
            <section className="event-info">
              <h3>Event Information</h3>
              <EventInfoDisplay event={event} />
            </section>
            
            <section className="ticket-sales">
              <h3>Ticket Sales</h3>
              <TicketSalesDisplay event={event} />
            </section>
            
            <section className="lineup">
              <h3>Lineup</h3>
              <LineupDisplay event={event} />
            </section>
            
            <section className="settlements">
              <h3>Settlements</h3>
              <SettlementsDisplay event={event} />
            </section>
          </div>
        </div>
      </div>
    </Modal>
  );
};
```

## **🔧 FILTERING AND SORTING**
1. **Date range filtering:**
   - This Week/Month/Quarter presets
   - Custom date range selection
   - Upcoming events filter
   - Past events filter

2. **Additional filters:**
   - Filter by status (Draft, Published, Cancelled)
   - Filter by venue
   - Filter by ticket sales (High/Medium/Low)
   - Filter by revenue range

3. **Sorting options:**
   - Sort by date (ascending/descending)
   - Sort by ticket sales
   - Sort by revenue
   - Sort by status

## **🎯 NEW EVENT BUTTON PLACEMENT**
```typescript
// Multiple "New Event" button locations
const NewEventButtons = () => (
  <>
    {/* Main header button */}
    <NewEventButton variant="primary" location="header" />
    
    {/* Floating action button */}
    <NewEventButton variant="fab" location="floating" />
    
    {/* Quick access in sidebar */}
    <NewEventButton variant="sidebar" location="sidebar" />
  </>
);
```

## **📱 MOBILE OPTIMIZATIONS**
1. **Responsive event cards:**
   - Stack information vertically on mobile
   - Touch-friendly click areas
   - Swipe gestures for quick actions

2. **Mobile event details:**
   - Full-screen modal on mobile
   - Tabbed content for easy navigation
   - Touch-optimized controls

## **🧪 TESTING INSTRUCTIONS**
1. **Test date filtering:**
   - Select different date ranges
   - Verify events filter correctly
   - Test preset date ranges
   - Ensure performance with large datasets

2. **Test event interactions:**
   - Click events to open details modal
   - Verify all event information displays
   - Test modal navigation and actions
   - Test closing modal

3. **Test "New Event" buttons:**
   - All button locations work
   - Navigate to event creation
   - Buttons are prominent and accessible

4. **Test mobile experience:**
   - Event list scrollable on mobile
   - Cards display properly on small screens
   - Modal is full-screen on mobile
   - Touch interactions work smoothly

## **📋 DEFINITION OF DONE**
- [ ] Date range picker filters events correctly
- [ ] Events are clickable and show details
- [ ] Additional "New Event" button added
- [ ] Event information is well-organized
- [ ] Event details modal comprehensive
- [ ] Mobile-responsive event management
- [ ] Filtering and sorting functionality
- [ ] Quick actions for event management
- [ ] Performance optimized for large event lists
- [ ] Proper loading and error states