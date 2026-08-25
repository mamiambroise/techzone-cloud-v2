import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Applications table
export const applications = pgTable(
  "applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 120 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }).default("Autre"),
    icon: varchar("icon", { length: 60 }).default("Package"),
    status: varchar("status", { length: 40 }).notNull().default("DRAFT"), // DRAFT, CONFIGURING, READY, TESTING, ACTIVE, SUSPENDED, ARCHIVED, ERROR
    environment: varchar("environment", { length: 40 }).notNull().default("DEVELOPMENT"), // DEVELOPMENT, TEST, STAGING, PRODUCTION
    currentVersionId: uuid("current_version_id"),
    publishedVersionId: uuid("published_version_id"),
    createdBy: varchar("created_by", { length: 120 }).notNull().default("usr_admin_default"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    version: integer("version").notNull().default(1), // Optimistic concurrency version
  },
  (table) => [
    uniqueIndex("applications_code_unique_idx").on(table.code),
    index("applications_status_idx").on(table.status),
    index("applications_category_idx").on(table.category),
    index("applications_environment_idx").on(table.environment),
    index("applications_created_at_idx").on(table.createdAt),
    index("applications_updated_at_idx").on(table.updatedAt),
  ]
);

// 2. Application Versions table
export const applicationVersions = pgTable(
  "application_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
    versionNumber: varchar("version_number", { length: 50 }).notNull(), // e.g. "1.0.0"
    status: varchar("status", { length: 40 }).notNull().default("DRAFT"), // DRAFT, READY, TESTING, PUBLISHED, SUPERSEDED, INVALID, ARCHIVED
    snapshot: jsonb("snapshot").notNull().default({}), // Configuration snapshot (pack content)
    comment: text("comment"),
    createdBy: varchar("created_by", { length: 120 }).notNull().default("usr_admin_default"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    validatedAt: timestamp("validated_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    version: integer("version").notNull().default(1), // Optimistic concurrency version
  },
  (table) => [
    index("application_versions_app_id_idx").on(table.applicationId),
    index("application_versions_status_idx").on(table.status),
    index("application_versions_created_at_idx").on(table.createdAt),
  ]
);

// 3. Publications table
export const publications = pgTable(
  "publications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
    versionId: uuid("version_id").notNull().references(() => applicationVersions.id, { onDelete: "cascade" }),
    environment: varchar("environment", { length: 40 }).notNull().default("DEVELOPMENT"),
    type: varchar("type", { length: 40 }).notNull().default("PUBLISH"), // PUBLISH, ROLLBACK
    status: varchar("status", { length: 40 }).notNull().default("SUCCESS"), // PENDING, SUCCESS, FAILED
    previousVersionId: uuid("previous_version_id"),
    publishedBy: varchar("published_by", { length: 120 }).notNull().default("usr_admin_default"),
    publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow().notNull(),
    result: jsonb("result").default({}),
  },
  (table) => [
    index("publications_app_id_idx").on(table.applicationId),
    index("publications_version_id_idx").on(table.versionId),
    index("publications_published_at_idx").on(table.publishedAt),
  ]
);

// 4. Activity Events (Audit) table
export const activityEvents = pgTable(
  "activity_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id"),
    actorId: varchar("actor_id", { length: 120 }).notNull().default("usr_admin_default"),
    eventType: varchar("event_type", { length: 100 }).notNull(), // e.g. business.application.created
    action: varchar("action", { length: 50 }).notNull(), // CREATE, UPDATE, TRANSITION, CLONE, etc.
    targetType: varchar("target_type", { length: 50 }).notNull().default("APPLICATION"),
    targetId: varchar("target_id", { length: 120 }).notNull(),
    result: varchar("result", { length: 30 }).notNull().default("SUCCESS"), // SUCCESS, FAILED, WARNING
    before: jsonb("before"),
    after: jsonb("after"),
    metadata: jsonb("metadata").default({}),
    traceId: varchar("trace_id", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("activity_events_app_id_idx").on(table.applicationId),
    index("activity_events_event_type_idx").on(table.eventType),
    index("activity_events_created_at_idx").on(table.createdAt),
    index("activity_events_trace_id_idx").on(table.traceId),
  ]
);

// Relations
export const applicationsRelations = relations(applications, ({ many }) => ({
  versions: many(applicationVersions),
  publications: many(publications),
  activities: many(activityEvents),
}));

export const applicationVersionsRelations = relations(applicationVersions, ({ one, many }) => ({
  application: one(applications, {
    fields: [applicationVersions.applicationId],
    references: [applications.id],
  }),
  publications: many(publications),
}));

export const publicationsRelations = relations(publications, ({ one }) => ({
  application: one(applications, {
    fields: [publications.applicationId],
    references: [applications.id],
  }),
  version: one(applicationVersions, {
    fields: [publications.versionId],
    references: [applicationVersions.id],
  }),
}));

