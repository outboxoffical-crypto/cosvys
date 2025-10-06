import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Palette, Plus, Minus, Settings, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CoverageData {
  id: string;
  category: string;
  product_name: string;
  coats: string;
  coverage_range: string;
  surface_type?: string;
  notes?: string;
}

interface AreaConfiguration {
  id: string;
  areaType: 'Wall' | 'Ceiling' | 'Enamel';
  paintingSystem: 'Fresh Painting' | 'Repainting' | null;
  coatConfiguration: {
    putty: number;
    primer: number;
    emulsion: number;
  };
  repaintingConfiguration: {
    primer: number;
    emulsion: number;
  };
  selectedMaterials: {
    putty: string;
    primer: string;
    emulsion: string;
  };
  area: number;
  perSqFtRate: string;
  label?: string;
  isAdditional?: boolean;
}

export default function PaintEstimationScreen() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  
  const [selectedPaintType, setSelectedPaintType] = useState<"Interior" | "Exterior" | "Waterproofing">("Interior");
  const [rooms, setRooms] = useState<any[]>([]);
  const [coverageData, setCoverageData] = useState<CoverageData[]>([]);
  const [areaConfigurations, setAreaConfigurations] = useState<AreaConfiguration[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [additionalAreaDialog, setAdditionalAreaDialog] = useState(false);
  const [newAreaType, setNewAreaType] = useState<'Wall' | 'Ceiling' | 'Enamel' | null>(null);
  const [newAreaAmount, setNewAreaAmount] = useState('');
  const [newAreaLabel, setNewAreaLabel] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch coverage data
  useEffect(() => {
    fetchCoverageData();
  }, []);

  const fetchCoverageData = async () => {
    try {
      const { data, error } = await supabase
        .from('coverage_data')
        .select('*')
        .order('product_name');
      
      if (error) {
        console.error('Error fetching coverage data:', error);
        return;
      }
      
      setCoverageData(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Load rooms and filter by project type
  useEffect(() => {
    const loadRooms = async () => {
      setIsLoading(true);
      try {
        const { data: roomsData, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('project_id', projectId);
        
        if (error) {
          console.error('Error loading rooms:', error);
          setIsLoading(false);
          return;
        }
        
        if (roomsData) {
          setRooms(roomsData);
          // Small delay to ensure smooth loading
          setTimeout(() => {
            initializeConfigurations(roomsData);
            setIsLoading(false);
          }, 100);
        }
      } catch (error) {
        console.error('Error:', error);
        setIsLoading(false);
      }
    };
    
    loadRooms();
  }, [projectId]);

  // Initialize configurations based on rooms
  const initializeConfigurations = (roomsData: any[]) => {
    const configs: AreaConfiguration[] = [];
    
    // Filter rooms by selected paint type
    const filteredRooms = roomsData.filter(room => {
      const projectType = room.project_type;
      if (selectedPaintType === "Interior") return projectType === "Interior";
      if (selectedPaintType === "Exterior") return projectType === "Exterior";
      if (selectedPaintType === "Waterproofing") return projectType === "Waterproofing";
      return false;
    });

    // Calculate totals for each area type
    let wallAreaTotal = 0;
    let ceilingAreaTotal = 0;
    let enamelAreaTotal = 0;

    filteredRooms.forEach((room: any) => {
      const selectedAreas = (typeof room.selected_areas === 'object' && room.selected_areas !== null) ? 
        room.selected_areas as any : { floor: true, wall: true, ceiling: false };
      
      if (selectedAreas.wall) {
        wallAreaTotal += Number(room.adjusted_wall_area || room.wall_area || 0);
      }
      if (selectedAreas.ceiling) {
        ceilingAreaTotal += Number(room.ceiling_area || 0);
      }
      if (room.door_window_grills && Array.isArray(room.door_window_grills)) {
        enamelAreaTotal += Number(room.total_door_window_grill_area || 0);
      }
    });

    // Create initial configurations only for areas with actual sq.ft
    if (wallAreaTotal > 0) {
      configs.push({
        id: 'wall-main',
        areaType: 'Wall',
        paintingSystem: null,
        coatConfiguration: { putty: 0, primer: 0, emulsion: 0 },
        repaintingConfiguration: { primer: 0, emulsion: 0 },
        selectedMaterials: { putty: '', primer: '', emulsion: '' },
        area: wallAreaTotal,
        perSqFtRate: '',
        label: 'Wall Area',
        isAdditional: false
      });
    }

    if (ceilingAreaTotal > 0) {
      configs.push({
        id: 'ceiling-main',
        areaType: 'Ceiling',
        paintingSystem: null,
        coatConfiguration: { putty: 0, primer: 0, emulsion: 0 },
        repaintingConfiguration: { primer: 0, emulsion: 0 },
        selectedMaterials: { putty: '', primer: '', emulsion: '' },
        area: ceilingAreaTotal,
        perSqFtRate: '',
        label: 'Ceiling Area',
        isAdditional: false
      });
    }

    if (enamelAreaTotal > 0) {
      configs.push({
        id: 'enamel-main',
        areaType: 'Enamel',
        paintingSystem: null,
        coatConfiguration: { putty: 0, primer: 0, emulsion: 0 },
        repaintingConfiguration: { primer: 0, emulsion: 0 },
        selectedMaterials: { putty: '', primer: '', emulsion: '' },
        area: enamelAreaTotal,
        perSqFtRate: '',
        label: 'Enamel Area',
        isAdditional: false
      });
    }

    setAreaConfigurations(configs);
  };

  // Re-initialize when paint type changes
  useEffect(() => {
    if (rooms.length > 0) {
      setIsLoading(true);
      setTimeout(() => {
        initializeConfigurations(rooms);
        setIsLoading(false);
      }, 100);
    }
  }, [selectedPaintType]);

  // Handle add additional area
  const handleOpenAddAdditionalDialog = (areaType: 'Wall' | 'Ceiling' | 'Enamel') => {
    setNewAreaType(areaType);
    setNewAreaAmount('');
    setNewAreaLabel('');
    setAdditionalAreaDialog(true);
  };

  const handleAddAdditionalArea = () => {
    if (!newAreaType || !newAreaAmount || parseFloat(newAreaAmount) <= 0) {
      toast.error('Please enter a valid area amount');
      return;
    }

    const newConfig: AreaConfiguration = {
      id: `${newAreaType.toLowerCase()}-additional-${Date.now()}`,
      areaType: newAreaType,
      paintingSystem: null,
      coatConfiguration: { putty: 0, primer: 0, emulsion: 0 },
      repaintingConfiguration: { primer: 0, emulsion: 0 },
      selectedMaterials: { putty: '', primer: '', emulsion: '' },
      area: parseFloat(newAreaAmount),
      perSqFtRate: '',
      label: newAreaLabel || `Additional ${newAreaType} Area`,
      isAdditional: true
    };

    setAreaConfigurations(prev => [...prev, newConfig]);
    setAdditionalAreaDialog(false);
    toast.success('Additional area added successfully');
  };

  // Handle edit configuration
  const handleEditConfig = (configId: string) => {
    setSelectedConfigId(configId);
    setDialogOpen(true);
  };

  // Handle delete configuration
  const handleDeleteConfig = (configId: string) => {
    setAreaConfigurations(prev => prev.filter(config => config.id !== configId));
    toast.success('Configuration deleted');
  };

  // Handle update configuration
  const handleUpdateConfig = (updates: Partial<AreaConfiguration>) => {
    if (!selectedConfigId) return;
    
    setAreaConfigurations(prev => prev.map(config => 
      config.id === selectedConfigId ? { ...config, ...updates } : config
    ));
  };

  // Get selected configuration
  const selectedConfig = areaConfigurations.find(c => c.id === selectedConfigId);

  // Calculate total cost
  const calculateTotalCost = () => {
    return areaConfigurations.reduce((total, config) => {
      if (config.perSqFtRate) {
        return total + (config.area * parseFloat(config.perSqFtRate));
      }
      return total;
    }, 0);
  };

  // Calculate total area for Wall and Ceiling
  const getTotalPaintArea = () => {
    return areaConfigurations
      .filter(c => c.areaType === 'Wall' || c.areaType === 'Ceiling')
      .reduce((total, config) => total + config.area, 0);
  };

  const handleContinue = () => {
    // Validate at least one configuration is complete
    const hasValidConfig = areaConfigurations.some(
      config => config.paintingSystem && config.perSqFtRate
    );

    if (!hasValidConfig) {
      toast.error('Please configure at least one area with painting system and rate');
      return;
    }

    // Save to localStorage
    const estimationData = {
      paintType: selectedPaintType,
      configurations: areaConfigurations,
      totalCost: calculateTotalCost()
    };
    localStorage.setItem(`estimation_${projectId}`, JSON.stringify(estimationData));
    navigate(`/project-summary/${projectId}`);
  };

  // Separate configurations by type
  const wallConfigs = areaConfigurations.filter(c => c.areaType === 'Wall');
  const ceilingConfigs = areaConfigurations.filter(c => c.areaType === 'Ceiling');
  const enamelConfigs = areaConfigurations.filter(c => c.areaType === 'Enamel');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="eca-gradient text-white p-4">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => navigate(`/room-measurement/${projectId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Paint Estimation</h1>
            <p className="text-white/80 text-sm">Configure paint & calculate cost</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-24">
        {/* Paint Type Selection */}
        <Card className="eca-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Palette className="mr-2 h-5 w-5 text-primary" />
              Paint Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={selectedPaintType === "Interior" ? "default" : "outline"}
                onClick={() => setSelectedPaintType("Interior")}
                className="h-12 text-sm"
              >
                Interior Paint
              </Button>
              <Button
                variant={selectedPaintType === "Exterior" ? "default" : "outline"}
                onClick={() => setSelectedPaintType("Exterior")}
                className="h-12 text-sm"
              >
                Exterior Paint
              </Button>
              <Button
                variant={selectedPaintType === "Waterproofing" ? "default" : "outline"}
                onClick={() => setSelectedPaintType("Waterproofing")}
                className="h-12 text-sm"
              >
                Waterproofing
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card className="eca-shadow">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Loading areas...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Area to be Painted Section */}
            {(wallConfigs.length > 0 || ceilingConfigs.length > 0) && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Area to be Painted</h2>
                
                {/* Main Wall and Ceiling Areas */}
                <div className="grid grid-cols-2 gap-4">
                  {wallConfigs.filter(c => !c.isAdditional).map(config => (
                    <div key={config.id} className="border-2 border-dashed border-border rounded-lg p-4 text-center space-y-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80"
                        onClick={() => handleEditConfig(config.id)}
                      >
                        <Settings className="mr-1 h-4 w-4" />
                        Select System
                      </Button>
                      <div>
                        <p className="text-3xl font-bold">{config.area.toFixed(1)}</p>
                        <p className="text-sm text-muted-foreground">{config.label}</p>
                      </div>
                    </div>
                  ))}
                  
                  {ceilingConfigs.filter(c => !c.isAdditional).map(config => (
                    <div key={config.id} className="border-2 border-dashed border-border rounded-lg p-4 text-center space-y-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80"
                        onClick={() => handleEditConfig(config.id)}
                      >
                        <Settings className="mr-1 h-4 w-4" />
                        Select System
                      </Button>
                      <div>
                        <p className="text-3xl font-bold">{config.area.toFixed(1)}</p>
                        <p className="text-sm text-muted-foreground">{config.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Additional Wall and Ceiling Areas */}
                {[...wallConfigs, ...ceilingConfigs].filter(c => c.isAdditional).map(config => (
                  <Card key={config.id} className="border-2 border-dashed">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{config.label}</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteConfig(config.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-center space-y-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary"
                          onClick={() => handleEditConfig(config.id)}
                        >
                          <Settings className="mr-1 h-4 w-4" />
                          Configure System
                        </Button>
                        <div>
                          <p className="text-2xl font-bold">{config.area.toFixed(1)}</p>
                          <p className="text-sm text-muted-foreground">sq.ft</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Total Area Summary */}
                <div className="bg-destructive/10 border-l-4 border-destructive rounded-lg p-4 text-center">
                  <p className="text-destructive font-medium mb-1">Total Area</p>
                  <p className="text-2xl font-bold">{getTotalPaintArea().toFixed(1)} sq.ft</p>
                </div>

                {/* Add Additional Square Footage */}
                <Button
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => {
                    // Determine which type to add based on existing configs
                    if (wallConfigs.length > 0) {
                      handleOpenAddAdditionalDialog('Wall');
                    } else if (ceilingConfigs.length > 0) {
                      handleOpenAddAdditionalDialog('Ceiling');
                    }
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Additional Square Footage
                </Button>
              </div>
            )}

            {/* Door & Window Enamel Section */}
            {enamelConfigs.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center">
                  <Settings className="mr-2 h-5 w-5 text-primary" />
                  Door & Window Enamel
                </h2>
                
                {enamelConfigs.map(config => (
                  <div key={config.id} className="border-2 border-dashed border-orange-300 rounded-lg p-4 bg-orange-50/50 dark:bg-orange-950/20">
                    <div className="flex items-center justify-between mb-3">
                      {config.isAdditional && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteConfig(config.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="text-center space-y-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-orange-700 dark:text-orange-300"
                        onClick={() => handleEditConfig(config.id)}
                      >
                        Configure Enamel System
                      </Button>
                      <div>
                        <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{config.area.toFixed(1)}</p>
                        <p className="text-sm text-orange-600 dark:text-orange-400">sq.ft (Enamel Area)</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Additional Enamel */}
                <Button
                  variant="outline"
                  className="w-full border-dashed border-orange-300 text-orange-700"
                  onClick={() => handleOpenAddAdditionalDialog('Enamel')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Additional Enamel Area
                </Button>
              </div>
            )}

            {/* No areas message */}
            {areaConfigurations.length === 0 && (
              <Card className="eca-shadow">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">
                    No {selectedPaintType.toLowerCase()} areas found. Please add rooms for {selectedPaintType.toLowerCase()} in the Room Measurements section.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Configuration Summary Cards */}
            {areaConfigurations.some(c => c.paintingSystem) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Paint Configuration Summary</h3>
                {areaConfigurations.filter(c => c.paintingSystem).map(config => (
                  <Card key={config.id} className="border-2 border-primary/20">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{config.label}</h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditConfig(config.id)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-muted rounded p-2">
                          <p className="text-xs text-muted-foreground">Area</p>
                          <p className="font-medium">{config.area.toFixed(1)} sq.ft</p>
                        </div>
                        <div className="bg-muted rounded p-2">
                          <p className="text-xs text-muted-foreground">System</p>
                          <p className="font-medium text-xs">{config.paintingSystem}</p>
                        </div>
                      </div>

                      <div className="bg-muted rounded p-3 text-sm">
                        <p className="text-xs text-muted-foreground mb-1">Configuration</p>
                        <p className="font-medium">
                          {config.paintingSystem === "Fresh Painting" ? (
                            <>
                              {config.coatConfiguration.putty > 0 && `${config.coatConfiguration.putty} Putty`}
                              {config.coatConfiguration.putty > 0 && config.coatConfiguration.primer > 0 && ' + '}
                              {config.coatConfiguration.primer > 0 && `${config.coatConfiguration.primer} Primer`}
                              {config.coatConfiguration.primer > 0 && config.coatConfiguration.emulsion > 0 && ' + '}
                              {config.coatConfiguration.emulsion > 0 && `${config.coatConfiguration.emulsion} Emulsion`}
                            </>
                          ) : (
                            <>
                              {config.repaintingConfiguration.primer > 0 && `${config.repaintingConfiguration.primer} Primer`}
                              {config.repaintingConfiguration.primer > 0 && config.repaintingConfiguration.emulsion > 0 && ' + '}
                              {config.repaintingConfiguration.emulsion > 0 && `${config.repaintingConfiguration.emulsion} Emulsion`}
                            </>
                          )}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Per Sq.ft Rate (₹)</Label>
                        <Input
                          type="number"
                          placeholder="Enter rate"
                          value={config.perSqFtRate}
                          onChange={(e) => {
                            setAreaConfigurations(prev => prev.map(c => 
                              c.id === config.id ? { ...c, perSqFtRate: e.target.value } : c
                            ));
                          }}
                          className="h-10"
                        />
                      </div>

                      {config.perSqFtRate && (
                        <div className="bg-primary/10 rounded p-3 border border-primary/20">
                          <p className="text-xs text-muted-foreground">Total Cost</p>
                          <p className="text-xl font-bold text-primary">
                            ₹ {(config.area * parseFloat(config.perSqFtRate)).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Total Cost Summary */}
            {areaConfigurations.some(c => c.perSqFtRate) && (
              <Card className="eca-shadow border-2 border-primary">
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Total Project Cost</p>
                    <p className="text-4xl font-bold text-primary">
                      ₹ {calculateTotalCost().toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Configuration Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Configure {selectedConfig?.label}
            </DialogTitle>
          </DialogHeader>
          {selectedConfig && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={selectedConfig.paintingSystem === "Fresh Painting" ? "default" : "outline"}
                  onClick={() => handleUpdateConfig({ paintingSystem: "Fresh Painting" })}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <p className="font-medium">Fresh Painting</p>
                  <p className="text-xs opacity-80">Complete system</p>
                </Button>
                <Button
                  variant={selectedConfig.paintingSystem === "Repainting" ? "default" : "outline"}
                  onClick={() => handleUpdateConfig({ paintingSystem: "Repainting" })}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <p className="font-medium">Repainting</p>
                  <p className="text-xs opacity-80">Refresh system</p>
                </Button>
              </div>

              {selectedConfig.paintingSystem === "Fresh Painting" && (
                <div className="bg-muted rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-sm">Fresh Painting Configuration</h4>
                  
                  {/* Putty Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Putty Coats</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateConfig({
                            coatConfiguration: {
                              ...selectedConfig.coatConfiguration,
                              putty: Math.max(0, selectedConfig.coatConfiguration.putty - 1)
                            }
                          })}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {selectedConfig.coatConfiguration.putty}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateConfig({
                            coatConfiguration: {
                              ...selectedConfig.coatConfiguration,
                              putty: Math.min(5, selectedConfig.coatConfiguration.putty + 1)
                            }
                          })}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Select 
                      value={selectedConfig.selectedMaterials.putty} 
                      onValueChange={(value) => handleUpdateConfig({
                        selectedMaterials: { ...selectedConfig.selectedMaterials, putty: value }
                      })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select putty type" />
                      </SelectTrigger>
                      <SelectContent>
                        {coverageData
                          .filter(item => item.category === "Putty")
                          .map(item => item.product_name)
                          .filter((value, index, self) => self.indexOf(value) === index)
                          .map((puttyName) => (
                            <SelectItem key={puttyName} value={puttyName}>
                              {puttyName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Primer Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Primer Coats</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateConfig({
                            coatConfiguration: {
                              ...selectedConfig.coatConfiguration,
                              primer: Math.max(0, selectedConfig.coatConfiguration.primer - 1)
                            }
                          })}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {selectedConfig.coatConfiguration.primer}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateConfig({
                            coatConfiguration: {
                              ...selectedConfig.coatConfiguration,
                              primer: Math.min(5, selectedConfig.coatConfiguration.primer + 1)
                            }
                          })}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Select 
                      value={selectedConfig.selectedMaterials.primer} 
                      onValueChange={(value) => handleUpdateConfig({
                        selectedMaterials: { ...selectedConfig.selectedMaterials, primer: value }
                      })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select primer type" />
                      </SelectTrigger>
                      <SelectContent>
                        {coverageData
                          .filter(item => item.category === "Primer")
                          .map(item => item.product_name)
                          .filter((value, index, self) => self.indexOf(value) === index)
                          .map((primerName) => (
                            <SelectItem key={primerName} value={primerName}>
                              {primerName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Emulsion Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Emulsion Coats</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateConfig({
                            coatConfiguration: {
                              ...selectedConfig.coatConfiguration,
                              emulsion: Math.max(0, selectedConfig.coatConfiguration.emulsion - 1)
                            }
                          })}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {selectedConfig.coatConfiguration.emulsion}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateConfig({
                            coatConfiguration: {
                              ...selectedConfig.coatConfiguration,
                              emulsion: Math.min(5, selectedConfig.coatConfiguration.emulsion + 1)
                            }
                          })}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Select 
                      value={selectedConfig.selectedMaterials.emulsion} 
                      onValueChange={(value) => handleUpdateConfig({
                        selectedMaterials: { ...selectedConfig.selectedMaterials, emulsion: value }
                      })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select emulsion type" />
                      </SelectTrigger>
                      <SelectContent>
                        {coverageData
                          .filter(item => item.category === selectedPaintType)
                          .map(item => item.product_name)
                          .filter((value, index, self) => self.indexOf(value) === index)
                          .map((emulsionName) => (
                            <SelectItem key={emulsionName} value={emulsionName}>
                              {emulsionName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {selectedConfig.paintingSystem === "Repainting" && (
                <div className="bg-muted rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-sm">Repainting Configuration</h4>
                  
                  {/* Primer Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Primer Coats</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateConfig({
                            repaintingConfiguration: {
                              ...selectedConfig.repaintingConfiguration,
                              primer: Math.max(0, selectedConfig.repaintingConfiguration.primer - 1)
                            }
                          })}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {selectedConfig.repaintingConfiguration.primer}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateConfig({
                            repaintingConfiguration: {
                              ...selectedConfig.repaintingConfiguration,
                              primer: Math.min(5, selectedConfig.repaintingConfiguration.primer + 1)
                            }
                          })}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Select 
                      value={selectedConfig.selectedMaterials.primer} 
                      onValueChange={(value) => handleUpdateConfig({
                        selectedMaterials: { ...selectedConfig.selectedMaterials, primer: value }
                      })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select primer type" />
                      </SelectTrigger>
                      <SelectContent>
                        {coverageData
                          .filter(item => item.category === "Primer")
                          .map(item => item.product_name)
                          .filter((value, index, self) => self.indexOf(value) === index)
                          .map((primerName) => (
                            <SelectItem key={primerName} value={primerName}>
                              {primerName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Emulsion Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Emulsion Coats</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateConfig({
                            repaintingConfiguration: {
                              ...selectedConfig.repaintingConfiguration,
                              emulsion: Math.max(0, selectedConfig.repaintingConfiguration.emulsion - 1)
                            }
                          })}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {selectedConfig.repaintingConfiguration.emulsion}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateConfig({
                            repaintingConfiguration: {
                              ...selectedConfig.repaintingConfiguration,
                              emulsion: Math.min(5, selectedConfig.repaintingConfiguration.emulsion + 1)
                            }
                          })}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Select 
                      value={selectedConfig.selectedMaterials.emulsion} 
                      onValueChange={(value) => handleUpdateConfig({
                        selectedMaterials: { ...selectedConfig.selectedMaterials, emulsion: value }
                      })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select emulsion type" />
                      </SelectTrigger>
                      <SelectContent>
                        {coverageData
                          .filter(item => item.category === selectedPaintType)
                          .map(item => item.product_name)
                          .filter((value, index, self) => self.indexOf(value) === index)
                          .map((emulsionName) => (
                            <SelectItem key={emulsionName} value={emulsionName}>
                              {emulsionName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                onClick={() => setDialogOpen(false)}
                disabled={!selectedConfig.paintingSystem}
              >
                Save Configuration
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Additional Area Dialog */}
      <Dialog open={additionalAreaDialog} onOpenChange={setAdditionalAreaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Additional {newAreaType} Area</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Area Type</Label>
              <Select value={newAreaType || ''} onValueChange={(value: any) => setNewAreaType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select area type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Wall">Wall Area</SelectItem>
                  <SelectItem value="Ceiling">Ceiling Area</SelectItem>
                  <SelectItem value="Enamel">Enamel Area</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Area Amount (sq.ft)</Label>
              <Input
                type="number"
                placeholder="Enter area in square feet"
                value={newAreaAmount}
                onChange={(e) => setNewAreaAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Label (Optional)</Label>
              <Input
                type="text"
                placeholder="e.g., Extra Wall Section"
                value={newAreaLabel}
                onChange={(e) => setNewAreaLabel(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handleAddAdditionalArea}>
              Add Area
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <Button 
          className="w-full h-12 text-base font-medium"
          onClick={handleContinue}
          disabled={!areaConfigurations.some(c => c.paintingSystem && c.perSqFtRate)}
        >
          Generate Summary
        </Button>
      </div>
    </div>
  );
}
