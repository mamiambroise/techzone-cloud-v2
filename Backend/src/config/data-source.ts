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
import { Menu } from '../modules/business-manager/entities/menu.entity';
import { MenuItem } from '../modules/business-manager/entities/menu-item.entity';
import { VersionMenu } from '../modules/business-manager/entities/version-menu.entity';
import { VersionMenuItem } from '../modules/business-manager/entities/version-menu-item.entity';
import { MenuItemFeatureRequirement } from '../modules/business-manager/entities/menu-item-feature-requirement.entity';
import { MenuItemCapabilityRequirement } from '../modules/business-manager/entities/menu-item-capability-requirement.entity';
import { ConfigurationDefinition } from '../modules/business-manager/entities/configuration-definition.entity';
import { ConfigurationValue } from '../modules/business-manager/entities/configuration-value.entity';
import { MetadataDefinition } from '../modules/business-manager/entities/metadata-definition.entity';
import { MetadataValue } from '../modules/business-manager/entities/metadata-value.entity';
import { ContractArtifact } from '../modules/business-manager/entities/contract-artifact.entity';
import { RuntimeSnapshot } from '../modules/business-manager/entities/runtime-snapshot.entity';
import { IntegrationDefinition } from '../modules/business-manager/entities/integration-definition.entity';
import { IntegrationBinding } from '../modules/business-manager/entities/integration-binding.entity';
import { ValidationCampaign } from '../modules/business-manager/entities/validation-campaign.entity';
import { QualityIssue } from '../modules/business-manager/entities/quality-issue.entity';
import { QualityWaiver } from '../modules/business-manager/entities/quality-waiver.entity';

config();

const configService = new ConfigService();

function required(name: string): string {
  const value = configService.get<string>(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: required('DB_HOST'),
  port: Number.parseInt(required('DB_PORT'), 10),
  username: required('DB_USER'),
  password: configService.get('DB_PASSWORD', ''),
  database: required('DB_NAME'),
  synchronize: configService.get('DB_SYNCHRONIZE', 'false') === 'true',
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
    Menu, MenuItem, VersionMenu, VersionMenuItem,
    MenuItemFeatureRequirement, MenuItemCapabilityRequirement,
    ConfigurationDefinition, ConfigurationValue, MetadataDefinition, MetadataValue,
    ContractArtifact, RuntimeSnapshot, IntegrationDefinition, IntegrationBinding,
    ValidationCampaign, QualityIssue, QualityWaiver,
  ],
  migrations: ['dist/migrations/*.js'],
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
