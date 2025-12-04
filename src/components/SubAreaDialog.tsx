import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tag } from "lucide-react";

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

  // Reset form when dialog opens
  useEffect(() => {
    if (open && editingSubArea) {
      setName(editingSubArea.name);
    } else if (open) {
      setName("");
    }
  }, [open, editingSubArea]);

  const handleSave = () => {
    if (!name.trim()) return;

    const subArea: SubArea = {
      id: editingSubArea?.id || `subarea-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      area: editingSubArea?.area || 0, // Start with 0, user adds manually later
      length: editingSubArea?.length,
      width: editingSubArea?.width,
      height: editingSubArea?.height
    };

    onSave(subArea);
    setName("");
    onClose();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setName("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            {editingSubArea ? "Edit Area" : "Add Area"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subarea-name">Name of the Area</Label>
            <Input
              id="subarea-name"
              placeholder="Name of the Area"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {editingSubArea ? "Update" : "+ Add Area"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
