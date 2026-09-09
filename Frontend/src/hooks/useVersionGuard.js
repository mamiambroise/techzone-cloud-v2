// useVersionGuard.js — Convenience export for hooks directory
export {
  useVersionGuard,
  isVersionEditable,
  isVersionReadOnly,
  checkVersionEditability,
  assertVersionEditable,
  VersionGuard,
} from '../lib/versionGuard';

export { useVersionGuard as default } from '../lib/versionGuard';
