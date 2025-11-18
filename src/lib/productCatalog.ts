/**
 * Asian Paints Product Catalog
 * Complete structured data mapping for all products across categories
 * Total: 44 products organized in 5 categories
 */

export interface Product {
  productId: number;
  name: string;
  category: string;
  variant?: string;
  price?: number;
  stockQuantity?: number;
  unit?: string;
  description?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  products: Product[];
}

// Complete Asian Paints Product Catalog - 44 Products
export const asianPaintsProducts: Product[] = [
  // Putty Category (IDs: 1-2)
  {
    productId: 1,
    name: "AP TruCare Wall Putty",
    category: "Putty",
    unit: "kg",
    description: "High-quality wall putty for smooth finishing"
  },
  {
    productId: 2,
    name: "AP SmartCare Waterproof Wall Putty",
    category: "Putty",
    unit: "kg",
    description: "Waterproof wall putty for durable protection"
  },

  // Primer Category (IDs: 3-8)
  {
    productId: 3,
    name: "AP TruCare Interior Wall Primer",
    category: "Primer",
    variant: "Interior",
    unit: "L",
    description: "Interior wall primer for smooth paint application"
  },
  {
    productId: 4,
    name: "AP TruCare Exterior Wall Primer",
    category: "Primer",
    variant: "Exterior",
    unit: "L",
    description: "Exterior wall primer for weather protection"
  },
  {
    productId: 5,
    name: "AP SmartCare Damp Sheath Interior Primer",
    category: "Primer",
    variant: "Interior",
    unit: "L",
    description: "Damp-proof interior primer"
  },
  {
    productId: 6,
    name: "AP SmartCare Damp Sheath Exterior Primer",
    category: "Primer",
    variant: "Exterior",
    unit: "L",
    description: "Damp-proof exterior primer"
  },
  {
    productId: 7,
    name: "AP Apex Utima Protek Base Coat",
    category: "Primer",
    variant: "Exterior",
    unit: "L",
    description: "Premium base coat for ultimate protection"
  },
  {
    productId: 8,
    name: "AP Apex Utima Protek Duralife Base Coat",
    category: "Primer",
    variant: "Exterior",
    unit: "L",
    description: "Long-lasting premium base coat"
  },

  // Interior Emulsion Category (IDs: 9-25)
  {
    productId: 9,
    name: "AP Tractor Sparc Emulsion",
    category: "Interior Emulsion",
    variant: "Tractor Series",
    unit: "L",
    description: "Economy range interior emulsion"
  },
  {
    productId: 10,
    name: "AP Tractor UNO Emulsion",
    category: "Interior Emulsion",
    variant: "Tractor Series",
    unit: "L",
    description: "Single coat coverage emulsion"
  },
  {
    productId: 11,
    name: "AP Tractor Emulsion",
    category: "Interior Emulsion",
    variant: "Tractor Series",
    unit: "L",
    description: "Standard interior emulsion"
  },
  {
    productId: 12,
    name: "AP Tractor Advance",
    category: "Interior Emulsion",
    variant: "Tractor Series",
    unit: "L",
    description: "Advanced formula for better coverage"
  },
  {
    productId: 13,
    name: "AP Tractor Shyne",
    category: "Interior Emulsion",
    variant: "Tractor Series",
    unit: "L",
    description: "Sheen finish interior emulsion"
  },
  {
    productId: 14,
    name: "AP Tractor Shyne Advance",
    category: "Interior Emulsion",
    variant: "Tractor Series",
    unit: "L",
    description: "Advanced sheen finish emulsion"
  },
  {
    productId: 15,
    name: "AP Apcolite Premium Emulsion",
    category: "Interior Emulsion",
    variant: "Apcolite Series",
    unit: "L",
    description: "Premium interior emulsion"
  },
  {
    productId: 16,
    name: "AP Apcolite Premium Advance",
    category: "Interior Emulsion",
    variant: "Apcolite Series",
    unit: "L",
    description: "Premium advanced formula"
  },
  {
    productId: 17,
    name: "AP Apcolite Premium Advance Shyne",
    category: "Interior Emulsion",
    variant: "Apcolite Series",
    unit: "L",
    description: "Premium advanced sheen finish"
  },
  {
    productId: 18,
    name: "AP Apcolite All Protek Shyne",
    category: "Interior Emulsion",
    variant: "Apcolite Series",
    unit: "L",
    description: "All-surface protection with sheen"
  },
  {
    productId: 19,
    name: "AP Apcolite All Protek Matt",
    category: "Interior Emulsion",
    variant: "Apcolite Series",
    unit: "L",
    description: "All-surface protection with matt finish"
  },
  {
    productId: 20,
    name: "AP Royale Luxury Emulsion",
    category: "Interior Emulsion",
    variant: "Royale Series",
    unit: "L",
    description: "Luxury interior emulsion"
  },
  {
    productId: 21,
    name: "AP Royale Matt",
    category: "Interior Emulsion",
    variant: "Royale Series",
    unit: "L",
    description: "Matt finish luxury emulsion"
  },
  {
    productId: 22,
    name: "AP Royale Shyne",
    category: "Interior Emulsion",
    variant: "Royale Series",
    unit: "L",
    description: "Sheen finish luxury emulsion"
  },
  {
    productId: 23,
    name: "AP Royale Atomos",
    category: "Interior Emulsion",
    variant: "Royale Series",
    unit: "L",
    description: "Advanced air-purifying emulsion"
  },
  {
    productId: 24,
    name: "AP Royale Glitz",
    category: "Interior Emulsion",
    variant: "Royale Series",
    unit: "L",
    description: "Metallic finish luxury emulsion"
  },
  {
    productId: 25,
    name: "AP Royale Aspira",
    category: "Interior Emulsion",
    variant: "Royale Series",
    unit: "L",
    description: "Premium air-purifying formula"
  },

  // Exterior Emulsion Category (IDs: 26-37)
  {
    productId: 26,
    name: "AP Ace Emulsion",
    category: "Exterior Emulsion",
    variant: "Ace Series",
    unit: "L",
    description: "Standard exterior emulsion"
  },
  {
    productId: 27,
    name: "AP Ace Advance",
    category: "Exterior Emulsion",
    variant: "Ace Series",
    unit: "L",
    description: "Advanced exterior formula"
  },
  {
    productId: 28,
    name: "AP Ace Shyne",
    category: "Exterior Emulsion",
    variant: "Ace Series",
    unit: "L",
    description: "Sheen finish exterior emulsion"
  },
  {
    productId: 29,
    name: "AP Ace Shyne Advance",
    category: "Exterior Emulsion",
    variant: "Ace Series",
    unit: "L",
    description: "Advanced sheen finish for exterior"
  },
  {
    productId: 30,
    name: "AP Apex Emulsion",
    category: "Exterior Emulsion",
    variant: "Apex Series",
    unit: "L",
    description: "Premium exterior emulsion"
  },
  {
    productId: 31,
    name: "AP Apex Advance",
    category: "Exterior Emulsion",
    variant: "Apex Series",
    unit: "L",
    description: "Premium advanced exterior formula"
  },
  {
    productId: 32,
    name: "AP Apex Shyne",
    category: "Exterior Emulsion",
    variant: "Apex Series",
    unit: "L",
    description: "Premium sheen finish for exterior"
  },
  {
    productId: 33,
    name: "AP Apex Shyne Advance",
    category: "Exterior Emulsion",
    variant: "Apex Series",
    unit: "L",
    description: "Premium advanced sheen exterior"
  },
  {
    productId: 34,
    name: "AP Apex Ultima",
    category: "Exterior Emulsion",
    variant: "Apex Ultima Series",
    unit: "L",
    description: "Ultimate exterior protection"
  },
  {
    productId: 35,
    name: "AP Apex Ultima Stretch",
    category: "Exterior Emulsion",
    variant: "Apex Ultima Series",
    unit: "L",
    description: "Elastic ultimate exterior paint"
  },
  {
    productId: 36,
    name: "AP Apex Ultima Protek",
    category: "Exterior Emulsion",
    variant: "Apex Ultima Series",
    unit: "L",
    description: "Ultimate protection exterior"
  },
  {
    productId: 37,
    name: "AP Apex Ultima Protek Duralife",
    category: "Exterior Emulsion",
    variant: "Apex Ultima Series",
    unit: "L",
    description: "Long-lasting ultimate protection"
  },

  // Waterproofing Category (IDs: 38-44)
  {
    productId: 38,
    name: "AP SmartCare Damp Proof",
    category: "Waterproofing",
    variant: "Damp Proof Series",
    unit: "L",
    description: "Standard waterproofing solution"
  },
  {
    productId: 39,
    name: "AP SmartCare Damp Proof Advance",
    category: "Waterproofing",
    variant: "Damp Proof Series",
    unit: "L",
    description: "Advanced waterproofing formula"
  },
  {
    productId: 40,
    name: "AP SmartCare Damp Proof Xtreme",
    category: "Waterproofing",
    variant: "Damp Proof Series",
    unit: "L",
    description: "Extreme waterproofing protection"
  },
  {
    productId: 41,
    name: "AP SmartCare Damp Proof Ultra",
    category: "Waterproofing",
    variant: "Damp Proof Series",
    unit: "L",
    description: "Ultra waterproofing solution"
  },
  {
    productId: 42,
    name: "AP SmartCare Hydrolac Xtreme",
    category: "Waterproofing",
    variant: "Hydrolac Series",
    unit: "L",
    description: "Extreme hydrophobic protection"
  },
  {
    productId: 43,
    name: "AP SmartCare Damp Block 2k",
    category: "Waterproofing",
    variant: "Two-Component Series",
    unit: "kg",
    description: "Two-component waterproofing"
  },
  {
    productId: 44,
    name: "AP SmartCare Epoxy TriBlock 2k",
    category: "Waterproofing",
    variant: "Two-Component Series",
    unit: "kg",
    description: "Three-layer epoxy waterproofing"
  }
];

