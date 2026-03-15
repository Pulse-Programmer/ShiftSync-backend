import { Request } from 'express';

export interface PaginationParams {
  page: number;
  pageSize: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Parse page/pageSize from query params with sensible defaults.
 */
export function parsePagination(req: Request, defaultPageSize = 20): PaginationParams {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || defaultPageSize));
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
}

/**
 * Wrap rows + total count into a standardized paginated response.
 */
export function paginate<T>(rows: T[], total: number, params: PaginationParams): PaginatedResponse<T> {
  return {
    data: rows,
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.ceil(total / params.pageSize),
    },
  };
}
