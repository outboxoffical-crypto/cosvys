import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ProjectDetailsModal from "./ProjectDetailsModal";
import { MaterialTracker } from "./MaterialTracker";
import { LabourTracker } from "./LabourTracker";
import { LeadSummaryBox } from "./LeadSummaryBox";
import { format } from "date-fns";
import { 
  Plus, 
  Search, 
  Home, 
  Calendar, 
  DollarSign, 
  Ruler,
  MapPin,
  Phone,
  MoreVertical,
  Settings,
  Package,
  CheckCircle2,
  Bell,
  Users,
  Edit2,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Clock
} from "lucide-react";
import asianPaintsLogo from "@/assets/asian-paints-logo.png";

interface Project {
  id: string;
  lead_id: string;
  customer_name: string;
  phone: string;
  location: string;
  project_type: string;
  project_status: string;
  quotation_value: number;
  area_sqft: number;
  project_date: string;
  approval_status: string;
  reminder_sent: boolean;
  notification_count: number;
  created_at: string;
  start_date?: string | null;
  end_date?: string | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [dealerInfo, setDealerInfo] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [materialTrackerOpen, setMaterialTrackerOpen] = useState(false);
  const [materialTrackerProjectId, setMaterialTrackerProjectId] = useState<string | null>(null);
  const [labourTrackerOpen, setLabourTrackerOpen] = useState(false);
  const [labourTrackerProjectId, setLabourTrackerProjectId] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [leadStats, setLeadStats] = useState({ total: 0, converted: 0, dropped: 0, pending: 0 });

