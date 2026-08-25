import { db } from "@/db";
import { applications, applicationVersions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ValidationCheck, ValidationResult, ValidationStatus } from "../types/domain";
import { isValidApplicationCode, isValidSemver } from "../utils/slug";

export interface ValidationContext {
  application: typeof applications.$inferSelect;
  version: typeof applicationVersions.$inferSelect;
}

export interface ApplicationValidator {
  name: string;
  validate(context: ValidationContext): ValidationCheck | ValidationCheck[];
}

export class CoreApplicationValidator implements ApplicationValidator {
  name = "CoreApplicationValidator";

  validate(context: ValidationContext): ValidationCheck[] {
    const { application, version } = context;
    const checks: ValidationCheck[] = [];

    // 1. APP_EXISTS
    checks.push({
      code: "APP_EXISTS",
      name: "Présence de l'Application",
      status: application ? "PASS" : "FAIL",
      message: application
        ? `Application "${application.name}" (${application.code}) trouvée.`
        : "L'application spécifiée n'existe pas.",
    });

    // 2. APP_NOT_ARCHIVED
    const isArchived = application.status === "ARCHIVED" || !!application.archivedAt;
    checks.push({
      code: "APP_NOT_ARCHIVED",
      name: "Statut Actif / Non Archivé",
      status: isArchived ? "FAIL" : "PASS",
      message: isArchived
        ? "L'application est archivée. Les modifications et publications sont bloquées."
        : "L'application n'est pas archivée.",
    });

    // 3. VERSION_EXISTS
    checks.push({
      code: "VERSION_EXISTS",
      name: "Intégrité de la Version",
      status: version ? "PASS" : "FAIL",
      message: version
        ? `Version cible "${version.versionNumber}" chargée avec succès.`
        : "La version demandée n'existe pas.",
    });

    // 4. VERSION_NUMBER_VALID
    const isSemver = version ? isValidSemver(version.versionNumber) : false;
    checks.push({
      code: "VERSION_NUMBER_VALID",
      name: "Conformité SemVer (X.Y.Z)",
      status: isSemver ? "PASS" : "FAIL",
      message: isSemver
        ? `Le format de version "${version?.versionNumber}" respecte la convention SemVer (ex: 1.0.0).`
        : `Le numéro "${version?.versionNumber}" n'est pas un format SemVer valide (ex: 1.0.0).`,
    });

    // 5. APP_METADATA_VALID
    const hasValidName = application.name && application.name.trim().length >= 2;
    const hasValidCode = isValidApplicationCode(application.code);
    const metaValid = hasValidName && hasValidCode;
    checks.push({
      code: "APP_METADATA_VALID",
      name: "Métadonnées de l'Application",
      status: metaValid ? "PASS" : "FAIL",
      message: metaValid
        ? "Nom et code technique normalisés valides."
        : "Le nom doit comporter au moins 2 caractères et le code doit respecter le format kebab-case.",
      details: {
        nameValid: hasValidName,
        codeValid: hasValidCode,
      },
    });

    // 6. NO_CRITICAL_ERROR
    const inError = application.status === "ERROR";
    checks.push({
      code: "NO_CRITICAL_ERROR",
      name: "Absence d'erreur bloquante",
      status: inError ? "FAIL" : "PASS",
      message: inError
        ? "L'application est en état ERROR. Une résolution manuelle est requise avant publication."
        : "Aucune anomalie critique détectée sur l'application.",
    });

    // 7. STATUS_PUBLISHABLE
    const publishableStatuses = ["DRAFT", "READY", "TESTING"];
    const isPublishable = publishableStatuses.includes(version?.status || "");
    const isAlreadyPublished = version?.status === "PUBLISHED";
    checks.push({
      code: "STATUS_PUBLISHABLE",
      name: "Éligibilité à la Publication",
      status: isPublishable ? "PASS" : isAlreadyPublished ? "WARNING" : "FAIL",
      message: isPublishable
        ? `La version est en statut "${version?.status}", prête pour validation et publication.`
        : isAlreadyPublished
        ? "Cette version est déjà actuellement publiée sur cet environnement."
        : `La version est en statut "${version?.status}", non éligible à la publication.`,
    });

    // 8. PACK_STRUCTURE_VALID
    const snapshot = (version?.snapshot as Record<string, any>) || {};
    const hasSnapshot = typeof snapshot === "object" && snapshot !== null;
    checks.push({
      code: "PACK_STRUCTURE_VALID",
      name: "Structure du Pack Applicatif",
      status: hasSnapshot ? "PASS" : "WARNING",
      message: hasSnapshot
        ? "Le snapshot de configuration du Pack est correctement formaté."
        : "Le snapshot de configuration est vide ou incomplet.",
    });

    return checks;
  }
}

export class ValidationService {
  private static validators: ApplicationValidator[] = [new CoreApplicationValidator()];

  public static registerValidator(validator: ApplicationValidator) {
    this.validators.push(validator);
  }

  public static async validateApplicationVersion(
    applicationId: string,
    versionId: string
  ): Promise<ValidationResult> {
    const [app] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, applicationId));

    if (!app) {
      return {
        status: "FAIL",
        canPublish: false,
        validatedAt: new Date().toISOString(),
        checks: [
          {
            code: "APP_EXISTS",
            name: "Présence de l'Application",
            status: "FAIL",
            message: "L'application spécifiée n'existe pas.",
          },
        ],
        summary: { passed: 0, warnings: 0, failed: 1, total: 1 },
      };
    }

    const [ver] = await db
      .select()
      .from(applicationVersions)
      .where(eq(applicationVersions.id, versionId));

    if (!ver) {
      return {
        status: "FAIL",
        canPublish: false,
        validatedAt: new Date().toISOString(),
        checks: [
          {
            code: "VERSION_EXISTS",
            name: "Intégrité de la Version",
            status: "FAIL",
            message: "La version demandée n'existe pas.",
          },
        ],
        summary: { passed: 0, warnings: 0, failed: 1, total: 1 },
      };
    }

    const context: ValidationContext = {
      application: app,
      version: ver,
    };

    const allChecks: ValidationCheck[] = [];
    for (const validator of this.validators) {
      const result = validator.validate(context);
      if (Array.isArray(result)) {
        allChecks.push(...result);
      } else {
        allChecks.push(result);
      }
    }

    let passed = 0;
    let warnings = 0;
    let failed = 0;

    for (const check of allChecks) {
      if (check.status === "PASS") passed++;
      else if (check.status === "WARNING") warnings++;
      else if (check.status === "FAIL") failed++;
    }

    let overallStatus: ValidationStatus = "PASS";
    if (failed > 0) {
      overallStatus = "FAIL";
    } else if (warnings > 0) {
      overallStatus = "WARNING";
    }

    const canPublish = failed === 0;

    // Update version validatedAt timestamp
    await db
      .update(applicationVersions)
      .set({ validatedAt: new Date() })
      .where(eq(applicationVersions.id, versionId));

    return {
      status: overallStatus,
      canPublish,
      validatedAt: new Date().toISOString(),
      checks: allChecks,
      summary: {
        passed,
        warnings,
        failed,
        total: allChecks.length,
      },
    };
  }
}
