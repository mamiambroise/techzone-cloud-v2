import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { FeatureStatus, FeatureSourceType } from '../../../common/enums';
import { FeatureCapability } from './feature-capability.entity';
import { VersionFeature } from './version-feature.entity';

@Entity({ name: 'features' })
@Index(['code'], { unique: true })
@Index(['status'])
@Index(['category'])
export class Feature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120, unique: true })
  code: string;

  @Column({ length: 180 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  category?: string;

  @Column({ nullable: true })
  icon?: string;

  @Column({ type: 'enum', enum: FeatureStatus, default: FeatureStatus.DRAFT })
  status: FeatureStatus;

  @Column({ type: 'enum', enum: FeatureSourceType, default: FeatureSourceType.CUSTOM })
  sourceType: FeatureSourceType;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ nullable: true, type: 'json' })
  metadata?: Record<string, any>;

  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @Column({ nullable: true, type: 'timestamp with time zone' })
  archivedAt?: Date;

  @Column({ default: 1 })
  version: number;

  @OneToMany(() => FeatureCapability, (featureCapability) => featureCapability.feature)
  featureCapabilities: Relation<FeatureCapability[]>;

  @OneToMany(() => VersionFeature, (versionFeature) => versionFeature.feature)
  versionFeatures: Relation<VersionFeature[]>;
}
