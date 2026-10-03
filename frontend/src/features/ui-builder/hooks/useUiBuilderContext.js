/**
 * UI Builder — résolution du contexte canonique
 *   Tenant → Application → ApplicationVersion
 *
 * Règles appliquées (données réelles uniquement, aucune version fabriquée) :
 *  - les versions sont chargées depuis le Business Manager de l'application
 *    sélectionnée (`GET /business-manager/applications/:id/versions`) ;
 *  - un changement d'application purge immédiatement les versions précédentes ;
 *  - une version déjà sélectionnée n'est conservée que si elle appartient bien à
 *    l'application courante ; sinon auto-sélection si l'application n'expose
 *    qu'une seule version, sinon état "à choisir" explicite ;
 *  - le contexte est persisté par tenant, relu une fois les applications
 *    connues (le tenant arrive souvent après le premier rendu) ;
 *  - les applications et les versions ont des statuts distincts : une erreur
 *    sur les versions ne doit jamais faire disparaître la liste des
 *    applications, et inversement.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

import { api } from '../../../services/apiClient.js';

export const UI_BUILDER_STORAGE_PREFIX = 'ui-builder-context';

const get = (path) => api.get(`/business-manager${path}`).then((response) => response.data);

export function contextStorageKey(tenantId) {
  return `${UI_BUILDER_STORAGE_PREFIX}:${tenantId || 'none'}`;
}

/** Lecture défensive du contexte persisté (sessionStorage peut être vide/corrompu). */
export function readStoredContext(tenantId) {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(contextStorageKey(tenantId)) || '{}');
    return {
      applicationId: typeof parsed?.applicationId === 'string' ? parsed.applicationId : '',
      versionId: typeof parsed?.versionId === 'string' ? parsed.versionId : '',
    };
  } catch {
    return { applicationId: '', versionId: '' };
  }
}

export function writeStoredContext(tenantId, { applicationId, versionId }) {
  if (!tenantId) return;
  try {
    sessionStorage.setItem(
      contextStorageKey(tenantId),
      JSON.stringify({ applicationId: applicationId || '', versionId: versionId || '' }),
    );
  } catch {
    /* sessionStorage indisponible : le contexte reste en mémoire */
  }
}

/**
 * Pure : réconcilie la version courante avec les versions réellement chargées.
 * - liste vide → aucune version (jamais de version conservée) ;
 * - version courante valide → conservée (deep-link / retour) ;
 * - une seule version → auto-sélection ;
 * - plusieurs versions → état "à choisir" explicite.
 */
export function reconcileVersionId(versions, currentVersionId) {
  if (!Array.isArray(versions) || versions.length === 0) return '';
  if (currentVersionId && versions.some((version) => version.id === currentVersionId)) return currentVersionId;
  return versions.length === 1 ? versions[0].id : '';
}

const IDLE = 'IDLE';
const LOADING = 'LOADING';
const LOADED = 'LOADED';
const EMPTY = 'EMPTY';
const ERROR = 'ERROR';

