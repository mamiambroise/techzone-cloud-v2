import { SetMetadata } from '@nestjs/common';

export const TENANT_RESOURCE_KEY = 'tenant_resource';
export const TENANT_OPTIONAL_KEY = 'tenant_optional';
// Authentication/session discovery must work before a tenant is selected.
export const TenantOptional = () => SetMetadata(TENANT_OPTIONAL_KEY, true);

export type TenantResourceConfig = {
  table: string;
  idParam?: string;
  idColumn?: string;
  tenantColumn?: string;
};

export const TenantResource = (config: TenantResourceConfig) =>
  SetMetadata(TENANT_RESOURCE_KEY, config);
