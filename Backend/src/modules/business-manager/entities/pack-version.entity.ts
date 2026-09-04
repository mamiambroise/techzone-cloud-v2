import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'pack_versions' })
@Index(['packId', 'versionNumber'], { unique: true })
export class PackVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  packId: string;

  @Column({ length: 64 })
  versionNumber: string;

  @Column({ length: 32, default: 'DRAFT' })
  status: string;

  @Column({ type: 'json', default: {} })
  snapshot: Record<string, unknown>;

  @Column({ type: 'json', default: [] })
  modules: unknown[];

  @Column({ type: 'json', default: [] })
  features: unknown[];

  @Column({ type: 'json', default: [] })
  capabilities: unknown[];

  @Column({ type: 'json', default: [] })
  dependencies: unknown[];

  @Column({ type: 'json', default: [] })
  rules: unknown[];

  @Column({ type: 'json', default: {} })
  validation: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
