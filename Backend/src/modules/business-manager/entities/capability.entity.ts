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
import { CapabilityStatus, CapabilitySourceType, CapabilityType, RiskLevel } from '../../../common/enums';
import { FeatureCapability } from './feature-capability.entity';
import { VersionCapability } from './version-capability.entity';
import { CapabilityDependency } from './capability-dependency.entity';
import { CapabilityEntityRequirement } from './capability-entity-requirement.entity';

@Entity({ name: 'capabilities' })
@Index(['code'], { unique: true })
@Index(['status'])
@Index(['type'])
@Index(['riskLevel'])
export class Capability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 180, unique: true })
  code: string;

  @Column({ length: 180 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  category?: string;

  @Column({ nullable: true })
  groupName?: string;

  @Column({ type: 'enum', enum: CapabilityType, default: CapabilityType.ACTION })
  type: CapabilityType;

  @Column({ type: 'enum', enum: RiskLevel, default: RiskLevel.MEDIUM })
  riskLevel: RiskLevel;

  @Column({ type: 'enum', enum: CapabilityStatus, default: CapabilityStatus.DRAFT })
  status: CapabilityStatus;

  @Column({ type: 'enum', enum: CapabilitySourceType, default: CapabilitySourceType.CUSTOM })
  sourceType: CapabilitySourceType;

  @Column({ default: false })
  breakingChange: boolean;

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

  @OneToMany(() => FeatureCapability, (featureCapability) => featureCapability.capability)
  featureCapabilities: Relation<FeatureCapability[]>;

  @OneToMany(() => VersionCapability, (versionCapability) => versionCapability.capability)
  versionCapabilities: Relation<VersionCapability[]>;

  @OneToMany(() => CapabilityDependency, (dependency) => dependency.capability)
  dependencies: Relation<CapabilityDependency[]>;

  @OneToMany(() => CapabilityEntityRequirement, (requirement) => requirement.capability)
  entityRequirements: Relation<CapabilityEntityRequirement[]>;
}
