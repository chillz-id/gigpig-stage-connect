# P5.3: Interactive Notifications & Messages

## **🎯 TASK OVERVIEW**
**Priority:** MEDIUM - User experience enhancement
**Component:** Notification and messaging system
**Current Issue:** Static UI elements, no interactive indicators for new items

## **🔍 PROBLEM DETAILS**
- Notification bell is static (no interactivity)
- Message icon is static (no new message indicators)
- Need blinking red dot for new notifications
- Need blinking red dot for new messages
- Purple theme consistency required
- Need proper read/unread state management

## **📁 FILES TO CHECK**
- `src/components/Navigation/NotificationBell.tsx` - Notification component
- `src/components/Navigation/MessageIcon.tsx` - Message component
- `src/hooks/useNotifications.ts` - Notification state management
- `src/hooks/useMessages.ts` - Message state management
- Navigation and header components

## **✅ ACCEPTANCE CRITERIA**
1. Notification bell with blinking red dot for new notifications
2. Message icon with blinking red dot for new messages
3. Purple theme consistency maintained
4. Read/unread state management working
5. Real-time updates for new notifications/messages
6. Click interactions open respective panels
7. Proper accessibility for visual indicators

## **🔧 TECHNICAL REQUIREMENTS**
1. **Blinking indicator animation:**
   ```css
   @keyframes blink {
     0% { opacity: 1; }
     50% { opacity: 0.3; }
     100% { opacity: 1; }
   }
   
   .notification-dot {
     animation: blink 2s infinite;
     background-color: #ef4444; /* red */
     border-radius: 50%;
     width: 8px;
     height: 8px;
   }
   ```

2. **Notification state management:**
   ```typescript
   interface NotificationState {
     notifications: Notification[];
     unreadCount: number;
     isLoading: boolean;
     lastChecked: Date;
   }
   
   interface MessageState {
     messages: Message[];
     unreadCount: number;
     isLoading: boolean;
     lastChecked: Date;
   }
   ```

3. **Real-time updates:**
   ```typescript
   // WebSocket or polling for real-time updates
   const useRealtimeNotifications = () => {
     const [notifications, setNotifications] = useState([]);
     
     useEffect(() => {
       const subscription = supabase
         .channel('notifications')
         .on('postgres_changes', 
           { event: 'INSERT', schema: 'public', table: 'notifications' },
           (payload) => {
             setNotifications(prev => [payload.new, ...prev]);
           }
         )
         .subscribe();
       
       return () => subscription.unsubscribe();
     }, []);
     
     return notifications;
   };
   ```

## **🔍 IMPLEMENTATION STRATEGY**
1. **Enhanced notification bell:**
   ```typescript
   // src/components/Navigation/NotificationBell.tsx
   const NotificationBell = () => {
     const { notifications, unreadCount, markAsRead } = useNotifications();
     const [isOpen, setIsOpen] = useState(false);
     
     return (
       <div className="notification-bell-container">
         <button
           onClick={() => setIsOpen(!isOpen)}
           className="notification-bell"
           aria-label={`${unreadCount} unread notifications`}
         >
           <BellIcon className="h-6 w-6 text-purple-600" />
           {unreadCount > 0 && (
             <div className="notification-indicator">
               <div className="notification-dot" />
               <span className="notification-count">{unreadCount}</span>
             </div>
           )}
         </button>
         
         {isOpen && (
           <NotificationPanel
             notifications={notifications}
             onClose={() => setIsOpen(false)}
             onMarkAsRead={markAsRead}
           />
         )}
       </div>
     );
   };
   ```

2. **Enhanced message icon:**
   ```typescript
   // src/components/Navigation/MessageIcon.tsx
   const MessageIcon = () => {
     const { messages, unreadCount, markAsRead } = useMessages();
     const [isOpen, setIsOpen] = useState(false);
     
     return (
       <div className="message-icon-container">
         <button
           onClick={() => setIsOpen(!isOpen)}
           className="message-icon"
           aria-label={`${unreadCount} unread messages`}
         >
           <ChatBubbleIcon className="h-6 w-6 text-purple-600" />
           {unreadCount > 0 && (
             <div className="message-indicator">
               <div className="message-dot" />
               <span className="message-count">{unreadCount}</span>
             </div>
           )}
         </button>
         
         {isOpen && (
           <MessagePanel
             messages={messages}
             onClose={() => setIsOpen(false)}
             onMarkAsRead={markAsRead}
           />
         )}
       </div>
     );
   };
   ```

