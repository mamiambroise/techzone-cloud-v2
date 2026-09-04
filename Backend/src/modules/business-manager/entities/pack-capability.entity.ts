import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PackCapabilityScope, PackCapabilityStatus, PackCapabilityType } from '../../../common/enums';

@Entity({ name: 'pack_capabilities' })
@Index(['tenantId', 'code'], { unique: true })
@Index(['code'])
export class PackCapability {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() tenantId: string;
  @Column({ length: 180 }) code: string;
  @Column({ length: 180 }) name: string;
  @Column({ type: 'text', nullable: true }) description?: string;
  @Column({ type: 'enum', enum: PackCapabilityType, default: PackCapabilityType.ACTION }) capabilityType: PackCapabilityType;
  @Column({ type: 'enum', enum: PackCapabilityScope, default: PackCapabilityScope.PACK }) scope: PackCapabilityScope;
  @Column({ type: 'enum', enum: PackCapabilityStatus, default: PackCapabilityStatus.DRAFT }) status: PackCapabilityStatus;
  @Column({ nullable: true }) contractRef?: string;
  @Column({ nullable: true }) contractVersion?: string;
  @Column({ type: 'jsonb', default: {} }) metadata: Record<string, unknown>;
  @Column() createdBy: string;
  @CreateDateColumn({ type: 'timestamp with time zone' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamp with time zone' }) updatedAt: Date;
  @Column({ default: 1 }) version: number;
}
