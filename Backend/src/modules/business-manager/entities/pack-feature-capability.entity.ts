import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PackFeature } from './pack-feature.entity';
import { PackCapability } from './pack-capability.entity';
import { PackFeatureCapabilityRelation } from '../../../common/enums';

@Entity({ name: 'pack_feature_capabilities' })
@Index(['featureId', 'capabilityId'], { unique: true })
export class PackFeatureCapability {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() featureId: string;
  @Column() capabilityId: string;
  @ManyToOne(() => PackFeature, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'featureId' }) feature: PackFeature;
  @ManyToOne(() => PackCapability, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'capabilityId' }) capability: PackCapability;
  @Column({ type: 'enum', enum: PackFeatureCapabilityRelation, default: PackFeatureCapabilityRelation.USES }) relationType: PackFeatureCapabilityRelation;
  @Column({ default: false }) required: boolean;
  @Column({ type: 'jsonb', default: {} }) configuration: Record<string, unknown>;
  @CreateDateColumn({ type: 'timestamp with time zone' }) createdAt: Date;
}
