import React, { useState, useRef, useEffect } from "react";
import { Input } from "./input";
import { convertFeetInchToDecimal } from "@/lib/utils";

interface MeasurementInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: string) => void;
}

export const MeasurementInput: React.FC<MeasurementInputProps> = ({
  onValueChange,
  onBlur,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(props.value as string || "");
  const isConvertingRef = useRef(false);

  useEffect(() => {
    setInternalValue(props.value as string || "");
  }, [props.value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInternalValue(value);
    if (onValueChange) {
      onValueChange(value);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (isConvertingRef.current) return;

    const input = e.target.value;
    if (input.includes('.')) {
      const converted = convertFeetInchToDecimal(input);
      const convertedStr = converted.toFixed(2);
      isConvertingRef.current = true;
      setInternalValue(convertedStr);
      if (onValueChange) {
        onValueChange(convertedStr);
      }
      // Reset after a short delay to allow re-render
      setTimeout(() => {
        isConvertingRef.current = false;
      }, 0);
    }

    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <Input
      {...props}
      value={internalValue}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
};
