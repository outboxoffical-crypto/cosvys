import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface SubArea {
  id: string;
  name: string;
  area: number;
  length?: number;
  width?: number;
  height?: number;
}

interface SubAreaDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (subArea: SubArea) => void;
  editingSubArea?: SubArea | null;
}

export function SubAreaDialog({ open, onClose, onSave, editingSubArea }: SubAreaDialogProps) {
  const [name, setName] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");

  // Reset form when dialog opens
  useEffect(() => {
    if (open && editingSubArea) {
      setName(editingSubArea.name);
      setLength(editingSubArea.length?.toString() || "");
      setWidth(editingSubArea.width?.toString() || "");
      setHeight(editingSubArea.height?.toString() || "");
    } else if (open) {
      setName("");
      setLength("");
      setWidth("");
      setHeight("");
    }
  }, [open, editingSubArea]);

  const calculateArea = () => {
    const l = parseFloat(length) || 0;
    const w = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;
    
    // Calculate wall area: 2 * (length + width) * height
    if (h > 0) {
      return 2 * (l + w) * h;
    }
    // If no height, calculate floor area: length * width
    return l * w;
  };

  const handleSave = () => {
    if (!name.trim()) return;
    
    const calculatedArea = calculateArea();
    if (calculatedArea <= 0) return;

    const subArea: SubArea = {
      id: editingSubArea?.id || `subarea-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      area: calculatedArea,
      length: parseFloat(length) || 0,
      width: parseFloat(width) || 0,
      height: parseFloat(height) || 0
    };

    onSave(subArea);
    setName("");
    setLength("");
    setWidth("");
    setHeight("");
    onClose();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setName("");
      setLength("");
      setWidth("");
      setHeight("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{editingSubArea ? "Edit Sub-Area" : "Add Sub-Area"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subarea-name">Sub-Area Name</Label>
            <Input
              id="subarea-name"
              placeholder="Name of the Area"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="subarea-length">Length (ft)</Label>
              <Input
                id="subarea-length"
                type="number"
                placeholder="0"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                min="0"
                step="0.1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subarea-width">Width (ft)</Label>
              <Input
                id="subarea-width"
                type="number"
                placeholder="0"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                min="0"
                step="0.1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subarea-height">Height (ft)</Label>
              <Input
                id="subarea-height"
                type="number"
                placeholder="0"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                min="0"
                step="0.1"
              />
            </div>
          </div>
          {calculateArea() > 0 && (
            <div className="p-3 bg-primary/10 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Calculated Area</p>
              <p className="text-xl font-bold text-primary">{calculateArea().toFixed(1)} sq.ft</p>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || calculateArea() <= 0}>
            {editingSubArea ? "Update" : "Add Sub-Area"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
