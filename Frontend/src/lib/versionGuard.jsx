// versionGuard.jsx — ApplicationVersion Editability & Immutability Guard (BM-CDC-00 / BM-CDC-02)
import React, { useMemo } from 'react';
import { Lock, ShieldAlert } from 'lucide-react';
import { IMMUTABLE_VERSION_STATUSES, VERSION_STATUS, ERROR_CODES } from '../types/domain';
import { useApp } from '../context/AppContext';

/**
 * Pure utility function to check if an ApplicationVersion (or status string) is editable.
 * Enforces strictly that PUBLISHED versions (as well as SUPERSEDED, DEPRECATED, ARCHIVED) are read-only.
 *
 * @param {Object|string|null|undefined} versionOrStatus - ApplicationVersion object or status string
 * @returns {boolean} isEditable - true if status is in an editable draft state (DRAFT, CONFIGURING, VALIDATING, READY), false if PUBLISHED or immutable
 */
export function isVersionEditable(versionOrStatus) {
  if (!versionOrStatus) return false;

  const status = typeof versionOrStatus === 'string'
    ? versionOrStatus
    : versionOrStatus.status;

  if (!status) return false;

  // Strict enforcement: PUBLISHED versions are always non-editable (read-only)
  if (status === VERSION_STATUS.PUBLISHED || status === 'PUBLISHED') {
    return false;
  }

  // Check against all immutable terminal statuses
  if (IMMUTABLE_VERSION_STATUSES.includes(status)) {
    return false;
  }

  return true;
}

/**
 * Inverse helper: returns true if the version is strictly read-only.
 *
 * @param {Object|string|null|undefined} versionOrStatus
 * @returns {boolean}
 */
export function isVersionReadOnly(versionOrStatus) {
  return !isVersionEditable(versionOrStatus);
}

/**
 * Detailed editability evaluation providing status, boolean flags, and human-readable justification.
 *
 * @param {Object|string|null|undefined} versionOrStatus
 * @returns {Object} { isEditable: boolean, isReadOnly: boolean, isPublished: boolean, isImmutable: boolean, status: string|null, reason: string|null }
 */
export function checkVersionEditability(versionOrStatus) {
  if (!versionOrStatus) {
    return {
      isEditable: false,
      isReadOnly: true,
      isPublished: false,
      isImmutable: true,
      status: null,
      reason: 'Aucune version sélectionnée.',
    };
  }

  const status = typeof versionOrStatus === 'string'
    ? versionOrStatus
    : versionOrStatus.status;

  const isPublished = status === VERSION_STATUS.PUBLISHED || status === 'PUBLISHED';
  const isImmutable = !status || IMMUTABLE_VERSION_STATUSES.includes(status);
  const isEditable = !isImmutable;

  let reason = null;
  if (isPublished) {
    reason = "La version est PUBLIÉE (PUBLISHED) : elle est scellée, immuable et strictement en lecture seule.";
  } else if (isImmutable) {
    reason = `La version est dans l'état '${status}' : les modifications directes sont interdites.`;
  }

  return {
    isEditable,
    isReadOnly: !isEditable,
    isPublished,
    isImmutable,
    status: status || null,
    reason,
  };
}

/**
 * Throws a runtime Error if the version is not editable.
 * Useful for securing backend / handler mutation endpoints.
 *
 * @param {Object|string|null|undefined} versionOrStatus
 * @param {string} [customMessage]
 */
export function assertVersionEditable(versionOrStatus, customMessage) {
  const check = checkVersionEditability(versionOrStatus);
  if (!check.isEditable) {
    const error = new Error(customMessage || check.reason || 'Version is read-only and cannot be modified.');
    error.code = ERROR_CODES.VERSION_NOT_EDITABLE;
    error.status = check.status;
    throw error;
  }
}

/**
 * React Hook that checks the ApplicationVersion status and returns an 'isEditable' boolean
 * along with additional status helpers.
 *
 * If called without arguments, it inspects the current `selectedVersion` from AppContext.
 * If passed a version object or status string, it inspects that specific version.
 *
 * @param {Object|string|null} [versionOverride] - Optional version object or status string
 * @returns {{
 *   isEditable: boolean,
 *   isReadOnly: boolean,
 *   isPublished: boolean,
 *   isImmutable: boolean,
 *   status: string|null,
 *   version: Object|null,
 *   reason: string|null,
 *   guardAction: (actionFn: Function, fallbackFn?: Function) => Function
 * }}
 */
export function useVersionGuard(versionOverride = undefined) {
  let contextVersion = null;
  try {
    const app = useApp();
    contextVersion = app?.selectedVersion || null;
  } catch {
    // Graceful fallback if used outside AppProvider
    contextVersion = null;
  }

  const targetVersion = versionOverride !== undefined ? versionOverride : contextVersion;

  return useMemo(() => {
    const editability = checkVersionEditability(targetVersion);
    const versionObj = typeof targetVersion === 'object' ? targetVersion : null;

    /**
     * Higher-order function to wrap mutation handlers, automatically blocking execution
     * when the current version is read-only.
     */
    const guardAction = (actionFn, fallbackFn) => (...args) => {
      if (!editability.isEditable) {
        if (typeof fallbackFn === 'function') {
          return fallbackFn(editability.reason);
        }
        console.warn(`[VersionGuard] Action bloquée : ${editability.reason}`);
        return {
          success: false,
          error: ERROR_CODES.VERSION_NOT_EDITABLE,
          message: editability.reason,
        };
      }
      return actionFn(...args);
    };

    return {
      isEditable: editability.isEditable,
      isReadOnly: editability.isReadOnly,
      isPublished: editability.isPublished,
      isImmutable: editability.isImmutable,
      status: editability.status,
      version: versionObj,
      reason: editability.reason,
      guardAction,
    };
  }, [targetVersion]);
}

/**
 * Declarative VersionGuard wrapper component.
 * Conditionally renders children or fallback content based on version editability.
 *
 * @example
 * <VersionGuard fallback={<p>Lecture seule</p>}>
 *   <button onClick={handleSave}>Enregistrer</button>
 * </VersionGuard>
 *
 * @example With render-prop:
 * <VersionGuard>
 *   {({ isEditable }) => (
 *     <button disabled={!isEditable}>Ajouter</button>
 *   )}
 * </VersionGuard>
 */
export function VersionGuard({
  children,
  fallback = null,
  version = undefined,
  showBanner = false,
}) {
  const guard = useVersionGuard(version);

  if (typeof children === 'function') {
    return (
      <>
        {showBanner && !guard.isEditable && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-2 text-xs font-semibold">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{guard.reason}</span>
          </div>
        )}
        {children(guard)}
      </>
    );
  }

  if (!guard.isEditable) {
    if (fallback) return fallback;
    if (showBanner) {
      return (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-2.5 text-xs font-medium">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{guard.reason}</span>
        </div>
      );
    }
    return null;
  }

  return children;
}

export default useVersionGuard;
