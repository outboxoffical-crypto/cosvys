import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Ruler, Home, Trash2, Calculator, X, Edit3 } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<string>("main");
  const [newRoom, setNewRoom] = useState({
    name: "",
    length: "",
    width: "",
    height: ""
  });
  const [newOpeningArea, setNewOpeningArea] = useState({ height: "", width: "", quantity: "1" });
  const [newExtraSurface, setNewExtraSurface] = useState({ height: "", width: "", quantity: "1" });
  const [newDoorWindowGrill, setNewDoorWindowGrill] = useState({
    name: "Door/Window/Grill",
    height: "",
    width: "",
    sides: "",
    grillMultiplier: "1"
  });

  useEffect(() => {
    // Load project data to get project types
    const savedProjectData = localStorage.getItem(`project_${projectId}`);
    if (savedProjectData) {
      setProjectData(JSON.parse(savedProjectData));
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

  const addRoom = () => {
    if (newRoom.name && newRoom.length && newRoom.width && newRoom.height) {
      const length = parseFloat(newRoom.length);
      const width = parseFloat(newRoom.width);
      const height = parseFloat(newRoom.height);
      
      const room: Room = {
        id: Date.now().toString(),
        name: newRoom.name,
        length,
        width,
        height,
        openingAreas: [],
        extraSurfaces: [],
        doorWindowGrills: [],
        floorArea: length * width,
        wallArea: 2 * (length + width) * height,
        ceilingArea: length * width,
        adjustedWallArea: 2 * (length + width) * height,
        totalOpeningArea: 0,
        totalExtraSurface: 0,
        totalDoorWindowGrillArea: 0
      };
      
      setRooms(prev => [...prev, room]);
      setNewRoom({ name: "", length: "", width: "", height: "" });
    }
  };

  const removeRoom = (roomId: string) => {
    setRooms(prev => prev.filter(room => room.id !== roomId));
  };

  const addOpeningAreaToRoom = (roomId: string) => {
    const openingArea = addOpeningArea();
    if (openingArea) {
      setRooms(prev => prev.map(room => {
        if (room.id === roomId) {
          const updatedOpeningAreas = [...room.openingAreas, openingArea];
          const areas = calculateAreas(room.length, room.width, room.height, updatedOpeningAreas, room.extraSurfaces, room.doorWindowGrills);
          return { ...room, openingAreas: updatedOpeningAreas, ...areas };
        }
        return room;
      }));
      setNewOpeningArea({ height: "", width: "", quantity: "1" });
    }
  };

  const addExtraSurfaceToRoom = (roomId: string) => {
    const extraSurface = addExtraSurface();
    if (extraSurface) {
      setRooms(prev => prev.map(room => {
        if (room.id === roomId) {
          const updatedExtraSurfaces = [...room.extraSurfaces, extraSurface];
          const areas = calculateAreas(room.length, room.width, room.height, room.openingAreas, updatedExtraSurfaces, room.doorWindowGrills);
          return { ...room, extraSurfaces: updatedExtraSurfaces, ...areas };
        }
        return room;
      }));
      setNewExtraSurface({ height: "", width: "", quantity: "1" });
    }
  };

  const addDoorWindowGrillToRoom = (roomId: string) => {
    const doorWindowGrill = addDoorWindowGrill();
    if (doorWindowGrill) {
      setRooms(prev => prev.map(room => {
        if (room.id === roomId) {
          const updatedDoorWindowGrills = [...room.doorWindowGrills, doorWindowGrill];
          const areas = calculateAreas(room.length, room.width, room.height, room.openingAreas, room.extraSurfaces, updatedDoorWindowGrills);
          return { ...room, doorWindowGrills: updatedDoorWindowGrills, ...areas };
        }
        return room;
      }));
      setNewDoorWindowGrill({
        name: "Door/Window/Grill",
        height: "",
        width: "",
        sides: "",
        grillMultiplier: "1"
      });
    }
  };

  const removeOpeningArea = (roomId: string, openingId: string) => {
    setRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        const updatedOpeningAreas = room.openingAreas.filter(o => o.id !== openingId);
        const areas = calculateAreas(room.length, room.width, room.height, updatedOpeningAreas, room.extraSurfaces, room.doorWindowGrills);
        return { ...room, openingAreas: updatedOpeningAreas, ...areas };
      }
      return room;
    }));
  };

  const removeExtraSurface = (roomId: string, extraId: string) => {
    setRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        const updatedExtraSurfaces = room.extraSurfaces.filter(e => e.id !== extraId);
        const areas = calculateAreas(room.length, room.width, room.height, room.openingAreas, updatedExtraSurfaces, room.doorWindowGrills);
        return { ...room, extraSurfaces: updatedExtraSurfaces, ...areas };
      }
      return room;
    }));
  };

  const removeDoorWindowGrill = (roomId: string, dwgId: string) => {
    setRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        const updatedDoorWindowGrills = room.doorWindowGrills.filter(d => d.id !== dwgId);
        const areas = calculateAreas(room.length, room.width, room.height, room.openingAreas, room.extraSurfaces, updatedDoorWindowGrills);
        return { ...room, doorWindowGrills: updatedDoorWindowGrills, ...areas };
      }
      return room;
    }));
  };

  const updateDoorWindowGrillName = (roomId: string, dwgId: string, newName: string) => {
    setRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        const updatedDoorWindowGrills = room.doorWindowGrills.map(dwg => 
          dwg.id === dwgId ? { ...dwg, name: newName } : dwg
        );
        return { ...room, doorWindowGrills: updatedDoorWindowGrills };
      }
      return room;
    }));
  };

  const getTotalAreas = (projectType: string) => {
    return rooms.reduce(
      (acc, room) => ({
        floorArea: acc.floorArea + room.floorArea,
        wallArea: acc.wallArea + room.adjustedWallArea,
        ceilingArea: acc.ceilingArea + room.ceilingArea,
        doorWindowGrillArea: acc.doorWindowGrillArea + room.totalDoorWindowGrillArea
      }),
      { floorArea: 0, wallArea: 0, ceilingArea: 0, doorWindowGrillArea: 0 }
    );
  };

  const handleContinue = () => {
    if (rooms.length > 0) {
      // Store room data in localStorage
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
            <TabsTrigger value="main">Space Calculator</TabsTrigger>
            <TabsTrigger value="doorwindow">Door/Window/Grill</TabsTrigger>
          </TabsList>

          <TabsContent value="main" className="space-y-6">
            {/* Add New Room */}
            <Card className="eca-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Plus className="mr-2 h-5 w-5 text-primary" />
                  Add Room
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
                  onClick={addRoom}
                  className="w-full h-12"
                  disabled={!newRoom.name || !newRoom.length || !newRoom.width || !newRoom.height}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Room
                </Button>
              </CardContent>
            </Card>

            {/* Project Type Columns */}
            {rooms.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center">
                  <Home className="mr-2 h-5 w-5" />
                  Room Measurements by Project Type
                </h2>
                
                <Tabs defaultValue={projectData.projectTypes[0]} className="w-full">
                  <TabsList className={`grid w-full ${projectData.projectTypes.length === 1 ? 'grid-cols-1' : projectData.projectTypes.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                    {projectData.projectTypes.map((type) => (
                      <TabsTrigger key={type} value={type}>{type}</TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {projectData.projectTypes.map((projectType) => (
                    <TabsContent key={projectType} value={projectType} className="space-y-4">
                      <div className="grid gap-4">
                        {rooms.map((room) => (
                          <Card key={`${room.id}-${projectType}`} className="eca-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="font-semibold text-foreground">{room.name} - {projectType}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {room.length}' × {room.width}' × {room.height}'
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

                              {/* Area Summary */}
                              <div className="grid grid-cols-2 gap-4 text-center mb-3">
                                <div className="bg-muted rounded-lg p-3">
                                  <p className="text-sm text-muted-foreground">Floor Area</p>
                                  <p className="text-lg font-semibold text-foreground">{room.floorArea.toFixed(1)}</p>
                                  <p className="text-xs text-muted-foreground">sq.ft</p>
                                </div>
                                <div className="bg-muted rounded-lg p-3">
                                  <p className="text-sm text-muted-foreground">Ceiling Area</p>
                                  <p className="text-lg font-semibold text-foreground">{room.ceilingArea.toFixed(1)}</p>
                                  <p className="text-xs text-muted-foreground">sq.ft</p>
                                </div>
                              </div>
                              
                              <div className="bg-primary/10 rounded-lg p-3 border border-primary/20 text-center">
                                <p className="text-sm text-primary">Final Wall Area ({projectType})</p>
                                <p className="text-xl font-bold text-primary">{room.adjustedWallArea.toFixed(1)}</p>
                                <p className="text-xs text-primary">
                                  {room.wallArea.toFixed(1)} - {room.totalOpeningArea.toFixed(1)} + {room.totalExtraSurface.toFixed(1)} = {room.adjustedWallArea.toFixed(1)} sq.ft
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Total Summary for Project Type */}
                      <Card className="eca-gradient text-white eca-shadow">
                        <CardHeader>
                          <CardTitle className="flex items-center text-lg">
                            <Calculator className="mr-2 h-5 w-5" />
                            Total {projectType} Area Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 text-center mb-4">
                            <div>
                              <p className="text-white/80 text-sm">Total Floor</p>
                              <p className="text-2xl font-bold">{getTotalAreas(projectType).floorArea.toFixed(1)}</p>
                              <p className="text-white/80 text-xs">sq.ft</p>
                            </div>
                            <div>
                              <p className="text-white/80 text-sm">Total Ceiling</p>
                              <p className="text-2xl font-bold">{getTotalAreas(projectType).ceilingArea.toFixed(1)}</p>
                              <p className="text-white/80 text-xs">sq.ft</p>
                            </div>
                          </div>
                          
                          <div className="bg-white/10 rounded-lg p-4 text-center">
                            <p className="text-white/80 text-sm">Total Wall Area ({projectType})</p>
                            <p className="text-3xl font-bold">{getTotalAreas(projectType).wallArea.toFixed(1)}</p>
                            <p className="text-white/80 text-xs">sq.ft (final calculation)</p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            )}
          </TabsContent>

          <TabsContent value="doorwindow" className="space-y-6">
            <Card className="eca-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Plus className="mr-2 h-5 w-5 text-amber-600" />
                  Door/Window/Grill Measurements
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
                          
                          <div className="space-y-3">
                            <Input
                              placeholder="Item name (e.g., Main Door, Window Grill)"
                              value={newDoorWindowGrill.name}
                              onChange={(e) => setNewDoorWindowGrill(prev => ({ ...prev, name: e.target.value }))}
                              className="h-10"
                            />
                            
                            <div className="grid grid-cols-2 gap-2">
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
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                type="number"
                                placeholder="No. of Sides"
                                value={newDoorWindowGrill.sides}
                                onChange={(e) => setNewDoorWindowGrill(prev => ({ ...prev, sides: e.target.value }))}
                                className="h-10"
                                step="1"
                              />
                              <Input
                                type="number"
                                placeholder="Approx Grill (Optional)"
                                value={newDoorWindowGrill.grillMultiplier}
                                onChange={(e) => setNewDoorWindowGrill(prev => ({ ...prev, grillMultiplier: e.target.value }))}
                                className="h-10"
                                step="0.1"
                              />
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20"
                              onClick={() => addDoorWindowGrillToRoom(room.id)}
                              disabled={!newDoorWindowGrill.height || !newDoorWindowGrill.width || !newDoorWindowGrill.sides}
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Add to {room.name}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {/* Door/Window/Grill Total */}
                    {rooms.some(room => room.doorWindowGrills.length > 0) && (
                      <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                        <CardHeader>
                          <CardTitle className="flex items-center text-lg text-amber-700 dark:text-amber-400">
                            <Calculator className="mr-2 h-5 w-5" />
                            Total Door/Window/Grill Area
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center">
                            <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">
                              {rooms.reduce((total, room) => total + room.totalDoorWindowGrillArea, 0).toFixed(1)}
                            </p>
                            <p className="text-amber-600 dark:text-amber-500 text-sm">sq.ft (for enamel/oil paint)</p>
                          </div>
                          
                          <div className="mt-4 space-y-2">
                            {rooms.filter(room => room.doorWindowGrills.length > 0).map(room => (
                              <div key={room.id} className="flex justify-between text-sm">
                                <span className="text-amber-700 dark:text-amber-400">{room.name}:</span>
                                <span className="font-medium text-amber-700 dark:text-amber-400">
                                  {room.totalDoorWindowGrillArea.toFixed(1)} sq.ft
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
                
                {rooms.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Add rooms first in the "Space Calculator" tab</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>


        {/* Continue Button */}
        {rooms.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
            <Button 
              onClick={handleContinue}
              className="w-full h-12 text-base font-medium"
            >
              Continue to Paint Estimation
            </Button>
          </div>
        )}
      </div>

      <div className="h-20"></div>
    </div>
  );
}