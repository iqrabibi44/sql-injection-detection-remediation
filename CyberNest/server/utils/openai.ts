import OpenAI from "openai";
 
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
 
export async function chatWithOpenAI(prompt: string, context?: string): Promise<string | null> {
  if (!openai) return null;
 
  try {
    const fullPrompt = context ? `${context}\n\nUser Question: ${prompt}` : prompt;
 
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Very fast and reliable
      messages: [
        { role: "system", content: "You are SQLShield AI, a SQL Security expert. Provide technical code fixes." },
        { role: "user", content: fullPrompt }
      ],
    });
 
    return response.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return null;
  }
}
