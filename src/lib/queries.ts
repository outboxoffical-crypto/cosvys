import { supabase } from "@/integrations/supabase/client";

/**
 * Optimized query functions with field selection and batching
 * Reduces data transfer and improves response times
 */

// Projects queries - only fetch necessary fields
export const projectQueries = {
  async getProjectById(id: string) {
    return supabase
      .from("projects")
      .select("id, user_id, customer_name, phone, location, project_type, project_status, quotation_value, area_sqft, created_at, updated_at")
      .eq("id", id)
      .maybeSingle();
  },

  async getUserProjects(userId: string, limit = 50, offset = 0) {
    return supabase
      .from("projects")
      .select("id, customer_name, phone, location, project_type, project_status, quotation_value, area_sqft, created_at", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
  },

  async searchProjects(userId: string, query: string) {
    return supabase
      .from("projects")
      .select("id, customer_name, phone, location, project_type, project_status")
      .eq("user_id", userId)
      .or(`customer_name.ilike.%${query}%,phone.ilike.%${query}%,location.ilike.%${query}%`)
      .limit(10);
  },
};

// Room measurements queries
export const roomQueries = {
  async getRoomsByProjectId(projectId: string) {
    return supabase
      .from("room_measurements")
      .select("id, project_id, room_name, length, width, height, floor_type, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });
  },

  async getRoomById(id: string) {
    return supabase
      .from("room_measurements")
      .select("*")
      .eq("id", id)
      .maybeSingle();
  },
};

// Site surveys queries
export const surveyQueries = {
  async getSurveyByProjectId(projectId: string) {
    return supabase
      .from("site_surveys")
      .select("project_id, survey_data, updated_at")
      .eq("project_id", projectId)
      .maybeSingle();
  },
};

// Paint estimation queries
export const estimationQueries = {
  async getEstimationByProjectId(projectId: string) {
    return supabase
      .from("paint_estimations")
      .select("id, project_id, total_paint_required, total_cost, created_at")
      .eq("project_id", projectId)
      .maybeSingle();
  },
};

// Coverage data queries (static data, cache longer)
export const coverageQueries = {
  async getCoverageData() {
    return supabase
      .from("coverage_data")
      .select("id, paint_type, surface_type, coverage_sqft")
      .limit(1000); // Cache this data
  },
};

