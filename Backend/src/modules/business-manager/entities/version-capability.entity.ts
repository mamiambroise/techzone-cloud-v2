import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Capability } from './capability.entity';
import { ApplicationVersion } from './application-version.entity';

@Entity({ name: 'version_capabilities' })
@Index(['applicationVersionId', 'capabilityId'], { unique: true })
export class VersionCapability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  applicationVersionId: string;

  @Column()
  capabilityId: string;

  @Column({ default: false })
  enabled: boolean;

  @Column({ type: 'json', nullable: true })
  configuration?: Record<string, any> | null;

  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  @ManyToOne(() => ApplicationVersion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicationVersionId' })
  applicationVersion: ApplicationVersion;

  @ManyToOne(() => Capability, (capability) => capability.versionCapabilities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'capabilityId' })
  capability: Capability;
}
