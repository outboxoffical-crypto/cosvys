/**
 * Asian Paints Product Catalog
 * Complete structured data mapping for all products across categories
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

// Complete Asian Paints Product Catalog
export const asianPaintsProducts: Product[] = [
  // Essential & Other Category (IDs: 1-7)
  {
    productId: 1,
    name: "AP SmartCare Repair Polymer",
    category: "Essential & Other",
    unit: "kg",
    description: "High-quality repair polymer for crack filling"
  },
  {
    productId: 2,
    name: "AP SmartCare Vitalia Neo",
    category: "Essential & Other",
    unit: "L",
    description: "Advanced wall care solution"
  },
  {
    productId: 3,
    name: "AP TruCare Masking Kit",
    category: "Essential & Other",
    unit: "pack",
    description: "Complete masking kit for painting projects"
  },
  {
    productId: 4,
    name: "AP TruCare Wall Putty",
    category: "Essential & Other",
    unit: "kg",
    description: "High-quality wall putty for smooth finishing"
  },
  {
    productId: 5,
    name: "AP SmartCare Waterproof Wall Putty",
    category: "Essential & Other",
    unit: "kg",
    description: "Waterproof wall putty for durable protection"
  },
  {
    productId: 6,
    name: "AP TruCare Acrylic Wall Putty",
    category: "Essential & Other",
    unit: "kg",
    description: "Acrylic-based wall putty for superior finish"
  },
  {
    productId: 7,
    name: "AP SmartCare Crack Seal",
    category: "Essential & Other",
    unit: "kg",
    description: "Professional crack sealing compound"
  },

  // Primer Category (IDs: 8-13)
  {
    productId: 8,
    name: "AP TruCare Interior Wall Primer",
    category: "Primer",
    variant: "Interior",
    unit: "L",
    description: "Interior wall primer for smooth paint application"
  },
  {
    productId: 9,
    name: "AP TruCare Exterior Wall Primer",
    category: "Primer",
    variant: "Exterior",
    unit: "L",
    description: "Exterior wall primer for weather protection"
  },
  {
    productId: 10,
    name: "AP SmartCare Damp Sheath Interior Primer",
    category: "Primer",
    variant: "Interior",
    unit: "L",
    description: "Damp-proof interior primer"
  },
  {
    productId: 11,
    name: "AP SmartCare Damp Sheath Exterior Primer",
    category: "Primer",
    variant: "Exterior",
    unit: "L",
    description: "Damp-proof exterior primer"
  },
  {
    productId: 12,
    name: "AP Apex Utima Protek Base Coat",
    category: "Primer",
    variant: "Premium",
    unit: "L",
    description: "Premium base coat for ultimate protection"
  },
  {
    productId: 13,
    name: "AP Apex Utima Protek Duralife Base Coat",
    category: "Primer",
    variant: "Premium",
    unit: "L",
    description: "Long-lasting premium base coat"
  },

  // Interior Emulsion Category (IDs: 14-30)
  {
    productId: 14,
    name: "AP Tractor Sparc Emulsion",
    category: "Interior Emulsion",
    variant: "Tractor Series",
    unit: "L",
    description: "Economy range interior emulsion"
  },
  {
    productId: 15,
    name: "AP Tractor UNO Emulsion",
    category: "Interior Emulsion",
    variant: "Tractor Series",
    unit: "L",
    description: "Single coat coverage emulsion"
  },
  {
    productId: 16,
    name: "AP Tractor Emulsion",
    category: "Interior Emulsion",
    variant: "Tractor Series",
    unit: "L",
    description: "Standard interior emulsion"
  },
  {
    productId: 17,
    name: "AP Tractor Advance",
    category: "Interior Emulsion",
    variant: "Tractor Series",
    unit: "L",
    description: "Advanced interior emulsion with better coverage"
  },
  {
    productId: 18,
    name: "AP Tractor Shyne",
    category: "Interior Emulsion",
    variant: "Tractor Series",
    unit: "L",
    description: "Shiny finish interior emulsion"
  },
  {
    productId: 19,
    name: "AP Tractor Shyne Advance",
    category: "Interior Emulsion",
    variant: "Tractor Series",
    unit: "L",
    description: "Advanced shiny finish emulsion"
  },
  {
    productId: 20,
    name: "AP Apcolite Premium Emulsion",
    category: "Interior Emulsion",
    variant: "Apcolite Series",
    unit: "L",
    description: "Premium quality interior emulsion"
  },
  {
    productId: 21,
    name: "AP Apcolite Premium Advance",
    category: "Interior Emulsion",
    variant: "Apcolite Series",
    unit: "L",
    description: "Advanced premium emulsion"
  },
  {
    productId: 22,
    name: "AP Apcolite Premium Advance Shyne",
    category: "Interior Emulsion",
    variant: "Apcolite Series",
    unit: "L",
    description: "Premium emulsion with shiny finish"
  },
  {
    productId: 23,
    name: "AP Apcolite All Protek Shyne",
    category: "Interior Emulsion",
    variant: "Apcolite Series",
    unit: "L",
    description: "All-round protection with shiny finish"
  },
  {
    productId: 24,
    name: "AP Apcolite All Protek Matt",
    category: "Interior Emulsion",
    variant: "Apcolite Series",
    unit: "L",
    description: "All-round protection with matt finish"
  },
  {
    productId: 25,
    name: "AP Royale Luxury Emulsion",
    category: "Interior Emulsion",
    variant: "Royale Series",
    unit: "L",
    description: "Luxury range interior emulsion"
  },
  {
    productId: 26,
    name: "AP Royale Matt",
    category: "Interior Emulsion",
    variant: "Royale Series",
    unit: "L",
    description: "Premium matt finish emulsion"
  },
  {
    productId: 27,
    name: "AP Royale Shyne",
    category: "Interior Emulsion",
    variant: "Royale Series",
    unit: "L",
    description: "Premium shiny finish emulsion"
  },
  {
    productId: 28,
    name: "AP Royale Atomos",
    category: "Interior Emulsion",
    variant: "Royale Series",
    unit: "L",
    description: "Advanced air-purifying emulsion"
  },
  {
    productId: 29,
    name: "AP Royale Glitz",
    category: "Interior Emulsion",
    variant: "Royale Series",
    unit: "L",
    description: "Metallic finish luxury emulsion"
  },
  {
    productId: 30,
    name: "AP Royale Aspira",
    category: "Interior Emulsion",
    variant: "Royale Series",
    unit: "L",
    description: "Premium designer finish emulsion"
  },

  // Exterior Emulsion Category (IDs: 31-42)
  {
    productId: 31,
    name: "AP Ace Emulsion",
    category: "Exterior Emulsion",
    variant: "Ace Series",
    unit: "L",
    description: "Standard exterior emulsion"
  },
  {
    productId: 32,
    name: "AP Ace Advance",
    category: "Exterior Emulsion",
    variant: "Ace Series",
    unit: "L",
    description: "Advanced exterior emulsion"
  },
  {
    productId: 33,
    name: "AP Ace Shyne",
    category: "Exterior Emulsion",
    variant: "Ace Series",
    unit: "L",
    description: "Shiny finish exterior emulsion"
  },
  {
    productId: 34,
    name: "AP Ace Shyne Advance",
    category: "Exterior Emulsion",
    variant: "Ace Series",
    unit: "L",
    description: "Advanced shiny exterior finish"
  },
  {
    productId: 35,
    name: "AP Apex Emulsion",
    category: "Exterior Emulsion",
    variant: "Apex Series",
    unit: "L",
    description: "Premium exterior emulsion"
  },
  {
    productId: 36,
    name: "AP Apex Advance",
    category: "Exterior Emulsion",
    variant: "Apex Series",
    unit: "L",
    description: "Advanced premium exterior emulsion"
  },
  {
    productId: 37,
    name: "AP Apex Shyne",
    category: "Exterior Emulsion",
    variant: "Apex Series",
    unit: "L",
    description: "Premium shiny exterior finish"
  },
  {
    productId: 38,
    name: "AP Apex Shyne Advance",
    category: "Exterior Emulsion",
    variant: "Apex Series",
    unit: "L",
    description: "Advanced premium shiny finish"
  },
  {
    productId: 39,
    name: "AP Apex Ultima",
    category: "Exterior Emulsion",
    variant: "Apex Series",
    unit: "L",
    description: "Ultimate weather protection"
  },
  {
    productId: 40,
    name: "AP Apex Ultima Stretch",
    category: "Exterior Emulsion",
    variant: "Apex Series",
    unit: "L",
    description: "Stretchable crack-resistant coating"
  },
  {
    productId: 41,
    name: "AP Apex Ultima Protek",
    category: "Exterior Emulsion",
    variant: "Apex Series",
    unit: "L",
    description: "Maximum protection exterior coating"
  },
  {
    productId: 42,
    name: "AP Apex Ultima Protek Duralife",
    category: "Exterior Emulsion",
    variant: "Apex Series",
    unit: "L",
    description: "Long-lasting ultimate protection"
  },

  // Waterproofing Category (IDs: 43-49)
  {
    productId: 43,
    name: "AP SmartCare Damp Proof",
    category: "Waterproofing",
    variant: "Damp Proof Series",
    unit: "L",
    description: "Basic waterproofing solution"
  },
  {
    productId: 44,
    name: "AP SmartCare Damp Proof Advance",
    category: "Waterproofing",
    variant: "Damp Proof Series",
    unit: "L",
    description: "Advanced waterproofing solution"
  },
  {
    productId: 45,
    name: "AP SmartCare Damp Proof Xtreme",
    category: "Waterproofing",
    variant: "Damp Proof Series",
    unit: "L",
    description: "Extreme waterproofing protection"
  },
  {
    productId: 46,
    name: "AP SmartCare Damp Proof Ultra",
    category: "Waterproofing",
    variant: "Damp Proof Series",
    unit: "L",
    description: "Ultra-strong waterproofing"
  },
  {
    productId: 47,
    name: "AP SmartCare Hydrolac Xtreme",
    category: "Waterproofing",
    variant: "Specialty",
    unit: "L",
    description: "Advanced hydrophobic coating"
  },
  {
    productId: 48,
    name: "AP SmartCare Damp Block 2k",
    category: "Waterproofing",
    variant: "Specialty",
    unit: "kg",
    description: "Two-component waterproofing system"
  },
  {
    productId: 49,
    name: "AP SmartCare Epoxy TriBlock 2k",
    category: "Waterproofing",
    variant: "Specialty",
    unit: "kg",
    description: "Three-layer epoxy waterproofing system"
  }
];

// Organize products by category
export const productsByCategory: ProductCategory[] = [
  {
    id: "essential-other",
    name: "Essential & Other",
    products: asianPaintsProducts.filter(p => p.category === "Essential & Other")
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

// Helper functions
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
  return Array.from(new Set(asianPaintsProducts.map(p => p.category)));
};

export const getAllVariants = (): string[] => {
  return Array.from(new Set(asianPaintsProducts.map(p => p.variant).filter(Boolean) as string[]));
};

// Export for CSV/JSON usage
export const productsToCSV = (): string => {
  const headers = ["ProductID", "Name", "Category", "Variant", "Price", "StockQuantity", "Unit", "Description"];
  const rows = asianPaintsProducts.map(p => [
    p.productId,
    p.name,
    p.category,
    p.variant || "",
    p.price || "",
    p.stockQuantity || "",
    p.unit || "",
    p.description || ""
  ]);
  
  return [headers, ...rows].map(row => row.join(",")).join("\n");
};

export const productsToJSON = (): string => {
  return JSON.stringify(asianPaintsProducts, null, 2);
};
