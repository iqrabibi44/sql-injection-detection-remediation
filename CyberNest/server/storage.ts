import {
  users,
  scans,
  vulnerabilities,
  reports,
  monitoringEvents,
  type User,
  type InsertUser,
  type Scan,
  type InsertScan,
  type Vulnerability,
  type InsertVulnerability,
  type Report,
  type InsertReport,
  type MonitoringEvent,
  type InsertMonitoringEvent,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<void>;

  // Scan methods
  getScan(id: string): Promise<Scan | undefined>;
  getScansByUserId(userId: string): Promise<Scan[]>;
  getAllScans(): Promise<Scan[]>;
  createScan(scan: InsertScan): Promise<Scan>;
  updateScan(id: string, data: Partial<Scan>): Promise<Scan | undefined>;

  // Vulnerability methods
  getVulnerabilitiesByScanId(scanId: string): Promise<Vulnerability[]>;
  createVulnerability(vulnerability: InsertVulnerability): Promise<Vulnerability>;

  // Report methods
  getReport(id: string): Promise<Report | undefined>;
  getReportsByScanId(scanId: string): Promise<Report[]>;
  getReportsByUserId(userId: string): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;

  // Monitoring methods
  getMonitoringEvents(limit?: number): Promise<MonitoringEvent[]>;
  createMonitoringEvent(event: InsertMonitoringEvent): Promise<MonitoringEvent>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Scan methods
  async getScan(id: string): Promise<Scan | undefined> {
    const [scan] = await db.select().from(scans).where(eq(scans.id, id));
    return scan || undefined;
  }

  async getScansByUserId(userId: string): Promise<Scan[]> {
    return db.select().from(scans).where(eq(scans.userId, userId)).orderBy(desc(scans.createdAt));
  }

  async getAllScans(): Promise<Scan[]> {
    return db.select().from(scans).orderBy(desc(scans.createdAt));
  }

  async createScan(insertScan: InsertScan): Promise<Scan> {
    const [scan] = await db.insert(scans).values(insertScan).returning();
    return scan;
  }

  async updateScan(id: string, data: Partial<Scan>): Promise<Scan | undefined> {
    const [scan] = await db.update(scans).set(data).where(eq(scans.id, id)).returning();
    return scan || undefined;
  }

  // Vulnerability methods
  async getVulnerabilitiesByScanId(scanId: string): Promise<Vulnerability[]> {
    return db.select().from(vulnerabilities).where(eq(vulnerabilities.scanId, scanId));
  }

  async createVulnerability(insertVulnerability: InsertVulnerability): Promise<Vulnerability> {
    const [vulnerability] = await db.insert(vulnerabilities).values(insertVulnerability).returning();
    return vulnerability;
  }

  // Report methods
  async getReport(id: string): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report || undefined;
  }

  async getReportsByScanId(scanId: string): Promise<Report[]> {
    return db.select().from(reports).where(eq(reports.scanId, scanId));
  }

  async getReportsByUserId(userId: string): Promise<Report[]> {
    return db.select().from(reports).where(eq(reports.userId, userId)).orderBy(desc(reports.createdAt));
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const [report] = await db.insert(reports).values(insertReport).returning();
    return report;
  }

  // Monitoring methods
  async getMonitoringEvents(limit: number = 100): Promise<MonitoringEvent[]> {
    return db.select().from(monitoringEvents).orderBy(desc(monitoringEvents.createdAt)).limit(limit);
  }

  async createMonitoringEvent(insertEvent: InsertMonitoringEvent): Promise<MonitoringEvent> {
    const [event] = await db.insert(monitoringEvents).values(insertEvent).returning();
    return event;
  }
}

export const storage = new DatabaseStorage();
