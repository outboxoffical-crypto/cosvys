import { useState, useEffect, useCallback, memo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    <tr className="hover:bg-[#f7fafc] transition-colors relative group">
      <td className="border border-[#e2e8f0] px-2 py-2 min-w-[140px] md:min-w-0">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal border-0 bg-transparent hover:bg-[#f0f0f0] text-xs md:text-sm touch-manipulation"
            >
              <CalendarIcon className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
              <span className="truncate">{localDate ? format(new Date(localDate), "MMM dd, yyyy") : "Pick date"}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={localDate ? new Date(localDate) : undefined}
              onSelect={handleDateChange}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </td>
      <td className="border border-[#e2e8f0] px-2 py-2 min-w-[100px] md:min-w-0">
        <Input
          type="number"
          value={localLabourCount}
          onChange={(e) => setLocalLabourCount(e.target.value)}
          onBlur={handleLabourCountBlur}
          className="border-0 text-center focus-visible:ring-2 focus-visible:ring-primary touch-manipulation text-base md:text-sm min-h-[44px] md:min-h-0"
          min="0"
        />
      </td>
      <td className="border border-[#e2e8f0] px-2 py-2 min-w-[150px] md:min-w-0">
        <Input
          type="text"
          value={localWorkPlan}
          onChange={(e) => setLocalWorkPlan(e.target.value)}
          onBlur={handleWorkPlanBlur}
          placeholder="Work plan..."
          className="border-0 text-center focus-visible:ring-2 focus-visible:ring-primary touch-manipulation text-base md:text-sm min-h-[44px] md:min-h-0"
        />
      </td>
      <td className="border border-[#e2e8f0] px-2 py-2 relative min-w-[150px] md:min-w-0">
        <Input
          type="text"
          value={localWorkCompleted}
          onChange={(e) => setLocalWorkCompleted(e.target.value)}
          onBlur={handleWorkCompletedBlur}
          placeholder="Work completed..."
          className="border-0 text-center focus-visible:ring-2 focus-visible:ring-primary touch-manipulation text-base md:text-sm min-h-[44px] md:min-h-0 pr-10"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(entry.id)}
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 absolute top-1/2 -translate-y-1/2 right-1 touch-manipulation"
        >
          <Trash2 className="h-4 w-4" />
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
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-semibold text-[#2d3748] flex items-center gap-2">
            <Users className="h-5 w-5" />
            Labour Tracker
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)]">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6 touch-pan-x">
                <div className="inline-block min-w-full align-middle">
                  <table className="w-full border-collapse min-w-[600px] md:min-w-[800px]">
                    <thead>
                      <tr className="bg-[#fff0f5]">
                        <th className="border border-[#e2e8f0] px-2 md:px-4 py-3 text-center text-xs md:text-sm font-semibold text-[#2d3748] rounded-tl-lg sticky left-0 bg-[#fff0f5] z-10">
                          Date
                        </th>
                        <th className="border border-[#e2e8f0] px-2 md:px-4 py-3 text-center text-xs md:text-sm font-semibold text-[#2d3748]">
                          No. of Labour
                        </th>
                        <th className="border border-[#e2e8f0] px-2 md:px-4 py-3 text-center text-xs md:text-sm font-semibold text-[#2d3748]">
                          Work Plan
                        </th>
                        <th className="border border-[#e2e8f0] px-2 md:px-4 py-3 text-center text-xs md:text-sm font-semibold text-[#2d3748] rounded-tr-lg">
                          Work Completed
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="border border-[#e2e8f0] p-6 md:p-8 text-center text-muted-foreground text-xs md:text-sm">
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
              </div>
            )}

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between bg-[#fff0f5] p-4 rounded-lg border border-[#e2e8f0]">
                <span className="font-bold text-[#2d3748]">Total Labour Count:</span>
                <span className="text-2xl font-bold text-primary">{totalLabourCount}</span>
              </div>

              <div className="flex justify-center gap-4">
                <Button onClick={handleAddEntry} className="gap-2" variant="outline">
                  <Plus className="h-4 w-4" />
                  Add Entry
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
}
