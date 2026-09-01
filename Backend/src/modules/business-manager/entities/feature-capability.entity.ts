import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Feature } from './feature.entity';
import { Capability } from './capability.entity';

@Entity({ name: 'feature_capabilities' })
@Index(['featureId', 'capabilityId'], { unique: true })
export class FeatureCapability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  featureId: string;

  @Column()
  capabilityId: string;

  @Column({ default: false })
  required: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @ManyToOne(() => Feature, (feature) => feature.featureCapabilities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'featureId' })
  feature: Feature;

  @ManyToOne(() => Capability, (capability) => capability.featureCapabilities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'capabilityId' })
  capability: Capability;
}
