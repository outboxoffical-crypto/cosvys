import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Palette, Plus, Minus, Edit3, Trash2, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
}

export default function PaintEstimationScreen() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const addExtraParam = searchParams.get('addExtra');
  
  const [selectedPaintType, setSelectedPaintType] = useState<"Interior" | "Exterior" | "Waterproofing">("Interior");
  const [rooms, setRooms] = useState<any[]>([]);
  const [coverageData, setCoverageData] = useState<CoverageData[]>([]);
  const [areaConfigurations, setAreaConfigurations] = useState<AreaConfiguration[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
        toast.error('Failed to load coverage data');
        return;
      }
      
      setCoverageData(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load coverage data');
    }
  };

  // Load rooms and filter by project type
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const { data: roomsData, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('project_id', projectId);
        
        if (error) {
          console.error('Error loading rooms:', error);
          return;
        }
        
        if (roomsData && roomsData.length > 0) {
          setRooms(roomsData);
          initializeConfigurations(roomsData);
        }
      } catch (error) {
        console.error('Error:', error);
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
        label: 'Wall Area'
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
        label: 'Ceiling Area'
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
        label: 'Door & Window Enamel'
      });
    }

    setAreaConfigurations(configs);
  };

  // Re-initialize when paint type changes
  useEffect(() => {
    if (rooms.length > 0) {
      initializeConfigurations(rooms);
    }
  }, [selectedPaintType, rooms]);

  // Handle add additional area
  const handleAddAdditionalArea = (areaType: 'Wall' | 'Ceiling' | 'Enamel') => {
    navigate(`/room-measurement/${projectId}?addExtra=${areaType.toLowerCase()}`);
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

  // Get color for area type
  const getAreaColor = (areaType: string) => {
    switch (areaType) {
      case 'Wall': return 'border-blue-500 bg-blue-50 dark:bg-blue-950/20';
      case 'Ceiling': return 'border-green-500 bg-green-50 dark:bg-green-950/20';
      case 'Enamel': return 'border-orange-500 bg-orange-50 dark:bg-orange-950/20';
      default: return 'border-primary';
    }
  };

  const getHeaderColor = (areaType: string) => {
    switch (areaType) {
      case 'Wall': return 'text-blue-700 dark:text-blue-300';
      case 'Ceiling': return 'text-green-700 dark:text-green-300';
      case 'Enamel': return 'text-orange-700 dark:text-orange-300';
      default: return 'text-foreground';
    }
  };

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

        {/* Area Configuration Cards */}
        {areaConfigurations.length === 0 ? (
          <Card className="eca-shadow">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                No {selectedPaintType.toLowerCase()} areas found. Please add rooms for {selectedPaintType.toLowerCase()} in the Room Measurements section.
              </p>
            </CardContent>
          </Card>
        ) : (
          areaConfigurations.map((config) => (
            <Card key={config.id} className={`eca-shadow border-2 ${getAreaColor(config.areaType)}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-lg ${getHeaderColor(config.areaType)}`}>
                    {config.label}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditConfig(config.id)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    {!config.id.includes('main') && (
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
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Area Display */}
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold">{config.area.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Square Feet</p>
                </div>

                {/* Paint Configuration Summary */}
                {config.paintingSystem ? (
                  <div className="space-y-3">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Paint Type</p>
                      <p className="font-medium">{config.selectedMaterials.emulsion || "Not selected"}</p>
                    </div>

                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Painting System</p>
                      <p className="font-medium">{config.paintingSystem}</p>
                    </div>

                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Coats</p>
                      <p className="font-medium text-sm">
                        {config.paintingSystem === "Fresh Painting" ? (
                          <>
                            {config.coatConfiguration.putty > 0 && `${config.coatConfiguration.putty} coats of ${config.selectedMaterials.putty || 'putty'}`}
                            {config.coatConfiguration.putty > 0 && config.coatConfiguration.primer > 0 && ' + '}
                            {config.coatConfiguration.primer > 0 && `${config.coatConfiguration.primer} coats of ${config.selectedMaterials.primer || 'primer'}`}
                            {config.coatConfiguration.primer > 0 && config.coatConfiguration.emulsion > 0 && ' + '}
                            {config.coatConfiguration.emulsion > 0 && `${config.coatConfiguration.emulsion} coats of ${config.selectedMaterials.emulsion || 'emulsion'}`}
                          </>
                        ) : (
                          <>
                            {config.repaintingConfiguration.primer > 0 && `${config.repaintingConfiguration.primer} coats of ${config.selectedMaterials.primer || 'primer'}`}
                            {config.repaintingConfiguration.primer > 0 && config.repaintingConfiguration.emulsion > 0 && ' + '}
                            {config.repaintingConfiguration.emulsion > 0 && `${config.repaintingConfiguration.emulsion} coats of ${config.selectedMaterials.emulsion || 'emulsion'}`}
                          </>
                        )}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Per Sq.ft Rate (₹)</Label>
                      <Input
                        type="number"
                        placeholder="Enter rate per sq.ft"
                        value={config.perSqFtRate}
                        onChange={(e) => {
                          setAreaConfigurations(prev => prev.map(c => 
                            c.id === config.id ? { ...c, perSqFtRate: e.target.value } : c
                          ));
                        }}
                        className="h-12 text-lg"
                      />
                    </div>

                    {config.perSqFtRate && (
                      <div className="bg-primary/10 rounded-lg p-4 border-2 border-primary">
                        <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
                        <p className="font-bold text-2xl text-primary">
                          ₹ {(config.area * parseFloat(config.perSqFtRate)).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full h-12 border-2 border-dashed"
                    onClick={() => handleEditConfig(config.id)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configure Painting System
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}

        {/* Add Additional Square Footage Buttons */}
        {areaConfigurations.length > 0 && (
          <div className="space-y-3">
            {areaConfigurations.some(c => c.areaType === 'Wall') && (
              <Button
                variant="outline"
                className="w-full h-12 border-2 border-dashed border-blue-500 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                onClick={() => handleAddAdditionalArea('Wall')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Additional Wall Area
              </Button>
            )}
            {areaConfigurations.some(c => c.areaType === 'Ceiling') && (
              <Button
                variant="outline"
                className="w-full h-12 border-2 border-dashed border-green-500 text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20"
                onClick={() => handleAddAdditionalArea('Ceiling')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Additional Ceiling Area
              </Button>
            )}
            {areaConfigurations.some(c => c.areaType === 'Enamel') && (
              <Button
                variant="outline"
                className="w-full h-12 border-2 border-dashed border-orange-500 text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                onClick={() => handleAddAdditionalArea('Enamel')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Additional Enamel Area
              </Button>
            )}
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