
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Role, Language, Jurisdiction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are NyayaAI, a specialized Multilingual & Multi-jurisdictional Legal Assistant.
Your expertise includes:
- CRIMINAL: IPC (BNS), CrPC (BNSS), Evidence Act.
- CIVIL: CPC, Property Law, Contract Act, Family Law.
- COMMERCIAL: Companies Act, GST, IBC, IPR, Arbitration.
- JURISDICTION: Focus on Union of India and specific State-level variations.

EXPLAINABLE AI (XAI) PROTOCOL:
When answering complex queries, provide a 'Reasoning Path' section that details:
1. The specific statutes identified.
2. The logic used to connect the facts to the law.
3. Precedents or logical deductions applied.

MULTILINGUAL SUPPORT:
Respond in the language requested by the user. Maintain legal citations in English for precision.

DOCUMENT ANALYSIS PROTOCOL:
When analyzing documents, you MUST extract:
- Executive Summary: A concise overview.
- Key Legal Issues: Specific points of contention or legal questions.
- Crucial Dates: Any deadlines, incident dates, or filing dates.
- Involved Parties: Identification of all entities/individuals.
- Statutory Mapping: Specific sections of Indian Law (IPC/BNS, etc.) that apply.
`;

export const chatWithLegalAI = async (
  message: string, 
  history: { role: Role; content: string }[],
  language: Language = Language.ENGLISH,
  jurisdiction: Jurisdiction = Jurisdiction.UNION
) => {
  const prompt = `
Context:
- Preferred Language: ${language}
- Target Jurisdiction: ${jurisdiction}

Query: ${message}

Instructions:
1. Answer the query comprehensively in ${language}.
2. Cite relevant sections from Indian Law (Civil, Commercial, or Criminal).
3. Provide an EXPLICIT section at the end titled "---REASONING_PATH---" explaining the legal logic used for Explainable AI transparency.
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
        title: chunk.web?.title || 'Legal Resource',
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
          { text: "Perform a comprehensive intelligent analysis of this legal document. Extract and categorize: \n1. Executive Summary\n2. Key Legal Issues Identified\n3. Crucial Dates and Deadlines\n4. Relevant Parties Involved\n5. Statutory Mapping (IPC/BNS/CPC etc.)\n6. Risk Assessment\nReturn the results in clear, structured Markdown with distinct headings." }
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
    contents: `Draft a professional ${type} based on these details: ${details}. Ensure it follows standard Indian legal formatting for Civil/Commercial matters as appropriate.`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION
    }
  });
  return response.text;
};
