import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Package, Plus, Edit, Check, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface ProductPrice {
  productName: string;
  sizes: { [key: string]: number };
  margin?: number;
}

interface ProductCategory {
  name: string;
  products: string[];
  icon: string;
}

const productCategories: ProductCategory[] = [
  {
    name: "Primer of Wall",
    icon: "🎨",
    products: ["Interior Wall Primer", "Exterior Wall Primer", "Damp Sheath Interior", "Damp Sheath Exterior"]
  },
  {
    name: "Tractor Category", 
    icon: "🚜",
    products: ["Tractor Sparc", "Tractor Emulsion", "Tractor Shyne", "Tractor Advance", "Tractor Shyne Advance"]
  },
  {
    name: "Premium Category",
    icon: "⭐",
    products: ["Premium Emulsion", "Premium Advance", "Premium Advance Shyne", "Premium All Protek Shyne", "Premium All Protek Matt"]
  },
  {
    name: "Royale Category",
    icon: "👑",
    products: ["Royale Emulsion", "Royale Shyne", "Royale Matt", "Royale Atomos", "Royale Glitz", "Royale Aspira"]
  },
  {
    name: "Ace Category",
    icon: "🏠",
    products: ["Ace Emulsion", "Ace Shyne", "Ace Shyne Advance"]
  },
  {
    name: "Apex Category", 
    icon: "🏢",
    products: ["Apex Emulsion", "Apex Advance", "Apex Shyne", "Apex Shyne Advance"]
  },
  {
    name: "Ultima",
    icon: "🔥",
    products: ["Ultima Stretch", "Ultima Protek Top Coat", "Ultima Protek Base Coat", "Ultima Protek Durolife Top Coat", "Ultima Protek Durolife Base Coat"]
  },
  {
    name: "Waterproofing - Terrace",
    icon: "☂️",
    products: ["Damp Proof", "Damp Proof Advance", "Damp Proof Xtreme", "Damp Proof Ultra"]
  },
  {
    name: "Terrace Design",
    icon: "🎯",
    products: ["Damp Proof Play", "Marble Pattern", "Wooden Pattern", "Terrazzo Pattern", "Ornate Pattern"]
  },
  {
    name: "Efflorescence Walls",
    icon: "🧱",
    products: ["Hydrolac", "Damp Block 2K"]
  },
  {
    name: "Water Tank Leakage",
    icon: "💧",
    products: ["Epoxy Tri Block 2K"]
  },
  {
    name: "Other Products",
    icon: "🔧",
    products: ["Putty 20kg", "Putty 40kg", "Crack Seal 500g", "Crack Seal 1kg", "Crack Seal 5kg", "Acrylic Putty 500g", "Acrylic Putty 1kg", "Acrylic Putty 5kg", "Masking Tape 1/4\"", "Masking Tape 3/4\"", "Masking Tape 1\"", "Masking Tape 2\"", "Vitalia Neo 1L", "Vitalia Neo 4L", "Repair Polymer 1L", "Repair Polymer 4L"]
  }
];

const availableSizes = ["1L", "4L", "10L", "20L"];

