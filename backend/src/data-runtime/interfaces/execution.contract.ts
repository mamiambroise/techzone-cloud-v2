// DATA-CDC-03 : Execution Contract

export type ExecutionOperation = 'CREATE' | 'UPDATE' | 'DELETE' | 'EXECUTE' | 'BATCH';

export interface ExecutionRequest {
  resource: string;
  operation: ExecutionOperation;
  targetId?: string;
  input?: Record<string, any>;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
}

export interface ExecutionResult {
  success: boolean;
  operation: ExecutionOperation;
  resource: string;
  targetId?: string;
  data?: any;
  errorCode?: string;
  errorMessage?: string;
  traceId: string;
  duration: number;
  timestamp: string;
}

export interface BatchExecutionRequest {
  resource: string;
  operation: ExecutionOperation;
  items: Array<{
    targetId?: string;
    input?: Record<string, any>;
    idempotencyKey?: string;
  }>;
  strategy?: 'ALL_OR_NOTHING' | 'BEST_EFFORT';
}

export interface BatchExecutionResult {
  totalItems: number;
  succeeded: number;
  failed: number;
  skipped: number;
  results: ExecutionResult[];
  traceId: string;
  duration: number;
}
