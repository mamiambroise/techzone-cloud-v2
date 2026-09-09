import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { DependencyResolutionStatus, DependencySourceType, DependencyStatus, DependencyTargetType, DependencyType } from '../../../common/enums';
import { PackVersion } from './pack-version.entity';

@Entity({ name: 'pack_dependencies' })
@Index(['tenantId', 'packVersionId'])
@Index(['sourceType', 'sourceId'])
@Index(['targetType', 'targetRef'])
@Index(['resolutionStatus'])
@Index(['packVersionId', 'sourceType', 'sourceId', 'dependencyType', 'targetType', 'targetRef'], { unique: true })
export class PackDependency {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() tenantId: string;
  @Column() packVersionId: string;
  @ManyToOne(() => PackVersion, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'packVersionId' }) packVersion: PackVersion;
  @Column({ type: 'enum', enum: DependencySourceType }) sourceType: DependencySourceType;
  @Column() sourceId: string;
  @Column({ type: 'enum', enum: DependencyType }) dependencyType: DependencyType;
  @Column({ type: 'enum', enum: DependencyTargetType }) targetType: DependencyTargetType;
  @Column({ length: 255 }) targetRef: string;
  @Column({ nullable: true, length: 120 }) targetVersionRange?: string;
  @Column({ default: true }) required: boolean;
  @Column({ nullable: true }) conditionRef?: string;
  @Column({ type: 'text', nullable: true }) reason?: string;
  @Column({ type: 'enum', enum: DependencyStatus, default: DependencyStatus.ACTIVE }) status: DependencyStatus;
  @Column({ type: 'enum', enum: DependencyResolutionStatus, default: DependencyResolutionStatus.NOT_RESOLVED }) resolutionStatus: DependencyResolutionStatus;
  @Column({ type: 'jsonb', default: {} }) metadata: Record<string, unknown>;
  @Column({ nullable: true }) createdBy?: string;
  @Column({ nullable: true }) updatedBy?: string;
  @CreateDateColumn({ type: 'timestamp with time zone' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamp with time zone' }) updatedAt: Date;
  @Column({ nullable: true, type: 'timestamp with time zone' }) archivedAt?: Date;
  @Column({ default: 1 }) rowVersion: number;
}