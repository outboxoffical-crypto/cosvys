import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalculationRequest {
  project_id: string;
  paint_type: string;
  configurations: any[];
  labour_mode: 'auto' | 'manual';
  manual_days?: number;
  auto_labour_per_day?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    });

    const { 
      project_id,
      paint_type,
      configurations,
      labour_mode,
      manual_days = 5,
      auto_labour_per_day = 1
    }: CalculationRequest = await req.json();

    console.log(`[calculate-project-summary] Starting calculation for project ${project_id}`);

    // Fetch project data
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .single();

    if (projectError || !projectData) {
      throw new Error(`Failed to fetch project: ${projectError?.message || 'Project not found'}`);
    }

    // Fetch rooms (only essential fields for calculations)
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, name, project_type, floor_area, wall_area, ceiling_area, adjusted_wall_area, selected_areas')
      .eq('project_id', project_id);

    if (roomsError) {
      throw new Error(`Failed to fetch rooms: ${roomsError.message}`);
    }

    // Batch processing for better performance - smaller batches prevent freezing
    const BATCH_SIZE = 10; // Process 10 rooms at a time
    const roomBatches = [];
    for (let i = 0; i < (rooms || []).length; i += BATCH_SIZE) {
      roomBatches.push((rooms || []).slice(i, i + BATCH_SIZE));
    }

    console.log(`Processing ${rooms?.length || 0} rooms in ${roomBatches.length} batch(es) - optimized for performance`);

    // Fetch coverage data and product pricing in parallel
    const [coverageResult, pricingResult, dealerResult] = await Promise.all([
      supabase.from('coverage_data').select('*'),
      supabase.from('product_pricing').select('*').eq('user_id', projectData.user_id).eq('is_visible', true),
      supabase.from('dealer_info').select('margin').eq('user_id', projectData.user_id).single()
    ]);

    const coverageData = coverageResult.data || [];
    const productPricing = pricingResult.data || [];
    const dealerMargin = dealerResult.data?.margin || 0;

    // Build coverage map
    const coverageMap: Record<string, any> = {};
    coverageData.forEach((item: any) => {
      coverageMap[item.product_name] = item;
    });

    // Build pricing map
    const pricingMap: Record<string, any> = {};
    productPricing.forEach((item: any) => {
      pricingMap[item.product_name] = item;
    });

    // Calculate material requirements for each configuration
    const materialCalculations: any[] = [];
    let totalProjectCost = 0;

    for (const config of configurations) {
      const area = config.area || 0;
      const perSqFtRate = parseFloat(config.perSqFtRate || '0');
      const configCost = area * perSqFtRate;
      totalProjectCost += configCost;

      // Calculate material quantities
      const materials = calculateMaterialQuantities(
        config,
        area,
        coverageMap,
        pricingMap
      );

      materialCalculations.push({
        config_id: config.id,
        area_type: config.areaType,
        painting_system: config.paintingSystem,
        area,
        per_sqft_rate: perSqFtRate,
        cost: configCost,
        materials
      });
    }

    // Calculate labour costs
    const perDayLabourCost = 1100;
    let labourCost = 0;
    let labourDays = 0;

    if (labour_mode === 'manual') {
      labourDays = manual_days;
      labourCost = manual_days * perDayLabourCost * auto_labour_per_day;
    } else {
      // Auto mode: calculate based on area
      const totalArea = configurations.reduce((sum, c) => sum + (c.area || 0), 0);
      const areaPerDay = 200; // sq.ft per labour per day
      labourDays = Math.ceil(totalArea / areaPerDay / auto_labour_per_day);
      labourCost = labourDays * perDayLabourCost * auto_labour_per_day;
    }

    // Calculate margin
    const marginCost = totalProjectCost * 0.10; // 10% margin

    // Calculate totals
    const actualTotalCost = totalProjectCost + marginCost + labourCost;
    const totalMaterialCost = materialCalculations.reduce(
      (sum, calc) => sum + calc.materials.totalCost,
      0
    );

    // Build response
    const summary = {
      project_id,
      project_data: {
        customer_name: projectData.customer_name,
        phone: projectData.phone,
        location: projectData.location,
        project_type: projectData.project_type,
        lead_id: projectData.lead_id
      },
      paint_type,
      configurations: materialCalculations,
      labour: {
        mode: labour_mode,
        days: labourDays,
        per_day_cost: perDayLabourCost,
        labourers_per_day: auto_labour_per_day,
        total_cost: labourCost
      },
      costs: {
        total_project_cost: totalProjectCost,
        margin_cost: marginCost,
        labour_cost: labourCost,
        material_cost: totalMaterialCost,
        actual_total_cost: actualTotalCost,
        dealer_margin: dealerMargin
      },
      rooms_count: rooms?.length || 0,
      calculated_at: new Date().toISOString()
    };

    console.log(`[calculate-project-summary] ✓ Calculation complete for project ${project_id}`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[calculate-project-summary] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to calculate project summary'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function calculateMaterialQuantities(
  config: any,
  area: number,
  coverageMap: Record<string, any>,
  pricingMap: Record<string, any>
) {
  const materials: any = {
    putty: null,
    primer: null,
    emulsion: null,
    totalCost: 0
  };

  // Calculate putty
  if (config.selectedMaterials?.putty) {
    const puttyProduct = config.selectedMaterials.putty;
    const coverage = coverageMap[puttyProduct];
    const pricing = pricingMap[puttyProduct];
    
    if (coverage && pricing) {
      const coats = config.coatConfiguration?.putty || 2;
      const coverageRange = coverage.coverage_range.split('-').map((v: string) => parseFloat(v.trim()));
      const minCoverage = coverageRange[0];
      
      const qtyRequired = (area * coats) / minCoverage;
      const sizes = pricing.sizes as any;
      const price = sizes['20 kg']?.selling_price || 0;
      const packSize = 20;
      const minQty = Math.ceil(qtyRequired / packSize);
      
      materials.putty = {
        product: puttyProduct,
        coats,
        qty_required: qtyRequired,
        min_qty: minQty,
        pack_size: packSize,
        price_per_pack: price,
        total_cost: minQty * price
      };
      materials.totalCost += materials.putty.total_cost;
    }
  }

  // Calculate primer
  if (config.selectedMaterials?.primer) {
    const primerProduct = config.selectedMaterials.primer;
    const coverage = coverageMap[primerProduct];
    const pricing = pricingMap[primerProduct];
    
    if (coverage && pricing) {
      const coats = config.coatConfiguration?.primer || 1;
      const coverageRange = coverage.coverage_range.split('-').map((v: string) => parseFloat(v.trim()));
      const minCoverage = coverageRange[0];
      
      const qtyRequired = (area * coats) / minCoverage;
      const sizes = pricing.sizes as any;
      const price = sizes['20 Ltr']?.selling_price || sizes['10 Ltr']?.selling_price || 0;
      const packSize = 20;
      const minQty = Math.ceil(qtyRequired / packSize);
      
      materials.primer = {
        product: primerProduct,
        coats,
        qty_required: qtyRequired,
        min_qty: minQty,
        pack_size: packSize,
        price_per_pack: price,
        total_cost: minQty * price
      };
      materials.totalCost += materials.primer.total_cost;
    }
  }

  // Calculate emulsion
  if (config.selectedMaterials?.emulsion) {
    const emulsionProduct = config.selectedMaterials.emulsion;
    const coverage = coverageMap[emulsionProduct];
    const pricing = pricingMap[emulsionProduct];
    
    if (coverage && pricing) {
      const coats = config.coatConfiguration?.emulsion || 2;
      const coverageRange = coverage.coverage_range.split('-').map((v: string) => parseFloat(v.trim()));
      const minCoverage = coverageRange[0];
      
      const qtyRequired = (area * coats) / minCoverage;
      const sizes = pricing.sizes as any;
      const price = sizes['20 Ltr']?.selling_price || sizes['10 Ltr']?.selling_price || 0;
      const packSize = 20;
      const minQty = Math.ceil(qtyRequired / packSize);
      
      materials.emulsion = {
        product: emulsionProduct,
        coats,
        qty_required: qtyRequired,
        min_qty: minQty,
        pack_size: packSize,
        price_per_pack: price,
        total_cost: minQty * price
      };
      materials.totalCost += materials.emulsion.total_cost;
    }
  }

  return materials;
}
