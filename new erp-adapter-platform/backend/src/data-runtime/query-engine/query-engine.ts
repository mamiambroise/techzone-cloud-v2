// DATA-CDC-02 : Query Engine
// Moteur de requetes declaratives securisees

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  QueryContract,
  FilterCondition,
  FilterGroup,
  SortOption,
  PaginatedResult,
  FilterOperator,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MAX_FILTER_DEPTH,
} from '../interfaces/query.contract';
import { RuntimeContext } from '../interfaces';
import { DataAccessManager } from '../data-access/data-access-manager';

const ALLOWED_FILTER_OPERATORS: FilterOperator[] = [
  'EQ', 'NE', 'GT', 'GTE', 'LT', 'LTE',
  'IN', 'NOT_IN', 'CONTAINS', 'STARTS_WITH', 'ENDS_WITH', 'IS_NULL',
];

@Injectable()
export class QueryEngine {
  private readonly logger = new Logger(QueryEngine.name);

  constructor(private readonly dataAccess: DataAccessManager) {}

  async execute<T = any>(query: QueryContract, ctx: RuntimeContext): Promise<PaginatedResult<T>> {
    this.logger.debug(`Query: ${query.resource} [tenant=${ctx.tenantId}]`);
    this.validateQuery(query);

    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    const result = await this.dataAccess.list(query.resource, ctx, {
      select: query.select,
      filter: query.filter,
      sort: query.sort,
      page,
      pageSize,
      relations: query.relations,
    });

    return {
      items: result.items || [],
      page: result.page || page,
      pageSize: result.pageSize || pageSize,
      total: result.total || 0,
      totalPages: result.totalPages || 0,
    };
  }

  private validateQuery(query: QueryContract): void {
    if (!query.resource || typeof query.resource !== 'string') {
      throw new BadRequestException('resource est requis et doit etre une chaine');
    }

    if (query.filter) {
      this.validateFilterGroup(query.filter, 0);
    }

    if (query.sort) {
      for (const sort of query.sort) {
        if (!sort.field || typeof sort.field !== 'string') {
          throw new BadRequestException('sort.field est requis');
        }
        if (!['ASC', 'DESC'].includes(sort.direction)) {
          throw new BadRequestException('sort.direction doit etre ASC ou DESC');
        }
      }
    }

    if (query.page !== undefined && query.page < 1) {
      throw new BadRequestException('page doit etre >= 1');
    }

    if (query.pageSize !== undefined && (query.pageSize < 1 || query.pageSize > MAX_PAGE_SIZE)) {
      throw new BadRequestException(`pageSize doit etre entre 1 et ${MAX_PAGE_SIZE}`);
    }
  }

  private validateFilterGroup(group: FilterGroup, depth: number): void {
    if (depth > MAX_FILTER_DEPTH) {
      throw new BadRequestException(`Profondeur de filtres max depassee (${MAX_FILTER_DEPTH})`);
    }

    if (!['AND', 'OR'].includes(group.logic)) {
      throw new BadRequestException('filter.logic doit etre AND ou OR');
    }

    if (!Array.isArray(group.conditions) || group.conditions.length === 0) {
      throw new BadRequestException('filter.conditions doit etre un tableau non vide');
    }

    for (const condition of group.conditions) {
      if ('logic' in condition) {
        this.validateFilterGroup(condition as FilterGroup, depth + 1);
      } else {
        this.validateFilterCondition(condition as FilterCondition);
      }
    }
  }

  private validateFilterCondition(condition: FilterCondition): void {
    if (!condition.field || typeof condition.field !== 'string') {
      throw new BadRequestException('filter.field est requis');
    }

    if (!ALLOWED_FILTER_OPERATORS.includes(condition.operator)) {
      throw new BadRequestException(
        `Operator "${condition.operator}" non autorise. Autorises: ${ALLOWED_FILTER_OPERATORS.join(', ')}`,
      );
    }

    if (condition.operator === 'IN' || condition.operator === 'NOT_IN') {
      if (!Array.isArray(condition.value)) {
        throw new BadRequestException(`${condition.operator} nécessite un tableau de valeurs`);
      }
    }
  }

  applyLocalFilter<T>(items: T[], query: QueryContract): T[] {
    let filtered = [...items];

    if (query.filter) {
      filtered = filtered.filter((item) => this.evaluateFilterGroup(item, query.filter!));
    }

    if (query.sort) {
      filtered.sort((a, b) => this.evaluateSort(a, b, query.sort!));
    }

    const page = query.page || 1;
    const pageSize = query.pageSize || DEFAULT_PAGE_SIZE;
    const total = filtered.length;
    const start = (page - 1) * pageSize;

    return filtered.slice(start, start + pageSize);
  }

  private evaluateFilterGroup(item: any, group: FilterGroup): boolean {
    const results = group.conditions.map((condition) => {
      if ('logic' in condition) {
        return this.evaluateFilterGroup(item, condition as FilterGroup);
      }
      return this.evaluateFilterCondition(item, condition as FilterCondition);
    });

    return group.logic === 'AND' ? results.every(Boolean) : results.some(Boolean);
  }

  private evaluateFilterCondition(item: any, condition: FilterCondition): boolean {
    const fieldValue = this.getNestedValue(item, condition.field);

    switch (condition.operator) {
      case 'EQ': return fieldValue === condition.value;
      case 'NE': return fieldValue !== condition.value;
      case 'GT': return fieldValue > condition.value;
      case 'GTE': return fieldValue >= condition.value;
      case 'LT': return fieldValue < condition.value;
      case 'LTE': return fieldValue <= condition.value;
      case 'IN': return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'NOT_IN': return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      case 'CONTAINS': return String(fieldValue).includes(String(condition.value));
      case 'STARTS_WITH': return String(fieldValue).startsWith(String(condition.value));
      case 'ENDS_WITH': return String(fieldValue).endsWith(String(condition.value));
      case 'IS_NULL': return fieldValue === null || fieldValue === undefined;
      default: return true;
    }
  }

  private evaluateSort(a: any, b: any, sorts: SortOption[]): number {
    for (const sort of sorts) {
      const aVal = this.getNestedValue(a, sort.field);
      const bVal = this.getNestedValue(b, sort.field);
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      if (cmp !== 0) {
        return sort.direction === 'ASC' ? cmp : -cmp;
      }
    }
    return 0;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
  }
}
