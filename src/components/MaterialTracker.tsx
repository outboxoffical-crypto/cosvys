import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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

export const MaterialTracker = ({ projectId, isOpen, onClose }: MaterialTrackerProps) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
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

      const newMaterial = {
        project_id: projectId,
        user_id: user.id,
        material_name: "New Material",
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

      if (error) throw error;

      setMaterials([...materials, data]);
      toast({
        title: "Success",
        description: "Material added successfully",
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

  const handleUpdateMaterial = async (id: string, field: string, value: any) => {
    try {
      const { error } = await supabase
        .from("material_tracker")
        .update({ [field]: value })
        .eq("id", id);

      if (error) throw error;

      setMaterials(
        materials.map((m) => (m.id === id ? { ...m, [field]: value } : m))
      );
    } catch (error: any) {
      console.error("Error updating material:", error);
      toast({
        title: "Error",
        description: "Failed to update material",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    try {
      const { error } = await supabase
        .from("material_tracker")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setMaterials(materials.filter((m) => m.id !== id));
      toast({
        title: "Success",
        description: "Material deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting material:", error);
      toast({
        title: "Error",
        description: "Failed to delete material",
        variant: "destructive",
      });
    }
  };

  const calculateTotal = (quantity: number, rate: number) => {
    return (quantity * rate).toFixed(2);
  };

  const calculateTotalCost = () => {
    return materials
      .reduce((sum, m) => sum + m.quantity * m.rate, 0)
      .toFixed(2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b bg-[#fff0f5]">
          <DialogTitle className="text-xl font-semibold text-[#2d3748]">
            Material Tracker
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-lg">
              <thead>
                <tr className="bg-[#fff0f5] text-[#2d3748] text-sm">
                  <th className="p-3 text-center border border-[#e2e8f0] rounded-tl-lg min-w-[200px]">
                    Material Name
                  </th>
                  <th className="p-3 text-center border border-[#e2e8f0] min-w-[120px]">
                    Quantity
                  </th>
                  <th className="p-3 text-center border border-[#e2e8f0] min-w-[100px]">
                    Unit
                  </th>
                  <th className="p-3 text-center border border-[#e2e8f0] min-w-[120px]">
                    Rate (₹)
                  </th>
                  <th className="p-3 text-center border border-[#e2e8f0] min-w-[120px]">
                    Total (₹)
                  </th>
                  <th className="p-3 text-center border border-[#e2e8f0] min-w-[150px]">
                    Delivery Status
                  </th>
                  <th className="p-3 text-center border border-[#e2e8f0] rounded-tr-lg min-w-[80px]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {materials.map((material) => (
                  <tr
                    key={material.id}
                    className="hover:bg-[#f7fafc] transition-colors"
                  >
                    <td className="p-2 border border-[#e2e8f0]">
                      <Input
                        value={material.material_name}
                        onChange={(e) =>
                          handleUpdateMaterial(
                            material.id!,
                            "material_name",
                            e.target.value
                          )
                        }
                        className="border-0 focus-visible:ring-0 text-center text-[#2d3748]"
                      />
                    </td>
                    <td className="p-2 border border-[#e2e8f0]">
                      <Input
                        type="number"
                        value={material.quantity}
                        onChange={(e) =>
                          handleUpdateMaterial(
                            material.id!,
                            "quantity",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="border-0 focus-visible:ring-0 text-center text-[#2d3748]"
                      />
                    </td>
                    <td className="p-2 border border-[#e2e8f0]">
                      <Select
                        value={material.unit}
                        onValueChange={(value) =>
                          handleUpdateMaterial(material.id!, "unit", value)
                        }
                      >
                        <SelectTrigger className="border-0 focus:ring-0 text-center">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="Ltr">Ltr</SelectItem>
                          <SelectItem value="pcs">pcs</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2 border border-[#e2e8f0]">
                      <Input
                        type="number"
                        value={material.rate}
                        onChange={(e) =>
                          handleUpdateMaterial(
                            material.id!,
                            "rate",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="border-0 focus-visible:ring-0 text-center text-[#2d3748]"
                      />
                    </td>
                    <td className="p-3 border border-[#e2e8f0] text-center font-medium text-[#2d3748]">
                      ₹{calculateTotal(material.quantity, material.rate)}
                    </td>
                    <td className="p-2 border border-[#e2e8f0]">
                      <Select
                        value={material.delivery_status}
                        onValueChange={(value) =>
                          handleUpdateMaterial(
                            material.id!,
                            "delivery_status",
                            value
                          )
                        }
                      >
                        <SelectTrigger className="border-0 focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Delivered">Delivered</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="In-Transit">In-Transit</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2 border border-[#e2e8f0] text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteMaterial(material.id!)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#fff0f5] font-bold text-[#2d3748]">
                  <td
                    colSpan={4}
                    className="p-3 text-right border border-[#e2e8f0] rounded-bl-lg"
                  >
                    Total Material Cost:
                  </td>
                  <td
                    colSpan={3}
                    className="p-3 text-center border border-[#e2e8f0] rounded-br-lg"
                  >
                    ₹{calculateTotalCost()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-4 flex justify-center">
            <Button
              onClick={handleAddMaterial}
              disabled={loading}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Material
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
