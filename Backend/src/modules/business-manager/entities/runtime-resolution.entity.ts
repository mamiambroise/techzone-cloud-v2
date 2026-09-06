import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'runtime_resolutions' })
@Index(['tenantId', 'applicationId', 'createdAt'])
@Index(['traceId'])
@Index(['sourceManifestHash'])
export class RuntimeResolution {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() tenantId: string;
  @Column() applicationId: string;
  @Column() packCode: string;
  @Column() packVersion: string;
  @Column() environment: string;
  @Column() sourceManifestHash: string;
  @Column() status: string;
  @Column() traceId: string;
  @Column({ nullable: true }) retryOf?: string;
  @Column({ type: 'jsonb', default: {} }) summary: Record<string, unknown>;
  @Column({ type: 'timestamp with time zone', nullable: true }) startedAt?: Date;
  @Column({ type: 'timestamp with time zone', nullable: true }) completedAt?: Date;
  @Column({ nullable: true }) durationMs?: number;
  @CreateDateColumn({ type: 'timestamp with time zone' }) createdAt: Date;
}