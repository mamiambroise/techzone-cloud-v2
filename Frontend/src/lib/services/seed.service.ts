import { db } from "@/db";
import { applications, applicationVersions, publications, activityEvents } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { generateTraceId } from "../utils/trace";

export class SeedService {
  static async seedIfEmpty(): Promise<{ seeded: boolean; count: number }> {
    const [existingCountRes] = await db.select({ value: count() }).from(applications);
    if (existingCountRes && existingCountRes.value > 0) {
      return { seeded: false, count: existingCountRes.value };
    }

    const now = new Date();
    const traceId = generateTraceId();

    // 1. Boutique
    const [boutique] = await db
      .insert(applications)
      .values({
        name: "Boutique",
        code: "boutique",
        description: "Application e-commerce et gestion de boutique physique & en ligne.",
        category: "Commerce",
        icon: "ShoppingBag",
        status: "ACTIVE",
        environment: "PRODUCTION",
        createdBy: "usr_admin_01",
        createdAt: new Date(Date.now() - 86400000 * 7),
        updatedAt: now,
        version: 4,
      })
      .returning();

    const [boutiqueV1] = await db
      .insert(applicationVersions)
      .values({
        applicationId: boutique.id,
        versionNumber: "1.0.0",
        status: "SUPERSEDED",
        snapshot: {
          appName: "Boutique",
          appCode: "boutique",
          category: "Commerce",
          icon: "ShoppingBag",
          dataModels: [
            { name: "Product", fields: ["name", "price", "stock", "sku"] },
            { name: "Order", fields: ["orderNumber", "customer", "total", "status"] },
          ],
          features: ["Catalog", "Cart", "Checkout"],
          menus: [
            { id: "menu_home", label: "Accueil", path: "/" },
            { id: "menu_catalog", label: "Catalogue Produits", path: "/products" },
            { id: "menu_orders", label: "Commandes", path: "/orders" },
          ],
        },
        comment: "Version initiale de lancement",
        createdBy: "usr_admin_01",
        createdAt: new Date(Date.now() - 86400000 * 6),
        validatedAt: new Date(Date.now() - 86400000 * 5),
        publishedAt: new Date(Date.now() - 86400000 * 5),
        version: 2,
      })
      .returning();

    const [boutiqueV11] = await db
      .insert(applicationVersions)
      .values({
        applicationId: boutique.id,
        versionNumber: "1.1.0",
        status: "PUBLISHED",
        snapshot: {
          appName: "Boutique",
          appCode: "boutique",
          category: "Commerce",
          icon: "ShoppingBag",
          dataModels: [
            { name: "Product", fields: ["name", "price", "stock", "sku", "category", "tags"] },
            { name: "Order", fields: ["orderNumber", "customer", "total", "status", "paymentMethod"] },
            { name: "Customer", fields: ["fullName", "email", "phone", "tier"] },
            { name: "PromoCode", fields: ["code", "discountPercent", "expiresAt"] },
          ],
          features: ["Catalog", "Cart", "Checkout", "LoyaltyPoints", "Coupons"],
          menus: [
            { id: "menu_home", label: "Accueil", path: "/" },
            { id: "menu_catalog", label: "Catalogue", path: "/products" },
            { id: "menu_orders", label: "Commandes", path: "/orders" },
            { id: "menu_customers", label: "Clients", path: "/customers" },
            { id: "menu_promos", label: "Promotions", path: "/promos" },
          ],
        },
        comment: "Ajout fidélité client et codes promo",
        createdBy: "usr_admin_01",
        createdAt: new Date(Date.now() - 86400000 * 3),
        validatedAt: new Date(Date.now() - 86400000 * 2),
        publishedAt: new Date(Date.now() - 86400000 * 2),
        version: 2,
      })
      .returning();

    const boutiqueSnapshot = (boutiqueV11.snapshot as Record<string, any>) || {};
    const [boutiqueV12Draft] = await db
      .insert(applicationVersions)
      .values({
        applicationId: boutique.id,
        versionNumber: "1.2.0",
        status: "DRAFT",
        snapshot: {
          ...boutiqueSnapshot,
          features: [...(boutiqueSnapshot.features || []), "MultiCurrency", "AIRecommendations"],
        },
        comment: "Préparation support multi-devises et recommandations",
        createdBy: "usr_admin_01",
        createdAt: new Date(Date.now() - 3600000 * 4),
        version: 1,
      })
      .returning();

    // Publications for boutique
    await db.insert(publications).values([
      {
        applicationId: boutique.id,
        versionId: boutiqueV1.id,
        environment: "PRODUCTION",
        type: "PUBLISH",
        status: "SUCCESS",
        publishedBy: "usr_admin_01",
        publishedAt: new Date(Date.now() - 86400000 * 5),
        result: { version: "1.0.0", action: "INITIAL_RELEASE" },
      },
      {
        applicationId: boutique.id,
        versionId: boutiqueV11.id,
        environment: "PRODUCTION",
        type: "PUBLISH",
        status: "SUCCESS",
        previousVersionId: boutiqueV1.id,
        publishedBy: "usr_admin_01",
        publishedAt: new Date(Date.now() - 86400000 * 2),
        result: { version: "1.1.0", action: "FEATURE_RELEASE" },
      },
    ]);

    await db
      .update(applications)
      .set({
        publishedVersionId: boutiqueV11.id,
        currentVersionId: boutiqueV12Draft.id,
      })
      .where(eq(applications.id, boutique.id));

    // Audit logs for boutique
    await db.insert(activityEvents).values([
      {
        applicationId: boutique.id,
        actorId: "usr_admin_01",
        eventType: "business.application.created",
        action: "CREATE",
        targetType: "APPLICATION",
        targetId: boutique.id,
        result: "SUCCESS",
        traceId,
        createdAt: new Date(Date.now() - 86400000 * 7),
      },
      {
        applicationId: boutique.id,
        actorId: "usr_admin_01",
        eventType: "business.application.published",
        action: "PUBLISH",
        targetType: "PUBLICATION",
        targetId: boutiqueV1.id,
        result: "SUCCESS",
        metadata: { versionNumber: "1.0.0" },
        traceId,
        createdAt: new Date(Date.now() - 86400000 * 5),
      },
      {
        applicationId: boutique.id,
        actorId: "usr_admin_01",
        eventType: "business.application.version.created",
        action: "VERSION_CREATE",
        targetType: "APPLICATION_VERSION",
        targetId: boutiqueV11.id,
        result: "SUCCESS",
        metadata: { versionNumber: "1.1.0" },
        traceId,
        createdAt: new Date(Date.now() - 86400000 * 3),
      },
      {
        applicationId: boutique.id,
        actorId: "usr_admin_01",
        eventType: "business.application.published",
        action: "PUBLISH",
        targetType: "PUBLICATION",
        targetId: boutiqueV11.id,
        result: "SUCCESS",
        metadata: { versionNumber: "1.1.0", previousVersion: "1.0.0" },
        traceId,
        createdAt: new Date(Date.now() - 86400000 * 2),
      },
    ]);

    // 2. Restaurant Le Gourmet
    const [resto] = await db
      .insert(applications)
      .values({
        name: "Restaurant Le Gourmet",
        code: "restaurant-le-gourmet",
        description: "Gestion des tables, carte des menus du jour et commandes en salle.",
        category: "Restauration",
        icon: "UtensilsCrossed",
        status: "READY",
        environment: "STAGING",
        createdBy: "usr_builder_02",
        createdAt: new Date(Date.now() - 86400000 * 4),
        updatedAt: new Date(Date.now() - 3600000 * 8),
        version: 2,
      })
      .returning();

    const [restoV1] = await db
      .insert(applicationVersions)
      .values({
        applicationId: resto.id,
        versionNumber: "0.9.0",
        status: "READY",
        snapshot: {
          appName: "Restaurant Le Gourmet",
          appCode: "restaurant-le-gourmet",
          category: "Restauration",
          dataModels: [
            { name: "Dish", fields: ["title", "price", "allergens", "course"] },
            { name: "Table", fields: ["tableNumber", "capacity", "status"] },
          ],
          features: ["MenuManager", "TablePlan"],
        },
        comment: "Version pré-production pour tests cuisine",
        createdBy: "usr_builder_02",
        createdAt: new Date(Date.now() - 86400000 * 3),
        validatedAt: new Date(Date.now() - 3600000 * 10),
        version: 1,
      })
      .returning();

    await db
      .update(applications)
      .set({ currentVersionId: restoV1.id })
      .where(eq(applications.id, resto.id));

    // 3. Garage Automobile
    const [garage] = await db
      .insert(applications)
      .values({
        name: "Garage Automobile 2026",
        code: "garage-automobile-2026",
        description: "Suivi des ordres de réparation, véhicules clients et pièces détachées.",
        category: "Automobile",
        icon: "Wrench",
        status: "CONFIGURING",
        environment: "DEVELOPMENT",
        createdBy: "usr_admin_01",
        createdAt: new Date(Date.now() - 86400000 * 2),
        updatedAt: new Date(Date.now() - 3600000 * 2),
        version: 1,
      })
      .returning();

    const [garageV1] = await db
      .insert(applicationVersions)
      .values({
        applicationId: garage.id,
        versionNumber: "0.5.0",
        status: "DRAFT",
        snapshot: {
          appName: "Garage Automobile 2026",
          category: "Automobile",
          dataModels: [
            { name: "Vehicle", fields: ["licensePlate", "make", "model", "mileage"] },
            { name: "RepairOrder", fields: ["orderNumber", "status", "laborHours"] },
          ],
        },
        comment: "Configuration initiale du garage",
        createdBy: "usr_admin_01",
        createdAt: new Date(Date.now() - 86400000 * 2),
        version: 1,
      })
      .returning();

    await db
      .update(applications)
      .set({ currentVersionId: garageV1.id })
      .where(eq(applications.id, garage.id));

    // 4. École Digitale
    const [ecole] = await db
      .insert(applications)
      .values({
        name: "École Digitale",
        code: "ecole-digitale",
        description: "Gestion des inscriptions, cours, professeurs et présences étudiants.",
        category: "Éducation",
        icon: "GraduationCap",
        status: "DRAFT",
        environment: "DEVELOPMENT",
        createdBy: "usr_builder_02",
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(Date.now() - 86400000),
        version: 1,
      })
      .returning();

    const [ecoleV1] = await db
      .insert(applicationVersions)
      .values({
        applicationId: ecole.id,
        versionNumber: "0.1.0",
        status: "DRAFT",
        snapshot: {
          appName: "École Digitale",
          category: "Éducation",
          dataModels: [{ name: "Student", fields: ["firstName", "lastName", "grade"] }],
        },
        comment: "Brouillon initial",
        createdBy: "usr_builder_02",
        createdAt: new Date(Date.now() - 86400000),
        version: 1,
      })
      .returning();

    await db
      .update(applications)
      .set({ currentVersionId: ecoleV1.id })
      .where(eq(applications.id, ecole.id));

    return { seeded: true, count: 4 };
  }
}
