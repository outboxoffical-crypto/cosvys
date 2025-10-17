import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";
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
  const [activeConfigIndex, setActiveConfigIndex] = useState(0);
  const paintConfigRef = useRef<HTMLDivElement>(null);
  const labourConfigRef = useRef<HTMLDivElement>(null);

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
    };

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">1. Type of Interior & Wall Full Details</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Paint configuration summary from {paintType} section</p>
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
                    <div key={config.id} className="snap-start flex-shrink-0 w-72 p-4 border rounded-lg bg-card shadow-sm">
                      <div className="mb-3 pb-2 border-b">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">{paintType}</p>
                        <p className="font-semibold text-base mt-1">{config.label || config.areaType}</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Paint Type:</span>
                          <span className="font-medium">{config.areaType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Painting System:</span>
                          <span className="font-medium">{config.paintingSystem || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Coats:</span>
                          <span className="font-medium text-xs">{coats}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Area Sq.Ft:</span>
                          <span className="font-medium">{area.toFixed(2)}</span>
                        </div>
                        <div className="pt-2 mt-2 border-t space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Per Sq.Ft Rate:</span>
                            <span className="font-semibold">₹{rate.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Cost of Sq.Ft:</span>
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
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">2. Total Room Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Individual Rooms First */}
            <div className="space-y-2">
              <p className="font-semibold">Individual Rooms</p>
              {rooms.map(room => {
                const selectedAreas = room.selected_areas || { floor: true, wall: true, ceiling: false };
                return (
                  <div key={room.id} className="p-2 border rounded text-sm">
                    <p className="font-medium">{room.name}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs">
                      {selectedAreas.floor && (
                        <p>Floor: {Number(room.floor_area || 0).toFixed(2)} Sq. Ft</p>
                      )}
                      {selectedAreas.wall && (
                        <p>Wall: {Number(room.adjusted_wall_area || room.wall_area || 0).toFixed(2)} Sq. Ft</p>
                      )}
                      {selectedAreas.ceiling && (
                        <p>Ceiling: {Number(room.ceiling_area || 0).toFixed(2)} Sq. Ft</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals Second with Project Type */}
            <div className="p-3 bg-muted rounded">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">{paintType}</p>
              <p className="font-semibold">Totals</p>
              <div className="flex flex-wrap gap-3 text-sm mt-2">
                {totalFloor > 0 && <p>Floor: {totalFloor.toFixed(2)} Sq. Ft</p>}
                {totalWall > 0 && <p>Wall: {totalWall.toFixed(2)} Sq. Ft</p>}
                {totalCeiling > 0 && <p>Ceiling: {totalCeiling.toFixed(2)} Sq. Ft</p>}
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

    const displayDays = labourMode === 'auto' ? totalDays : manualDays;
    const displayLabours = labourMode === 'auto' ? numberOfLabours : laboursNeeded;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">3. Labour Section</CardTitle>
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

            {/* Manual Days Input */}
            {labourMode === 'manual' && (
              <div className="p-3 border rounded bg-muted/30">
                <label className="text-sm font-medium mb-2 block">Desired Completion Days</label>
                <input
                  type="number"
                  min="1"
                  value={manualDays}
                  onChange={(e) => setManualDays(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border rounded text-sm bg-background"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Labourers needed: <span className="font-semibold text-foreground">{laboursNeeded}</span> per day
                </p>
              </div>
            )}
            {/* Labour Calculation Breakdown - Carousel Style */}
            {labourMode === 'auto' && configTasks.length > 0 && (
              <div>
                <p className="font-semibold text-sm mb-2">Labour Calculation Breakdown</p>
                <div ref={labourConfigRef} className="-mx-4 px-4 overflow-x-auto scroll-smooth touch-pan-x" onScroll={handleLabourScroll}>
                  <div className="flex gap-4 pb-2 snap-x snap-mandatory" style={{ minWidth: 'min-content' }}>
                    {configTasks.map((configTask, index) => (
                      <div 
                        key={index} 
                        className={`snap-start flex-shrink-0 w-72 p-4 border rounded-lg shadow-sm transition-all ${
                          index === activeConfigIndex ? 'bg-primary/5 border-primary' : 'bg-card'
                        }`}
                      >
                        <div className="mb-3 pb-2 border-b">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Labour Required</p>
                          <p className="font-semibold text-base mt-1">{configTask.configLabel}</p>
                        </div>
                        <div className="space-y-2">
                          {configTask.tasks.map((task: any, taskIdx: number) => (
                            <div key={taskIdx} className="p-2 bg-muted/30 rounded text-xs">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium">{task.name}</span>
                                <span className="font-bold text-primary">{task.daysRequired} days</span>
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
                                <p>Area: {task.area.toFixed(0)} sq.ft</p>
                                <p>Coats: {task.coats}</p>
                                <p>Work: {task.totalWork.toFixed(0)} sq.ft</p>
                                <p>Coverage: {task.coverage} sq.ft/day</p>
                              </div>
                            </div>
                          ))}
                          <div className="pt-2 mt-2 border-t flex justify-between items-center">
                            <span className="text-xs font-medium">Total Days:</span>
                            <span className="text-lg font-bold text-primary">{configTask.totalDays} days</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="p-3 bg-primary/10 rounded border-2 border-primary/20">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {labourMode === 'auto' ? 'Total Project Duration' : 'Custom Project Duration'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">With {displayLabours} labour(s)</p>
                </div>
                <p className="text-2xl font-bold text-primary">{displayDays} days</p>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    );
  };

  // Section 4: Material Section
  const renderMaterialSection = () => {
    const materials: any = {};
    
    areaConfigs.forEach(config => {
      const area = Number(config.area) || 0;
      const isFresh = config.paintingSystem === 'Fresh Painting';
      
      if (isFresh) {
        if (config.selectedMaterials.putty) {
          const coverage = 20; // sq ft per liter
          const liters = (area / coverage) * config.coatConfiguration.putty;
          materials[config.selectedMaterials.putty] = (materials[config.selectedMaterials.putty] || 0) + liters;
        }
        if (config.selectedMaterials.primer) {
          const coverage = 120; // sq ft per liter
          const liters = (area / coverage) * config.coatConfiguration.primer;
          materials[config.selectedMaterials.primer] = (materials[config.selectedMaterials.primer] || 0) + liters;
        }
        if (config.selectedMaterials.emulsion) {
          const coverage = 120; // sq ft per liter
          const liters = (area / coverage) * config.coatConfiguration.emulsion;
          materials[config.selectedMaterials.emulsion] = (materials[config.selectedMaterials.emulsion] || 0) + liters;
        }
      } else {
        if (config.selectedMaterials.primer) {
          const coverage = 120;
          const liters = (area / coverage) * (config.repaintingConfiguration?.primer || 0);
          materials[config.selectedMaterials.primer] = (materials[config.selectedMaterials.primer] || 0) + liters;
        }
        if (config.selectedMaterials.emulsion) {
          const coverage = 120;
          const liters = (area / coverage) * (config.repaintingConfiguration?.emulsion || 0);
          materials[config.selectedMaterials.emulsion] = (materials[config.selectedMaterials.emulsion] || 0) + liters;
        }
      }
    });

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">4. Material Section</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="font-semibold">Material Required</p>
            {Object.entries(materials).map(([material, liters]) => (
              <div key={material} className="flex justify-between text-sm p-2 border rounded">
                <span>{material}</span>
                <span>{(liters as number).toFixed(2)} Liters</span>
              </div>
            ))}
          </div>
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
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">5. Dealer Margin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>Margin: {dealerMargin}%</p>
            <p className="font-semibold">Margin Cost: ₹{marginCost.toFixed(2)}</p>
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

    const marginCost = (materialCost * dealerMargin) / 100;
    const labourCost = 500; // placeholder
    const totalCost = materialCost + marginCost + labourCost;

    return (
      <Card className="mb-6 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">6. Estimated Total Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Material Cost:</span>
              <span>₹{materialCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Labour Cost:</span>
              <span>₹{labourCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Dealer Margin:</span>
              <span>₹{marginCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total:</span>
              <span>₹{totalCost.toFixed(2)}</span>
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
      <div className="eca-gradient text-white p-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => navigate(`/paint-estimation/${projectId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <FileText className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Generate Summary</h1>
          </div>
        </div>
      </div>

      <div className="p-4">
        <p className="text-sm text-muted-foreground mb-4 px-1">
          This section summarizes your project details including area type, paint configuration, material requirements, labour estimation, and complete cost overview.
        </p>
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
