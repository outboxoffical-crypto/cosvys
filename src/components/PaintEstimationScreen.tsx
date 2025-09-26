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
  
  // Painting system states
  const [paintingSystem, setPaintingSystem] = useState<"Fresh Painting" | "Repainting" | null>(null);
  const [systemDialogOpen, setSystemDialogOpen] = useState(false);
  const [coatConfiguration, setCoatConfiguration] = useState({
    putty: 2,
    primer: 2,
    emulsion: 2
  });

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
    // Load room data and extract selected areas
    const storedRooms = localStorage.getItem(`rooms_${projectId}`);
    if (storedRooms) {
      const roomData = JSON.parse(storedRooms);
      setRooms(roomData);
      
      // Extract selected area types from all rooms and calculate total area
      const selectedAreaTypes = new Set<string>();
      let wallArea = 0;
      let ceilingArea = 0;
      
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
      });
      
      setSelectedAreas(Array.from(selectedAreaTypes));
      const total = wallArea + ceilingArea;
      setTotalArea(total);
      setEstimation(prev => ({
        ...prev,
        wallArea,
        ceilingArea,
        totalArea: total
      }));
    }
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
    if (selectedProduct && quantityCalculation) {
      const estimationData = {
        paintType: selectedPaintType,
        product: selectedProduct,
        coats: selectedCoats,
        totalArea,
        quantityCalculation
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

        {/* Product Selection */}
        <Card className="eca-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Select Paint Product</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder={`Search & select ${selectedPaintType.toLowerCase()} paint product...`} />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <input
                    type="text"
                    placeholder={`Search ${selectedPaintType.toLowerCase()} products...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    autoFocus
                    className="w-full h-8 px-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                {getUniqueProducts().map((productName) => (
                  <SelectItem key={productName} value={productName}>
                    <div className="flex items-center justify-between w-full">
                      <span>{productName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Coat Selection */}
            {selectedProduct && getAvailableCoats(selectedProduct).length > 0 && (
              <div className="space-y-2">
                <Label>Number of Coats</Label>
                <Select value={selectedCoats} onValueChange={setSelectedCoats}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select number of coats" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableCoats(selectedProduct).map((coatOption) => (
                      <SelectItem key={coatOption} value={coatOption}>
                        {coatOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Coverage Information */}
            {selectedProduct && selectedCoats && (
              <div className="bg-muted rounded-lg p-4 space-y-2">
                {(() => {
                  const productData = coverageData.find(
                    item => item.product_name === selectedProduct && item.coats === selectedCoats
                  );
                  return productData ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Coverage Range:</span>
                        <span className="text-sm font-medium">{productData.coverage_range}</span>
                      </div>
                      {productData.surface_type && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Surface Type:</span>
                          <span className="text-sm font-medium">{productData.surface_type}</span>
                        </div>
                      )}
                      {productData.notes && (
                        <div className="mt-2">
                          <span className="text-sm text-muted-foreground">Notes:</span>
                          <p className="text-xs text-muted-foreground mt-1">{productData.notes}</p>
                        </div>
                      )}
                    </>
                  ) : null;
                })()}
              </div>
            )}
          </CardContent>
        </Card>

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
                      <DialogContent className="sm:max-w-md">
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
                                <p className="text-xs opacity-80">6-coat system</p>
                              </div>
                            </Button>
                            <Button
                              variant={paintingSystem === "Repainting" ? "default" : "outline"}
                              onClick={() => setPaintingSystem("Repainting")}
                              className="h-20 flex flex-col items-center justify-center text-center"
                            >
                              <div>
                                <p className="font-medium">Repainting</p>
                                <p className="text-xs opacity-80">Standard system</p>
                              </div>
                            </Button>
                          </div>

                          {paintingSystem === "Fresh Painting" && (
                            <div className="bg-muted rounded-lg p-4 space-y-3">
                              <h4 className="font-medium text-sm">Coat Configuration</h4>
                              
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm">Putty Coats</Label>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setCoatConfiguration(prev => ({ 
                                        ...prev, 
                                        putty: Math.max(1, prev.putty - 1) 
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
                                        putty: Math.min(3, prev.putty + 1) 
                                      }))}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between">
                                  <Label className="text-sm">Primer Coats</Label>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setCoatConfiguration(prev => ({ 
                                        ...prev, 
                                        primer: Math.max(1, prev.primer - 1) 
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
                                        primer: Math.min(3, prev.primer + 1) 
                                      }))}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between">
                                  <Label className="text-sm">Emulsion Coats</Label>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setCoatConfiguration(prev => ({ 
                                        ...prev, 
                                        emulsion: Math.max(1, prev.emulsion - 1) 
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
                                        emulsion: Math.min(3, prev.emulsion + 1) 
                                      }))}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-primary/10 rounded p-2 mt-3">
                                <p className="text-xs text-primary font-medium">
                                  Total: {coatConfiguration.putty + coatConfiguration.primer + coatConfiguration.emulsion} coats
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
                      <DialogContent className="sm:max-w-md">
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
                                <p className="text-xs opacity-80">6-coat system</p>
                              </div>
                            </Button>
                            <Button
                              variant={paintingSystem === "Repainting" ? "default" : "outline"}
                              onClick={() => setPaintingSystem("Repainting")}
                              className="h-20 flex flex-col items-center justify-center text-center"
                            >
                              <div>
                                <p className="font-medium">Repainting</p>
                                <p className="text-xs opacity-80">Standard system</p>
                              </div>
                            </Button>
                          </div>

                          {paintingSystem === "Fresh Painting" && (
                            <div className="bg-muted rounded-lg p-4 space-y-3">
                              <h4 className="font-medium text-sm">Coat Configuration</h4>
                              
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm">Putty Coats</Label>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setCoatConfiguration(prev => ({ 
                                        ...prev, 
                                        putty: Math.max(1, prev.putty - 1) 
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
                                        putty: Math.min(3, prev.putty + 1) 
                                      }))}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between">
                                  <Label className="text-sm">Primer Coats</Label>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setCoatConfiguration(prev => ({ 
                                        ...prev, 
                                        primer: Math.max(1, prev.primer - 1) 
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
                                        primer: Math.min(3, prev.primer + 1) 
                                      }))}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between">
                                  <Label className="text-sm">Emulsion Coats</Label>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setCoatConfiguration(prev => ({ 
                                        ...prev, 
                                        emulsion: Math.max(1, prev.emulsion - 1) 
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
                                        emulsion: Math.min(3, prev.emulsion + 1) 
                                      }))}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-primary/10 rounded p-2 mt-3">
                                <p className="text-xs text-primary font-medium">
                                  Total: {coatConfiguration.putty + coatConfiguration.primer + coatConfiguration.emulsion} coats
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
                  )}
                  {selectedAreas.includes('Ceiling') && (
                    <div className="bg-muted rounded-lg p-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Ceiling Area</p>
                        <p className="text-2xl font-bold text-foreground">{estimation.ceilingArea.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">sq.ft</p>
                      </div>
                    </div>
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
            </CardContent>
          </Card>
        )}

        {/* Quantity Calculation Results */}
        {selectedProduct && quantityCalculation && (
          <Card className="eca-gradient text-white eca-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Calculator className="mr-2 h-5 w-5" />
                Quantity Estimation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-white/80 text-sm">Recommended Quantity</p>
                    <p className="text-2xl font-bold">{quantityCalculation.recommendedQuantity}</p>
                    <p className="text-white/80 text-xs">{quantityCalculation.unit}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white/80 text-sm">Quantity Range</p>
                    <p className="text-lg font-bold">{quantityCalculation.minQuantity} - {quantityCalculation.maxQuantity}</p>
                    <p className="text-white/80 text-xs">{quantityCalculation.unit}</p>
                  </div>
                </div>

                <div className="bg-white/20 rounded-lg p-3">
                  <div className="flex justify-between items-center text-sm">
                    <span>Product:</span>
                    <span>{selectedProduct}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span>Area covered:</span>
                    <span>{totalArea.toFixed(1)} sq.ft</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span>Coats:</span>
                    <span>{selectedCoats}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Continue Button */}
        {selectedProduct && quantityCalculation && (
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