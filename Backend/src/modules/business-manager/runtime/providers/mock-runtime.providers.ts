import { Injectable } from '@nestjs/common';
import type {
  ApplicationContextProvider,
  CapabilityProvider,
  EntitlementProvider,
  IamContextProvider,
  RuntimeContext,
} from '../contracts/runtime.contracts';

@Injectable()
export class MockApplicationContextProvider implements ApplicationContextProvider {
  resolve(context: RuntimeContext) {
    return Promise.resolve({ applicationId: context.applicationId, applicationVersion: context.applicationVersion });
  }
}

@Injectable()
export class MockIamContextProvider implements IamContextProvider {
  resolve(context: RuntimeContext) {
    return Promise.resolve({ tenantId: context.tenantId, permissions: context.permissions ?? [] });
  }
}

@Injectable()
export class MockEntitlementProvider implements EntitlementProvider {
  resolve(context: RuntimeContext) {
    return Promise.resolve({ entitlements: context.entitlements ?? [] });
  }
}

@Injectable()
export class MockCapabilityProvider implements CapabilityProvider {
  resolve(context: RuntimeContext) {
    return Promise.resolve({ capabilities: context.capabilities ?? [] });
  }

  resolveCapabilities(codes: string[], context: RuntimeContext) {
    const available = new Set(context.capabilities ?? []);
    return Promise.resolve({ capabilities: codes.map((code) => ({ code, state: available.has(code) ? 'AVAILABLE' : 'UNAVAILABLE', provider: 'mock-runtime' })) });
  }
}