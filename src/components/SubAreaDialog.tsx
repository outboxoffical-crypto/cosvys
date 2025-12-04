import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface SubArea {
  id: string;
  name: string;
  area: number;
}

interface SubAreaDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (subArea: SubArea) => void;
  editingSubArea?: SubArea | null;
}

export function SubAreaDialog({ open, onClose, onSave, editingSubArea }: SubAreaDialogProps) {
  const [name, setName] = useState(editingSubArea?.name || "");
  const [area, setArea] = useState(editingSubArea?.area?.toString() || "");

  const handleSave = () => {
    if (!name.trim() || !area) {
      return;
    }

    const parsedArea = parseFloat(area);
    if (isNaN(parsedArea) || parsedArea <= 0) {
      return;
    }

    const subArea: SubArea = {
      id: editingSubArea?.id || `subarea-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      area: parsedArea
    };

    onSave(subArea);
    setName("");
    setArea("");
    onClose();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setName("");
      setArea("");
      onClose();
    }
  };

  // Reset form when dialog opens with editing data
  useState(() => {
    if (open && editingSubArea) {
      setName(editingSubArea.name);
      setArea(editingSubArea.area.toString());
    } else if (open) {
      setName("");
      setArea("");
    }
  });

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
              placeholder="e.g., Balcony, Staircase, Kitchen Counter"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subarea-sqft">Square Feet</Label>
            <Input
              id="subarea-sqft"
              type="number"
              placeholder="Enter area in sq.ft"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              min="0.01"
              step="0.01"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || !area}>
            {editingSubArea ? "Update" : "Add Sub-Area"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
