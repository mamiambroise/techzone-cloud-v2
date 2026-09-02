// Code validation & SemVer utilities (BM-CDC-01 & BM-CDC-02)

const CODE_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SEMVER_REGEX = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;

export function isValidApplicationCode(code) {
  if (!code || typeof code !== 'string') return false;
  return CODE_REGEX.test(code.trim());
}

export function slugifyCode(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

export function isValidSemver(version) {
  if (!version || typeof version !== 'string') return false;
  return SEMVER_REGEX.test(version.trim());
}

export function incrementSemver(currentVersion, type = 'minor') {
  if (!currentVersion || !isValidSemver(currentVersion)) return '1.0.0';
  const clean = currentVersion.split('-')[0];
  const parts = clean.split('.').map(Number);
  const [major, minor, patch] = parts;

  if (type === 'major') return `${major + 1}.0.0`;
  if (type === 'minor') return `${major}.${minor + 1}.0`;
  if (type === 'patch') return `${major}.${minor}.${patch + 1}`;
  return `${major}.${minor + 1}.0`;
}

export function generateSlug(name) {
  return slugifyCode(name);
}

export function bumpSemVer(currentVersion, type = 'PATCH') {
  return incrementSemver(currentVersion, String(type).toLowerCase());
}
