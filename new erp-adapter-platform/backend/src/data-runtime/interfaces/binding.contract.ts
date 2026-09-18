// DATA-CDC-04 : Data Binding & State Bridge Contract

import { BindingState } from './data-runtime.contract';
import { QueryContract } from './query.contract';
import { ExecutionRequest } from './execution.contract';

export type BindingType = 'SINGLE' | 'LIST' | 'COUNT' | 'METADATA' | 'QUERY' | 'EXECUTION';

export interface BindingDefinition {
  bindingId: string;
  resource: string;
  type: BindingType;
  operation?: string;
  query?: QueryContract;
  execution?: ExecutionRequest;
  parameters?: Record<string, any>;
  refreshInterval?: number;
}

export interface BindingResult<T = any> {
  bindingId: string;
  state: BindingState;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
  duration: number;
}

export interface BindingParameter {
  name: string;
  source: 'CONTEXT' | 'NAVIGATION' | 'FORM' | 'SELECTION' | 'CONFIG';
  type: string;
  required: boolean;
  defaultValue?: any;
}
