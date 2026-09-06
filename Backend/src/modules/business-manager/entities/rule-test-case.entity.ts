import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PackRule } from './pack-rule.entity';

@Entity({ name: 'rule_test_cases' })
@Index(['ruleId', 'name'], { unique: true })
export class RuleTestCase {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() ruleId: string;
  @ManyToOne(() => PackRule, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'ruleId' }) rule: PackRule;
  @Column({ length: 180 }) name: string;
  @Column({ type: 'jsonb', default: {} }) inputContext: Record<string, unknown>;
  @Column({ default: false }) expectedMatch: boolean;
  @Column({ nullable: true, length: 30 }) expectedEffect?: string;
  @Column({ nullable: true }) lastRunAt?: Date;
  @Column({ type: 'jsonb', nullable: true }) lastResult?: Record<string, unknown>;
  @CreateDateColumn({ type: 'timestamp with time zone' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamp with time zone' }) updatedAt: Date;
}