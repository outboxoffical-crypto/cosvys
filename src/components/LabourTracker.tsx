import { useState, useEffect, useCallback, memo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Calendar as CalendarIcon, Users, X } from "lucide-react";
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
      <td className="border border-border p-1" style={{ width: '80px', minWidth: '80px' }}>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-full h-8 justify-start text-left font-normal text-xs px-2",
                !localDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-1 h-3 w-3" />
              {localDate ? format(new Date(localDate), "dd/MM") : "Date"}
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
      <td className="border border-border p-1" style={{ width: '48px', minWidth: '48px' }}>
        <Input
          type="number"
          value={localLabourCount}
          onChange={(e) => setLocalLabourCount(e.target.value)}
          onBlur={handleLabourCountBlur}
          className="text-center h-8 text-xs p-1"
          min="0"
        />
      </td>
      <td className="border border-border p-1" style={{ width: '96px', minWidth: '96px' }}>
        <Textarea
          value={localWorkPlan}
          onChange={(e) => setLocalWorkPlan(e.target.value)}
          onBlur={handleWorkPlanBlur}
          placeholder="Work plan..."
          className="min-h-[32px] h-auto text-xs p-1 resize-none"
          rows={2}
        />
      </td>
      <td className="border border-border p-1" style={{ width: '96px', minWidth: '96px' }}>
        <Textarea
          value={localWorkCompleted}
          onChange={(e) => setLocalWorkCompleted(e.target.value)}
          onBlur={handleWorkCompletedBlur}
          placeholder="Work completed..."
          className="min-h-[32px] h-auto text-xs p-1 resize-none"
          rows={2}
        />
      </td>
      <td className="border border-border p-1 text-center" style={{ width: '40px', minWidth: '40px' }}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(entry.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
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
      <DialogContent className="p-0 max-w-full max-h-full h-screen w-screen m-0 rounded-none md:max-w-4xl md:max-h-[90vh] md:h-auto md:rounded-lg mobile-tracker-dialog">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-card border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-semibold">Labour Tracker</h2>
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
              <table className="w-full border-collapse" style={{ minWidth: '400px' }}>
                <thead className="sticky top-0 bg-muted z-5">
                  <tr>
                    <th className="border border-border px-2 py-2 text-left text-xs font-semibold" style={{ width: '80px' }}>
                      Date
                    </th>
                    <th className="border border-border px-2 py-2 text-center text-xs font-semibold" style={{ width: '48px' }}>
                      No. of Labour
                    </th>
                    <th className="border border-border px-2 py-2 text-left text-xs font-semibold" style={{ width: '96px' }}>
                      Work Plan
                    </th>
                    <th className="border border-border px-2 py-2 text-left text-xs font-semibold" style={{ width: '96px' }}>
                      Work Completed
                    </th>
                    <th className="border border-border px-2 py-2 text-center text-xs font-semibold" style={{ width: '40px' }}>
                      Delete
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="border border-border p-8 text-center text-muted-foreground text-sm">
                        No entries yet. Click "+ Add Entry" to get started.
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
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-10 bg-card border-t px-4 py-3 space-y-3">
          <div className="flex items-center justify-between bg-destructive/10 p-3 rounded-lg border border-destructive/20">
            <span className="font-semibold text-sm">Total Labour Count:</span>
            <span className="text-xl font-bold text-destructive">{totalLabourCount}</span>
          </div>

          <div className="flex justify-center gap-3">
            <Button onClick={handleAddEntry} className="bg-destructive hover:bg-destructive/90 gap-2">
              <Plus className="h-4 w-4" />
              Add Entry
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
