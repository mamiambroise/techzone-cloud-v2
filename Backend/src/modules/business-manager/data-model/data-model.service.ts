import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import {
    DataModelDefinition,
    DataModelFieldDefinition,
    DataModelFormulaDefinition,
    DataModelIndexDefinition,
    DataModelRelationshipDefinition,
    DataModelValidationDefinition,
    DataModelConstraintDefinition,
} from '../entities/data-model.entity';
import { DataModelSnapshot } from '../entities/data-model-snapshot.entity';
import { DataModelStatus } from '../../../common/enums';

export interface SchemaIssue {
    code: string;
    severity: 'ERROR' | 'WARNING' | 'INFO';
    message: string;
    details?: Record<string, any>;
}

export interface CreateDataModelDto {
    name: string;
    description?: string;
    fields: DataModelFieldDefinition[];
    relationships?: DataModelRelationshipDefinition[];
    constraints?: DataModelConstraintDefinition[];
    indexes?: DataModelIndexDefinition[];
    validationRules?: DataModelValidationDefinition[];
    formulaDefinitions?: DataModelFormulaDefinition[];
    metadata?: Record<string, any>;
}

@Injectable()
export class DataModelService {
    private readonly modelRepository: Repository<DataModelDefinition>;
    private readonly snapshotRepository: Repository<DataModelSnapshot>;
    private readonly modelCache = new Map<string, DataModelDefinition>();

    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
        private readonly auditService: AuditService,
    ) {
        this.modelRepository = this.dataSource.getRepository(DataModelDefinition);
        this.snapshotRepository = this.dataSource.getRepository(DataModelSnapshot);
    }

    async createForVersion(
        applicationId: string,
        versionId: string,
        dto: CreateDataModelDto,
        createdBy: string,
    ): Promise<DataModelDefinition> {
        const normalized: Partial<DataModelDefinition> = {
            applicationId,
            versionId,
            name: dto.name,
            description: dto.description,
            status: DataModelStatus.DRAFT,
            createdBy,
            fields: dto.fields ?? [],
            relationships: dto.relationships ?? [],
            constraints: dto.constraints ?? [],
            indexes: dto.indexes ?? [],
            validationRules: dto.validationRules ?? [],
            formulaDefinitions: dto.formulaDefinitions ?? [],
            metadata: dto.metadata ?? {},
        };

        if (!normalized.name || !normalized.name.trim()) {
            throw new BadRequestException('Model name is required');
        }

        const model = this.modelRepository.create(normalized);
        const saved = await this.modelRepository.save(model);
        this.modelCache.set(saved.id, saved);

        const snapshotPayload = {
            name: saved.name,
            description: saved.description,
            fields: saved.fields,
            relationships: saved.relationships,
            constraints: saved.constraints,
            indexes: saved.indexes,
            validationRules: saved.validationRules,
            formulaDefinitions: saved.formulaDefinitions,
        };

        const snapshot = this.snapshotRepository.create({
            modelId: saved.id,
            versionId: saved.versionId,
            name: 'initial',
            snapshot: snapshotPayload,
            schemaHash: this.hashSchema(snapshotPayload),
            createdBy,
        });
        await this.snapshotRepository.save(snapshot);

        await this.auditService.log({
            applicationId,
            actorId: createdBy,
            eventType: 'data-model.created',
            action: 'DATA_MODEL_CREATE',
            targetType: 'DataModelDefinition',
            targetId: saved.id,
            result: 'SUCCESS',
            after: { model: saved },
            metadata: { versionId },
        });

        return saved;
    }

    async findByVersion(applicationId: string, versionId: string): Promise<DataModelDefinition[]> {
        const models = await this.modelRepository.find({
            where: { applicationId, versionId },
            order: { createdAt: 'DESC' },
        });

        models.forEach((model) => this.modelCache.set(model.id, model));
        return models;
    }

    async findById(modelId: string): Promise<DataModelDefinition | null> {
        const cached = this.modelCache.get(modelId);
        if (cached) {
            return cached;
        }

        return this.modelRepository.findOne({ where: { id: modelId } });
    }

    async validateSchema(modelId: string): Promise<{
        valid: boolean;
        issues: SchemaIssue[];
        summary: { total: number; errors: number; warnings: number; info: number };
    }> {
        const model =
            (await this.modelRepository.findOne({ where: { id: modelId } })) ??
            this.modelCache.get(modelId) ??
            ({ id: modelId, fields: [] } as Partial<DataModelDefinition>);

        const fields = Array.isArray((model as DataModelDefinition).fields)
            ? (model as DataModelDefinition).fields
            : [];

        const issues: SchemaIssue[] = [];

        if (fields.length === 0) {
            issues.push({
                code: 'EMPTY_SCHEMA',
                severity: 'ERROR',
                message: 'The data model has no fields defined.',
            });
        }

        const seenNames = new Map<string, string>();
        fields.forEach((field, index) => {
            const name = String(field.name ?? '').trim();
            if (!name) {
                issues.push({
                    code: 'INVALID_FIELD_NAME',
                    severity: 'ERROR',
                    message: `Field at position ${index + 1} is missing a name.`,
                    details: { index },
                });
                return;
            }

            const key = name.toLowerCase();
            const firstSeenAt = seenNames.get(key);
            if (firstSeenAt !== undefined) {
                issues.push({
                    code: 'DUPLICATE_FIELD_NAME',
                    severity: 'ERROR',
                    message: `Duplicate field name detected: ${name}.`,
                    details: { field: name, firstSeenAt },
                });
            } else {
                seenNames.set(key, String(index));
            }
        });

        const primaryKeys = fields.filter((field) => field.primaryKey || field.name?.toLowerCase() === 'id');
        if (primaryKeys.length === 0) {
            issues.push({
                code: 'MISSING_PRIMARY_KEY',
                severity: 'ERROR',
                message: 'The model must define a primary key field.',
            });
        }

        const fieldsMissingType = fields.filter((field) => !field.type || !String(field.type).trim());
        if (fieldsMissingType.length > 0) {
            issues.push({
                code: 'MISSING_FIELD_TYPE',
                severity: 'ERROR',
                message: 'Each field must declare a type.',
                details: {
                    fields: fieldsMissingType.map((field) => field.name ?? 'unnamed'),
                },
            });
        }

        const enumFields = fields.filter((field) => field.type === 'ENUM' && (!Array.isArray(field.enumValues) || field.enumValues.length === 0));
        if (enumFields.length > 0) {
            issues.push({
                code: 'INVALID_ENUM_FIELD',
                severity: 'WARNING',
                message: 'Enum fields must define a non-empty set of allowed values.',
                details: {
                    fields: enumFields.map((field) => field.name),
                },
            });
        }

        const relationshipErrors = (model as DataModelDefinition).relationships ?? [];
        const invalidRelation = relationshipErrors.find(
            (relation) => !relation.name || !relation.targetModel || !relation.targetField,
        );
        if (invalidRelation) {
            issues.push({
                code: 'INVALID_RELATION',
                severity: 'WARNING',
                message: 'A relationship is missing required target information.',
                details: { relation: invalidRelation },
            });
        }

        const valid = !issues.some((issue) => issue.severity === 'ERROR');

        return {
            valid,
            issues,
            summary: {
                total: issues.length,
                errors: issues.filter((issue) => issue.severity === 'ERROR').length,
                warnings: issues.filter((issue) => issue.severity === 'WARNING').length,
                info: issues.filter((issue) => issue.severity === 'INFO').length,
            },
        };
    }

    async getDependencyGraph(modelId: string): Promise<{ nodes: any[]; edges: any[] }> {
        const model = await this.findById(modelId);
        if (!model) {
            throw new NotFoundException(`Data model with id "${modelId}" not found`);
        }

        const nodes = (model.fields ?? []).map((field) => ({
            id: field.name,
            label: field.name,
            type: field.type,
            primaryKey: !!field.primaryKey,
        }));

        const edges = (model.relationships ?? []).map((relation) => ({
            id: relation.id ?? `${relation.sourceField}-${relation.targetModel}`,
            from: relation.sourceField,
            to: relation.targetModel,
            label: relation.type,
        }));

        return { nodes, edges };
    }

    async getImpactAnalysis(modelId: string, fieldName: string): Promise<{ field: string; impacts: string[] }> {
        const model = await this.findById(modelId);
        if (!model) {
            throw new NotFoundException(`Data model with id "${modelId}" not found`);
        }

        const references = (model.relationships ?? []).filter(
            (relation) => relation.sourceField === fieldName || relation.targetField === fieldName,
        );

        return {
            field: fieldName,
            impacts: references.map((relation) => `${relation.name} (${relation.type})`),
        };
    }

    async planMigration(modelId: string, targetModel: Partial<DataModelDefinition>): Promise<{
        additions: string[];
        removals: string[];
        renames: string[];
        warnings: string[];
    }> {
        const current = await this.findById(modelId);
        if (!current) {
            throw new NotFoundException(`Data model with id "${modelId}" not found`);
        }

        const currentNames = (current.fields ?? []).map((field) => field.name);
        const targetNames = (targetModel.fields ?? []).map((field) => field.name);

        const additions = targetNames.filter((name) => !currentNames.includes(name));
        const removals = currentNames.filter((name) => !targetNames.includes(name));
        const renames = currentNames.filter(
            (name) => targetNames.includes(name) && currentNames.includes(name),
        );

        return {
            additions,
            removals,
            renames,
            warnings: additions.length > 0 ? ['New columns will require a schema migration.'] : [],
        };
    }

    private hashSchema(value: Record<string, any>): string {
        return Buffer.from(JSON.stringify(value)).toString('base64').slice(0, 32);
    }
}
