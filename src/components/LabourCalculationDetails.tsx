import { useState } from "react";
import { ChevronDown, ChevronUp, Calculator, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LabourTask {
  name: string;
  area: number;
  coats: number;
  totalWork: number;
  coverage: number;
  daysRequired: number;
}

interface LabourCalculationDetailsProps {
  task: LabourTask;
  workingHours: number;
  standardHours: number;
  numberOfLabours: number;
  autoLabourPerDay: number;
}

export default function LabourCalculationDetails({
  task,
  workingHours,
  standardHours,
  numberOfLabours,
  autoLabourPerDay,
}: LabourCalculationDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Recalculate all values exactly as the system does
  const adjustedCoverage = task.coverage * (workingHours / standardHours);
  const perDayCapacity = adjustedCoverage * autoLabourPerDay;
  const adjustedDays = Math.ceil(task.daysRequired / autoLabourPerDay);
  const rawDaysCalculation = task.totalWork / perDayCapacity;

  return (
    <div className="space-y-2">
      {/* Main task display */}
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold text-foreground">{task.name}</h4>
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
            Area: <span className="font-medium text-foreground">{task.area.toFixed(0)} sq.ft</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Coats: <span className="font-medium text-foreground">{task.coats}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-primary">{adjustedDays} days</p>
        </div>
      </div>

      {/* Expanded calculation details */}
      {isExpanded && (
        <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border space-y-2 text-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <Info className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">How this was calculated</span>
          </div>

          {/* Step 1: Area */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">1. Area considered:</span>
            <span className="font-medium text-foreground">{task.area.toFixed(2)} sq.ft</span>
          </div>

          {/* Step 2: Coats */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">2. Number of coats:</span>
            <span className="font-medium text-foreground">{task.coats}</span>
          </div>

          {/* Step 3: Total work */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">3. Total work (Area × Coats):</span>
            <span className="font-medium text-foreground">{task.totalWork.toFixed(2)} sq.ft</span>
          </div>

          <div className="my-2 border-t border-border/50" />

          {/* Step 4: Labour productivity */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">4. Labour productivity (8 hrs):</span>
            <div className="flex items-center gap-1">
              <span className="font-medium text-foreground">{task.coverage.toFixed(0)} sq.ft/day</span>
              <Badge variant="outline" className="text-[10px] px-1 py-0 bg-yellow-500/10 text-yellow-700 border-yellow-500/30">
                System Assumption
              </Badge>
            </div>
          </div>

          {/* Step 5: Working hours adjustment */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">5. Adjusted for {workingHours} hrs/day:</span>
            <span className="font-medium text-foreground">{adjustedCoverage.toFixed(0)} sq.ft/day</span>
          </div>

          {/* Step 6: Number of labours */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">6. Number of labours:</span>
            <div className="flex items-center gap-1">
              <span className="font-medium text-foreground">{autoLabourPerDay}</span>
              {autoLabourPerDay === 1 && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 bg-yellow-500/10 text-yellow-700 border-yellow-500/30">
                  System Assumption
                </Badge>
              )}
            </div>
          </div>

          {/* Step 7: Per-day capacity */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">7. Per-day capacity (Labour × Productivity):</span>
            <span className="font-medium text-foreground">{perDayCapacity.toFixed(0)} sq.ft/day</span>
          </div>

          <div className="my-2 border-t border-border/50" />

          {/* Step 8: Days calculation */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">8. Raw calculation (Work ÷ Capacity):</span>
            <span className="font-medium text-foreground">{rawDaysCalculation.toFixed(2)} days</span>
          </div>

          {/* Step 9: Final result */}
          <div className="flex justify-between items-center pt-2 border-t border-border/50">
            <span className="font-semibold text-foreground">9. Days required (CEIL):</span>
            <span className="font-bold text-primary text-lg">{adjustedDays} days</span>
          </div>

          {/* Formula summary */}
          <div className="mt-3 p-2 bg-primary/5 rounded text-xs text-muted-foreground">
            <span className="font-medium">Formula:</span> CEIL({task.totalWork.toFixed(0)} ÷ {perDayCapacity.toFixed(0)}) = {adjustedDays} day{adjustedDays !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}
