
import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";
import { Role, Language, Jurisdiction } from "../types";

const SYSTEM_INSTRUCTION = `
You are LegalLens, an expert AI Legal Co-pilot specialized in the Indian Legal System.

CRITICAL LANGUAGE RULE:
- ALWAYS respond in the user's selected language. If the selected language is Hindi, Bengali, Tamil, etc., you MUST use that script and language for the entire response.
- Maintain professional legal terminology even when translating.

CRITICAL FORMATTING RULE:
- NEVER use '#' or '*' symbols in your output. No markdown headings or bold markers.
- Use plain text with capitalization for emphasis.
- Use clear paragraph breaks and numbered lists without symbols.

CAPABILITIES:
1. INTELLIGENT DOCUMENT ANALYSIS: Perform Issue Extraction and Summarization.
2. CASE LAW INTEGRATION: Map facts to BNS, IPC, BNSS, CrPC, etc.
3. VIDEO INTEGRATION: Provide relevant YouTube resources.
`;

export const cleanOutput = (text: string): string => {
  return text.replace(/[#*]/g, '').trim();
};

// Added non-streaming version of the chat for utility tools
export const chatWithLegalAI = async (
  message: string, 
  history: { role: Role; content: string }[],
  language: Language = Language.ENGLISH,
  jurisdiction: Jurisdiction = Jurisdiction.UNION
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const contents = [
      ...history
        .filter(h => h.content && h.content.trim())
        .map(h => ({
          role: h.role === Role.USER ? 'user' : 'model',
          parts: [{ text: h.content }]
        })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      }
    });

    return {
      text: cleanOutput(response.text || ""),
      links: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        web: {
          title: chunk.web?.title || 'Legal Reference',
          uri: chunk.web?.uri || '#'
        }
      })) || []
    };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(`AI Engine Error: ${error.message || "Connection failed"}`);
  }
};

export const chatWithLegalAIStream = async (
  message: string, 
  history: { role: Role; content: string }[],
  language: Language = Language.ENGLISH,
  jurisdiction: Jurisdiction = Jurisdiction.UNION,
  onChunk: (text: string) => void
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const prompt = `
Context:
- Language: ${language}
- Jurisdiction: ${jurisdiction}

Query: ${message}

Instructions:
1. Provide a detailed legal answer in ${language}. 
2. Append a section "---YOUTUBE_RESOURCES---" if relevant videos are found.
3. Include an "---REASONING_PATH---" section at the end.
`;

    const contents = [
      ...history
        .filter(h => h.content && h.content.trim())
        .map(h => ({
          role: h.role === Role.USER ? 'user' : 'model',
          parts: [{ text: h.content }]
        })),
      { role: 'user', parts: [{ text: prompt }] }
    ];

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      }
    });

    let fullAccumulatedText = "";
    let lastChunk: GenerateContentResponse | undefined;

    for await (const chunk of responseStream) {
      lastChunk = chunk;
      const chunkText = chunk.text;
      if (chunkText) {
        fullAccumulatedText += chunkText;
        const mainContent = fullAccumulatedText.split("---")[0];
        onChunk(cleanOutput(mainContent));
      }
    }

    const [contentWithYoutube, reasoning] = fullAccumulatedText.split("---REASONING_PATH---");
    const [_, youtubePart] = contentWithYoutube.split("---YOUTUBE_RESOURCES---");

    const youtubeLinks: { title: string, url: string }[] = [];
    if (youtubePart) {
      const lines = youtubePart.split('\n');
      lines.forEach(line => {
        if (line.includes('http')) {
          const urlMatch = line.match(/https?:\/\/[^\s]+/);
          if (urlMatch) youtubeLinks.push({ title: "Case Insight Video", url: urlMatch[0] });
        }
      });
    }

    return {
      fullText: cleanOutput(fullAccumulatedText.split("---")[0]),
      reasoning: cleanOutput(reasoning || ""),
      youtubeLinks: youtubeLinks,
      links: lastChunk?.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        web: {
          title: chunk.web?.title || 'Legal Reference',
          uri: chunk.web?.uri || '#'
        }
      })) || []
    };
  } catch (error: any) {
    console.error("Gemini Stream Error:", error);
    throw new Error(`AI Stream Error: ${error.message || "Connection failed"}`);
  }
};

export const generateLegalSpeech = async (text: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ 
      role: 'user',
      parts: [{ text: `Legal opinion: ${text}` }] 
    }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });
  
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

export const analyzeLegalDocument = async (base64Data: string, mimeType: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: "Analyze this document. Summarize issues, dates, and parties. No markdown." }
        ]
      }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });
    return cleanOutput(response.text || "");
  } catch (error: any) {
    console.error("Analysis Error:", error);
    throw new Error(`Analysis Failure: ${error.message || "Connection failed"}`);
  }
};

export const generateDraft = async (type: string, details: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ 
        role: 'user',
        parts: [{ text: `Draft ${type}: ${details}. Formal tone. No markdown.` }] 
      }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });
    return cleanOutput(response.text || "");
  } catch (error: any) {
    console.error("Drafting Error:", error);
    throw new Error(`Drafting Failure: ${error.message || "Connection failed"}`);
  }
};
