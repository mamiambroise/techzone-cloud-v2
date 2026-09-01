import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
@Entity({ name: 'menu_item_feature_requirements' }) @Index(['menuItemId', 'featureId'], { unique: true })
export class MenuItemFeatureRequirement { @PrimaryGeneratedColumn('uuid') id: string; @Column() menuItemId: string; @Column() featureId: string; @CreateDateColumn({ type: 'timestamp with time zone' }) createdAt: Date; }
