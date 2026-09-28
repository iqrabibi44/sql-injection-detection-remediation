import mongoose from "mongoose";
import { User, Scan, Vulnerability, Report, MonitoringEvent } from "./db-mongo";
import type { User as UserType, Scan as ScanType, Vulnerability as VulnType, Report as ReportType, MonitoringEvent as MonitoringEventType, InsertUser, InsertScan, InsertVulnerability, InsertReport, InsertMonitoringEvent } from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<UserType | undefined>;
  getUserByEmail(email: string): Promise<UserType | undefined>;
  createUser(user: InsertUser): Promise<UserType>;
  updateUser(id: string, data: Partial<UserType>): Promise<UserType | undefined>;
  getAllUsers(): Promise<UserType[]>;
  deleteUser(id: string): Promise<void>;
  getScan(id: string): Promise<ScanType | undefined>;
  getScansByUserId(userId: string): Promise<ScanType[]>;
  getAllScans(): Promise<ScanType[]>;
  createScan(scan: InsertScan): Promise<ScanType>;
  updateScan(id: string, data: Partial<ScanType>): Promise<ScanType | undefined>;
  getVulnerabilitiesByScanId(scanId: string): Promise<VulnType[]>;
  createVulnerability(vulnerability: InsertVulnerability): Promise<VulnType>;
  getReport(id: string): Promise<ReportType | undefined>;
  getReportsByScanId(scanId: string): Promise<ReportType[]>;
  getReportsByUserId(userId: string): Promise<ReportType[]>;
  createReport(report: InsertReport): Promise<ReportType>;
  getMonitoringEvents(limit?: number): Promise<MonitoringEventType[]>;
  createMonitoringEvent(event: InsertMonitoringEvent): Promise<MonitoringEventType>;
}

