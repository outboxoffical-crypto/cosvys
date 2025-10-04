import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Palette, Calculator, DollarSign, Settings, Plus, Minus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface CoverageData {
  id: string;
  category: string;
  product_name: string;
  coats: string;
  coverage_range: string;
  surface_type?: string;
  notes?: string;
}

interface QuantityCalculation {
  minQuantity: number;
  maxQuantity: number;
  recommendedQuantity: number;
  unit: string;
}

export default function PaintEstimationScreen() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [selectedPaintType, setSelectedPaintType] = useState<"Interior Paint" | "Exterior Paint" | "Waterproofing">("Interior Paint");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedCoats, setSelectedCoats] = useState<string>("2 coat");
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [totalArea, setTotalArea] = useState<number>(0);
  const [coverageData, setCoverageData] = useState<CoverageData[]>([]);
  const [quantityCalculation, setQuantityCalculation] = useState<QuantityCalculation | null>(null);
  const [estimation, setEstimation] = useState({
    wallArea: 0,
    ceilingArea: 0,
    totalArea: 0,
    litersRequired: 0,
    totalCost: 0,
    coats: 2
  });
  const [searchTerm, setSearchTerm] = useState("");
  
  // Painting system states for Wall Area
  const [paintingSystem, setPaintingSystem] = useState<"Fresh Painting" | "Repainting" | null>(null);
  const [systemDialogOpen, setSystemDialogOpen] = useState(false);
  const [coatConfiguration, setCoatConfiguration] = useState({
    putty: 0,
    primer: 0,
    emulsion: 0
  });
  const [repaintingConfiguration, setRepaintingConfiguration] = useState({
    primer: 0,
    emulsion: 0
  });
  const [selectedMaterials, setSelectedMaterials] = useState({
    putty: "",
    primer: "",
    emulsion: ""
  });
  
  // Painting system states for Ceiling Area
  const [ceilingPaintingSystem, setCeilingPaintingSystem] = useState<"Fresh Painting" | "Repainting" | null>(null);
  const [ceilingSystemDialogOpen, setCeilingSystemDialogOpen] = useState(false);
  const [ceilingCoatConfiguration, setCeilingCoatConfiguration] = useState({
    putty: 0,
    primer: 0,
    emulsion: 0
  });
  const [ceilingRepaintingConfiguration, setCeilingRepaintingConfiguration] = useState({
    primer: 0,
    emulsion: 0
  });
  const [ceilingSelectedMaterials, setCeilingSelectedMaterials] = useState({
    putty: "",
    primer: "",
    emulsion: ""
  });
  
  // Enamel states for Door & Window
  const [enamellArea, setEnamelArea] = useState<number>(0);
  const [enamelPrimer, setEnamelPrimer] = useState<string>("");
  const [enamelPrimerCoats, setEnamelPrimerCoats] = useState<number>(0);
  const [enamelType, setEnamelType] = useState<string>("");
  const [enamelCoats, setEnamelCoats] = useState<number>(0);
  const [enamelDialogOpen, setEnamelDialogOpen] = useState(false);
  
  // Per Sq.ft Rate
  const [perSqFtRate, setPerSqFtRate] = useState<string>("");

  // Fetch coverage data from database
  useEffect(() => {
    fetchCoverageData();
  }, []);

  const fetchCoverageData = async () => {
    try {
      const { data, error } = await supabase
        .from('coverage_data')
        .select('*')
        .order('product_name');
      
      if (error) {
        console.error('Error fetching coverage data:', error);
        toast.error('Failed to load coverage data');
        return;
      }
      
      setCoverageData(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load coverage data');
    }
  };

  // Parse coverage range to get min and max values
  const parseCoverageRange = (coverageRange: string) => {
    const match = coverageRange.match(/(\d+(?:\.\d+)?)[–-](\d+(?:\.\d+)?)\s*sq\.ft\s*per\s*(ltr|kg)/);
    if (match) {
      return {
        min: parseFloat(match[1]),
        max: parseFloat(match[2]),
        unit: match[3]
      };
    }
    
    // Handle single values like "25 sq.ft per ltr"
    const singleMatch = coverageRange.match(/(\d+(?:\.\d+)?)\s*sq\.ft\s*per\s*(ltr|kg)/);
    if (singleMatch) {
      const value = parseFloat(singleMatch[1]);
      return {
        min: value,
        max: value,
        unit: singleMatch[2]
      };
    }
    
    return null;
  };

  // Calculate quantity based on area and coverage
  const calculateQuantity = (area: number, selectedProductName: string, coats: string) => {
    const productData = coverageData.find(
      item => item.product_name === selectedProductName && item.coats === coats
    );
    
    if (!productData) return null;
    
    const coverage = parseCoverageRange(productData.coverage_range);
    if (!coverage) return null;
    
    const minQuantity = Math.ceil(area / coverage.max); // Use max coverage for min quantity
    const maxQuantity = Math.ceil(area / coverage.min); // Use min coverage for max quantity
    const recommendedQuantity = Math.ceil(area / coverage.min); // Conservative estimate
    
    return {
      minQuantity,
      maxQuantity,
      recommendedQuantity,
      unit: coverage.unit
    };
  };

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const { data: roomsData, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('project_id', projectId);
        
        if (error) {
          console.error('Error loading rooms:', error);
          return;
        }
        
        if (roomsData && roomsData.length > 0) {
          const roomData = roomsData.map(room => ({
            id: room.room_id,
            name: room.name,
            selectedAreas: (typeof room.selected_areas === 'object' && room.selected_areas !== null) ? 
              room.selected_areas as any : { floor: true, wall: true, ceiling: false },
            adjustedWallArea: Number(room.adjusted_wall_area),
            wallArea: Number(room.wall_area),
            ceilingArea: Number(room.ceiling_area),
            doorWindowGrills: Array.isArray(room.door_window_grills) ? room.door_window_grills : [],
            totalDoorWindowGrillArea: Number(room.total_door_window_grill_area)
          }));
          
          setRooms(roomData);
          
          // Extract selected area types from all rooms and calculate total area
          const selectedAreaTypes = new Set<string>();
          let wallArea = 0;
          let ceilingArea = 0;
          let enamelTotalArea = 0;
          
          roomData.forEach((room: any) => {
            if (room.selectedAreas) {
              if (room.selectedAreas.wall) {
                selectedAreaTypes.add('Wall');
                wallArea += room.adjustedWallArea || room.wallArea || 0;
              }
              if (room.selectedAreas.ceiling) {
                selectedAreaTypes.add('Ceiling');
                ceilingArea += room.ceilingArea || 0;
              }
              if (room.selectedAreas.floor) selectedAreaTypes.add('Floor');
            }
            // Calculate total enamel area from doorWindowGrills
            if (room.doorWindowGrills && room.doorWindowGrills.length > 0) {
              enamelTotalArea += room.totalDoorWindowGrillArea || 0;
            }
          });
          
          setSelectedAreas(Array.from(selectedAreaTypes));
          const total = wallArea + ceilingArea;
          setTotalArea(total);
          setEnamelArea(enamelTotalArea);
          setEstimation(prev => ({
            ...prev,
            wallArea,
            ceilingArea,
            totalArea: total
          }));
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    
    loadRooms();
  }, [projectId]);

  // Update quantity calculation when product, coats, or area changes
  useEffect(() => {
    if (selectedProduct && totalArea > 0) {
      const calculation = calculateQuantity(totalArea, selectedProduct, selectedCoats);
      setQuantityCalculation(calculation);
    } else {
      setQuantityCalculation(null);
    }
  }, [selectedProduct, selectedCoats, coverageData, totalArea]);

  // Get available coat options for selected product
  const getAvailableCoats = (productName: string) => {
    const coatOptions = coverageData
      .filter(item => item.product_name === productName)
      .map(item => item.coats)
      .filter((value, index, self) => self.indexOf(value) === index);
    return coatOptions;
  };

  // Get unique products for selected category
  const getUniqueProducts = () => {
    return coverageData
      .filter(item => item.category === selectedPaintType)
      .map(item => item.product_name)
      .filter((value, index, self) => self.indexOf(value) === index)
      .filter(name => searchTerm === "" || name.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const handleContinue = () => {
    if (paintingSystem && perSqFtRate) {
      const totalCost = estimation.wallArea * parseFloat(perSqFtRate);
      
      // Build coats description
      let coatsDescription = '';
      if (paintingSystem === "Fresh Painting") {
        const coatParts = [];
        if (coatConfiguration.putty > 0 && selectedMaterials.putty) {
          coatParts.push(`${coatConfiguration.putty} coats of ${selectedMaterials.putty}`);
        }
        if (coatConfiguration.primer > 0 && selectedMaterials.primer) {
          coatParts.push(`${coatConfiguration.primer} coats of ${selectedMaterials.primer}`);
        }
        if (coatConfiguration.emulsion > 0 && selectedMaterials.emulsion) {
          coatParts.push(`${coatConfiguration.emulsion} coats of ${selectedMaterials.emulsion}`);
        }
        coatsDescription = coatParts.join(' + ');
      } else {
        const coatParts = [];
        if (repaintingConfiguration.primer > 0 && selectedMaterials.primer) {
          coatParts.push(`${repaintingConfiguration.primer} coats of ${selectedMaterials.primer}`);
        }
        if (repaintingConfiguration.emulsion > 0 && selectedMaterials.emulsion) {
          coatParts.push(`${repaintingConfiguration.emulsion} coats of ${selectedMaterials.emulsion}`);
        }
        coatsDescription = coatParts.join(' + ');
      }
      
      const estimationData = {
        paintType: selectedMaterials.emulsion,
        paintingSystem: paintingSystem,
        coatsDescription: coatsDescription,
        wallAreaSqFt: estimation.wallArea,
        perSqFtRate: parseFloat(perSqFtRate),
        totalCost: totalCost
      };
      localStorage.setItem(`estimation_${projectId}`, JSON.stringify(estimationData));
      navigate(`/project-summary/${projectId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="eca-gradient text-white p-4">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => navigate(`/room-measurement/${projectId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Paint Estimation</h1>
            <p className="text-white/80 text-sm">Select paint & calculate cost</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Paint Type Selection */}
        <Card className="eca-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Palette className="mr-2 h-5 w-5 text-primary" />
              Paint Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={selectedPaintType === "Interior Paint" ? "default" : "outline"}
                onClick={() => {
                  setSelectedPaintType("Interior Paint");
                  setSelectedProduct("");
                  setSearchTerm("");
                }}
                className="h-12 text-sm"
              >
                Interior Paint
              </Button>
              <Button
                variant={selectedPaintType === "Exterior Paint" ? "default" : "outline"}
                onClick={() => {
                  setSelectedPaintType("Exterior Paint");
                  setSelectedProduct("");
                  setSearchTerm("");
                }}
                className="h-12 text-sm"
              >
                Exterior Paint
              </Button>
              <Button
                variant={selectedPaintType === "Waterproofing" ? "default" : "outline"}
                onClick={() => {
                  setSelectedPaintType("Waterproofing");
                  setSelectedProduct("");
                  setSearchTerm("");
                }}
                className="h-12 text-sm"
              >
                Waterproofing
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Paint Configuration Display - Shows after Wall Area configuration */}
        {paintingSystem && (
          <Card className="eca-shadow border-2 border-primary/30">
            <CardHeader>
              <CardTitle className="text-lg">Paint Configuration Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Paint Type */}
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Paint Type</p>
                <p className="font-medium">{selectedMaterials.emulsion || "Not selected"}</p>
              </div>

              {/* Painting System */}
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Painting System</p>
                <p className="font-medium">{paintingSystem}</p>
              </div>

              {/* Coats Configuration */}
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Coats</p>
                <p className="font-medium text-sm">
                  {paintingSystem === "Fresh Painting" ? (
                    <>
                      {coatConfiguration.putty > 0 && `${coatConfiguration.putty} coats of ${selectedMaterials.putty || 'putty'}`}
                      {coatConfiguration.putty > 0 && coatConfiguration.primer > 0 && ' + '}
                      {coatConfiguration.primer > 0 && `${coatConfiguration.primer} coats of ${selectedMaterials.primer || 'primer'}`}
                      {coatConfiguration.primer > 0 && coatConfiguration.emulsion > 0 && ' + '}
                      {coatConfiguration.emulsion > 0 && `${coatConfiguration.emulsion} coats of ${selectedMaterials.emulsion || 'emulsion'}`}
                    </>
                  ) : (
                    <>
                      {repaintingConfiguration.primer > 0 && `${repaintingConfiguration.primer} coats of ${selectedMaterials.primer || 'primer'}`}
                      {repaintingConfiguration.primer > 0 && repaintingConfiguration.emulsion > 0 && ' + '}
                      {repaintingConfiguration.emulsion > 0 && `${repaintingConfiguration.emulsion} coats of ${selectedMaterials.emulsion || 'emulsion'}`}
                    </>
                  )}
                </p>
              </div>

              {/* Wall Area Sq.ft */}
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Wall Area Sq.ft</p>
                <p className="font-medium text-xl">{estimation.wallArea.toFixed(2)}</p>
              </div>

              {/* Per Sq.ft Rate */}
              <div className="space-y-2">
                <Label>Per Sq.ft Rate (₹)</Label>
                <Input
                  type="number"
                  placeholder="Enter rate per sq.ft"
                  value={perSqFtRate}
                  onChange={(e) => setPerSqFtRate(e.target.value)}
                  className="h-12 text-lg"
                />
              </div>

              {/* Total Amount */}
              {perSqFtRate && (
                <div className="bg-primary/10 rounded-lg p-4 border-2 border-primary">
                  <p className="text-xs text-muted-foreground mb-1">Total Amount of Site</p>
                  <p className="font-bold text-2xl text-primary">
                    ₹ {(estimation.wallArea * parseFloat(perSqFtRate)).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {estimation.wallArea.toFixed(2)} sq.ft × ₹{perSqFtRate}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Area Summary */}
        {rooms.length > 0 && (
          <Card className="eca-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Area to be Painted</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedAreas.length === 0 ? (
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    No areas selected for painting
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Please go back to Room Measurements and select Wall, Ceiling, or Floor areas
                  </p>
                </div>
              ) : selectedAreas.length === 1 ? (
                <div className="space-y-4">
                  {selectedAreas[0] === 'Wall' ? (
                    <Dialog open={systemDialogOpen} onOpenChange={setSystemDialogOpen}>
                      <DialogTrigger asChild>
                        <div className="bg-muted rounded-lg p-4 cursor-pointer hover:bg-muted/80 transition-colors border-2 border-dashed border-primary/30 hover:border-primary/50">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <Settings className="h-4 w-4 text-primary" />
                              <p className="text-sm font-medium text-primary">
                                {paintingSystem ? `${paintingSystem} System` : 'Select Painting System'}
                              </p>
                            </div>
                            <p className="text-3xl font-bold text-foreground">
                              {estimation.wallArea.toFixed(1)}
                            </p>
                            <p className="text-sm text-muted-foreground">sq.ft (Wall Area)</p>
                            {paintingSystem && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                Click to modify system
                              </div>
                            )}
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Select Painting System</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              variant={paintingSystem === "Fresh Painting" ? "default" : "outline"}
                              onClick={() => setPaintingSystem("Fresh Painting")}
                              className="h-20 flex flex-col items-center justify-center text-center"
                            >
                              <div>
                                <p className="font-medium">Fresh Painting</p>
                                <p className="text-xs opacity-80">Complete system</p>
                              </div>
                            </Button>
                            <Button
                              variant={paintingSystem === "Repainting" ? "default" : "outline"}
                              onClick={() => setPaintingSystem("Repainting")}
                              className="h-20 flex flex-col items-center justify-center text-center"
                            >
                              <div>
                                <p className="font-medium">Repainting</p>
                                <p className="text-xs opacity-80">Refresh system</p>
                              </div>
                            </Button>
                          </div>

                          {paintingSystem === "Fresh Painting" && (
                            <div className="bg-muted rounded-lg p-4 space-y-4">
                              <h4 className="font-medium text-sm">Fresh Painting Configuration</h4>
                              
                              {/* Putty Section */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium">Putty Coats</Label>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setCoatConfiguration(prev => ({ 
                                        ...prev, 
                                        putty: Math.max(0, prev.putty - 1) 
                                      }))}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center font-medium">
                                      {coatConfiguration.putty}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setCoatConfiguration(prev => ({ 
                                        ...prev, 
                                        putty: Math.min(5, prev.putty + 1) 
                                      }))}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <Select 
                                  value={selectedMaterials.putty} 
                                  onValueChange={(value) => setSelectedMaterials(prev => ({...prev, putty: value}))}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select putty type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {coverageData
                                      .filter(item => item.category === "Putty")
                                      .map(item => item.product_name)
                                      .filter((value, index, self) => self.indexOf(value) === index)
                                      .map((puttyName) => (
                                        <SelectItem key={puttyName} value={puttyName}>
                                          {puttyName}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Primer Section */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium">Primer Coats</Label>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setCoatConfiguration(prev => ({ 
                                        ...prev, 
                                        primer: Math.max(0, prev.primer - 1) 
                                      }))}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center font-medium">
                                      {coatConfiguration.primer}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setCoatConfiguration(prev => ({ 
                                        ...prev, 
                                        primer: Math.min(5, prev.primer + 1) 
                                      }))}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <Select 
                                  value={selectedMaterials.primer} 
                                  onValueChange={(value) => setSelectedMaterials(prev => ({...prev, primer: value}))}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select primer type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {coverageData
                                      .filter(item => item.category === "Primer")
                                      .map(item => item.product_name)
                                      .filter((value, index, self) => self.indexOf(value) === index)
                                      .map((primerName) => (
                                        <SelectItem key={primerName} value={primerName}>
                                          {primerName}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Emulsion Section */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium">Emulsion Coats</Label>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setCoatConfiguration(prev => ({ 
                                        ...prev, 
                                        emulsion: Math.max(0, prev.emulsion - 1) 
                                      }))}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center font-medium">
                                      {coatConfiguration.emulsion}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setCoatConfiguration(prev => ({ 
                                        ...prev, 
                                        emulsion: Math.min(5, prev.emulsion + 1) 
                                      }))}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <Select 
                                  value={selectedMaterials.emulsion} 
                                  onValueChange={(value) => setSelectedMaterials(prev => ({...prev, emulsion: value}))}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select emulsion type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {coverageData
                                      .filter(item => item.category === "Interior Paint")
                                      .map(item => item.product_name)
                                      .filter((value, index, self) => self.indexOf(value) === index)
                                      .map((emulsionName) => (
                                        <SelectItem key={emulsionName} value={emulsionName}>
                                          {emulsionName}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="bg-primary/10 rounded p-2 mt-3">
                                <p className="text-xs text-primary font-medium">
                                  Total: {coatConfiguration.putty + coatConfiguration.primer + coatConfiguration.emulsion} coats
                                </p>
                              </div>
                            </div>
                          )}

                          {paintingSystem === "Repainting" && (
                            <div className="bg-muted rounded-lg p-4 space-y-4">
                              <h4 className="font-medium text-sm">Repainting Configuration</h4>
                              
                              {/* Primer Section */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium">Primer Coats</Label>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setRepaintingConfiguration(prev => ({ 
                                        ...prev, 
                                        primer: Math.max(0, prev.primer - 1) 
                                      }))}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center font-medium">
                                      {repaintingConfiguration.primer}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setRepaintingConfiguration(prev => ({ 
                                        ...prev, 
                                        primer: Math.min(5, prev.primer + 1) 
                                      }))}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <Select 
                                  value={selectedMaterials.primer} 
                                  onValueChange={(value) => setSelectedMaterials(prev => ({...prev, primer: value}))}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select primer type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {coverageData
                                      .filter(item => item.category === "Primer")
                                      .map(item => item.product_name)
                                      .filter((value, index, self) => self.indexOf(value) === index)
                                      .map((primerName) => (
                                        <SelectItem key={primerName} value={primerName}>
                                          {primerName}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Emulsion Section */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium">Emulsion Coats</Label>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setRepaintingConfiguration(prev => ({ 
                                        ...prev, 
                                        emulsion: Math.max(0, prev.emulsion - 1) 
                                      }))}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center font-medium">
                                      {repaintingConfiguration.emulsion}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setRepaintingConfiguration(prev => ({ 
                                        ...prev, 
                                        emulsion: Math.min(5, prev.emulsion + 1) 
                                      }))}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <Select 
                                  value={selectedMaterials.emulsion} 
                                  onValueChange={(value) => setSelectedMaterials(prev => ({...prev, emulsion: value}))}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select emulsion type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {coverageData
                                      .filter(item => item.category === "Interior Paint")
                                      .map(item => item.product_name)
                                      .filter((value, index, self) => self.indexOf(value) === index)
                                      .map((emulsionName) => (
                                        <SelectItem key={emulsionName} value={emulsionName}>
                                          {emulsionName}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="bg-primary/10 rounded p-2 mt-3">
                                <p className="text-xs text-primary font-medium">
                                  Total: {repaintingConfiguration.primer + repaintingConfiguration.emulsion} coats
                                </p>
                              </div>
                            </div>
                          )}

                          <Button 
                            onClick={() => setSystemDialogOpen(false)}
                            className="w-full"
                            disabled={!paintingSystem}
                          >
                            Apply System
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <div className="bg-muted rounded-lg p-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          {selectedAreas[0]} Area
                        </p>
                        <p className="text-3xl font-bold text-foreground">
                          {selectedAreas[0] === 'Ceiling' ? estimation.ceilingArea.toFixed(1) : estimation.ceilingArea.toFixed(1)}
                        </p>
                        <p className="text-sm text-muted-foreground">sq.ft</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {selectedAreas.includes('Wall') && (
                    <Dialog open={systemDialogOpen} onOpenChange={setSystemDialogOpen}>
                      <DialogTrigger asChild>
                        <div className="bg-muted rounded-lg p-4 cursor-pointer hover:bg-muted/80 transition-colors border-2 border-dashed border-primary/30 hover:border-primary/50">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Settings className="h-3 w-3 text-primary" />
                              <p className="text-xs font-medium text-primary">
                                {paintingSystem ? paintingSystem : 'Select System'}
                              </p>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{estimation.wallArea.toFixed(1)}</p>
                            <p className="text-xs text-muted-foreground">Wall Area</p>
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Select Painting System</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              variant={paintingSystem === "Fresh Painting" ? "default" : "outline"}
                              onClick={() => setPaintingSystem("Fresh Painting")}
                              className="h-20 flex flex-col items-center justify-center text-center"
                            >
                              <div>
                                <p className="font-medium">Fresh Painting</p>
                                <p className="text-xs opacity-80">Complete system</p>
                              </div>
                            </Button>
                            <Button
                              variant={paintingSystem === "Repainting" ? "default" : "outline"}
                              onClick={() => setPaintingSystem("Repainting")}
                              className="h-20 flex flex-col items-center justify-center text-center"
                            >
                              <div>
                                <p className="font-medium">Repainting</p>
                                <p className="text-xs opacity-80">Refresh system</p>
                              </div>
                            </Button>
                          </div>

                          {paintingSystem === "Fresh Painting" && (
                            <div className="bg-muted rounded-lg p-4 space-y-4">
                              <h4 className="font-medium text-sm">Fresh Painting Configuration</h4>
                              
                              {/* Putty Section */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium">Putty Coats</Label>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setCoatConfiguration(prev => ({ 
                                        ...prev, 
                                        putty: Math.max(0, prev.putty - 1) 
                                      }))}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center font-medium">
                                      {coatConfiguration.putty}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setCoatConfiguration(prev => ({ 
                                        ...prev, 
                                        putty: Math.min(5, prev.putty + 1) 
                                      }))}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <Select 
                                  value={selectedMaterials.putty} 
                                  onValueChange={(value) => setSelectedMaterials(prev => ({...prev, putty: value}))}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select putty type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {coverageData
                                      .filter(item => item.category === "Putty")
                                      .map(item => item.product_name)
                                      .filter((value, index, self) => self.indexOf(value) === index)
                                      .map((puttyName) => (
                                        <SelectItem key={puttyName} value={puttyName}>
                                          {puttyName}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Primer Section */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium">Primer Coats</Label>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setCoatConfiguration(prev => ({ 
                                        ...prev, 
                                        primer: Math.max(0, prev.primer - 1) 
                                      }))}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center font-medium">
                                      {coatConfiguration.primer}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setCoatConfiguration(prev => ({ 
                                        ...prev, 
                                        primer: Math.min(5, prev.primer + 1) 
                                      }))}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <Select 
                                  value={selectedMaterials.primer} 
                                  onValueChange={(value) => setSelectedMaterials(prev => ({...prev, primer: value}))}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select primer type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {coverageData
                                      .filter(item => item.category === "Primer")
                                      .map(item => item.product_name)
                                      .filter((value, index, self) => self.indexOf(value) === index)
                                      .map((primerName) => (
                                        <SelectItem key={primerName} value={primerName}>
                                          {primerName}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Emulsion Section */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium">Emulsion Coats</Label>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setCoatConfiguration(prev => ({ 
                                        ...prev, 
                                        emulsion: Math.max(0, prev.emulsion - 1) 
                                      }))}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center font-medium">
                                      {coatConfiguration.emulsion}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setCoatConfiguration(prev => ({ 
                                        ...prev, 
                                        emulsion: Math.min(5, prev.emulsion + 1) 
                                      }))}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <Select 
                                  value={selectedMaterials.emulsion} 
                                  onValueChange={(value) => setSelectedMaterials(prev => ({...prev, emulsion: value}))}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select emulsion type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {coverageData
                                      .filter(item => item.category === "Interior Paint")
                                      .map(item => item.product_name)
                                      .filter((value, index, self) => self.indexOf(value) === index)
                                      .map((emulsionName) => (
                                        <SelectItem key={emulsionName} value={emulsionName}>
                                          {emulsionName}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="bg-primary/10 rounded p-2 mt-3">
                                <p className="text-xs text-primary font-medium">
                                  Total: {coatConfiguration.putty + coatConfiguration.primer + coatConfiguration.emulsion} coats
                                </p>
                              </div>
                            </div>
                          )}

                          {paintingSystem === "Repainting" && (
                            <div className="bg-muted rounded-lg p-4 space-y-4">
                              <h4 className="font-medium text-sm">Repainting Configuration</h4>
                              
                              {/* Primer Section */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium">Primer Coats</Label>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setRepaintingConfiguration(prev => ({ 
                                        ...prev, 
                                        primer: Math.max(0, prev.primer - 1) 
                                      }))}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center font-medium">
                                      {repaintingConfiguration.primer}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setRepaintingConfiguration(prev => ({ 
                                        ...prev, 
                                        primer: Math.min(5, prev.primer + 1) 
                                      }))}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <Select 
                                  value={selectedMaterials.primer} 
                                  onValueChange={(value) => setSelectedMaterials(prev => ({...prev, primer: value}))}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select primer type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {coverageData
                                      .filter(item => item.category === "Primer")
                                      .map(item => item.product_name)
                                      .filter((value, index, self) => self.indexOf(value) === index)
                                      .map((primerName) => (
                                        <SelectItem key={primerName} value={primerName}>
                                          {primerName}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Emulsion Section */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium">Emulsion Coats</Label>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setRepaintingConfiguration(prev => ({ 
                                        ...prev, 
                                        emulsion: Math.max(0, prev.emulsion - 1) 
                                      }))}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center font-medium">
                                      {repaintingConfiguration.emulsion}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setRepaintingConfiguration(prev => ({ 
                                        ...prev, 
                                        emulsion: Math.min(5, prev.emulsion + 1) 
                                      }))}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <Select 
                                  value={selectedMaterials.emulsion} 
                                  onValueChange={(value) => setSelectedMaterials(prev => ({...prev, emulsion: value}))}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select emulsion type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {coverageData
                                      .filter(item => item.category === "Interior Paint")
                                      .map(item => item.product_name)
                                      .filter((value, index, self) => self.indexOf(value) === index)
                                      .map((emulsionName) => (
                                        <SelectItem key={emulsionName} value={emulsionName}>
                                          {emulsionName}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="bg-primary/10 rounded p-2 mt-3">
                                <p className="text-xs text-primary font-medium">
                                  Total: {repaintingConfiguration.primer + repaintingConfiguration.emulsion} coats
                                </p>
                              </div>
                            </div>
        )}

        {/* Application System Summary */}
        {paintingSystem && (
          <Card className="eca-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Settings className="mr-2 h-5 w-5 text-primary" />
                Application System
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium mb-3">{paintingSystem} Configuration</h4>
                
                {paintingSystem === "Fresh Painting" ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Putty:</span>
                      <span className="font-medium">
                        {coatConfiguration.putty} coat{coatConfiguration.putty > 1 ? 's' : ''} 
                        {selectedMaterials.putty && ` (${selectedMaterials.putty})`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Primer:</span>
                      <span className="font-medium">
                        {coatConfiguration.primer} coat{coatConfiguration.primer > 1 ? 's' : ''} 
                        {selectedMaterials.primer && ` (${selectedMaterials.primer})`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Emulsion:</span>
                      <span className="font-medium">
                        {coatConfiguration.emulsion} coat{coatConfiguration.emulsion > 1 ? 's' : ''} 
                        {selectedMaterials.emulsion && ` (${selectedMaterials.emulsion})`}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <div className="flex justify-between font-medium">
                        <span>Total Coats:</span>
                        <span>{coatConfiguration.putty + coatConfiguration.primer + coatConfiguration.emulsion}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Primer:</span>
                      <span className="font-medium">
                        {repaintingConfiguration.primer} coat{repaintingConfiguration.primer > 1 ? 's' : ''} 
                        {selectedMaterials.primer && ` (${selectedMaterials.primer})`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Emulsion:</span>
                      <span className="font-medium">
                        {repaintingConfiguration.emulsion} coat{repaintingConfiguration.emulsion > 1 ? 's' : ''} 
                        {selectedMaterials.emulsion && ` (${selectedMaterials.emulsion})`}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <div className="flex justify-between font-medium">
                        <span>Total Coats:</span>
                        <span>{repaintingConfiguration.primer + repaintingConfiguration.emulsion}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

                          <Button 
                            onClick={() => setSystemDialogOpen(false)}
                            className="w-full"
                            disabled={!paintingSystem}
                          >
                            Apply System
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  {selectedAreas.includes('Ceiling') && (
                    <Dialog open={ceilingSystemDialogOpen} onOpenChange={setCeilingSystemDialogOpen}>
                      <DialogTrigger asChild>
                        <div className="bg-muted rounded-lg p-4 cursor-pointer hover:bg-muted/80 transition-colors border-2 border-dashed border-primary/30 hover:border-primary/50">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Settings className="h-3 w-3 text-primary" />
                              <p className="text-xs font-medium text-primary">
                                {ceilingPaintingSystem ? ceilingPaintingSystem : 'Select System'}
                              </p>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{estimation.ceilingArea.toFixed(1)}</p>
                            <p className="text-xs text-muted-foreground">Ceiling Area</p>
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Select Ceiling Painting System</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              variant={ceilingPaintingSystem === "Fresh Painting" ? "default" : "outline"}
                              onClick={() => setCeilingPaintingSystem("Fresh Painting")}
                              className="h-20 flex flex-col items-center justify-center text-center"
                            >
                              <div>
                                <p className="font-medium">Fresh Painting</p>
                                <p className="text-xs opacity-80">Complete system</p>
                              </div>
                            </Button>
                            <Button
                              variant={ceilingPaintingSystem === "Repainting" ? "default" : "outline"}
                              onClick={() => setCeilingPaintingSystem("Repainting")}
                              className="h-20 flex flex-col items-center justify-center text-center"
                            >
                              <div>
                                <p className="font-medium">Repainting</p>
                                <p className="text-xs opacity-80">Refresh system</p>
                              </div>
                            </Button>
                          </div>

                          {ceilingPaintingSystem === "Fresh Painting" && (
                            <div className="bg-muted rounded-lg p-4 space-y-4">
                              <h4 className="font-medium text-sm">Fresh Painting Configuration</h4>
                              
                              {/* Putty Section */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium">Putty Coats</Label>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setCeilingCoatConfiguration(prev => ({ 
                                        ...prev, 
                                        putty: Math.max(0, prev.putty - 1) 
                                      }))}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center font-medium">
                                      {ceilingCoatConfiguration.putty}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setCeilingCoatConfiguration(prev => ({ 
                                        ...prev, 
                                        putty: Math.min(5, prev.putty + 1) 
                                      }))}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <Select 
                                  value={ceilingSelectedMaterials.putty} 
                                  onValueChange={(value) => setCeilingSelectedMaterials(prev => ({...prev, putty: value}))}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select putty type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {coverageData
                                      .filter(item => item.category === "Putty")
                                      .map(item => item.product_name)
                                      .filter((value, index, self) => self.indexOf(value) === index)
                                      .map((puttyName) => (
                                        <SelectItem key={puttyName} value={puttyName}>
                                          {puttyName}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Primer Section */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium">Primer Coats</Label>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setCeilingCoatConfiguration(prev => ({ 
                                        ...prev, 
                                        primer: Math.max(0, prev.primer - 1) 
                                      }))}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center font-medium">
                                      {ceilingCoatConfiguration.primer}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setCeilingCoatConfiguration(prev => ({ 
                                        ...prev, 
                                        primer: Math.min(5, prev.primer + 1) 
                                      }))}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <Select 
                                  value={ceilingSelectedMaterials.primer} 
                                  onValueChange={(value) => setCeilingSelectedMaterials(prev => ({...prev, primer: value}))}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select primer type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {coverageData
                                      .filter(item => item.category === "Primer")
                                      .map(item => item.product_name)
                                      .filter((value, index, self) => self.indexOf(value) === index)
                                      .map((primerName) => (
                                        <SelectItem key={primerName} value={primerName}>
                                          {primerName}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Emulsion Section */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium">Emulsion Coats</Label>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setCeilingCoatConfiguration(prev => ({ 
                                        ...prev, 
                                        emulsion: Math.max(0, prev.emulsion - 1) 
                                      }))}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center font-medium">
                                      {ceilingCoatConfiguration.emulsion}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setCeilingCoatConfiguration(prev => ({ 
                                        ...prev, 
                                        emulsion: Math.min(5, prev.emulsion + 1) 
                                      }))}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <Select 
                                  value={ceilingSelectedMaterials.emulsion} 
                                  onValueChange={(value) => setCeilingSelectedMaterials(prev => ({...prev, emulsion: value}))}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select emulsion type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {coverageData
                                      .filter(item => item.category === "Interior Paint")
                                      .map(item => item.product_name)
                                      .filter((value, index, self) => self.indexOf(value) === index)
                                      .map((emulsionName) => (
                                        <SelectItem key={emulsionName} value={emulsionName}>
                                          {emulsionName}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="bg-primary/10 rounded p-2 mt-3">
                                <p className="text-xs text-primary font-medium">
                                  Total: {ceilingCoatConfiguration.putty + ceilingCoatConfiguration.primer + ceilingCoatConfiguration.emulsion} coats
                                </p>
                              </div>
                            </div>
                          )}

                          {ceilingPaintingSystem === "Repainting" && (
                            <div className="bg-muted rounded-lg p-4 space-y-4">
                              <h4 className="font-medium text-sm">Repainting Configuration</h4>
                              
                              {/* Primer Section */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium">Primer Coats</Label>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setCeilingRepaintingConfiguration(prev => ({ 
                                        ...prev, 
                                        primer: Math.max(0, prev.primer - 1) 
                                      }))}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center font-medium">
                                      {ceilingRepaintingConfiguration.primer}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setCeilingRepaintingConfiguration(prev => ({ 
                                        ...prev, 
                                        primer: Math.min(5, prev.primer + 1) 
                                      }))}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <Select 
                                  value={ceilingSelectedMaterials.primer} 
                                  onValueChange={(value) => setCeilingSelectedMaterials(prev => ({...prev, primer: value}))}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select primer type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {coverageData
                                      .filter(item => item.category === "Primer")
                                      .map(item => item.product_name)
                                      .filter((value, index, self) => self.indexOf(value) === index)
                                      .map((primerName) => (
                                        <SelectItem key={primerName} value={primerName}>
                                          {primerName}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Emulsion Section */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium">Emulsion Coats</Label>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setCeilingRepaintingConfiguration(prev => ({ 
                                        ...prev, 
                                        emulsion: Math.max(0, prev.emulsion - 1) 
                                      }))}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center font-medium">
                                      {ceilingRepaintingConfiguration.emulsion}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setCeilingRepaintingConfiguration(prev => ({ 
                                        ...prev, 
                                        emulsion: Math.min(5, prev.emulsion + 1) 
                                      }))}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <Select 
                                  value={ceilingSelectedMaterials.emulsion} 
                                  onValueChange={(value) => setCeilingSelectedMaterials(prev => ({...prev, emulsion: value}))}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select emulsion type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {coverageData
                                      .filter(item => item.category === "Interior Paint")
                                      .map(item => item.product_name)
                                      .filter((value, index, self) => self.indexOf(value) === index)
                                      .map((emulsionName) => (
                                        <SelectItem key={emulsionName} value={emulsionName}>
                                          {emulsionName}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="bg-primary/10 rounded p-2 mt-3">
                                <p className="text-xs text-primary font-medium">
                                  Total: {ceilingRepaintingConfiguration.primer + ceilingRepaintingConfiguration.emulsion} coats
                                </p>
                              </div>
                            </div>
                          )}

                          <Button 
                            onClick={() => setCeilingSystemDialogOpen(false)}
                            className="w-full"
                            disabled={!ceilingPaintingSystem}
                          >
                            Apply System
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              )}
              <div className="mt-4 bg-primary/10 rounded-lg p-3 border-l-4 border-primary">
                 <div className="text-center">
                  <p className="text-sm text-primary font-medium">Total Area</p>
                  <p className="text-xl font-bold text-foreground">{estimation.totalArea.toFixed(1)} sq.ft</p>
                  {paintingSystem && (
                    <p className="text-xs text-muted-foreground mt-1">
                      System: {paintingSystem}
                      {paintingSystem === "Fresh Painting" && (
                        <span className="ml-1">
                          ({coatConfiguration.putty + coatConfiguration.primer + coatConfiguration.emulsion} coats)
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Add Additional Square Footage Button */}
              <div className="mt-4 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  className="w-full h-12 border-dashed border-2"
                  onClick={() => navigate(`/room-measurement/${projectId}?addExtra=true`)}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Additional Square Footage
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enamel for Door & Window */}
        {enamellArea > 0 && (
          <Card className="eca-shadow border-amber-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Settings className="mr-2 h-5 w-5 text-amber-600" />
                Door & Window Enamel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog open={enamelDialogOpen} onOpenChange={setEnamelDialogOpen}>
                <DialogTrigger asChild>
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors border-2 border-dashed border-amber-300 hover:border-amber-400">
                    <div className="text-center">
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">
                        {enamelPrimer && enamelType ? 'Configured' : 'Configure Enamel System'}
                      </p>
                      <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{enamellArea.toFixed(1)}</p>
                      <p className="text-xs text-amber-700 dark:text-amber-400">sq.ft (Enamel Area)</p>
                      {enamelPrimer && enamelType && (
                        <div className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                          {enamelPrimerCoats > 0 && `${enamelPrimerCoats} coat${enamelPrimerCoats > 1 ? 's' : ''} ${enamelPrimer}`}
                          {enamelPrimerCoats > 0 && enamelCoats > 0 && ' + '}
                          {enamelCoats > 0 && `${enamelCoats} coat${enamelCoats > 1 ? 's' : ''} ${enamelType}`}
                        </div>
                      )}
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Configure Enamel System</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Primer Section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Primer Type</Label>
                      </div>
                      <Select value={enamelPrimer} onValueChange={setEnamelPrimer}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select primer type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Metal Primer">Metal Primer</SelectItem>
                          <SelectItem value="Wood Primer">Wood Primer</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center justify-between mt-2">
                        <Label className="text-sm">Primer Coats</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEnamelPrimerCoats(Math.max(0, enamelPrimerCoats - 1))}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{enamelPrimerCoats}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEnamelPrimerCoats(Math.min(5, enamelPrimerCoats + 1))}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Enamel Section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Enamel Type</Label>
                      </div>
                      <Select value={enamelType} onValueChange={setEnamelType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select enamel type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Satin Enamel">Satin Enamel</SelectItem>
                          <SelectItem value="Glossy Enamel">Glossy Enamel</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center justify-between mt-2">
                        <Label className="text-sm">Enamel Coats</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEnamelCoats(Math.max(0, enamelCoats - 1))}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{enamelCoats}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEnamelCoats(Math.min(5, enamelCoats + 1))}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Configuration Summary */}
                    {(enamelPrimerCoats > 0 || enamelCoats > 0) && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 space-y-1">
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Configuration:</p>
                        {enamelPrimerCoats > 0 && enamelPrimer && (
                          <p className="text-xs text-amber-700 dark:text-amber-400">
                            • {enamelPrimerCoats} coat{enamelPrimerCoats > 1 ? 's' : ''} of {enamelPrimer}
                          </p>
                        )}
                        {enamelCoats > 0 && enamelType && (
                          <p className="text-xs text-amber-700 dark:text-amber-400">
                            • {enamelCoats} coat{enamelCoats > 1 ? 's' : ''} of {enamelType}
                          </p>
                        )}
                        {enamelCoats > 2 && (
                          <p className="text-xs text-amber-700 dark:text-amber-400">
                            • {enamelCoats - 2} extra coat{enamelCoats - 2 > 1 ? 's' : ''} of enamel
                          </p>
                        )}
                        <div className="pt-2 mt-2 border-t border-amber-200 dark:border-amber-800">
                          <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
                            Total: {enamelPrimerCoats + enamelCoats} coats
                          </p>
                        </div>
                      </div>
                    )}

                    <Button 
                      onClick={() => setEnamelDialogOpen(false)}
                      className="w-full"
                      disabled={!enamelPrimer || !enamelType}
                    >
                      Apply Configuration
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}


        {/* Continue Button */}
        {paintingSystem && perSqFtRate && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
            <Button 
              onClick={handleContinue}
              className="w-full h-12 text-base font-medium"
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Generate Summary
            </Button>
          </div>
        )}
      </div>

      <div className="h-20"></div>
    </div>
  );
}