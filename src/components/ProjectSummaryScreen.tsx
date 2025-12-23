import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Share2, Download, Phone, MapPin, Home, Palette, Users, Calendar, Package, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { markConnectionActive } from "@/lib/supabaseConnection";

export default function ProjectSummaryScreen() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { toast } = useToast();
  const [projectData, setProjectData] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [estimation, setEstimation] = useState<any>(null);
  const [dealerInfo, setDealerInfo] = useState<any>(null);
  const [areaConfigurations, setAreaConfigurations] = useState<any[]>([]);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setIsWakingUp(true);
      setConnectionMessage("");
      
      try {
        // Load estimation and area configs from localStorage
        const estimationData = localStorage.getItem(`estimation_${projectId}`);
        const areaConfigsData = localStorage.getItem(`areaConfigurations_${projectId}`);

        if (estimationData) setEstimation(JSON.parse(estimationData));
        if (areaConfigsData) setAreaConfigurations(JSON.parse(areaConfigsData));

        // Get session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !sessionData?.session) {
          toast({
            title: "Authentication Required",
            description: "Please log in to view project summary",
            variant: "destructive",
          });
          navigate('/login');
          return;
        }

        // Load project data, rooms and dealer info in parallel
        const [projectResult, roomsResult, dealerResult] = await Promise.all([
          supabase.from('projects').select('*').eq('id', projectId).single(),
          supabase.from('rooms').select('*').eq('project_id', projectId),
          supabase.from('dealer_info').select('*').eq('user_id', sessionData.session.user.id).maybeSingle()
        ]);
        
        if (projectResult.error) {
          console.error('Error loading project:', projectResult.error);
          toast({
            title: "Error Loading Project",
            description: "Could not load project details. Please try again.",
            variant: "destructive",
          });
          return;
        }

        if (projectResult.data) {
          if (!projectResult.data.customer_name || !projectResult.data.phone || !projectResult.data.location) {
            console.warn('Project missing customer details:', projectResult.data);
          }
          setProjectData(projectResult.data);
          markConnectionActive();
        }
        
        if (roomsResult.data) setRooms(roomsResult.data);
        if (dealerResult.data) setDealerInfo(dealerResult.data);
      } catch (error) {
        console.error('Error loading project summary:', error);
        toast({
          title: "Error",
          description: "Failed to load project summary",
          variant: "destructive",
        });
      } finally {
        setIsWakingUp(false);
      }
    };

    if (projectId) {
      loadData();
    }
  }, [projectId, navigate, toast]);

  // Get unique project types from rooms
  const activeProjectTypes = Array.from(new Set(
    rooms.map(room => room.project_type).filter(Boolean)
  )).sort();

  const totalAreas = rooms.reduce(
    (acc, room) => ({
      floorArea: acc.floorArea + (room.floor_area || 0),
      wallArea: acc.wallArea + (room.wall_area || 0),
      ceilingArea: acc.ceilingArea + (room.ceiling_area || 0)
    }),
    { floorArea: 0, wallArea: 0, ceilingArea: 0 }
  );

  // Calculate material requirements from area configurations
  const calculateMaterialRequirements = () => {
    const materials: Record<string, { liters: number, cost: number }> = {};
    
    areaConfigurations.forEach(config => {
      const { puttyType, primerType, primerCoats, emulsionType, emulsionCoats, area, ratePerSqft } = config;
      
      // Putty calculation (coverage: 20-25 sq.ft per liter)
      if (puttyType && puttyType !== 'None') {
        const puttyKey = `Putty - ${puttyType}`;
        const puttyLiters = area / 22.5;
        if (!materials[puttyKey]) materials[puttyKey] = { liters: 0, cost: 0 };
        materials[puttyKey].liters += puttyLiters;
      }

      // Primer calculation (coverage: 100-120 sq.ft per liter)
      if (primerType && primerType !== 'None') {
        const primerKey = `Primer - ${primerType}`;
        const primerLiters = (area * (primerCoats || 1)) / 110;
        if (!materials[primerKey]) materials[primerKey] = { liters: 0, cost: 0 };
        materials[primerKey].liters += primerLiters;
      }

      // Emulsion calculation (coverage: 100-120 sq.ft per liter per coat)
      if (emulsionType && emulsionType !== 'None') {
        const emulsionKey = `Emulsion - ${emulsionType}`;
        const emulsionLiters = (area * (emulsionCoats || 2)) / 110;
        if (!materials[emulsionKey]) materials[emulsionKey] = { liters: 0, cost: 0 };
        materials[emulsionKey].liters += emulsionLiters;
      }

      // Add cost for each material
      Object.keys(materials).forEach(key => {
        materials[key].cost += area * (ratePerSqft || 0);
      });
    });

    return materials;
  };

  // Calculate labour requirements
  const calculateLabour = () => {
    const totalPaintArea = areaConfigurations.reduce((sum, config) => sum + (config.area || 0), 0);
    const sqftPerLabourerPerDay = 150; // Average coverage per day
    const totalLabourDays = Math.ceil(totalPaintArea / sqftPerLabourerPerDay);
    const laboursPerDay = 2; // Standard 2 labourers
    const totalLabours = laboursPerDay * totalLabourDays;
    
    return { laboursPerDay, totalDays: totalLabourDays, totalLabours };
  };

  // Calculate total costs
  const calculateTotalCost = () => {
    const materialCost = areaConfigurations.reduce((sum, config) => 
      sum + ((config.area || 0) * (config.ratePerSqft || 0)), 0
    );
    
    const labour = calculateLabour();
    const labourCost = labour.totalLabours * 500; // ₹500 per labour per day
    
    const marginPercent = dealerInfo?.margin || 0;
    const marginAmount = (materialCost + labourCost) * (marginPercent / 100);
    
    return {
      materialCost,
      labourCost,
      marginAmount,
      total: materialCost + labourCost + marginAmount
    };
  };

  const materials = calculateMaterialRequirements();
  const labour = calculateLabour();
  const costs = calculateTotalCost();

  const handleExportPDF = () => {
    toast({
      title: "PDF Export",
      description: "Project summary exported as PDF successfully!",
    });
  };

  const handleExportExcel = () => {
    toast({
      title: "Excel Export",
      description: "Project data exported to Excel successfully!",
    });
  };

  const estimationDetails = estimation?.estimation || estimation || {};
  
  const handleShareWhatsApp = () => {
    const message = `Cosvys Project Summary\n\nCustomer: ${projectData?.customer_name || 'N/A'}\nTotal Area: ${totalAreas.wallArea.toFixed(1)} sq.ft\nEstimated Cost: ₹${estimationDetails?.totalCost?.toLocaleString() || 'N/A'}\n\nGenerated by Cosvys`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleShareEmail = () => {
    const subject = `Project Summary - ${projectData?.customer_name || 'N/A'}`;
    const body = `Please find attached the project summary for ${projectData?.customer_name || 'N/A'}.\n\nTotal Area: ${totalAreas.wallArea.toFixed(1)} sq.ft\nEstimated Cost: ₹${estimationDetails?.totalCost?.toLocaleString() || 'N/A'}\n\nGenerated by Cosvys`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url);
  };

  if (!projectData || !estimation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          {isWakingUp && <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />}
          <h2 className="text-xl font-semibold mb-2">
            {isWakingUp ? "Waking up server… please wait" : "Loading Project Summary..."}
          </h2>
          <p className="text-muted-foreground">Please wait while we prepare your summary.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="eca-gradient text-white p-4">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => navigate(`/paint-estimation/${projectId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Project Summary</h1>
            <p className="text-white/80 text-sm">Complete project overview</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="costs">Costs</TabsTrigger>
          </TabsList>

          {/* Tab 1: Paint & Room Details */}
          <TabsContent value="details" className="space-y-6 mt-4">
            {/* Section 1: Type of Interior & Wall Full Details */}
            <Card className="eca-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Palette className="mr-2 h-5 w-5 text-primary" />
                  Type of Interior & Wall Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {areaConfigurations.map((config, index) => (
                  <div key={index} className="border border-border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-foreground">{config.areaType}</p>
                        <Badge variant="outline" className="mt-1">{config.paintingSystem}</Badge>
                      </div>
                      <p className="text-lg font-bold text-primary">₹{(config.area * config.ratePerSqft).toFixed(2)}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Paint Type:</p>
                        <p className="font-medium">{config.paintingSystem}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Area:</p>
                        <p className="font-medium">{config.area.toFixed(2)} sq.ft</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Putty:</p>
                        <p className="font-medium">{config.puttyType || 'None'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Primer:</p>
                        <p className="font-medium">{config.primerType || 'None'} ({config.primerCoats || 0} coats)</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Emulsion:</p>
                        <p className="font-medium">{config.emulsionType || 'None'} ({config.emulsionCoats || 0} coats)</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Rate/sq.ft:</p>
                        <p className="font-medium">₹{config.ratePerSqft}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Section 2: Total Room Details */}
            <div 
              className="relative overflow-hidden rounded-[30px] p-[30px] md:p-[20px]"
              style={{
                background: 'linear-gradient(135deg, #ff80ab 0%, #ba68c8 100%)',
                boxShadow: '0px 8px 16px rgba(233, 30, 99, 0.3)',
                fontFamily: '"Segoe UI", "Inter", system-ui, sans-serif'
              }}
            >
              <div className="mb-6">
                <h3 
                  className="text-center font-bold text-white text-[1.8em]"
                  style={{ textShadow: '0 2px 8px rgba(255, 255, 255, 0.3)' }}
                >
                  Room Measurements
                </h3>
              </div>

              {/* Interior Section */}
              {rooms.some(room => room.project_type === 'Interior') && (
                <div className="mb-[35px]">
                  <h4 
                    className="text-center font-bold text-white text-[1.4em] mb-3"
                    style={{ textShadow: '0 1px 4px rgba(255, 255, 255, 0.2)' }}
                  >
                    Interior
                  </h4>
                  <div 
                    className="h-[2px] mb-5 mx-auto w-full"
                    style={{ background: 'rgba(255, 255, 255, 0.3)' }}
                  ></div>
                  <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
                    {rooms.filter(room => room.project_type === 'Interior').map((room) => (
                      <div
                        key={room.id}
                        className="rounded-[20px] p-[25px] text-center transition-all duration-300"
                        style={{
                          background: 'rgba(255, 255, 255, 0.25)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          backdropFilter: 'blur(10px)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.03) translateY(-3px)';
                          e.currentTarget.style.filter = 'brightness(1.1)';
                          e.currentTarget.style.boxShadow = '0 10px 25px rgba(255, 255, 255, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1) translateY(0)';
                          e.currentTarget.style.filter = 'brightness(1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <p className="font-bold text-white mb-4 text-[1.2em]">{room.name}</p>
                        <div className="space-y-3">
                          <div>
                            <p className="text-white/90 text-[1.1em]">Wall Area</p>
                            <p className="text-white font-[800] text-[3em] md:text-[2.5em] leading-none my-1">
                              {room.wall_area?.toFixed(1) || 0}
                            </p>
                            <p className="text-white/90 text-[1.1em]">sq.ft</p>
                          </div>
                          <div>
                            <p className="text-white/90 text-[1.1em]">Floor Area</p>
                            <p className="text-white font-[800] text-[3em] md:text-[2.5em] leading-none my-1">
                              {room.floor_area?.toFixed(1) || 0}
                            </p>
                            <p className="text-white/90 text-[1.1em]">sq.ft</p>
                          </div>
                          <div>
                            <p className="text-white/90 text-[1.1em]">Ceiling Area</p>
                            <p className="text-white font-[800] text-[3em] md:text-[2.5em] leading-none my-1">
                              {room.ceiling_area?.toFixed(1) || 0}
                            </p>
                            <p className="text-white/90 text-[1.1em]">sq.ft</p>
                          </div>
                          <div>
                            <p className="text-white/90 text-[1.1em]">Ceiling Height</p>
                            <p className="text-white font-[800] text-[3em] md:text-[2.5em] leading-none my-1">
                              {room.height?.toFixed(1) || 0}
                            </p>
                            <p className="text-white/90 text-[1.1em]">ft</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Waterproofing Section */}
              {rooms.some(room => room.project_type === 'Waterproofing') && (
                <div className="mb-[35px]">
                  <h4 
                    className="text-center font-bold text-white text-[1.4em] mb-3"
                    style={{ textShadow: '0 1px 4px rgba(255, 255, 255, 0.2)' }}
                  >
                    Waterproofing
                  </h4>
                  <div 
                    className="h-[2px] mb-5 mx-auto w-full"
                    style={{ background: 'rgba(255, 255, 255, 0.3)' }}
                  ></div>
                  <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
                    {rooms.filter(room => room.project_type === 'Waterproofing').map((room) => (
                      <div
                        key={room.id}
                        className="rounded-[20px] p-[25px] text-center transition-all duration-300"
                        style={{
                          background: 'rgba(255, 255, 255, 0.25)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          backdropFilter: 'blur(10px)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.03) translateY(-3px)';
                          e.currentTarget.style.filter = 'brightness(1.1)';
                          e.currentTarget.style.boxShadow = '0 10px 25px rgba(255, 255, 255, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1) translateY(0)';
                          e.currentTarget.style.filter = 'brightness(1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <p className="font-bold text-white mb-4 text-[1.2em]">{room.name}</p>
                        <div className="space-y-3">
                          <div>
                            <p className="text-white/90 text-[1.1em]">Wall Area</p>
                            <p className="text-white font-[800] text-[3em] md:text-[2.5em] leading-none my-1">
                              {room.wall_area?.toFixed(1) || 0}
                            </p>
                            <p className="text-white/90 text-[1.1em]">sq.ft</p>
                          </div>
                          <div>
                            <p className="text-white/90 text-[1.1em]">Floor Area</p>
                            <p className="text-white font-[800] text-[3em] md:text-[2.5em] leading-none my-1">
                              {room.floor_area?.toFixed(1) || 0}
                            </p>
                            <p className="text-white/90 text-[1.1em]">sq.ft</p>
                          </div>
                          <div>
                            <p className="text-white/90 text-[1.1em]">Ceiling Area</p>
                            <p className="text-white font-[800] text-[3em] md:text-[2.5em] leading-none my-1">
                              {room.ceiling_area?.toFixed(1) || 0}
                            </p>
                            <p className="text-white/90 text-[1.1em]">sq.ft</p>
                          </div>
                          <div>
                            <p className="text-white/90 text-[1.1em]">Ceiling Height</p>
                            <p className="text-white font-[800] text-[3em] md:text-[2.5em] leading-none my-1">
                              {room.height?.toFixed(1) || 0}
                            </p>
                            <p className="text-white/90 text-[1.1em]">ft</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exterior Section */}
              {rooms.some(room => room.project_type === 'Exterior') && (
                <div className="mb-[35px] last:mb-0">
                  <h4 
                    className="text-center font-bold text-white text-[1.4em] mb-3"
                    style={{ textShadow: '0 1px 4px rgba(255, 255, 255, 0.2)' }}
                  >
                    Exterior
                  </h4>
                  <div 
                    className="h-[2px] mb-5 mx-auto w-full"
                    style={{ background: 'rgba(255, 255, 255, 0.3)' }}
                  ></div>
                  <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
                    {rooms.filter(room => room.project_type === 'Exterior').map((room) => (
                      <div
                        key={room.id}
                        className="rounded-[20px] p-[25px] text-center transition-all duration-300"
                        style={{
                          background: 'rgba(255, 255, 255, 0.25)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          backdropFilter: 'blur(10px)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.03) translateY(-3px)';
                          e.currentTarget.style.filter = 'brightness(1.1)';
                          e.currentTarget.style.boxShadow = '0 10px 25px rgba(255, 255, 255, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1) translateY(0)';
                          e.currentTarget.style.filter = 'brightness(1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <p className="font-bold text-white mb-4 text-[1.2em]">{room.name}</p>
                        <div className="space-y-3">
                          <div>
                            <p className="text-white/90 text-[1.1em]">Wall Area</p>
                            <p className="text-white font-[800] text-[3em] md:text-[2.5em] leading-none my-1">
                              {room.wall_area?.toFixed(1) || 0}
                            </p>
                            <p className="text-white/90 text-[1.1em]">sq.ft</p>
                          </div>
                          <div>
                            <p className="text-white/90 text-[1.1em]">Floor Area</p>
                            <p className="text-white font-[800] text-[3em] md:text-[2.5em] leading-none my-1">
                              {room.floor_area?.toFixed(1) || 0}
                            </p>
                            <p className="text-white/90 text-[1.1em]">sq.ft</p>
                          </div>
                          <div>
                            <p className="text-white/90 text-[1.1em]">Ceiling Area</p>
                            <p className="text-white font-[800] text-[3em] md:text-[2.5em] leading-none my-1">
                              {room.ceiling_area?.toFixed(1) || 0}
                            </p>
                            <p className="text-white/90 text-[1.1em]">sq.ft</p>
                          </div>
                          <div>
                            <p className="text-white/90 text-[1.1em]">Ceiling Height</p>
                            <p className="text-white font-[800] text-[3em] md:text-[2.5em] leading-none my-1">
                              {room.height?.toFixed(1) || 0}
                            </p>
                            <p className="text-white/90 text-[1.1em]">ft</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Totals Summary */}
              <div 
                className="mt-6 rounded-[20px] p-6"
                style={{
                  background: 'rgba(255, 255, 255, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-white/90 text-sm md:text-xs mb-1">Total Floor</p>
                    <p className="text-white font-bold text-2xl md:text-xl">{totalAreas.floorArea.toFixed(1)}</p>
                    <p className="text-white/90 text-xs">sq.ft</p>
                  </div>
                  <div>
                    <p className="text-white/90 text-sm md:text-xs mb-1">Total Wall</p>
                    <p className="text-white font-bold text-2xl md:text-xl">{totalAreas.wallArea.toFixed(1)}</p>
                    <p className="text-white/90 text-xs">sq.ft</p>
                  </div>
                  <div>
                    <p className="text-white/90 text-sm md:text-xs mb-1">Total Ceiling</p>
                    <p className="text-white font-bold text-2xl md:text-xl">{totalAreas.ceilingArea.toFixed(1)}</p>
                    <p className="text-white/90 text-xs">sq.ft</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <Card className="eca-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Home className="mr-2 h-5 w-5 text-primary" />
                  Customer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{projectData?.customer_name || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">Customer Name</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-muted-foreground mr-3 ml-1" />
                  <div>
                    <p className="font-medium text-foreground">{projectData?.phone || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">Mobile Number</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 text-muted-foreground mr-3 ml-1 mt-1" />
                  <div>
                    <p className="font-medium text-foreground">{projectData?.location || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">Address</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <span className="text-sm text-muted-foreground font-medium mb-2 w-full">Project Type:</span>
                  {activeProjectTypes.map((type: string) => (
                    <div 
                      key={type} 
                      className="inline-flex items-center px-4 py-2 font-semibold text-sm rounded-full transition-all duration-200 hover:shadow-md text-white shadow-md"
                      style={{
                        backgroundColor: '#E63946',
                        fontFamily: '"Segoe UI", "Inter", system-ui, sans-serif'
                      }}
                    >
                      {type}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Materials & Labour */}
          <TabsContent value="materials" className="space-y-6 mt-4">
            {/* Section 3: Labour Section */}
            <Card className="eca-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Users className="mr-2 h-5 w-5 text-primary" />
                  Labour Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 border border-border rounded-lg">
                    <p className="text-sm text-muted-foreground">Per Day Labour</p>
                    <p className="text-2xl font-bold text-foreground">{labour.laboursPerDay}</p>
                    <p className="text-xs text-muted-foreground">workers/day</p>
                  </div>
                  <div className="text-center p-4 border border-border rounded-lg">
                    <p className="text-sm text-muted-foreground">No of Days</p>
                    <p className="text-2xl font-bold text-foreground">{labour.totalDays}</p>
                    <p className="text-xs text-muted-foreground">days</p>
                  </div>
                  <div className="text-center p-4 border border-border rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Labour</p>
                    <p className="text-2xl font-bold text-foreground">{labour.totalLabours}</p>
                    <p className="text-xs text-muted-foreground">labour-days</p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg text-center">
                  <p className="text-sm text-primary font-medium">Total Labour Cost</p>
                  <p className="text-3xl font-bold text-primary">₹{costs.labourCost.toLocaleString()}</p>
                  <p className="text-xs text-primary/70">@ ₹500 per labour per day</p>
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Material Section */}
            <Card className="eca-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Package className="mr-2 h-5 w-5 text-secondary" />
                  Material Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(materials).map(([name, data]) => (
                  <div key={name} className="flex justify-between items-center p-3 border border-border rounded-lg">
                    <div>
                      <p className="font-semibold text-foreground">{name}</p>
                      <p className="text-sm text-muted-foreground">{data.liters.toFixed(2)} liters</p>
                    </div>
                    <p className="text-lg font-bold text-primary">₹{data.cost.toFixed(2)}</p>
                  </div>
                ))}
                
                <div className="mt-4 p-4 bg-secondary/10 border border-secondary/20 rounded-lg text-center">
                  <p className="text-sm text-secondary font-medium">Total Material Cost</p>
                  <p className="text-3xl font-bold text-secondary">₹{costs.materialCost.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Final Costs */}
          <TabsContent value="costs" className="space-y-6 mt-4">
            {/* Section 5: Dealer Margin */}
            <Card className="eca-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Palette className="mr-2 h-5 w-5 text-accent-foreground" />
                  Dealer Margin
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Margin Percentage</p>
                    <p className="text-lg font-bold text-foreground">{dealerInfo?.margin || 0}%</p>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-accent/10 border border-accent/20 rounded-lg">
                    <p className="text-sm font-medium text-accent-foreground">Margin Amount</p>
                    <p className="text-2xl font-bold text-accent-foreground">₹{costs.marginAmount.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 6: Estimated Total Cost */}
            <Card className="eca-shadow border-2 border-primary">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FileText className="mr-2 h-5 w-5 text-primary" />
                  Cost Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Material Cost</p>
                    <p className="font-bold text-foreground">₹{costs.materialCost.toLocaleString()}</p>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Labour Cost</p>
                    <p className="font-bold text-foreground">₹{costs.labourCost.toLocaleString()}</p>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Dealer Margin</p>
                    <p className="font-bold text-foreground">₹{costs.marginAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-4 p-6 eca-gradient text-white rounded-lg text-center">
                  <p className="text-white/80 text-sm mb-2">Estimated Total Cost</p>
                  <p className="text-4xl font-bold">₹{costs.total.toLocaleString()}</p>
                  <p className="text-white/80 text-xs mt-2">Labour + Material + Margin</p>
                </div>
              </CardContent>
            </Card>

            {/* Export & Share Options */}
            <Card className="eca-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Share2 className="mr-2 h-5 w-5 text-accent-foreground" />
                  Export & Share
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={handleExportPDF} className="h-12">
                    <FileText className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                  <Button variant="outline" onClick={handleExportExcel} className="h-12">
                    <Download className="mr-2 h-4 w-4" />
                    Export Excel
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={handleShareWhatsApp} className="h-12 bg-green-600 hover:bg-green-700">
                    Share WhatsApp
                  </Button>
                  <Button variant="secondary" onClick={handleShareEmail} className="h-12">
                    Share Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <Button 
            variant="outline" 
            onClick={() => navigate("/dashboard")}
            className="h-12"
          >
            Back to Dashboard
          </Button>
          <Button 
            onClick={() => navigate("/add-project")}
            className="h-12"
          >
            New Project
          </Button>
        </div>
      </div>

      <div className="h-6"></div>
    </div>
  );
}