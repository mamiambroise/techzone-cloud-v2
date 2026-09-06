import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PackVersion } from './pack-version.entity';
import { RuleEffect, RuleStatus, RuleTargetType, RuleType, RuleValidationStatus } from '../../../common/enums';

@Entity({ name: 'pack_rules' })
@Index(['tenantId', 'packVersionId', 'code'], { unique: true })
@Index(['packVersionId', 'status'])
@Index(['targetType', 'targetId'])
@Index(['enabled', 'priority'])
export class PackRule {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() tenantId: string;
  @Column() packVersionId: string;
  @ManyToOne(() => PackVersion, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'packVersionId' }) packVersion: PackVersion;
  @Column({ length: 120 }) code: string;
  @Column({ length: 180 }) name: string;
  @Column({ type: 'text', nullable: true }) description?: string;
  @Column({ type: 'enum', enum: RuleType }) ruleType: RuleType;
  @Column({ type: 'enum', enum: RuleTargetType }) targetType: RuleTargetType;
  @Column({ length: 255 }) targetId: string;
  @Column({ type: 'enum', enum: RuleEffect }) effect: RuleEffect;
  @Column({ default: 50 }) priority: number;
  @Column({ type: 'enum', enum: RuleStatus, default: RuleStatus.DRAFT }) status: RuleStatus;
  @Column({ default: false }) enabled: boolean;
  @Column({ type: 'enum', enum: RuleValidationStatus, default: RuleValidationStatus.NOT_VALIDATED }) validationStatus: RuleValidationStatus;
  @Column({ length: 20, default: '1.0' }) expressionVersion: string;
  @Column({ nullable: true, length: 80 }) ruleHash?: string;
  @Column({ type: 'jsonb', default: {} }) metadata: Record<string, unknown>;
  @Column({ type: 'jsonb', default: { all: [] } }) expression: Record<string, unknown>;
  @Column({ nullable: true }) createdBy?: string;
  @Column({ nullable: true }) updatedBy?: string;
  @Column({ nullable: true, type: 'timestamp with time zone' }) archivedAt?: Date;
  @CreateDateColumn({ type: 'timestamp with time zone' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamp with time zone' }) updatedAt: Date;
  @Column({ default: 1 }) rowVersion: number;
}