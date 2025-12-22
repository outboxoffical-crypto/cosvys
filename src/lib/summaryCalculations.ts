/**
 * Summary Calculation Service
 * Separates calculation logic from UI rendering to prevent state updates during render
 * and ensure stable, predictable calculations
 */

import { safeNumber, parseCoverageRange } from './calculations';

// Maximum allowed area value (prevents calculation overflow)
export const MAX_SQFT_VALUE = 100000;
export const MIN_SQFT_VALUE = 0;

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue: number;
}

/**
 * Validate sqft input value
 */
export function validateSqftInput(value: number | string | null | undefined): ValidationResult {
  const numValue = safeNumber(value, 0);
  
  if (numValue < MIN_SQFT_VALUE) {
    return {
      isValid: false,
      error: 'Area cannot be negative',
      sanitizedValue: 0
    };
  }
  
  if (numValue > MAX_SQFT_VALUE) {
    return {
      isValid: false,
      error: `Area exceeds maximum allowed value (${MAX_SQFT_VALUE.toLocaleString()} sq.ft)`,
      sanitizedValue: MAX_SQFT_VALUE
    };
  }
  
  if (!isFinite(numValue)) {
    return {
      isValid: false,
      error: 'Invalid area value',
      sanitizedValue: 0
    };
  }
  
  return {
    isValid: true,
    sanitizedValue: numValue
  };
}

// Area configuration interface
export interface AreaConfig {
  id: string;
  areaType: string;
  paintingSystem: string;
  area: number;
  perSqFtRate: string;
  label?: string;
  sectionName?: string;
  paintTypeCategory?: 'Interior' | 'Exterior' | 'Waterproofing';
  selectedMaterials: {
    putty: string;
    primer: string;
    emulsion: string;
  };
  coatConfiguration: {
    putty: number;
    primer: number;
    emulsion: number;
  };
  repaintingConfiguration?: {
    primer: number;
    emulsion: number;
  };
  enamelConfig?: {
    primerType: string;
    primerCoats: number;
    enamelType: string;
    enamelCoats: number;
  };
}

// Labour coverage rates
export const LABOUR_COVERAGE_RATES = {
  waterBased: {
    putty: 400,
    interiorPrimer: 700,
    exteriorPrimer: 550,
    interiorEmulsion: 700,
    exteriorEmulsion: 550
  },
  oilBased: {
    redOxide: 300,
    enamelBase: 250,
    enamelTop: 280,
    full3Coat: 275
  }
};

// Labour calculation result
export interface LabourTaskResult {
  name: string;
  area: number;
  coats: number;
  totalWork: number;
  coverage: number;
  daysRequired: number;
}

export interface ConfigLabourResult {
  configLabel: string;
  paintTypeCategory: string;
  tasks: LabourTaskResult[];
  totalDays: number;
  isEnamel: boolean;
}

/**
 * Calculate labour tasks for a single configuration
 */