  useEffect(() => {
    const stored = localStorage.getItem('dealerInfo');
    if (stored) {
      setDealerInfo(JSON.parse(stored));
    }
    fetchProjects();
    fetchLeadStats();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('projects-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        fetchProjects();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  const fetchLeadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('leads')
        .select('status, approval_status')
        .eq('user_id', user.id);

      if (error) throw error;

      const total = data?.length || 0;
      const converted = data?.filter(l => l.status === 'Converted').length || 0;
      const dropped = data?.filter(l => l.status === 'Dropped').length || 0;
      const pending = data?.filter(l => l.approval_status === 'Pending').length || 0;

      setLeadStats({ total, converted, dropped, pending });
    } catch (error) {
      console.error('Error fetching lead stats:', error);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApproval = async (projectId: string) => {
    try {
      // Get the project to log activity
      const { data: project } = await supabase
        .from('projects')
        .select('customer_name')
        .eq('id', projectId)
        .single();

      // Update project status to Approved
      const { error: updateError } = await supabase
        .from('projects')
        .update({ 
          approval_status: 'Approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (updateError) throw updateError;

      // Log activity
      await supabase
        .from('project_activity_log')
        .insert({
          project_id: projectId,
          activity_type: 'approval_simulated',
          activity_message: `Project approved for ${project?.customer_name || 'customer'}`,
        });

      toast({
        title: "Success",
        description: "Project Approved Successfully",
      });
    } catch (error: any) {
      console.error('Error approving project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve project",
        variant: "destructive",
      });
    }
  };

  const handleReminder = async (projectId: string) => {
    const companyName = dealerInfo?.shopName || "Asian Paints ECA Pro";
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase.functions.invoke('send-reminder-sms', {
        body: { projectId, companyName },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reminder SMS sent successfully",
      });
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send reminder SMS",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (projectId: string) => {
    setSelectedProjectId(projectId);
    setDetailsModalOpen(true);
  };

  const handleOpenMaterialTracker = (projectId: string) => {
    setMaterialTrackerProjectId(projectId);
    setMaterialTrackerOpen(true);
  };

  const handleOpenLabourTracker = (projectId: string) => {
    setLabourTrackerProjectId(projectId);
    setLabourTrackerOpen(true);
  };

  const handleDateUpdate = async (projectId: string, dateField: 'start_date' | 'end_date', date: Date | undefined) => {
    if (!date) return;
    
    try {
      const { error } = await supabase
        .from('projects')
        .update({ 
          [dateField]: date.toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${dateField === 'start_date' ? 'Start' : 'End'} date updated successfully`,
      });
    } catch (error: any) {
      console.error('Error updating date:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update date",
        variant: "destructive",
      });
    }
  };

  const calculateDuration = (startDate?: string | null, endDate?: string | null) => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Completed": return "bg-green-100 text-green-800 border-green-200";
      case "Quoted": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const totalValue = projects.reduce((sum, p) => sum + p.quotation_value, 0);
  const totalArea = projects.reduce((sum, p) => sum + p.area_sqft, 0);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="eca-gradient text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <img 
              src={asianPaintsLogo} 
              alt="Asian Paints" 
              className="h-8 w-auto object-contain"
            />
            <div>
              <h1 className="text-xl font-semibold">ECA Pro</h1>
              <p className="text-white/80 text-sm">
                {dealerInfo ? `${dealerInfo.shopName} • ${dealerInfo.dealerName}` : 'Welcome back, User!'}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => navigate("/settings")}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 h-4 w-4" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:bg-white/30"
          />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center eca-shadow">
            <CardContent className="p-4">
              <Home className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{projects.length}</p>
              <p className="text-sm text-muted-foreground">Total Projects</p>
            </CardContent>
          </Card>
          <Card className="text-center eca-shadow">
            <CardContent className="p-4">
              <DollarSign className="h-6 w-6 text-secondary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">₹{(totalValue / 100000).toFixed(1)}L</p>
              <p className="text-sm text-muted-foreground">Total Value</p>
            </CardContent>
          </Card>
          <Card className="text-center eca-shadow">
            <CardContent className="p-4">
              <Ruler className="h-6 w-6 text-accent-foreground mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{(totalArea / 1000).toFixed(1)}K</p>
              <p className="text-sm text-muted-foreground">Total Sq.Ft</p>
            </CardContent>
          </Card>
        </div>


        {/* Quick Actions - Horizontal Scroll */}
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-4 mb-6 min-w-min">
            <Card className="eca-shadow min-w-[280px] max-w-[280px] cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/add-project")}>
              <CardContent className="p-5 flex flex-col items-center justify-center h-[180px]">
                <div className="bg-primary/10 p-3 rounded-full mb-3">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-base font-semibold">New Project</h3>
              </CardContent>
            </Card>
            
            <Card className="eca-shadow min-w-[280px] max-w-[280px] cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/dealer-pricing")}>
              <CardContent className="p-5 flex flex-col items-center justify-center h-[180px]">
                <div className="bg-secondary/10 p-3 rounded-full mb-3">
                  <Package className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-base font-semibold">Manage Pricing</h3>
              </CardContent>
            </Card>

            <Card className="eca-shadow min-w-[280px] max-w-[280px] cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/lead-book")}>
              <CardContent className="p-5 flex flex-col items-center justify-center h-[180px]">
                <div className="bg-accent/10 p-3 rounded-full mb-3">
                  <BookOpen className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="text-base font-semibold">Lead Summary</h3>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Projects List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Recent Projects</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/saved-projects")}
            >
              View All
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <Card className="text-center p-8 eca-shadow">
              <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Projects Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try a different search term" : "Create your first project to get started"}
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate("/add-project")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="eca-shadow hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{project.customer_name}</h3>
                          {project.approval_status === 'Approved' && (
                            <Badge className="bg-green-500 text-white">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Approved
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Phone className="h-3 w-3 mr-1" />
                          {project.phone}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {project.location}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                              onClick={() => navigate(`/project-details?edit=${project.id}`)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit Project</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => handleViewDetails(project.id)}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View Details</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline" className={getStatusColor(project.project_status)}>
                          {project.project_status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{project.project_type}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">₹{project.quotation_value.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{project.area_sqft} sq.ft</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(project.project_date).toLocaleDateString()}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {project.approval_status !== 'Approved' ? (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="h-8 px-3 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                  onClick={() => handleApproval(project.id)}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Send approval request</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="h-8 px-3 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200 relative"
                                  onClick={() => handleReminder(project.id)}
                                >
                                  <Bell className="h-3.5 w-3.5" />
                                  {project.notification_count > 0 && (
                                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                      {project.notification_count}
                                    </span>
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Send reminder</TooltipContent>
                            </Tooltip>
                          </>
                        ) : (
                          <>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mr-2">
                              <div className="flex items-center gap-2">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 text-xs bg-[#f9f9f9] border-[#e2e8f0] hover:bg-[#f0f0f0] rounded-lg"
                                    >
                                      <Calendar className="h-3 w-3 mr-1" />
                                      {project.start_date ? format(new Date(project.start_date), "MMM dd") : "Start Date"}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <CalendarComponent
                                      mode="single"
                                      selected={project.start_date ? new Date(project.start_date) : undefined}
                                      onSelect={(date) => handleDateUpdate(project.id, 'start_date', date)}
                                      initialFocus
                                      className="pointer-events-auto"
                                    />
                                  </PopoverContent>
                                </Popover>

                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 text-xs bg-[#f9f9f9] border-[#e2e8f0] hover:bg-[#f0f0f0] rounded-lg"
                                    >
                                      <Calendar className="h-3 w-3 mr-1" />
                                      {project.end_date ? format(new Date(project.end_date), "MMM dd") : "End Date"}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <CalendarComponent
                                      mode="single"
                                      selected={project.end_date ? new Date(project.end_date) : undefined}
                                      onSelect={(date) => handleDateUpdate(project.id, 'end_date', date)}
                                      initialFocus
                                      className="pointer-events-auto"
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>

                              {project.start_date && project.end_date && (
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  Duration: {calculateDuration(project.start_date, project.end_date)} days
                                </span>
                              )}
                            </div>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="h-8 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                                  onClick={() => handleOpenMaterialTracker(project.id)}
                                >
                                  <Package className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Material Tracker</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="h-8 px-3 bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200"
                                  onClick={() => handleOpenLabourTracker(project.id)}
                                >
                                  <Users className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Labour Tracker</TooltipContent>
                            </Tooltip>
                          </>
                        )}

                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewDetails(project.id)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <ProjectDetailsModal 
        projectId={selectedProjectId}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
      />

      {materialTrackerProjectId && (
        <MaterialTracker
          projectId={materialTrackerProjectId}
          isOpen={materialTrackerOpen}
          onClose={() => {
            setMaterialTrackerOpen(false);
            setMaterialTrackerProjectId(null);
          }}
        />
      )}

      {labourTrackerProjectId && (
        <LabourTracker
          projectId={labourTrackerProjectId}
          isOpen={labourTrackerOpen}
          onClose={() => {
            setLabourTrackerOpen(false);
            setLabourTrackerProjectId(null);
          }}
        />
      )}
    </div>
    </TooltipProvider>
  );
}