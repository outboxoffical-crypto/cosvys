/**
 * Optimized calculation utilities for paint estimation
 * Uses integer math internally for performance, converts to decimals only at output
 */

// Memoization cache for expensive calculations
const calculationCache = new Map<string, any>();
const CALC_CACHE_TTL = 60 * 1000; // 1 minute

interface CacheEntry {
  value: any;
  timestamp: number;
}

function getCached<T>(key: string): T | null {
  const entry = calculationCache.get(key) as CacheEntry | undefined;
  if (entry && Date.now() - entry.timestamp < CALC_CACHE_TTL) {
    return entry.value as T;
  }
  return null;
}

function setCache(key: string, value: any): void {
  calculationCache.set(key, { value, timestamp: Date.now() });
}

// Safe number parsing - always returns valid number
export function safeNumber(value: string | number | null | undefined, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') return defaultValue;
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(parsed) || !isFinite(parsed) ? defaultValue : parsed;
}

// Fast integer-based area calculation
export function calculateRoomAreas(
  length: number,
  width: number,
  height: number,
  openingAreas: { area: number }[] = [],
  extraSurfaces: { area: number }[] = [],
  doorWindowGrills: { area: number }[] = []
) {
  // Convert to centimeters (integers) for precision
  const l = Math.round(length * 100);
  const w = Math.round(width * 100);
  const h = Math.round(height * 100);
  
  // Calculate in square centimeters
  const floorAreaCm2 = l * w;
  const wallAreaCm2 = h > 0 ? 2 * (l + w) * h : floorAreaCm2;
  const ceilingAreaCm2 = floorAreaCm2;
  
  // Sum adjustments (convert back from sq.ft to sq.cm first)
  let totalOpeningCm2 = 0;
  let totalExtraCm2 = 0;
  let totalDoorWindowCm2 = 0;
  
  for (const o of openingAreas) {
    totalOpeningCm2 += Math.round((o.area || 0) * 10000);
  }
  for (const e of extraSurfaces) {
    totalExtraCm2 += Math.round((e.area || 0) * 10000);
  }
  for (const d of doorWindowGrills) {
    totalDoorWindowCm2 += Math.round((d.area || 0) * 10000);
  }
  
  const adjustedWallAreaCm2 = wallAreaCm2 - totalOpeningCm2 + totalExtraCm2;
  
  // Convert back to sq.ft (divide by 10000)
  return {
    floorArea: floorAreaCm2 / 10000,
    wallArea: wallAreaCm2 / 10000,
    ceilingArea: ceilingAreaCm2 / 10000,
    adjustedWallArea: adjustedWallAreaCm2 / 10000,
    totalOpeningArea: totalOpeningCm2 / 10000,
    totalExtraSurface: totalExtraCm2 / 10000,
    totalDoorWindowGrillArea: totalDoorWindowCm2 / 10000
  };
}

// Parse coverage range string to get average coverage
export function parseCoverageRange(coverageRange: string): number {
  if (!coverageRange) return 100; // Default fallback
  
  const cacheKey = `coverage_${coverageRange}`;
  const cached = getCached<number>(cacheKey);
  if (cached !== null) return cached;
  
  // Handle ranges like "140-160" or single values like "150"
  const match = coverageRange.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
  if (match) {
    const low = parseFloat(match[1]);
    const high = parseFloat(match[2]);
    const result = (low + high) / 2;
    setCache(cacheKey, result);
    return result;
  }
  
  const single = parseFloat(coverageRange);
  const result = isNaN(single) ? 100 : single;
  setCache(cacheKey, result);
  return result;
}

// Calculate material quantity from area and coverage
export function calculateMaterialQuantity(
  area: number,
  coverageRate: number,
  coats: number = 1
): number {
  if (area <= 0 || coverageRate <= 0) return 0;
  
  // Simple formula: Area / Coverage = Liters needed
  // Note: Coverage already accounts for coats per product specs
  const quantity = area / coverageRate;
  return Math.ceil(quantity); // Round up to nearest whole unit
}

// Optimized pack combination calculator
interface PackOption {
  size: number;
  price: number;
}

