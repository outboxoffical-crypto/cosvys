import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Calendar, Users, CheckSquare, Package, Ruler } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  lead_id: string;
  customer_name: string;
  phone: string;
  location: string;
  project_type: string;
  quotation_value: number;
  area_sqft: number;
  project_date: string;
  project_status: string;
  approval_status: string;
  created_at: string;
}

export default function ProjectDetailsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("add-project");

  // Check if we're in edit mode from URL params
  const editProjectId = searchParams.get("edit");
  const urlTab = searchParams.get("tab");

  useEffect(() => {
    if (editProjectId) {
      setSelectedProjectId(editProjectId);
      // Set active tab from URL or default to add-project
      setActiveTab(urlTab || "add-project");
    }
  }, [editProjectId, urlTab]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
        return;
      }
      await loadProjects();
    };
    checkAuth();
  }, [navigate]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      console.error('Error loading projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSearchParams({ edit: projectId });
    setActiveTab("add-project");
  };

  const handleBackToList = () => {
    setSelectedProjectId(null);
    setSearchParams({});
    loadProjects();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Show project list view
  if (!selectedProjectId) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="eca-gradient text-white p-4">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Project Details</h1>
              <p className="text-white/80 text-sm">View and edit your projects</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          {projects.length === 0 ? (
            <Card className="eca-shadow">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">No projects found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card key={project.id} className="eca-shadow relative hover:shadow-lg transition-shadow">
                  {/* Edit Icon */}
                  <button
                    onClick={() => handleEditProject(project.id)}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent transition-colors z-10"
                    aria-label="Edit project"
                  >
                    <Edit className="h-5 w-5 text-primary" />
                  </button>

                  <CardHeader>
                    <CardTitle className="text-lg pr-10">{project.customer_name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">{formatDate(project.project_date)}</span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">{project.project_type}</span>
                    </div>

                    <div className="flex items-center text-sm">
                      <Ruler className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">{project.area_sqft} sq.ft</span>
                    </div>

                    <div className="flex items-center text-sm">
                      <span className="font-medium">₹{project.quotation_value.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="pt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        project.project_status === 'Completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {project.project_status}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show tab-based editing view
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="eca-gradient text-white p-4">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={handleBackToList}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Edit Project</h1>
            <p className="text-white/80 text-sm">Update project details and workflow</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="add-project" className="text-xs md:text-sm">
              Add Project
            </TabsTrigger>
            <TabsTrigger value="room-measurement" className="text-xs md:text-sm">
              Room Measurements
            </TabsTrigger>
            <TabsTrigger value="paint-estimation" className="text-xs md:text-sm">
              Paint & Summary
            </TabsTrigger>
            <TabsTrigger value="project-summary" className="text-xs md:text-sm">
              Project Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add-project">
            <Card className="eca-shadow">
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    className="w-full"
                    onClick={() => navigate("/add-project", { state: { projectId: selectedProjectId } })}
                  >
                    Edit Project Details
                  </Button>
                  <div className="pt-4 flex justify-end gap-2">
                    <Button 
                      onClick={() => {
                        setActiveTab("room-measurement");
                        setSearchParams({ edit: selectedProjectId!, tab: "room-measurement" });
                      }}
                      className="w-full"
                    >
                      Continue to Room Measurements
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="room-measurement">
            <Card className="eca-shadow">
              <CardHeader>
                <CardTitle>Room Measurements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    className="w-full"
                    onClick={() => navigate(`/room-measurement/${selectedProjectId}`)}
                  >
                    Open Room Measurements
                  </Button>
                  <div className="pt-4 flex justify-end gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setActiveTab("add-project");
                        setSearchParams({ edit: selectedProjectId!, tab: "add-project" });
                      }}
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={() => {
                        setActiveTab("paint-estimation");
                        setSearchParams({ edit: selectedProjectId!, tab: "paint-estimation" });
                      }}
                    >
                      Continue to Paint Estimation
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paint-estimation">
            <Card className="eca-shadow">
              <CardHeader>
                <CardTitle>Paint Estimation & Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Button 
                      className="w-full"
                      onClick={() => navigate(`/paint-estimation/${selectedProjectId}`)}
                    >
                      Open Paint Estimation
                    </Button>
                    <Button 
                      className="w-full"
                      variant="outline"
                      onClick={() => navigate(`/generate-summary/${selectedProjectId}`)}
                    >
                      Generate Summary
                    </Button>
                  </div>
                  <div className="pt-4 flex justify-end gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setActiveTab("room-measurement");
                        setSearchParams({ edit: selectedProjectId!, tab: "room-measurement" });
                      }}
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={() => {
                        setActiveTab("project-summary");
                        setSearchParams({ edit: selectedProjectId!, tab: "project-summary" });
                      }}
                    >
                      Continue to Project Summary
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="project-summary">
            <Card className="eca-shadow">
              <CardHeader>
                <CardTitle>Project Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    className="w-full"
                    onClick={() => navigate(`/project-summary/${selectedProjectId}`)}
                  >
                    View Project Summary
                  </Button>
                  <div className="pt-4 flex justify-end gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setActiveTab("paint-estimation");
                        setSearchParams({ edit: selectedProjectId!, tab: "paint-estimation" });
                      }}
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={handleBackToList}
                    >
                      Finish & Return to Dashboard
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
