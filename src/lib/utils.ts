import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertFeetInchToDecimal(input: string): number {
  const parts = input.split(".");
  if (parts.length !== 2) return parseFloat(input) || 0;
  const feet = parseInt(parts[0]) || 0;
  const inchesStr = parts[1];
  const inches = parseInt(inchesStr) || 0;
  if (inches < 1 || inches > 12) return feet + inches / 12; // fallback
  const mapping: { [key: number]: number } = {
    1: 0.08,
    2: 0.16,
    3: 0.25,
    4: 0.33,
    5: 0.41,
    6: 0.5,
    7: 0.58,
    8: 0.66,
    9: 0.75,
    10: 0.83,
    11: 0.91,
    12: 1,
  };
  const decimal = mapping[inches] || inches / 12;
  return feet + decimal;
}
