
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { CeeKnowledgeItem, GroundingSource } from "../types";

// Using Flash model for significant speed improvement (Time to First Token)
const MODEL_NAME = 'gemini-3-flash-preview';

export interface AssistantStreamResult {
  stream: AsyncIterable<GenerateContentResponse>;
  getGroundingSources: (finalResponse: GenerateContentResponse) => GroundingSource[];
}

export const askCeeExpertStream = async (
  query: string,
  contextItems: CeeKnowledgeItem[],
  referenceDate: string
): Promise<AssistantStreamResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  // Optimized context preparation (more concise formatting for speed)
  const policyContext = contextItems.filter(i => i.type !== 'FICHE').map(i => 
    `[DOC] ${i.title}: ${i.content} (${i.url})`
  ).join('\n');

  const ficheContext = contextItems.filter(i => i.type === 'FICHE').map(i => 
    `[FICHE] ${i.code}: ${i.title}. Ver: ${i.versionDate}. Détails: ${i.content} (Lien: ${i.url})`
  ).join('\n');

  const systemPrompt = `
    Expert CEE Ministère Transition Écologique.
    Reponds via contexte local ou Google Search (ecologie.gouv.fr).
    Date: ${new Date(referenceDate).toLocaleDateString('fr-FR')}.
    
    RÈGLES :
    1. SOURCE OBLIGATOIRE à la fin (Code fiche ou Lien).
    2. Utilise le contexte local en priorité.
    3. Sois précis et concis (réponse rapide).
    
    CONTEXTE :
    ${policyContext || 'N/A'}
    ${ficheContext || 'N/A'}
  `;

  const responseStream = await ai.models.generateContentStream({
    model: MODEL_NAME,
    contents: [{ parts: [{ text: query }] }],
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.1,
      tools: [{ googleSearch: {} }],
    },
  });

  const getGroundingSources = (finalResponse: any): GroundingSource[] => {
    const sources: GroundingSource[] = [];
    const chunks = finalResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          sources.push({
            title: chunk.web.title || "Source officielle",
            url: chunk.web.uri
          });
        }
      });
    }

    // Heuristic matching for local context
    const text = finalResponse.text || "";
    contextItems.forEach(item => {
      if ((item.code && text.includes(item.code)) || text.includes(item.title)) {
        sources.push({ title: item.code || item.title, url: item.url });
      }
    });

    return Array.from(new Map(sources.map(s => [s.url, s])).values());
  };

  return {
    stream: responseStream,
    getGroundingSources
  };
};