export function calculateLabourTasks(
  config: AreaConfig,
  workingHours: number = 7,
  standardHours: number = 8,
  numberOfLabours: number = 1
): LabourTaskResult[] {
  const areaValidation = validateSqftInput(config.area);
  const area = areaValidation.sanitizedValue;
  
  if (area <= 0) return [];
  
  const isFresh = config.paintingSystem === 'Fresh Painting';
  const isOilBased = 
    config.selectedMaterials.emulsion?.toLowerCase().includes('enamel') || 
    config.selectedMaterials.primer?.toLowerCase().includes('oxide') || 
    config.selectedMaterials.emulsion?.toLowerCase().includes('oil');
  
  const tasks: LabourTaskResult[] = [];
  const rates = LABOUR_COVERAGE_RATES;
  
  if (isFresh) {
    // Putty
    if (config.coatConfiguration.putty > 0) {
      const totalWork = area * config.coatConfiguration.putty;
      const adjustedCoverage = rates.waterBased.putty * (workingHours / standardHours);
      const daysRequired = Math.ceil(totalWork / (adjustedCoverage * numberOfLabours));
      tasks.push({
        name: config.selectedMaterials.putty || 'Putty',
        area,
        coats: config.coatConfiguration.putty,
        totalWork,
        coverage: rates.waterBased.putty,
        daysRequired
      });
    }
    
    // Primer
    if (config.coatConfiguration.primer > 0) {
      const totalWork = area * config.coatConfiguration.primer;
      const isEnamel = config.selectedMaterials.primer?.toLowerCase().includes('enamel') || 
                       config.selectedMaterials.emulsion?.toLowerCase().includes('enamel');
      const isExterior = config.paintTypeCategory === 'Exterior';
      const primerRate = isExterior ? rates.waterBased.exteriorPrimer : rates.waterBased.interiorPrimer;
      const coverage = isEnamel ? rates.oilBased.enamelBase : 
                       isOilBased ? rates.oilBased.redOxide : primerRate;
      const adjustedCoverage = coverage * (workingHours / standardHours);
      const daysRequired = Math.ceil(totalWork / (adjustedCoverage * numberOfLabours));
      tasks.push({
        name: config.selectedMaterials.primer || 'Primer',
        area,
        coats: config.coatConfiguration.primer,
        totalWork,
        coverage,
        daysRequired
      });
    }
    
    // Emulsion
    if (config.coatConfiguration.emulsion > 0) {
      const totalWork = area * config.coatConfiguration.emulsion;
      const isEnamel = config.selectedMaterials.emulsion?.toLowerCase().includes('enamel');
      const isExterior = config.paintTypeCategory === 'Exterior';
      const emulsionRate = isExterior ? rates.waterBased.exteriorEmulsion : rates.waterBased.interiorEmulsion;
      const coverage = isEnamel ? rates.oilBased.enamelTop : 
                       isOilBased ? rates.oilBased.enamelTop : emulsionRate;
      const adjustedCoverage = coverage * (workingHours / standardHours);
      const daysRequired = Math.ceil(totalWork / (adjustedCoverage * numberOfLabours));
      tasks.push({
        name: config.selectedMaterials.emulsion || 'Emulsion',
        area,
        coats: config.coatConfiguration.emulsion,
        totalWork,
        coverage,
        daysRequired
      });
    }
  } else {
    // Repainting
    if (config.repaintingConfiguration?.primer && config.repaintingConfiguration.primer > 0) {
      const totalWork = area * config.repaintingConfiguration.primer;
      const isExterior = config.paintTypeCategory === 'Exterior';
      const primerRate = isExterior ? rates.waterBased.exteriorPrimer : rates.waterBased.interiorPrimer;
      const coverage = isOilBased ? rates.oilBased.redOxide : primerRate;
      const adjustedCoverage = coverage * (workingHours / standardHours);
      const daysRequired = Math.ceil(totalWork / (adjustedCoverage * numberOfLabours));
      tasks.push({
        name: config.selectedMaterials.primer || 'Primer',
        area,
        coats: config.repaintingConfiguration.primer,
        totalWork,
        coverage,
        daysRequired
      });
    }
    
    if (config.repaintingConfiguration?.emulsion && config.repaintingConfiguration.emulsion > 0) {
      const totalWork = area * config.repaintingConfiguration.emulsion;
      const isExterior = config.paintTypeCategory === 'Exterior';
      const emulsionRate = isExterior ? rates.waterBased.exteriorEmulsion : rates.waterBased.interiorEmulsion;
      const coverage = isOilBased ? rates.oilBased.enamelTop : emulsionRate;
      const adjustedCoverage = coverage * (workingHours / standardHours);
      const daysRequired = Math.ceil(totalWork / (adjustedCoverage * numberOfLabours));
      tasks.push({
        name: config.selectedMaterials.emulsion || 'Emulsion',
        area,
        coats: config.repaintingConfiguration.emulsion,
        totalWork,
        coverage,
        daysRequired
      });
    }
  }
  
  return tasks;
}

/**
 * Calculate all labour requirements for multiple configurations
 */
export function calculateAllLabour(
  configs: AreaConfig[],
  workingHours: number = 7,
  standardHours: number = 8,
  numberOfLabours: number = 1
): ConfigLabourResult[] {
  return configs.map(config => {
    const tasks = calculateLabourTasks(config, workingHours, standardHours, numberOfLabours);
    const isEnamel = 
      config.areaType === 'Door & Window' || 
      config.label?.toLowerCase().includes('enamel') || 
      config.selectedMaterials?.emulsion?.toLowerCase().includes('enamel');
    
    return {
      configLabel: config.label || config.areaType,
      paintTypeCategory: config.paintTypeCategory || 'Interior',
      tasks,
      totalDays: tasks.reduce((sum, task) => sum + task.daysRequired, 0),
      isEnamel
    };
  });
}

