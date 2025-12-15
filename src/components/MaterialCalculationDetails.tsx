import { useState } from "react";
import { ChevronDown, ChevronUp, Calculator, Info, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MaterialCalculationDetailsProps {
  materialName: string;
  materialType: string;
  area: number;
  coats: number;
  coverageRate: number;
  coverageDisplay: string;
  unit: string;
  minQuantity: number;
  maxQuantity: number;
  totalCost: number;
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
  minQuantity,
  maxQuantity,
  totalCost,
  hasError = false,
}: MaterialCalculationDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Simple coverage-based calculation
  // Coverage table already has separate values for 1 coat and 2 coats
  // Required Quantity = Total Sq.ft ÷ Coverage (NO multiplication by coats)
  const rawQuantity = coverageRate > 0 ? area / coverageRate : 0;
  const minQty = Math.floor(rawQuantity);
  const maxQty = Math.ceil(rawQuantity);

  // Failsafe: If data exists but something is off
  const showFailsafe = hasError || (area > 0 && coverageRate === 0);

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
            Quantity: <span className="font-medium text-foreground">{maxQty} {unit}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-[#EA384C]">₹{totalCost.toLocaleString('en-IN')}</p>
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

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Selected Coverage ({coats} coat{coats > 1 ? 's' : ''}):</span>
                <span className="font-medium text-foreground">{coverageRate} sq.ft/{unit}</span>
              </div>

              <div className="my-2 border-t border-border/50" />

              {/* Calculation */}
              <div className="space-y-2">
                <p className="font-semibold text-foreground">Calculation:</p>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Required Quantity = Total Sq.ft ÷ Coverage</span>
                </div>
                <div className="flex justify-between items-center pl-4">
                  <span className="text-muted-foreground">= {area.toFixed(0)} ÷ {coverageRate}</span>
                  <span className="font-medium text-foreground">= {rawQuantity.toFixed(2)} {unit}</span>
                </div>
              </div>

              <div className="my-2 border-t border-border/50" />

              {/* Final Quantity */}
              <div className="flex justify-between items-center pt-2">
                <span className="font-semibold text-foreground">Final Quantity:</span>
                <span className="font-bold text-primary">{maxQty} {unit}</span>
              </div>

              {/* Formula summary */}
              <div className="mt-3 p-2 bg-primary/5 rounded text-xs text-muted-foreground">
                <span className="font-medium">Formula:</span> {area.toFixed(0)} ÷ {coverageRate} = {rawQuantity.toFixed(2)} → {maxQty} {unit}
              </div>

              {/* Note about coverage */}
              <div className="mt-2 p-2 bg-blue-500/5 rounded text-xs text-blue-700">
                <span className="font-medium">Note:</span> Coverage value is fetched from Data Coverage table based on product and number of coats. No multiplication by coats is applied.
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
