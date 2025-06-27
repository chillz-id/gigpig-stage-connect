export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      applications: {
        Row: {
          applied_at: string | null
          comedian_id: string
          event_id: string
          id: string
          message: string | null
          responded_at: string | null
          status: string | null
        }
        Insert: {
          applied_at?: string | null
          comedian_id: string
          event_id: string
          id?: string
          message?: string | null
          responded_at?: string | null
          status?: string | null
        }
        Update: {
          applied_at?: string | null
          comedian_id?: string
          event_id?: string
          id?: string
          message?: string | null
          responded_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
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
          id: string
          notes: string | null
          requested_comedian_id: string | null
          requester_id: string
          status: string | null
          updated_at: string
          venue: string
        }
        Insert: {
          budget?: number | null
          created_at?: string
          event_date: string
          event_time: string
          id?: string
          notes?: string | null
          requested_comedian_id?: string | null
          requester_id: string
          status?: string | null
          updated_at?: string
          venue: string
        }
        Update: {
          budget?: number | null
          created_at?: string
          event_date?: string
          event_time?: string
          id?: string
          notes?: string | null
          requested_comedian_id?: string | null
          requester_id?: string
          status?: string | null
          updated_at?: string
          venue?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          calendar_sync_status: string | null
          comedian_id: string
          created_at: string
          event_date: string
          event_id: string | null
          id: string
          status: string
          title: string
          updated_at: string
          venue: string
        }
        Insert: {
          calendar_sync_status?: string | null
          comedian_id: string
          created_at?: string
          event_date: string
          event_id?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
          venue: string
        }
        Update: {
          calendar_sync_status?: string | null
          comedian_id?: string
          created_at?: string
          event_date?: string
          event_id?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
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
      comedian_bookings: {
        Row: {
          comedian_id: string | null
          created_at: string | null
          currency: string | null
          event_id: string | null
          id: string
          payment_status: string | null
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
          payment_status?: string | null
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
          payment_status?: string | null
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
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
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
      event_applications: {
        Row: {
          applied_at: string
          comedian_id: string
          event_id: string
          id: string
          message: string | null
          status: string
        }
        Insert: {
          applied_at?: string
          comedian_id: string
          event_id: string
          id?: string
          message?: string | null
          status?: string
        }
        Update: {
          applied_at?: string
          comedian_id?: string
          event_id?: string
          id?: string
          message?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_applications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_spots: {
        Row: {
          comedian_id: string | null
          created_at: string
          currency: string
          duration_minutes: number | null
          event_id: string
          id: string
          is_filled: boolean
          is_paid: boolean
          payment_amount: number | null
          spot_name: string
          spot_order: number
          updated_at: string
        }
        Insert: {
          comedian_id?: string | null
          created_at?: string
          currency?: string
          duration_minutes?: number | null
          event_id: string
          id?: string
          is_filled?: boolean
          is_paid?: boolean
          payment_amount?: number | null
          spot_name: string
          spot_order?: number
          updated_at?: string
        }
        Update: {
          comedian_id?: string | null
          created_at?: string
          currency?: string
          duration_minutes?: number | null
          event_id?: string
          id?: string
          is_filled?: boolean
          is_paid?: boolean
          payment_amount?: number | null
          spot_name?: string
          spot_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_event_spots_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
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
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string
          age_restriction: string | null
          allow_recording: boolean | null
          applied_spots: number | null
          banner_url: string | null
          capacity: number | null
          city: string | null
          comedian_slots: number | null
          country: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          dress_code: string | null
          duration: string | null
          duration_minutes: number | null
          end_time: string | null
          event_date: string
          eventbrite_event_id: string | null
          filled_slots: number | null
          humanitix_event_id: string | null
          id: string
          is_paid: boolean | null
          is_recurring: boolean | null
          is_verified_only: boolean | null
          parent_event_id: string | null
          pay: string | null
          pay_per_comedian: number | null
          profit_margin: number | null
          promoter_id: string
          recurrence_end_date: string | null
          recurrence_pattern: string | null
          requirements: string | null
          series_id: string | null
          settlement_status: string | null
          spots: number | null
          start_time: string | null
          state: string | null
          status: string | null
          ticket_price: number | null
          tickets_sold: number | null
          title: string
          total_costs: number | null
          total_revenue: number | null
          type: string | null
          updated_at: string | null
          venue: string
          xero_invoice_id: string | null
        }
        Insert: {
          address: string
          age_restriction?: string | null
          allow_recording?: boolean | null
          applied_spots?: number | null
          banner_url?: string | null
          capacity?: number | null
          city?: string | null
          comedian_slots?: number | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          dress_code?: string | null
          duration?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          event_date: string
          eventbrite_event_id?: string | null
          filled_slots?: number | null
          humanitix_event_id?: string | null
          id?: string
          is_paid?: boolean | null
          is_recurring?: boolean | null
          is_verified_only?: boolean | null
          parent_event_id?: string | null
          pay?: string | null
          pay_per_comedian?: number | null
          profit_margin?: number | null
          promoter_id: string
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          requirements?: string | null
          series_id?: string | null
          settlement_status?: string | null
          spots?: number | null
          start_time?: string | null
          state?: string | null
          status?: string | null
          ticket_price?: number | null
          tickets_sold?: number | null
          title: string
          total_costs?: number | null
          total_revenue?: number | null
          type?: string | null
          updated_at?: string | null
          venue: string
          xero_invoice_id?: string | null
        }
        Update: {
          address?: string
          age_restriction?: string | null
          allow_recording?: boolean | null
          applied_spots?: number | null
          banner_url?: string | null
          capacity?: number | null
          city?: string | null
          comedian_slots?: number | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          dress_code?: string | null
          duration?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          event_date?: string
          eventbrite_event_id?: string | null
          filled_slots?: number | null
          humanitix_event_id?: string | null
          id?: string
          is_paid?: boolean | null
          is_recurring?: boolean | null
          is_verified_only?: boolean | null
          parent_event_id?: string | null
          pay?: string | null
          pay_per_comedian?: number | null
          profit_margin?: number | null
          promoter_id?: string
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          requirements?: string | null
          series_id?: string | null
          settlement_status?: string | null
          spots?: number | null
          start_time?: string | null
          state?: string | null
          status?: string | null
          ticket_price?: number | null
          tickets_sold?: number | null
          title?: string
          total_costs?: number | null
          total_revenue?: number | null
          type?: string | null
          updated_at?: string | null
          venue?: string
          xero_invoice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_events_parent"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "events"
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
            referencedRelation: "events"
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
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
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
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          reference_number: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          reference_number?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_recipients: {
        Row: {
          created_at: string
          id: string
          invoice_id: string
          is_primary: boolean
          recipient_address: string | null
          recipient_email: string
          recipient_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          is_primary?: boolean
          recipient_address?: string | null
          recipient_email: string
          recipient_name: string
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          is_primary?: boolean
          recipient_address?: string | null
          recipient_email?: string
          recipient_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_recipients_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          currency: string
          due_date: string
          event_id: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          payment_terms: string | null
          promoter_id: string
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          due_date: string
          event_id?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          payment_terms?: string | null
          promoter_id: string
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          due_date?: string
          event_id?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          payment_terms?: string | null
          promoter_id?: string
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
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
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
          subject: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
          subject?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          subject?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          status: string | null
          stripe_session_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
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
          name: string
          promoter_id: string
          state: string | null
          updated_at: string | null
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
          name: string
          promoter_id: string
          state?: string | null
          updated_at?: string | null
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
          name?: string
          promoter_id?: string
          state?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          custom_show_types: string[] | null
          email: string
          id: string
          is_verified: boolean | null
          location: string | null
          name: string | null
          stage_name: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          custom_show_types?: string[] | null
          email: string
          id: string
          is_verified?: boolean | null
          location?: string | null
          name?: string | null
          stage_name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          custom_show_types?: string[] | null
          email?: string
          id?: string
          is_verified?: boolean | null
          location?: string | null
          name?: string | null
          stage_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ticket_sales: {
        Row: {
          created_at: string | null
          customer_email: string
          customer_name: string
          event_id: string | null
          id: string
          platform: string | null
          platform_order_id: string | null
          purchase_date: string | null
          refund_status: string | null
          ticket_quantity: number
          ticket_type: string | null
          total_amount: number
        }
        Insert: {
          created_at?: string | null
          customer_email: string
          customer_name: string
          event_id?: string | null
          id?: string
          platform?: string | null
          platform_order_id?: string | null
          purchase_date?: string | null
          refund_status?: string | null
          ticket_quantity?: number
          ticket_type?: string | null
          total_amount?: number
        }
        Update: {
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          event_id?: string | null
          id?: string
          platform?: string | null
          platform_order_id?: string | null
          purchase_date?: string | null
          refund_status?: string | null
          ticket_quantity?: number
          ticket_type?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "ticket_sales_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
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
        Relationships: []
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
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      vouches: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          rating: number | null
          vouchee_id: string
          voucher_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          rating?: number | null
          vouchee_id: string
          voucher_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          rating?: number | null
          vouchee_id?: string
          voucher_id?: string
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
      xero_integrations: {
        Row: {
          access_token: string | null
          connection_status: string | null
          created_at: string | null
          id: string
          last_sync_at: string | null
          refresh_token: string | null
          settings: Json | null
          tenant_id: string
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          connection_status?: string | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          refresh_token?: string | null
          settings?: Json | null
          tenant_id: string
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          connection_status?: string | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          refresh_token?: string | null
          settings?: Json | null
          tenant_id?: string
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      xero_invoices: {
        Row: {
          created_at: string | null
          created_in_xero_at: string | null
          currency: string | null
          event_id: string | null
          id: string
          invoice_status: string | null
          last_synced_at: string | null
          sync_status: string | null
          ticket_sale_id: string | null
          total_amount: number
          xero_invoice_id: string
          xero_invoice_number: string | null
        }
        Insert: {
          created_at?: string | null
          created_in_xero_at?: string | null
          currency?: string | null
          event_id?: string | null
          id?: string
          invoice_status?: string | null
          last_synced_at?: string | null
          sync_status?: string | null
          ticket_sale_id?: string | null
          total_amount: number
          xero_invoice_id: string
          xero_invoice_number?: string | null
        }
        Update: {
          created_at?: string | null
          created_in_xero_at?: string | null
          currency?: string | null
          event_id?: string | null
          id?: string
          invoice_status?: string | null
          last_synced_at?: string | null
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
            referencedRelation: "events"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_event_profitability: {
        Args: { event_id_param: string }
        Returns: {
          event_id: string
          total_revenue: number
          total_costs: number
          net_profit: number
          profit_margin: number
          tickets_sold: number
        }[]
      }
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      is_co_promoter_for_event: {
        Args: { _user_id: string; _event_id: string }
        Returns: boolean
      }
      send_notification: {
        Args: {
          _user_id: string
          _type: string
          _title: string
          _message: string
          _data?: Json
        }
        Returns: string
      }
    }
    Enums: {
      user_role: "comedian" | "promoter" | "admin" | "member" | "co_promoter"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["comedian", "promoter", "admin", "member", "co_promoter"],
    },
  },
} as const
