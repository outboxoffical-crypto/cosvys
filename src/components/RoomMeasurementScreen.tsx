import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Ruler, Home, Trash2, Calculator, X, Edit3, Camera, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RoomCard, SubArea } from "./RoomCard";
import { SubAreaDialog } from "./SubAreaDialog";

// Removed debounce utility - all saves are now immediate for instant sync

// Utility function for safe numeric parsing - always returns a valid number
const safeParseFloat = (value: string | number | null | undefined, defaultValue: number = 0): number => {
  if (value === null || value === undefined || value === '') return defaultValue;
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(parsed) || !isFinite(parsed) ? defaultValue : parsed;
};

interface OpeningArea {
  id: string;
  height: number;
  width: number;
  quantity: number;
  area: number;
}

interface ExtraSurface {
  id: string;
  height: number;
  width: number;
  quantity: number;
  area: number;
}

interface DoorWindowGrill {
  id: string;
  name: string;
  height: number;
  width: number;
  sides: number;
  grillMultiplier: number;
  area: number;
}

interface Room {
  id: string;
  name: string;
  sectionName?: string; // Section header displayed above room (e.g., "Damp Wall Only Putty")
  length: number;
  width: number;
  height: number;
  projectType: string;
  pictures: string[];
  openingAreas: OpeningArea[];
  extraSurfaces: ExtraSurface[];
  doorWindowGrills: DoorWindowGrill[];
  subAreas: SubArea[];
  floorArea: number;
  wallArea: number;
  ceilingArea: number;
  adjustedWallArea: number;
  totalOpeningArea: number;
  totalExtraSurface: number;
  totalDoorWindowGrillArea: number;
  selectedAreas: {
    floor: boolean;
    wall: boolean;
    ceiling: boolean;
  };
}

interface ProjectData {
  customerName: string;
  mobile: string;
  address: string;
  projectTypes: string[];
}

