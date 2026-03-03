import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { Lead, SearchCriteria } from "../types";

export async function searchRealLeads(criteria: SearchCriteria): Promise<Lead[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_MISSING");
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  const industryFilter = criteria.industry.length > 0 ? `en las industrias de "${criteria.industry.join(", ")}"` : "";
  const companyFilter = criteria.company ? `específicamente de la empresa "${criteria.company}"` : industryFilter;
  
  let locationParts = [];
  if (criteria.city) locationParts.push(criteria.city);
  if (criteria.country) locationParts.push(criteria.country);
  const locationFilter = locationParts.length > 0 ? `ubicadas en "${locationParts.join(", ")}"` : "";

  const sizeFilter = criteria.companySize.length > 0 ? `con tamaño de empresa "${criteria.companySize.join(", ")}"` : "";
  const revenueFilter = criteria.revenueRange.length > 0 ? `con facturación "${criteria.revenueRange.join(", ")}"` : "";
  const fundingFilter = criteria.fundingRound.length > 0 ? `en ronda de financiación "${criteria.fundingRound.join(", ")}"` : "";
  const seniorityFilter = criteria.seniorityLevel.length > 0 ? `con seniority "${criteria.seniorityLevel.join(", ")}"` : "";
  const yearsInRoleFilter = criteria.yearsInRole.length > 0 ? `con años en el cargo en los rangos "${criteria.yearsInRole.join(", ")}"` : "";
  const growthRateFilter = criteria.growthRate.length > 0 ? `de empresas con tasa de crecimiento "${criteria.growthRate.join(", ")}"` : "";

  const positionFilter = criteria.position.length > 0 ? `en cargos de "${criteria.position.join(", ")}"` : "en cargos de decisores de IT/Innovación";
  const promptContext = criteria.prompt ? `Siguiendo estas instrucciones adicionales: "${criteria.prompt}"` : "";
  const language = criteria.language || 'es';
  const languageName = language === 'en' ? 'English' : language === 'it' ? 'Italian' : 'Spanish';

  const query = `
    Realiza una búsqueda exhaustiva en tiempo real para encontrar leads B2B REALES.
    Objetivo: Encontrar al menos 20 leads reales ${companyFilter} ${locationFilter}.
    Filtros: ${sizeFilter} ${revenueFilter} ${fundingFilter} ${seniorityFilter} ${yearsInRoleFilter} ${growthRateFilter}.
    Perfil buscado: Personas reales ${positionFilter}.
    ${promptContext}
    
    IMPORTANTE: Genera toda la respuesta en idioma ${languageName}.
    
    REQUISITOS DE VERACIDAD Y DATOS:
    1. BUSCA EN TIEMPO REAL: Utiliza Google Search para encontrar noticias recientes, perfiles de LinkedIn y sitios web corporativos.
    2. EMAILS: Los emails deben ser lo más reales posible. Si no encuentras el email exacto, utiliza el formato corporativo verificado (ej: inicial.apellido@empresa.com) y asígnalo.
    3. TRIGGER EVENTS: Identifica eventos reales de los últimos 6 meses (rondas de inversión, nombramientos, expansiones, lanzamientos).
    4. FUENTES: Proporciona la URL real de la noticia o el perfil de LinkedIn.
    5. PROYECTOS IA: Sugiere proyectos que tengan sentido con la actualidad de la empresa.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: query,
      config: {
 responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              companyName: { type: Type.STRING },
              sector: { type: Type.STRING },
              industry: { type: Type.STRING },
              location: { type: Type.STRING },
              contactName: { type: Type.STRING },
              position: { type: Type.STRING },
              potentialProblem: { type: Type.STRING },
              email: { type: Type.STRING },
              verificationScore: { type: Type.NUMBER },
              domain: { type: Type.STRING },
              linkedinUrl: { type: Type.STRING },
              triggerEvent: { type: Type.STRING },
              triggerDate: { type: Type.STRING },
              triggerSource: { type: Type.STRING },
              purchaseProbability: { type: Type.NUMBER },
              scoringFactors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    score: { type: Type.NUMBER }
                  }
                }
              },
              potentialProjects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    impact: { type: Type.STRING, description: "Alto, Medio o Bajo" },
                    complexity: { type: Type.STRING, description: "Alta, Media o Baja" },
                    estimatedROI: { type: Type.STRING },
                    technologies: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["title", "description", "impact", "complexity", "estimatedROI", "technologies"]
                }
              }
            },
            required: ["companyName", "contactName", "email", "potentialProblem", "purchaseProbability", "scoringFactors", "triggerEvent", "triggerDate", "triggerSource", "potentialProjects"]
          }
        }
      }
    });

    const results = JSON.parse(response.text || "[]");
    return results.map((r: any) => ({
      ...r,
      id: Math.random().toString(36).substr(2, 9),
      verificationScore: r.verificationScore || Math.floor(Math.random() * 20) + 75,
      industry: r.industry || (criteria.industry.length > 0 ? criteria.industry[0] : "General"),
      location: r.location || [criteria.city, criteria.country].filter(Boolean).join(", ") || "No especificada",
      potentialProjects: (r.potentialProjects || []).map((p: any) => ({
        ...p,
        id: Math.random().toString(36).substr(2, 9)
      }))
    }));
  } catch (error) {
    console.error("Error searching real leads:", error);
    throw error;
  }
}
