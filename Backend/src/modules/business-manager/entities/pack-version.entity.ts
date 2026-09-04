import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PackChangeType, PackManifestStatus, PackValidationStatus, PackVersionStatus } from '../../../common/enums';
import { Pack } from './pack.entity';

@Entity({ name: 'pack_versions' })
@Index(['packId', 'versionNumber'], { unique: true })
@Index(['tenantId', 'status'])
export class PackVersion {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() tenantId: string;
  @Column() packId: string;
  @ManyToOne(() => Pack, (pack) => pack.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'packId' }) pack: Pack;
  @Column({ length: 30 }) versionNumber: string;
  @Column({ nullable: true, length: 180 }) label?: string;
  @Column({ type: 'text', nullable: true }) description?: string;
  @Column({ type: 'enum', enum: PackVersionStatus, default: PackVersionStatus.DRAFT }) status: PackVersionStatus;
  @Column({ type: 'enum', enum: PackValidationStatus, default: PackValidationStatus.NOT_RUN }) validationStatus: PackValidationStatus;
  @Column({ type: 'enum', enum: PackManifestStatus, default: PackManifestStatus.NOT_GENERATED }) manifestStatus: PackManifestStatus;
  @Column({ type: 'enum', enum: PackChangeType, nullable: true }) changeType?: PackChangeType;
  @Column({ nullable: true }) sourceVersionId?: string;
  @Column({ nullable: true }) snapshotHash?: string;
  @Column({ nullable: true }) manifestHash?: string;
  @Column({ type: 'jsonb', nullable: true }) releaseNotes?: Record<string, unknown>;
  @Column({ type: 'jsonb', nullable: true }) snapshot?: Record<string, unknown>;
  @Column({ type: 'jsonb', nullable: true }) manifest?: Record<string, unknown>;
  @Column({ type: 'jsonb', default: [] }) modules: Record<string, unknown>[];
  @Column({ type: 'jsonb', default: [] }) features: string[];
  @Column({ type: 'jsonb', default: [] }) capabilities: string[];
  @Column({ type: 'jsonb', default: [] }) dependencies: Record<string, unknown>[];
  @Column({ type: 'jsonb', default: [] }) activationRules: Record<string, unknown>[];
  @Column({ type: 'jsonb', default: {} }) configuration: Record<string, unknown>;
  @Column({ type: 'jsonb', nullable: true }) validationDetails?: Record<string, unknown>;
  @Column({ nullable: true }) createdBy?: string;
  @Column({ nullable: true }) updatedBy?: string;
  @Column({ nullable: true }) validatedBy?: string;
  @Column({ nullable: true, type: 'timestamp with time zone' }) validatedAt?: Date;
  @Column({ nullable: true }) publishedBy?: string;
  @Column({ nullable: true, type: 'timestamp with time zone' }) publishedAt?: Date;
  @Column({ nullable: true, type: 'timestamp with time zone' }) deprecatedAt?: Date;
  @Column({ nullable: true, type: 'timestamp with time zone' }) archivedAt?: Date;
  @CreateDateColumn({ type: 'timestamp with time zone' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamp with time zone' }) updatedAt: Date;
  @Column({ default: 1 }) version: number;
}
