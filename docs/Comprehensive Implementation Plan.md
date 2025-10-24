 Comprehensive Implementation Plan

     Part 1: Complete Postiz SSO Implementation (3 tasks)

     Task 1: Update SSO Documentation ✅

     File: /root/postiz/SSO_SETUP_GUIDE.md

     Changes:
     - Update status from "⚠️ Requires Custom Implementation" to "✅ Complete - N8N Implementation"
     - Document N8N workflow approach (replaces Postiz backend modification)
     - Add N8N workflow details:
       - Workflow ID: gigpigs-postiz-sso
       - Endpoint: /auth/gigpigs-sso → N8N webhook
       - Token validation flow diagram
     - Update Step 1 to reference N8N implementation (not backend code modification)
     - Add troubleshooting for N8N workflow issues
     - Update "What Happens After SSO Works" section with current redirect behavior

     Task 2: Test SSO Flow End-to-End 🧪

     Actions:
     1. Test from gigpigs.app:
       - Login as test user
       - Click "Social Media" in sidebar
       - Verify URL: https://social.gigpigs.app/auth/gigpigs-sso?token=...&profile=...
     2. Monitor N8N workflow execution:
       - Check workflow activates
       - Verify token validation succeeds
       - Check redirect to dashboard
     3. Check Postiz dashboard:
       - Verify redirect lands on dashboard
       - Check query params contain user info
       - Document current behavior

     Expected Outcome: Identify if Postiz needs frontend modification to handle SSO params

     Task 3: Investigate Postiz Session Handling 🔍

     Research Steps:
     1. Check if Postiz detects sso=success query parameter
     2. Search Postiz codebase for session creation API endpoints
     3. Explore Postiz authentication flow:
       - Check if there's a /api/auth/session endpoint
       - Look for user creation/login API
     4. Options if Postiz doesn't auto-handle SSO params:
       - Option A: Modify N8N workflow to call Postiz session API
       - Option B: Add small frontend modification to Postiz dashboard
       - Option C: Use Postiz Public API to create session programmatically

     Deliverable: Document findings and recommend approach for session creation

     ---
     Part 2: Add Resend Email Management to IMPLEMENTATION_PLAN.md

     New Section: Email Management & Post-Show Communications

     Location: Add as new section after Social Media Scheduling (after line 1468)

     Content Structure:

     11. Email Management & Post-Show Thank You System 🆕 PLANNED

     Goal: Implement Resend-powered email system with automated post-show "Thank You & Review" emails to audience members

     Technology: https://resend.com - Modern email API for developers

     Core Features:
     1. Post-Show Thank You Emails:
       - Automated send after event completion
       - Personalized thank you message
       - Review request links (Google Reviews, TripAdvisor, etc.)
       - Event lineup with comedian details
       - Opt-in mechanism for comedian mailing lists
     2. Comedian CRM Integration:
       - Audience members can opt-in to specific comedian's mailing list
       - Checkbox/toggle per comedian in email
       - Automatic addition to comedian's CRM contacts
       - Source tracking: "post_show_email_optin"
     3. Universal CRM Architecture:
       - Every profile gets own CRM: Comedian, Promoter, Organization, Photographer, Videographer
       - Centralized customer database: All audience members in main GigPigs database
       - Hierarchical visibility:
           - Promoters/Organizations see their event customers
         - Managers see their comedians' audiences + organization's audiences
         - Comedians see their personal audience (opt-ins from shows)
         - Cross-pollination via opt-in system

     Database Schema Design:

     -- Email templates table
     CREATE TABLE email_templates (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       name TEXT NOT NULL,
       template_type TEXT NOT NULL, -- 'post_show_thankyou', 'newsletter', 'promotion'
       subject_line TEXT NOT NULL,
       body_html TEXT NOT NULL,
       body_text TEXT NOT NULL,
       variables JSONB, -- {{event_name}}, {{lineup}}, {{venue_name}}, etc.
       created_by UUID REFERENCES profiles(id),
       organization_id UUID REFERENCES organization_profiles(id),
       created_at TIMESTAMPTZ DEFAULT NOW(),
       updated_at TIMESTAMPTZ DEFAULT NOW()
     );

     -- Email sends tracking
     CREATE TABLE email_sends (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       template_id UUID REFERENCES email_templates(id),
       event_id UUID REFERENCES events(id),
       recipient_email TEXT NOT NULL,
       recipient_name TEXT,
       customer_id UUID REFERENCES customers(id),
       sent_at TIMESTAMPTZ DEFAULT NOW(),
       resend_email_id TEXT, -- Resend's unique ID for tracking
       status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'opened', 'clicked', 'bounced'
       opened_at TIMESTAMPTZ,
       clicked_at TIMESTAMPTZ,
       metadata JSONB -- Custom data per send
     );

     -- CRM contacts (universal - all profiles)
     CREATE TABLE crm_contacts (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       profile_id UUID REFERENCES profiles(id), -- Owner of this contact
       organization_id UUID REFERENCES organization_profiles(id), -- If org-owned
       customer_id UUID REFERENCES customers(id), -- Link to main customer db
       source TEXT NOT NULL, -- 'post_show_optin', 'manual_add', 'event_registration', 'vouch'
       source_event_id UUID REFERENCES events(id), -- If from event optin
       opted_in_at TIMESTAMPTZ DEFAULT NOW(),
       tags TEXT[], -- Segmentation tags
       notes TEXT,
       created_at TIMESTAMPTZ DEFAULT NOW()
     );

     -- Review request tracking
     CREATE TABLE review_requests (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       email_send_id UUID REFERENCES email_sends(id),
       event_id UUID REFERENCES events(id),
       customer_id UUID REFERENCES customers(id),
       review_platform TEXT NOT NULL, -- 'google', 'tripadvisor', 'facebook'
       review_url TEXT NOT NULL,
       clicked_at TIMESTAMPTZ,
       reviewed BOOLEAN DEFAULT false,
       reviewed_at TIMESTAMPTZ
     );

     Post-Show Email Template Structure:

     <!-- Email sent to: customer@example.com after attending "Comedy Night at XYZ" -->
     <html>
     <body>
       <h1>Thanks for coming to {{event_name}}! 🎭</h1>
       
       <p>Hi {{customer_name}},</p>
       <p>We hope you had an amazing time at {{venue_name}} on {{event_date}}!</p>
       
       <h2>🌟 Help us spread the laughs!</h2>
       <p>If you enjoyed the show, we'd love your review:</p>
       <ul>
         <li><a href="{{google_review_url}}">Leave a Google Review</a></li>
         <li><a href="{{tripadvisor_review_url}}">Review us on TripAdvisor</a></li>
       </ul>
       
       <h2>Tonight's Amazing Lineup:</h2>
       {{#each lineup}}
       <div class="comedian-card">
         <img src="{{headshot_url}}" alt="{{name}}">
         <h3>{{stage_name}}</h3>
         <p>{{bio_snippet}}</p>
         <div class="social-links">
           <a href="{{instagram_url}}">Instagram</a>
           <a href="{{tiktok_url}}">TikTok</a>
         </div>
         
         <!-- Opt-in checkbox for comedian's mailing list -->
         <label>
           <input type="checkbox" name="optin_{{comedian_id}}" value="1">
           Get updates from {{stage_name}} about future shows
         </label>
       </div>
       {{/each}}
       
       <button>Save My Preferences</button>
     </body>
     </html>

     Implementation Phases:

     Phase 1: Resend Setup & Email Infrastructure (2 hours)
     - Install resend npm package
     - Set up Resend API key in environment
     - Create email template system (Handlebars/React Email)
     - Build email preview UI for testing templates
     - Create resend-service.ts wrapper

     Phase 2: Database Schema (1.5 hours)
     - Apply migration for email tables
     - Create RLS policies for CRM contacts
     - Build helper functions:
       - get_profile_crm_contacts(profile_id) - Get all contacts for a profile
       - get_organization_all_contacts(org_id) - Org + managed comedians' contacts
       - add_crm_contact(profile_id, customer_id, source) - Add contact with source tracking

     Phase 3: Post-Show Email Automation (3 hours)
     - Build N8N workflow: Event completion trigger → Send thank you emails
     - Create post-show email template
     - Integrate with event lineup data (pull from Supabase)
     - Fetch comedian social links and headshots
     - Generate personalized review URLs (Google, TripAdvisor)
     - Handle email opt-in responses

     Phase 4: CRM Contact Management (2.5 hours)
     - Build CRM UI for all profile types:
       - /crm/contacts - Universal CRM contacts page
       - /org/:orgId/contacts - Organization CRM view
     - Contact list with source tracking
     - Segmentation by tags
     - Export functionality (CSV)
     - Integration with existing CRM features

     Phase 5: Email Tracking & Analytics (2 hours)
     - Webhook handler for Resend events (delivered, opened, clicked)
     - Update email_sends table with delivery status
     - Track review link clicks
     - Analytics dashboard:
       - Email open rates
       - Review conversion rates
       - Opt-in rates per comedian

     Files to Create:
     - /root/agents/src/services/email/resend-service.ts - Resend API wrapper
     - /root/agents/src/services/email/email-template-service.ts - Template rendering
     - /root/agents/src/components/email/PostShowEmailTemplate.tsx - React Email template
     - /root/agents/src/pages/CRMContacts.tsx - Universal CRM contacts page
     - /root/agents/src/hooks/useCRMContacts.ts - CRM contact hooks
     - /root/agents/supabase/migrations/YYYYMMDD_create_email_system.sql - Email tables
     - /root/.n8n/post_show_email_workflow.json - N8N automation

     Data Flow:
     Event marked "completed" in Supabase
       ↓
     N8N workflow triggered (event completion webhook)
       ↓
     Fetch event details + lineup + customers from Supabase
       ↓
     For each customer/attendee:
       ├─ Render personalized email (event details + lineup)
       ├─ Generate unique review URLs with tracking params
       ├─ Send via Resend API
       └─ Log to email_sends table
       ↓
     Customer receives email → Clicks opt-in checkboxes
       ↓
     Webhook receives opt-in data
       ↓
     Add customer to comedian's CRM (crm_contacts table)
       ↓
     Comedian can now email this audience member via their CRM

     Use Cases:

     Comedians:
     - Automatically grow mailing list from every show they perform
     - See which shows generated most opt-ins
     - Segment audience by venue/event type
     - Send targeted updates about upcoming gigs

     Promoters/Organizations:
     - See all customers who attended their events
     - View comedian opt-in performance
     - Track review generation from emails
     - Analyze email engagement per event

     Managers:
     - Access ALL contacts from comedians they manage
     - Access ALL contacts from organizations they manage
     - Unified view of entire portfolio's audience
     - Export combined mailing lists

     Estimated Effort: 11 hours total
     Priority: HIGH - Revenue driver via audience building
     Dependencies: 
     - Event system (existing ✅)
     - Customer database (existing ✅)
     - Comedian profiles with social links (existing ✅)
     - Media library with headshots (existing ✅)

     ---
     Summary of Changes:

     1. ✅ Update /root/postiz/SSO_SETUP_GUIDE.md with N8N implementation details
     2. 🧪 Test SSO flow from gigpigs.app → social.gigpigs.app
     3. 🔍 Investigate Postiz session handling (determine if additional work needed)
     4. 📝 Add comprehensive Resend email section to /root/agents/docs/IMPLEMENTATION_PLAN.md

     Estimated Total Time: 
     - SSO completion: 1.5-2 hours
     - Documentation update: 30 minutes
     - Resend feature planning: Already included in doc