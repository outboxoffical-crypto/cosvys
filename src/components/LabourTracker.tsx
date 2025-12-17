import { useState, useEffect, useCallback, memo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Calendar as CalendarIcon, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface LabourEntry {
  id: string;
  date: string;
  labour_count: number;
  work_completed: string;
}

interface LabourTrackerProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

const LabourRow = memo(({ 
  entry, 
  onUpdate, 
  onDelete 
}: { 
  entry: LabourEntry; 
  onUpdate: (id: string, field: string, value: any) => void;
  onDelete: (id: string) => void;
}) => {
  const [localDate, setLocalDate] = useState(entry.date);
  const [localLabourCount, setLocalLabourCount] = useState(entry.labour_count.toString());
  const [localWorkPlan, setLocalWorkPlan] = useState(entry.work_completed || '');
  const [localWorkCompleted, setLocalWorkCompleted] = useState(entry.work_completed || '');

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, "yyyy-MM-dd");
      setLocalDate(formattedDate);
      onUpdate(entry.id, "date", formattedDate);
    }
  };

  const handleLabourCountBlur = () => {
    const count = parseInt(localLabourCount) || 0;
    onUpdate(entry.id, "labour_count", count);
  };

  const handleWorkPlanBlur = () => {
    onUpdate(entry.id, "work_completed", localWorkPlan);
  };

  const handleWorkCompletedBlur = () => {
    onUpdate(entry.id, "work_completed", localWorkCompleted);
  };

  return (
    <tr className="hover:bg-muted/50 transition-colors">
      <td className="border border-border p-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !localDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {localDate ? format(new Date(localDate), "PPP") : "Pick date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={localDate ? new Date(localDate) : undefined}
              onSelect={handleDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </td>
      <td className="border border-border p-2">
        <Input
          type="number"
          value={localLabourCount}
          onChange={(e) => setLocalLabourCount(e.target.value)}
          onBlur={handleLabourCountBlur}
          className="text-center"
          min="0"
        />
      </td>
      <td className="border border-border p-2">
        <Textarea
          value={localWorkPlan}
          onChange={(e) => setLocalWorkPlan(e.target.value)}
          onBlur={handleWorkPlanBlur}
          placeholder="Enter work plan..."
          className="min-h-[60px] resize-y text-wrap"
          rows={2}
        />
      </td>
      <td className="border border-border p-2 relative">
        <div className="flex items-start gap-2">
          <Textarea
            value={localWorkCompleted}
            onChange={(e) => setLocalWorkCompleted(e.target.value)}
            onBlur={handleWorkCompletedBlur}
            placeholder="Enter work completed..."
            className="flex-1 min-h-[60px] resize-y text-wrap"
            rows={2}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(entry.id)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 mt-1"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
});

LabourRow.displayName = "LabourRow";

export function LabourTracker({ projectId, isOpen, onClose }: LabourTrackerProps) {
  const { toast } = useToast();
  const [entries, setEntries] = useState<LabourEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchEntries();
    }
  }, [isOpen, projectId]);

  const fetchEntries = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("labour_tracker")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching labour entries:", error);
      toast({
        title: "Error",
        description: "Failed to load labour entries",
        variant: "destructive",
      });
    } else {
      setEntries(data || []);
    }
    setLoading(false);
  };

  const handleAddEntry = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newEntry = {
      project_id: projectId,
      user_id: user.id,
      date: format(new Date(), "yyyy-MM-dd"),
      labour_count: 0,
      work_completed: "",
    };

    const { data, error } = await supabase
      .from("labour_tracker")
      .insert(newEntry)
      .select()
      .single();

    if (error) {
      console.error("Error adding entry:", error);
      toast({
        title: "Error",
        description: "Failed to add entry",
        variant: "destructive",
      });
    } else {
      setEntries([data, ...entries]);
      toast({
        title: "Success",
        description: "Entry added successfully",
      });
    }
  };

  const handleUpdateEntry = useCallback(async (id: string, field: string, value: any) => {
    const { error } = await supabase
      .from("labour_tracker")
      .update({ 
        [field]: value,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) {
      console.error("Error updating entry:", error);
      toast({
        title: "Error",
        description: "Failed to update entry",
        variant: "destructive",
      });
    } else {
      setEntries(entries.map(entry => 
        entry.id === id ? { ...entry, [field]: value } : entry
      ));
    }
  }, [entries, toast]);

  const handleDeleteEntry = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("labour_tracker")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting entry:", error);
      toast({
        title: "Error",
        description: "Failed to delete entry",
        variant: "destructive",
      });
    } else {
      setEntries(entries.filter(entry => entry.id !== id));
      toast({
        title: "Success",
        description: "Entry deleted successfully",
      });
    }
  }, [entries, toast]);

  const totalLabourCount = entries.reduce((sum, entry) => sum + entry.labour_count, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] h-[100vh] w-[100vw] md:max-w-6xl md:max-h-[95vh] md:h-auto md:w-auto p-0 overflow-hidden tracker-dialog-mobile" style={{ touchAction: 'pan-x pan-y pinch-zoom' }}>
        <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Labour Tracker
          </DialogTitle>
        </DialogHeader>

        <div className="h-[calc(100vh-140px)] md:h-[calc(95vh-140px)] overflow-auto" style={{ touchAction: 'pan-x pan-y pinch-zoom' }}>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-auto mobile-tracker-container" style={{ touchAction: 'pan-x pan-y pinch-zoom' }}>
                <table className="w-full border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border px-4 py-3 text-left font-semibold">
                        Date
                      </th>
                      <th className="border border-border px-4 py-3 text-left font-semibold">
                        No. of Labour
                      </th>
                      <th className="border border-border px-4 py-3 text-left font-semibold">
                        Work Plan
                      </th>
                      <th className="border border-border px-4 py-3 text-left font-semibold">
                        Work Completed
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="border border-border p-8 text-center text-muted-foreground">
                          No entries yet. Click "Add Entry" to get started.
                        </td>
                      </tr>
                    ) : (
                      entries.map((entry) => (
                        <LabourRow
                          key={entry.id}
                          entry={entry}
                          onUpdate={handleUpdateEntry}
                          onDelete={handleDeleteEntry}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between bg-muted p-4 rounded-lg border">
                <span className="font-semibold">Total Labour Count:</span>
                <span className="text-2xl font-bold text-primary">{totalLabourCount}</span>
              </div>

              <div className="flex justify-center gap-4">
                <Button onClick={handleAddEntry} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Entry
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