// Material calculation result
export interface MaterialResult {
  name: string;
  type: string;
  area: number;
  coats: number;
  coverageRate: number;
  quantity: string;
  requiredQuantity: number;
  unit: string;
  packsNeeded: number;
  packSize: string;
  packCombination: string;
  totalCost: number;
  rate: number;
  error?: string;
  combination?: { size: string; count: number; price: number }[];
}

export interface ConfigMaterialResult {
  configLabel: string;
  paintTypeCategory: string;
  materials: MaterialResult[];
  totalCost: number;
  isEnamel: boolean;
}

/**
 * Calculate optimal pack combination for a given quantity
 */
export function calculateOptimalPackCombination(
  availableSizes: { size: string; price: number }[],
  maxQuantity: number,
  unit: string
): { 
  combination: { size: string; count: number; price: number }[]; 
  totalCost: number; 
  error?: string 
} {
  if (availableSizes.length === 0 || maxQuantity <= 0) {
    return { combination: [], totalCost: 0 };
  }
  
  const sortedSizes = [...availableSizes].sort((a, b) => {
    const sizeA = parseFloat(a.size.replace(/[^\d.]/g, ''));
    const sizeB = parseFloat(b.size.replace(/[^\d.]/g, ''));
    return sizeB - sizeA;
  });
  
  let remaining = maxQuantity;
  const combination: { size: string; count: number; price: number }[] = [];
  
  for (const pack of sortedSizes) {
    const packSize = parseFloat(pack.size.replace(/[^\d.]/g, ''));
    if (remaining >= packSize) {
      const count = Math.floor(remaining / packSize);
      if (count > 0) {
        combination.push({ size: pack.size, count, price: pack.price });
        remaining -= count * packSize;
      }
    }
  }
  
  if (remaining > 0.01 && sortedSizes.length > 0) {
    const smallestPack = sortedSizes[sortedSizes.length - 1];
    const existing = combination.find(c => c.size === smallestPack.size);
    if (existing) {
      existing.count += 1;
    } else {
      combination.push({ size: smallestPack.size, count: 1, price: smallestPack.price });
    }
  }
  
  const totalCost = combination.reduce((sum, c) => sum + c.count * c.price, 0);
  
  if (combination.length === 0 && maxQuantity > 0) {
    return {
      combination: [],
      totalCost: 0,
      error: "⚠️ Pack combination not found for full quantity."
    };
  }
  
  return { combination, totalCost };
}

/**
 * Calculate project totals
 */
export interface ProjectTotals {
  companyProjectCost: number;
  materialCost: number;
  labourCost: number;
  marginCost: number;
  actualTotalCost: number;
}

export function calculateProjectTotals(
  areaConfigs: AreaConfig[],
  materialCost: number,
  labourCost: number,
  marginPercentage: number = 10
): ProjectTotals {
  const companyProjectCost = areaConfigs.reduce((sum, config) => {
    const areaValidation = validateSqftInput(config.area);
    const area = areaValidation.sanitizedValue;
    const rate = safeNumber(config.perSqFtRate, 0);
    return sum + (area * rate);
  }, 0);
  
  const marginCost = companyProjectCost * (marginPercentage / 100);
  const actualTotalCost = materialCost + labourCost + marginCost;
  
  return {
    companyProjectCost,
    materialCost,
    labourCost,
    marginCost,
    actualTotalCost
  };
}

/**
 * Safe calculation wrapper that preserves previous state on error
 */
export function safeCalculate<T>(
  calculateFn: () => T,
  previousValue: T,
  onError?: (error: Error) => void
): T {
  try {
    return calculateFn();
  } catch (error) {
    if (onError && error instanceof Error) {
      onError(error);
    }
    console.error('Calculation error, preserving previous state:', error);
    return previousValue;
  }
}

/**
 * Create a debounced calculation function to prevent rapid recalculations
 */
export function createDebouncedCalculation<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastResult: ReturnType<T>;
  
  return ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    return new Promise<ReturnType<T>>((resolve) => {
      timeoutId = setTimeout(() => {
        lastResult = fn(...args);
        resolve(lastResult);
      }, delay);
    });
  }) as unknown as T;
}
