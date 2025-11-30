/**
 * Safe calculation utilities with default fallbacks
 * Prevents crashes from null/undefined values
 */

export const safeNumber = (value: any, defaultValue: number = 0): number => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) || !isFinite(num) ? defaultValue : num;
};

export const safeString = (value: any, defaultValue: string = 'Not selected'): string => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  return String(value);
};

export const safeCoverage = (coverageRange: string | null | undefined): number => {
  if (!coverageRange || coverageRange === '') {
    return 0;
  }
  
  // Extract first number from range (e.g., "120-140" -> 120)
  const match = coverageRange.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 0;
};

export const safePrice = (price: any): number => {
  return safeNumber(price, 0);
};

export const safeArray = <T>(value: any, defaultValue: T[] = []): T[] => {
  if (!Array.isArray(value)) {
    return defaultValue;
  }
  return value;
};

export const safeObject = <T extends object>(value: any, defaultValue: T): T => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return defaultValue;
  }
  return value as T;
};

export const calculateMaterialQuantity = (
  area: any,
  coverage: any,
  coats: any
): number => {
  const safeArea = safeNumber(area);
  const safeCoverageValue = safeCoverage(coverage);
  const safeCoats = safeNumber(coats);
  
  if (safeCoverageValue === 0) {
    return 0;
  }
  
  return (safeArea * safeCoats) / safeCoverageValue;
};

export const calculateMaterialCost = (
  quantity: any,
  price: any
): number => {
  const safeQuantity = safeNumber(quantity);
  const safePriceValue = safePrice(price);
  
  return safeQuantity * safePriceValue;
};

export const formatCurrency = (amount: any): string => {
  const safeAmount = safeNumber(amount);
  return `₹${safeAmount.toLocaleString('en-IN')}`;
};

export const formatArea = (area: any): string => {
  const safeAreaValue = safeNumber(area);
  return `${safeAreaValue.toFixed(2)} sq.ft`;
};
