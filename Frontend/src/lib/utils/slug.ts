const CODE_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SEMVER_REGEX = /^\d+\.\d+\.\d+$/;

export function isValidApplicationCode(code: string): boolean {
  if (!code || typeof code !== "string") return false;
  return CODE_REGEX.test(code.trim());
}

export function slugifyCode(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export function isValidSemver(version: string): boolean {
  if (!version || typeof version !== "string") return false;
  return SEMVER_REGEX.test(version.trim());
}

export function incrementSemver(current: string, type: "patch" | "minor" | "major" = "minor"): string {
  if (!isValidSemver(current)) return "1.0.0";
  const [major, minor, patch] = current.split(".").map(Number);
  if (type === "major") return `${major + 1}.0.0`;
  if (type === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}
