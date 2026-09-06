import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'runtime_resolution_steps' })
@Index(['resolutionId', 'stepType'])
export class RuntimeResolutionStep {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() resolutionId: string;
  @Column() stepType: string;
  @Column() status: string;
  @Column({ type: 'timestamp with time zone', nullable: true }) startedAt?: Date;
  @Column({ type: 'timestamp with time zone', nullable: true }) completedAt?: Date;
  @Column({ nullable: true }) durationMs?: number;
  @Column({ nullable: true }) errorCode?: string;
  @Column({ type: 'jsonb', default: {} }) details: Record<string, unknown>;
  @CreateDateColumn({ type: 'timestamp with time zone' }) createdAt: Date;
}