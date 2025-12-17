import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Palette, Home, Users, Package, TrendingUp, DollarSign, Phone, MapPin, Download, Share2, IndianRupee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getPrefetchedData } from "@/hooks/useProjectCache";
import { safeNumber, parseCoverageRange, calculateLabourDays, calculateLabourCost, calculateMaterialQuantity } from "@/lib/calculations";
import LabourCalculationDetails from "@/components/LabourCalculationDetails";
import MaterialCalculationDetails from "@/components/MaterialCalculationDetails";
import { getGlobalDisplayOrder, sortByGlobalDisplayOrder, createConfigsHash } from "@/lib/configOrdering";
interface AreaConfig {
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
export default function GenerateSummaryScreen() {
  const navigate = useNavigate();
  const {
    projectId
  } = useParams();
  const {
    toast
  } = useToast();
  // Paint Configuration Details shows only Paint Estimation configs
  const [areaConfigs, setAreaConfigs] = useState<AreaConfig[]>([]);
  // Labour & Material use Paint Estimation + Room Measurement enamel areas
  const [calculationConfigs, setCalculationConfigs] = useState<AreaConfig[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [dealerMargin, setDealerMargin] = useState(0);
  const [paintType, setPaintType] = useState<string>('Interior');
  const [labourMode, setLabourMode] = useState<'auto' | 'manual'>('auto');
  const [manualDays, setManualDays] = useState<number>(5);
  const [manualDaysInput, setManualDaysInput] = useState<string>('5');
  const [autoLabourPerDay, setAutoLabourPerDay] = useState<number>(1);
  const [autoLabourPerDayInput, setAutoLabourPerDayInput] = useState<string>('1');
  const [activeConfigIndex, setActiveConfigIndex] = useState(0);
  const paintConfigRef = useRef<HTMLDivElement>(null);
  const topSectionRef = useRef<HTMLDivElement>(null);
  const totalMaterialCostRef = useRef<number>(0); // Store total material cost for access across sections
  const totalLabourCostRef = useRef<number>(0); // Store total labour cost for access across sections

  // CRITICAL: Frozen snapshots to prevent mobile incremental rendering from affecting order
  const frozenAreaConfigsRef = useRef<AreaConfig[]>([]);
  const frozenCalculationConfigsRef = useRef<AreaConfig[]>([]);
  const lastAreaConfigsHash = useRef<string>('');
  const lastCalculationConfigsHash = useRef<string>('');
  const perDayLabourCost = 1100; // Fixed per day labour cost in rupees
  const [projectData, setProjectData] = useState<any>(null);
  const [coverageData, setCoverageData] = useState<any>({});
  const [productPricing, setProductPricing] = useState<any>({});

  // Loading states for progressive rendering
  const [isLoadingPaintConfig, setIsLoadingPaintConfig] = useState(true);
  const [isLoadingLabour, setIsLoadingLabour] = useState(true);
  const [isLoadingMaterial, setIsLoadingMaterial] = useState(true);

  // GLOBAL ORDERING: Use centralized sorting from configOrdering.ts
  // Priority: Wall(1) → Ceiling(2) → Floor(3) → Separate(4) → Enamel(5) → Separate Enamel(6)

  // CRITICAL: Frozen snapshots for rendering - prevents mobile reflow from affecting order
  const sortedAreaConfigs = useMemo(() => {
    const configsHash = createConfigsHash(areaConfigs);
    if (configsHash !== lastAreaConfigsHash.current || frozenAreaConfigsRef.current.length === 0) {
      lastAreaConfigsHash.current = configsHash;
      // USE GLOBAL SORTING - Single source of truth
      frozenAreaConfigsRef.current = sortByGlobalDisplayOrder(areaConfigs) as AreaConfig[];
    }
    return frozenAreaConfigsRef.current;
  }, [areaConfigs]);
  const sortedCalculationConfigs = useMemo(() => {
    const configsHash = createConfigsHash(calculationConfigs);
    if (configsHash !== lastCalculationConfigsHash.current || frozenCalculationConfigsRef.current.length === 0) {
      lastCalculationConfigsHash.current = configsHash;
      // USE GLOBAL SORTING - Single source of truth
      frozenCalculationConfigsRef.current = sortByGlobalDisplayOrder(calculationConfigs) as AreaConfig[];
    }
    return frozenCalculationConfigsRef.current;
  }, [calculationConfigs]);
  useEffect(() => {
    loadData();
  }, [projectId]);

  // Scroll to top when component first loads
  useEffect(() => {
    setTimeout(() => {
      topSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  }, []);

  // Progressive loading: handled directly in loadData to avoid extra re-renders

  const loadData = async () => {
    try {
      setIsLoadingPaintConfig(true);
      setIsLoadingLabour(true);
      setIsLoadingMaterial(true);

      // PRIORITY 1: Check for cached backend summary first
      const cachedSummary = localStorage.getItem(`project_summary_${projectId}`);
      if (cachedSummary) {
        try {
          const parsed = JSON.parse(cachedSummary);
          if (parsed.summary) {
            console.log('Using cached backend summary');
            setProjectData(parsed.summary.projectData);
            // Use cached data to skip heavy queries
          }
        } catch (e) {
          console.warn('Failed to parse cached summary:', e);
        }
      }

      // PRIORITY 2: Load only essential data - defer heavy queries
      const loadEssentialData = async () => {
        const {
          data: {
            user: currentUser
          }
        } = await supabase.auth.getUser();

        // Parallel load only what's needed for initial render
        const [coverageResults, dealerData] = await Promise.all([supabase.from('coverage_data').select('product_name, coverage_range, coats, unit'), currentUser ? supabase.from('dealer_info').select('margin').eq('user_id', currentUser.id).maybeSingle() : Promise.resolve({
          data: null
        })]);
        if (coverageResults.data) {
          const coverageMap: any = {};
          coverageResults.data.forEach(item => {
            // Store coverage keyed by product_name + coats for accurate lookup
            const key = `${item.product_name.toLowerCase()}_${item.coats}`;
            // Parse coverage range to get minimum value (e.g., "10-15" -> 10)
            const rangeMatch = item.coverage_range.match(/(\d+)/);
            const minCoverage = rangeMatch ? parseInt(rangeMatch[1], 10) : 0;
            coverageMap[key] = {
              range: item.coverage_range,
              minValue: minCoverage,
              unit: item.unit
            };
            // Also store by product name only for display purposes
            coverageMap[item.product_name.toLowerCase()] = item.coverage_range;
          });
          setCoverageData(coverageMap);
        }
        if (dealerData.data) {
          setDealerMargin(Number(dealerData.data.margin) || 0);
        }
        return currentUser;
      };
      const currentUser = await loadEssentialData();

      // Load project data from Supabase with correct field names
      const {
        data: projectFromDb,
        error: projectError
      } = await supabase.from('projects').select('customer_name, phone, location, project_type').eq('id', projectId).single();
      if (projectFromDb && !projectError) {
        setProjectData({
          customerName: projectFromDb.customer_name,
          mobile: projectFromDb.phone,
          address: projectFromDb.location,
          projectTypes: projectFromDb.project_type ? projectFromDb.project_type.split(',').map((t: string) => t.trim()) : []
        });
      }

      // DEFERRED: Load pricing data in background (not blocking UI)
      setTimeout(async () => {
        if (currentUser) {
          const {
            data: pricingData
          } = await supabase.from('product_pricing').select('product_name, sizes').eq('user_id', currentUser.id);
          if (pricingData) {
            const pricingMap: any = {};
            pricingData.forEach(item => {
              pricingMap[item.product_name.toLowerCase()] = item.sizes;
            });
            setProductPricing(pricingMap);
          }
        }
      }, 50);

      // Load all configurations from estimation data (from cache - instant)
      const estimationKey = `estimation_${projectId}`;
      const estimationStr = localStorage.getItem(estimationKey);
      const storedPaintType = localStorage.getItem(`selected_paint_type_${projectId}`) || 'Interior';
      let paintEstimationConfigs: AreaConfig[] = [];
      if (estimationStr) {
        const est = JSON.parse(estimationStr);
        const pt = est.lastPaintType || storedPaintType;
        setPaintType(pt);

        // Combine all configurations from all paint types
        const allConfigs: AreaConfig[] = [];

        // Add Interior configurations with type marker
        if (Array.isArray(est.interiorConfigurations) && est.interiorConfigurations.length > 0) {
          est.interiorConfigurations.forEach((config: any) => {
            allConfigs.push({
              ...config,
              paintTypeCategory: 'Interior'
            });
          });
        }

        // Add Exterior configurations with type marker
        if (Array.isArray(est.exteriorConfigurations) && est.exteriorConfigurations.length > 0) {
          est.exteriorConfigurations.forEach((config: any) => {
            allConfigs.push({
              ...config,
              paintTypeCategory: 'Exterior'
            });
          });
        }

        // Add Waterproofing configurations with type marker
        if (Array.isArray(est.waterproofingConfigurations) && est.waterproofingConfigurations.length > 0) {
          est.waterproofingConfigurations.forEach((config: any) => {
            allConfigs.push({
              ...config,
              paintTypeCategory: 'Waterproofing'
            });
          });
        }
        console.log('Loaded all configs from estimation:', allConfigs.length);
        paintEstimationConfigs = allConfigs;
        setAreaConfigs(sortByGlobalDisplayOrder(allConfigs) as AreaConfig[]);
      } else {
        // Fallback to per-type saved configs while still on estimation screen
        const pt = storedPaintType;
        setPaintType(pt);
        const paintConfigs = localStorage.getItem(`paint_configs_${projectId}_${pt}`);
        const preservedConfigs = localStorage.getItem(`configs_preserved_${projectId}_${pt}`);
        let configs: any[] = [];
        if (paintConfigs) {
          configs = JSON.parse(paintConfigs);
        } else if (preservedConfigs) {
          configs = JSON.parse(preservedConfigs);
        }
        // Add paint type marker to fallback configs
        configs = configs.map(c => ({
          ...c,
          paintTypeCategory: pt
        }));
        console.log('Loaded fallback configs:', configs);
        paintEstimationConfigs = Array.isArray(configs) ? configs : [];
        setAreaConfigs(sortByGlobalDisplayOrder(Array.isArray(configs) ? configs : []) as AreaConfig[]);
      }

      // OPTIMIZED: Load only essential room fields (not full pictures/opening arrays)
      // Order by created_at to preserve Room Measurements order
      const {
        data: roomsData
      } = await supabase.from('rooms').select('id, name, project_type, floor_area, wall_area, adjusted_wall_area, ceiling_area, total_door_window_grill_area, selected_areas, section_name, created_at').eq('project_id', projectId).order('created_at', {
        ascending: true
      });
      if (roomsData) {
        setRooms(roomsData);

        // Create enamel configurations from door/window/grill areas for calculations only
        const enamelConfigs: AreaConfig[] = [];
        roomsData.forEach(room => {
          const enamelArea = Number(room.total_door_window_grill_area || 0);
          if (enamelArea > 0) {
            const displayName = room.section_name || room.name;
            // Check if user selected enamel configuration in Paint Estimation
            // Look for matching enamel config in paintEstimationConfigs
            const isSeparateEnamel = room.section_name && room.section_name.toLowerCase().includes('varnish');
            const isMainEnamel = !room.section_name || !isSeparateEnamel;

            // Match by label, name, section_name, OR by isCustomSection flag
            const matchingEnamelConfig = paintEstimationConfigs.find(cfg => {
              if (cfg.areaType !== 'Enamel') return false;

              // Direct label/name match
              if (cfg.label === displayName || cfg.label === room.name) return true;
              if (cfg.sectionName === room.section_name && room.section_name) return true;

              // For main enamel areas - match configs without custom section flag
              if (isMainEnamel && !cfg.sectionName && cfg.label?.toLowerCase().includes('enamel area')) {
                return true;
              }

              // For separate/varnish areas - match by section name containing 'varnish'
              if (isSeparateEnamel && cfg.sectionName?.toLowerCase().includes('varnish')) {
                return true;
              }
              return false;
            });
            console.log('Enamel matching for room:', room.name, 'displayName:', displayName, 'found config:', matchingEnamelConfig?.label, 'coats:', matchingEnamelConfig?.coatConfiguration?.emulsion);

            // Use enamel config from Paint Estimation if available
            let enamelPrimer = '';
            let enamelPrimerCoats = 0;
            let enamelEmulsion = 'AP Apcolite Premium Gloss Enamel';
            let enamelEmulsionCoats = 1; // Default to 1 coat, not 2

            if (matchingEnamelConfig?.enamelConfig) {
              // User configured enamel in Paint Estimation - use their selections
              enamelPrimer = matchingEnamelConfig.enamelConfig.primerType || '';
              // Use nullish coalescing to preserve 0 and 1 values
              enamelPrimerCoats = matchingEnamelConfig.enamelConfig.primerCoats ?? 0;
              enamelEmulsion = matchingEnamelConfig.enamelConfig.enamelType || 'AP Apcolite Premium Gloss Enamel';
              enamelEmulsionCoats = matchingEnamelConfig.enamelConfig.enamelCoats ?? 1;
            } else if (matchingEnamelConfig?.selectedMaterials) {
              // Fallback to selectedMaterials if no enamelConfig
              // Only use primer if explicitly set (not empty)
              if (matchingEnamelConfig.selectedMaterials.primer && matchingEnamelConfig.selectedMaterials.primer !== '') {
                enamelPrimer = matchingEnamelConfig.selectedMaterials.primer;
                enamelPrimerCoats = matchingEnamelConfig.coatConfiguration?.primer ?? 0;
              }
              enamelEmulsion = matchingEnamelConfig.selectedMaterials.emulsion || 'AP Apcolite Premium Gloss Enamel';
              enamelEmulsionCoats = matchingEnamelConfig.coatConfiguration?.emulsion ?? 1;
            } else if (matchingEnamelConfig?.coatConfiguration) {
              // Direct coatConfiguration access
              enamelEmulsionCoats = matchingEnamelConfig.coatConfiguration.emulsion ?? 1;
              enamelEmulsion = matchingEnamelConfig.selectedMaterials?.emulsion || 'AP Apcolite Premium Gloss Enamel';
            }
            enamelConfigs.push({
              id: `enamel_${room.id}`,
              areaType: 'Door & Window',
              paintingSystem: 'Fresh Painting',
              area: enamelArea,
              perSqFtRate: '0',
              // Always prefer section name (e.g., "Varnish") over room name
              sectionName: room.section_name || undefined,
              label: displayName,
              paintTypeCategory: room.project_type as 'Interior' | 'Exterior' | 'Waterproofing',
              selectedMaterials: {
                putty: '',
                // Only use primer if user explicitly selected one (not hardcoded)
                primer: enamelPrimer,
                // Use actual enamel topcoat product name
                emulsion: enamelEmulsion
              },
              coatConfiguration: {
                putty: 0,
                // Only show primer coats if user selected primer
                primer: enamelPrimerCoats,
                emulsion: enamelEmulsionCoats
              }
            });
          }
        });

        // Before setting, filter out area types that have 0 selected area in Room Measurements
        const selectedTotalsByType: Record<string, {
          floor: number;
          wall: number;
          ceiling: number;
        }> = {};
        ['Interior', 'Exterior', 'Waterproofing'].forEach(t => {
          selectedTotalsByType[t] = {
            floor: 0,
            wall: 0,
            ceiling: 0
          };
        });
        roomsData.forEach(room => {
          const sel = typeof room.selected_areas === 'object' && room.selected_areas !== null && !Array.isArray(room.selected_areas) ? room.selected_areas as any : {
            floor: false,
            wall: true,
            ceiling: false
          };
          const type = room.project_type || 'Interior';
          if (!selectedTotalsByType[type]) selectedTotalsByType[type] = {
            floor: 0,
            wall: 0,
            ceiling: 0
          };
          if (sel.floor) selectedTotalsByType[type].floor += Number(room.floor_area || 0);
          if (sel.wall) selectedTotalsByType[type].wall += Number(room.adjusted_wall_area || room.wall_area || 0);
          if (sel.ceiling) selectedTotalsByType[type].ceiling += Number(room.ceiling_area || 0);
        });
        const filteredPaintConfigs = (paintEstimationConfigs || []).filter(cfg => {
          const type = cfg.paintTypeCategory || 'Interior';
          if (cfg.areaType === 'Floor') return (selectedTotalsByType[type]?.floor || 0) > 0;
          if (cfg.areaType === 'Wall') return (selectedTotalsByType[type]?.wall || 0) > 0;
          if (cfg.areaType === 'Ceiling') return (selectedTotalsByType[type]?.ceiling || 0) > 0;
          return true;
        });

        // Update both areaConfigs and calculationConfigs with filtered and SORTED list
        // Main Areas (Wall/Ceiling/Floor) FIRST, Separate Paint Areas LAST
        setAreaConfigs(sortByGlobalDisplayOrder(filteredPaintConfigs) as AreaConfig[]);
        setCalculationConfigs(sortByGlobalDisplayOrder([...filteredPaintConfigs, ...enamelConfigs]) as AreaConfig[]);
      } else {
        // If no rooms data, just use paint estimation configs (sorted)
        setCalculationConfigs(sortByGlobalDisplayOrder(paintEstimationConfigs) as AreaConfig[]);
      }

      // Load dealer info
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (user) {
        const {
          data: dealerData
        } = await supabase.from('dealer_info').select('margin').eq('user_id', user.id).single();
        if (dealerData) setDealerMargin(Number(dealerData.margin) || 0);
      }

      // All data loaded successfully
      setIsLoadingPaintConfig(false);
      setIsLoadingLabour(false);
      setIsLoadingMaterial(false);
    } catch (error) {
      console.error('Error loading data:', error);
      // Ensure loading states are cleared even on error
      setIsLoadingPaintConfig(false);
      setIsLoadingLabour(false);
      setIsLoadingMaterial(false);
    }
  };

  // Section 1: Type of Interior & Wall Full Details
  const renderTypeDetails = () => {
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const container = e.currentTarget;
      const scrollLeft = container.scrollLeft;
      const cardWidth = 288 + 16; // 72 * 4 (w-72) + gap-4
      const newIndex = Math.round(scrollLeft / cardWidth);
      setActiveConfigIndex(newIndex);
    };

    // CRITICAL: Use frozen sortedAreaConfigs - NO re-sorting during render
    // This prevents mobile incremental rendering from affecting order

    // Group configurations by paint type - exclude Enamel from paint configs
    // Order is already frozen in sortedAreaConfigs
    const interiorConfigs = sortedAreaConfigs.filter(c => c.paintTypeCategory === 'Interior' && c.areaType !== 'Enamel');
    const exteriorConfigs = sortedAreaConfigs.filter(c => c.paintTypeCategory === 'Exterior' && c.areaType !== 'Enamel');
    const waterproofingConfigs = sortedAreaConfigs.filter(c => c.paintTypeCategory === 'Waterproofing' && c.areaType !== 'Enamel');
    // Get Enamel configs - order preserved from frozen snapshot
    const enamelConfigs = sortedAreaConfigs.filter(c => c.areaType === 'Enamel');
    const renderConfigGroup = (configs: AreaConfig[], typeLabel: string) => {
      if (configs.length === 0) return null;
      return <div key={typeLabel} className="space-y-3 mb-6">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {typeLabel}
            </Badge>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
            {configs.map(config => {
            const area = Number(config.area) || 0;
            const rate = parseFloat(config.perSqFtRate) || 0;
            const totalCost = area * rate;

            // Get coat details in proper format
            const getCoatDetails = () => {
              if (config.paintingSystem === 'Fresh Painting') {
                const parts = [];
                if (config.coatConfiguration.putty > 0) {
                  parts.push(`${config.coatConfiguration.putty} coat${config.coatConfiguration.putty > 1 ? 's' : ''} of ${config.selectedMaterials.putty || 'Putty'}`);
                }
                if (config.coatConfiguration.primer > 0) {
                  parts.push(`${config.coatConfiguration.primer} coat${config.coatConfiguration.primer > 1 ? 's' : ''} of ${config.selectedMaterials.primer || 'Primer'}`);
                }
                if (config.coatConfiguration.emulsion > 0) {
                  parts.push(`${config.coatConfiguration.emulsion} coat${config.coatConfiguration.emulsion > 1 ? 's' : ''} of ${config.selectedMaterials.emulsion || 'Emulsion'}`);
                }
                return parts.join(' + ');
              } else {
                const parts = [];
                if (config.repaintingConfiguration?.primer > 0) {
                  parts.push(`${config.repaintingConfiguration.primer} coat${config.repaintingConfiguration.primer > 1 ? 's' : ''} of ${config.selectedMaterials.primer || 'Primer'}`);
                }
                if (config.repaintingConfiguration?.emulsion > 0) {
                  parts.push(`${config.repaintingConfiguration.emulsion} coat${config.repaintingConfiguration.emulsion > 1 ? 's' : ''} of ${config.selectedMaterials.emulsion || 'Emulsion'}`);
                }
                return parts.join(' + ');
              }
            };
            return <Card key={config.id} className="flex-none w-72 border-2 border-primary/20 bg-primary/5 snap-start">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header with Type Badge */}
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-base">{config.label || config.areaType}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {config.paintTypeCategory || typeLabel}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Paint Type</p>
                        <p className="font-medium">{config.selectedMaterials.emulsion || config.areaType}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Painting System</p>
                        <p className="font-medium">{config.paintingSystem || '-'}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Coats</p>
                        <p className="font-medium text-sm leading-relaxed">{getCoatDetails() || 'Not configured'}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Area</p>
                          <p className="font-medium">{area.toFixed(2)} Sq.ft</p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Rate/Sq.ft</p>
                          <p className="font-medium">₹{rate.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-primary/20">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Total Cost</p>
                          <p className="font-semibold text-lg text-primary">₹{totalCost.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>;
          })}
          </div>
        </div>;
    };

    // Render Enamel config group with yellow/orange styling
    const renderEnamelConfigGroup = () => {
      if (enamelConfigs.length === 0) return null;
      return <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
              Enamel Paint Configurations
            </Badge>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
            {enamelConfigs.map(config => {
            const area = Number(config.area) || 0;
            const rate = parseFloat(config.perSqFtRate) || 0;
            const totalCost = area * rate;

            // Get enamel coat details from enamelConfig
            const getEnamelCoatDetails = () => {
              const parts = [];
              if (config.enamelConfig?.primerCoats && config.enamelConfig.primerCoats > 0) {
                parts.push(`${config.enamelConfig.primerCoats} coat${config.enamelConfig.primerCoats > 1 ? 's' : ''} of ${config.enamelConfig.primerType || 'Primer'}`);
              }
              if (config.enamelConfig?.enamelCoats && config.enamelConfig.enamelCoats > 0) {
                parts.push(`${config.enamelConfig.enamelCoats} coat${config.enamelConfig.enamelCoats > 1 ? 's' : ''} of ${config.enamelConfig.enamelType || 'Enamel'}`);
              }
              return parts.length > 0 ? parts.join(' + ') : 'Not configured';
            };
            return <Card key={config.id} className="flex-none w-72 border-2 border-orange-500/30 bg-orange-50/50 dark:bg-orange-950/20 snap-start">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header with Type Badge */}
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-base">{config.sectionName || config.label || 'Door & Window'}</h3>
                        <Badge variant="secondary" className="text-xs bg-orange-500/20 text-orange-700 dark:text-orange-300">
                          Enamel
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Enamel Type</p>
                        <p className="font-medium">{config.enamelConfig?.enamelType || 'Not Selected'}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Painting System</p>
                        <p className="font-medium">{config.paintingSystem || 'Fresh Painting'}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Coats</p>
                        <p className="font-medium text-sm leading-relaxed">{getEnamelCoatDetails()}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Area</p>
                          <p className="font-medium">{area.toFixed(2)} Sq.ft</p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Rate/Sq.ft</p>
                          <p className="font-medium">₹{rate.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-orange-500/30">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Total Cost</p>
                          <p className="font-semibold text-lg text-orange-600">₹{totalCost.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>;
          })}
          </div>
        </div>;
    };

    // Calculate total project cost from all configurations
    const totalProjectCost = areaConfigs.reduce((sum, config) => {
      const area = Number(config.area) || 0;
      const rate = parseFloat(config.perSqFtRate) || 0;
      return sum + area * rate;
    }, 0);
    return <Card className="eca-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Palette className="h-5 w-5 text-primary" />
            Paint Configuration Details
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">All configured paint types</p>
        </CardHeader>
        <CardContent>
          {isLoadingPaintConfig ? <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Loading configurations...</p>
              </div>
            </div> : areaConfigs.length === 0 ? <div className="text-sm text-muted-foreground p-4 border rounded-md bg-muted/30">
              No paint configurations found. Please add them in Paint Estimation and click Generate Summary.
            </div> : <div className="space-y-4">
              {renderConfigGroup(interiorConfigs, 'Interior Paint Configurations')}
              {renderConfigGroup(exteriorConfigs, 'Exterior Paint Configurations')}
              {renderConfigGroup(waterproofingConfigs, 'Waterproofing Configurations')}
              {renderEnamelConfigGroup()}
              
              {/* Total Project Cost Summary */}
              {areaConfigs.length > 0 && <Card className="border-2 border-primary bg-primary/5 mt-4">
                  <CardContent className="p-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Project Cost</p>
                      <p className="text-2xl font-bold text-primary">₹{totalProjectCost.toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>}
            </div>}
        </CardContent>
      </Card>;
  };

  // Section 2: Total Room Details
  const renderRoomDetails = () => {
    let totalFloor = 0;
    let totalWall = 0;
    let totalCeiling = 0;
    rooms.forEach(room => {
      const selectedAreas = room.selected_areas || {
        floor: false,
        wall: true,
        ceiling: false
      };
      if (selectedAreas.floor) totalFloor += Number(room.floor_area || 0);
      if (selectedAreas.wall) totalWall += Number(room.adjusted_wall_area || room.wall_area || 0);
      if (selectedAreas.ceiling) totalCeiling += Number(room.ceiling_area || 0);
    });

    // Group rooms by project type
    const roomsByType: {
      [key: string]: any[];
    } = {};
    const projectTypes = ['Interior', 'Exterior', 'Waterproofing'];
    projectTypes.forEach(type => {
      roomsByType[type] = rooms.filter(room => room.project_type === type);
    });

    // Get enamel areas (door/window/grill) grouped by room
    const enamelAreas: {
      [roomId: string]: number;
    } = {};
    rooms.forEach(room => {
      const dwgArea = Number(room.total_door_window_grill_area || 0);
      if (dwgArea > 0) {
        enamelAreas[room.id] = dwgArea;
      }
    });
    return <Card className="eca-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Home className="h-5 w-5 text-primary" />
            Total Room Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Individual Rooms by Project Type */}
            <div className="space-y-2">
              <p className="font-semibold text-foreground text-sm mb-4">Individual Rooms</p>
              
              {/* Group by project type */}
              {projectTypes.map(projectType => {
              const typeRooms = roomsByType[projectType];
              if (!typeRooms || typeRooms.length === 0) return null;

              // Filter out rooms that only have enamel areas (no floor/wall/ceiling selected)
              const filteredRooms = typeRooms.filter(room => {
                const selectedAreas = room.selected_areas || {
                  floor: false,
                  wall: false,
                  ceiling: false
                };
                // Only include rooms that have at least one of floor/wall/ceiling selected
                return selectedAreas.floor || selectedAreas.wall || selectedAreas.ceiling;
              });
              if (filteredRooms.length === 0) return null;
              return <div key={projectType} className="space-y-2">
                    {/* Project Type Header */}
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {projectType}
                      </Badge>
                    </div>
                    
                    {/* Rooms under this type */}
                    <div className="space-y-3">
                      {filteredRooms.map(room => {
                    const selectedAreas = room.selected_areas || {
                      floor: false,
                      wall: true,
                      ceiling: false
                    };
                    const floorArea = Number(room.floor_area || 0);
                    const wallArea = Number(room.adjusted_wall_area || room.wall_area || 0);
                    const ceilingArea = Number(room.ceiling_area || 0);
                    return <div key={room.id} className="group relative bg-card rounded border-l-2 border-primary hover:border-l-4 eca-shadow hover:eca-shadow-medium eca-transition p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6">
                              <div className="flex-shrink-0">
                                <h3 className="font-bold text-xs sm:text-sm tracking-wider text-foreground">
                                  {room.name}
                                </h3>
                              </div>
                              
                              <div className="flex items-center justify-between gap-2 sm:gap-4 flex-1 sm:ml-auto sm:max-w-md">
                                {selectedAreas.floor && <div className="text-center flex-1">
                                    <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5 sm:mb-1">FLOOR</p>
                                    <p className="text-base sm:text-xl md:text-2xl font-bold text-foreground leading-none">
                                      {floorArea.toFixed(2)}
                                    </p>
                                  </div>}
                                
                                {selectedAreas.wall && <div className="text-center flex-1">
                                    <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5 sm:mb-1">WALL</p>
                                    <p className="text-base sm:text-xl md:text-2xl font-bold text-foreground leading-none">
                                      {wallArea.toFixed(2)}
                                    </p>
                                  </div>}
                                
                                {selectedAreas.ceiling && <div className="text-center flex-1">
                                    <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5 sm:mb-1">CEILING</p>
                                    <p className="text-base sm:text-xl md:text-2xl font-bold text-foreground leading-none">
                                      {ceilingArea.toFixed(2)}
                                    </p>
                                  </div>}
                              </div>
                            </div>
                          </div>;
                  })}
                    </div>
                  </div>;
            })}
              
              {/* Enamel Areas (Door/Window/Grill) - Separate Section */}
              {Object.keys(enamelAreas).length > 0 && <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                      Enamel (Door & Window)
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {Object.entries(enamelAreas).map(([roomId, area]) => {
                  const room = rooms.find(r => r.id === roomId);
                  if (!room) return null;
                  // Show section_name if exists, otherwise just room name (not "Door & Window")
                  const displayName = room.section_name || room.name;
                  return <div key={roomId} className="group relative bg-card rounded border-l-2 border-orange-500 hover:border-l-4 eca-shadow hover:eca-shadow-medium eca-transition p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6">
                            <div className="flex-shrink-0">
                              <h3 className="font-bold text-xs sm:text-sm tracking-wider text-foreground">
                                {displayName}
                              </h3>
                            </div>
                            
                            <div className="flex items-center justify-end gap-2 sm:gap-4 flex-1 sm:ml-auto sm:max-w-md">
                              <div className="text-center flex-1">
                                <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5 sm:mb-1">ENAMEL AREA</p>
                                <p className="text-base sm:text-xl md:text-2xl font-bold text-orange-600 leading-none">
                                  {area.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>;
                })}
                  </div>
                </div>}
            </div>

          </div>
        </CardContent>
      </Card>;
  };

  // Section 3: Labour Section
  const renderLabourSection = () => {
    const workingHours = 7;
    const standardHours = 8;
    const numberOfLabours = 1;

    // FIXED Labour Working Process rates per labour per day (8 hrs)
    // These are standard rates - NOT system assumptions
    const coverageRates = {
      waterBased: {
        putty: 400,
        // FIXED: 400 sq.ft/day for Putty (Interior/Exterior)
        interiorPrimer: 700,
        // FIXED: 700 sq.ft/day for Interior Primer
        exteriorPrimer: 550,
        // FIXED: 550 sq.ft/day for Exterior Primer
        interiorEmulsion: 700,
        // FIXED: 700 sq.ft/day for Interior Emulsion (1 coat)
        exteriorEmulsion: 550 // FIXED: 550 sq.ft/day for Exterior Emulsion (1 coat)
      },
      oilBased: {
        redOxide: 300,
        // Enamel Red Oxide Metal Primer
        enamelBase: 250,
        // Enamel Wood Primer
        enamelTop: 280,
        // Apcolite Enamel Topcoat
        full3Coat: 275
      }
    };

    // Group tasks by configuration - USE FROZEN SNAPSHOT
    const configTasks: any[] = [];
    sortedCalculationConfigs.forEach(config => {
      const area = Number(config.area) || 0;
      const isFresh = config.paintingSystem === 'Fresh Painting';

      // Determine if water-based or oil-based
      const isOilBased = config.selectedMaterials.emulsion?.toLowerCase().includes('enamel') || config.selectedMaterials.primer?.toLowerCase().includes('oxide') || config.selectedMaterials.emulsion?.toLowerCase().includes('oil');
      const tasks: any[] = [];
      if (isFresh) {
        // Putty
        if (config.coatConfiguration.putty > 0) {
          const totalWork = area * config.coatConfiguration.putty;
          const adjustedCoverage = coverageRates.waterBased.putty * (workingHours / standardHours);
          const daysRequired = Math.ceil(totalWork / (adjustedCoverage * numberOfLabours));
          tasks.push({
            name: config.selectedMaterials.putty || 'Putty',
            area,
            coats: config.coatConfiguration.putty,
            totalWork,
            coverage: coverageRates.waterBased.putty,
            daysRequired
          });
        }

        // Primer
        if (config.coatConfiguration.primer > 0) {
          const totalWork = area * config.coatConfiguration.primer;
          // Use enamel base coat coverage for enamel primer
          const isEnamel = config.selectedMaterials.primer?.toLowerCase().includes('enamel') || config.selectedMaterials.emulsion?.toLowerCase().includes('enamel');
          const isExterior = config.paintTypeCategory === 'Exterior';
          // Use category-specific primer rates: Interior=700, Exterior=550
          const primerRate = isExterior ? coverageRates.waterBased.exteriorPrimer : coverageRates.waterBased.interiorPrimer;
          const coverage = isEnamel ? coverageRates.oilBased.enamelBase : isOilBased ? coverageRates.oilBased.redOxide : primerRate;
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

        // Emulsion/Paint
        if (config.coatConfiguration.emulsion > 0) {
          const totalWork = area * config.coatConfiguration.emulsion;
          const isEnamel = config.selectedMaterials.emulsion?.toLowerCase().includes('enamel');
          const isExterior = config.paintTypeCategory === 'Exterior';
          // Use category-specific emulsion rates: Interior=700, Exterior=550
          const emulsionRate = isExterior ? coverageRates.waterBased.exteriorEmulsion : coverageRates.waterBased.interiorEmulsion;
          const coverage = isEnamel ? coverageRates.oilBased.enamelTop : isOilBased ? coverageRates.oilBased.enamelTop : emulsionRate;
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
          const primerRate = isExterior ? coverageRates.waterBased.exteriorPrimer : coverageRates.waterBased.interiorPrimer;
          const coverage = isOilBased ? coverageRates.oilBased.redOxide : primerRate;
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
          const emulsionRate = isExterior ? coverageRates.waterBased.exteriorEmulsion : coverageRates.waterBased.interiorEmulsion;
          const coverage = isOilBased ? coverageRates.oilBased.enamelTop : emulsionRate;
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
      // Identify if this is an enamel configuration (Door & Window)
      const isEnamel = config.areaType === 'Door & Window' || config.label?.toLowerCase().includes('enamel') || config.selectedMaterials?.emulsion?.toLowerCase().includes('enamel');
      configTasks.push({
        configLabel: config.label || config.areaType,
        paintTypeCategory: config.paintTypeCategory,
        tasks,
        totalDays: tasks.reduce((sum, task) => sum + task.daysRequired, 0),
        isEnamel
      });
    });
    const totalDays = configTasks.reduce((sum, ct) => sum + ct.totalDays, 0);
    const allTasks = configTasks.flatMap(ct => ct.tasks);

    // Calculate labourers needed for manual mode
    const totalWorkAllTasks = allTasks.reduce((sum, task) => sum + task.totalWork, 0);
    const averageCoverage = allTasks.length > 0 ? allTasks.reduce((sum, task) => sum + task.coverage, 0) / allTasks.length : 1000;
    const adjustedAverageCoverage = averageCoverage * (workingHours / standardHours);
    const laboursNeeded = manualDays > 0 ? Math.ceil(totalWorkAllTasks / (adjustedAverageCoverage * manualDays)) : 1;

    // Calculate displayDays as SUM of individual card days (ceiling each first, then sum)
    // This ensures Total Project Duration = sum of all individual card "Total Days"
    // Only count non-enamel configs here (enamel has separate calculation)
    const nonEnamelDisplayDays = configTasks.filter(ct => !ct.isEnamel && ct.totalDays > 0).reduce((sum, ct) => sum + Math.ceil(ct.totalDays / autoLabourPerDay), 0);

    // For enamel, calculate aggregated days using same formula as enamel section
    const enamelPrimerRate = 300; // Standard enamel primer rate
    const enamelTopcoatRate = 280; // Standard enamel topcoat rate

    // Get enamel configs
    const enamelConfigs = configTasks.filter(ct => ct.isEnamel);
    let enamelTotalDays = 0;
    if (enamelConfigs.length > 0) {
      // Aggregate all enamel areas and calculate days
      const totalEnamelWork = enamelConfigs.reduce((sum, ct) => {
        const taskWork = ct.tasks.reduce((tSum: number, task: any) => tSum + (task.totalWork || 0), 0);
        return sum + taskWork;
      }, 0);
      enamelTotalDays = Math.ceil(totalEnamelWork / (enamelTopcoatRate * autoLabourPerDay));
    }
    const displayDays = labourMode === 'auto' ? nonEnamelDisplayDays + enamelTotalDays : manualDays;
    const displayLabours = labourMode === 'auto' ? autoLabourPerDay : laboursNeeded;

    // Update ref with total labour cost for use in Actual Total Project Cost section
    totalLabourCostRef.current = displayLabours * displayDays * perDayLabourCost;
    return <Card className="eca-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Users className="h-5 w-5 text-primary" />
            Labour Calculation
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Based on {workingHours} working hours per day</p>
        </CardHeader>
        <CardContent>
          {isLoadingLabour ? <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Calculating labour requirements...</p>
              </div>
            </div> : <div className="space-y-3">
            {/* Mode Selector */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
              <Button variant={labourMode === 'auto' ? 'default' : 'ghost'} size="sm" onClick={() => setLabourMode('auto')} className="text-xs">
                Auto
              </Button>
              <Button variant={labourMode === 'manual' ? 'default' : 'ghost'} size="sm" onClick={() => setLabourMode('manual')} className="text-xs">
                Manual
              </Button>
            </div>

            {/* Auto Mode - Per Day Labour Input */}
            {labourMode === 'auto' && <div className="p-3 border border-border rounded-lg bg-muted/30">
                <label className="text-sm font-medium mb-2 block text-foreground">Per Day Labour</label>
                <input type="number" min="1" value={autoLabourPerDayInput} onChange={e => {
              const value = e.target.value;
              setAutoLabourPerDayInput(value);
              const numValue = parseInt(value, 10);
              if (!isNaN(numValue) && numValue > 0) {
                setAutoLabourPerDay(numValue);
              }
            }} onBlur={() => {
              const numValue = parseInt(autoLabourPerDayInput, 10);
              if (isNaN(numValue) || numValue < 1) {
                setAutoLabourPerDay(1);
                setAutoLabourPerDayInput('1');
              } else {
                setAutoLabourPerDay(numValue);
                setAutoLabourPerDayInput(String(numValue));
              }
            }} className="w-full px-3 py-2 border border-input-border rounded text-sm bg-background" />
                <p className="text-xs text-muted-foreground mt-2">
                  Number of labourers you can arrange per day
                </p>
              </div>}

            {/* Manual Days Input */}
            {labourMode === 'manual' && <div className="p-3 border border-border rounded-lg bg-muted/30">
                <label className="text-sm font-medium mb-2 block text-foreground">Desired Completion Days</label>
                <input type="number" min="1" value={manualDaysInput} onChange={e => {
              const value = e.target.value;
              setManualDaysInput(value);
              const numValue = parseInt(value, 10);
              if (!isNaN(numValue) && numValue > 0) {
                setManualDays(numValue);
              }
            }} onBlur={() => {
              const numValue = parseInt(manualDaysInput, 10);
              if (isNaN(numValue) || numValue < 1) {
                setManualDays(1);
                setManualDaysInput('1');
              } else {
                setManualDays(numValue);
                setManualDaysInput(String(numValue));
              }
            }} className="w-full px-3 py-2 border border-input-border rounded text-sm bg-background" />
                <p className="text-xs text-muted-foreground mt-2">
                  Labourers needed: <span className="font-semibold text-primary">{laboursNeeded}</span> per day
                </p>
              </div>}
            {/* Labour Calculation Breakdown - Grouped by Type */}
            {labourMode === 'auto' && configTasks.length > 0 && <div className="space-y-4">
                <p className="font-semibold text-sm text-foreground">Labour Calculation Breakdown</p>
                
                {/* Interior Configurations - Exclude Enamel */}
                {configTasks.filter(ct => ct.paintTypeCategory === 'Interior' && ct.totalDays > 0 && !ct.isEnamel).length > 0 && <div className="space-y-3">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      Interior Paint Configurations
                    </Badge>
                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}>
                      {configTasks.filter(ct => ct.paintTypeCategory === 'Interior' && ct.totalDays > 0 && !ct.isEnamel).map((configTask, index) => {
                  return <Card key={index} className="flex-none w-72 border-2 snap-start border-primary/20 bg-primary/5">
                          <CardContent className="p-4">
                            <div className="space-y-4">
                              {/* Header with Type Badge */}
                              <div className="flex items-center justify-between pb-2 border-b border-primary/10">
                                <h3 className="font-semibold text-base">{configTask.configLabel}</h3>
                                <Badge variant="secondary" className="text-xs">
                                  Interior
                                </Badge>
                              </div>
                              
                              {/* Tasks List */}
                              <div className="space-y-3">
                                {configTask.tasks.map((task: any, taskIdx: number) => <LabourCalculationDetails key={taskIdx} task={task} workingHours={workingHours} standardHours={standardHours} numberOfLabours={numberOfLabours} autoLabourPerDay={autoLabourPerDay} />)}
                              </div>
                              
                              {/* Total Days */}
                              <div className="pt-3 border-t-2 border-primary/20">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-muted-foreground">Total Days:</p>
                                  <p className="text-2xl font-bold text-primary">{Math.ceil(configTask.totalDays / autoLabourPerDay)} days</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>;
                })}
                      
                    </div>
                  </div>}

                {/* Exterior Configurations - Exclude Enamel */}
                {configTasks.filter(ct => ct.paintTypeCategory === 'Exterior' && ct.totalDays > 0 && !ct.isEnamel).length > 0 && <div className="space-y-3">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      Exterior Paint Configurations
                    </Badge>
                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}>
                      {configTasks.filter(ct => ct.paintTypeCategory === 'Exterior' && ct.totalDays > 0 && !ct.isEnamel).map((configTask, index) => {
                  return <Card key={index} className="flex-none w-72 border-2 snap-start border-primary/20 bg-primary/5">
                          <CardContent className="p-4">
                            <div className="space-y-4">
                              {/* Header with Type Badge */}
                              <div className="flex items-center justify-between pb-2 border-b border-primary/10">
                                <h3 className="font-semibold text-base">{configTask.configLabel}</h3>
                                <Badge variant="secondary" className="text-xs">
                                  Exterior
                                </Badge>
                              </div>
                              
                              {/* Tasks List */}
                              <div className="space-y-3">
                                {configTask.tasks.map((task: any, taskIdx: number) => <LabourCalculationDetails key={taskIdx} task={task} workingHours={workingHours} standardHours={standardHours} numberOfLabours={numberOfLabours} autoLabourPerDay={autoLabourPerDay} />)}
                              </div>
                              
                              {/* Total Days */}
                              <div className="pt-3 border-t-2 border-primary/20">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-muted-foreground">Total Days:</p>
                                  <p className="text-2xl font-bold text-primary">{Math.ceil(configTask.totalDays / autoLabourPerDay)} days</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>;
                })}
                      
                    </div>
                  </div>}

                {/* Waterproofing Configurations - Exclude Enamel */}
                {configTasks.filter(ct => ct.paintTypeCategory === 'Waterproofing' && ct.totalDays > 0 && !ct.isEnamel).length > 0 && <div className="space-y-3">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      Waterproofing Configurations
                    </Badge>
                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}>
                      {configTasks.filter(ct => ct.paintTypeCategory === 'Waterproofing' && ct.totalDays > 0 && !ct.isEnamel).map((configTask, index) => {
                  return <Card key={index} className="flex-none w-72 border-2 snap-start border-primary/20 bg-primary/5">
                          <CardContent className="p-4">
                            <div className="space-y-4">
                              {/* Header with Type Badge */}
                              <div className="flex items-center justify-between pb-2 border-b border-primary/10">
                                <h3 className="font-semibold text-base">{configTask.configLabel}</h3>
                                <Badge variant="secondary" className="text-xs">
                                  Waterproofing
                                </Badge>
                              </div>
                              
                              {/* Tasks List */}
                              <div className="space-y-3">
                                {configTask.tasks.map((task: any, taskIdx: number) => <LabourCalculationDetails key={taskIdx} task={task} workingHours={workingHours} standardHours={standardHours} numberOfLabours={numberOfLabours} autoLabourPerDay={autoLabourPerDay} />)}
                              </div>
                              
                              {/* Total Days */}
                              <div className="pt-3 border-t-2 border-primary/20">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-muted-foreground">Total Days:</p>
                                  <p className="text-2xl font-bold text-primary">{Math.ceil(configTask.totalDays / autoLabourPerDay)} days</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>;
                })}
                      
                    </div>
                  </div>}

                {/* Enamel Configurations - Aggregated with Detailed Layout */}
                {(() => {
              const enamelConfigs = configTasks.filter(ct => ct.isEnamel);
              if (enamelConfigs.length === 0) return null;

              // Fixed enamel labour rates (sq.ft/day)
              const enamelPrimerRate = 300; // Standard Labour Rate for enamel primer
              const enamelTopcoatRate = 300; // Standard Labour Rate for enamel topcoat

              // Aggregate enamel areas into Main and Separate (Varnish) groups
              interface EnamelGroup {
                primerSqft: number;
                primerCoats: number;
                primerProduct: string;
                primerSelected: boolean; // Track if primer was explicitly selected
                enamelSqft: number;
                enamelCoats: number;
                enamelProduct: string;
              }
              const mainEnamel: EnamelGroup = {
                primerSqft: 0,
                primerCoats: 0,
                primerProduct: '',
                primerSelected: false,
                enamelSqft: 0,
                enamelCoats: 0,
                enamelProduct: ''
              };
              const separateEnamel: EnamelGroup = {
                primerSqft: 0,
                primerCoats: 0,
                primerProduct: '',
                primerSelected: false,
                enamelSqft: 0,
                enamelCoats: 0,
                enamelProduct: ''
              };
              enamelConfigs.forEach(config => {
                const isSeparate = config.configLabel?.toLowerCase().includes('varnish') || config.configLabel?.toLowerCase().includes('separate');
                const target = isSeparate ? separateEnamel : mainEnamel;
                config.tasks.forEach((task: any) => {
                  const taskName = task.name?.toLowerCase() || '';
                  // Only count primer if it's a real selected product (not just "Primer" default)
                  const isPrimerTask = taskName.includes('primer');
                  const isRealPrimerProduct = isPrimerTask && task.name && task.name !== 'Primer' && task.name !== 'Enamel Primer' && task.name.toLowerCase() !== 'primer';
                  if (isPrimerTask && isRealPrimerProduct) {
                    target.primerSqft += task.area || 0;
                    target.primerCoats = Math.max(target.primerCoats, task.coats || 1);
                    target.primerProduct = task.name;
                    target.primerSelected = true;
                  } else if (!isPrimerTask) {
                    target.enamelSqft += task.area || 0;
                    target.enamelCoats = Math.max(target.enamelCoats, task.coats || 1);
                    if (!target.enamelProduct) target.enamelProduct = task.name || 'Enamel Topcoat';
                  }
                });
              });

              // Calculate days for each task type (round only final totals)
              const calcDays = (sqft: number, coats: number, rate: number) => {
                if (sqft <= 0) return 0;
                const totalWork = sqft * coats;
                return Math.ceil(totalWork / (rate * autoLabourPerDay));
              };

              // Only calculate primer days if primer was explicitly selected
              const mainPrimerDays = mainEnamel.primerSelected ? calcDays(mainEnamel.primerSqft, mainEnamel.primerCoats, enamelPrimerRate) : 0;
              const mainEnamelDays = calcDays(mainEnamel.enamelSqft, mainEnamel.enamelCoats, enamelTopcoatRate);
              const mainTotalDays = mainPrimerDays + mainEnamelDays;
              const separatePrimerDays = separateEnamel.primerSelected ? calcDays(separateEnamel.primerSqft, separateEnamel.primerCoats, enamelPrimerRate) : 0;
              const separateEnamelTopDays = calcDays(separateEnamel.enamelSqft, separateEnamel.enamelCoats, enamelTopcoatRate);
              const separateTotalDays = separatePrimerDays + separateEnamelTopDays;

              // Check if we have any enamel work (primer only counts if explicitly selected)
              const hasMainEnamel = mainEnamel.primerSelected && mainEnamel.primerSqft > 0 || mainEnamel.enamelSqft > 0;
              const hasSeparateEnamel = separateEnamel.primerSelected && separateEnamel.primerSqft > 0 || separateEnamel.enamelSqft > 0;
              if (!hasMainEnamel && !hasSeparateEnamel) return null;

              // Build aggregated tasks for display - only include primer if explicitly selected
              const buildTasks = (group: EnamelGroup, primerDays: number, topcoatDays: number) => {
                const tasks: any[] = [];
                // Only add primer task if primer was explicitly selected with a real product
                if (group.primerSelected && group.primerSqft > 0) {
                  tasks.push({
                    name: group.primerProduct,
                    area: group.primerSqft,
                    coats: group.primerCoats || 1,
                    totalWork: group.primerSqft * (group.primerCoats || 1),
                    coverage: enamelPrimerRate,
                    daysRequired: primerDays
                  });
                }
                if (group.enamelSqft > 0) {
                  tasks.push({
                    name: group.enamelProduct || 'Enamel Topcoat',
                    area: group.enamelSqft,
                    coats: group.enamelCoats || 1,
                    totalWork: group.enamelSqft * (group.enamelCoats || 1),
                    coverage: enamelTopcoatRate,
                    daysRequired: topcoatDays
                  });
                }
                return tasks;
              };
              const mainTasks = buildTasks(mainEnamel, mainPrimerDays, mainEnamelDays);
              const separateTasks = buildTasks(separateEnamel, separatePrimerDays, separateEnamelTopDays);
              return <div className="space-y-3">
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                        Enamel Paint Configurations
                      </Badge>
                      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}>
                        {/* Main Enamel Area Card */}
                        {hasMainEnamel && <Card className="flex-none w-72 min-h-[340px] border-2 snap-start bg-orange-50 border-orange-300 dark:bg-orange-900/20 dark:border-orange-500/50">
                            <CardContent className="p-4">
                              <div className="space-y-4">
                                {/* Header with Enamel Badge */}
                                <div className="flex items-center justify-between pb-2 border-b border-orange-300 dark:border-orange-500/50">
                                  <h3 className="font-semibold text-base">Enamel Area (Main)</h3>
                                  <Badge variant="secondary" className="text-xs bg-orange-500 text-white">
                                    Enamel
                                  </Badge>
                                </div>
                                
                                {/* Tasks List */}
                                <div className="space-y-3">
                                  {mainTasks.map((task: any, taskIdx: number) => <LabourCalculationDetails key={taskIdx} task={task} workingHours={workingHours} standardHours={standardHours} numberOfLabours={numberOfLabours} autoLabourPerDay={autoLabourPerDay} />)}
                                </div>
                                
                                {/* Total Days */}
                                <div className="pt-3 border-t-2 border-orange-300 dark:border-orange-500/50">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-muted-foreground">Total Days:</p>
                                    <p className="text-2xl font-bold text-orange-600">{mainTotalDays} days</p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>}
                        
                        {/* Separate/Varnish Enamel Area Card */}
                        {hasSeparateEnamel && <Card className="flex-none w-72 min-h-[340px] border-2 snap-start bg-orange-50 border-orange-300 dark:bg-orange-900/20 dark:border-orange-500/50">
                            <CardContent className="p-4">
                              <div className="space-y-4">
                                {/* Header with Enamel Badge */}
                                <div className="flex items-center justify-between pb-2 border-b border-orange-300 dark:border-orange-500/50">
                                  <h3 className="font-semibold text-base">Varnish / Separate Area</h3>
                                  <Badge variant="secondary" className="text-xs bg-orange-500 text-white">
                                    Enamel
                                  </Badge>
                                </div>
                                
                                {/* Tasks List */}
                                <div className="space-y-3">
                                  {separateTasks.map((task: any, taskIdx: number) => <LabourCalculationDetails key={taskIdx} task={task} workingHours={workingHours} standardHours={standardHours} numberOfLabours={numberOfLabours} autoLabourPerDay={autoLabourPerDay} />)}
                                </div>
                                
                                {/* Total Days */}
                                <div className="pt-3 border-t-2 border-orange-300 dark:border-orange-500/50">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-muted-foreground">Total Days:</p>
                                    <p className="text-2xl font-bold text-orange-600">{separateTotalDays} days</p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>}
                      </div>
                    </div>;
            })()}

                {/* Summary */}
                <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg border-2 border-red-500">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Project Duration</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        With {autoLabourPerDay} labourer{autoLabourPerDay > 1 ? 's' : ''} per day
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-primary">
                      {displayDays} days
                    </p>
                  </div>
                </div>
              </div>}

            {/* Total Labour Cost - Only in Auto Mode */}
            {labourMode === 'auto' && <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border-2 border-primary">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-slate-950">Total Labour Cost</span>
                  <p className="text-2xl font-bold text-primary">
                    ₹{(displayLabours * displayDays * perDayLabourCost).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>}

            {/* Per Day Labour - Only in Manual Mode */}
            {labourMode === 'manual' && <>
                <div className="p-3 bg-muted/30 rounded-lg border border-border">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-muted-foreground">Per Day Labour</p>
                    <p className="text-xl font-bold text-foreground">{laboursNeeded}</p>
                  </div>
                </div>

                {/* Total Labour (Man-Days) */}
                <div className="p-3 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg border-2 border-red-500">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-muted-foreground">Total Labour (Man-Days)</p>
                    <p className="text-xl font-bold text-primary">
                      {totalDays}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total man-days required for the project
                  </p>
                </div>
              </>}

          </div>}
        </CardContent>
      </Card>;
  };

  // Helper function to get product pricing from database
  const getProductPricingFromDB = (productName: string): {
    sizes: {
      [key: string]: number;
    };
    unit: string;
  } | null => {
    // Normalize product name for matching
    const normalizedName = productName.trim().toLowerCase();

    // Try exact match first
    let pricing = productPricing[normalizedName];

    // If no exact match, try partial match
    if (!pricing) {
      const matchKey = Object.keys(productPricing).find(key => normalizedName.includes(key) || key.includes(normalizedName));
      if (matchKey) {
        pricing = productPricing[matchKey];
      }
    }
    if (pricing && typeof pricing === 'object') {
      // Determine unit based on product type
      let unit = 'L';
      if (productName.toLowerCase().includes('putty') || productName.toLowerCase().includes('polymer')) {
        unit = 'kg';
      }
      return {
        sizes: pricing as {
          [key: string]: number;
        },
        unit
      };
    }
    return null;
  };

  // Helper function to calculate optimal pack combination for maximum quantity
  const calculateOptimalPackCombination = (availableSizes: {
    size: string;
    price: number;
  }[], maxQuantity: number, unit: string): {
    combination: {
      size: string;
      count: number;
      price: number;
    }[];
    totalCost: number;
    error?: string;
  } => {
    // Sort sizes in descending order
    const sortedSizes = [...availableSizes].sort((a, b) => {
      const sizeA = parseFloat(a.size.replace(/[^\d.]/g, ''));
      const sizeB = parseFloat(b.size.replace(/[^\d.]/g, ''));
      return sizeB - sizeA;
    });
    let remaining = maxQuantity;
    const combination: {
      size: string;
      count: number;
      price: number;
    }[] = [];

    // Greedy algorithm: use largest packs first
    for (const pack of sortedSizes) {
      const packSize = parseFloat(pack.size.replace(/[^\d.]/g, ''));
      if (remaining >= packSize) {
        const count = Math.floor(remaining / packSize);
        if (count > 0) {
          combination.push({
            size: pack.size,
            count,
            price: pack.price
          });
          remaining -= count * packSize;
        }
      }
    }

    // If there's remaining quantity, add one more of the smallest available pack
    if (remaining > 0.01 && sortedSizes.length > 0) {
      const smallestPack = sortedSizes[sortedSizes.length - 1];
      const existing = combination.find(c => c.size === smallestPack.size);
      if (existing) {
        existing.count += 1;
      } else {
        combination.push({
          size: smallestPack.size,
          count: 1,
          price: smallestPack.price
        });
      }
    }

    // Calculate total cost
    const totalCost = combination.reduce((sum, c) => sum + c.count * c.price, 0);

    // Check if we couldn't satisfy the quantity
    if (combination.length === 0 && maxQuantity > 0) {
      return {
        combination: [],
        totalCost: 0,
        error: "⚠️ Pack combination not found for full quantity."
      };
    }
    return {
      combination,
      totalCost
    };
  };

  // Section 4: Material Section
  const renderMaterialSection = () => {
    // Helper function to get correct coverage data for a material
    const getMaterialCoverage = (materialName: string, materialType: string) => {
      // Remove pack sizes from material name (e.g., "20L", "10L", "4L", "1L")
      let cleanName = materialName.replace(/\s*\d+L\b/gi, '').trim();

      // For Exterior configurations, handle base coat vs top coat distinction
      const isBaseCost = materialType === 'Primer' || cleanName.toLowerCase().includes('base coat') || cleanName.toLowerCase().includes('primer');

      // For base coats/primers, look for the exact match with "Base Coat" suffix
      if (isBaseCost && (cleanName.toLowerCase().includes('ultima protek') || cleanName.toLowerCase().includes('durolife'))) {
        // Try to find base coat coverage
        const baseCoatKey = cleanName.toLowerCase().includes('base coat') ? cleanName.toLowerCase() : `${cleanName.toLowerCase()} base coat`;
        if (coverageData[baseCoatKey]) {
          return coverageData[baseCoatKey];
        }
      }

      // For top coats, ensure we don't match base coat entries
      if (!isBaseCost) {
        // Remove "base coat" from the name to ensure we get top coat coverage
        cleanName = cleanName.replace(/\s*base\s*coat\s*/gi, '').trim();

        // For Durolife top coat, look specifically for "durolife top coat"
        if (cleanName.toLowerCase().includes('durolife')) {
          const topCoatKey = cleanName.toLowerCase().includes('top coat') ? cleanName.toLowerCase() : `${cleanName.toLowerCase()} top coat`;
          if (coverageData[topCoatKey]) {
            return coverageData[topCoatKey];
          }
        }
      }

      // Default lookup
      return coverageData[cleanName.toLowerCase()] || 'N/A';
    };

    // Helper function to calculate material requirements and cost
    const calculateMaterial = (material: string, quantity: number) => {
      // Get pricing from database
      const pricingData = getProductPricingFromDB(material);
      if (!pricingData) {
        // Avoid triggering toasts during render to prevent re-render loops.
        // Log the issue and return safe defaults so the UI can still render.
        console.warn(`Product pricing not found for material: ${material}`);
        return {
          quantity: quantity.toFixed(2),
          minQuantity: Math.ceil(quantity),
          maxQuantity: Math.ceil(quantity * 1.25),
          unit: material.toLowerCase().includes('putty') ? 'kg' : 'L',
          packsNeeded: 0,
          packSize: 0,
          packCombination: 'N/A',
          totalCost: 0,
          rate: 0,
          error: "⚠️ Price data unavailable — please update Product Pricing tab."
        };
      }
      const {
        sizes,
        unit
      } = pricingData;

      // Calculate required quantity (ceiling of raw calculation - NO buffer)
      const requiredQuantity = Math.ceil(quantity);

      // Prepare available pack sizes with prices
      const availablePacks = Object.entries(sizes).map(([size, price]) => ({
        size,
        price: price as number
      }));

      // Calculate optimal pack combination for EXACT required quantity (no buffer)
      const {
        combination,
        totalCost,
        error
      } = calculateOptimalPackCombination(availablePacks, requiredQuantity, unit);

      // Format pack combination string
      const packCombination = combination.length > 0 ? combination.map(c => `(${c.size}/${c.count})`).join('') : 'N/A';
      return {
        quantity: quantity.toFixed(2),
        requiredQuantity,
        unit,
        packsNeeded: combination.reduce((sum, c) => sum + c.count, 0),
        packSize: combination.length > 0 ? combination[0].size : 'N/A',
        packCombination,
        totalCost,
        rate: combination.length > 0 ? combination[0].price : 0,
        error,
        combination // Keep detailed combination for display
      };
    };

    // Helper to get coverage from database based on product name and coats
    const getCoverageFromDB = (productName: string, coats: number): number => {
      const coatLabel = coats === 1 ? '1 coat' : `${coats} coats`;
      const key = `${productName.toLowerCase()}_${coatLabel}`;
      const coverageInfo = coverageData[key];
      if (coverageInfo && typeof coverageInfo === 'object' && coverageInfo.minValue) {
        return coverageInfo.minValue;
      }
      // Fallback: try with different coat format
      const altKey = `${productName.toLowerCase()}_${coats} coat${coats > 1 ? 's' : ''}`;
      const altCoverageInfo = coverageData[altKey];
      if (altCoverageInfo && typeof altCoverageInfo === 'object' && altCoverageInfo.minValue) {
        return altCoverageInfo.minValue;
      }
      // Default fallbacks if not found in database
      if (productName.toLowerCase().includes('putty')) return 10; // 10-15 default
      if (productName.toLowerCase().includes('primer')) return 100;
      return 120; // Default for emulsion
    };

    // Group materials by configuration - USE FROZEN SNAPSHOT
    const configMaterials: any[] = [];
    // Use sortedCalculationConfigs which includes Paint Estimation + Room Measurement enamel areas
    sortedCalculationConfigs.forEach(config => {
      const area = Number(config.area) || 0;
      const isFresh = config.paintingSystem === 'Fresh Painting';
      const materials: any[] = [];
      if (isFresh) {
        // Putty - coverage from DB, NO multiplication by coats (coverage already includes coat factor)
        if (config.selectedMaterials.putty && config.coatConfiguration.putty > 0) {
          const coats = config.coatConfiguration.putty;
          const coverage = getCoverageFromDB(config.selectedMaterials.putty, coats);
          const kgNeeded = area / coverage; // NO * coats - coverage already accounts for coats
          const calc = calculateMaterial(config.selectedMaterials.putty, kgNeeded);
          materials.push({
            name: config.selectedMaterials.putty,
            type: 'Putty',
            area,
            coats,
            coverageRate: coverage,
            ...calc
          });
        }

        // Primer - coverage from DB, NO multiplication by coats
        if (config.selectedMaterials.primer && config.coatConfiguration.primer > 0) {
          const isEnamel = config.selectedMaterials.primer?.toLowerCase().includes('enamel') || config.selectedMaterials.emulsion?.toLowerCase().includes('enamel');
          const coats = config.coatConfiguration.primer;
          const coverage = getCoverageFromDB(config.selectedMaterials.primer, coats);
          const litersNeeded = area / coverage; // NO * coats
          const calc = calculateMaterial(config.selectedMaterials.primer, litersNeeded);
          materials.push({
            name: config.selectedMaterials.primer,
            type: isEnamel ? 'Enamel Primer' : 'Primer',
            area,
            coats,
            coverageRate: coverage,
            ...calc
          });
        }

        // Emulsion - coverage from DB, NO multiplication by coats
        if (config.selectedMaterials.emulsion && config.coatConfiguration.emulsion > 0) {
          const isEnamel = config.selectedMaterials.emulsion.toLowerCase().includes('enamel');
          const coats = config.coatConfiguration.emulsion;
          const coverage = getCoverageFromDB(config.selectedMaterials.emulsion, coats);
          const litersNeeded = area / coverage; // NO * coats
          const calc = calculateMaterial(config.selectedMaterials.emulsion, litersNeeded);
          materials.push({
            name: config.selectedMaterials.emulsion,
            type: isEnamel ? 'Enamel' : 'Emulsion',
            area,
            coats,
            coverageRate: coverage,
            ...calc
          });
        }
      } else {
        // Repainting - coverage from DB, NO multiplication by coats
        if (config.selectedMaterials.primer && config.repaintingConfiguration?.primer && config.repaintingConfiguration.primer > 0) {
          const coats = config.repaintingConfiguration.primer;
          const coverage = getCoverageFromDB(config.selectedMaterials.primer, coats);
          const litersNeeded = area / coverage; // NO * coats
          const calc = calculateMaterial(config.selectedMaterials.primer, litersNeeded);
          materials.push({
            name: config.selectedMaterials.primer,
            type: 'Primer',
            area,
            coats,
            coverageRate: coverage,
            ...calc
          });
        }
        if (config.selectedMaterials.emulsion && config.repaintingConfiguration?.emulsion && config.repaintingConfiguration.emulsion > 0) {
          const coats = config.repaintingConfiguration.emulsion;
          const coverage = getCoverageFromDB(config.selectedMaterials.emulsion, coats);
          const litersNeeded = area / coverage; // NO * coats
          const calc = calculateMaterial(config.selectedMaterials.emulsion, litersNeeded);
          materials.push({
            name: config.selectedMaterials.emulsion,
            type: config.selectedMaterials.emulsion.toLowerCase().includes('enamel') ? 'Enamel' : 'Emulsion',
            area,
            coats,
            coverageRate: coverage,
            ...calc
          });
        }
      }
      const totalCost = materials.reduce((sum, m) => sum + m.totalCost, 0);
      // Check if this is an enamel configuration
      const isEnamelConfig = String(config.paintTypeCategory).toLowerCase() === 'enamel' || config.areaType === 'Enamel' || config.label?.toLowerCase().includes('enamel') || materials.some((m: any) => m.type === 'Enamel' || m.type === 'Enamel Primer');
      configMaterials.push({
        configLabel: config.label || config.areaType,
        paintTypeCategory: config.paintTypeCategory,
        materials,
        totalCost,
        isEnamel: isEnamelConfig
      });
    });

    // Update ref with total material cost for use in other sections
    totalMaterialCostRef.current = configMaterials.reduce((sum, cm) => sum + cm.totalCost, 0);
    return <Card className="eca-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Package className="h-5 w-5 text-primary" />
            Material Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingMaterial ? <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Calculating material requirements...</p>
              </div>
            </div> : sortedCalculationConfigs.length === 0 ? <div className="text-sm text-muted-foreground p-4 border rounded-md bg-muted/30">
              No material configurations found.
            </div> : <div className="space-y-4">
              {/* Interior Configurations - Exclude Enamel */}
              {configMaterials.filter(cm => cm.paintTypeCategory === 'Interior' && !cm.isEnamel && cm.totalCost > 0).length > 0 && <div className="space-y-3">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    Interior Paint Configurations
                  </Badge>
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
                    {configMaterials.filter(cm => cm.paintTypeCategory === 'Interior' && !cm.isEnamel && cm.totalCost > 0).map((configMat, index) => {
                const isEnamelConfig = configMat.configLabel.toLowerCase().includes('enamel') || configMat.materials.some((m: any) => m.name.toLowerCase().includes('enamel'));
                return <Card key={index} className={`flex-none w-72 border-2 snap-start ${isEnamelConfig ? 'bg-orange-50 border-orange-300' : 'border-primary/20 bg-primary/5'}`}>
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            {/* Header with Type Badge */}
                            <div className="flex items-center justify-between pb-2 border-b border-primary/10">
                              <h3 className="font-semibold text-base">{configMat.configLabel}</h3>
                              <Badge variant="secondary" className="text-xs">
                                Interior
                              </Badge>
                            </div>
                            
                            {/* Materials List */}
                            <div className="space-y-3">
                              {configMat.materials.map((mat: any, matIdx: number) => <div key={matIdx}>
                                  {mat.error && <div className="text-xs text-destructive bg-destructive/10 p-2 rounded mb-2">
                                      ⚠️ {mat.error}
                                    </div>}
                                  <MaterialCalculationDetails materialName={mat.name} materialType={mat.type} area={mat.area || 0} coats={mat.coats || 1} coverageRate={mat.coverageRate || 0} coverageDisplay={getMaterialCoverage(mat.name, mat.type)} unit={mat.unit} requiredQuantity={mat.requiredQuantity} totalCost={mat.totalCost} packCombination={mat.combination || []} hasError={!!mat.error} />
                                </div>)}
                            </div>
                            
                            {/* Total Cost */}
                            <div className="pt-3 border-t-2 border-primary/20">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-muted-foreground">Total Cost:</p>
                                <p className="text-2xl font-bold text-primary">₹{configMat.totalCost.toLocaleString('en-IN')}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>;
              })}
                    
                  </div>
                </div>}

              {/* Exterior Configurations - Exclude Enamel */}
              {configMaterials.filter(cm => cm.paintTypeCategory === 'Exterior' && !cm.isEnamel && cm.totalCost > 0).length > 0 && <div className="space-y-3">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    Exterior Paint Configurations
                  </Badge>
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
                    {configMaterials.filter(cm => cm.paintTypeCategory === 'Exterior' && !cm.isEnamel && cm.totalCost > 0).map((configMat, index) => {
                const isEnamelConfig = configMat.configLabel.toLowerCase().includes('enamel') || configMat.materials.some((m: any) => m.name.toLowerCase().includes('enamel'));
                return <Card key={index} className={`flex-none w-72 border-2 snap-start ${isEnamelConfig ? 'bg-orange-50 border-orange-300' : 'border-primary/20 bg-primary/5'}`}>
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            {/* Header with Type Badge */}
                            <div className="flex items-center justify-between pb-2 border-b border-primary/10">
                              <h3 className="font-semibold text-base">{configMat.configLabel}</h3>
                              <Badge variant="secondary" className="text-xs">
                                Exterior
                              </Badge>
                            </div>
                            
                            {/* Materials List */}
                            <div className="space-y-3">
                              {configMat.materials.map((mat: any, matIdx: number) => <div key={matIdx}>
                                  {mat.error && <div className="text-xs text-destructive bg-destructive/10 p-2 rounded mb-2">
                                      ⚠️ {mat.error}
                                    </div>}
                                  <MaterialCalculationDetails materialName={mat.name} materialType={mat.type} area={mat.area || 0} coats={mat.coats || 1} coverageRate={mat.coverageRate || 0} coverageDisplay={getMaterialCoverage(mat.name, mat.type)} unit={mat.unit} requiredQuantity={mat.requiredQuantity} totalCost={mat.totalCost} packCombination={mat.combination || []} hasError={!!mat.error} />
                                </div>)}
                            </div>
                            
                            {/* Total Cost */}
                            <div className="pt-3 border-t-2 border-primary/20">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-muted-foreground">Total Material Cost:</p>
                                <p className="text-2xl font-bold text-primary">₹{configMat.totalCost.toLocaleString('en-IN')}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>;
              })}
                    
                  </div>
                </div>}

              {/* Waterproofing Configurations - Exclude Enamel */}
              {configMaterials.filter(cm => cm.paintTypeCategory === 'Waterproofing' && !cm.isEnamel && cm.totalCost > 0).length > 0 && <div className="space-y-3">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    Waterproofing Configurations
                  </Badge>
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
                    {configMaterials.filter(cm => cm.paintTypeCategory === 'Waterproofing' && !cm.isEnamel && cm.totalCost > 0).map((configMat, index) => {
                const isEnamelConfig = configMat.configLabel.toLowerCase().includes('enamel') || configMat.materials.some((m: any) => m.name.toLowerCase().includes('enamel'));
                return <Card key={index} className={`flex-none w-72 border-2 snap-start ${isEnamelConfig ? 'bg-orange-50 border-orange-300' : 'border-primary/20 bg-primary/5'}`}>
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            {/* Header with Type Badge */}
                            <div className="flex items-center justify-between pb-2 border-b border-primary/10">
                              <h3 className="font-semibold text-base">{configMat.configLabel}</h3>
                              <Badge variant="secondary" className="text-xs">
                                Waterproofing
                              </Badge>
                            </div>
                            
                            {/* Materials List */}
                            <div className="space-y-3">
                              {configMat.materials.map((mat: any, matIdx: number) => <div key={matIdx}>
                                  {mat.error && <div className="text-xs text-destructive bg-destructive/10 p-2 rounded mb-2">
                                      ⚠️ {mat.error}
                                    </div>}
                                  <MaterialCalculationDetails materialName={mat.name} materialType={mat.type} area={mat.area || 0} coats={mat.coats || 1} coverageRate={mat.coverageRate || 0} coverageDisplay={getMaterialCoverage(mat.name, mat.type)} unit={mat.unit} requiredQuantity={mat.requiredQuantity} totalCost={mat.totalCost} packCombination={mat.combination || []} hasError={!!mat.error} />
                                </div>)}
                            </div>
                            
                            {/* Total Cost */}
                            <div className="pt-3 border-t-2 border-primary/20">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-muted-foreground">Total Material Cost:</p>
                                <p className="text-2xl font-bold text-primary">₹{configMat.totalCost.toLocaleString('en-IN')}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>;
              })}
                    
                   </div>
                </div>}

              {/* Enamel (Door & Window) Configurations - Aggregated into 2 boxes like Labour */}
              {(() => {
            const enamelMaterials = configMaterials.filter(cm => cm.isEnamel && cm.materials.length > 0);
            if (enamelMaterials.length === 0) return null;

            // Aggregate materials into Main and Separate groups
            interface MaterialGroup {
              primerMaterials: any[];
              enamelMaterials: any[];
              totalCost: number;
            }
            const mainGroup: MaterialGroup = {
              primerMaterials: [],
              enamelMaterials: [],
              totalCost: 0
            };
            const separateGroup: MaterialGroup = {
              primerMaterials: [],
              enamelMaterials: [],
              totalCost: 0
            };
            enamelMaterials.forEach(configMat => {
              const isSeparate = configMat.configLabel?.toLowerCase().includes('varnish') || configMat.configLabel?.toLowerCase().includes('separate');
              const target = isSeparate ? separateGroup : mainGroup;
              configMat.materials.forEach((mat: any) => {
                const matName = mat.name?.toLowerCase() || '';
                const isPrimer = matName.includes('primer');

                // Check if this is a real selected primer (not default)
                const isRealPrimer = isPrimer && mat.name && mat.name !== 'Primer' && mat.name !== 'Enamel Primer' && mat.name.toLowerCase() !== 'primer';
                if (isRealPrimer) {
                  // Aggregate primer - find existing or add new (only sum area, recalculate quantity later)
                  const existing = target.primerMaterials.find((m: any) => m.name === mat.name);
                  if (existing) {
                    existing.area += mat.area || 0;
                    // Store coverage rate for later recalculation
                    existing.coverageRate = mat.coverageRate || existing.coverageRate;
                    existing.coats = mat.coats || existing.coats;
                    existing.unit = mat.unit || existing.unit;
                  } else {
                    target.primerMaterials.push({
                      ...mat,
                      area: mat.area || 0,
                      requiredQuantity: 0,
                      totalCost: 0
                    });
                  }
                } else if (!isPrimer) {
                  // Aggregate enamel topcoat (only sum area, recalculate quantity later)
                  const existing = target.enamelMaterials.find((m: any) => m.name === mat.name);
                  if (existing) {
                    existing.area += mat.area || 0;
                    // Store coverage rate for later recalculation
                    existing.coverageRate = mat.coverageRate || existing.coverageRate;
                    existing.coats = mat.coats || existing.coats;
                    existing.unit = mat.unit || existing.unit;
                  } else {
                    target.enamelMaterials.push({
                      ...mat,
                      area: mat.area || 0,
                      requiredQuantity: 0,
                      totalCost: 0
                    });
                  }
                }
              });
            });

            // Recalculate requiredQuantity and totalCost for each aggregated material based on total area
            const recalculateMaterial = (mat: any) => {
              if (mat.area > 0 && mat.coverageRate > 0) {
                const rawQuantity = mat.area / mat.coverageRate;
                mat.requiredQuantity = Math.ceil(rawQuantity);
                // Recalculate pack combination and cost
                const calc = calculateMaterial(mat.name, rawQuantity);
                mat.totalCost = calc.totalCost || 0;
                mat.combination = calc.combination || [];
                mat.unit = calc.unit || mat.unit;
              }
            };

            // Recalculate all aggregated materials
            mainGroup.primerMaterials.forEach(recalculateMaterial);
            mainGroup.enamelMaterials.forEach(recalculateMaterial);
            separateGroup.primerMaterials.forEach(recalculateMaterial);
            separateGroup.enamelMaterials.forEach(recalculateMaterial);

            // Recalculate group total costs
            mainGroup.totalCost = mainGroup.primerMaterials.reduce((sum, m) => sum + (m.totalCost || 0), 0) + mainGroup.enamelMaterials.reduce((sum, m) => sum + (m.totalCost || 0), 0);
            separateGroup.totalCost = separateGroup.primerMaterials.reduce((sum, m) => sum + (m.totalCost || 0), 0) + separateGroup.enamelMaterials.reduce((sum, m) => sum + (m.totalCost || 0), 0);
            const hasMainEnamel = mainGroup.primerMaterials.length > 0 || mainGroup.enamelMaterials.length > 0;
            const hasSeparateEnamel = separateGroup.primerMaterials.length > 0 || separateGroup.enamelMaterials.length > 0;
            if (!hasMainEnamel && !hasSeparateEnamel) return null;
            return <div className="space-y-3">
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                      Enamel Paint Configurations
                    </Badge>
                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}>
                      {/* Main Enamel Area Card */}
                      {hasMainEnamel && <Card className="flex-none w-72 border-2 snap-start bg-orange-50 border-orange-300 dark:bg-orange-900/20 dark:border-orange-500/50">
                          <CardContent className="p-4">
                            <div className="space-y-4">
                              {/* Header with Enamel Badge */}
                              <div className="flex items-center justify-between pb-2 border-b border-orange-300 dark:border-orange-500/50">
                                <h3 className="font-semibold text-base">Enamel Area (Main)</h3>
                                <Badge variant="secondary" className="text-xs bg-orange-500 text-white">
                                  Enamel
                                </Badge>
                              </div>
                              
                              {/* Materials List */}
                              <div className="space-y-3">
                                {mainGroup.primerMaterials.map((mat: any, matIdx: number) => <div key={`primer-${matIdx}`}>
                                    {mat.error && <div className="text-xs text-destructive bg-destructive/10 p-2 rounded mb-2">⚠️ {mat.error}</div>}
                                    <MaterialCalculationDetails materialName={mat.name} materialType={mat.type} area={mat.area || 0} coats={mat.coats || 1} coverageRate={mat.coverageRate || 0} coverageDisplay={getMaterialCoverage(mat.name, mat.type)} unit={mat.unit} requiredQuantity={mat.requiredQuantity} totalCost={mat.totalCost} packCombination={mat.combination || []} hasError={!!mat.error} />
                                  </div>)}
                                {mainGroup.enamelMaterials.map((mat: any, matIdx: number) => <div key={`enamel-${matIdx}`}>
                                    {mat.error && <div className="text-xs text-destructive bg-destructive/10 p-2 rounded mb-2">⚠️ {mat.error}</div>}
                                    <MaterialCalculationDetails materialName={mat.name} materialType={mat.type} area={mat.area || 0} coats={mat.coats || 1} coverageRate={mat.coverageRate || 0} coverageDisplay={getMaterialCoverage(mat.name, mat.type)} unit={mat.unit} requiredQuantity={mat.requiredQuantity} totalCost={mat.totalCost} packCombination={mat.combination || []} hasError={!!mat.error} />
                                  </div>)}
                              </div>
                              
                              {/* Total Cost */}
                              <div className="pt-3 border-t-2 border-orange-300 dark:border-orange-500/50">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-muted-foreground">Total Material Cost:</p>
                                  <p className="text-2xl font-bold text-orange-600">₹{mainGroup.totalCost.toLocaleString('en-IN')}</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>}
                      
                      {/* Separate/Varnish Enamel Area Card */}
                      {hasSeparateEnamel && <Card className="flex-none w-72 border-2 snap-start bg-orange-50 border-orange-300 dark:bg-orange-900/20 dark:border-orange-500/50">
                          <CardContent className="p-4">
                            <div className="space-y-4">
                              {/* Header with Enamel Badge */}
                              <div className="flex items-center justify-between pb-2 border-b border-orange-300 dark:border-orange-500/50">
                                <h3 className="font-semibold text-base">Varnish / Separate Area</h3>
                                <Badge variant="secondary" className="text-xs bg-orange-500 text-white">
                                  Enamel
                                </Badge>
                              </div>
                              
                              {/* Materials List */}
                              <div className="space-y-3">
                                {separateGroup.primerMaterials.map((mat: any, matIdx: number) => <div key={`primer-${matIdx}`}>
                                    {mat.error && <div className="text-xs text-destructive bg-destructive/10 p-2 rounded mb-2">⚠️ {mat.error}</div>}
                                    <MaterialCalculationDetails materialName={mat.name} materialType={mat.type} area={mat.area || 0} coats={mat.coats || 1} coverageRate={mat.coverageRate || 0} coverageDisplay={getMaterialCoverage(mat.name, mat.type)} unit={mat.unit} requiredQuantity={mat.requiredQuantity} totalCost={mat.totalCost} packCombination={mat.combination || []} hasError={!!mat.error} />
                                  </div>)}
                                {separateGroup.enamelMaterials.map((mat: any, matIdx: number) => <div key={`enamel-${matIdx}`}>
                                    {mat.error && <div className="text-xs text-destructive bg-destructive/10 p-2 rounded mb-2">⚠️ {mat.error}</div>}
                                    <MaterialCalculationDetails materialName={mat.name} materialType={mat.type} area={mat.area || 0} coats={mat.coats || 1} coverageRate={mat.coverageRate || 0} coverageDisplay={getMaterialCoverage(mat.name, mat.type)} unit={mat.unit} requiredQuantity={mat.requiredQuantity} totalCost={mat.totalCost} packCombination={mat.combination || []} hasError={!!mat.error} />
                                  </div>)}
                              </div>
                              
                              {/* Total Cost */}
                              <div className="pt-3 border-t-2 border-orange-300 dark:border-orange-500/50">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-muted-foreground">Total Material Cost:</p>
                                  <p className="text-2xl font-bold text-orange-600">₹{separateGroup.totalCost.toLocaleString('en-IN')}</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>}
                    </div>
                  </div>;
          })()}

          {/* Total Material Cost Summary */}
          {configMaterials.length > 0 && <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border-2 border-primary mt-4">
              <div className="flex justify-between items-center">
                <span className="text-base font-semibold text-slate-950">Total Material Cost</span>
                <p className="text-2xl font-bold text-primary">
                  ₹{Math.round(configMaterials.reduce((sum, cm) => sum + cm.totalCost, 0)).toLocaleString('en-IN')}
                </p>
              </div>
            </div>}
          </div>}
        </CardContent>
      </Card>;
  };

  // Section 5: Dealer Margin
  const renderDealerMargin = () => {
    // Calculate Total Project Cost from Paint Configuration Details (area * rate)
    const totalProjectCost = areaConfigs.reduce((sum, config) => {
      const area = Number(config.area) || 0;
      const rate = parseFloat(config.perSqFtRate) || 0;
      return sum + area * rate;
    }, 0);

    // Margin Cost = 10% of Total Project Cost
    const marginCost = totalProjectCost * 0.1;
    return <Card className="eca-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <TrendingUp className="h-5 w-5 text-primary" />
            Dealer Margin (10% of Project Cost)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Project Cost</span>
                <span className="text-lg font-semibold text-foreground">₹{Math.round(totalProjectCost).toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border-2 border-primary">
              <div className="flex justify-between items-center">
                <span className="text-base font-semibold text-slate-950">Margin Cost (10%)</span>
                <span className="text-2xl font-bold text-primary">₹{Math.round(marginCost).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>;
  };

  // Calculate actual total project cost (used in both Generate Summary and Project Summary tabs)
  const calculateActualTotalCost = () => {
    const materialCost = totalMaterialCostRef.current;
    const labourCost = totalLabourCostRef.current;

    // Calculate margin cost from Paint Configuration Details (10% of Paint Configuration Total)
    const totalProjectCostFromConfig = areaConfigs.reduce((sum, config) => {
      const area = Number(config.area) || 0;
      const rate = parseFloat(config.perSqFtRate) || 0;
      return sum + area * rate;
    }, 0);
    const marginCost = totalProjectCostFromConfig * 0.1;
    return materialCost + marginCost + labourCost;
  };

  // Section 6: Estimated Total Cost
  const renderTotalCost = () => {
    // Use material cost from Material Requirements section (same as Total Material Cost)
    const materialCost = totalMaterialCostRef.current;

    // Use exact same labour cost from Labour Calculation section (stored in ref)
    const labourCost = totalLabourCostRef.current;

    // Calculate margin cost from Paint Configuration Details (same as Dealer Margin section)
    const totalProjectCostFromConfig = areaConfigs.reduce((sum, config) => {
      const area = Number(config.area) || 0;
      const rate = parseFloat(config.perSqFtRate) || 0;
      return sum + area * rate;
    }, 0);
    const marginCost = totalProjectCostFromConfig * 0.1;
    const totalCost = calculateActualTotalCost();
    return <Card className="eca-shadow bg-card border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <DollarSign className="h-5 w-5 text-primary" />
            Actual Total Project Cost
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Material Cost</span>
                <span className="text-base font-semibold text-foreground">₹{materialCost.toFixed(2)}</span>
              </div>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Labour Cost</span>
                <span className="text-base font-semibold text-foreground">₹{labourCost.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Per Day Labour Cost: ₹{perDayLabourCost}
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Dealer Margin</span>
                <span className="text-base font-semibold text-foreground">₹{marginCost.toFixed(2)}</span>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border-2 border-primary">
              <div className="flex justify-between items-center">
                <span className="text-base font-semibold text-slate-950">Project Total</span>
                <span className="text-2xl font-bold text-primary">₹{Math.round(totalCost).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>;
  };
  // Group room areas by project type and only count selected areas
  const totalAreas = rooms.reduce((acc, room) => {
    const projectType = room.project_type || 'Interior';
    const selectedAreas = room.selected_areas || {
      wall: true,
      floor: false,
      ceiling: false
    };
    if (!acc[projectType]) {
      acc[projectType] = {
        wallArea: 0,
        floorArea: 0,
        ceilingArea: 0
      };
    }
    if (selectedAreas.wall) {
      acc[projectType].wallArea += room.adjusted_wall_area || room.wall_area || 0;
    }
    if (selectedAreas.floor) {
      acc[projectType].floorArea += room.floor_area || 0;
    }
    if (selectedAreas.ceiling) {
      acc[projectType].ceilingArea += room.ceiling_area || 0;
    }
    return acc;
  }, {} as Record<string, {
    wallArea: number;
    floorArea: number;
    ceilingArea: number;
  }>);

  // Calculate total Enamel area from all rooms
  const totalEnamelArea = rooms.reduce((total, room) => {
    return total + Number(room.total_door_window_grill_area || 0);
  }, 0);
  const calculateTotalEstimatedCost = () => {
    // Use material cost from Material Requirements section (stored in ref)
    const materialCost = totalMaterialCostRef.current;
    // Use labour cost from Labour Calculation section (stored in ref)
    const labourCost = totalLabourCostRef.current;
    const marginCost = materialCost * dealerMargin / 100;
    return materialCost + labourCost + marginCost;
  };
  const handleExportPDF = () => {
    toast({
      title: "Export PDF",
      description: "Exporting project summary as PDF..."
    });
  };
  const handleExportExcel = () => {
    toast({
      title: "Export Excel",
      description: "Exporting project data to Excel..."
    });
  };
  const handleShareWhatsApp = () => {
    let totalArea = 0;
    Object.values(totalAreas).forEach((areas: any) => {
      totalArea += areas.wallArea + areas.floorArea + areas.ceilingArea;
    });
    const message = `Cosvys Project Summary\n\nCustomer: ${projectData?.customerName}\nTotal Area: ${totalArea.toFixed(1)} sq.ft\nEstimated Cost: ₹${Math.round(calculateActualTotalCost()).toLocaleString()}\n\nGenerated by Cosvys`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };
  const handleShareEmail = () => {
    let totalArea = 0;
    Object.values(totalAreas).forEach((areas: any) => {
      totalArea += areas.wallArea + areas.floorArea + areas.ceilingArea;
    });
    const subject = `Project Summary - ${projectData?.customerName}`;
    const body = `Please find the project summary for ${projectData?.customerName}.\n\nTotal Area: ${totalArea.toFixed(1)} sq.ft\nEstimated Cost: ₹${Math.round(calculateActualTotalCost()).toLocaleString()}\n\nGenerated by Cosvys`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url);
  };
  const handleSaveProject = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to save projects",
          variant: "destructive"
        });
        return;
      }

      // Calculate total area
      let totalArea = 0;
      Object.values(totalAreas).forEach((areas: any) => {
        totalArea += areas.wallArea + areas.floorArea + areas.ceilingArea;
      });

      // Calculate quotation value
      const quotationValue = calculateActualTotalCost();

      // Determine project types
      const projectTypes = Array.from(new Set(rooms.map(room => room.project_type).filter(Boolean)));
      const projectTypeString = projectTypes.length > 0 ? projectTypes.join(', ') : projectData?.projectTypes?.join(', ') || 'Interior';

      // Insert project into database
      const {
        error
      } = await supabase.from('projects').insert({
        user_id: user.id,
        lead_id: projectId || Date.now().toString(),
        customer_name: projectData?.customerName || 'Unknown',
        phone: projectData?.mobile || '',
        location: projectData?.address || '',
        project_type: projectTypeString,
        project_status: 'Quoted',
        quotation_value: quotationValue,
        area_sqft: totalArea,
        project_date: new Date().toISOString(),
        approval_status: 'Pending',
        reminder_sent: false,
        notification_count: 0
      });
      if (error) throw error;
      toast({
        title: "Success",
        description: "Project saved successfully!"
      });

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save project",
        variant: "destructive"
      });
    }
  };
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="eca-gradient text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate(`/paint-estimation/${projectId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Project Summary</h1>
              <p className="text-white/80 text-sm">Complete project overview</p>
            </div>
          </div>
          <FileText className="h-6 w-6" />
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue="generate" className="w-full" onValueChange={value => {
        if (value === "generate" && topSectionRef.current) {
          setTimeout(() => {
            topSectionRef.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }, 100);
        }
      }}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="generate">Generate Summary</TabsTrigger>
            <TabsTrigger value="summary">Project Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4">
            <div ref={topSectionRef}>
              {renderTypeDetails()}
            </div>
            {renderRoomDetails()}
            {renderLabourSection()}
            {renderMaterialSection()}
            {renderDealerMargin()}
            {renderTotalCost()}
          </TabsContent>

          <TabsContent value="summary" className="space-y-6">
            {/* Customer Details */}
            <Card className="eca-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Home className="mr-2 h-5 w-5 text-primary" />
                  Customer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{projectData?.customerName || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">Customer Name</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-muted-foreground mr-3 ml-1" />
                  <div>
                    <p className="font-medium text-foreground">{projectData?.mobile || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">Mobile Number</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 text-muted-foreground mr-3 ml-1 mt-1" />
                  <div>
                    <p className="font-medium text-foreground">{projectData?.address || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">Address</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <span className="text-sm text-muted-foreground font-medium mb-2 w-full">Project Type:</span>
                  {Array.isArray(projectData?.projectTypes) && projectData.projectTypes.length > 0 ? projectData.projectTypes.map((type: string) => <div key={type} style={{
                  fontFamily: '"Segoe UI", "Inter", system-ui, sans-serif'
                }} className="inline-flex items-center px-4 py-2 font-semibold text-sm bg-gray-100 text-gray-800 border border-gray-300 rounded-full hover:bg-gray-200 transition-all ">
                  {type}
                      </div>) : paintType && <div className="inline-flex items-center px-4 py-2 font-semibold text-sm bg-gray-100 text-gray-800 border border-gray-300 rounded-full hover:bg-gray-200 transition-all" style={{
                  fontFamily: '"Segoe UI", "Inter", system-ui, sans-serif'
                }}>
                        {paintType}
                      </div>}
                </div>
              </CardContent>
            </Card>

            {/* Room Measurements - Matching Total Area Summary Style */}
            <div className="rounded-xl overflow-hidden" style={{
            background: 'linear-gradient(135deg, #fce4ec 0%, #f3e5f5 50%, #e8eaf6 100%)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
              <div className="p-5">
                <div className="flex items-center mb-4">
                  <TrendingUp className="mr-2 h-5 w-5 text-destructive" />
                  <h3 className="font-semibold text-foreground">Room Measurements</h3>
                </div>
                
                {/* Interior Section */}
                {(() => {
                const interiorAreas = totalAreas['Interior'];
                if (!interiorAreas) return null;
                const hasWall = interiorAreas.wallArea > 0;
                const hasCeiling = interiorAreas.ceilingArea > 0;
                if (!hasWall && !hasCeiling) return null;
                return <div className="mb-4">
                      <p className="text-sm font-semibold text-foreground mb-3">Interior</p>
                      <div className={`grid gap-6 ${hasWall && hasCeiling ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {hasWall && <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Total Wall</p>
                            <p className="text-2xl font-bold text-foreground">{interiorAreas.wallArea.toFixed(1)}</p>
                            <p className="text-xs text-muted-foreground">sq.ft</p>
                          </div>}
                        {hasCeiling && <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Total Ceiling</p>
                            <p className="text-2xl font-bold text-foreground">{interiorAreas.ceilingArea.toFixed(1)}</p>
                            <p className="text-xs text-muted-foreground">sq.ft</p>
                          </div>}
                      </div>
                    </div>;
              })()}

                {/* Glass Divider - Interior to Exterior */}
                {(() => {
                const exteriorAreas = totalAreas['Exterior'];
                const hasExterior = exteriorAreas && exteriorAreas.wallArea > 0;
                if (!hasExterior) return null;
                return <div className="py-3">
                      <div className="h-[2px] w-full rounded-full" style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 10%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.5) 90%, transparent 100%)',
                    boxShadow: '0 0 6px rgba(255,255,255,0.4), 0 0 12px rgba(255,255,255,0.2)'
                  }} />
                    </div>;
              })()}

                {/* Exterior Section */}
                {(() => {
                const exteriorAreas = totalAreas['Exterior'];
                if (!exteriorAreas) return null;
                const hasWall = exteriorAreas.wallArea > 0;
                if (!hasWall) return null;
                return <div className="mb-2">
                      <p className="text-sm font-semibold text-foreground mb-3">Exterior</p>
                      <div className="grid grid-cols-1">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Total Wall</p>
                          <p className="text-2xl font-bold text-foreground">{exteriorAreas.wallArea.toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">sq.ft</p>
                        </div>
                      </div>
                    </div>;
              })()}

                {/* Glass Divider - Exterior to Enamel */}
                {totalEnamelArea > 0 && <div className="py-3">
                    <div className="h-[2px] w-full rounded-full" style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 10%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.5) 90%, transparent 100%)',
                  boxShadow: '0 0 6px rgba(255,255,255,0.4), 0 0 12px rgba(255,255,255,0.2)'
                }} />
                  </div>}

                {/* Enamel Section */}
                {totalEnamelArea > 0 && <div>
                    <p className="text-sm font-semibold text-foreground mb-3">Enamel</p>
                    <div className="grid grid-cols-1">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Total Area</p>
                        <p className="text-2xl font-bold text-foreground">{totalEnamelArea.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">sq.ft</p>
                      </div>
                    </div>
                  </div>}
              </div>
            </div>

            {/* Average Cost Details */}
            <Card className="eca-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Palette className="mr-2 h-5 w-5 text-primary" />
                  Average Cost Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
                    <p className="text-sm mb-2 font-normal text-foreground">Company Project Cost</p>
                    <p className="font-bold text-foreground text-2xl">
                      ₹{areaConfigs.reduce((sum, config) => {
                      const area = Number(config.area) || 0;
                      const rate = parseFloat(config.perSqFtRate) || 0;
                      return sum + area * rate;
                    }, 0).toLocaleString('en-IN', {
                      maximumFractionDigits: 0
                    })}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
                    <p className="text-sm mb-2 font-normal text-foreground">
                      Actual<br />Project Cost
                    </p>
                    <p className="font-bold text-foreground text-2xl">
                      ₹{Math.round(calculateActualTotalCost()).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-300 mb-2 font-medium">Average Value</p>
                  <p className="text-3xl font-bold text-red-700 dark:text-red-300">
                    ₹{Math.abs(areaConfigs.reduce((sum, config) => {
                    const area = Number(config.area) || 0;
                    const rate = parseFloat(config.perSqFtRate) || 0;
                    return sum + area * rate;
                  }, 0) - calculateActualTotalCost()).toLocaleString('en-IN', {
                    maximumFractionDigits: 0
                  })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Export & Share */}
            <Card className="eca-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Share2 className="mr-2 h-5 w-5 text-primary" />
                  Export & Share
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="flex items-center justify-center gap-2" onClick={handleExportPDF}>
                    <FileText className="h-4 w-4" />
                    Export PDF
                  </Button>
                  <Button variant="outline" className="flex items-center justify-center gap-2" onClick={handleExportExcel}>
                    <Download className="h-4 w-4" />
                    Export Excel
                  </Button>
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={handleShareWhatsApp}>
                  Share WhatsApp
                </Button>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white" onClick={handleShareEmail}>
                  Share Email
                </Button>
              </CardContent>
            </Card>

            {/* Save Project */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
              <Button onClick={handleSaveProject} className="w-full h-12 text-base font-medium" size="lg">
                Save Project
              </Button>
            </div>
            <div className="h-20"></div>
          </TabsContent>
        </Tabs>
      </div>
    </div>;
}