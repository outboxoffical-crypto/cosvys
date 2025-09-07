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
  type: "Interior" | "Exterior";
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
  
  // Exterior Paints
  { id: "6", name: "Apex Ultima", type: "Exterior", coverage: 120, price: 950, category: "Premium" },
  { id: "7", name: "Apex Weatherproof", type: "Exterior", coverage: 110, price: 780, category: "Premium" },
  { id: "8", name: "Tractor Acrylic Distemper", type: "Exterior", coverage: 100, price: 520, category: "Standard" },
  { id: "9", name: "Utsav Exterior Paint", type: "Exterior", coverage: 90, price: 450, category: "Economy" },
];

export default function PaintEstimationScreen() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [selectedPaintType, setSelectedPaintType] = useState<"Interior" | "Exterior">("Interior");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [rooms, setRooms] = useState<any[]>([]);
  const [estimation, setEstimation] = useState({
    area: 0,
    litersRequired: 0,
    totalCost: 0,
    coats: 2
  });

  useEffect(() => {
    // Load room data
    const storedRooms = localStorage.getItem(`rooms_${projectId}`);
    if (storedRooms) {
      const roomData = JSON.parse(storedRooms);
      setRooms(roomData);
    }
  }, [projectId]);

  useEffect(() => {
    if (selectedProduct && rooms.length > 0) {
      const product = paintProducts.find(p => p.id === selectedProduct);
      if (product) {
        const area = selectedPaintType === "Interior" 
          ? rooms.reduce((acc, room) => acc + room.wallArea + room.ceilingArea, 0)
          : rooms.reduce((acc, room) => acc + room.wallArea, 0);
        
        const litersRequired = (area * estimation.coats) / product.coverage;
        const totalCost = litersRequired * product.price;
        
        setEstimation(prev => ({
          ...prev,
          area,
          litersRequired: Math.ceil(litersRequired),
          totalCost: Math.round(totalCost)
        }));
      }
    }
  }, [selectedProduct, selectedPaintType, rooms, estimation.coats]);

  const filteredProducts = paintProducts.filter(p => p.type === selectedPaintType);
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
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={selectedPaintType === "Interior" ? "default" : "outline"}
                onClick={() => {
                  setSelectedPaintType("Interior");
                  setSelectedProduct("");
                }}
                className="h-12"
              >
                Interior Paint
              </Button>
              <Button
                variant={selectedPaintType === "Exterior" ? "default" : "outline"}
                onClick={() => {
                  setSelectedPaintType("Exterior");
                  setSelectedProduct("");
                }}
                className="h-12"
              >
                Exterior Paint
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
        {rooms.length > 0 && (
          <Card className="eca-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Area to be Painted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {selectedPaintType === "Interior" ? "Wall + Ceiling Area" : "Exterior Wall Area"}
                  </p>
                  <p className="text-3xl font-bold text-foreground">{estimation.area.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">sq.ft</p>
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
                    <span>{estimation.area.toFixed(1)} sq.ft</span>
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