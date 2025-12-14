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

  // Calculate the raw values as the system does
  const totalWork = area * coats;
  const rawQuantity = coverageRate > 0 ? totalWork / coverageRate : 0;
  const roundedQuantity = Math.ceil(rawQuantity);

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
            Quantity: <span className="font-medium text-foreground">{minQuantity} to <strong>{maxQuantity}</strong> {unit}</span>
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

              {/* Coverage */}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Coverage:</span>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-foreground">{coverageRate} sq.ft per {unit}</span>
                  <Badge variant="outline" className="text-[10px] px-1 py-0 bg-yellow-500/10 text-yellow-700 border-yellow-500/30">
                    System Assumption
                  </Badge>
                </div>
              </div>

              {/* Coats */}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Coats:</span>
                <span className="font-medium text-foreground">{coats}</span>
              </div>

              <div className="my-2 border-t border-border/50" />

              {/* Calculation section */}
              <div className="space-y-2">
                <p className="font-semibold text-foreground">Calculation:</p>
                
                {/* Formula */}
                <div className="pl-2 space-y-1">
                  <p className="text-muted-foreground">
                    • Required Quantity = (Total Area × Coats) ÷ Coverage
                  </p>
                  <p className="text-muted-foreground">
                    • Required Quantity = ({area.toFixed(0)} × {coats}) ÷ {coverageRate}
                  </p>
                </div>

                {/* Step by step */}
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Area:</span>
                    <span className="font-medium text-foreground">{area.toFixed(2)} sq.ft</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Work (Area × Coats):</span>
                    <span className="font-medium text-foreground">{totalWork.toFixed(2)} sq.ft</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Raw Calculation:</span>
                    <span className="font-medium text-foreground">{rawQuantity.toFixed(2)} {unit}</span>
                  </div>
                </div>
              </div>

              <div className="my-2 border-t border-border/50" />

              {/* Final Quantity */}
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Final Quantity:</p>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-muted-foreground">Rounded (CEIL):</span>
                  <span className="font-bold text-primary text-lg">{roundedQuantity} {unit}</span>
                </div>
              </div>

              {/* Formula summary */}
              <div className="mt-3 p-2 bg-primary/5 rounded text-xs text-muted-foreground">
                <span className="font-medium">Formula:</span> ({area.toFixed(0)} × {coats}) ÷ {coverageRate} = {rawQuantity.toFixed(2)} → {roundedQuantity} {unit}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
