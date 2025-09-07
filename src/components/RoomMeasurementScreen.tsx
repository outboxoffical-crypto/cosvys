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
  floorArea: number;
  wallArea: number;
  ceilingArea: number;
}

export default function RoomMeasurementScreen() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoom, setNewRoom] = useState({
    name: "",
    length: "",
    width: "",
    height: ""
  });

  const calculateAreas = (length: number, width: number, height: number) => {
    const floorArea = length * width;
    const wallArea = 2 * (length + width) * height;
    const ceilingArea = length * width;
    return { floorArea, wallArea, ceilingArea };
  };

  const addRoom = () => {
    if (newRoom.name && newRoom.length && newRoom.width && newRoom.height) {
      const length = parseFloat(newRoom.length);
      const width = parseFloat(newRoom.width);
      const height = parseFloat(newRoom.height);
      
      const areas = calculateAreas(length, width, height);
      
      const room: Room = {
        id: Date.now().toString(),
        name: newRoom.name,
        length,
        width,
        height,
        ...areas
      };
      
      setRooms(prev => [...prev, room]);
      setNewRoom({ name: "", length: "", width: "", height: "" });
    }
  };

  const removeRoom = (roomId: string) => {
    setRooms(prev => prev.filter(room => room.id !== roomId));
  };

  const totalAreas = rooms.reduce(
    (acc, room) => ({
      floorArea: acc.floorArea + room.floorArea,
      wallArea: acc.wallArea + room.wallArea,
      ceilingArea: acc.ceilingArea + room.ceilingArea
    }),
    { floorArea: 0, wallArea: 0, ceilingArea: 0 }
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

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">Floor Area</p>
                      <p className="text-lg font-semibold text-foreground">{room.floorArea.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">sq.ft</p>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">Wall Area</p>
                      <p className="text-lg font-semibold text-foreground">{room.wallArea.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">sq.ft</p>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">Ceiling Area</p>
                      <p className="text-lg font-semibold text-foreground">{room.ceilingArea.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">sq.ft</p>
                    </div>
                  </div>
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
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-white/80 text-sm">Total Floor</p>
                  <p className="text-2xl font-bold">{totalAreas.floorArea.toFixed(1)}</p>
                  <p className="text-white/80 text-xs">sq.ft</p>
                </div>
                <div>
                  <p className="text-white/80 text-sm">Total Wall</p>
                  <p className="text-2xl font-bold">{totalAreas.wallArea.toFixed(1)}</p>
                  <p className="text-white/80 text-xs">sq.ft</p>
                </div>
                <div>
                  <p className="text-white/80 text-sm">Total Ceiling</p>
                  <p className="text-2xl font-bold">{totalAreas.ceilingArea.toFixed(1)}</p>
                  <p className="text-white/80 text-xs">sq.ft</p>
                </div>
              </div>
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