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
  total_cost: number; // Changed from rate to manual total_cost
  delivery_status: string;
  delivery_date?: string;
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
    total_cost: material.total_cost,
  });
  const [showDatePicker, setShowDatePicker] = useState(material.delivery_status === 'Delivered');

  const handleBlur = useCallback((field: string) => {
    if (material.id && localValues[field as keyof typeof localValues] !== material[field as keyof Material]) {
      onUpdate(material.id, field, localValues[field as keyof typeof localValues]);
    }
  }, [material.id, localValues, onUpdate]);

  return (
    <tr className="hover:bg-[#f7fafc] transition-colors group focus-within:bg-accent/30 md:focus-within:bg-transparent focus-within:scale-[1.03] md:focus-within:scale-100 transition-transform">
      <td className="border border-[#e2e8f0] px-2 py-2 min-w-[150px] md:min-w-0">
        <Input
          value={localValues.material_name}
          onChange={(e) => setLocalValues(prev => ({ ...prev, material_name: e.target.value }))}
          onFocus={(e) => { e.currentTarget.select(); e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }); }}
          onBlur={() => handleBlur('material_name')}
          placeholder="Enter material name"
          className="border-0 text-center focus-visible:ring-2 focus-visible:ring-primary touch-manipulation text-base md:text-sm min-h-[44px] md:min-h-0 scroll-mt-24"
        />
      </td>
      <td className="border border-[#e2e8f0] px-2 py-2 min-w-[100px] md:min-w-0">
        <Input
          type="number"
          value={localValues.quantity === 0 ? '' : localValues.quantity}
          onChange={(e) => setLocalValues(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
          onFocus={(e) => { e.currentTarget.select(); e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }); }}
          onBlur={() => handleBlur('quantity')}
          placeholder="0"
          className="border-0 text-center focus-visible:ring-2 focus-visible:ring-primary touch-manipulation text-base md:text-sm min-h-[44px] md:min-h-0 scroll-mt-24"
          inputMode="decimal"
        />
      </td>
      <td className="border border-[#e2e8f0] px-2 py-2 min-w-[80px] md:min-w-0">
        <Select
          value={material.unit}
          onValueChange={(value) => material.id && onUpdate(material.id, "unit", value)}
        >
          <SelectTrigger className="border-0 text-center focus:ring-2 focus:ring-primary touch-manipulation min-h-[44px] md:min-h-0 scroll-mt-24" onFocus={(e) => { e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }); }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="kg">kg</SelectItem>
            <SelectItem value="g">g</SelectItem>
            <SelectItem value="Ltr">Ltr</SelectItem>
            <SelectItem value="ml">ml</SelectItem>
            <SelectItem value="pcs">pcs</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="border border-[#e2e8f0] px-2 py-2 min-w-[120px] md:min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground text-sm flex-shrink-0">₹</span>
          <Input
            type="number"
            value={localValues.total_cost === 0 ? '' : localValues.total_cost}
            onChange={(e) => setLocalValues(prev => ({ ...prev, total_cost: parseFloat(e.target.value) || 0 }))}
            onFocus={(e) => { e.currentTarget.select(); e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }); }}
            onBlur={() => handleBlur('total_cost')}
            placeholder="0"
            className="border-0 text-center focus-visible:ring-2 focus-visible:ring-primary touch-manipulation text-base md:text-sm min-h-[44px] md:min-h-0 scroll-mt-24"
            step="0.01"
            inputMode="decimal"
          />
        </div>
      </td>
      <td className="border border-[#e2e8f0] px-2 py-2 min-w-[150px] md:min-w-0">
        <div className="space-y-2">
          <Select
            value={material.delivery_status}
            onValueChange={(value) => {
              if (material.id) {
                onUpdate(material.id, "delivery_status", value);
                setShowDatePicker(value === 'Delivered');
              }
            }}
          >
            <SelectTrigger className="border-0 text-center focus:ring-2 focus:ring-primary touch-manipulation min-h-[44px] md:min-h-0 scroll-mt-24" onFocus={(e) => { e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }); }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In-Transit">In-Transit</SelectItem>
              <SelectItem value="Delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
          {showDatePicker && (
            <Input
              type="date"
              value={material.delivery_date || ''}
              onChange={(e) => material.id && onUpdate(material.id, "delivery_date", e.target.value)}
              onFocus={(e) => { e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }); }}
              className="border-0 text-center text-xs focus-visible:ring-2 focus-visible:ring-primary touch-manipulation min-h-[44px] md:min-h-0 scroll-mt-24"
            />
          )}
        </div>
      </td>
      <td className="border border-[#e2e8f0] px-2 py-2 text-center min-w-[80px] md:min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => material.id && onDelete(material.id)}
          className="h-10 w-10 md:h-8 md:w-8 text-destructive hover:text-destructive hover:bg-destructive/10 touch-manipulation"
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
      
      // Map existing data to new structure (rate becomes total_cost)
      const mappedData = (data || []).map(item => ({
        ...item,
        total_cost: item.rate || 0,
      }));
      
      setMaterials(mappedData);
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
        total_cost: 0,
        delivery_status: "Pending",
        delivery_date: undefined,
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

      // Map the response to Material type
      const mappedMaterial: Material = {
        id: data.id,
        material_name: data.material_name,
        quantity: data.quantity,
        unit: data.unit,
        total_cost: data.rate || 0,
        delivery_status: data.delivery_status,
        delivery_date: data.delivery_date,
      };

      setMaterials([...materials, mappedMaterial]);
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
            rate: material.total_cost, // Store as rate for backward compatibility
            delivery_status: material.delivery_status,
            delivery_date: material.delivery_date,
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

  const totalCost = materials.reduce((sum, material) => sum + (material.total_cost || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed inset-0 left-0 top-0 translate-x-0 translate-y-0 p-0 w-[100vw] h-[100dvh] max-w-none max-h-none rounded-none flex flex-col md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-6xl md:max-h-[90vh] md:rounded-lg">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-2xl font-semibold text-[#2d3748]">Material Tracker</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 overscroll-contain" onClick={(e) => { const t = e.target as HTMLElement; const tag = t?.tagName?.toLowerCase(); if (!['input','textarea','select','button'].includes(tag)) { (document.activeElement as HTMLElement | null)?.blur(); } }}>
          <div className="p-6">
            <div
              data-grid-mobile
              className="overflow-x-auto overflow-y-auto -mx-6 px-6 whitespace-nowrap touch-pan-x touch-pan-y md:whitespace-normal"
              style={{ touchAction: 'pan-x pan-y pinch-zoom', WebkitOverflowScrolling: 'touch' }}
            >
              <div className="inline-block min-w-full align-middle">
                <table className="w-full border-collapse min-w-[700px] md:min-w-[800px]">
                  <thead>
                    <tr className="bg-[#fff0f5]">
                      <th className="border border-[#e2e8f0] px-2 md:px-4 py-3 text-center text-xs md:text-sm font-semibold text-[#2d3748] rounded-tl-lg md:sticky md:left-0 bg-[#fff0f5] z-10">Material Name</th>
                      <th className="border border-[#e2e8f0] px-2 md:px-4 py-3 text-center text-xs md:text-sm font-semibold text-[#2d3748]">Quantity</th>
                      <th className="border border-[#e2e8f0] px-2 md:px-4 py-3 text-center text-xs md:text-sm font-semibold text-[#2d3748]">Unit</th>
                      <th className="border border-[#e2e8f0] px-2 md:px-4 py-3 text-center text-xs md:text-sm font-semibold text-[#2d3748]">Material Cost</th>
                      <th className="border border-[#e2e8f0] px-2 md:px-4 py-3 text-center text-xs md:text-sm font-semibold text-[#2d3748]">Delivery Status</th>
                      <th className="border border-[#e2e8f0] px-2 md:px-4 py-3 text-center text-xs md:text-sm font-semibold text-[#2d3748] rounded-tr-lg">Delete</th>
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
                      <td colSpan={3} className="border border-[#e2e8f0] px-2 md:px-4 py-2 md:py-3 text-right text-[#2d3748] text-xs md:text-sm">
                        Total Material Cost (Summary):
                      </td>
                      <td className="border border-[#e2e8f0] px-2 md:px-4 py-2 md:py-3 text-center text-[#2d3748] text-sm md:text-base">
                        ₹{totalCost.toFixed(2)}
                      </td>
                      <td colSpan={2} className="border border-[#e2e8f0]"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
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