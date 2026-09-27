// DATA-CDC-02 : Query Contract

export type FilterOperator =
  | 'EQ'
  | 'NE'
  | 'GT'
  | 'GTE'
  | 'LT'
  | 'LTE'
  | 'IN'
  | 'NOT_IN'
  | 'CONTAINS'
  | 'STARTS_WITH'
  | 'ENDS_WITH'
  | 'IS_NULL';

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value?: any;
}

export interface FilterGroup {
  logic: 'AND' | 'OR';
  conditions: (FilterCondition | FilterGroup)[];
}

export interface SortOption {
  field: string;
  direction: 'ASC' | 'DESC';
}

export interface QueryContract {
  resource: string;
  select?: string[];
  filter?: FilterGroup;
  sort?: SortOption[];
  page?: number;
  pageSize?: number;
  relations?: string[];
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MAX_FILTER_DEPTH = 3;
export const MAX_RELATIONS_DEPTH = 2;
