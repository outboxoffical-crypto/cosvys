/**
 * GLOBAL CONFIGURATION ORDERING
 * Single source of truth for paint configuration display order.
 * 
 * LOCKED ORDER:
 * 1. Wall Area (main)
 * 2. Ceiling Area (main)
 * 3. Floor Area (main)
 * 4. Separate Paint Area (custom sections like "Damp Wall Only Putty")
 * 5. Enamel Area (main door/window)
 * 6. Separate Enamel Area (custom enamel sections like "Varnish")
 */

export interface OrderableConfig {
  id?: string;
  areaType?: string;
  label?: string;
  sectionName?: string;
  isCustomSection?: boolean;
  displayOrder?: number;
  _creationIndex?: number;
  [key: string]: any;
}

/**
 * GLOBAL DISPLAY ORDER ASSIGNMENT
 * Assigns displayOrder based on area type and whether it's a custom section.
 * This is the SINGLE SOURCE OF TRUTH for ordering.
 */
export const getGlobalDisplayOrder = (config: OrderableConfig): number => {
  const areaType = (config.areaType || '').toLowerCase();
  const label = (config.label || '').toLowerCase();
  const isCustomSection = config.isCustomSection || !!config.sectionName;
  
  // Enamel configurations
  if (areaType === 'enamel' || areaType === 'door & window') {
    // Custom enamel sections (Varnish, etc.) come after main enamel
    if (isCustomSection) return 6;
    return 5; // Main Enamel Area
  }
  
  // Custom/Separate Paint Areas (non-enamel) - priority 4
  if (isCustomSection) return 4;
  
  // Check label for "separate" keyword
  if (label.includes('separate')) return 4;
  
  // Main paint areas by type
  if (areaType === 'wall' || areaType.includes('wall')) return 1;
  if (areaType === 'ceiling' || areaType.includes('ceiling')) return 2;
  if (areaType === 'floor' || areaType.includes('floor')) return 3;
  
  // Check label as fallback
  if (label.includes('wall') && !label.includes('separate')) return 1;
  if (label.includes('ceiling') && !label.includes('separate')) return 2;
  if (label.includes('floor') && !label.includes('separate')) return 3;
  
  // Unknown types get lowest priority
  return 7;
};

/**
 * GLOBAL SORT FUNCTION
 * Sorts configurations by displayOrder ASC, then creationIndex ASC.
 * This is the ONLY allowed sorting method for paint configurations.
 */
export const sortByGlobalDisplayOrder = <T extends OrderableConfig>(configs: T[]): T[] => {
  return [...configs]
    .map((config, index) => ({
      ...config,
      // Assign displayOrder if missing (failsafe)
      displayOrder: config.displayOrder ?? getGlobalDisplayOrder(config),
      // Preserve original creation index as secondary sort
      _creationIndex: config._creationIndex ?? index
    }))
    .sort((a, b) => {
      // PRIMARY: displayOrder ASC
      const orderDiff = (a.displayOrder ?? 7) - (b.displayOrder ?? 7);
      if (orderDiff !== 0) return orderDiff;
      // SECONDARY: creationIndex ASC
      return (a._creationIndex ?? 0) - (b._creationIndex ?? 0);
    });
};

/**
 * Creates a hash of configs for change detection
 * Used to prevent unnecessary re-sorting during render
 * CRITICAL: Must include all properties that affect display conditions (paintingSystem, enamelConfig, etc.)
 */
export const createConfigsHash = (configs: OrderableConfig[]): string => {
  return configs.map(c => `${c.id || ''}-${c.areaType || ''}-${c.displayOrder ?? ''}-${c.paintingSystem || ''}-${c.perSqFtRate || ''}-${c.selectedMaterials?.emulsion || ''}-${JSON.stringify(c.enamelConfig || {})}`).join('|');
};
