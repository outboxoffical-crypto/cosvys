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
  enamelConfig?: {
    primerType: string;
    primerCoats: number;
    enamelType: string;
    enamelCoats: number;
  };
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

    // Check if we're in "additional area" mode to create new separate boxes
    const modeKey = `additional_mode_${projectId}_${selectedPaintType}`;
    const baselineKey = `additional_baseline_${projectId}_${selectedPaintType}`;
    const storedKey = `additional_entries_${projectId}_${selectedPaintType}`;
    const isAdditionalMode = typeof window !== 'undefined' && localStorage.getItem(modeKey) === '1';
    const baselineRaw = typeof window !== 'undefined' ? localStorage.getItem(baselineKey) : null;
    const baseline = baselineRaw ? JSON.parse(baselineRaw) as { wall?: number; ceiling?: number; enamel?: number; roomIds?: string[] } : null;

    // Load previously stored additional entries so we keep them across sessions
    let storedAdditional: AreaConfiguration[] = [];
    let storedList: any[] = [];
    try {
      const storedRaw = typeof window !== 'undefined' ? localStorage.getItem(storedKey) : null;
      storedList = storedRaw ? JSON.parse(storedRaw) : [];
      storedAdditional = (storedList || []).map((item: any) => ({
        id: item.id,
        areaType: item.areaType,
        paintingSystem: item.paintingSystem ?? null,
        coatConfiguration: item.coatConfiguration ?? { putty: 0, primer: 0, emulsion: 0 },
        repaintingConfiguration: item.repaintingConfiguration ?? { primer: 0, emulsion: 0 },
        selectedMaterials: item.selectedMaterials ?? { putty: '', primer: '', emulsion: '' },
        area: Number(item.area) || 0,
        perSqFtRate: item.perSqFtRate ?? '',
        label: item.label,
        isAdditional: true,
        enamelConfig: item.enamelConfig,
      }));
    } catch {}

    // Main areas default to current totals
    let wallMain = wallAreaTotal;
    let ceilingMain = ceilingAreaTotal;
    let enamelMain = enamelAreaTotal;

    // Collect additional configs (new separate boxes)
    const additional: AreaConfiguration[] = [];

    // If NOT in additional mode, split totals into main + stored additionals
    if (!isAdditionalMode && storedAdditional.length > 0) {
      const sumStoredWall = storedAdditional
        .filter(a => a.areaType === 'Wall')
        .reduce((sum, a) => sum + (Number(a.area) || 0), 0);
      const sumStoredCeiling = storedAdditional
        .filter(a => a.areaType === 'Ceiling')
        .reduce((sum, a) => sum + (Number(a.area) || 0), 0);
      const sumStoredEnamel = storedAdditional
        .filter(a => a.areaType === 'Enamel')
        .reduce((sum, a) => sum + (Number(a.area) || 0), 0);
      wallMain = Math.max(0, wallAreaTotal - sumStoredWall);
      ceilingMain = Math.max(0, ceilingAreaTotal - sumStoredCeiling);
      enamelMain = Math.max(0, enamelAreaTotal - sumStoredEnamel);
    }

    if (isAdditionalMode && baseline) {
      const addWall = Math.max(0, wallAreaTotal - (baseline.wall || 0));
      const addCeiling = Math.max(0, ceilingAreaTotal - (baseline.ceiling || 0));

      // Keep main as baseline so the new difference becomes a new box
      wallMain = baseline.wall || 0;
      ceilingMain = baseline.ceiling || 0;

      // Get the baseline room IDs to detect new rooms
      const baselineRoomIds = baseline.roomIds || [];
      const currentRoomIds = filteredRooms.map(r => r.id);
      const newRoomIds = currentRoomIds.filter(id => !baselineRoomIds.includes(id));
      
      // Find the newly added room(s)
      const newRooms = filteredRooms.filter(r => newRoomIds.includes(r.id));

      if (addWall > 0) {
        // Get the room name from the newly added room with wall area
        let newRoomName = 'Additional Wall Area';
        const newWallRoom = newRooms.find(room => {
          const selectedAreas = (typeof room.selected_areas === 'object' && room.selected_areas !== null) ? 
            room.selected_areas as any : { floor: true, wall: true, ceiling: false };
          return selectedAreas.wall;
        });
        if (newWallRoom) {
          newRoomName = `${newWallRoom.name} (Wall Area)`;
        }

        const newConfig: AreaConfiguration = {
          id: `wall-additional-${Date.now()}`,
          areaType: 'Wall',
          paintingSystem: null,
          coatConfiguration: { putty: 0, primer: 0, emulsion: 0 },
          repaintingConfiguration: { primer: 0, emulsion: 0 },
          selectedMaterials: { putty: '', primer: '', emulsion: '' },
          area: addWall,
          perSqFtRate: '',
          label: newRoomName,
          isAdditional: true,
        };
        additional.push(newConfig);
        try {
          storedList.push({ ...newConfig });
          localStorage.setItem(storedKey, JSON.stringify(storedList));
        } catch {}
      }

      if (addCeiling > 0) {
        // Get the room name from the newly added room with ceiling area
        let newRoomName = 'Additional Ceiling Area';
        const newCeilingRoom = newRooms.find(room => {
          const selectedAreas = (typeof room.selected_areas === 'object' && room.selected_areas !== null) ? 
            room.selected_areas as any : { floor: true, wall: true, ceiling: false };
          return selectedAreas.ceiling;
        });
        if (newCeilingRoom) {
          newRoomName = `${newCeilingRoom.name} (Ceiling Area)`;
        }

        const newConfig: AreaConfiguration = {
          id: `ceiling-additional-${Date.now()}`,
          areaType: 'Ceiling',
          paintingSystem: null,
          coatConfiguration: { putty: 0, primer: 0, emulsion: 0 },
          repaintingConfiguration: { primer: 0, emulsion: 0 },
          selectedMaterials: { putty: '', primer: '', emulsion: '' },
          area: addCeiling,
          perSqFtRate: '',
          label: newRoomName,
          isAdditional: true,
        };
        additional.push(newConfig);
        try {
          storedList.push({ ...newConfig });
          localStorage.setItem(storedKey, JSON.stringify(storedList));
        } catch {}
      }

      // Update baseline to new totals with room IDs and clear mode
      try {
        localStorage.setItem(baselineKey, JSON.stringify({ 
          wall: wallAreaTotal, 
          ceiling: ceilingAreaTotal, 
          enamel: enamelAreaTotal,
          roomIds: currentRoomIds
        }));
        localStorage.removeItem(modeKey);
      } catch {}
    }

    // Check if we're in "additional enamel area" mode
    const enamelModeKey = `additional_enamel_mode_${projectId}_${selectedPaintType}`;
    const enamelBaselineKey = `additional_enamel_baseline_${projectId}_${selectedPaintType}`;
    const isAdditionalEnamelMode = typeof window !== 'undefined' && localStorage.getItem(enamelModeKey) === '1';
    const enamelBaselineRaw = typeof window !== 'undefined' ? localStorage.getItem(enamelBaselineKey) : null;
    const enamelBaseline = enamelBaselineRaw ? JSON.parse(enamelBaselineRaw) as { enamel?: number; roomIds?: string[] } : null;

    if (isAdditionalEnamelMode && enamelBaseline) {
      const addEnamel = Math.max(0, enamelAreaTotal - (enamelBaseline.enamel || 0));

      // Keep main enamel as baseline
      enamelMain = enamelBaseline.enamel || 0;

      // Get the baseline room IDs to detect new rooms
      const baselineRoomIds = enamelBaseline.roomIds || [];
      const currentRoomIds = filteredRooms.map(r => r.id);
      const newRoomIds = currentRoomIds.filter(id => !baselineRoomIds.includes(id));
      
      // Find the newly added room(s)
      const newRooms = filteredRooms.filter(r => newRoomIds.includes(r.id));

      if (addEnamel > 0) {
        // Get the room name from the newly added room with enamel area
        let newRoomName = 'Additional Enamel Area';
        const newEnamelRoom = newRooms.find(room => {
          return room.door_window_grills && Array.isArray(room.door_window_grills) && room.door_window_grills.length > 0;
        });
        if (newEnamelRoom) {
          newRoomName = `${newEnamelRoom.name} (Enamel Area)`;
        }

        const newConfig: AreaConfiguration = {
          id: `enamel-additional-${Date.now()}`,
          areaType: 'Enamel',
          paintingSystem: null,
          coatConfiguration: { putty: 0, primer: 0, emulsion: 0 },
          repaintingConfiguration: { primer: 0, emulsion: 0 },
          selectedMaterials: { putty: '', primer: '', emulsion: '' },
          area: addEnamel,
          perSqFtRate: '',
          label: newRoomName,
          isAdditional: true,
        };
        additional.push(newConfig);
        try {
          storedList.push({ ...newConfig });
          localStorage.setItem(storedKey, JSON.stringify(storedList));
        } catch {}
      }

      // Update baseline to new totals with room IDs and clear mode
      try {
        localStorage.setItem(enamelBaselineKey, JSON.stringify({ 
          enamel: enamelAreaTotal,
          roomIds: currentRoomIds
        }));
        localStorage.removeItem(enamelModeKey);
      } catch {}
    }

    // Create initial configurations only for areas with actual sq.ft
    if (wallMain > 0) {
      configs.push({
        id: 'wall-main',
        areaType: 'Wall',
        paintingSystem: null,
        coatConfiguration: { putty: 0, primer: 0, emulsion: 0 },
        repaintingConfiguration: { primer: 0, emulsion: 0 },
        selectedMaterials: { putty: '', primer: '', emulsion: '' },
        area: wallMain,
        perSqFtRate: '',
        label: 'Wall Area',
        isAdditional: false
      });
    }

    if (ceilingMain > 0) {
      configs.push({
        id: 'ceiling-main',
        areaType: 'Ceiling',
        paintingSystem: null,
        coatConfiguration: { putty: 0, primer: 0, emulsion: 0 },
        repaintingConfiguration: { primer: 0, emulsion: 0 },
        selectedMaterials: { putty: '', primer: '', emulsion: '' },
        area: ceilingMain,
        perSqFtRate: '',
        label: 'Ceiling Area',
        isAdditional: false
      });
    }

    if (enamelMain > 0) {
      configs.push({
        id: 'enamel-main',
        areaType: 'Enamel',
        paintingSystem: null,
        coatConfiguration: { putty: 0, primer: 0, emulsion: 0 },
        repaintingConfiguration: { primer: 0, emulsion: 0 },
        selectedMaterials: { putty: '', primer: '', emulsion: '' },
        area: enamelMain,
        perSqFtRate: '',
        label: 'Enamel Area',
        isAdditional: false
      });
    }

    // Append any additional configs detected (persisted + new)
    configs.push(...storedAdditional, ...additional);

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

  // Handle edit configuration
  const handleEditConfig = (configId: string) => {
    setSelectedConfigId(configId);
    setDialogOpen(true);
  };

  // Handle delete configuration
  const handleDeleteConfig = (configId: string) => {
    setAreaConfigurations(prev => prev.filter(config => config.id !== configId));
    try {
      const storedKey = `additional_entries_${projectId}_${selectedPaintType}`;
      const raw = localStorage.getItem(storedKey);
      const list = raw ? JSON.parse(raw) : [];
      const updated = Array.isArray(list) ? list.filter((item: any) => item.id !== configId) : [];
      localStorage.setItem(storedKey, JSON.stringify(updated));
    } catch {}
    toast.success('Configuration deleted');
  };

  // Handle update configuration
  const handleUpdateConfig = (updates: Partial<AreaConfiguration>) => {
    if (!selectedConfigId) return;
    
    setAreaConfigurations(prev => prev.map(config => 
      config.id === selectedConfigId ? { ...config, ...updates } : config
    ));
  };

  // Handle add additional area (for enamel from dialog)
  const handleOpenAddAdditionalDialog = (areaType: 'Enamel') => {
    const newConfig: AreaConfiguration = {
      id: `${areaType.toLowerCase()}-additional-${Date.now()}`,
      areaType: areaType,
      paintingSystem: null,
      coatConfiguration: { putty: 0, primer: 0, emulsion: 0 },
      repaintingConfiguration: { primer: 0, emulsion: 0 },
      selectedMaterials: { putty: '', primer: '', emulsion: '' },
      area: 0,
      perSqFtRate: '',
      label: `Additional ${areaType} Area`,
      isAdditional: true
    };

    setAreaConfigurations(prev => [...prev, newConfig]);
    // Open config dialog immediately
    setTimeout(() => {
      setSelectedConfigId(newConfig.id);
      setDialogOpen(true);
    }, 100);
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

  // Get configuration description
  const getConfigDescription = (config: AreaConfiguration) => {
    // Enamel summary
    if (config.areaType === 'Enamel' && config.enamelConfig) {
      const parts: string[] = [];
      if (config.enamelConfig.primerCoats > 0 && config.enamelConfig.primerType) {
        parts.push(`${config.enamelConfig.primerCoats} coat${config.enamelConfig.primerCoats > 1 ? 's' : ''} of ${config.enamelConfig.primerType} Primer`);
      }
      if (config.enamelConfig.enamelCoats > 0 && config.enamelConfig.enamelType) {
        parts.push(`${config.enamelConfig.enamelCoats} coat${config.enamelConfig.enamelCoats > 1 ? 's' : ''} of ${config.enamelConfig.enamelType} Enamel`);
      }
      return parts.join(' + ');
    }

    if (!config.paintingSystem) return '';
    const parts: string[] = [];
    if (config.paintingSystem === "Fresh Painting") {
      if (config.coatConfiguration.putty > 0 && config.selectedMaterials.putty) {
        parts.push(`${config.coatConfiguration.putty} coats of ${config.selectedMaterials.putty}`);
      }
      if (config.coatConfiguration.primer > 0 && config.selectedMaterials.primer) {
        parts.push(`${config.coatConfiguration.primer} coats of ${config.selectedMaterials.primer}`);
      }
      if (config.coatConfiguration.emulsion > 0 && config.selectedMaterials.emulsion) {
        parts.push(`${config.coatConfiguration.emulsion} coats of ${config.selectedMaterials.emulsion}`);
      }
    } else {
      if (config.repaintingConfiguration.primer > 0 && config.selectedMaterials.primer) {
        parts.push(`${config.repaintingConfiguration.primer} coats of ${config.selectedMaterials.primer}`);
      }
      if (config.repaintingConfiguration.emulsion > 0 && config.selectedMaterials.emulsion) {
        parts.push(`${config.repaintingConfiguration.emulsion} coats of ${config.selectedMaterials.emulsion}`);
      }
    }
    return parts.join(' + ');
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

        {isLoading ? (
          <Card className="eca-shadow">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Loading areas...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Paint Configuration Summary - MOVED TO TOP (only non-enamel) */}
            {areaConfigurations.some(c => (c.paintingSystem || c.areaType === 'Enamel') && c.areaType !== 'Enamel') && (
              <Card className="eca-shadow border-2 border-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg">Paint Configuration Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {areaConfigurations.filter(c => (c.paintingSystem || c.areaType === 'Enamel') && c.areaType !== 'Enamel').map((config) => (
                    <Card key={config.id} className="border-2 border-primary/20 bg-primary/5">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-base">{config.label}</h3>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                                onClick={() => handleDeleteConfig(config.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditConfig(config.id)}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Paint Type</p>
                            <p className="font-medium">{config.selectedMaterials.emulsion || 'Not Selected'}</p>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Painting System</p>
                            <p className="font-medium">{config.paintingSystem}</p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Coats</p>
                            <p className="font-medium text-sm leading-relaxed">
                              {getConfigDescription(config) || 'Not configured'}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Area Sq.ft</p>
                            <p className="font-medium">{config.area.toFixed(2)}</p>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm">Per Sq.ft Rate (₹)</Label>
                            <Input
                              type="number"
                              placeholder="Enter rate per sq.ft"
                              value={config.perSqFtRate}
                              onChange={(e) => {
                                setAreaConfigurations(prev => prev.map(c => 
                                  c.id === config.id ? { ...c, perSqFtRate: e.target.value } : c
                                ));
                              }}
                              className="h-10"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Area to be Painted Section */}
            {(wallConfigs.length > 0 || ceilingConfigs.length > 0) && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Area to be Painted</h2>
                
                {/* Main Wall and Ceiling Areas - Clickable Cards */}
                <div className="grid grid-cols-2 gap-4">
                  {wallConfigs.filter(c => !c.isAdditional).map(config => (
                    <div 
                      key={config.id} 
                      className={`border-2 border-dashed rounded-lg p-4 text-center space-y-2 cursor-pointer transition-all ${
                        config.paintingSystem 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleEditConfig(config.id)}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80 pointer-events-none"
                      >
                        {config.paintingSystem ? config.paintingSystem : 'Select System'}
                      </Button>
                      <div>
                        <p className="text-3xl font-bold">{config.area.toFixed(1)}</p>
                        <p className="text-sm text-muted-foreground">{config.label}</p>
                      </div>
                    </div>
                  ))}
                  
                  {ceilingConfigs.filter(c => !c.isAdditional).map(config => (
                    <div 
                      key={config.id} 
                      className={`border-2 border-dashed rounded-lg p-4 text-center space-y-2 cursor-pointer transition-all ${
                        config.paintingSystem 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleEditConfig(config.id)}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80 pointer-events-none"
                      >
                        {config.paintingSystem ? config.paintingSystem : 'Select System'}
                      </Button>
                      <div>
                        <p className="text-3xl font-bold">{config.area.toFixed(1)}</p>
                        <p className="text-sm text-muted-foreground">{config.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Additional Wall and Ceiling Areas - Compact Half-Width Layout */}
                {[...wallConfigs, ...ceilingConfigs].filter(c => c.isAdditional).length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {[...wallConfigs, ...ceilingConfigs].filter(c => c.isAdditional).map(config => (
                      <div 
                        key={config.id} 
                        className={`border-2 border-dashed rounded-lg p-3 text-center space-y-2 cursor-pointer transition-all relative ${
                          config.paintingSystem 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => handleEditConfig(config.id)}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive absolute top-2 right-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConfig(config.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary/80 text-xs pointer-events-none"
                        >
                          {config.paintingSystem || 'Select System'}
                        </Button>
                        <div>
                          <p className="text-2xl font-bold">{config.area.toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">{config.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Total Area Summary */}
                <div className="bg-destructive/10 border-l-4 border-destructive rounded-lg p-4 text-center">
                  <p className="text-destructive font-medium mb-1">Total Area</p>
                  <p className="text-2xl font-bold">{getTotalPaintArea().toFixed(1)} sq.ft</p>
                </div>

                {/* Add Additional Square Footage - Navigate to Room Measurement */}
                <Button
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => {
                    try {
                      // Baseline must include ALL existing areas (main + previous additionals)
                      const wallBase = wallConfigs.reduce((sum, c) => sum + c.area, 0);
                      const ceilingBase = ceilingConfigs.reduce((sum, c) => sum + c.area, 0);
                      const enamelBase = enamelConfigs.reduce((sum, c) => sum + c.area, 0);
                      // Store current room IDs to detect new rooms later
                      const currentRoomIds = rooms
                        .filter(room => {
                          const projectType = room.project_type;
                          if (selectedPaintType === "Interior") return projectType === "Interior";
                          if (selectedPaintType === "Exterior") return projectType === "Exterior";
                          if (selectedPaintType === "Waterproofing") return projectType === "Waterproofing";
                          return false;
                        })
                        .map(r => r.id);
                      localStorage.setItem(`additional_baseline_${projectId}_${selectedPaintType}`, JSON.stringify({ 
                        wall: wallBase, 
                        ceiling: ceilingBase, 
                        enamel: enamelBase,
                        roomIds: currentRoomIds
                      }));
                      localStorage.setItem(`additional_mode_${projectId}_${selectedPaintType}`, '1');
                    } catch {}
                    navigate(`/room-measurement/${projectId}`);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Additional Square Footage
                </Button>
              </div>
            )}

            {/* Enamel Paint Configuration Summary - Moved above Door & Window Enamel */}
            {areaConfigurations.some(c => c.areaType === 'Enamel' && (c.paintingSystem || c.enamelConfig)) && (
              <Card className="eca-shadow border-2 border-orange-500/30">
                <CardHeader>
                  <CardTitle className="text-lg text-orange-700 dark:text-orange-300">Enamel Paint Configuration Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {areaConfigurations.filter(c => c.areaType === 'Enamel' && (c.paintingSystem || c.enamelConfig)).map((config) => (
                    <Card key={config.id} className="border-2 border-orange-500/20 bg-orange-50/50 dark:bg-orange-950/20">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-base text-orange-700 dark:text-orange-300">{config.label}</h3>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                                onClick={() => handleDeleteConfig(config.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditConfig(config.id)}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Coats</p>
                            <p className="font-medium text-sm leading-relaxed">
                              {getConfigDescription(config) || 'Not configured'}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Area Sq.ft</p>
                            <p className="font-medium">{config.area.toFixed(2)}</p>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm">Per Sq.ft Rate (₹)</Label>
                            <Input
                              type="number"
                              placeholder="Enter rate per sq.ft"
                              value={config.perSqFtRate}
                              onChange={(e) => {
                                setAreaConfigurations(prev => prev.map(c => 
                                  c.id === config.id ? { ...c, perSqFtRate: e.target.value } : c
                                ));
                              }}
                              className="h-10"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Door & Window Enamel Section */}
            {enamelConfigs.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center">
                  <Settings className="mr-2 h-5 w-5 text-primary" />
                  Door & Window Enamel
                </h2>
                
                {/* Compact Half-Width Layout for Enamel */}
                <div className="grid grid-cols-2 gap-4">
                  {enamelConfigs.map(config => (
                    <div 
                      key={config.id} 
                      className={`border-2 border-dashed rounded-lg p-3 text-center space-y-2 cursor-pointer transition-all relative ${
                        config.paintingSystem 
                          ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20' 
                          : 'border-orange-300 hover:border-orange-500 bg-orange-50/30 dark:bg-orange-950/10'
                      }`}
                      onClick={() => handleEditConfig(config.id)}
                    >
                      {config.isAdditional && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive absolute top-2 right-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConfig(config.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-orange-700 dark:text-orange-300 text-xs pointer-events-none"
                      >
                        {config.paintingSystem || 'Configure Enamel'}
                      </Button>
                      <div>
                        <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{config.area.toFixed(1)}</p>
                        <p className="text-xs text-orange-600 dark:text-orange-400">
                          {config.label || 'Enamel Area'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Additional Enamel - Navigate to Door & Window tab */}
                <Button
                  variant="outline"
                  className="w-full border-dashed border-orange-300 text-orange-700"
                  onClick={() => {
                    try {
                      const enamelBase = enamelConfigs.reduce((sum, c) => sum + c.area, 0);
                      const currentRoomIds = rooms
                        .filter(room => {
                          const projectType = room.project_type;
                          if (selectedPaintType === "Interior") return projectType === "Interior";
                          if (selectedPaintType === "Exterior") return projectType === "Exterior";
                          if (selectedPaintType === "Waterproofing") return projectType === "Waterproofing";
                          return false;
                        })
                        .map(r => r.id);
                      localStorage.setItem(`additional_enamel_baseline_${projectId}_${selectedPaintType}`, JSON.stringify({ 
                        enamel: enamelBase,
                        roomIds: currentRoomIds
                      }));
                      localStorage.setItem(`additional_enamel_mode_${projectId}_${selectedPaintType}`, '1');
                      // Set the tab to open "doorwindow" tab
                      localStorage.setItem(`open_tab_${projectId}`, 'doorwindow');
                    } catch {}
                    navigate(`/room-measurement/${projectId}`);
                  }}
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
              {selectedConfig.areaType !== 'Enamel' && (
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
              )}

              {selectedConfig.areaType === 'Enamel' && (
                <div className="bg-muted rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-sm">Enamel Configuration</h4>

                  {/* Primer Type and Coats */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Primer</Label>
                    <Select 
                      value={selectedConfig.enamelConfig?.primerType || ''}
                      onValueChange={(value) => handleUpdateConfig({
                        enamelConfig: {
                          primerType: value,
                          primerCoats: selectedConfig.enamelConfig?.primerCoats ?? 0,
                          enamelType: selectedConfig.enamelConfig?.enamelType || '',
                          enamelCoats: selectedConfig.enamelConfig?.enamelCoats ?? 0,
                        }
                      })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select Primer Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Trucare Wood Primer">Trucare Wood Primer</SelectItem>
                        <SelectItem value="Trucare Yellow Metal Primer">Trucare Yellow Metal Primer</SelectItem>
                        <SelectItem value="Trucare Red Oxide Metal Primer">Trucare Red Oxide Metal Primer</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Coats</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateConfig({
                            enamelConfig: {
                              primerType: selectedConfig.enamelConfig?.primerType || '',
                              primerCoats: Math.max(0, (selectedConfig.enamelConfig?.primerCoats ?? 0) - 1),
                              enamelType: selectedConfig.enamelConfig?.enamelType || '',
                              enamelCoats: selectedConfig.enamelConfig?.enamelCoats ?? 0,
                            }
                          })}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {selectedConfig.enamelConfig?.primerCoats ?? 0}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateConfig({
                            enamelConfig: {
                              primerType: selectedConfig.enamelConfig?.primerType || '',
                              primerCoats: Math.min(5, (selectedConfig.enamelConfig?.primerCoats ?? 0) + 1),
                              enamelType: selectedConfig.enamelConfig?.enamelType || '',
                              enamelCoats: selectedConfig.enamelConfig?.enamelCoats ?? 0,
                            }
                          })}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Enamel Type and Coats */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Enamel</Label>
                    <Select 
                      value={selectedConfig.enamelConfig?.enamelType || ''}
                      onValueChange={(value) => handleUpdateConfig({
                        enamelConfig: {
                          primerType: selectedConfig.enamelConfig?.primerType || '',
                          primerCoats: selectedConfig.enamelConfig?.primerCoats ?? 0,
                          enamelType: value,
                          enamelCoats: selectedConfig.enamelConfig?.enamelCoats ?? 0,
                        }
                      })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select Enamel Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Apcolite Premium Enamel Gloss">Apcolite Premium Enamel Gloss</SelectItem>
                        <SelectItem value="Apcolite Premium Enamel Satin">Apcolite Premium Enamel Satin</SelectItem>
                        <SelectItem value="Apcolite Premium Enamel Matt">Apcolite Premium Enamel Matt</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Coats</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateConfig({
                            enamelConfig: {
                              primerType: selectedConfig.enamelConfig?.primerType || '',
                              primerCoats: selectedConfig.enamelConfig?.primerCoats ?? 0,
                              enamelType: selectedConfig.enamelConfig?.enamelType || '',
                              enamelCoats: Math.max(0, (selectedConfig.enamelConfig?.enamelCoats ?? 0) - 1),
                            }
                          })}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {selectedConfig.enamelConfig?.enamelCoats ?? 0}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateConfig({
                            enamelConfig: {
                              primerType: selectedConfig.enamelConfig?.primerType || '',
                              primerCoats: selectedConfig.enamelConfig?.primerCoats ?? 0,
                              enamelType: selectedConfig.enamelConfig?.enamelType || '',
                              enamelCoats: Math.min(5, (selectedConfig.enamelConfig?.enamelCoats ?? 0) + 1),
                            }
                          })}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                          .filter(item => {
                            const category = selectedPaintType === "Interior" ? "Interior Paint" :
                                           selectedPaintType === "Exterior" ? "Exterior Paint" : 
                                           selectedPaintType;
                            return item.category === category;
                          })
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
                          .filter(item => {
                            const category = selectedPaintType === "Interior" ? "Interior Paint" :
                                           selectedPaintType === "Exterior" ? "Exterior Paint" : 
                                           selectedPaintType;
                            return item.category === category;
                          })
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
                disabled={selectedConfig.areaType !== 'Enamel' && !selectedConfig.paintingSystem}
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
