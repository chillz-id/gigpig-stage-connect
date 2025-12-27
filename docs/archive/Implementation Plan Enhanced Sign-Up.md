Implementation Plan: Enhanced Sign-Up Flow with Organization & Manager Features                                                                                                     │ │
│ │                                                                                                                                                                                     │ │
│ │ Overview                                                                                                                                                                            │ │
│ │                                                                                                                                                                                     │ │
│ │ Comprehensive UX improvements including: removing "spots left", linking ticket buttons, hiding homepage sidebar, removing hero video, and adding advanced Organization and Manager  │ │
│ │ sign-up flows with approval/request system.                                                                                                                                         │ │
│ │                                                                                                                                                                                     │ │
│ │ ---                                                                                                                                                                                 │ │
│ │ Part A: Simple UI Updates (Quick Wins)                                                                                                                                              │ │
│ │                                                                                                                                                                                     │ │
│ │ A1. Remove "Spots left" from ShowCard ✓                                                                                                                                             │ │
│ │                                                                                                                                                                                     │ │
│ │ File: /root/agents/src/components/ShowCard.tsx                                                                                                                                      │ │
│ │ - Remove line 143: {availableSpots > 0 ? '${availableSpots} spots left' : 'Full'}                                                                                                   │ │
│ │ - Keep time display only                                                                                                                                                            │ │
│ │                                                                                                                                                                                     │ │
│ │ A2. Link "Get Tickets" Button to ticket_url ✓                                                                                                                                       │ │
│ │                                                                                                                                                                                     │ │
│ │ File: /root/agents/src/components/ShowCard.tsx                                                                                                                                      │ │
│ │ - Update lines 193-205 button click handler                                                                                                                                         │ │
│ │ - Change to: window.open(show.ticket_url || show.external_ticket_url, '_blank', 'noopener,noreferrer')                                                                              │ │
│ │                                                                                                                                                                                     │ │
│ │ A3. Hide Sidebar on Homepage ✓                                                                                                                                                      │ │
│ │                                                                                                                                                                                     │ │
│ │ File: /root/agents/src/components/layout/PlatformLayout.tsx                                                                                                                         │ │
│ │ - Update line 33: const hidesSidebar = location.pathname === '/' || location.pathname.startsWith('/crm');                                                                           │ │
│ │ - Use hidesSidebar for conditional rendering                                                                                                                                        │ │
│ │                                                                                                                                                                                     │ │
│ │ A4. Remove Hero Video ✓                                                                                                                                                             │ │
│ │                                                                                                                                                                                     │ │
│ │ File: /root/agents/src/pages/Index.tsx                                                                                                                                              │ │
│ │ - Remove lines 54-59 <HeroVideoShowreel> component                                                                                                                                  │ │
│ │ - Keep gradient background                                                                                                                                                          │ │
│ │                                                                                                                                                                                     │ │
│ │ ---                                                                                                                                                                                 │ │
│ │ Part B: Enhanced Sign-Up Flow (Complex)                                                                                                                                             │ │
│ │                                                                                                                                                                                     │ │
│ │ B1. Update Sign-Up Role Selection ✓                                                                                                                                                 │ │
│ │                                                                                                                                                                                     │ │
│ │ File: /root/agents/src/components/auth/SignUpForm.tsx                                                                                                                               │ │
│ │                                                                                                                                                                                     │ │
│ │ Remove:                                                                                                                                                                             │ │
│ │ - Photographer checkbox (lines 178-189)                                                                                                                                             │ │
│ │ - Videographer checkbox (lines 190-201)                                                                                                                                             │ │
│ │                                                                                                                                                                                     │ │
│ │ Add (with icons from ProfileContext):                                                                                                                                               │ │
│ │ - Promoter checkbox - Users icon                                                                                                                                                    │ │
│ │ - Manager checkbox - Briefcase icon                                                                                                                                                 │ │
│ │ - Organization checkbox - Building2 icon                                                                                                                                            │ │
│ │                                                                                                                                                                                     │ │
│ │ Keep:                                                                                                                                                                               │ │
│ │ - Comedian checkbox                                                                                                                                                                 │ │
│ │ - Multi-select functionality                                                                                                                                                        │ │
│ │                                                                                                                                                                                     │ │
│ │ B2. Create Post-Signup Flow Handler 🆕                                                                                                                                              │ │
│ │                                                                                                                                                                                     │ │
│ │ New File: /root/agents/src/components/auth/PostSignupFlowHandler.tsx                                                                                                                │ │
│ │                                                                                                                                                                                     │ │
│ │ Purpose: Orchestrates profile creation based on selected roles after successful signup                                                                                              │ │
│ │                                                                                                                                                                                     │ │
│ │ Logic Flow:                                                                                                                                                                         │ │
│ │ interface PostSignupFlowHandlerProps {                                                                                                                                              │ │
│ │   selectedRoles: string[];                                                                                                                                                          │ │
│ │   onComplete: () => void;                                                                                                                                                           │ │
│ │ }                                                                                                                                                                                   │ │
│ │                                                                                                                                                                                     │ │
│ │ // For each selected role, show appropriate wizard:                                                                                                                                 │ │
│ │ // - comedian → Auto-create comedian_profile, redirect to dashboard                                                                                                                 │ │
│ │ // - promoter → Auto-create promoter_profile, redirect to dashboard                                                                                                                 │ │
│ │ // - organization → Show OrganizationSignupWizard (B3)                                                                                                                              │ │
│ │ // - manager → Show ManagerSignupWizard (B4)                                                                                                                                        │ │
│ │                                                                                                                                                                                     │ │
│ │ B3. Organization Signup Wizard 🆕                                                                                                                                                   │ │
│ │                                                                                                                                                                                     │ │
│ │ New File: /root/agents/src/components/auth/OrganizationSignupWizard.tsx                                                                                                             │ │
│ │                                                                                                                                                                                     │ │
│ │ Purpose: Multi-step wizard for organization creation OR join request                                                                                                                │ │
│ │                                                                                                                                                                                     │ │
│ │ Steps:                                                                                                                                                                              │ │
│ │ 1. Choice Screen: "Create New Organization" or "Join Existing Organization"                                                                                                         │ │
│ │ 2a. If Create New:                                                                                                                                                                  │ │
│ │   - Reuse ProfileCreationWizard flow for organization type                                                                                                                          │ │
│ │   - Fields: Name, Logo, Description, Type (Agency, Venue, Production Company)                                                                                                       │ │
│ │   - On success: User becomes Owner, redirect to org dashboard                                                                                                                       │ │
│ │ 2b. If Join Existing:                                                                                                                                                               │ │
│ │   - Search bar to find organizations by name                                                                                                                                        │ │
│ │   - Display results with organization cards (logo, name, type)                                                                                                                      │ │
│ │   - Select organization → Choose desired role (Member, Manager)                                                                                                                     │ │
│ │   - If Manager: Show ManagerTypeSelector (multi-select)                                                                                                                             │ │
│ │   - Submit join request → Notification sent to org Owner/Admins                                                                                                                     │ │
│ │   - Show "Request sent" confirmation → Redirect to dashboard                                                                                                                        │ │
│ │                                                                                                                                                                                     │ │
│ │ Database Tables:                                                                                                                                                                    │ │
│ │ - Creates: organizations row (if new org)                                                                                                                                           │ │
│ │ - Creates: organization_join_requests row (if joining)                                                                                                                              │ │
│ │   - Columns: user_id, organization_id, requested_role, manager_types[], status, created_at                                                                                          │ │
│ │                                                                                                                                                                                     │ │
│ │ B4. Manager Signup Wizard 🆕                                                                                                                                                        │ │
│ │                                                                                                                                                                                     │ │
│ │ New File: /root/agents/src/components/auth/ManagerSignupWizard.tsx                                                                                                                  │ │
│ │                                                                                                                                                                                     │ │
│ │ Purpose: Multi-step wizard for manager profile creation with client selection                                                                                                       │ │
│ │                                                                                                                                                                                     │ │
│ │ Form Layout (Single Screen):                                                                                                                                                        │ │
│ │                                                                                                                                                                                     │ │
│ │ Section 1: Manager Types (multi-select checkboxes)                                                                                                                                  │ │
│ │ ☐ Social Media Manager                                                                                                                                                              │ │
│ │ ☐ Finance Manager                                                                                                                                                                   │ │
│ │ ☐ Tour Manager                                                                                                                                                                      │ │
│ │ ☐ Booking Manager                                                                                                                                                                   │ │
│ │ ☐ Content Manager                                                                                                                                                                   │ │
│ │ ☐ General Manager                                                                                                                                                                   │ │
│ │                                                                                                                                                                                     │ │
│ │ Section 2: Clients to Manage (dual search interface)                                                                                                                                │ │
│ │                                                                                                                                                                                     │ │
│ │ Comedians:                                                                                                                                                                          │ │
│ │ - Search bar with autocomplete                                                                                                                                                      │ │
│ │ - Displays comedian cards (avatar, name, stage name)                                                                                                                                │ │
│ │ - Multi-select with chips showing selected comedians                                                                                                                                │ │
│ │                                                                                                                                                                                     │ │
│ │ Organizations:                                                                                                                                                                      │ │
│ │ - Search bar with autocomplete                                                                                                                                                      │ │
│ │ - Displays organization cards (logo, name, type)                                                                                                                                    │ │
│ │ - Multi-select with chips showing selected organizations                                                                                                                            │ │
│ │                                                                                                                                                                                     │ │
│ │ Submit Button:                                                                                                                                                                      │ │
│ │ - Creates manager_profiles row                                                                                                                                                      │ │
│ │ - Creates manager_client_requests rows for each selected comedian/org                                                                                                               │ │
│ │   - Columns: manager_id, client_type (comedian/organization), client_id, manager_types[], status, created_at                                                                        │ │
│ │ - Sends notifications to each selected client                                                                                                                                       │ │
│ │ - Shows "Requests sent to X comedians and Y organizations" confirmation                                                                                                             │ │
│ │ - Redirects to dashboard                                                                                                                                                            │ │
│ │                                                                                                                                                                                     │ │
│ │ UI Components to Create:                                                                                                                                                            │ │
│ │ - ManagerTypeSelector (checkboxes with descriptions)                                                                                                                                │ │
│ │ - ClientSearchSelector (dual search for comedians + orgs)                                                                                                                           │ │
│ │ - SelectedClientChips (removable chips showing selections)                                                                                                                          │ │
│ │                                                                                                                                                                                     │ │
│ │ B5. Approval System for Requests 🆕                                                                                                                                                 │ │
│ │                                                                                                                                                                                     │ │
│ │ New Component: /root/agents/src/components/requests/PendingRequestsList.tsx                                                                                                         │ │
│ │ - Shows in Dashboard for users with pending requests                                                                                                                                │ │
│ │ - Displays incoming requests with requester info                                                                                                                                    │ │
│ │ - Actions: Approve, Deny, View Profile                                                                                                                                              │ │
│ │                                                                                                                                                                                     │ │
│ │ Database Tables to Create:                                                                                                                                                          │ │
│ │                                                                                                                                                                                     │ │
│ │ organization_join_requests:                                                                                                                                                         │ │
│ │ CREATE TABLE organization_join_requests (                                                                                                                                           │ │
│ │   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                                                                                                                                    │ │
│ │   user_id UUID REFERENCES auth.users NOT NULL,                                                                                                                                      │ │
│ │   organization_id UUID REFERENCES organizations NOT NULL,                                                                                                                           │ │
│ │   requested_role TEXT CHECK (requested_role IN ('member', 'manager', 'admin')),                                                                                                     │ │
│ │   manager_types TEXT[], -- Array of manager specializations if role=manager                                                                                                         │ │
│ │   status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),                                                                                                │ │
│ │   message TEXT,                                                                                                                                                                     │ │
│ │   created_at TIMESTAMPTZ DEFAULT NOW(),                                                                                                                                             │ │
│ │   reviewed_at TIMESTAMPTZ,                                                                                                                                                          │ │
│ │   reviewed_by UUID REFERENCES auth.users                                                                                                                                            │ │
│ │ );                                                                                                                                                                                  │ │
│ │                                                                                                                                                                                     │ │
│ │ manager_client_requests:                                                                                                                                                            │ │
│ │ CREATE TABLE manager_client_requests (                                                                                                                                              │ │
│ │   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                                                                                                                                    │ │
│ │   manager_id UUID REFERENCES auth.users NOT NULL,                                                                                                                                   │ │
│ │   client_type TEXT CHECK (client_type IN ('comedian', 'organization')),                                                                                                             │ │
│ │   client_id UUID NOT NULL, -- References comedian_profiles.id OR organizations.id                                                                                                   │ │
│ │   manager_types TEXT[], -- Array: ['social_media', 'tour_manager', etc.]                                                                                                            │ │
│ │   status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),                                                                                                │ │
│ │   message TEXT,                                                                                                                                                                     │ │
│ │   created_at TIMESTAMPTZ DEFAULT NOW(),                                                                                                                                             │ │
│ │   reviewed_at TIMESTAMPTZ,                                                                                                                                                          │ │
│ │   reviewed_by UUID REFERENCES auth.users                                                                                                                                            │ │
│ │ );                                                                                                                                                                                  │ │
│ │                                                                                                                                                                                     │ │
│ │ New Service: /root/agents/src/services/request/requestApprovalService.ts                                                                                                            │ │
│ │ - approveOrganizationJoinRequest(requestId) → Creates organization_team_members row                                                                                                 │ │
│ │ - approveManagerClientRequest(requestId) → Creates link in comedian_managers or organization_team_members                                                                           │ │
│ │ - denyRequest(requestId, reason)                                                                                                                                                    │ │
│ │ - getMyPendingRequests(userId)                                                                                                                                                      │ │
│ │ - getRequestsForMyClients(userId) (for organizations/comedians receiving requests)                                                                                                  │ │
│ │                                                                                                                                                                                     │ │
│ │ B6. Notification System 🆕                                                                                                                                                          │ │
│ │                                                                                                                                                                                     │ │
│ │ New Notifications:                                                                                                                                                                  │ │
│ │ - "X requested to join [Organization Name] as [Role]" → To org Owner/Admins                                                                                                         │ │
│ │ - "X requested to manage you as [Manager Types]" → To comedians                                                                                                                     │ │
│ │ - "X requested to join [Organization] as [Manager Types]" → To org Owner/Admins                                                                                                     │ │
│ │ - "Your request to join [Organization] was approved" → To requester                                                                                                                 │ │
│ │ - "Your request to manage [Comedian] was approved" → To manager                                                                                                                     │ │
│ │ - "Your request was denied: [Reason]" → To requester                                                                                                                                │ │
│ │                                                                                                                                                                                     │ │
│ │ Implementation:                                                                                                                                                                     │ │
│ │ - Use existing notification system                                                                                                                                                  │ │
│ │ - Add new notification types to notification_preferences table                                                                                                                      │ │
│ │ - Trigger notifications via database functions or application logic                                                                                                                 │ │
│ │                                                                                                                                                                                     │ │
│ │ ---                                                                                                                                                                                 │ │
│ │ Part C: Database Schema Updates                                                                                                                                                     │ │
│ │                                                                                                                                                                                     │ │
│ │ C1. New Tables (See B5 for SQL)                                                                                                                                                     │ │
│ │                                                                                                                                                                                     │ │
│ │ - organization_join_requests                                                                                                                                                        │ │
│ │ - manager_client_requests                                                                                                                                                           │ │
│ │                                                                                                                                                                                     │ │
│ │ C2. New Table: manager_profiles                                                                                                                                                     │ │
│ │                                                                                                                                                                                     │ │
│ │ CREATE TABLE manager_profiles (                                                                                                                                                     │ │
│ │   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                                                                                                                                    │ │
│ │   user_id UUID REFERENCES auth.users UNIQUE NOT NULL,                                                                                                                               │ │
│ │   manager_types TEXT[] DEFAULT '{}', -- Specializations                                                                                                                             │ │
│ │   bio TEXT,                                                                                                                                                                         │ │
│ │   created_at TIMESTAMPTZ DEFAULT NOW(),                                                                                                                                             │ │
│ │   updated_at TIMESTAMPTZ DEFAULT NOW()                                                                                                                                              │ │
│ │ );                                                                                                                                                                                  │ │
│ │                                                                                                                                                                                     │ │
│ │ C3. New Link Table: comedian_managers                                                                                                                                               │ │
│ │                                                                                                                                                                                     │ │
│ │ CREATE TABLE comedian_managers (                                                                                                                                                    │ │
│ │   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                                                                                                                                    │ │
│ │   comedian_id UUID REFERENCES comedian_profiles NOT NULL,                                                                                                                           │ │
│ │   manager_id UUID REFERENCES manager_profiles NOT NULL,                                                                                                                             │ │
│ │   manager_types TEXT[], -- Which manager types apply to this relationship                                                                                                           │ │
│ │   created_at TIMESTAMPTZ DEFAULT NOW(),                                                                                                                                             │ │
│ │   UNIQUE(comedian_id, manager_id)                                                                                                                                                   │ │
│ │ );                                                                                                                                                                                  │ │
│ │                                                                                                                                                                                     │ │
│ │ ---                                                                                                                                                                                 │ │
│ │ Files Summary                                                                                                                                                                       │ │
│ │                                                                                                                                                                                     │ │
│ │ New Files (8):                                                                                                                                                                      │ │
│ │                                                                                                                                                                                     │ │
│ │ 1. /root/agents/src/components/auth/PostSignupFlowHandler.tsx                                                                                                                       │ │
│ │ 2. /root/agents/src/components/auth/OrganizationSignupWizard.tsx                                                                                                                    │ │
│ │ 3. /root/agents/src/components/auth/ManagerSignupWizard.tsx                                                                                                                         │ │
│ │ 4. /root/agents/src/components/requests/PendingRequestsList.tsx                                                                                                                     │ │
│ │ 5. /root/agents/src/services/request/requestApprovalService.ts                                                                                                                      │ │
│ │ 6. /root/agents/src/components/manager/ManagerTypeSelector.tsx                                                                                                                      │ │
│ │ 7. /root/agents/src/components/manager/ClientSearchSelector.tsx                                                                                                                     │ │
│ │ 8. /root/agents/supabase/migrations/YYYYMMDD_add_signup_request_system.sql                                                                                                          │ │
│ │                                                                                                                                                                                     │ │
│ │ Modified Files (5):                                                                                                                                                                 │ │
│ │                                                                                                                                                                                     │ │
│ │ 1. /root/agents/src/components/ShowCard.tsx                                                                                                                                         │ │
│ │ 2. /root/agents/src/components/layout/PlatformLayout.tsx                                                                                                                            │ │
│ │ 3. /root/agents/src/pages/Index.tsx                                                                                                                                                 │ │
│ │ 4. /root/agents/src/components/auth/SignUpForm.tsx                                                                                                                                  │ │
│ │ 5. /root/agents/src/pages/Auth.tsx (integrate PostSignupFlowHandler)                                                                                                                │ │
│ │                                                                                                                                                                                     │ │
│ │ ---                                                                                                                                                                                 │ │
│ │ Implementation Phases                                                                                                                                                               │ │
│ │                                                                                                                                                                                     │ │
│ │ Phase 1: Quick Wins (1 hour)                                                                                                                                                        │ │
│ │ - A1-A4: ShowCard, sidebar, homepage video updates                                                                                                                                  │ │
│ │                                                                                                                                                                                     │ │
│ │ Phase 2: Sign-Up Role Selection (1 hour)                                                                                                                                            │ │
│ │ - B1: Update SignUpForm with new role checkboxes                                                                                                                                    │ │
│ │                                                                                                                                                                                     │ │
│ │ Phase 3: Database Schema (2 hours)                                                                                                                                                  │ │
│ │ - C1-C3: Create migrations for new tables                                                                                                                                           │ │
│ │ - Add RLS policies                                                                                                                                                                  │ │
│ │ - Test migrations                                                                                                                                                                   │ │
│ │                                                                                                                                                                                     │ │
│ │ Phase 4: Organization Flow (4 hours)                                                                                                                                                │ │
│ │ - B3: Build OrganizationSignupWizard                                                                                                                                                │ │
│ │ - Integrate with ProfileCreationWizard                                                                                                                                              │ │
│ │ - Test create new vs join existing flows                                                                                                                                            │ │
│ │                                                                                                                                                                                     │ │
│ │ Phase 5: Manager Flow (5 hours)                                                                                                                                                     │ │
│ │ - B4: Build ManagerSignupWizard                                                                                                                                                     │ │
│ │ - Build ManagerTypeSelector component                                                                                                                                               │ │
│ │ - Build ClientSearchSelector component                                                                                                                                              │ │
│ │ - Test multi-select functionality                                                                                                                                                   │ │
│ │                                                                                                                                                                                     │ │
│ │ Phase 6: Approval System (4 hours)                                                                                                                                                  │ │
│ │ - B5: Build requestApprovalService                                                                                                                                                  │ │
│ │ - Build PendingRequestsList component                                                                                                                                               │ │
│ │ - Add to Dashboard                                                                                                                                                                  │ │
│ │ - Test approve/deny workflows                                                                                                                                                       │ │
│ │                                                                                                                                                                                     │ │
│ │ Phase 7: Notifications (2 hours)                                                                                                                                                    │ │
│ │ - B6: Add new notification types                                                                                                                                                    │ │
│ │ - Integrate with existing notification system                                                                                                                                       │ │
│ │ - Test delivery                                                                                                                                                                     │ │
│ │                                                                                                                                                                                     │ │
│ │ Phase 8: Integration & Testing (3 hours)                                                                                                                                            │ │
│ │ - B2: Build PostSignupFlowHandler orchestration                                                                                                                                     │ │
│ │ - Wire everything together in Auth.tsx                                                                                                                                              │ │
│ │ - End-to-end testing                                                                                                                                                                │ │
│ │ - Bug fixes                                                                                                                                                                         │ │
│ │                                                                                                                                                                                     │ │
│ │ Total Estimated Time: 22 hours                                                                                                                                                      │ │
│ │                                                                                                                                                                                     │ │
│ │ ---                                                                                                                                                                                 │ │
│ │ Testing Checklist                                                                                                                                                                   │ │
│ │                                                                                                                                                                                     │ │
│ │ Part A:                                                                                                                                                                             │ │
│ │ - ShowCard displays without "spots left"                                                                                                                                            │ │
│ │ - "Get Tickets" opens ticket URL                                                                                                                                                    │ │
│ │ - Homepage has no sidebar                                                                                                                                                           │ │
│ │ - Homepage has no video background                                                                                                                                                  │ │
│ │                                                                                                                                                                                     │ │
│ │ Part B:                                                                                                                                                                             │ │
│ │ - Sign-up shows: Comedian, Promoter, Manager, Organization                                                                                                                          │ │
│ │ - Can select multiple roles                                                                                                                                                         │ │
│ │ - Selecting Organization shows create/join wizard                                                                                                                                   │ │
│ │ - Can create new organization successfully                                                                                                                                          │ │
│ │ - Can search and join existing organization                                                                                                                                         │ │
│ │ - Org owners receive join requests                                                                                                                                                  │ │
│ │ - Selecting Manager shows manager wizard                                                                                                                                            │ │
│ │ - Can select multiple manager types                                                                                                                                                 │ │
│ │ - Can search and select multiple comedians                                                                                                                                          │ │
│ │ - Can search and select multiple organizations                                                                                                                                      │ │
│ │ - Comedians/orgs receive manager requests                                                                                                                                           │ │
│ │ - Can approve organization join requests                                                                                                                                            │ │
│ │ - Can approve manager client requests                                                                                                                                               │ │
│ │ - Can deny requests with reason                                                                                                                                                     │ │
│ │ - Notifications sent for all request states                                                                                                                                         │ │
│ │ - Approved requests create correct database relationships                                                                                                                           │ │
│ │                                                                                                                                                                                     │ │
│ │ ---                                                                                                                                                                                 │ │
│ │ Ready to implement?    