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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      campaign_events: {
        Row: {
          campaign_id: string
          event_type: Database["public"]["Enums"]["campaign_event_type"]
          id: string
          lead_id: string
          occurred_at: string
          payload: Json | null
          source: Database["public"]["Enums"]["event_source"]
        }
        Insert: {
          campaign_id: string
          event_type: Database["public"]["Enums"]["campaign_event_type"]
          id?: string
          lead_id: string
          occurred_at?: string
          payload?: Json | null
          source: Database["public"]["Enums"]["event_source"]
        }
        Update: {
          campaign_id?: string
          event_type?: Database["public"]["Enums"]["campaign_event_type"]
          id?: string
          lead_id?: string
          occurred_at?: string
          payload?: Json | null
          source?: Database["public"]["Enums"]["event_source"]
        }
        Relationships: [
          {
            foreignKeyName: "campaign_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          org_id: string
          status: string
          steps: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          org_id: string
          status?: string
          steps?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          org_id?: string
          status?: string
          steps?: Json
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          domain: string | null
          employee_count: number | null
          headquarters: string | null
          id: string
          industry: string | null
          name: string
          org_id: string
          revenue_range: string | null
          source: Database["public"]["Enums"]["lead_source"]
          tech_stack: Json | null
        }
        Insert: {
          created_at?: string
          domain?: string | null
          employee_count?: number | null
          headquarters?: string | null
          id?: string
          industry?: string | null
          name: string
          org_id: string
          revenue_range?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          tech_stack?: Json | null
        }
        Update: {
          created_at?: string
          domain?: string | null
          employee_count?: number | null
          headquarters?: string | null
          id?: string
          industry?: string | null
          name?: string
          org_id?: string
          revenue_range?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          tech_stack?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      credits_ledger: {
        Row: {
          amount: number
          api_call_ref: string | null
          balance_after: number
          created_at: string
          id: string
          org_id: string
          reason: string
        }
        Insert: {
          amount: number
          api_call_ref?: string | null
          balance_after: number
          created_at?: string
          id?: string
          org_id: string
          reason: string
        }
        Update: {
          amount?: number
          api_call_ref?: string | null
          balance_after?: number
          created_at?: string
          id?: string
          org_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "credits_ledger_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company_id: string | null
          created_at: string
          department: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          lead_score: number | null
          linkedin_url: string | null
          location: string | null
          org_id: string
          phone: string | null
          pipeline_stage: Database["public"]["Enums"]["pipeline_stage"]
          seniority: string | null
          source: Database["public"]["Enums"]["lead_source"]
          title: string | null
          verification_source: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          lead_score?: number | null
          linkedin_url?: string | null
          location?: string | null
          org_id: string
          phone?: string | null
          pipeline_stage?: Database["public"]["Enums"]["pipeline_stage"]
          seniority?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          title?: string | null
          verification_source?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          lead_score?: number | null
          linkedin_url?: string | null
          location?: string | null
          org_id?: string
          phone?: string | null
          pipeline_stage?: Database["public"]["Enums"]["pipeline_stage"]
          seniority?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          title?: string | null
          verification_source?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      list_leads: {
        Row: {
          added_at: string
          lead_id: string
          list_id: string
        }
        Insert: {
          added_at?: string
          lead_id: string
          list_id: string
        }
        Update: {
          added_at?: string
          lead_id?: string
          list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_leads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_leads_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          color: string
          created_at: string
          description: string | null
          id: string
          name: string
          org_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          org_id: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lists_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          company_size_range: string | null
          created_at: string
          id: string
          name: string
          onboarded_at: string | null
          plan_tier: string
          target_geography: string | null
          target_industry: string | null
          target_seniority: string[] | null
        }
        Insert: {
          company_size_range?: string | null
          created_at?: string
          id?: string
          name: string
          onboarded_at?: string | null
          plan_tier?: string
          target_geography?: string | null
          target_industry?: string | null
          target_seniority?: string[] | null
        }
        Update: {
          company_size_range?: string | null
          created_at?: string
          id?: string
          name?: string
          onboarded_at?: string | null
          plan_tier?: string
          target_geography?: string | null
          target_industry?: string | null
          target_seniority?: string[] | null
        }
        Relationships: []
      }
      scrape_jobs: {
        Row: {
          api_used: string | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          filters: Json
          id: string
          job_type: string
          log_lines: Json
          org_id: string
          result_count: number
          status: string
        }
        Insert: {
          api_used?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          filters?: Json
          id?: string
          job_type: string
          log_lines?: Json
          org_id: string
          result_count?: number
          status?: string
        }
        Update: {
          api_used?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          filters?: Json
          id?: string
          job_type?: string
          log_lines?: Json
          org_id?: string
          result_count?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrape_jobs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          org_id: string
          plan: string
          razorpay_subscription_id: string | null
          renews_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          plan?: string
          razorpay_subscription_id?: string | null
          renews_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          plan?: string
          razorpay_subscription_id?: string | null
          renews_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          org_id: string | null
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          org_id?: string | null
          role?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          org_id?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_org: { Args: { _org_name: string }; Returns: string }
      current_org_id: { Args: never; Returns: string }
    }
    Enums: {
      campaign_event_type:
        | "enrolled"
        | "sent"
        | "opened"
        | "replied"
        | "bounced"
      event_source: "real_webhook" | "manual"
      lead_source: "hunter_domain" | "apollo_search" | "pdl_search" | "manual"
      pipeline_stage:
        | "new"
        | "contacted"
        | "meeting_scheduled"
        | "qualified"
        | "in_negotiation"
        | "closed_won"
      verification_status:
        | "verified"
        | "unverified"
        | "catch_all"
        | "invalid"
        | "not_checked"
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
      campaign_event_type: ["enrolled", "sent", "opened", "replied", "bounced"],
      event_source: ["real_webhook", "manual"],
      lead_source: ["hunter_domain", "apollo_search", "pdl_search", "manual"],
      pipeline_stage: [
        "new",
        "contacted",
        "meeting_scheduled",
        "qualified",
        "in_negotiation",
        "closed_won",
      ],
      verification_status: [
        "verified",
        "unverified",
        "catch_all",
        "invalid",
        "not_checked",
      ],
    },
  },
} as const
