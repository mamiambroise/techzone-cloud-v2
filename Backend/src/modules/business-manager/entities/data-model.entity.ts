import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { DataModelStatus } from '../../../common/enums';
import { ApplicationVersion } from './application-version.entity';
import { DataModelSnapshot } from './data-model-snapshot.entity';

export interface DataModelFieldDefinition {
    id?: string;
    name: string;
    type: string;
    required?: boolean;
    unique?: boolean;
    primaryKey?: boolean;
    nullable?: boolean;
    defaultValue?: any;
    description?: string;
    enumValues?: string[];
    length?: number;
    precision?: number;
    scale?: number;
    metadata?: Record<string, any>;
}

export interface DataModelRelationshipDefinition {
    id?: string;
    name: string;
    type: string;
    sourceField: string;
    targetModel: string;
    targetField: string;
    cardinality?: string;
    onDelete?: string;
    onUpdate?: string;
    metadata?: Record<string, any>;
}

export interface DataModelConstraintDefinition {
    id?: string;
    name: string;
    type: string;
    fieldNames: string[];
    expression?: string;
    message?: string;
    enabled?: boolean;
}

export interface DataModelIndexDefinition {
    id?: string;
    name: string;
    fieldNames: string[];
    unique?: boolean;
    type?: string;
    whereClause?: string;
    enabled?: boolean;
}

export interface DataModelValidationDefinition {
    id?: string;
    name: string;
    ruleType: string;
    expression?: string;
    severity?: 'ERROR' | 'WARNING' | 'INFO';
    message?: string;
    enabled?: boolean;
}

export interface DataModelFormulaDefinition {
    id?: string;
    name: string;
    expression: string;
    returnType?: string;
    description?: string;
    enabled?: boolean;
}

@Entity({ name: 'data_model_definitions' })
@Index(['applicationId'])
@Index(['versionId'])
@Index(['status'])
export class DataModelDefinition {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    applicationId: string;

    @Column()
    versionId: string;

    @Column({ length: 180 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'enum', enum: DataModelStatus, default: DataModelStatus.DRAFT })
    status: DataModelStatus;

    @Column({ default: 1 })
    schemaVersion: number;

    @Column({ type: 'json', default: [] })
    fields: DataModelFieldDefinition[];

    @Column({ type: 'json', default: [] })
    relationships: DataModelRelationshipDefinition[];

    @Column({ type: 'json', default: [] })
    constraints: DataModelConstraintDefinition[];

    @Column({ type: 'json', default: [] })
    indexes: DataModelIndexDefinition[];

    @Column({ type: 'json', default: [] })
    validationRules: DataModelValidationDefinition[];

    @Column({ type: 'json', default: [] })
    formulaDefinitions: DataModelFormulaDefinition[];

    @Column({ type: 'json', nullable: true })
    metadata?: Record<string, any>;

    @Column()
    createdBy: string;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    updatedAt: Date;

    @ManyToOne(() => ApplicationVersion, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'versionId' })
    version: Relation<ApplicationVersion>;

    @OneToMany(() => DataModelSnapshot, (snapshot) => snapshot.model)
    snapshots: Relation<DataModelSnapshot[]>;
}
