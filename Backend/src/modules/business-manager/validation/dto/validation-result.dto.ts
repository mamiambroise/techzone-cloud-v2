export interface ValidationCheck {
  code: string;
  status: 'PASS' | 'WARNING' | 'FAIL';
  message: string;
  details?: any;
}

export interface ValidationResult {
  passed: boolean;
  checks: ValidationCheck[];
  summary: {
    total: number;
    passed: number;
    warnings: number;
    failed: number;
  };
  canPublish: boolean;
  timestamp: string;
}