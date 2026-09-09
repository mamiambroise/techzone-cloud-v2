import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
@Entity({ name: 'menu_item_capability_requirements' }) @Index(['menuItemId', 'capabilityId'], { unique: true })
export class MenuItemCapabilityRequirement { @PrimaryGeneratedColumn('uuid') id: string; @Column() menuItemId: string; @Column() capabilityId: string; @CreateDateColumn({ type: 'timestamp with time zone' }) createdAt: Date; }
