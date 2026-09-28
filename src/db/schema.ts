import type { ShopperAssessment } from "../seminar/assessment";
import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { ProviderName } from "../providers/types";
import type { PdpSignals } from "../capture/normalize";
import type { BotAccess } from "../capture/robots";
import type { ModelJudgedCheck } from "../evaluation/validate";
import type { Recommendation } from "../recommendations/map";
import type { ModelUsage } from "../providers/types";
import type { Finding } from "../checks/types";

/**
 * App-level key/value metadata. Created by the initial migration to give the
 * database a real table to migrate and to back the connectivity health check.
 * Domain tables (brands, pdps, evaluations, ...) are added by their own features.
 */
export const appMetadata = pgTable("app_metadata", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AppMetadata = typeof appMetadata.$inferSelect;
export type NewAppMetadata = typeof appMetadata.$inferInsert;

export const jobStatuses = [
  "pending",
  "processing",
  "completed",
  "failed",
] as const;

export type JobStatus = (typeof jobStatuses)[number];

/**
 * DB-backed job queue. A worker claims due pending jobs, runs the registered
 * handler, and records completed/failed status with the result or last error.
 */
export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(),
  payload: jsonb("payload")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  status: text("status").$type<JobStatus>().notNull().default("pending"),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  lastError: text("last_error"),
  result: jsonb("result").$type<unknown>(),
  runAt: timestamp("run_at", { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;

/**
 * Selectable model profiles. `credentialRef` is the name of the environment
 * variable holding the provider key (never the secret itself). Profiles are
 * seeded from configuration and can be enabled/disabled.
 */
export const modelProfiles = pgTable("model_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  provider: text("provider").$type<ProviderName>().notNull(),
  model: text("model").notNull(),
  label: text("label").notNull(),
  credentialRef: text("credential_ref").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ModelProfile = typeof modelProfiles.$inferSelect;
export type NewModelProfile = typeof modelProfiles.$inferInsert;

/**
 * A brand groups the PDPs that belong to the same merchant. `key` is the
 * registrable domain used for grouping; `name` is the display name and can be
 * renamed or merged by the consultant.
 */
export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;

/** A product detail page under evaluation, associated with a brand. */
export const pdps = pgTable("pdps", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  url: text("url").notNull().unique(),
  domain: text("domain").notNull(),
  title: text("title"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Pdp = typeof pdps.$inferSelect;
export type NewPdp = typeof pdps.$inferInsert;

/**
 * One crawler-style HTTP fetch of a PDP. The raw HTML and fetch metadata are
 * stored so checks and reports can reference what was actually captured.
 */
export const pdpFetches = pgTable("pdp_fetches", {
  id: uuid("id").primaryKey().defaultRandom(),
  pdpId: uuid("pdp_id")
    .notNull()
    .references(() => pdps.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  finalUrl: text("final_url"),
  statusCode: integer("status_code"),
  ok: boolean("ok").notNull().default(false),
  blocked: boolean("blocked").notNull().default(false),
  blockReason: text("block_reason"),
  contentType: text("content_type"),
  byteSize: integer("byte_size").notNull().default(0),
  htmlLength: integer("html_length").notNull().default(0),
  rawHtml: text("raw_html"),
  error: text("error"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type PdpFetch = typeof pdpFetches.$inferSelect;
export type NewPdpFetch = typeof pdpFetches.$inferInsert;

/**
 * Normalized representation of a fetched PDP: cleaned text/markdown, extracted
 * JSON-LD, and capture signals (price/availability/CTA) used by the checks.
 */
export const pdpNormalizations = pgTable("pdp_normalizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  pdpId: uuid("pdp_id")
    .notNull()
    .references(() => pdps.id, { onDelete: "cascade" }),
  fetchId: uuid("fetch_id").references(() => pdpFetches.id, {
    onDelete: "set null",
  }),
  title: text("title"),
  content: text("content").notNull(),
  jsonLd: jsonb("json_ld")
    .$type<unknown[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  signals: jsonb("signals")
    .$type<PdpSignals>()
    .notNull()
    .default(sql`'{"priceTexts":[],"availabilityTexts":[],"ctaTexts":[]}'::jsonb`),
  textLength: integer("text_length").notNull().default(0),
  truncated: boolean("truncated").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type PdpNormalization = typeof pdpNormalizations.$inferSelect;
export type NewPdpNormalization = typeof pdpNormalizations.$inferInsert;

/**
 * Result of checking robots.txt for AI/agent crawler access on a PDP's host.
 */
export const robotsReports = pgTable("robots_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  pdpId: uuid("pdp_id")
    .notNull()
    .references(() => pdps.id, { onDelete: "cascade" }),
  robotsUrl: text("robots_url").notNull(),
  statusCode: integer("status_code"),
  present: boolean("present").notNull().default(false),
  allowed: boolean("allowed").notNull().default(true),
  blockedBots: jsonb("blocked_bots")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  bots: jsonb("bots")
    .$type<BotAccess[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  error: text("error"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type RobotsReport = typeof robotsReports.$inferSelect;
export type NewRobotsReport = typeof robotsReports.$inferInsert;

export const evaluationStatuses = [
  "created",
  "fetching",
  "evaluating",
  "completed",
  "partial",
  "failed",
] as const;

export type EvaluationStatus = (typeof evaluationStatuses)[number];

/**
 * One evaluation run of a PDP with a selected set of models. Immutable
 * snapshots are represented by separate rows per run.
 */
export const evaluations = pgTable("evaluations", {
  id: uuid("id").primaryKey().defaultRandom(),
  pdpId: uuid("pdp_id")
    .notNull()
    .references(() => pdps.id, { onDelete: "cascade" }),
  status: text("status").$type<EvaluationStatus>().notNull().default("created"),
  reason: text("reason"),
  shopperRequest: text("shopper_request"),
  normalizationId: uuid("normalization_id").references(() => pdpNormalizations.id, { onDelete: "set null" }),
  rubricVersion: text("rubric_version").notNull().default("v0.1"),
  modelProfileIds: jsonb("model_profile_ids")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  classification: jsonb("classification"),
  jsHeavy: boolean("js_heavy").notNull().default(false),
  deterministicFindings: jsonb("deterministic_findings")
    .$type<Finding[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  scores: jsonb("scores"),
  recommendations: jsonb("recommendations")
    .$type<Recommendation[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Evaluation = typeof evaluations.$inferSelect;
export type NewEvaluation = typeof evaluations.$inferInsert;

/**
 * Structured per-step log for an evaluation (fetch, normalize, classify,
 * checks, per-model calls, scoring). Used for observability and debugging.
 */
export const evaluationSteps = pgTable("evaluation_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  evaluationId: uuid("evaluation_id")
    .notNull()
    .references(() => evaluations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status").notNull(),
  message: text("message"),
  durationMs: integer("duration_ms"),
  metadata: jsonb("metadata")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type EvaluationStep = typeof evaluationSteps.$inferSelect;
export type NewEvaluationStep = typeof evaluationSteps.$inferInsert;

/**
 * One model's evaluation of a PDP: the model-judged checks and the unscored
 * brand perception, stored so it can be attached to an evaluation.
 */
export const modelEvaluations = pgTable("model_evaluations", {
  id: uuid("id").primaryKey().defaultRandom(),
  pdpId: uuid("pdp_id")
    .notNull()
    .references(() => pdps.id, { onDelete: "cascade" }),
  evaluationId: uuid("evaluation_id").references(() => evaluations.id, {
    onDelete: "cascade",
  }),
  modelProfileId: uuid("model_profile_id").references(() => modelProfiles.id, {
    onDelete: "set null",
  }),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  status: text("status").notNull(),
  attempts: integer("attempts").notNull().default(0),
  brandPerception: text("brand_perception"),
  recommendationFit: text("recommendation_fit"),
  shopperAssessment: jsonb("shopper_assessment").$type<ShopperAssessment>(),
  checks: jsonb("checks")
    .$type<ModelJudgedCheck[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  usage: jsonb("usage").$type<ModelUsage | null>(),
  error: text("error"),
  errors: jsonb("errors")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ModelEvaluation = typeof modelEvaluations.$inferSelect;
export type NewModelEvaluation = typeof modelEvaluations.$inferInsert;
