import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Palette, Plus, Minus, Settings, Trash2, ChevronsUpDown, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
  areaType: 'Floor' | 'Wall' | 'Ceiling' | 'Enamel';
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
  
  // Separate state for each paint type to prevent mixing
  const [interiorConfigurations, setInteriorConfigurations] = useState<AreaConfiguration[]>([]);
  const [exteriorConfigurations, setExteriorConfigurations] = useState<AreaConfiguration[]>([]);
  const [waterproofingConfigurations, setWaterproofingConfigurations] = useState<AreaConfiguration[]>([]);
  
  // Current configurations based on selected paint type
  const areaConfigurations = selectedPaintType === "Interior" ? interiorConfigurations :
                              selectedPaintType === "Exterior" ? exteriorConfigurations :
                              waterproofingConfigurations;
  
  const setAreaConfigurations = (updater: AreaConfiguration[] | ((prev: AreaConfiguration[]) => AreaConfiguration[])) => {
    if (selectedPaintType === "Interior") {
      setInteriorConfigurations(updater);
    } else if (selectedPaintType === "Exterior") {
      setExteriorConfigurations(updater);
    } else {
      setWaterproofingConfigurations(updater);
    }
  };
  
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [emulsionComboOpen, setEmulsionComboOpen] = useState(false);
  
  // State for product pricing products
  const [puttyProducts, setPuttyProducts] = useState<string[]>([]);
  const [primerProducts, setPrimerProducts] = useState<string[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Sync initial paint type, prefer snapshot from Generate Summary
  useEffect(() => {
    try {
      const estimationKey = `estimation_${projectId}`;
      const estimationStr = localStorage.getItem(estimationKey);
      if (estimationStr) {
        const est = JSON.parse(estimationStr);
        const pt: any = est.paintType;
        if (pt === 'Interior' || pt === 'Exterior' || pt === 'Waterproofing') {
          setSelectedPaintType(pt);
          localStorage.setItem(`selected_paint_type_${projectId}`, pt);
          // Hydrate preserved configs so returning from Summary keeps selections
          const preservedKey = `configs_preserved_${projectId}_${pt}`;
          if (Array.isArray(est.configurations)) {
            localStorage.setItem(preservedKey, JSON.stringify(est.configurations));
          }
        }
        return;
      }
      const key = `selected_paint_type_${projectId}`;
      const t = localStorage.getItem(key);
      if (t === 'Interior' || t === 'Exterior' || t === 'Waterproofing') {
        setSelectedPaintType(t as any);
      }
    } catch {}
  }, [projectId]);

  // Persist paint type selection so it survives navigation
  useEffect(() => {
    try {
      if (projectId && selectedPaintType) {
        localStorage.setItem(`selected_paint_type_${projectId}`, selectedPaintType);
      }
    } catch {}
  }, [selectedPaintType, projectId]);

  // Quick hydrate all configs from localStorage on mount
  useEffect(() => {
    try {
      // Load Interior configs
      const interiorKey = `paint_configs_${projectId}_Interior`;
      const interiorRaw = typeof window !== 'undefined' ? localStorage.getItem(interiorKey) : null;
      const interiorList = interiorRaw ? JSON.parse(interiorRaw) : [];
      if (Array.isArray(interiorList) && interiorList.length > 0) {
        setInteriorConfigurations(interiorList);
      } else {
        const preservedKey = `configs_preserved_${projectId}_Interior`;
        const raw2 = typeof window !== 'undefined' ? localStorage.getItem(preservedKey) : null;
        const list2 = raw2 ? JSON.parse(raw2) : [];
        if (Array.isArray(list2) && list2.length > 0) {
          setInteriorConfigurations(list2);
        }
      }
      
      // Load Exterior configs
      const exteriorKey = `paint_configs_${projectId}_Exterior`;
      const exteriorRaw = typeof window !== 'undefined' ? localStorage.getItem(exteriorKey) : null;
      const exteriorList = exteriorRaw ? JSON.parse(exteriorRaw) : [];
      if (Array.isArray(exteriorList) && exteriorList.length > 0) {
        setExteriorConfigurations(exteriorList);
      } else {
        const preservedKey = `configs_preserved_${projectId}_Exterior`;
        const raw2 = typeof window !== 'undefined' ? localStorage.getItem(preservedKey) : null;
        const list2 = raw2 ? JSON.parse(raw2) : [];
        if (Array.isArray(list2) && list2.length > 0) {
          setExteriorConfigurations(list2);
        }
      }
      
      // Load Waterproofing configs
      const waterproofingKey = `paint_configs_${projectId}_Waterproofing`;
      const waterproofingRaw = typeof window !== 'undefined' ? localStorage.getItem(waterproofingKey) : null;
      const waterproofingList = waterproofingRaw ? JSON.parse(waterproofingRaw) : [];
      if (Array.isArray(waterproofingList) && waterproofingList.length > 0) {
        setWaterproofingConfigurations(waterproofingList);
      } else {
        const preservedKey = `configs_preserved_${projectId}_Waterproofing`;
        const raw2 = typeof window !== 'undefined' ? localStorage.getItem(preservedKey) : null;
        const list2 = raw2 ? JSON.parse(raw2) : [];
        if (Array.isArray(list2) && list2.length > 0) {
          setWaterproofingConfigurations(list2);
        }
      }
      
      setIsLoading(false);
    } catch {}
  }, [projectId]);

  // Custom sort function for product names to handle specific ordering requirements
  const sortProductNames = (names: string[]) => {
    return names.sort((a, b) => {
      // Special case: "Ultima" should come after "Ultima Stretch"
      if (a === "Ultima" && b === "Ultima Stretch") return 1;
      if (a === "Ultima Stretch" && b === "Ultima") return -1;
      // Default alphabetical sorting
      return a.localeCompare(b);
    });
  };

  // Fetch coverage data
  useEffect(() => {
    fetchCoverageData();
    fetchProductPricingProducts();
  }, []);
  
  // Fetch products from product_pricing table
  const fetchProductPricingProducts = async () => {
    setLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('product_pricing')
        .select('product_name, category')
        .eq('is_visible', true)
        .in('category', ['Putty', 'Primer'])
        .order('product_name');
      
      if (error) {
        console.error('Error fetching product pricing:', error);
        toast.error('Failed to load products');
        setLoadingProducts(false);
        return;
      }
      
      if (data) {
        const puttyList = data
          .filter(item => item.category === 'Putty')
          .map(item => item.product_name)
          .sort((a, b) => a.localeCompare(b));
        
        const primerList = data
          .filter(item => item.category === 'Primer')
          .map(item => item.product_name)
          .sort((a, b) => a.localeCompare(b));
        
        setPuttyProducts(puttyList);
        setPrimerProducts(primerList);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

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
          initializeConfigurations(roomsData);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error:', error);
        setIsLoading(false);
      }
    };
    
    loadRooms();
  }, [projectId, selectedPaintType]);

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

    // Calculate totals for each area type and track which areas are selected
    let floorAreaTotal = 0;
    let wallAreaTotal = 0;
    let ceilingAreaTotal = 0;
    let enamelAreaTotal = 0;
    let hasFloorSelected = false;
    let hasWallSelected = false;
    let hasCeilingSelected = false;
    let hasEnamelSelected = false;

    filteredRooms.forEach((room: any) => {
      const selectedAreas = (typeof room.selected_areas === 'object' && room.selected_areas !== null) ? 
        room.selected_areas as any : { floor: false, wall: true, ceiling: false };
      
      if (selectedAreas.floor) {
        floorAreaTotal += Number(room.floor_area || 0);
        hasFloorSelected = true;
      }
      if (selectedAreas.wall) {
        wallAreaTotal += Number(room.adjusted_wall_area || room.wall_area || 0);
        hasWallSelected = true;
      }
      if (selectedAreas.ceiling) {
        ceilingAreaTotal += Number(room.ceiling_area || 0);
        hasCeilingSelected = true;
      }
      if (room.door_window_grills && Array.isArray(room.door_window_grills)) {
        enamelAreaTotal += Number(room.total_door_window_grill_area || 0);
        hasEnamelSelected = true;
      }
    });

    // Check if we're in "additional area" mode to create new separate boxes
    const modeKey = `additional_mode_${projectId}_${selectedPaintType}`;
    const baselineKey = `additional_baseline_${projectId}_${selectedPaintType}`;
    const storedKey = `additional_entries_${projectId}_${selectedPaintType}`;
    const isAdditionalMode = typeof window !== 'undefined' && localStorage.getItem(modeKey) === '1';
    const baselineRaw = typeof window !== 'undefined' ? localStorage.getItem(baselineKey) : null;
    const baseline = baselineRaw ? JSON.parse(baselineRaw) as { floor?: number; wall?: number; ceiling?: number; enamel?: number; roomIds?: string[] } : null;

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

    // Main areas default to current totals (only if > 0)
    let floorMain = floorAreaTotal;
    let wallMain = wallAreaTotal;
    let ceilingMain = ceilingAreaTotal;
    let enamelMain = enamelAreaTotal;

    // Collect additional configs (new separate boxes)
    const additional: AreaConfiguration[] = [];

    // If NOT in additional mode, split totals into main + stored additionals
    if (!isAdditionalMode && storedAdditional.length > 0) {
      const sumStoredFloor = storedAdditional
        .filter(a => a.areaType === 'Floor')
        .reduce((sum, a) => sum + (Number(a.area) || 0), 0);
      const sumStoredWall = storedAdditional
        .filter(a => a.areaType === 'Wall')
        .reduce((sum, a) => sum + (Number(a.area) || 0), 0);
      const sumStoredCeiling = storedAdditional
        .filter(a => a.areaType === 'Ceiling')
        .reduce((sum, a) => sum + (Number(a.area) || 0), 0);
      const sumStoredEnamel = storedAdditional
        .filter(a => a.areaType === 'Enamel')
        .reduce((sum, a) => sum + (Number(a.area) || 0), 0);
      floorMain = Math.max(0, floorAreaTotal - sumStoredFloor);
      wallMain = Math.max(0, wallAreaTotal - sumStoredWall);
      ceilingMain = Math.max(0, ceilingAreaTotal - sumStoredCeiling);
      enamelMain = Math.max(0, enamelAreaTotal - sumStoredEnamel);
    }

    if (isAdditionalMode && baseline) {
      const addFloor = Math.max(0, floorAreaTotal - (baseline.floor || 0));
      const addWall = Math.max(0, wallAreaTotal - (baseline.wall || 0));
      const addCeiling = Math.max(0, ceilingAreaTotal - (baseline.ceiling || 0));

      // Keep main as baseline so the new difference becomes a new box
      floorMain = baseline.floor || 0;
      wallMain = baseline.wall || 0;
      ceilingMain = baseline.ceiling || 0;

      // Get the baseline room IDs to detect new rooms
      const baselineRoomIds = baseline.roomIds || [];
      const currentRoomIds = filteredRooms.map(r => r.id);
      const newRoomIds = currentRoomIds.filter(id => !baselineRoomIds.includes(id));
      
      // Find the newly added room(s)
      const newRooms = filteredRooms.filter(r => newRoomIds.includes(r.id));

      if (addFloor > 0) {
        // Get the room name from the newly added room with floor area
        let newRoomName = 'Additional Floor Area';
        const newFloorRoom = newRooms.find(room => {
          const selectedAreas = (typeof room.selected_areas === 'object' && room.selected_areas !== null) ? 
            room.selected_areas as any : { floor: false, wall: true, ceiling: false };
          return selectedAreas.floor;
        });
        if (newFloorRoom) {
          newRoomName = `${newFloorRoom.name} (Floor Area)`;
        }

        const newConfig: AreaConfiguration = {
          id: `floor-additional-${Date.now()}`,
          areaType: 'Floor' as any,
          paintingSystem: null,
          coatConfiguration: { putty: 0, primer: 0, emulsion: 0 },
          repaintingConfiguration: { primer: 0, emulsion: 0 },
          selectedMaterials: { putty: '', primer: '', emulsion: '' },
          area: addFloor,
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

      if (addWall > 0) {
        // Get the room name from the newly added room with wall area
        let newRoomName = 'Additional Wall Area';
        const newWallRoom = newRooms.find(room => {
          const selectedAreas = (typeof room.selected_areas === 'object' && room.selected_areas !== null) ? 
            room.selected_areas as any : { floor: false, wall: true, ceiling: false };
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
            room.selected_areas as any : { floor: false, wall: true, ceiling: false };
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
          floor: floorAreaTotal,
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
          label: newRoomName,
          area: addEnamel,
          perSqFtRate: '',
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

    // Create initial configurations only for areas that were selected and have actual sq.ft
    if (floorMain > 0 && hasFloorSelected) {
      configs.push({
        id: 'floor-main',
        areaType: 'Floor' as any,
        paintingSystem: null,
        coatConfiguration: { putty: 0, primer: 0, emulsion: 0 },
        repaintingConfiguration: { primer: 0, emulsion: 0 },
        selectedMaterials: { putty: '', primer: '', emulsion: '' },
        area: floorMain,
        perSqFtRate: '',
        label: 'Floor Area',
        isAdditional: false
      });
    }

    if (wallMain > 0 && hasWallSelected) {
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

    if (ceilingMain > 0 && hasCeilingSelected) {
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

    // Append any additional configs detected (persisted + new) but only keep area types that still have totals > 0
    const filteredStored = storedAdditional.filter(a => {
      if (a.areaType === 'Floor') return floorAreaTotal > 0;
      if (a.areaType === 'Wall') return wallAreaTotal > 0;
      if (a.areaType === 'Ceiling') return ceilingAreaTotal > 0;
      if (a.areaType === 'Enamel') return enamelAreaTotal > 0;
      return true;
    });
    configs.push(...filteredStored, ...additional);

    // Merge with existing configurations to preserve user choices
    const existingConfigs = selectedPaintType === "Interior" ? interiorConfigurations :
                            selectedPaintType === "Exterior" ? exteriorConfigurations :
                            waterproofingConfigurations;

    if (existingConfigs.length > 0) {
      // Update areas only, preserve all user selections, but remove configs that no longer have area
      const updated = existingConfigs
        .map(existing => {
          const match = configs.find(cfg =>
            cfg.id === existing.id ||
            (cfg.areaType === existing.areaType && cfg.label === existing.label && !!cfg.isAdditional === !!existing.isAdditional)
          );
          return match ? { ...existing, area: match.area } : null;
        })
        .filter(Boolean) as AreaConfiguration[];
      
      // Add any new configs not in existing
      const newConfigs = configs.filter(cfg =>
        !updated.some(u =>
          u.id === cfg.id ||
          (u.areaType === cfg.areaType && u.label === cfg.label && !!u.isAdditional === !!cfg.isAdditional)
        )
      );
      
      setAreaConfigurations([...updated, ...newConfigs]);
    } else {
      // First time initialization - try to load from localStorage
      try {
        const preservedKey = `configs_preserved_${projectId}_${selectedPaintType}`;
        const raw = typeof window !== 'undefined' ? localStorage.getItem(preservedKey) : null;
        const preservedList = raw ? JSON.parse(raw) : [];
        
        if (preservedList.length > 0) {
          const merged = configs.map(cfg => {
            const match = preservedList.find((p: any) =>
              p.id === cfg.id ||
              (p.areaType === cfg.areaType && p.label === cfg.label && !!p.isAdditional === !!cfg.isAdditional)
            );
            return match
              ? {
                  ...cfg,
                  paintingSystem: match.paintingSystem ?? cfg.paintingSystem,
                  coatConfiguration: match.coatConfiguration ?? cfg.coatConfiguration,
                  repaintingConfiguration: match.repaintingConfiguration ?? cfg.repaintingConfiguration,
                  selectedMaterials: match.selectedMaterials ?? cfg.selectedMaterials,
                  perSqFtRate: match.perSqFtRate ?? cfg.perSqFtRate,
                  enamelConfig: match.enamelConfig ?? cfg.enamelConfig,
                }
              : cfg;
          });
          setAreaConfigurations(merged);
        } else {
          setAreaConfigurations(configs);
        }
      } catch {
        setAreaConfigurations(configs);
      }
    }
  };

  // Re-initialize when rooms change or paint type changes
  useEffect(() => {
    if (rooms.length > 0 && !isLoading) {
      // Reinitialize configurations for current paint type
      initializeConfigurations(rooms);
    }
  }, [rooms, selectedPaintType]);

  // Persist configurations so they survive navigation and reload
  useEffect(() => {
    try {
      // Save Interior configs
      if (interiorConfigurations.length > 0) {
        const preservedKey = `configs_preserved_${projectId}_Interior`;
        const toStore = interiorConfigurations.map(c => ({
          id: c.id,
          areaType: c.areaType,
          paintingSystem: c.paintingSystem,
          coatConfiguration: c.coatConfiguration,
          repaintingConfiguration: c.repaintingConfiguration,
          selectedMaterials: c.selectedMaterials,
          perSqFtRate: c.perSqFtRate,
          label: c.label,
          isAdditional: c.isAdditional,
          enamelConfig: c.enamelConfig,
        }));
        localStorage.setItem(preservedKey, JSON.stringify(toStore));
      }
      
      // Save Exterior configs
      if (exteriorConfigurations.length > 0) {
        const preservedKey = `configs_preserved_${projectId}_Exterior`;
        const toStore = exteriorConfigurations.map(c => ({
          id: c.id,
          areaType: c.areaType,
          paintingSystem: c.paintingSystem,
          coatConfiguration: c.coatConfiguration,
          repaintingConfiguration: c.repaintingConfiguration,
          selectedMaterials: c.selectedMaterials,
          perSqFtRate: c.perSqFtRate,
          label: c.label,
          isAdditional: c.isAdditional,
          enamelConfig: c.enamelConfig,
        }));
        localStorage.setItem(preservedKey, JSON.stringify(toStore));
      }
      
      // Save Waterproofing configs
      if (waterproofingConfigurations.length > 0) {
        const preservedKey = `configs_preserved_${projectId}_Waterproofing`;
        const toStore = waterproofingConfigurations.map(c => ({
          id: c.id,
          areaType: c.areaType,
          paintingSystem: c.paintingSystem,
          coatConfiguration: c.coatConfiguration,
          repaintingConfiguration: c.repaintingConfiguration,
          selectedMaterials: c.selectedMaterials,
          perSqFtRate: c.perSqFtRate,
          label: c.label,
          isAdditional: c.isAdditional,
          enamelConfig: c.enamelConfig,
        }));
        localStorage.setItem(preservedKey, JSON.stringify(toStore));
      }
    } catch {}
  }, [interiorConfigurations, exteriorConfigurations, waterproofingConfigurations, projectId]);

  // Sync estimation data to localStorage whenever configurations change
  useEffect(() => {
    try {
      const updatedData = {
        interiorConfigurations,
        exteriorConfigurations,
        waterproofingConfigurations,
        lastPaintType: selectedPaintType
      };
      localStorage.setItem(`estimation_${projectId}`, JSON.stringify(updatedData));
    } catch {}
  }, [interiorConfigurations, exteriorConfigurations, waterproofingConfigurations, selectedPaintType, projectId]);

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
    
    setAreaConfigurations(prev => {
      const updated = prev.map(config => 
        config.id === selectedConfigId ? { ...config, ...updates } : config
      );
      // Save to localStorage
      const savedConfigKey = `paint_configs_${projectId}_${selectedPaintType}`;
      try {
        localStorage.setItem(savedConfigKey, JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving configs:', e);
      }
      return updated;
    });
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

  // Calculate total cost - sum of all area costs (emulsion + enamel)
  const calculateTotalCost = () => {
    return areaConfigurations.reduce((total, config) => {
      // For each area configuration (Floor, Wall, Ceiling, Enamel)
      // Calculate: area × rate per sq ft, then add to total
      if (config.perSqFtRate && config.area) {
        const areaCost = config.area * parseFloat(config.perSqFtRate);
        return total + areaCost;
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
    // Validate at least one configuration is complete across all paint types
    const allConfigs = [...interiorConfigurations, ...exteriorConfigurations, ...waterproofingConfigurations];
    const hasValidConfig = allConfigs.some(
      config => config.paintingSystem && config.perSqFtRate
    );

    if (!hasValidConfig) {
      toast.error('Please configure at least one area with painting system and rate');
      return;
    }

    // Save all configurations (all paint types)
    const updatedData = {
      interiorConfigurations: interiorConfigurations,
      exteriorConfigurations: exteriorConfigurations,
      waterproofingConfigurations: waterproofingConfigurations,
      lastPaintType: selectedPaintType,
      totalCost: calculateTotalCost()
    };
    
    localStorage.setItem(`estimation_${projectId}`, JSON.stringify(updatedData));
    navigate(`/generate-summary/${projectId}`);
  };

  // Separate configurations by type
  const floorConfigs = areaConfigurations.filter(c => c.areaType === 'Floor');
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
                            <p className="font-medium">{config.area ? config.area.toFixed(2) : '0.00'}</p>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm">Per Sq.ft Rate (₹)</Label>
                            <Input
                              type="number"
                              placeholder="Enter rate per sq.ft"
                              value={config.perSqFtRate}
                              onChange={(e) => {
                setAreaConfigurations(prev => {
                  const updated = prev.map(c => 
                    c.id === config.id ? { ...c, perSqFtRate: e.target.value } : c
                  );
                  // Save to localStorage
                  const savedConfigKey = `paint_configs_${projectId}_${selectedPaintType}`;
                  try {
                    localStorage.setItem(savedConfigKey, JSON.stringify(updated));
                  } catch (e) {
                    console.error('Error saving configs:', e);
                  }
                  return updated;
                });
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
            {(floorConfigs.length > 0 || wallConfigs.length > 0 || ceilingConfigs.length > 0) && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Area to be Painted</h2>
                
                {/* Main Floor, Wall and Ceiling Areas - Clickable Cards */}
                <div className="grid grid-cols-2 gap-4">
                  {floorConfigs.filter(c => !c.isAdditional).map(config => (
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
                        <p className="text-3xl font-bold">{config.area ? config.area.toFixed(1) : '0.0'}</p>
                        <p className="text-sm text-muted-foreground">{config.label}</p>
                      </div>
                    </div>
                  ))}
                  
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
                        <p className="text-3xl font-bold">{config.area ? config.area.toFixed(1) : '0.0'}</p>
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
                        <p className="text-3xl font-bold">{config.area ? config.area.toFixed(1) : '0.0'}</p>
                        <p className="text-sm text-muted-foreground">{config.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Additional Floor, Wall and Ceiling Areas - Compact Half-Width Layout */}
                {[...floorConfigs, ...wallConfigs, ...ceilingConfigs].filter(c => c.isAdditional).length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {[...floorConfigs, ...wallConfigs, ...ceilingConfigs].filter(c => c.isAdditional).map(config => (
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
                          <p className="text-2xl font-bold">{config.area ? config.area.toFixed(1) : '0.0'}</p>
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
                      const floorBase = floorConfigs.reduce((sum, c) => sum + c.area, 0);
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
                        floor: floorBase,
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
                  Add Additional Sq.ft Area
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
                            <p className="text-sm text-muted-foreground">Paint Type</p>
                            <p className="font-medium">{config.enamelConfig?.enamelType || 'Not Selected'}</p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Painting System</p>
                            <p className="font-medium">{config.paintingSystem || 'Not Selected'}</p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Coats</p>
                            <p className="font-medium text-sm leading-relaxed">
                              {getConfigDescription(config) || 'Not configured'}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Area Sq.ft</p>
                            <p className="font-medium">{config.area ? config.area.toFixed(2) : '0.00'}</p>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm">Per Sq.ft Rate (₹)</Label>
                            <Input
                              type="number"
                              placeholder="Enter rate per sq.ft"
                              value={config.perSqFtRate}
                              onChange={(e) => {
                setAreaConfigurations(prev => {
                  const updated = prev.map(c => 
                    c.id === config.id ? { ...c, perSqFtRate: e.target.value } : c
                  );
                  // Save to localStorage
                  const savedConfigKey = `paint_configs_${projectId}_${selectedPaintType}`;
                  try {
                    localStorage.setItem(savedConfigKey, JSON.stringify(updated));
                  } catch (e) {
                    console.error('Error saving configs:', e);
                  }
                  return updated;
                });
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
                        <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{config.area ? config.area.toFixed(1) : '0.0'}</p>
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
                <>
                  {!selectedConfig.paintingSystem ? (
                    /* Step 1: Fresh Painting / Repainting Selection for Enamel */
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleUpdateConfig({ paintingSystem: "Fresh Painting" })}
                        className="h-20 flex flex-col items-center justify-center"
                      >
                        <p className="font-medium">Fresh Painting</p>
                        <p className="text-xs opacity-80">Complete system</p>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleUpdateConfig({ paintingSystem: "Repainting" })}
                        className="h-20 flex flex-col items-center justify-center"
                      >
                        <p className="font-medium">Repainting</p>
                        <p className="text-xs opacity-80">Refresh system</p>
                      </Button>
                    </div>
                  ) : (
                    /* Step 2: Enamel Configuration after system selection */
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-muted-foreground">
                          System: <span className="font-medium text-foreground">{selectedConfig.paintingSystem}</span>
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setAreaConfigurations(prev => {
                              const updated = prev.map(c => 
                                c.id === selectedConfig.id 
                                  ? { ...c, paintingSystem: '' as "Fresh Painting" | "Repainting" } 
                                  : c
                              );
                              const savedConfigKey = `paint_configs_${projectId}_${selectedPaintType}`;
                              try {
                                localStorage.setItem(savedConfigKey, JSON.stringify(updated));
                              } catch (e) {
                                console.error('Error saving configs:', e);
                              }
                              return updated;
                            });
                            const updatedConfig = areaConfigurations.find(c => c.id === selectedConfig.id);
                            if (updatedConfig) {
                              setSelectedConfigId(selectedConfig.id);
                            }
                          }}
                        >
                          Change System
                        </Button>
                      </div>

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
                    </>
                  )}
                </>
              )}

              {selectedConfig.areaType !== 'Enamel' && selectedConfig.paintingSystem === "Fresh Painting" && (
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
                      disabled={loadingProducts}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder={loadingProducts ? "Loading..." : "Select putty type"} />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingProducts ? (
                          <div className="flex items-center justify-center py-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                          </div>
                        ) : puttyProducts.length === 0 ? (
                          <div className="py-2 px-2 text-sm text-muted-foreground">No putty products available</div>
                        ) : (
                          puttyProducts.map((puttyName) => (
                            <SelectItem key={puttyName} value={puttyName}>
                              {puttyName}
                            </SelectItem>
                          ))
                        )}
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
                      disabled={loadingProducts}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder={loadingProducts ? "Loading..." : "Select primer type"} />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingProducts ? (
                          <div className="flex items-center justify-center py-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                          </div>
                        ) : primerProducts.length === 0 ? (
                          <div className="py-2 px-2 text-sm text-muted-foreground">No primer products available</div>
                        ) : (
                          primerProducts.map((primerName) => (
                            <SelectItem key={primerName} value={primerName}>
                              {primerName}
                            </SelectItem>
                          ))
                        )}
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
                    <Popover open={emulsionComboOpen} onOpenChange={setEmulsionComboOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={emulsionComboOpen}
                          className="h-9 w-full justify-between"
                        >
                          {selectedConfig.selectedMaterials.emulsion || "Select emulsion type"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[400px] p-0 pointer-events-auto z-50" align="start" side="top">
                        <Command className="rounded-lg border shadow-md">
                          <CommandList className="max-h-[300px]">
                            <CommandEmpty>No emulsion found.</CommandEmpty>
                            <CommandGroup>
                              {sortProductNames(
                                coverageData
                                .filter(item => {
                                  // Map paint type to correct category names in database
                                  const category = selectedPaintType === "Interior" ? "Interior Emulsion" :
                                                 selectedPaintType === "Exterior" ? "Exterior Emulsion" : 
                                                 "Waterproofing";
                                  return item.category === category;
                                })
                                .map(item => item.product_name)
                                .filter((value, index, self) => self.indexOf(value) === index)
                              ).map((emulsionName) => (
                                  <CommandItem
                                    key={emulsionName}
                                    value={emulsionName}
                                    onSelect={(currentValue) => {
                                      handleUpdateConfig({
                                        selectedMaterials: { 
                                          ...selectedConfig.selectedMaterials, 
                                          emulsion: currentValue === selectedConfig.selectedMaterials.emulsion ? "" : currentValue 
                                        }
                                      });
                                      setEmulsionComboOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedConfig.selectedMaterials.emulsion === emulsionName ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {emulsionName}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                          <CommandInput placeholder="Search emulsion..." className="border-t" />
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {selectedConfig.areaType !== 'Enamel' && selectedConfig.paintingSystem === "Repainting" && (
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
                          .filter(primerName => {
                            // Filter primers based on paint type
                            // Exterior-only primers
                            const exteriorOnlyPrimers = [
                              'AP Apex Utima Protek Base Coat',
                              'AP Apex Utima Protek Duralife Base Coat',
                              'AP SmartCare Damp Sheath Exterior Primer',
                              'AP TruCare Exterior Wall Primer'
                            ];
                            // Interior-only primers
                            const interiorOnlyPrimers = [
                              'AP SmartCare Damp Sheath Interior Primer',
                              'AP TruCare Interior Wall Primer'
                            ];
                            
                            if (selectedPaintType === "Exterior") {
                              return exteriorOnlyPrimers.includes(primerName);
                            } else if (selectedPaintType === "Interior") {
                              return interiorOnlyPrimers.includes(primerName);
                            } else if (selectedPaintType === "Waterproofing") {
                              // For waterproofing, show relevant primers
                              return interiorOnlyPrimers.includes(primerName) || exteriorOnlyPrimers.includes(primerName);
                            }
                            return true;
                          })
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
                    <Popover open={emulsionComboOpen} onOpenChange={setEmulsionComboOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={emulsionComboOpen}
                          className="h-9 w-full justify-between"
                        >
                          {selectedConfig.selectedMaterials.emulsion || "Select emulsion type"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[400px] p-0 pointer-events-auto z-50" align="start" side="top">
                        <Command className="rounded-lg border shadow-md">
                          <CommandList className="max-h-[300px]">
                            <CommandEmpty>No emulsion found.</CommandEmpty>
                            <CommandGroup>
                                {sortProductNames(
                                coverageData
                                .filter(item => {
                                  // Map paint type to correct category names in database
                                  const category = selectedPaintType === "Interior" ? "Interior Emulsion" :
                                                 selectedPaintType === "Exterior" ? "Exterior Emulsion" : 
                                                 "Waterproofing";
                                  return item.category === category;
                                })
                                .map(item => item.product_name)
                                .filter((value, index, self) => self.indexOf(value) === index)
                              ).map((emulsionName) => (
                                  <CommandItem
                                    key={emulsionName}
                                    value={emulsionName}
                                    onSelect={(currentValue) => {
                                      handleUpdateConfig({
                                        selectedMaterials: { 
                                          ...selectedConfig.selectedMaterials, 
                                          emulsion: currentValue === selectedConfig.selectedMaterials.emulsion ? "" : currentValue 
                                        }
                                      });
                                      setEmulsionComboOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedConfig.selectedMaterials.emulsion === emulsionName ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {emulsionName}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                          <CommandInput placeholder="Search emulsion..." className="border-t" />
                        </Command>
                      </PopoverContent>
                    </Popover>
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
