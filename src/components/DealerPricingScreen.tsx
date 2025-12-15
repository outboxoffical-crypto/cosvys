import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { HorizontalTabs } from "@/components/ui/horizontal-tabs";
import { ArrowLeft, Package, Plus, Edit, Check, X, Trash2, Search, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";


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
      "AP SmartCare Repair Polymer", "AP SmartCare Vitalia Neo", "AP TruCare Masking Kit", 
      "AP TruCare Wall Putty", "AP SmartCare Waterproof Wall Putty", "AP TruCare Acrylic Wall Putty", 
      "AP SmartCare Crack Seal"
    ]
  },
  {
    name: "Primer",
    products: [
      "AP TruCare Interior Wall Primer", "AP TruCare Exterior Wall Primer", 
      "AP SmartCare Damp Sheath Interior Primer", "AP SmartCare Damp Sheath Exterior Primer", 
      "AP Apex Utima Protek Base Coat", "AP Apex Utima Protek Duralife Base Coat"
    ]
  },
  {
    name: "Interior Emulsion",
    products: [
      "AP Tractor Sparc Emulsion", "AP Tractor UNO Emulsion", "AP Tractor Emulsion", 
      "AP Tractor Advance", "AP Tractor Shyne", "AP Tractor Shyne Advance", 
      "AP Apcolite Premium Emulsion", "AP Apcolite Premium Advance", "AP Apcolite Premium Advance Shyne", 
      "AP Apcolite All Protek Shyne", "AP Apcolite All Protek Matt", "AP Royale Luxury Emulsion", 
      "AP Royale Matt", "AP Royale Shyne", "AP Royale Atomos", "AP Royale Glitz", "AP Royale Aspira"
    ]
  },
  {
    name: "Exterior Emulsion",
    products: [
      "AP Ace Emulsion", "AP Ace Advance", "AP Ace Shyne", "AP Ace Shyne Advance", 
      "AP Apex Emulsion", "AP Apex Advance", "AP Apex Shyne", "AP Apex Shyne Advance", 
      "AP Apex Ultima", "AP Apex Ultima Stretch", "AP Apex Ultima Protek", "AP Apex Ultima Protek Duralife"
    ]
  },
  {
    name: "Waterproofing",
    products: [
      "AP SmartCare Damp Proof", "AP SmartCare Damp Proof Advance", "AP SmartCare Damp Proof Xtreme", 
      "AP SmartCare Damp Proof Ultra", "AP SmartCare Hydrolac Xtreme", "AP SmartCare Damp Block 2k", 
      "AP SmartCare Epoxy TriBlock 2k"
    ]
  }
];

const availableSizes = ["200g", "360g", "500g", "900g", "1kg", "3kg", "5kg", "10kg", "15kg", "20kg", "25kg", "40kg", "50kg", "50ml", "100ml", "200ml", "500ml", "1L", "4L", "5L", "10L", "20L", "1 pack"];

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
  const [activeCategory, setActiveCategory] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      // Load dealer info from localStorage (keeping this for now)
      const stored = localStorage.getItem('dealerInfo');
      if (stored) {
        setDealerInfo(JSON.parse(stored));
      }

      // Load product prices from database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: productPricingData, error } = await supabase
          .from('product_pricing')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error loading product prices:', error);
          toast.error('Failed to load product prices');
        } else if (productPricingData) {
          // Convert database format to component format
          const prices: { [key: string]: ProductPrice } = {};
          productPricingData.forEach(item => {
            prices[item.product_name] = {
              productName: item.product_name,
              sizes: item.sizes as { [key: string]: number },
              margin: item.margin ? parseFloat(item.margin.toString()) : undefined
            };
          });
          setProductPrices(prices);
        }
      }

      // Keep custom products and categories in localStorage for now
      const storedCustomProducts = localStorage.getItem('customProducts');
      if (storedCustomProducts) {
        setCustomProducts(JSON.parse(storedCustomProducts));
      }

      const storedCustomCategories = localStorage.getItem('customCategories');
      if (storedCustomCategories) {
        setCustomCategories(JSON.parse(storedCustomCategories));
      }
    };

    loadData();
  }, []);

  // Set initial active category
  useEffect(() => {
    const categories = getAllCategoryNames();
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [customCategories]);

  const getAllCategories = () => {
    return [...productCategories, ...customCategories];
  };

  const getAllCategoryNames = useCallback(() => {
    return [...productCategories, ...customCategories].map(c => c.name);
  }, [customCategories]);

  const getActiveCategoryData = useCallback(() => {
    return getAllCategories().find(c => c.name === activeCategory);
  }, [activeCategory, customCategories]);

  const handleAddProduct = (productName: string) => {
    setEditingProduct(productName);
    setTempSizes(['1kg']);
    setTempPrices({ '1kg': 0 });
  };

  const handleEditProduct = (productName: string) => {
    const existingProduct = productPrices[productName];
    if (existingProduct) {
      setEditingProduct(productName);
      setTempSizes(Object.keys(existingProduct.sizes));
      setTempPrices({ ...existingProduct.sizes });
    }
  };

  const handleSaveProduct = async () => {
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

    // Save to database
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('product_pricing')
        .upsert({
          user_id: user.id,
          product_name: editingProduct,
          sizes: tempPrices,
          margin: dealerInfo?.margin ? parseFloat(dealerInfo.margin) : 0
        }, {
          onConflict: 'user_id,product_name'
        });

      if (error) {
        console.error('Error saving product price:', error);
        toast.error('Failed to save product price');
      } else {
        toast.success('Product price saved successfully');
      }
    }
    
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

  const handleDeleteCustomProduct = async (productName: string, categoryName: string) => {
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

      // Delete from database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('product_pricing')
          .delete()
          .eq('user_id', user.id)
          .eq('product_name', productName);

        if (error) {
          console.error('Error deleting product price:', error);
          toast.error('Failed to delete product price');
        } else {
          toast.success('Product price deleted successfully');
        }
      }
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

  const handleDeleteCategory = async (categoryName: string) => {
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
    
    // Delete from database
    const { data: { user } } = await supabase.auth.getUser();
    if (user && categoryProducts.length > 0) {
      const { error } = await supabase
        .from('product_pricing')
        .delete()
        .eq('user_id', user.id)
        .in('product_name', categoryProducts);

      if (error) {
        console.error('Error deleting category products:', error);
        toast.error('Failed to delete category products');
      } else {
        toast.success('Category deleted successfully');
      }
    }

    categoryProducts.forEach(product => {
      delete updatedPrices[product];
    });
    setProductPrices(updatedPrices);
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
              onClick={() => navigate("/dashboard")}
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
        {/* Horizontal Scrollable Category Tabs */}
        <HorizontalTabs
          categories={getAllCategoryNames()}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          onAddCategory={handleAddNewCategory}
          className="mb-4"
        />

        {/* Active Category Content */}
        {(() => {
          const category = getActiveCategoryData();
          if (!category) return null;
          
          return (
            <div className="space-y-4">
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
                            onClick={() => handleEditProduct(product)}
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
            </div>
          );
        })()}

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