import { useState } from "react";
import { useLocation, useSearch } from "wouter"; // Ensure you are importing useLocation
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Scan, Upload, AlertTriangle, CheckCircle, Info, FileText,MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";
import type { Vulnerability } from "@shared/schema";

/* ─── Language Detection Patterns ─── */
const LANGUAGE_SIGNATURES: Record<string, RegExp[]> = {
  javascript: [
    /\b(const|let|var)\s+\w+\s*=/, /=>/, /console\.log/,
    /require\(/, /module\.exports/, /import\s+.*from\s+['"]/, /document\./,
    /\bfunction\s+\w+\s*\(/, /\.then\(/, /async\s+(function|\()/,
  ],
  python: [
    /\bdef\s+\w+\s*\(/, /\bimport\s+\w+/, /\bfrom\s+\w+\s+import/,
    /\bprint\s*\(/, /\bclass\s+\w+.*:/, /\bif\s+.*:/, /\belif\b/,
    /\bself\./, /__init__/, /\bNone\b/, /\bTrue\b|\bFalse\b/,
  ],
  java: [
    /\bpublic\s+(static\s+)?class\b/, /System\.out\.print/,
    /\bpublic\s+static\s+void\s+main/, /\bimport\s+java\./,
    /\bnew\s+\w+\s*\(/, /\bextends\b/, /\bimplements\b/,
    /\b(String|int|boolean|double)\s+\w+/, /@Override/,
  ],
  cpp: [
    /#include\s*</, /\bstd::/, /\bcout\s*<</, /\bcin\s*>>/, /\busing\s+namespace/,
    /\bint\s+main\s*\(/, /\bvector\s*</, /\bnullptr\b/, /\bclass\s+\w+\s*\{/,
    /->/, /::\w+/, /\btemplate\s*</,
  ],
  php: [
    /<\?php/, /\$\w+\s*=/, /\becho\s+/, /\bfunction\s+\w+\s*\(/,
    /->\w+/, /\$this->/, /\barray\s*\(/, /\brequire_once/,
  ],
  ruby: [
    /\bdef\s+\w+/, /\bputs\s+/, /\bend\b/, /\bclass\s+\w+/,
    /\brequire\s+['"]/, /\battr_accessor\b/, /\bdo\s*\|/,
  ],
  go: [
    /\bpackage\s+\w+/, /\bfunc\s+\w+/, /\bfmt\.Print/,
    /\bimport\s+\(/, /\b:=\b/, /\bgo\s+func/, /\bdefer\b/,
  ],
  rust: [
    /\bfn\s+\w+/, /\blet\s+mut\b/, /\bprintln!/, /\buse\s+std::/,
    /\bimpl\s+/, /\bmatch\s+/, /\b->\s*(\w+|\()/, /\bpub\s+fn/,
  ],
};

function detectLanguage(code: string): { detected: string; confidence: number } | null {
  if (!code.trim()) return null;

  let bestLang = "";
  let bestScore = 0;

  for (const [lang, patterns] of Object.entries(LANGUAGE_SIGNATURES)) {
    const score = patterns.reduce((acc, rx) => acc + (rx.test(code) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestLang = lang;
    }
  }

  if (bestScore === 0) return null;
  const confidence = Math.min(Math.round((bestScore / 4) * 100), 100);
  return { detected: bestLang, confidence };
}

/* ─── Auto File Name Generator ─── */
const LANG_EXTENSIONS: Record<string, string> = {
  javascript: "js", python: "py", java: "java", cpp: "cpp",
  php: "php", ruby: "rb", go: "go", rust: "rs",
};

function extractFirstIdentifier(code: string, lang: string): string {
  const patterns: Record<string, RegExp> = {
    javascript: /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=|class\s+(\w+))/,
    python:     /(?:def\s+(\w+)|class\s+(\w+))/,
    java:       /(?:class\s+(\w+)|(?:public|private|protected)\s+\w+\s+(\w+)\s*\()/,
    cpp:        /(?:class\s+(\w+)|(?:int|void|string|bool)\s+(\w+)\s*\()/,
    php:        /(?:function\s+(\w+)|class\s+(\w+))/,
    ruby:       /(?:def\s+(\w+)|class\s+(\w+))/,
    go:         /(?:func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)|type\s+(\w+))/,
    rust:       /(?:fn\s+(\w+)|struct\s+(\w+)|impl\s+(\w+))/,
  };
  const rx = patterns[lang];
  if (!rx) return "snippet";
  const match = code.match(rx);
  if (match) {
    const name = match.slice(1).find(Boolean);
    if (name && name.length <= 30) return name;
  }
  return "snippet";
}

function generateScanFileName(code: string, lang: string): string {
  const ext = LANG_EXTENSIONS[lang] || "txt";
  const identifier = extractFirstIdentifier(code, lang);
  const now = new Date();
  const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).replace(":", "");
  return `${lang}_${identifier}_${time}.${ext}`;
}

const LANGUAGES = [
  { value: "javascript", label: "JavaScript", free: true },
  { value: "python", label: "Python", free: true },
  { value: "java", label: "Java", free: true },
  { value: "cpp", label: "C++", free: true },
  { value: "php", label: "PHP", free: false },
  { value: "ruby", label: "Ruby", free: false },
  { value: "go", label: "Go", free: false },
  { value: "rust", label: "Rust", free: false },
];
 
export default function Scanner() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [langWarning, setLangWarning] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [scanResults, setScanResults] = useState<any>(null);
const searchParams = new URLSearchParams(useSearch()); // Get URL parameters
  const historyScanId = searchParams.get("scan"); // Look for ?scan=id
 
const [isGeneratingReport, setIsGeneratingReport] = useState(false);
 
  // THIS FUNCTION REPLACES BOTH handleDownload AND handleGenerateReport
const handleGenerateReport = async () => {
    if (!scanResults?.scan) return;
 
    setIsGeneratingReport(true);
    try {
      const scanId = scanResults.scan.id || scanResults.scan._id;
     
      const report = await apiRequest("POST", "/api/scan/report", { scanId });
      const reportId = report.id || report._id;
 
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${baseUrl}/api/reports/${reportId}/download`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
 
      // 1. Read the raw text first to prevent the JSON crash
    const responseText = await response.text(); // Read as text FIRST
 
  if (responseText.trim().startsWith("<!DOCTYPE") || responseText.trim().startsWith("<html")) {
    throw new Error("Backend route not found. Did you restart the server after saving routes.ts?");
  }
 
  const data = JSON.parse(responseText); // Then parse as JSON
 
  if (!response.ok) {
    throw new Error(data.message || "Failed to download report.");
  }
  // ... rest of the Base64 decoding and download logic
 
      // 4. Safely decode Base64 back into raw binary
      const byteCharacters = atob(data.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
 
      // 5. Download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', data.filename);
      document.body.appendChild(link);
      link.click();
     
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
 
      toast({
        title: "Success",
        description: "Report downloaded successfully!",
      });
    } catch (error: any) {
      console.error("Download Error:", error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };
const scanMutation = useMutation({
    mutationFn: async (data: { code: string; language: string; fileName?: string }) => {
      // apiRequest automatically parses the JSON for us!
      const response = await apiRequest("POST", "/api/scan/sql", data);
     
      // Just return the response directly
      return response;
    },
   
    onSuccess: (data: any) => {
      setScanResults(data);
      queryClient.invalidateQueries({ queryKey: ["/api/user/scans"] });
      toast({
        title: "Scan completed",
        description: `Found ${data.vulnerabilities?.length || 0} vulnerabilities`,
      });
    },
 
    onError: (error: any) => {
      toast({
        title: "Scan failed",
        description: error.message || "Failed to scan code. Please try again.",
        variant: "destructive",
      });
    },
  });
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCode(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };
 
  /* ─── Language Validation ─── */
  const validateCodeLanguage = useCallback((codeText: string, selectedLang: string): boolean => {
    if (!codeText.trim()) return true;
    const result = detectLanguage(codeText);
    if (!result) return true; // can't detect, allow it
    if (result.detected === selectedLang) {
      setLangWarning(null);
      return true;
    }
    if (result.confidence >= 50) {
      const detectedLabel = LANGUAGES.find(l => l.value === result.detected)?.label || result.detected;
      setLangWarning(
        `This looks like ${detectedLabel} code (${result.confidence}% confidence), but you selected ${LANGUAGES.find(l => l.value === selectedLang)?.label}. Please select the correct language or paste matching code.`
      );
      return false;
    }
    setLangWarning(null);
    return true;
  }, []);

  const handleCodeChange = useCallback((value: string) => {
    setCode(value);
    if (value.trim().length > 30) {
      validateCodeLanguage(value, language);
    } else {
      setLangWarning(null);
    }
  }, [language, validateCodeLanguage]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (pasted.trim().length > 30) {
      const isValid = validateCodeLanguage(pasted, language);
      if (!isValid) {
        e.preventDefault();
        toast({
          title: "Language Mismatch",
          description: `The pasted code doesn't match the selected language. Please select the correct language first.`,
          variant: "destructive",
        });
        return;
      }
    }
  }, [language, validateCodeLanguage, toast]);

  const handleScan = () => {
    if (!code.trim()) {
      toast({
        title: "No code to scan",
        description: "Please enter or upload code to scan.",
        variant: "destructive",
      });
      return;
    }
 
    const selectedLang = LANGUAGES.find(l => l.value === language);
    if (selectedLang && !selectedLang.free) {
      toast({
        title: "Premium language",
        description: "This language requires a premium subscription.",
        variant: "destructive",
      });
      return;
    }

    // Final validation before scan
    if (!validateCodeLanguage(code, language)) {
      toast({
        title: "Language Mismatch",
        description: "Your code doesn't match the selected language. Please fix before scanning.",
        variant: "destructive",
      });
      return;
    }
 
    const resolvedFileName = fileName.trim() || generateScanFileName(code, language);
    scanMutation.mutate({ code, language, fileName: resolvedFileName });
  };
 
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "destructive";
      case "medium": return "warning";
      case "low": return "default";
      default: return "secondary";
    }
  };
 
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high": return AlertTriangle;
      case "medium": return Info;
      case "low": return CheckCircle;
      default: return Info;
    }
  };
 useEffect(() => {
    // 1. Handle code coming from AI Assistant (Rescan)
    const codeToRescan = sessionStorage.getItem("rescan_code");
    if (codeToRescan) {
      setCode(codeToRescan);
      sessionStorage.removeItem("rescan_code");
      toast({ title: "Code Imported", description: "Fixed code loaded." });
      return;
    }
 
    // 2. Handle code coming from History (Reopen)
    if (historyScanId) {
      const fetchHistoryScan = async () => {
        try {
          console.log("Reopening scan ID:", historyScanId);
         
          // 🔥 THE FIX: Use apiRequest instead of raw fetch.
          // This automatically handles the base URL and Auth tokens.
          const allScans = await apiRequest("GET", "/api/user/scans");
         
          // Match the scan by ID (ensuring string comparison)
          const targetScan = allScans.find((s: any) =>
            (s.id || s._id || "").toString() === historyScanId
          );
         
          if (targetScan) {
            console.log("Found Scan Data:", targetScan);
           
            // Populate the inputs
            setCode(targetScan.code || "");
            setLanguage(targetScan.language || "javascript");
            setFileName(targetScan.fileName || "");
           
            // Populate the Scan Results panel immediately
            setScanResults({
              scan: targetScan,
              vulnerabilities: targetScan.vulnerabilities || []
            });
 
            toast({ title: "Scan Restored", description: "Previous results loaded." });
          }
        } catch (e) {
          console.error("Failed to load historical scan:", e);
        }
      };
      fetchHistoryScan();
    }
  }, [historyScanId]);
  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">SQL Vulnerability Scanner</h1>
          <p className="text-muted-foreground">
            Analyze your code for SQL injection vulnerabilities using AI
          </p>
        </div>
 
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Scanner Input */}
          <Card>
            <CardHeader>
              <CardTitle>Code Input</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Programming Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language" data-testid="select-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label} {!lang.free && "(Premium)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
 
              <div className="space-y-2">
                <Label htmlFor="file-upload">Upload File</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="file-upload"
                    type="file"
                    accept=".js,.py,.java,.cpp,.php,.rb,.go,.rs,.jsx,.tsx"
                    onChange={handleFileUpload}
                    className="hidden"
                    data-testid="input-file"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("file-upload")?.click()}
                    className="gap-2"
                    data-testid="button-upload-file"
                  >
                    <Upload className="w-4 h-4" />
                    Upload File
                  </Button>
                  {fileName && (
                    <span className="text-sm text-muted-foreground">{fileName}</span>
                  )}
                </div>
              </div>
 
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <div className={`border rounded-md overflow-hidden ${langWarning ? 'border-warning' : 'border-border'}`}>
                  <Editor
                    height="400px"
                    theme="vs-dark"
                    language={language === 'cpp' ? 'cpp' : language === 'ruby' ? 'ruby' : language === 'rust' ? 'rust' : language === 'go' ? 'go' : language === 'php' ? 'php' : language === 'java' ? 'java' : language === 'python' ? 'python' : 'javascript'}
                    value={code}
                    onChange={(value) => handleCodeChange(value || "")}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                      padding: { top: 16 }
                    }}
                  />
                </div>
                {langWarning && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 text-warning text-sm">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{langWarning}</span>
                  </div>
                )}
              </div>
 
              <Button
                onClick={handleScan}
                disabled={scanMutation.isPending}
                className="w-full gap-2"
                data-testid="button-run-scan"
              >
                <Scan className="w-4 h-4" />
                {scanMutation.isPending ? "Scanning..." : "Run SQL Scan"}
              </Button>
            </CardContent>
          </Card>
 
          {/* Scan Results */}
          <Card>
            <CardHeader>
              <CardTitle>Scan Results</CardTitle>
            </CardHeader>
            <CardContent>
              {!scanResults ? (
                <div className="text-center py-12">
                  <Scan className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No scan results yet. Run a scan to see vulnerabilities.
                  </p>
                </div>
              ) : scanResults.vulnerabilities?.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                  <p className="text-lg font-semibold mb-2">No vulnerabilities found!</p>
                  <p className="text-muted-foreground mb-6">Your code looks secure.</p>
                 
                  {/* NEW BUTTON FOR CLEAN SCANS */}
                  <Button
                    onClick={handleGenerateReport}
                    disabled={isGeneratingReport}
                    variant="outline"
                    className="gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    {isGeneratingReport ? "Generating..." : "Download Clean Audit Report"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="destructive">
                      {scanResults.vulnerabilities.length} vulnerabilities found
                    </Badge>
                   
                    {/* NEW BUTTON FOR VULNERABLE SCANS */}
                    <Button
                      onClick={handleGenerateReport}
                      disabled={isGeneratingReport}
                      variant="outline"
                      size="sm"
                      className="gap-2 text-primary"
                    >
                      <FileText className="w-4 h-4" />
                      {isGeneratingReport ? "Generating..." : "Download Incident Report"}
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {scanResults.vulnerabilities.map((vuln: Vulnerability, index: number) => {
                      const Icon = getSeverityIcon(vuln.severity);
                      return (
                        <div
                          key={index}
                          className="p-4 rounded-lg border border-border space-y-2"
                          data-testid={`vulnerability-${index}`}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className={`w-5 h-5 mt-0.5 ${
                              vuln.severity === "high" ? "text-destructive" :
                              vuln.severity === "medium" ? "text-warning" :
                              "text-success"
                            }`} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold">{vuln.type}</p>
                                <Badge variant={getSeverityColor(vuln.severity) as "default" | "destructive" | "outline" | "secondary"}>
                                  {vuln.severity}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Line {vuln.line}
                              </p>
                              <p className="text-sm">{vuln.description}</p>
                              {vuln.suggestion && (
  <div className="mt-3 p-3 rounded bg-muted">
    <p className="text-sm font-medium mb-1">Status:</p>
    <p className="text-sm text-muted-foreground mb-3">{vuln.suggestion}</p>
   
    {/* NEW BUTTON TO GO TO AI ASSISTANT */}
    <Button
      variant="secondary"
      size="sm"
      className="w-full gap-2 border border-purple-500/30 hover:bg-purple-500/10"
      onClick={() => {
        // Store the code and vuln in session storage so the next page can read it
        sessionStorage.setItem("pending_fix_code", code);
        sessionStorage.setItem("pending_fix_vuln", JSON.stringify(vuln));
        setLocation("/ai-assistant");
      }}
    >
      <MessageCircle className="w-4 h-4 text-purple-400" />
      Go to AI Assistant for Fixes
    </Button>
  </div>
)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}