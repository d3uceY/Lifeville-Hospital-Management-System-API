/** Generic paginated response returned by all server-paginated list endpoints */
export interface PaginatedResult<T> {
  data: T[];
  totalItems: number;
  totalPages: number;
  page: number;
  pageSize: number;
}
