import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PackFeatureStatus, PackFeatureType, PackFeatureVisibility } from '../../../common/enums';
import { PackVersion } from './pack-version.entity';
import { PackModule } from './pack-module.entity';

@Entity({ name: 'pack_features' })
@Index(['tenantId', 'packVersionId', 'code'], { unique: true })
@Index(['packVersionId', 'enabled'])
export class PackFeature {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() tenantId: string;
  @Column() packVersionId: string;
  @ManyToOne(() => PackVersion, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'packVersionId' }) packVersion: PackVersion;
  @Column({ nullable: true }) moduleId?: string;
  @ManyToOne(() => PackModule, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'moduleId' }) module?: PackModule;
  @Column({ length: 180 }) code: string;
  @Column({ length: 180 }) name: string;
  @Column({ nullable: true, length: 120 }) shortName?: string;
  @Column({ type: 'text', nullable: true }) description?: string;
  @Column({ type: 'enum', enum: PackFeatureType, default: PackFeatureType.OPTIONAL }) featureType: PackFeatureType;
  @Column({ type: 'enum', enum: PackFeatureStatus, default: PackFeatureStatus.DRAFT }) status: PackFeatureStatus;
  @Column({ default: true }) enabled: boolean;
  @Column({ default: false }) defaultEnabled: boolean;
  @Column({ type: 'enum', enum: PackFeatureVisibility, default: PackFeatureVisibility.PUBLIC }) visibility: PackFeatureVisibility;
  @Column({ type: 'jsonb', default: {} }) configuration: Record<string, unknown>;
  @Column({ type: 'jsonb', default: {} }) metadata: Record<string, unknown>;
  @Column() createdBy: string;
  @Column({ nullable: true }) updatedBy?: string;
  @Column({ nullable: true, type: 'timestamp with time zone' }) archivedAt?: Date;
  @CreateDateColumn({ type: 'timestamp with time zone' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamp with time zone' }) updatedAt: Date;
  @Column({ default: 1 }) version: number;
}
