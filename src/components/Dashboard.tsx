import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Settings
} from "lucide-react";
import asianPaintsLogo from "@/assets/asian-paints-logo.png";

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

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Mock project data
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
    }
  ]);

  const filteredProjects = projects.filter(project =>
    project.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Completed": return "bg-green-100 text-green-800 border-green-200";
      case "Quoted": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
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
              <p className="text-white/80 text-sm">Welcome back, User!</p>
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
              <p className="text-2xl font-bold text-foreground">₹1.6L</p>
              <p className="text-sm text-muted-foreground">Total Value</p>
            </CardContent>
          </Card>
          <Card className="text-center eca-shadow">
            <CardContent className="p-4">
              <Ruler className="h-6 w-6 text-accent-foreground mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">4.5K</p>
              <p className="text-sm text-muted-foreground">Total Sq.Ft</p>
            </CardContent>
          </Card>
        </div>

        {/* New Project Button */}
        <Button 
          onClick={() => navigate("/add-project")}
          className="w-full h-14 text-base font-medium eca-shadow"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          New Project
        </Button>

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

          {filteredProjects.length === 0 ? (
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
                <Card key={project.id} className="eca-shadow hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{project.customerName}</h3>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Phone className="h-3 w-3 mr-1" />
                          {project.mobile}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {project.address}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline" className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{project.type}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">₹{project.estimatedCost.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{project.totalArea} sq.ft</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(project.createdAt).toLocaleDateString()}
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/project-summary/${project.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}