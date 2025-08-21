# Stand Up Sydney Frontend Architecture Map

## Overview
The frontend is a React 18 + TypeScript application built with Vite, using Tailwind CSS and shadcn/ui for styling. It follows a modern React architecture with Context API for global state, React Query for server state, and a comprehensive hook-based architecture for business logic.

## Core Architecture Layers

### 1. Provider Hierarchy (App.tsx)
The application uses a nested provider pattern with the following hierarchy:
```
ErrorBoundary
└── QueryClientProvider (React Query)
    └── ThemeProvider (Theme Management)
        └── AuthProvider (Authentication)
            └── UserProvider (User State)
                └── DesignSystemInitializer
                    └── Router (React Router)
                        └── Application Content
```

### 2. State Management Architecture

#### Global State (Context API)
- **AuthContext**: Core authentication state and operations
  - User session management
  - Profile data
  - Role-based access control
  - Authentication operations (signIn, signUp, signOut)
  
- **UserContext**: User-specific data (appears to be legacy/redundant with AuthContext)
  - User profile information
  - User statistics
  
- **ThemeContext**: Application theming
  - Theme selection (pleasure/business)
  - Auto-theme scheduling
  - Theme persistence

#### Server State (React Query)
- Query client configured with:
  - 3 retry attempts with exponential backoff
  - 5-minute stale time
  - 10-minute garbage collection time
- Query keys follow hierarchical pattern: `['events']`, `['user-events']`, `['event-spots', eventId]`

### 3. Data Flow Architecture

#### Supabase Integration
- **Client Setup**: Enhanced Supabase client with automatic retry logic
  - Located in `/lib/supabase.ts` (wrapper with retry)
  - Base client in `/integrations/supabase/client.ts`
  - Exponential backoff for retryable errors
  - Network error handling

#### Data Fetching Patterns
1. **Direct Supabase Queries** (older pattern)
   - Used in hooks like `useEventData.ts`
   - Manual state management with useState
   - Manual error handling

2. **React Query Pattern** (modern pattern)
   - Used in hooks like `useFeaturedEvents.ts`
   - Automatic caching and invalidation
   - Built-in error/loading states

### 4. Component Architecture

#### UI Component Library (shadcn/ui)
Located in `/components/ui/`, includes 50+ components:
- Form components (input, select, checkbox, etc.)
- Layout components (card, dialog, sheet, etc.)
- Navigation components (tabs, menu, breadcrumb, etc.)
- Data display (table, carousel, chart, etc.)

#### Feature Components
Organized by domain in `/components/`:
- `admin/` - Admin dashboard components
- `agency/` - Agency management
- `auth/` - Authentication components
- `comedian-profile/` - Comedian profile features
- `events/` - Event management
- `invoice/` - Invoice handling
- `notifications/` - Notification system
- `photographer-profile/` - Photographer features
- `promoter-profile/` - Promoter features
- `tasks/` - Task management
- `tours/` - Tour management

### 5. Routing & Access Control

#### Route Structure (from App.tsx)
- **Public Routes**:
  - `/` - Index/Home
  - `/auth` - Authentication
  - `/shows` - Public event listing
  - `/events/:eventId` - Public event details
  - `/comedian/:slug` - Public comedian profiles

- **Protected Routes** (require authentication):
  - `/dashboard` - User dashboard
  - `/profile` - User profile
  - `/messages` - Messaging system
  - `/notifications` - Notifications
  - `/create-event` - Event creation
  - `/invoices/*` - Invoice management

- **Role-Protected Routes**:
  - `/applications` - Promoter/Admin only
  - `/dashboard/gigs/add` - Comedian only
  - `/admin` - Admin dashboard

#### Access Control
- `ProtectedRoute` component handles route protection
- Checks authentication status
- Validates required roles
- Shows loading state during auth check
- Redirects to auth or shows access denied

### 6. Hook Architecture

