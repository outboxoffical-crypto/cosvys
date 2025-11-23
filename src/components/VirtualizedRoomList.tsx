import { memo, useState, useEffect, useRef, useCallback } from "react";
import { RoomCard } from "./RoomCard";

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

interface VirtualizedRoomListProps {
  rooms: Room[];
  onEditRoom: (room: Room) => void;
  onRemoveRoom: (roomId: string) => void;
  onToggleAreaSelection: (roomId: string, areaType: 'floor' | 'wall' | 'ceiling') => void;
  onAddOpeningArea: (roomId: string) => void;
  onRemoveOpeningArea: (roomId: string, openingId: string) => void;
  onAddExtraSurface: (roomId: string) => void;
  onRemoveExtraSurface: (roomId: string, extraId: string) => void;
  onRemoveDoorWindowGrill: (roomId: string, dwgId: string) => void;
  onUpdateDoorWindowGrillName: (roomId: string, dwgId: string, newName: string) => void;
  roomOpeningInputs: Record<string, { height: string; width: string; quantity: string }>;
  roomExtraSurfaceInputs: Record<string, { height: string; width: string; quantity: string }>;
  onSetRoomOpeningInputs: (fn: (prev: any) => any) => void;
  onSetRoomExtraSurfaceInputs: (fn: (prev: any) => any) => void;
}

// Lazy-loading list with incremental rendering
export const VirtualizedRoomList = memo<VirtualizedRoomListProps>(({
  rooms,
  onEditRoom,
  onRemoveRoom,
  onToggleAreaSelection,
  onAddOpeningArea,
  onRemoveOpeningArea,
  onAddExtraSurface,
  onRemoveExtraSurface,
  onRemoveDoorWindowGrill,
  onUpdateDoorWindowGrillName,
  roomOpeningInputs,
  roomExtraSurfaceInputs,
  onSetRoomOpeningInputs,
  onSetRoomExtraSurfaceInputs,
}) => {
  // Load rooms incrementally: 20 initially, then 10 more as user scrolls
  const [visibleCount, setVisibleCount] = useState(20);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);

  // Optimized: Only render visible rooms
  const visibleRooms = rooms.slice(0, visibleCount);
  const hasMore = visibleCount < rooms.length;

  // Handle scroll to load more rooms
  const handleScroll = useCallback(() => {
    if (!containerRef.current || loadingMoreRef.current || !hasMore) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    // Load more when user scrolls to 80% of the content
    if (scrollTop + clientHeight >= scrollHeight * 0.8) {
      loadingMoreRef.current = true;
      
      // Load 10 more rooms
      setTimeout(() => {
        setVisibleCount(prev => Math.min(prev + 10, rooms.length));
        loadingMoreRef.current = false;
      }, 100);
    }
  }, [hasMore, rooms.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Reset visible count when rooms list changes significantly
  useEffect(() => {
    if (rooms.length < visibleCount) {
      setVisibleCount(Math.min(20, rooms.length));
    }
  }, [rooms.length]);

  return (
    <div 
      ref={containerRef}
      className="space-y-4 max-h-[800px] overflow-y-auto"
      style={{ scrollBehavior: 'smooth' }}
    >
      {visibleRooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          newOpeningArea={roomOpeningInputs[room.id] || { height: "", width: "", quantity: "" }}
          newExtraSurface={roomExtraSurfaceInputs[room.id] || { height: "", width: "", quantity: "" }}
          onEditRoom={onEditRoom}
          onRemoveRoom={onRemoveRoom}
          onToggleArea={onToggleAreaSelection}
          onRemoveOpeningArea={onRemoveOpeningArea}
          onRemoveExtraSurface={onRemoveExtraSurface}
          onRemoveDoorWindowGrill={onRemoveDoorWindowGrill}
          onUpdateDoorWindowGrillName={onUpdateDoorWindowGrillName}
          onAddOpeningArea={onAddOpeningArea}
          onAddExtraSurface={onAddExtraSurface}
          onOpeningAreaChange={(field, value) => {
            onSetRoomOpeningInputs(prev => ({
              ...prev,
              [room.id]: { ...(prev[room.id] || { height: "", width: "", quantity: "" }), [field]: value }
            }));
          }}
          onExtraSurfaceChange={(field, value) => {
            onSetRoomExtraSurfaceInputs(prev => ({
              ...prev,
              [room.id]: { ...(prev[room.id] || { height: "", width: "", quantity: "" }), [field]: value }
            }));
          }}
        />
      ))}
      
      {hasMore && (
        <div className="text-center py-4 text-muted-foreground">
          <p className="text-sm">Scroll down to load more rooms... ({visibleCount} of {rooms.length})</p>
        </div>
      )}
      
      {!hasMore && rooms.length > 20 && (
        <div className="text-center py-4 text-muted-foreground">
          <p className="text-sm">All {rooms.length} rooms loaded</p>
        </div>
      )}
    </div>
  );
});

VirtualizedRoomList.displayName = "VirtualizedRoomList";