## **🎨 PURPLE THEME STYLING**
```typescript
// src/styles/purple-theme.css
.purple-theme {
  --primary-purple: #8b5cf6;
  --light-purple: #a78bfa;
  --dark-purple: #7c3aed;
  --purple-bg: #f3f4f6;
}

.notification-bell,
.message-icon {
  color: var(--primary-purple);
  background: var(--purple-bg);
  border: 1px solid var(--light-purple);
  border-radius: 8px;
  padding: 8px;
  transition: all 0.2s;
}

.notification-bell:hover,
.message-icon:hover {
  background: var(--light-purple);
  color: white;
}

.notification-panel,
.message-panel {
  background: var(--purple-bg);
  border: 1px solid var(--light-purple);
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(139, 92, 246, 0.1);
}
```

## **🔔 NOTIFICATION PANEL COMPONENT**
```typescript
// src/components/Navigation/NotificationPanel.tsx
const NotificationPanel = ({ notifications, onClose, onMarkAsRead }) => {
  return (
    <div className="notification-panel">
      <div className="panel-header">
        <h3>Notifications</h3>
        <div className="header-actions">
          <button onClick={() => onMarkAsRead('all')}>
            Mark All Read
          </button>
          <button onClick={onClose}>×</button>
        </div>
      </div>
      
      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <p>No notifications</p>
          </div>
        ) : (
          notifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
            />
          ))
        )}
      </div>
      
      <div className="panel-footer">
        <Link to="/notifications">View All Notifications</Link>
      </div>
    </div>
  );
};
```

## **💬 MESSAGE PANEL COMPONENT**
```typescript
// src/components/Navigation/MessagePanel.tsx
const MessagePanel = ({ messages, onClose, onMarkAsRead }) => {
  return (
    <div className="message-panel">
      <div className="panel-header">
        <h3>Messages</h3>
        <div className="header-actions">
          <button onClick={() => onMarkAsRead('all')}>
            Mark All Read
          </button>
          <button onClick={onClose}>×</button>
        </div>
      </div>
      
      <div className="message-list">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>No new messages</p>
          </div>
        ) : (
          messages.map(message => (
            <MessageItem
              key={message.id}
              message={message}
              onMarkAsRead={onMarkAsRead}
            />
          ))
        )}
      </div>
      
      <div className="panel-footer">
        <Link to="/messages">View All Messages</Link>
      </div>
    </div>
  );
};
```

## **🔄 REAL-TIME STATE MANAGEMENT**
```typescript
// src/hooks/useNotifications.ts
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    
    setNotifications(data);
    setUnreadCount(data.filter(n => !n.read_at).length);
  }, [user.id]);
  
  // Mark notifications as read
  const markAsRead = useCallback(async (notificationId) => {
    if (notificationId === 'all') {
      await supabase
        .from('notifications')
        .update({ read_at: new Date() })
        .eq('user_id', user.id)
        .is('read_at', null);
    } else {
      await supabase
        .from('notifications')
        .update({ read_at: new Date() })
        .eq('id', notificationId);
    }
    
    await fetchNotifications();
  }, [fetchNotifications]);
  
  // Real-time subscription
  useEffect(() => {
    fetchNotifications();
    
    const subscription = supabase
      .channel(`notifications:${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, fetchNotifications)
      .subscribe();
    
    return () => subscription.unsubscribe();
  }, [fetchNotifications, user.id]);
  
  return { notifications, unreadCount, markAsRead, fetchNotifications };
};
```

## **🧪 TESTING INSTRUCTIONS**
1. **Test notification indicators:**
   - Create new notification in database
   - Verify red dot appears and blinks
   - Verify count badge shows correct number
   - Click bell to open notification panel

2. **Test message indicators:**
   - Send new message to user
   - Verify red dot appears and blinks
   - Verify count badge shows correct number
   - Click icon to open message panel

3. **Test read/unread functionality:**
   - Mark notifications as read
   - Verify indicators disappear
   - Test "Mark All Read" functionality
   - Verify counts update correctly

4. **Test purple theme:**
   - Verify all elements use purple theme
   - Test hover states and interactions
   - Check theme consistency across components

## **📋 DEFINITION OF DONE**
- [ ] Notification bell with blinking red dot for new items
- [ ] Message icon with blinking red dot for new items
- [ ] Purple theme applied consistently
- [ ] Read/unread state management working
- [ ] Real-time updates for new notifications/messages
- [ ] Click interactions open respective panels
- [ ] Accessible visual indicators
- [ ] Mobile-responsive notification/message panels
- [ ] Performance optimized for real-time updates
- [ ] Proper error handling for network issues