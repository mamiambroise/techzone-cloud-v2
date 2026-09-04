import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PackSourceType, PackStatus } from '../../../common/enums';
import { PackVersion } from './pack-version.entity';

@Entity({ name: 'packs' })
@Index(['tenantId', 'code'], { unique: true })
@Index(['tenantId', 'status'])
export class Pack {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() tenantId: string;
  @Column({ length: 100 }) code: string;
  @Column({ length: 255 }) name: string;
  @Column({ nullable: true, length: 120 }) shortName?: string;
  @Column({ type: 'text', nullable: true }) description?: string;
  @Column({ nullable: true }) category?: string;
  @Column({ nullable: true }) iconKey?: string;
  @Column({ nullable: true }) logoRef?: string;
  @Column({ type: 'enum', enum: PackStatus, default: PackStatus.DRAFT }) status: PackStatus;
  @Column({ type: 'enum', enum: PackSourceType, default: PackSourceType.CUSTOM }) sourceType: PackSourceType;
  @Column({ type: 'jsonb', default: {} }) metadata: Record<string, unknown>;
  @Column() createdBy: string;
  @Column({ nullable: true }) updatedBy?: string;
  @Column({ nullable: true }) archivedBy?: string;
  @CreateDateColumn({ type: 'timestamp with time zone' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamp with time zone' }) updatedAt: Date;
  @Column({ nullable: true, type: 'timestamp with time zone' }) archivedAt?: Date;
  @Column({ default: 1 }) version: number;
  @OneToMany(() => PackVersion, (packVersion) => packVersion.pack) versions: PackVersion[];
}
