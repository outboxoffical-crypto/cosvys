import { useState, useEffect, useRef } from "react";
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
  length: number;
  width: number;
  height: number;
  projectType: string;
  pictures: string[];
  openingAreas: OpeningArea[];
  extraSurfaces: ExtraSurface[];
  doorWindowGrills: DoorWindowGrill[];
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
  const [newOpeningArea, setNewOpeningArea] = useState({ height: "", width: "", quantity: "1" });
  const [newExtraSurface, setNewExtraSurface] = useState({ height: "", width: "", quantity: "1" });
  const [tempOpeningAreas, setTempOpeningAreas] = useState<OpeningArea[]>([]);
  const [tempExtraSurfaces, setTempExtraSurfaces] = useState<ExtraSurface[]>([]);
  const [newDoorWindowGrill, setNewDoorWindowGrill] = useState({
    name: "Door/Window",
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

  useEffect(() => {
    const loadData = async () => {
      // Load project data to get project types
      const savedProjectData = localStorage.getItem(`project_${projectId}`);
      if (savedProjectData) {
        const data = JSON.parse(savedProjectData);
        setProjectData(data);
        setActiveProjectType(data.projectTypes[0] || "");
      }
      
      // Load existing rooms from Supabase
      try {
        const { data: roomsData, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('project_id', projectId);
        
        if (error) {
          console.error('Error loading rooms:', error);
          toast.error('Failed to load rooms');
          return;
        }
        
        if (roomsData && roomsData.length > 0) {
          const formattedRooms: Room[] = roomsData.map(room => ({
            id: room.room_id,
            name: room.name,
            length: Number(room.length),
            width: Number(room.width),
            height: Number(room.height),
            projectType: room.project_type,
            pictures: Array.isArray(room.pictures) ? room.pictures as string[] : [],
            openingAreas: Array.isArray(room.opening_areas) ? room.opening_areas as unknown as OpeningArea[] : [],
            extraSurfaces: Array.isArray(room.extra_surfaces) ? room.extra_surfaces as unknown as ExtraSurface[] : [],
            doorWindowGrills: Array.isArray(room.door_window_grills) ? room.door_window_grills as unknown as DoorWindowGrill[] : [],
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
        toast.error('Failed to load rooms');
      }
    };
    
    loadData();
  }, [projectId]);

  const calculateAreas = (
    length: number, 
    width: number, 
    height: number, 
    openingAreas: OpeningArea[], 
    extraSurfaces: ExtraSurface[],
    doorWindowGrills: DoorWindowGrill[]
  ) => {
    const floorArea = length * width;
    const wallArea = 2 * (length + width) * height;
    const ceilingArea = length * width;
    
    const totalOpeningArea = openingAreas.reduce((sum, opening) => sum + opening.area, 0);
    const totalExtraSurface = extraSurfaces.reduce((sum, extra) => sum + extra.area, 0);
    const totalDoorWindowGrillArea = doorWindowGrills.reduce((sum, dwg) => sum + dwg.area, 0);
    
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
  };

  const addTempOpeningArea = () => {
    if (newOpeningArea.height && newOpeningArea.width) {
      const height = parseFloat(newOpeningArea.height);
      const width = parseFloat(newOpeningArea.width);
      const quantity = parseFloat(newOpeningArea.quantity) || 1;
      const area = height * width * quantity;
      
      const openingArea = {
        id: Date.now().toString(),
        height,
        width,
        quantity,
        area
      };
      
      setTempOpeningAreas(prev => [...prev, openingArea]);
      setNewOpeningArea({ height: "", width: "", quantity: "1" });
    }
  };

  const addTempExtraSurface = () => {
    if (newExtraSurface.height && newExtraSurface.width) {
      const height = parseFloat(newExtraSurface.height);
      const width = parseFloat(newExtraSurface.width);
      const quantity = parseFloat(newExtraSurface.quantity) || 1;
      const area = height * width * quantity;
      
      const extraSurface = {
        id: Date.now().toString(),
        height,
        width,
        quantity,
        area
      };
      
      setTempExtraSurfaces(prev => [...prev, extraSurface]);
      setNewExtraSurface({ height: "", width: "", quantity: "1" });
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
      const height = parseFloat(newOpeningArea.height);
      const width = parseFloat(newOpeningArea.width);
      const quantity = parseFloat(newOpeningArea.quantity) || 1;
      const area = height * width * quantity;
      
      return {
        id: Date.now().toString(),
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
      const height = parseFloat(newExtraSurface.height);
      const width = parseFloat(newExtraSurface.width);
      const quantity = parseFloat(newExtraSurface.quantity) || 1;
      const area = height * width * quantity;
      
      return {
        id: Date.now().toString(),
        height,
        width,
        quantity,
        area
      };
    }
    return null;
  };

  const addDoorWindowGrill = () => {
    if (newDoorWindowGrill.height && newDoorWindowGrill.width && newDoorWindowGrill.sides) {
      const height = parseFloat(newDoorWindowGrill.height);
      const width = parseFloat(newDoorWindowGrill.width);
      const sides = parseFloat(newDoorWindowGrill.sides);
      const grillMultiplier = parseFloat(newDoorWindowGrill.grillMultiplier) || 1;
      const area = height * width * sides * grillMultiplier;
      
      return {
        id: Date.now().toString(),
        name: newDoorWindowGrill.name,
        height,
        width,
        sides,
        grillMultiplier,
        area
      };
    }
    return null;
  };

  const handlePictureUpload = (files: FileList | null, isCamera: boolean = false) => {
    if (!files) return;
    
    const currentPictureCount = newRoom.pictures.length;
    const maxPictures = 5;
    
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
  };

  const removePicture = (index: number) => {
    setNewRoom(prev => ({
      ...prev,
      pictures: prev.pictures.filter((_, i) => i !== index)
    }));
  };

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

      const length = parseFloat(newRoom.length);
      const width = parseFloat(newRoom.width);
      const height = newRoom.height ? parseFloat(newRoom.height) : 0;
      
      // When height is 0 or not provided, use L*W for all three areas
      const baseArea = length * width;
      
      const roomId = Date.now().toString();
      const room: Room = {
        id: roomId,
        name: newRoom.name.trim(),
        length,
        width,
        height,
        projectType: activeProjectType,
        pictures: newRoom.pictures,
        openingAreas: [...tempOpeningAreas],
        extraSurfaces: [...tempExtraSurfaces],
        doorWindowGrills: [],
        floorArea: baseArea,
        wallArea: height > 0 ? 2 * (length + width) * height : baseArea,
        ceilingArea: baseArea,
        adjustedWallArea: height > 0 ? 2 * (length + width) * height : baseArea,
        totalOpeningArea: 0,
        totalExtraSurface: 0,
        totalDoorWindowGrillArea: 0,
        selectedAreas: {
          floor: true,
          wall: true,
          ceiling: false
        }
      };

      // Calculate areas with the temporary measurements
      if (height > 0) {
        const areas = calculateAreas(length, width, height, tempOpeningAreas, tempExtraSurfaces, []);
        room.floorArea = areas.floorArea;
        room.wallArea = areas.wallArea;
        room.ceilingArea = areas.ceilingArea;
        room.adjustedWallArea = areas.adjustedWallArea;
        room.totalOpeningArea = areas.totalOpeningArea;
        room.totalExtraSurface = areas.totalExtraSurface;
        room.totalDoorWindowGrillArea = areas.totalDoorWindowGrillArea;
      } else {
        // When height is not provided, opening areas reduce from base area
        const totalOpeningArea = tempOpeningAreas.reduce((sum, opening) => sum + opening.area, 0);
        const totalExtraSurface = tempExtraSurfaces.reduce((sum, extra) => sum + extra.area, 0);
        room.totalOpeningArea = totalOpeningArea;
        room.totalExtraSurface = totalExtraSurface;
        room.adjustedWallArea = baseArea - totalOpeningArea + totalExtraSurface;
      }
      
      // Save to Supabase with user_id
      try {
        const { error } = await supabase
          .from('rooms')
          .insert({
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
            door_window_grills: room.doorWindowGrills as any,
            floor_area: room.floorArea,
            wall_area: room.wallArea,
            ceiling_area: room.ceilingArea,
            adjusted_wall_area: room.adjustedWallArea,
            total_opening_area: room.totalOpeningArea,
            total_extra_surface: room.totalExtraSurface,
            total_door_window_grill_area: room.totalDoorWindowGrillArea,
            selected_areas: room.selectedAreas as any
          });
        
        if (error) {
          console.error('Error saving room:', error);
          toast.error('Failed to save room');
          return;
        }
        
        setRooms(prev => [...prev, room]);
        setNewRoom({ name: "", length: "", width: "", height: "", pictures: [] });
        setShowOpenAreaSection(false);
        setTempOpeningAreas([]);
        setTempExtraSurfaces([]);
        toast.success('Room added successfully');
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to save room');
      }
    }
  };

  const removeRoom = async (roomId: string) => {
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
      
      const updatedRooms = rooms.filter(room => room.id !== roomId);
      setRooms(updatedRooms);
      toast.success('Room deleted');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete room');
    }
  };

  const addOpeningAreaToRoom = async (roomId: string) => {
    const openingArea = addOpeningArea();
    if (openingArea) {
      const updatedRooms = rooms.map(room => {
        if (room.id === roomId) {
          const updatedOpeningAreas = [...room.openingAreas, openingArea];
          const areas = calculateAreas(room.length, room.width, room.height, updatedOpeningAreas, room.extraSurfaces, room.doorWindowGrills);
          return { ...room, openingAreas: updatedOpeningAreas, ...areas };
        }
        return room;
      });
      
      const updatedRoom = updatedRooms.find(r => r.id === roomId);
      if (updatedRoom) {
        try {
          await supabase.from('rooms').update({
            opening_areas: updatedRoom.openingAreas as any,
            total_opening_area: updatedRoom.totalOpeningArea,
            adjusted_wall_area: updatedRoom.adjustedWallArea
          }).eq('room_id', roomId).eq('project_id', projectId!);
          setRooms(updatedRooms);
          setNewOpeningArea({ height: "", width: "", quantity: "1" });
        } catch (error) {
          console.error('Error:', error);
        }
      }
    }
  };

  const addExtraSurfaceToRoom = async (roomId: string) => {
    const extraSurface = addExtraSurface();
    if (extraSurface) {
      const updatedRooms = rooms.map(room => {
        if (room.id === roomId) {
          const updatedExtraSurfaces = [...room.extraSurfaces, extraSurface];
          const areas = calculateAreas(room.length, room.width, room.height, room.openingAreas, updatedExtraSurfaces, room.doorWindowGrills);
          return { ...room, extraSurfaces: updatedExtraSurfaces, ...areas };
        }
        return room;
      });
      
      const updatedRoom = updatedRooms.find(r => r.id === roomId);
      if (updatedRoom) {
        try {
          await supabase.from('rooms').update({
            extra_surfaces: updatedRoom.extraSurfaces as any,
            total_extra_surface: updatedRoom.totalExtraSurface,
            adjusted_wall_area: updatedRoom.adjustedWallArea
          }).eq('room_id', roomId).eq('project_id', projectId!);
          setRooms(updatedRooms);
          setNewExtraSurface({ height: "", width: "", quantity: "1" });
        } catch (error) {
          console.error('Error:', error);
        }
      }
    }
  };

  const addDoorWindowGrillToRoom = async (roomId: string) => {
    const doorWindowGrill = addDoorWindowGrill();
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
          setNewDoorWindowGrill({
            name: "Door/Window",
            height: "",
            width: "",
            sides: "",
            grillMultiplier: "1"
          });
          toast.success('Door/Window added');
        } catch (error) {
          console.error('Error:', error);
          toast.error('Failed to update room');
        }
      }
    }
  };

  const removeOpeningArea = async (roomId: string, openingId: string) => {
    const updatedRooms = rooms.map(room => {
      if (room.id === roomId) {
        const updatedOpeningAreas = room.openingAreas.filter(o => o.id !== openingId);
        const areas = calculateAreas(room.length, room.width, room.height, updatedOpeningAreas, room.extraSurfaces, room.doorWindowGrills);
        return { ...room, openingAreas: updatedOpeningAreas, ...areas };
      }
      return room;
    });
    const updatedRoom = updatedRooms.find(r => r.id === roomId);
    if (updatedRoom) {
      await supabase.from('rooms').update({
        opening_areas: updatedRoom.openingAreas as any,
        total_opening_area: updatedRoom.totalOpeningArea,
        adjusted_wall_area: updatedRoom.adjustedWallArea
      }).eq('room_id', roomId).eq('project_id', projectId!);
    }
    setRooms(updatedRooms);
  };

  const removeExtraSurface = async (roomId: string, extraId: string) => {
    const updatedRooms = rooms.map(room => {
      if (room.id === roomId) {
        const updatedExtraSurfaces = room.extraSurfaces.filter(e => e.id !== extraId);
        const areas = calculateAreas(room.length, room.width, room.height, room.openingAreas, updatedExtraSurfaces, room.doorWindowGrills);
        return { ...room, extraSurfaces: updatedExtraSurfaces, ...areas };
      }
      return room;
    });
    const updatedRoom = updatedRooms.find(r => r.id === roomId);
    if (updatedRoom) {
      await supabase.from('rooms').update({
        extra_surfaces: updatedRoom.extraSurfaces as any,
        total_extra_surface: updatedRoom.totalExtraSurface,
        adjusted_wall_area: updatedRoom.adjustedWallArea
      }).eq('room_id', roomId).eq('project_id', projectId!);
    }
    setRooms(updatedRooms);
  };

  const removeDoorWindowGrill = async (roomId: string, dwgId: string) => {
    const updatedRooms = rooms.map(room => {
      if (room.id === roomId) {
        const updatedDoorWindowGrills = room.doorWindowGrills.filter(d => d.id !== dwgId);
        const areas = calculateAreas(room.length, room.width, room.height, room.openingAreas, room.extraSurfaces, updatedDoorWindowGrills);
        return { ...room, doorWindowGrills: updatedDoorWindowGrills, ...areas };
      }
      return room;
    });
    const updatedRoom = updatedRooms.find(r => r.id === roomId);
    if (updatedRoom) {
      await supabase.from('rooms').update({
        door_window_grills: updatedRoom.doorWindowGrills as any,
        total_door_window_grill_area: updatedRoom.totalDoorWindowGrillArea,
        adjusted_wall_area: updatedRoom.adjustedWallArea
      }).eq('room_id', roomId).eq('project_id', projectId!);
    }
    setRooms(updatedRooms);
  };

  const updateDoorWindowGrillName = async (roomId: string, dwgId: string, newName: string) => {
    const updatedRooms = rooms.map(room => {
      if (room.id === roomId) {
        const updatedDoorWindowGrills = room.doorWindowGrills.map(dwg => 
          dwg.id === dwgId ? { ...dwg, name: newName } : dwg
        );
        return { ...room, doorWindowGrills: updatedDoorWindowGrills };
      }
      return room;
    });
    const updatedRoom = updatedRooms.find(r => r.id === roomId);
    if (updatedRoom) {
      await supabase.from('rooms').update({
        door_window_grills: updatedRoom.doorWindowGrills as any
      }).eq('room_id', roomId).eq('project_id', projectId!);
    }
    setRooms(updatedRooms);
  };

  const getRoomsByProjectType = (projectType: string) => {
    return rooms.filter(room => room.projectType === projectType);
  };

  const toggleAreaSelection = async (roomId: string, areaType: 'floor' | 'wall' | 'ceiling') => {
    const updatedRooms = rooms.map(room => {
      if (room.id === roomId) {
        return {
          ...room,
          selectedAreas: {
            ...room.selectedAreas,
            [areaType]: !room.selectedAreas[areaType]
          }
        };
      }
      return room;
    });
    const updatedRoom = updatedRooms.find(r => r.id === roomId);
    if (updatedRoom) {
      await supabase.from('rooms').update({
        selected_areas: updatedRoom.selectedAreas as any
      }).eq('room_id', roomId).eq('project_id', projectId!);
    }
    setRooms(updatedRooms);
  };

  const getTotalSelectedArea = (rooms: Room[]) => {
    return rooms.reduce((totals, room) => {
      return {
        floor: totals.floor + (room.selectedAreas.floor ? room.floorArea : 0),
        wall: totals.wall + (room.selectedAreas.wall ? room.adjustedWallArea : 0),
        ceiling: totals.ceiling + (room.selectedAreas.ceiling ? room.ceilingArea : 0)
      };
    }, { floor: 0, wall: 0, ceiling: 0 });
  };

  const handleContinue = () => {
    if (rooms.length > 0) {
      navigate(`/paint-estimation/${projectId}`);
    }
  };

  // Handle edit room
  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setEditFormData({
      name: room.name,
      length: room.length.toString(),
      width: room.width.toString(),
      height: room.height.toString()
    });
    setEditDialogOpen(true);
  };

  // Handle update room
  const handleUpdateRoom = async () => {
    if (!editingRoom || !editFormData.name || !editFormData.length || !editFormData.width) {
      toast.error('Please fill in all required fields');
      return;
    }

    const length = parseFloat(editFormData.length);
    const width = parseFloat(editFormData.width);
    const height = editFormData.height ? parseFloat(editFormData.height) : 0;

    // Recalculate areas
    const baseArea = length * width;
    const updatedAreas = height > 0 
      ? calculateAreas(length, width, height, editingRoom.openingAreas, editingRoom.extraSurfaces, editingRoom.doorWindowGrills)
      : {
          floorArea: baseArea,
          wallArea: baseArea,
          ceilingArea: baseArea,
          adjustedWallArea: baseArea - editingRoom.totalOpeningArea + editingRoom.totalExtraSurface,
          totalOpeningArea: editingRoom.totalOpeningArea,
          totalExtraSurface: editingRoom.totalExtraSurface,
          totalDoorWindowGrillArea: editingRoom.totalDoorWindowGrillArea
        };

    try {
      const { error } = await supabase
        .from('rooms')
        .update({
          name: editFormData.name.trim(),
          length,
          width,
          height,
          floor_area: updatedAreas.floorArea,
          wall_area: updatedAreas.wallArea,
          ceiling_area: updatedAreas.ceilingArea,
          adjusted_wall_area: updatedAreas.adjustedWallArea
        })
        .eq('room_id', editingRoom.id)
        .eq('project_id', projectId!);

      if (error) {
        console.error('Error updating room:', error);
        toast.error('Failed to update room');
        return;
      }

      // Update local state
      setRooms(prev => prev.map(room => 
        room.id === editingRoom.id 
          ? {
              ...room,
              name: editFormData.name.trim(),
              length,
              width,
              height,
              ...updatedAreas
            }
          : room
      ));

      setEditDialogOpen(false);
      setEditingRoom(null);
      toast.success('Room updated successfully');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update room');
    }
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
                        onClick={() => setActiveProjectType(type)}
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
                  <CardTitle className="flex items-center text-lg">
                    <Plus className="mr-2 h-5 w-5 text-primary" />
                    Add Room ({activeProjectType})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Room Name</label>
                    <Input
                      placeholder="e.g., Living Room, Bedroom"
                      value={newRoom.name}
                      onChange={(e) => setNewRoom(prev => ({ ...prev, name: e.target.value }))}
                      className="h-12"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Length (ft)</label>
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
                      <label className="text-sm font-medium">Width (ft)</label>
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
                      <label className="text-sm font-medium">Height (ft)</label>
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

                  <Button 
                    onClick={handleAddRoomClick}
                    className="w-full h-12"
                    disabled={!newRoom.name || !newRoom.length || !newRoom.width}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Room to {activeProjectType}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Open Area Section - Only show after clicking Add Room */}
            {activeProjectType && showOpenAreaSection && (
              <Card className="eca-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg text-destructive">
                    <Ruler className="mr-2 h-5 w-5" />
                    Open Area (Subtract from Wall)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Height (ft)</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newOpeningArea.height}
                        onChange={(e) => setNewOpeningArea(prev => ({ ...prev, height: e.target.value }))}
                        className="h-12"
                        step="0.1"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Width (ft)</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newOpeningArea.width}
                        onChange={(e) => setNewOpeningArea(prev => ({ ...prev, width: e.target.value }))}
                        className="h-12"
                        step="0.1"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Qty (Optional)</label>
                      <Input
                        type="number"
                        placeholder="1"
                        value={newOpeningArea.quantity}
                        onChange={(e) => setNewOpeningArea(prev => ({ ...prev, quantity: e.target.value }))}
                        className="h-12"
                        step="1"
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={addTempOpeningArea}
                    disabled={!newOpeningArea.height || !newOpeningArea.width}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add Open Area
                  </Button>

                  {/* Display temporary opening areas */}
                  {tempOpeningAreas.length > 0 && (
                    <div className="space-y-2 mt-3">
                      <p className="text-sm font-medium text-muted-foreground">Added Open Areas:</p>
                      {tempOpeningAreas.map((opening) => (
                        <div key={opening.id} className="flex items-center justify-between p-2 bg-destructive/10 rounded-lg border border-destructive/20">
                          <p className="text-sm text-destructive">
                            {opening.height}' × {opening.width}' × {opening.quantity} = {opening.area.toFixed(1)} sq.ft
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => removeTempOpeningArea(opening.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Extra Surface Section - Only show after clicking Add Room */}
            {activeProjectType && showOpenAreaSection && (
              <Card className="eca-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg text-green-700 dark:text-green-400">
                    <Plus className="mr-2 h-5 w-5" />
                    Extra Surface (Add to Wall)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Height (ft)</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newExtraSurface.height}
                        onChange={(e) => setNewExtraSurface(prev => ({ ...prev, height: e.target.value }))}
                        className="h-12"
                        step="0.1"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Width (ft)</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newExtraSurface.width}
                        onChange={(e) => setNewExtraSurface(prev => ({ ...prev, width: e.target.value }))}
                        className="h-12"
                        step="0.1"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Qty (Optional)</label>
                      <Input
                        type="number"
                        placeholder="1"
                        value={newExtraSurface.quantity}
                        onChange={(e) => setNewExtraSurface(prev => ({ ...prev, quantity: e.target.value }))}
                        className="h-12"
                        step="1"
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={addTempExtraSurface}
                    disabled={!newExtraSurface.height || !newExtraSurface.width}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add Extra Surface
                  </Button>

                  {/* Display temporary extra surfaces */}
                  {tempExtraSurfaces.length > 0 && (
                    <div className="space-y-2 mt-3">
                      <p className="text-sm font-medium text-muted-foreground">Added Extra Surfaces:</p>
                      {tempExtraSurfaces.map((surface) => (
                        <div key={surface.id} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="text-sm text-green-700 dark:text-green-400">
                            {surface.height}' × {surface.width}' × {surface.quantity} = {surface.area.toFixed(1)} sq.ft
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-green-700 dark:text-green-400"
                            onClick={() => removeTempExtraSurface(surface.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Initial Picture Upload Section - Show after Add Room button is clicked */}
            {activeProjectType && showOpenAreaSection && newRoom.pictures.length < 2 && (
              <Card className="eca-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Camera className="mr-2 h-5 w-5 text-primary" />
                    Add Pictures (Required)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Room Pictures (Min: 2, Max: 5)</label>
                      <Badge variant="outline">
                        {newRoom.pictures.length}/5
                      </Badge>
                    </div>
                    
                    {/* Picture Upload Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={newRoom.pictures.length >= 5}
                        className="h-12"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Take Picture
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={newRoom.pictures.length >= 5}
                        className="h-12"
                      >
                        <Image className="mr-2 h-4 w-4" />
                        Choose Picture
                      </Button>
                    </div>

                    {/* Hidden File Inputs */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handlePictureUpload(e.target.files)}
                      className="hidden"
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handlePictureUpload(e.target.files, true)}
                      className="hidden"
                    />

                    {/* Picture Preview */}
                    {newRoom.pictures.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {newRoom.pictures.map((picture, index) => (
                          <div key={index} className="relative">
                            <img
                              src={picture}
                              alt={`Room picture ${index + 1}`}
                              className="w-full h-20 object-cover rounded-lg"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6"
                              onClick={() => removePicture(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Please upload at least 2 pictures to continue with room addition
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add Pictures Section - Only show after Open Area section is visible and has at least 2 pictures */}
            {activeProjectType && showOpenAreaSection && newRoom.pictures.length >= 2 && (
              <Card className="eca-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Camera className="mr-2 h-5 w-5 text-primary" />
                    Add Pictures
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Room Pictures (Min: 2, Max: 5)</label>
                      <Badge variant="outline">
                        {newRoom.pictures.length}/5
                      </Badge>
                    </div>
                    
                    {/* Picture Upload Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={newRoom.pictures.length >= 5}
                        className="h-12"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Take Picture
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={newRoom.pictures.length >= 5}
                        className="h-12"
                      >
                        <Image className="mr-2 h-4 w-4" />
                        Choose Picture
                      </Button>
                    </div>

                    {/* Hidden File Inputs */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handlePictureUpload(e.target.files)}
                      className="hidden"
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handlePictureUpload(e.target.files, true)}
                      className="hidden"
                    />

                    {/* Picture Preview */}
                    {newRoom.pictures.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {newRoom.pictures.map((picture, index) => (
                          <div key={index} className="relative">
                            <img
                              src={picture}
                              alt={`Room picture ${index + 1}`}
                              className="w-full h-20 object-cover rounded-lg"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6"
                              onClick={() => removePicture(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Note: Pictures are required when adding a room (minimum 2 pictures)
                    </p>
                  </div>

                  {/* Final Add Room Button - Only show when all requirements are met */}
                  {newRoom.pictures.length >= 2 && (
                    <Button 
                      onClick={addRoom}
                      className="w-full h-12"
                      disabled={!newRoom.name || !newRoom.length || !newRoom.width || newRoom.pictures.length < 2}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Complete Room Addition
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Current Rooms Display */}
            {activeProjectType && getRoomsByProjectType(activeProjectType).length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center">
                  <Calculator className="mr-2 h-5 w-5" />
                  {activeProjectType} Rooms ({getRoomsByProjectType(activeProjectType).length})
                </h2>
                
                <div className="grid gap-4">
                  {getRoomsByProjectType(activeProjectType).map((room) => (
                    <Card key={room.id} className="eca-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-foreground">{room.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {room.length}' × {room.width}' × {room.height}' 
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditRoom(room)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => removeRoom(room.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Open Areas - Editable after room completion */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-destructive flex items-center">
                            <Ruler className="mr-1 h-3 w-3" />
                            Open Area (Subtract from Wall)
                          </h4>
                          
                          {room.openingAreas.map((opening) => (
                            <div key={opening.id} className="flex items-center justify-between p-2 bg-destructive/10 rounded-lg border border-destructive/20">
                              <p className="text-sm text-destructive">
                                {opening.height}' × {opening.width}' × {opening.quantity} = {opening.area.toFixed(1)} sq.ft
                              </p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive"
                                onClick={() => removeOpeningArea(room.id, opening.id)}
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
                               placeholder="Qty (Optional)"
                               value={newOpeningArea.quantity}
                               onChange={(e) => setNewOpeningArea(prev => ({ ...prev, quantity: e.target.value }))}
                               className="h-10"
                               step="1"
                             />
                           </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => addOpeningAreaToRoom(room.id)}
                            disabled={!newOpeningArea.height || !newOpeningArea.width}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Add Open Area
                          </Button>
                        </div>

                        {/* Extra Surfaces - Editable after room completion */}
                        <div className="space-y-3 mt-4">
                          <h4 className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center">
                            <Plus className="mr-1 h-3 w-3" />
                            Extra Surface (Add to Wall)
                          </h4>
                          
                          {room.extraSurfaces.map((extra) => (
                            <div key={extra.id} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                              <p className="text-sm text-green-700 dark:text-green-400">
                                {extra.height}' × {extra.width}' × {extra.quantity} = {extra.area.toFixed(1)} sq.ft
                              </p>
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
                               placeholder="Qty (Optional)"
                               value={newExtraSurface.quantity}
                               onChange={(e) => setNewExtraSurface(prev => ({ ...prev, quantity: e.target.value }))}
                               className="h-10"
                               step="1"
                             />
                           </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => addExtraSurfaceToRoom(room.id)}
                            disabled={!newExtraSurface.height || !newExtraSurface.width}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Add Extra Surface
                          </Button>
                        </div>
                        
                        {/* Area Categories */}
                        <div className="space-y-4 mt-4">
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
                                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
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
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="doorwindow" className="space-y-6">
            <Card className="eca-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Plus className="mr-2 h-5 w-5 text-amber-600" />
                  Add Door & Window Measurements
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Only add if customer requests enamel/oil paint work
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {rooms.length > 0 && (
                  <div className="space-y-4">
                    {rooms.map((room) => (
                      <Card key={`dwg-${room.id}`} className="border-amber-200 dark:border-amber-800">
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-foreground mb-3">{room.name}</h3>
                          
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
                              placeholder="Name (e.g., Door, Window)"
                              value={newDoorWindowGrill.name}
                              onChange={(e) => setNewDoorWindowGrill(prev => ({ ...prev, name: e.target.value }))}
                              className="h-10"
                            />
                            <Input
                              type="number"
                              placeholder="Sides"
                              value={newDoorWindowGrill.sides}
                              onChange={(e) => setNewDoorWindowGrill(prev => ({ ...prev, sides: e.target.value }))}
                              className="h-10"
                              step="1"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-3 mb-3">
                            <Input
                              type="number"
                              placeholder="Height"
                              value={newDoorWindowGrill.height}
                              onChange={(e) => setNewDoorWindowGrill(prev => ({ ...prev, height: e.target.value }))}
                              className="h-10"
                              step="0.1"
                            />
                            <Input
                              type="number"
                              placeholder="Width"
                              value={newDoorWindowGrill.width}
                              onChange={(e) => setNewDoorWindowGrill(prev => ({ ...prev, width: e.target.value }))}
                              className="h-10"
                              step="0.1"
                            />
                            <Input
                              type="number"
                              placeholder="Grill Multiplier"
                              value={newDoorWindowGrill.grillMultiplier}
                              onChange={(e) => setNewDoorWindowGrill(prev => ({ ...prev, grillMultiplier: e.target.value }))}
                              className="h-10"
                              step="0.1"
                            />
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => addDoorWindowGrillToRoom(room.id)}
                            disabled={!newDoorWindowGrill.height || !newDoorWindowGrill.width || !newDoorWindowGrill.sides}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Add to {room.name}
                          </Button>
                        </CardContent>
                      </Card>
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
            <Button onClick={handleContinue} className="w-full h-12">
              Continue to Paint Estimation
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
    </div>
  );
}