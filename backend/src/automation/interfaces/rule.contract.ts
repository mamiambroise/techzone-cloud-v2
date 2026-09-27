// WF-CDC-02 : Rule Contract
// WF-CDC-07 : Execution Record & Timeline

export interface RuleDefinition {
  code: string;
  nom: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'ARCHIVED';
  priority: number;
  conditions: ConditionNode;
  effects: string[];
  allowedContextFields?: string[];
  version: string;
}

import { ConditionNode } from './automation.contract';

export interface RuleEvaluationResult {
  code: string;
  result: 'MATCHED' | 'NOT_MATCHED' | 'SKIPPED' | 'ERROR';
  trace: string[];
  duration: number;
  version: string;
}

export interface RuleValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// === EXECUTION RECORD ===
export interface AutomationExecutionRecord {
  executionId: string;
  traceId: string;
  tenantId: string;
  applicationId?: string;
  workflowCode?: string;
  ruleCode?: string;
  triggerCode?: string;
  version: string;
  startedAt: string;
  finishedAt?: string;
  status: AutomationExecutionStatus;
  duration?: number;
  currentStep?: string;
  errorCode?: string;
  errorMessage?: string;
  retryCount: number;
}

export interface TimelineEntry {
  timestamp: string;
  event: string;
  detail?: string;
  stepId?: string;
  status: string;
}

export interface ExecutionSearchFilter {
  startDate?: string;
  endDate?: string;
  tenantId?: string;
  workflowCode?: string;
  ruleCode?: string;
  triggerCode?: string;
  status?: AutomationExecutionStatus;
  errorCode?: string;
  traceId?: string;
  page?: number;
  pageSize?: number;
}

import { AutomationExecutionStatus } from './automation.contract';