export class MongoStorage implements IStorage {
  async getUser(id: string): Promise<UserType | undefined> {
    try {
      const oid = typeof id === "string" && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
      const user = await User.findById(oid).lean();
      if (!user) return undefined;
      return { ...(user as any), id: (user as any)._id?.toString() } as any;
    } catch {
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<UserType | undefined> {
    try {
      const user = await User.findOne({ email }).lean();
      if (!user) return undefined;
      return { ...(user as any), id: (user as any)._id?.toString() } as any;
    } catch {
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<UserType> {
    const user = new User({
      _id: new mongoose.Types.ObjectId(),
      ...insertUser,
    });
    await user.save();
    const obj = user.toObject() as any;
    obj.id = obj._id?.toString();
    return obj;
  }

  async updateUser(id: string, data: Partial<UserType>): Promise<UserType | undefined> {
    try {
      const oid = typeof id === "string" && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
      const user = await User.findByIdAndUpdate(oid, data, { new: true }).lean();
      if (!user) return undefined;
      return { ...(user as any), id: (user as any)._id?.toString() } as any;
    } catch {
      return undefined;
    }
  }

  async getAllUsers(): Promise<UserType[]> {
    const users = await User.find().lean();
    return (users as any[]).map((u) => ({ ...u, id: u._id?.toString() })) as any;
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const oid = typeof id === "string" && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
      await User.findByIdAndDelete(oid);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  }

  async getScan(id: string): Promise<ScanType | undefined> {
    try {
      const scan = await Scan.findById(id).lean();
      return scan as any;
    } catch {
      return undefined;
    }
  }

  async getScansByUserId(userId: string): Promise<ScanType[]> {
    try {
      const scans = await Scan.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 }).lean();
      // Normalize _id → id so downstream code can use scan.id reliably
      return (scans as any[]).map((s) => ({ ...s, id: s._id?.toString() })) as any;
    } catch {
      // Fallback: try with raw string (for non-ObjectId user IDs)
      const scans = await Scan.find({ userId }).sort({ createdAt: -1 }).lean();
      return (scans as any[]).map((s) => ({ ...s, id: s._id?.toString() })) as any;
    }
  }

  async getAllScans(): Promise<ScanType[]> {
    const scans = await Scan.find().sort({ createdAt: -1 }).lean();
    return (scans as any[]).map((s) => ({ ...s, id: s._id?.toString() })) as any;
  }

  async createScan(insertScan: InsertScan): Promise<ScanType> {
    const scan = new Scan({
      _id: new mongoose.Types.ObjectId(),
      ...insertScan,
    });
    await scan.save();
    const obj = scan.toObject() as any;
    // Normalize: expose id as string so routes can use scan.id reliably
    obj.id = obj._id?.toString();
    return obj;
  }

  async updateScan(id: string, data: Partial<ScanType>): Promise<ScanType | undefined> {
    try {
      const oid = typeof id === "string" ? new mongoose.Types.ObjectId(id) : id;
      const scan = await Scan.findByIdAndUpdate(oid, data, { new: true }).lean();
      if (!scan) return undefined;
      return { ...(scan as any), id: (scan as any)._id?.toString() } as any;
    } catch {
      return undefined;
    }
  }

  async getVulnerabilitiesByScanId(scanId: string): Promise<VulnType[]> {
    if (!scanId) return [];
    const idStr = scanId.toString().trim();
    try {
      // Try with ObjectId first (most common for Mongoose)
      const vulns = await Vulnerability.find({ 
        scanId: new mongoose.Types.ObjectId(idStr) 
      }).lean();
      if (vulns.length > 0) {
        return (vulns as any[]).map((v) => ({ ...v, id: v._id?.toString() })) as any;
      }
      
      // Fallback: try with raw string (if stored as string)
      const vulnsStr = await Vulnerability.find({ scanId: idStr }).lean();
      return (vulnsStr as any[]).map((v) => ({ ...v, id: v._id?.toString() })) as any;
    } catch {
      // Final fallback for invalid ObjectId strings
      const vulns = await Vulnerability.find({ scanId: idStr }).lean();
      return (vulns as any[]).map((v) => ({ ...v, id: v._id?.toString() })) as any;
    }
  }

  async createVulnerability(insertVuln: InsertVulnerability): Promise<VulnType> {
    const vuln = new Vulnerability({
      _id: new mongoose.Types.ObjectId(),
      ...insertVuln,
    });
    await vuln.save();
    return vuln.toObject() as any;
  }

  async getReport(id: string): Promise<ReportType | undefined> {
    try {
      const oid = typeof id === "string" && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
      const report = await Report.findById(oid).lean();
      if (!report) return undefined;
      return { ...(report as any), id: (report as any)._id?.toString() } as any;
    } catch {
      return undefined;
    }
  }

  async getReportsByScanId(scanId: string): Promise<ReportType[]> {
    const reports = await Report.find({ scanId }).lean();
    return (reports as any[]).map((r) => ({ ...r, id: r._id?.toString() })) as any;
  }

  async getReportsByUserId(userId: string): Promise<ReportType[]> {
    const reports = await Report.find({ userId }).lean();
    return (reports as any[]).map((r) => ({ ...r, id: r._id?.toString() })) as any;
  }

  async createReport(insertReport: InsertReport): Promise<ReportType> {
    const report = new Report({
      _id: new mongoose.Types.ObjectId(),
      ...insertReport,
    });
    await report.save();
    const obj = report.toObject() as any;
    obj.id = obj._id?.toString();
    return obj;
  }

  async getMonitoringEvents(limit = 100): Promise<MonitoringEventType[]> {
    const events = await MonitoringEvent.find().sort({ createdAt: -1 }).limit(limit).lean();
    return (events as any[]).map((e) => ({ ...e, id: e._id?.toString() })) as any;
  }

  async createMonitoringEvent(insertEvent: InsertMonitoringEvent): Promise<MonitoringEventType> {
    const event = new MonitoringEvent({
      _id: new mongoose.Types.ObjectId(),
      ...insertEvent,
    });
    await event.save();
    const obj = event.toObject() as any;
    obj.id = obj._id?.toString();
    return obj;
  }
}

export const storage = new MongoStorage();
