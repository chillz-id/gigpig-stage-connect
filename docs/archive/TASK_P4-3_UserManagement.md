# P4.3: Enhanced User Management

## **🎯 TASK OVERVIEW**
**Priority:** MEDIUM - Admin efficiency improvement
**Component:** Admin user management interface
**Current Issue:** Admin can't easily access user profiles and lacks visual role indicators

## **🔍 PROBLEM DETAILS**
- User names in admin panel are not clickable
- No easy way to view user profiles from admin interface
- No visual distinction between user roles
- Need role-specific icons for quick identification
- Missing quick access to user actions

## **📁 FILES TO CHECK**
- `src/pages/Admin/Users.tsx` - Admin users page
- `src/components/Admin/UserList.tsx` - User list component
- `src/components/Admin/UserCard.tsx` - Individual user card
- `src/components/Modal/UserProfileModal.tsx` - User profile modal
- User management related components

## **✅ ACCEPTANCE CRITERIA**
1. User names are clickable in admin panel
2. Clicking opens user profile modal or page
3. Role-specific icons display clearly:
   - 😂 (Laughing emoji) for Comedians
   - 🏴‍☠️ (Pirate flag) for Promoters  
4. Quick access to user actions (edit, suspend, etc.)
5. User profile shows comprehensive information
6. Mobile-friendly user management interface

## **🔧 TECHNICAL REQUIREMENTS**
1. **Clickable user names:**
   ```typescript
   // Transform user name into clickable element
   const UserNameLink = ({ user, onClick }) => (
     <button 
       onClick={() => onClick(user)}
       className="user-name-link hover:text-blue-600 hover:underline"
     >
       <span className="role-icon">{getRoleIcon(user.role)}</span>
       {user.full_name || user.email}
     </button>
   );
   ```

2. **Role icon mapping:**
   ```typescript
   const getRoleIcon = (role: string) => {
     const icons = {
       comedian: '😂',
       promoter: '🏴‍☠️',
       admin: '👑',
       user: '👤'
     };
     return icons[role] || icons.user;
   };
   ```

3. **User profile modal:**
   ```typescript
   interface UserProfileModalProps {
     user: User;
     isOpen: boolean;
     onClose: () => void;
     onUserUpdate: (user: User) => void;
   }
   ```

## **🔍 IMPLEMENTATION STRATEGY**
1. **Enhanced user list:**
   ```typescript
   // src/components/Admin/UserList.tsx
   const UserList = ({ users }) => {
     const [selectedUser, setSelectedUser] = useState(null);
     const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
     
     const handleUserClick = (user) => {
       setSelectedUser(user);
       setIsProfileModalOpen(true);
     };
     
     return (
       <div className="user-list">
         {users.map(user => (
           <div key={user.id} className="user-card">
             <div className="user-info">
               <UserNameLink user={user} onClick={handleUserClick} />
               <span className="user-email">{user.email}</span>
               <span className="user-role">{user.role}</span>
             </div>
             <UserActions user={user} />
           </div>
         ))}
         
         <UserProfileModal
           user={selectedUser}
           isOpen={isProfileModalOpen}
           onClose={() => setIsProfileModalOpen(false)}
         />
       </div>
     );
   };
   ```

2. **User profile modal:**
   ```typescript
   // src/components/Modal/UserProfileModal.tsx
   const UserProfileModal = ({ user, isOpen, onClose }) => {
     if (!user) return null;
     
     return (
       <Modal isOpen={isOpen} onClose={onClose} size="large">
         <div className="user-profile-modal">
           <div className="profile-header">
             <div className="avatar">
               {user.avatar_url ? (
                 <img src={user.avatar_url} alt={user.full_name} />
               ) : (
                 <div className="avatar-placeholder">
                   {getRoleIcon(user.role)}
                 </div>
               )}
             </div>
             <div className="user-details">
               <h2>{user.full_name}</h2>
               <p className="role">{getRoleIcon(user.role)} {user.role}</p>
               <p className="email">{user.email}</p>
             </div>
           </div>
           
           <div className="profile-content">
             <UserStats user={user} />
             <UserActivity user={user} />
             <UserActions user={user} />
           </div>
         </div>
       </Modal>
     );
   };
   ```

