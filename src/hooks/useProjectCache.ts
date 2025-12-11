import { useCallback, useMemo, useRef, useEffect } from 'react';

// Cached area calculations per room
interface CachedAreaData {
  floorArea: number;
  wallArea: number;
  ceilingArea: number;
  adjustedWallArea: number;
  totalOpeningArea: number;
  totalExtraSurface: number;
  totalDoorWindowGrillArea: number;
  timestamp: number;
}

interface ProjectTotals {
  totalFloor: number;
  totalWall: number;
  totalCeiling: number;
  totalEnamel: number;
  timestamp: number;
}

// In-memory cache for room calculations
const roomAreaCache = new Map<string, CachedAreaData>();
const projectTotalsCache = new Map<string, ProjectTotals>();

// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

export function useProjectCache(projectId: string | undefined) {
  const cacheRef = useRef<Map<string, any>>(new Map());

  // Get cached room areas or calculate if missing
  const getCachedRoomAreas = useCallback((
    roomId: string,
    length: number,
    width: number,
    height: number,
    openingAreas: any[],
    extraSurfaces: any[],
    doorWindowGrills: any[]
  ): CachedAreaData => {
    const cacheKey = `${projectId}_${roomId}`;
    const cached = roomAreaCache.get(cacheKey);
    
    // Return cached if fresh
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached;
    }

    // Calculate using integer math for speed
    const floorArea = Math.round(length * width * 100) / 100;
    const wallArea = height > 0 
      ? Math.round(2 * (length + width) * height * 100) / 100 
      : floorArea;
    const ceilingArea = floorArea;
    
    const totalOpeningArea = openingAreas.reduce((sum: number, o: any) => 
      sum + (o.area || 0), 0);
    const totalExtraSurface = extraSurfaces.reduce((sum: number, e: any) => 
      sum + (e.area || 0), 0);
    const totalDoorWindowGrillArea = doorWindowGrills.reduce((sum: number, d: any) => 
      sum + (d.area || 0), 0);
    
    const adjustedWallArea = Math.round(
      (wallArea - totalOpeningArea + totalExtraSurface) * 100
    ) / 100;

    const result: CachedAreaData = {
      floorArea,
      wallArea,
      ceilingArea,
      adjustedWallArea,
      totalOpeningArea,
      totalExtraSurface,
      totalDoorWindowGrillArea,
      timestamp: Date.now()
    };

    roomAreaCache.set(cacheKey, result);
    return result;
  }, [projectId]);

  // Invalidate room cache when data changes
  const invalidateRoomCache = useCallback((roomId: string) => {
    const cacheKey = `${projectId}_${roomId}`;
    roomAreaCache.delete(cacheKey);
  }, [projectId]);

  // Get/set project totals cache
  const getCachedProjectTotals = useCallback((
    rooms: any[],
    paintType: string
  ): ProjectTotals => {
    const cacheKey = `${projectId}_${paintType}`;
    const cached = projectTotalsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached;
    }

    // Calculate totals for paint type
    let totalFloor = 0;
    let totalWall = 0;
    let totalCeiling = 0;
    let totalEnamel = 0;

    for (const room of rooms) {
      if (room.project_type !== paintType) continue;
      
      const selectedAreas = room.selected_areas || { floor: false, wall: false, ceiling: false };
      
      if (selectedAreas.floor) {
        totalFloor += Number(room.floor_area || 0);
      }
      if (selectedAreas.wall) {
        totalWall += Number(room.adjusted_wall_area || room.wall_area || 0);
      }
      if (selectedAreas.ceiling) {
        totalCeiling += Number(room.ceiling_area || 0);
      }
      if (room.total_door_window_grill_area) {
        totalEnamel += Number(room.total_door_window_grill_area || 0);
      }
    }

    const result: ProjectTotals = {
      totalFloor: Math.round(totalFloor * 100) / 100,
      totalWall: Math.round(totalWall * 100) / 100,
      totalCeiling: Math.round(totalCeiling * 100) / 100,
      totalEnamel: Math.round(totalEnamel * 100) / 100,
      timestamp: Date.now()
    };

    projectTotalsCache.set(cacheKey, result);
    return result;
  }, [projectId]);

  // Invalidate project totals cache
  const invalidateProjectTotals = useCallback((paintType?: string) => {
    if (paintType) {
      projectTotalsCache.delete(`${projectId}_${paintType}`);
    } else {
      // Clear all for this project
      ['Interior', 'Exterior', 'Waterproofing'].forEach(pt => {
        projectTotalsCache.delete(`${projectId}_${pt}`);
      });
    }
  }, [projectId]);

  // Clear all caches for project
  const clearProjectCache = useCallback(() => {
    // Clear room caches for this project
    const keysToDelete: string[] = [];
    roomAreaCache.forEach((_, key) => {
      if (key.startsWith(`${projectId}_`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => roomAreaCache.delete(key));

    // Clear totals
    invalidateProjectTotals();
  }, [projectId, invalidateProjectTotals]);

  return {
    getCachedRoomAreas,
    invalidateRoomCache,
    getCachedProjectTotals,
    invalidateProjectTotals,
    clearProjectCache
  };
}

// Singleton for prefetching data
interface PrefetchedData {
  rooms?: any[];
  coverageData?: any[];
  productPricing?: any[];
  dealerMargin?: number;
  timestamp: number;
}

const prefetchCache = new Map<string, PrefetchedData>();

export function getPrefetchedData(projectId: string): PrefetchedData | null {
  const cached = prefetchCache.get(projectId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached;
  }
  return null;
}

export function setPrefetchedData(projectId: string, data: Partial<PrefetchedData>) {
  const existing = prefetchCache.get(projectId) || { timestamp: Date.now() };
  prefetchCache.set(projectId, {
    ...existing,
    ...data,
    timestamp: Date.now()
  });
}

export function clearPrefetchedData(projectId: string) {
  prefetchCache.delete(projectId);
}