export const activityEventsRelations = relations(activityEvents, ({ one }) => ({
  application: one(applications, {
    fields: [activityEvents.applicationId],
    references: [applications.id],
  }),
}));

// ============================================================
// P0.2 — DATA MODEL MANAGER metadata tables
// ============================================================

export const dataEntities = pgTable(
  "data_entities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
    applicationVersionId: uuid("application_version_id").notNull().references(() => applicationVersions.id, { onDelete: "cascade" }),
    lineageId: uuid("lineage_id").notNull(),
    code: varchar("code", { length: 120 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    pluralName: varchar("plural_name", { length: 255 }),
    description: text("description"),
    icon: varchar("icon", { length: 60 }).default("Database"),
    status: varchar("status", { length: 30 }).notNull().default("ACTIVE"),
    scope: varchar("scope", { length: 30 }).notNull().default("ORGANIZATION"),
    classification: varchar("classification", { length: 30 }).notNull().default("INTERNAL"),
    position: integer("position").notNull().default(0),
    version: integer("version").notNull().default(1),
    createdBy: varchar("created_by", { length: 120 }).notNull().default("usr_admin_01"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("data_entities_version_code_idx").on(t.applicationVersionId, t.code),
    index("data_entities_version_idx").on(t.applicationVersionId),
  ]
);

export const dataFields = pgTable(
  "data_fields",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    entityId: uuid("entity_id").notNull().references(() => dataEntities.id, { onDelete: "cascade" }),
    lineageId: uuid("lineage_id").notNull(),
    code: varchar("code", { length: 120 }).notNull(),
    label: varchar("label", { length: 255 }).notNull(),
    description: text("description"),
    dataType: varchar("data_type", { length: 40 }).notNull(),
    required: boolean("required").notNull().default(false),
    uniqueFlag: boolean("unique_flag").notNull().default(false),
    readonly: boolean("readonly").notNull().default(false),
    indexed: boolean("indexed").notNull().default(false),
    defaultValue: jsonb("default_value"),
    position: integer("position").notNull().default(0),
    scope: varchar("scope", { length: 30 }).notNull().default("ORGANIZATION"),
    classification: varchar("classification", { length: 30 }).notNull().default("INTERNAL"),
    configuration: jsonb("configuration").default({}),
    formulaExpression: text("formula_expression"),
    formulaResultType: varchar("formula_result_type", { length: 40 }),
    status: varchar("status", { length: 30 }).notNull().default("ACTIVE"),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("data_fields_entity_code_idx").on(t.entityId, t.code),
    index("data_fields_entity_idx").on(t.entityId),
  ]
);

export const dataRelations = pgTable(
  "data_relations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationVersionId: uuid("application_version_id").notNull().references(() => applicationVersions.id, { onDelete: "cascade" }),
    lineageId: uuid("lineage_id").notNull(),
    sourceEntityId: uuid("source_entity_id").notNull().references(() => dataEntities.id, { onDelete: "cascade" }),
    targetEntityId: uuid("target_entity_id").notNull().references(() => dataEntities.id, { onDelete: "cascade" }),
    relationType: varchar("relation_type", { length: 30 }).notNull(),
    sourceLabel: varchar("source_label", { length: 120 }),
    targetLabel: varchar("target_label", { length: 120 }),
    required: boolean("required").notNull().default(false),
    deleteBehavior: varchar("delete_behavior", { length: 20 }).notNull().default("RESTRICT"),
    status: varchar("status", { length: 30 }).notNull().default("ACTIVE"),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("data_relations_version_idx").on(t.applicationVersionId)]
);

export const dataConstraints = pgTable("data_constraints", {
  id: uuid("id").defaultRandom().primaryKey(),
  entityId: uuid("entity_id").notNull().references(() => dataEntities.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 40 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  fieldIds: jsonb("field_ids").notNull().default([]),
  configuration: jsonb("configuration").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const dataIndexes = pgTable("data_indexes", {
  id: uuid("id").defaultRandom().primaryKey(),
  entityId: uuid("entity_id").notNull().references(() => dataEntities.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  type: varchar("type", { length: 30 }).notNull().default("SIMPLE"),
  fieldIds: jsonb("field_ids").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const dataValidations = pgTable("data_validations", {
  id: uuid("id").defaultRandom().primaryKey(),
  fieldId: uuid("field_id").notNull().references(() => dataFields.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 40 }).notNull(),
  configuration: jsonb("configuration").default({}),
  errorCode: varchar("error_code", { length: 80 }),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Export inferred types
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type ApplicationVersion = typeof applicationVersions.$inferSelect;
export type NewApplicationVersion = typeof applicationVersions.$inferInsert;
export type Publication = typeof publications.$inferSelect;
export type NewPublication = typeof publications.$inferInsert;
export type ActivityEvent = typeof activityEvents.$inferSelect;
export type NewActivityEvent = typeof activityEvents.$inferInsert;
