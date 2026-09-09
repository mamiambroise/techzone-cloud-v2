import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { MenuLocation, MenuSourceType, MenuStatus } from '../../../common/enums';
@Entity({ name: 'menus' }) @Index(['code'], { unique: true })
export class Menu {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true, length: 120 }) code: string;
  @Column({ length: 180 }) name: string;
  @Column({ type: 'text', nullable: true }) description?: string;
  @Column({ type: 'enum', enum: MenuLocation }) location: MenuLocation;
  @Column({ type: 'enum', enum: MenuStatus, default: MenuStatus.DRAFT }) status: MenuStatus;
  @Column({ type: 'enum', enum: MenuSourceType, default: MenuSourceType.CUSTOM }) sourceType: MenuSourceType;
  @Column({ nullable: true }) createdBy?: string;
  @CreateDateColumn({ type: 'timestamp with time zone' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamp with time zone' }) updatedAt: Date;
  @Column({ nullable: true, type: 'timestamp with time zone' }) archivedAt?: Date;
  @Column({ default: 1 }) version: number;
}
