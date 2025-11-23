import { useState, useEffect, useCallback, memo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Package, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Material {
  id: string;
  material_name: string;
  quantity: number;
  unit: string;
  rate: number;
  total: number;
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
  const [localDeliveryDate, setLocalDeliveryDate] = useState(material.delivery_date || "");

  const calculateTotal = (qty: number, rate: number) => {
    return qty * rate;
  };

  const handleBlur = (field: string, value: any) => {
    onUpdate(material.id, field, field === "quantity" || field === "rate" ? parseFloat(value) || 0 : value);
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, "yyyy-MM-dd");
      setLocalDeliveryDate(formattedDate);
      onUpdate(material.id, "delivery_date", formattedDate);
    }
  };

  return (
    <tr className="hover:bg-muted/50 transition-colors">
      <td className="border border-border p-2">
        <Input
          type="text"
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onBlur={() => handleBlur("material_name", localName)}
          placeholder="Material name..."
        />
      </td>
      <td className="border border-border p-2">
        <Input
          type="number"
          value={localQuantity}
          onChange={(e) => setLocalQuantity(e.target.value)}
          onBlur={() => handleBlur("quantity", localQuantity)}
          className="text-center"
          min="0"
          step="0.01"
        />
      </td>
      <td className="border border-border p-2">
        <Select value={localUnit} onValueChange={(value) => { setLocalUnit(value); handleBlur("unit", value); }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="kg">kg</SelectItem>
            <SelectItem value="litre">litre</SelectItem>
            <SelectItem value="piece">piece</SelectItem>
            <SelectItem value="box">box</SelectItem>
            <SelectItem value="bag">bag</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="border border-border p-2">
        <Input
          type="number"
          value={localRate}
          onChange={(e) => setLocalRate(e.target.value)}
          onBlur={() => handleBlur("rate", localRate)}
          className="text-center"
          min="0"
          step="0.01"
        />
      </td>
      <td className="border border-border p-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !localDeliveryDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {localDeliveryDate ? format(new Date(localDeliveryDate), "PPP") : "Pick date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={localDeliveryDate ? new Date(localDeliveryDate) : undefined}
              onSelect={handleDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </td>
      <td className="border border-border p-2">
        <Select value={localDeliveryStatus} onValueChange={(value) => { setLocalDeliveryStatus(value); handleBlur("delivery_status", value); }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Delivered">Delivered</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="border border-border p-2 text-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(material.id)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

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
      }
      
      setMaterials(data ?? []);
    } catch (error) {
      console.error("Error fetching materials:", error);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
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
      <DialogContent className="max-w-[100vw] max-h-[100vh] h-[100vh] w-[100vw] md:max-w-7xl md:max-h-[95vh] md:h-auto md:w-auto p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            Material Tracker
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(100vh-140px)] md:h-[calc(95vh-140px)]">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-auto mobile-tracker-container">
                <table className="w-full border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border px-4 py-3 text-left font-semibold">Material Name</th>
                      <th className="border border-border px-4 py-3 text-left font-semibold">Quantity</th>
                      <th className="border border-border px-4 py-3 text-left font-semibold">Unit</th>
                      <th className="border border-border px-4 py-3 text-left font-semibold">Rate (₹)</th>
                      <th className="border border-border px-4 py-3 text-left font-semibold">Delivery Date</th>
                      <th className="border border-border px-4 py-3 text-left font-semibold">Delivery Status</th>
                      <th className="border border-border px-4 py-3 text-center font-semibold">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="border border-border p-8 text-center text-muted-foreground">
                          No materials yet. Click "Add Material" to get started.
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

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between bg-muted p-4 rounded-lg border">
                <span className="font-semibold">Total Material Cost:</span>
                <span className="text-2xl font-bold text-primary">₹{totalMaterialCost.toFixed(2)}</span>
              </div>

              <div className="flex justify-center gap-4">
                <Button onClick={handleAddMaterial} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Material
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
