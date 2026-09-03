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
import { Capability } from './capability.entity';

@Entity({ name: 'capability_entity_requirements' })
@Index(['capabilityId', 'dataEntityId'], { unique: true })
export class CapabilityEntityRequirement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  capabilityId: string;

  @Column()
  dataEntityId: string;

  @Column({ nullable: true })
  requirementType?: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @ManyToOne(() => Capability, (capability) => capability.entityRequirements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'capabilityId' })
  capability: Relation<Capability>;
}
