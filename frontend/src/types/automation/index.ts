export type ExecutionStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'RETRYING'
  | 'CANCELLED'
  | 'TIMEOUT'
  | 'BLOCKED';

export type ValidationLevel = 'ERROR' | 'WARNING' | 'INFO';

export interface WorkflowNode {
  id: string;
  type: string;
  name?: string;
  [key: string]: unknown;
}

export interface WorkflowEdge {
  id?: string;
  source: string;
  target: string;
  [key: string]: unknown;
}

export interface Workflow {
  id?: string;
  code: string;
  nom?: string;
  name?: string;
  version?: string;
  lifecycle?: string;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  steps?: WorkflowNode[];
  [key: string]: unknown;
}

export interface WorkflowVersion {
  id: string;
  workflowCode: string;
  version: string;
  status?: string;
  createdAt?: string;
}

export interface Rule {
  code: string;
  name?: string;
  status?: string;
  priority?: number;
  [key: string]: unknown;
}

export interface Trigger {
  code: string;
  type?: string;
  enabled?: boolean;
  [key: string]: unknown;
}

export interface Schedule {
  id: string;
  workflowCode?: string;
  enabled: boolean;
  frequencyMinutes?: number;
  timezone?: string;
  nextRunAt?: string | null;
  [key: string]: unknown;
}

export interface Execution {
  executionId: string;
  workflowCode?: string;
  status: ExecutionStatus;
  startedAt?: string;
  duration?: number;
  retryCount?: number;
  [key: string]: unknown;
}

export interface StepExecution {
  id: string;
  status: ExecutionStatus;
  startedAt?: string;
  completedAt?: string;
  [key: string]: unknown;
}

export interface Diagnostic {
  code: string;
  level: ValidationLevel;
  message: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface EngineHealth {
  status: string;
  checkedAt?: string;
  [key: string]: unknown;
}

export type Permission = string;

export interface ApiError {
  type?: string;
  statusCode?: number;
  code?: string;
  message?: string;
  traceId?: string | null;
  details?: unknown;
}