#### Data Fetching Hooks
Organized into categories:
- **Event Management**: `useEventData`, `useEventActions`, `useEventDetailsManager`, `useEventSpots`
- **User/Profile**: `useProfileData`, `useProfileOperations`, `useComedianProfile`
- **Financial**: `useInvoices`, `usePayments`, `useFinancialMetrics`, `useXeroIntegration`
- **Bookings**: `useComedianGigs`, `useUpcomingGigs`, `useComedianBookingsData`
- **Admin**: `useAdminAnalytics`, `useOrganizations`, `useTasks`

#### Common Hook Patterns
1. **Composite Hooks**: Combine multiple smaller hooks (e.g., `useEventManagement`)
2. **CRUD Operations**: Standard create, read, update, delete patterns
3. **Real-time Subscriptions**: Using Supabase subscriptions
4. **Optimistic Updates**: Update UI before server confirmation

### 7. Type System

#### Core Types (in `/types/`)
- `auth.ts` - Authentication types (Profile, UserRole)
- `event.ts` - Event-related types (Event, Venue, EventSpot)
- `comedian.ts` - Comedian types
- `photographer.ts` - Photographer types
- `invoice.ts` - Invoice and financial types
- `task.ts` - Task management types
- `tour.ts` - Tour management types
- `agency.ts` - Agency types (12KB - largest type file)

### 8. Service Layer

#### Services (in `/services/`)
Handles complex business logic and external integrations:
- `agencyService.ts` - Agency operations
- `invoiceService.ts` - Invoice management
- `notificationService.ts` - Notification handling
- `paymentService.ts` - Payment processing
- `taskService.ts` - Task management
- `tourService.ts` - Tour operations
- `xeroService.ts` - Xero accounting integration
- `errorService.ts` - Centralized error handling

### 9. Utility Functions

#### Utils (in `/utils/`)
- `nameDisplay.ts` - Name formatting logic
- `fileValidation.ts` - File upload validation
- `eventValidation.ts` - Event data validation
- `socialLinks.ts` - Social media URL handling
- `csrf.ts` - CSRF protection utilities
- `profileImageCleanup.ts` - Image management

### 10. Authentication & Authorization Flow

1. **Initial Load**:
   - AuthContext checks for existing session
   - Fetches user profile and roles
   - Sets loading state

2. **Login Flow**:
   - User submits credentials
   - AuthContext.signIn() called
   - Session established
   - Profile and roles fetched
   - User redirected to dashboard

3. **Role Checking**:
   - `hasRole()` - Check single role
   - `hasAnyRole()` - Check multiple roles
   - `isCoPromoterForEvent()` - Event-specific permissions

4. **Protected Resources**:
   - ProtectedRoute wraps components
   - Checks authentication and roles
   - Redirects or shows error

## Key Design Patterns

1. **Separation of Concerns**:
   - Business logic in hooks
   - UI logic in components
   - Data fetching separate from presentation

2. **Composition over Inheritance**:
   - Small, focused components
   - Composite components for complex features
   - Hook composition for complex logic

3. **Error Boundaries**:
   - Top-level ErrorBoundary
   - Graceful error handling
   - User-friendly error messages

4. **Progressive Enhancement**:
   - PWA support with offline capability
   - Lazy loading for non-critical routes
   - Optimistic UI updates

5. **Type Safety**:
   - Strict TypeScript throughout
   - Generated Supabase types
   - Comprehensive type definitions

## Data Flow Summary

1. **User Action** → Component Event Handler
2. **Component** → Custom Hook
3. **Hook** → Service/Supabase Client
4. **Supabase** → Database Operation
5. **Response** → Hook State Update
6. **State Change** → Component Re-render
7. **React Query** → Cache Update & Related Query Invalidation

## Common Pitfalls to Avoid

1. **Don't access Supabase directly in components** - Use hooks
2. **Don't mix authentication contexts** - UserContext appears redundant
3. **Always check user roles** before showing sensitive UI
4. **Use React Query for data fetching** - Avoid useState for server state
5. **Handle loading and error states** - Don't assume data exists
6. **Invalidate related queries** after mutations
7. **Use the retry wrapper** for critical Supabase operations