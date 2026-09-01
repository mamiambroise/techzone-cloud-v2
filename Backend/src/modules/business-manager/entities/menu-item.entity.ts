import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { MenuItemState, NavigationOpenMode, NavigationTargetType, RequirementMode } from '../../../common/enums';
@Entity({ name: 'menu_items' }) @Index(['menuId', 'code'], { unique: true }) @Index(['menuId', 'parentId'])
export class MenuItem {
  @PrimaryGeneratedColumn('uuid') id: string; @Column() menuId: string; @Column({ nullable: true }) parentId?: string | null;
  @Column({ length: 120 }) code: string; @Column({ length: 180 }) label: string; @Column({ nullable: true }) labelKey?: string;
  @Column({ type: 'text', nullable: true }) description?: string; @Column({ nullable: true }) iconKey?: string;
  @Column({ type: 'enum', enum: NavigationTargetType, default: NavigationTargetType.NONE }) targetType: NavigationTargetType;
  @Column({ nullable: true }) route?: string; @Column({ nullable: true }) externalUrl?: string; @Column({ nullable: true }) actionKey?: string;
  @Column({ type: 'enum', enum: NavigationOpenMode, default: NavigationOpenMode.SAME_VIEW }) openMode: NavigationOpenMode;
  @Column({ type: 'enum', enum: MenuItemState, default: MenuItemState.ENABLED }) state: MenuItemState;
  @Column({ type: 'enum', enum: RequirementMode, default: RequirementMode.ALL }) requirementMode: RequirementMode;
  @Column({ default: 0 }) sortOrder: number; @Column({ default: false }) hideWhenEmpty: boolean; @Column({ nullable: true }) createdBy?: string;
  @CreateDateColumn({ type: 'timestamp with time zone' }) createdAt: Date; @UpdateDateColumn({ type: 'timestamp with time zone' }) updatedAt: Date;
  @Column({ nullable: true, type: 'timestamp with time zone' }) archivedAt?: Date; @Column({ default: 1 }) version: number;
}