// Organize products by category
export const productsByCategory: ProductCategory[] = [
  {
    id: "putty",
    name: "Putty",
    products: asianPaintsProducts.filter(p => p.category === "Putty")
  },
  {
    id: "primer",
    name: "Primer",
    products: asianPaintsProducts.filter(p => p.category === "Primer")
  },
  {
    id: "interior-emulsion",
    name: "Interior Emulsion",
    products: asianPaintsProducts.filter(p => p.category === "Interior Emulsion")
  },
  {
    id: "exterior-emulsion",
    name: "Exterior Emulsion",
    products: asianPaintsProducts.filter(p => p.category === "Exterior Emulsion")
  },
  {
    id: "waterproofing",
    name: "Waterproofing",
    products: asianPaintsProducts.filter(p => p.category === "Waterproofing")
  }
];

// Helper functions for product retrieval
export const getProductById = (id: number): Product | undefined => {
  return asianPaintsProducts.find(p => p.productId === id);
};

export const getProductsByCategory = (category: string): Product[] => {
  return asianPaintsProducts.filter(p => p.category === category);
};

export const getProductsByVariant = (variant: string): Product[] => {
  return asianPaintsProducts.filter(p => p.variant === variant);
};

export const getAllCategories = (): string[] => {
  return [...new Set(asianPaintsProducts.map(p => p.category))];
};

export const getAllVariants = (): string[] => {
  return [...new Set(asianPaintsProducts.filter(p => p.variant).map(p => p.variant!))];
};

// Data export functions
export const productsToCSV = (): string => {
  const headers = ['ProductID', 'Name', 'Category', 'Variant', 'Price', 'StockQuantity', 'Unit', 'Description'];
  const rows = asianPaintsProducts.map(p => [
    p.productId,
    p.name,
    p.category,
    p.variant || '',
    p.price || '',
    p.stockQuantity || '',
    p.unit || '',
    p.description || ''
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
};

export const productsToJSON = (): string => {
  return JSON.stringify(asianPaintsProducts, null, 2);
};
