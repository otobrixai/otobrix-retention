// src/lib/pagination.ts
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResult {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
}

export function calculatePagination(page: number = 1, limit: number = 10): { skip: number; take: number } {
  const skip = (page - 1) * limit;
  const take = limit;
  return { skip, take };
}

export function getPaginationMeta(totalCount: number, page: number, limit: number): PaginationResult {
  const totalPages = Math.ceil(totalCount / limit);
  return {
    currentPage: page,
    totalPages,
    totalCount,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    limit
  };
}