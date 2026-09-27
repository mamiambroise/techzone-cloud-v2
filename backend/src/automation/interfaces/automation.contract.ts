// WF-CDC-00 : Automation Contract v1
// Socle, Architecture & Automation Contract

export const AUTOMATION_CONTRACT_VERSION = '1.0';

export const AUTOMATION_ERROR_CODES = {
  RULE_INVALID: 'AUTOMATION_RULE_INVALID',
  TRIGGER_INVALID: 'AUTOMATION_TRIGGER_INVALID',
  ACTION_FAILED: 'AUTOMATION_ACTION_FAILED',
  WORKFLOW_LOOP: 'AUTOMATION_WORKFLOW_LOOP',
  PERMISSION_DENIED: 'AUTOMATION_PERMISSION_DENIED',
  TIMEOUT: 'AUTOMATION_TIMEOUT',
  PROVIDER_UNAVAILABLE: 'AUTOMATION_PROVIDER_UNAVAILABLE',
} as const;

export type AutomationErrorCode = typeof AUTOMATION_ERROR_CODES[keyof typeof AUTOMATION_ERROR_CODES];

// === RULE STATUS ===
export type RuleStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'ARCHIVED';

// === WORKFLOW LIFECYCLE ===
export type WorkflowLifecycle =
  | 'DRAFT'
  | 'VALIDATING'
  | 'READY'
  | 'ACTIVE'
  | 'PAUSED'
  | 'DEPRECATED'
  | 'ARCHIVED';

// === EXECUTION STATUS ===
export type AutomationExecutionStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'RETRYING'
  | 'CANCELLED'
  | 'TIMEOUT'
  | 'BLOCKED';

// === TRIGGER TYPES ===
export type TriggerType =
  | 'EVENT'
  | 'SCHEDULE'
  | 'MANUAL'
  | 'API'
  | 'DATA_CHANGE'
  | 'WEBHOOK';

// === ACTION CATEGORIES ===
export type ActionCategory =
  | 'DATA_CREATE'
  | 'DATA_UPDATE'
  | 'DATA_DELETE'
  | 'DATA_EXECUTE'
  | 'HTTP'
  | 'INTEGRATION'
  | 'NOTIFICATION'
  | 'WORKFLOW_START'
  | 'CUSTOM_REGISTERED_ACTION';

export type ActionOutcome = 'SUCCEEDED' | 'FAILED' | 'SKIPPED' | 'DENIED' | 'TIMEOUT';

// === EVALUATION RESULT ===
export type EvaluationResult = 'MATCHED' | 'NOT_MATCHED' | 'SKIPPED' | 'ERROR';

// === EXPRESSION NODE (AST) ===
export interface ExpressionNode {
  operator: string;
  left: ExpressionOperand;
  right?: ExpressionOperand;
  expressionType?: 'CONDITION' | 'FORMULA';
}

export interface ExpressionOperandValue {
  value: any;
  type: string;
}

export interface ExpressionOperandField {
  field: string;
}

export type ExpressionOperand =
  | ExpressionOperandValue
  | ExpressionOperandField
  | ExpressionNode;

// === RUNTIME CONTEXT (Automation) ===
export interface AutomationContext {
  tenantId: string;
  userId: string;
  applicationId?: string;
  environmentId?: string;
  eventId?: string;
  executionId?: string;
  traceId: string;
  permissions: string[];
  variables?: Record<string, any>;
  locale?: string;
}

// === AUTOMATION CONTRACT ===
export interface AutomationContract {
  contract: string;
  contractVersion: string;
  provider: string;
  instance: string;
  rules: RuleDescriptor[];
  workflows: WorkflowDescriptor[];
  triggers: TriggerDescriptor[];
  actions: ActionDescriptor[];
  health: { status: string };
}

export interface RuleDescriptor {
  code: string;
  nom: string;
  status: RuleStatus;
  priority: number;
  version: string;
  conditions?: ConditionNode;
  effects?: string[];
  allowedContextFields?: string[];
}

export interface WorkflowDescriptor {
  code: string;
  nom: string;
  lifecycle: WorkflowLifecycle;
  version: string;
  steps: WorkflowStep[];
  maxSteps?: number;
}

export interface TriggerDescriptor {
  code: string;
  type: TriggerType;
  source?: string;
  event?: string;
  targetWorkflow?: string;
  targetRule?: string;
  enabled: boolean;
  version: string;
  idempotencyPolicy?: 'EXACTLY_ONCE' | 'AT_LEAST_ONCE';
}

export interface ActionDescriptor {
  code: string;
  category: ActionCategory;
  retryable: boolean;
  timeout: number;
  idempotent: boolean;
  version: string;
}

// === CONDITION NODE ===
export interface ConditionNode {
  logic?: 'AND' | 'OR';
  conditions?: ConditionNode[];
  field?: string;
  operator?: string;
  value?: any;
  not?: boolean;
}

// === WORKFLOW STEP ===
export type WorkflowStepType = 'START' | 'STEP' | 'CONDITION' | 'ACTION' | 'BRANCH' | 'END';

export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  name?: string;
  actionRef?: string;
  condition?: ConditionNode;
  transitions?: Record<string, string>;
  next?: string;
  retryable?: boolean;
  maxRetries?: number;
}

// === ERROR ===
export interface AutomationError {
  code: AutomationErrorCode;
  message: string;
  traceId: string;
  details?: Record<string, any>;
}
