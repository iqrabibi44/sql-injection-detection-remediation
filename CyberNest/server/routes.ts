import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { MongoStorage } from "./storage-mongo";
import bcrypt from "bcrypt";
import { authMiddleware, adminMiddleware, generateToken, type AuthRequest } from "./middleware/auth";
import { scanCodeForVulnerabilities, getAIFix } from "./utils/scanner";
import { chatWithGemini } from "./utils/gemini";
import { signupSchema, loginSchema, passwordSchema } from "@shared/schema";
import fetch from 'node-fetch';
import { chatWithOpenAI } from "./utils/openai";
import PDFDocument from 'pdfkit';
const storage = new MongoStorage();
 
export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const result = signupSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }
 
      const { name, email, password } = result.data;
 
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }
 
      const hashedPassword = await bcrypt.hash(password, 10);
     
      // Check if this is the first user - if so, make them admin
      const allUsers = await storage.getAllUsers();
      const isFirstUser = allUsers.length === 0;
     
      const user = await storage.createUser({
        name,
        email,
        password: hashedPassword,
        role: isFirstUser ? "admin" : "user",
      });
 
      // Create monitoring event
      await storage.createMonitoringEvent({
        type: "user_signup",
        userId: user.id,
        severity: null,
        message: `New user signed up: ${user.email}${isFirstUser ? " (Admin)" : ""}`,
        metadata: null,
      });
 
      res.json({ message: "Account created successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Signup failed" });
    }
  });
 
  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }
 
      const { email, password } = result.data;
 
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
 
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
 
      const userId = (user as any)._id?.toString() || (user as any).id;
      const token = generateToken(userId, user.role);
 
      // Create monitoring event
      await storage.createMonitoringEvent({
        type: "user_login",
        userId: userId as any,
        severity: null,
        message: `User logged in: ${user.email}`,
        metadata: null,
      });
 
      res.json({
        token,
        user: {
          id: userId,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Login failed" });
    }
  });
 
  app.get("/api/auth/me", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
 
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
 
  // Scan routes
app.post("/api/scan/sql", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { code, language, fileName } = req.body;
 
      if (!code || !language) {
        return res.status(400).json({ message: "Code and language are required" });
      }
 
      const scan = await storage.createScan({
        userId: req.userId!,
        language,
        code,
        fileName: fileName || null,
      });
 
      const actualScanId = (scan as any).id || (scan as any)._id;
 
      await storage.createMonitoringEvent({
        type: "scan_started",
        userId: req.userId!,
        scanId: actualScanId,
        severity: null,
        message: `Scan started for ${language} code`,
        metadata: { fileName, language },
      });
 
      let vulnerabilities: any[] = [];
 
      try {
        const mlResponse = await fetch('http://127.0.0.1:8000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code, language: language })
        });
 
        if (mlResponse.ok) {
            const mlResult = await mlResponse.json() as {
                vulnerable: boolean;
                confidence: number;
                message: string;
            };
           
            if (mlResult.vulnerable) {
                const codeLines = code.split('\n');
                const sqliPatterns = [
                    /\+\s*[a-zA-Z_$][\w$]*/,    // Concatenation with '+' (JS, Java, C++, C#)
                    /`.*\$\{.*\}.*`/,           // JS Template literals
                    /f".*\{.*\}.*"/,            // Python f-strings
                    /%\s*[s|d]/,                 // Python/C % formatting
                    /\"\s*\.\s*\$\w+/,          // PHP concatenation
                    /stmt->execute/i,           // C++ execution
                    /executeQuery\(/i,          // JDBC/General execution
                    /mysqli_query\(/i,          // PHP execution
                    /db\.execute\(/i            // Node/Python execution
                ];

                let foundLines = 0;
                for (let i = 0; i < codeLines.length; i++) {
                    const lineContent = codeLines[i];
                    if (sqliPatterns.some(pattern => pattern.test(lineContent))) {
                        vulnerabilities.push({
                            type: "SQL Injection",
                            severity: mlResult.confidence > 0.8 ? "high" : "medium",
                            line: i + 1,
                            description: mlResult.message || "SQL injection vulnerability detected by ML model.",
                            codeSnippet: lineContent.trim(),
                            suggestion: "Vulnerability confirmed by ML. Please use the AI Assistant to generate a secure code fix."
                        });
                        foundLines++;
                    }
                }

                if (foundLines === 0) {
                    vulnerabilities.push({
                        type: "SQL Injection",
                        severity: mlResult.confidence > 0.8 ? "high" : "medium",
                        line: 1,
                        description: mlResult.message || "SQL injection vulnerability detected by ML model.",
                        codeSnippet: codeLines[0].trim(),
                        suggestion: "Vulnerability confirmed by ML. Please use the AI Assistant to generate a secure code fix."
                    });
                }
            }
        } else {
            vulnerabilities = await scanCodeForVulnerabilities(code, language);
        }
      } catch (mlError) {
        console.error("Failed to connect to Python ML Service.", mlError);
        vulnerabilities = await scanCodeForVulnerabilities(code, language);
      }
 
      for (const vuln of vulnerabilities) {
        await storage.createVulnerability({
          scanId: actualScanId,
          type: vuln.type,
          severity: vuln.severity,
          line: vuln.line,
          description: vuln.description,
          codeSnippet: vuln.codeSnippet || null,
          suggestion: vuln.suggestion || null,
        });
      }
 
      await storage.updateScan(actualScanId, { status: "completed" });
 
      const highRiskCount = vulnerabilities.filter(v => v.severity === "high").length;
      if (highRiskCount > 0) {
        await storage.createMonitoringEvent({
          type: "high_risk_detected",
          userId: req.userId!,
          scanId: actualScanId,
          severity: "high",
          message: `${highRiskCount} high-risk vulnerabilities detected`,
          metadata: { vulnerabilityCount: vulnerabilities.length },
        });
      }
 
      await storage.createMonitoringEvent({
        type: "scan_completed",
        userId: req.userId!,
        scanId: actualScanId,
        severity: highRiskCount > 0 ? "high" : null,
        message: `Scan completed with ${vulnerabilities.length} vulnerabilities found`,
        metadata: { vulnerabilityCount: vulnerabilities.length },
      });
 
      res.json({
        scan,
        vulnerabilities,
      });
    } catch (error: any) {
      console.error("SCAN ROUTE ERROR:", error);
      res.status(500).json({ message: error.message || "Scan failed" });
    }
});
  app.post("/api/scan/report", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { scanId } = req.body;
 
      const scan = await storage.getScan(scanId);
      if (!scan) {
        return res.status(404).json({ message: "Scan not found" });
      }
 
      if (scan.userId.toString() !== req.userId!.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }
 
      const vulnerabilities = await storage.getVulnerabilitiesByScanId(scanId);
 
      const summary = {
        totalVulnerabilities: vulnerabilities.length,
        highSeverity: vulnerabilities.filter(v => v.severity === "high").length,
        mediumSeverity: vulnerabilities.filter(v => v.severity === "medium").length,
        lowSeverity: vulnerabilities.filter(v => v.severity === "low").length,
        language: scan.language,
        fileName: scan.fileName,
        scanDate: scan.createdAt,
      };
 
      const report = await storage.createReport({
        scanId,
        userId: req.userId!,
        summary,
        pdfUrl: null,
      });
 
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Report generation failed" });
    }
  });
 
  app.post("/api/ai/fix", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { vulnerability, code } = req.body;
 
      const fixSuggestion = await getAIFix(vulnerability, code);
 
      res.json({ suggestion: fixSuggestion });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "AI fix failed" });
    }
  });
 
 app.post("/api/ai/chat", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { message, vulnerability } = req.body;
 
      if (!message || !message.trim()) {
        return res.status(400).json({ message: "Message is required" });
      }
 
      console.log("[Chat Route] Attempting Gemini AI...");
      let responseText = await chatWithGemini(message, vulnerability);
 
      // 🚨 FAILOVER TRIGGER: If Gemini fails, we switch to OpenAI ChatGPT
      if (responseText.startsWith("Error:")) {
        console.warn("[Chat Route] Gemini failed. Triggering Failover to OpenAI GPT...");
       
        const context = vulnerability ? `Context: ${vulnerability.type} at Line ${vulnerability.line}\nCode:\n${vulnerability.codeSnippet}` : "";
        const openAIResponse = await chatWithOpenAI(message, context);
 
        if (openAIResponse) {
          console.log("[Chat Route] ✅ Failover Successful: OpenAI provided the fix.");
          responseText = openAIResponse;
        } else {
          console.error("[Chat Route] ❌ Both Google and OpenAI failed.");
          responseText = "I apologize, but all AI services (Google Gemini & OpenAI) are currently overloaded. Please try again in a moment.";
        }
      }
 
      res.json({ response: responseText });
    } catch (error: any) {
      console.error("Chat Route Error:", error);
      res.status(500).json({ message: error.message || "Chat failed" });
    }
  });
 
  // User routes
  app.get("/api/user/scans", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const scans = await storage.getScansByUserId(req.userId!);
 
      // Attach vulnerabilities to each scan
      const scansWithVulns = await Promise.all(
        scans.map(async (scan) => {
          const vulnerabilities = await storage.getVulnerabilitiesByScanId(scan.id);
          return { ...scan, vulnerabilities };
        })
      );
 
      res.json(scansWithVulns);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
 
  app.get("/api/user/profile", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
 
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
 
  app.patch("/api/user/profile/update", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { name, email } = req.body;
 
      const user = await storage.updateUser(req.userId!, { name, email });
 
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Profile update failed" });
    }
  });
 
  app.post("/api/user/change-password", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
 
      // Validate new password
      const passwordResult = passwordSchema.safeParse(newPassword);
      if (!passwordResult.success) {
        return res.status(400).json({ message: passwordResult.error.errors[0].message });
      }
 
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
 
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
 
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(req.userId!, { password: hashedPassword });
 
      res.json({ message: "Password changed successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Password change failed" });
    }
  });
 
  app.get("/api/reports", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const reports = await storage.getReportsByUserId(req.userId!);
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
app.get("/api/reports/:id/download", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const reportId = req.params.id;
    const report = await storage.getReport(reportId);
   
    if (!report || report.userId.toString() !== req.userId!.toString()) {
      return res.status(404).json({ message: "Report not found" });
    }
 
    const scan = await storage.getScan(report.scanId);
    const vulnerabilities = await storage.getVulnerabilitiesByScanId(report.scanId);
 
    const sanitizeText = (str: any) => str ? String(str).replace(/[^\x20-\x7E\n\r\t]/g, '') : 'N/A';
 
    // 1. Build PDF in a Buffer
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];
     
      doc.on('data', (chunk: any) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err: any) => reject(err));
 
      try {
        doc.fontSize(20).fillColor('#4f46e5').text('SQLShield Security Audit', { align: 'center' });
        doc.moveDown();
       
        doc.fontSize(10).fillColor('black')
           .text(`Date: ${new Date(report.createdAt).toLocaleString()}`, { align: 'right' })
           .text(`Language: ${sanitizeText(scan?.language).toUpperCase()}`, { align: 'right' });
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
 
        doc.fontSize(14).fillColor('#4f46e5').text('Scan Summary');
        doc.fontSize(10).fillColor('black').text(`Total Vulnerabilities: ${vulnerabilities.length}`);
        doc.moveDown();
 
        doc.fontSize(14).fillColor('#4f46e5').text('Original Code');
        doc.moveDown(0.5);
        doc.fontSize(8).font('Courier').fillColor('#333333').text(sanitizeText(scan?.code), {
          width: 450,
          align: 'left',
          lineBreak: true
        });
        doc.moveDown();
        doc.font('Helvetica');
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
 
        doc.fontSize(14).fillColor('#e11d48').text('Vulnerabilities');
        doc.moveDown();
 
        if (!vulnerabilities || vulnerabilities.length === 0) {
          doc.fontSize(10).fillColor('#16a34a').text('No vulnerabilities detected. Code is safe.');
        } else {
          vulnerabilities.forEach((v: any, index: number) => {
            if (doc.y > 680) doc.addPage();
           
            doc.fontSize(12).fillColor('#e11d48').text(`Issue #${index + 1}: ${sanitizeText(v.type)}`);
            doc.fontSize(10).fillColor('black').text(`Severity: ${sanitizeText(v.severity).toUpperCase()} | Line: ${v.line}`);
            doc.moveDown(0.5);
            doc.text(`Description: ${sanitizeText(v.description)}`);
            doc.moveDown(0.5);
           
            doc.fillColor('#16a34a').text('Suggested Fix:');
            doc.fontSize(8).font('Courier').fillColor('#1e293b').text(sanitizeText(v.suggestion), {
              width: 450,
              lineBreak: true
            });
            doc.font('Helvetica').fillColor('black');
            doc.moveDown(1.5);
          });
        }
       
        doc.end();
      } catch (err) {
        reject(err);
      }
    });
 
    // 2. Encode to Base64 to prevent network corruption
    const base64String = pdfBuffer.toString('base64');
   
    // 3. Send as JSON
    res.json({
      filename: `SQLShield_Audit_${reportId}.pdf`,
      base64: base64String
    });
 
  } catch (error: any) {
    console.error("PDF GENERATION CRASH:", error);
    res.status(500).json({ message: "Server failed to generate the PDF file.", details: error.message });
  }
});
// ... (rest of the file remains the same)
  // Admin routes
  app.get("/api/admin/users", authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
 
  app.delete("/api/admin/user/:id", authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
 
  app.post("/api/admin/user/:id/promote", authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.updateUser(req.params.id, { role: "admin" });
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
 
  app.get("/api/admin/scans", authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const scans = await storage.getAllScans();
 
      const scansWithVulns = await Promise.all(
        scans.map(async (scan) => {
          const vulnerabilities = await storage.getVulnerabilitiesByScanId(scan.id);
          return { ...scan, vulnerabilities };
        })
      );
 
      res.json(scansWithVulns);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
 
  app.get("/api/admin/monitoring/history", authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const events = await storage.getMonitoringEvents(100);
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
 
  const httpServer = createServer(app);
 
  // WebSocket server for real-time monitoring
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
 
  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
 
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
 
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
 
  // Function to broadcast monitoring events
  const broadcastMonitoringEvent = (event: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: "monitoring_event",
          event,
        }));
      }
    });
  };
 
  // Store broadcast function globally for use in routes
  (global as any).broadcastMonitoringEvent = broadcastMonitoringEvent;
 
  return httpServer;
}