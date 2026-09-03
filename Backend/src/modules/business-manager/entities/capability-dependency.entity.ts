import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { DependencyType } from '../../../common/enums';
import { Capability } from './capability.entity';

@Entity({ name: 'capability_dependencies' })
@Index(['capabilityId', 'dependencyCapabilityId', 'dependencyType'], { unique: true })
export class CapabilityDependency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  capabilityId: string;

  @Column()
  dependencyCapabilityId: string;

  @Column({ type: 'enum', enum: DependencyType, default: DependencyType.REQUIRES })
  dependencyType: DependencyType;

  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @ManyToOne(() => Capability, (capability) => capability.dependencies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'capabilityId' })
  capability: Relation<Capability>;

  @ManyToOne(() => Capability, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dependencyCapabilityId' })
  dependencyCapability: Relation<Capability>;
}
