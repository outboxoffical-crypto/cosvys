import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Palette, Calculator, DollarSign } from "lucide-react";

interface PaintProduct {
  id: string;
  name: string;
  type: "Interior" | "Exterior" | "Waterproofing";
  coverage: number; // sq.ft per liter
  price: number; // price per liter
  category: string;
}

const paintProducts: PaintProduct[] = [
  // Interior Paints
  { id: "1", name: "Royale Aspira", type: "Interior", coverage: 140, price: 850, category: "Premium" },
  { id: "2", name: "Royale Luxury Emulsion", type: "Interior", coverage: 130, price: 720, category: "Premium" },
  { id: "3", name: "Apcolite Premium Emulsion", type: "Interior", coverage: 120, price: 580, category: "Standard" },
  { id: "4", name: "Tractor Emulsion", type: "Interior", coverage: 110, price: 420, category: "Economy" },
  { id: "5", name: "Ace Exterior Emulsion", type: "Interior", coverage: 100, price: 380, category: "Economy" },
  { id: "16", name: "Tractor Sparc", type: "Interior", coverage: 125, price: 450, category: "Standard" },
  { id: "17", name: "Tractor UNO", type: "Interior", coverage: 115, price: 380, category: "Economy" },
  { id: "18", name: "Tractor Shyne", type: "Interior", coverage: 120, price: 520, category: "Standard" },
  { id: "19", name: "Premium Emulsion", type: "Interior", coverage: 130, price: 650, category: "Premium" },
  { id: "20", name: "Royale Matt", type: "Interior", coverage: 135, price: 750, category: "Premium" },
  { id: "21", name: "Royale Shyne", type: "Interior", coverage: 130, price: 780, category: "Premium" },
  { id: "22", name: "Royale Atomos", type: "Interior", coverage: 145, price: 920, category: "Premium" },
  { id: "23", name: "Royale Glitz", type: "Interior", coverage: 140, price: 880, category: "Premium" },
  
  // Exterior Paints
  { id: "6", name: "Apex Ultima", type: "Exterior", coverage: 120, price: 950, category: "Premium" },
  { id: "7", name: "Apex Weatherproof", type: "Exterior", coverage: 110, price: 780, category: "Premium" },
  { id: "8", name: "Tractor Acrylic Distemper", type: "Exterior", coverage: 100, price: 520, category: "Standard" },
  { id: "9", name: "Utsav Exterior Paint", type: "Exterior", coverage: 90, price: 450, category: "Economy" },
  { id: "10", name: "Ace Emulsion", type: "Exterior", coverage: 95, price: 420, category: "Economy" },
  { id: "11", name: "Ace Advance", type: "Exterior", coverage: 105, price: 480, category: "Standard" },
  { id: "12", name: "Ace Shyne", type: "Exterior", coverage: 100, price: 520, category: "Standard" },
  { id: "13", name: "Apex Emulsion", type: "Exterior", coverage: 110, price: 650, category: "Premium" },
  { id: "14", name: "Apex Advance", type: "Exterior", coverage: 115, price: 720, category: "Premium" },
  { id: "15", name: "Ultima Stretch", type: "Exterior", coverage: 125, price: 1050, category: "Premium" },

  // Waterproofing Products
  { id: "24", name: "Damp Proof", type: "Waterproofing", coverage: 80, price: 650, category: "Standard" },
  { id: "25", name: "Damp Proof Advance", type: "Waterproofing", coverage: 85, price: 750, category: "Premium" },
  { id: "26", name: "Damp Proof Xtreme", type: "Waterproofing", coverage: 90, price: 850, category: "Premium" },
  { id: "27", name: "Damp Proof Ultra", type: "Waterproofing", coverage: 95, price: 950, category: "Premium" },
  { id: "28", name: "Hydrolac", type: "Waterproofing", coverage: 75, price: 580, category: "Standard" },
  { id: "29", name: "Damp Block 2K", type: "Waterproofing", coverage: 70, price: 1200, category: "Premium" },
  { id: "30", name: "Epoxy Tri Block 2K", type: "Waterproofing", coverage: 65, price: 1450, category: "Premium" },
];

