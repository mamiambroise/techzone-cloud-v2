import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'packs' })
@Index(['code'], { unique: true })
export class Pack {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  code: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 32, default: 'DRAFT' })
  status: string;

  @Column({ type: 'json', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
