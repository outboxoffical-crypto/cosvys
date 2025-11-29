import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaintCalculationRequest {
  room_id: string;
  floor_area: number;
  wall_area: number;
  ceiling_area: number;
  adjusted_wall_area: number;
  selected_areas: {
    floor: boolean;
    wall: boolean;
    ceiling: boolean;
  };
  project_type: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      room_id, 
      floor_area, 
      wall_area, 
      ceiling_area, 
      adjusted_wall_area, 
      selected_areas,
      project_type 
    }: PaintCalculationRequest = await req.json();

    // Input validation
    if (!room_id || typeof room_id !== 'string') {
      return new Response(JSON.stringify({ error: 'Valid room_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (typeof floor_area !== 'number' || typeof wall_area !== 'number' || 
        typeof ceiling_area !== 'number' || typeof adjusted_wall_area !== 'number') {
      return new Response(JSON.stringify({ error: 'All area values must be numeric' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (floor_area < 0 || floor_area > 100000 || wall_area < 0 || wall_area > 100000 || 
        ceiling_area < 0 || ceiling_area > 100000 || adjusted_wall_area < 0 || adjusted_wall_area > 100000) {
      return new Response(JSON.stringify({ error: 'Area values must be between 0 and 100000 sq.ft' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!selected_areas || typeof selected_areas !== 'object') {
      return new Response(JSON.stringify({ error: 'selected_areas must be an object' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!project_type || typeof project_type !== 'string') {
      return new Response(JSON.stringify({ error: 'Valid project_type is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate totals based on selected areas
    let total_paintable_area = 0;
    
    if (selected_areas.floor) total_paintable_area += floor_area;
    if (selected_areas.wall) total_paintable_area += adjusted_wall_area;
    if (selected_areas.ceiling) total_paintable_area += ceiling_area;

    // Default coverage rates (sq.ft per liter)
    const coverage_rates = {
      putty: 20,
      primer: 120,
      emulsion: 140,
    };

    // Calculate material requirements (minimal data structure)
    const paint_data = {
      room_id,
      total_area: total_paintable_area,
      floor_area: selected_areas.floor ? floor_area : 0,
      wall_area: selected_areas.wall ? adjusted_wall_area : 0,
      ceiling_area: selected_areas.ceiling ? ceiling_area : 0,
      project_type,
      // Pre-calculated for common configurations
      fresh_painting: {
        putty_liters: (total_paintable_area / coverage_rates.putty) * 2,
        primer_liters: (total_paintable_area / coverage_rates.primer) * 1,
        emulsion_liters: (total_paintable_area / coverage_rates.emulsion) * 2,
      },
      repainting: {
        primer_liters: (total_paintable_area / coverage_rates.primer) * 1,
        emulsion_liters: (total_paintable_area / coverage_rates.emulsion) * 2,
      },
      timestamp: Date.now(),
    };

    return new Response(JSON.stringify(paint_data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error calculating paint requirements:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
