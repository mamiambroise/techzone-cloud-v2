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
import { VersionFeatureState } from '../../../common/enums';
import { ApplicationVersion } from './application-version.entity';
import { Feature } from './feature.entity';

@Entity({ name: 'version_features' })
@Index(['applicationVersionId', 'featureId'], { unique: true })
export class VersionFeature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  applicationVersionId: string;

  @Column()
  featureId: string;

  @Column({ type: 'enum', enum: VersionFeatureState, default: VersionFeatureState.DISABLED })
  state: VersionFeatureState;

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

  @ManyToOne(() => Feature, (feature) => feature.versionFeatures, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'featureId' })
  feature: Feature;
}
