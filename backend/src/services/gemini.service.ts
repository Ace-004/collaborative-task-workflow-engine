import { GoogleGenAI } from "@google/genai";

// Read API key from environmental variables
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface DecodedTask {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  estimated_hours: number;
}

export const decomposeRequirementWithAI = async (requirements: string): Promise<DecodedTask[]> => {
  const prompt = `
    You are an expert technical product manager. Decompose the following user feature request into a set of discrete, actionable engineering tasks.
    
    Feature Requirements:
    "${requirements}"
    
    For each task, provide:
    1. A short, clear task title.
    2. A technical description detailing what needs to be implemented.
    3. A priority estimation (low, medium, high).
    4. An estimated duration in hours (number).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        // Enforce structured JSON output matching our typescript interface
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              description: { type: "STRING" },
              priority: { type: "STRING", enum: ["low", "medium", "high"] },
              estimated_hours: { type: "INTEGER" },
            },
            required: ["title", "description", "priority", "estimated_hours"],
          },
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response received from Gemini API");
    }

    return JSON.parse(responseText) as DecodedTask[];
  } catch (error) {
    console.error("[Gemini Service Error]:", error);
    throw error;
  }
};