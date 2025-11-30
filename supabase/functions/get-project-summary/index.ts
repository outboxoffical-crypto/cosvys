import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { project_id } = await req.json();

    if (!project_id || typeof project_id !== 'string') {
      return new Response(JSON.stringify({ error: 'Valid project_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header for user context
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing summary for project ${project_id}, user ${userId}`);

    // Fetch all required data in parallel
    const [projectResult, roomsResult, coverageResult, pricingResult, dealerResult] = await Promise.all([
      supabase.from('projects').select('*').eq('id', project_id).eq('user_id', userId).single(),
      supabase.from('rooms').select('*').eq('project_id', project_id).eq('user_id', userId),
      supabase.from('coverage_data').select('product_name, coverage_range, coats, category'),
      supabase.from('product_pricing').select('product_name, sizes, category').eq('user_id', userId).eq('is_visible', true),
      supabase.from('dealer_info').select('margin').eq('user_id', userId).maybeSingle()
    ]);

    if (projectResult.error) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const project = projectResult.data;
    const rooms = roomsResult.data || [];
    const coverageData = coverageResult.data || [];
    const pricingData = pricingResult.data || [];
    const dealerMargin = dealerResult.data?.margin || 0;

    // Build coverage and pricing maps
    const coverageMap: Record<string, any> = {};
    coverageData.forEach(item => {
      const key = item.product_name.toLowerCase();
      if (!coverageMap[key]) {
        coverageMap[key] = [];
      }
      coverageMap[key].push({
        coverage_range: item.coverage_range,
        coats: item.coats,
        category: item.category
      });
    });

    const pricingMap: Record<string, any> = {};
    pricingData.forEach(item => {
      pricingMap[item.product_name.toLowerCase()] = item.sizes;
    });

    // Calculate area totals by project type
    const areaTotals: Record<string, { floor: number; wall: number; ceiling: number; enamel: number }> = {
      Interior: { floor: 0, wall: 0, ceiling: 0, enamel: 0 },
      Exterior: { floor: 0, wall: 0, ceiling: 0, enamel: 0 },
      Waterproofing: { floor: 0, wall: 0, ceiling: 0, enamel: 0 },
    };

    rooms.forEach(room => {
      const projectType = room.project_type || 'Interior';
      const selectedAreas = room.selected_areas || { floor: true, wall: true, ceiling: false };
      
      if (selectedAreas.floor) {
        areaTotals[projectType].floor += Number(room.floor_area || 0);
      }
      if (selectedAreas.wall) {
        areaTotals[projectType].wall += Number(room.adjusted_wall_area || room.wall_area || 0);
      }
      if (selectedAreas.ceiling) {
        areaTotals[projectType].ceiling += Number(room.ceiling_area || 0);
      }
      areaTotals[projectType].enamel += Number(room.total_door_window_grill_area || 0);
    });

    // Helper to parse coverage range
    const parseCoverage = (coverageRange: string): number => {
      const match = coverageRange.match(/(\d+)-?(\d+)?/);
      if (match) {
        return parseInt(match[1]); // Return minimum value
      }
      return 120; // Default fallback
    };

    // Helper to get optimal pack combination
    const getOptimalPackCombination = (requiredLiters: number, sizes: any): any => {
      if (!sizes || typeof sizes !== 'object') {
        return { combination: [], totalCost: 0, totalQuantity: 0 };
      }

      const availableSizes = Object.entries(sizes)
        .map(([size, price]) => ({
          size: parseFloat(size),
          price: typeof price === 'number' ? price : parseFloat(String(price))
        }))
        .filter(s => !isNaN(s.size) && !isNaN(s.price))
        .sort((a, b) => b.size - a.size);

      if (availableSizes.length === 0) {
        return { combination: [], totalCost: 0, totalQuantity: 0 };
      }

      let remaining = requiredLiters;
      const combination: Array<{ size: number; quantity: number; price: number }> = [];
      let totalCost = 0;

      for (const sizeOption of availableSizes) {
        if (remaining <= 0) break;
        const quantity = Math.floor(remaining / sizeOption.size);
        if (quantity > 0) {
          combination.push({
            size: sizeOption.size,
            quantity: quantity,
            price: sizeOption.price * quantity
          });
          totalCost += sizeOption.price * quantity;
          remaining -= quantity * sizeOption.size;
        }
      }

      // Add one more pack of smallest size if there's remaining
      if (remaining > 0 && availableSizes.length > 0) {
        const smallestSize = availableSizes[availableSizes.length - 1];
        const existing = combination.find(c => c.size === smallestSize.size);
        if (existing) {
          existing.quantity += 1;
          existing.price += smallestSize.price;
          totalCost += smallestSize.price;
        } else {
          combination.push({
            size: smallestSize.size,
            quantity: 1,
            price: smallestSize.price
          });
          totalCost += smallestSize.price;
        }
      }

      return {
        combination,
        totalCost,
        totalQuantity: requiredLiters
      };
    };

    // Calculate material requirements for all configurations
    const calculateMaterials = (configs: any[]): any => {
      const materials: any[] = [];
      let totalMaterialCost = 0;

      configs.forEach(config => {
        const area = Number(config.area || 0);
        const isFreshPainting = config.paintingSystem === 'Fresh Painting';

        const materialCalc: any = {
          configId: config.id,
          configLabel: config.label || config.areaType,
          paintType: config.paintTypeCategory || 'Interior',
          materials: []
        };

        // Calculate putty (Fresh Painting only)
        if (isFreshPainting && config.coatConfiguration?.putty > 0) {
          const puttyName = config.selectedMaterials?.putty || '';
          const puttyCoats = config.coatConfiguration.putty;
          const puttyCoverageData = coverageMap[puttyName.toLowerCase()];
          const puttyCoverage = puttyCoverageData ? parseCoverage(puttyCoverageData[0]?.coverage_range || '12-15') : 12;
          const puttyLiters = (area * puttyCoats) / puttyCoverage;
          const puttyPricing = pricingMap[puttyName.toLowerCase()];
          const puttyPacks = getOptimalPackCombination(puttyLiters, puttyPricing);
          
          materialCalc.materials.push({
            name: puttyName,
            type: 'Putty',
            quantity: puttyLiters,
            unit: 'kg',
            coats: puttyCoats,
            coverage: puttyCoverage,
            packs: puttyPacks.combination,
            cost: puttyPacks.totalCost
          });
          totalMaterialCost += puttyPacks.totalCost;
        }

        // Calculate primer
        const primerCoats = isFreshPainting ? 
          (config.coatConfiguration?.primer || 0) : 
          (config.repaintingConfiguration?.primer || 0);
        
        if (primerCoats > 0) {
          const primerName = config.selectedMaterials?.primer || '';
          const primerCoverageData = coverageMap[primerName.toLowerCase()];
          const primerCoverage = primerCoverageData ? parseCoverage(primerCoverageData[0]?.coverage_range || '110-120') : 110;
          const primerLiters = (area * primerCoats) / primerCoverage;
          const primerPricing = pricingMap[primerName.toLowerCase()];
          const primerPacks = getOptimalPackCombination(primerLiters, primerPricing);
          
          materialCalc.materials.push({
            name: primerName,
            type: 'Primer',
            quantity: primerLiters,
            unit: 'ltr',
            coats: primerCoats,
            coverage: primerCoverage,
            packs: primerPacks.combination,
            cost: primerPacks.totalCost
          });
          totalMaterialCost += primerPacks.totalCost;
        }

        // Calculate emulsion
        const emulsionCoats = isFreshPainting ? 
          (config.coatConfiguration?.emulsion || 0) : 
          (config.repaintingConfiguration?.emulsion || 0);
        
        if (emulsionCoats > 0) {
          const emulsionName = config.selectedMaterials?.emulsion || '';
          const emulsionCoverageData = coverageMap[emulsionName.toLowerCase()];
          const emulsionCoverage = emulsionCoverageData ? parseCoverage(emulsionCoverageData[0]?.coverage_range || '120-140') : 120;
          const emulsionLiters = (area * emulsionCoats) / emulsionCoverage;
          const emulsionPricing = pricingMap[emulsionName.toLowerCase()];
          const emulsionPacks = getOptimalPackCombination(emulsionLiters, emulsionPricing);
          
          materialCalc.materials.push({
            name: emulsionName,
            type: 'Emulsion',
            quantity: emulsionLiters,
            unit: 'ltr',
            coats: emulsionCoats,
            coverage: emulsionCoverage,
            packs: emulsionPacks.combination,
            cost: emulsionPacks.totalCost
          });
          totalMaterialCost += emulsionPacks.totalCost;
        }

        materials.push(materialCalc);
      });

      return { materials, totalMaterialCost };
    };

    // Calculate labour requirements
    const calculateLabour = (configs: any[]): any => {
      const perDayLabourCost = 1100;
      const workingHoursPerDay = 8;
      const totalPaintableArea = configs.reduce((sum, config) => sum + Number(config.area || 0), 0);
      
      // Average coverage rate: 150 sq.ft per litre, 8 hours per day
      const avgCoveragePerDay = 150 * workingHoursPerDay; // 1200 sq.ft per day per person
      const labourDays = Math.ceil(totalPaintableArea / avgCoveragePerDay);
      const totalLabourCost = labourDays * perDayLabourCost;

      return {
        totalPaintableArea,
        labourDays,
        labourPerDay: 1,
        perDayLabourCost,
        totalLabourCost
      };
    };

    // Get configurations from localStorage cache sent by client or reconstruct
    const summary: any = {
      projectId: project_id,
      projectData: {
        customer_name: project.customer_name,
        phone: project.phone,
        location: project.location,
        project_type: project.project_type,
        area_sqft: project.area_sqft,
        quotation_value: project.quotation_value
      },
      areaTotals,
      rooms: rooms.map(r => ({
        id: r.id,
        name: r.name,
        project_type: r.project_type,
        floor_area: r.floor_area,
        wall_area: r.adjusted_wall_area || r.wall_area,
        ceiling_area: r.ceiling_area,
        enamel_area: r.total_door_window_grill_area,
        selected_areas: r.selected_areas
      })),
      dealerMargin,
      timestamp: Date.now()
    };

    // Note: Client will send configurations in the request body for accurate calculations
    // For now, return the base summary structure
    return new Response(JSON.stringify({
      success: true,
      summary,
      // Helpers that client can use
      helpers: {
        coverageMap,
        pricingMap
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating project summary:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate summary',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
