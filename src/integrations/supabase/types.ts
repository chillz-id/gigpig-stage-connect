export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      agencies: {
        Row: {
          abn: string | null
          address: string | null
          agency_type: Database["public"]["Enums"]["agency_type"]
          banner_url: string | null
          billing_address: string | null
          business_license: string | null
          city: string | null
          commission_rate: number | null
          country: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          insurance_details: Json | null
          legal_name: string | null
          logo_url: string | null
          metadata: Json | null
          name: string
          owner_id: string | null
          payment_terms: string | null
          phone: string | null
          postal_code: string | null
          settings: Json | null
          specialties: string[] | null
          state: string | null
          status: Database["public"]["Enums"]["agency_status"]
          updated_at: string
          verified_at: string | null
          website_url: string | null
        }
        Insert: {
          abn?: string | null
          address?: string | null
          agency_type?: Database["public"]["Enums"]["agency_type"]
          banner_url?: string | null
          billing_address?: string | null
          business_license?: string | null
          city?: string | null
          commission_rate?: number | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          insurance_details?: Json | null
          legal_name?: string | null
          logo_url?: string | null
          metadata?: Json | null
          name: string
          owner_id?: string | null
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          settings?: Json | null
          specialties?: string[] | null
          state?: string | null
          status?: Database["public"]["Enums"]["agency_status"]
          updated_at?: string
          verified_at?: string | null
          website_url?: string | null
        }
        Update: {
          abn?: string | null
          address?: string | null
          agency_type?: Database["public"]["Enums"]["agency_type"]
          banner_url?: string | null
          billing_address?: string | null
          business_license?: string | null
          city?: string | null
          commission_rate?: number | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          insurance_details?: Json | null
          legal_name?: string | null
          logo_url?: string | null
          metadata?: Json | null
          name?: string
          owner_id?: string | null
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          settings?: Json | null
          specialties?: string[] | null
          state?: string | null
          status?: Database["public"]["Enums"]["agency_status"]
          updated_at?: string
          verified_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      agency_analytics: {
        Row: {
          active_artists: number | null
          agency_id: string | null
          average_commission_rate: number | null
          average_deal_value: number | null
          average_response_time_hours: number | null
          client_satisfaction_score: number | null
          commission_earned: number | null
          created_at: string
          deals_closed: number | null
          deals_declined: number | null
          deals_initiated: number | null
          id: string
          metrics_data: Json | null
          new_artists: number | null
          period_end: string
          period_start: string
          total_artists: number | null
          total_revenue: number | null
          updated_at: string
        }
        Insert: {
          active_artists?: number | null
          agency_id?: string | null
          average_commission_rate?: number | null
          average_deal_value?: number | null
          average_response_time_hours?: number | null
          client_satisfaction_score?: number | null
          commission_earned?: number | null
          created_at?: string
          deals_closed?: number | null
          deals_declined?: number | null
          deals_initiated?: number | null
          id?: string
          metrics_data?: Json | null
          new_artists?: number | null
          period_end: string
          period_start: string
          total_artists?: number | null
          total_revenue?: number | null
          updated_at?: string
        }
        Update: {
          active_artists?: number | null
          agency_id?: string | null
          average_commission_rate?: number | null
          average_deal_value?: number | null
          average_response_time_hours?: number | null
          client_satisfaction_score?: number | null
          commission_earned?: number | null
          created_at?: string
          deals_closed?: number | null
          deals_declined?: number | null
          deals_initiated?: number | null
          id?: string
          metrics_data?: Json | null
          new_artists?: number | null
          period_end?: string
          period_start?: string
          total_artists?: number | null
          total_revenue?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_analytics_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_conversations: {
        Row: {
          agent_id: string
          ended_at: string | null
          id: string
          messages: Json
          metadata: Json | null
          started_at: string | null
          summary: string | null
          summary_embedding: string | null
          user_id: string | null
        }
        Insert: {
          agent_id: string
          ended_at?: string | null
          id?: string
          messages?: Json
          metadata?: Json | null
          started_at?: string | null
          summary?: string | null
          summary_embedding?: string | null
          user_id?: string | null
        }
        Update: {
          agent_id?: string
          ended_at?: string | null
          id?: string
          messages?: Json
          metadata?: Json | null
          started_at?: string | null
          summary?: string | null
          summary_embedding?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      agent_expertise: {
        Row: {
          agent_id: string
          failed_tasks: number | null
          id: string
          last_used: string | null
          metadata: Json | null
          proficiency: number | null
          skill: string
          successful_tasks: number | null
        }
        Insert: {
          agent_id: string
          failed_tasks?: number | null
          id?: string
          last_used?: string | null
          metadata?: Json | null
          proficiency?: number | null
          skill: string
          successful_tasks?: number | null
        }
        Update: {
          agent_id?: string
          failed_tasks?: number | null
          id?: string
          last_used?: string | null
          metadata?: Json | null
          proficiency?: number | null
          skill?: string
          successful_tasks?: number | null
        }
        Relationships: []
      }
      agent_knowledge_graph: {
        Row: {
          agent_id: string
          confidence: number | null
          created_at: string | null
          id: string
          metadata: Json | null
          object: string
          predicate: string
          subject: string
        }
        Insert: {
          agent_id: string
          confidence?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          object: string
          predicate: string
          subject: string
        }
        Update: {
          agent_id?: string
          confidence?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          object?: string
          predicate?: string
          subject?: string
        }
        Relationships: []
      }
      agent_memories: {
        Row: {
          access_count: number | null
          accessed_at: string | null
          agent_id: string
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          importance: number | null
          memory_type: string
          metadata: Json | null
        }
        Insert: {
          access_count?: number | null
          accessed_at?: string | null
          agent_id: string
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          importance?: number | null
          memory_type: string
          metadata?: Json | null
        }
        Update: {
          access_count?: number | null
          accessed_at?: string | null
          agent_id?: string
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          importance?: number | null
          memory_type?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      applications: {
        Row: {
          applied_at: string | null
          availability_confirmed: boolean | null
          comedian_id: string
          event_id: string | null
          id: string
          is_shortlisted: boolean
          message: string | null
          requirements_acknowledged: boolean | null
          responded_at: string | null
          session_source_id: string | null
          shortlisted_at: string | null
          shortlisted_by: string | null
          spot_type: string | null
          status: string | null
        }
        Insert: {
          applied_at?: string | null
          availability_confirmed?: boolean | null
          comedian_id: string
          event_id?: string | null
          id?: string
          is_shortlisted?: boolean
          message?: string | null
          requirements_acknowledged?: boolean | null
          responded_at?: string | null
          session_source_id?: string | null
          shortlisted_at?: string | null
          shortlisted_by?: string | null
          spot_type?: string | null
          status?: string | null
        }
        Update: {
          applied_at?: string | null
          availability_confirmed?: boolean | null
          comedian_id?: string
          event_id?: string | null
          id?: string
          is_shortlisted?: boolean
          message?: string | null
          requirements_acknowledged?: boolean | null
          responded_at?: string | null
          session_source_id?: string | null
          shortlisted_at?: string | null
          shortlisted_by?: string | null
          spot_type?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "applications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "applications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "applications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_applications_comedian"
            columns: ["comedian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_management: {
        Row: {
          agency_id: string | null
          artist_id: string | null
          availability_notes: string | null
          bookings_count: number | null
          commission_earned: number | null
          commission_rate: number | null
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string
          excluded_venues: string[] | null
          exclusive_territories: string[] | null
          id: string
          is_active: boolean | null
          last_contact_at: string | null
          manager_id: string | null
          minimum_booking_fee: number | null
          notes: string | null
          preferred_event_types: string[] | null
          preferred_venues: string[] | null
          priority_level: number | null
          relationship_status: Database["public"]["Enums"]["artist_relationship_status"]
          relationship_type: string
          special_terms: string | null
          tags: string[] | null
          total_revenue: number | null
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          artist_id?: string | null
          availability_notes?: string | null
          bookings_count?: number | null
          commission_earned?: number | null
          commission_rate?: number | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          excluded_venues?: string[] | null
          exclusive_territories?: string[] | null
          id?: string
          is_active?: boolean | null
          last_contact_at?: string | null
          manager_id?: string | null
          minimum_booking_fee?: number | null
          notes?: string | null
          preferred_event_types?: string[] | null
          preferred_venues?: string[] | null
          priority_level?: number | null
          relationship_status?: Database["public"]["Enums"]["artist_relationship_status"]
          relationship_type: string
          special_terms?: string | null
          tags?: string[] | null
          total_revenue?: number | null
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          artist_id?: string | null
          availability_notes?: string | null
          bookings_count?: number | null
          commission_earned?: number | null
          commission_rate?: number | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          excluded_venues?: string[] | null
          exclusive_territories?: string[] | null
          id?: string
          is_active?: boolean | null
          last_contact_at?: string | null
          manager_id?: string | null
          minimum_booking_fee?: number | null
          notes?: string | null
          preferred_event_types?: string[] | null
          preferred_venues?: string[] | null
          priority_level?: number | null
          relationship_status?: Database["public"]["Enums"]["artist_relationship_status"]
          relationship_type?: string
          special_terms?: string | null
          tags?: string[] | null
          total_revenue?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_management_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_management_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendees: {
        Row: {
          barcode: string | null
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string | null
          email: string | null
          event_id: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          platform: string | null
          platform_attendee_id: string | null
          platform_data: Json | null
          qr_code: string | null
          status: string | null
          ticket_price: number | null
          ticket_sale_id: string | null
          ticket_type: string | null
          updated_at: string | null
        }
        Insert: {
          barcode?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string | null
          email?: string | null
          event_id?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          platform?: string | null
          platform_attendee_id?: string | null
          platform_data?: Json | null
          qr_code?: string | null
          status?: string | null
          ticket_price?: number | null
          ticket_sale_id?: string | null
          ticket_type?: string | null
          updated_at?: string | null
        }
        Update: {
          barcode?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string | null
          email?: string | null
          event_id?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          platform?: string | null
          platform_attendee_id?: string | null
          platform_data?: Json | null
          qr_code?: string | null
          status?: string | null
          ticket_price?: number | null
          ticket_sale_id?: string | null
          ticket_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "attendees_ticket_sale_id_fkey"
            columns: ["ticket_sale_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          changed_by: string | null
          changed_by_type: string | null
          changed_fields: string[] | null
          context: Json | null
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          operation: string
          record_id: string
          table_name: string
        }
        Insert: {
          changed_by?: string | null
          changed_by_type?: string | null
          changed_fields?: string[] | null
          context?: Json | null
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          operation: string
          record_id: string
          table_name: string
        }
        Update: {
          changed_by?: string | null
          changed_by_type?: string | null
          changed_fields?: string[] | null
          context?: Json | null
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          operation?: string
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      av_media: {
        Row: {
          captured_at: string | null
          created_at: string
          description: string | null
          id: string
          media_type: string
          metadata: Json
          professional_id: string
          thumbnail_url: string | null
          title: string | null
          url: string
        }
        Insert: {
          captured_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          media_type: string
          metadata?: Json
          professional_id: string
          thumbnail_url?: string | null
          title?: string | null
          url: string
        }
        Update: {
          captured_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          media_type?: string
          metadata?: Json
          professional_id?: string
          thumbnail_url?: string | null
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "av_media_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "av_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "av_media_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "av_professionals_flat_v"
            referencedColumns: ["id"]
          },
        ]
      }
      av_professionals: {
        Row: {
          bio: string | null
          business_name: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          location: string | null
          metadata: Json
          phone: string | null
          primary_role: string
          slug: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          bio?: string | null
          business_name?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          location?: string | null
          metadata?: Json
          phone?: string | null
          primary_role: string
          slug?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          bio?: string | null
          business_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          location?: string | null
          metadata?: Json
          phone?: string | null
          primary_role?: string
          slug?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      av_skill_assignments: {
        Row: {
          created_at: string
          notes: string | null
          professional_id: string
          proficiency: string | null
          skill_id: string
        }
        Insert: {
          created_at?: string
          notes?: string | null
          professional_id: string
          proficiency?: string | null
          skill_id: string
        }
        Update: {
          created_at?: string
          notes?: string | null
          professional_id?: string
          proficiency?: string | null
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "av_skill_assignments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "av_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "av_skill_assignments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "av_professionals_flat_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "av_skill_assignments_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "av_skills"
            referencedColumns: ["id"]
          },
        ]
      }
      av_skills: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      av_social_links: {
        Row: {
          created_at: string
          handle: string | null
          id: string
          is_primary: boolean | null
          platform: string
          professional_id: string
          url: string | null
        }
        Insert: {
          created_at?: string
          handle?: string | null
          id?: string
          is_primary?: boolean | null
          platform: string
          professional_id: string
          url?: string | null
        }
        Update: {
          created_at?: string
          handle?: string | null
          id?: string
          is_primary?: boolean | null
          platform?: string
          professional_id?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "av_social_links_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "av_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "av_social_links_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "av_professionals_flat_v"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_payments: {
        Row: {
          created_at: string | null
          created_by: string | null
          event_id: string | null
          id: string
          notes: string | null
          processed_at: string | null
          processing_status: string | null
          selected_bookings: string[] | null
          total_amount: number | null
          xero_batch_payment_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          processing_status?: string | null
          selected_bookings?: string[] | null
          total_amount?: number | null
          xero_batch_payment_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          processing_status?: string | null
          selected_bookings?: string[] | null
          total_amount?: number | null
          xero_batch_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "batch_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "batch_payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "batch_payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "batch_payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
        ]
      }
      booking_inquiries: {
        Row: {
          budget: number | null
          comedian_id: string
          created_at: string
          event_date: string
          event_details: string
          event_time: string | null
          id: string
          inquirer_id: string
          status: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          comedian_id: string
          created_at?: string
          event_date: string
          event_details: string
          event_time?: string | null
          id?: string
          inquirer_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          comedian_id?: string
          created_at?: string
          event_date?: string
          event_details?: string
          event_time?: string | null
          id?: string
          inquirer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      booking_request_responses: {
        Row: {
          availability_status: string | null
          booking_request_id: string
          comedian_id: string
          counter_offer_notes: string | null
          created_at: string | null
          id: string
          proposed_fee: number | null
          response_message: string | null
          response_type: string
          updated_at: string | null
        }
        Insert: {
          availability_status?: string | null
          booking_request_id: string
          comedian_id: string
          counter_offer_notes?: string | null
          created_at?: string | null
          id?: string
          proposed_fee?: number | null
          response_message?: string | null
          response_type: string
          updated_at?: string | null
        }
        Update: {
          availability_status?: string | null
          booking_request_id?: string
          comedian_id?: string
          counter_offer_notes?: string | null
          created_at?: string | null
          id?: string
          proposed_fee?: number | null
          response_message?: string | null
          response_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_request_responses_booking_request_id_fkey"
            columns: ["booking_request_id"]
            isOneToOne: false
            referencedRelation: "booking_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_request_responses_comedian_id_fkey"
            columns: ["comedian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_requests: {
        Row: {
          budget: number | null
          created_at: string
          event_date: string
          event_time: string
          event_title: string | null
          event_type: string | null
          expected_audience_size: number | null
          id: string
          notes: string | null
          performance_duration: number | null
          requested_comedian_id: string | null
          requester_id: string
          responded_comedians: Json | null
          status: string | null
          technical_requirements: string | null
          updated_at: string
          venue: string
        }
        Insert: {
          budget?: number | null
          created_at?: string
          event_date: string
          event_time: string
          event_title?: string | null
          event_type?: string | null
          expected_audience_size?: number | null
          id?: string
          notes?: string | null
          performance_duration?: number | null
          requested_comedian_id?: string | null
          requester_id: string
          responded_comedians?: Json | null
          status?: string | null
          technical_requirements?: string | null
          updated_at?: string
          venue: string
        }
        Update: {
          budget?: number | null
          created_at?: string
          event_date?: string
          event_time?: string
          event_title?: string | null
          event_type?: string | null
          expected_audience_size?: number | null
          id?: string
          notes?: string | null
          performance_duration?: number | null
          requested_comedian_id?: string | null
          requester_id?: string
          responded_comedians?: Json | null
          status?: string | null
          technical_requirements?: string | null
          updated_at?: string
          venue?: string
        }
        Relationships: []
      }
      bug_comments: {
        Row: {
          bug_id: string
          content: string
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bug_id: string
          content: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bug_id?: string
          content?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bug_comments_bug_id_fkey"
            columns: ["bug_id"]
            isOneToOne: false
            referencedRelation: "bug_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_reports: {
        Row: {
          actual_behavior: string | null
          assigned_to: string | null
          category: string | null
          closed_at: string | null
          comment_count: number | null
          created_at: string | null
          description: string
          expected_behavior: string | null
          fixed_at: string | null
          id: string
          reported_by: string
          severity: string
          status: string
          steps_to_reproduce: string | null
          title: string
          updated_at: string | null
          verified_at: string | null
        }
        Insert: {
          actual_behavior?: string | null
          assigned_to?: string | null
          category?: string | null
          closed_at?: string | null
          comment_count?: number | null
          created_at?: string | null
          description: string
          expected_behavior?: string | null
          fixed_at?: string | null
          id?: string
          reported_by: string
          severity?: string
          status?: string
          steps_to_reproduce?: string | null
          title: string
          updated_at?: string | null
          verified_at?: string | null
        }
        Update: {
          actual_behavior?: string | null
          assigned_to?: string | null
          category?: string | null
          closed_at?: string | null
          comment_count?: number | null
          created_at?: string | null
          description?: string
          expected_behavior?: string | null
          fixed_at?: string | null
          id?: string
          reported_by?: string
          severity?: string
          status?: string
          steps_to_reproduce?: string | null
          title?: string
          updated_at?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          banner_url: string | null
          calendar_sync_status: string | null
          comedian_id: string
          created_at: string
          description: string | null
          event_date: string
          event_id: string | null
          id: string
          status: string
          ticket_link: string | null
          title: string
          updated_at: string
          venue: string
        }
        Insert: {
          banner_url?: string | null
          calendar_sync_status?: string | null
          comedian_id: string
          created_at?: string
          description?: string | null
          event_date: string
          event_id?: string | null
          id?: string
          status?: string
          ticket_link?: string | null
          title: string
          updated_at?: string
          venue: string
        }
        Update: {
          banner_url?: string | null
          calendar_sync_status?: string | null
          comedian_id?: string
          created_at?: string
          description?: string | null
          event_date?: string
          event_id?: string | null
          id?: string
          status?: string
          ticket_link?: string | null
          title?: string
          updated_at?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "calendar_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "calendar_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "calendar_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
        ]
      }
      calendar_integrations: {
        Row: {
          access_token: string | null
          calendar_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          provider: string
          refresh_token: string | null
          settings: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          calendar_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          provider: string
          refresh_token?: string | null
          settings?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          calendar_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          provider?: string
          refresh_token?: string | null
          settings?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_history: {
        Row: {
          agent_id: string
          created_at: string | null
          device_id: string | null
          id: number
          message: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          device_id?: string | null
          id?: number
          message: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          device_id?: string | null
          id?: number
          message?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_sessions: {
        Row: {
          agent_ids: string[]
          context_window: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          summary: string | null
          title: string | null
          total_messages: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_ids: string[]
          context_window?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          summary?: string | null
          title?: string | null
          total_messages?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_ids?: string[]
          context_window?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          summary?: string | null
          title?: string | null
          total_messages?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      comedian_accomplishments: {
        Row: {
          accomplishment: string
          created_at: string | null
          display_order: number
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accomplishment: string
          created_at?: string | null
          display_order?: number
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accomplishment?: string
          created_at?: string | null
          display_order?: number
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      comedian_aliases: {
        Row: {
          alias: string
          comedian_id: string
          context: string | null
          created_at: string
          id: string
        }
        Insert: {
          alias: string
          comedian_id: string
          context?: string | null
          created_at?: string
          id?: string
        }
        Update: {
          alias?: string
          comedian_id?: string
          context?: string | null
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comedian_aliases_comedian_id_fkey"
            columns: ["comedian_id"]
            isOneToOne: false
            referencedRelation: "comedians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comedian_aliases_comedian_id_fkey"
            columns: ["comedian_id"]
            isOneToOne: false
            referencedRelation: "comedians_flat_v"
            referencedColumns: ["id"]
          },
        ]
      }
      comedian_blocked_dates: {
        Row: {
          comedian_id: string
          created_at: string | null
          end_date: string
          id: string
          reason: string | null
          recurring_type: string | null
          start_date: string
          time_end: string | null
          time_start: string | null
          updated_at: string | null
        }
        Insert: {
          comedian_id: string
          created_at?: string | null
          end_date: string
          id?: string
          reason?: string | null
          recurring_type?: string | null
          start_date: string
          time_end?: string | null
          time_start?: string | null
          updated_at?: string | null
        }
        Update: {
          comedian_id?: string
          created_at?: string | null
          end_date?: string
          id?: string
          reason?: string | null
          recurring_type?: string | null
          start_date?: string
          time_end?: string | null
          time_start?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comedian_blocked_dates_comedian_id_fkey"
            columns: ["comedian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comedian_bookings: {
        Row: {
          comedian_id: string | null
          created_at: string | null
          currency: string | null
          event_id: string | null
          id: string
          is_editable: boolean | null
          is_selected: boolean | null
          payment_status: string | null
          payment_type: string | null
          percentage_amount: number | null
          performance_fee: number | null
          performance_notes: string | null
          set_duration: number | null
          xero_bill_id: string | null
        }
        Insert: {
          comedian_id?: string | null
          created_at?: string | null
          currency?: string | null
          event_id?: string | null
          id?: string
          is_editable?: boolean | null
          is_selected?: boolean | null
          payment_status?: string | null
          payment_type?: string | null
          percentage_amount?: number | null
          performance_fee?: number | null
          performance_notes?: string | null
          set_duration?: number | null
          xero_bill_id?: string | null
        }
        Update: {
          comedian_id?: string | null
          created_at?: string | null
          currency?: string | null
          event_id?: string | null
          id?: string
          is_editable?: boolean | null
          is_selected?: boolean | null
          payment_status?: string | null
          payment_type?: string | null
          percentage_amount?: number | null
          performance_fee?: number | null
          performance_notes?: string | null
          set_duration?: number | null
          xero_bill_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comedian_bookings_comedian_id_fkey"
            columns: ["comedian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comedian_bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "comedian_bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comedian_bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comedian_bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comedian_bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "comedian_bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "comedian_bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
        ]
      }
      comedian_managers: {
        Row: {
          comedian_id: string
          commission_notes: string | null
          commission_percentage: number | null
          created_at: string
          end_date: string | null
          id: string
          is_primary: boolean | null
          manager_id: string
          manager_types: string[]
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          comedian_id: string
          commission_notes?: string | null
          commission_percentage?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_primary?: boolean | null
          manager_id: string
          manager_types?: string[]
          start_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          comedian_id?: string
          commission_notes?: string | null
          commission_percentage?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_primary?: boolean | null
          manager_id?: string
          manager_types?: string[]
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      comedian_media: {
        Row: {
          comedian_id: string | null
          created_at: string
          description: string | null
          display_order: number | null
          external_id: string | null
          external_type: string | null
          external_url: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_headshot: boolean | null
          media_type: string
          metadata: Json
          published_at: string | null
          show_in_epk: boolean | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string | null
          url: string
          user_id: string | null
          visibility: Database["public"]["Enums"]["media_visibility"] | null
        }
        Insert: {
          comedian_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          external_id?: string | null
          external_type?: string | null
          external_url?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_headshot?: boolean | null
          media_type: string
          metadata?: Json
          published_at?: string | null
          show_in_epk?: boolean | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          url: string
          user_id?: string | null
          visibility?: Database["public"]["Enums"]["media_visibility"] | null
        }
        Update: {
          comedian_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          external_id?: string | null
          external_type?: string | null
          external_url?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_headshot?: boolean | null
          media_type?: string
          metadata?: Json
          published_at?: string | null
          show_in_epk?: boolean | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          url?: string
          user_id?: string | null
          visibility?: Database["public"]["Enums"]["media_visibility"] | null
        }
        Relationships: [
          {
            foreignKeyName: "comedian_media_comedian_id_fkey"
            columns: ["comedian_id"]
            isOneToOne: false
            referencedRelation: "comedians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comedian_media_comedian_id_fkey"
            columns: ["comedian_id"]
            isOneToOne: false
            referencedRelation: "comedians_flat_v"
            referencedColumns: ["id"]
          },
        ]
      }
      comedian_reviews: {
        Row: {
          comedian_id: string
          created_at: string
          event_date: string | null
          event_name: string | null
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          rating: number | null
          review_text: string
          reviewer_name: string
          reviewer_title: string | null
          updated_at: string
        }
        Insert: {
          comedian_id: string
          created_at?: string
          event_date?: string | null
          event_name?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          rating?: number | null
          review_text: string
          reviewer_name: string
          reviewer_title?: string | null
          updated_at?: string
        }
        Update: {
          comedian_id?: string
          created_at?: string
          event_date?: string | null
          event_name?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          rating?: number | null
          review_text?: string
          reviewer_name?: string
          reviewer_title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comedian_reviews_comedian_id_fkey"
            columns: ["comedian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comedian_section_order: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          section_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_order: number
          id?: string
          section_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          section_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comedian_section_order_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comedian_social_links: {
        Row: {
          comedian_id: string
          created_at: string
          handle: string | null
          id: string
          is_primary: boolean | null
          platform: string
          url: string | null
        }
        Insert: {
          comedian_id: string
          created_at?: string
          handle?: string | null
          id?: string
          is_primary?: boolean | null
          platform: string
          url?: string | null
        }
        Update: {
          comedian_id?: string
          created_at?: string
          handle?: string | null
          id?: string
          is_primary?: boolean | null
          platform?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comedian_social_links_comedian_id_fkey"
            columns: ["comedian_id"]
            isOneToOne: false
            referencedRelation: "comedians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comedian_social_links_comedian_id_fkey"
            columns: ["comedian_id"]
            isOneToOne: false
            referencedRelation: "comedians_flat_v"
            referencedColumns: ["id"]
          },
        ]
      }
      comedian_tag_assignments: {
        Row: {
          comedian_id: string
          created_at: string
          tag_id: string
        }
        Insert: {
          comedian_id: string
          created_at?: string
          tag_id: string
        }
        Update: {
          comedian_id?: string
          created_at?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comedian_tag_assignments_comedian_id_fkey"
            columns: ["comedian_id"]
            isOneToOne: false
            referencedRelation: "comedians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comedian_tag_assignments_comedian_id_fkey"
            columns: ["comedian_id"]
            isOneToOne: false
            referencedRelation: "comedians_flat_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comedian_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "comedian_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      comedian_tags: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      comedians: {
        Row: {
          active: boolean
          avatar_url: string | null
          booking_email: string | null
          created_at: string
          headshot_url: string | null
          hero_image_url: string | null
          id: string
          legal_name: string | null
          logo_url: string | null
          long_bio: string | null
          management_company: string | null
          metadata: Json
          name: string | null
          origin_city: string | null
          origin_country: string | null
          pronouns: string | null
          short_bio: string | null
          slug: string | null
          stage_name: string
          updated_at: string
          url_slug: string | null
          url_slug_last_changed: string | null
          website: string | null
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          booking_email?: string | null
          created_at?: string
          headshot_url?: string | null
          hero_image_url?: string | null
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          long_bio?: string | null
          management_company?: string | null
          metadata?: Json
          name?: string | null
          origin_city?: string | null
          origin_country?: string | null
          pronouns?: string | null
          short_bio?: string | null
          slug?: string | null
          stage_name: string
          updated_at?: string
          url_slug?: string | null
          url_slug_last_changed?: string | null
          website?: string | null
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          booking_email?: string | null
          created_at?: string
          headshot_url?: string | null
          hero_image_url?: string | null
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          long_bio?: string | null
          management_company?: string | null
          metadata?: Json
          name?: string | null
          origin_city?: string | null
          origin_country?: string | null
          pronouns?: string | null
          short_bio?: string | null
          slug?: string | null
          stage_name?: string
          updated_at?: string
          url_slug?: string | null
          url_slug_last_changed?: string | null
          website?: string | null
        }
        Relationships: []
      }
      comedy_manager_profiles: {
        Row: {
          availability_status: string | null
          bio: string | null
          commission_structure: string | null
          created_at: string
          default_commission_percentage: number | null
          id: string
          manager_types: string[]
          specializations: string[] | null
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          availability_status?: string | null
          bio?: string | null
          commission_structure?: string | null
          created_at?: string
          default_commission_percentage?: number | null
          id?: string
          manager_types?: string[]
          specializations?: string[] | null
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          availability_status?: string | null
          bio?: string | null
          commission_structure?: string | null
          created_at?: string
          default_commission_percentage?: number | null
          id?: string
          manager_types?: string[]
          specializations?: string[] | null
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      common_platforms: {
        Row: {
          display_order: number | null
          id: string
          is_api_integrated: boolean | null
          notes: string | null
          platform_name: string
          typical_commission_rate: number | null
        }
        Insert: {
          display_order?: number | null
          id?: string
          is_api_integrated?: boolean | null
          notes?: string | null
          platform_name: string
          typical_commission_rate?: number | null
        }
        Update: {
          display_order?: number | null
          id?: string
          is_api_integrated?: boolean | null
          notes?: string | null
          platform_name?: string
          typical_commission_rate?: number | null
        }
        Relationships: []
      }
      contact_requests: {
        Row: {
          comedian_id: string
          created_at: string
          id: string
          message: string | null
          request_type: string
          requester_id: string
          responded_at: string | null
          response_message: string | null
          status: string
        }
        Insert: {
          comedian_id: string
          created_at?: string
          id?: string
          message?: string | null
          request_type: string
          requester_id: string
          responded_at?: string | null
          response_message?: string | null
          status?: string
        }
        Update: {
          comedian_id?: string
          created_at?: string
          id?: string
          message?: string | null
          request_type?: string
          requester_id?: string
          responded_at?: string | null
          response_message?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_requests_comedian_id_fkey"
            columns: ["comedian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_countries: {
        Row: {
          id: number
          iso: string
          iso3: string | null
          name: string
          nicename: string
          numcode: number | null
          phonecode: number
        }
        Insert: {
          id?: number
          iso: string
          iso3?: string | null
          name: string
          nicename: string
          numcode?: number | null
          phonecode: number
        }
        Update: {
          id?: number
          iso?: string
          iso3?: string | null
          name?: string
          nicename?: string
          numcode?: number | null
          phonecode?: number
        }
        Relationships: []
      }
      custom_links: {
        Row: {
          created_at: string
          custom_thumbnail_url: string | null
          description: string | null
          display_order: number
          icon_type: string | null
          id: string
          is_visible: boolean
          section_id: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_thumbnail_url?: string | null
          description?: string | null
          display_order?: number
          icon_type?: string | null
          id?: string
          is_visible?: boolean
          section_id?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_thumbnail_url?: string | null
          description?: string | null
          display_order?: number
          icon_type?: string | null
          id?: string
          is_visible?: boolean
          section_id?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_links_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "link_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          city: string | null
          country: string | null
          customer_id: string
          first_seen_at: string | null
          id: string
          is_primary: boolean | null
          label: string | null
          last_seen_at: string | null
          line_1: string | null
          line_2: string | null
          metadata: Json | null
          postcode: string | null
          source: string | null
          state: string | null
          suburb: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          customer_id: string
          first_seen_at?: string | null
          id?: string
          is_primary?: boolean | null
          label?: string | null
          last_seen_at?: string | null
          line_1?: string | null
          line_2?: string | null
          metadata?: Json | null
          postcode?: string | null
          source?: string | null
          state?: string | null
          suburb?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          customer_id?: string
          first_seen_at?: string | null
          id?: string
          is_primary?: boolean | null
          label?: string | null
          last_seen_at?: string | null
          line_1?: string | null
          line_2?: string | null
          metadata?: Json | null
          postcode?: string | null
          source?: string | null
          state?: string | null
          suburb?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_marketing_export"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_crm_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_flat_v"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customer_comedians_seen: {
        Row: {
          comedian_id: string
          comedian_stage_name: string | null
          customer_id: string
          first_seen_at: string | null
          last_seen_at: string | null
          performances_count: number
        }
        Insert: {
          comedian_id: string
          comedian_stage_name?: string | null
          customer_id: string
          first_seen_at?: string | null
          last_seen_at?: string | null
          performances_count?: number
        }
        Update: {
          comedian_id?: string
          comedian_stage_name?: string | null
          customer_id?: string
          first_seen_at?: string | null
          last_seen_at?: string | null
          performances_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_comedians_seen_comedian_id_fkey"
            columns: ["comedian_id"]
            isOneToOne: false
            referencedRelation: "comedians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_comedians_seen_comedian_id_fkey"
            columns: ["comedian_id"]
            isOneToOne: false
            referencedRelation: "comedians_flat_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_comedians_seen_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_marketing_export"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_comedians_seen_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_comedians_seen_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_crm_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_comedians_seen_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_flat_v"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customer_custom_values: {
        Row: {
          created_at: string | null
          customer_id: string
          field_id: string
          id: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          field_id: string
          id?: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          field_id?: string
          id?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_custom_values_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_marketing_export"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_custom_values_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_custom_values_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_crm_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_custom_values_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_flat_v"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_custom_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "user_custom_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_emails: {
        Row: {
          customer_id: string
          email: string
          first_seen_at: string
          id: string
          is_primary: boolean | null
          last_seen_at: string
          metadata: Json | null
          source: string
          source_identifier: string | null
          verified_at: string | null
        }
        Insert: {
          customer_id: string
          email: string
          first_seen_at?: string
          id?: string
          is_primary?: boolean | null
          last_seen_at?: string
          metadata?: Json | null
          source: string
          source_identifier?: string | null
          verified_at?: string | null
        }
        Update: {
          customer_id?: string
          email?: string
          first_seen_at?: string
          id?: string
          is_primary?: boolean | null
          last_seen_at?: string
          metadata?: Json | null
          source?: string
          source_identifier?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_emails_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_marketing_export"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_emails_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_emails_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_crm_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_emails_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_flat_v"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customer_engagement_metrics: {
        Row: {
          customer_id: string
          first_seen_at: string | null
          last_order_at: string | null
          last_seen_at: string | null
          lifetime_gross: number | null
          lifetime_net: number | null
          lifetime_orders: number | null
          lifetime_tickets: number | null
          most_recent_event_id: string | null
          most_recent_event_name: string | null
          preferred_venue: string | null
          updated_at: string
        }
        Insert: {
          customer_id: string
          first_seen_at?: string | null
          last_order_at?: string | null
          last_seen_at?: string | null
          lifetime_gross?: number | null
          lifetime_net?: number | null
          lifetime_orders?: number | null
          lifetime_tickets?: number | null
          most_recent_event_id?: string | null
          most_recent_event_name?: string | null
          preferred_venue?: string | null
          updated_at?: string
        }
        Update: {
          customer_id?: string
          first_seen_at?: string | null
          last_order_at?: string | null
          last_seen_at?: string | null
          lifetime_gross?: number | null
          lifetime_net?: number | null
          lifetime_orders?: number | null
          lifetime_tickets?: number | null
          most_recent_event_id?: string | null
          most_recent_event_name?: string | null
          preferred_venue?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_engagement_metrics_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customer_marketing_export"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_engagement_metrics_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_engagement_metrics_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers_crm_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_engagement_metrics_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers_flat_v"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customer_identities: {
        Row: {
          customer_id: string
          external_id: string
          first_seen_at: string
          id: string
          last_seen_at: string
          metadata: Json | null
          source: string
        }
        Insert: {
          customer_id: string
          external_id: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          metadata?: Json | null
          source: string
        }
        Update: {
          customer_id?: string
          external_id?: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          metadata?: Json | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_identities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_marketing_export"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_identities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_identities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_crm_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_identities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_flat_v"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customer_phones: {
        Row: {
          customer_id: string
          first_seen_at: string
          id: string
          is_primary: boolean | null
          last_seen_at: string
          metadata: Json | null
          phone_e164: string
          source: string
        }
        Insert: {
          customer_id: string
          first_seen_at?: string
          id?: string
          is_primary?: boolean | null
          last_seen_at?: string
          metadata?: Json | null
          phone_e164: string
          source: string
        }
        Update: {
          customer_id?: string
          first_seen_at?: string
          id?: string
          is_primary?: boolean | null
          last_seen_at?: string
          metadata?: Json | null
          phone_e164?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_phones_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_marketing_export"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_phones_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_phones_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_crm_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_phones_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_flat_v"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customer_profiles: {
        Row: {
          canonical_full_name: string | null
          created_at: string
          date_of_birth: string | null
          do_not_contact: boolean | null
          first_name: string | null
          id: string
          last_name: string | null
          last_scored_at: string | null
          lead_score: number | null
          marketing_opt_in: boolean | null
          meta_audience_synced_at: string | null
          meta_last_conversion_at: string | null
          notes: string | null
          rfm_frequency: number | null
          rfm_monetary: number | null
          rfm_recency: number | null
          updated_at: string
          vip: boolean | null
        }
        Insert: {
          canonical_full_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          do_not_contact?: boolean | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          last_scored_at?: string | null
          lead_score?: number | null
          marketing_opt_in?: boolean | null
          meta_audience_synced_at?: string | null
          meta_last_conversion_at?: string | null
          notes?: string | null
          rfm_frequency?: number | null
          rfm_monetary?: number | null
          rfm_recency?: number | null
          updated_at?: string
          vip?: boolean | null
        }
        Update: {
          canonical_full_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          do_not_contact?: boolean | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          last_scored_at?: string | null
          lead_score?: number | null
          marketing_opt_in?: boolean | null
          meta_audience_synced_at?: string | null
          meta_last_conversion_at?: string | null
          notes?: string | null
          rfm_frequency?: number | null
          rfm_monetary?: number | null
          rfm_recency?: number | null
          updated_at?: string
          vip?: boolean | null
        }
        Relationships: []
      }
      customer_segment_links: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          customer_id: string
          id: string
          segment_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          customer_id: string
          id?: string
          segment_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          customer_id?: string
          id?: string
          segment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_segment_links_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_marketing_export"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_segment_links_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_segment_links_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_crm_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_segment_links_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_flat_v"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_segment_links_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "segments"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_segments: {
        Row: {
          created_at: string | null
          customer_id: string
          segment: string
          source: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          segment: string
          source?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          segment?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_segments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_marketing_export"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_segments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_segments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_crm_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_segments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_flat_v"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customer_stats: {
        Row: {
          id: number
          last_customer_since: string
          total_count: number
        }
        Insert: {
          id?: number
          last_customer_since?: string
          total_count?: number
        }
        Update: {
          id?: number
          last_customer_since?: string
          total_count?: number
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          address_line1: string | null
          address_line2: string | null
          age_band: string | null
          au_state_code: string | null
          brevo_contact_id: string | null
          brevo_last_sync: string | null
          brevo_sync_error: string | null
          brevo_sync_status: string | null
          city: string | null
          company: string | null
          country: string | null
          created_at: string | null
          customer_segment: string | null
          date_of_birth: string | null
          dob: string | null
          email: string
          first_name: string | null
          fn: string | null
          id: string
          last_event_id: string | null
          last_event_name: string | null
          last_name: string | null
          last_order_date: string | null
          ln: string | null
          location: string | null
          marketing_opt_in: boolean | null
          mobile: string | null
          phone: string | null
          postcode: string | null
          preferred_venue: string | null
          source: string | null
          state: string | null
          suburb: string | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          address_line1?: string | null
          address_line2?: string | null
          age_band?: string | null
          au_state_code?: string | null
          brevo_contact_id?: string | null
          brevo_last_sync?: string | null
          brevo_sync_error?: string | null
          brevo_sync_status?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          customer_segment?: string | null
          date_of_birth?: string | null
          dob?: string | null
          email: string
          first_name?: string | null
          fn?: string | null
          id?: string
          last_event_id?: string | null
          last_event_name?: string | null
          last_name?: string | null
          last_order_date?: string | null
          ln?: string | null
          location?: string | null
          marketing_opt_in?: boolean | null
          mobile?: string | null
          phone?: string | null
          postcode?: string | null
          preferred_venue?: string | null
          source?: string | null
          state?: string | null
          suburb?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          address_line1?: string | null
          address_line2?: string | null
          age_band?: string | null
          au_state_code?: string | null
          brevo_contact_id?: string | null
          brevo_last_sync?: string | null
          brevo_sync_error?: string | null
          brevo_sync_status?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          customer_segment?: string | null
          date_of_birth?: string | null
          dob?: string | null
          email?: string
          first_name?: string | null
          fn?: string | null
          id?: string
          last_event_id?: string | null
          last_event_name?: string | null
          last_name?: string | null
          last_order_date?: string | null
          ln?: string | null
          location?: string | null
          marketing_opt_in?: boolean | null
          mobile?: string | null
          phone?: string | null
          postcode?: string | null
          preferred_venue?: string | null
          source?: string | null
          state?: string | null
          suburb?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      customers_htx: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          age_band: string | null
          city: string | null
          country: string | null
          dob: string | null
          email: string | null
          first_name: string | null
          ingested_at: string
          last_name: string | null
          phone: string | null
          postcode: string | null
          state: string | null
          suburb: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          age_band?: string | null
          city?: string | null
          country?: string | null
          dob?: string | null
          email?: string | null
          first_name?: string | null
          ingested_at?: string
          last_name?: string | null
          phone?: string | null
          postcode?: string | null
          state?: string | null
          suburb?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          age_band?: string | null
          city?: string | null
          country?: string | null
          dob?: string | null
          email?: string | null
          first_name?: string | null
          ingested_at?: string
          last_name?: string | null
          phone?: string | null
          postcode?: string | null
          state?: string | null
          suburb?: string | null
        }
        Relationships: []
      }
      customization_settings: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          settings_data: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          settings_data?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          settings_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      deal_messages: {
        Row: {
          content: string
          created_at: string
          deal_id: string | null
          id: string
          is_automated: boolean | null
          is_internal: boolean | null
          is_read: boolean | null
          message_type: string
          offer_amount: number | null
          offer_terms: Json | null
          read_at: string | null
          sender_id: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          deal_id?: string | null
          id?: string
          is_automated?: boolean | null
          is_internal?: boolean | null
          is_read?: boolean | null
          message_type?: string
          offer_amount?: number | null
          offer_terms?: Json | null
          read_at?: string | null
          sender_id?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          deal_id?: string | null
          id?: string
          is_automated?: boolean | null
          is_internal?: boolean | null
          is_read?: boolean | null
          message_type?: string
          offer_amount?: number | null
          offer_terms?: Json | null
          read_at?: string | null
          sender_id?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_messages_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deal_negotiations"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_negotiations: {
        Row: {
          accepted_at: string | null
          agency_id: string | null
          artist_id: string | null
          auto_accept_threshold: number | null
          auto_decline_threshold: number | null
          automated_responses: boolean | null
          cancellation_policy: string | null
          commission_rate: number | null
          contract_url: string | null
          counter_offers: Json | null
          created_at: string
          currency: string | null
          deadline: string | null
          deal_type: Database["public"]["Enums"]["deal_type"]
          declined_at: string | null
          description: string | null
          event_id: string | null
          expires_at: string | null
          external_deal_id: string | null
          id: string
          is_active: boolean | null
          is_template: boolean | null
          manager_id: string | null
          maximum_fee: number | null
          minimum_fee: number | null
          negotiation_notes: string | null
          negotiation_stage: Database["public"]["Enums"]["negotiation_stage"]
          negotiation_strategy: Json | null
          offers: Json | null
          performance_date: string | null
          performance_duration: number | null
          priority_level: number | null
          promoter_id: string | null
          proposed_fee: number | null
          response_count: number | null
          response_time_hours: number | null
          revision_count: number | null
          special_requirements: string | null
          status: Database["public"]["Enums"]["deal_status"]
          tags: string[] | null
          technical_requirements: string | null
          terms_and_conditions: string | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          accepted_at?: string | null
          agency_id?: string | null
          artist_id?: string | null
          auto_accept_threshold?: number | null
          auto_decline_threshold?: number | null
          automated_responses?: boolean | null
          cancellation_policy?: string | null
          commission_rate?: number | null
          contract_url?: string | null
          counter_offers?: Json | null
          created_at?: string
          currency?: string | null
          deadline?: string | null
          deal_type: Database["public"]["Enums"]["deal_type"]
          declined_at?: string | null
          description?: string | null
          event_id?: string | null
          expires_at?: string | null
          external_deal_id?: string | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          manager_id?: string | null
          maximum_fee?: number | null
          minimum_fee?: number | null
          negotiation_notes?: string | null
          negotiation_stage?: Database["public"]["Enums"]["negotiation_stage"]
          negotiation_strategy?: Json | null
          offers?: Json | null
          performance_date?: string | null
          performance_duration?: number | null
          priority_level?: number | null
          promoter_id?: string | null
          proposed_fee?: number | null
          response_count?: number | null
          response_time_hours?: number | null
          revision_count?: number | null
          special_requirements?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          tags?: string[] | null
          technical_requirements?: string | null
          terms_and_conditions?: string | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          accepted_at?: string | null
          agency_id?: string | null
          artist_id?: string | null
          auto_accept_threshold?: number | null
          auto_decline_threshold?: number | null
          automated_responses?: boolean | null
          cancellation_policy?: string | null
          commission_rate?: number | null
          contract_url?: string | null
          counter_offers?: Json | null
          created_at?: string
          currency?: string | null
          deadline?: string | null
          deal_type?: Database["public"]["Enums"]["deal_type"]
          declined_at?: string | null
          description?: string | null
          event_id?: string | null
          expires_at?: string | null
          external_deal_id?: string | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          manager_id?: string | null
          maximum_fee?: number | null
          minimum_fee?: number | null
          negotiation_notes?: string | null
          negotiation_stage?: Database["public"]["Enums"]["negotiation_stage"]
          negotiation_strategy?: Json | null
          offers?: Json | null
          performance_date?: string | null
          performance_duration?: number | null
          priority_level?: number | null
          promoter_id?: string | null
          proposed_fee?: number | null
          response_count?: number | null
          response_time_hours?: number | null
          revision_count?: number | null
          special_requirements?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          tags?: string[] | null
          technical_requirements?: string | null
          terms_and_conditions?: string | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_negotiations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_negotiations_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_negotiations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "deal_negotiations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_negotiations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_negotiations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_negotiations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "deal_negotiations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "deal_negotiations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "deal_negotiations_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_participants: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          deal_id: string
          door_split_percentage: number | null
          edit_notes: string | null
          edited_at: string | null
          edited_by: string | null
          flat_fee_amount: number | null
          gst_mode: string
          guaranteed_minimum: number | null
          id: string
          invitation_status: string | null
          invited_at: string | null
          notes: string | null
          participant_email: string | null
          participant_id: string | null
          participant_type: string
          split_percentage: number
          split_type: string
          updated_at: string
          version: number
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          deal_id: string
          door_split_percentage?: number | null
          edit_notes?: string | null
          edited_at?: string | null
          edited_by?: string | null
          flat_fee_amount?: number | null
          gst_mode?: string
          guaranteed_minimum?: number | null
          id?: string
          invitation_status?: string | null
          invited_at?: string | null
          notes?: string | null
          participant_email?: string | null
          participant_id?: string | null
          participant_type: string
          split_percentage: number
          split_type?: string
          updated_at?: string
          version?: number
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          deal_id?: string
          door_split_percentage?: number | null
          edit_notes?: string | null
          edited_at?: string | null
          edited_by?: string | null
          flat_fee_amount?: number | null
          gst_mode?: string
          guaranteed_minimum?: number | null
          id?: string
          invitation_status?: string | null
          invited_at?: string | null
          notes?: string | null
          participant_email?: string | null
          participant_id?: string | null
          participant_type?: string
          split_percentage?: number
          split_type?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "deal_participants_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "event_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      directory_import_batches: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_log: Json | null
          errors_count: number | null
          id: string
          imported_by: string | null
          name: string | null
          photos_uploaded: number | null
          profiles_created: number | null
          profiles_updated: number | null
          source_file: string | null
          started_at: string | null
          status: string | null
          total_photos: number | null
          total_profiles: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_log?: Json | null
          errors_count?: number | null
          id?: string
          imported_by?: string | null
          name?: string | null
          photos_uploaded?: number | null
          profiles_created?: number | null
          profiles_updated?: number | null
          source_file?: string | null
          started_at?: string | null
          status?: string | null
          total_photos?: number | null
          total_profiles?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_log?: Json | null
          errors_count?: number | null
          id?: string
          imported_by?: string | null
          name?: string | null
          photos_uploaded?: number | null
          profiles_created?: number | null
          profiles_updated?: number | null
          source_file?: string | null
          started_at?: string | null
          status?: string | null
          total_photos?: number | null
          total_profiles?: number | null
        }
        Relationships: []
      }
      directory_media: {
        Row: {
          alt_text: string | null
          aspect_ratio: number | null
          created_at: string | null
          directory_profile_id: string | null
          display_order: number | null
          event_date: string | null
          external_id: string | null
          external_type: string | null
          external_url: string | null
          file_name: string
          file_size: number | null
          file_type: string
          id: string
          image_height: number | null
          image_width: number | null
          import_batch_id: string | null
          is_headshot: boolean | null
          is_primary: boolean | null
          media_type: string
          photographer_credit: string | null
          public_url: string | null
          source_filename: string | null
          storage_path: string
          tags: string[] | null
          title: string | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          alt_text?: string | null
          aspect_ratio?: number | null
          created_at?: string | null
          directory_profile_id?: string | null
          display_order?: number | null
          event_date?: string | null
          external_id?: string | null
          external_type?: string | null
          external_url?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          id?: string
          image_height?: number | null
          image_width?: number | null
          import_batch_id?: string | null
          is_headshot?: boolean | null
          is_primary?: boolean | null
          media_type?: string
          photographer_credit?: string | null
          public_url?: string | null
          source_filename?: string | null
          storage_path: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          alt_text?: string | null
          aspect_ratio?: number | null
          created_at?: string | null
          directory_profile_id?: string | null
          display_order?: number | null
          event_date?: string | null
          external_id?: string | null
          external_type?: string | null
          external_url?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          id?: string
          image_height?: number | null
          image_width?: number | null
          import_batch_id?: string | null
          is_headshot?: boolean | null
          is_primary?: boolean | null
          media_type?: string
          photographer_credit?: string | null
          public_url?: string | null
          source_filename?: string | null
          storage_path?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directory_media_directory_profile_id_fkey"
            columns: ["directory_profile_id"]
            isOneToOne: false
            referencedRelation: "directory_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_media_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "directory_import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      directory_media_events: {
        Row: {
          created_at: string | null
          eb_event_id: string | null
          event_id: string | null
          htx_event_id: string | null
          id: string
          media_id: string
          session_date: string | null
          session_name: string | null
          venue_id: string | null
          venue_name: string | null
        }
        Insert: {
          created_at?: string | null
          eb_event_id?: string | null
          event_id?: string | null
          htx_event_id?: string | null
          id?: string
          media_id: string
          session_date?: string | null
          session_name?: string | null
          venue_id?: string | null
          venue_name?: string | null
        }
        Update: {
          created_at?: string | null
          eb_event_id?: string | null
          event_id?: string | null
          htx_event_id?: string | null
          id?: string
          media_id?: string
          session_date?: string | null
          session_name?: string | null
          venue_id?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directory_media_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "directory_media_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_media_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_media_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_media_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "directory_media_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "directory_media_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "directory_media_events_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "directory_media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_media_events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_media_events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_flat_v"
            referencedColumns: ["id"]
          },
        ]
      }
      directory_media_profiles: {
        Row: {
          added_at: string | null
          added_by: string | null
          approval_status: Database["public"]["Enums"]["media_tag_approval_status"]
          can_use_for_promo: boolean | null
          id: string
          is_primary_subject: boolean | null
          media_id: string
          profile_id: string
          responded_at: string | null
          role: string | null
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          approval_status?: Database["public"]["Enums"]["media_tag_approval_status"]
          can_use_for_promo?: boolean | null
          id?: string
          is_primary_subject?: boolean | null
          media_id: string
          profile_id: string
          responded_at?: string | null
          role?: string | null
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          approval_status?: Database["public"]["Enums"]["media_tag_approval_status"]
          can_use_for_promo?: boolean | null
          id?: string
          is_primary_subject?: boolean | null
          media_id?: string
          profile_id?: string
          responded_at?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directory_media_profiles_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "directory_media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_media_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "directory_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      directory_profiles: {
        Row: {
          booking_email: string | null
          claimed_at: string | null
          claimed_by: string | null
          comedians_id: string | null
          created_at: string | null
          customer_profile_id: string | null
          email: string | null
          enriched_at: string | null
          enrichment_source: string | null
          enrichment_status: string | null
          facebook_url: string | null
          hero_image_url: string | null
          id: string
          import_batch_id: string | null
          instagram_followers: number | null
          instagram_updated_at: string | null
          instagram_url: string | null
          legal_name: string | null
          long_bio: string | null
          metadata: Json | null
          origin_city: string | null
          origin_country: string | null
          primary_headshot_url: string | null
          profile_type: string | null
          pronouns: string | null
          short_bio: string | null
          slug: string | null
          source: string | null
          stage_name: string
          tags: string[] | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string | null
          website: string | null
          youtube_url: string | null
        }
        Insert: {
          booking_email?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          comedians_id?: string | null
          created_at?: string | null
          customer_profile_id?: string | null
          email?: string | null
          enriched_at?: string | null
          enrichment_source?: string | null
          enrichment_status?: string | null
          facebook_url?: string | null
          hero_image_url?: string | null
          id?: string
          import_batch_id?: string | null
          instagram_followers?: number | null
          instagram_updated_at?: string | null
          instagram_url?: string | null
          legal_name?: string | null
          long_bio?: string | null
          metadata?: Json | null
          origin_city?: string | null
          origin_country?: string | null
          primary_headshot_url?: string | null
          profile_type?: string | null
          pronouns?: string | null
          short_bio?: string | null
          slug?: string | null
          source?: string | null
          stage_name: string
          tags?: string[] | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          website?: string | null
          youtube_url?: string | null
        }
        Update: {
          booking_email?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          comedians_id?: string | null
          created_at?: string | null
          customer_profile_id?: string | null
          email?: string | null
          enriched_at?: string | null
          enrichment_source?: string | null
          enrichment_status?: string | null
          facebook_url?: string | null
          hero_image_url?: string | null
          id?: string
          import_batch_id?: string | null
          instagram_followers?: number | null
          instagram_updated_at?: string | null
          instagram_url?: string | null
          legal_name?: string | null
          long_bio?: string | null
          metadata?: Json | null
          origin_city?: string | null
          origin_country?: string | null
          primary_headshot_url?: string | null
          profile_type?: string | null
          pronouns?: string | null
          short_bio?: string | null
          slug?: string | null
          source?: string | null
          stage_name?: string
          tags?: string[] | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          website?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directory_profiles_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "directory_import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      edm_campaigns: {
        Row: {
          content: string | null
          created_at: string | null
          failed_count: number | null
          id: string
          provider_id: string | null
          recipient_count: number | null
          scheduled_for: string | null
          segment_id: string | null
          sent_at: string | null
          sent_count: number | null
          status: string | null
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          failed_count?: number | null
          id?: string
          provider_id?: string | null
          recipient_count?: number | null
          scheduled_for?: string | null
          segment_id?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          failed_count?: number | null
          id?: string
          provider_id?: string | null
          recipient_count?: number | null
          scheduled_for?: string | null
          segment_id?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "edm_campaigns_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "edm_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edm_campaigns_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "segments"
            referencedColumns: ["id"]
          },
        ]
      }
      edm_providers: {
        Row: {
          config: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          provider_name: string
          provider_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          provider_name: string
          provider_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          provider_name?: string
          provider_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      epk_album_selections: {
        Row: {
          album_id: string
          comedian_id: string
          created_at: string | null
          display_order: number | null
          id: string
        }
        Insert: {
          album_id: string
          comedian_id: string
          created_at?: string | null
          display_order?: number | null
          id?: string
        }
        Update: {
          album_id?: string
          comedian_id?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "epk_album_selections_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "media_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epk_album_selections_comedian_id_fkey"
            columns: ["comedian_id"]
            isOneToOne: false
            referencedRelation: "comedians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epk_album_selections_comedian_id_fkey"
            columns: ["comedian_id"]
            isOneToOne: false
            referencedRelation: "comedians_flat_v"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          action: string | null
          category: string
          component: string | null
          created_at: string
          id: string
          message: string
          metadata: Json | null
          resolution_notes: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          stack: string | null
          timestamp: string
          updated_at: string
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          category: string
          component?: string | null
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          stack?: string | null
          timestamp?: string
          updated_at?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          category?: string
          component?: string | null
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          stack?: string | null
          timestamp?: string
          updated_at?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      event_co_promoters: {
        Row: {
          assigned_at: string
          assigned_by: string
          event_id: string
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          event_id: string
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          event_id?: string
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_co_promoters_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_co_promoters_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_co_promoters_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_co_promoters_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_co_promoters_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_co_promoters_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_co_promoters_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
        ]
      }
      event_deals: {
        Row: {
          created_at: string
          created_by: string | null
          deal_name: string
          deal_type: string
          event_id: string
          fully_approved_at: string | null
          id: string
          settled_at: string | null
          settled_by: string | null
          status: string
          submitted_for_approval_at: string | null
          total_revenue: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deal_name: string
          deal_type: string
          event_id: string
          fully_approved_at?: string | null
          id?: string
          settled_at?: string | null
          settled_by?: string | null
          status?: string
          submitted_for_approval_at?: string | null
          total_revenue?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deal_name?: string
          deal_type?: string
          event_id?: string
          fully_approved_at?: string | null
          id?: string
          settled_at?: string | null
          settled_by?: string | null
          status?: string
          submitted_for_approval_at?: string | null
          total_revenue?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_deals_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_deals_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_deals_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_deals_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_deals_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_deals_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_deals_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
        ]
      }
      event_partners: {
        Row: {
          added_by: string | null
          can_edit_event: boolean
          can_manage_financials: boolean
          can_receive_crm_data: boolean
          can_view_details: boolean
          can_view_financials: boolean
          created_at: string
          event_id: string
          id: string
          invited_email: string | null
          partner_profile_id: string | null
          partner_type: string
          source_deal_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          added_by?: string | null
          can_edit_event?: boolean
          can_manage_financials?: boolean
          can_receive_crm_data?: boolean
          can_view_details?: boolean
          can_view_financials?: boolean
          created_at?: string
          event_id: string
          id?: string
          invited_email?: string | null
          partner_profile_id?: string | null
          partner_type?: string
          source_deal_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          added_by?: string | null
          can_edit_event?: boolean
          can_manage_financials?: boolean
          can_receive_crm_data?: boolean
          can_view_details?: boolean
          can_view_financials?: boolean
          created_at?: string
          event_id?: string
          id?: string
          invited_email?: string | null
          partner_profile_id?: string | null
          partner_type?: string
          source_deal_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_partners_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_partners_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_partners_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_partners_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_partners_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_partners_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_partners_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_partners_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_partners_partner_profile_id_fkey"
            columns: ["partner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_partners_source_deal_id_fkey"
            columns: ["source_deal_id"]
            isOneToOne: false
            referencedRelation: "event_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      event_spot_line_items: {
        Row: {
          amount: number
          created_at: string | null
          display_order: number | null
          event_spot_id: string
          gst_type: string | null
          id: string
          label: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          display_order?: number | null
          event_spot_id: string
          gst_type?: string | null
          id?: string
          label: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          display_order?: number | null
          event_spot_id?: string
          gst_type?: string | null
          id?: string
          label?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_spot_line_items_event_spot_id_fkey"
            columns: ["event_spot_id"]
            isOneToOne: false
            referencedRelation: "event_spots"
            referencedColumns: ["id"]
          },
        ]
      }
      event_spots: {
        Row: {
          comedian_id: string | null
          confirmation_deadline: string | null
          confirmation_status: string | null
          confirmed_at: string | null
          created_at: string
          currency: string
          declined_at: string | null
          duration_minutes: number | null
          event_id: string
          extra_type: string | null
          gst_mode: string
          hours: number | null
          id: string
          is_filled: boolean
          is_paid: boolean
          notified_at: string | null
          notified_comedian_id: string | null
          payment_amount: number | null
          payment_gross: number | null
          payment_gst_type: string | null
          payment_net: number | null
          payment_notes: string | null
          payment_status: string | null
          payment_tax: number | null
          rate_type: string | null
          scheduled_start_time: string | null
          spot_category: string | null
          spot_name: string
          spot_order: number
          spot_type: string | null
          staff_avatar: string | null
          staff_id: string | null
          staff_name: string | null
          start_time_mode: string | null
          tax_included: boolean | null
          tax_rate: number | null
          updated_at: string
        }
        Insert: {
          comedian_id?: string | null
          confirmation_deadline?: string | null
          confirmation_status?: string | null
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          declined_at?: string | null
          duration_minutes?: number | null
          event_id: string
          extra_type?: string | null
          gst_mode?: string
          hours?: number | null
          id?: string
          is_filled?: boolean
          is_paid?: boolean
          notified_at?: string | null
          notified_comedian_id?: string | null
          payment_amount?: number | null
          payment_gross?: number | null
          payment_gst_type?: string | null
          payment_net?: number | null
          payment_notes?: string | null
          payment_status?: string | null
          payment_tax?: number | null
          rate_type?: string | null
          scheduled_start_time?: string | null
          spot_category?: string | null
          spot_name: string
          spot_order?: number
          spot_type?: string | null
          staff_avatar?: string | null
          staff_id?: string | null
          staff_name?: string | null
          start_time_mode?: string | null
          tax_included?: boolean | null
          tax_rate?: number | null
          updated_at?: string
        }
        Update: {
          comedian_id?: string | null
          confirmation_deadline?: string | null
          confirmation_status?: string | null
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          declined_at?: string | null
          duration_minutes?: number | null
          event_id?: string
          extra_type?: string | null
          gst_mode?: string
          hours?: number | null
          id?: string
          is_filled?: boolean
          is_paid?: boolean
          notified_at?: string | null
          notified_comedian_id?: string | null
          payment_amount?: number | null
          payment_gross?: number | null
          payment_gst_type?: string | null
          payment_net?: number | null
          payment_notes?: string | null
          payment_status?: string | null
          payment_tax?: number | null
          rate_type?: string | null
          scheduled_start_time?: string | null
          spot_category?: string | null
          spot_name?: string
          spot_order?: number
          spot_type?: string | null
          staff_avatar?: string | null
          staff_id?: string | null
          staff_name?: string | null
          start_time_mode?: string | null
          tax_included?: boolean | null
          tax_rate?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_event_spots_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_event_spots_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_event_spots_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_event_spots_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_event_spots_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_event_spots_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_event_spots_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
        ]
      }
      event_templates: {
        Row: {
          created_at: string
          id: string
          name: string
          promoter_id: string
          template_data: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          promoter_id: string
          template_data: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          promoter_id?: string
          template_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      event_visual_artists: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          notes: string | null
          rate_agreed: number | null
          role: string | null
          status: string | null
          updated_at: string | null
          visual_artist_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          notes?: string | null
          rate_agreed?: number | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
          visual_artist_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          rate_agreed?: number | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
          visual_artist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_visual_artists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_visual_artists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_visual_artists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_visual_artists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_visual_artists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_visual_artists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_visual_artists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_visual_artists_visual_artist_id_fkey"
            columns: ["visual_artist_id"]
            isOneToOne: false
            referencedRelation: "visual_artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_waitlists: {
        Row: {
          created_at: string
          email: string
          event_id: string
          first_name: string
          id: string
          is_notified: boolean
          last_name: string
          mobile: string
          position: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          event_id: string
          first_name: string
          id?: string
          is_notified?: boolean
          last_name: string
          mobile: string
          position?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          event_id?: string
          first_name?: string
          id?: string
          is_notified?: boolean
          last_name?: string
          mobile?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_waitlists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_waitlists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_waitlists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_waitlists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_waitlists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_waitlists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_waitlists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
        ]
      }
      eventbrite_event_sales_summary: {
        Row: {
          addons_revenue: number | null
          addons_sold: number | null
          complimentary_tickets_sold: number | null
          currency: string
          event_location: string
          event_name: string
          event_start_date: string
          event_start_time: string
          event_timezone: string | null
          eventbrite_payment_processing_fee: number | null
          eventbrite_service_fee: number | null
          eventbrite_tax: number | null
          gross_sales: number | null
          ingested_at: string | null
          net_sales: number | null
          organiser_tax: number | null
          paid_tickets_sold: number | null
          raw: Json | null
          royalty: number | null
          ticket_addons_revenue: number | null
          ticket_revenue: number | null
          tickets_sold: number | null
        }
        Insert: {
          addons_revenue?: number | null
          addons_sold?: number | null
          complimentary_tickets_sold?: number | null
          currency: string
          event_location: string
          event_name: string
          event_start_date: string
          event_start_time: string
          event_timezone?: string | null
          eventbrite_payment_processing_fee?: number | null
          eventbrite_service_fee?: number | null
          eventbrite_tax?: number | null
          gross_sales?: number | null
          ingested_at?: string | null
          net_sales?: number | null
          organiser_tax?: number | null
          paid_tickets_sold?: number | null
          raw?: Json | null
          royalty?: number | null
          ticket_addons_revenue?: number | null
          ticket_revenue?: number | null
          tickets_sold?: number | null
        }
        Update: {
          addons_revenue?: number | null
          addons_sold?: number | null
          complimentary_tickets_sold?: number | null
          currency?: string
          event_location?: string
          event_name?: string
          event_start_date?: string
          event_start_time?: string
          event_timezone?: string | null
          eventbrite_payment_processing_fee?: number | null
          eventbrite_service_fee?: number | null
          eventbrite_tax?: number | null
          gross_sales?: number | null
          ingested_at?: string | null
          net_sales?: number | null
          organiser_tax?: number | null
          paid_tickets_sold?: number | null
          raw?: Json | null
          royalty?: number | null
          ticket_addons_revenue?: number | null
          ticket_revenue?: number | null
          tickets_sold?: number | null
        }
        Relationships: []
      }
      events: {
        Row: {
          address: string | null
          age_restriction: string | null
          allow_recording: boolean | null
          applied_spots: number | null
          banner_position: Json | null
          banner_url: string | null
          canonical_session_source_id: string | null
          capacity: number | null
          city: string | null
          co_promoter_ids: string[] | null
          comedian_slots: number | null
          country: string | null
          created_at: string | null
          created_by_organization_id: string | null
          currency: string | null
          description: string | null
          details: string | null
          dress_code: string | null
          duration: string | null
          duration_minutes: number | null
          end_time: string | null
          event_date: string | null
          eventbrite_event_id: string | null
          featured: boolean | null
          fees_dollars: number | null
          filled_slots: number | null
          gross_dollars: number | null
          hero_image_url: string | null
          humanitix_event_id: string | null
          id: string
          is_paid: boolean | null
          is_recurring: boolean | null
          is_synced: boolean | null
          is_verified_only: boolean | null
          last_order_at: string | null
          latitude: string | null
          lineup_published_at: string | null
          longitude: string | null
          name: string | null
          net_dollars: number | null
          order_count: number | null
          organization_id: string | null
          parent_event_id: string | null
          pay: string | null
          pay_per_comedian: number | null
          platforms_count: number | null
          profit_margin: number | null
          promoter_id: string | null
          published_at: string | null
          raw: Json | null
          recurrence_end_date: string | null
          recurrence_pattern: string | null
          requirements: string | null
          series_id: string | null
          settlement_status: string | null
          source: string | null
          source_id: string | null
          spots: number | null
          start_time: string | null
          state: string | null
          status: string | null
          synced_at: string | null
          tax_dollars: number | null
          ticket_count: number | null
          ticket_popup_url: string | null
          ticket_price: number | null
          ticket_url: string | null
          tickets_sold: number | null
          title: string | null
          total_costs: number | null
          total_gross_sales: number | null
          total_revenue: number | null
          total_tickets_sold: number | null
          type: string | null
          updated_at: string | null
          venue: string | null
          xero_invoice_id: string | null
        }
        Insert: {
          address?: string | null
          age_restriction?: string | null
          allow_recording?: boolean | null
          applied_spots?: number | null
          banner_position?: Json | null
          banner_url?: string | null
          canonical_session_source_id?: string | null
          capacity?: number | null
          city?: string | null
          co_promoter_ids?: string[] | null
          comedian_slots?: number | null
          country?: string | null
          created_at?: string | null
          created_by_organization_id?: string | null
          currency?: string | null
          description?: string | null
          details?: string | null
          dress_code?: string | null
          duration?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          event_date?: string | null
          eventbrite_event_id?: string | null
          featured?: boolean | null
          fees_dollars?: number | null
          filled_slots?: number | null
          gross_dollars?: number | null
          hero_image_url?: string | null
          humanitix_event_id?: string | null
          id?: string
          is_paid?: boolean | null
          is_recurring?: boolean | null
          is_synced?: boolean | null
          is_verified_only?: boolean | null
          last_order_at?: string | null
          latitude?: string | null
          lineup_published_at?: string | null
          longitude?: string | null
          name?: string | null
          net_dollars?: number | null
          order_count?: number | null
          organization_id?: string | null
          parent_event_id?: string | null
          pay?: string | null
          pay_per_comedian?: number | null
          platforms_count?: number | null
          profit_margin?: number | null
          promoter_id?: string | null
          published_at?: string | null
          raw?: Json | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          requirements?: string | null
          series_id?: string | null
          settlement_status?: string | null
          source?: string | null
          source_id?: string | null
          spots?: number | null
          start_time?: string | null
          state?: string | null
          status?: string | null
          synced_at?: string | null
          tax_dollars?: number | null
          ticket_count?: number | null
          ticket_popup_url?: string | null
          ticket_price?: number | null
          ticket_url?: string | null
          tickets_sold?: number | null
          title?: string | null
          total_costs?: number | null
          total_gross_sales?: number | null
          total_revenue?: number | null
          total_tickets_sold?: number | null
          type?: string | null
          updated_at?: string | null
          venue?: string | null
          xero_invoice_id?: string | null
        }
        Update: {
          address?: string | null
          age_restriction?: string | null
          allow_recording?: boolean | null
          applied_spots?: number | null
          banner_position?: Json | null
          banner_url?: string | null
          canonical_session_source_id?: string | null
          capacity?: number | null
          city?: string | null
          co_promoter_ids?: string[] | null
          comedian_slots?: number | null
          country?: string | null
          created_at?: string | null
          created_by_organization_id?: string | null
          currency?: string | null
          description?: string | null
          details?: string | null
          dress_code?: string | null
          duration?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          event_date?: string | null
          eventbrite_event_id?: string | null
          featured?: boolean | null
          fees_dollars?: number | null
          filled_slots?: number | null
          gross_dollars?: number | null
          hero_image_url?: string | null
          humanitix_event_id?: string | null
          id?: string
          is_paid?: boolean | null
          is_recurring?: boolean | null
          is_synced?: boolean | null
          is_verified_only?: boolean | null
          last_order_at?: string | null
          latitude?: string | null
          lineup_published_at?: string | null
          longitude?: string | null
          name?: string | null
          net_dollars?: number | null
          order_count?: number | null
          organization_id?: string | null
          parent_event_id?: string | null
          pay?: string | null
          pay_per_comedian?: number | null
          platforms_count?: number | null
          profit_margin?: number | null
          promoter_id?: string | null
          published_at?: string | null
          raw?: Json | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          requirements?: string | null
          series_id?: string | null
          settlement_status?: string | null
          source?: string | null
          source_id?: string | null
          spots?: number | null
          start_time?: string | null
          state?: string | null
          status?: string | null
          synced_at?: string | null
          tax_dollars?: number | null
          ticket_count?: number | null
          ticket_popup_url?: string | null
          ticket_price?: number | null
          ticket_url?: string | null
          tickets_sold?: number | null
          title?: string | null
          total_costs?: number | null
          total_gross_sales?: number | null
          total_revenue?: number | null
          total_tickets_sold?: number | null
          type?: string | null
          updated_at?: string | null
          venue?: string | null
          xero_invoice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_organization_id_fkey"
            columns: ["created_by_organization_id"]
            isOneToOne: false
            referencedRelation: "organization_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_events_parent"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_events_parent"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_events_parent"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_events_parent"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_events_parent"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_events_parent"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_events_parent"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
        ]
      }
      events_htx: {
        Row: {
          accessibility_audio_description: boolean | null
          accessibility_auslan_interpreted: boolean | null
          accessibility_captioned: boolean | null
          accessibility_companion_card: boolean | null
          accessibility_hearing_loop: boolean | null
          accessibility_notes: string | null
          accessibility_relaxed_performance: boolean | null
          accessibility_wheelchair_accessible: boolean | null
          additional_questions: Json | null
          affiliate_code: string | null
          artists: Json | null
          banner_image_url: string | null
          calendar_group: string | null
          category: string | null
          classification: Json | null
          created_at: string | null
          currency: string | null
          dates: Json | null
          description: string | null
          details: string | null
          display_mode: string | null
          end_date: string | null
          enddate: string | null
          eventlocation: Json | null
          feature_image_url: string | null
          festival_end: string | null
          festival_name: string | null
          festival_start: string | null
          hero_image_url: string | null
          ingested_at: string | null
          keywords: Json | null
          location: string | null
          location_instructions: string | null
          location_type: string | null
          marked_as_sold_out: boolean | null
          markedassoldout: boolean | null
          name: string | null
          online_url: string | null
          organiser_id: string | null
          organiserid: string | null
          packaged_tickets: Json | null
          payment_options_afterpay: boolean | null
          payment_options_card: boolean | null
          payment_options_cash: boolean | null
          payment_options_complimentary: boolean | null
          payment_options_invoice: boolean | null
          payment_options_paypal: boolean | null
          payment_options_zip: boolean | null
          pricing_currency: string | null
          pricing_fees_included: boolean | null
          pricing_maximum: number | null
          pricing_minimum: number | null
          pricing_payment_plan_enabled: boolean | null
          promoter_id: string | null
          public: boolean | null
          published: boolean | null
          published_at: string | null
          raw: Json | null
          redirect_url: string | null
          show_type: string | null
          slug: string | null
          social_image_url: string | null
          source: string | null
          source_id: string | null
          start_date: string | null
          startdate: string | null
          status: string | null
          suspended_sales: boolean | null
          suspendedsale: boolean | null
          tag_ids: Json | null
          tags: Json | null
          ticket_types: Json | null
          timezone: string | null
          title: string | null
          total_capacity: number | null
          totalcapacity: number | null
          updated_at: string | null
          updated_at_api: string | null
          url: string | null
          user_id: string | null
          userid: string | null
          venue_address: string | null
          venue_city: string | null
          venue_country: string | null
          venue_lat_lng: Json | null
          venue_name: string | null
        }
        Insert: {
          accessibility_audio_description?: boolean | null
          accessibility_auslan_interpreted?: boolean | null
          accessibility_captioned?: boolean | null
          accessibility_companion_card?: boolean | null
          accessibility_hearing_loop?: boolean | null
          accessibility_notes?: string | null
          accessibility_relaxed_performance?: boolean | null
          accessibility_wheelchair_accessible?: boolean | null
          additional_questions?: Json | null
          affiliate_code?: string | null
          artists?: Json | null
          banner_image_url?: string | null
          calendar_group?: string | null
          category?: string | null
          classification?: Json | null
          created_at?: string | null
          currency?: string | null
          dates?: Json | null
          description?: string | null
          details?: string | null
          display_mode?: string | null
          end_date?: string | null
          enddate?: string | null
          eventlocation?: Json | null
          feature_image_url?: string | null
          festival_end?: string | null
          festival_name?: string | null
          festival_start?: string | null
          hero_image_url?: string | null
          ingested_at?: string | null
          keywords?: Json | null
          location?: string | null
          location_instructions?: string | null
          location_type?: string | null
          marked_as_sold_out?: boolean | null
          markedassoldout?: boolean | null
          name?: string | null
          online_url?: string | null
          organiser_id?: string | null
          organiserid?: string | null
          packaged_tickets?: Json | null
          payment_options_afterpay?: boolean | null
          payment_options_card?: boolean | null
          payment_options_cash?: boolean | null
          payment_options_complimentary?: boolean | null
          payment_options_invoice?: boolean | null
          payment_options_paypal?: boolean | null
          payment_options_zip?: boolean | null
          pricing_currency?: string | null
          pricing_fees_included?: boolean | null
          pricing_maximum?: number | null
          pricing_minimum?: number | null
          pricing_payment_plan_enabled?: boolean | null
          promoter_id?: string | null
          public?: boolean | null
          published?: boolean | null
          published_at?: string | null
          raw?: Json | null
          redirect_url?: string | null
          show_type?: string | null
          slug?: string | null
          social_image_url?: string | null
          source?: string | null
          source_id?: string | null
          start_date?: string | null
          startdate?: string | null
          status?: string | null
          suspended_sales?: boolean | null
          suspendedsale?: boolean | null
          tag_ids?: Json | null
          tags?: Json | null
          ticket_types?: Json | null
          timezone?: string | null
          title?: string | null
          total_capacity?: number | null
          totalcapacity?: number | null
          updated_at?: string | null
          updated_at_api?: string | null
          url?: string | null
          user_id?: string | null
          userid?: string | null
          venue_address?: string | null
          venue_city?: string | null
          venue_country?: string | null
          venue_lat_lng?: Json | null
          venue_name?: string | null
        }
        Update: {
          accessibility_audio_description?: boolean | null
          accessibility_auslan_interpreted?: boolean | null
          accessibility_captioned?: boolean | null
          accessibility_companion_card?: boolean | null
          accessibility_hearing_loop?: boolean | null
          accessibility_notes?: string | null
          accessibility_relaxed_performance?: boolean | null
          accessibility_wheelchair_accessible?: boolean | null
          additional_questions?: Json | null
          affiliate_code?: string | null
          artists?: Json | null
          banner_image_url?: string | null
          calendar_group?: string | null
          category?: string | null
          classification?: Json | null
          created_at?: string | null
          currency?: string | null
          dates?: Json | null
          description?: string | null
          details?: string | null
          display_mode?: string | null
          end_date?: string | null
          enddate?: string | null
          eventlocation?: Json | null
          feature_image_url?: string | null
          festival_end?: string | null
          festival_name?: string | null
          festival_start?: string | null
          hero_image_url?: string | null
          ingested_at?: string | null
          keywords?: Json | null
          location?: string | null
          location_instructions?: string | null
          location_type?: string | null
          marked_as_sold_out?: boolean | null
          markedassoldout?: boolean | null
          name?: string | null
          online_url?: string | null
          organiser_id?: string | null
          organiserid?: string | null
          packaged_tickets?: Json | null
          payment_options_afterpay?: boolean | null
          payment_options_card?: boolean | null
          payment_options_cash?: boolean | null
          payment_options_complimentary?: boolean | null
          payment_options_invoice?: boolean | null
          payment_options_paypal?: boolean | null
          payment_options_zip?: boolean | null
          pricing_currency?: string | null
          pricing_fees_included?: boolean | null
          pricing_maximum?: number | null
          pricing_minimum?: number | null
          pricing_payment_plan_enabled?: boolean | null
          promoter_id?: string | null
          public?: boolean | null
          published?: boolean | null
          published_at?: string | null
          raw?: Json | null
          redirect_url?: string | null
          show_type?: string | null
          slug?: string | null
          social_image_url?: string | null
          source?: string | null
          source_id?: string | null
          start_date?: string | null
          startdate?: string | null
          status?: string | null
          suspended_sales?: boolean | null
          suspendedsale?: boolean | null
          tag_ids?: Json | null
          tags?: Json | null
          ticket_types?: Json | null
          timezone?: string | null
          title?: string | null
          total_capacity?: number | null
          totalcapacity?: number | null
          updated_at?: string | null
          updated_at_api?: string | null
          url?: string | null
          user_id?: string | null
          userid?: string | null
          venue_address?: string | null
          venue_city?: string | null
          venue_country?: string | null
          venue_lat_lng?: Json | null
          venue_name?: string | null
        }
        Relationships: []
      }
      feature_comments: {
        Row: {
          content: string
          created_at: string | null
          feature_id: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          feature_id: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          feature_id?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_comments_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "feature_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_requests: {
        Row: {
          category: string | null
          comment_count: number | null
          completed_at: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          priority: number | null
          status: string
          title: string
          updated_at: string | null
          vote_count: number | null
        }
        Insert: {
          category?: string | null
          comment_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          priority?: number | null
          status?: string
          title: string
          updated_at?: string | null
          vote_count?: number | null
        }
        Update: {
          category?: string | null
          comment_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          priority?: number | null
          status?: string
          title?: string
          updated_at?: string | null
          vote_count?: number | null
        }
        Relationships: []
      }
      feature_votes: {
        Row: {
          created_at: string | null
          feature_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feature_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          feature_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_votes_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "feature_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_reports: {
        Row: {
          attendance_rate: number | null
          event_id: string | null
          generated_at: string | null
          id: string
          marketing_costs: number | null
          net_profit: number | null
          profit_margin_percentage: number | null
          report_period_end: string | null
          report_period_start: string | null
          tickets_sold: number | null
          total_performer_costs: number | null
          total_ticket_revenue: number | null
          venue_costs: number | null
        }
        Insert: {
          attendance_rate?: number | null
          event_id?: string | null
          generated_at?: string | null
          id?: string
          marketing_costs?: number | null
          net_profit?: number | null
          profit_margin_percentage?: number | null
          report_period_end?: string | null
          report_period_start?: string | null
          tickets_sold?: number | null
          total_performer_costs?: number | null
          total_ticket_revenue?: number | null
          venue_costs?: number | null
        }
        Update: {
          attendance_rate?: number | null
          event_id?: string | null
          generated_at?: string | null
          id?: string
          marketing_costs?: number | null
          net_profit?: number | null
          profit_margin_percentage?: number | null
          report_period_end?: string | null
          report_period_start?: string | null
          tickets_sold?: number | null
          total_performer_costs?: number | null
          total_ticket_revenue?: number | null
          venue_costs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "financial_reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "financial_reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "financial_reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
        ]
      }
      flight_api_config: {
        Row: {
          api_endpoint: string
          api_key: string | null
          consecutive_errors: number | null
          created_at: string | null
          current_usage: number | null
          id: string
          is_active: boolean | null
          last_error: string | null
          last_error_time: string | null
          priority: number | null
          provider_name: string
          rate_limit_per_hour: number | null
          supported_features: Json | null
          updated_at: string | null
          usage_reset_time: string | null
        }
        Insert: {
          api_endpoint: string
          api_key?: string | null
          consecutive_errors?: number | null
          created_at?: string | null
          current_usage?: number | null
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_error_time?: string | null
          priority?: number | null
          provider_name: string
          rate_limit_per_hour?: number | null
          supported_features?: Json | null
          updated_at?: string | null
          usage_reset_time?: string | null
        }
        Update: {
          api_endpoint?: string
          api_key?: string | null
          consecutive_errors?: number | null
          created_at?: string | null
          current_usage?: number | null
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_error_time?: string | null
          priority?: number | null
          provider_name?: string
          rate_limit_per_hour?: number | null
          supported_features?: Json | null
          updated_at?: string | null
          usage_reset_time?: string | null
        }
        Relationships: []
      }
      flight_bookings: {
        Row: {
          actual_arrival: string | null
          actual_departure: string | null
          airline: string
          api_check_count: number | null
          arrival_airport: string
          baggage_claim: string | null
          booking_reference: string
          confirmation_code: string | null
          created_at: string | null
          currency: string | null
          departure_airport: string
          fare_class: string | null
          flight_number: string
          gate: string | null
          id: string
          is_tracked: boolean | null
          last_api_check: string | null
          metadata: Json | null
          next_api_check: string | null
          notes: string | null
          price: number | null
          scheduled_arrival: string
          scheduled_departure: string
          seat_number: string | null
          status: Database["public"]["Enums"]["flight_status"] | null
          terminal: string | null
          ticket_number: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_arrival?: string | null
          actual_departure?: string | null
          airline: string
          api_check_count?: number | null
          arrival_airport: string
          baggage_claim?: string | null
          booking_reference: string
          confirmation_code?: string | null
          created_at?: string | null
          currency?: string | null
          departure_airport: string
          fare_class?: string | null
          flight_number: string
          gate?: string | null
          id?: string
          is_tracked?: boolean | null
          last_api_check?: string | null
          metadata?: Json | null
          next_api_check?: string | null
          notes?: string | null
          price?: number | null
          scheduled_arrival: string
          scheduled_departure: string
          seat_number?: string | null
          status?: Database["public"]["Enums"]["flight_status"] | null
          terminal?: string | null
          ticket_number?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_arrival?: string | null
          actual_departure?: string | null
          airline?: string
          api_check_count?: number | null
          arrival_airport?: string
          baggage_claim?: string | null
          booking_reference?: string
          confirmation_code?: string | null
          created_at?: string | null
          currency?: string | null
          departure_airport?: string
          fare_class?: string | null
          flight_number?: string
          gate?: string | null
          id?: string
          is_tracked?: boolean | null
          last_api_check?: string | null
          metadata?: Json | null
          next_api_check?: string | null
          notes?: string | null
          price?: number | null
          scheduled_arrival?: string
          scheduled_departure?: string
          seat_number?: string | null
          status?: Database["public"]["Enums"]["flight_status"] | null
          terminal?: string | null
          ticket_number?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      flight_notifications: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          flight_booking_id: string | null
          id: string
          last_notification_sent: string | null
          notification_preference:
            | Database["public"]["Enums"]["notification_preference"]
            | null
          notify_hours_before: number | null
          notify_on_cancellation: boolean | null
          notify_on_delay: boolean | null
          notify_on_gate_change: boolean | null
          phone_number: string | null
          push_notifications: boolean | null
          sms_notifications: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          flight_booking_id?: string | null
          id?: string
          last_notification_sent?: string | null
          notification_preference?:
            | Database["public"]["Enums"]["notification_preference"]
            | null
          notify_hours_before?: number | null
          notify_on_cancellation?: boolean | null
          notify_on_delay?: boolean | null
          notify_on_gate_change?: boolean | null
          phone_number?: string | null
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          flight_booking_id?: string | null
          id?: string
          last_notification_sent?: string | null
          notification_preference?:
            | Database["public"]["Enums"]["notification_preference"]
            | null
          notify_hours_before?: number | null
          notify_on_cancellation?: boolean | null
          notify_on_delay?: boolean | null
          notify_on_gate_change?: boolean | null
          phone_number?: string | null
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flight_notifications_flight_booking_id_fkey"
            columns: ["flight_booking_id"]
            isOneToOne: false
            referencedRelation: "flight_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      flight_search_cache: {
        Row: {
          api_provider: string | null
          created_at: string | null
          departure_date: string
          expires_at: string | null
          flight_number: string
          id: string
          result_data: Json
          search_key: string
        }
        Insert: {
          api_provider?: string | null
          created_at?: string | null
          departure_date: string
          expires_at?: string | null
          flight_number: string
          id?: string
          result_data: Json
          search_key: string
        }
        Update: {
          api_provider?: string | null
          created_at?: string | null
          departure_date?: string
          expires_at?: string | null
          flight_number?: string
          id?: string
          result_data?: Json
          search_key?: string
        }
        Relationships: []
      }
      flight_status_updates: {
        Row: {
          created_at: string | null
          delay_minutes: number | null
          delay_reason: string | null
          flight_booking_id: string
          gate_change: string | null
          id: string
          new_arrival_time: string | null
          new_departure_time: string | null
          new_status: Database["public"]["Enums"]["flight_status"]
          previous_status: Database["public"]["Enums"]["flight_status"] | null
          status_details: Json | null
          terminal_change: string | null
          update_source: Database["public"]["Enums"]["update_source"] | null
        }
        Insert: {
          created_at?: string | null
          delay_minutes?: number | null
          delay_reason?: string | null
          flight_booking_id: string
          gate_change?: string | null
          id?: string
          new_arrival_time?: string | null
          new_departure_time?: string | null
          new_status: Database["public"]["Enums"]["flight_status"]
          previous_status?: Database["public"]["Enums"]["flight_status"] | null
          status_details?: Json | null
          terminal_change?: string | null
          update_source?: Database["public"]["Enums"]["update_source"] | null
        }
        Update: {
          created_at?: string | null
          delay_minutes?: number | null
          delay_reason?: string | null
          flight_booking_id?: string
          gate_change?: string | null
          id?: string
          new_arrival_time?: string | null
          new_departure_time?: string | null
          new_status?: Database["public"]["Enums"]["flight_status"]
          previous_status?: Database["public"]["Enums"]["flight_status"] | null
          status_details?: Json | null
          terminal_change?: string | null
          update_source?: Database["public"]["Enums"]["update_source"] | null
        }
        Relationships: [
          {
            foreignKeyName: "flight_status_updates_flight_booking_id_fkey"
            columns: ["flight_booking_id"]
            isOneToOne: false
            referencedRelation: "flight_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      import_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          entity_type: string
          error_details: Json | null
          file_name: string
          file_size_bytes: number | null
          id: string
          import_mode: string
          mapping: Json
          rows_failed: number
          rows_imported: number
          rows_total: number
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          entity_type: string
          error_details?: Json | null
          file_name: string
          file_size_bytes?: number | null
          id?: string
          import_mode?: string
          mapping?: Json
          rows_failed?: number
          rows_imported?: number
          rows_total: number
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          entity_type?: string
          error_details?: Json | null
          file_name?: string
          file_size_bytes?: number | null
          id?: string
          import_mode?: string
          mapping?: Json
          rows_failed?: number
          rows_imported?: number
          rows_total?: number
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      invoice_email_logs: {
        Row: {
          clicked_at: string | null
          created_at: string | null
          email_service_id: string | null
          email_subject: string
          error_message: string | null
          id: string
          invoice_id: string
          opened_at: string | null
          recipient_email: string
          sent_at: string | null
          sent_by: string | null
          status: string
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string | null
          email_service_id?: string | null
          email_subject: string
          error_message?: string | null
          id?: string
          invoice_id: string
          opened_at?: string | null
          recipient_email: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string
        }
        Update: {
          clicked_at?: string | null
          created_at?: string | null
          email_service_id?: string | null
          email_subject?: string
          error_message?: string | null
          id?: string
          invoice_id?: string
          opened_at?: string | null
          recipient_email?: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_email_logs_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_email_logs_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_email_logs_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          item_order: number | null
          quantity: number
          subtotal: number | null
          tax_amount: number | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          item_order?: number | null
          quantity?: number
          subtotal?: number | null
          tax_amount?: number | null
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          item_order?: number | null
          quantity?: number
          subtotal?: number | null
          tax_amount?: number | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices_normalized"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payment_links: {
        Row: {
          amount: number | null
          completed_at: string | null
          created_at: string | null
          currency: string | null
          expires_at: string | null
          id: string
          invoice_id: string
          payment_link_id: string
          status: string
          stripe_session_id: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          amount?: number | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          expires_at?: string | null
          id?: string
          invoice_id: string
          payment_link_id: string
          status?: string
          stripe_session_id?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          amount?: number | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          expires_at?: string | null
          id?: string
          invoice_id?: string
          payment_link_id?: string
          status?: string
          stripe_session_id?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payment_links_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payment_links_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices_normalized"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          is_deposit: boolean | null
          notes: string | null
          payment_date: string
          payment_method: string | null
          recorded_by: string | null
          reference_number: string | null
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          is_deposit?: boolean | null
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          recorded_by?: string | null
          reference_number?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          is_deposit?: boolean | null
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          recorded_by?: string | null
          reference_number?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices_normalized"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_recipients: {
        Row: {
          abn: string | null
          company_name: string | null
          created_at: string
          id: string
          invoice_id: string
          is_primary: boolean
          recipient_abn: string | null
          recipient_address: string | null
          recipient_email: string
          recipient_mobile: string | null
          recipient_name: string
          recipient_phone: string | null
          recipient_type: string | null
        }
        Insert: {
          abn?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          invoice_id: string
          is_primary?: boolean
          recipient_abn?: string | null
          recipient_address?: string | null
          recipient_email: string
          recipient_mobile?: string | null
          recipient_name: string
          recipient_phone?: string | null
          recipient_type?: string | null
        }
        Update: {
          abn?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          invoice_id?: string
          is_primary?: boolean
          recipient_abn?: string | null
          recipient_address?: string | null
          recipient_email?: string
          recipient_mobile?: string | null
          recipient_name?: string
          recipient_phone?: string | null
          recipient_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_invoice_recipients_invoice"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoice_recipients_invoice"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_recipients_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_recipients_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices_normalized"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_address: string | null
          client_mobile: string | null
          comedian_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          deposit_amount: number | null
          deposit_due_date: string | null
          deposit_due_days_before_event: number | null
          deposit_paid_amount: number | null
          deposit_paid_date: string | null
          deposit_percentage: number | null
          deposit_status: string | null
          due_date: string
          event_date: string | null
          event_id: string | null
          event_spot_id: string | null
          gst_treatment: string | null
          id: string
          invoice_number: string
          invoice_type: string
          issue_date: string
          last_synced_at: string | null
          notes: string | null
          organization_id: string | null
          paid_at: string | null
          payment_terms: string | null
          promoter_id: string | null
          recipient_id: string | null
          sender_abn: string | null
          sender_address: string | null
          sender_bank_account: string | null
          sender_bank_bsb: string | null
          sender_bank_name: string | null
          sender_email: string | null
          sender_name: string | null
          sender_phone: string | null
          sent_at: string | null
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number
          tax_treatment: string | null
          terms: string | null
          total_amount: number
          updated_at: string
          xero_invoice_id: string | null
          xero_sync_error: string | null
        }
        Insert: {
          client_address?: string | null
          client_mobile?: string | null
          comedian_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deposit_amount?: number | null
          deposit_due_date?: string | null
          deposit_due_days_before_event?: number | null
          deposit_paid_amount?: number | null
          deposit_paid_date?: string | null
          deposit_percentage?: number | null
          deposit_status?: string | null
          due_date: string
          event_date?: string | null
          event_id?: string | null
          event_spot_id?: string | null
          gst_treatment?: string | null
          id?: string
          invoice_number: string
          invoice_type?: string
          issue_date?: string
          last_synced_at?: string | null
          notes?: string | null
          organization_id?: string | null
          paid_at?: string | null
          payment_terms?: string | null
          promoter_id?: string | null
          recipient_id?: string | null
          sender_abn?: string | null
          sender_address?: string | null
          sender_bank_account?: string | null
          sender_bank_bsb?: string | null
          sender_bank_name?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          tax_treatment?: string | null
          terms?: string | null
          total_amount?: number
          updated_at?: string
          xero_invoice_id?: string | null
          xero_sync_error?: string | null
        }
        Update: {
          client_address?: string | null
          client_mobile?: string | null
          comedian_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deposit_amount?: number | null
          deposit_due_date?: string | null
          deposit_due_days_before_event?: number | null
          deposit_paid_amount?: number | null
          deposit_paid_date?: string | null
          deposit_percentage?: number | null
          deposit_status?: string | null
          due_date?: string
          event_date?: string | null
          event_id?: string | null
          event_spot_id?: string | null
          gst_treatment?: string | null
          id?: string
          invoice_number?: string
          invoice_type?: string
          issue_date?: string
          last_synced_at?: string | null
          notes?: string | null
          organization_id?: string | null
          paid_at?: string | null
          payment_terms?: string | null
          promoter_id?: string | null
          recipient_id?: string | null
          sender_abn?: string | null
          sender_address?: string | null
          sender_bank_account?: string | null
          sender_bank_bsb?: string | null
          sender_bank_name?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          tax_treatment?: string | null
          terms?: string | null
          total_amount?: number
          updated_at?: string
          xero_invoice_id?: string | null
          xero_sync_error?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "invoices_event_spot_id_fkey"
            columns: ["event_spot_id"]
            isOneToOne: false
            referencedRelation: "event_spots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lineup_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          spots: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          spots?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          spots?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lineup_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      link_sections: {
        Row: {
          created_at: string
          display_order: number
          id: string
          layout: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          layout?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          layout?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      management_companies: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          headquarters_city: string | null
          headquarters_country: string | null
          id: string
          metadata: Json
          name: string
          slug: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          headquarters_city?: string | null
          headquarters_country?: string | null
          id?: string
          metadata?: Json
          name: string
          slug?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          headquarters_city?: string | null
          headquarters_country?: string | null
          id?: string
          metadata?: Json
          name?: string
          slug?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      manager_accomplishments: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
          year: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          title: string
          updated_at?: string | null
          user_id: string
          year?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "manager_accomplishments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_agency_memberships: {
        Row: {
          company_id: string
          ended_on: string | null
          manager_id: string
          role: string | null
          started_on: string | null
        }
        Insert: {
          company_id: string
          ended_on?: string | null
          manager_id: string
          role?: string | null
          started_on?: string | null
        }
        Update: {
          company_id?: string
          ended_on?: string | null
          manager_id?: string
          role?: string | null
          started_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manager_agency_memberships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "management_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_client_requests: {
        Row: {
          client_id: string
          client_type: string
          created_at: string
          id: string
          manager_id: string
          manager_types: string[]
          message: string | null
          reviewed_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          client_type: string
          created_at?: string
          id?: string
          manager_id: string
          manager_types?: string[]
          message?: string | null
          reviewed_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          client_type?: string
          created_at?: string
          id?: string
          manager_id?: string
          manager_types?: string[]
          message?: string | null
          reviewed_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      manager_comedian_assignments: {
        Row: {
          comedian_id: string
          ended_on: string | null
          manager_id: string
          notes: string | null
          relationship_type: string | null
          started_on: string | null
        }
        Insert: {
          comedian_id: string
          ended_on?: string | null
          manager_id: string
          notes?: string | null
          relationship_type?: string | null
          started_on?: string | null
        }
        Update: {
          comedian_id?: string
          ended_on?: string | null
          manager_id?: string
          notes?: string | null
          relationship_type?: string | null
          started_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manager_comedian_assignments_comedian_id_fkey"
            columns: ["comedian_id"]
            isOneToOne: false
            referencedRelation: "comedians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_comedian_assignments_comedian_id_fkey"
            columns: ["comedian_id"]
            isOneToOne: false
            referencedRelation: "comedians_flat_v"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_custom_links: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_visible: boolean | null
          section: string | null
          title: string
          updated_at: string | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          section?: string | null
          title: string
          updated_at?: string | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          section?: string | null
          title?: string
          updated_at?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_custom_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_press_reviews: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_featured: boolean | null
          publication: string
          rating: number | null
          review_date: string | null
          review_text: string
          review_url: string | null
          reviewer_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          publication: string
          rating?: number | null
          review_date?: string | null
          review_text: string
          review_url?: string | null
          reviewer_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          publication?: string
          rating?: number | null
          review_date?: string | null
          review_text?: string
          review_url?: string | null
          reviewer_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_press_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_section_order: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          section_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          id?: string
          section_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          section_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_section_order_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_social_links: {
        Row: {
          created_at: string
          handle: string | null
          id: string
          is_primary: boolean | null
          manager_id: string
          platform: string
          url: string | null
        }
        Insert: {
          created_at?: string
          handle?: string | null
          id?: string
          is_primary?: boolean | null
          manager_id: string
          platform: string
          url?: string | null
        }
        Update: {
          created_at?: string
          handle?: string | null
          id?: string
          is_primary?: boolean | null
          manager_id?: string
          platform?: string
          url?: string | null
        }
        Relationships: []
      }
      managers: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          id: string
          manager_type: string
          name: string
          organization_id: string | null
          updated_at: string | null
          url_slug: string
          user_id: string
          venue_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          manager_type: string
          name: string
          organization_id?: string | null
          updated_at?: string | null
          url_slug: string
          user_id: string
          venue_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          manager_type?: string
          name?: string
          organization_id?: string | null
          updated_at?: string | null
          url_slug?: string
          user_id?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "managers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "managers_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "managers_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_flat_v"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_gigs: {
        Row: {
          banner_url: string | null
          created_at: string | null
          description: string | null
          end_datetime: string | null
          id: string
          is_recurring: boolean | null
          notes: string | null
          parent_gig_id: string | null
          recurrence_custom_dates: Json | null
          recurrence_day_of_month: number | null
          recurrence_day_of_week: number | null
          recurrence_end_date: string | null
          recurrence_frequency: number | null
          recurrence_pattern: string | null
          start_datetime: string
          ticket_link: string | null
          title: string
          updated_at: string | null
          user_id: string
          venue_address: string | null
          venue_name: string | null
        }
        Insert: {
          banner_url?: string | null
          created_at?: string | null
          description?: string | null
          end_datetime?: string | null
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          parent_gig_id?: string | null
          recurrence_custom_dates?: Json | null
          recurrence_day_of_month?: number | null
          recurrence_day_of_week?: number | null
          recurrence_end_date?: string | null
          recurrence_frequency?: number | null
          recurrence_pattern?: string | null
          start_datetime: string
          ticket_link?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Update: {
          banner_url?: string | null
          created_at?: string | null
          description?: string | null
          end_datetime?: string | null
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          parent_gig_id?: string | null
          recurrence_custom_dates?: Json | null
          recurrence_day_of_month?: number | null
          recurrence_day_of_week?: number | null
          recurrence_end_date?: string | null
          recurrence_frequency?: number | null
          recurrence_pattern?: string | null
          start_datetime?: string
          ticket_link?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manual_gigs_parent_gig_id_fkey"
            columns: ["parent_gig_id"]
            isOneToOne: false
            referencedRelation: "manual_gigs"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_platform_entries: {
        Row: {
          commission_amount: number | null
          commission_rate: number | null
          created_at: string | null
          entered_by: string | null
          entry_date: string | null
          event_id: string | null
          id: string
          net_revenue: number | null
          notes: string | null
          platform_name: string
          source_reference: string | null
          ticket_price: number | null
          tickets_sold: number
          total_revenue: number
          updated_at: string | null
        }
        Insert: {
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string | null
          entered_by?: string | null
          entry_date?: string | null
          event_id?: string | null
          id?: string
          net_revenue?: number | null
          notes?: string | null
          platform_name: string
          source_reference?: string | null
          ticket_price?: number | null
          tickets_sold?: number
          total_revenue?: number
          updated_at?: string | null
        }
        Update: {
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string | null
          entered_by?: string | null
          entry_date?: string | null
          event_id?: string | null
          id?: string
          net_revenue?: number | null
          notes?: string | null
          platform_name?: string
          source_reference?: string | null
          ticket_price?: number | null
          tickets_sold?: number
          total_revenue?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manual_platform_entries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "manual_platform_entries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_platform_entries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_platform_entries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_platform_entries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "manual_platform_entries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "manual_platform_entries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
        ]
      }
      marketing_costs: {
        Row: {
          amount: number
          campaign_name: string | null
          clicks: number | null
          conversions: number | null
          cost_type: string | null
          created_at: string | null
          currency: string | null
          event_id: string | null
          id: string
          impressions: number | null
          platform: string | null
          spend_date: string | null
          xero_bill_id: string | null
        }
        Insert: {
          amount?: number
          campaign_name?: string | null
          clicks?: number | null
          conversions?: number | null
          cost_type?: string | null
          created_at?: string | null
          currency?: string | null
          event_id?: string | null
          id?: string
          impressions?: number | null
          platform?: string | null
          spend_date?: string | null
          xero_bill_id?: string | null
        }
        Update: {
          amount?: number
          campaign_name?: string | null
          clicks?: number | null
          conversions?: number | null
          cost_type?: string | null
          created_at?: string | null
          currency?: string | null
          event_id?: string | null
          id?: string
          impressions?: number | null
          platform?: string | null
          spend_date?: string | null
          xero_bill_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_costs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "marketing_costs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_costs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_costs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_costs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "marketing_costs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "marketing_costs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
        ]
      }
      media_album_items: {
        Row: {
          added_at: string | null
          album_id: string
          display_order: number | null
          id: string
          media_id: string
        }
        Insert: {
          added_at?: string | null
          album_id: string
          display_order?: number | null
          id?: string
          media_id: string
        }
        Update: {
          added_at?: string | null
          album_id?: string
          display_order?: number | null
          id?: string
          media_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_album_items_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "media_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_album_items_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_files"
            referencedColumns: ["id"]
          },
        ]
      }
      media_albums: {
        Row: {
          cover_media_id: string | null
          created_at: string | null
          description: string | null
          directory_profile_id: string | null
          display_order: number | null
          id: string
          is_public: boolean | null
          name: string
          organization_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cover_media_id?: string | null
          created_at?: string | null
          description?: string | null
          directory_profile_id?: string | null
          display_order?: number | null
          id?: string
          is_public?: boolean | null
          name: string
          organization_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cover_media_id?: string | null
          created_at?: string | null
          description?: string | null
          directory_profile_id?: string | null
          display_order?: number | null
          id?: string
          is_public?: boolean | null
          name?: string
          organization_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_albums_cover_media_id_fkey"
            columns: ["cover_media_id"]
            isOneToOne: false
            referencedRelation: "directory_media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_albums_directory_profile_id_fkey"
            columns: ["directory_profile_id"]
            isOneToOne: false
            referencedRelation: "directory_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_albums_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      media_entity_links: {
        Row: {
          comedian_id: string | null
          created_at: string | null
          created_by: string | null
          directory_media_id: string | null
          display_order: number | null
          event_id: string | null
          id: string
          is_primary: boolean | null
          media_file_id: string | null
          organization_id: string | null
          organization_media_id: string | null
          photographer_id: string | null
          role: string | null
          session_id: string | null
          venue_id: string | null
        }
        Insert: {
          comedian_id?: string | null
          created_at?: string | null
          created_by?: string | null
          directory_media_id?: string | null
          display_order?: number | null
          event_id?: string | null
          id?: string
          is_primary?: boolean | null
          media_file_id?: string | null
          organization_id?: string | null
          organization_media_id?: string | null
          photographer_id?: string | null
          role?: string | null
          session_id?: string | null
          venue_id?: string | null
        }
        Update: {
          comedian_id?: string | null
          created_at?: string | null
          created_by?: string | null
          directory_media_id?: string | null
          display_order?: number | null
          event_id?: string | null
          id?: string
          is_primary?: boolean | null
          media_file_id?: string | null
          organization_id?: string | null
          organization_media_id?: string | null
          photographer_id?: string | null
          role?: string | null
          session_id?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_entity_links_comedian_id_fkey"
            columns: ["comedian_id"]
            isOneToOne: false
            referencedRelation: "directory_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_entity_links_directory_media_id_fkey"
            columns: ["directory_media_id"]
            isOneToOne: false
            referencedRelation: "directory_media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_entity_links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "media_entity_links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_entity_links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_entity_links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_entity_links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "media_entity_links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "media_entity_links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "media_entity_links_media_file_id_fkey"
            columns: ["media_file_id"]
            isOneToOne: false
            referencedRelation: "media_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_entity_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_entity_links_organization_media_id_fkey"
            columns: ["organization_media_id"]
            isOneToOne: false
            referencedRelation: "organization_media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_entity_links_photographer_id_fkey"
            columns: ["photographer_id"]
            isOneToOne: false
            referencedRelation: "directory_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_entity_links_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_entity_links_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "media_entity_links_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_entity_links_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_flat_v"
            referencedColumns: ["id"]
          },
        ]
      }
      media_files: {
        Row: {
          aspect_ratio: number | null
          created_at: string
          directory_profile_id: string | null
          display_order: number | null
          external_id: string | null
          external_type: string | null
          external_url: string | null
          file_name: string
          file_size: number
          file_type: string
          folder_id: string | null
          id: string
          image_height: number | null
          image_width: number | null
          import_batch_id: string | null
          is_featured_in_epk: boolean | null
          is_headshot: boolean | null
          is_primary_headshot: boolean | null
          is_profile_video: boolean | null
          media_type: string | null
          public_url: string | null
          source_filename: string | null
          storage_path: string
          tags: string[] | null
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          aspect_ratio?: number | null
          created_at?: string
          directory_profile_id?: string | null
          display_order?: number | null
          external_id?: string | null
          external_type?: string | null
          external_url?: string | null
          file_name: string
          file_size: number
          file_type: string
          folder_id?: string | null
          id?: string
          image_height?: number | null
          image_width?: number | null
          import_batch_id?: string | null
          is_featured_in_epk?: boolean | null
          is_headshot?: boolean | null
          is_primary_headshot?: boolean | null
          is_profile_video?: boolean | null
          media_type?: string | null
          public_url?: string | null
          source_filename?: string | null
          storage_path: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          aspect_ratio?: number | null
          created_at?: string
          directory_profile_id?: string | null
          display_order?: number | null
          external_id?: string | null
          external_type?: string | null
          external_url?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          folder_id?: string | null
          id?: string
          image_height?: number | null
          image_width?: number | null
          import_batch_id?: string | null
          is_featured_in_epk?: boolean | null
          is_headshot?: boolean | null
          is_primary_headshot?: boolean | null
          is_profile_video?: boolean | null
          media_type?: string | null
          public_url?: string | null
          source_filename?: string | null
          storage_path?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_files_directory_profile_id_fkey"
            columns: ["directory_profile_id"]
            isOneToOne: false
            referencedRelation: "directory_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "media_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      media_folders: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          is_system_folder: boolean
          name: string
          organization_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          is_system_folder?: boolean
          name: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          is_system_folder?: boolean
          name?: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_folders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_shares: {
        Row: {
          album_id: string | null
          can_copy: boolean | null
          id: string
          media_id: string | null
          message: string | null
          resource_type: Database["public"]["Enums"]["share_resource_type"]
          responded_at: string | null
          shared_at: string | null
          shared_by: string
          shared_with_org_id: string | null
          shared_with_profile_id: string | null
          shared_with_type: Database["public"]["Enums"]["share_target_type"]
          shared_with_user_id: string | null
          status: Database["public"]["Enums"]["share_status"] | null
        }
        Insert: {
          album_id?: string | null
          can_copy?: boolean | null
          id?: string
          media_id?: string | null
          message?: string | null
          resource_type: Database["public"]["Enums"]["share_resource_type"]
          responded_at?: string | null
          shared_at?: string | null
          shared_by: string
          shared_with_org_id?: string | null
          shared_with_profile_id?: string | null
          shared_with_type: Database["public"]["Enums"]["share_target_type"]
          shared_with_user_id?: string | null
          status?: Database["public"]["Enums"]["share_status"] | null
        }
        Update: {
          album_id?: string | null
          can_copy?: boolean | null
          id?: string
          media_id?: string | null
          message?: string | null
          resource_type?: Database["public"]["Enums"]["share_resource_type"]
          responded_at?: string | null
          shared_at?: string | null
          shared_by?: string
          shared_with_org_id?: string | null
          shared_with_profile_id?: string | null
          shared_with_type?: Database["public"]["Enums"]["share_target_type"]
          shared_with_user_id?: string | null
          status?: Database["public"]["Enums"]["share_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "media_shares_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "media_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_shares_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_shares_shared_with_org_id_fkey"
            columns: ["shared_with_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_shares_shared_with_profile_id_fkey"
            columns: ["shared_with_profile_id"]
            isOneToOne: false
            referencedRelation: "directory_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          organization_id: string | null
          read_at: string | null
          recipient_id: string
          sender_id: string
          subject: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          organization_id?: string | null
          read_at?: string | null
          recipient_id: string
          sender_id: string
          subject?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          organization_id?: string | null
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_audience_customers: {
        Row: {
          city: string | null
          city_hash: string | null
          country: string | null
          country_hash: string | null
          created_at: string | null
          customer_profile_id: string | null
          customer_value: number | null
          date_of_birth: string | null
          dob_hash: string | null
          email: string
          email_hash: string
          error_message: string | null
          first_name: string | null
          first_name_hash: string | null
          gender: string | null
          gender_hash: string | null
          id: string
          last_name: string | null
          last_name_hash: string | null
          match_keys_count: number | null
          meta_response: Json | null
          phone: string | null
          phone_hash: string | null
          postcode: string | null
          postcode_hash: string | null
          source_id: string | null
          source_type: string
          state: string | null
          state_hash: string | null
          sync_batch_id: string | null
          sync_status: string | null
          synced_at: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          city_hash?: string | null
          country?: string | null
          country_hash?: string | null
          created_at?: string | null
          customer_profile_id?: string | null
          customer_value?: number | null
          date_of_birth?: string | null
          dob_hash?: string | null
          email: string
          email_hash: string
          error_message?: string | null
          first_name?: string | null
          first_name_hash?: string | null
          gender?: string | null
          gender_hash?: string | null
          id?: string
          last_name?: string | null
          last_name_hash?: string | null
          match_keys_count?: number | null
          meta_response?: Json | null
          phone?: string | null
          phone_hash?: string | null
          postcode?: string | null
          postcode_hash?: string | null
          source_id?: string | null
          source_type: string
          state?: string | null
          state_hash?: string | null
          sync_batch_id?: string | null
          sync_status?: string | null
          synced_at?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          city_hash?: string | null
          country?: string | null
          country_hash?: string | null
          created_at?: string | null
          customer_profile_id?: string | null
          customer_value?: number | null
          date_of_birth?: string | null
          dob_hash?: string | null
          email?: string
          email_hash?: string
          error_message?: string | null
          first_name?: string | null
          first_name_hash?: string | null
          gender?: string | null
          gender_hash?: string | null
          id?: string
          last_name?: string | null
          last_name_hash?: string | null
          match_keys_count?: number | null
          meta_response?: Json | null
          phone?: string | null
          phone_hash?: string | null
          postcode?: string | null
          postcode_hash?: string | null
          source_id?: string | null
          source_type?: string
          state?: string | null
          state_hash?: string | null
          sync_batch_id?: string | null
          sync_status?: string | null
          synced_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meta_audience_customers_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "customer_marketing_export"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "meta_audience_customers_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meta_audience_customers_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "customers_crm_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meta_audience_customers_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "customers_flat_v"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      meta_sync_log: {
        Row: {
          created_at: string | null
          customer_id: string | null
          error_message: string | null
          event_name: string | null
          event_value: number | null
          id: string
          meta_response: Json | null
          status: string
          sync_type: string
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          error_message?: string | null
          event_name?: string | null
          event_value?: number | null
          id?: string
          meta_response?: Json | null
          status: string
          sync_type: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          error_message?: string | null
          event_name?: string | null
          event_value?: number | null
          id?: string
          meta_response?: Json | null
          status?: string
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_sync_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_marketing_export"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "meta_sync_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meta_sync_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_crm_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meta_sync_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_flat_v"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      n8n_flight_workflow_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          execution_id: string | null
          execution_time_ms: number | null
          flight_booking_id: string | null
          id: string
          request_data: Json | null
          response_data: Json | null
          retry_count: number | null
          status: string | null
          trigger_type: string | null
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          execution_id?: string | null
          execution_time_ms?: number | null
          flight_booking_id?: string | null
          id?: string
          request_data?: Json | null
          response_data?: Json | null
          retry_count?: number | null
          status?: string | null
          trigger_type?: string | null
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          execution_id?: string | null
          execution_time_ms?: number | null
          flight_booking_id?: string | null
          id?: string
          request_data?: Json | null
          response_data?: Json | null
          retry_count?: number | null
          status?: string | null
          trigger_type?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "n8n_flight_workflow_logs_flight_booking_id_fkey"
            columns: ["flight_booking_id"]
            isOneToOne: false
            referencedRelation: "flight_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          id: string
          notification_types: Json | null
          push_notifications: boolean | null
          sms_notifications: boolean | null
          ui_preferences: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          notification_types?: Json | null
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          ui_preferences?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          notification_types?: Json | null
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          ui_preferences?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          priority: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          priority?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          priority?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_notifications_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_connections: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string | null
          id: string
          last_sync_at: string | null
          metadata: Json | null
          provider: string
          provider_user_id: string | null
          refresh_token: string | null
          scope: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_sync_at?: string | null
          metadata?: Json | null
          provider: string
          provider_user_id?: string | null
          refresh_token?: string | null
          scope?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_sync_at?: string | null
          metadata?: Json | null
          provider?: string
          provider_user_id?: string | null
          refresh_token?: string | null
          scope?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          additional_fields: Json | null
          amount: number
          created_at: string | null
          currency: string | null
          customer_id: string | null
          description: string | null
          discounts_cents: number | null
          email: string | null
          event_source_id: string | null
          fee_breakdown: Json | null
          first_name: string | null
          gross_sales_cents: number | null
          id: string
          last_name: string | null
          mobile: string | null
          net_sales_cents: number | null
          order_reference: string | null
          ordered_at: string | null
          purchase_totals: Json | null
          purchaser_email: string | null
          purchaser_first_name: string | null
          purchaser_last_name: string | null
          raw: Json | null
          session_source_id: string | null
          source: string | null
          source_id: string | null
          status: string | null
          stripe_session_id: string | null
          subtotal_cents: number | null
          total_cents: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          additional_fields?: Json | null
          amount: number
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          description?: string | null
          discounts_cents?: number | null
          email?: string | null
          event_source_id?: string | null
          fee_breakdown?: Json | null
          first_name?: string | null
          gross_sales_cents?: number | null
          id?: string
          last_name?: string | null
          mobile?: string | null
          net_sales_cents?: number | null
          order_reference?: string | null
          ordered_at?: string | null
          purchase_totals?: Json | null
          purchaser_email?: string | null
          purchaser_first_name?: string | null
          purchaser_last_name?: string | null
          raw?: Json | null
          session_source_id?: string | null
          source?: string | null
          source_id?: string | null
          status?: string | null
          stripe_session_id?: string | null
          subtotal_cents?: number | null
          total_cents?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          additional_fields?: Json | null
          amount?: number
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          description?: string | null
          discounts_cents?: number | null
          email?: string | null
          event_source_id?: string | null
          fee_breakdown?: Json | null
          first_name?: string | null
          gross_sales_cents?: number | null
          id?: string
          last_name?: string | null
          mobile?: string | null
          net_sales_cents?: number | null
          order_reference?: string | null
          ordered_at?: string | null
          purchase_totals?: Json | null
          purchaser_email?: string | null
          purchaser_first_name?: string | null
          purchaser_last_name?: string | null
          raw?: Json | null
          session_source_id?: string | null
          source?: string | null
          source_id?: string | null
          status?: string | null
          stripe_session_id?: string | null
          subtotal_cents?: number | null
          total_cents?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      orders_eventbrite: {
        Row: {
          additional_fields: Json | null
          address_city: string | null
          address_country: string | null
          address_postal_code: string | null
          address_state: string | null
          address_street: string | null
          address_suburb: string | null
          capacity_is_custom: boolean | null
          category_name: string | null
          currency: string | null
          discounts_cents: number | null
          event_capacity: number | null
          event_changed_at: string | null
          event_created_at: string | null
          event_description: string | null
          event_end_date: string | null
          event_name: string | null
          event_published_at: string | null
          event_source_id: string | null
          event_start_date: string | null
          event_status: string | null
          event_timezone: string | null
          fees_cents: number | null
          financial_status: string | null
          format_name: string | null
          gross_sales_cents: number | null
          ingested_at: string | null
          invite_only: boolean | null
          is_free: boolean | null
          listed: boolean | null
          net_sales_cents: number | null
          online_event: boolean | null
          ordered_at: string | null
          purchaser_date_of_birth: string | null
          purchaser_email: string | null
          purchaser_mobile: string | null
          purchaser_name: string | null
          raw: Json | null
          session_source_id: string | null
          shareable: boolean | null
          source: string | null
          source_id: string
          status: string | null
          subtotal_cents: number | null
          taxes_cents: number | null
          total_cents: number | null
          updated_at: string | null
          updated_at_api: string | null
          venue_city: string | null
          venue_country: string | null
          venue_name: string | null
          venue_region: string | null
        }
        Insert: {
          additional_fields?: Json | null
          address_city?: string | null
          address_country?: string | null
          address_postal_code?: string | null
          address_state?: string | null
          address_street?: string | null
          address_suburb?: string | null
          capacity_is_custom?: boolean | null
          category_name?: string | null
          currency?: string | null
          discounts_cents?: number | null
          event_capacity?: number | null
          event_changed_at?: string | null
          event_created_at?: string | null
          event_description?: string | null
          event_end_date?: string | null
          event_name?: string | null
          event_published_at?: string | null
          event_source_id?: string | null
          event_start_date?: string | null
          event_status?: string | null
          event_timezone?: string | null
          fees_cents?: number | null
          financial_status?: string | null
          format_name?: string | null
          gross_sales_cents?: number | null
          ingested_at?: string | null
          invite_only?: boolean | null
          is_free?: boolean | null
          listed?: boolean | null
          net_sales_cents?: number | null
          online_event?: boolean | null
          ordered_at?: string | null
          purchaser_date_of_birth?: string | null
          purchaser_email?: string | null
          purchaser_mobile?: string | null
          purchaser_name?: string | null
          raw?: Json | null
          session_source_id?: string | null
          shareable?: boolean | null
          source?: string | null
          source_id: string
          status?: string | null
          subtotal_cents?: number | null
          taxes_cents?: number | null
          total_cents?: number | null
          updated_at?: string | null
          updated_at_api?: string | null
          venue_city?: string | null
          venue_country?: string | null
          venue_name?: string | null
          venue_region?: string | null
        }
        Update: {
          additional_fields?: Json | null
          address_city?: string | null
          address_country?: string | null
          address_postal_code?: string | null
          address_state?: string | null
          address_street?: string | null
          address_suburb?: string | null
          capacity_is_custom?: boolean | null
          category_name?: string | null
          currency?: string | null
          discounts_cents?: number | null
          event_capacity?: number | null
          event_changed_at?: string | null
          event_created_at?: string | null
          event_description?: string | null
          event_end_date?: string | null
          event_name?: string | null
          event_published_at?: string | null
          event_source_id?: string | null
          event_start_date?: string | null
          event_status?: string | null
          event_timezone?: string | null
          fees_cents?: number | null
          financial_status?: string | null
          format_name?: string | null
          gross_sales_cents?: number | null
          ingested_at?: string | null
          invite_only?: boolean | null
          is_free?: boolean | null
          listed?: boolean | null
          net_sales_cents?: number | null
          online_event?: boolean | null
          ordered_at?: string | null
          purchaser_date_of_birth?: string | null
          purchaser_email?: string | null
          purchaser_mobile?: string | null
          purchaser_name?: string | null
          raw?: Json | null
          session_source_id?: string | null
          shareable?: boolean | null
          source?: string | null
          source_id?: string
          status?: string | null
          subtotal_cents?: number | null
          taxes_cents?: number | null
          total_cents?: number | null
          updated_at?: string | null
          updated_at_api?: string | null
          venue_city?: string | null
          venue_country?: string | null
          venue_name?: string | null
          venue_region?: string | null
        }
        Relationships: []
      }
      orders_htx: {
        Row: {
          access_code: string | null
          additional_fields: Json | null
          address_city: string | null
          address_country: string | null
          address_postal_code: string | null
          address_state: string | null
          address_street: string | null
          address_suburb: string | null
          amex_fee_cents: number | null
          auto_discount_amount_cents: number | null
          booking_fee_cents: number | null
          booking_taxes_cents: number | null
          business_name: string | null
          business_purpose: boolean | null
          business_tax_id: string | null
          client_donation_cents: number | null
          completed_at: string | null
          created_at: string | null
          credit_cents: number | null
          currency: string | null
          dgr_donation_cents: number | null
          discount_cents: number | null
          discount_code_amount_cents: number | null
          discount_code_used: string | null
          discounts: Json | null
          discounts_cents: number | null
          donation_cents: number | null
          event_date_id: string | null
          event_source_id: string | null
          fees_cents: number | null
          fees_included: boolean | null
          financial_status: string | null
          first_name: string | null
          gift_card_credit_cents: number | null
          gross_sales_cents: number | null
          humanitix_fee_cents: number | null
          incomplete_at: string | null
          ingested_at: string
          is_international_transaction: boolean | null
          last_name: string | null
          location: string | null
          manual_order: boolean | null
          mobile: string | null
          net_client_donation_cents: number | null
          net_sales_cents: number | null
          notes: string | null
          order_client_donation_cents: number | null
          order_name: string | null
          order_reference: string | null
          ordered_at: string | null
          organisation: string | null
          organiser_mail_list_opt_in: boolean | null
          outstanding_amount_cents: number | null
          passed_on_fee_cents: number | null
          passed_on_taxes_cents: number | null
          payment_gateway: string | null
          payment_type: string | null
          purchase_booking_fee_cents: number | null
          purchase_discounts_cents: number | null
          purchase_fees_included: boolean | null
          purchase_gross_sales_cents: number | null
          purchase_humanitix_fee_cents: number | null
          purchase_net_sales_cents: number | null
          purchase_refunds_cents: number | null
          purchase_subtotal_cents: number | null
          purchase_total_cents: number | null
          purchaser_date_of_birth: string | null
          purchaser_email: string | null
          purchaser_name: string | null
          raw: Json | null
          rebate_cents: number | null
          referral_amount_cents: number | null
          refunds_cents: number | null
          sales_channel: string | null
          session_source_id: string | null
          source: string | null
          source_id: string | null
          status: string | null
          subtotal_cents: number | null
          tax_cents: number | null
          taxes_cents: number | null
          tip_fees: boolean | null
          total_cents: number | null
          total_taxes_cents: number | null
          updated_at: string | null
          updated_at_api: string | null
          user_id: string | null
          waitlist_offer_id: string | null
          zip_fee_cents: number | null
        }
        Insert: {
          access_code?: string | null
          additional_fields?: Json | null
          address_city?: string | null
          address_country?: string | null
          address_postal_code?: string | null
          address_state?: string | null
          address_street?: string | null
          address_suburb?: string | null
          amex_fee_cents?: number | null
          auto_discount_amount_cents?: number | null
          booking_fee_cents?: number | null
          booking_taxes_cents?: number | null
          business_name?: string | null
          business_purpose?: boolean | null
          business_tax_id?: string | null
          client_donation_cents?: number | null
          completed_at?: string | null
          created_at?: string | null
          credit_cents?: number | null
          currency?: string | null
          dgr_donation_cents?: number | null
          discount_cents?: number | null
          discount_code_amount_cents?: number | null
          discount_code_used?: string | null
          discounts?: Json | null
          discounts_cents?: number | null
          donation_cents?: number | null
          event_date_id?: string | null
          event_source_id?: string | null
          fees_cents?: number | null
          fees_included?: boolean | null
          financial_status?: string | null
          first_name?: string | null
          gift_card_credit_cents?: number | null
          gross_sales_cents?: number | null
          humanitix_fee_cents?: number | null
          incomplete_at?: string | null
          ingested_at?: string
          is_international_transaction?: boolean | null
          last_name?: string | null
          location?: string | null
          manual_order?: boolean | null
          mobile?: string | null
          net_client_donation_cents?: number | null
          net_sales_cents?: number | null
          notes?: string | null
          order_client_donation_cents?: number | null
          order_name?: string | null
          order_reference?: string | null
          ordered_at?: string | null
          organisation?: string | null
          organiser_mail_list_opt_in?: boolean | null
          outstanding_amount_cents?: number | null
          passed_on_fee_cents?: number | null
          passed_on_taxes_cents?: number | null
          payment_gateway?: string | null
          payment_type?: string | null
          purchase_booking_fee_cents?: number | null
          purchase_discounts_cents?: number | null
          purchase_fees_included?: boolean | null
          purchase_gross_sales_cents?: number | null
          purchase_humanitix_fee_cents?: number | null
          purchase_net_sales_cents?: number | null
          purchase_refunds_cents?: number | null
          purchase_subtotal_cents?: number | null
          purchase_total_cents?: number | null
          purchaser_date_of_birth?: string | null
          purchaser_email?: string | null
          purchaser_name?: string | null
          raw?: Json | null
          rebate_cents?: number | null
          referral_amount_cents?: number | null
          refunds_cents?: number | null
          sales_channel?: string | null
          session_source_id?: string | null
          source?: string | null
          source_id?: string | null
          status?: string | null
          subtotal_cents?: number | null
          tax_cents?: number | null
          taxes_cents?: number | null
          tip_fees?: boolean | null
          total_cents?: number | null
          total_taxes_cents?: number | null
          updated_at?: string | null
          updated_at_api?: string | null
          user_id?: string | null
          waitlist_offer_id?: string | null
          zip_fee_cents?: number | null
        }
        Update: {
          access_code?: string | null
          additional_fields?: Json | null
          address_city?: string | null
          address_country?: string | null
          address_postal_code?: string | null
          address_state?: string | null
          address_street?: string | null
          address_suburb?: string | null
          amex_fee_cents?: number | null
          auto_discount_amount_cents?: number | null
          booking_fee_cents?: number | null
          booking_taxes_cents?: number | null
          business_name?: string | null
          business_purpose?: boolean | null
          business_tax_id?: string | null
          client_donation_cents?: number | null
          completed_at?: string | null
          created_at?: string | null
          credit_cents?: number | null
          currency?: string | null
          dgr_donation_cents?: number | null
          discount_cents?: number | null
          discount_code_amount_cents?: number | null
          discount_code_used?: string | null
          discounts?: Json | null
          discounts_cents?: number | null
          donation_cents?: number | null
          event_date_id?: string | null
          event_source_id?: string | null
          fees_cents?: number | null
          fees_included?: boolean | null
          financial_status?: string | null
          first_name?: string | null
          gift_card_credit_cents?: number | null
          gross_sales_cents?: number | null
          humanitix_fee_cents?: number | null
          incomplete_at?: string | null
          ingested_at?: string
          is_international_transaction?: boolean | null
          last_name?: string | null
          location?: string | null
          manual_order?: boolean | null
          mobile?: string | null
          net_client_donation_cents?: number | null
          net_sales_cents?: number | null
          notes?: string | null
          order_client_donation_cents?: number | null
          order_name?: string | null
          order_reference?: string | null
          ordered_at?: string | null
          organisation?: string | null
          organiser_mail_list_opt_in?: boolean | null
          outstanding_amount_cents?: number | null
          passed_on_fee_cents?: number | null
          passed_on_taxes_cents?: number | null
          payment_gateway?: string | null
          payment_type?: string | null
          purchase_booking_fee_cents?: number | null
          purchase_discounts_cents?: number | null
          purchase_fees_included?: boolean | null
          purchase_gross_sales_cents?: number | null
          purchase_humanitix_fee_cents?: number | null
          purchase_net_sales_cents?: number | null
          purchase_refunds_cents?: number | null
          purchase_subtotal_cents?: number | null
          purchase_total_cents?: number | null
          purchaser_date_of_birth?: string | null
          purchaser_email?: string | null
          purchaser_name?: string | null
          raw?: Json | null
          rebate_cents?: number | null
          referral_amount_cents?: number | null
          refunds_cents?: number | null
          sales_channel?: string | null
          session_source_id?: string | null
          source?: string | null
          source_id?: string | null
          status?: string | null
          subtotal_cents?: number | null
          tax_cents?: number | null
          taxes_cents?: number | null
          tip_fees?: boolean | null
          total_cents?: number | null
          total_taxes_cents?: number | null
          updated_at?: string | null
          updated_at_api?: string | null
          user_id?: string | null
          waitlist_offer_id?: string | null
          zip_fee_cents?: number | null
        }
        Relationships: []
      }
      organization_accomplishments: {
        Row: {
          accomplishment: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          organization_id: string
          title: string
          updated_at: string | null
          year: number | null
        }
        Insert: {
          accomplishment?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          organization_id: string
          title: string
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          accomplishment?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          organization_id?: string
          title?: string
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_accomplishments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_custom_links: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_visible: boolean | null
          organization_id: string
          section: string | null
          section_id: string | null
          title: string
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          organization_id: string
          section?: string | null
          section_id?: string | null
          title: string
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          organization_id?: string
          section?: string | null
          section_id?: string | null
          title?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_custom_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_custom_links_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "organization_link_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_highlights: {
        Row: {
          category: string | null
          created_at: string | null
          date: string | null
          description: string | null
          id: string
          organization_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          organization_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          organization_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_highlights_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_join_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          organization_id: string
          requested_role: string | null
          requester_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          organization_id: string
          requested_role?: string | null
          requester_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          organization_id?: string
          requested_role?: string | null
          requester_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_join_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_link_sections: {
        Row: {
          created_at: string
          display_order: number
          id: string
          layout: string
          organization_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          layout?: string
          organization_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          layout?: string
          organization_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_link_sections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_managers: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          is_primary: boolean | null
          manager_id: string
          manager_types: string[]
          organization_id: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_primary?: boolean | null
          manager_id: string
          manager_types?: string[]
          organization_id: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_primary?: boolean | null
          manager_id?: string
          manager_types?: string[]
          organization_id?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_managers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_media: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          external_id: string | null
          external_type: string | null
          external_url: string | null
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          is_featured: boolean | null
          media_type: string | null
          mime_type: string | null
          organization_id: string
          show_in_epk: boolean | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          upload_date: string | null
          uploaded_by: string
          visibility: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          external_id?: string | null
          external_type?: string | null
          external_url?: string | null
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          is_featured?: boolean | null
          media_type?: string | null
          mime_type?: string | null
          organization_id: string
          show_in_epk?: boolean | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          upload_date?: string | null
          uploaded_by: string
          visibility?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          external_id?: string | null
          external_type?: string | null
          external_url?: string | null
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          is_featured?: boolean | null
          media_type?: string | null
          mime_type?: string | null
          organization_id?: string
          show_in_epk?: boolean | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          upload_date?: string | null
          uploaded_by?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_media_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_press_reviews: {
        Row: {
          created_at: string | null
          display_order: number | null
          hook_line: string | null
          id: string
          is_featured: boolean | null
          organization_id: string
          publication: string
          rating: number | null
          review_date: string | null
          review_text: string
          review_url: string | null
          reviewer_name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          hook_line?: string | null
          id?: string
          is_featured?: boolean | null
          organization_id: string
          publication: string
          rating?: number | null
          review_date?: string | null
          review_text: string
          review_url?: string | null
          reviewer_name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          hook_line?: string | null
          id?: string
          is_featured?: boolean | null
          organization_id?: string
          publication?: string
          rating?: number | null
          review_date?: string | null
          review_text?: string
          review_url?: string | null
          reviewer_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_press_reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_profiles: {
        Row: {
          abn: string | null
          account_name: string | null
          account_number: string | null
          acn: string | null
          address: string | null
          bank_details: Json | null
          banner_position: Json | null
          banner_url: string | null
          bio: string | null
          bsb: string | null
          business_structure: string | null
          city: string | null
          contact_email: string
          contact_phone: string | null
          country: string | null
          created_at: string | null
          custom_organization_type: string | null
          display_name: string
          display_name_preference: string | null
          enabled_features: Json | null
          entity_address: string | null
          entity_name: string | null
          entity_postcode: string | null
          entity_state_code: string | null
          entity_type: string | null
          facebook_url: string | null
          gst_effective_date: string | null
          gst_registered: boolean | null
          id: string
          instagram_url: string | null
          is_active: boolean | null
          is_verified: boolean | null
          legal_name: string | null
          linkedin_url: string | null
          logo_url: string | null
          media_layout: string | null
          organization_name: string
          organization_type: string[] | null
          owner_id: string
          payment_terms: string | null
          postcode: string | null
          show_contact_in_epk: boolean | null
          state: string | null
          tagline: string | null
          tfn: string | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string | null
          url_slug: string | null
          venue_subtypes: string[] | null
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          abn?: string | null
          account_name?: string | null
          account_number?: string | null
          acn?: string | null
          address?: string | null
          bank_details?: Json | null
          banner_position?: Json | null
          banner_url?: string | null
          bio?: string | null
          bsb?: string | null
          business_structure?: string | null
          city?: string | null
          contact_email: string
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          custom_organization_type?: string | null
          display_name: string
          display_name_preference?: string | null
          enabled_features?: Json | null
          entity_address?: string | null
          entity_name?: string | null
          entity_postcode?: string | null
          entity_state_code?: string | null
          entity_type?: string | null
          facebook_url?: string | null
          gst_effective_date?: string | null
          gst_registered?: boolean | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          legal_name?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          media_layout?: string | null
          organization_name: string
          organization_type?: string[] | null
          owner_id: string
          payment_terms?: string | null
          postcode?: string | null
          show_contact_in_epk?: boolean | null
          state?: string | null
          tagline?: string | null
          tfn?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          url_slug?: string | null
          venue_subtypes?: string[] | null
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          abn?: string | null
          account_name?: string | null
          account_number?: string | null
          acn?: string | null
          address?: string | null
          bank_details?: Json | null
          banner_position?: Json | null
          banner_url?: string | null
          bio?: string | null
          bsb?: string | null
          business_structure?: string | null
          city?: string | null
          contact_email?: string
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          custom_organization_type?: string | null
          display_name?: string
          display_name_preference?: string | null
          enabled_features?: Json | null
          entity_address?: string | null
          entity_name?: string | null
          entity_postcode?: string | null
          entity_state_code?: string | null
          entity_type?: string | null
          facebook_url?: string | null
          gst_effective_date?: string | null
          gst_registered?: boolean | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          legal_name?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          media_layout?: string | null
          organization_name?: string
          organization_type?: string[] | null
          owner_id?: string
          payment_terms?: string | null
          postcode?: string | null
          show_contact_in_epk?: boolean | null
          state?: string | null
          tagline?: string | null
          tfn?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          url_slug?: string | null
          venue_subtypes?: string[] | null
          website_url?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_profiles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_section_order: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          organization_id: string
          section_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          id?: string
          organization_id: string
          section_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          organization_id?: string
          section_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_section_order_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_tasks: {
        Row: {
          assigned_to: string | null
          attachments: Json | null
          completed_at: string | null
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          organization_id: string
          priority: string | null
          related_event_id: string | null
          related_invoice_id: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          attachments?: Json | null
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id: string
          priority?: string | null
          related_event_id?: string | null
          related_invoice_id?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          attachments?: Json | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string
          priority?: string | null
          related_event_id?: string | null
          related_invoice_id?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_tasks_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "organization_tasks_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_tasks_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_tasks_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_tasks_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "organization_tasks_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "organization_tasks_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
        ]
      }
      organization_team_members: {
        Row: {
          custom_permissions: Json | null
          id: string
          joined_at: string | null
          manager_type: string | null
          organization_id: string
          permissions: Json | null
          role: string | null
          user_id: string
        }
        Insert: {
          custom_permissions?: Json | null
          id?: string
          joined_at?: string | null
          manager_type?: string | null
          organization_id: string
          permissions?: Json | null
          role?: string | null
          user_id: string
        }
        Update: {
          custom_permissions?: Json | null
          id?: string
          joined_at?: string | null
          manager_type?: string | null
          organization_id?: string
          permissions?: Json | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_team_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_vouches: {
        Row: {
          comment: string
          created_at: string | null
          from_organization_id: string | null
          from_user_id: string | null
          id: string
          to_organization_id: string | null
          to_user_id: string | null
          updated_at: string | null
        }
        Insert: {
          comment: string
          created_at?: string | null
          from_organization_id?: string | null
          from_user_id?: string | null
          id?: string
          to_organization_id?: string | null
          to_user_id?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string
          created_at?: string | null
          from_organization_id?: string | null
          from_user_id?: string | null
          id?: string
          to_organization_id?: string | null
          to_user_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_vouches_from_organization_id_fkey"
            columns: ["from_organization_id"]
            isOneToOne: false
            referencedRelation: "organization_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_vouches_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_vouches_to_organization_id_fkey"
            columns: ["to_organization_id"]
            isOneToOne: false
            referencedRelation: "organization_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_vouches_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          metadata: Json | null
          name: string
          promoter_id: string
          state: string | null
          updated_at: string | null
          url_slug: string | null
          website_url: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          metadata?: Json | null
          name: string
          promoter_id: string
          state?: string | null
          updated_at?: string | null
          url_slug?: string | null
          website_url?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          metadata?: Json | null
          name?: string
          promoter_id?: string
          state?: string | null
          updated_at?: string | null
          url_slug?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      organizer_contacts: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_primary: boolean | null
          organizer_id: string
          phone: string | null
          role: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_primary?: boolean | null
          organizer_id: string
          phone?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_primary?: boolean | null
          organizer_id?: string
          phone?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizer_contacts_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_contacts_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers_flat_v"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_media: {
        Row: {
          created_at: string
          description: string | null
          id: string
          media_type: string
          metadata: Json
          organizer_id: string
          published_at: string | null
          thumbnail_url: string | null
          title: string | null
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          media_type: string
          metadata?: Json
          organizer_id: string
          published_at?: string | null
          thumbnail_url?: string | null
          title?: string | null
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          media_type?: string
          metadata?: Json
          organizer_id?: string
          published_at?: string | null
          thumbnail_url?: string | null
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizer_media_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_media_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers_flat_v"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_social_links: {
        Row: {
          created_at: string
          handle: string | null
          id: string
          is_primary: boolean | null
          organizer_id: string
          platform: string
          url: string | null
        }
        Insert: {
          created_at?: string
          handle?: string | null
          id?: string
          is_primary?: boolean | null
          organizer_id: string
          platform: string
          url?: string | null
        }
        Update: {
          created_at?: string
          handle?: string | null
          id?: string
          is_primary?: boolean | null
          organizer_id?: string
          platform?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizer_social_links_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_social_links_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers_flat_v"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_venues: {
        Row: {
          created_at: string
          notes: string | null
          organizer_id: string
          relationship: string | null
          venue_id: string
        }
        Insert: {
          created_at?: string
          notes?: string | null
          organizer_id: string
          relationship?: string | null
          venue_id: string
        }
        Update: {
          created_at?: string
          notes?: string | null
          organizer_id?: string
          relationship?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizer_venues_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_venues_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers_flat_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_venues_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_venues_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_flat_v"
            referencedColumns: ["id"]
          },
        ]
      }
      organizers: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          headquarters_city: string | null
          headquarters_country: string | null
          hero_image_url: string | null
          id: string
          logo_url: string | null
          metadata: Json
          name: string
          slug: string | null
          tagline: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          headquarters_city?: string | null
          headquarters_country?: string | null
          hero_image_url?: string | null
          id?: string
          logo_url?: string | null
          metadata?: Json
          name: string
          slug?: string | null
          tagline?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          headquarters_city?: string | null
          headquarters_country?: string | null
          hero_image_url?: string | null
          id?: string
          logo_url?: string | null
          metadata?: Json
          name?: string
          slug?: string | null
          tagline?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      personal_gigs: {
        Row: {
          created_at: string | null
          date: string
          end_time: string | null
          google_event_id: string | null
          id: string
          notes: string | null
          source: string | null
          title: string
          updated_at: string | null
          user_id: string
          venue: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          end_time?: string | null
          google_event_id?: string | null
          id?: string
          notes?: string | null
          source?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          venue?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          end_time?: string | null
          google_event_id?: string | null
          id?: string
          notes?: string | null
          source?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_gigs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      photographer_accomplishments: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
          year: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          title: string
          updated_at?: string | null
          user_id: string
          year?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "photographer_accomplishments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      photographer_custom_links: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_visible: boolean | null
          section: string | null
          title: string
          updated_at: string | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          section?: string | null
          title: string
          updated_at?: string | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          section?: string | null
          title?: string
          updated_at?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photographer_custom_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      photographer_press_reviews: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_featured: boolean | null
          publication: string
          rating: number | null
          review_date: string | null
          review_text: string
          review_url: string | null
          reviewer_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          publication: string
          rating?: number | null
          review_date?: string | null
          review_text: string
          review_url?: string | null
          reviewer_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          publication?: string
          rating?: number | null
          review_date?: string | null
          review_text?: string
          review_url?: string | null
          reviewer_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photographer_press_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      photographer_profiles: {
        Row: {
          available_for_events: boolean | null
          bio: string | null
          created_at: string | null
          experience_years: number | null
          id: string
          instagram_portfolio: string | null
          portfolio_url: string | null
          rate_per_event: number | null
          rate_per_hour: number | null
          services_offered: string[] | null
          specialties: string[] | null
          travel_radius_km: number | null
          turnaround_time_days: number | null
          updated_at: string | null
          url_slug: string | null
          url_slug_last_changed: string | null
          video_reel_url: string | null
          youtube_channel: string | null
        }
        Insert: {
          available_for_events?: boolean | null
          bio?: string | null
          created_at?: string | null
          experience_years?: number | null
          id: string
          instagram_portfolio?: string | null
          portfolio_url?: string | null
          rate_per_event?: number | null
          rate_per_hour?: number | null
          services_offered?: string[] | null
          specialties?: string[] | null
          travel_radius_km?: number | null
          turnaround_time_days?: number | null
          updated_at?: string | null
          url_slug?: string | null
          url_slug_last_changed?: string | null
          video_reel_url?: string | null
          youtube_channel?: string | null
        }
        Update: {
          available_for_events?: boolean | null
          bio?: string | null
          created_at?: string | null
          experience_years?: number | null
          id?: string
          instagram_portfolio?: string | null
          portfolio_url?: string | null
          rate_per_event?: number | null
          rate_per_hour?: number | null
          services_offered?: string[] | null
          specialties?: string[] | null
          travel_radius_km?: number | null
          turnaround_time_days?: number | null
          updated_at?: string | null
          url_slug?: string | null
          url_slug_last_changed?: string | null
          video_reel_url?: string | null
          youtube_channel?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photographer_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      photographer_section_order: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          section_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          id?: string
          section_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          section_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photographer_section_order_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      press_reviews: {
        Row: {
          created_at: string
          display_order: number
          external_url: string | null
          hook_line: string
          id: string
          publication: string
          rating: number | null
          review_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          external_url?: string | null
          hook_line: string
          id?: string
          publication: string
          rating?: number | null
          review_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          external_url?: string | null
          hook_line?: string
          id?: string
          publication?: string
          rating?: number | null
          review_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      production_staff_profiles: {
        Row: {
          availability_notes: string | null
          bio: string | null
          created_at: string | null
          experience_years: number | null
          flat_rate: number | null
          hourly_rate: number | null
          id: string
          is_available: boolean | null
          specialty: string
          specialty_other: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          availability_notes?: string | null
          bio?: string | null
          created_at?: string | null
          experience_years?: number | null
          flat_rate?: number | null
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          specialty: string
          specialty_other?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          availability_notes?: string | null
          bio?: string | null
          created_at?: string | null
          experience_years?: number | null
          flat_rate?: number | null
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          specialty?: string
          specialty_other?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          abn: string | null
          account_name: string | null
          account_number: string | null
          avatar_url: string | null
          banner_position: Json | null
          banner_url: string | null
          bio: string | null
          bsb: string | null
          created_at: string | null
          custom_show_types: string[] | null
          display_name: string | null
          email: string
          entity_address: string | null
          entity_name: string | null
          entity_postcode: string | null
          entity_state_code: string | null
          entity_type: string | null
          facebook_url: string | null
          first_name: string | null
          gst_effective_date: string | null
          gst_registered: boolean
          id: string
          instagram_url: string | null
          is_verified: boolean | null
          last_name: string | null
          location: string | null
          media_layout: Database["public"]["Enums"]["media_layout_type"] | null
          name: string | null
          name_display_preference: string | null
          phone: string | null
          profile_slug: string | null
          profile_tagline: string | null
          profile_visible: boolean | null
          show_contact_in_epk: boolean | null
          show_org_in_personal_view: boolean | null
          stage_name: string | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string | null
          url_slug_last_changed: string | null
          website_url: string | null
          years_experience: number | null
          youtube_url: string | null
        }
        Insert: {
          abn?: string | null
          account_name?: string | null
          account_number?: string | null
          avatar_url?: string | null
          banner_position?: Json | null
          banner_url?: string | null
          bio?: string | null
          bsb?: string | null
          created_at?: string | null
          custom_show_types?: string[] | null
          display_name?: string | null
          email: string
          entity_address?: string | null
          entity_name?: string | null
          entity_postcode?: string | null
          entity_state_code?: string | null
          entity_type?: string | null
          facebook_url?: string | null
          first_name?: string | null
          gst_effective_date?: string | null
          gst_registered?: boolean
          id: string
          instagram_url?: string | null
          is_verified?: boolean | null
          last_name?: string | null
          location?: string | null
          media_layout?: Database["public"]["Enums"]["media_layout_type"] | null
          name?: string | null
          name_display_preference?: string | null
          phone?: string | null
          profile_slug?: string | null
          profile_tagline?: string | null
          profile_visible?: boolean | null
          show_contact_in_epk?: boolean | null
          show_org_in_personal_view?: boolean | null
          stage_name?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          url_slug_last_changed?: string | null
          website_url?: string | null
          years_experience?: number | null
          youtube_url?: string | null
        }
        Update: {
          abn?: string | null
          account_name?: string | null
          account_number?: string | null
          avatar_url?: string | null
          banner_position?: Json | null
          banner_url?: string | null
          bio?: string | null
          bsb?: string | null
          created_at?: string | null
          custom_show_types?: string[] | null
          display_name?: string | null
          email?: string
          entity_address?: string | null
          entity_name?: string | null
          entity_postcode?: string | null
          entity_state_code?: string | null
          entity_type?: string | null
          facebook_url?: string | null
          first_name?: string | null
          gst_effective_date?: string | null
          gst_registered?: boolean
          id?: string
          instagram_url?: string | null
          is_verified?: boolean | null
          last_name?: string | null
          location?: string | null
          media_layout?: Database["public"]["Enums"]["media_layout_type"] | null
          name?: string | null
          name_display_preference?: string | null
          phone?: string | null
          profile_slug?: string | null
          profile_tagline?: string | null
          profile_visible?: boolean | null
          show_contact_in_epk?: boolean | null
          show_org_in_personal_view?: boolean | null
          stage_name?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          url_slug_last_changed?: string | null
          website_url?: string | null
          years_experience?: number | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          id: string
          subscription: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          subscription: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          subscription?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      recurring_invoices: {
        Row: {
          amount: number
          comedian_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string
          description: string
          frequency: string
          id: string
          invoice_type: string
          is_active: boolean | null
          last_generated_at: string | null
          next_invoice_date: string
          promoter_id: string | null
          recipient_address: string | null
          recipient_email: string
          recipient_name: string
          recipient_phone: string | null
          sender_abn: string | null
          sender_address: string | null
          sender_email: string
          sender_name: string
          sender_phone: string | null
          tax_rate: number
          tax_treatment: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          comedian_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          description: string
          frequency: string
          id?: string
          invoice_type: string
          is_active?: boolean | null
          last_generated_at?: string | null
          next_invoice_date: string
          promoter_id?: string | null
          recipient_address?: string | null
          recipient_email: string
          recipient_name: string
          recipient_phone?: string | null
          sender_abn?: string | null
          sender_address?: string | null
          sender_email: string
          sender_name: string
          sender_phone?: string | null
          tax_rate?: number
          tax_treatment?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          comedian_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          description?: string
          frequency?: string
          id?: string
          invoice_type?: string
          is_active?: boolean | null
          last_generated_at?: string | null
          next_invoice_date?: string
          promoter_id?: string | null
          recipient_address?: string | null
          recipient_email?: string
          recipient_name?: string
          recipient_phone?: string | null
          sender_abn?: string | null
          sender_address?: string | null
          sender_email?: string
          sender_name?: string
          sender_phone?: string | null
          tax_rate?: number
          tax_treatment?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_invoices_comedian_id_fkey"
            columns: ["comedian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_invoices_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      segments: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          rules: Json | null
          segment_type: Database["public"]["Enums"]["segment_type"]
          slug: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          rules?: Json | null
          segment_type?: Database["public"]["Enums"]["segment_type"]
          slug: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          rules?: Json | null
          segment_type?: Database["public"]["Enums"]["segment_type"]
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      session_financials_agg: {
        Row: {
          canonical_session_source_id: string
          canonical_source: string
          event_name: string | null
          event_source_id: string | null
          eventbrite_fees_cents: number
          eventbrite_gross_cents: number
          eventbrite_last_order_at: string | null
          eventbrite_net_cents: number
          eventbrite_order_count: number
          eventbrite_tax_cents: number
          eventbrite_ticket_count: number
          humanitix_fees_cents: number
          humanitix_gross_cents: number
          humanitix_last_order_at: string | null
          humanitix_net_cents: number
          humanitix_order_count: number
          humanitix_tax_cents: number
          humanitix_ticket_count: number
          session_name: string | null
          session_start: string | null
          timezone: string | null
          total_fees_cents: number
          total_gross_cents: number
          total_net_cents: number
          total_order_count: number
          total_tax_cents: number
          total_ticket_count: number
          updated_at: string
        }
        Insert: {
          canonical_session_source_id: string
          canonical_source: string
          event_name?: string | null
          event_source_id?: string | null
          eventbrite_fees_cents?: number
          eventbrite_gross_cents?: number
          eventbrite_last_order_at?: string | null
          eventbrite_net_cents?: number
          eventbrite_order_count?: number
          eventbrite_tax_cents?: number
          eventbrite_ticket_count?: number
          humanitix_fees_cents?: number
          humanitix_gross_cents?: number
          humanitix_last_order_at?: string | null
          humanitix_net_cents?: number
          humanitix_order_count?: number
          humanitix_tax_cents?: number
          humanitix_ticket_count?: number
          session_name?: string | null
          session_start?: string | null
          timezone?: string | null
          total_fees_cents?: number
          total_gross_cents?: number
          total_net_cents?: number
          total_order_count?: number
          total_tax_cents?: number
          total_ticket_count?: number
          updated_at?: string
        }
        Update: {
          canonical_session_source_id?: string
          canonical_source?: string
          event_name?: string | null
          event_source_id?: string | null
          eventbrite_fees_cents?: number
          eventbrite_gross_cents?: number
          eventbrite_last_order_at?: string | null
          eventbrite_net_cents?: number
          eventbrite_order_count?: number
          eventbrite_tax_cents?: number
          eventbrite_ticket_count?: number
          humanitix_fees_cents?: number
          humanitix_gross_cents?: number
          humanitix_last_order_at?: string | null
          humanitix_net_cents?: number
          humanitix_order_count?: number
          humanitix_tax_cents?: number
          humanitix_ticket_count?: number
          session_name?: string | null
          session_start?: string | null
          timezone?: string | null
          total_fees_cents?: number
          total_gross_cents?: number
          total_net_cents?: number
          total_order_count?: number
          total_tax_cents?: number
          total_ticket_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      session_manual_attendance: {
        Row: {
          canonical_session_source_id: string
          canonical_source: string
          created_at: string | null
          fever_ticket_count: number | null
          id: string
          notes: string | null
          promotix_ticket_count: number | null
          updated_at: string | null
        }
        Insert: {
          canonical_session_source_id: string
          canonical_source: string
          created_at?: string | null
          fever_ticket_count?: number | null
          id?: string
          notes?: string | null
          promotix_ticket_count?: number | null
          updated_at?: string | null
        }
        Update: {
          canonical_session_source_id?: string
          canonical_source?: string
          created_at?: string | null
          fever_ticket_count?: number | null
          id?: string
          notes?: string | null
          promotix_ticket_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      session_partners: {
        Row: {
          added_by: string | null
          can_edit_event: boolean
          can_manage_financials: boolean
          can_receive_crm_data: boolean
          can_view_details: boolean
          can_view_financials: boolean
          canonical_session_source_id: string
          created_at: string
          id: string
          invited_email: string | null
          organization_id: string | null
          partner_profile_id: string | null
          partner_type: string
          source_deal_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          added_by?: string | null
          can_edit_event?: boolean
          can_manage_financials?: boolean
          can_receive_crm_data?: boolean
          can_view_details?: boolean
          can_view_financials?: boolean
          canonical_session_source_id: string
          created_at?: string
          id?: string
          invited_email?: string | null
          organization_id?: string | null
          partner_profile_id?: string | null
          partner_type?: string
          source_deal_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          added_by?: string | null
          can_edit_event?: boolean
          can_manage_financials?: boolean
          can_receive_crm_data?: boolean
          can_view_details?: boolean
          can_view_financials?: boolean
          canonical_session_source_id?: string
          created_at?: string
          id?: string
          invited_email?: string | null
          organization_id?: string | null
          partner_profile_id?: string | null
          partner_type?: string
          source_deal_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_partners_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_partners_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_partners_partner_profile_id_fkey"
            columns: ["partner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      session_performers: {
        Row: {
          billing_order: number | null
          comedian_id: string
          comedian_stage_name: string | null
          created_at: string
          id: string
          notes: string | null
          role: string | null
          session_id: string | null
          source: string | null
          source_event_id: string | null
          source_session_id: string | null
          updated_at: string
        }
        Insert: {
          billing_order?: number | null
          comedian_id: string
          comedian_stage_name?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          role?: string | null
          session_id?: string | null
          source?: string | null
          source_event_id?: string | null
          source_session_id?: string | null
          updated_at?: string
        }
        Update: {
          billing_order?: number | null
          comedian_id?: string
          comedian_stage_name?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          role?: string | null
          session_id?: string | null
          source?: string | null
          source_event_id?: string | null
          source_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_performers_comedian_id_fkey"
            columns: ["comedian_id"]
            isOneToOne: false
            referencedRelation: "comedians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_performers_comedian_id_fkey"
            columns: ["comedian_id"]
            isOneToOne: false
            referencedRelation: "comedians_flat_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_performers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_performers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      session_sources: {
        Row: {
          canonical_session_source_id: string
          canonical_source: string
          created_at: string | null
          source: string
          source_event_id: string | null
          source_session_id: string
          updated_at: string | null
        }
        Insert: {
          canonical_session_source_id: string
          canonical_source?: string
          created_at?: string | null
          source: string
          source_event_id?: string | null
          source_session_id: string
          updated_at?: string | null
        }
        Update: {
          canonical_session_source_id?: string
          canonical_source?: string
          created_at?: string | null
          source?: string
          source_event_id?: string | null
          source_session_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          capacity: number | null
          created_at: string | null
          event_id: string | null
          event_source_id: string | null
          id: string
          raw: Json | null
          source: string
          source_id: string | null
          starts_at: string | null
          status: string | null
          ticket_url: string | null
          updated_at: string | null
          venue_name: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          event_id?: string | null
          event_source_id?: string | null
          id?: string
          raw?: Json | null
          source: string
          source_id?: string | null
          starts_at?: string | null
          status?: string | null
          ticket_url?: string | null
          updated_at?: string | null
          venue_name?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          event_id?: string | null
          event_source_id?: string | null
          id?: string
          raw?: Json | null
          source?: string
          source_id?: string | null
          starts_at?: string | null
          status?: string | null
          ticket_url?: string | null
          updated_at?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
        ]
      }
      sessions_fever: {
        Row: {
          attendance_pct: number | null
          avg_gross_per_ticket_cents: number | null
          capacity: number | null
          created_at: string | null
          discount_cents: number | null
          event_date: string
          event_name: string | null
          fever_commission_cents: number | null
          fever_commission_pct: number | null
          fever_gst_cents: number | null
          fever_total_fees_cents: number | null
          id: string
          organizer_payout_cents: number | null
          raw: Json | null
          sold_out_pct: number | null
          surcharge_cents: number | null
          ticket_gross_revenue_cents: number | null
          tickets_available: number | null
          tickets_validated: number | null
          total_gross_revenue_cents: number | null
          total_tickets: number | null
          updated_at: string | null
          user_payment_cents: number | null
          weekday: string | null
        }
        Insert: {
          attendance_pct?: number | null
          avg_gross_per_ticket_cents?: number | null
          capacity?: number | null
          created_at?: string | null
          discount_cents?: number | null
          event_date: string
          event_name?: string | null
          fever_commission_cents?: number | null
          fever_commission_pct?: number | null
          fever_gst_cents?: number | null
          fever_total_fees_cents?: number | null
          id?: string
          organizer_payout_cents?: number | null
          raw?: Json | null
          sold_out_pct?: number | null
          surcharge_cents?: number | null
          ticket_gross_revenue_cents?: number | null
          tickets_available?: number | null
          tickets_validated?: number | null
          total_gross_revenue_cents?: number | null
          total_tickets?: number | null
          updated_at?: string | null
          user_payment_cents?: number | null
          weekday?: string | null
        }
        Update: {
          attendance_pct?: number | null
          avg_gross_per_ticket_cents?: number | null
          capacity?: number | null
          created_at?: string | null
          discount_cents?: number | null
          event_date?: string
          event_name?: string | null
          fever_commission_cents?: number | null
          fever_commission_pct?: number | null
          fever_gst_cents?: number | null
          fever_total_fees_cents?: number | null
          id?: string
          organizer_payout_cents?: number | null
          raw?: Json | null
          sold_out_pct?: number | null
          surcharge_cents?: number | null
          ticket_gross_revenue_cents?: number | null
          tickets_available?: number | null
          tickets_validated?: number | null
          total_gross_revenue_cents?: number | null
          total_tickets?: number | null
          updated_at?: string | null
          user_payment_cents?: number | null
          weekday?: string | null
        }
        Relationships: []
      }
      sessions_htx: {
        Row: {
          created_at: string | null
          end_date: string | null
          end_date_local: string | null
          event_source_id: string
          id: number
          ingested_at: string | null
          name: string | null
          raw: Json
          source: string
          source_id: string
          start_date: string | null
          start_date_local: string | null
          tags: string[] | null
          timezone: string | null
          updated_at: string | null
          updated_at_api: string | null
          venue_name: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          end_date_local?: string | null
          event_source_id: string
          id?: never
          ingested_at?: string | null
          name?: string | null
          raw: Json
          source: string
          source_id: string
          start_date?: string | null
          start_date_local?: string | null
          tags?: string[] | null
          timezone?: string | null
          updated_at?: string | null
          updated_at_api?: string | null
          venue_name?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          end_date_local?: string | null
          event_source_id?: string
          id?: never
          ingested_at?: string | null
          name?: string | null
          raw?: Json
          source?: string
          source_id?: string
          start_date?: string | null
          start_date_local?: string | null
          tags?: string[] | null
          timezone?: string | null
          updated_at?: string | null
          updated_at_api?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_htx_event_source_fk"
            columns: ["event_source_id"]
            isOneToOne: false
            referencedRelation: "events_htx"
            referencedColumns: ["source_id"]
          },
          {
            foreignKeyName: "sessions_htx_event_source_fk"
            columns: ["event_source_id"]
            isOneToOne: false
            referencedRelation: "events_htx_view"
            referencedColumns: ["source_id"]
          },
        ]
      }
      sidebar_preferences: {
        Row: {
          created_at: string | null
          hidden_items: string[] | null
          id: string
          item_order: string[] | null
          profile_id: string | null
          profile_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          hidden_items?: string[] | null
          id?: string
          item_order?: string[] | null
          profile_id?: string | null
          profile_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          hidden_items?: string[] | null
          id?: string
          item_order?: string[] | null
          profile_id?: string | null
          profile_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      silent_onboarding_submissions: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          instagram: string | null
          last_name: string
          notes: string | null
          selected_event_ids: string[]
          selected_events_details: Json
          submitted_at: string
          youtube_link: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          instagram?: string | null
          last_name: string
          notes?: string | null
          selected_event_ids?: string[]
          selected_events_details?: Json
          submitted_at?: string
          youtube_link: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          instagram?: string | null
          last_name?: string
          notes?: string | null
          selected_event_ids?: string[]
          selected_events_details?: Json
          submitted_at?: string
          youtube_link?: string
        }
        Relationships: []
      }
      social_channels: {
        Row: {
          channel_handle: string | null
          channel_name: string
          created_at: string
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          oauth_data: Json | null
          platform: string
          postiz_integration_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_handle?: string | null
          channel_name: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          oauth_data?: Json | null
          platform: string
          postiz_integration_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_handle?: string | null
          channel_name?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          oauth_data?: Json | null
          platform?: string
          postiz_integration_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_post_analytics: {
        Row: {
          clicks: number | null
          comments: number | null
          created_at: string
          id: string
          last_updated_at: string
          likes: number | null
          platform_metrics: Json | null
          post_id: string
          shares: number | null
          views: number | null
        }
        Insert: {
          clicks?: number | null
          comments?: number | null
          created_at?: string
          id?: string
          last_updated_at?: string
          likes?: number | null
          platform_metrics?: Json | null
          post_id: string
          shares?: number | null
          views?: number | null
        }
        Update: {
          clicks?: number | null
          comments?: number | null
          created_at?: string
          id?: string
          last_updated_at?: string
          likes?: number | null
          platform_metrics?: Json | null
          post_id?: string
          shares?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "social_post_analytics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_post_templates: {
        Row: {
          content_template: string
          created_at: string
          default_hashtags: string[] | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          suggested_platforms: string[] | null
          template_type: string | null
          updated_at: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          content_template: string
          created_at?: string
          default_hashtags?: string[] | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          suggested_platforms?: string[] | null
          template_type?: string | null
          updated_at?: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          content_template?: string
          created_at?: string
          default_hashtags?: string[] | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          suggested_platforms?: string[] | null
          template_type?: string | null
          updated_at?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          channel_id: string
          content: string
          created_at: string
          error_message: string | null
          event_id: string | null
          hashtags: string[] | null
          id: string
          is_auto_generated: boolean | null
          media_file_ids: string[] | null
          media_urls: string[] | null
          posted_at: string | null
          postiz_post_id: string | null
          retry_count: number | null
          scheduled_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          content: string
          created_at?: string
          error_message?: string | null
          event_id?: string | null
          hashtags?: string[] | null
          id?: string
          is_auto_generated?: boolean | null
          media_file_ids?: string[] | null
          media_urls?: string[] | null
          posted_at?: string | null
          postiz_post_id?: string | null
          retry_count?: number | null
          scheduled_at: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          content?: string
          created_at?: string
          error_message?: string | null
          event_id?: string | null
          hashtags?: string[] | null
          id?: string
          is_auto_generated?: boolean | null
          media_file_ids?: string[] | null
          media_urls?: string[] | null
          posted_at?: string | null
          postiz_post_id?: string | null
          retry_count?: number | null
          scheduled_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "social_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "social_posts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "social_posts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "social_posts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
        ]
      }
      sponsor_agreements: {
        Row: {
          agreement_name: string | null
          benefits: string | null
          contribution_amount: number | null
          contribution_type: string | null
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          organizer_id: string
          sponsor_id: string
          start_date: string | null
          status: string | null
          venue_id: string | null
        }
        Insert: {
          agreement_name?: string | null
          benefits?: string | null
          contribution_amount?: number | null
          contribution_type?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          organizer_id: string
          sponsor_id: string
          start_date?: string | null
          status?: string | null
          venue_id?: string | null
        }
        Update: {
          agreement_name?: string | null
          benefits?: string | null
          contribution_amount?: number | null
          contribution_type?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          organizer_id?: string
          sponsor_id?: string
          start_date?: string | null
          status?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_agreements_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_agreements_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers_flat_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_agreements_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_agreements_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors_flat_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_agreements_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_agreements_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_flat_v"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_contacts: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_primary: boolean | null
          phone: string | null
          role: string | null
          sponsor_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_primary?: boolean | null
          phone?: string | null
          role?: string | null
          sponsor_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_primary?: boolean | null
          phone?: string | null
          role?: string | null
          sponsor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_contacts_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_contacts_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors_flat_v"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          company_name: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          industry: string | null
          logo_url: string | null
          metadata: Json
          slug: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          company_name: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          metadata?: Json
          slug?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          company_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          metadata?: Json
          slug?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      spot_assignments: {
        Row: {
          application_id: string | null
          assigned_at: string
          assigned_by: string | null
          comedian_id: string
          confirmation_deadline: string | null
          confirmation_status: string | null
          confirmed_at: string | null
          created_at: string
          declined_at: string | null
          event_id: string
          id: string
          notes: string | null
          spot_id: string
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          assigned_at?: string
          assigned_by?: string | null
          comedian_id: string
          confirmation_deadline?: string | null
          confirmation_status?: string | null
          confirmed_at?: string | null
          created_at?: string
          declined_at?: string | null
          event_id: string
          id?: string
          notes?: string | null
          spot_id: string
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          assigned_at?: string
          assigned_by?: string | null
          comedian_id?: string
          confirmation_deadline?: string | null
          confirmation_status?: string | null
          confirmed_at?: string | null
          created_at?: string
          declined_at?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          spot_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spot_assignments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spot_assignments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "comedian_event_availability_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spot_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spot_assignments_comedian_id_fkey"
            columns: ["comedian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spot_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "spot_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spot_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spot_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spot_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "spot_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "spot_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "spot_assignments_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "event_spots"
            referencedColumns: ["id"]
          },
        ]
      }
      stored_memories: {
        Row: {
          agent_ids: string[]
          created_at: string | null
          created_by: string
          id: string
          importance: number | null
          memory_content: string
          memory_type: string | null
          metadata: Json | null
          session_id: string | null
          tags: string[] | null
        }
        Insert: {
          agent_ids: string[]
          created_at?: string | null
          created_by: string
          id?: string
          importance?: number | null
          memory_content: string
          memory_type?: string | null
          metadata?: Json | null
          session_id?: string | null
          tags?: string[] | null
        }
        Update: {
          agent_ids?: string[]
          created_at?: string | null
          created_by?: string
          id?: string
          importance?: number | null
          memory_content?: string
          memory_type?: string | null
          metadata?: Json | null
          session_id?: string | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "stored_memories_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_debounce: {
        Row: {
          key: string
          last_triggered_at: string
        }
        Insert: {
          key: string
          last_triggered_at?: string
        }
        Update: {
          key?: string
          last_triggered_at?: string
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          payload: Json | null
          source: string
          status: string | null
          trigger_table: string | null
          trigger_type: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          payload?: Json | null
          source: string
          status?: string | null
          trigger_table?: string | null
          trigger_type?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          payload?: Json | null
          source?: string
          status?: string | null
          trigger_table?: string | null
          trigger_type?: string | null
        }
        Relationships: []
      }
      sync_state: {
        Row: {
          key: string | null
          updated_at: string | null
          value: string | null
        }
        Insert: {
          key?: string | null
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          key?: string | null
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      task_comments: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string | null
          id: string
          is_system_comment: boolean | null
          task_id: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string | null
          id?: string
          is_system_comment?: boolean | null
          task_id: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string | null
          id?: string
          is_system_comment?: boolean | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_reminders: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          recurring_interval: unknown
          remind_at: string
          reminder_type: Database["public"]["Enums"]["reminder_type"]
          sent: boolean | null
          sent_at: string | null
          task_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          recurring_interval?: unknown
          remind_at: string
          reminder_type: Database["public"]["Enums"]["reminder_type"]
          sent?: boolean | null
          sent_at?: string | null
          task_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          recurring_interval?: unknown
          remind_at?: string
          reminder_type?: Database["public"]["Enums"]["reminder_type"]
          sent?: boolean | null
          sent_at?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_reminders_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_template_items: {
        Row: {
          category: Database["public"]["Enums"]["task_category"] | null
          created_at: string | null
          dependencies: string[] | null
          description: string | null
          due_offset_days: number | null
          estimated_hours: number | null
          id: string
          metadata: Json | null
          order_index: number
          priority: Database["public"]["Enums"]["task_priority"] | null
          template_id: string
          title: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["task_category"] | null
          created_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          due_offset_days?: number | null
          estimated_hours?: number | null
          id?: string
          metadata?: Json | null
          order_index: number
          priority?: Database["public"]["Enums"]["task_priority"] | null
          template_id: string
          title: string
        }
        Update: {
          category?: Database["public"]["Enums"]["task_category"] | null
          created_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          due_offset_days?: number | null
          estimated_hours?: number | null
          id?: string
          metadata?: Json | null
          order_index?: number
          priority?: Database["public"]["Enums"]["task_priority"] | null
          template_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          category: Database["public"]["Enums"]["task_category"] | null
          created_at: string | null
          creator_id: string
          description: string | null
          id: string
          is_public: boolean | null
          is_system_template: boolean | null
          name: string
          tags: string[] | null
          updated_at: string | null
          usage_count: number | null
          variables: Json | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["task_category"] | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          is_system_template?: boolean | null
          name: string
          tags?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Update: {
          category?: Database["public"]["Enums"]["task_category"] | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          is_system_template?: boolean | null
          name?: string
          tags?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assignee_id: string | null
          category: Database["public"]["Enums"]["task_category"] | null
          completed_at: string | null
          created_at: string | null
          creator_id: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          is_recurring: boolean | null
          metadata: Json | null
          parent_task_id: string | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          progress_percentage: number | null
          recurrence_pattern: Json | null
          status: Database["public"]["Enums"]["task_status"] | null
          tags: string[] | null
          template_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_hours?: number | null
          assignee_id?: string | null
          category?: Database["public"]["Enums"]["task_category"] | null
          completed_at?: string | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          is_recurring?: boolean | null
          metadata?: Json | null
          parent_task_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          progress_percentage?: number | null
          recurrence_pattern?: Json | null
          status?: Database["public"]["Enums"]["task_status"] | null
          tags?: string[] | null
          template_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_hours?: number | null
          assignee_id?: string | null
          category?: Database["public"]["Enums"]["task_category"] | null
          completed_at?: string | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          is_recurring?: boolean | null
          metadata?: Json | null
          parent_task_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          progress_percentage?: number | null
          recurrence_pattern?: Json | null
          status?: Database["public"]["Enums"]["task_status"] | null
          tags?: string[] | null
          template_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tasks_assignee"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tasks_creator"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tasks_template_id"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_platforms: {
        Row: {
          created_at: string | null
          event_id: string | null
          external_event_id: string
          external_event_url: string | null
          gross_sales: number | null
          id: string
          is_primary: boolean | null
          last_sync_at: string | null
          platform: string
          platform_config: Json | null
          platform_data: Json | null
          tickets_available: number | null
          tickets_sold: number | null
          updated_at: string | null
          webhook_last_received: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          external_event_id: string
          external_event_url?: string | null
          gross_sales?: number | null
          id?: string
          is_primary?: boolean | null
          last_sync_at?: string | null
          platform: string
          platform_config?: Json | null
          platform_data?: Json | null
          tickets_available?: number | null
          tickets_sold?: number | null
          updated_at?: string | null
          webhook_last_received?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          external_event_id?: string
          external_event_url?: string | null
          gross_sales?: number | null
          id?: string
          is_primary?: boolean | null
          last_sync_at?: string | null
          platform?: string
          platform_config?: Json | null
          platform_data?: Json | null
          tickets_available?: number | null
          tickets_sold?: number | null
          updated_at?: string | null
          webhook_last_received?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_platforms_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "ticket_platforms_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_platforms_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_platforms_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_platforms_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "ticket_platforms_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "ticket_platforms_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
        ]
      }
      ticket_sales: {
        Row: {
          created_at: string | null
          currency: string | null
          customer_email: string
          customer_name: string
          event_id: string | null
          id: string
          platform: string | null
          platform_order_id: string | null
          purchase_date: string | null
          raw_data: Json | null
          refund_amount: number | null
          refund_date: string | null
          refund_status: string | null
          ticket_quantity: number
          ticket_type: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          customer_email: string
          customer_name: string
          event_id?: string | null
          id?: string
          platform?: string | null
          platform_order_id?: string | null
          purchase_date?: string | null
          raw_data?: Json | null
          refund_amount?: number | null
          refund_date?: string | null
          refund_status?: string | null
          ticket_quantity?: number
          ticket_type?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          customer_email?: string
          customer_name?: string
          event_id?: string | null
          id?: string
          platform?: string | null
          platform_order_id?: string | null
          purchase_date?: string | null
          raw_data?: Json | null
          refund_amount?: number | null
          refund_date?: string | null
          refund_status?: string | null
          ticket_quantity?: number
          ticket_type?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ticket_sales_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_ticket_sales_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ticket_sales_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ticket_sales_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ticket_sales_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_ticket_sales_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_ticket_sales_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "ticket_sales_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "ticket_sales_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_sales_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_sales_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_sales_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "ticket_sales_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "ticket_sales_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
        ]
      }
      ticket_sales_log: {
        Row: {
          gross_sales: number | null
          id: string
          sales_delta: number | null
          sync_timestamp: string | null
          ticket_platform_id: string | null
          tickets_available: number
          tickets_sold: number
          tickets_sold_delta: number | null
        }
        Insert: {
          gross_sales?: number | null
          id?: string
          sales_delta?: number | null
          sync_timestamp?: string | null
          ticket_platform_id?: string | null
          tickets_available: number
          tickets_sold: number
          tickets_sold_delta?: number | null
        }
        Update: {
          gross_sales?: number | null
          id?: string
          sales_delta?: number | null
          sync_timestamp?: string | null
          ticket_platform_id?: string | null
          tickets_available?: number
          tickets_sold?: number
          tickets_sold_delta?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_sales_log_ticket_platform_id_fkey"
            columns: ["ticket_platform_id"]
            isOneToOne: false
            referencedRelation: "ticket_platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_webhook_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          payload: Json | null
          platform: string
          processed: boolean | null
          signature: string | null
          timestamp: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          platform: string
          processed?: boolean | null
          signature?: string | null
          timestamp?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          platform?: string
          processed?: boolean | null
          signature?: string | null
          timestamp?: string | null
        }
        Relationships: []
      }
      tickets: {
        Row: {
          absorbed_fee_cents: number | null
          access_code: string | null
          additional_fields: Json | null
          attendee_email: string | null
          attendee_first_name: string | null
          attendee_last_name: string | null
          attendee_profile_id: string | null
          auto_discount_amount_cents: number | null
          barcode: string | null
          cancelled_at: string | null
          check_in_date: string | null
          check_in_history: Json | null
          check_in_status: string | null
          check_in_user_id: string | null
          checked_in: boolean | null
          created_at: string | null
          currency: string | null
          custom_scanning_code: string | null
          dgr_donation_cents: number | null
          discount_code: string | null
          discount_code_amount_cents: number | null
          fee_cents: number | null
          first_name: string | null
          id: string
          is_donation: boolean | null
          last_name: string | null
          location_code: string | null
          net_price_cents: number | null
          number: number | null
          order_id: string | null
          order_name: string | null
          order_source_id: string | null
          organisation: string | null
          package_group_id: string | null
          package_id: string | null
          package_name: string | null
          package_price_cents: number | null
          passed_on_fee_cents: number | null
          price_cents: number | null
          qr_code_event_id: string | null
          qr_code_id: string | null
          raw: Json | null
          sales_channel: string | null
          seating_map_id: string | null
          seating_name: string | null
          seating_note: string | null
          seating_seat: string | null
          seating_section: string | null
          seating_table: string | null
          session_id: string | null
          session_source_id: string | null
          source: string
          source_id: string | null
          status: string | null
          taxes_cents: number | null
          ticket_name: string | null
          ticket_type: string | null
          ticket_type_id: string | null
          ticket_type_name: string | null
          total_cents: number | null
          updated_at: string | null
        }
        Insert: {
          absorbed_fee_cents?: number | null
          access_code?: string | null
          additional_fields?: Json | null
          attendee_email?: string | null
          attendee_first_name?: string | null
          attendee_last_name?: string | null
          attendee_profile_id?: string | null
          auto_discount_amount_cents?: number | null
          barcode?: string | null
          cancelled_at?: string | null
          check_in_date?: string | null
          check_in_history?: Json | null
          check_in_status?: string | null
          check_in_user_id?: string | null
          checked_in?: boolean | null
          created_at?: string | null
          currency?: string | null
          custom_scanning_code?: string | null
          dgr_donation_cents?: number | null
          discount_code?: string | null
          discount_code_amount_cents?: number | null
          fee_cents?: number | null
          first_name?: string | null
          id?: string
          is_donation?: boolean | null
          last_name?: string | null
          location_code?: string | null
          net_price_cents?: number | null
          number?: number | null
          order_id?: string | null
          order_name?: string | null
          order_source_id?: string | null
          organisation?: string | null
          package_group_id?: string | null
          package_id?: string | null
          package_name?: string | null
          package_price_cents?: number | null
          passed_on_fee_cents?: number | null
          price_cents?: number | null
          qr_code_event_id?: string | null
          qr_code_id?: string | null
          raw?: Json | null
          sales_channel?: string | null
          seating_map_id?: string | null
          seating_name?: string | null
          seating_note?: string | null
          seating_seat?: string | null
          seating_section?: string | null
          seating_table?: string | null
          session_id?: string | null
          session_source_id?: string | null
          source: string
          source_id?: string | null
          status?: string | null
          taxes_cents?: number | null
          ticket_name?: string | null
          ticket_type?: string | null
          ticket_type_id?: string | null
          ticket_type_name?: string | null
          total_cents?: number | null
          updated_at?: string | null
        }
        Update: {
          absorbed_fee_cents?: number | null
          access_code?: string | null
          additional_fields?: Json | null
          attendee_email?: string | null
          attendee_first_name?: string | null
          attendee_last_name?: string | null
          attendee_profile_id?: string | null
          auto_discount_amount_cents?: number | null
          barcode?: string | null
          cancelled_at?: string | null
          check_in_date?: string | null
          check_in_history?: Json | null
          check_in_status?: string | null
          check_in_user_id?: string | null
          checked_in?: boolean | null
          created_at?: string | null
          currency?: string | null
          custom_scanning_code?: string | null
          dgr_donation_cents?: number | null
          discount_code?: string | null
          discount_code_amount_cents?: number | null
          fee_cents?: number | null
          first_name?: string | null
          id?: string
          is_donation?: boolean | null
          last_name?: string | null
          location_code?: string | null
          net_price_cents?: number | null
          number?: number | null
          order_id?: string | null
          order_name?: string | null
          order_source_id?: string | null
          organisation?: string | null
          package_group_id?: string | null
          package_id?: string | null
          package_name?: string | null
          package_price_cents?: number | null
          passed_on_fee_cents?: number | null
          price_cents?: number | null
          qr_code_event_id?: string | null
          qr_code_id?: string | null
          raw?: Json | null
          sales_channel?: string | null
          seating_map_id?: string | null
          seating_name?: string | null
          seating_note?: string | null
          seating_seat?: string | null
          seating_section?: string | null
          seating_table?: string | null
          session_id?: string | null
          session_source_id?: string | null
          source?: string
          source_id?: string | null
          status?: string | null
          taxes_cents?: number | null
          ticket_name?: string | null
          ticket_type?: string | null
          ticket_type_id?: string | null
          ticket_type_name?: string | null
          total_cents?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      tickets_eventbrite: {
        Row: {
          absorbed_fee_cents: number | null
          created_at: string | null
          currency: string | null
          dgr_donation_cents: number | null
          discount_cents: number | null
          email: string | null
          event_source_id: string | null
          fee_cents: number | null
          first_name: string | null
          ingested_at: string | null
          last_name: string | null
          net_price_cents: number | null
          order_source_id: string | null
          passed_on_fee_cents: number | null
          price_cents: number | null
          raw: Json | null
          session_source_id: string | null
          source: string | null
          source_id: string
          status: string | null
          taxes_cents: number | null
          ticket_type_id: string | null
          ticket_type_name: string | null
          total_cents: number | null
          updated_at: string | null
          updated_at_api: string | null
        }
        Insert: {
          absorbed_fee_cents?: number | null
          created_at?: string | null
          currency?: string | null
          dgr_donation_cents?: number | null
          discount_cents?: number | null
          email?: string | null
          event_source_id?: string | null
          fee_cents?: number | null
          first_name?: string | null
          ingested_at?: string | null
          last_name?: string | null
          net_price_cents?: number | null
          order_source_id?: string | null
          passed_on_fee_cents?: number | null
          price_cents?: number | null
          raw?: Json | null
          session_source_id?: string | null
          source?: string | null
          source_id: string
          status?: string | null
          taxes_cents?: number | null
          ticket_type_id?: string | null
          ticket_type_name?: string | null
          total_cents?: number | null
          updated_at?: string | null
          updated_at_api?: string | null
        }
        Update: {
          absorbed_fee_cents?: number | null
          created_at?: string | null
          currency?: string | null
          dgr_donation_cents?: number | null
          discount_cents?: number | null
          email?: string | null
          event_source_id?: string | null
          fee_cents?: number | null
          first_name?: string | null
          ingested_at?: string | null
          last_name?: string | null
          net_price_cents?: number | null
          order_source_id?: string | null
          passed_on_fee_cents?: number | null
          price_cents?: number | null
          raw?: Json | null
          session_source_id?: string | null
          source?: string | null
          source_id?: string
          status?: string | null
          taxes_cents?: number | null
          ticket_type_id?: string | null
          ticket_type_name?: string | null
          total_cents?: number | null
          updated_at?: string | null
          updated_at_api?: string | null
        }
        Relationships: []
      }
      tickets_htx: {
        Row: {
          absorbed_fee_cents: number | null
          access_code: string | null
          additional_fields: Json | null
          attendee_address_city: string | null
          attendee_address_country: string | null
          attendee_address_postal_code: string | null
          attendee_address_state: string | null
          attendee_address_street: string | null
          attendee_address_suburb: string | null
          attendee_date_of_birth: string | null
          attendee_profile_id: string | null
          auto_discount_amount_cents: number | null
          barcode: string | null
          cancelled_at: string | null
          check_in_date: string | null
          check_in_device: string | null
          check_in_history: Json | null
          check_in_id: string | null
          check_in_location: string | null
          check_in_notes: string | null
          check_in_status: string | null
          check_in_user_id: string | null
          checked_in: boolean | null
          created_at: string | null
          currency: string | null
          custom_scanning_code: string | null
          dgr_donation_cents: number | null
          discount_cents: number | null
          discount_code_amount_cents: number | null
          discount_code_used: string | null
          discounts: Json | null
          event_date_id: string | null
          event_source_id: string | null
          fee_cents: number | null
          first_name: string | null
          ingested_at: string
          is_donation: boolean | null
          last_name: string | null
          location: string | null
          net_price_cents: number | null
          order_name: string | null
          order_source_id: string | null
          organisation: string | null
          package_group_id: string | null
          package_id: string | null
          package_name: string | null
          package_price_cents: number | null
          passed_on_fee_cents: number | null
          price_cents: number | null
          qr_code_data: Json | null
          raw: Json | null
          rebate_cents: number | null
          sales_channel: string | null
          seating_map_id: string | null
          seating_name: string | null
          seating_note: string | null
          seating_seat: string | null
          seating_section: string | null
          seating_table: string | null
          session_source_id: string | null
          source: string | null
          source_id: string | null
          status: string | null
          swapped_from: Json | null
          swapped_to: Json | null
          tax_cents: number | null
          taxes_cents: number | null
          ticket_number: number | null
          ticket_type_id: string | null
          ticket_type_name: string | null
          total_cents: number | null
          updated_at: string | null
          updated_at_api: string | null
        }
        Insert: {
          absorbed_fee_cents?: number | null
          access_code?: string | null
          additional_fields?: Json | null
          attendee_address_city?: string | null
          attendee_address_country?: string | null
          attendee_address_postal_code?: string | null
          attendee_address_state?: string | null
          attendee_address_street?: string | null
          attendee_address_suburb?: string | null
          attendee_date_of_birth?: string | null
          attendee_profile_id?: string | null
          auto_discount_amount_cents?: number | null
          barcode?: string | null
          cancelled_at?: string | null
          check_in_date?: string | null
          check_in_device?: string | null
          check_in_history?: Json | null
          check_in_id?: string | null
          check_in_location?: string | null
          check_in_notes?: string | null
          check_in_status?: string | null
          check_in_user_id?: string | null
          checked_in?: boolean | null
          created_at?: string | null
          currency?: string | null
          custom_scanning_code?: string | null
          dgr_donation_cents?: number | null
          discount_cents?: number | null
          discount_code_amount_cents?: number | null
          discount_code_used?: string | null
          discounts?: Json | null
          event_date_id?: string | null
          event_source_id?: string | null
          fee_cents?: number | null
          first_name?: string | null
          ingested_at?: string
          is_donation?: boolean | null
          last_name?: string | null
          location?: string | null
          net_price_cents?: number | null
          order_name?: string | null
          order_source_id?: string | null
          organisation?: string | null
          package_group_id?: string | null
          package_id?: string | null
          package_name?: string | null
          package_price_cents?: number | null
          passed_on_fee_cents?: number | null
          price_cents?: number | null
          qr_code_data?: Json | null
          raw?: Json | null
          rebate_cents?: number | null
          sales_channel?: string | null
          seating_map_id?: string | null
          seating_name?: string | null
          seating_note?: string | null
          seating_seat?: string | null
          seating_section?: string | null
          seating_table?: string | null
          session_source_id?: string | null
          source?: string | null
          source_id?: string | null
          status?: string | null
          swapped_from?: Json | null
          swapped_to?: Json | null
          tax_cents?: number | null
          taxes_cents?: number | null
          ticket_number?: number | null
          ticket_type_id?: string | null
          ticket_type_name?: string | null
          total_cents?: number | null
          updated_at?: string | null
          updated_at_api?: string | null
        }
        Update: {
          absorbed_fee_cents?: number | null
          access_code?: string | null
          additional_fields?: Json | null
          attendee_address_city?: string | null
          attendee_address_country?: string | null
          attendee_address_postal_code?: string | null
          attendee_address_state?: string | null
          attendee_address_street?: string | null
          attendee_address_suburb?: string | null
          attendee_date_of_birth?: string | null
          attendee_profile_id?: string | null
          auto_discount_amount_cents?: number | null
          barcode?: string | null
          cancelled_at?: string | null
          check_in_date?: string | null
          check_in_device?: string | null
          check_in_history?: Json | null
          check_in_id?: string | null
          check_in_location?: string | null
          check_in_notes?: string | null
          check_in_status?: string | null
          check_in_user_id?: string | null
          checked_in?: boolean | null
          created_at?: string | null
          currency?: string | null
          custom_scanning_code?: string | null
          dgr_donation_cents?: number | null
          discount_cents?: number | null
          discount_code_amount_cents?: number | null
          discount_code_used?: string | null
          discounts?: Json | null
          event_date_id?: string | null
          event_source_id?: string | null
          fee_cents?: number | null
          first_name?: string | null
          ingested_at?: string
          is_donation?: boolean | null
          last_name?: string | null
          location?: string | null
          net_price_cents?: number | null
          order_name?: string | null
          order_source_id?: string | null
          organisation?: string | null
          package_group_id?: string | null
          package_id?: string | null
          package_name?: string | null
          package_price_cents?: number | null
          passed_on_fee_cents?: number | null
          price_cents?: number | null
          qr_code_data?: Json | null
          raw?: Json | null
          rebate_cents?: number | null
          sales_channel?: string | null
          seating_map_id?: string | null
          seating_name?: string | null
          seating_note?: string | null
          seating_seat?: string | null
          seating_section?: string | null
          seating_table?: string | null
          session_source_id?: string | null
          source?: string | null
          source_id?: string | null
          status?: string | null
          swapped_from?: Json | null
          swapped_to?: Json | null
          tax_cents?: number | null
          taxes_cents?: number | null
          ticket_number?: number | null
          ticket_type_id?: string | null
          ticket_type_name?: string | null
          total_cents?: number | null
          updated_at?: string | null
          updated_at_api?: string | null
        }
        Relationships: []
      }
      tour_collaborations: {
        Row: {
          agreement_file_url: string | null
          collaboration_notes: string | null
          collaborator_id: string
          contact_priority: number | null
          contract_terms: Json | null
          created_at: string | null
          decision_making_power: boolean | null
          expense_share: number | null
          financial_responsibility: number | null
          id: string
          invitation_expires_at: string | null
          invitation_sent_at: string | null
          joined_at: string | null
          left_at: string | null
          local_knowledge: string | null
          marketing_contribution: Json | null
          performance_rating: number | null
          responded_at: string | null
          responsibilities: string[] | null
          revenue_share: number | null
          role: Database["public"]["Enums"]["collaboration_role"]
          signed_agreement: boolean | null
          specific_shows: string[] | null
          status: Database["public"]["Enums"]["collaboration_status"] | null
          termination_reason: string | null
          tour_id: string
          updated_at: string | null
          venue_connections: Json | null
          would_collaborate_again: boolean | null
        }
        Insert: {
          agreement_file_url?: string | null
          collaboration_notes?: string | null
          collaborator_id: string
          contact_priority?: number | null
          contract_terms?: Json | null
          created_at?: string | null
          decision_making_power?: boolean | null
          expense_share?: number | null
          financial_responsibility?: number | null
          id?: string
          invitation_expires_at?: string | null
          invitation_sent_at?: string | null
          joined_at?: string | null
          left_at?: string | null
          local_knowledge?: string | null
          marketing_contribution?: Json | null
          performance_rating?: number | null
          responded_at?: string | null
          responsibilities?: string[] | null
          revenue_share?: number | null
          role: Database["public"]["Enums"]["collaboration_role"]
          signed_agreement?: boolean | null
          specific_shows?: string[] | null
          status?: Database["public"]["Enums"]["collaboration_status"] | null
          termination_reason?: string | null
          tour_id: string
          updated_at?: string | null
          venue_connections?: Json | null
          would_collaborate_again?: boolean | null
        }
        Update: {
          agreement_file_url?: string | null
          collaboration_notes?: string | null
          collaborator_id?: string
          contact_priority?: number | null
          contract_terms?: Json | null
          created_at?: string | null
          decision_making_power?: boolean | null
          expense_share?: number | null
          financial_responsibility?: number | null
          id?: string
          invitation_expires_at?: string | null
          invitation_sent_at?: string | null
          joined_at?: string | null
          left_at?: string | null
          local_knowledge?: string | null
          marketing_contribution?: Json | null
          performance_rating?: number | null
          responded_at?: string | null
          responsibilities?: string[] | null
          revenue_share?: number | null
          role?: Database["public"]["Enums"]["collaboration_role"]
          signed_agreement?: boolean | null
          specific_shows?: string[] | null
          status?: Database["public"]["Enums"]["collaboration_status"] | null
          termination_reason?: string | null
          tour_id?: string
          updated_at?: string | null
          venue_connections?: Json | null
          would_collaborate_again?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_collaborations_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          category: string
          created_at: string | null
          currency: string | null
          description: string
          expense_date: string
          id: string
          logistics_id: string | null
          notes: string | null
          paid_by: string | null
          payment_method: string | null
          receipt_url: string | null
          reimbursable: boolean | null
          reimbursed: boolean | null
          reimbursed_date: string | null
          tax_deductible: boolean | null
          tour_id: string
          tour_stop_id: string | null
          vendor_contact: string | null
          vendor_name: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          category: string
          created_at?: string | null
          currency?: string | null
          description: string
          expense_date: string
          id?: string
          logistics_id?: string | null
          notes?: string | null
          paid_by?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          reimbursable?: boolean | null
          reimbursed?: boolean | null
          reimbursed_date?: string | null
          tax_deductible?: boolean | null
          tour_id: string
          tour_stop_id?: string | null
          vendor_contact?: string | null
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string | null
          currency?: string | null
          description?: string
          expense_date?: string
          id?: string
          logistics_id?: string | null
          notes?: string | null
          paid_by?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          reimbursable?: boolean | null
          reimbursed?: boolean | null
          reimbursed_date?: string | null
          tax_deductible?: boolean | null
          tour_id?: string
          tour_stop_id?: string | null
          vendor_contact?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_expenses_logistics_id_fkey"
            columns: ["logistics_id"]
            isOneToOne: false
            referencedRelation: "tour_logistics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_expenses_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_expenses_tour_stop_id_fkey"
            columns: ["tour_stop_id"]
            isOneToOne: false
            referencedRelation: "tour_stops"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_itinerary: {
        Row: {
          activity_type: string
          address: string | null
          backup_plan: string | null
          confirmation_required: boolean | null
          confirmed: boolean | null
          confirmed_at: string | null
          confirmed_by: string | null
          cost: number | null
          created_at: string | null
          date: string
          duration_minutes: number | null
          end_time: string | null
          equipment_needed: string[] | null
          id: string
          location: string | null
          notes: string | null
          order_index: number
          participants: string[] | null
          responsible_person: string | null
          start_time: string
          status: string | null
          title: string
          tour_id: string
          tour_stop_id: string | null
          transportation_method: string | null
          updated_at: string | null
          weather_dependent: boolean | null
        }
        Insert: {
          activity_type: string
          address?: string | null
          backup_plan?: string | null
          confirmation_required?: boolean | null
          confirmed?: boolean | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          cost?: number | null
          created_at?: string | null
          date: string
          duration_minutes?: number | null
          end_time?: string | null
          equipment_needed?: string[] | null
          id?: string
          location?: string | null
          notes?: string | null
          order_index: number
          participants?: string[] | null
          responsible_person?: string | null
          start_time: string
          status?: string | null
          title: string
          tour_id: string
          tour_stop_id?: string | null
          transportation_method?: string | null
          updated_at?: string | null
          weather_dependent?: boolean | null
        }
        Update: {
          activity_type?: string
          address?: string | null
          backup_plan?: string | null
          confirmation_required?: boolean | null
          confirmed?: boolean | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          cost?: number | null
          created_at?: string | null
          date?: string
          duration_minutes?: number | null
          end_time?: string | null
          equipment_needed?: string[] | null
          id?: string
          location?: string | null
          notes?: string | null
          order_index?: number
          participants?: string[] | null
          responsible_person?: string | null
          start_time?: string
          status?: string | null
          title?: string
          tour_id?: string
          tour_stop_id?: string | null
          transportation_method?: string | null
          updated_at?: string | null
          weather_dependent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_itinerary_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_itinerary_tour_stop_id_fkey"
            columns: ["tour_stop_id"]
            isOneToOne: false
            referencedRelation: "tour_stops"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_logistics: {
        Row: {
          attachments: Json | null
          booking_reference: string | null
          cancellation_policy: string | null
          confirmation_number: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          cost: number | null
          created_at: string | null
          currency: string | null
          details: Json | null
          end_date: string | null
          end_time: string | null
          id: string
          modification_policy: string | null
          notes: string | null
          participants: string[] | null
          payment_due_date: string | null
          payment_status: string | null
          provider_name: string | null
          requirements: Json | null
          start_date: string | null
          start_time: string | null
          status: string | null
          tour_id: string
          tour_stop_id: string | null
          type: Database["public"]["Enums"]["logistics_type"]
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          booking_reference?: string | null
          cancellation_policy?: string | null
          confirmation_number?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          cost?: number | null
          created_at?: string | null
          currency?: string | null
          details?: Json | null
          end_date?: string | null
          end_time?: string | null
          id?: string
          modification_policy?: string | null
          notes?: string | null
          participants?: string[] | null
          payment_due_date?: string | null
          payment_status?: string | null
          provider_name?: string | null
          requirements?: Json | null
          start_date?: string | null
          start_time?: string | null
          status?: string | null
          tour_id: string
          tour_stop_id?: string | null
          type: Database["public"]["Enums"]["logistics_type"]
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          booking_reference?: string | null
          cancellation_policy?: string | null
          confirmation_number?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          cost?: number | null
          created_at?: string | null
          currency?: string | null
          details?: Json | null
          end_date?: string | null
          end_time?: string | null
          id?: string
          modification_policy?: string | null
          notes?: string | null
          participants?: string[] | null
          payment_due_date?: string | null
          payment_status?: string | null
          provider_name?: string | null
          requirements?: Json | null
          start_date?: string | null
          start_time?: string | null
          status?: string | null
          tour_id?: string
          tour_stop_id?: string | null
          type?: Database["public"]["Enums"]["logistics_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_logistics_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_logistics_tour_stop_id_fkey"
            columns: ["tour_stop_id"]
            isOneToOne: false
            referencedRelation: "tour_stops"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_participants: {
        Row: {
          accommodation_covered: boolean | null
          bio: string | null
          contract_file_url: string | null
          contract_signed: boolean | null
          created_at: string | null
          emergency_contact: Json | null
          equipment_provided: boolean | null
          id: string
          is_headliner: boolean | null
          join_date: string | null
          leave_date: string | null
          meal_allowance: number | null
          meals_covered: boolean | null
          participant_name: string
          payment_rate: number | null
          payment_terms: string | null
          payment_type: Database["public"]["Enums"]["payment_type"] | null
          performance_notes: string | null
          performance_order: number | null
          photo_url: string | null
          role: Database["public"]["Enums"]["participant_role"]
          social_media: Json | null
          special_requirements: Json | null
          specific_shows: string[] | null
          stage_time_minutes: number | null
          tour_id: string
          travel_covered: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accommodation_covered?: boolean | null
          bio?: string | null
          contract_file_url?: string | null
          contract_signed?: boolean | null
          created_at?: string | null
          emergency_contact?: Json | null
          equipment_provided?: boolean | null
          id?: string
          is_headliner?: boolean | null
          join_date?: string | null
          leave_date?: string | null
          meal_allowance?: number | null
          meals_covered?: boolean | null
          participant_name: string
          payment_rate?: number | null
          payment_terms?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"] | null
          performance_notes?: string | null
          performance_order?: number | null
          photo_url?: string | null
          role: Database["public"]["Enums"]["participant_role"]
          social_media?: Json | null
          special_requirements?: Json | null
          specific_shows?: string[] | null
          stage_time_minutes?: number | null
          tour_id: string
          travel_covered?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accommodation_covered?: boolean | null
          bio?: string | null
          contract_file_url?: string | null
          contract_signed?: boolean | null
          created_at?: string | null
          emergency_contact?: Json | null
          equipment_provided?: boolean | null
          id?: string
          is_headliner?: boolean | null
          join_date?: string | null
          leave_date?: string | null
          meal_allowance?: number | null
          meals_covered?: boolean | null
          participant_name?: string
          payment_rate?: number | null
          payment_terms?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"] | null
          performance_notes?: string | null
          performance_order?: number | null
          photo_url?: string | null
          role?: Database["public"]["Enums"]["participant_role"]
          social_media?: Json | null
          special_requirements?: Json | null
          specific_shows?: string[] | null
          stage_time_minutes?: number | null
          tour_id?: string
          travel_covered?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_participants_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_revenue: {
        Row: {
          amount: number
          collected_by: string | null
          created_at: string | null
          currency: string | null
          description: string
          id: string
          net_amount: number | null
          notes: string | null
          payment_method: string | null
          platform_fee: number | null
          revenue_date: string
          revenue_type: string
          taxes: number | null
          tour_id: string
          tour_stop_id: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          collected_by?: string | null
          created_at?: string | null
          currency?: string | null
          description: string
          id?: string
          net_amount?: number | null
          notes?: string | null
          payment_method?: string | null
          platform_fee?: number | null
          revenue_date: string
          revenue_type: string
          taxes?: number | null
          tour_id: string
          tour_stop_id?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          collected_by?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string
          id?: string
          net_amount?: number | null
          notes?: string | null
          payment_method?: string | null
          platform_fee?: number | null
          revenue_date?: string
          revenue_type?: string
          taxes?: number | null
          tour_id?: string
          tour_stop_id?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_revenue_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_revenue_tour_stop_id_fkey"
            columns: ["tour_stop_id"]
            isOneToOne: false
            referencedRelation: "tour_stops"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_stops: {
        Row: {
          accessibility_info: string | null
          accommodation_info: Json | null
          catering_requirements: Json | null
          covid_requirements: string | null
          created_at: string | null
          distance_to_next_km: number | null
          doors_open: string | null
          event_date: string
          expenses: number | null
          id: string
          load_in_time: string | null
          load_out_time: string | null
          local_contacts: Json | null
          notes: string | null
          order_index: number
          parking_info: string | null
          revenue: number | null
          show_duration_minutes: number | null
          show_time: string
          soundcheck_time: string | null
          status: Database["public"]["Enums"]["tour_stop_status"] | null
          technical_requirements: Json | null
          ticket_price: number | null
          tickets_available: number | null
          tickets_sold: number | null
          tour_id: string
          travel_time_to_next: number | null
          updated_at: string | null
          venue_address: string | null
          venue_capacity: number | null
          venue_city: string
          venue_contact: Json | null
          venue_country: string | null
          venue_name: string
          venue_state: string | null
          vip_price: number | null
          weather_backup_plan: string | null
        }
        Insert: {
          accessibility_info?: string | null
          accommodation_info?: Json | null
          catering_requirements?: Json | null
          covid_requirements?: string | null
          created_at?: string | null
          distance_to_next_km?: number | null
          doors_open?: string | null
          event_date: string
          expenses?: number | null
          id?: string
          load_in_time?: string | null
          load_out_time?: string | null
          local_contacts?: Json | null
          notes?: string | null
          order_index: number
          parking_info?: string | null
          revenue?: number | null
          show_duration_minutes?: number | null
          show_time: string
          soundcheck_time?: string | null
          status?: Database["public"]["Enums"]["tour_stop_status"] | null
          technical_requirements?: Json | null
          ticket_price?: number | null
          tickets_available?: number | null
          tickets_sold?: number | null
          tour_id: string
          travel_time_to_next?: number | null
          updated_at?: string | null
          venue_address?: string | null
          venue_capacity?: number | null
          venue_city: string
          venue_contact?: Json | null
          venue_country?: string | null
          venue_name: string
          venue_state?: string | null
          vip_price?: number | null
          weather_backup_plan?: string | null
        }
        Update: {
          accessibility_info?: string | null
          accommodation_info?: Json | null
          catering_requirements?: Json | null
          covid_requirements?: string | null
          created_at?: string | null
          distance_to_next_km?: number | null
          doors_open?: string | null
          event_date?: string
          expenses?: number | null
          id?: string
          load_in_time?: string | null
          load_out_time?: string | null
          local_contacts?: Json | null
          notes?: string | null
          order_index?: number
          parking_info?: string | null
          revenue?: number | null
          show_duration_minutes?: number | null
          show_time?: string
          soundcheck_time?: string | null
          status?: Database["public"]["Enums"]["tour_stop_status"] | null
          technical_requirements?: Json | null
          ticket_price?: number | null
          tickets_available?: number | null
          tickets_sold?: number | null
          tour_id?: string
          travel_time_to_next?: number | null
          updated_at?: string | null
          venue_address?: string | null
          venue_capacity?: number | null
          venue_city?: string
          venue_contact?: Json | null
          venue_country?: string | null
          venue_name?: string
          venue_state?: string | null
          vip_price?: number | null
          weather_backup_plan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_stops_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tours: {
        Row: {
          actual_revenue: number | null
          agency_id: string | null
          booking_contact_email: string | null
          booking_contact_phone: string | null
          budget: number | null
          cancellation_policy: string | null
          contract_template_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          emergency_contact: Json | null
          end_date: string | null
          estimated_revenue: number | null
          gross_sales: number | null
          id: string
          insurance_info: Json | null
          is_public: boolean | null
          marketing_budget: number | null
          marketing_materials: Json | null
          name: string
          promotional_code: string | null
          revenue_sharing: Json | null
          social_hashtag: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["tour_status"] | null
          tickets_sold: number | null
          total_capacity: number | null
          tour_manager_id: string
          tour_requirements: Json | null
          tour_type: string | null
          travel_policy: Json | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          actual_revenue?: number | null
          agency_id?: string | null
          booking_contact_email?: string | null
          booking_contact_phone?: string | null
          budget?: number | null
          cancellation_policy?: string | null
          contract_template_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          emergency_contact?: Json | null
          end_date?: string | null
          estimated_revenue?: number | null
          gross_sales?: number | null
          id?: string
          insurance_info?: Json | null
          is_public?: boolean | null
          marketing_budget?: number | null
          marketing_materials?: Json | null
          name: string
          promotional_code?: string | null
          revenue_sharing?: Json | null
          social_hashtag?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["tour_status"] | null
          tickets_sold?: number | null
          total_capacity?: number | null
          tour_manager_id: string
          tour_requirements?: Json | null
          tour_type?: string | null
          travel_policy?: Json | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          actual_revenue?: number | null
          agency_id?: string | null
          booking_contact_email?: string | null
          booking_contact_phone?: string | null
          budget?: number | null
          cancellation_policy?: string | null
          contract_template_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          emergency_contact?: Json | null
          end_date?: string | null
          estimated_revenue?: number | null
          gross_sales?: number | null
          id?: string
          insurance_info?: Json | null
          is_public?: boolean | null
          marketing_budget?: number | null
          marketing_materials?: Json | null
          name?: string
          promotional_code?: string | null
          revenue_sharing?: Json | null
          social_hashtag?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["tour_status"] | null
          tickets_sold?: number | null
          total_capacity?: number | null
          tour_manager_id?: string
          tour_requirements?: Json | null
          tour_type?: string | null
          travel_policy?: Json | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tours_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_column_preferences: {
        Row: {
          active_template_id: string | null
          column_configs: Json
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_template_id?: string | null
          column_configs?: Json
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_template_id?: string | null
          column_configs?: Json
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_custom_fields: {
        Row: {
          created_at: string | null
          display_name: string
          field_key: string
          field_type: string | null
          id: string
          is_visible: boolean | null
          sort_order: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_name: string
          field_key: string
          field_type?: string | null
          id?: string
          is_visible?: boolean | null
          sort_order?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string
          field_key?: string
          field_type?: string | null
          id?: string
          is_visible?: boolean | null
          sort_order?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_favourites: {
        Row: {
          comedian_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comedian_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comedian_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favourites_comedian_id_fkey"
            columns: ["comedian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favourites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_hidden_comedians: {
        Row: {
          comedian_id: string
          created_at: string
          event_id: string | null
          id: string
          scope: string
          user_id: string
        }
        Insert: {
          comedian_id: string
          created_at?: string
          event_id?: string | null
          id?: string
          scope: string
          user_id: string
        }
        Update: {
          comedian_id?: string
          created_at?: string
          event_id?: string | null
          id?: string
          scope?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_hidden_comedians_comedian_id_fkey"
            columns: ["comedian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_hidden_comedians_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "user_hidden_comedians_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_hidden_comedians_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_hidden_comedians_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_hidden_comedians_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "user_hidden_comedians_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "user_hidden_comedians_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "user_hidden_comedians_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interests: {
        Row: {
          created_at: string
          event_date: string | null
          event_id: string
          event_time: string | null
          event_title: string
          id: string
          user_id: string
          venue: string | null
        }
        Insert: {
          created_at?: string
          event_date?: string | null
          event_id: string
          event_time?: string | null
          event_title: string
          id?: string
          user_id: string
          venue?: string | null
        }
        Update: {
          created_at?: string
          event_date?: string | null
          event_id?: string
          event_time?: string | null
          event_title?: string
          id?: string
          user_id?: string
          venue?: string | null
        }
        Relationships: []
      }
      user_media_tags: {
        Row: {
          created_at: string | null
          id: string
          last_used_at: string | null
          tag: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          tag: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          tag?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_roles_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_claims: {
        Row: {
          claimed_at: string | null
          claimed_by: string
          contact_email: string | null
          contact_phone: string | null
          id: string
          status: string | null
          venue_id: string
          verification_method: string | null
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          claimed_at?: string | null
          claimed_by: string
          contact_email?: string | null
          contact_phone?: string | null
          id?: string
          status?: string | null
          venue_id: string
          verification_method?: string | null
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string
          contact_email?: string | null
          contact_phone?: string | null
          id?: string
          status?: string | null
          venue_id?: string
          verification_method?: string | null
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_claims_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: true
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_claims_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: true
            referencedRelation: "venues_flat_v"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_contacts: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_primary: boolean | null
          phone: string | null
          role: string | null
          venue_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_primary?: boolean | null
          phone?: string | null
          role?: string | null
          venue_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_primary?: boolean | null
          phone?: string | null
          role?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_contacts_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_contacts_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_flat_v"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_costs: {
        Row: {
          amount: number
          cost_date: string | null
          cost_type: string
          created_at: string | null
          currency: string | null
          description: string | null
          event_id: string
          id: string
          is_recurring: boolean | null
          payment_status: string | null
          updated_at: string | null
          xero_bill_id: string | null
        }
        Insert: {
          amount?: number
          cost_date?: string | null
          cost_type?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          event_id: string
          id?: string
          is_recurring?: boolean | null
          payment_status?: string | null
          updated_at?: string | null
          xero_bill_id?: string | null
        }
        Update: {
          amount?: number
          cost_date?: string | null
          cost_type?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          event_id?: string
          id?: string
          is_recurring?: boolean | null
          payment_status?: string | null
          updated_at?: string | null
          xero_bill_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_costs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "venue_costs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_costs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_costs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_costs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "venue_costs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "venue_costs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
        ]
      }
      venue_media: {
        Row: {
          captured_at: string | null
          created_at: string
          description: string | null
          id: string
          media_type: string
          metadata: Json
          thumbnail_url: string | null
          title: string | null
          url: string
          venue_id: string
        }
        Insert: {
          captured_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          media_type: string
          metadata?: Json
          thumbnail_url?: string | null
          title?: string | null
          url: string
          venue_id: string
        }
        Update: {
          captured_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          media_type?: string
          metadata?: Json
          thumbnail_url?: string | null
          title?: string | null
          url?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_media_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_media_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_flat_v"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_media_access: {
        Row: {
          access_type: string | null
          can_download: boolean | null
          can_use_commercially: boolean | null
          created_at: string | null
          date_from: string | null
          date_to: string | null
          id: string
          promoter_id: string | null
          requires_attribution: boolean | null
          restricted_by: string | null
          updated_at: string | null
          venue_id: string
        }
        Insert: {
          access_type?: string | null
          can_download?: boolean | null
          can_use_commercially?: boolean | null
          created_at?: string | null
          date_from?: string | null
          date_to?: string | null
          id?: string
          promoter_id?: string | null
          requires_attribution?: boolean | null
          restricted_by?: string | null
          updated_at?: string | null
          venue_id: string
        }
        Update: {
          access_type?: string | null
          can_download?: boolean | null
          can_use_commercially?: boolean | null
          created_at?: string | null
          date_from?: string | null
          date_to?: string | null
          id?: string
          promoter_id?: string | null
          requires_attribution?: boolean | null
          restricted_by?: string | null
          updated_at?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_media_access_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_media_access_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_flat_v"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_social_links: {
        Row: {
          created_at: string
          handle: string | null
          id: string
          is_primary: boolean | null
          platform: string
          url: string | null
          venue_id: string
        }
        Insert: {
          created_at?: string
          handle?: string | null
          id?: string
          is_primary?: boolean | null
          platform: string
          url?: string | null
          venue_id: string
        }
        Update: {
          created_at?: string
          handle?: string | null
          id?: string
          is_primary?: boolean | null
          platform?: string
          url?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_social_links_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_social_links_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_flat_v"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_tag_assignments: {
        Row: {
          created_at: string
          tag_id: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          tag_id: string
          venue_id: string
        }
        Update: {
          created_at?: string
          tag_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "venue_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_tag_assignments_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_tag_assignments_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues_flat_v"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_tags: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          capacity: number | null
          city: string | null
          claimed_at: string | null
          claimed_by: string | null
          country: string | null
          created_at: string
          description: string | null
          google_maps_url: string | null
          id: string
          latitude: number | null
          longitude: number | null
          metadata: Json
          name: string
          notes: string | null
          postcode: string | null
          slug: string | null
          state: string | null
          timezone: string | null
          updated_at: string
          url_slug: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          capacity?: number | null
          city?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          google_maps_url?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json
          name: string
          notes?: string | null
          postcode?: string | null
          slug?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string
          url_slug?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          capacity?: number | null
          city?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          google_maps_url?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json
          name?: string
          notes?: string | null
          postcode?: string | null
          slug?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string
          url_slug?: string | null
        }
        Relationships: []
      }
      videographer_accomplishments: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
          year: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          title: string
          updated_at?: string | null
          user_id: string
          year?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "videographer_accomplishments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      videographer_custom_links: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_visible: boolean | null
          section: string | null
          title: string
          updated_at: string | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          section?: string | null
          title: string
          updated_at?: string | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          section?: string | null
          title?: string
          updated_at?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "videographer_custom_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      videographer_press_reviews: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_featured: boolean | null
          publication: string
          rating: number | null
          review_date: string | null
          review_text: string
          review_url: string | null
          reviewer_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          publication: string
          rating?: number | null
          review_date?: string | null
          review_text: string
          review_url?: string | null
          reviewer_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          publication?: string
          rating?: number | null
          review_date?: string | null
          review_text?: string
          review_url?: string | null
          reviewer_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "videographer_press_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      videographer_section_order: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          section_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          id?: string
          section_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          section_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "videographer_section_order_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visual_artist_portfolio: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          event_type: string | null
          id: string
          is_featured: boolean | null
          media_type: string | null
          media_url: string
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          visual_artist_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          event_type?: string | null
          id?: string
          is_featured?: boolean | null
          media_type?: string | null
          media_url: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          visual_artist_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          event_type?: string | null
          id?: string
          is_featured?: boolean | null
          media_type?: string | null
          media_url?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          visual_artist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visual_artist_portfolio_visual_artist_id_fkey"
            columns: ["visual_artist_id"]
            isOneToOne: false
            referencedRelation: "visual_artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visual_artist_profiles: {
        Row: {
          available_for_events: boolean | null
          created_at: string | null
          experience_years: number | null
          id: string
          instagram_portfolio: string | null
          is_videographer: boolean | null
          portfolio_url: string | null
          rate_per_event: number | null
          rate_per_hour: number | null
          services_offered: string[] | null
          specialties: string[] | null
          travel_radius_km: number | null
          turnaround_time_days: number | null
          updated_at: string | null
          video_reel_url: string | null
          youtube_channel: string | null
        }
        Insert: {
          available_for_events?: boolean | null
          created_at?: string | null
          experience_years?: number | null
          id: string
          instagram_portfolio?: string | null
          is_videographer?: boolean | null
          portfolio_url?: string | null
          rate_per_event?: number | null
          rate_per_hour?: number | null
          services_offered?: string[] | null
          specialties?: string[] | null
          travel_radius_km?: number | null
          turnaround_time_days?: number | null
          updated_at?: string | null
          video_reel_url?: string | null
          youtube_channel?: string | null
        }
        Update: {
          available_for_events?: boolean | null
          created_at?: string | null
          experience_years?: number | null
          id?: string
          instagram_portfolio?: string | null
          is_videographer?: boolean | null
          portfolio_url?: string | null
          rate_per_event?: number | null
          rate_per_hour?: number | null
          services_offered?: string[] | null
          specialties?: string[] | null
          travel_radius_km?: number | null
          turnaround_time_days?: number | null
          updated_at?: string | null
          video_reel_url?: string | null
          youtube_channel?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visual_artist_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visual_artist_reviews: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          rating: number
          review_text: string | null
          reviewer_id: string
          updated_at: string | null
          visual_artist_id: string
          would_recommend: boolean | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          rating: number
          review_text?: string | null
          reviewer_id: string
          updated_at?: string | null
          visual_artist_id: string
          would_recommend?: boolean | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          rating?: number
          review_text?: string | null
          reviewer_id?: string
          updated_at?: string | null
          visual_artist_id?: string
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "visual_artist_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "visual_artist_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visual_artist_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visual_artist_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visual_artist_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "visual_artist_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "visual_artist_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "visual_artist_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visual_artist_reviews_visual_artist_id_fkey"
            columns: ["visual_artist_id"]
            isOneToOne: false
            referencedRelation: "visual_artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vouches: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          organization_id: string | null
          rating: number | null
          updated_at: string | null
          vouchee_id: string
          voucher_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          organization_id?: string | null
          rating?: number | null
          updated_at?: string | null
          vouchee_id: string
          voucher_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          organization_id?: string | null
          rating?: number | null
          updated_at?: string | null
          vouchee_id?: string
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vouches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_config: {
        Row: {
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          event_type: string
          id: number
          response_status: number | null
          user_id: string | null
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: number
          response_status?: number | null
          user_id?: string | null
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: number
          response_status?: number | null
          user_id?: string | null
          webhook_url?: string
        }
        Relationships: []
      }
      xero_bills: {
        Row: {
          bill_status: string | null
          comedian_booking_id: string | null
          created_at: string | null
          created_in_xero_at: string | null
          currency: string | null
          due_date: string | null
          id: string
          last_synced_at: string | null
          sync_status: string | null
          total_amount: number
          xero_bill_id: string
          xero_bill_number: string | null
        }
        Insert: {
          bill_status?: string | null
          comedian_booking_id?: string | null
          created_at?: string | null
          created_in_xero_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          last_synced_at?: string | null
          sync_status?: string | null
          total_amount: number
          xero_bill_id: string
          xero_bill_number?: string | null
        }
        Update: {
          bill_status?: string | null
          comedian_booking_id?: string | null
          created_at?: string | null
          created_in_xero_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          last_synced_at?: string | null
          sync_status?: string | null
          total_amount?: number
          xero_bill_id?: string
          xero_bill_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "xero_bills_comedian_booking_id_fkey"
            columns: ["comedian_booking_id"]
            isOneToOne: false
            referencedRelation: "comedian_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      xero_contacts: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string | null
          synced_at: string | null
          xero_contact_email: string | null
          xero_contact_id: string
          xero_contact_name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id?: string | null
          synced_at?: string | null
          xero_contact_email?: string | null
          xero_contact_id: string
          xero_contact_name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string | null
          synced_at?: string | null
          xero_contact_email?: string | null
          xero_contact_id?: string
          xero_contact_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "xero_contacts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      xero_integrations: {
        Row: {
          access_token: string | null
          connection_status: string | null
          created_at: string | null
          id: string
          last_sync_at: string | null
          organization_id: string | null
          refresh_token: string | null
          settings: Json | null
          tenant_id: string
          tenant_name: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_token?: string | null
          connection_status?: string | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          organization_id?: string | null
          refresh_token?: string | null
          settings?: Json | null
          tenant_id: string
          tenant_name?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string | null
          connection_status?: string | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          organization_id?: string | null
          refresh_token?: string | null
          settings?: Json | null
          tenant_id?: string
          tenant_name?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "xero_integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      xero_invoices: {
        Row: {
          amount_due: number | null
          amount_paid: number | null
          created_at: string | null
          created_in_xero_at: string | null
          currency: string | null
          event_id: string | null
          id: string
          invoice_id: string | null
          invoice_status: string | null
          last_synced_at: string | null
          sync_direction: string | null
          sync_status: string | null
          ticket_sale_id: string | null
          total_amount: number
          xero_invoice_id: string
          xero_invoice_number: string | null
        }
        Insert: {
          amount_due?: number | null
          amount_paid?: number | null
          created_at?: string | null
          created_in_xero_at?: string | null
          currency?: string | null
          event_id?: string | null
          id?: string
          invoice_id?: string | null
          invoice_status?: string | null
          last_synced_at?: string | null
          sync_direction?: string | null
          sync_status?: string | null
          ticket_sale_id?: string | null
          total_amount: number
          xero_invoice_id: string
          xero_invoice_number?: string | null
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number | null
          created_at?: string | null
          created_in_xero_at?: string | null
          currency?: string | null
          event_id?: string | null
          id?: string
          invoice_id?: string | null
          invoice_status?: string | null
          last_synced_at?: string | null
          sync_direction?: string | null
          sync_status?: string | null
          ticket_sale_id?: string | null
          total_amount?: number
          xero_invoice_id?: string
          xero_invoice_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "xero_invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "xero_invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xero_invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xero_invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xero_invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "xero_invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "xero_invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "xero_invoices_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xero_invoices_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xero_invoices_ticket_sale_id_fkey"
            columns: ["ticket_sale_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      xero_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string
          id: string
          refresh_token: string
          scopes: string[] | null
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at: string
          id?: string
          refresh_token: string
          scopes?: string[] | null
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          refresh_token?: string
          scopes?: string[] | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      xero_webhook_events: {
        Row: {
          created_at: string | null
          error: string | null
          event_date: string
          event_id: string
          event_type: string
          id: string
          processed: boolean | null
          processed_at: string | null
          resource_id: string
          resource_type: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          event_date: string
          event_id: string
          event_type: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          resource_id: string
          resource_type: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          error?: string | null
          event_date?: string
          event_id?: string
          event_type?: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          resource_id?: string
          resource_type?: string
          tenant_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      attendee_checkin_status: {
        Row: {
          cancelled: number | null
          checked_in: number | null
          checkin_percentage: number | null
          event_date: string | null
          event_id: string | null
          event_title: string | null
          eventbrite_attendees: number | null
          humanitix_attendees: number | null
          manual_attendees: number | null
          no_shows: number | null
          not_checked_in: number | null
          total_attendees: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
        ]
      }
      av_professionals_flat_v: {
        Row: {
          bio: string | null
          business_name: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          location: string | null
          metadata: Json | null
          phone: string | null
          primary_role: string | null
          skills: string[] | null
          slug: string | null
          social_links: Json | null
          updated_at: string | null
          website: string | null
        }
        Relationships: []
      }
      bulk_update_monitor: {
        Row: {
          affected_rows: number | null
          changed_by_type: string | null
          first_change: string | null
          last_change: string | null
          minute: string | null
          operation: string | null
          table_name: string | null
          unique_records: number | null
        }
        Relationships: []
      }
      comedian_event_availability_v: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_applications_comedian"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comedians_flat_v: {
        Row: {
          active: boolean | null
          aliases: string[] | null
          booking_email: string | null
          created_at: string | null
          headshot_url: string | null
          hero_image_url: string | null
          id: string | null
          legal_name: string | null
          long_bio: string | null
          management_company: string | null
          metadata: Json | null
          origin_city: string | null
          origin_country: string | null
          pronouns: string | null
          short_bio: string | null
          slug: string | null
          social_links: Json | null
          stage_name: string | null
          tags: string[] | null
          updated_at: string | null
          website: string | null
        }
        Relationships: []
      }
      cron_job_impact: {
        Row: {
          changes: number | null
          hour: string | null
          table_name: string | null
          unique_records: number | null
        }
        Relationships: []
      }
      customer_activity_timeline: {
        Row: {
          activity_id: string | null
          activity_type: string | null
          created_at: string | null
          customer_id: string | null
          metadata: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_emails_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_marketing_export"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_emails_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_emails_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_crm_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_emails_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_flat_v"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customer_analytics: {
        Row: {
          address: string | null
          brevo_sync_status: string | null
          company: string | null
          customer_segment: string | null
          customer_since: string | null
          date_of_birth: string | null
          days_since_last_order: number | null
          email: string | null
          full_name: string | null
          id: string | null
          last_event_name: string | null
          last_order_date: string | null
          loyalty_status: string | null
          marketing_opt_in: boolean | null
          mobile: string | null
          total_orders: number | null
          total_spent: number | null
        }
        Insert: {
          address?: string | null
          brevo_sync_status?: string | null
          company?: string | null
          customer_segment?: string | null
          customer_since?: string | null
          date_of_birth?: string | null
          days_since_last_order?: never
          email?: string | null
          full_name?: never
          id?: string | null
          last_event_name?: string | null
          last_order_date?: string | null
          loyalty_status?: never
          marketing_opt_in?: boolean | null
          mobile?: string | null
          total_orders?: number | null
          total_spent?: number | null
        }
        Update: {
          address?: string | null
          brevo_sync_status?: string | null
          company?: string | null
          customer_segment?: string | null
          customer_since?: string | null
          date_of_birth?: string | null
          days_since_last_order?: never
          email?: string | null
          full_name?: never
          id?: string | null
          last_event_name?: string | null
          last_order_date?: string | null
          loyalty_status?: never
          marketing_opt_in?: boolean | null
          mobile?: string | null
          total_orders?: number | null
          total_spent?: number | null
        }
        Relationships: []
      }
      customer_marketing_export: {
        Row: {
          canonical_full_name: string | null
          customer_id: string | null
          do_not_contact: boolean | null
          first_name: string | null
          first_seen_at: string | null
          last_name: string | null
          last_order_at: string | null
          last_seen_at: string | null
          lifetime_gross: number | null
          lifetime_net: number | null
          lifetime_orders: number | null
          lifetime_tickets: number | null
          marketing_opt_in: boolean | null
          most_recent_event_name: string | null
          primary_email: string | null
          regions: string | null
          segments: string[] | null
          vip: boolean | null
        }
        Relationships: []
      }
      customer_orders_v: {
        Row: {
          currency: string | null
          discount_amount: number | null
          discount_code_used: string | null
          email: string | null
          event_name: string | null
          gross_amount: number | null
          net_amount: number | null
          order_name: string | null
          order_source_id: string | null
          ordered_at: string | null
          original_source: string | null
          purchaser_name: string | null
          raw_event_id: string | null
          raw_session_id: string | null
          session_name: string | null
          session_start_date: string | null
          source: string | null
          status: string | null
          tax_amount: number | null
          ticket_count: number | null
          venue_name: string | null
        }
        Relationships: []
      }
      customer_profile_changes: {
        Row: {
          canonical_full_name: string | null
          changed_by_email: string | null
          changed_by_type: string | null
          changed_fields: string[] | null
          created_at: string | null
          email: string | null
          new_values: Json | null
          old_values: Json | null
          operation: string | null
        }
        Relationships: []
      }
      customer_segment_counts_v: {
        Row: {
          color: string | null
          count: number | null
          description: string | null
          is_system: boolean | null
          name: string | null
          segment_type: Database["public"]["Enums"]["segment_type"] | null
          slug: string | null
        }
        Relationships: []
      }
      customers_crm_v: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string | null
          customer_segment: string | null
          customer_segments: string[] | null
          customer_since: string | null
          date_of_birth: string | null
          do_not_contact: boolean | null
          email: string | null
          first_name: string | null
          first_seen_at: string | null
          id: string | null
          last_event_id: string | null
          last_event_name: string | null
          last_name: string | null
          last_order_date: string | null
          last_scored_at: string | null
          lead_score: number | null
          location: string | null
          marketing_opt_in: boolean | null
          mobile: string | null
          name: string | null
          notes: string | null
          postcode: string | null
          preferred_venue_id: string | null
          rfm_frequency: number | null
          rfm_monetary: number | null
          rfm_recency: number | null
          source: string | null
          state: string | null
          suburb: string | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
          vip: boolean | null
        }
        Relationships: []
      }
      customers_flat_v: {
        Row: {
          canonical_full_name: string | null
          created_at: string | null
          customer_id: string | null
          date_of_birth: string | null
          do_not_contact: boolean | null
          first_name: string | null
          first_seen_at: string | null
          last_name: string | null
          last_order_at: string | null
          last_seen_at: string | null
          lifetime_gross: number | null
          lifetime_net: number | null
          lifetime_orders: number | null
          lifetime_tickets: number | null
          marketing_opt_in: boolean | null
          most_recent_event_id: string | null
          most_recent_event_name: string | null
          preferred_venue: string | null
          primary_email: string | null
          updated_at: string | null
          vip: boolean | null
        }
        Relationships: []
      }
      event_performance_metrics: {
        Row: {
          attendance_percentage: number | null
          avg_performer_fee: number | null
          capacity: number | null
          comedian_count: number | null
          event_date: string | null
          event_id: string | null
          event_title: string | null
          profit_margin: number | null
          ticket_sales_count: number | null
          tickets_sold: number | null
          total_costs: number | null
          total_revenue: number | null
          venue: string | null
        }
        Relationships: []
      }
      event_platform_summary: {
        Row: {
          commission_rate: string | null
          data_sources: string | null
          event_id: string | null
          last_updated: string | null
          platform_name: string | null
          tickets_sold: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      event_ticket_summary: {
        Row: {
          capacity: number | null
          capacity_utilization_percent: number | null
          event_date: string | null
          id: string | null
          platform_breakdown: Json | null
          platforms_count: number | null
          tickets_sold_last_hour: number | null
          title: string | null
          total_gross_sales: number | null
          total_tickets_available: number | null
          total_tickets_sold: number | null
          venue: string | null
        }
        Relationships: []
      }
      events_htx_view: {
        Row: {
          description: string | null
          raw: Json | null
          source: string | null
          source_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          description?: string | null
          raw?: Json | null
          source?: string | null
          source_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          description?: string | null
          raw?: Json | null
          source?: string | null
          source_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      invoices_normalized: {
        Row: {
          client_address: string | null
          client_mobile: string | null
          comedian_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          deposit_amount: number | null
          deposit_due_date: string | null
          deposit_due_days_before_event: number | null
          deposit_paid_amount: number | null
          deposit_paid_date: string | null
          deposit_percentage: number | null
          deposit_status: string | null
          due_date: string | null
          event_date: string | null
          event_id: string | null
          id: string | null
          invoice_number: string | null
          invoice_type: string | null
          issue_date: string | null
          last_synced_at: string | null
          notes: string | null
          paid_at: string | null
          payment_terms: string | null
          promoter_id: string | null
          sender_abn: string | null
          sender_address: string | null
          sender_email: string | null
          sender_name: string | null
          sender_phone: string | null
          sent_at: string | null
          status: string | null
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          tax_treatment: string | null
          terms: string | null
          total_amount: number | null
          updated_at: string | null
          xero_invoice_id: string | null
        }
        Insert: {
          client_address?: string | null
          client_mobile?: string | null
          comedian_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          deposit_amount?: number | null
          deposit_due_date?: string | null
          deposit_due_days_before_event?: number | null
          deposit_paid_amount?: number | null
          deposit_paid_date?: string | null
          deposit_percentage?: number | null
          deposit_status?: string | null
          due_date?: string | null
          event_date?: string | null
          event_id?: string | null
          id?: string | null
          invoice_number?: string | null
          invoice_type?: string | null
          issue_date?: string | null
          last_synced_at?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_terms?: string | null
          promoter_id?: string | null
          sender_abn?: string | null
          sender_address?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          sent_at?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          tax_treatment?: never
          terms?: string | null
          total_amount?: number | null
          updated_at?: string | null
          xero_invoice_id?: string | null
        }
        Update: {
          client_address?: string | null
          client_mobile?: string | null
          comedian_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          deposit_amount?: number | null
          deposit_due_date?: string | null
          deposit_due_days_before_event?: number | null
          deposit_paid_amount?: number | null
          deposit_paid_date?: string | null
          deposit_percentage?: number | null
          deposit_status?: string | null
          due_date?: string | null
          event_date?: string | null
          event_id?: string | null
          id?: string | null
          invoice_number?: string | null
          invoice_type?: string | null
          issue_date?: string | null
          last_synced_at?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_terms?: string | null
          promoter_id?: string | null
          sender_abn?: string | null
          sender_address?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          sent_at?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          tax_treatment?: never
          terms?: string | null
          total_amount?: number | null
          updated_at?: string | null
          xero_invoice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
        ]
      }
      meta_audience_stats: {
        Row: {
          avg_match_keys: number | null
          failed: number | null
          last_sync: string | null
          last_updated: string | null
          pending_sync: number | null
          synced: number | null
          total_customer_value: number | null
          total_customers: number | null
          with_address: number | null
          with_dob: number | null
          with_email: number | null
          with_phone: number | null
        }
        Relationships: []
      }
      meta_sync_stats: {
        Row: {
          count: number | null
          last_24h: number | null
          last_7d: number | null
          last_sync: string | null
          status: string | null
          sync_type: string | null
        }
        Relationships: []
      }
      orders_htx_view: {
        Row: {
          additional_fields: Json | null
          event_source_id: string | null
          net_sales_cents: number | null
          order_reference: string | null
          ordered_at: string | null
          purchaser_email: string | null
          purchaser_name: string | null
          raw: Json | null
          session_source_id: string | null
          source: string | null
          source_id: string | null
          status: string | null
          total_cents: number | null
          updated_at: string | null
        }
        Insert: {
          additional_fields?: Json | null
          event_source_id?: string | null
          net_sales_cents?: number | null
          order_reference?: string | null
          ordered_at?: string | null
          purchaser_email?: string | null
          purchaser_name?: string | null
          raw?: Json | null
          session_source_id?: string | null
          source?: string | null
          source_id?: string | null
          status?: string | null
          total_cents?: number | null
          updated_at?: string | null
        }
        Update: {
          additional_fields?: Json | null
          event_source_id?: string | null
          net_sales_cents?: number | null
          order_reference?: string | null
          ordered_at?: string | null
          purchaser_email?: string | null
          purchaser_name?: string | null
          raw?: Json | null
          session_source_id?: string | null
          source?: string | null
          source_id?: string | null
          status?: string | null
          total_cents?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      organization_events_view: {
        Row: {
          address: string | null
          age_restriction: string | null
          allow_recording: boolean | null
          applied_spots: number | null
          banner_url: string | null
          capacity: number | null
          city: string | null
          co_promoter_ids: string[] | null
          comedian_slots: number | null
          country: string | null
          created_at: string | null
          created_by_organization_id: string | null
          currency: string | null
          description: string | null
          details: string | null
          dress_code: string | null
          duration: string | null
          duration_minutes: number | null
          end_time: string | null
          event_date: string | null
          eventbrite_event_id: string | null
          featured: boolean | null
          filled_slots: number | null
          hero_image_url: string | null
          humanitix_event_id: string | null
          id: string | null
          is_paid: boolean | null
          is_recurring: boolean | null
          is_verified_only: boolean | null
          name: string | null
          organization_id: string | null
          organization_logo: string | null
          organization_name: string | null
          organization_type: string[] | null
          parent_event_id: string | null
          pay: string | null
          pay_per_comedian: number | null
          platforms_count: number | null
          profit_margin: number | null
          promoter_id: string | null
          published_at: string | null
          raw: Json | null
          recurrence_end_date: string | null
          recurrence_pattern: string | null
          requirements: string | null
          series_id: string | null
          settlement_status: string | null
          source: string | null
          source_id: string | null
          spots: number | null
          start_time: string | null
          state: string | null
          status: string | null
          ticket_price: number | null
          tickets_sold: number | null
          title: string | null
          total_costs: number | null
          total_gross_sales: number | null
          total_revenue: number | null
          total_tickets_sold: number | null
          type: string | null
          updated_at: string | null
          venue: string | null
          xero_invoice_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_organization_id_fkey"
            columns: ["created_by_organization_id"]
            isOneToOne: false
            referencedRelation: "organization_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_events_parent"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "event_performance_metrics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_events_parent"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_events_parent"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_events_parent"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "organization_events_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_events_parent"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "session_lineups_v"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_events_parent"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "ticket_sales_analytics"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "fk_events_parent"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["event_id"]
          },
        ]
      }
      organizers_flat_v: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          contacts: Json | null
          created_at: string | null
          description: string | null
          headquarters_city: string | null
          headquarters_country: string | null
          hero_image_url: string | null
          id: string | null
          logo_url: string | null
          metadata: Json | null
          name: string | null
          slug: string | null
          social_links: Json | null
          tagline: string | null
          updated_at: string | null
          venues: string[] | null
          website: string | null
        }
        Relationships: []
      }
      relevant_memories: {
        Row: {
          access_count: number | null
          accessed_at: string | null
          agent_id: string | null
          content: string | null
          created_at: string | null
          embedding: string | null
          id: string | null
          importance: number | null
          memory_type: string | null
          metadata: Json | null
          relevance_score: number | null
        }
        Insert: {
          access_count?: number | null
          accessed_at?: string | null
          agent_id?: string | null
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string | null
          importance?: number | null
          memory_type?: string | null
          metadata?: Json | null
          relevance_score?: never
        }
        Update: {
          access_count?: number | null
          accessed_at?: string | null
          agent_id?: string | null
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string | null
          importance?: number | null
          memory_type?: string | null
          metadata?: Json | null
          relevance_score?: never
        }
        Relationships: []
      }
      session_complete: {
        Row: {
          banner_image_url: string | null
          calendar_group: string | null
          canonical_session_source_id: string | null
          canonical_source: string | null
          capacity: number | null
          created_at: string | null
          days_until: number | null
          description: string | null
          display_mode: string | null
          event_name: string | null
          event_source_id: string | null
          eventbrite_fees_dollars: number | null
          eventbrite_gross_dollars: number | null
          eventbrite_last_order_at: string | null
          eventbrite_net_dollars: number | null
          eventbrite_order_count: number | null
          eventbrite_tax_dollars: number | null
          eventbrite_ticket_count: number | null
          festival_end: string | null
          festival_name: string | null
          festival_start: string | null
          fever_ticket_count: number | null
          humanitix_fees_complete_dollars: number | null
          humanitix_fees_dollars: number | null
          humanitix_gross_dollars: number | null
          humanitix_last_order_at: string | null
          humanitix_net_dollars: number | null
          humanitix_order_count: number | null
          humanitix_payout_dollars: number | null
          humanitix_rebate_dollars: number | null
          humanitix_tax_dollars: number | null
          humanitix_ticket_count: number | null
          ingested_at: string | null
          is_past: boolean | null
          last_order_at: string | null
          latitude: string | null
          longitude: string | null
          merged_sources: string[] | null
          promotix_ticket_count: number | null
          public: boolean | null
          published: boolean | null
          session_name: string | null
          session_start: string | null
          session_start_local: string | null
          show_type: string | null
          slug: string | null
          status: string | null
          tags: string[] | null
          timezone: string | null
          total_fees_complete_dollars: number | null
          total_fees_dollars: number | null
          total_gross_dollars: number | null
          total_net_dollars: number | null
          total_order_count: number | null
          total_payout_dollars: number | null
          total_rebate_dollars: number | null
          total_tax_dollars: number | null
          total_ticket_count: number | null
          updated_at: string | null
          url: string | null
          url_tickets_popup: string | null
          venue_address: string | null
          venue_city: string | null
          venue_country: string | null
          venue_lat_lng: Json | null
          venue_name: string | null
        }
        Relationships: []
      }
      session_financials: {
        Row: {
          canonical_session_source_id: string | null
          canonical_source: string | null
          event_name: string | null
          event_source_id: string | null
          eventbrite_fees_dollars: number | null
          eventbrite_gross_dollars: number | null
          eventbrite_last_order_at: string | null
          eventbrite_net_dollars: number | null
          eventbrite_order_count: number | null
          eventbrite_tax_dollars: number | null
          eventbrite_ticket_count: number | null
          fever_ticket_count: number | null
          humanitix_fees_complete_dollars: number | null
          humanitix_fees_dollars: number | null
          humanitix_gross_dollars: number | null
          humanitix_last_order_at: string | null
          humanitix_net_dollars: number | null
          humanitix_order_count: number | null
          humanitix_payout_dollars: number | null
          humanitix_rebate_dollars: number | null
          humanitix_tax_dollars: number | null
          humanitix_ticket_count: number | null
          last_order_at: string | null
          merged_sources: string[] | null
          promotix_ticket_count: number | null
          session_name: string | null
          session_start: string | null
          session_start_local: string | null
          tags: string[] | null
          timezone: string | null
          total_fees_complete_dollars: number | null
          total_fees_dollars: number | null
          total_gross_dollars: number | null
          total_net_dollars: number | null
          total_order_count: number | null
          total_payout_dollars: number | null
          total_rebate_dollars: number | null
          total_tax_dollars: number | null
          total_ticket_count: number | null
        }
        Relationships: []
      }
      session_financials_mat: {
        Row: {
          canonical_session_source_id: string | null
          canonical_source: string | null
          event_name: string | null
          event_source_id: string | null
          eventbrite_fees_dollars: number | null
          eventbrite_gross_dollars: number | null
          eventbrite_last_order_at: string | null
          eventbrite_net_dollars: number | null
          eventbrite_order_count: number | null
          eventbrite_tax_dollars: number | null
          eventbrite_ticket_count: number | null
          fever_ticket_count: number | null
          humanitix_fees_complete_dollars: number | null
          humanitix_fees_dollars: number | null
          humanitix_gross_dollars: number | null
          humanitix_last_order_at: string | null
          humanitix_net_dollars: number | null
          humanitix_order_count: number | null
          humanitix_payout_dollars: number | null
          humanitix_rebate_dollars: number | null
          humanitix_tax_dollars: number | null
          humanitix_ticket_count: number | null
          last_order_at: string | null
          merged_sources: string[] | null
          promotix_ticket_count: number | null
          session_name: string | null
          session_start: string | null
          session_start_local: string | null
          tags: string[] | null
          timezone: string | null
          total_fees_complete_dollars: number | null
          total_fees_dollars: number | null
          total_gross_dollars: number | null
          total_net_dollars: number | null
          total_order_count: number | null
          total_payout_dollars: number | null
          total_rebate_dollars: number | null
          total_tax_dollars: number | null
          total_ticket_count: number | null
        }
        Relationships: []
      }
      session_lineups_v: {
        Row: {
          billing_order: number | null
          capacity: number | null
          comedian_id: string | null
          comedian_slug: string | null
          comedian_stage_name: string | null
          created_at: string | null
          event_id: string | null
          event_name: string | null
          event_source: string | null
          event_source_id: string | null
          id: string | null
          notes: string | null
          role: string | null
          session_event_source_id: string | null
          session_id: string | null
          session_source: string | null
          session_source_id: string | null
          session_status: string | null
          source: string | null
          source_event_id: string | null
          source_session_id: string | null
          starts_at: string | null
          ticket_url: string | null
          updated_at: string | null
          venue_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_performers_comedian_id_fkey"
            columns: ["comedian_id"]
            isOneToOne: false
            referencedRelation: "comedians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_performers_comedian_id_fkey"
            columns: ["comedian_id"]
            isOneToOne: false
            referencedRelation: "comedians_flat_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_performers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_performers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "vw_upcoming_sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      sponsors_flat_v: {
        Row: {
          agreements: Json | null
          company_name: string | null
          contact_email: string | null
          contact_phone: string | null
          contacts: Json | null
          created_at: string | null
          description: string | null
          id: string | null
          industry: string | null
          logo_url: string | null
          metadata: Json | null
          slug: string | null
          updated_at: string | null
          website: string | null
        }
        Relationships: []
      }
      ticket_sales_analytics: {
        Row: {
          average_order_value: number | null
          capacity: number | null
          capacity_utilization_percent: number | null
          event_date: string | null
          event_id: string | null
          event_title: string | null
          eventbrite_orders: number | null
          first_sale_date: string | null
          gross_revenue: number | null
          humanitix_orders: number | null
          last_sale_date: string | null
          manual_orders: number | null
          refunded_orders: number | null
          sales_last_7_days: number | null
          total_orders: number | null
          total_refunds: number | null
          total_tickets_sold: number | null
          venue: string | null
        }
        Relationships: []
      }
      tickets_htx_view: {
        Row: {
          checked_in: boolean | null
          order_source_id: string | null
          price_cents: number | null
          raw: Json | null
          session_source_id: string | null
          source: string | null
          source_id: string | null
          status: string | null
          ticket_type_name: string | null
          updated_at: string | null
        }
        Insert: {
          checked_in?: boolean | null
          order_source_id?: string | null
          price_cents?: number | null
          raw?: Json | null
          session_source_id?: string | null
          source?: string | null
          source_id?: string | null
          status?: string | null
          ticket_type_name?: string | null
          updated_at?: string | null
        }
        Update: {
          checked_in?: boolean | null
          order_source_id?: string | null
          price_cents?: number | null
          raw?: Json | null
          session_source_id?: string | null
          source?: string | null
          source_id?: string | null
          status?: string | null
          ticket_type_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      venues_flat_v: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          capacity: number | null
          city: string | null
          contacts: Json | null
          country: string | null
          created_at: string | null
          description: string | null
          id: string | null
          latitude: number | null
          longitude: number | null
          metadata: Json | null
          name: string | null
          notes: string | null
          postcode: string | null
          slug: string | null
          social_links: Json | null
          state: string | null
          tags: string[] | null
          timezone: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      vw_upcoming_sessions: {
        Row: {
          description: string | null
          event_id: string | null
          hero_image_url: string | null
          session_id: string | null
          starts_at: string | null
          status: string | null
          ticket_url: string | null
          title: string | null
          venue_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_external_video: {
        Args: {
          p_folder_id?: string
          p_is_featured_in_epk?: boolean
          p_is_profile_video?: boolean
          p_title: string
          p_url: string
          p_user_id: string
        }
        Returns: string
      }
      add_manual_platform_entry: {
        Args: {
          p_commission_rate?: number
          p_event_id: string
          p_notes?: string
          p_platform_name: string
          p_ticket_price: number
          p_tickets_sold: number
          p_total_revenue: number
        }
        Returns: string
      }
      add_media_tags: {
        Args: { p_file_id: string; p_tags: string[] }
        Returns: undefined
      }
      assign_spot_to_comedian: {
        Args: {
          p_comedian_id: string
          p_confirmation_deadline_hours?: number
          p_event_id: string
          p_spot_type: string
        }
        Returns: Json
      }
      batch_import_customers: { Args: { p_customers: Json }; Returns: Json }
      batch_update_availability: {
        Args: { p_to_add: string[]; p_to_remove: string[]; p_user_id: string }
        Returns: Json
      }
      bulk_add_media_tags: {
        Args: { p_file_ids: string[]; p_tags: string[] }
        Returns: undefined
      }
      bulk_update_media_tags: {
        Args: { p_file_ids: string[]; p_tags: string[] }
        Returns: undefined
      }
      calculate_comedian_payment: {
        Args: {
          booking_id: string
          door_sales?: number
          total_event_revenue?: number
        }
        Returns: number
      }
      calculate_deal_splits: {
        Args: { p_actual_revenue?: number; p_deal_id: string }
        Returns: Json
      }
      calculate_event_metrics: {
        Args: never
        Returns: Record<string, unknown>[]
      }
      calculate_event_profitability: {
        Args: { event_id_param: string }
        Returns: {
          event_id: string
          net_profit: number
          profit_margin: number
          tickets_sold: number
          total_costs: number
          total_revenue: number
        }[]
      }
      calculate_meta_match_keys: {
        Args: {
          p_city: string
          p_country: string
          p_dob: string
          p_email: string
          p_first_name: string
          p_gender: string
          p_last_name: string
          p_phone: string
          p_postcode: string
          p_state: string
        }
        Returns: number
      }
      calculate_negotiation_strategy: {
        Args: { _deal_id: string; _market_data?: Json }
        Returns: Json
      }
      calculate_user_metrics: {
        Args: never
        Returns: Record<string, unknown>[]
      }
      can_access_deal: {
        Args: { _deal_id: string; _user_id: string }
        Returns: boolean
      }
      can_act_as_organization: {
        Args: { org_id: string; user_id: string }
        Returns: boolean
      }
      can_create_organization: { Args: { user_id: string }; Returns: boolean }
      extract_contact_data_from_additional_fields: {
        Args: never
        Returns: number
      }
      format_dob_for_meta: { Args: { dob: string }; Returns: string }
      generate_invoice_number:
        | { Args: never; Returns: string }
        | { Args: { p_invoice_type: string }; Returns: string }
      generate_profile_slug: { Args: { user_name: string }; Returns: string }
      generate_slug: { Args: { name: string }; Returns: string }
      generate_unique_profile_slug: {
        Args: { base_slug: string; excluded_id?: string }
        Returns: string
      }
      get_agency_dashboard_data: {
        Args: { _agency_id: string; _manager_id?: string }
        Returns: Json
      }
      get_comedian_headshots: {
        Args: { p_user_id: string }
        Returns: {
          aspect_ratio: number
          created_at: string
          file_name: string
          file_size: number
          folder_name: string
          id: string
          image_height: number
          image_width: number
          is_primary: boolean
          public_url: string
          tags: string[]
          updated_at: string
        }[]
      }
      get_comedian_stats: {
        Args: { _comedian_id: string }
        Returns: {
          accepted_applications: number
          average_rating: number
          total_applications: number
          total_reviews: number
          total_shows: number
        }[]
      }
      get_customer_stats: {
        Args: never
        Returns: {
          id: number
          last_customer_since: string
          total_count: number
        }
        SetofOptions: {
          from: "*"
          to: "customer_stats"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_default_permissions: {
        Args: { p_manager_type: string; p_role: string }
        Returns: Json
      }
      get_directory_profile_with_media: {
        Args: { p_profile_id: string }
        Returns: {
          media: Json
          profile: Json
        }[]
      }
      get_effective_permissions: {
        Args: { p_organization_id: string; p_user_id: string }
        Returns: Json
      }
      get_existing_vouch: {
        Args: { giver_id: string; receiver_id: string }
        Returns: {
          created_at: string
          id: string
          message: string
          rating: number
          updated_at: string
        }[]
      }
      get_folder_stats: {
        Args: { p_user_id: string }
        Returns: {
          file_count: number
          folder_id: string
          folder_name: string
          total_size: number
        }[]
      }
      get_headshots_for_comedians: {
        Args: { p_user_ids: string[] }
        Returns: {
          aspect_ratio: number
          comedian_name: string
          file_name: string
          file_size: number
          folder_name: string
          id: string
          image_height: number
          image_width: number
          is_primary: boolean
          public_url: string
          tags: string[]
          user_id: string
        }[]
      }
      get_linked_session_sources: {
        Args: { p_canonical_session_source_id: string }
        Returns: {
          source: string
          source_session_id: string
        }[]
      }
      get_media_by_tags: {
        Args: {
          p_match_all?: boolean
          p_media_type?: string
          p_tags: string[]
          p_user_id: string
        }
        Returns: {
          aspect_ratio: number | null
          created_at: string
          directory_profile_id: string | null
          display_order: number | null
          external_id: string | null
          external_type: string | null
          external_url: string | null
          file_name: string
          file_size: number
          file_type: string
          folder_id: string | null
          id: string
          image_height: number | null
          image_width: number | null
          import_batch_id: string | null
          is_featured_in_epk: boolean | null
          is_headshot: boolean | null
          is_primary_headshot: boolean | null
          is_profile_video: boolean | null
          media_type: string | null
          public_url: string | null
          source_filename: string | null
          storage_path: string
          tags: string[] | null
          title: string | null
          updated_at: string
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "media_files"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_media_for_entity: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: {
          created_at: string
          file_type: string
          file_url: string
          id: string
          link_role: string
          source_id: string
          source_type: string
          storage_path: string
          title: string
        }[]
      }
      get_next_invoice_number: { Args: never; Returns: string }
      get_org_all_sessions: {
        Args: { p_limit?: number; p_org_id: string }
        Returns: {
          banner_image_url: string
          canonical_session_source_id: string
          canonical_source: string
          description: string
          event_name: string
          eventbrite_fees_dollars: number
          eventbrite_gross_dollars: number
          eventbrite_net_dollars: number
          eventbrite_order_count: number
          eventbrite_tax_dollars: number
          eventbrite_ticket_count: number
          humanitix_fees_dollars: number
          humanitix_gross_dollars: number
          humanitix_net_dollars: number
          humanitix_order_count: number
          humanitix_tax_dollars: number
          humanitix_ticket_count: number
          is_past: boolean
          merged_sources: string[]
          published: boolean
          session_name: string
          session_start: string
          total_fees_dollars: number
          total_gross_dollars: number
          total_net_dollars: number
          total_order_count: number
          total_tax_dollars: number
          total_ticket_count: number
          url: string
          url_tickets_popup: string
          venue_name: string
        }[]
      }
      get_org_past_sessions: {
        Args: { p_limit?: number; p_org_id: string }
        Returns: {
          banner_image_url: string
          canonical_session_source_id: string
          canonical_source: string
          description: string
          event_name: string
          eventbrite_fees_dollars: number
          eventbrite_gross_dollars: number
          eventbrite_net_dollars: number
          eventbrite_order_count: number
          eventbrite_tax_dollars: number
          eventbrite_ticket_count: number
          humanitix_fees_dollars: number
          humanitix_gross_dollars: number
          humanitix_net_dollars: number
          humanitix_order_count: number
          humanitix_tax_dollars: number
          humanitix_ticket_count: number
          merged_sources: string[]
          published: boolean
          session_name: string
          session_start: string
          total_fees_dollars: number
          total_gross_dollars: number
          total_net_dollars: number
          total_order_count: number
          total_tax_dollars: number
          total_ticket_count: number
          url: string
          url_tickets_popup: string
          venue_name: string
        }[]
      }
      get_org_upcoming_sessions: {
        Args: { p_org_id: string }
        Returns: {
          banner_image_url: string
          canonical_session_source_id: string
          canonical_source: string
          description: string
          event_name: string
          eventbrite_fees_dollars: number
          eventbrite_gross_dollars: number
          eventbrite_net_dollars: number
          eventbrite_order_count: number
          eventbrite_tax_dollars: number
          eventbrite_ticket_count: number
          humanitix_fees_dollars: number
          humanitix_gross_dollars: number
          humanitix_net_dollars: number
          humanitix_order_count: number
          humanitix_tax_dollars: number
          humanitix_ticket_count: number
          merged_sources: string[]
          published: boolean
          session_name: string
          session_start: string
          total_fees_dollars: number
          total_gross_dollars: number
          total_net_dollars: number
          total_order_count: number
          total_tax_dollars: number
          total_ticket_count: number
          url: string
          url_tickets_popup: string
          venue_name: string
        }[]
      }
      get_organization_stats: { Args: { org_id: string }; Returns: Json }
      get_pending_lineup_notifications: {
        Args: { p_event_id: string }
        Returns: number
      }
      get_photo_profiles: {
        Args: { p_media_id: string }
        Returns: {
          is_primary_subject: boolean
          profile_id: string
          role: string
          stage_name: string
        }[]
      }
      get_primary_headshot: {
        Args: { p_user_id: string }
        Returns: {
          aspect_ratio: number
          file_name: string
          file_size: number
          folder_name: string
          id: string
          image_height: number
          image_width: number
          public_url: string
          tags: string[]
        }[]
      }
      get_profile_photos: {
        Args: { p_profile_id: string }
        Returns: {
          event_date: string
          is_headshot: boolean
          is_primary: boolean
          media_id: string
          public_url: string
          role: string
        }[]
      }
      get_random_directory_headshots: {
        Args: { p_count?: number; p_tags?: string[] }
        Returns: {
          file_id: string
          headshot_url: string
          profile_id: string
          slug: string
          stage_name: string
        }[]
      }
      get_unclaimed_directory_profile: {
        Args: { p_email: string }
        Returns: {
          booking_email: string | null
          claimed_at: string | null
          claimed_by: string | null
          comedians_id: string | null
          created_at: string | null
          customer_profile_id: string | null
          email: string | null
          enriched_at: string | null
          enrichment_source: string | null
          enrichment_status: string | null
          facebook_url: string | null
          hero_image_url: string | null
          id: string
          import_batch_id: string | null
          instagram_followers: number | null
          instagram_updated_at: string | null
          instagram_url: string | null
          legal_name: string | null
          long_bio: string | null
          metadata: Json | null
          origin_city: string | null
          origin_country: string | null
          primary_headshot_url: string | null
          profile_type: string | null
          pronouns: string | null
          short_bio: string | null
          slug: string | null
          source: string | null
          stage_name: string
          tags: string[] | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string | null
          website: string | null
          youtube_url: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "directory_profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_upcoming_posts: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          channel_name: string
          content: string
          id: string
          platform: string
          scheduled_at: string
          status: string
        }[]
      }
      get_user_active_channels: {
        Args: { p_user_id: string }
        Returns: {
          channel_handle: string
          channel_name: string
          id: string
          is_active: boolean
          platform: string
        }[]
      }
      get_user_organizations: {
        Args: { p_user_id: string }
        Returns: {
          custom_permissions: Json
          is_owner: boolean
          manager_type: string
          member_role: string
          org_display_name: string
          org_id: string
          org_legal_name: string
          org_type: string[]
        }[]
      }
      get_user_social_analytics: {
        Args: { p_user_id: string }
        Returns: {
          avg_engagement: number
          total_comments: number
          total_likes: number
          total_posts: number
          total_shares: number
          total_views: number
        }[]
      }
      get_user_storage_usage: { Args: { p_user_id: string }; Returns: number }
      get_user_tags: {
        Args: { p_search?: string; p_user_id: string }
        Returns: {
          tag: string
          usage_count: number
        }[]
      }
      get_venue_accessible_photos: {
        Args: { p_venue_id: string }
        Returns: {
          can_download: boolean
          can_use_commercially: boolean
          event_date: string
          event_id: string
          media_id: string
          public_url: string
          storage_path: string
        }[]
      }
      get_vouch_stats: {
        Args: { user_id_param: string }
        Returns: {
          average_rating_received: number
          recent_vouches_received: number
          total_given: number
          total_received: number
        }[]
      }
      get_vouches_with_profiles: {
        Args: { user_id_param: string }
        Returns: {
          created_at: string
          id: string
          message: string
          organization_id: string
          organization_profile: Json
          rating: number
          updated_at: string
          vouchee_id: string
          vouchee_profile: Json
          voucher_id: string
          voucher_profile: Json
        }[]
      }
      has_agency_permission: {
        Args: { _agency_id: string; _required_role?: string; _user_id: string }
        Returns: boolean
      }
      has_organization_profile: { Args: { user_id: string }; Returns: boolean }
      has_role:
        | { Args: { _role: string; _user_id: string }; Returns: boolean }
        | {
            Args: {
              _role: Database["public"]["Enums"]["user_role"]
              _user_id: string
            }
            Returns: boolean
          }
      has_unpublished_lineup_changes: {
        Args: { p_event_id: string }
        Returns: boolean
      }
      has_visual_artist_profile: { Args: { user_id: string }; Returns: boolean }
      is_co_promoter_for_event: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      is_deal_event_owner: {
        Args: { p_deal_id: string; p_user_id: string }
        Returns: boolean
      }
      is_deal_participant: {
        Args: { p_deal_id: string; p_user_id: string }
        Returns: boolean
      }
      is_event_owner: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: boolean
      }
      is_event_partner: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: boolean
      }
      is_org_team_admin_no_rls: {
        Args: { check_user_id: string; org_id: string }
        Returns: boolean
      }
      is_organization_admin: {
        Args: { org_id: string; user_id: string }
        Returns: boolean
      }
      is_organization_member: {
        Args: { org_id: string; user_id: string }
        Returns: boolean
      }
      is_organization_owner: {
        Args: { org_id: string; user_id: string }
        Returns: boolean
      }
      is_venue_claimed: { Args: { p_venue_id: string }; Returns: boolean }
      link_media_to_entity: {
        Args: {
          p_entity_id: string
          p_entity_type: string
          p_role?: string
          p_source_id: string
          p_source_type: string
        }
        Returns: string
      }
      load_lineup_template: {
        Args: {
          p_event_id: string
          p_replace_existing?: boolean
          p_template_id: string
        }
        Returns: {
          spots_created: number
        }[]
      }
      match_external_event: {
        Args: {
          p_event_data?: Json
          p_event_date: string
          p_external_id: string
          p_platform: string
          p_title: string
          p_venue: string
        }
        Returns: {
          event_id: string
          match_reasons: Json
          match_score: number
        }[]
      }
      match_memories: {
        Args: {
          filter_agent_id?: string
          filter_type?: string
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          agent_id: string
          content: string
          id: string
          memory_type: string
          metadata: Json
          similarity: number
        }[]
      }
      normalize_phone_e164: { Args: { phone: string }; Returns: string }
      populate_meta_audience_customers: {
        Args: never
        Returns: {
          inserted: number
          total: number
          updated: number
        }[]
      }
      process_automated_deal_response: {
        Args: {
          _deal_id: string
          _new_offer_amount: number
          _responder_id: string
        }
        Returns: Json
      }
      process_external_event: {
        Args: {
          p_auto_match_threshold?: number
          p_capacity?: number
          p_event_data?: Json
          p_event_date: string
          p_external_id: string
          p_platform: string
          p_title: string
          p_venue: string
        }
        Returns: Json
      }
      process_webhook_attendees: {
        Args: {
          p_attendees: Json
          p_event_id: string
          p_platform: string
          p_ticket_sale_id: string
        }
        Returns: undefined
      }
      process_xero_webhook: { Args: { p_events: Json }; Returns: Json }
      publish_lineup: {
        Args: { p_event_id: string }
        Returns: {
          event_title: string
          notifications_sent: number
        }[]
      }
      queue_brevo_sync: {
        Args: never
        Returns: {
          customer_id: string
          email: string
          sync_data: Json
        }[]
      }
      refresh_customer_comedians_seen: { Args: never; Returns: undefined }
      refresh_customer_contact_data: { Args: never; Returns: undefined }
      refresh_customer_data: { Args: never; Returns: undefined }
      refresh_customer_engagement_metrics: { Args: never; Returns: undefined }
      refresh_customer_marketing_export: { Args: never; Returns: undefined }
      refresh_customer_stats: {
        Args: never
        Returns: {
          id: number
          last_customer_since: string
          total_count: number
        }
        SetofOptions: {
          from: "*"
          to: "customer_stats"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      refresh_session_financials: { Args: never; Returns: undefined }
      refresh_session_financials_agg: { Args: never; Returns: undefined }
      refresh_session_financials_mat: { Args: never; Returns: undefined }
      remove_media_tags: {
        Args: { p_file_id: string; p_tags: string[] }
        Returns: undefined
      }
      search_directory_profiles: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_query?: string
          p_tags?: string[]
          p_unclaimed_only?: boolean
        }
        Returns: {
          claimed_at: string
          created_at: string
          email: string
          id: string
          origin_city: string
          photo_count: number
          primary_headshot_url: string
          short_bio: string
          slug: string
          stage_name: string
          tags: string[]
        }[]
      }
      send_notification: {
        Args: {
          _data?: Json
          _message: string
          _title: string
          _type: string
          _user_id: string
        }
        Returns: string
      }
      set_profile_video: {
        Args: { p_file_id: string; p_user_id: string }
        Returns: boolean
      }
      slugify: { Args: { text_input: string }; Returns: string }
      sync_orders_to_customers: { Args: never; Returns: undefined }
      sync_session_to_events: {
        Args: { p_canonical_session_source_id?: string }
        Returns: {
          inserted_count: number
          synced_count: number
          updated_count: number
        }[]
      }
      test_auth_recovery_webhook: {
        Args: { test_user_id?: string }
        Returns: Json
      }
      toggle_epk_featured: {
        Args: { p_file_id: string; p_is_featured: boolean; p_user_id: string }
        Returns: boolean
      }
      update_agency_analytics: {
        Args: {
          _agency_id: string
          _period_end?: string
          _period_start?: string
        }
        Returns: Json
      }
      update_media_tags: {
        Args: { p_file_id: string; p_tags: string[] }
        Returns: undefined
      }
      update_ticket_sales: {
        Args: {
          p_event_id: string
          p_external_event_id: string
          p_external_url?: string
          p_gross_sales: number
          p_platform: string
          p_platform_data?: Json
          p_tickets_available: number
          p_tickets_sold: number
        }
        Returns: undefined
      }
      upsert_customer_from_import: {
        Args: {
          p_address_line1?: string
          p_address_line2?: string
          p_city?: string
          p_company?: string
          p_country?: string
          p_date_of_birth?: string
          p_email: string
          p_first_name?: string
          p_last_name?: string
          p_marketing_opt_in?: boolean
          p_notes?: string
          p_phone?: string
          p_postcode?: string
          p_source?: string
          p_state?: string
          p_suburb?: string
        }
        Returns: Json
      }
      upsert_user_tag: {
        Args: { p_tag: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      agency_status:
        | "active"
        | "suspended"
        | "pending_verification"
        | "inactive"
      agency_type:
        | "talent_agency"
        | "booking_agency"
        | "management_company"
        | "hybrid"
      artist_relationship_status:
        | "active"
        | "inactive"
        | "pending"
        | "terminated"
      collaboration_role:
        | "co_promoter"
        | "local_promoter"
        | "sponsor"
        | "partner"
        | "venue_partner"
        | "media_partner"
      collaboration_status:
        | "invited"
        | "confirmed"
        | "active"
        | "completed"
        | "declined"
        | "terminated"
      deal_status:
        | "draft"
        | "proposed"
        | "negotiating"
        | "counter_offered"
        | "accepted"
        | "declined"
        | "expired"
      deal_type:
        | "booking"
        | "management"
        | "representation"
        | "endorsement"
        | "collaboration"
      flight_status:
        | "scheduled"
        | "boarding"
        | "departed"
        | "in_air"
        | "landed"
        | "arrived"
        | "cancelled"
        | "delayed"
        | "diverted"
      logistics_type:
        | "transportation"
        | "accommodation"
        | "equipment"
        | "catering"
        | "security"
        | "marketing"
        | "technical"
      manager_role:
        | "primary_manager"
        | "co_manager"
        | "assistant_manager"
        | "agency_owner"
      media_layout_type: "grid" | "masonic" | "list" | "slider"
      media_tag_approval_status: "pending" | "approved" | "rejected"
      media_visibility: "public" | "promoters" | "private"
      negotiation_stage:
        | "initial"
        | "terms_discussion"
        | "financial_negotiation"
        | "final_review"
        | "contract_preparation"
      notification_preference: "none" | "critical" | "all"
      participant_role:
        | "headliner"
        | "support_act"
        | "opener"
        | "mc"
        | "crew"
        | "management"
        | "guest"
        | "local_talent"
      payment_type:
        | "per_show"
        | "tour_total"
        | "percentage"
        | "flat_rate"
        | "revenue_share"
      reminder_type: "due_date" | "custom" | "recurring"
      segment_type: "auto" | "manual" | "smart"
      share_resource_type: "album" | "media"
      share_status: "pending" | "accepted" | "declined" | "revoked"
      share_target_type: "user" | "profile" | "organization"
      task_category:
        | "event_planning"
        | "artist_management"
        | "marketing"
        | "travel"
        | "logistics"
        | "financial"
        | "administrative"
        | "creative"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "pending" | "in_progress" | "completed" | "cancelled"
      tour_status:
        | "planning"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "postponed"
      tour_stop_status:
        | "planned"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "postponed"
      update_source: "manual" | "api" | "n8n" | "system"
      user_role:
        | "comedian"
        | "promoter"
        | "admin"
        | "member"
        | "co_promoter"
        | "visual_artist"
        | "manager"
        | "organization"
        | "comedian_lite"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      agency_status: [
        "active",
        "suspended",
        "pending_verification",
        "inactive",
      ],
      agency_type: [
        "talent_agency",
        "booking_agency",
        "management_company",
        "hybrid",
      ],
      artist_relationship_status: [
        "active",
        "inactive",
        "pending",
        "terminated",
      ],
      collaboration_role: [
        "co_promoter",
        "local_promoter",
        "sponsor",
        "partner",
        "venue_partner",
        "media_partner",
      ],
      collaboration_status: [
        "invited",
        "confirmed",
        "active",
        "completed",
        "declined",
        "terminated",
      ],
      deal_status: [
        "draft",
        "proposed",
        "negotiating",
        "counter_offered",
        "accepted",
        "declined",
        "expired",
      ],
      deal_type: [
        "booking",
        "management",
        "representation",
        "endorsement",
        "collaboration",
      ],
      flight_status: [
        "scheduled",
        "boarding",
        "departed",
        "in_air",
        "landed",
        "arrived",
        "cancelled",
        "delayed",
        "diverted",
      ],
      logistics_type: [
        "transportation",
        "accommodation",
        "equipment",
        "catering",
        "security",
        "marketing",
        "technical",
      ],
      manager_role: [
        "primary_manager",
        "co_manager",
        "assistant_manager",
        "agency_owner",
      ],
      media_layout_type: ["grid", "masonic", "list", "slider"],
      media_tag_approval_status: ["pending", "approved", "rejected"],
      media_visibility: ["public", "promoters", "private"],
      negotiation_stage: [
        "initial",
        "terms_discussion",
        "financial_negotiation",
        "final_review",
        "contract_preparation",
      ],
      notification_preference: ["none", "critical", "all"],
      participant_role: [
        "headliner",
        "support_act",
        "opener",
        "mc",
        "crew",
        "management",
        "guest",
        "local_talent",
      ],
      payment_type: [
        "per_show",
        "tour_total",
        "percentage",
        "flat_rate",
        "revenue_share",
      ],
      reminder_type: ["due_date", "custom", "recurring"],
      segment_type: ["auto", "manual", "smart"],
      share_resource_type: ["album", "media"],
      share_status: ["pending", "accepted", "declined", "revoked"],
      share_target_type: ["user", "profile", "organization"],
      task_category: [
        "event_planning",
        "artist_management",
        "marketing",
        "travel",
        "logistics",
        "financial",
        "administrative",
        "creative",
      ],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["pending", "in_progress", "completed", "cancelled"],
      tour_status: [
        "planning",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "postponed",
      ],
      tour_stop_status: [
        "planned",
        "confirmed",
        "completed",
        "cancelled",
        "postponed",
      ],
      update_source: ["manual", "api", "n8n", "system"],
      user_role: [
        "comedian",
        "promoter",
        "admin",
        "member",
        "co_promoter",
        "visual_artist",
        "manager",
        "organization",
        "comedian_lite",
      ],
    },
  },
} as const
