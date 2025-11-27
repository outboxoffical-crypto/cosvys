import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Palette, Home, Users, Package, TrendingUp, DollarSign, Phone, MapPin, Download, Share2, IndianRupee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
interface AreaConfig {
  id: string;
  areaType: string;
  paintingSystem: string;
  area: number;
  perSqFtRate: string;
  label?: string;
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
  const perDayLabourCost = 1100; // Fixed per day labour cost in rupees
  const [projectData, setProjectData] = useState<any>(null);
  const [coverageData, setCoverageData] = useState<any>({});
  const [productPricing, setProductPricing] = useState<any>({});
  
  // Loading states for progressive rendering
  const [isLoadingPaintConfig, setIsLoadingPaintConfig] = useState(true);
  const [isLoadingLabour, setIsLoadingLabour] = useState(true);
  const [isLoadingMaterial, setIsLoadingMaterial] = useState(true);
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

  // Progressive calculation after data loads
  useEffect(() => {
    if (areaConfigs.length > 0 || calculationConfigs.length > 0) {
      // Defer calculations to next tick for instant UI
      setTimeout(() => {
        setIsLoadingPaintConfig(false);
      }, 0);
      
      setTimeout(() => {
        setIsLoadingLabour(false);
      }, 100);
      
      setTimeout(() => {
        setIsLoadingMaterial(false);
      }, 200);
    }
  }, [areaConfigs, calculationConfigs]);
  const loadData = async () => {
    try {
      // Load coverage data from database
      const {
        data: coverageResults
      } = await supabase.from('coverage_data').select('product_name, coverage_range');
      if (coverageResults) {
        const coverageMap: any = {};
        coverageResults.forEach(item => {
          coverageMap[item.product_name.toLowerCase()] = item.coverage_range;
        });
        setCoverageData(coverageMap);
      }

      // Load product pricing from database
      const {
        data: {
          user: currentUser
        }
      } = await supabase.auth.getUser();
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

      // Load project data
      const project = localStorage.getItem(`project_${projectId}`);
      if (project) setProjectData(JSON.parse(project));

      // Load all configurations from estimation data
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
        setAreaConfigs(allConfigs);
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
        setAreaConfigs(Array.isArray(configs) ? configs : []);
      }

      // Load rooms from backend
      const {
        data: roomsData
      } = await supabase.from('rooms').select('*').eq('project_id', projectId);
      if (roomsData) {
        setRooms(roomsData);

        // Create enamel configurations from door/window/grill areas for calculations only
        const enamelConfigs: AreaConfig[] = [];
        roomsData.forEach(room => {
          const enamelArea = Number(room.total_door_window_grill_area || 0);
          if (enamelArea > 0) {
            enamelConfigs.push({
              id: `enamel_${room.id}`,
              areaType: 'Door & Window',
              paintingSystem: 'Fresh Painting',
              area: enamelArea,
              perSqFtRate: '0',
              label: `${room.name} - Door & Window`,
              paintTypeCategory: room.project_type as 'Interior' | 'Exterior' | 'Waterproofing',
              selectedMaterials: {
                putty: '',
                primer: 'Enamel Primer',
                emulsion: 'Enamel Paint'
              },
              coatConfiguration: {
                putty: 0,
                primer: 1,
                emulsion: 2
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

        // Update both areaConfigs and calculationConfigs with filtered list
        setAreaConfigs(filteredPaintConfigs);
        setCalculationConfigs([...filteredPaintConfigs, ...enamelConfigs]);
      } else {
        // If no rooms data, just use paint estimation configs
        setCalculationConfigs(paintEstimationConfigs);
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
    } catch (error) {
      console.error('Error loading data:', error);
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

    // Group configurations by paint type
    const interiorConfigs = areaConfigs.filter(c => c.paintTypeCategory === 'Interior');
    const exteriorConfigs = areaConfigs.filter(c => c.paintTypeCategory === 'Exterior');
    const waterproofingConfigs = areaConfigs.filter(c => c.paintTypeCategory === 'Waterproofing');
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
          {isLoadingPaintConfig ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Loading configurations...</p>
              </div>
            </div>
          ) : areaConfigs.length === 0 ? <div className="text-sm text-muted-foreground p-4 border rounded-md bg-muted/30">
              No paint configurations found. Please add them in Paint Estimation and click Generate Summary.
            </div> : <div className="space-y-4">
              {renderConfigGroup(interiorConfigs, 'Interior Paint Configurations')}
              {renderConfigGroup(exteriorConfigs, 'Exterior Paint Configurations')}
              {renderConfigGroup(waterproofingConfigs, 'Waterproofing Configurations')}
              
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
              return <div key={projectType} className="space-y-2">
                    {/* Project Type Header */}
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {projectType}
                      </Badge>
                    </div>
                    
                    {/* Rooms under this type */}
                    <div className="space-y-3">
                      {typeRooms.map(room => {
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
                  return <div key={roomId} className="group relative bg-card rounded border-l-2 border-orange-500 hover:border-l-4 eca-shadow hover:eca-shadow-medium eca-transition p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6">
                            <div className="flex-shrink-0">
                              <h3 className="font-bold text-xs sm:text-sm tracking-wider text-foreground">
                                {room.name} - Door & Window
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

            {/* Totals Second with Project Type */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-red-400/20 via-purple-400/20 to-blue-400/20 border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <p className="font-semibold text-foreground text-base">Total Area Summary</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-muted-foreground text-xs mb-1">Total Floor</p>
                  <p className="text-foreground font-bold text-2xl">{totalFloor.toFixed(1)}</p>
                  <p className="text-muted-foreground text-xs">sq.ft</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground text-xs mb-1">Total Wall</p>
                  <p className="text-foreground font-bold text-2xl">{totalWall.toFixed(1)}</p>
                  <p className="text-muted-foreground text-xs">sq.ft</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground text-xs mb-1">Total Ceiling</p>
                  <p className="text-foreground font-bold text-2xl">{totalCeiling.toFixed(1)}</p>
                  <p className="text-muted-foreground text-xs">sq.ft</p>
                </div>
              </div>
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

    // Coverage rates per labour per day (8 hrs) - using average values
    const coverageRates = {
      waterBased: {
        putty: 800,
        primer: 1050,
        emulsion: 1050
      },
      oilBased: {
        redOxide: 350,
        enamelBase: 250,
        enamelTop: 200,
        full3Coat: 275
      }
    };

    // Group tasks by configuration
    const configTasks: any[] = [];
    calculationConfigs.forEach(config => {
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
          const coverage = isEnamel ? coverageRates.oilBased.enamelBase : isOilBased ? coverageRates.oilBased.redOxide : coverageRates.waterBased.primer;
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
          const coverage = isEnamel ? coverageRates.oilBased.enamelTop : isOilBased ? coverageRates.oilBased.enamelTop : coverageRates.waterBased.emulsion;
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
          const coverage = isOilBased ? coverageRates.oilBased.redOxide : coverageRates.waterBased.primer;
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
          const coverage = isOilBased ? coverageRates.oilBased.enamelTop : coverageRates.waterBased.emulsion;
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
      configTasks.push({
        configLabel: config.label || config.areaType,
        paintTypeCategory: config.paintTypeCategory,
        tasks,
        totalDays: tasks.reduce((sum, task) => sum + task.daysRequired, 0)
      });
    });
    const totalDays = configTasks.reduce((sum, ct) => sum + ct.totalDays, 0);
    const allTasks = configTasks.flatMap(ct => ct.tasks);

    // Calculate labourers needed for manual mode
    const totalWorkAllTasks = allTasks.reduce((sum, task) => sum + task.totalWork, 0);
    const averageCoverage = allTasks.length > 0 ? allTasks.reduce((sum, task) => sum + task.coverage, 0) / allTasks.length : 1000;
    const adjustedAverageCoverage = averageCoverage * (workingHours / standardHours);
    const laboursNeeded = manualDays > 0 ? Math.ceil(totalWorkAllTasks / (adjustedAverageCoverage * manualDays)) : 1;
    const displayDays = labourMode === 'auto' ? Math.ceil(totalDays / autoLabourPerDay) : manualDays;
    const displayLabours = labourMode === 'auto' ? autoLabourPerDay : laboursNeeded;
    return <Card className="eca-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Users className="h-5 w-5 text-primary" />
            Labour Calculation
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Based on {workingHours} working hours per day</p>
        </CardHeader>
        <CardContent>
          {isLoadingLabour ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Calculating labour requirements...</p>
              </div>
            </div>
          ) : (
          <div className="space-y-3">
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
                
                {/* Interior Configurations */}
                {configTasks.filter(ct => ct.paintTypeCategory === 'Interior' && ct.totalDays > 0).length > 0 && <div className="space-y-3">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      Interior Paint Configurations
                    </Badge>
                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}>
                      {configTasks.filter(ct => ct.paintTypeCategory === 'Interior' && ct.totalDays > 0).map((configTask, index) => {
                  const isEnamelConfig = configTask.configLabel.toLowerCase().includes('enamel') || configTask.tasks.some((t: any) => t.name.toLowerCase().includes('enamel'));
                  return <Card key={index} className={`flex-none w-72 border-2 snap-start ${isEnamelConfig ? 'bg-orange-50 border-orange-300' : 'border-primary/20 bg-primary/5'}`}>
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
                                {configTask.tasks.map((task: any, taskIdx: number) => {
                            const adjustedDays = Math.ceil(task.daysRequired / autoLabourPerDay);
                            return <div key={taskIdx} className="space-y-2">
                                      <h4 className="text-base font-semibold text-foreground">{task.name}</h4>
                                      <div className="flex items-baseline justify-between">
                                        <div className="flex-1">
                                          <p className="text-sm text-muted-foreground">
                                            Area: <span className="font-medium text-foreground">{task.area.toFixed(0)} sq.ft</span>
                                          </p>
                                          <p className="text-sm text-muted-foreground">
                                            Coats: <span className="font-medium text-foreground">{task.coats}</span>
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-xl font-bold text-primary">{adjustedDays} days</p>
                                        </div>
                                      </div>
                                    </div>;
                          })}
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

                {/* Exterior Configurations */}
                {configTasks.filter(ct => ct.paintTypeCategory === 'Exterior' && ct.totalDays > 0).length > 0 && <div className="space-y-3">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      Exterior Paint Configurations
                    </Badge>
                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}>
                      {configTasks.filter(ct => ct.paintTypeCategory === 'Exterior' && ct.totalDays > 0).map((configTask, index) => {
                  const isEnamelConfig = configTask.configLabel.toLowerCase().includes('enamel') || configTask.tasks.some((t: any) => t.name.toLowerCase().includes('enamel'));
                  return <Card key={index} className={`flex-none w-72 border-2 snap-start ${isEnamelConfig ? 'bg-orange-50 border-orange-300' : 'border-primary/20 bg-primary/5'}`}>
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
                                {configTask.tasks.map((task: any, taskIdx: number) => {
                            const adjustedDays = Math.ceil(task.daysRequired / autoLabourPerDay);
                            return <div key={taskIdx} className="space-y-2">
                                      <h4 className="text-base font-semibold text-foreground">{task.name}</h4>
                                      <div className="flex items-baseline justify-between">
                                        <div className="flex-1">
                                          <p className="text-sm text-muted-foreground">
                                            Area: <span className="font-medium text-foreground">{task.area.toFixed(0)} sq.ft</span>
                                          </p>
                                          <p className="text-sm text-muted-foreground">
                                            Coats: <span className="font-medium text-foreground">{task.coats}</span>
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-xl font-bold text-primary">{adjustedDays} days</p>
                                        </div>
                                      </div>
                                    </div>;
                          })}
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

                {/* Waterproofing Configurations */}
                {configTasks.filter(ct => ct.paintTypeCategory === 'Waterproofing' && ct.totalDays > 0).length > 0 && <div className="space-y-3">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      Waterproofing Configurations
                    </Badge>
                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}>
                      {configTasks.filter(ct => ct.paintTypeCategory === 'Waterproofing' && ct.totalDays > 0).map((configTask, index) => {
                  const isEnamelConfig = configTask.configLabel.toLowerCase().includes('enamel') || configTask.tasks.some((t: any) => t.name.toLowerCase().includes('enamel'));
                  return <Card key={index} className={`flex-none w-72 border-2 snap-start ${isEnamelConfig ? 'bg-orange-50 border-orange-300' : 'border-primary/20 bg-primary/5'}`}>
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
                                {configTask.tasks.map((task: any, taskIdx: number) => {
                            const adjustedDays = Math.ceil(task.daysRequired / autoLabourPerDay);
                            return <div key={taskIdx} className="space-y-2">
                                      <h4 className="text-base font-semibold text-foreground">{task.name}</h4>
                                      <div className="flex items-baseline justify-between">
                                        <div className="flex-1">
                                          <p className="text-sm text-muted-foreground">
                                            Area: <span className="font-medium text-foreground">{task.area.toFixed(0)} sq.ft</span>
                                          </p>
                                          <p className="text-sm text-muted-foreground">
                                            Coats: <span className="font-medium text-foreground">{task.coats}</span>
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-xl font-bold text-primary">{adjustedDays} days</p>
                                        </div>
                                      </div>
                                    </div>;
                          })}
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

          </div>
          )}
        </CardContent>
      </Card>;
  };

  // Helper function to get product pricing from database
  const getProductPricingFromDB = (productName: string): { sizes: { [key: string]: number }, unit: string } | null => {
    // Normalize product name for matching
    const normalizedName = productName.trim().toLowerCase();
    
    // Try exact match first
    let pricing = productPricing[normalizedName];
    
    // If no exact match, try partial match
    if (!pricing) {
      const matchKey = Object.keys(productPricing).find(key => 
        normalizedName.includes(key) || key.includes(normalizedName)
      );
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
      return { sizes: pricing as { [key: string]: number }, unit };
    }
    return null;
  };

  // Helper function to calculate optimal pack combination for maximum quantity
  const calculateOptimalPackCombination = (
    availableSizes: { size: string, price: number }[], 
    maxQuantity: number,
    unit: string
  ): { combination: { size: string, count: number, price: number }[], totalCost: number, error?: string } => {
    // Sort sizes in descending order
    const sortedSizes = [...availableSizes].sort((a, b) => {
      const sizeA = parseFloat(a.size.replace(/[^\d.]/g, ''));
      const sizeB = parseFloat(b.size.replace(/[^\d.]/g, ''));
      return sizeB - sizeA;
    });

    let remaining = maxQuantity;
    const combination: { size: string, count: number, price: number }[] = [];
    
    // Greedy algorithm: use largest packs first
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

    // If there's remaining quantity, add one more of the smallest available pack
    if (remaining > 0.01 && sortedSizes.length > 0) {
      const smallestPack = sortedSizes[sortedSizes.length - 1];
      const existing = combination.find(c => c.size === smallestPack.size);
      if (existing) {
        existing.count += 1;
      } else {
        combination.push({ size: smallestPack.size, count: 1, price: smallestPack.price });
      }
    }

    // Calculate total cost
    const totalCost = combination.reduce((sum, c) => sum + (c.count * c.price), 0);

    // Check if we couldn't satisfy the quantity
    if (combination.length === 0 && maxQuantity > 0) {
      return { 
        combination: [], 
        totalCost: 0, 
        error: "⚠️ Pack combination not found for full quantity." 
      };
    }

    return { combination, totalCost };
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
        // Show error if product not found in pricing
        toast({
          title: "Product name mismatch",
          description: `Product "${material}" not found in Product Pricing tab. Please check Product Pricing tab.`,
          variant: "destructive",
        });
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

      const { sizes, unit } = pricingData;
      
      // Determine material type for quantity calculation
      const isPutty = material.toLowerCase().includes('putty');
      
      // Calculate min and max quantities based on coverage variations
      const minQuantity = Math.ceil(quantity);
      // For putty, add fixed 10kg; for others, add 25%
      const maxQuantity = isPutty ? Math.ceil(quantity + 10) : Math.ceil(quantity * 1.25);

      // Prepare available pack sizes with prices
      const availablePacks = Object.entries(sizes).map(([size, price]) => ({
        size,
        price: price as number
      }));

      // Calculate optimal pack combination for MAX quantity
      const { combination, totalCost, error } = calculateOptimalPackCombination(
        availablePacks,
        maxQuantity,
        unit
      );

      // Format pack combination string
      const packCombination = combination.length > 0
        ? combination.map(c => `(${c.size}/${c.count})`).join('')
        : 'N/A';

      return {
        quantity: quantity.toFixed(2),
        minQuantity,
        maxQuantity,
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

    // Group materials by configuration
    const configMaterials: any[] = [];
    // Use calculationConfigs which includes Paint Estimation + Room Measurement enamel areas
    calculationConfigs.forEach(config => {
      const area = Number(config.area) || 0;
      const isFresh = config.paintingSystem === 'Fresh Painting';
      const materials: any[] = [];
      if (isFresh) {
        // Putty
        if (config.selectedMaterials.putty && config.coatConfiguration.putty > 0) {
          const coverage = 20; // sq ft per kg
          const kgNeeded = area / coverage * config.coatConfiguration.putty;
          const calc = calculateMaterial(config.selectedMaterials.putty, kgNeeded);
          materials.push({
            name: config.selectedMaterials.putty,
            type: 'Putty',
            ...calc
          });
        }

        // Primer
        if (config.selectedMaterials.primer && config.coatConfiguration.primer > 0) {
          // Use enamel-specific coverage for enamel primer
          const isEnamel = config.selectedMaterials.primer?.toLowerCase().includes('enamel') || config.selectedMaterials.emulsion?.toLowerCase().includes('enamel');
          const coverage = isEnamel ? 100 : 120; // sq ft per liter (enamel has lower coverage)
          const litersNeeded = area / coverage * config.coatConfiguration.primer;
          const calc = calculateMaterial(config.selectedMaterials.primer, litersNeeded);
          materials.push({
            name: config.selectedMaterials.primer,
            type: isEnamel ? 'Enamel' : 'Primer',
            ...calc
          });
        }

        // Emulsion
        if (config.selectedMaterials.emulsion && config.coatConfiguration.emulsion > 0) {
          const isEnamel = config.selectedMaterials.emulsion.toLowerCase().includes('enamel');
          const coverage = isEnamel ? 100 : 120; // sq ft per liter (enamel has lower coverage)
          const litersNeeded = area / coverage * config.coatConfiguration.emulsion;
          const calc = calculateMaterial(config.selectedMaterials.emulsion, litersNeeded);
          materials.push({
            name: config.selectedMaterials.emulsion,
            type: isEnamel ? 'Enamel' : 'Emulsion',
            ...calc
          });
        }
      } else {
        // Repainting
        if (config.selectedMaterials.primer && config.repaintingConfiguration?.primer && config.repaintingConfiguration.primer > 0) {
          const coverage = 120;
          const litersNeeded = area / coverage * config.repaintingConfiguration.primer;
          const calc = calculateMaterial(config.selectedMaterials.primer, litersNeeded);
          materials.push({
            name: config.selectedMaterials.primer,
            type: 'Primer',
            ...calc
          });
        }
        if (config.selectedMaterials.emulsion && config.repaintingConfiguration?.emulsion && config.repaintingConfiguration.emulsion > 0) {
          const coverage = 120;
          const litersNeeded = area / coverage * config.repaintingConfiguration.emulsion;
          const calc = calculateMaterial(config.selectedMaterials.emulsion, litersNeeded);
          materials.push({
            name: config.selectedMaterials.emulsion,
            type: config.selectedMaterials.emulsion.toLowerCase().includes('enamel') ? 'Enamel' : 'Emulsion',
            ...calc
          });
        }
      }
      const totalCost = materials.reduce((sum, m) => sum + m.totalCost, 0);
      configMaterials.push({
        configLabel: config.label || config.areaType,
        paintTypeCategory: config.paintTypeCategory,
        materials,
        totalCost
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
          {isLoadingMaterial ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Calculating material requirements...</p>
              </div>
            </div>
          ) : calculationConfigs.length === 0 ? <div className="text-sm text-muted-foreground p-4 border rounded-md bg-muted/30">
              No material configurations found.
            </div> : <div className="space-y-4">
              {/* Interior Configurations */}
              {configMaterials.filter(cm => cm.paintTypeCategory === 'Interior' && cm.totalCost > 0).length > 0 && <div className="space-y-3">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    Interior Paint Configurations
                  </Badge>
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
                    {configMaterials.filter(cm => cm.paintTypeCategory === 'Interior' && cm.totalCost > 0).map((configMat, index) => {
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
                              {configMat.materials.map((mat: any, matIdx: number) => <div key={matIdx} className="space-y-2">
                                  <h4 className="text-base font-semibold text-foreground">{mat.name}</h4>
                                  {mat.error && (
                                    <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                                      ⚠️ {mat.error}
                                    </div>
                                  )}
                                  <div className="flex items-baseline justify-between">
                                    <div className="flex-1">
                                      <p className="text-sm text-muted-foreground">
                                        Quantity: <span className="font-medium text-foreground">{mat.minQuantity} to <strong>{mat.maxQuantity}</strong> {mat.unit}</span>
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        (Cost calculated for max: {mat.maxQuantity} {mat.unit})
                                      </p>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        Coverage: <span className="font-medium text-foreground">{getMaterialCoverage(mat.name, mat.type)}</span>
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xl font-bold text-[#EA384C]">₹{mat.totalCost.toLocaleString('en-IN')}</p>
                                    </div>
                                  </div>
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

              {/* Exterior Configurations */}
              {configMaterials.filter(cm => cm.paintTypeCategory === 'Exterior' && cm.totalCost > 0).length > 0 && <div className="space-y-3">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    Exterior Paint Configurations
                  </Badge>
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
                    {configMaterials.filter(cm => cm.paintTypeCategory === 'Exterior' && cm.totalCost > 0).map((configMat, index) => {
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
                              {configMat.materials.map((mat: any, matIdx: number) => <div key={matIdx} className="space-y-2">
                                  <h4 className="text-base font-semibold text-foreground">{mat.name}</h4>
                                  {mat.error && (
                                    <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                                      ⚠️ {mat.error}
                                    </div>
                                  )}
                                  <div className="flex items-baseline justify-between">
                                    <div className="flex-1">
                                      <p className="text-sm text-muted-foreground">
                                        Quantity: <span className="font-medium text-foreground">{mat.minQuantity} to <strong>{mat.maxQuantity}</strong> {mat.unit}</span>
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        (Cost calculated for max: {mat.maxQuantity} {mat.unit})
                                      </p>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        Coverage: <span className="font-medium text-foreground">{getMaterialCoverage(mat.name, mat.type)}</span>
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xl font-bold text-[#EA384C]">₹{mat.totalCost.toLocaleString('en-IN')}</p>
                                    </div>
                                  </div>
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

              {/* Waterproofing Configurations */}
              {configMaterials.filter(cm => cm.paintTypeCategory === 'Waterproofing' && cm.totalCost > 0).length > 0 && <div className="space-y-3">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    Waterproofing Configurations
                  </Badge>
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
                    {configMaterials.filter(cm => cm.paintTypeCategory === 'Waterproofing' && cm.totalCost > 0).map((configMat, index) => {
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
                              {configMat.materials.map((mat: any, matIdx: number) => <div key={matIdx} className="space-y-2">
                                  <h4 className="text-base font-semibold text-foreground">{mat.name}</h4>
                                  {mat.error && (
                                    <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                                      ⚠️ {mat.error}
                                    </div>
                                  )}
                                  <div className="flex items-baseline justify-between">
                                    <div className="flex-1">
                                      <p className="text-sm text-muted-foreground">
                                        Quantity: <span className="font-medium text-foreground">{mat.minQuantity} to <strong>{mat.maxQuantity}</strong> {mat.unit}</span>
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        (Cost calculated for max: {mat.maxQuantity} {mat.unit})
                                      </p>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        Coverage: <span className="font-medium text-foreground">{getMaterialCoverage(mat.name, mat.type)}</span>
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xl font-bold text-[#EA384C]">₹{mat.totalCost.toLocaleString('en-IN')}</p>
                                    </div>
                                  </div>
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
    
    // Calculate labour cost using same logic as renderTotalCost
    const workingHours = 7;
    const standardHours = 8;
    const numberOfLabours = 1;
    const coverageRates = {
      waterBased: {
        putty: 800,
        primer: 1050,
        emulsion: 1050
      },
      oilBased: {
        redOxide: 350,
        enamelBase: 250,
        enamelTop: 200,
        full3Coat: 275
      }
    };
    const configTasks: any[] = [];
    areaConfigs.forEach(config => {
      const area = Number(config.area) || 0;
      const isFresh = config.paintingSystem === 'Fresh Painting';
      const isOilBased = config.selectedMaterials.emulsion?.toLowerCase().includes('enamel') || 
                        config.selectedMaterials.primer?.toLowerCase().includes('oxide') || 
                        config.selectedMaterials.emulsion?.toLowerCase().includes('oil');
      const tasks: any[] = [];
      if (isFresh) {
        if (config.coatConfiguration.putty > 0) {
          const totalWork = area * config.coatConfiguration.putty;
          const adjustedCoverage = coverageRates.waterBased.putty * (workingHours / standardHours);
          const daysRequired = Math.ceil(totalWork / (adjustedCoverage * numberOfLabours));
          tasks.push({ daysRequired });
        }
        if (config.coatConfiguration.primer > 0) {
          const totalWork = area * config.coatConfiguration.primer;
          const coverage = isOilBased ? coverageRates.oilBased.redOxide : coverageRates.waterBased.primer;
          const adjustedCoverage = coverage * (workingHours / standardHours);
          const daysRequired = Math.ceil(totalWork / (adjustedCoverage * numberOfLabours));
          tasks.push({ daysRequired });
        }
        if (config.coatConfiguration.emulsion > 0) {
          const totalWork = area * config.coatConfiguration.emulsion;
          const coverage = isOilBased ? coverageRates.oilBased.enamelTop : coverageRates.waterBased.emulsion;
          const adjustedCoverage = coverage * (workingHours / standardHours);
          const daysRequired = Math.ceil(totalWork / (adjustedCoverage * numberOfLabours));
          tasks.push({ daysRequired });
        }
      } else {
        if (config.repaintingConfiguration?.primer && config.repaintingConfiguration.primer > 0) {
          const totalWork = area * config.repaintingConfiguration.primer;
          const coverage = isOilBased ? coverageRates.oilBased.redOxide : coverageRates.waterBased.primer;
          const adjustedCoverage = coverage * (workingHours / standardHours);
          const daysRequired = Math.ceil(totalWork / (adjustedCoverage * numberOfLabours));
          tasks.push({ daysRequired });
        }
        if (config.repaintingConfiguration?.emulsion && config.repaintingConfiguration.emulsion > 0) {
          const totalWork = area * config.repaintingConfiguration.emulsion;
          const coverage = isOilBased ? coverageRates.oilBased.enamelTop : coverageRates.waterBased.emulsion;
          const adjustedCoverage = coverage * (workingHours / standardHours);
          const daysRequired = Math.ceil(totalWork / (adjustedCoverage * numberOfLabours));
          tasks.push({ daysRequired });
        }
      }
      configTasks.push({
        tasks,
        totalDays: tasks.reduce((sum, task) => sum + task.daysRequired, 0)
      });
    });
    
    const totalDays = configTasks.reduce((sum, ct) => sum + ct.totalDays, 0);
    const allTasks = configTasks.flatMap(ct => ct.tasks);
    const totalWorkAllTasks = allTasks.reduce((sum, task) => sum + task.daysRequired, 0);
    const laboursNeeded = manualDays > 0 ? Math.ceil(totalWorkAllTasks / manualDays) : 1;

    let labourCost = 0;
    if (labourMode === 'auto') {
      const displayDays = Math.ceil(totalDays / autoLabourPerDay);
      const displayLabours = autoLabourPerDay;
      labourCost = perDayLabourCost * displayLabours * displayDays;
    } else {
      const displayDays = manualDays;
      const displayLabours = laboursNeeded;
      labourCost = perDayLabourCost * displayLabours * displayDays;
    }
    
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

    // Use exact same labour calculation as Labour Section
    const workingHours = 7;
    const standardHours = 8;
    const numberOfLabours = 1;
    const coverageRates = {
      waterBased: {
        putty: 800,
        primer: 1050,
        emulsion: 1050
      },
      oilBased: {
        redOxide: 350,
        enamelBase: 250,
        enamelTop: 200,
        full3Coat: 275
      }
    };
    const configTasks: any[] = [];
    areaConfigs.forEach(config => {
      const area = Number(config.area) || 0;
      const isFresh = config.paintingSystem === 'Fresh Painting';
      const isOilBased = config.selectedMaterials.emulsion?.toLowerCase().includes('enamel') || config.selectedMaterials.primer?.toLowerCase().includes('oxide') || config.selectedMaterials.emulsion?.toLowerCase().includes('oil');
      const tasks: any[] = [];
      if (isFresh) {
        if (config.coatConfiguration.putty > 0) {
          const totalWork = area * config.coatConfiguration.putty;
          const adjustedCoverage = coverageRates.waterBased.putty * (workingHours / standardHours);
          const daysRequired = Math.ceil(totalWork / (adjustedCoverage * numberOfLabours));
          tasks.push({
            daysRequired
          });
        }
        if (config.coatConfiguration.primer > 0) {
          const totalWork = area * config.coatConfiguration.primer;
          const coverage = isOilBased ? coverageRates.oilBased.redOxide : coverageRates.waterBased.primer;
          const adjustedCoverage = coverage * (workingHours / standardHours);
          const daysRequired = Math.ceil(totalWork / (adjustedCoverage * numberOfLabours));
          tasks.push({
            daysRequired
          });
        }
        if (config.coatConfiguration.emulsion > 0) {
          const totalWork = area * config.coatConfiguration.emulsion;
          const coverage = isOilBased ? coverageRates.oilBased.enamelTop : coverageRates.waterBased.emulsion;
          const adjustedCoverage = coverage * (workingHours / standardHours);
          const daysRequired = Math.ceil(totalWork / (adjustedCoverage * numberOfLabours));
          tasks.push({
            daysRequired
          });
        }
      } else {
        if (config.repaintingConfiguration?.primer && config.repaintingConfiguration.primer > 0) {
          const totalWork = area * config.repaintingConfiguration.primer;
          const coverage = isOilBased ? coverageRates.oilBased.redOxide : coverageRates.waterBased.primer;
          const adjustedCoverage = coverage * (workingHours / standardHours);
          const daysRequired = Math.ceil(totalWork / (adjustedCoverage * numberOfLabours));
          tasks.push({
            daysRequired
          });
        }
        if (config.repaintingConfiguration?.emulsion && config.repaintingConfiguration.emulsion > 0) {
          const totalWork = area * config.repaintingConfiguration.emulsion;
          const coverage = isOilBased ? coverageRates.oilBased.enamelTop : coverageRates.waterBased.emulsion;
          const adjustedCoverage = coverage * (workingHours / standardHours);
          const daysRequired = Math.ceil(totalWork / (adjustedCoverage * numberOfLabours));
          tasks.push({
            daysRequired
          });
        }
      }
      configTasks.push({
        tasks,
        totalDays: tasks.reduce((sum, task) => sum + task.daysRequired, 0)
      });
    });
    const totalDays = configTasks.reduce((sum, ct) => sum + ct.totalDays, 0);
    const allTasks = configTasks.flatMap(ct => ct.tasks);
    const totalWorkAllTasks = allTasks.reduce((sum, task) => sum + task.daysRequired, 0);
    const averageCoverage = allTasks.length > 0 ? allTasks.reduce((sum, task) => sum + task.daysRequired, 0) / allTasks.length : 1000;
    const adjustedAverageCoverage = averageCoverage * (workingHours / standardHours);
    const laboursNeeded = manualDays > 0 ? Math.ceil(totalWorkAllTasks / manualDays) : 1;

    // Calculate labour cost - Formula: Per Day Labour Cost * Number of Labour * Days
    let labourCost = 0;
    let displayDays = 0;
    let displayLabours = 0;
    if (labourMode === 'auto') {
      displayDays = Math.ceil(totalDays / autoLabourPerDay);
      displayLabours = autoLabourPerDay;
      labourCost = perDayLabourCost * displayLabours * displayDays;
    } else {
      displayDays = manualDays;
      displayLabours = laboursNeeded;
      labourCost = perDayLabourCost * displayLabours * displayDays;
    }
    
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
  const calculateTotalEstimatedCost = () => {
    // Use material cost from Material Requirements section (stored in ref)
    const materialCost = totalMaterialCostRef.current;

    // Calculate labour cost based on current mode
    let labourCost = 0;
    const workingHours = 7;
    const standardHours = 8;
    if (labourMode === 'auto') {
      // Calculate total days needed
      let totalDays = 0;
      areaConfigs.forEach(config => {
        const area = Number(config.area) || 0;
        const isFresh = config.paintingSystem === 'Fresh Painting';
        const coveragePerDay = 150; // sq ft per labour per day

        if (isFresh) {
          if (config.coatConfiguration?.putty > 0) totalDays += Math.ceil(area * config.coatConfiguration.putty / coveragePerDay);
          if (config.coatConfiguration?.primer > 0) totalDays += Math.ceil(area * config.coatConfiguration.primer / coveragePerDay);
          if (config.coatConfiguration?.emulsion > 0) totalDays += Math.ceil(area * config.coatConfiguration.emulsion / coveragePerDay);
        } else {
          if (config.repaintingConfiguration?.primer > 0) totalDays += Math.ceil(area * config.repaintingConfiguration.primer / coveragePerDay);
          if (config.repaintingConfiguration?.emulsion > 0) totalDays += Math.ceil(area * config.repaintingConfiguration.emulsion / coveragePerDay);
        }
      });
      const adjustedDays = Math.ceil(totalDays / autoLabourPerDay);
      labourCost = perDayLabourCost * autoLabourPerDay * adjustedDays;
    } else {
      // Manual mode - calculate labourers needed
      let totalWork = 0;
      areaConfigs.forEach(config => {
        const area = Number(config.area) || 0;
        const isFresh = config.paintingSystem === 'Fresh Painting';
        if (isFresh) {
          if (config.coatConfiguration?.putty > 0) totalWork += area * config.coatConfiguration.putty;
          if (config.coatConfiguration?.primer > 0) totalWork += area * config.coatConfiguration.primer;
          if (config.coatConfiguration?.emulsion > 0) totalWork += area * config.coatConfiguration.emulsion;
        } else {
          if (config.repaintingConfiguration?.primer > 0) totalWork += area * config.repaintingConfiguration.primer;
          if (config.repaintingConfiguration?.emulsion > 0) totalWork += area * config.repaintingConfiguration.emulsion;
        }
      });
      const coveragePerDay = 150;
      const laboursNeeded = Math.ceil(totalWork / (coveragePerDay * manualDays));
      labourCost = perDayLabourCost * laboursNeeded * manualDays;
    }
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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to save projects",
          variant: "destructive",
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
      const projectTypeString = projectTypes.length > 0 ? projectTypes.join(', ') : (projectData?.projectTypes?.join(', ') || 'Interior');

      // Insert project into database
      const { error } = await supabase
        .from('projects')
        .insert({
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
          notification_count: 0,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project saved successfully!",
      });

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save project",
        variant: "destructive",
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
                      </div>) : paintType && <div className="inline-flex items-center px-4 py-2 font-semibold text-sm rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md transition-all duration-200 hover:shadow-lg" style={{
                  fontFamily: '"Segoe UI", "Inter", system-ui, sans-serif'
                }}>
                        {paintType}
                      </div>}
                </div>
              </CardContent>
            </Card>

            {/* Room Measurements */}
            <Card className="eca-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Room Measurements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="eca-gradient text-white rounded-lg p-4 space-y-4">
                  {Object.entries(totalAreas).map(([projectType, areas]: [string, {
                  wallArea: number;
                  floorArea: number;
                  ceilingArea: number;
                }]) => {
                  const hasFloor = areas.floorArea > 0;
                  const hasWall = areas.wallArea > 0;
                  const hasCeiling = areas.ceilingArea > 0;
                  const activeAreas = [hasFloor, hasWall, hasCeiling].filter(Boolean).length;
                  if (activeAreas === 0) return null;
                  return <div key={projectType} className="space-y-2">
                        <div className="text-sm font-semibold text-white/90 border-b border-white/20 pb-1">
                          {projectType}
                        </div>
                        <div className={`grid gap-4 text-center ${activeAreas === 1 ? 'grid-cols-1' : activeAreas === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                          {hasWall && <div>
                              <p className="text-white/80 text-sm">Total Wall</p>
                              <p className="text-xl font-bold">{areas.wallArea.toFixed(1)}</p>
                              <p className="text-white/80 text-xs">sq.ft</p>
                            </div>}
                          {hasFloor && <div>
                              <p className="text-white/80 text-sm">Total Floor</p>
                              <p className="text-xl font-bold">{areas.floorArea.toFixed(1)}</p>
                              <p className="text-white/80 text-xs">sq.ft</p>
                            </div>}
                          {hasCeiling && <div>
                              <p className="text-white/80 text-sm">Total Ceiling</p>
                              <p className="text-xl font-bold">{areas.ceilingArea.toFixed(1)}</p>
                              <p className="text-white/80 text-xs">sq.ft</p>
                            </div>}
                        </div>
                      </div>;
                })}
                </div>
              </CardContent>
            </Card>

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
                    <p className="text-sm text-muted-foreground mb-2">Company Project Cost</p>
                    <p className="text-xl font-bold text-foreground">
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
                    <p className="text-sm text-muted-foreground mb-2">
                      Actual<br />Project Cost
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      ₹{Math.round(calculateActualTotalCost()).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-300 mb-2 font-medium">Average Value</p>
                  <p className="text-3xl font-bold text-red-700 dark:text-red-300">
                    ₹{Math.abs(
                      areaConfigs.reduce((sum, config) => {
                        const area = Number(config.area) || 0;
                        const rate = parseFloat(config.perSqFtRate) || 0;
                        return sum + area * rate;
                      }, 0) - calculateActualTotalCost()
                    ).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
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
              <Button 
                onClick={handleSaveProject}
                className="w-full h-12 text-base font-medium"
                size="lg"
              >
                Save Project
              </Button>
            </div>
            <div className="h-20"></div>
          </TabsContent>
        </Tabs>
      </div>
    </div>;
}