import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
}
const ai = new GoogleGenerativeAI(apiKey);
export const decomposeRequirementWithAI = async (requirements) => {
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
        const model = ai.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            title: { type: SchemaType.STRING },
                            description: { type: SchemaType.STRING },
                            priority: {
                                type: SchemaType.STRING,
                                format: "enum",
                                enum: ["low", "medium", "high"],
                            },
                            estimated_hours: { type: SchemaType.INTEGER },
                        },
                        required: ["title", "description", "priority", "estimated_hours"],
                    },
                },
            },
        });
        const response = await model.generateContent(prompt);
        const responseText = response.response.text();
        if (!responseText) {
            throw new Error("Empty response received from Gemini API");
        }
        return JSON.parse(responseText);
    }
    catch (error) {
        console.error("[Gemini Service Error]:", error);
        throw error;
    }
};
//# sourceMappingURL=gemini.service.js.map