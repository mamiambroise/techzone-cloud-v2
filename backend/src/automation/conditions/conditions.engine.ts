// WF-CDC-06 : Conditions & Formula Engine
// Evalue des conditions et calculs declaratifs via AST/IR controle, jamais eval().

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  ConditionNode,
  ExpressionNode,
  ExpressionOperand,
} from '../interfaces/automation.contract';

const ALLOWED_OPERATORS = [
  'EQ', 'NE', 'GT', 'GTE', 'LT', 'LTE', 'IN', 'NOT_IN', 'CONTAINS', 'IS_NULL',
];

const ALLOWED_FORMULA_FUNCTIONS = [
  'ADD', 'SUB', 'MUL', 'DIV', 'CONCAT', 'UPPER', 'LOWER', 'LENGTH',
];

// Types autorisés pour les opérandes
const VALID_TYPES = ['STRING', 'NUMBER', 'BOOLEAN', 'DATE', 'DATETIME', 'NULL', 'ARRAY'];

@Injectable()
export class ConditionsEngine {
  private readonly logger = new Logger(ConditionsEngine.name);

  /**
   * Evalue un arbre de conditions typé de façon déterministe.
   */
  evaluate(condition: ConditionNode, context: Record<string, any>): boolean {
    if (!condition || typeof condition !== 'object') {
      throw new BadRequestException('Condition invalide');
    }

    if (condition.logic) {
      return this.evaluateLogicNode(condition, context);
    }

    return this.evaluatePrimitive(condition, context);
  }

  private evaluateLogicNode(node: ConditionNode, context: Record<string, any>): boolean {
    const children = node.conditions || [];

    if (children.length === 0) {
      throw new BadRequestException('Noeud conditionnel vide');
    }

    const results = children.map((child) => this.evaluate(child, context));
    const combined = node.logic === 'OR'
      ? results.some(Boolean)
      : results.every(Boolean);

    return node.not ? !combined : combined;
  }

  private evaluatePrimitive(node: ConditionNode, context: Record<string, any>): boolean {
    const field = node.field;
    const operator = node.operator;
    const expected = node.value;

    if (!field) throw new BadRequestException('field requis dans la condition');
    if (!operator) throw new BadRequestException('operator requis dans la condition');
    if (!ALLOWED_OPERATORS.includes(operator)) {
      throw new BadRequestException(
        `Operator "${operator}" non autorise. Autorises: ${ALLOWED_OPERATORS.join(', ')}`,
      );
    }

    const actual = this.resolveField(field, context);
    const result = this.applyOperator(actual, operator, expected);

    return node.not ? !result : result;
  }

