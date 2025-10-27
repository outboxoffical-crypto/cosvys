import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Package, Plus, Edit, Check, X, Trash2, Search, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface ProductPrice {
  productName: string;
  sizes: { [key: string]: number };
  margin?: number;
}

interface ProductCategory {
  name: string;
  products: string[];
}

const productCategories: ProductCategory[] = [
  {
    name: "Essential & Other",
    products: [
      "Repair Polymer", "Vitalia Neo", "Masking Kit", "Putty", "Acrylic Putty", "Crack Seal"
    ]
  },
  {
    name: "Primers",
    products: ["Interior Wall Primer", "Exterior Wall Primer", "Damp Sheath Interior", "Damp Sheath Exterior"]
  },
  {
    name: "Interior Products",
    products: [
      "Tractor Sparc", "Tractor Emulsion", "Tractor UNO", "Tractor Shyne", "Tractor Advance", 
      "Tractor Shyne Advance", "Premium Emulsion", "Premium Advance", "Premium Advance Shyne", 
      "Premium All Protek Shyne", "Premium All Protek Matt", "Royale Emulsion", "Royale Matt", 
      "Royale Shyne", "Royale Atomos", "Royale Glitz", "Royale Aspira"
    ]
  },
  {
    name: "Exterior Products",
    products: [
      "Ace Emulsion", "Ace Advance", "Ace Shyne", "Ace Shyne Advance", "Apex Emulsion", 
      "Apex Advance", "Apex Shyne", "Apex Shyne Advance", "Ultima", "Ultima Stretch", 
      "Ultima Protek Base Coat", "Ultima Protek Top Coat", "Ultima Protek Durolife Base Coat", 
      "Ultima Protek Durolife Top Coat"
    ]
  },
  {
    name: "Waterproofing",
    products: [
      "Damp Proof", "Damp Proof Advance", "Damp Proof Xtreme", "Damp Proof Ultra", 
      "Hydrolac", "Damp Block 2K", "Epoxy Tri Block 2K"
    ]
  }
];

const availableSizes = ["200g", "360g", "500g", "900g", "1kg", "3kg", "5kg", "10kg", "15kg", "20kg", "25kg", "40kg", "50kg", "200ml", "1L", "4L", "5L", "10L", "20L", "1 pack"];

