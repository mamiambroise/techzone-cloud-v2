import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { Application } from '../modules/business-manager/entities/application.entity';
import { ApplicationVersion } from '../modules/business-manager/entities/application-version.entity';
import { Publication } from '../modules/business-manager/entities/publication.entity';
import { ActivityEvent } from '../modules/business-manager/entities/activity-event.entity';
import { DataModelDefinition } from '../modules/business-manager/entities/data-model.entity';
import { DataModelSnapshot } from '../modules/business-manager/entities/data-model-snapshot.entity';
import { Feature } from '../modules/business-manager/entities/feature.entity';
import { Capability } from '../modules/business-manager/entities/capability.entity';
import { FeatureCapability } from '../modules/business-manager/entities/feature-capability.entity';
import { VersionFeature } from '../modules/business-manager/entities/version-feature.entity';
import { VersionCapability } from '../modules/business-manager/entities/version-capability.entity';
import { CapabilityDependency } from '../modules/business-manager/entities/capability-dependency.entity';
import { CapabilityEntityRequirement } from '../modules/business-manager/entities/capability-entity-requirement.entity';

config();

const configService = new ConfigService();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: Number.parseInt(configService.get('DB_PORT', '5432'), 10),
  username: configService.get('DB_USERNAME', 'postgres'),
  password: configService.get('DB_PASSWORD', 'postgres'),
  database: configService.get('DB_DATABASE', 'business_manager'),
  synchronize: true,
  logging: configService.get('DB_LOGGING', 'false') === 'true',
  entities: [
    Application,
    ApplicationVersion,
    Publication,
    ActivityEvent,
    DataModelDefinition,
    DataModelSnapshot,
    Feature,
    Capability,
    FeatureCapability,
    VersionFeature,
    VersionCapability,
    CapabilityDependency,
    CapabilityEntityRequirement,
  ],
  migrations: ['dist/migrations/*.js'],
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;