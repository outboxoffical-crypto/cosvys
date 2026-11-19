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
  // Simple productivity-based calculation
  // Total Work Area = Total Sq.ft × Number of Coats
  // Labour Days = Total Work Area ÷ (Labour Working Process × Number of Labourers per day)
  const totalWorkArea = task.area * task.coats;
  const workingCapacity = task.coverage; // sq.ft per day per labourer
  const effectiveCapacity = workingCapacity * autoLabourPerDay; // total capacity with all labourers
  const maxDays = effectiveCapacity > 0
    ? Math.ceil(totalWorkArea / effectiveCapacity)
    : 0;
  return <div className="space-y-2">
      {/* Main task display */}
      <h4 className="text-base font-semibold text-foreground">{task.name}</h4>

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

    </div>;
}