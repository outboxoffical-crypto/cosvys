import * as React from "react";
import { cn } from "@/lib/utils";

interface RateInputProps {
  value: string | number | undefined | null;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

/**
 * ISOLATED INPUT COMPONENT
 * 
 * This component maintains its own local state to prevent:
 * - Value disappearing during parent re-renders
 * - Input losing focus during state updates
 * - Typed characters being lost due to async operations
 * 
 * RULES:
 * - Local state updates IMMEDIATELY on every keystroke
 * - Parent state updates ONLY on blur (when user finishes typing)
 * - Component NEVER unmounts during typing
 * - Input value is ALWAYS visible
 */
const RateInput = React.memo(function RateInput({
  value,
  onChange,
  placeholder = "Enter rate",
  className,
  id
}: RateInputProps) {
  // LOCAL STATE - completely isolated from parent
  const [localValue, setLocalValue] = React.useState<string>(() => {
    return value?.toString() ?? '';
  });
  
  // Track if user is actively typing
  const isTypingRef = React.useRef(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  
  // Sync from parent ONLY when not typing and value actually changed
  React.useEffect(() => {
    if (!isTypingRef.current) {
      const parentValue = value?.toString() ?? '';
      if (parentValue !== localValue) {
        setLocalValue(parentValue);
      }
    }
  }, [value]); // Only depend on value, not localValue to avoid loops
  
  // Handle input change - IMMEDIATE local update, NO parent update
  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    isTypingRef.current = true;
    setLocalValue(newValue);
    // DO NOT call onChange here - that causes re-renders
  }, []);
  
  // Handle blur - sync to parent when user finishes typing
  const handleBlur = React.useCallback(() => {
    isTypingRef.current = false;
    // Only update parent if value changed
    const parentValue = value?.toString() ?? '';
    if (localValue !== parentValue) {
      onChange(localValue);
    }
  }, [localValue, value, onChange]);
  
  // Handle focus
  const handleFocus = React.useCallback(() => {
    isTypingRef.current = true;
  }, []);

  return (
    <input
      ref={inputRef}
      id={id}
      type="number"
      inputMode="decimal"
      placeholder={placeholder}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      style={{ 
        color: 'hsl(220, 13%, 18%)', 
        caretColor: 'hsl(220, 13%, 18%)',
        WebkitTextFillColor: 'hsl(220, 13%, 18%)'
      }}
    />
  );
});

RateInput.displayName = "RateInput";

export { RateInput };
