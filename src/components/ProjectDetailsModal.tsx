import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Phone, DollarSign, Ruler, CheckCircle2, Send, MessageSquare, Edit2, Save, X } from "lucide-react";

interface ActivityLog {
  id: string;
  activity_type: string;
  activity_message: string;
  created_at: string;
}

interface ProjectDetailsModalProps {
  projectId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProjectDetailsModal({ projectId, open, onOpenChange }: ProjectDetailsModalProps) {
  const { toast } = useToast();
  const [project, setProject] = useState<any>(null);
  const [editedProject, setEditedProject] = useState<any>(null);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [labourData, setLabourData] = useState<any[]>([]);
  const [materialData, setMaterialData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (projectId && open) {
      fetchProjectDetails();
      fetchActivityLog();
      fetchLabourData();
      fetchMaterialData();
    }
  }, [projectId, open]);

  useEffect(() => {
    if (project) {
      setEditedProject({ ...project });
    }
  }, [project]);

  const fetchProjectDetails = async () => {
    if (!projectId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (!error && data) {
      setProject(data);
    }
    setLoading(false);
  };

  const fetchActivityLog = async () => {
    if (!projectId) return;

    const { data, error } = await supabase
      .from('project_activity_log')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setActivityLog(data);
    }
  };

  const fetchLabourData = async () => {
    if (!projectId) return;

    const { data, error } = await supabase
      .from('labour_tracker')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false });

    if (!error && data) {
      setLabourData(data);
    }
  };

  const fetchMaterialData = async () => {
    if (!projectId) return;

    const { data, error } = await supabase
      .from('material_tracker')
      .select('*')
      .eq('project_id', projectId);

    if (!error && data) {
      setMaterialData(data);
    }
  };

  const handleSave = async () => {
    if (!editedProject || !projectId) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          customer_name: editedProject.customer_name,
          phone: editedProject.phone,
          location: editedProject.location,
          quotation_value: parseFloat(editedProject.quotation_value),
          area_sqft: parseFloat(editedProject.area_sqft),
          project_date: editedProject.project_date,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (error) throw error;

      setProject({ ...editedProject });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update project",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditedProject({ ...project });
    setIsEditing(false);
  };

  const totalLabourCount = labourData.reduce((sum, entry) => sum + (entry.labour_count || 0), 0);
  const totalMaterialCost = materialData.reduce((sum, entry) => sum + (entry.total || 0), 0);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'approval_sent':
        return <Send className="h-4 w-4 text-blue-500" />;
      case 'reminder_sent':
        return <MessageSquare className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Calendar className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (!project && !loading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Project Details</DialogTitle>
            {!isEditing ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : project ? (
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-6 pr-4">
              {/* Project Info */}
              <div className="space-y-4">
                {!isEditing ? (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold">{project.customer_name}</h3>
                      <div className="flex gap-2">
                        <Badge variant={project.approval_status === 'Approved' ? 'default' : 'secondary'}>
                          {project.approval_status}
                        </Badge>
                        <Badge variant="outline">{project.project_status}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Customer Name</Label>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{project.customer_name}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Phone</Label>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{project.phone}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Location</Label>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{project.location}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Date</Label>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(project.project_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Labour Count</Label>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{totalLabourCount}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Tasks Completed</Label>
                        <div className="text-sm max-h-20 overflow-y-auto">
                          {labourData.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1">
                              {labourData.map((entry) => (
                                <li key={entry.id} className="text-muted-foreground">
                                  {entry.work_completed || 'No description'}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-muted-foreground">No tasks recorded</span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Material Cost</Label>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>₹{totalMaterialCost.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Quotation Value</Label>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>₹{project.quotation_value.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Area (Sq.ft)</Label>
                        <div className="flex items-center gap-2">
                          <Ruler className="h-4 w-4 text-muted-foreground" />
                          <span>{project.area_sqft} sq.ft</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Lead ID</Label>
                        <span className="font-mono text-sm">{project.lead_id}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Customer Name</Label>
                      <Input
                        value={editedProject?.customer_name || ''}
                        onChange={(e) => setEditedProject({ ...editedProject, customer_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={editedProject?.phone || ''}
                        onChange={(e) => setEditedProject({ ...editedProject, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        value={editedProject?.location || ''}
                        onChange={(e) => setEditedProject({ ...editedProject, location: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={editedProject?.project_date?.split('T')[0] || ''}
                        onChange={(e) => setEditedProject({ ...editedProject, project_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quotation Value</Label>
                      <Input
                        type="number"
                        value={editedProject?.quotation_value || ''}
                        onChange={(e) => setEditedProject({ ...editedProject, quotation_value: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Area (Sq.ft)</Label>
                      <Input
                        type="number"
                        value={editedProject?.area_sqft || ''}
                        onChange={(e) => setEditedProject({ ...editedProject, area_sqft: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Lead ID</Label>
                      <Input
                        value={editedProject?.lead_id || ''}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                )}

                {project.feedback_message && !isEditing && (
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="text-sm font-semibold mb-2">Customer Feedback</h4>
                    <p className="text-sm text-muted-foreground">{project.feedback_message}</p>
                  </div>
                )}
              </div>

              {/* Activity Log */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Activity Log</h4>
                {activityLog.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
                ) : (
                  <div className="space-y-2">
                    {activityLog.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="mt-0.5">{getActivityIcon(log.activity_type)}</div>
                        <div className="flex-1">
                          <p className="text-sm">{log.activity_message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}