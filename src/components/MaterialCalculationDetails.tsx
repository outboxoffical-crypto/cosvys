import { useState } from "react";
import { ChevronDown, ChevronUp, Calculator, Info, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate raw quantity for display
  const rawQuantity = coverageRate > 0 ? area / coverageRate : 0;

  // Failsafe: If data exists but something is off
  const showFailsafe = hasError || (area > 0 && coverageRate === 0);
  
  // Check if pack pricing is missing
  const hasPricing = packCombination.length > 0 && totalCost > 0;

  return (
    <div className="space-y-2">
      {/* Main material display */}
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold text-foreground">{materialName}</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-primary hover:text-primary/80 h-6 px-2 gap-1"
        >
          <Calculator className="h-3 w-3" />
          {isExpanded ? "Hide" : "View"} Calculation
          {isExpanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Summary info */}
      <div className="flex items-baseline justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            Type: <span className="font-medium text-foreground">{materialType}</span>
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

      {/* Expanded calculation details */}
      {isExpanded && (
        <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border space-y-2 text-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <Info className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">How this was calculated</span>
          </div>

          {showFailsafe ? (
            <div className="flex items-center gap-2 p-2 bg-yellow-500/10 rounded text-yellow-700">
              <AlertCircle className="h-4 w-4" />
              <span>Material values already calculated. Displaying stored results.</span>
            </div>
          ) : (
            <>
              {/* Material Name */}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Material Name:</span>
                <span className="font-medium text-foreground">{materialName}</span>
              </div>

              {/* Category */}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Category:</span>
                <span className="font-medium text-foreground">{materialType}</span>
              </div>

              {/* Coverage - already includes coat-specific value */}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Coverage ({coats} coat{coats > 1 ? 's' : ''}):</span>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-foreground">{coverageRate} sq.ft per {unit}</span>
                  <Badge variant="outline" className="text-[10px] px-1 py-0 bg-yellow-500/10 text-yellow-700 border-yellow-500/30">
                    From Data Coverage
                  </Badge>
                </div>
              </div>

              <div className="my-2 border-t border-border/50" />

              {/* Inputs */}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Sq.ft:</span>
                <span className="font-medium text-foreground">{area.toFixed(0)} sq.ft</span>
              </div>

              <div className="my-2 border-t border-border/50" />

              {/* Calculation */}
              <div className="space-y-2">
                <p className="font-semibold text-foreground">Quantity Calculation:</p>
                
                <div className="flex justify-between items-center pl-4">
                  <span className="text-muted-foreground">= {area.toFixed(0)} ÷ {coverageRate}</span>
                  <span className="font-medium text-foreground">= {rawQuantity.toFixed(2)} {unit}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Required Quantity (rounded up):</span>
                  <span className="font-bold text-primary">{requiredQuantity} {unit}</span>
                </div>
              </div>

              <div className="my-2 border-t border-border/50" />

              {/* Pack Breakdown */}
              <div className="space-y-2">
                <p className="font-semibold text-foreground">Pack Breakdown:</p>
                
                {packCombination.length > 0 ? (
                  <div className="space-y-1 pl-4">
                    {packCombination.map((pack, idx) => {
                      const packTotal = pack.count * pack.price;
                      return (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="text-muted-foreground">
                            {pack.size} × {pack.count} @ ₹{pack.price.toLocaleString('en-IN')}
                          </span>
                          <span className="font-medium text-foreground">= ₹{packTotal.toLocaleString('en-IN')}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-yellow-500/10 rounded text-yellow-700">
                    <AlertCircle className="h-4 w-4" />
                    <span>Price not configured for required pack sizes</span>
                  </div>
                )}
              </div>

              <div className="my-2 border-t border-border/50" />

              {/* Total Cost */}
              <div className="flex justify-between items-center pt-2">
                <span className="font-semibold text-foreground">Total Material Cost:</span>
                {hasPricing ? (
                  <span className="font-bold text-primary text-lg">₹{totalCost.toLocaleString('en-IN')}</span>
                ) : (
                  <span className="text-yellow-600">Not available</span>
                )}
              </div>

              {/* Formula summary */}
              <div className="mt-3 p-2 bg-primary/5 rounded text-xs text-muted-foreground">
                <span className="font-medium">Formula:</span> {area.toFixed(0)} sq.ft ÷ {coverageRate} = {rawQuantity.toFixed(2)} → {requiredQuantity} {unit}
              </div>

              {/* Note about coverage */}
              <div className="mt-2 p-2 bg-blue-500/5 rounded text-xs text-blue-700">
                <span className="font-medium">Note:</span> Pack prices are from Product Pricing tab. Largest packs are used first for optimal cost.
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
