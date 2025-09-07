import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Search, 
  MoreVertical, 
  Copy, 
  Edit3, 
  Trash2,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Home
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  customerName: string;
  mobile: string;
  address: string;
  type: "Interior" | "Exterior" | "Both";
  totalArea: number;
  estimatedCost: number;
  createdAt: string;
  status: "In Progress" | "Completed" | "Quoted";
}

export default function SavedProjectsScreen() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  // Mock expanded project data
  const [projects] = useState<Project[]>([
    {
      id: "1",
      customerName: "Rajesh Kumar",
      mobile: "9876543210",
      address: "Sector 45, Gurgaon",
      type: "Interior",
      totalArea: 1200,
      estimatedCost: 45000,
      createdAt: "2024-01-15",
      status: "In Progress"
    },
    {
      id: "2",
      customerName: "Priya Sharma",
      mobile: "9876543211",
      address: "Jayanagar, Bangalore",
      type: "Both",
      totalArea: 2500,
      estimatedCost: 85000,
      createdAt: "2024-01-10",
      status: "Completed"
    },
    {
      id: "3",
      customerName: "Amit Singh",
      mobile: "9876543212",
      address: "CP, New Delhi",
      type: "Exterior",
      totalArea: 800,
      estimatedCost: 32000,
      createdAt: "2024-01-08",
      status: "Quoted"
    },
    {
      id: "4",
      customerName: "Sunita Patel",
      mobile: "9876543213",
      address: "Satellite, Ahmedabad",
      type: "Interior",
      totalArea: 1800,
      estimatedCost: 68000,
      createdAt: "2024-01-05",
      status: "Completed"
    },
    {
      id: "5",
      customerName: "Vikram Reddy",
      mobile: "9876543214",
      address: "Banjara Hills, Hyderabad",
      type: "Both",
      totalArea: 3200,
      estimatedCost: 125000,
      createdAt: "2024-01-02",
      status: "In Progress"
    }
  ]);

  const filteredProjects = projects.filter(project =>
    project.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.mobile.includes(searchQuery)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Completed": return "bg-green-100 text-green-800 border-green-200";
      case "Quoted": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleDuplicate = (project: Project) => {
    toast({
      title: "Project Duplicated",
      description: `Created a copy of ${project.customerName}'s project`,
    });
  };

  const handleEdit = (projectId: string) => {
    navigate(`/add-project?edit=${projectId}`);
  };

  const handleDelete = (project: Project) => {
    toast({
      title: "Project Deleted",
      description: `${project.customerName}'s project has been deleted`,
      variant: "destructive"
    });
  };

  const stats = {
    total: projects.length,
    inProgress: projects.filter(p => p.status === "In Progress").length,
    completed: projects.filter(p => p.status === "Completed").length,
    totalValue: projects.reduce((acc, p) => acc + p.estimatedCost, 0)
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="eca-gradient text-white p-4">
        <div className="flex items-center space-x-3 mb-4">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Saved Projects</h1>
            <p className="text-white/80 text-sm">Manage all your projects</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 h-4 w-4" />
          <Input
            placeholder="Search by name, address, or mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:bg-white/30"
          />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="text-center eca-shadow">
            <CardContent className="p-3">
              <Home className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="text-center eca-shadow">
            <CardContent className="p-3">
              <div className="h-4 w-4 bg-yellow-500 rounded-full mx-auto mb-1"></div>
              <p className="text-lg font-bold text-foreground">{stats.inProgress}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
          <Card className="text-center eca-shadow">
            <CardContent className="p-3">
              <div className="h-4 w-4 bg-green-500 rounded-full mx-auto mb-1"></div>
              <p className="text-lg font-bold text-foreground">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card className="text-center eca-shadow">
            <CardContent className="p-3">
              <DollarSign className="h-4 w-4 text-secondary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">₹{(stats.totalValue / 100000).toFixed(1)}L</p>
              <p className="text-xs text-muted-foreground">Total Value</p>
            </CardContent>
          </Card>
        </div>

        {/* Projects List */}
        <div className="space-y-4">
          {filteredProjects.length === 0 ? (
            <Card className="text-center p-8 eca-shadow">
              <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Projects Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try a different search term" : "You haven't created any projects yet"}
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate("/add-project")}>
                  Create New Project
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
                        <h3 className="font-semibold text-foreground text-lg">{project.customerName}</h3>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Phone className="h-3 w-3 mr-1" />
                          {project.mobile}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {project.address}
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/project-summary/${project.id}`)}>
                            <Edit3 className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(project.id)}>
                            <Edit3 className="mr-2 h-4 w-4" />
                            Edit Project
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(project)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(project)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                        <Badge variant="outline">
                          {project.type}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Area</p>
                        <p className="font-semibold text-foreground">{project.totalArea} sq.ft</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Cost</p>
                        <p className="font-semibold text-foreground">₹{project.estimatedCost.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Created</p>
                        <p className="font-semibold text-foreground">
                          {new Date(project.createdAt).toLocaleDateString('en-IN', { 
                            day: 'numeric', 
                            month: 'short' 
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(project.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/project-summary/${project.id}`)}
                        >
                          View
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleEdit(project.id)}
                        >
                          Edit
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

      <div className="h-6"></div>
    </div>
  );
}