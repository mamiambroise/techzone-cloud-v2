import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { ErpError } from '../erp-adapter/erp-error';

function encryptionKey(): Buffer {
  const value = process.env.ERP_CREDENTIAL_ENCRYPTION_KEY || '';
  if (!/^[a-fA-F0-9]{64}$/.test(value)) throw ErpError.notConfigured('Le coffre ERP doit être configuré sur le serveur.');
  return Buffer.from(value, 'hex');
}

export function encryptErpKey(secret: string, tenantId: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  cipher.setAAD(Buffer.from(tenantId));
  const data = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map(b => b.toString('base64')).join('.');
}

export function resolveErpKey(capabilities: Record<string, any>, tenantId: string): string {
  if (capabilities.encryptedApiKey) {
    try {
      const [iv, tag, data] = String(capabilities.encryptedApiKey).split('.').map(s => Buffer.from(s, 'base64'));
      const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), iv);
      decipher.setAAD(Buffer.from(tenantId)); decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
    } catch { throw ErpError.notConfigured('La clé ERP ne peut pas être résolue pour ce tenant.'); }
  }
  // Compatibility with existing records. Migrated to ciphertext on configuration update.
  if (typeof capabilities.apiKey === 'string') return capabilities.apiKey.trim();
  const tenantKey = 'DOLIBARR_API_KEY_' + tenantId.replace(/-/g, '_').toUpperCase();
  return process.env[tenantKey] || (process.env.DOLIBARR_TENANT_ID === tenantId ? process.env.DOLIBARR_API_KEY || '' : '');
}

export function safeErpRegistry<T extends { capabilities: unknown; tenantId?: string }>(registry: T) {
  const config = (registry.capabilities || {}) as Record<string, any>;
  const tenantKey = registry.tenantId ? 'DOLIBARR_API_KEY_' + registry.tenantId.replace(/-/g, '_').toUpperCase() : '';
  const configured = config.apiKey || config.encryptedApiKey || (tenantKey && process.env[tenantKey]) || (registry.tenantId && process.env.DOLIBARR_TENANT_ID === registry.tenantId && process.env.DOLIBARR_API_KEY);
  return { ...registry, capabilities: {
    environment: typeof config.environment === 'string' ? config.environment : undefined,
    entity: Number(config.entity) || 1,
    credentialStatus: configured ? 'CONFIGURED' : 'MISSING',
  } };
}
