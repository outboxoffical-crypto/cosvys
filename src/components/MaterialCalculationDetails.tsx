interface PackItem {
  size: string;
  count: number;
  price: number;
}

interface MaterialCalculationDetailsProps {
  materialName: string;
  materialType: string;
  area: number;
  coats: number;
  coverageRate: number;
  coverageDisplay: string;
  unit: string;
  requiredQuantity: number;
  totalCost: number;
  packCombination: PackItem[];
  hasError?: boolean;
}

export default function MaterialCalculationDetails({
  materialName,
  materialType,
  area,
  coats,
  coverageRate,
  coverageDisplay,
  unit,
  requiredQuantity,
  totalCost,
  packCombination = [],
  hasError = false,
}: MaterialCalculationDetailsProps) {
  // Check if pack pricing is missing
  const hasPricing = packCombination.length > 0 && totalCost > 0;

  return (
    <div className="space-y-2">
      {/* Main material display */}
      <h4 className="text-base font-semibold text-foreground">{materialName}</h4>

      {/* Summary info */}
      <div className="flex items-baseline justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            Area: <span className="font-medium text-foreground">{area.toFixed(0)} sq.ft</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Quantity: <span className="font-medium text-foreground">{requiredQuantity} {unit}</span>
          </p>
        </div>
        <div className="text-right">
          {hasPricing ? (
            <p className="text-xl font-bold text-[#EA384C]">₹{totalCost.toLocaleString('en-IN')}</p>
          ) : (
            <p className="text-sm text-yellow-600">Price not configured</p>
          )}
        </div>
      </div>

    </div>
  );
}
