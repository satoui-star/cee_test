import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { CeeKnowledgeItem, GroundingSource } from "../types";

// Using the recommended model for basic/general tasks
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
  // Accessing the API key injected by Vite define or environment
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("Clé API manquante. Veuillez configurer API_KEY dans vos variables d'environnement Vercel.");
  }

  // Initialize strictly following guidelines
  const ai = new GoogleGenAI({ apiKey });

  const policyContext = contextItems.filter(i => i.type !== 'FICHE').map(i => 
    `[DOC] ${i.title}: ${i.content} (Source: ${i.url})`
  ).join('\n');

  const ficheContext = contextItems.filter(i => i.type === 'FICHE').map(i => 
    `[FICHE] ${i.code}: ${i.title}. Date: ${i.versionDate}. Contenu: ${i.content}`
  ).join('\n');

  const systemInstruction = `Tu es un expert du dispositif CEE (Certificats d'Économies d'Énergie) pour le Ministère de la Transition Écologique.
Aujourd'hui nous sommes le ${new Date(referenceDate).toLocaleDateString('fr-FR')}.

INSTRUCTIONS :
1. Utilise prioritairement le contexte local fourni.
2. Si l'information est absente, utilise Google Search pour trouver les dernières réglementations sur ecologie.gouv.fr.
3. Sois précis, technique et cite toujours tes sources (codes fiches BAR-TH-164, etc.).
4. Réponds en français de manière concise et professionnelle.

CONTEXTE LOCAL :
${policyContext || 'Aucun document général.'}
${ficheContext || 'Aucune fiche technique spécifique.'}`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: MODEL_NAME,
      contents: [{ parts: [{ text: query }] }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2,
        tools: [{ googleSearch: {} }],
      },
    });

    const getGroundingSources = (finalResponse: GenerateContentResponse): GroundingSource[] => {
      const sources: GroundingSource[] = [];
      
      // 1. Extract sources from Google Search Grounding Metadata
      const chunks = finalResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web?.uri) {
            sources.push({
              title: chunk.web.title || "Source Web Officielle",
              url: chunk.web.uri
            });
          }
        });
      }

      // 2. Cross-reference with our local context items based on mention in text
      const text = finalResponse.text || "";
      contextItems.forEach(item => {
        const identifier = item.code || item.title;
        if (text.toLowerCase().includes(identifier.toLowerCase())) {
          sources.push({ title: identifier, url: item.url });
        }
      });

      // Deduplicate by URL
      return Array.from(new Map(sources.map(s => [s.url, s])).values());
    };

    return {
      stream: responseStream,
      getGroundingSources
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};