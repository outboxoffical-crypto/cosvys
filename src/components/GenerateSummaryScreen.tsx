import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Palette, Home, Users, Package, TrendingUp, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AreaConfig {
  id: string;
  areaType: string;
  paintingSystem: string;
  area: number;
  perSqFtRate: string;
  label?: string;
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
  const { projectId } = useParams();
  const [loading, setLoading] = useState(true);
  const [areaConfigs, setAreaConfigs] = useState<AreaConfig[]>([]);
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
  const labourConfigRef = useRef<HTMLDivElement>(null);
  const materialConfigRef = useRef<HTMLDivElement>(null);
  const perDayLabourCost = 1100; // Fixed per day labour cost in rupees

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      // Prefer snapshot saved when user clicked Continue in Estimation
      const estimationKey = `estimation_${projectId}`;
      const estimationStr = localStorage.getItem(estimationKey);
      const storedPaintType = localStorage.getItem(`selected_paint_type_${projectId}`) || 'Interior';

      if (estimationStr) {
        const est = JSON.parse(estimationStr);
        const pt = est.paintType || storedPaintType;
        setPaintType(pt);
        const configurations = Array.isArray(est.configurations) ? est.configurations : [];
        console.log('Loaded configs from estimation:', configurations.length);
        setAreaConfigs(configurations);
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
        console.log('Loaded fallback configs:', configs);
        setAreaConfigs(Array.isArray(configs) ? configs : []);
      }

      // Load rooms from backend
      const { data: roomsData } = await supabase
        .from('rooms')
        .select('*')
        .eq('project_id', projectId);
      if (roomsData) setRooms(roomsData);

      // Load dealer info
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: dealerData } = await supabase
          .from('dealer_info')
          .select('margin')
          .eq('user_id', user.id)
          .single();
        if (dealerData) setDealerMargin(Number(dealerData.margin) || 0);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
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
      
      // Sync labour carousel scroll
      if (labourConfigRef.current && container === paintConfigRef.current) {
        labourConfigRef.current.scrollLeft = scrollLeft;
      }
      // Sync material carousel scroll
      if (materialConfigRef.current && container === paintConfigRef.current) {
        materialConfigRef.current.scrollLeft = scrollLeft;
      }
    };

    return (
      <Card className="eca-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Palette className="h-5 w-5 text-primary" />
            Paint Configuration Details
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Summary from {paintType} section</p>
        </CardHeader>
        <CardContent>
          {areaConfigs.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4 border rounded-md bg-muted/30">
              No paint configurations found. Please add them in Paint Estimation and click Generate Summary.
            </div>
          ) : (
            <div ref={paintConfigRef} className="-mx-4 px-4 overflow-x-auto scroll-smooth touch-pan-x" onScroll={handleScroll}>
              <div className="flex gap-4 pb-2 snap-x snap-mandatory" style={{ minWidth: 'min-content' }}>
                {areaConfigs.map((config, index) => {
                  const area = Number(config.area) || 0;
                  const rate = parseFloat(config.perSqFtRate) || 0;
                  const cost = area * rate;
                  const coats = config.paintingSystem === 'Fresh Painting' 
                    ? `Putty: ${config.coatConfiguration.putty}, Primer: ${config.coatConfiguration.primer}, Emulsion: ${config.coatConfiguration.emulsion}`
                    : `Primer: ${config.repaintingConfiguration?.primer || 0}, Emulsion: ${config.repaintingConfiguration?.emulsion || 0}`;

                  return (
                    <div key={config.id} className="snap-start flex-shrink-0 w-72 p-4 border border-border rounded-lg bg-muted/30 eca-shadow">
                      <div className="mb-3 pb-2 border-b border-border">
                        <p className="text-xs text-primary uppercase tracking-wide font-medium">{paintType}</p>
                        <p className="font-semibold text-base mt-1 text-foreground">{config.label || config.areaType}</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Paint Type:</span>
                          <span className="font-medium text-foreground">{config.areaType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Painting System:</span>
                          <span className="font-medium text-foreground">{config.paintingSystem || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Coats:</span>
                          <span className="font-medium text-foreground text-xs">{coats}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Area Sq.Ft:</span>
                          <span className="font-medium text-foreground">{area.toFixed(2)}</span>
                        </div>
                        <div className="pt-2 mt-2 border-t border-border space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Per Sq.Ft Rate:</span>
                            <span className="font-semibold text-foreground">₹{rate.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-foreground">Cost of Sq.Ft:</span>
                            <span className="font-bold text-primary">₹{cost.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Section 2: Total Room Details
  const renderRoomDetails = () => {
    let totalFloor = 0;
    let totalWall = 0;
    let totalCeiling = 0;

    rooms.forEach(room => {
      const selectedAreas = room.selected_areas || { floor: true, wall: true, ceiling: false };
      if (selectedAreas.floor) totalFloor += Number(room.floor_area || 0);
      if (selectedAreas.wall) totalWall += Number(room.adjusted_wall_area || room.wall_area || 0);
      if (selectedAreas.ceiling) totalCeiling += Number(room.ceiling_area || 0);
    });

    return (
      <Card className="eca-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Home className="h-5 w-5 text-primary" />
            Total Room Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Individual Rooms First */}
            <div className="space-y-2">
              <p className="font-semibold text-foreground">Individual Rooms</p>
              {rooms.map(room => {
                const selectedAreas = room.selected_areas || { floor: true, wall: true, ceiling: false };
                return (
                  <div key={room.id} className="p-3 border border-border rounded-lg text-sm bg-muted/30 eca-shadow">
                    <p className="font-medium text-foreground">{room.name}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                      {selectedAreas.floor && (
                        <p>Floor: <span className="font-medium text-foreground">{Number(room.floor_area || 0).toFixed(2)} Sq. Ft</span></p>
                      )}
                      {selectedAreas.wall && (
                        <p>Wall: <span className="font-medium text-foreground">{Number(room.adjusted_wall_area || room.wall_area || 0).toFixed(2)} Sq. Ft</span></p>
                      )}
                      {selectedAreas.ceiling && (
                        <p>Ceiling: <span className="font-medium text-foreground">{Number(room.ceiling_area || 0).toFixed(2)} Sq. Ft</span></p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals Second with Project Type */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs text-primary uppercase tracking-wide font-medium mb-2">{paintType}</p>
              <p className="font-semibold text-foreground text-base">Project Totals</p>
              <div className="flex flex-wrap gap-4 text-sm mt-3">
                {totalFloor > 0 && <p className="text-muted-foreground">Floor: <span className="font-semibold text-foreground">{totalFloor.toFixed(2)} Sq. Ft</span></p>}
                {totalWall > 0 && <p className="text-muted-foreground">Wall: <span className="font-semibold text-foreground">{totalWall.toFixed(2)} Sq. Ft</span></p>}
                {totalCeiling > 0 && <p className="text-muted-foreground">Ceiling: <span className="font-semibold text-foreground">{totalCeiling.toFixed(2)} Sq. Ft</span></p>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Section 3: Labour Section
  const renderLabourSection = () => {
    const workingHours = 7;
    const standardHours = 8;
    const numberOfLabours = 1;

    // Handle labour carousel scroll - sync with paint config carousel
    const handleLabourScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const container = e.currentTarget;
      const scrollLeft = container.scrollLeft;
      const cardWidth = 288 + 16; // 72 * 4 (w-72) + gap-4
      const newIndex = Math.round(scrollLeft / cardWidth);
      setActiveConfigIndex(newIndex);
      
      // Sync paint config carousel scroll
      if (paintConfigRef.current && container === labourConfigRef.current) {
        paintConfigRef.current.scrollLeft = scrollLeft;
      }
      // Sync material config carousel scroll
      if (materialConfigRef.current && container === labourConfigRef.current) {
        materialConfigRef.current.scrollLeft = scrollLeft;
      }
    };

    // Coverage rates per labour per day (8 hrs) - using average values
    const coverageRates = {
      waterBased: {
        putty: 800,
        primer: 1050,
        emulsion: 1050,
      },
      oilBased: {
        redOxide: 350,
        enamelBase: 250,
        enamelTop: 200,
        full3Coat: 275,
      }
    };

    // Group tasks by configuration
    const configTasks: any[] = [];

    areaConfigs.forEach(config => {
      const area = Number(config.area) || 0;
      const isFresh = config.paintingSystem === 'Fresh Painting';
      
      // Determine if water-based or oil-based
      const isOilBased = config.selectedMaterials.emulsion?.toLowerCase().includes('enamel') || 
                         config.selectedMaterials.primer?.toLowerCase().includes('oxide') ||
                         config.selectedMaterials.emulsion?.toLowerCase().includes('oil');
      
      const tasks: any[] = [];
      
      if (isFresh) {
        // Putty
        if (config.coatConfiguration.putty > 0) {
          const totalWork = area * config.coatConfiguration.putty;
          const adjustedCoverage = coverageRates.waterBased.putty * (workingHours / standardHours);
          const daysRequired = Math.ceil(totalWork / (adjustedCoverage * numberOfLabours));
          tasks.push({
            name: 'Putty',
            area,
            coats: config.coatConfiguration.putty,
            totalWork,
            coverage: coverageRates.waterBased.putty,
            daysRequired,
          });
        }
        
        // Primer
        if (config.coatConfiguration.primer > 0) {
          const totalWork = area * config.coatConfiguration.primer;
          const coverage = isOilBased ? coverageRates.oilBased.redOxide : coverageRates.waterBased.primer;
          const adjustedCoverage = coverage * (workingHours / standardHours);
          const daysRequired = Math.ceil(totalWork / (adjustedCoverage * numberOfLabours));
          tasks.push({
            name: 'Primer',
            area,
            coats: config.coatConfiguration.primer,
            totalWork,
            coverage,
            daysRequired,
          });
        }
        
        // Emulsion/Paint
        if (config.coatConfiguration.emulsion > 0) {
          const totalWork = area * config.coatConfiguration.emulsion;
          const coverage = isOilBased ? coverageRates.oilBased.enamelTop : coverageRates.waterBased.emulsion;
          const adjustedCoverage = coverage * (workingHours / standardHours);
          const daysRequired = Math.ceil(totalWork / (adjustedCoverage * numberOfLabours));
          tasks.push({
            name: isOilBased ? 'Enamel' : 'Emulsion',
            area,
            coats: config.coatConfiguration.emulsion,
            totalWork,
            coverage,
            daysRequired,
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
            name: 'Primer',
            area,
            coats: config.repaintingConfiguration.primer,
            totalWork,
            coverage,
            daysRequired,
          });
        }
        
        if (config.repaintingConfiguration?.emulsion && config.repaintingConfiguration.emulsion > 0) {
          const totalWork = area * config.repaintingConfiguration.emulsion;
          const coverage = isOilBased ? coverageRates.oilBased.enamelTop : coverageRates.waterBased.emulsion;
          const adjustedCoverage = coverage * (workingHours / standardHours);
          const daysRequired = Math.ceil(totalWork / (adjustedCoverage * numberOfLabours));
          tasks.push({
            name: isOilBased ? 'Enamel' : 'Emulsion',
            area,
            coats: config.repaintingConfiguration.emulsion,
            totalWork,
            coverage,
            daysRequired,
          });
        }
      }

      configTasks.push({
        configLabel: config.label || config.areaType,
        tasks,
        totalDays: tasks.reduce((sum, task) => sum + task.daysRequired, 0),
      });
    });

    const totalDays = configTasks.reduce((sum, ct) => sum + ct.totalDays, 0);
    const allTasks = configTasks.flatMap(ct => ct.tasks);
    
    // Calculate labourers needed for manual mode
    const totalWorkAllTasks = allTasks.reduce((sum, task) => sum + task.totalWork, 0);
    const averageCoverage = allTasks.length > 0 
      ? allTasks.reduce((sum, task) => sum + task.coverage, 0) / allTasks.length 
      : 1000;
    const adjustedAverageCoverage = averageCoverage * (workingHours / standardHours);
    const laboursNeeded = manualDays > 0 
      ? Math.ceil(totalWorkAllTasks / (adjustedAverageCoverage * manualDays))
      : 1;

    const displayDays = labourMode === 'auto' ? Math.ceil(totalDays / autoLabourPerDay) : manualDays;
    const displayLabours = labourMode === 'auto' ? autoLabourPerDay : laboursNeeded;

    return (
      <Card className="eca-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Users className="h-5 w-5 text-primary" />
            Labour Calculation
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Based on {workingHours} working hours per day</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Mode Selector */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
              <Button
                variant={labourMode === 'auto' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLabourMode('auto')}
                className="text-xs"
              >
                Auto
              </Button>
              <Button
                variant={labourMode === 'manual' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLabourMode('manual')}
                className="text-xs"
              >
                Manual
              </Button>
            </div>

            {/* Auto Mode - Per Day Labour Input */}
            {labourMode === 'auto' && (
              <div className="p-3 border border-border rounded-lg bg-muted/30">
                <label className="text-sm font-medium mb-2 block text-foreground">Per Day Labour</label>
                <input
                  type="number"
                  min="1"
                  value={autoLabourPerDayInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setAutoLabourPerDayInput(value);
                    const numValue = parseInt(value, 10);
                    if (!isNaN(numValue) && numValue > 0) {
                      setAutoLabourPerDay(numValue);
                    }
                  }}
                  onBlur={() => {
                    const numValue = parseInt(autoLabourPerDayInput, 10);
                    if (isNaN(numValue) || numValue < 1) {
                      setAutoLabourPerDay(1);
                      setAutoLabourPerDayInput('1');
                    } else {
                      setAutoLabourPerDay(numValue);
                      setAutoLabourPerDayInput(String(numValue));
                    }
                  }}
                  className="w-full px-3 py-2 border border-input-border rounded text-sm bg-background"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Number of labourers you can arrange per day
                </p>
              </div>
            )}

            {/* Manual Days Input */}
            {labourMode === 'manual' && (
              <div className="p-3 border border-border rounded-lg bg-muted/30">
                <label className="text-sm font-medium mb-2 block text-foreground">Desired Completion Days</label>
                <input
                  type="number"
                  min="1"
                  value={manualDaysInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setManualDaysInput(value);
                    const numValue = parseInt(value, 10);
                    if (!isNaN(numValue) && numValue > 0) {
                      setManualDays(numValue);
                    }
                  }}
                  onBlur={() => {
                    const numValue = parseInt(manualDaysInput, 10);
                    if (isNaN(numValue) || numValue < 1) {
                      setManualDays(1);
                      setManualDaysInput('1');
                    } else {
                      setManualDays(numValue);
                      setManualDaysInput(String(numValue));
                    }
                  }}
                  className="w-full px-3 py-2 border border-input-border rounded text-sm bg-background"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Labourers needed: <span className="font-semibold text-primary">{laboursNeeded}</span> per day
                </p>
              </div>
            )}
            {/* Labour Calculation Breakdown - Carousel Style */}
            {labourMode === 'auto' && configTasks.length > 0 && (
              <div>
                <p className="font-semibold text-sm mb-2 text-foreground">Labour Calculation Breakdown</p>
                <div ref={labourConfigRef} className="-mx-4 px-4 overflow-x-auto scroll-smooth touch-pan-x" onScroll={handleLabourScroll}>
                  <div className="flex gap-4 pb-2 snap-x snap-mandatory" style={{ minWidth: 'min-content' }}>
                    {configTasks.map((configTask, index) => (
                      <div 
                        key={index} 
                        className={`snap-start flex-shrink-0 w-72 p-4 border border-border rounded-lg eca-shadow transition-all ${
                          index === activeConfigIndex ? 'bg-primary/5 border-primary' : 'bg-muted/30'
                        }`}
                      >
                        <div className="mb-3 pb-2 border-b border-border">
                          <p className="text-xs text-primary uppercase tracking-wide font-medium">Labour Required</p>
                          <p className="font-semibold text-base mt-1 text-foreground">{configTask.configLabel}</p>
                        </div>
                         <div className="space-y-2">
                          {configTask.tasks.map((task: any, taskIdx: number) => {
                            const adjustedDays = Math.ceil(task.daysRequired / autoLabourPerDay);
                            return (
                              <div key={taskIdx} className="p-3 bg-card rounded-lg text-xs border border-border">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-medium text-foreground">{task.name}</span>
                                  <span className="font-bold text-primary">{adjustedDays} days</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                                  <p>Area: <span className="font-medium text-foreground">{task.area.toFixed(0)} sq.ft</span></p>
                                  <p>Coats: <span className="font-medium text-foreground">{task.coats}</span></p>
                                  <p>Work: <span className="font-medium text-foreground">{task.totalWork.toFixed(0)} sq.ft</span></p>
                                  <p>Coverage: <span className="font-medium text-foreground">{task.coverage} sq.ft/day</span></p>
                                </div>
                              </div>
                            );
                          })}
                          <div className="pt-2 mt-2 border-t border-border flex justify-between items-center">
                            <span className="text-xs font-medium text-muted-foreground">Total Days:</span>
                            <span className="text-lg font-bold text-primary">{Math.ceil(configTask.totalDays / autoLabourPerDay)} days</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border-2 border-primary">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {labourMode === 'auto' ? 'Total Project Duration' : 'Custom Project Duration'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">With {displayLabours} labour(s)</p>
                </div>
                <p className="text-2xl font-bold text-primary">{displayDays} days</p>
              </div>
            </div>

            {/* Per Day Labour - Only in Manual Mode */}
            {labourMode === 'manual' && (
              <>
                <div className="p-3 bg-muted/30 rounded-lg border border-border">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-muted-foreground">Per Day Labour</p>
                    <p className="text-xl font-bold text-foreground">{laboursNeeded}</p>
                  </div>
                </div>

                {/* Total Labour (Man-Days) */}
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
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
              </>
            )}

          </div>
        </CardContent>
      </Card>
    );
  };

  // Section 4: Material Section
  const renderMaterialSection = () => {
    // Handle material carousel scroll - sync with paint config carousel
    const handleMaterialScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const container = e.currentTarget;
      const scrollLeft = container.scrollLeft;
      const cardWidth = 288 + 16; // 72 * 4 (w-72) + gap-4
      const newIndex = Math.round(scrollLeft / cardWidth);
      setActiveConfigIndex(newIndex);
      
      // Sync paint config carousel scroll
      if (paintConfigRef.current && container === materialConfigRef.current) {
        paintConfigRef.current.scrollLeft = scrollLeft;
      }
      // Sync labour config carousel scroll
      if (labourConfigRef.current && container === materialConfigRef.current) {
        labourConfigRef.current.scrollLeft = scrollLeft;
      }
    };

    // Material pack sizes and prices (example prices - adjust as needed)
    const materialPricing: any = {
      'Putty': { packSize: 40, unit: 'kg', pricePerPack: 800 },
      'Primer': { packSize: 20, unit: 'L', pricePerPack: 1200 },
      'Emulsion': { packSize: 20, unit: 'L', pricePerPack: 2500 },
      'Enamel': { packSize: 4, unit: 'L', pricePerPack: 600 },
    };

    // Helper function to calculate material requirements and cost
    const calculateMaterial = (material: string, quantity: number) => {
      let materialKey = 'Emulsion';
      if (material.toLowerCase().includes('putty')) materialKey = 'Putty';
      else if (material.toLowerCase().includes('primer')) materialKey = 'Primer';
      else if (material.toLowerCase().includes('enamel')) materialKey = 'Enamel';

      const pricing = materialPricing[materialKey];
      const packsNeeded = Math.ceil(quantity / pricing.packSize);
      const totalCost = packsNeeded * pricing.pricePerPack;

      return {
        quantity: quantity.toFixed(2),
        unit: pricing.unit,
        packsNeeded,
        packSize: pricing.packSize,
        totalCost,
      };
    };

    // Group materials by configuration
    const configMaterials: any[] = [];

    areaConfigs.forEach(config => {
      const area = Number(config.area) || 0;
      const isFresh = config.paintingSystem === 'Fresh Painting';
      
      const materials: any[] = [];
      
      if (isFresh) {
        // Putty
        if (config.selectedMaterials.putty && config.coatConfiguration.putty > 0) {
          const coverage = 20; // sq ft per kg
          const kgNeeded = (area / coverage) * config.coatConfiguration.putty;
          const calc = calculateMaterial(config.selectedMaterials.putty, kgNeeded);
          materials.push({
            name: config.selectedMaterials.putty,
            type: 'Putty',
            ...calc,
          });
        }
        
        // Primer
        if (config.selectedMaterials.primer && config.coatConfiguration.primer > 0) {
          const coverage = 120; // sq ft per liter
          const litersNeeded = (area / coverage) * config.coatConfiguration.primer;
          const calc = calculateMaterial(config.selectedMaterials.primer, litersNeeded);
          materials.push({
            name: config.selectedMaterials.primer,
            type: 'Primer',
            ...calc,
          });
        }
        
        // Emulsion
        if (config.selectedMaterials.emulsion && config.coatConfiguration.emulsion > 0) {
          const coverage = 120; // sq ft per liter
          const litersNeeded = (area / coverage) * config.coatConfiguration.emulsion;
          const calc = calculateMaterial(config.selectedMaterials.emulsion, litersNeeded);
          materials.push({
            name: config.selectedMaterials.emulsion,
            type: config.selectedMaterials.emulsion.toLowerCase().includes('enamel') ? 'Enamel' : 'Emulsion',
            ...calc,
          });
        }
      } else {
        // Repainting
        if (config.selectedMaterials.primer && config.repaintingConfiguration?.primer && config.repaintingConfiguration.primer > 0) {
          const coverage = 120;
          const litersNeeded = (area / coverage) * config.repaintingConfiguration.primer;
          const calc = calculateMaterial(config.selectedMaterials.primer, litersNeeded);
          materials.push({
            name: config.selectedMaterials.primer,
            type: 'Primer',
            ...calc,
          });
        }
        
        if (config.selectedMaterials.emulsion && config.repaintingConfiguration?.emulsion && config.repaintingConfiguration.emulsion > 0) {
          const coverage = 120;
          const litersNeeded = (area / coverage) * config.repaintingConfiguration.emulsion;
          const calc = calculateMaterial(config.selectedMaterials.emulsion, litersNeeded);
          materials.push({
            name: config.selectedMaterials.emulsion,
            type: config.selectedMaterials.emulsion.toLowerCase().includes('enamel') ? 'Enamel' : 'Emulsion',
            ...calc,
          });
        }
      }

      const totalCost = materials.reduce((sum, m) => sum + m.totalCost, 0);
      
      configMaterials.push({
        configLabel: config.label || config.areaType,
        materials,
        totalCost,
      });
    });

    return (
      <Card className="eca-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Package className="h-5 w-5 text-primary" />
            Material Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {areaConfigs.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4 border rounded-md bg-muted/30">
              No material configurations found.
            </div>
          ) : (
            <div ref={materialConfigRef} className="-mx-4 px-4 overflow-x-auto scroll-smooth touch-pan-x" onScroll={handleMaterialScroll}>
              <div className="flex gap-4 pb-2 snap-x snap-mandatory" style={{ minWidth: 'min-content' }}>
                {configMaterials.map((configMat, index) => (
                  <div key={index} className="snap-start flex-shrink-0 w-72 p-4 border border-border rounded-lg bg-muted/30 eca-shadow">
                    <div className="mb-3 pb-2 border-b border-border">
                      <p className="text-xs text-primary uppercase tracking-wide font-medium">Material Required</p>
                      <p className="font-semibold text-base mt-1 text-foreground">{configMat.configLabel}</p>
                    </div>
                    <div className="space-y-2">
                        {configMat.materials.map((mat: any, matIdx: number) => (
                          <div key={matIdx} className="p-3 bg-card rounded-lg text-xs border border-border">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-foreground">{mat.name}</span>
                              <span className="font-bold text-primary">{mat.quantity} {mat.unit}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                              <p>Quantity: <span className="font-medium text-foreground">{mat.quantity} {mat.unit}</span></p>
                              <p>Pack: {mat.packSize}{mat.unit}</p>
                              <p>Packs: {mat.packsNeeded}</p>
                              <p>Cost: ₹{mat.totalCost}</p>
                            </div>
                          </div>
                        ))}
                      <div className="pt-2 mt-2 border-t flex justify-between items-center">
                        <span className="text-xs font-medium">Total Cost:</span>
                        <span className="text-lg font-bold text-primary">₹{configMat.totalCost.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total Cost Material Summary */}
          {configMaterials.length > 0 && (
            <div className="p-3 bg-primary/10 rounded border-2 border-primary/20 mt-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Cost Material</p>
                  <p className="text-xs text-muted-foreground mt-0.5">All configurations combined</p>
                </div>
                <p className="text-2xl font-bold text-primary">
                  ₹{configMaterials.reduce((sum, cm) => sum + cm.totalCost, 0).toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Section 5: Dealer Margin
  const renderDealerMargin = () => {
    const totalMaterialCost = areaConfigs.reduce((sum, config) => {
      const area = Number(config.area) || 0;
      const rate = parseFloat(config.perSqFtRate) || 0;
      return sum + (area * rate);
    }, 0);
    
    const marginCost = (totalMaterialCost * dealerMargin) / 100;

    return (
      <Card className="eca-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <TrendingUp className="h-5 w-5 text-primary" />
            Dealer Margin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Dealer Margin</span>
                <span className="text-lg font-semibold text-foreground">{dealerMargin}%</span>
              </div>
            </div>
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Margin Cost</span>
                <span className="text-lg font-bold text-primary">₹{marginCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Section 6: Estimated Total Cost
  const renderTotalCost = () => {
    const materialCost = areaConfigs.reduce((sum, config) => {
      const area = Number(config.area) || 0;
      const rate = parseFloat(config.perSqFtRate) || 0;
      return sum + (area * rate);
    }, 0);

    // Use the same labour calculation as in Labour Section
    const workingHours = 7; // Match Labour Section
    const standardHours = 8;
    const coverageRates = {
      waterBased: {
        putty: 800,
        primer: 1050,
        emulsion: 1050,
      },
      oilBased: {
        redOxide: 350,
        enamelBase: 250,
        enamelTop: 200,
        full3Coat: 275,
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
          const daysRequired = Math.ceil(totalWork / adjustedCoverage);
          tasks.push({ daysRequired });
        }
        if (config.coatConfiguration.primer > 0) {
          const totalWork = area * config.coatConfiguration.primer;
          const coverage = isOilBased ? coverageRates.oilBased.redOxide : coverageRates.waterBased.primer;
          const adjustedCoverage = coverage * (workingHours / standardHours);
          const daysRequired = Math.ceil(totalWork / adjustedCoverage);
          tasks.push({ daysRequired });
        }
        if (config.coatConfiguration.emulsion > 0) {
          const totalWork = area * config.coatConfiguration.emulsion;
          const coverage = isOilBased ? coverageRates.oilBased.enamelTop : coverageRates.waterBased.emulsion;
          const adjustedCoverage = coverage * (workingHours / standardHours);
          const daysRequired = Math.ceil(totalWork / adjustedCoverage);
          tasks.push({ daysRequired });
        }
      } else {
        if (config.repaintingConfiguration?.primer && config.repaintingConfiguration.primer > 0) {
          const totalWork = area * config.repaintingConfiguration.primer;
          const coverage = isOilBased ? coverageRates.oilBased.redOxide : coverageRates.waterBased.primer;
          const adjustedCoverage = coverage * (workingHours / standardHours);
          const daysRequired = Math.ceil(totalWork / adjustedCoverage);
          tasks.push({ daysRequired });
        }
        if (config.repaintingConfiguration?.emulsion && config.repaintingConfiguration.emulsion > 0) {
          const totalWork = area * config.repaintingConfiguration.emulsion;
          const coverage = isOilBased ? coverageRates.oilBased.enamelTop : coverageRates.waterBased.emulsion;
          const adjustedCoverage = coverage * (workingHours / standardHours);
          const daysRequired = Math.ceil(totalWork / adjustedCoverage);
          tasks.push({ daysRequired });
        }
      }
      
      configTasks.push({
        totalDays: tasks.reduce((sum, task) => sum + task.daysRequired, 0)
      });
    });

    const totalDays = configTasks.reduce((sum, ct) => sum + ct.totalDays, 0);
    
    // Calculate labour cost based on mode - using same logic as Labour Section
    let labourCost = 0;
    let displayDays = 0;
    let displayLabours = 0;
    
    if (labourMode === 'auto') {
      displayDays = Math.ceil(totalDays / autoLabourPerDay);
      displayLabours = autoLabourPerDay;
      labourCost = perDayLabourCost * displayLabours * displayDays;
    } else {
      const allTasks = configTasks.flatMap(ct => ct);
      const totalWorkAllTasks = areaConfigs.reduce((sum, config) => {
        const area = Number(config.area) || 0;
        const isFresh = config.paintingSystem === 'Fresh Painting';
        if (isFresh) {
          return sum + (area * ((config.coatConfiguration?.putty || 0) + (config.coatConfiguration?.primer || 0) + (config.coatConfiguration?.emulsion || 0)));
        } else {
          return sum + (area * ((config.repaintingConfiguration?.primer || 0) + (config.repaintingConfiguration?.emulsion || 0)));
        }
      }, 0);
      
      const averageCoverage = 1000;
      const adjustedAverageCoverage = averageCoverage * (workingHours / standardHours);
      const laboursNeeded = manualDays > 0 
        ? Math.ceil(totalWorkAllTasks / (adjustedAverageCoverage * manualDays))
        : 1;
      
      displayDays = manualDays;
      displayLabours = laboursNeeded;
      labourCost = perDayLabourCost * displayLabours * displayDays;
    }

    const marginCost = (materialCost * dealerMargin) / 100;
    const totalCost = materialCost + marginCost + labourCost;

    return (
      <Card className="eca-shadow bg-card border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <DollarSign className="h-5 w-5 text-primary" />
            Project Total Cost
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
                <span className="text-base font-semibold text-foreground">Project Total</span>
                <span className="text-2xl font-bold text-primary">₹{totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="eca-gradient text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate(`/paint-estimation/${projectId}`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Generate Summary</h1>
              <p className="text-white/80 text-sm">Complete project cost breakdown</p>
            </div>
          </div>
          <FileText className="h-6 w-6" />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {renderTypeDetails()}
        {renderRoomDetails()}
        {renderLabourSection()}
        {renderMaterialSection()}
        {renderDealerMargin()}
        {renderTotalCost()}
      </div>
    </div>
  );
}
