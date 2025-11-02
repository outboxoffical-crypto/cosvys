import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Phone, DollarSign, Ruler, CheckCircle2, Send, MessageSquare } from "lucide-react";

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
  const [project, setProject] = useState<any>(null);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projectId && open) {
      fetchProjectDetails();
      fetchActivityLog();
    }
  }, [projectId, open]);

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
          <DialogTitle>Project Details</DialogTitle>
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
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">{project.customer_name}</h3>
                  <div className="flex gap-2">
                    <Badge variant={project.approval_status === 'Approved' ? 'default' : 'secondary'}>
                      {project.approval_status}
                    </Badge>
                    <Badge variant="outline">{project.project_status}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{project.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{project.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>₹{project.quotation_value.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <span>{project.area_sqft} sq.ft</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(project.project_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Lead ID:</span>
                    <span className="font-mono">{project.lead_id}</span>
                  </div>
                </div>

                {project.feedback_message && (
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