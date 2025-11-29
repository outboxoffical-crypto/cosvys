import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalculateAreasRequest {
  length: number;
  width: number;
  height: number;
  opening_areas?: Array<{ area: number }>;
  extra_surfaces?: Array<{ area: number }>;
  door_window_grills?: Array<{ area: number }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { length, width, height, opening_areas = [], extra_surfaces = [], door_window_grills = [] }: CalculateAreasRequest = await req.json();

    // Input validation
    if (typeof length !== 'number' || typeof width !== 'number' || typeof height !== 'number') {
      return new Response(JSON.stringify({ error: 'Dimensions must be numeric values' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (length < 0.1 || length > 1000 || width < 0.1 || width > 1000 || height < 0 || height > 100) {
      return new Response(JSON.stringify({ error: 'Dimensions must be positive and within reasonable ranges (length/width: 0.1-1000, height: 0-100)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (opening_areas.length > 50 || extra_surfaces.length > 50 || door_window_grills.length > 50) {
      return new Response(JSON.stringify({ error: 'Too many area entries (max 50 per type)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate array elements
    const validateAreaArray = (arr: Array<{ area: number }>, name: string) => {
      for (const item of arr) {
        if (typeof item.area !== 'number' || item.area < 0 || item.area > 10000) {
          throw new Error(`Invalid ${name} area value`);
        }
      }
    };

    validateAreaArray(opening_areas, 'opening');
    validateAreaArray(extra_surfaces, 'extra_surface');
    validateAreaArray(door_window_grills, 'door_window_grill');

    console.log('Calculating areas for room:', { length, width, height });

    // Calculate floor area
    const floor_area = length * width;

    // Calculate wall area (perimeter * height) with fallback when height is 0
    const wall_area = height > 0 ? 2 * (length + width) * height : floor_area;

    // Calculate ceiling area (same as floor)
    const ceiling_area = floor_area;

    // Calculate total opening area
    const total_opening_area = opening_areas.reduce((sum, opening) => sum + (opening.area || 0), 0);

    // Calculate total extra surface area
    const total_extra_surface = extra_surfaces.reduce((sum, surface) => sum + (surface.area || 0), 0);

    // Calculate total door/window grill area
    const total_door_window_grill_area = door_window_grills.reduce((sum, grill) => sum + (grill.area || 0), 0);

    // Calculate adjusted wall area (door/window grills are for enamel only - NOT wall area)
    const adjusted_wall_area = wall_area - total_opening_area + total_extra_surface;

    const result = {
      floor_area,
      wall_area,
      ceiling_area,
      adjusted_wall_area,
      total_opening_area,
      total_extra_surface,
      total_door_window_grill_area,
    };

    console.log('Calculated areas:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error calculating room areas:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
