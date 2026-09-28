import OpenAI from "openai";

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

export interface ScanVulnerability {
  type: string;
  severity: "high" | "medium" | "low";
  line: number;
  description: string;
  codeSnippet?: string;
  suggestion?: string;
}

export async function scanCodeForVulnerabilities(code: string, language: string): Promise<ScanVulnerability[]> {
  const vulnerabilities: ScanVulnerability[] = [];
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const lowerLine = line.toLowerCase();

    // Check for basic SQL injection patterns
    if (lowerLine.includes('select') && (lowerLine.includes('+' + 'input') || lowerLine.includes('request.get') || lowerLine.includes('$_get') || lowerLine.includes('$_post'))) {
      vulnerabilities.push({
        type: "SQL Injection",
        severity: "high",
        line: lineNumber,
        description: "Potential SQL injection vulnerability detected. User input is directly concatenated into SQL query.",
        codeSnippet: line.trim(),
        suggestion: "Use prepared statements or parameterized queries to prevent SQL injection."
      });
    }

    // Check for unsafe query construction
    if (lowerLine.includes('query(') && (lowerLine.includes('+' + 'input') || lowerLine.includes('request.get') || lowerLine.includes('$_get') || lowerLine.includes('$_post'))) {
      vulnerabilities.push({
        type: "Unsafe Query Construction",
        severity: "medium",
        line: lineNumber,
        description: "Query is constructed using string concatenation with user input, which may lead to injection attacks.",
        codeSnippet: line.trim(),
        suggestion: "Use parameterized queries or input sanitization."
      });
    }
  });

  // If no vulnerabilities found, return a mock one to show output
  if (vulnerabilities.length === 0) {
    vulnerabilities.push({
      type: "No Vulnerabilities Found",
      severity: "low",
      line: 1,
      description: "No obvious SQL injection vulnerabilities detected in the provided code.",
      suggestion: "Always validate and sanitize user inputs, and use prepared statements for database queries."
    });
  }

  return vulnerabilities;
}

export async function getAIFix(vulnerability: ScanVulnerability, code: string): Promise<string> {
  // Static response for now, will be replaced with trained ML model later
  return `Static fix suggestion for ${vulnerability.type}: ${vulnerability.suggestion || "Use secure coding practices to prevent vulnerabilities."}`;
}