export default function DealerPricingScreen() {
  const navigate = useNavigate();
  const [productPrices, setProductPrices] = useState<{ [key: string]: ProductPrice }>({});
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [tempPrices, setTempPrices] = useState<{ [key: string]: number }>({});
  const [tempSizes, setTempSizes] = useState<string[]>([]);
  const [dealerInfo, setDealerInfo] = useState<any>(null);
  const [customProducts, setCustomProducts] = useState<{ [key: string]: string[] }>({});
  const [customCategories, setCustomCategories] = useState<ProductCategory[]>([]);
  const [addingProductTo, setAddingProductTo] = useState<string | null>(null);
  const [newProductName, setNewProductName] = useState<string>('');
  const [editingCustomProduct, setEditingCustomProduct] = useState<string | null>(null);
  const [editingCustomProductCategory, setEditingCustomProductCategory] = useState<string | null>(null);
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [sizeSearchTerm, setSizeSearchTerm] = useState<string>('');
  const [sizeDropdownOpen, setSizeDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    const stored = localStorage.getItem('dealerInfo');
    if (stored) {
      setDealerInfo(JSON.parse(stored));
    }
    
    const storedPrices = localStorage.getItem('productPrices');
    if (storedPrices) {
      setProductPrices(JSON.parse(storedPrices));
    }

    const storedCustomProducts = localStorage.getItem('customProducts');
    if (storedCustomProducts) {
      setCustomProducts(JSON.parse(storedCustomProducts));
    }

    const storedCustomCategories = localStorage.getItem('customCategories');
    if (storedCustomCategories) {
      setCustomCategories(JSON.parse(storedCustomCategories));
    }
  }, []);

  const getAllCategories = () => {
    return [...productCategories, ...customCategories];
  };

  const handleAddProduct = (productName: string) => {
    setEditingProduct(productName);
    setTempSizes(['1kg']);
    setTempPrices({ '1kg': 0 });
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

  const handleAddCustomProduct = (categoryName: string) => {
    setAddingProductTo(categoryName);
    setNewProductName('');
  };

  const handleSaveCustomProduct = () => {
    if (!addingProductTo || !newProductName.trim()) return;

    const updatedCustomProducts = {
      ...customProducts,
      [addingProductTo]: [...(customProducts[addingProductTo] || []), newProductName.trim()]
    };

    setCustomProducts(updatedCustomProducts);
    localStorage.setItem('customProducts', JSON.stringify(updatedCustomProducts));
    
    setAddingProductTo(null);
    setNewProductName('');
  };

  const handleEditCustomProduct = (productName: string, categoryName: string) => {
    setEditingCustomProduct(productName);
    setEditingCustomProductCategory(categoryName);
    setNewProductName(productName);
  };

  const handleSaveEditedCustomProduct = () => {
    if (!editingCustomProduct || !editingCustomProductCategory || !newProductName.trim()) return;

    const categoryProducts = customProducts[editingCustomProductCategory] || [];
    const updatedCategoryProducts = categoryProducts.map(product => 
      product === editingCustomProduct ? newProductName.trim() : product
    );

    const updatedCustomProducts = {
      ...customProducts,
      [editingCustomProductCategory]: updatedCategoryProducts
    };

    setCustomProducts(updatedCustomProducts);
    localStorage.setItem('customProducts', JSON.stringify(updatedCustomProducts));
    
    setEditingCustomProduct(null);
    setEditingCustomProductCategory(null);
    setNewProductName('');
  };

  const handleDeleteCustomProduct = (productName: string, categoryName: string) => {
    const categoryProducts = customProducts[categoryName] || [];
    const updatedCategoryProducts = categoryProducts.filter(product => product !== productName);

    const updatedCustomProducts = {
      ...customProducts,
      [categoryName]: updatedCategoryProducts
    };

    setCustomProducts(updatedCustomProducts);
    localStorage.setItem('customProducts', JSON.stringify(updatedCustomProducts));

    // Also remove from productPrices if exists
    if (productPrices[productName]) {
      const updatedPrices = { ...productPrices };
      delete updatedPrices[productName];
      setProductPrices(updatedPrices);
      localStorage.setItem('productPrices', JSON.stringify(updatedPrices));
    }
  };

  const handleAddNewCategory = () => {
    const newCategory: ProductCategory = {
      name: "Add Materials",
      products: []
    };
    
    const updatedCategories = [...customCategories, newCategory];
    setCustomCategories(updatedCategories);
    localStorage.setItem('customCategories', JSON.stringify(updatedCategories));
  };

  const handleRenameCategoryStart = (categoryName: string) => {
    setRenamingCategory(categoryName);
    setNewCategoryName(categoryName);
  };

  const handleRenameCategory = () => {
    if (!renamingCategory || !newCategoryName.trim()) return;

    const updatedCategories = customCategories.map(category => 
      category.name === renamingCategory 
        ? { ...category, name: newCategoryName.trim() }
        : category
    );

    // Update custom products mapping
    const updatedCustomProducts = { ...customProducts };
    if (customProducts[renamingCategory]) {
      updatedCustomProducts[newCategoryName.trim()] = customProducts[renamingCategory];
      delete updatedCustomProducts[renamingCategory];
    }

    setCustomCategories(updatedCategories);
    setCustomProducts(updatedCustomProducts);
    localStorage.setItem('customCategories', JSON.stringify(updatedCategories));
    localStorage.setItem('customProducts', JSON.stringify(updatedCustomProducts));
    
    setRenamingCategory(null);
    setNewCategoryName('');
  };

  const handleDeleteCategory = (categoryName: string) => {
    const updatedCategories = customCategories.filter(category => category.name !== categoryName);
    setCustomCategories(updatedCategories);
    localStorage.setItem('customCategories', JSON.stringify(updatedCategories));

    // Remove category products
    const updatedCustomProducts = { ...customProducts };
    delete updatedCustomProducts[categoryName];
    setCustomProducts(updatedCustomProducts);
    localStorage.setItem('customProducts', JSON.stringify(updatedCustomProducts));

    // Remove product prices for this category
    const categoryProducts = customProducts[categoryName] || [];
    const updatedPrices = { ...productPrices };
    categoryProducts.forEach(product => {
      delete updatedPrices[product];
    });
    setProductPrices(updatedPrices);
    localStorage.setItem('productPrices', JSON.stringify(updatedPrices));
  };

  const getAllProductsInCategory = (category: ProductCategory) => {
    const customCategoryProducts = customProducts[category.name] || [];
    return [...category.products, ...customCategoryProducts];
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
        <Tabs defaultValue={getAllCategories()[0].name} className="w-full">
          <TabsList className="grid w-full grid-cols-3 gap-1 mb-4 h-auto p-1">
            {getAllCategories().slice(0, 3).map((category) => (
              <TabsTrigger 
                key={category.name} 
                value={category.name}
                className="text-xs p-2 data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Scrollable category tabs for remaining categories */}
          <div className="flex items-center space-x-2 overflow-x-auto mb-4">
            <TabsList className="flex space-x-2 min-w-max h-auto p-1">
              {getAllCategories().slice(3).map((category) => (
                <TabsTrigger 
                  key={category.name} 
                  value={category.name}
                  className="text-xs p-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {/* Add Category Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddNewCategory}
              className="text-xs h-8 whitespace-nowrap border-dashed border-primary text-primary hover:bg-primary/10"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Tab
            </Button>
          </div>

          {getAllCategories().map((category) => (
            <TabsContent key={category.name} value={category.name} className="space-y-4">
              <Card className="eca-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Package className="mr-2 h-5 w-5 text-primary" />
                      {renamingCategory === category.name ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="h-8 text-sm"
                            placeholder="Category name"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleRenameCategory();
                              }
                            }}
                          />
                          <Button 
                            size="sm" 
                            onClick={handleRenameCategory}
                            className="text-xs h-7"
                            disabled={!newCategoryName.trim()}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setRenamingCategory(null);
                              setNewCategoryName('');
                            }}
                            className="text-xs h-7"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <span>{category.name}</span>
                      )}
                    </div>
                    {/* Show edit/delete only for custom categories */}
                    {customCategories.some(c => c.name === category.name) && renamingCategory !== category.name && (
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRenameCategoryStart(category.name)}
                          className="text-xs h-7 p-1"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCategory(category.name)}
                          className="text-xs h-7 p-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {getAllProductsInCategory(category).map((product) => {
                    const isCustomProduct = (customProducts[category.name] || []).includes(product);
                    const isEditingThis = editingCustomProduct === product && editingCustomProductCategory === category.name;
                    
                    return (
                    <div key={product} className="border border-border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        {isEditingThis ? (
                          <div className="flex-1 flex items-center space-x-2">
                            <Input
                              type="text"
                              value={newProductName}
                              onChange={(e) => setNewProductName(e.target.value)}
                              className="h-8 text-sm flex-1"
                              placeholder="Product name"
                            />
                            <Button 
                              size="sm" 
                              onClick={handleSaveEditedCustomProduct}
                              className="text-xs h-7"
                              disabled={!newProductName.trim()}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setEditingCustomProduct(null);
                                setEditingCustomProductCategory(null);
                                setNewProductName('');
                              }}
                              className="text-xs h-7"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-sm">{product}</h4>
                              {isCustomProduct && (
                                <div className="flex items-center space-x-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditCustomProduct(product, category.name)}
                                    className="text-xs h-6 p-1"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteCustomProduct(product, category.name)}
                                    className="text-xs h-6 p-1 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
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
                          </>
                        )}
                      </div>

                       {editingProduct === product && (
                        <div className="mt-3 space-y-3 bg-muted p-3 rounded-md">
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Available Sizes</Label>
                            
                            {/* Dropdown Trigger */}
                            <div 
                              onClick={() => setSizeDropdownOpen(!sizeDropdownOpen)}
                              className="flex items-center justify-between p-2.5 border border-input rounded-lg bg-background hover:bg-accent cursor-pointer transition-colors shadow-sm"
                            >
                              <span className="text-xs text-muted-foreground">
                                {tempSizes.length === 0 
                                  ? "Select sizes..." 
                                  : `${tempSizes.length} size${tempSizes.length > 1 ? 's' : ''} selected`}
                              </span>
                              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${sizeDropdownOpen ? 'rotate-180' : ''}`} />
                            </div>

                            {/* Dropdown Content */}
                            {sizeDropdownOpen && (
                              <div className="border border-input rounded-lg bg-background shadow-md overflow-hidden">
                                {/* Search Bar */}
                                <div className="p-2 border-b border-border bg-muted/30">
                                  <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                      type="text"
                                      placeholder="Search sizes..."
                                      value={sizeSearchTerm}
                                      onChange={(e) => setSizeSearchTerm(e.target.value)}
                                      className="h-8 pl-8 text-xs border-input"
                                    />
                                  </div>
                                </div>

                                {/* Select All / Clear All */}
                                <div className="flex items-center justify-between px-3 py-2 bg-muted/20 border-b border-border">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const filteredSizes = availableSizes.filter(size => 
                                        size.toLowerCase().includes(sizeSearchTerm.toLowerCase())
                                      );
                                      filteredSizes.forEach(size => {
                                        if (!tempSizes.includes(size)) {
                                          handleSizeToggle(size);
                                        }
                                      });
                                    }}
                                    className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10"
                                  >
                                    Select All
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const filteredSizes = availableSizes.filter(size => 
                                        size.toLowerCase().includes(sizeSearchTerm.toLowerCase())
                                      );
                                      filteredSizes.forEach(size => {
                                        if (tempSizes.includes(size)) {
                                          handleSizeToggle(size);
                                        }
                                      });
                                    }}
                                    className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    Clear All
                                  </Button>
                                </div>

                                {/* Size Options - Grouped by Category */}
                                <div className="max-h-64 overflow-y-auto">
                                  {/* Weight-based sizes */}
                                  {availableSizes.filter(s => s.includes('g') || s.includes('kg')).filter(size => 
                                    size.toLowerCase().includes(sizeSearchTerm.toLowerCase())
                                  ).length > 0 && (
                                    <div className="border-b border-border last:border-0">
                                      <div className="px-3 py-1.5 bg-muted/50">
                                        <span className="text-xs font-medium text-muted-foreground">Weight</span>
                                      </div>
                                      <div className="p-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                        {availableSizes
                                          .filter(s => s.includes('g') || s.includes('kg'))
                                          .filter(size => size.toLowerCase().includes(sizeSearchTerm.toLowerCase()))
                                          .map((size) => (
                                            <button
                                              key={size}
                                              type="button"
                                              onClick={() => handleSizeToggle(size)}
                                              className={`
                                                px-3 py-1.5 rounded-md text-xs font-medium transition-all
                                                border ${tempSizes.includes(size)
                                                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                                  : 'bg-background text-foreground border-input hover:bg-accent hover:border-primary/40'
                                                }
                                              `}
                                            >
                                              {size}
                                            </button>
                                          ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Volume-based sizes */}
                                  {availableSizes.filter(s => s.includes('ml') || s.includes('L')).filter(size => 
                                    size.toLowerCase().includes(sizeSearchTerm.toLowerCase())
                                  ).length > 0 && (
                                    <div className="border-b border-border last:border-0">
                                      <div className="px-3 py-1.5 bg-muted/50">
                                        <span className="text-xs font-medium text-muted-foreground">Volume</span>
                                      </div>
                                      <div className="p-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                        {availableSizes
                                          .filter(s => s.includes('ml') || s.includes('L'))
                                          .filter(size => size.toLowerCase().includes(sizeSearchTerm.toLowerCase()))
                                          .map((size) => (
                                            <button
                                              key={size}
                                              type="button"
                                              onClick={() => handleSizeToggle(size)}
                                              className={`
                                                px-3 py-1.5 rounded-md text-xs font-medium transition-all
                                                border ${tempSizes.includes(size)
                                                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                                  : 'bg-background text-foreground border-input hover:bg-accent hover:border-primary/40'
                                                }
                                              `}
                                            >
                                              {size}
                                            </button>
                                          ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Other sizes (like "1 pack") */}
                                  {availableSizes.filter(s => !s.includes('g') && !s.includes('kg') && !s.includes('ml') && !s.includes('L')).filter(size => 
                                    size.toLowerCase().includes(sizeSearchTerm.toLowerCase())
                                  ).length > 0 && (
                                    <div className="border-b border-border last:border-0">
                                      <div className="px-3 py-1.5 bg-muted/50">
                                        <span className="text-xs font-medium text-muted-foreground">Other</span>
                                      </div>
                                      <div className="p-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                        {availableSizes
                                          .filter(s => !s.includes('g') && !s.includes('kg') && !s.includes('ml') && !s.includes('L'))
                                          .filter(size => size.toLowerCase().includes(sizeSearchTerm.toLowerCase()))
                                          .map((size) => (
                                            <button
                                              key={size}
                                              type="button"
                                              onClick={() => handleSizeToggle(size)}
                                              className={`
                                                px-3 py-1.5 rounded-md text-xs font-medium transition-all
                                                border ${tempSizes.includes(size)
                                                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                                  : 'bg-background text-foreground border-input hover:bg-accent hover:border-primary/40'
                                                }
                                              `}
                                            >
                                              {size}
                                            </button>
                                          ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* No results message */}
                                  {availableSizes.filter(size => 
                                    size.toLowerCase().includes(sizeSearchTerm.toLowerCase())
                                  ).length === 0 && (
                                    <div className="p-4 text-center">
                                      <p className="text-xs text-muted-foreground">No sizes found</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
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
                  );
                  })}


                  {/* Add Custom Product Section */}
                  <div className="border border-dashed border-muted-foreground/30 rounded-lg p-3 hover:border-primary/50 transition-colors">
                    {addingProductTo === category.name ? (
                      <div className="space-y-3">
                        <Label className="text-xs font-medium">Add New Product</Label>
                        <Input
                          type="text"
                          placeholder="Enter custom product name"
                          value={newProductName}
                          onChange={(e) => setNewProductName(e.target.value)}
                          className="h-8 text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveCustomProduct();
                            }
                          }}
                        />
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            onClick={handleSaveCustomProduct}
                            className="text-xs h-7"
                            disabled={!newProductName.trim()}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Add Product
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setAddingProductTo(null);
                              setNewProductName('');
                            }}
                            className="text-xs h-7"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleAddCustomProduct(category.name)}
                          className="text-xs h-7 text-muted-foreground hover:text-primary"
                        >
                          <Package className="h-3 w-3 mr-1" />
                          Add Custom Product
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">
                          Add products not in the list
                        </p>
                      </div>
                    )}
                  </div>
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