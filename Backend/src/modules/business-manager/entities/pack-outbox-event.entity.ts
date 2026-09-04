import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'pack_outbox_events' })
@Index(['tenantId', 'createdAt'])
@Index(['processedAt'])
export class PackOutboxEvent {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() tenantId: string;
  @Column({ length: 120 }) eventType: string;
  @Column({ length: 120 }) aggregateType: string;
  @Column() aggregateId: string;
  @Column({ type: 'jsonb', default: {} }) payload: Record<string, unknown>;
  @Column({ nullable: true, type: 'timestamp with time zone' }) processedAt?: Date;
  @CreateDateColumn({ type: 'timestamp with time zone' }) createdAt: Date;
}
