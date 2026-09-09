import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ConditionNodeType, LogicalOperator, RuleOperator, RuleValueType } from '../../../common/enums';
import { PackRule } from './pack-rule.entity';

@Entity({ name: 'rule_conditions' })
@Index(['ruleId', 'parentConditionId', 'displayOrder'])
export class RuleCondition {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() ruleId: string;
  @ManyToOne(() => PackRule, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'ruleId' }) rule: PackRule;
  @Column({ nullable: true }) parentConditionId?: string;
  @Column({ type: 'enum', enum: ConditionNodeType }) nodeType: ConditionNodeType;
  @Column({ type: 'enum', enum: LogicalOperator, nullable: true }) logicalOperator?: LogicalOperator;
  @Column({ nullable: true, length: 255 }) fieldRef?: string;
  @Column({ type: 'enum', enum: RuleOperator, nullable: true }) operator?: RuleOperator;
  @Column({ type: 'jsonb', nullable: true }) value?: unknown;
  @Column({ type: 'enum', enum: RuleValueType, nullable: true }) valueType?: RuleValueType;
  @Column({ default: 0 }) displayOrder: number;
  @Column({ type: 'jsonb', default: {} }) metadata: Record<string, unknown>;
  @CreateDateColumn({ type: 'timestamp with time zone' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamp with time zone' }) updatedAt: Date;
}