export default function useUiBuilderContext({ tenantId, applicationId: forcedApplicationId, versionId: forcedVersionId } = {}) {
  const [applications, setApplications] = useState([]);
  const [applicationsStatus, setApplicationsStatus] = useState(tenantId ? LOADING : IDLE);
  const [applicationsError, setApplicationsError] = useState(null);
  const [versions, setVersions] = useState([]);
  const [versionsStatus, setVersionsStatus] = useState(IDLE);
  const [versionsError, setVersionsError] = useState(null);
  const [context, setContext] = useState({ applicationId: forcedApplicationId || '', versionId: forcedVersionId || '' });
  const [applicationsRevision, setApplicationsRevision] = useState(0);
  const [versionsRevision, setVersionsRevision] = useState(0);

  const applicationId = forcedApplicationId || context.applicationId;
  const versionId = forcedVersionId || context.versionId;

  const selectApplication = useCallback((nextApplicationId) => {
    // Une nouvelle application repart sans version : jamais de version héritée
    // de l'application précédente.
    setContext({ applicationId: nextApplicationId || '', versionId: '' });
    setVersions([]);
    setVersionsError(null);
    setVersionsStatus(nextApplicationId ? LOADING : IDLE);
  }, []);

  const selectVersion = useCallback((nextVersionId) => {
    setContext((previous) => ({ ...previous, versionId: nextVersionId || '' }));
  }, []);

  const retryApplications = useCallback(() => setApplicationsRevision((revision) => revision + 1), []);
  const retryVersions = useCallback(() => setVersionsRevision((revision) => revision + 1), []);

  /* ---- Applications du tenant ---- */
  useEffect(() => {
    if (!tenantId) {
      setApplications([]);
      setApplicationsStatus(IDLE);
      setContext({ applicationId: forcedApplicationId || '', versionId: forcedVersionId || '' });
      return undefined;
    }

    let live = true;
    setApplicationsStatus(LOADING);
    setApplicationsError(null);

    get('/applications')
      .then((rows) => {
        if (!live) return;
        const list = Array.isArray(rows) ? rows : [];
        setApplications(list);
        setApplicationsStatus(list.length > 0 ? LOADED : EMPTY);
        // Le contexte persisté n'est réappliqué qu'une fois la liste connue :
        // une application qui n'existe plus dans ce tenant est purgée.
        const stored = readStoredContext(tenantId);
        const storedValid = list.some((application) => application.id === stored.applicationId);
        setContext((previous) => {
          const candidate = forcedApplicationId
            || (storedValid ? stored.applicationId : '')
            || (list.some((application) => application.id === previous.applicationId) ? previous.applicationId : '');
          const versionForCandidate = candidate === previous.applicationId
            ? previous.versionId
            : (candidate === stored.applicationId ? stored.versionId : '');
          return { applicationId: candidate, versionId: forcedVersionId || versionForCandidate };
        });
      })
      .catch((failure) => {
        if (!live) return;
        setApplications([]);
        setApplicationsStatus(ERROR);
        setApplicationsError(failure?.normalized?.type || 'ERROR');
      });

    return () => { live = false; };
  }, [tenantId, applicationsRevision, forcedApplicationId, forcedVersionId]);

  /* ---- Versions de l'application sélectionnée ---- */
  useEffect(() => {
    if (!tenantId || !applicationId) {
      setVersions([]);
      setVersionsError(null);
      setVersionsStatus(IDLE);
      return undefined;
    }

    if (applicationsStatus === LOADING || applicationsStatus === IDLE) return undefined;

    if (applicationsStatus === ERROR) {
      // Liste des applications illisible : on ne requête pas de versions au hasard.
      setVersions([]);
      setVersionsStatus(IDLE);
      return undefined;
    }

    if (!applications.some((application) => application.id === applicationId)) {
      // Application disparue du tenant : on purge application ET version.
      setContext({ applicationId: '', versionId: '' });
      setVersions([]);
      setVersionsStatus(IDLE);
      return undefined;
    }

    let live = true;
    setVersionsStatus(LOADING);
    setVersionsError(null);
    setVersions([]);

    get(`/applications/${applicationId}/versions`)
      .then((rows) => {
        if (!live) return;
        const list = Array.isArray(rows) ? rows : [];
        setVersions(list);
        setVersionsStatus(list.length > 0 ? LOADED : EMPTY);
        setContext((previous) => ({
          applicationId,
          versionId: reconcileVersionId(list, forcedVersionId || previous.versionId),
        }));
      })
      .catch((failure) => {
        if (!live) return;
        setVersions([]);
        setVersionsStatus(ERROR);
        setVersionsError(failure?.normalized?.type || 'ERROR');
        setContext({ applicationId, versionId: '' });
      });

    return () => { live = false; };
  }, [tenantId, applicationId, applications, applicationsStatus, versionsRevision, forcedVersionId]);

  /* ---- Persistance du contexte résolu ---- */
  useEffect(() => {
    if (!tenantId) return;
    const resolved = applicationId && versionId && versionsStatus === LOADED;
    const applicationResolved = applicationId
      && !versionId
      && (versionsStatus === LOADED || versionsStatus === EMPTY || versionsStatus === ERROR);
    // Tant que le contexte n'est pas résolu, rien n'est écrit : un contexte
    // persisté valide ne doit jamais être effacé par un état transitoire.
    if (resolved) {
      writeStoredContext(tenantId, { applicationId, versionId });
      return;
    }
    if (applicationResolved) {
      writeStoredContext(tenantId, { applicationId, versionId: '' });
      return;
    }
    if (!applicationId && (applicationsStatus === LOADED || applicationsStatus === EMPTY)) {
      writeStoredContext(tenantId, { applicationId: '', versionId: '' });
    }
  }, [tenantId, applicationId, versionId, versionsStatus, applicationsStatus]);

  const application = useMemo(
    () => applications.find((row) => row.id === applicationId) || null,
    [applications, applicationId],
  );
  const version = useMemo(
    () => versions.find((row) => row.id === versionId) || null,
    [versions, versionId],
  );

  return {
    applications,
    applicationsStatus,
    applicationsError,
    applicationsForbidden: applicationsError === 'FORBIDDEN',
    versions,
    versionsStatus,
    versionsError,
    versionsForbidden: versionsError === 'FORBIDDEN',
    applicationId,
    versionId,
    application,
    version,
    selectApplication,
    selectVersion,
    retryApplications,
    retryVersions,
  };
}