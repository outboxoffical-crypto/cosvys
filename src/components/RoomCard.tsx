import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit3, X, Image as ImageIcon, Plus } from "lucide-react";

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

export interface SubArea {
  id: string;
  name: string;
  area: number;
  length?: number;
  width?: number;
  height?: number;
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
  subAreas?: SubArea[];
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

interface RoomCardProps {
  room: Room;
  newOpeningArea: { height: string; width: string; quantity: string };
  newExtraSurface: { height: string; width: string; quantity: string };
  onEditRoom: (room: Room) => void;
  onRemoveRoom: (roomId: string) => void;
  onToggleArea: (roomId: string, areaType: 'floor' | 'wall' | 'ceiling') => void;
  onRemoveOpeningArea: (roomId: string, openingId: string) => void;
  onRemoveExtraSurface: (roomId: string, extraId: string) => void;
  onRemoveDoorWindowGrill: (roomId: string, dwgId: string) => void;
  onUpdateDoorWindowGrillName: (roomId: string, dwgId: string, newName: string) => void;
  onAddOpeningArea: (roomId: string) => void;
  onAddExtraSurface: (roomId: string) => void;
  onOpeningAreaChange: (field: 'height' | 'width' | 'quantity', value: string) => void;
  onExtraSurfaceChange: (field: 'height' | 'width' | 'quantity', value: string) => void;
  onAddSubArea?: (roomId: string) => void;
  onEditSubArea?: (roomId: string, subArea: SubArea) => void;
  onRemoveSubArea?: (roomId: string, subAreaId: string) => void;
  onAddCustomSection?: (roomId: string) => void;
}

export const RoomCard = memo(({
  room,
  newOpeningArea,
  newExtraSurface,
  onEditRoom,
  onRemoveRoom,
  onToggleArea,
  onRemoveOpeningArea,
  onRemoveExtraSurface,
  onRemoveDoorWindowGrill,
  onUpdateDoorWindowGrillName,
  onAddOpeningArea,
  onAddExtraSurface,
  onOpeningAreaChange,
  onExtraSurfaceChange,
  onAddSubArea,
  onEditSubArea,
  onRemoveSubArea,
  onAddCustomSection
}: RoomCardProps) => {
  return (
    <Card className="eca-shadow border-l-4 border-l-primary">
      <CardContent className="pt-4 space-y-4">
        {/* Room Header */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-2">
              <h3 className="font-semibold text-lg">{room.name}</h3>
              {onAddCustomSection && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
                  onClick={() => onAddCustomSection(room.id)}
                  title="Add Separate Section"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEditRoom(room)}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Length: {room.length}ft × Width: {room.width}ft {room.height > 0 && `× Height: ${room.height}ft`}</p>
              <p className="font-medium text-foreground">
                Floor: {room.floorArea.toFixed(2)} sq.ft | 
                Wall: {room.adjustedWallArea.toFixed(2)} sq.ft | 
                Ceiling: {room.ceilingArea.toFixed(2)} sq.ft
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onRemoveRoom(room.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Pictures */}
        {room.pictures.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {room.pictures.map((pic, idx) => (
              <div key={idx} className="relative flex-shrink-0">
                <img src={pic} alt={`Room ${idx + 1}`} className="h-20 w-20 object-cover rounded border" />
              </div>
            ))}
          </div>
        )}

        {/* Opening Areas */}
        {room.openingAreas.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Badge variant="secondary">Opening Areas</Badge>
            </h4>
            <div className="space-y-1">
              {room.openingAreas.map((opening) => (
                <div key={opening.id} className="flex items-center justify-between text-sm bg-secondary/30 p-2 rounded">
                  <span>{opening.height}ft × {opening.width}ft × {opening.quantity} = {opening.area.toFixed(2)} sq.ft</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => onRemoveOpeningArea(room.id, opening.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Opening Area */}
        <div className="border-t pt-3 mt-3">
          <h4 className="text-sm font-medium mb-2">Add Opening Area</h4>
          <div className="grid grid-cols-3 gap-2">
            <Input
              type="number"
              placeholder="Height"
              value={newOpeningArea.height}
              onChange={(e) => onOpeningAreaChange('height', e.target.value)}
              className="h-9"
              step="0.01"
            />
            <Input
              type="number"
              placeholder="Width"
              value={newOpeningArea.width}
              onChange={(e) => onOpeningAreaChange('width', e.target.value)}
              className="h-9"
              step="0.01"
            />
            <Input
              type="number"
              placeholder="Qty"
              value={newOpeningArea.quantity}
              onChange={(e) => onOpeningAreaChange('quantity', e.target.value)}
              className="h-9"
              step="1"
              min="1"
            />
          </div>
          <Button
            onClick={() => onAddOpeningArea(room.id)}
            variant="outline"
            size="sm"
            className="w-full mt-2"
          >
            Add Opening
          </Button>
        </div>

        {/* Extra Surfaces */}
        {room.extraSurfaces.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Badge variant="secondary">Extra Surfaces</Badge>
            </h4>
            <div className="space-y-1">
              {room.extraSurfaces.map((extra) => (
                <div key={extra.id} className="flex items-center justify-between text-sm bg-secondary/30 p-2 rounded">
                  <span>{extra.height}ft × {extra.width}ft × {extra.quantity} = {extra.area.toFixed(2)} sq.ft</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => onRemoveExtraSurface(room.id, extra.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Extra Surface */}
        <div className="border-t pt-3">
          <h4 className="text-sm font-medium mb-2">Add Extra Surface</h4>
          <div className="grid grid-cols-3 gap-2">
            <Input
              type="number"
              placeholder="Height"
              value={newExtraSurface.height}
              onChange={(e) => onExtraSurfaceChange('height', e.target.value)}
              className="h-9"
              step="0.01"
            />
            <Input
              type="number"
              placeholder="Width"
              value={newExtraSurface.width}
              onChange={(e) => onExtraSurfaceChange('width', e.target.value)}
              className="h-9"
              step="0.01"
            />
            <Input
              type="number"
              placeholder="Qty"
              value={newExtraSurface.quantity}
              onChange={(e) => onExtraSurfaceChange('quantity', e.target.value)}
              className="h-9"
              step="1"
              min="1"
            />
          </div>
          <Button
            onClick={() => onAddExtraSurface(room.id)}
            variant="outline"
            size="sm"
            className="w-full mt-2"
          >
            Add Extra Surface
          </Button>
        </div>

        {/* Door/Window Grills */}
        {room.doorWindowGrills.length > 0 && (
          <div className="border-t pt-3">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Badge variant="secondary">Door/Window Grills</Badge>
            </h4>
            <div className="space-y-1">
              {room.doorWindowGrills.map((dwg) => (
                <div key={dwg.id} className="flex items-center justify-between text-sm bg-secondary/30 p-2 rounded">
                  <div className="flex-1">
                    <Input
                      value={dwg.name}
                      onChange={(e) => onUpdateDoorWindowGrillName(room.id, dwg.id, e.target.value)}
                      className="h-7 mb-1 text-sm font-medium"
                    />
                    <span className="text-xs text-muted-foreground">
                      {dwg.height}ft × {dwg.width}ft × {dwg.sides} sides × {dwg.grillMultiplier}x = {dwg.area.toFixed(2)} sq.ft
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive ml-2"
                    onClick={() => onRemoveDoorWindowGrill(room.id, dwg.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sub-Areas - Independent Paintable Sections */}
        {room.subAreas && room.subAreas.length > 0 && (
          <div className="border-t pt-3">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Badge variant="default" className="bg-primary/80">Sub-Areas</Badge>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {room.subAreas.map((subArea) => (
                <div
                  key={subArea.id}
                  className="p-3 rounded-lg border-2 border-primary bg-primary/10 relative group"
                >
                  <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEditSubArea && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => onEditSubArea(room.id, subArea)}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    )}
                    {onRemoveSubArea && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-destructive hover:text-destructive"
                        onClick={() => onRemoveSubArea(room.id, subArea.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="text-xs font-medium mb-1 pr-12 truncate">{subArea.name}</div>
                  <div className="text-sm font-bold">{subArea.area.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">sq.ft</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Area Selection Boxes */}
        <div className="border-t pt-3">
          <h4 className="text-sm font-medium mb-2">Select Areas to Paint</h4>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onToggleArea(room.id, 'floor')}
              className={`p-3 rounded-lg border-2 transition-all ${
                room.selectedAreas.floor 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border bg-background'
              }`}
            >
              <div className="text-xs font-medium mb-1">Floor</div>
              <div className="text-sm font-bold">{room.floorArea.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">sq.ft</div>
            </button>
            <button
              onClick={() => onToggleArea(room.id, 'wall')}
              className={`p-3 rounded-lg border-2 transition-all ${
                room.selectedAreas.wall 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border bg-background'
              }`}
            >
              <div className="text-xs font-medium mb-1">Wall</div>
              <div className="text-sm font-bold">{room.adjustedWallArea.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">sq.ft</div>
            </button>
            <button
              onClick={() => onToggleArea(room.id, 'ceiling')}
              className={`p-3 rounded-lg border-2 transition-all ${
                room.selectedAreas.ceiling 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border bg-background'
              }`}
            >
              <div className="text-xs font-medium mb-1">Ceiling</div>
              <div className="text-sm font-bold">{room.ceilingArea.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">sq.ft</div>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Deep comparison for arrays to properly detect changes
  const openingAreasEqual = prevProps.room.openingAreas.length === nextProps.room.openingAreas.length &&
    prevProps.room.openingAreas.every((oa, i) => oa.id === nextProps.room.openingAreas[i]?.id);
  
  const extraSurfacesEqual = prevProps.room.extraSurfaces.length === nextProps.room.extraSurfaces.length &&
    prevProps.room.extraSurfaces.every((es, i) => es.id === nextProps.room.extraSurfaces[i]?.id);
  
  const doorWindowGrillsEqual = prevProps.room.doorWindowGrills.length === nextProps.room.doorWindowGrills.length &&
    prevProps.room.doorWindowGrills.every((dwg, i) => dwg.id === nextProps.room.doorWindowGrills[i]?.id);

  const subAreasEqual = (prevProps.room.subAreas?.length || 0) === (nextProps.room.subAreas?.length || 0) &&
    (prevProps.room.subAreas || []).every((sa, i) => sa.id === nextProps.room.subAreas?.[i]?.id && sa.area === nextProps.room.subAreas?.[i]?.area);

  return (
    prevProps.room.id === nextProps.room.id &&
    prevProps.room.name === nextProps.room.name &&
    prevProps.room.length === nextProps.room.length &&
    prevProps.room.width === nextProps.room.width &&
    prevProps.room.height === nextProps.room.height &&
    prevProps.room.floorArea === nextProps.room.floorArea &&
    prevProps.room.wallArea === nextProps.room.wallArea &&
    prevProps.room.ceilingArea === nextProps.room.ceilingArea &&
    prevProps.room.adjustedWallArea === nextProps.room.adjustedWallArea &&
    prevProps.room.totalExtraSurface === nextProps.room.totalExtraSurface &&
    prevProps.room.selectedAreas.floor === nextProps.room.selectedAreas.floor &&
    prevProps.room.selectedAreas.wall === nextProps.room.selectedAreas.wall &&
    prevProps.room.selectedAreas.ceiling === nextProps.room.selectedAreas.ceiling &&
    openingAreasEqual &&
    extraSurfacesEqual &&
    doorWindowGrillsEqual &&
    subAreasEqual &&
    prevProps.newOpeningArea.height === nextProps.newOpeningArea.height &&
    prevProps.newOpeningArea.width === nextProps.newOpeningArea.width &&
    prevProps.newOpeningArea.quantity === nextProps.newOpeningArea.quantity &&
    prevProps.newExtraSurface.height === nextProps.newExtraSurface.height &&
    prevProps.newExtraSurface.width === nextProps.newExtraSurface.width &&
    prevProps.newExtraSurface.quantity === nextProps.newExtraSurface.quantity
  );
});

RoomCard.displayName = 'RoomCard';
