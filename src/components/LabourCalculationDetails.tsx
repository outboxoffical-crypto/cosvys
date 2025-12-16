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
  autoLabourPerDay
}: LabourCalculationDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Simple productivity-based calculation
  // Total Work Area = Total Sq.ft × Number of Coats
  // Labour Days = Total Work Area ÷ (Labour Working Process × Number of Labourers per day)
  const totalWorkArea = task.area * task.coats;
  const workingCapacity = task.coverage; // sq.ft per day per labourer
  const effectiveCapacity = workingCapacity * autoLabourPerDay; // total capacity with all labourers
  const rawDays = effectiveCapacity > 0 ? totalWorkArea / effectiveCapacity : 0;
  const minDays = Math.floor(rawDays);
  const maxDays = Math.ceil(rawDays);
  return <div className="space-y-2">
      {/* Main task display */}
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold text-foreground">{task.name}</h4>
        <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="text-xs text-primary hover:text-primary/80 h-6 px-2 gap-1">
          <Calculator className="h-3 w-3" />
          {isExpanded ? "Hide" : "View"} Calculation
          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
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
          <p className="font-bold text-primary text-xl">
            {maxDays} {maxDays === 1 ? 'Day' : 'Days'}
          </p>
        </div>
      </div>

      {/* Expanded calculation details */}
      {isExpanded && <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border space-y-2 text-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <Info className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">How this was calculated</span>
          </div>

          {/* Inputs */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Sq.ft:</span>
            <span className="font-medium text-foreground">{task.area.toFixed(0)} sq.ft</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Number of Coats:</span>
            <span className="font-medium text-foreground">{task.coats}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Labour Working Process:</span>
            <div className="flex items-center gap-1">
              <span className="font-medium text-foreground">{workingCapacity.toFixed(0)} sq.ft/day</span>
              <Badge variant="outline" className="text-[10px] px-1 py-0 bg-blue-500/10 text-blue-700 border-blue-500/30">
                Standard Labour Rate
              </Badge>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Labourers per Day:</span>
            <span className="font-medium text-foreground">{autoLabourPerDay}</span>
          </div>

          <div className="my-2 border-t border-border/50" />

          {/* Calculation Steps */}
          <div className="space-y-2">
            <p className="font-semibold text-foreground">Calculation:</p>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Work Area = Total Sq.ft × Coats</span>
            </div>
            <div className="flex justify-between items-center pl-4">
              <span className="text-muted-foreground">= {task.area.toFixed(0)} × {task.coats}</span>
              <span className="font-medium text-foreground">= {totalWorkArea.toFixed(0)} sq.ft</span>
            </div>

            <div className="flex justify-between items-center mt-2">
              <span className="text-muted-foreground">Effective Capacity = Rate × Labourers</span>
            </div>
            <div className="flex justify-between items-center pl-4">
              <span className="text-muted-foreground">= {workingCapacity.toFixed(0)} × {autoLabourPerDay}</span>
              <span className="font-medium text-foreground">= {effectiveCapacity.toFixed(0)} sq.ft/day</span>
            </div>

            <div className="flex justify-between items-center mt-2">
              <span className="text-muted-foreground">Labour Days = Total Work Area ÷ Effective Capacity</span>
            </div>
            <div className="flex justify-between items-center pl-4">
              <span className="text-muted-foreground">= {totalWorkArea.toFixed(0)} ÷ {effectiveCapacity.toFixed(0)}</span>
              <span className="font-medium text-foreground">= {rawDays.toFixed(2)} days</span>
            </div>
          </div>

          <div className="my-2 border-t border-border/50" />

          {/* Final Result */}
          <div className="flex justify-between items-center pt-2">
            <span className="font-semibold text-foreground">Final Result:</span>
            <span className="font-bold text-primary">{maxDays} {maxDays === 1 ? 'Day' : 'Days'}</span>
          </div>

          {/* Formula summary */}
          <div className="mt-3 p-2 bg-primary/5 rounded text-xs text-muted-foreground">
            <span className="font-medium">Formula:</span> ({task.area.toFixed(0)} × {task.coats}) ÷ ({workingCapacity.toFixed(0)} × {autoLabourPerDay}) = {rawDays.toFixed(2)} → {maxDays} {maxDays === 1 ? 'Day' : 'Days'}
          </div>
        </div>}
    </div>;
}