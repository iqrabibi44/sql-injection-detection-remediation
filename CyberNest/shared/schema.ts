import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const scans = pgTable("scans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  language: text("language").notNull(),
  code: text("code").notNull(),
  fileName: text("file_name"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vulnerabilities = pgTable("vulnerabilities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scanId: varchar("scan_id").notNull().references(() => scans.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  severity: text("severity").notNull(),
  line: integer("line").notNull(),
  description: text("description").notNull(),
  codeSnippet: text("code_snippet"),
  suggestion: text("suggestion"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scanId: varchar("scan_id").notNull().references(() => scans.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  summary: jsonb("summary").notNull(),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const monitoringEvents = pgTable("monitoring_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  scanId: varchar("scan_id").references(() => scans.id, { onDelete: "set null" }),
  severity: text("severity"),
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  scans: many(scans),
  reports: many(reports),
  monitoringEvents: many(monitoringEvents),
}));

export const scansRelations = relations(scans, ({ one, many }) => ({
  user: one(users, {
    fields: [scans.userId],
    references: [users.id],
  }),
  vulnerabilities: many(vulnerabilities),
  reports: many(reports),
  monitoringEvents: many(monitoringEvents),
}));

export const vulnerabilitiesRelations = relations(vulnerabilities, ({ one }) => ({
  scan: one(scans, {
    fields: [vulnerabilities.scanId],
    references: [scans.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  scan: one(scans, {
    fields: [reports.scanId],
    references: [scans.id],
  }),
  user: one(users, {
    fields: [reports.userId],
    references: [users.id],
  }),
}));

export const monitoringEventsRelations = relations(monitoringEvents, ({ one }) => ({
  user: one(users, {
    fields: [monitoringEvents.userId],
    references: [users.id],
  }),
  scan: one(scans, {
    fields: [monitoringEvents.scanId],
    references: [scans.id],
  }),
}));

// Reusable password schema
export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: passwordSchema,
});

export const insertScanSchema = createInsertSchema(scans).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertVulnerabilitySchema = createInsertSchema(vulnerabilities).omit({
  id: true,
  createdAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
});

export const insertMonitoringEventSchema = createInsertSchema(monitoringEvents).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertScan = z.infer<typeof insertScanSchema>;
export type Scan = typeof scans.$inferSelect;

export type InsertVulnerability = z.infer<typeof insertVulnerabilitySchema>;
export type Vulnerability = typeof vulnerabilities.$inferSelect;

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

export type InsertMonitoringEvent = z.infer<typeof insertMonitoringEventSchema>;
export type MonitoringEvent = typeof monitoringEvents.$inferSelect;

// Additional schemas for auth
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
