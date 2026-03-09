import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { Lead } from "../types";

const EXPERT_AI_CONTEXT = `
Expert.ai es líder en inteligencia artificial para la comprensión del lenguaje natural (NLU). 
Sus soluciones ayudan a las empresas a:
1. Automatizar procesos cognitivos complejos.
2. Extraer datos valiosos de documentos no estructurados.
3. Clasificar información a escala con precisión humana.
4. Mejorar la toma de decisiones mediante el análisis profundo del lenguaje.
Sectores clave: Seguros, Banca, Defensa, Medios, Energía.
`;

export async function generateSalesScript(lead: Lead): Promise<{ 
  step1: string, 
  step2: string, 
  step3: string,
  icebreaker: string,
  discProfile: {
    type: 'D' | 'I' | 'S' | 'C',
    label: string,
    description: string,
    tips: string[]
  }
}> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  
  const prompt = `
    Actúa como un consultor experto en ventas de IA y procesamiento de lenguaje natural.
    Genera una secuencia de 3 pasos de contacto (Cold Outreach) para el siguiente lead, basándote en los servicios de expert.ai.
    Además, realiza un análisis de personalidad (DISC) y genera un "Icebreaker" hiper-personalizado.
    
    DATOS DEL LEAD:
    - Nombre: ${lead.contactName}
    - Cargo: ${lead.position}
    - Empresa: ${lead.companyName}
    - Sector: ${lead.sector}
    - Problema Detectado: ${lead.potentialProblem}
    - Evento Disparador (Trigger Event): ${lead.triggerEvent || 'N/A'}
    ${lead.potentialProjects ? `- Proyectos IA Sugeridos: ${lead.potentialProjects.map(p => `${p.title} (${p.description})`).join('; ')}` : ''}
    
    CONTEXTO DE EXPERT.AI:
    ${EXPERT_AI_CONTEXT}
    
    REQUISITOS DE LA SECUENCIA:
    1. Paso 1: Email inicial (Gancho basado en el Trigger Event).
    2. Paso 2: Mensaje de LinkedIn (Breve, conectando con el email anterior).
    3. Paso 3: Email de seguimiento (Aportando valor adicional o caso de éxito).
    4. Icebreaker: Una frase inicial única y sorprendente basada en el cargo o el trigger event.
    5. Análisis DISC: Determina si el perfil es Dominante (D), Influyente (I), Sereno (S) o Cumplidor (C). Proporciona una descripción y 3 consejos para venderle.
    
    Idioma: Español.
    Formato de salida: JSON con las claves "step1", "step2", "step3", "icebreaker", "discProfile".
    discProfile debe tener: "type" (D, I, S o C), "label", "description", "tips" (array de 3 strings).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error generating sequence:", error);
    return {
      step1: "Error al generar el email inicial.",
      step2: "Error al generar el mensaje de LinkedIn.",
      step3: "Error al generar el seguimiento.",
      icebreaker: "Error al generar el icebreaker.",
      discProfile: {
        type: 'D',
        label: "Error",
        description: "No se pudo analizar la personalidad.",
        tips: ["Inténtalo de nuevo"]
      }
    };
  }
}
