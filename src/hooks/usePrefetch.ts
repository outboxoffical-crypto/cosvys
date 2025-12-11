import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { setPrefetchedData, getPrefetchedData } from './useProjectCache';

/**
 * Prefetch data for next screens in background
 * Call this early (e.g., when entering Room Measurements)
 * to have Paint Estimation and Summary data ready
 */
export function usePrefetchProjectData(projectId: string | undefined) {
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!projectId || hasFetched.current) return;
    
    const prefetch = async () => {
      try {
        // Check if already cached
        const existing = getPrefetchedData(projectId);
        if (existing?.rooms && existing?.coverageData) {
          return; // Already have data
        }

        // Prefetch in parallel
        const [roomsResult, coverageResult, pricingResult, dealerResult] = await Promise.all([
          // Rooms - essential fields only
          supabase
            .from('rooms')
            .select('id, room_id, name, project_type, floor_area, wall_area, ceiling_area, adjusted_wall_area, selected_areas, total_door_window_grill_area, sub_areas, section_name')
            .eq('project_id', projectId),
          
          // Coverage data
          supabase
            .from('coverage_data')
            .select('id, category, product_name, coats, coverage_range, surface_type')
            .in('category', ['Putty', 'Primer', 'Interior Emulsion', 'Exterior Emulsion', 'Waterproofing']),
          
          // Product pricing
          supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) return { data: null };
            return supabase
              .from('product_pricing')
              .select('product_name, sizes, category')
              .eq('user_id', user.id);
          }),
          
          // Dealer margin
          supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) return { data: null };
            return supabase
              .from('dealer_info')
              .select('margin')
              .eq('user_id', user.id)
              .maybeSingle();
          })
        ]);

        // Store in cache
        setPrefetchedData(projectId, {
          rooms: roomsResult.data || undefined,
          coverageData: coverageResult.data || undefined,
          productPricing: pricingResult?.data || undefined,
          dealerMargin: dealerResult?.data?.margin || undefined
        });

        hasFetched.current = true;
      } catch (error) {
        console.warn('Prefetch failed:', error);
      }
    };

    // Start prefetch after a short delay to not block UI
    const timeout = setTimeout(prefetch, 100);
    
    return () => clearTimeout(timeout);
  }, [projectId]);
}

/**
 * Get prefetched data if available, otherwise fetch fresh
 */
export async function getOrFetchRooms(projectId: string): Promise<any[]> {
  const cached = getPrefetchedData(projectId);
  if (cached?.rooms) {
    return cached.rooms;
  }

  const { data, error } = await supabase
    .from('rooms')
    .select('id, room_id, name, project_type, floor_area, wall_area, ceiling_area, adjusted_wall_area, selected_areas, total_door_window_grill_area, sub_areas, section_name')
    .eq('project_id', projectId);

  if (error) {
    console.error('Error fetching rooms:', error);
    return [];
  }

  // Update cache
  setPrefetchedData(projectId, { rooms: data || [] });
  return data || [];
}

export async function getOrFetchCoverageData(): Promise<any[]> {
  // Coverage data is project-independent, use a static key
  const cached = getPrefetchedData('__global__');
  if (cached?.coverageData) {
    return cached.coverageData;
  }

  const { data, error } = await supabase
    .from('coverage_data')
    .select('id, category, product_name, coats, coverage_range, surface_type')
    .in('category', ['Putty', 'Primer', 'Interior Emulsion', 'Exterior Emulsion', 'Waterproofing']);

  if (error) {
    console.error('Error fetching coverage:', error);
    return [];
  }

  setPrefetchedData('__global__', { coverageData: data || [] });
  return data || [];
}
