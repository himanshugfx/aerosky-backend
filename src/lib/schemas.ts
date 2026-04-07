import { z } from 'zod';

// Common types
export const idSchema = z.string().uuid();
export const emailSchema = z.string().email();
export const urlSchema = z.string().url();
export const dateSchema = z.string().datetime();
export const positiveIntSchema = z.number().int().positive();

// Resources
export const createTeamMemberSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  accessId: z.string().min(1).max(50),
  position: z.string().max(100),
  phone: z.string().max(20),
  role: z.enum(['ADMIN', 'USER', 'MANUFACTURING', 'DESIGN', 'SALES']),
});

export const createDroneSchema = z.object({
  modelName: z.string().min(1).max(100),
  serialNumber: z.string().min(1),
  purchaseDate: z.string().datetime().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).default('ACTIVE'),
});

export const createComponentSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  quantity: z.number().int().min(0),
  unitPrice: z.number().min(0).optional(),
});

export const createOrderSchema = z.object({
  contractNumber: z.string().min(1).max(100),
  clientName: z.string().min(1).max(200),
  contractValue: z.number().min(0),
  status: z.enum(['PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED']).default('PENDING'),
});

export const createReimbursementSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.string().optional(),
  amount: z.number().positive().max(1000000),
  date: z.string().datetime(),
  billData: z.string().base64().max(5 * 1024 * 1024), // 5MB max
});

// Utility function to validate and return error
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { data: T; error?: null } | { data?: null; error: { fields: Record<string, string[]> } } {
  try {
    const validated = schema.parse(data);
    return { data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: {
          fields: error.flatten().fieldErrors as Record<string, string[]>,
        },
      };
    }
    throw error;
  }
}