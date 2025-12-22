import { useState } from "react";
import { ChevronDown, ChevronUp, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CalculationStep {
  label: string;
  formula?: string;
  value: string | number;
  unit?: string;
}

interface CalculationDetailsAccordionProps {
  title: string;
  subtitle?: string;
  steps: CalculationStep[];
  result: {
    label: string;
    value: string | number;
    unit?: string;
  };
  variant?: 'default' | 'primary' | 'secondary' | 'warning';
  defaultOpen?: boolean;
}

const CalculationDetailsAccordion = ({
  title,
  subtitle,
  steps,
  result,
  variant = 'default',
  defaultOpen = false
}: CalculationDetailsAccordionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          border: 'border-primary/20',
          bg: 'bg-primary/5',
          badge: 'bg-primary/10 text-primary border-primary/20',
          result: 'text-primary'
        };
      case 'secondary':
        return {
          border: 'border-secondary/20',
          bg: 'bg-secondary/5',
          badge: 'bg-secondary/10 text-secondary-foreground border-secondary/20',
          result: 'text-secondary-foreground'
        };
      case 'warning':
        return {
          border: 'border-orange-500/20',
          bg: 'bg-orange-50/50 dark:bg-orange-950/20',
          badge: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
          result: 'text-orange-600'
        };
      default:
        return {
          border: 'border-border',
          bg: 'bg-muted/30',
          badge: 'bg-muted text-muted-foreground border-border',
          result: 'text-foreground'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={`${styles.border} ${styles.bg} transition-all duration-200`}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/20 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {subtitle && (
                  <Badge variant="outline" className={`text-xs ${styles.badge}`}>
                    {subtitle}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-semibold ${styles.result}`}>
                  {result.value}{result.unit ? ` ${result.unit}` : ''}
                </span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 pb-3">
            <div className="space-y-2 pt-2 border-t border-border/50">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Calculation Steps
              </p>
              {steps.map((step, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between py-1 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{index + 1}.</span>
                    <span className="text-muted-foreground">{step.label}</span>
                    {step.formula && (
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                        {step.formula}
                      </code>
                    )}
                  </div>
                  <span className="font-medium">
                    {step.value}{step.unit ? ` ${step.unit}` : ''}
                  </span>
                </div>
              ))}
              
              {/* Final Result */}
              <div className={`flex items-center justify-between pt-2 mt-2 border-t ${styles.border}`}>
                <span className="font-semibold text-sm">{result.label}</span>
                <span className={`font-bold text-lg ${styles.result}`}>
                  {result.value}{result.unit ? ` ${result.unit}` : ''}
                </span>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default CalculationDetailsAccordion;
