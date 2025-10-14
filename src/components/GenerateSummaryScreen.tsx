import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AreaConfig {
  id: string;
  areaType: string;
  paintingSystem: string;
  area: number;
  perSqFtRate: string;
  label?: string;
  selectedMaterials: {
    putty: string;
    primer: string;
    emulsion: string;
  };
  coatConfiguration: {
    putty: number;
    primer: number;
    emulsion: number;
  };
  repaintingConfiguration?: {
    primer: number;
    emulsion: number;
  };
}

export default function GenerateSummaryScreen() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [loading, setLoading] = useState(true);
  const [areaConfigs, setAreaConfigs] = useState<AreaConfig[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [dealerMargin, setDealerMargin] = useState(0);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      // Load area configurations from localStorage
      const paintType = localStorage.getItem(`selected_paint_type_${projectId}`) || 'Interior';
      const configsKey = `area_configurations_${projectId}_${paintType}`;
      const configsStr = localStorage.getItem(configsKey);
      if (configsStr) {
        setAreaConfigs(JSON.parse(configsStr));
      }

      // Load rooms from Supabase
      const { data: roomsData } = await supabase
        .from('rooms')
        .select('*')
        .eq('project_id', projectId);
      if (roomsData) setRooms(roomsData);

      // Load dealer info
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: dealerData } = await supabase
          .from('dealer_info')
          .select('margin')
          .eq('user_id', user.id)
          .single();
        if (dealerData) setDealerMargin(Number(dealerData.margin) || 0);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  // Section 1: Type of Interior & Wall Full Details
  const renderTypeDetails = () => {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">1. Type of Interior & Wall Full Details</CardTitle>
        </CardHeader>
        <CardContent>
          {areaConfigs.map((config, idx) => {
            const area = Number(config.area) || 0;
            const rate = parseFloat(config.perSqFtRate) || 0;
            const cost = area * rate;
            const coats = config.paintingSystem === 'Fresh Painting' 
              ? `Putty: ${config.coatConfiguration.putty}, Primer: ${config.coatConfiguration.primer}, Emulsion: ${config.coatConfiguration.emulsion}`
              : `Primer: ${config.repaintingConfiguration?.primer || 0}, Emulsion: ${config.repaintingConfiguration?.emulsion || 0}`;

            return (
              <div key={config.id} className="mb-4 p-3 border rounded">
                <p className="font-semibold">{config.label || config.areaType}</p>
                <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                  <p>Paint Type: {config.areaType}</p>
                  <p>Painting System: {config.paintingSystem || '-'}</p>
                  <p>Coats: {coats}</p>
                  <p>Area: {area.toFixed(2)} Sq. Ft</p>
                  <p>Per Sq. Ft Rate: ₹{rate.toFixed(2)}</p>
                  <p>Cost: ₹{cost.toFixed(2)}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  };

  // Section 2: Total Room Details
  const renderRoomDetails = () => {
    let totalFloor = 0;
    let totalWall = 0;
    let totalCeiling = 0;

    rooms.forEach(room => {
      const selectedAreas = room.selected_areas || { floor: true, wall: true, ceiling: false };
      if (selectedAreas.floor) totalFloor += Number(room.floor_area || 0);
      if (selectedAreas.wall) totalWall += Number(room.adjusted_wall_area || room.wall_area || 0);
      if (selectedAreas.ceiling) totalCeiling += Number(room.ceiling_area || 0);
    });

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">2. Total Room Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-muted rounded">
              <p className="font-semibold">Totals</p>
              <div className="grid grid-cols-3 gap-2 text-sm mt-2">
                <p>Floor: {totalFloor.toFixed(2)} Sq. Ft</p>
                <p>Wall: {totalWall.toFixed(2)} Sq. Ft</p>
                <p>Ceiling: {totalCeiling.toFixed(2)} Sq. Ft</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="font-semibold">Individual Rooms</p>
              {rooms.map(room => (
                <div key={room.id} className="p-2 border rounded text-sm">
                  <p className="font-medium">{room.name}</p>
                  <div className="grid grid-cols-3 gap-1 mt-1 text-xs">
                    <p>Floor: {Number(room.floor_area || 0).toFixed(2)}</p>
                    <p>Wall: {Number(room.adjusted_wall_area || room.wall_area || 0).toFixed(2)}</p>
                    <p>Ceiling: {Number(room.ceiling_area || 0).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Section 3: Labour Section
  const renderLabourSection = () => {
    const totalArea = areaConfigs.reduce((sum, config) => sum + Number(config.area || 0), 0);
    const areaPerLabourPerDay = 200; // sq ft per labour per day
    const perDayLabour = Math.ceil(totalArea / (areaPerLabourPerDay * 5));
    const noOfDays = 5;
    const labourTotal = perDayLabour * noOfDays;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">3. Labour Section</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>Per Day Labour: {perDayLabour} labourers</p>
            <p>No of Days: {noOfDays} days</p>
            <p>Labour Total: {labourTotal} labourers</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Section 4: Material Section
  const renderMaterialSection = () => {
    const materials: any = {};
    
    areaConfigs.forEach(config => {
      const area = Number(config.area) || 0;
      const isFresh = config.paintingSystem === 'Fresh Painting';
      
      if (isFresh) {
        if (config.selectedMaterials.putty) {
          const coverage = 20; // sq ft per liter
          const liters = (area / coverage) * config.coatConfiguration.putty;
          materials[config.selectedMaterials.putty] = (materials[config.selectedMaterials.putty] || 0) + liters;
        }
        if (config.selectedMaterials.primer) {
          const coverage = 120; // sq ft per liter
          const liters = (area / coverage) * config.coatConfiguration.primer;
          materials[config.selectedMaterials.primer] = (materials[config.selectedMaterials.primer] || 0) + liters;
        }
        if (config.selectedMaterials.emulsion) {
          const coverage = 120; // sq ft per liter
          const liters = (area / coverage) * config.coatConfiguration.emulsion;
          materials[config.selectedMaterials.emulsion] = (materials[config.selectedMaterials.emulsion] || 0) + liters;
        }
      } else {
        if (config.selectedMaterials.primer) {
          const coverage = 120;
          const liters = (area / coverage) * (config.repaintingConfiguration?.primer || 0);
          materials[config.selectedMaterials.primer] = (materials[config.selectedMaterials.primer] || 0) + liters;
        }
        if (config.selectedMaterials.emulsion) {
          const coverage = 120;
          const liters = (area / coverage) * (config.repaintingConfiguration?.emulsion || 0);
          materials[config.selectedMaterials.emulsion] = (materials[config.selectedMaterials.emulsion] || 0) + liters;
        }
      }
    });

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">4. Material Section</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="font-semibold">Material Required</p>
            {Object.entries(materials).map(([material, liters]) => (
              <div key={material} className="flex justify-between text-sm p-2 border rounded">
                <span>{material}</span>
                <span>{(liters as number).toFixed(2)} Liters</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Section 5: Dealer Margin
  const renderDealerMargin = () => {
    const totalMaterialCost = areaConfigs.reduce((sum, config) => {
      const area = Number(config.area) || 0;
      const rate = parseFloat(config.perSqFtRate) || 0;
      return sum + (area * rate);
    }, 0);
    
    const marginCost = (totalMaterialCost * dealerMargin) / 100;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">5. Dealer Margin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>Margin: {dealerMargin}%</p>
            <p className="font-semibold">Margin Cost: ₹{marginCost.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Section 6: Estimated Total Cost
  const renderTotalCost = () => {
    const materialCost = areaConfigs.reduce((sum, config) => {
      const area = Number(config.area) || 0;
      const rate = parseFloat(config.perSqFtRate) || 0;
      return sum + (area * rate);
    }, 0);

    const marginCost = (materialCost * dealerMargin) / 100;
    const labourCost = 500; // placeholder
    const totalCost = materialCost + marginCost + labourCost;

    return (
      <Card className="mb-6 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">6. Estimated Total Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Material Cost:</span>
              <span>₹{materialCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Labour Cost:</span>
              <span>₹{labourCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Dealer Margin:</span>
              <span>₹{marginCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total:</span>
              <span>₹{totalCost.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="eca-gradient text-white p-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => navigate(`/paint-estimation/${projectId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <FileText className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Generate Summary</h1>
          </div>
        </div>
      </div>

      <div className="p-4">
        {renderTypeDetails()}
        {renderRoomDetails()}
        {renderLabourSection()}
        {renderMaterialSection()}
        {renderDealerMargin()}
        {renderTotalCost()}
      </div>
    </div>
  );
}
