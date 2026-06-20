import { GoogleGenAI, Type } from '@google/genai';

export class AiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  async triageEmergency(description: string) {
    const prompt = `You are an emergency triage AI for the Triid platform in Redemption City, Nigeria.
Analyze the following resident distress description and categorize the problem.
Ensure you return a valid, strictly formatted JSON object.

Description: "${description}"`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { 
                type: Type.STRING, 
                enum: ['electrical', 'plumbing', 'generator', 'vehicle', 'security', 'hvac', 'locksmith', 'other'],
                description: 'The broad category of the problem.'
              },
              urgency: { 
                type: Type.STRING, 
                enum: ['low', 'medium', 'critical'],
                description: 'Critical: Imminent danger/massive collateral damage. Medium: Severe inconvenience. Low: Standard repair.'
              },
              summary: { 
                type: Type.STRING, 
                description: "A highly concise 3-4 word summary of the issue (e.g. 'Burning electrical panel')." 
              }
            },
            required: ["category", "urgency", "summary"]
          }
        }
      });
      
      const textResponse = response.text;
      return typeof textResponse === 'string' ? JSON.parse(textResponse) : textResponse;
    } catch (error) {
      console.error("AI Triage Error:", error);
      // Fallback for safety if AI call fails during emergency
      return { category: 'other', urgency: 'critical', summary: 'Emergency fallback' };
    }
  }
}

export const aiService = new AiService();