export function getOptimalPackCombination(
  requiredLiters: number,
  packOptions: PackOption[]
): { packs: { size: number; quantity: number; price: number }[]; totalCost: number } {
  if (requiredLiters <= 0 || packOptions.length === 0) {
    return { packs: [], totalCost: 0 };
  }
  
  const cacheKey = `packs_${requiredLiters}_${JSON.stringify(packOptions)}`;
  const cached = getCached<ReturnType<typeof getOptimalPackCombination>>(cacheKey);
  if (cached) return cached;
  
  // Sort by size descending for greedy approach
  const sortedPacks = [...packOptions].sort((a, b) => b.size - a.size);
  
  let remaining = requiredLiters;
  const result: { size: number; quantity: number; price: number }[] = [];
  let totalCost = 0;
  
  for (const pack of sortedPacks) {
    if (remaining <= 0) break;
    
    const quantity = Math.floor(remaining / pack.size);
    if (quantity > 0) {
      result.push({ size: pack.size, quantity, price: pack.price });
      totalCost += quantity * pack.price;
      remaining -= quantity * pack.size;
    }
  }
  
  // Handle remainder with smallest pack
  if (remaining > 0 && sortedPacks.length > 0) {
    const smallestPack = sortedPacks[sortedPacks.length - 1];
    result.push({ size: smallestPack.size, quantity: 1, price: smallestPack.price });
    totalCost += smallestPack.price;
  }
  
  const finalResult = { packs: result, totalCost };
  setCache(cacheKey, finalResult);
  return finalResult;
}

// Calculate labour requirements
export function calculateLabourDays(
  totalPaintableArea: number,
  sqFtPerDayPerWorker: number = 150,
  numberOfWorkers: number = 1
): number {
  if (totalPaintableArea <= 0 || sqFtPerDayPerWorker <= 0 || numberOfWorkers <= 0) {
    return 0;
  }
  
  const totalCapacityPerDay = sqFtPerDayPerWorker * numberOfWorkers;
  return Math.ceil(totalPaintableArea / totalCapacityPerDay);
}

export function calculateLabourCost(
  days: number,
  dailyRate: number = 1100
): number {
  return days * dailyRate;
}

// Batch calculate all material requirements
interface MaterialConfig {
  materialName: string;
  area: number;
  coverageRate: number;
  coats?: number;
  packOptions?: PackOption[];
}

export function batchCalculateMaterials(configs: MaterialConfig[]): {
  materialName: string;
  quantity: number;
  packs?: ReturnType<typeof getOptimalPackCombination>;
}[] {
  return configs.map(config => {
    const quantity = calculateMaterialQuantity(
      config.area,
      config.coverageRate,
      config.coats
    );
    
    const packs = config.packOptions 
      ? getOptimalPackCombination(quantity, config.packOptions)
      : undefined;
    
    return {
      materialName: config.materialName,
      quantity,
      packs
    };
  });
}

// Project summary totals calculator
interface AreaConfig {
  areaType: string;
  area: number;
  perSqFtRate: string | number;
  paintTypeCategory?: string;
}

export function calculateProjectTotals(configs: AreaConfig[]): {
  totalArea: number;
  totalCost: number;
  areaByType: Record<string, number>;
  costByType: Record<string, number>;
} {
  let totalArea = 0;
  let totalCost = 0;
  const areaByType: Record<string, number> = {};
  const costByType: Record<string, number> = {};
  
  for (const config of configs) {
    const area = safeNumber(config.area);
    const rate = safeNumber(config.perSqFtRate);
    const cost = area * rate;
    
    totalArea += area;
    totalCost += cost;
    
    const typeKey = config.paintTypeCategory || 'Other';
    areaByType[typeKey] = (areaByType[typeKey] || 0) + area;
    costByType[typeKey] = (costByType[typeKey] || 0) + cost;
  }
  
  return {
    totalArea: Math.round(totalArea * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    areaByType,
    costByType
  };
}

// Clear calculation cache (call when data changes)
export function clearCalculationCache(): void {
  calculationCache.clear();
}