  private resolveField(field: string, context: Record<string, any>): any {
    if (field === 'now') return new Date().toISOString();
    return field.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), context);
  }

  private applyOperator(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'EQ': return actual === expected;
      case 'NE': return actual !== expected;
      case 'GT': return actual > expected;
      case 'GTE': return actual >= expected;
      case 'LT': return actual < expected;
      case 'LTE': return actual <= expected;
      case 'IN': return Array.isArray(expected) && expected.includes(actual);
      case 'NOT_IN': return Array.isArray(expected) && !expected.includes(actual);
      case 'CONTAINS': return String(actual ?? '').includes(String(expected));
      case 'IS_NULL': return actual == null;
      default: return false;
    }
  }

  /**
   * Evalue une expression de formule (AST/IR) avec fonctionnement safe.
   */
  evaluateFormula(expr: ExpressionNode, context: Record<string, any>): any {
    return this.evalNode(expr, context);
  }

  private evalNode(node: ExpressionNode, context: Record<string, any>): any {
    if (!node.operator) {
      throw new BadRequestException('Expression sans operateur');
    }

    if (!ALLOWED_FORMULA_FUNCTIONS.includes(node.operator)) {
      throw new BadRequestException(
        `Fonction "${node.operator}" non autorisee. Autorisees: ${ALLOWED_FORMULA_FUNCTIONS.join(', ')}`,
      );
    }

    const left = this.evalOperand(node.left, context);
    const right = node.right ? this.evalOperand(node.right, context) : undefined;

    return this.applyFunction(node.operator, left, right);
  }

  private evalOperand(operand: ExpressionOperand, context: Record<string, any>): any {
    if (!operand) return undefined;

    // Noeud imbriqué (a `left` ET un `operator`)
    if ('left' in operand && 'operator' in operand) {
      return this.evalNode(operand as unknown as ExpressionNode, context);
    }

    // Atome valeur
    if ('value' in operand && !('operator' in operand)) {
      return operand.value;
    }

    // Atome champ
    if ('field' in operand && !('operator' in operand)) {
      return this.resolveField(operand.field, context);
    }

    return undefined;
  }

  private applyFunction(fn: string, left: any, right: any): any {
    switch (fn) {
      case 'ADD': return Number(left) + Number(right);
      case 'SUB': return Number(left) - Number(right);
      case 'MUL': return Number(left) * Number(right);
      case 'DIV':
        if (Number(right) === 0) throw new BadRequestException('Division par zero');
        return Number(left) / Number(right);
      case 'CONCAT': return String(left ?? '') + String(right ?? '');
      case 'UPPER': return String(left ?? '').toUpperCase();
      case 'LOWER': return String(left ?? '').toLowerCase();
      case 'LENGTH': return String(left ?? '').length;
      default: throw new BadRequestException(`Fonction inconnue: ${fn}`);
    }
  }

  /**
   * Valide une condition (structure + operators allowlists + types).
   */
  validate(condition: ConditionNode): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    this.validateNode(condition, errors);
    return { valid: errors.length === 0, errors };
  }

  private validateNode(node: ConditionNode, errors: string[]): void {
    if (!node) { errors.push('Noeud null'); return; }

    if (node.logic) {
      if (!['AND', 'OR'].includes(node.logic)) errors.push(`logic invalide: ${node.logic}`);
      (node.conditions || []).forEach((c) => this.validateNode(c, errors));
    }

    if (node.field) {
      if (!node.operator) errors.push('operator requis');
      if (node.operator && !ALLOWED_OPERATORS.includes(node.operator)) {
        errors.push(`operator non autorise: ${node.operator}`);
      }
    }
  }

  /**
   * Evalue une condition et retourne la trace explicative.
   */
  evaluateWithTracePublic(condition: ConditionNode, ctx: Record<string, any>): {
    result: boolean;
    trace: string[];
  } {
    const trace: string[] = [];
    const result = this.evaluateWithTrace(condition, ctx, trace);
    return { result, trace };
  }

  /**
   * Simulation d'une condition avec contexte de test, sans effet métier.
   */
  simulate(condition: ConditionNode, testContext: Record<string, any>): {
    result: boolean;
    trace: string[];
  } {
    return this.evaluateWithTracePublic(condition, testContext);
  }

  private evaluateWithTrace(node: ConditionNode, ctx: Record<string, any>, trace: string[]): boolean {
    if (node.logic) {
      const children = node.conditions || [];
      const results = children.map((c) => this.evaluateWithTrace(c, ctx, trace));
      const combined = node.logic === 'OR' ? results.some(Boolean) : results.every(Boolean);
      trace.push(`${node.logic}(${results.join(',')}) = ${node.not ? !combined : combined}`);
      return node.not ? !combined : combined;
    }

    if (node.field && node.operator) {
      const actual = this.resolveField(node.field, ctx);
      const result = this.applyOperator(actual, node.operator, node.value);
      trace.push(`${node.field} ${node.operator} ${JSON.stringify(node.value)} => ${result}`);
      return node.not ? !result : result;
    }

    trace.push('Noeud terminal sans evaluation');
    return true;
  }
}
