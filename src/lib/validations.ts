import { z } from "zod";

// Phone validation schema
export const phoneSchema = z.string()
  .regex(/^\d{10}$/, "Phone number must be exactly 10 digits")
  .transform(val => val.trim());

// Email validation schema
export const emailSchema = z.string()
  .email("Invalid email address")
  .max(255, "Email must be less than 255 characters")
  .transform(val => val.trim().toLowerCase());

// Name validation schema
export const nameSchema = z.string()
  .min(1, "Name is required")
  .max(100, "Name must be less than 100 characters")
  .transform(val => val.trim());

// Address validation schema
export const addressSchema = z.string()
  .min(1, "Address is required")
  .max(500, "Address must be less than 500 characters")
  .transform(val => val.trim());

// Dealer info validation schema
export const dealerInfoSchema = z.object({
  dealerName: nameSchema,
  shopName: nameSchema,
  employeeId: z.string().min(1, "Dealer code is required").max(50, "Dealer code too long").transform(val => val.trim()),
  phone: phoneSchema,
  address: addressSchema,
  email: emailSchema.optional().or(z.literal("")),
  margin: z.number().min(0, "Margin must be positive").max(100, "Margin cannot exceed 100%")
});

// Customer/Project validation schema
export const projectSchema = z.object({
  customerName: nameSchema,
  mobile: phoneSchema,
  address: addressSchema,
  projectTypes: z.array(z.string()).min(1, "Select at least one project type")
});

// Room name validation
export const roomNameSchema = z.string()
  .min(1, "Room name is required")
  .max(50, "Room name must be less than 50 characters")
  .transform(val => val.trim());
