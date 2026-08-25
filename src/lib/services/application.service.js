import { db } from "@/db";
import { applications, applicationVersions, publications } from "@/db/schema";
import { eq, and, or, ilike, desc, asc, sql } from "drizzle-orm";
import { ERROR_CODES } from "../types/domain";
import { AuditService } from "./audit.service";
import { isValidApplicationCode, slugifyCode } from "../utils/slug";
import { generateTraceId } from "../utils/trace";
export class ApplicationService {
  static async createApplication(input, actor, traceId = generateTraceId()) {
    const name = input.name?.trim();
    if (!name || name.length < 2) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.INVALID_REQUEST,
          message: "Le nom de l'application est obligatoire et doit comporter au moins 2 caractères."
        }
      };
    }
    let code = (input.code || slugifyCode(name)).trim();
    if (!isValidApplicationCode(code)) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.APPLICATION_INVALID_CODE,
          message: `Le code technique "${code}" est invalide. Format attendu: kebab-case (ex: ma-boutique, garage-2026).`
        }
      };
    }

    // Check duplicate code
    const [existing] = await db.select().from(applications).where(eq(applications.code, code));
    if (existing) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.APPLICATION_CODE_ALREADY_EXISTS,
          message: `Une application avec le code "${code}" existe déjà.`
        }
      };
    }
    const now = new Date();
    const env = input.environment || "DEVELOPMENT";
    const category = input.category || "Autre";
    const icon = input.icon || "Package";

    // 1. Create initial application record
    const [app] = await db.insert(applications).values({
      name,
      code,
      description: input.description || null,
      category,
      icon,
      status: "DRAFT",
      environment: env,
      createdBy: actor.id,
      createdAt: now,
      updatedAt: now,
      version: 1
    }).returning();

    // 2. Prepare initial snapshot (customized based on template)
    let initialSnapshot = {
      appName: name,
      appCode: code,
      category,
      icon,
      environment: env,
      dataModels: [],
      features: [],
      menus: [{
        id: "menu_home",
        label: "Accueil",
        path: "/"
      }, {
        id: "menu_dashboard",
        label: "Tableau de bord",
        path: "/dashboard"
      }],
      pages: [],
      forms: [],
      dashboards: [],
      rules: [],
      workflows: [],
      automations: []
    };
    if (input.templateKey === "ecommerce") {
      initialSnapshot.dataModels = [{
        name: "Product",
        fields: ["name", "price", "stock", "sku"]
      }, {
        name: "Order",
        fields: ["orderNumber", "customer", "total", "status"]
      }, {
        name: "Customer",
        fields: ["fullName", "email", "phone"]
      }];
      initialSnapshot.features = ["Catalog", "Cart", "Checkout", "OrderTracking"];
    } else if (input.templateKey === "restaurant") {
      initialSnapshot.dataModels = [{
        name: "Dish",
        fields: ["name", "category", "price", "allergens"]
      }, {
        name: "TableReservation",
        fields: ["guestName", "partySize", "time", "status"]
      }, {
        name: "MenuCategory",
        fields: ["title", "order"]
      }];
      initialSnapshot.features = ["DigitalMenu", "TableBooking", "KitchenOrderTicket"];
    } else if (input.templateKey === "garage") {
      initialSnapshot.dataModels = [{
        name: "Vehicle",
        fields: ["licensePlate", "make", "model", "owner"]
      }, {
        name: "WorkOrder",
        fields: ["reference", "status", "mechanic", "totalCost"]
      }, {
        name: "SparePart",
        fields: ["partNumber", "name", "stock"]
      }];
      initialSnapshot.features = ["AppointmentBooking", "DiagnosticSheet", "Invoicing"];
    }

    // 3. Create initial 1.0.0 version
    const [initialVersion] = await db.insert(applicationVersions).values({
      applicationId: app.id,
      versionNumber: "1.0.0",
      status: "DRAFT",
      snapshot: initialSnapshot,
      comment: "Version initiale créée automatiquement",
      createdBy: actor.id,
      createdAt: now,
      version: 1
    }).returning();

    // 4. Update application with currentVersionId
    const [updatedApp] = await db.update(applications).set({
      currentVersionId: initialVersion.id,
      updatedAt: now
    }).where(eq(applications.id, app.id)).returning();

    // 5. Log audit event
    await AuditService.log({
      applicationId: updatedApp.id,
      actorId: actor.id,
      eventType: "business.application.created",
      action: "CREATE",
      targetType: "APPLICATION",
      targetId: updatedApp.id,
      result: "SUCCESS",
      after: {
        id: updatedApp.id,
        code: updatedApp.code,
        name: updatedApp.name,
        status: updatedApp.status,
        initialVersion: initialVersion.versionNumber
      },
      metadata: {
        templateKey: input.templateKey || "empty",
        environment: env
      },
      traceId
    });
    return {
      success: true,
      data: {
        id: updatedApp.id,
        code: updatedApp.code,
        name: updatedApp.name,
        description: updatedApp.description,
        category: updatedApp.category,
        icon: updatedApp.icon,
        status: updatedApp.status,
        environment: updatedApp.environment,
        currentVersionId: updatedApp.currentVersionId,
        publishedVersionId: null,
        createdBy: updatedApp.createdBy,
        createdAt: updatedApp.createdAt.toISOString(),
        updatedAt: updatedApp.updatedAt.toISOString(),
        archivedAt: null,
        version: updatedApp.version,
        currentVersionNumber: initialVersion.versionNumber
      }
    };
  }
  static async getApplication(id) {
    const [app] = await db.select().from(applications).where(eq(applications.id, id));
    if (!app) return null;
    let currentVersionNumber = null;
    let publishedVersionNumber = null;
    if (app.currentVersionId) {
      const [cur] = await db.select({
        versionNumber: applicationVersions.versionNumber
      }).from(applicationVersions).where(eq(applicationVersions.id, app.currentVersionId));
      currentVersionNumber = cur?.versionNumber || null;
    }
    if (app.publishedVersionId) {
      const [pub] = await db.select({
        versionNumber: applicationVersions.versionNumber
      }).from(applicationVersions).where(eq(applicationVersions.id, app.publishedVersionId));
      publishedVersionNumber = pub?.versionNumber || null;
    }
    const [versionsCountRes] = await db.select({
      count: sql`count(*)::int`
    }).from(applicationVersions).where(eq(applicationVersions.applicationId, app.id));
    return {
      id: app.id,
      code: app.code,
      name: app.name,
      description: app.description,
      category: app.category,
      icon: app.icon,
      status: app.status,
      environment: app.environment,
      currentVersionId: app.currentVersionId,
      publishedVersionId: app.publishedVersionId,
      createdBy: app.createdBy,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
      archivedAt: app.archivedAt ? app.archivedAt.toISOString() : null,
      version: app.version,
      currentVersionNumber,
      publishedVersionNumber,
      versionsCount: versionsCountRes?.count || 0
    };
  }
  static async listApplications(options = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;
    const conditions = [];
    if (!options.includeArchived) {
      // By default unless explicitly requested, show all or filter
      if (options.status) {
        conditions.push(eq(applications.status, options.status));
      } else {
        // Exclude archived by default in active list unless filtering by ARCHIVED
        // But let's allow seeing archived if requested
      }
    } else if (options.status) {
      conditions.push(eq(applications.status, options.status));
    }
    if (options.category && options.category !== "ALL") {
      conditions.push(eq(applications.category, options.category));
    }
    if (options.environment && options.environment !== "ALL") {
      conditions.push(eq(applications.environment, options.environment));
    }
    if (options.search && options.search.trim()) {
      const s = `%${options.search.trim()}%`;
      conditions.push(or(ilike(applications.name, s), ilike(applications.code, s), ilike(applications.description, s), ilike(applications.category, s)));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Total count
    const [countResult] = await db.select({
      count: sql`count(*)::int`
    }).from(applications).where(whereClause);
    const total = countResult?.count || 0;
    const pages = Math.ceil(total / limit) || 1;

    // Sort column
    let orderClause = desc(applications.updatedAt);
    const isAsc = options.order === "asc";
    if (options.sort === "name") {
      orderClause = isAsc ? asc(applications.name) : desc(applications.name);
    } else if (options.sort === "code") {
      orderClause = isAsc ? asc(applications.code) : desc(applications.code);
    } else if (options.sort === "status") {
      orderClause = isAsc ? asc(applications.status) : desc(applications.status);
    } else if (options.sort === "created_at") {
      orderClause = isAsc ? asc(applications.createdAt) : desc(applications.createdAt);
    } else if (options.sort === "updated_at") {
      orderClause = isAsc ? asc(applications.updatedAt) : desc(applications.updatedAt);
    }
    const rows = await db.select({
      app: applications,
      curVerNumber: sql`(SELECT version_number FROM application_versions WHERE application_versions.id = applications.current_version_id)`,
      pubVerNumber: sql`(SELECT version_number FROM application_versions WHERE application_versions.id = applications.published_version_id)`,
      verCount: sql`(SELECT count(*)::int FROM application_versions WHERE application_versions.application_id = applications.id)`
    }).from(applications).where(whereClause).orderBy(orderClause).limit(limit).offset(offset);
    const items = rows.map(r => ({
      id: r.app.id,
      code: r.app.code,
      name: r.app.name,
      description: r.app.description,
      category: r.app.category,
      icon: r.app.icon,
      status: r.app.status,
      environment: r.app.environment,
      currentVersionId: r.app.currentVersionId,
      publishedVersionId: r.app.publishedVersionId,
      createdBy: r.app.createdBy,
      createdAt: r.app.createdAt.toISOString(),
      updatedAt: r.app.updatedAt.toISOString(),
      archivedAt: r.app.archivedAt ? r.app.archivedAt.toISOString() : null,
      version: r.app.version,
      currentVersionNumber: r.curVerNumber,
      publishedVersionNumber: r.pubVerNumber,
      versionsCount: r.verCount
    }));
    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    };
  }
  static async updateApplication(id, input, actor, traceId = generateTraceId()) {
    const [app] = await db.select().from(applications).where(eq(applications.id, id));
    if (!app) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.APPLICATION_NOT_FOUND,
          message: `Application avec l'ID "${id}" introuvable.`
        }
      };
    }
    const updates = {
      updatedAt: new Date(),
      version: app.version + 1
    };
    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name || name.length < 2) {
        return {
          success: false,
          error: {
            code: ERROR_CODES.INVALID_REQUEST,
            message: "Le nom de l'application doit comporter au moins 2 caractères."
          }
        };
      }
      updates.name = name;
    }
    if (input.description !== undefined) updates.description = input.description;
    if (input.category !== undefined) updates.category = input.category;
    if (input.icon !== undefined) updates.icon = input.icon;
    if (input.environment !== undefined) updates.environment = input.environment;

    // Atomic compare-and-swap write: the WHERE clause conditions the update on the
    // expected version so concurrent writers racing on the same stale read cannot
    // silently overwrite each other. Only one concurrent request can ever match.
    const expectedVersion = input.expectedVersion !== undefined ? input.expectedVersion : app.version;
    const [updated] = await db.update(applications).set(updates).where(and(eq(applications.id, id), eq(applications.version, expectedVersion))).returning();
    if (!updated) {
      // No row matched: either the application no longer exists, or another
      // writer already advanced the version between our read and this write.
      const [current] = await db.select().from(applications).where(eq(applications.id, id));
      if (!current) {
        return {
          success: false,
          error: {
            code: ERROR_CODES.APPLICATION_NOT_FOUND,
            message: `Application avec l'ID "${id}" introuvable.`
          }
        };
      }
      return {
        success: false,
        error: {
          code: ERROR_CODES.VERSION_CONFLICT,
          message: `Conflit de version optimiste (version actuelle: ${current.version}, attendue: ${expectedVersion}). Les données ont été modifiées par une autre session.`
        }
      };
    }
    await AuditService.log({
      applicationId: updated.id,
      actorId: actor.id,
      eventType: "business.application.updated",
      action: "UPDATE",
      targetType: "APPLICATION",
      targetId: updated.id,
      result: "SUCCESS",
      before: {
        name: app.name,
        description: app.description,
        category: app.category,
        icon: app.icon,
        environment: app.environment,
        version: app.version
      },
      after: {
        name: updated.name,
        description: updated.description,
        category: updated.category,
        icon: updated.icon,
        environment: updated.environment,
        version: updated.version
      },
      metadata: {
        actorRole: actor.role
      },
      traceId
    });
    const fullApp = await this.getApplication(updated.id);
    return {
      success: true,
      data: fullApp
    };
  }
  static async archiveApplication(id, actor, traceId = generateTraceId()) {
    const [app] = await db.select().from(applications).where(eq(applications.id, id));
    if (!app) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.APPLICATION_NOT_FOUND,
          message: `Application avec l'ID "${id}" introuvable.`
        }
      };
    }
    const now = new Date();
    const [updated] = await db.update(applications).set({
      status: "ARCHIVED",
      archivedAt: now,
      updatedAt: now,
      version: app.version + 1
    }).where(eq(applications.id, id)).returning();
    await AuditService.log({
      applicationId: updated.id,
      actorId: actor.id,
      eventType: "business.application.archived",
      action: "ARCHIVE",
      targetType: "APPLICATION",
      targetId: updated.id,
      result: "SUCCESS",
      before: {
        status: app.status
      },
      after: {
        status: "ARCHIVED",
        archivedAt: now.toISOString()
      },
      traceId
    });
    const fullApp = await this.getApplication(updated.id);
    return {
      success: true,
      data: fullApp
    };
  }
  static async getDashboardStats() {
    const allApps = await db.select().from(applications);
    const allPubs = await db.select().from(publications).where(eq(publications.status, "SUCCESS"));
    let active = 0;
    let testing = 0;
    let draft = 0;
    let suspended = 0;
    let configuring = 0;
    let archived = 0;
    const statusCounts = {};
    const categoryCounts = {};
    allApps.forEach(a => {
      const st = a.status || "DRAFT";
      statusCounts[st] = (statusCounts[st] || 0) + 1;
      const cat = a.category || "Autre";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      if (st === "ACTIVE") active++;else if (st === "TESTING") testing++;else if (st === "DRAFT") draft++;else if (st === "SUSPENDED") suspended++;else if (st === "CONFIGURING") configuring++;else if (st === "ARCHIVED") archived++;
    });
    const recentList = await this.listApplications({
      limit: 5,
      sort: "updated_at",
      order: "desc"
    });
    return {
      totalApplications: allApps.length,
      activeApplications: active,
      testingApplications: testing,
      draftApplications: draft,
      suspendedApplications: suspended,
      configuringApplications: configuring,
      archivedApplications: archived,
      totalPublishedVersions: allPubs.length,
      recentApplications: recentList.items,
      statusCounts,
      categoryCounts
    };
  }
}