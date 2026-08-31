import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { DataModelDefinition } from './data-model.entity';

@Entity({ name: 'data_model_snapshots' })
@Index(['modelId'])
@Index(['versionId'])
export class DataModelSnapshot {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    modelId: string;

    @Column()
    versionId: string;

    @Column({ length: 120 })
    name: string;

    @Column({ type: 'json' })
    snapshot: Record<string, any>;

    @Column({ type: 'varchar', length: 128, nullable: true })
    schemaHash?: string;

    @Column()
    createdBy: string;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    createdAt: Date;

    @ManyToOne(() => DataModelDefinition, (model) => model.snapshots, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'modelId' })
    model: DataModelDefinition;
}
