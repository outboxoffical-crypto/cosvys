import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Ruler, Home, Trash2, Calculator, X, Edit3, Camera, Image } from "lucide-react";

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
  const [newDoorWindowGrill, setNewDoorWindowGrill] = useState({
    name: "Door/Window",
    height: "",
    width: "",
    sides: "",
    grillMultiplier: "1"
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load project data to get project types
    const savedProjectData = localStorage.getItem(`project_${projectId}`);
    if (savedProjectData) {
      const data = JSON.parse(savedProjectData);
      setProjectData(data);
      setActiveProjectType(data.projectTypes[0] || "");
    }
    
    // Load existing rooms
    const savedRooms = localStorage.getItem(`rooms_${projectId}`);
    if (savedRooms) {
      setRooms(JSON.parse(savedRooms));
    }
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

  const addRoom = () => {
    if (newRoom.name && newRoom.length && newRoom.width && newRoom.height && newRoom.pictures.length >= 2) {
      const length = parseFloat(newRoom.length);
      const width = parseFloat(newRoom.width);
      const height = parseFloat(newRoom.height);
      
      const room: Room = {
        id: Date.now().toString(),
        name: newRoom.name,
        length,
        width,
        height,
        projectType: activeProjectType,
        pictures: newRoom.pictures,
        openingAreas: [],
        extraSurfaces: [],
        doorWindowGrills: [],
        floorArea: length * width,
        wallArea: 2 * (length + width) * height,
        ceilingArea: length * width,
        adjustedWallArea: 2 * (length + width) * height,
        totalOpeningArea: 0,
        totalExtraSurface: 0,
        totalDoorWindowGrillArea: 0,
        selectedAreas: {
          floor: true,
          wall: true,
          ceiling: false
        }
      };
      
      setRooms(prev => [...prev, room]);
      setNewRoom({ name: "", length: "", width: "", height: "", pictures: [] });
      setShowOpenAreaSection(false); // Reset the section visibility
      
      // Save rooms to localStorage
      const updatedRooms = [...rooms, room];
      localStorage.setItem(`rooms_${projectId}`, JSON.stringify(updatedRooms));
    }
  };

  const removeRoom = (roomId: string) => {
    const updatedRooms = rooms.filter(room => room.id !== roomId);
    setRooms(updatedRooms);
    localStorage.setItem(`rooms_${projectId}`, JSON.stringify(updatedRooms));
  };

  const addOpeningAreaToRoom = (roomId: string) => {
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
      setRooms(updatedRooms);
      localStorage.setItem(`rooms_${projectId}`, JSON.stringify(updatedRooms));
      setNewOpeningArea({ height: "", width: "", quantity: "1" });
    }
  };

  const addExtraSurfaceToRoom = (roomId: string) => {
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
      setRooms(updatedRooms);
      localStorage.setItem(`rooms_${projectId}`, JSON.stringify(updatedRooms));
      setNewExtraSurface({ height: "", width: "", quantity: "1" });
    }
  };

  const addDoorWindowGrillToRoom = (roomId: string) => {
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
      setRooms(updatedRooms);
      localStorage.setItem(`rooms_${projectId}`, JSON.stringify(updatedRooms));
      setNewDoorWindowGrill({
        name: "Door/Window",
        height: "",
        width: "",
        sides: "",
        grillMultiplier: "1"
      });
    }
  };

  const removeOpeningArea = (roomId: string, openingId: string) => {
    const updatedRooms = rooms.map(room => {
      if (room.id === roomId) {
        const updatedOpeningAreas = room.openingAreas.filter(o => o.id !== openingId);
        const areas = calculateAreas(room.length, room.width, room.height, updatedOpeningAreas, room.extraSurfaces, room.doorWindowGrills);
        return { ...room, openingAreas: updatedOpeningAreas, ...areas };
      }
      return room;
    });
    setRooms(updatedRooms);
    localStorage.setItem(`rooms_${projectId}`, JSON.stringify(updatedRooms));
  };

  const removeExtraSurface = (roomId: string, extraId: string) => {
    const updatedRooms = rooms.map(room => {
      if (room.id === roomId) {
        const updatedExtraSurfaces = room.extraSurfaces.filter(e => e.id !== extraId);
        const areas = calculateAreas(room.length, room.width, room.height, room.openingAreas, updatedExtraSurfaces, room.doorWindowGrills);
        return { ...room, extraSurfaces: updatedExtraSurfaces, ...areas };
      }
      return room;
    });
    setRooms(updatedRooms);
    localStorage.setItem(`rooms_${projectId}`, JSON.stringify(updatedRooms));
  };

  const removeDoorWindowGrill = (roomId: string, dwgId: string) => {
    const updatedRooms = rooms.map(room => {
      if (room.id === roomId) {
        const updatedDoorWindowGrills = room.doorWindowGrills.filter(d => d.id !== dwgId);
        const areas = calculateAreas(room.length, room.width, room.height, room.openingAreas, room.extraSurfaces, updatedDoorWindowGrills);
        return { ...room, doorWindowGrills: updatedDoorWindowGrills, ...areas };
      }
      return room;
    });
    setRooms(updatedRooms);
    localStorage.setItem(`rooms_${projectId}`, JSON.stringify(updatedRooms));
  };

  const updateDoorWindowGrillName = (roomId: string, dwgId: string, newName: string) => {
    const updatedRooms = rooms.map(room => {
      if (room.id === roomId) {
        const updatedDoorWindowGrills = room.doorWindowGrills.map(dwg => 
          dwg.id === dwgId ? { ...dwg, name: newName } : dwg
        );
        return { ...room, doorWindowGrills: updatedDoorWindowGrills };
      }
      return room;
    });
    setRooms(updatedRooms);
    localStorage.setItem(`rooms_${projectId}`, JSON.stringify(updatedRooms));
  };

  const getRoomsByProjectType = (projectType: string) => {
    return rooms.filter(room => room.projectType === projectType);
  };

  const toggleAreaSelection = (roomId: string, areaType: 'floor' | 'wall' | 'ceiling') => {
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
    setRooms(updatedRooms);
    localStorage.setItem(`rooms_${projectId}`, JSON.stringify(updatedRooms));
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
      localStorage.setItem(`rooms_${projectId}`, JSON.stringify(rooms));
      navigate(`/paint-estimation/${projectId}`);
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
                    disabled={!newRoom.name || !newRoom.length || !newRoom.width || !newRoom.height}
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
                    onClick={() => {
                      const opening = addOpeningArea();
                      if (opening && newRoom.name) {
                        // Add to temporary list for preview
                      }
                    }}
                    disabled={!newOpeningArea.height || !newOpeningArea.width}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add Open Area
                  </Button>
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
                    onClick={() => {
                      const surface = addExtraSurface();
                      if (surface && newRoom.name) {
                        // Add to temporary list for preview
                      }
                    }}
                    disabled={!newExtraSurface.height || !newExtraSurface.width}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add Extra Surface
                  </Button>
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
                      disabled={!newRoom.name || !newRoom.length || !newRoom.width || !newRoom.height || newRoom.pictures.length < 2}
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
                              {room.length}' × {room.width}' × {room.height}' ({room.projectType})
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => removeRoom(room.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Room Pictures */}
                        {room.pictures.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium mb-2">Room Pictures:</p>
                            <div className="grid grid-cols-5 gap-2">
                              {room.pictures.map((picture, index) => (
                                <img
                                  key={index}
                                  src={picture}
                                  alt={`${room.name} picture ${index + 1}`}
                                  className="w-full h-16 object-cover rounded-lg border"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Opening Areas */}
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-destructive">Open Areas (Subtract)</h4>
                          </div>
                          
                          {room.openingAreas.map((opening) => (
                            <div key={opening.id} className="flex items-center justify-between bg-destructive/10 rounded-lg p-2">
                               <span className="text-sm">
                                 {opening.height}' × {opening.width}' × {opening.quantity} = {opening.area.toFixed(1)} sq.ft
                               </span>
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

                        {/* Extra Surfaces */}
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-green-700 dark:text-green-400">Extra Surfaces (Add)</h4>
                          </div>
                          
                          {room.extraSurfaces.map((extra) => (
                            <div key={extra.id} className="flex items-center justify-between bg-green-100 dark:bg-green-900/20 rounded-lg p-2">
                               <span className="text-sm">
                                 {extra.height}' × {extra.width}' × {extra.quantity} = {extra.area.toFixed(1)} sq.ft
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
                        <div className="space-y-4">
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
    </div>
  );
}