
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Role } from "../types";

// Always use named parameter for apiKey and obtain it directly from process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are NyayaAI, a specialized Indian Legal Assistant. 
Your knowledge base covers: 
- Indian Penal Code (IPC) / Bharatiya Nyaya Sanhita (BNS)
- Code of Criminal Procedure (CrPC) / Bharatiya Nagarik Suraksha Sanhita (BNSS)
- Code of Civil Procedure (CPC)
- The Constitution of India
- Consumer Protection Act
- Labor Laws, IT Act, Cyber Law, and Personal Laws (HMA, etc.)

GUIDELINES:
1. Provide accurate, structured insights with headings and bullet points.
2. ALWAYS cite specific sections and acts.
3. If unsure, suggest consulting a licensed advocate.
4. Use a professional, empathetic, and objective tone.
5. Do not offer false guarantees of winning cases.
6. When analyzing documents, identify risks, key clauses, and deadlines.
7. Support multilingual responses if the user asks in Hindi or Tamil, but prioritize legal accuracy.
`;

export const chatWithLegalAI = async (message: string, history: { role: Role; content: string }[]) => {
  // Use gemini-3-pro-preview for complex reasoning tasks as per guidelines.
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [
      ...history.map(h => ({ role: h.role === Role.USER ? 'user' : 'model', parts: [{ text: h.content }] })),
      { role: 'user', parts: [{ text: message }] }
    ],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 4000 }
    }
  });

  // Access the text property directly on GenerateContentResponse.
  return {
    text: response.text,
    links: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || 'Legal Resource',
      uri: chunk.web?.uri || '#'
    })) || []
  };
};

export const analyzeLegalDocument = async (base64Data: string, mimeType: string) => {
  // Use gemini-3-flash-preview for general text and image tasks.
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: "Analyze this legal document. Extract: 1. Relevant legal sections, 2. Potential risks, 3. Obligations/Responsibilities, 4. Executive summary. Return in structured markdown." }
        ]
      }
    ],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION
    }
  });
  // Access the text property directly on GenerateContentResponse.
  return response.text;
};

export const generateDraft = async (type: string, details: string) => {
  // Use gemini-3-flash-preview for simple drafting tasks.
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Draft a professional ${type} based on these details: ${details}. Ensure it follows standard Indian legal formatting.`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION
    }
  });
  // Access the text property directly on GenerateContentResponse.
  return response.text;
};
