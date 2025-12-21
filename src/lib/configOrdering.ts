/**
 * GLOBAL CONFIGURATION ORDERING
 * Single source of truth for paint configuration display order.
 * 
 * LOCKED ORDER (MVP FINAL):
 * 1. Wall Area
 * 2. Ceiling Area
 * 3. Damp Wall Only Putty (Separate Paint Area)
 * 4. Enamel Area
 * 5. Varnish (Separate Paint Area)
 * 
 * Floor Area is NOT displayed by default (only if explicitly selected).
 * This order applies to ALL sections: Paint Config, Labour, Materials, Summary.
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
 * GLOBAL DISPLAY ORDER ASSIGNMENT (MVP LOCKED)
 * Assigns displayOrder based on area type and section name.
 * This is the SINGLE SOURCE OF TRUTH for ordering.
 * 
 * ORDER:
 * 1 = Wall Area
 * 2 = Ceiling Area
 * 3 = Damp Wall Only Putty (Separate Paint Area)
 * 4 = Enamel Area
 * 5 = Varnish (Separate Enamel Area)
 * 6 = Floor Area (only if explicitly selected)
 * 7 = Other custom sections
 */
export const getGlobalDisplayOrder = (config: OrderableConfig): number => {
  const areaType = (config.areaType || '').toLowerCase();
  const label = (config.label || '').toLowerCase();
  const sectionName = (config.sectionName || '').toLowerCase();
  const isCustomSection = config.isCustomSection || !!config.sectionName;
  
  // 1. Wall Area (main)
  if (!isCustomSection && (areaType === 'wall' || areaType.includes('wall'))) return 1;
  if (!isCustomSection && label.includes('wall') && !label.includes('separate') && !label.includes('damp')) return 1;
  
  // 2. Ceiling Area (main)
  if (!isCustomSection && (areaType === 'ceiling' || areaType.includes('ceiling'))) return 2;
  if (!isCustomSection && label.includes('ceiling') && !label.includes('separate')) return 2;
  
  // 3. Damp Wall Only Putty (Separate Paint Area - priority before enamel)
  if (sectionName.includes('damp') || label.includes('damp')) return 3;
  
  // 4. Enamel Area (main door/window)
  if (!isCustomSection && (areaType === 'enamel' || areaType === 'door & window')) return 4;
  
  // 5. Varnish (Separate Enamel Area - after main enamel)
  if (sectionName.includes('varnish') || label.includes('varnish')) return 5;
  if (isCustomSection && (areaType === 'enamel' || areaType === 'door & window')) return 5;
  
  // 6. Floor Area (only if explicitly selected - lower priority)
  if (areaType === 'floor' || areaType.includes('floor')) return 6;
  if (label.includes('floor') && !label.includes('separate')) return 6;
  
  // 7. Other Separate Paint Areas (after floor)
  if (isCustomSection || label.includes('separate')) return 7;
  
  // 8. Unknown types get lowest priority
  return 8;
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
