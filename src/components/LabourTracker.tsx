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
  const [localWorkCompleted, setLocalWorkCompleted] = useState(entry.work_completed);

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

  const handleWorkCompletedBlur = () => {
    onUpdate(entry.id, "work_completed", localWorkCompleted);
  };

  return (
    <tr className="border-b border-[#e2e8f0] hover:bg-gray-50/50">
      <td className="p-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal bg-[#f9f9f9] border-[#e2e8f0] hover:bg-[#f0f0f0] rounded-lg"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {localDate ? format(new Date(localDate), "MMM dd, yyyy") : "Pick date"}
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
      <td className="p-3">
        <Input
          type="number"
          value={localLabourCount}
          onChange={(e) => setLocalLabourCount(e.target.value)}
          onBlur={handleLabourCountBlur}
          className="bg-[#f9f9f9] border-[#e2e8f0] rounded-lg text-[#2d3748]"
          min="0"
        />
      </td>
      <td className="p-3">
        <Textarea
          value={localWorkCompleted}
          onChange={(e) => setLocalWorkCompleted(e.target.value)}
          onBlur={handleWorkCompletedBlur}
          className="bg-[#f9f9f9] border-[#e2e8f0] rounded-lg text-[#2d3748] min-h-[60px]"
          placeholder="Describe work completed..."
        />
      </td>
      <td className="p-3 text-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(entry.id)}
          className="hover:bg-red-50 hover:text-red-600"
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Labour Tracker
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-[#fff0f5]">
                    <th className="p-3 text-left font-bold text-[#2d3748] border-b border-[#e2e8f0]">
                      Date
                    </th>
                    <th className="p-3 text-left font-bold text-[#2d3748] border-b border-[#e2e8f0]">
                      No. of Labour
                    </th>
                    <th className="p-3 text-left font-bold text-[#2d3748] border-b border-[#e2e8f0]">
                      Work Completed
                    </th>
                    <th className="p-3 text-center font-bold text-[#2d3748] border-b border-[#e2e8f0] w-20">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
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
        </div>

        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center justify-between bg-[#fff0f5] p-4 rounded-lg">
            <span className="font-bold text-[#2d3748]">Total Labour Count:</span>
            <span className="text-2xl font-bold text-primary">{totalLabourCount}</span>
          </div>

          <div className="flex justify-between">
            <Button onClick={handleAddEntry} className="gap-2">
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