## **🎨 USER PROFILE MODAL CONTENT**
1. **Profile header:**
   - User avatar or role icon
   - Full name and email
   - Role with icon
   - Account status (Active/Suspended)

2. **User statistics:**
   ```typescript
   interface UserStats {
     comedian: {
       gigsPerformed: number;
       totalEarnings: number;
       upcomingGigs: number;
       profileViews: number;
     };
     promoter: {
       eventsCreated: number;
       totalTicketsSold: number;
       activeEvents: number;
       totalRevenue: number;
     };
   }
   ```

3. **Recent activity:**
   - Last login date
   - Recent actions (events created, gigs applied to)
   - Account creation date
   - Profile completion percentage

4. **Quick actions:**
   - Edit user details
   - Suspend/unsuspend account
   - Reset password
   - View full activity log
   - Send message

## **🔧 USER ACTIONS COMPONENT**
```typescript
// src/components/Admin/UserActions.tsx
const UserActions = ({ user }) => {
  const actions = [
    { label: 'Edit', icon: '✏️', onClick: () => editUser(user) },
    { label: 'Message', icon: '💬', onClick: () => messageUser(user) },
    { label: 'Suspend', icon: '⏸️', onClick: () => suspendUser(user) },
    { label: 'View Log', icon: '📋', onClick: () => viewUserLog(user) }
  ];
  
  return (
    <div className="user-actions">
      {actions.map(action => (
        <button
          key={action.label}
          onClick={action.onClick}
          className="action-btn"
          title={action.label}
        >
          {action.icon}
        </button>
      ))}
    </div>
  );
};
```

## **📱 MOBILE CONSIDERATIONS**
1. **Responsive user list:**
   - Stack user info vertically on mobile
   - Touch-friendly click targets
   - Swipe gestures for quick actions

2. **Mobile profile modal:**
   - Full-screen modal on mobile
   - Touch-friendly navigation
   - Optimized content layout

## **🔍 ENHANCED FEATURES**
1. **User search and filtering:**
   - Search by name, email, or role
   - Filter by role type
   - Filter by account status
   - Sort by various criteria

2. **Bulk operations:**
   - Select multiple users
   - Bulk suspend/unsuspend
   - Bulk message sending
   - Bulk role changes

3. **User insights:**
   - User engagement metrics
   - Performance indicators
   - Account health scores
   - Risk indicators

## **🧪 TESTING INSTRUCTIONS**
1. **Test user interaction:**
   - Click user name → profile modal opens
   - Modal displays correct user information
   - All user data loads properly
   - Modal closes correctly

2. **Test role icons:**
   - Comedians show 😂 icon
   - Promoters show 🏴‍☠️ icon
   - Icons display correctly in lists and modals
   - Icons are accessible and clear

3. **Test user actions:**
   - Edit button opens edit form
   - Suspend/unsuspend toggles work
   - Message functionality works
   - Activity log displays correctly

4. **Test mobile experience:**
   - User list scrollable on mobile
   - Modal is full-screen on mobile
   - Touch interactions work properly
   - Text is readable on small screens

## **📋 DEFINITION OF DONE**
- [ ] User names are clickable in admin panel
- [ ] Profile modal opens with comprehensive user info
- [ ] Role icons display correctly (😂 for comedians, 🏴‍☠️ for promoters)
- [ ] Quick actions accessible for each user
- [ ] Mobile-responsive user management
- [ ] Search and filtering functionality
- [ ] User statistics and activity tracking
- [ ] Proper error handling for user operations
- [ ] Loading states for user data
- [ ] Accessibility compliance for interactions