export default function DealerPricingScreen() {
  const navigate = useNavigate();
  const [productPrices, setProductPrices] = useState<{ [key: string]: ProductPrice }>({});
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [tempPrices, setTempPrices] = useState<{ [key: string]: number }>({});
  const [tempSizes, setTempSizes] = useState<string[]>([]);
  const [dealerInfo, setDealerInfo] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('dealerInfo');
    if (stored) {
      setDealerInfo(JSON.parse(stored));
    }
    
    const storedPrices = localStorage.getItem('productPrices');
    if (storedPrices) {
      setProductPrices(JSON.parse(storedPrices));
    }
  }, []);

  const handleAddProduct = (productName: string) => {
    setEditingProduct(productName);
    setTempSizes(['1L']);
    setTempPrices({ '1L': 0 });
  };

  const handleSaveProduct = () => {
    if (!editingProduct) return;

    const newProduct: ProductPrice = {
      productName: editingProduct,
      sizes: { ...tempPrices },
      margin: dealerInfo?.margin ? parseFloat(dealerInfo.margin) : 0
    };

    const updatedPrices = {
      ...productPrices,
      [editingProduct]: newProduct
    };

    setProductPrices(updatedPrices);
    localStorage.setItem('productPrices', JSON.stringify(updatedPrices));
    
    setEditingProduct(null);
    setTempPrices({});
    setTempSizes([]);
  };

  const handleSizeToggle = (size: string) => {
    if (tempSizes.includes(size)) {
      setTempSizes(tempSizes.filter(s => s !== size));
      const newPrices = { ...tempPrices };
      delete newPrices[size];
      setTempPrices(newPrices);
    } else {
      setTempSizes([...tempSizes, size]);
      setTempPrices({ ...tempPrices, [size]: 0 });
    }
  };

  const handleFinishSetup = () => {
    localStorage.setItem('setupComplete', 'true');
    navigate('/dashboard');
  };

  const getTotalProducts = () => {
    return Object.keys(productPrices).length;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="eca-gradient text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate("/dealer-info")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Product Pricing</h1>
              <p className="text-white/80 text-sm">
                {dealerInfo?.shopName} • {getTotalProducts()} products added
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue={productCategories[0].name} className="w-full">
          <TabsList className="grid w-full grid-cols-2 gap-1 mb-6 h-auto p-1">
            {productCategories.slice(0, 2).map((category) => (
              <TabsTrigger 
                key={category.name} 
                value={category.name}
                className="text-xs p-2 data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <span className="mr-1">{category.icon}</span>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Scrollable category tabs */}
          <div className="overflow-x-auto mb-4">
            <div className="flex space-x-2 min-w-max">
              {productCategories.slice(2).map((category) => (
                <TabsTrigger 
                  key={category.name} 
                  value={category.name}
                  className="text-xs p-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <span className="mr-1">{category.icon}</span>
                  {category.name}
                </TabsTrigger>
              ))}
            </div>
          </div>

          {productCategories.map((category) => (
            <TabsContent key={category.name} value={category.name} className="space-y-4">
              <Card className="eca-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Package className="mr-2 h-5 w-5 text-primary" />
                    {category.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {category.products.map((product) => (
                    <div key={product} className="border border-border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{product}</h4>
                        {productPrices[product] ? (
                          <Badge variant="outline" className="text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            Added
                          </Badge>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleAddProduct(product)}
                            className="text-xs h-7"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Price
                          </Button>
                        )}
                      </div>

                      {editingProduct === product && (
                        <div className="mt-3 space-y-3 bg-muted p-3 rounded-md">
                          <div>
                            <Label className="text-xs font-medium">Available Sizes</Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {availableSizes.map((size) => (
                                <div key={size} className="flex items-center space-x-1">
                                  <Checkbox
                                    id={`${product}-${size}`}
                                    checked={tempSizes.includes(size)}
                                    onCheckedChange={() => handleSizeToggle(size)}
                                  />
                                  <Label 
                                    htmlFor={`${product}-${size}`}
                                    className="text-xs cursor-pointer"
                                  >
                                    {size}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {tempSizes.map((size) => (
                            <div key={size} className="space-y-1">
                              <Label className="text-xs font-medium">Price for {size}</Label>
                              <Input
                                type="number"
                                placeholder="Enter price"
                                value={tempPrices[size] || ''}
                                onChange={(e) => setTempPrices(prev => ({
                                  ...prev,
                                  [size]: parseFloat(e.target.value) || 0
                                }))}
                                className="h-8 text-sm"
                              />
                            </div>
                          ))}

                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              onClick={handleSaveProduct}
                              className="text-xs h-7"
                              disabled={tempSizes.length === 0}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingProduct(null)}
                              className="text-xs h-7"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {productPrices[product] && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(productPrices[product].sizes).map(([size, price]) => (
                              <span key={size} className="bg-background px-2 py-1 rounded">
                                {size}: ₹{price}
                              </span>
                            ))}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAddProduct(product)}
                            className="text-xs h-6 mt-1 p-0"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Summary & Continue */}
        <Card className="eca-shadow mt-6">
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Setup Summary</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {getTotalProducts()} products configured for {dealerInfo?.shopName}
              </p>
              <Button 
                onClick={handleFinishSetup}
                className="w-full h-12 text-base font-medium"
                disabled={getTotalProducts() === 0}
              >
                Complete Setup & Go to Dashboard
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                You can add more products later from Settings
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom padding */}
      <div className="h-6"></div>
    </div>
  );
}