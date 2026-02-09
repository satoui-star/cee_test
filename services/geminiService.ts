import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { CeeKnowledgeItem, GroundingSource } from "../types";

// Modèle recommandé pour les tâches générales
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
  // Utilisation directe de process.env.API_KEY injecté par Vite
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "") {
    throw new Error("Clé API manquante ou vide. Assurez-vous d'avoir configuré API_KEY dans Vercel.");
  }

  // Initialisation à chaque appel pour garantir l'utilisation de la clé la plus récente
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
1. Utilise prioritairement le contexte local fourni pour répondre.
2. Utilise Google Search pour compléter les informations si nécessaire ou trouver les dernières mises à jour.
3. Sois technique et cite les fiches (ex: BAR-TH-164).
4. Réponds en français.

CONTEXTE LOCAL :
${policyContext || 'Aucun document général.'}
${ficheContext || 'Aucune fiche technique spécifique.'}`;

  const responseStream = await ai.models.generateContentStream({
    model: MODEL_NAME,
    contents: [{ parts: [{ text: query }] }],
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.1,
      tools: [{ googleSearch: {} }],
    },
  });

  const getGroundingSources = (finalResponse: GenerateContentResponse): GroundingSource[] => {
    const sources: GroundingSource[] = [];
    
    // Extraction des sources de recherche Google
    const chunks = finalResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          sources.push({
            title: chunk.web.title || "Source Officielle",
            url: chunk.web.uri
          });
        }
      });
    }

    // Références croisées avec le contexte local
    const text = finalResponse.text || "";
    contextItems.forEach(item => {
      const identifier = item.code || item.title;
      if (text.toLowerCase().includes(identifier.toLowerCase())) {
        sources.push({ title: identifier, url: item.url });
      }
    });

    return Array.from(new Map(sources.map(s => [s.url, s])).values());
  };

  return {
    stream: responseStream,
    getGroundingSources
  };
};