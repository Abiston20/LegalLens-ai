
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Role, Language, Jurisdiction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are LegalLens, an expert AI Legal Co-pilot specialized in the Indian Legal System and Multilingual assistance.

YOUR CAPABILITIES:
1. INTELLIGENT DOCUMENT ANALYSIS: When provided with a document (PDF, Image, DOCX text), you MUST perform "Issue Extraction" and "Automatic Summarization".
2. CASE LAW INTEGRATION: Map legal facts to specific sections of Indian Law, including:
   - Bharatiya Nyaya Sanhita (BNS) / Indian Penal Code (IPC)
   - Bharatiya Nagarik Suraksha Sanhita (BNSS) / CrPC
   - Bharatiya Sakshya Adhiniyam (BSA) / Evidence Act
   - Civil Procedure Code (CPC), Contracts Act, Family Laws, etc.
3. MULTILINGUAL SUPPORT: You support English, Hindi, Kannada, Malayalam, Tamil, Bengali, and Marathi. You must respond in the user's preferred language while keeping legal citations in English for jurisdictional accuracy.

OUTPUT PROTOCOL FOR DOCUMENTS:
You must ALWAYS return a structured analysis containing:
- Executive Summary: A concise 2-3 sentence overview.
- Identified Legal Issues: Numbered list of primary points of law at play.
- Crucial Dates: All dates mentioned, with context (e.g., Incident Date, Notice Date).
- Relevant Parties: List of individuals/entities and their roles (e.g., Petitioner, Respondent).
- Statutory Mapping: Direct citations of sections from IPC/BNS/CPC etc.
- Recommendations: Next legal steps.

EXPLAINABLE AI (XAI):
For every complex legal advice, include a reasoning section that explains why specific laws apply to the given facts.
`;

export const chatWithLegalAI = async (
  message: string, 
  history: { role: Role; content: string }[],
  language: Language = Language.ENGLISH,
  jurisdiction: Jurisdiction = Jurisdiction.UNION
) => {
  const prompt = `
Context:
- User Language: ${language}
- Jurisdiction: ${jurisdiction}

Query: ${message}

Instructions:
1. Provide a detailed legal answer in ${language}.
2. Use Google Search to ground your answer in recent case law or amendments (2024-2025).
3. Include an "---REASONING_PATH---" section at the end.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [
      ...history.map(h => ({ role: h.role === Role.USER ? 'user' : 'model', parts: [{ text: h.content }] })),
      { role: 'user', parts: [{ text: prompt }] }
    ],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 4000 }
    }
  });

  const fullText = response.text || "";
  const [mainContent, reasoning] = fullText.split("---REASONING_PATH---");

  return {
    text: mainContent.trim(),
    reasoning: reasoning?.trim(),
    links: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      web: {
        title: chunk.web?.title || 'Legal Reference',
        uri: chunk.web?.uri || '#'
      }
    })) || []
  };
};

export const analyzeLegalDocument = async (base64Data: string, mimeType: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: "Perform an Intelligent Document Analysis. Extract the Executive Summary, Key Issues, Dates, Parties, and Statutory Mapping (IPC/BNS citations). Return a structured Markdown report." }
        ]
      }
    ],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION
    }
  });
  return response.text;
};

export const generateDraft = async (type: string, details: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Draft a professional ${type} based on these details: ${details}. Follow Indian legal drafting standards.`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION
    }
  });
  return response.text;
};
