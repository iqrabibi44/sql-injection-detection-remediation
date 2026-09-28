import mongoose from "mongoose";

// Use only MONGO_URI if available, otherwise use local MongoDB
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/sqlshield";

export async function connectDB() {
  try {
    console.log("Connecting to MongoDB:", MONGO_URI.replace(/\/\/.*@/, "//***@"));
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✓ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    throw error;
  }
}

// User Schema
export const UserSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  createdAt: { type: Date, default: Date.now },
});

// Scan Schema
export const ScanSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  code: { type: String, required: true },
  language: { type: String, required: true },
  fileName: String,
  status: { type: String, enum: ["pending", "completed", "failed"], default: "completed" },
  createdAt: { type: Date, default: Date.now },
});

// Vulnerability Schema
export const VulnerabilitySchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  scanId: { type: mongoose.Schema.Types.ObjectId, ref: "Scan", required: true },
  type: { type: String, required: true },
  severity: { type: String, enum: ["high", "medium", "low"], required: true },
  line: { type: Number, required: true },
  description: { type: String, required: true },
  codeSnippet: String,
  suggestion: String,
  createdAt: { type: Date, default: Date.now },
});

// Report Schema
export const ReportSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  scanId: { type: mongoose.Schema.Types.ObjectId, ref: "Scan", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  summary: mongoose.Schema.Types.Mixed,
  pdfUrl: String,
  createdAt: { type: Date, default: Date.now },
});

// MonitoringEvent Schema
export const MonitoringEventSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  type: { type: String, required: true },
  userId: mongoose.Schema.Types.ObjectId,
  scanId: mongoose.Schema.Types.ObjectId,
  severity: String,
  message: { type: String, required: true },
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model("User", UserSchema);
export const Scan = mongoose.model("Scan", ScanSchema);
export const Vulnerability = mongoose.model("Vulnerability", VulnerabilitySchema);
export const Report = mongoose.model("Report", ReportSchema);
export const MonitoringEvent = mongoose.model("MonitoringEvent", MonitoringEventSchema);
