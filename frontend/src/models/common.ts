export interface PaginationMeta {
    total_count: number; // Total number of items
    page: number; // Current page
    per_page: number; // Items per page (limit)
    total_pages: number; // Total pages
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;
}