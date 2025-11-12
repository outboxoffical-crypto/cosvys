import { useState, useEffect, useCallback, memo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Package, X } from "lucide-react";

interface Material {
  id: string;
  material_name: string;
  quantity: number;
  unit: string;
  rate: number;
  delivery_status: string;
  delivery_date?: string;
}

interface MaterialTrackerProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

const MaterialRow = memo(({ 
  material, 
  onUpdate, 
  onDelete 
}: { 
  material: Material; 
  onUpdate: (id: string, field: string, value: any) => void;
  onDelete: (id: string) => void;
}) => {
  const [localName, setLocalName] = useState(material.material_name);
  const [localQuantity, setLocalQuantity] = useState(material.quantity.toString());
  const [localUnit, setLocalUnit] = useState(material.unit);
  const [localRate, setLocalRate] = useState(material.rate.toString());
  const [localDeliveryStatus, setLocalDeliveryStatus] = useState(material.delivery_status);

  const handleBlur = (field: string, value: any) => {
    onUpdate(material.id, field, field === "quantity" || field === "rate" ? parseFloat(value) || 0 : value);
  };

  return (
    <tr className="hover:bg-rose-50/50 transition-colors">
      <td className="border border-border p-1 bg-rose-50/30" style={{ width: '80px', minWidth: '80px' }}>
        <Textarea
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onBlur={() => handleBlur("material_name", localName)}
          placeholder="Material..."
          className="min-h-[32px] h-auto text-xs p-1 resize-none bg-white"
          rows={2}
        />
      </td>
      <td className="border border-border p-1" style={{ width: '48px', minWidth: '48px' }}>
        <Input
          type="number"
          value={localQuantity}
          onChange={(e) => setLocalQuantity(e.target.value)}
          onBlur={() => handleBlur("quantity", localQuantity)}
          className="text-center h-8 text-xs p-1"
          min="0"
          step="0.01"
        />
      </td>
      <td className="border border-border p-1" style={{ width: '48px', minWidth: '48px' }}>
        <Select value={localUnit} onValueChange={(value) => { setLocalUnit(value); handleBlur("unit", value); }}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="kg">kg</SelectItem>
            <SelectItem value="ml">ml</SelectItem>
            <SelectItem value="ltr">ltr</SelectItem>
            <SelectItem value="pcs">pcs</SelectItem>
            <SelectItem value="pack">pack</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="border border-border p-1" style={{ width: '64px', minWidth: '64px' }}>
        <div className="flex items-center">
          <span className="text-xs mr-1">₹</span>
          <Input
            type="number"
            value={localRate}
            onChange={(e) => setLocalRate(e.target.value)}
            onBlur={() => handleBlur("rate", localRate)}
            className="text-center h-8 text-xs p-1"
            min="0"
            step="0.01"
          />
        </div>
      </td>
      <td className="border border-border p-1" style={{ width: '64px', minWidth: '64px' }}>
        <Select value={localDeliveryStatus} onValueChange={(value) => { setLocalDeliveryStatus(value); handleBlur("delivery_status", value); }}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Delivered">Delivered</SelectItem>
            <SelectItem value="Transit">Transit</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="border border-border p-1 text-center" style={{ width: '40px', minWidth: '40px' }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(material.id)}
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </td>
    </tr>
  );
});

MaterialRow.displayName = "MaterialRow";

export const MaterialTracker = ({ projectId, isOpen, onClose }: MaterialTrackerProps) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchMaterials();
    }
  }, [isOpen, projectId]);

  const fetchMaterials = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("material_tracker")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching materials:", error);
      toast({
        title: "Error",
        description: "Failed to load materials",
        variant: "destructive",
      });
    } else {
      setMaterials(data || []);
    }
    setLoading(false);
  };

  const handleAddMaterial = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newMaterial = {
      project_id: projectId,
      user_id: user.id,
      material_name: "",
      quantity: 0,
      unit: "kg",
      rate: 0,
      delivery_status: "Pending",
    };

    const { data, error } = await supabase
      .from("material_tracker")
      .insert(newMaterial)
      .select()
      .single();

    if (error) {
      console.error("Error adding material:", error);
      toast({
        title: "Error",
        description: "Failed to add material",
        variant: "destructive",
      });
    } else {
      setMaterials([data, ...materials]);
      toast({
        title: "Success",
        description: "Material added successfully",
      });
    }
  };

  const handleUpdateMaterial = useCallback(async (id: string, field: string, value: any) => {
    const { error } = await supabase
      .from("material_tracker")
      .update({ 
        [field]: value,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) {
      console.error("Error updating material:", error);
      toast({
        title: "Error",
        description: "Failed to update material",
        variant: "destructive",
      });
    } else {
      setMaterials(materials.map(material => 
        material.id === id ? { ...material, [field]: value } : material
      ));
    }
  }, [materials, toast]);

  const handleDeleteMaterial = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("material_tracker")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting material:", error);
      toast({
        title: "Error",
        description: "Failed to delete material",
        variant: "destructive",
      });
    } else {
      setMaterials(materials.filter(material => material.id !== id));
      toast({
        title: "Success",
        description: "Material deleted successfully",
      });
    }
  }, [materials, toast]);

  const totalMaterialCost = materials.reduce((sum, material) => sum + (material.quantity * material.rate), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 max-w-full max-h-full h-screen w-screen m-0 rounded-none md:max-w-5xl md:max-h-[90vh] md:h-auto md:rounded-lg mobile-tracker-dialog">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-card border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-500" />
            <h2 className="text-lg font-semibold">Material Tracker</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-4 excel-tracker-container">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ minWidth: '450px' }}>
                <thead className="sticky top-0 bg-rose-100 z-5">
                  <tr>
                    <th className="border border-border px-2 py-2 text-left text-xs font-semibold" style={{ width: '80px' }}>
                      Material Name
                    </th>
                    <th className="border border-border px-2 py-2 text-center text-xs font-semibold" style={{ width: '48px' }}>
                      Quantity
                    </th>
                    <th className="border border-border px-2 py-2 text-center text-xs font-semibold" style={{ width: '48px' }}>
                      Unit
                    </th>
                    <th className="border border-border px-2 py-2 text-center text-xs font-semibold" style={{ width: '64px' }}>
                      Material Cost
                    </th>
                    <th className="border border-border px-2 py-2 text-center text-xs font-semibold" style={{ width: '64px' }}>
                      Delivery Status
                    </th>
                    <th className="border border-border px-2 py-2 text-center text-xs font-semibold" style={{ width: '40px' }}>
                      Delete
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {materials.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="border border-border p-8 text-center text-muted-foreground text-sm">
                        No materials yet. Click "+ Add Material" to get started.
                      </td>
                    </tr>
                  ) : (
                    materials.map((material) => (
                      <MaterialRow
                        key={material.id}
                        material={material}
                        onUpdate={handleUpdateMaterial}
                        onDelete={handleDeleteMaterial}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-10 bg-card border-t px-4 py-3 space-y-3">
          <div className="flex items-center justify-between bg-purple-50 p-3 rounded-lg border border-purple-200">
            <span className="font-semibold text-sm">Total Material Cost:</span>
            <span className="text-xl font-bold text-purple-600">₹{totalMaterialCost.toFixed(2)}</span>
          </div>

          <div className="flex justify-center gap-3">
            <Button onClick={handleAddMaterial} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Material
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
