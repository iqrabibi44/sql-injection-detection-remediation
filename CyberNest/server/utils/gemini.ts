import { config } from 'dotenv';
// Adjusted path to look for .env in the root or local folder
config({ path: '../.env.local' });
import { GoogleGenAI } from "@google/genai";
import type { Vulnerability } from "@shared/schema";
 
// 🔄 MODELS LIST (Ordered by Priority)
// We try the newest experimental models first, then fall back to stable ones.
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash-exp", // The newest (referred to as 2.5/2.0 Flash)
  "gemini-1.5-flash",     // Reliable production fallback
  "gemini-1.5-pro",      // Heavy-duty fallback
  "gemini-pro"           // Legacy fallback
];
 
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required but not set.");
}
 
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
 
export async function chatWithGemini(
  userMessage: string,
  vulnerability: Vulnerability | null
): Promise<string> {
  if (!ai) {
    return "Error: AI configuration missing.";
  }
 
  const systemPrompt = `You are SQLShield AI Assistant, an expert in SQL security and vulnerability detection.
You help developers understand SQL injection vulnerabilities and provide practical fixes.
Be concise, technical, and actionable in your responses.
Focus on security best practices and prevention techniques.`;
 
  let context = "";
  if (vulnerability) {
    context = `\n\nCurrent Vulnerability Context:
Type: ${vulnerability.type}
Severity: ${vulnerability.severity}
Description: ${vulnerability.description}
Line: ${vulnerability.line}
${vulnerability.codeSnippet ? `Code Snippet:\n${vulnerability.codeSnippet}` : ""}
${vulnerability.suggestion ? `Initial Suggestion: ${vulnerability.suggestion}` : ""}`;
  }
 
  const fullPrompt = userMessage + context;
  let lastError = "";
 
  // ---------------------------------------------------------
  // 🔄 MODEL ROTATION LOOP
  // ---------------------------------------------------------
  for (const modelName of GEMINI_MODELS) {
    try {
      console.log(`[AI Pipeline] Attempting Gemini Model: ${modelName}`);
 
      const response = await ai.models.generateContent({
        model: modelName,
        contents: fullPrompt,
        config: {
          systemInstruction: systemPrompt,
        },
      });
 
      if (response.text) {
        console.log(`[AI Pipeline] ✅ Success using ${modelName}`);
        return response.text;
      }
    } catch (error: any) {
      lastError = error.message || "Unknown error";
     
      // Log the specific failure for the supervisor to see in terminal
      console.warn(`[AI Pipeline] ⚠️ Model ${modelName} failed: ${lastError.substring(0, 60)}...`);
     
      // If the error is high demand (503) or model not found (404), move to the next model
      continue;
    }
  }
 
  // ---------------------------------------------------------
  // 🏁 ALL MODELS FAILED
  // ---------------------------------------------------------
  console.error("[AI Pipeline] ❌ All Gemini models exhausted.");
  return `Error: All Google AI models are currently experiencing high demand. Last error: ${lastError}`;
}