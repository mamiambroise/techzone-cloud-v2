import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PackModuleStatus, PackModuleType } from '../../../common/enums';
import { PackVersion } from './pack-version.entity';

@Entity({ name: 'pack_modules' })
@Index(['tenantId', 'packVersionId', 'code'], { unique: true })
@Index(['packVersionId', 'displayOrder'])
@Index(['packVersionId', 'enabled'])
export class PackModule {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() tenantId: string;
  @Column() packVersionId: string;
  @ManyToOne(() => PackVersion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'packVersionId' }) packVersion: PackVersion;
  @Column({ length: 64 }) code: string;
  @Column({ length: 180 }) name: string;
  @Column({ nullable: true, length: 120 }) shortName?: string;
  @Column({ type: 'text', nullable: true }) description?: string;
  @Column({ type: 'enum', enum: PackModuleType, default: PackModuleType.BUSINESS }) moduleType: PackModuleType;
  @Column({ type: 'enum', enum: PackModuleStatus, default: PackModuleStatus.DRAFT }) status: PackModuleStatus;
  @Column({ default: true }) enabled: boolean;
  @Column({ default: 10 }) displayOrder: number;
  @Column({ nullable: true }) iconKey?: string;
  @Column({ type: 'jsonb', default: {} }) configuration: Record<string, unknown>;
  @Column({ type: 'jsonb', default: {} }) metadata: Record<string, unknown>;
  @Column() createdBy: string;
  @Column({ nullable: true }) updatedBy?: string;
  @Column({ nullable: true, type: 'timestamp with time zone' }) archivedAt?: Date;
  @CreateDateColumn({ type: 'timestamp with time zone' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamp with time zone' }) updatedAt: Date;
  @Column({ default: 1 }) version: number;
}
