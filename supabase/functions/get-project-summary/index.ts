import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { project_id } = await req.json();

    if (!project_id || typeof project_id !== 'string') {
      return new Response(JSON.stringify({ error: 'Valid project_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header for user context
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing summary for project ${project_id}`);

    // Fetch only essential data with limited fields to reduce memory
    const [projectResult, roomsResult, dealerResult] = await Promise.all([
      supabase.from('projects').select('id, customer_name, phone, location, project_type, area_sqft, quotation_value').eq('id', project_id).eq('user_id', userId).single(),
      supabase.from('rooms').select('id, name, project_type, floor_area, wall_area, adjusted_wall_area, ceiling_area, total_door_window_grill_area, selected_areas').eq('project_id', project_id).eq('user_id', userId).limit(100),
      supabase.from('dealer_info').select('margin').eq('user_id', userId).maybeSingle()
    ]);

    if (projectResult.error) {
      console.log('Project fetch error:', projectResult.error.message);
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const project = projectResult.data;
    const rooms = roomsResult.data || [];
    const dealerMargin = dealerResult.data?.margin || 0;

    // Calculate area totals by project type - simple aggregation
    const areaTotals: Record<string, { floor: number; wall: number; ceiling: number; enamel: number }> = {
      Interior: { floor: 0, wall: 0, ceiling: 0, enamel: 0 },
      Exterior: { floor: 0, wall: 0, ceiling: 0, enamel: 0 },
      Waterproofing: { floor: 0, wall: 0, ceiling: 0, enamel: 0 },
    };

    for (const room of rooms) {
      const projectType = room.project_type || 'Interior';
      const selectedAreas = room.selected_areas || { floor: true, wall: true, ceiling: false };
      
      if (selectedAreas.floor) {
        areaTotals[projectType].floor += Number(room.floor_area || 0);
      }
      if (selectedAreas.wall) {
        areaTotals[projectType].wall += Number(room.adjusted_wall_area || room.wall_area || 0);
      }
      if (selectedAreas.ceiling) {
        areaTotals[projectType].ceiling += Number(room.ceiling_area || 0);
      }
      areaTotals[projectType].enamel += Number(room.total_door_window_grill_area || 0);
    }

    // Return minimal summary - client handles material calculations
    const summary = {
      projectId: project_id,
      projectData: {
        customer_name: project.customer_name,
        phone: project.phone,
        location: project.location,
        project_type: project.project_type,
        area_sqft: project.area_sqft,
        quotation_value: project.quotation_value
      },
      areaTotals,
      roomCount: rooms.length,
      dealerMargin,
      timestamp: Date.now()
    };

    console.log('Summary generated successfully');

    return new Response(JSON.stringify({
      success: true,
      summary
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating project summary:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate summary',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
