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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      coverage_data: {
        Row: {
          category: string
          coats: string
          coverage_range: string
          created_at: string
          id: string
          notes: string | null
          product_name: string
          surface_type: string | null
          updated_at: string
        }
        Insert: {
          category: string
          coats: string
          coverage_range: string
          created_at?: string
          id?: string
          notes?: string | null
          product_name: string
          surface_type?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          coats?: string
          coverage_range?: string
          created_at?: string
          id?: string
          notes?: string | null
          product_name?: string
          surface_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dealer_info: {
        Row: {
          address: string
          created_at: string | null
          dealer_name: string
          email: string | null
          employee_id: string | null
          id: string
          margin: number
          phone: string
          shop_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string | null
          dealer_name: string
          email?: string | null
          employee_id?: string | null
          id?: string
          margin?: number
          phone: string
          shop_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string | null
          dealer_name?: string
          email?: string | null
          employee_id?: string | null
          id?: string
          margin?: number
          phone?: string
          shop_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      material_tracker: {
        Row: {
          created_at: string
          delivery_status: string
          id: string
          material_name: string
          project_id: string
          quantity: number
          rate: number
          total: number | null
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_status?: string
          id?: string
          material_name: string
          project_id: string
          quantity?: number
          rate?: number
          total?: number | null
          unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_status?: string
          id?: string
          material_name?: string
          project_id?: string
          quantity?: number
          rate?: number
          total?: number | null
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_tracker_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      product_pricing: {
        Row: {
          created_at: string | null
          id: string
          margin: number | null
          product_name: string
          sizes: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          margin?: number | null
          product_name: string
          sizes?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          margin?: number | null
          product_name?: string
          sizes?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_activity_log: {
        Row: {
          activity_message: string
          activity_type: string
          created_at: string
          id: string
          project_id: string
        }
        Insert: {
          activity_message: string
          activity_type: string
          created_at?: string
          id?: string
          project_id: string
        }
        Update: {
          activity_message?: string
          activity_type?: string
          created_at?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_activity_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          approval_status: string
          area_sqft: number
          created_at: string
          customer_name: string
          end_date: string | null
          feedback_message: string | null
          id: string
          lead_id: string
          location: string
          notification_count: number
          phone: string
          project_date: string
          project_status: string
          project_type: string
          quotation_value: number
          reminder_sent: boolean
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_status?: string
          area_sqft: number
          created_at?: string
          customer_name: string
          end_date?: string | null
          feedback_message?: string | null
          id?: string
          lead_id: string
          location: string
          notification_count?: number
          phone: string
          project_date?: string
          project_status?: string
          project_type: string
          quotation_value: number
          reminder_sent?: boolean
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_status?: string
          area_sqft?: number
          created_at?: string
          customer_name?: string
          end_date?: string | null
          feedback_message?: string | null
          id?: string
          lead_id?: string
          location?: string
          notification_count?: number
          phone?: string
          project_date?: string
          project_status?: string
          project_type?: string
          quotation_value?: number
          reminder_sent?: boolean
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          adjusted_wall_area: number
          ceiling_area: number
          created_at: string | null
          door_window_grills: Json | null
          extra_surfaces: Json | null
          floor_area: number
          height: number | null
          id: string
          length: number
          name: string
          opening_areas: Json | null
          paint_calculations: Json | null
          pictures: Json | null
          project_id: string
          project_type: string
          room_id: string
          selected_areas: Json | null
          total_door_window_grill_area: number | null
          total_extra_surface: number | null
          total_opening_area: number | null
          updated_at: string | null
          user_id: string | null
          wall_area: number
          width: number
        }
        Insert: {
          adjusted_wall_area: number
          ceiling_area: number
          created_at?: string | null
          door_window_grills?: Json | null
          extra_surfaces?: Json | null
          floor_area: number
          height?: number | null
          id?: string
          length: number
          name: string
          opening_areas?: Json | null
          paint_calculations?: Json | null
          pictures?: Json | null
          project_id: string
          project_type: string
          room_id: string
          selected_areas?: Json | null
          total_door_window_grill_area?: number | null
          total_extra_surface?: number | null
          total_opening_area?: number | null
          updated_at?: string | null
          user_id?: string | null
          wall_area: number
          width: number
        }
        Update: {
          adjusted_wall_area?: number
          ceiling_area?: number
          created_at?: string | null
          door_window_grills?: Json | null
          extra_surfaces?: Json | null
          floor_area?: number
          height?: number | null
          id?: string
          length?: number
          name?: string
          opening_areas?: Json | null
          paint_calculations?: Json | null
          pictures?: Json | null
          project_id?: string
          project_type?: string
          room_id?: string
          selected_areas?: Json | null
          total_door_window_grill_area?: number | null
          total_extra_surface?: number | null
          total_opening_area?: number | null
          updated_at?: string | null
          user_id?: string | null
          wall_area?: number
          width?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