export default function RoomMeasurementScreen() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeTab, setActiveTab] = useState<string>("sqft");
  const [activeProjectType, setActiveProjectType] = useState<string>("");
  const [showOpenAreaSection, setShowOpenAreaSection] = useState<boolean>(false);
  const [selectedAreas, setSelectedAreas] = useState({
    floor: true,
    wall: true,
    ceiling: false
  });
  const [newRoom, setNewRoom] = useState({
    name: "",
    length: "",
    width: "",
    height: "",
    pictures: [] as string[]
  });
  const [newOpeningArea, setNewOpeningArea] = useState({ height: "", width: "", quantity: "" });
  const [newExtraSurface, setNewExtraSurface] = useState({ height: "", width: "", quantity: "" });
  const [tempOpeningAreas, setTempOpeningAreas] = useState<OpeningArea[]>([]);
  const [tempExtraSurfaces, setTempExtraSurfaces] = useState<ExtraSurface[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  // Track opening areas and extra surfaces per room
  const [roomOpeningInputs, setRoomOpeningInputs] = useState<Record<string, { height: string; width: string; quantity: string }>>({});
  const [roomExtraSurfaceInputs, setRoomExtraSurfaceInputs] = useState<Record<string, { height: string; width: string; quantity: string }>>({});
  const [newDoorWindowGrill, setNewDoorWindowGrill] = useState<Record<string, {
    name: string;
    height: string;
    width: string;
    sides: string;
    grillMultiplier: string;
  }>>({});
  const [dialogDoorWindowGrill, setDialogDoorWindowGrill] = useState({
    name: "",
    height: "",
    width: "",
    sides: "",
    grillMultiplier: "1"
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  // Edit room state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    length: "",
    width: "",
    height: ""
  });

  // Add Door/Window Dialog state
  const [doorWindowDialogOpen, setDoorWindowDialogOpen] = useState(false);
  const [doorWindowRoomName, setDoorWindowRoomName] = useState("");
  const [doorWindowProjectType, setDoorWindowProjectType] = useState<string>("");
  const [doorWindowSectionName, setDoorWindowSectionName] = useState(""); // Section name for separate Paint Estimation box
  
  // Sub-Area Dialog state
  const [subAreaDialogOpen, setSubAreaDialogOpen] = useState(false);
  const [subAreaRoomId, setSubAreaRoomId] = useState<string | null>(null);
  const [editingSubArea, setEditingSubArea] = useState<SubArea | null>(null);
  
  // Custom Section Dialog state (name-only sections for new room)
  const [customSectionDialogOpen, setCustomSectionDialogOpen] = useState(false);
  const [customSectionName, setCustomSectionName] = useState("");
  const [tempCustomSections, setTempCustomSections] = useState<Array<{ id: string; name: string }>>([]);
  const [editingCustomSectionId, setEditingCustomSectionId] = useState<string | null>(null);

  // Separate Section Dialog state (adds a section to existing room, shown as separate box in Paint Estimation)
  const [separateSectionDialogOpen, setSeparateSectionDialogOpen] = useState(false);
  const [separateSectionRoomId, setSeparateSectionRoomId] = useState<string | null>(null);
  const [separateSectionName, setSeparateSectionName] = useState("");

  // Add Section Dialog state (adds section header to existing room)
  const [addSectionDialogOpen, setAddSectionDialogOpen] = useState(false);
  const [addSectionName, setAddSectionName] = useState("");
  const [addSectionRoomId, setAddSectionRoomId] = useState<string | null>(null);

  // Immediate save functions - no debouncing for instant sync
  const saveRoomToDatabase = async (roomData: any) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .insert(roomData);
      if (error) console.error('Save room error:', error);
    } catch (error) {
      console.error('Save room error:', error);
    }
  };

  const updateRoomInDatabase = async (roomId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update(updates)
        .eq('room_id', roomId)
        .eq('project_id', projectId!);
      if (error) console.error('Update room error:', error);
    } catch (error) {
      console.error('Update room error:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load project data from Supabase
        const { data: projectRecord, error: projectError } = await supabase
          .from('projects')
          .select('customer_name, phone, location, project_type')
          .eq('id', projectId)
          .single();
        
        if (projectError) {
          console.error('Error loading project:', projectError);
          toast.error('Failed to load project data');
          return;
        }
        
        if (projectRecord) {
          const projectTypes = projectRecord.project_type?.split(', ').map((t: string) => t.trim()) || [];
          const data = {
            customerName: projectRecord.customer_name || '',
            mobile: projectRecord.phone || '',
            address: projectRecord.location || '',
            projectTypes
          };
          setProjectData(data);
          setActiveProjectType(projectTypes[0] || '');
        }
        
        // Load existing rooms from Supabase
        const { data: roomsData, error: roomsError } = await supabase
          .from('rooms')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true });
        
        if (roomsError) {
          console.error('Error loading rooms:', roomsError);
          toast.error('Failed to load rooms');
          return;
        }
        
        if (roomsData && roomsData.length > 0) {
          const formattedRooms: Room[] = roomsData.map(room => ({
            id: room.room_id,
            name: room.name,
            sectionName: (room as any).section_name || undefined, // Section header label
            length: Number(room.length),
            width: Number(room.width),
            height: Number(room.height),
            projectType: room.project_type,
            pictures: Array.isArray(room.pictures) ? room.pictures as string[] : [],
            openingAreas: Array.isArray(room.opening_areas) ? room.opening_areas as unknown as OpeningArea[] : [],
            extraSurfaces: Array.isArray(room.extra_surfaces) ? room.extra_surfaces as unknown as ExtraSurface[] : [],
            doorWindowGrills: Array.isArray(room.door_window_grills) ? room.door_window_grills as unknown as DoorWindowGrill[] : [],
            subAreas: Array.isArray(room.sub_areas) ? room.sub_areas as unknown as SubArea[] : [],
            floorArea: Number(room.floor_area),
            wallArea: Number(room.wall_area),
            ceilingArea: Number(room.ceiling_area),
            adjustedWallArea: Number(room.adjusted_wall_area),
            totalOpeningArea: Number(room.total_opening_area),
            totalExtraSurface: Number(room.total_extra_surface),
            totalDoorWindowGrillArea: Number(room.total_door_window_grill_area),
            selectedAreas: (typeof room.selected_areas === 'object' && room.selected_areas !== null) ? 
              room.selected_areas as { floor: boolean; wall: boolean; ceiling: boolean } : 
              { floor: true, wall: true, ceiling: false }
          }));
          setRooms(formattedRooms);
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load data');
      }
    };
    
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  // Check for localStorage flag to open specific tab (e.g., from Paint Estimation)
  useEffect(() => {
    const tabKey = `open_tab_${projectId}`;
    const targetTab = localStorage.getItem(tabKey);
    if (targetTab) {
      setActiveTab(targetTab);
      // Clear the flag after using it
      localStorage.removeItem(tabKey);
    }
  }, [projectId]);

  // Backend calculation function
  const calculateAreasInBackground = useCallback(async (
    length: number,
    width: number,
    height: number,
    openingAreas: OpeningArea[],
    extraSurfaces: ExtraSurface[],
    doorWindowGrills: DoorWindowGrill[]
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('calculate-room-areas', {
        body: {
          length,
          width,
          height,
          opening_areas: openingAreas,
          extra_surfaces: extraSurfaces,
          door_window_grills: doorWindowGrills,
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error calculating areas:', error);
      return null;
    }
  }, []);

  const calculateAreas = useCallback((
    length: number, 
    width: number, 
    height: number, 
    openingAreas: OpeningArea[], 
    extraSurfaces: ExtraSurface[],
    doorWindowGrills: DoorWindowGrill[]
  ) => {
    const floorArea = length * width;
    const wallArea = height > 0 ? 2 * (length + width) * height : floorArea;
    const ceilingArea = floorArea;
    
    const totalOpeningArea = openingAreas.reduce((sum, opening) => sum + opening.area, 0);
    const totalExtraSurface = extraSurfaces.reduce((sum, extra) => sum + extra.area, 0);
    const totalDoorWindowGrillArea = doorWindowGrills.reduce((sum, dwg) => sum + dwg.area, 0);
    
    // Door & Window grills are for enamel only - do NOT add to wall area
    const adjustedWallArea = wallArea - totalOpeningArea + totalExtraSurface;
    
    return { 
      floorArea, 
      wallArea, 
      ceilingArea, 
      adjustedWallArea,
      totalOpeningArea,
      totalExtraSurface,
      totalDoorWindowGrillArea
    };
  }, []);

  const addTempOpeningArea = () => {
    if (newOpeningArea.height && newOpeningArea.width) {
      const height = safeParseFloat(newOpeningArea.height);
      const width = safeParseFloat(newOpeningArea.width);
      const quantity = safeParseFloat(newOpeningArea.quantity, 1);
      const area = height * width * quantity;
      
      const openingArea = {
        id: `opening-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        height,
        width,
        quantity,
        area
      };
      
      setTempOpeningAreas(prev => [...prev, openingArea]);
      setNewOpeningArea({ height: "", width: "", quantity: "" });
    }
  };

  const addTempExtraSurface = () => {
    if (newExtraSurface.height && newExtraSurface.width) {
      const height = safeParseFloat(newExtraSurface.height);
      const width = safeParseFloat(newExtraSurface.width);
      const quantity = safeParseFloat(newExtraSurface.quantity, 1);
      const area = height * width * quantity;
      
      const extraSurface = {
        id: `extra-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        height,
        width,
        quantity,
        area
      };
      
      setTempExtraSurfaces(prev => [...prev, extraSurface]);
      setNewExtraSurface({ height: "", width: "", quantity: "" });
    }
  };

  const removeTempOpeningArea = (id: string) => {
    setTempOpeningAreas(prev => prev.filter(item => item.id !== id));
  };

  const removeTempExtraSurface = (id: string) => {
    setTempExtraSurfaces(prev => prev.filter(item => item.id !== id));
  };

  const addOpeningArea = () => {
    if (newOpeningArea.height && newOpeningArea.width) {
      const height = safeParseFloat(newOpeningArea.height);
      const width = safeParseFloat(newOpeningArea.width);
      const quantity = safeParseFloat(newOpeningArea.quantity, 1);
      const area = height * width * quantity;
      
      return {
        id: `opening-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        height,
        width,
        quantity,
        area
      };
    }
    return null;
  };

  const addExtraSurface = () => {
    if (newExtraSurface.height && newExtraSurface.width) {
      const height = safeParseFloat(newExtraSurface.height);
      const width = safeParseFloat(newExtraSurface.width);
      const quantity = safeParseFloat(newExtraSurface.quantity, 1);
      const area = height * width * quantity;
      
      return {
        id: `extra-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        height,
        width,
        quantity,
        area
      };
    }
    return null;
  };

  const addDoorWindowGrill = (roomId?: string) => {
    const grillData = roomId ? newDoorWindowGrill[roomId] : dialogDoorWindowGrill;
    if (!grillData) return null;
    
    if (grillData.height && grillData.width && grillData.sides) {
      const height = safeParseFloat(grillData.height);
      const width = safeParseFloat(grillData.width);
      const sides = safeParseFloat(grillData.sides);
      const grillMultiplier = safeParseFloat(grillData.grillMultiplier, 1);
      const area = height * width * sides * grillMultiplier;
      
      return {
        id: `dwg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: grillData.name,
        height,
        width,
        sides,
        grillMultiplier,
        area
      };
    }
    return null;
  };

  const handlePictureUpload = useCallback((files: FileList | null, isCamera: boolean = false) => {
    if (!files) return;
    
    const currentPictureCount = newRoom.pictures.length;
    const maxPictures = 5;
    
    // Process images asynchronously in the background
    Array.from(files).forEach((file, index) => {
      if (currentPictureCount + index >= maxPictures) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setNewRoom(prev => ({
          ...prev,
          pictures: [...prev.pictures, result]
        }));
      };
      reader.readAsDataURL(file);
    });
  }, [newRoom.pictures.length]);

  const removePicture = useCallback((index: number) => {
    setNewRoom(prev => ({
      ...prev,
      pictures: prev.pictures.filter((_, i) => i !== index)
    }));
  }, []);

  const handleAddRoomClick = () => {
    setShowOpenAreaSection(true);
  };

  const addRoom = async () => {
    // Validate room name
    if (!newRoom.name.trim() || newRoom.name.trim().length > 50) {
      toast.error('Room name must be between 1 and 50 characters');
      return;
    }

    // Height is now optional - only require name, length, width, and pictures
    if (newRoom.name && newRoom.length && newRoom.width && newRoom.pictures.length >= 2) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to save room data');
        return;
      }

      // Use safe parsing with explicit validation
      const length = safeParseFloat(newRoom.length);
      const width = safeParseFloat(newRoom.width);
      const height = safeParseFloat(newRoom.height, 0);
      
      // Validate parsed values
      if (length <= 0 || width <= 0) {
        toast.error('Length and width must be greater than 0');
        return;
      }
      
      // Calculate areas immediately on client side for INSTANT UI
      const floorArea = length * width;
      const wallArea = height > 0 ? 2 * (length + width) * height : floorArea;
      const ceilingArea = floorArea;
      const totalOpeningArea = tempOpeningAreas.reduce((sum, opening) => sum + opening.area, 0);
      const totalExtraSurface = tempExtraSurfaces.reduce((sum, extra) => sum + extra.area, 0);
      const adjustedWallArea = wallArea - totalOpeningArea + totalExtraSurface;
      
      // Generate unique stable ID
      const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create room with calculated areas for INSTANT UI update
      const room: Room = {
        id: roomId,
        name: newRoom.name.trim(),
        length,
        width,
        height,
        projectType: activeProjectType,
        pictures: [...newRoom.pictures],
        openingAreas: [...tempOpeningAreas],
        extraSurfaces: [...tempExtraSurfaces],
        doorWindowGrills: [],
        subAreas: tempCustomSections.map(section => ({
          id: section.id,
          name: section.name,
          area: 0 // Area to be entered later by user
        })),
        floorArea,
        wallArea,
        ceilingArea,
        adjustedWallArea,
        totalOpeningArea,
        totalExtraSurface,
        totalDoorWindowGrillArea: 0,
        selectedAreas: {
          floor: true,
          wall: true,
          ceiling: false
        }
      };
      
      // INSTANT UI UPDATE - no waiting
      setRooms(prev => [...prev, room]);
      setNewRoom({ name: "", length: "", width: "", height: "", pictures: [] });
      setShowOpenAreaSection(false);
      setTempOpeningAreas([]);
      setTempExtraSurfaces([]);
      setTempCustomSections([]);
      
      // Show instant visual confirmation
      toast.success('Room added');
      
      // Save to database immediately - no debouncing for instant sync
      const roomData = {
        user_id: session.user.id,
        project_id: projectId!,
        room_id: roomId,
        name: room.name,
        length: room.length,
        width: room.width,
        height: room.height,
        project_type: room.projectType,
        pictures: room.pictures as any,
        opening_areas: room.openingAreas as any,
        extra_surfaces: room.extraSurfaces as any,
        door_window_grills: [] as any,
        sub_areas: room.subAreas as any, // Custom sections created via (+) icon
        floor_area: room.floorArea,
        wall_area: room.wallArea,
        ceiling_area: room.ceilingArea,
        adjusted_wall_area: room.adjustedWallArea,
        total_opening_area: room.totalOpeningArea,
        total_extra_surface: room.totalExtraSurface,
        total_door_window_grill_area: 0,
        selected_areas: room.selectedAreas as any
      };
      saveRoomToDatabase(roomData);
    }
  };

  const removeRoom = useCallback(async (roomId: string) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('room_id', roomId)
        .eq('project_id', projectId!);
      
      if (error) {
        console.error('Error deleting room:', error);
        toast.error('Failed to delete room');
        return;
      }
      
      // Functional update for immutability
      setRooms(prev => prev.filter(room => room.id !== roomId));
      toast.success('Room deleted');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete room');
    }
  }, [projectId]);

  const addOpeningAreaToRoom = useCallback(async (roomId: string) => {
    const roomInput = roomOpeningInputs[roomId] || { height: "", width: "", quantity: "" };
    
    if (!roomInput.height || !roomInput.width) {
      toast.error('Please enter height and width');
      return;
    }

    const height = safeParseFloat(roomInput.height);
    const width = safeParseFloat(roomInput.width);
    const quantity = safeParseFloat(roomInput.quantity, 1);
    const area = height * width * quantity;
    
    const openingArea: OpeningArea = {
      id: `opening-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      height,
      width,
      quantity,
      area
    };

    const targetRoom = rooms.find(r => r.id === roomId);
    if (!targetRoom) return;

    const updatedOpeningAreas = [...targetRoom.openingAreas, openingArea];
    const areas = calculateAreas(
      targetRoom.length, 
      targetRoom.width, 
      targetRoom.height, 
      updatedOpeningAreas, 
      targetRoom.extraSurfaces, 
      targetRoom.doorWindowGrills
    );

    // Update state immediately for instant UI response
    setRooms(prev => prev.map(room => 
      room.id === roomId 
        ? { ...room, openingAreas: updatedOpeningAreas, ...areas }
        : room
    ));
    
    // Clear inputs for this room
    setRoomOpeningInputs(prev => ({
      ...prev,
      [roomId]: { height: "", width: "", quantity: "" }
    }));

    toast.success('Opening area added');

    // Immediate save for instant sync
    updateRoomInDatabase(roomId, {
      opening_areas: updatedOpeningAreas as any,
      total_opening_area: areas.totalOpeningArea,
      adjusted_wall_area: areas.adjustedWallArea
    });
  }, [rooms, projectId, calculateAreas, roomOpeningInputs]);

  const addExtraSurfaceToRoom = useCallback(async (roomId: string) => {
    const roomInput = roomExtraSurfaceInputs[roomId] || { height: "", width: "", quantity: "" };
    
    if (!roomInput.height || !roomInput.width) {
      toast.error('Please enter height and width');
      return;
    }

    const height = safeParseFloat(roomInput.height);
    const width = safeParseFloat(roomInput.width);
    const quantity = safeParseFloat(roomInput.quantity, 1);
    const area = height * width * quantity;
    
    const extraSurface: ExtraSurface = {
      id: `extra-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      height,
      width,
      quantity,
      area
    };

    const targetRoom = rooms.find(r => r.id === roomId);
    if (!targetRoom) return;

    const updatedExtraSurfaces = [...targetRoom.extraSurfaces, extraSurface];
    const areas = calculateAreas(
      targetRoom.length, 
      targetRoom.width, 
      targetRoom.height, 
      targetRoom.openingAreas, 
      updatedExtraSurfaces, 
      targetRoom.doorWindowGrills
    );

    // Update state immediately
    setRooms(prev => prev.map(room => 
      room.id === roomId 
        ? { ...room, extraSurfaces: updatedExtraSurfaces, ...areas }
        : room
    ));
    
    // Clear inputs for this room
    setRoomExtraSurfaceInputs(prev => ({
      ...prev,
      [roomId]: { height: "", width: "", quantity: "" }
    }));

    toast.success('Extra surface added');

    // Immediate save for instant sync
    updateRoomInDatabase(roomId, {
      extra_surfaces: updatedExtraSurfaces as any,
      total_extra_surface: areas.totalExtraSurface,
      adjusted_wall_area: areas.adjustedWallArea
    });
  }, [rooms, projectId, calculateAreas, roomExtraSurfaceInputs]);

  const addDoorWindowGrillToRoom = async (roomId: string) => {
    const doorWindowGrill = addDoorWindowGrill(roomId);
    if (doorWindowGrill) {
      const updatedRooms = rooms.map(room => {
        if (room.id === roomId) {
          const updatedDoorWindowGrills = [...room.doorWindowGrills, doorWindowGrill];
          const areas = calculateAreas(room.length, room.width, room.height, room.openingAreas, room.extraSurfaces, updatedDoorWindowGrills);
          return { ...room, doorWindowGrills: updatedDoorWindowGrills, ...areas };
        }
        return room;
      });
      
      const updatedRoom = updatedRooms.find(r => r.id === roomId);
      if (updatedRoom) {
        try {
          const { error } = await supabase
            .from('rooms')
            .update({
              door_window_grills: updatedRoom.doorWindowGrills as any,
              total_door_window_grill_area: updatedRoom.totalDoorWindowGrillArea,
              adjusted_wall_area: updatedRoom.adjustedWallArea
            })
            .eq('room_id', roomId)
            .eq('project_id', projectId!);
          
          if (error) {
            console.error('Error updating room:', error);
            toast.error('Failed to update room');
            return;
          }
          
          setRooms(updatedRooms);
          setNewDoorWindowGrill(prev => ({
            ...prev,
            [roomId]: {
              name: "",
              height: "",
              width: "",
              sides: "",
              grillMultiplier: "1"
            }
          }));
          toast.success('Door/Window added');
        } catch (error) {
          console.error('Error:', error);
          toast.error('Failed to update room');
        }
      }
    }
  };

  // Sub-Area handlers
  const handleAddSubArea = useCallback((roomId: string) => {
    setSubAreaRoomId(roomId);
    setEditingSubArea(null);
    setSubAreaDialogOpen(true);
  }, []);

  const handleEditSubArea = useCallback((roomId: string, subArea: SubArea) => {
    setSubAreaRoomId(roomId);
    setEditingSubArea(subArea);
    setSubAreaDialogOpen(true);
  }, []);

  const handleSaveSubArea = useCallback(async (subArea: SubArea) => {
    if (!subAreaRoomId) return;

    const targetRoom = rooms.find(r => r.id === subAreaRoomId);
    if (!targetRoom) return;

    let updatedSubAreas: SubArea[];
    if (editingSubArea) {
      // Update existing sub-area
      updatedSubAreas = targetRoom.subAreas.map(sa => 
        sa.id === subArea.id ? subArea : sa
      );
    } else {
      // Add new sub-area
      updatedSubAreas = [...targetRoom.subAreas, subArea];
    }

    // Update local state immediately
    setRooms(prev => prev.map(room => 
      room.id === subAreaRoomId 
        ? { ...room, subAreas: updatedSubAreas }
        : room
    ));

    // Save to database
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ sub_areas: updatedSubAreas as any })
        .eq('room_id', subAreaRoomId)
        .eq('project_id', projectId!);

      if (error) {
        console.error('Error saving sub-area:', error);
        toast.error('Failed to save sub-area');
        return;
      }
      
      toast.success(editingSubArea ? 'Sub-area updated' : 'Sub-area added');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save sub-area');
    }

    setSubAreaDialogOpen(false);
    setSubAreaRoomId(null);
    setEditingSubArea(null);
  }, [subAreaRoomId, rooms, projectId, editingSubArea]);

  const handleRemoveSubArea = useCallback(async (roomId: string, subAreaId: string) => {
    const targetRoom = rooms.find(r => r.id === roomId);
    if (!targetRoom) return;

    const updatedSubAreas = targetRoom.subAreas.filter(sa => sa.id !== subAreaId);

    // Update local state immediately
    setRooms(prev => prev.map(room => 
      room.id === roomId 
        ? { ...room, subAreas: updatedSubAreas }
        : room
    ));

    // Save to database
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ sub_areas: updatedSubAreas as any })
        .eq('room_id', roomId)
        .eq('project_id', projectId!);

      if (error) {
        console.error('Error removing sub-area:', error);
        toast.error('Failed to remove sub-area');
        return;
      }
      
      toast.success('Sub-area removed');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to remove sub-area');
    }
  }, [rooms, projectId]);

  // Custom Section handlers (name-only sections for new room)
  const handleOpenCustomSectionDialog = useCallback((editId?: string) => {
    if (editId) {
      const section = tempCustomSections.find(s => s.id === editId);
      if (section) {
        setCustomSectionName(section.name);
        setEditingCustomSectionId(editId);
      }
    } else {
      setCustomSectionName("");
      setEditingCustomSectionId(null);
    }
    setCustomSectionDialogOpen(true);
  }, [tempCustomSections]);

  const handleSaveCustomSection = useCallback(() => {
    if (!customSectionName.trim()) {
      toast.error('Please enter a section name');
      return;
    }

    if (editingCustomSectionId) {
      // Update existing
      setTempCustomSections(prev => prev.map(s => 
        s.id === editingCustomSectionId ? { ...s, name: customSectionName.trim() } : s
      ));
      toast.success('Section updated');
    } else {
      // Add new
      const newSection = {
        id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: customSectionName.trim()
      };
      setTempCustomSections(prev => [...prev, newSection]);
      toast.success('Section added');
    }

    setCustomSectionDialogOpen(false);
    setCustomSectionName("");
    setEditingCustomSectionId(null);
  }, [customSectionName, editingCustomSectionId]);

  const handleRemoveCustomSection = useCallback((sectionId: string) => {
    setTempCustomSections(prev => prev.filter(s => s.id !== sectionId));
    toast.success('Section removed');
  }, []);

  // Add Section handler - adds section header to EXISTING room (not creating new one)
  const handleAddSection = useCallback(async () => {
    if (!addSectionName.trim()) {
      toast.error('Please enter a section name');
      return;
    }

    if (!addSectionRoomId) {
      toast.error('No room selected');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Please log in to save room data');
      return;
    }

    const sectionNameTrimmed = addSectionName.trim();
    
    // Find the existing room
    const existingRoom = rooms.find(r => r.id === addSectionRoomId);
    if (!existingRoom) {
      toast.error('Room not found');
      return;
    }
    
    // INSTANT UI UPDATE - update the existing room with section name
    setRooms(prev => prev.map(r => 
      r.id === addSectionRoomId 
        ? { ...r, sectionName: sectionNameTrimmed }
        : r
    ));
    
    setAddSectionDialogOpen(false);
    setAddSectionName("");
    setAddSectionRoomId(null);
    
    // Show instant visual confirmation
    toast.success(`Section header "${sectionNameTrimmed}" added to ${existingRoom.name}`);
    
    // Update the existing room in database with section_name
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ section_name: sectionNameTrimmed })
        .eq('room_id', addSectionRoomId)
        .eq('project_id', projectId!);
      
      if (error) {
        console.error('Error updating section name:', error);
        toast.error('Failed to save section header');
      }
    } catch (err) {
      console.error('Error updating section name:', err);
    }
  }, [addSectionName, addSectionRoomId, rooms, projectId]);

  // Handle adding separate paint section to existing room
  // This creates a sub-area with just a name - area will be entered in Paint Estimation
  const handleAddSeparateSection = useCallback(async () => {
    if (!separateSectionName.trim() || !separateSectionRoomId) {
      toast.error('Please enter a section name');
      return;
    }

    const targetRoom = rooms.find(r => r.id === separateSectionRoomId);
    if (!targetRoom) {
      toast.error('Room not found');
      return;
    }

    // Create a new sub-area with area=0 (user will enter sq.ft in Paint Estimation)
    const newSection: SubArea = {
      id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: separateSectionName.trim(),
      area: 0 // Will be entered in Paint Estimation
    };

    const updatedSubAreas = [...(targetRoom.subAreas || []), newSection];

    // Update local state immediately
    setRooms(prev => prev.map(room => 
      room.id === separateSectionRoomId 
        ? { ...room, subAreas: updatedSubAreas }
        : room
    ));

    // Close dialog
    setSeparateSectionDialogOpen(false);
    setSeparateSectionName("");
    setSeparateSectionRoomId(null);

    toast.success(`Section "${newSection.name}" added - configure it in Paint Estimation`);

    // Save to database
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ sub_areas: updatedSubAreas as any })
        .eq('room_id', separateSectionRoomId)
        .eq('project_id', projectId!);

      if (error) {
        console.error('Error saving section:', error);
        toast.error('Failed to save section to database');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }, [separateSectionName, separateSectionRoomId, rooms, projectId]);

  // Handle adding door/window from dialog
  const handleAddDoorWindowFromDialog = async () => {
    const doorWindowGrill = addDoorWindowGrill();
    if (!doorWindowGrill) {
      toast.error('Please fill in all door/window measurements');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Please log in to save door/window data');
      return;
    }

    // Use doorWindowRoomName from state or create new room
    const roomName = doorWindowRoomName.trim() || "Untitled Room";
    const projectType = doorWindowProjectType || activeProjectType || projectData?.projectTypes[0] || "";
    let targetRoom = rooms.find(r => r.name.toLowerCase() === roomName.toLowerCase() && r.projectType === projectType);

    if (targetRoom) {
      // Add to existing room
      const updatedDoorWindowGrills = [...targetRoom.doorWindowGrills, doorWindowGrill];
      const areas = calculateAreas(targetRoom.length, targetRoom.width, targetRoom.height, targetRoom.openingAreas, targetRoom.extraSurfaces, updatedDoorWindowGrills);
      
      try {
        const { error } = await supabase
          .from('rooms')
          .update({
            door_window_grills: updatedDoorWindowGrills as any,
            total_door_window_grill_area: areas.totalDoorWindowGrillArea,
            adjusted_wall_area: areas.adjustedWallArea
          })
          .eq('room_id', targetRoom.id)
          .eq('project_id', projectId!);
        
        if (error) {
          console.error('Error updating room:', error);
          toast.error('Failed to add door/window');
          return;
        }
        
        setRooms(prev => prev.map(room => 
          room.id === targetRoom!.id 
            ? { ...room, doorWindowGrills: updatedDoorWindowGrills, ...areas }
            : room
        ));
        
        toast.success(`Door/Window added to ${targetRoom.name}`);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to add door/window');
        return;
      }
    } else {
      // Create new room with just door/window data
      const roomId = Date.now().toString();
      const sectionNameTrimmed = doorWindowSectionName.trim() || undefined;
      const newRoom: Room = {
        id: roomId,
        name: roomName,
        sectionName: sectionNameTrimmed, // Section header for separate Paint Estimation box
        length: 0,
        width: 0,
        height: 0,
        projectType: projectType,
        pictures: [],
        openingAreas: [],
        extraSurfaces: [],
        doorWindowGrills: [doorWindowGrill],
        subAreas: [],
        floorArea: 0,
        wallArea: 0,
        ceilingArea: 0,
        adjustedWallArea: 0,
        totalOpeningArea: 0,
        totalExtraSurface: 0,
        totalDoorWindowGrillArea: doorWindowGrill.area,
        selectedAreas: {
          floor: false,
          wall: false,
          ceiling: false
        }
      };

      try {
        const { error } = await supabase
          .from('rooms')
          .insert({
            user_id: session.user.id,
            project_id: projectId!,
            room_id: roomId,
            name: newRoom.name,
            section_name: sectionNameTrimmed || null, // Section header for Paint Estimation
            length: newRoom.length,
            width: newRoom.width,
            height: newRoom.height,
            project_type: newRoom.projectType,
            pictures: newRoom.pictures as any,
            opening_areas: newRoom.openingAreas as any,
            extra_surfaces: newRoom.extraSurfaces as any,
            door_window_grills: newRoom.doorWindowGrills as any,
            floor_area: newRoom.floorArea,
            wall_area: newRoom.wallArea,
            ceiling_area: newRoom.ceilingArea,
            adjusted_wall_area: newRoom.adjustedWallArea,
            total_opening_area: newRoom.totalOpeningArea,
            total_extra_surface: newRoom.totalExtraSurface,
            total_door_window_grill_area: newRoom.totalDoorWindowGrillArea,
            selected_areas: newRoom.selectedAreas as any
          });
        
        if (error) {
          console.error('Error saving room:', error);
          toast.error('Failed to save door/window');
          return;
        }
        
        setRooms(prev => [...prev, newRoom]);
        toast.success(`Door/Window added to new room: ${newRoom.name}`);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to save door/window');
        return;
      }
    }

    // Reset and close dialog
    setDialogDoorWindowGrill({
      name: "",
      height: "",
      width: "",
      sides: "",
      grillMultiplier: "1"
    });
    setDoorWindowRoomName("");
    setDoorWindowProjectType("");
    setDoorWindowSectionName(""); // Reset section name
    setDoorWindowDialogOpen(false);
  };

  const removeOpeningArea = useCallback((roomId: string, openingId: string) => {
    const targetRoom = rooms.find(r => r.id === roomId);
    if (!targetRoom) return;

    const updatedOpeningAreas = targetRoom.openingAreas.filter(o => o.id !== openingId);
    const areas = calculateAreas(
      targetRoom.length, 
      targetRoom.width, 
      targetRoom.height, 
      updatedOpeningAreas, 
      targetRoom.extraSurfaces, 
      targetRoom.doorWindowGrills
    );

    // Update state immediately
    setRooms(prev => prev.map(room => 
      room.id === roomId 
        ? { ...room, openingAreas: updatedOpeningAreas, ...areas }
        : room
    ));

    // Immediate save for instant sync
    updateRoomInDatabase(roomId, {
      opening_areas: updatedOpeningAreas as any,
      total_opening_area: areas.totalOpeningArea,
      adjusted_wall_area: areas.adjustedWallArea
    });
  }, [rooms, projectId, calculateAreas]);

  const removeExtraSurface = useCallback((roomId: string, extraId: string) => {
    const targetRoom = rooms.find(r => r.id === roomId);
    if (!targetRoom) return;

    const updatedExtraSurfaces = targetRoom.extraSurfaces.filter(e => e.id !== extraId);
    const areas = calculateAreas(
      targetRoom.length, 
      targetRoom.width, 
      targetRoom.height, 
      targetRoom.openingAreas, 
      updatedExtraSurfaces, 
      targetRoom.doorWindowGrills
    );

    // Update state immediately
    setRooms(prev => prev.map(room => 
      room.id === roomId 
        ? { ...room, extraSurfaces: updatedExtraSurfaces, ...areas }
        : room
    ));

    // Immediate save for instant sync
    updateRoomInDatabase(roomId, {
      extra_surfaces: updatedExtraSurfaces as any,
      total_extra_surface: areas.totalExtraSurface,
      adjusted_wall_area: areas.adjustedWallArea
    });
  }, [rooms, projectId, calculateAreas]);

  const removeDoorWindowGrill = useCallback((roomId: string, dwgId: string) => {
    const targetRoom = rooms.find(r => r.id === roomId);
    if (!targetRoom) return;

    const updatedDoorWindowGrills = targetRoom.doorWindowGrills.filter(d => d.id !== dwgId);
    const areas = calculateAreas(
      targetRoom.length, 
      targetRoom.width, 
      targetRoom.height, 
      targetRoom.openingAreas, 
      targetRoom.extraSurfaces, 
      updatedDoorWindowGrills
    );

    // Update state immediately
    setRooms(prev => prev.map(room => 
      room.id === roomId 
        ? { ...room, doorWindowGrills: updatedDoorWindowGrills, ...areas }
        : room
    ));

    // Immediate save for instant sync
    updateRoomInDatabase(roomId, {
      door_window_grills: updatedDoorWindowGrills as any,
      total_door_window_grill_area: areas.totalDoorWindowGrillArea,
      adjusted_wall_area: areas.adjustedWallArea
    });
  }, [rooms, projectId, calculateAreas]);

  const updateDoorWindowGrillName = useCallback((roomId: string, dwgId: string, newName: string) => {
    const targetRoom = rooms.find(r => r.id === roomId);
    if (!targetRoom) return;

    const updatedDoorWindowGrills = targetRoom.doorWindowGrills.map(dwg => 
      dwg.id === dwgId ? { ...dwg, name: newName } : dwg
    );

    // Update state immediately
    setRooms(prev => prev.map(room => 
      room.id === roomId 
        ? { ...room, doorWindowGrills: updatedDoorWindowGrills }
        : room
    ));

    // Immediate save for instant sync
    updateRoomInDatabase(roomId, {
      door_window_grills: updatedDoorWindowGrills as any
    });
  }, [rooms, projectId]);

  const getRoomsByProjectType = useCallback((projectType: string) => {
    return rooms.filter(room => room.projectType === projectType);
  }, [rooms]);

  const toggleAreaSelection = useCallback((roomId: string, areaType: 'floor' | 'wall' | 'ceiling') => {
    const targetRoom = rooms.find(r => r.id === roomId);
    if (!targetRoom) return;

    const updatedSelectedAreas = {
      ...targetRoom.selectedAreas,
      [areaType]: !targetRoom.selectedAreas[areaType]
    };

    // Update state immediately for instant UI response
    setRooms(prev => prev.map(room => 
      room.id === roomId 
        ? { ...room, selectedAreas: updatedSelectedAreas }
        : room
    ));

    // Immediate save for instant sync
    updateRoomInDatabase(roomId, {
      selected_areas: updatedSelectedAreas as any
    });
  }, [rooms, projectId]);

  // Calculate totals from current rooms array - always recalculate, never increment
  const getTotalSelectedArea = useCallback((rooms: Room[]) => {
    return rooms.reduce((totals, room) => {
      // Use safe parsing to handle any edge cases
      const floorArea = safeParseFloat(room.floorArea);
      const wallArea = safeParseFloat(room.adjustedWallArea);
      const ceilingArea = safeParseFloat(room.ceilingArea);
      
      return {
        floor: totals.floor + (room.selectedAreas.floor ? floorArea : 0),
        wall: totals.wall + (room.selectedAreas.wall ? wallArea : 0),
        ceiling: totals.ceiling + (room.selectedAreas.ceiling ? ceilingArea : 0)
      };
    }, { floor: 0, wall: 0, ceiling: 0 });
  }, []);

  const handleContinue = async () => {
    if (rooms.length === 0) {
      toast.error('Please add at least one room');
      return;
    }

    try {
      setIsSyncing(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in');
        setIsSyncing(false);
        return;
      }

      // Force immediate sync of ALL rooms before navigation
      const syncPromises = rooms.map(room => 
        supabase.from('rooms').upsert({
          user_id: session.user.id,
          project_id: projectId!,
          room_id: room.id,
          name: room.name,
          length: room.length,
          width: room.width,
          height: room.height,
          project_type: room.projectType,
          pictures: room.pictures as any,
          opening_areas: room.openingAreas as any,
          extra_surfaces: room.extraSurfaces as any,
          door_window_grills: room.doorWindowGrills as any,
          floor_area: room.floorArea,
          wall_area: room.wallArea,
          ceiling_area: room.ceilingArea,
          adjusted_wall_area: room.adjustedWallArea,
          total_opening_area: room.totalOpeningArea,
          total_extra_surface: room.totalExtraSurface,
          total_door_window_grill_area: room.totalDoorWindowGrillArea,
          selected_areas: room.selectedAreas as any
        }, { onConflict: 'room_id,project_id' })
      );

      // Wait for all rooms to sync before navigating
      await Promise.all(syncPromises);
      
      setIsSyncing(false);
      // Navigate only after all data is saved
      navigate(`/paint-estimation/${projectId}`);
    } catch (error) {
      console.error('Error syncing rooms:', error);
      toast.error('Failed to sync data');
      setIsSyncing(false);
    }
  };

  // Handle edit room
  const handleEditRoom = useCallback((room: Room) => {
    setEditingRoom(room);
    setEditFormData({
      name: room.name,
      length: room.length.toString(),
      width: room.width.toString(),
      height: room.height.toString()
    });
    setEditDialogOpen(true);
  }, []);

  // Complete Room - calculate paint data for Paint Estimation
  const completeRoom = useCallback(async (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    // Show instant feedback
    toast.success('Calculating paint requirements...');
    const startTime = Date.now();

    try {
      // Call optimized edge function for paint calculations
      const { data, error } = await supabase.functions.invoke('calculate-paint-requirements', {
        body: {
          room_id: roomId,
          floor_area: room.floorArea,
          wall_area: room.wallArea,
          ceiling_area: room.ceilingArea,
          adjusted_wall_area: room.adjustedWallArea,
          selected_areas: room.selectedAreas,
          project_type: room.projectType,
        },
      });

      if (error) throw error;

      // Update database with paint calculations
      await supabase.from('rooms').update({
        paint_calculations: data
      }).eq('room_id', roomId).eq('project_id', projectId!);

      const elapsedTime = Date.now() - startTime;
      console.log(`Paint calculation completed in ${elapsedTime}ms`);
      toast.success(`Room completed! (${elapsedTime}ms)`, { duration: 2000 });

    } catch (error) {
      console.error('Error completing room:', error);
      toast.error('Failed to complete room calculations');
    }
  }, [rooms, projectId]);

  // Handle update room
  const handleUpdateRoom = async () => {
    if (!editingRoom || !editFormData.name || !editFormData.length || !editFormData.width) {
      toast.error('Please fill in all required fields');
      return;
    }

    const length = safeParseFloat(editFormData.length);
    const width = safeParseFloat(editFormData.width);
    const height = safeParseFloat(editFormData.height, 0);

    if (length <= 0 || width <= 0) {
      toast.error('Length and width must be greater than 0');
      return;
    }

    // Calculate areas immediately on client side
    const areas = calculateAreas(
      length,
      width,
      height,
      editingRoom.openingAreas,
      editingRoom.extraSurfaces,
      editingRoom.doorWindowGrills
    );

    // INSTANT UI UPDATE
    setRooms(prev => prev.map(room => 
      room.id === editingRoom.id 
        ? {
            ...room,
            name: editFormData.name.trim(),
            length,
            width,
            height,
            ...areas
          }
        : room
    ));

    setEditDialogOpen(false);
    setEditingRoom(null);
    toast.success('Room updated');

    // Immediate save for instant sync
    updateRoomInDatabase(editingRoom.id, {
      name: editFormData.name.trim(),
      length,
      width,
      height,
      floor_area: areas.floorArea,
      wall_area: areas.wallArea,
      ceiling_area: areas.ceilingArea,
      adjusted_wall_area: areas.adjustedWallArea,
      total_opening_area: areas.totalOpeningArea,
      total_extra_surface: areas.totalExtraSurface,
      total_door_window_grill_area: areas.totalDoorWindowGrillArea
    });
  };

  if (!projectData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading project data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="eca-gradient text-white p-4">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => navigate("/add-project")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Room Measurements</h1>
            <p className="text-white/80 text-sm">Measure all rooms for {projectData.projectTypes.join(", ")}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sqft">Sq.ft Calculator</TabsTrigger>
            <TabsTrigger value="doorwindow">Add Door & Window</TabsTrigger>
          </TabsList>

          <TabsContent value="sqft" className="space-y-6">
            {/* Project Type Selection */}
            {projectData && (
              <Card className="eca-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Home className="mr-2 h-5 w-5 text-primary" />
                    Select Project Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {projectData.projectTypes.map((type) => (
                      <Button
                        key={type}
                        variant={activeProjectType === type ? "default" : "outline"}
                        onClick={() => { setActiveProjectType(type); try { localStorage.setItem(`selected_paint_type_${projectId}`, type); } catch {} }}
                        className="text-sm"
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add New Room */}
            {activeProjectType && (
              <Card className="eca-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center">
                      <Ruler className="mr-2 h-5 w-5 text-primary" />
                      Add Room
                    </div>
                    <div className="flex flex-col items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => handleOpenCustomSectionDialog()}
                        title="Create a separate area for different paint configuration inside this room"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <span className="text-[9px] text-muted-foreground text-center max-w-[80px] leading-tight">
                        Separate Section
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Room Name</Label>
                    <Input
                      placeholder="Name of the Area"
                      value={newRoom.name}
                      onChange={(e) => setNewRoom(prev => ({ ...prev, name: e.target.value }))}
                      className="h-12"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label className="text-base font-medium">Length (ft)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newRoom.length}
                        onChange={(e) => setNewRoom(prev => ({ ...prev, length: e.target.value }))}
                        className="h-12"
                        step="0.1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base font-medium">Width (ft)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newRoom.width}
                        onChange={(e) => setNewRoom(prev => ({ ...prev, width: e.target.value }))}
                        className="h-12"
                        step="0.1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base font-medium">Height (ft)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newRoom.height}
                        onChange={(e) => setNewRoom(prev => ({ ...prev, height: e.target.value }))}
                        className="h-12"
                        step="0.1"
                      />
                    </div>
                  </div>

                  {/* Picture Upload */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      Upload Room Pictures ({newRoom.pictures.length}/5)
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-12"
                        disabled={newRoom.pictures.length >= 5}
                      >
                        <Image className="mr-2 h-4 w-4" />
                        Choose File
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => cameraInputRef.current?.click()}
                        className="h-12"
                        disabled={newRoom.pictures.length >= 5}
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Take Photo
                      </Button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handlePictureUpload(e.target.files, false)}
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handlePictureUpload(e.target.files, true)}
                    />
                    
                    {newRoom.pictures.length > 0 && (
                      <div className="grid grid-cols-5 gap-2 mt-2">
                        {newRoom.pictures.map((pic, index) => (
                          <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                            <img src={pic} alt={`Room ${index + 1}`} className="w-full h-full object-cover" />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6"
                              onClick={() => removePicture(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {!showOpenAreaSection ? (
                    <Button 
                      onClick={handleAddRoomClick}
                      disabled={!newRoom.name || !newRoom.length || !newRoom.width || newRoom.pictures.length < 2}
                      className="w-full h-12"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Room
                    </Button>
                  ) : (
                    <>
                      {/* Opening Areas Section */}
                      <div className="space-y-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <h4 className="font-semibold text-red-700 dark:text-red-400">Opening Areas (Doors/Windows to deduct)</h4>
                        
                        {tempOpeningAreas.map((opening) => (
                          <div key={opening.id} className="flex items-center justify-between p-2 bg-background rounded">
                            <span className="text-sm">{opening.height} × {opening.width} × {opening.quantity} = {opening.area.toFixed(1)} sq.ft</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeTempOpeningArea(opening.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}

                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            placeholder="Height"
                            value={newOpeningArea.height}
                            onChange={(e) => setNewOpeningArea(prev => ({ ...prev, height: e.target.value }))}
                            className="h-10"
                            step="0.1"
                          />
                          <Input
                            type="number"
                            placeholder="Width"
                            value={newOpeningArea.width}
                            onChange={(e) => setNewOpeningArea(prev => ({ ...prev, width: e.target.value }))}
                            className="h-10"
                            step="0.1"
                          />
                          <Input
                            type="number"
                            placeholder="Qty"
                            value={newOpeningArea.quantity}
                            onChange={(e) => setNewOpeningArea(prev => ({ ...prev, quantity: e.target.value }))}
                            className="h-10"
                            step="1"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addTempOpeningArea}
                          disabled={!newOpeningArea.height || !newOpeningArea.width}
                          className="w-full"
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Add Opening Area
                        </Button>
                      </div>

                      {/* Extra Surfaces Section */}
                      <div className="space-y-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <h4 className="font-semibold text-green-700 dark:text-green-400">Extra Surfaces (Additional areas to add)</h4>
                        
                        {tempExtraSurfaces.map((extra) => (
                          <div key={extra.id} className="flex items-center justify-between p-2 bg-background rounded">
                            <span className="text-sm">{extra.height} × {extra.width} × {extra.quantity} = {extra.area.toFixed(1)} sq.ft</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeTempExtraSurface(extra.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}

                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            placeholder="Height"
                            value={newExtraSurface.height}
                            onChange={(e) => setNewExtraSurface(prev => ({ ...prev, height: e.target.value }))}
                            className="h-10"
                            step="0.1"
                          />
                          <Input
                            type="number"
                            placeholder="Width"
                            value={newExtraSurface.width}
                            onChange={(e) => setNewExtraSurface(prev => ({ ...prev, width: e.target.value }))}
                            className="h-10"
                            step="0.1"
                          />
                          <Input
                            type="number"
                            placeholder="Qty"
                            value={newExtraSurface.quantity}
                            onChange={(e) => setNewExtraSurface(prev => ({ ...prev, quantity: e.target.value }))}
                            className="h-10"
                            step="1"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addTempExtraSurface}
                          disabled={!newExtraSurface.height || !newExtraSurface.width}
                          className="w-full"
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Add Extra Surface
                        </Button>
                      </div>

                      {/* Custom Paint Sections - shown as separate boxes */}
                      {tempCustomSections.length > 0 && (
                        <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                          <h4 className="font-semibold text-sm text-primary">Separate Paint Sections (will appear with Floor/Wall/Ceiling)</h4>
                          <div className="grid grid-cols-3 gap-3">
                            {tempCustomSections.map((section) => (
                              <div
                                key={section.id}
                                className="p-3 rounded-lg border-2 border-primary bg-primary/10 relative group"
                              >
                                <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={() => handleOpenCustomSectionDialog(section.id)}
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 text-destructive hover:text-destructive"
                                    onClick={() => handleRemoveCustomSection(section.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs font-medium text-foreground mb-1 truncate pr-8">{section.name}</p>
                                  <p className="text-lg font-bold text-foreground">—</p>
                                  <p className="text-xs text-muted-foreground">sq.ft (enter in Paint Estimation)</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button 
                        onClick={addRoom}
                        className="w-full h-12"
                      >
                        Save Room
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Show Rooms for Active Project Type - Filter out rooms that only have door/window data */}
            {activeProjectType && getRoomsByProjectType(activeProjectType).filter(room => room.length > 0 || room.width > 0 || room.height > 0).length > 0 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{activeProjectType} - Rooms</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Total: {getRoomsByProjectType(activeProjectType).filter(room => room.length > 0 || room.width > 0 || room.height > 0).length} room(s)
                  </p>
                </div>
                <div className="space-y-4">
                  {getRoomsByProjectType(activeProjectType).filter(room => room.length > 0 || room.width > 0 || room.height > 0 || room.sectionName).map((room) => (
                    <div key={room.id} className="space-y-0">
                      {/* Section Header - shown if sectionName exists */}
                      {room.sectionName && (
                        <div className="w-full px-3 py-1.5 bg-primary/10 rounded-t-lg border border-b-0 border-primary/20">
                          <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                            SECTION: {room.sectionName}
                          </span>
                        </div>
                      )}
                      <Card className={`eca-shadow overflow-hidden ${room.sectionName ? 'rounded-t-none' : ''}`}>
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          {/* Room Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Home className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg text-foreground">{room.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {room.length} × {room.width} × {room.height} ft
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="default"
                                size="sm"
                                className="h-9 hidden"
                                onClick={() => completeRoom(room.id)}
                              >
                                <Calculator className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-primary hover:text-primary hover:bg-primary/10"
                                onClick={() => {
                                  setAddSectionName(room.sectionName || "");
                                  setAddSectionRoomId(room.id);
                                  setAddSectionDialogOpen(true);
                                }}
                                title={room.sectionName ? "Edit section header" : "Add section header"}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => handleEditRoom(room)}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-destructive"
                                onClick={() => removeRoom(room.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Room Pictures */}
                          {room.pictures && room.pictures.length > 0 && (
                            <div className="grid grid-cols-5 gap-2">
                              {room.pictures.map((pic, index) => (
                                <div key={index} className="aspect-square rounded-lg overflow-hidden border border-border">
                                  <img src={pic} alt={`${room.name} ${index + 1}`} className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Opening Areas */}
                          <div className="space-y-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                            <h4 className="font-semibold text-sm text-red-700 dark:text-red-400">Opening Areas</h4>
                            {room.openingAreas.map((opening) => (
                              <div key={opening.id} className="flex items-center justify-between text-sm">
                                <span className="text-foreground">
                                  {opening.height} × {opening.width} × {opening.quantity} = {opening.area.toFixed(1)} sq.ft
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-red-700 dark:text-red-400"
                                  onClick={() => removeOpeningArea(room.id, opening.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            
                            {/* Add new opening area */}
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              <Input
                                type="number"
                                placeholder="Height"
                                value={roomOpeningInputs[room.id]?.height || ""}
                                onChange={(e) => setRoomOpeningInputs(prev => ({ 
                                  ...prev, 
                                  [room.id]: { ...(prev[room.id] || { height: "", width: "", quantity: "" }), height: e.target.value } 
                                }))}
                                className="h-9"
                                step="0.1"
                              />
                              <Input
                                type="number"
                                placeholder="Width"
                                value={roomOpeningInputs[room.id]?.width || ""}
                                onChange={(e) => setRoomOpeningInputs(prev => ({ 
                                  ...prev, 
                                  [room.id]: { ...(prev[room.id] || { height: "", width: "", quantity: "" }), width: e.target.value } 
                                }))}
                                className="h-9"
                                step="0.1"
                              />
                              <Input
                                type="number"
                                placeholder="Qty"
                                value={roomOpeningInputs[room.id]?.quantity || ""}
                                onChange={(e) => setRoomOpeningInputs(prev => ({ 
                                  ...prev, 
                                  [room.id]: { ...(prev[room.id] || { height: "", width: "", quantity: "" }), quantity: e.target.value } 
                                }))}
                                className="h-9"
                                step="1"
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addOpeningAreaToRoom(room.id)}
                              disabled={!roomOpeningInputs[room.id]?.height || !roomOpeningInputs[room.id]?.width}
                              className="w-full"
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Add Opening
                            </Button>
                          </div>

                          {/* Extra Surfaces */}
                          <div className="space-y-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <h4 className="font-semibold text-sm text-green-700 dark:text-green-400">Extra Surfaces</h4>
                            {room.extraSurfaces.map((extra) => (
                              <div key={extra.id} className="flex items-center justify-between text-sm">
                                <span className="text-foreground">
                                  {extra.height} × {extra.width} × {extra.quantity} = {extra.area.toFixed(1)} sq.ft
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-green-700 dark:text-green-400"
                                  onClick={() => removeExtraSurface(room.id, extra.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            
                            {/* Add new extra surface */}
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              <Input
                                type="number"
                                placeholder="Height"
                                value={roomExtraSurfaceInputs[room.id]?.height || ""}
                                onChange={(e) => setRoomExtraSurfaceInputs(prev => ({ 
                                  ...prev, 
                                  [room.id]: { ...(prev[room.id] || { height: "", width: "", quantity: "" }), height: e.target.value } 
                                }))}
                                className="h-9"
                                step="0.1"
                              />
                              <Input
                                type="number"
                                placeholder="Width"
                                value={roomExtraSurfaceInputs[room.id]?.width || ""}
                                onChange={(e) => setRoomExtraSurfaceInputs(prev => ({ 
                                  ...prev, 
                                  [room.id]: { ...(prev[room.id] || { height: "", width: "", quantity: "" }), width: e.target.value } 
                                }))}
                                className="h-9"
                                step="0.1"
                              />
                              <Input
                                type="number"
                                placeholder="Qty"
                                value={roomExtraSurfaceInputs[room.id]?.quantity || ""}
                                onChange={(e) => setRoomExtraSurfaceInputs(prev => ({ 
                                  ...prev, 
                                  [room.id]: { ...(prev[room.id] || { height: "", width: "", quantity: "" }), quantity: e.target.value } 
                                }))}
                                className="h-9"
                                step="1"
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addExtraSurfaceToRoom(room.id)}
                              disabled={!roomExtraSurfaceInputs[room.id]?.height || !roomExtraSurfaceInputs[room.id]?.width}
                              className="w-full"
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Add Extra Surface
                            </Button>
                          </div>

                          {/* Area Selection */}
                          <div className="grid grid-cols-3 gap-3">
                            {/* Floor Area */}
                            <div 
                              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                room.selectedAreas.floor 
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/20'
                              }`}
                              onClick={() => toggleAreaSelection(room.id, 'floor')}
                            >
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground mb-1">Floor Area</p>
                                <p className="text-lg font-bold text-foreground">{room.floorArea.toFixed(1)}</p>
                                <p className="text-xs text-muted-foreground">sq.ft</p>
                              </div>
                            </div>

                            {/* Wall Area */}
                            <div 
                              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                room.selectedAreas.wall 
                                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/20'
                              }`}
                              onClick={() => toggleAreaSelection(room.id, 'wall')}
                            >
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground mb-1">Wall Area</p>
                                <p className="text-lg font-bold text-foreground">{room.adjustedWallArea.toFixed(1)}</p>
                                <p className="text-xs text-muted-foreground">sq.ft</p>
                              </div>
                            </div>

                            {/* Ceiling Area */}
                            <div 
                              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                room.selectedAreas.ceiling 
                                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/20'
                              }`}
                              onClick={() => toggleAreaSelection(room.id, 'ceiling')}
                            >
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground mb-1">Ceiling Area</p>
                                <p className="text-lg font-bold text-foreground">{room.ceilingArea.toFixed(1)}</p>
                                <p className="text-xs text-muted-foreground">sq.ft</p>
                              </div>
                            </div>
                          </div>

                          {/* Sub-Areas - Independent Paintable Sections */}
                          {room.subAreas && room.subAreas.length > 0 && (
                            <div className="space-y-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-primary">Sub-Areas</h4>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                {room.subAreas.map((subArea) => (
                                  <div
                                    key={subArea.id}
                                    className="p-3 rounded-lg border-2 border-primary bg-primary/10 relative group cursor-pointer transition-all"
                                  >
                                    <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5"
                                        onClick={(e) => { e.stopPropagation(); handleEditSubArea(room.id, subArea); }}
                                      >
                                        <Edit3 className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 text-destructive hover:text-destructive"
                                        onClick={(e) => { e.stopPropagation(); handleRemoveSubArea(room.id, subArea.id); }}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs text-muted-foreground mb-1 truncate">{subArea.name}</p>
                                      <p className="text-lg font-bold text-foreground">{subArea.area.toFixed(1)}</p>
                                      <p className="text-xs text-muted-foreground">sq.ft</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Total Area Summary */}
                          <div className="bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 rounded-lg p-4 text-white">
                            <div className="flex items-center mb-3">
                              <Calculator className="mr-2 h-5 w-5" />
                              <h4 className="font-semibold">Total Area Summary</h4>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center">
                                <p className="text-sm text-white/80">Total Floor</p>
                                <p className="text-xl font-bold">{room.selectedAreas.floor ? room.floorArea.toFixed(1) : '0.0'}</p>
                                <p className="text-xs text-white/80">sq.ft</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-white/80">Total Wall</p>
                                <p className="text-xl font-bold">{room.selectedAreas.wall ? room.adjustedWallArea.toFixed(1) : '0.0'}</p>
                                <p className="text-xs text-white/80">sq.ft</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-white/80">Total Ceiling</p>
                                <p className="text-xl font-bold">{room.selectedAreas.ceiling ? room.ceilingArea.toFixed(1) : '0.0'}</p>
                                <p className="text-xs text-white/80">sq.ft</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="doorwindow" className="space-y-6">
            {/* Project Type Selection for Door & Window */}
            {projectData && projectData.projectTypes.length > 0 && (
              <Card className="eca-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Home className="mr-2 h-5 w-5 text-primary" />
                    Select Project Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {projectData.projectTypes.map((type) => (
                      <Button
                        key={type}
                        variant={activeProjectType === type ? "default" : "outline"}
                        onClick={() => setActiveProjectType(type)}
                        className="h-12 px-6"
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="eca-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center text-lg">
                      <Plus className="mr-2 h-5 w-5 text-amber-600" />
                      Add Door & Window Measurements
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Only add if customer requests enamel/oil paint work
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => {
                      setDoorWindowProjectType(activeProjectType);
                      setDoorWindowDialogOpen(true);
                    }}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {getRoomsByProjectType(activeProjectType).length > 0 && (
                  <div className="space-y-4">
                    {getRoomsByProjectType(activeProjectType).map((room) => (
                      <div key={`dwg-${room.id}`} className="space-y-0">
                        {/* Section Header - shown if sectionName exists */}
                        {room.sectionName && (
                          <div className="w-full px-3 py-1.5 bg-primary/10 rounded-t-lg border border-b-0 border-primary/20">
                            <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                              SECTION: {room.sectionName}
                            </span>
                          </div>
                        )}
                        <Card className={`border-amber-200 dark:border-amber-800 ${room.sectionName ? 'rounded-t-none' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-foreground">{room.name}</h3>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                              onClick={() => removeRoom(room.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {room.doorWindowGrills.map((dwg) => (
                            <div key={dwg.id} className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <Input
                                    value={dwg.name}
                                    onChange={(e) => updateDoorWindowGrillName(room.id, dwg.id, e.target.value)}
                                    className="font-medium bg-transparent border-none h-8 p-0"
                                  />
                                  <Edit3 className="h-3 w-3 text-muted-foreground" />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-amber-700 dark:text-amber-400"
                                  onClick={() => removeDoorWindowGrill(room.id, dwg.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="text-sm text-amber-700 dark:text-amber-400">
                                {dwg.height}' × {dwg.width}' × {dwg.sides} sides × {dwg.grillMultiplier} = {dwg.area.toFixed(1)} sq.ft
                              </p>
                            </div>
                          ))}

                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <Input
                              placeholder="e.g., Main Door, Window 1"
                              value={newDoorWindowGrill[room.id]?.name || ""}
                              onChange={(e) => setNewDoorWindowGrill(prev => ({ 
                                ...prev, 
                                [room.id]: { ...(prev[room.id] || { name: "", height: "", width: "", sides: "", grillMultiplier: "1" }), name: e.target.value }
                              }))}
                              className="h-10"
                            />
                            <Input
                              type="number"
                              placeholder="Sides"
                              value={newDoorWindowGrill[room.id]?.sides || ""}
                              onChange={(e) => setNewDoorWindowGrill(prev => ({ 
                                ...prev, 
                                [room.id]: { ...(prev[room.id] || { name: "", height: "", width: "", sides: "", grillMultiplier: "1" }), sides: e.target.value }
                              }))}
                              className="h-10"
                              step="1"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-3 mb-3">
                            <Input
                              type="number"
                              placeholder="Height"
                              value={newDoorWindowGrill[room.id]?.height || ""}
                              onChange={(e) => setNewDoorWindowGrill(prev => ({ 
                                ...prev, 
                                [room.id]: { ...(prev[room.id] || { name: "", height: "", width: "", sides: "", grillMultiplier: "1" }), height: e.target.value }
                              }))}
                              className="h-10"
                              step="0.1"
                            />
                            <Input
                              type="number"
                              placeholder="Width"
                              value={newDoorWindowGrill[room.id]?.width || ""}
                              onChange={(e) => setNewDoorWindowGrill(prev => ({ 
                                ...prev, 
                                [room.id]: { ...(prev[room.id] || { name: "", height: "", width: "", sides: "", grillMultiplier: "1" }), width: e.target.value }
                              }))}
                              className="h-10"
                              step="0.1"
                            />
                            <Input
                              type="number"
                              placeholder="Grill Multiplier"
                              value={newDoorWindowGrill[room.id]?.grillMultiplier || ""}
                              onChange={(e) => setNewDoorWindowGrill(prev => ({ 
                                ...prev, 
                                [room.id]: { ...(prev[room.id] || { name: "", height: "", width: "", sides: "", grillMultiplier: "1" }), grillMultiplier: e.target.value }
                              }))}
                              className="h-10"
                              step="0.1"
                            />
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => addDoorWindowGrillToRoom(room.id)}
                            disabled={!newDoorWindowGrill[room.id]?.height || !newDoorWindowGrill[room.id]?.width || !newDoorWindowGrill[room.id]?.sides}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Add to {room.name}
                          </Button>
                        </CardContent>
                      </Card>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Continue Button */}
        {rooms.length > 0 && (
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t p-4 -mx-4">
            <Button onClick={handleContinue} disabled={isSyncing} className="w-full h-12">
              {isSyncing ? 'Syncing data...' : 'Continue to Paint Estimation'}
              <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
            </Button>
          </div>
        )}
      </div>

      {/* Edit Room Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Room Measurements</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Room Name</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Living Room, Bedroom"
                value={editFormData.name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                className="h-12"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-length">Length (ft)</Label>
                <Input
                  id="edit-length"
                  type="number"
                  placeholder="0"
                  value={editFormData.length}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, length: e.target.value }))}
                  className="h-12"
                  step="0.1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-width">Width (ft)</Label>
                <Input
                  id="edit-width"
                  type="number"
                  placeholder="0"
                  value={editFormData.width}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, width: e.target.value }))}
                  className="h-12"
                  step="0.1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-height">Height (ft)</Label>
                <Input
                  id="edit-height"
                  type="number"
                  placeholder="0"
                  value={editFormData.height}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, height: e.target.value }))}
                  className="h-12"
                  step="0.1"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setEditDialogOpen(false);
                  setEditingRoom(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleUpdateRoom}
                disabled={!editFormData.name || !editFormData.length || !editFormData.width}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Door/Window Dialog */}
      <Dialog open={doorWindowDialogOpen} onOpenChange={setDoorWindowDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Door & Window</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Project Type Selection */}
            {projectData && projectData.projectTypes.length > 1 && (
              <div className="space-y-2">
                <Label>Project Type</Label>
                <div className="flex flex-wrap gap-2">
                  {projectData.projectTypes.map((type) => (
                    <Button
                      key={type}
                      variant={doorWindowProjectType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDoorWindowProjectType(type)}
                      className="h-10"
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Room Name Input */}
            <div className="space-y-2">
              <Label htmlFor="room-name">Room Name</Label>
              <Input
                id="room-name"
                placeholder="e.g., outside, living room"
                value={doorWindowRoomName}
                onChange={(e) => setDoorWindowRoomName(e.target.value)}
                className="h-12"
              />
            </div>

            {/* Section Name Input (Optional) - Creates separate box in Paint Estimation */}
            <div className="space-y-2">
              <Label htmlFor="dw-section-name">Section Name (Optional)</Label>
              <Input
                id="dw-section-name"
                placeholder="e.g., Damp Wall, Front Door Section"
                value={doorWindowSectionName}
                onChange={(e) => setDoorWindowSectionName(e.target.value)}
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">
                Add a section name to create a separate box in Paint Estimation
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="e.g., Main Door, Window 1"
                value={dialogDoorWindowGrill.name}
                onChange={(e) => setDialogDoorWindowGrill(prev => ({ ...prev, name: e.target.value }))}
                className="h-12"
              />
              <Input
                type="number"
                placeholder="Sides"
                value={dialogDoorWindowGrill.sides}
                onChange={(e) => setDialogDoorWindowGrill(prev => ({ ...prev, sides: e.target.value }))}
                className="h-12"
                step="1"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                type="number"
                placeholder="Height"
                value={dialogDoorWindowGrill.height}
                onChange={(e) => setDialogDoorWindowGrill(prev => ({ ...prev, height: e.target.value }))}
                className="h-12"
                step="0.1"
              />
              <Input
                type="number"
                placeholder="Width"
                value={dialogDoorWindowGrill.width}
                onChange={(e) => setDialogDoorWindowGrill(prev => ({ ...prev, width: e.target.value }))}
                className="h-12"
                step="0.1"
              />
              <Input
                type="number"
                placeholder="Grill Multiplier"
                value={dialogDoorWindowGrill.grillMultiplier}
                onChange={(e) => setDialogDoorWindowGrill(prev => ({ ...prev, grillMultiplier: e.target.value }))}
                className="h-12"
                step="0.1"
              />
            </div>

            <Button
              className="w-full h-12"
              onClick={handleAddDoorWindowFromDialog}
              disabled={!doorWindowRoomName.trim() || !doorWindowProjectType || !dialogDoorWindowGrill.height || !dialogDoorWindowGrill.width || !dialogDoorWindowGrill.sides}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add to {doorWindowRoomName || "Room"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-Area Dialog */}
      <SubAreaDialog
        open={subAreaDialogOpen}
        onClose={() => {
          setSubAreaDialogOpen(false);
          setSubAreaRoomId(null);
          setEditingSubArea(null);
        }}
        onSave={handleSaveSubArea}
        editingSubArea={editingSubArea}
      />

      {/* Custom Section Dialog (name-only) */}
      <Dialog open={customSectionDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setCustomSectionDialogOpen(false);
          setCustomSectionName("");
          setEditingCustomSectionId(null);
        }
      }}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>{editingCustomSectionId ? "Edit Section Name" : "Add Separate Paint Section"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              This creates a separate paint area box (like Floor, Wall, Ceiling) with its own paint configuration. You'll enter sq.ft in Paint Estimation tab.
            </p>
            <div className="space-y-2">
              <Label htmlFor="custom-section-name">Section Name</Label>
              <Input
                id="custom-section-name"
                placeholder="e.g., Damp Wall, Texture Wall, Accent Wall"
                value={customSectionName}
                onChange={(e) => setCustomSectionName(e.target.value)}
                className="h-12"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setCustomSectionDialogOpen(false);
              setCustomSectionName("");
              setEditingCustomSectionId(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveCustomSection} disabled={!customSectionName.trim()}>
              {editingCustomSectionId ? "Update" : "Add Section"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Section Dialog */}
      <Dialog open={addSectionDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setAddSectionDialogOpen(false);
          setAddSectionName("");
          setAddSectionRoomId(null);
        }
      }}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>Add Section Header</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Add a section header to this room (e.g., "Damp Wall Only Putty", "Ground Floor Royale"). The header will appear above the room card.
            </p>
            <div className="space-y-2">
              <Label htmlFor="section-name">Section Name</Label>
              <Input
                id="section-name"
                placeholder="e.g., Damp Wall Only Putty, Ground Floor Royale"
                value={addSectionName}
                onChange={(e) => setAddSectionName(e.target.value)}
                className="h-12"
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setAddSectionDialogOpen(false);
              setAddSectionName("");
              setAddSectionRoomId(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddSection} disabled={!addSectionName.trim()}>
              {addSectionRoomId && rooms.find(r => r.id === addSectionRoomId)?.sectionName ? 'Update Section' : 'Add Section'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Separate Paint Section Dialog */}
      <Dialog open={separateSectionDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setSeparateSectionDialogOpen(false);
          setSeparateSectionName("");
          setSeparateSectionRoomId(null);
        }
      }}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>Add Separate Paint Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              This creates a separate paint area box in Paint Estimation (like Floor, Wall, Ceiling). 
              You'll enter sq.ft and configure paint system there.
            </p>
            <div className="space-y-2">
              <Label htmlFor="separate-section-name">Section Name</Label>
              <Input
                id="separate-section-name"
                placeholder="e.g., Damp Wall, Texture Section, First Floor Wall"
                value={separateSectionName}
                onChange={(e) => setSeparateSectionName(e.target.value)}
                className="h-12"
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setSeparateSectionDialogOpen(false);
              setSeparateSectionName("");
              setSeparateSectionRoomId(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddSeparateSection} disabled={!separateSectionName.trim()}>
              Add Section
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}