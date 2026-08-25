import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Applications table
export const applications = pgTable("applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", {
    length: 120
  }).notNull(),
  name: varchar("name", {
    length: 255
  }).notNull(),
  description: text("description"),
  category: varchar("category", {
    length: 100
  }).default("Autre"),
  icon: varchar("icon", {
    length: 60
  }).default("Package"),
  status: varchar("status", {
    length: 40
  }).notNull().default("DRAFT"),
  // DRAFT, CONFIGURING, READY, TESTING, ACTIVE, SUSPENDED, ARCHIVED, ERROR
  environment: varchar("environment", {
    length: 40
  }).notNull().default("DEVELOPMENT"),
  // DEVELOPMENT, TEST, STAGING, PRODUCTION
  currentVersionId: uuid("current_version_id"),
  publishedVersionId: uuid("published_version_id"),
  createdBy: varchar("created_by", {
    length: 120
  }).notNull().default("usr_admin_default"),
  createdAt: timestamp("created_at", {
    withTimezone: true
  }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true
  }).defaultNow().notNull(),
  archivedAt: timestamp("archived_at", {
    withTimezone: true
  }),
  version: integer("version").notNull().default(1) // Optimistic concurrency version
}, table => [uniqueIndex("applications_code_unique_idx").on(table.code), index("applications_status_idx").on(table.status), index("applications_category_idx").on(table.category), index("applications_environment_idx").on(table.environment), index("applications_created_at_idx").on(table.createdAt), index("applications_updated_at_idx").on(table.updatedAt)]);

// 2. Application Versions table
export const applicationVersions = pgTable("application_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id").notNull().references(() => applications.id, {
    onDelete: "cascade"
  }),
  versionNumber: varchar("version_number", {
    length: 50
  }).notNull(),
  // e.g. "1.0.0"
  status: varchar("status", {
    length: 40
  }).notNull().default("DRAFT"),
  // DRAFT, READY, TESTING, PUBLISHED, SUPERSEDED, INVALID, ARCHIVED
  snapshot: jsonb("snapshot").notNull().default({}),
  // Configuration snapshot (pack content)
  comment: text("comment"),
  createdBy: varchar("created_by", {
    length: 120
  }).notNull().default("usr_admin_default"),
  createdAt: timestamp("created_at", {
    withTimezone: true
  }).defaultNow().notNull(),
  validatedAt: timestamp("validated_at", {
    withTimezone: true
  }),
  publishedAt: timestamp("published_at", {
    withTimezone: true
  }),
  version: integer("version").notNull().default(1) // Optimistic concurrency version
}, table => [index("application_versions_app_id_idx").on(table.applicationId), index("application_versions_status_idx").on(table.status), index("application_versions_created_at_idx").on(table.createdAt)]);

// 3. Publications table
export const publications = pgTable("publications", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id").notNull().references(() => applications.id, {
    onDelete: "cascade"
  }),
  versionId: uuid("version_id").notNull().references(() => applicationVersions.id, {
    onDelete: "cascade"
  }),
  environment: varchar("environment", {
    length: 40
  }).notNull().default("DEVELOPMENT"),
  type: varchar("type", {
    length: 40
  }).notNull().default("PUBLISH"),
  // PUBLISH, ROLLBACK
  status: varchar("status", {
    length: 40
  }).notNull().default("SUCCESS"),
  // PENDING, SUCCESS, FAILED
  previousVersionId: uuid("previous_version_id"),
  publishedBy: varchar("published_by", {
    length: 120
  }).notNull().default("usr_admin_default"),
  publishedAt: timestamp("published_at", {
    withTimezone: true
  }).defaultNow().notNull(),
  result: jsonb("result").default({})
}, table => [index("publications_app_id_idx").on(table.applicationId), index("publications_version_id_idx").on(table.versionId), index("publications_published_at_idx").on(table.publishedAt)]);

// 4. Activity Events (Audit) table
export const activityEvents = pgTable("activity_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id"),
  actorId: varchar("actor_id", {
    length: 120
  }).notNull().default("usr_admin_default"),
  eventType: varchar("event_type", {
    length: 100
  }).notNull(),
  // e.g. business.application.created
  action: varchar("action", {
    length: 50
  }).notNull(),
  // CREATE, UPDATE, TRANSITION, CLONE, etc.
  targetType: varchar("target_type", {
    length: 50
  }).notNull().default("APPLICATION"),
  targetId: varchar("target_id", {
    length: 120
  }).notNull(),
  result: varchar("result", {
    length: 30
  }).notNull().default("SUCCESS"),
  // SUCCESS, FAILED, WARNING
  before: jsonb("before"),
  after: jsonb("after"),
  metadata: jsonb("metadata").default({}),
  traceId: varchar("trace_id", {
    length: 100
  }).notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true
  }).defaultNow().notNull()
}, table => [index("activity_events_app_id_idx").on(table.applicationId), index("activity_events_event_type_idx").on(table.eventType), index("activity_events_created_at_idx").on(table.createdAt), index("activity_events_trace_id_idx").on(table.traceId)]);

// Relations
export const applicationsRelations = relations(applications, ({
  many
}) => ({
  versions: many(applicationVersions),
  publications: many(publications),
  activities: many(activityEvents)
}));
export const applicationVersionsRelations = relations(applicationVersions, ({
  one,
  many
}) => ({
  application: one(applications, {
    fields: [applicationVersions.applicationId],
    references: [applications.id]
  }),
  publications: many(publications)
}));
export const publicationsRelations = relations(publications, ({
  one
}) => ({
  application: one(applications, {
    fields: [publications.applicationId],
    references: [applications.id]
  }),
  version: one(applicationVersions, {
    fields: [publications.versionId],
    references: [applicationVersions.id]
  })
}));
export const activityEventsRelations = relations(activityEvents, ({
  one
}) => ({
  application: one(applications, {
    fields: [activityEvents.applicationId],
    references: [applications.id]
  })
}));

// Export inferred types