import { lookup } from 'node:dns';
import { BlockList, isIP } from 'node:net';
import { Agent as HttpAgent } from 'node:http';
import { Agent as HttpsAgent } from 'node:https';
import { ErpError } from '../erp-error';

const blocked = new BlockList();
for (const [address, prefix] of [['0.0.0.0',8], ['10.0.0.0',8], ['100.64.0.0',10], ['127.0.0.0',8], ['169.254.0.0',16], ['172.16.0.0',12], ['192.168.0.0',16], ['224.0.0.0',4], ['240.0.0.0',4]] as const) blocked.addSubnet(address, prefix, 'ipv4');
for (const [address, prefix] of [['::',128], ['::1',128], ['fc00::',7], ['fe80::',10], ['ff00::',8]] as const) blocked.addSubnet(address, prefix, 'ipv6');

export function isPrivateDestination(address: string): boolean {
  const family = isIP(address);
  return !family || blocked.check(address, family === 6 ? 'ipv6' : 'ipv4');
}

export function validateDolibarrUrl(value: string): URL {
  let url: URL;
  try { url = new URL(value); } catch { throw new ErpError('URL Dolibarr invalide.', 422, 'INTEGRATION_PAYLOAD_INVALID'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new ErpError('URL Dolibarr non autorisée.', 422, 'INTEGRATION_PAYLOAD_INVALID');
  }
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (host === '169.254.169.254' || host === 'metadata.google.internal') throw new ErpError('Destination Dolibarr interdite.', 422, 'INTEGRATION_PAYLOAD_INVALID');
  if ((host === 'localhost' || host.endsWith('.localhost') || (isIP(host) && isPrivateDestination(host))) && !privateOriginAllowed(url)) {
    throw new ErpError('Destination privée Dolibarr non autorisée par le serveur.', 422, 'INTEGRATION_PAYLOAD_INVALID');
  }
  return url;
}

function privateOriginAllowed(url: URL): boolean {
  return (process.env.DOLIBARR_ALLOWED_PRIVATE_ORIGINS || '').split(',').map(s => s.trim()).includes(url.origin);
}

// Validate the actual socket address to prevent DNS rebinding between validation and connect.
export function dolibarrAgents(url: URL) {
  const guardedLookup = (hostname: string, options: any, callback: any) => {
    lookup(hostname, { family: options.family || 0, all: true }, (error, addresses) => {
      if (error) return callback(error);
      if (!addresses.length || addresses.some(({ address }) => address === '169.254.169.254' || (isPrivateDestination(address) && !privateOriginAllowed(url)))) {
        return callback(new ErpError('Destination Dolibarr interdite.', 422, 'INTEGRATION_PAYLOAD_INVALID'));
      }
      if (options.all) callback(null, addresses);
      else callback(null, addresses[0].address, addresses[0].family);
    });
  };
  return { httpAgent: new HttpAgent({ lookup: guardedLookup }), httpsAgent: new HttpsAgent({ lookup: guardedLookup }) };
}
