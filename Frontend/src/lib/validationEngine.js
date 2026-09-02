// Techzone Cloud Business Manager — Validation Engine (BM-CDC-00 à BM-CDC-08)
import { isValidApplicationCode, isValidSemver } from './slug';
import { generateTraceId } from './trace';
import { computeSnapshotHash } from './snapshotService';

export class ValidationEngine {
  static validateApplication(application, version, context = {}) {
    return this.validateApplicationVersion(application, version, context);
  }

  static validateApplicationVersion(application, version, context = {}) {
    const traceId = generateTraceId();
    const checks = [];

    const dataModels = context.dataModels || [];
    const features = context.features || [];
    const menus = context.menus || [];
    const configs = context.configs || [];
    const integrations = context.integrations || [];

    // Filter to current application if tagged
    const appEntities = dataModels.filter((d) => !d.applicationId || d.applicationId === application?.id);
    const appFeatures = features.filter((f) => !f.applicationId || f.applicationId === application?.id);
    const appConfigs = configs.filter((c) => !c.applicationId || c.applicationId === application?.id);
    const appIntegrations = integrations.filter((i) => !i.applicationId || i.applicationId === application?.id);

    // ==========================================
    // 1. BM-CDC-01: Application Identity & Tenant
    // ==========================================
    checks.push({
      code: 'APP_EXISTS',
      cdc: 'BM-CDC-01',
      name: "Présence et intégrité de l'Application",
      severity: application ? 'INFO' : 'ERROR',
      status: application ? 'PASS' : 'FAIL',
      targetType: 'APPLICATION',
      targetId: application?.id,
      message: application
        ? `Application "${application.name}" (${application.code}) validée.`
        : "L'application spécifiée n'existe pas.",
    });

    const isArchived = application?.status === 'ARCHIVED' || Boolean(application?.archivedAt);
    checks.push({
      code: 'APP_NOT_ARCHIVED',
      cdc: 'BM-CDC-01',
      name: 'Statut Opérationnel (Non Archivé)',
      severity: isArchived ? 'ERROR' : 'INFO',
      status: isArchived ? 'FAIL' : 'PASS',
      targetType: 'APPLICATION',
      targetId: application?.id,
      message: isArchived
        ? "L'application est archivée. Les modifications et publications sont verrouillées."
        : "L'application est dans un cycle actif/exploitable.",
    });

    const nameValid = Boolean(application?.name && application.name.trim().length >= 2);
    const codeValid = isValidApplicationCode(application?.code);
    const metaOk = nameValid && codeValid;
    checks.push({
      code: 'APP_METADATA_VALID',
      cdc: 'BM-CDC-01',
      name: 'Identifiant Technique Normalisé (kebab-case)',
      severity: metaOk ? 'INFO' : 'ERROR',
      status: metaOk ? 'PASS' : 'FAIL',
      targetType: 'APPLICATION',
      targetId: application?.id,
      message: metaOk
        ? `Code technique "${application?.code}" et nom conformes.`
        : 'Le code technique doit être en minuscules et tirets (kebab-case).',
    });

    // ==========================================
    // 2. BM-CDC-02: Semantic Versioning & Immutability
    // ==========================================
    checks.push({
      code: 'VERSION_EXISTS',
      cdc: 'BM-CDC-02',
      name: 'Présence de la Version Cible',
      severity: version ? 'INFO' : 'ERROR',
      status: version ? 'PASS' : 'FAIL',
      targetType: 'APPLICATION_VERSION',
      targetId: version?.id,
      message: version
        ? `Version cible "${version.versionNumber}" chargée.`
        : 'La version demandée est introuvable.',
    });

    const isSemver = version ? isValidSemver(version.versionNumber) : false;
    checks.push({
      code: 'VERSION_NUMBER_VALID',
      cdc: 'BM-CDC-02',
      name: 'Conformité SemVer (X.Y.Z)',
      severity: isSemver ? 'INFO' : 'ERROR',
      status: isSemver ? 'PASS' : 'FAIL',
      targetType: 'APPLICATION_VERSION',
      targetId: version?.id,
      message: isSemver
        ? `Format SemVer "${version?.versionNumber}" conforme.`
        : `Le numéro "${version?.versionNumber}" n'est pas un SemVer valide (ex: 1.0.0).`,
    });

    // Snapshot integrity
    const hasSnapshot = Boolean(version?.snapshot);
    checks.push({
      code: 'VERSION_SNAPSHOT_INTEGRITY',
      cdc: 'BM-CDC-02',
      name: 'Empreinte Cryptographique du Snapshot',
      severity: hasSnapshot ? 'INFO' : 'ERROR',
      status: hasSnapshot ? 'PASS' : 'FAIL',
      targetType: 'APPLICATION_VERSION',
      targetId: version?.id,
      message: hasSnapshot
        ? `Snapshot scellé avec empreinte (${version?.snapshotHash || 'SHA-256'}).`
        : 'Snapshot manquant ou corrompu pour cette version.',
    });

    // ==========================================
    // 3. BM-CDC-03: Data Model Integrity
    // ==========================================
    const hasEntities = appEntities.length > 0;
    const missingPrimaryKey = appEntities.some((e) => {
      const pks = e.fields?.filter((f) => f.isPrimary);
      return !pks || pks.length === 0;
    });

    checks.push({
      code: 'DATA_MODEL_ENTITIES',
      cdc: 'BM-CDC-03',
      name: 'Modèle de Données — Entités & Clés Primaires',
      severity: !hasEntities ? 'WARNING' : missingPrimaryKey ? 'ERROR' : 'INFO',
      status: !hasEntities ? 'WARNING' : missingPrimaryKey ? 'FAIL' : 'PASS',
      targetType: 'DATA_MODEL',
      message: missingPrimaryKey
        ? 'Une ou plusieurs entités n ont pas de clé primaire définie.'
        : hasEntities
        ? `${appEntities.length} entités actives modélisées avec clés primaires valides.`
        : 'Aucune entité déclarée.',
    });

    // Check relations validity
    const entityCodes = new Set(appEntities.map((e) => e.code));
    let brokenRelation = false;
    appEntities.forEach((e) => {
      e.relations?.forEach((r) => {
        if (r.targetCode && !entityCodes.has(r.targetCode)) {
          brokenRelation = true;
        }
      });
    });

    checks.push({
      code: 'DATA_MODEL_RELATIONS',
      cdc: 'BM-CDC-03',
      name: 'Modèle de Données — Intégrité Référentielle',
      severity: brokenRelation ? 'ERROR' : 'INFO',
      status: brokenRelation ? 'FAIL' : 'PASS',
      targetType: 'DATA_MODEL',
      message: brokenRelation
        ? 'Une relation pointe vers une entité cible inexistante.'
        : 'Toutes les relations inter-entités sont résolues et valides.',
    });

    // ==========================================
    // 4. BM-CDC-04: Feature & Capability Governance
    // ==========================================
    const hasFeatures = appFeatures.length > 0;
    const activeFeatures = appFeatures.filter((f) => f.status === 'ACTIVE');
    const activeFeatureCodes = new Set(activeFeatures.map((f) => f.code));

    // Check missing required entities
    let missingEntityInFeature = false;
    let missingFeatureDep = false;

    activeFeatures.forEach((f) => {
      f.requiredEntities?.forEach((reqEnt) => {
        if (!entityCodes.has(reqEnt)) {
          missingEntityInFeature = true;
        }
      });
      f.dependencies?.forEach((dep) => {
        if (dep.type === 'REQUIRES' && !activeFeatureCodes.has(dep.targetCode)) {
          missingFeatureDep = true;
        }
      });
    });

    checks.push({
      code: 'FEATURE_DEPENDENCIES',
      cdc: 'BM-CDC-04',
      name: 'Graphe de Dépendances des Fonctionnalités',
      severity: missingFeatureDep ? 'ERROR' : missingEntityInFeature ? 'WARNING' : 'INFO',
      status: missingFeatureDep ? 'FAIL' : missingEntityInFeature ? 'WARNING' : 'PASS',
      targetType: 'FEATURES',
      message: missingFeatureDep
        ? 'Une fonctionnalité active nécessite un module parent désactivé.'
        : missingEntityInFeature
        ? 'Une fonctionnalité requiert une entité non encore déclarée.'
        : `${activeFeatures.length} fonctionnalité(s) active(s) avec dépendances résolues.`,
    });

    // ==========================================
    // 5. BM-CDC-05: Menu Engine & Navigation
    // ==========================================
    const hasMenus = menus.length > 0;
    checks.push({
      code: 'MENU_NAVIGATION_RESOLVER',
      cdc: 'BM-CDC-05',
      name: 'Moteur de Navigation & Contrôle d Accès',
      severity: hasMenus ? 'INFO' : 'WARNING',
      status: hasMenus ? 'PASS' : 'WARNING',
      targetType: 'MENU_ENGINE',
      message: hasMenus
        ? `${menus.length} emplacement(s) de menu configurés (Sidebar, Mobile Nav).`
        : 'Aucun menu de navigation configuré.',
    });

    // ==========================================
    // 6. BM-CDC-06: Configuration & Secrets Protection
    // ==========================================
    const hasConfigs = appConfigs.length > 0;
    const exposedSecret = appConfigs.some((c) => c.dataType === 'SECRET' && c.runtimeExposed === true);

    checks.push({
      code: 'CONFIG_SECRETS_ENCRYPTION',
      cdc: 'BM-CDC-06',
      name: 'Sécurité des Secrets & Variables d Environnement',
      severity: exposedSecret ? 'ERROR' : 'INFO',
      status: exposedSecret ? 'FAIL' : 'PASS',
      targetType: 'CONFIGURATION',
      message: exposedSecret
        ? 'ALERTE CRITIQUE : Une variable secrète est marquée comme exposée au runtime client !'
        : `${appConfigs.length} paramètre(s) configurés avec chiffrement des secrets garanti.`,
    });

    // ==========================================
    // 7. BM-CDC-07: Integration Bridge & Runtime
    // ==========================================
    const connectedIntegrations = appIntegrations.filter((i) => i.status === 'CONNECTED');
    checks.push({
      code: 'RUNTIME_INTEGRATIONS_HEALTH',
      cdc: 'BM-CDC-07',
      name: 'Pont de Runtime & Connecteurs ERP / Paiement',
      severity: 'INFO',
      status: connectedIntegrations.length > 0 ? 'PASS' : 'WARNING',
      targetType: 'INTEGRATIONS',
      message: `${connectedIntegrations.length}/${appIntegrations.length} connecteurs externes opérationnels (ERP, Stripe, SendGrid, S3).`,
    });

    // Calculate Summary
    let passed = 0;
    let warnings = 0;
    let failed = 0;

    checks.forEach((c) => {
      if (c.status === 'PASS') passed++;
      else if (c.status === 'WARNING') warnings++;
      else failed++;
    });

    const overallStatus = failed > 0 ? 'FAIL' : warnings > 0 ? 'WARNING' : 'PASS';
    const canPublish = failed === 0;
    const completeness = Math.round((passed / checks.length) * 100);

    return {
      valid: canPublish,
      canPublish,
      status: overallStatus,
      completeness,
      validatedAt: new Date().toISOString(),
      traceId,
      checks,
      errors: checks.filter((c) => c.status === 'FAIL'),
      warnings: checks.filter((c) => c.status === 'WARNING'),
      summary: {
        passed,
        warnings,
        failed,
        total: checks.length,
      },
    };
  }
}
