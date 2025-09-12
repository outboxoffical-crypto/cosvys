import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Ruler, Home, Trash2, Calculator } from "lucide-react";

interface Room {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  openingArea: number;
  extraSurface: number;
  doorWindowGrillArea: number;
  floorArea: number;
  wallArea: number;
  ceilingArea: number;
  adjustedWallArea: number;
}

export default function RoomMeasurementScreen() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoom, setNewRoom] = useState({
    name: "",
    length: "",
    width: "",
    height: "",
    openingArea: "",
    extraSurface: "",
    doorWindowGrillArea: ""
  });

  const calculateAreas = (length: number, width: number, height: number, openingArea: number, extraSurface: number) => {
    const floorArea = length * width;
    const wallArea = 2 * (length + width) * height;
    const ceilingArea = length * width;
    const adjustedWallArea = wallArea - openingArea + extraSurface;
    return { floorArea, wallArea, ceilingArea, adjustedWallArea };
  };

  const addRoom = () => {
    if (newRoom.name && newRoom.length && newRoom.width && newRoom.height) {
      const length = parseFloat(newRoom.length);
      const width = parseFloat(newRoom.width);
      const height = parseFloat(newRoom.height);
      const openingArea = parseFloat(newRoom.openingArea) || 0;
      const extraSurface = parseFloat(newRoom.extraSurface) || 0;
      const doorWindowGrillArea = parseFloat(newRoom.doorWindowGrillArea) || 0;
      
      const areas = calculateAreas(length, width, height, openingArea, extraSurface);
      
      const room: Room = {
        id: Date.now().toString(),
        name: newRoom.name,
        length,
        width,
        height,
        openingArea,
        extraSurface,
        doorWindowGrillArea,
        ...areas
      };
      
      setRooms(prev => [...prev, room]);
      setNewRoom({ name: "", length: "", width: "", height: "", openingArea: "", extraSurface: "", doorWindowGrillArea: "" });
    }
  };

  const removeRoom = (roomId: string) => {
    setRooms(prev => prev.filter(room => room.id !== roomId));
  };

  const totalAreas = rooms.reduce(
    (acc, room) => ({
      floorArea: acc.floorArea + room.floorArea,
      wallArea: acc.wallArea + room.adjustedWallArea,
      ceilingArea: acc.ceilingArea + room.ceilingArea,
      doorWindowGrillArea: acc.doorWindowGrillArea + room.doorWindowGrillArea
    }),
    { floorArea: 0, wallArea: 0, ceilingArea: 0, doorWindowGrillArea: 0 }
  );

  const handleContinue = () => {
    if (rooms.length > 0) {
      // Store room data in localStorage
      localStorage.setItem(`rooms_${projectId}`, JSON.stringify(rooms));
      navigate(`/paint-estimation/${projectId}`);
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
            onClick={() => navigate("/add-project")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Room Measurements</h1>
            <p className="text-white/80 text-sm">Measure all rooms</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Opening Area (sq.ft)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newRoom.openingArea}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, openingArea: e.target.value }))}
                  className="h-12"
                  step="0.1"
                />
                <p className="text-xs text-muted-foreground">Subtract from wall area</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Extra Surface (sq.ft)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newRoom.extraSurface}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, extraSurface: e.target.value }))}
                  className="h-12"
                  step="0.1"
                />
                <p className="text-xs text-muted-foreground">Add to wall area</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Door/Window/Grill Area (sq.ft)</label>
              <Input
                type="number"
                placeholder="0 (Optional)"
                value={newRoom.doorWindowGrillArea}
                onChange={(e) => setNewRoom(prev => ({ ...prev, doorWindowGrillArea: e.target.value }))}
                className="h-12"
                step="0.1"
              />
              <p className="text-xs text-muted-foreground">Only if customer wants enamel painting</p>
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

        {/* Room List */}
        {rooms.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center">
              <Home className="mr-2 h-5 w-5" />
              Added Rooms ({rooms.length})
            </h2>
            
            {rooms.map((room) => (
              <Card key={room.id} className="eca-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{room.name}</h3>
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
                   
                   <div className="grid grid-cols-2 gap-4 text-center mb-3">
                     <div className="bg-muted rounded-lg p-3">
                       <p className="text-sm text-muted-foreground">Original Wall</p>
                       <p className="text-lg font-semibold text-foreground">{room.wallArea.toFixed(1)}</p>
                       <p className="text-xs text-muted-foreground">sq.ft</p>
                     </div>
                     <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                       <p className="text-sm text-primary">Adjusted Wall</p>
                       <p className="text-lg font-semibold text-primary">{room.adjustedWallArea.toFixed(1)}</p>
                       <p className="text-xs text-primary">sq.ft</p>
                     </div>
                   </div>

                   {(room.openingArea > 0 || room.extraSurface > 0 || room.doorWindowGrillArea > 0) && (
                     <div className="grid grid-cols-3 gap-2 text-center">
                       {room.openingArea > 0 && (
                         <div className="bg-destructive/10 rounded-lg p-2">
                           <p className="text-xs text-destructive">Opening</p>
                           <p className="text-sm font-semibold text-destructive">-{room.openingArea.toFixed(1)}</p>
                         </div>
                       )}
                       {room.extraSurface > 0 && (
                         <div className="bg-green-100 dark:bg-green-900/20 rounded-lg p-2">
                           <p className="text-xs text-green-700 dark:text-green-400">Extra Surface</p>
                           <p className="text-sm font-semibold text-green-700 dark:text-green-400">+{room.extraSurface.toFixed(1)}</p>
                         </div>
                       )}
                       {room.doorWindowGrillArea > 0 && (
                         <div className="bg-amber-100 dark:bg-amber-900/20 rounded-lg p-2">
                           <p className="text-xs text-amber-700 dark:text-amber-400">Door/Window</p>
                           <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">{room.doorWindowGrillArea.toFixed(1)}</p>
                         </div>
                       )}
                     </div>
                   )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Total Summary */}
        {rooms.length > 0 && (
          <Card className="eca-gradient text-white eca-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Calculator className="mr-2 h-5 w-5" />
                Total Area Summary
              </CardTitle>
            </CardHeader>
             <CardContent>
               <div className="grid grid-cols-2 gap-4 text-center mb-4">
                 <div>
                   <p className="text-white/80 text-sm">Total Floor</p>
                   <p className="text-2xl font-bold">{totalAreas.floorArea.toFixed(1)}</p>
                   <p className="text-white/80 text-xs">sq.ft</p>
                 </div>
                 <div>
                   <p className="text-white/80 text-sm">Total Ceiling</p>
                   <p className="text-2xl font-bold">{totalAreas.ceilingArea.toFixed(1)}</p>
                   <p className="text-white/80 text-xs">sq.ft</p>
                 </div>
               </div>
               
               <div className="grid grid-cols-1 gap-4 text-center mb-4">
                 <div className="bg-white/10 rounded-lg p-4">
                   <p className="text-white/80 text-sm">Total Adjusted Wall Area</p>
                   <p className="text-3xl font-bold">{totalAreas.wallArea.toFixed(1)}</p>
                   <p className="text-white/80 text-xs">sq.ft (after adjustments)</p>
                 </div>
               </div>

               {totalAreas.doorWindowGrillArea > 0 && (
                 <div className="grid grid-cols-1 gap-4 text-center">
                   <div className="bg-white/10 rounded-lg p-3">
                     <p className="text-white/80 text-sm">Total Door/Window/Grill</p>
                     <p className="text-xl font-bold">{totalAreas.doorWindowGrillArea.toFixed(1)}</p>
                     <p className="text-white/80 text-xs">sq.ft (for enamel)</p>
                   </div>
                 </div>
               )}
             </CardContent>
          </Card>
        )}

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