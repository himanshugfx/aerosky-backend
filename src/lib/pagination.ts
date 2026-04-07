import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1)).default('1'),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(100))
    .default('20'),
});

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
  };
}

export function getPaginationParams(searchParams: URLSearchParams): PaginationParams {
  const validated = paginationSchema.parse({
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || '20',
  });
  return {
    page: validated.page,
    limit: validated.limit,
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      pages: Math.ceil(total / params.limit),
      hasNext: params.page < Math.ceil(total / params.limit),
    },
  };
}