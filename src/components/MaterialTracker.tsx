import { useState, useEffect, useCallback, memo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Save } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Material {
  id?: string;
  material_name: string;
  quantity: number;
  unit: string;
  rate: number;
  delivery_status: string;
}

interface MaterialTrackerProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

// Memoized Material Row Component
const MaterialRow = memo(({ 
  material, 
  index,
  onUpdate, 
  onDelete 
}: { 
  material: Material; 
  index: number;
  onUpdate: (id: string, field: string, value: any) => void;
  onDelete: (id: string) => void;
}) => {
  const [localValues, setLocalValues] = useState({
    material_name: material.material_name,
    quantity: material.quantity,
    rate: material.rate,
  });

  const total = localValues.quantity * localValues.rate;

  const handleBlur = useCallback((field: string) => {
    if (material.id && localValues[field as keyof typeof localValues] !== material[field as keyof Material]) {
      onUpdate(material.id, field, localValues[field as keyof typeof localValues]);
    }
  }, [material.id, localValues, onUpdate]);

  return (
    <tr className="hover:bg-[#f7fafc] transition-colors">
      <td className="border border-[#e2e8f0] px-2 py-2">
        <Input
          value={localValues.material_name}
          onChange={(e) => setLocalValues(prev => ({ ...prev, material_name: e.target.value }))}
          onBlur={() => handleBlur('material_name')}
          placeholder="Enter material name"
          className="border-0 text-center focus-visible:ring-1"
        />
      </td>
      <td className="border border-[#e2e8f0] px-2 py-2">
        <Input
          type="number"
          value={localValues.quantity}
          onChange={(e) => setLocalValues(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
          onBlur={() => handleBlur('quantity')}
          placeholder="0"
          className="border-0 text-center focus-visible:ring-1"
        />
      </td>
      <td className="border border-[#e2e8f0] px-2 py-2">
        <Select
          value={material.unit}
          onValueChange={(value) => material.id && onUpdate(material.id, "unit", value)}
        >
          <SelectTrigger className="border-0 text-center focus:ring-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="kg">kg</SelectItem>
            <SelectItem value="Ltr">Ltr</SelectItem>
            <SelectItem value="pcs">pcs</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="border border-[#e2e8f0] px-2 py-2">
        <Input
          type="number"
          value={localValues.rate}
          onChange={(e) => setLocalValues(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
          onBlur={() => handleBlur('rate')}
          placeholder="0"
          className="border-0 text-center focus-visible:ring-1"
        />
      </td>
      <td className="border border-[#e2e8f0] px-4 py-2 text-center font-semibold text-[#2d3748]">
        ₹{total.toFixed(2)}
      </td>
      <td className="border border-[#e2e8f0] px-2 py-2">
        <Select
          value={material.delivery_status}
          onValueChange={(value) => material.id && onUpdate(material.id, "delivery_status", value)}
        >
          <SelectTrigger className="border-0 text-center focus:ring-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="In-Transit">In-Transit</SelectItem>
            <SelectItem value="Delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="border border-[#e2e8f0] px-2 py-2 text-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => material.id && onDelete(material.id)}
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
});

export const MaterialTracker = ({ projectId, isOpen, onClose }: MaterialTrackerProps) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMaterials();
    }
  }, [isOpen, projectId]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("material_tracker")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMaterials(data || []);
    } catch (error: any) {
      console.error("Error fetching materials:", error);
      toast({
        title: "Error",
        description: "Failed to load materials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaterial = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newMaterial: Material = {
        material_name: "",
        quantity: 0,
        unit: "kg",
        rate: 0,
        delivery_status: "Pending",
      };

      const { data, error } = await supabase
        .from("material_tracker")
        .insert({
          project_id: projectId,
          user_id: user.id,
          ...newMaterial,
        })
        .select()
        .single();

      if (error) throw error;

      setMaterials([...materials, data]);
      toast({
        title: "Success",
        description: "Material row added",
      });
    } catch (error: any) {
      console.error("Error adding material:", error);
      toast({
        title: "Error",
        description: "Failed to add material",
        variant: "destructive",
      });
    }
  };

  const handleUpdateMaterial = useCallback((id: string, field: string, value: any) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
    setHasChanges(true);
  }, []);

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      
      // Update all materials
      const updates = materials.map(material => {
        if (!material.id) return null;
        return supabase
          .from("material_tracker")
          .update({
            material_name: material.material_name,
            quantity: material.quantity,
            unit: material.unit,
            rate: material.rate,
            delivery_status: material.delivery_status,
          })
          .eq("id", material.id);
      }).filter(Boolean);

      const results = await Promise.all(updates);
      const errors = results.filter(result => result?.error);

      if (errors.length > 0) {
        throw new Error("Some materials failed to update");
      }

      setHasChanges(false);
      toast({
        title: "Success",
        description: "All changes saved successfully",
      });
    } catch (error: any) {
      console.error("Error saving changes:", error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMaterial = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("material_tracker")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setMaterials(prev => prev.filter(m => m.id !== id));
      toast({
        title: "Success",
        description: "Material deleted",
      });
    } catch (error: any) {
      console.error("Error deleting material:", error);
      toast({
        title: "Error",
        description: "Failed to delete material",
        variant: "destructive",
      });
    }
  }, []);

  const totalCost = materials.reduce((sum, material) => sum + (material.quantity * material.rate), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-semibold text-[#2d3748]">Material Tracker</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(90vh-120px)]">
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#fff0f5]">
                    <th className="border border-[#e2e8f0] px-4 py-3 text-center text-sm font-semibold text-[#2d3748] rounded-tl-lg">Material Name</th>
                    <th className="border border-[#e2e8f0] px-4 py-3 text-center text-sm font-semibold text-[#2d3748]">Quantity</th>
                    <th className="border border-[#e2e8f0] px-4 py-3 text-center text-sm font-semibold text-[#2d3748]">Unit</th>
                    <th className="border border-[#e2e8f0] px-4 py-3 text-center text-sm font-semibold text-[#2d3748]">Rate (₹)</th>
                    <th className="border border-[#e2e8f0] px-4 py-3 text-center text-sm font-semibold text-[#2d3748]">Total (₹)</th>
                    <th className="border border-[#e2e8f0] px-4 py-3 text-center text-sm font-semibold text-[#2d3748]">Delivery Status</th>
                    <th className="border border-[#e2e8f0] px-4 py-3 text-center text-sm font-semibold text-[#2d3748] rounded-tr-lg">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((material, index) => (
                    <MaterialRow
                      key={material.id}
                      material={material}
                      index={index}
                      onUpdate={handleUpdateMaterial}
                      onDelete={handleDeleteMaterial}
                    />
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#fff0f5] font-bold">
                    <td colSpan={4} className="border border-[#e2e8f0] px-4 py-3 text-right text-[#2d3748]">
                      Total Material Cost:
                    </td>
                    <td className="border border-[#e2e8f0] px-4 py-3 text-center text-[#2d3748]">
                      ₹{totalCost.toFixed(2)}
                    </td>
                    <td colSpan={2} className="border border-[#e2e8f0]"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-6 flex justify-center gap-4">
              <Button
                onClick={handleAddMaterial}
                className="gap-2"
                disabled={loading}
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                Add Material
              </Button>
              
              {hasChanges && (
                <Button
                  onClick={handleSaveChanges}
                  className="gap-2"
                  disabled={loading}
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};