export default function PaintEstimationScreen() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [selectedPaintType, setSelectedPaintType] = useState<"Interior" | "Exterior" | "Waterproofing">("Interior");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [estimation, setEstimation] = useState({
    wallArea: 0,
    ceilingArea: 0,
    totalArea: 0,
    litersRequired: 0,
    totalCost: 0,
    coats: 2
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Load room data and selected areas
    const storedRooms = localStorage.getItem(`rooms_${projectId}`);
    if (storedRooms) {
      const roomData = JSON.parse(storedRooms);
      setRooms(roomData);
    }

    const storedSelectedAreas = localStorage.getItem(`selectedAreas_${projectId}`);
    if (storedSelectedAreas) {
      setSelectedAreas(JSON.parse(storedSelectedAreas));
    }
  }, [projectId]);

  useEffect(() => {
    if (selectedProduct && rooms.length > 0) {
      const product = paintProducts.find(p => p.id === selectedProduct);
      if (product) {
        let wallArea = 0;
        let ceilingArea = 0;

        // Calculate areas based on what was selected in room measurements
        if (selectedAreas.includes('Wall')) {
          wallArea = rooms.reduce((acc, room) => acc + (room.wallArea || 0), 0);
        }
        if (selectedAreas.includes('Ceiling')) {
          ceilingArea = rooms.reduce((acc, room) => acc + (room.ceilingArea || 0), 0);
        }

        const totalArea = wallArea + ceilingArea;
        const litersRequired = (totalArea * estimation.coats) / product.coverage;
        const totalCost = litersRequired * product.price;
        
        setEstimation(prev => ({
          ...prev,
          wallArea,
          ceilingArea,
          totalArea,
          litersRequired: Math.ceil(litersRequired),
          totalCost: Math.round(totalCost)
        }));
      }
    }
  }, [selectedProduct, selectedPaintType, rooms, selectedAreas, estimation.coats]);

  const filteredProducts = paintProducts
    .filter(p => p.type === selectedPaintType)
    .filter(p => searchTerm === "" || p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const selectedProductData = paintProducts.find(p => p.id === selectedProduct);

  const handleContinue = () => {
    if (selectedProduct && estimation.litersRequired > 0) {
      const estimationData = {
        paintType: selectedPaintType,
        product: selectedProductData,
        estimation
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
                variant={selectedPaintType === "Interior" ? "default" : "outline"}
                onClick={() => {
                  setSelectedPaintType("Interior");
                  setSelectedProduct("");
                  setSearchTerm("");
                }}
                className="h-12 text-sm"
              >
                Interior Paint
              </Button>
              <Button
                variant={selectedPaintType === "Exterior" ? "default" : "outline"}
                onClick={() => {
                  setSelectedPaintType("Exterior");
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
            <div className="space-y-2">
              <input
                type="text"
                placeholder={`Search ${selectedPaintType.toLowerCase()} products...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Choose a paint product" />
                </SelectTrigger>
                <SelectContent>
                  {filteredProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{product.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {product.category}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProductData && (
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Coverage:</span>
                  <span className="text-sm font-medium">{selectedProductData.coverage} sq.ft/L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Price per Liter:</span>
                  <span className="text-sm font-medium">₹{selectedProductData.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Category:</span>
                  <Badge variant="outline" className="text-xs">
                    {selectedProductData.category}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Area Summary */}
        {rooms.length > 0 && selectedAreas.length > 0 && (
          <Card className="eca-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Area to be Painted</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedAreas.length === 1 ? (
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      {selectedAreas[0]} Area
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {selectedAreas[0] === 'Wall' ? estimation.wallArea.toFixed(1) : estimation.ceilingArea.toFixed(1)}
                    </p>
                    <p className="text-sm text-muted-foreground">sq.ft</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {selectedAreas.includes('Wall') && (
                    <div className="bg-muted rounded-lg p-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Wall Area</p>
                        <p className="text-2xl font-bold text-foreground">{estimation.wallArea.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">sq.ft</p>
                      </div>
                    </div>
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
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estimation Results */}
        {selectedProduct && estimation.litersRequired > 0 && (
          <Card className="eca-gradient text-white eca-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Calculator className="mr-2 h-5 w-5" />
                Cost Estimation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-white/80 text-sm">Paint Required</p>
                    <p className="text-2xl font-bold">{estimation.litersRequired}</p>
                    <p className="text-white/80 text-xs">Liters</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white/80 text-sm">Total Cost</p>
                    <p className="text-2xl font-bold">₹{estimation.totalCost.toLocaleString()}</p>
                    <p className="text-white/80 text-xs">Including 2 coats</p>
                  </div>
                </div>

                <div className="bg-white/20 rounded-lg p-3">
                  <div className="flex justify-between items-center text-sm">
                    <span>Product:</span>
                    <span>{selectedProductData?.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span>Area covered:</span>
                    <span>{estimation.totalArea.toFixed(1)} sq.ft</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span>No. of coats:</span>
                    <span>{estimation.coats}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Continue Button */}
        {selectedProduct && estimation.litersRequired > 0 && (
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