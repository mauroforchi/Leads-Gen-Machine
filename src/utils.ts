import { Lead, SearchCriteria, INDUSTRIES } from "./types";

const PROBLEMS = [
  "Baja eficiencia en el procesamiento de datos no estructurados.",
  "Dificultad para extraer insights accionables de documentos legales.",
  "Procesos manuales lentos en la clasificación de correos de clientes.",
  "Falta de automatización en el análisis de sentimiento de redes sociales.",
  "Riesgos de cumplimiento por falta de monitoreo inteligente de noticias.",
  "Inconsistencia en la categorización de catálogos de productos.",
];

const DOMAINS = ["tech.com", "corp.net", "solutions.io", "global.biz", "enterprise.org"];

const PROJECTS_BY_INDUSTRY: Record<string, any[]> = {
  "Finanzas": [
    { title: "Análisis de Riesgo con NLP", description: "Automatización de la revisión de informes financieros para detectar señales de riesgo temprano.", impact: "Alto", complexity: "Media", estimatedROI: "25%", technologies: ["NLU", "Sentiment Analysis"] },
    { title: "Detección de Fraude en Tiempo Real", description: "Identificación de patrones anómalos en transacciones bancarias mediante análisis semántico.", impact: "Alto", complexity: "Alta", estimatedROI: "40%", technologies: ["Knowledge Graph", "ML"] }
  ],
  "Salud": [
    { title: "Triaje Inteligente de Pacientes", description: "Clasificación automática de síntomas reportados por pacientes para priorizar urgencias.", impact: "Alto", complexity: "Media", estimatedROI: "15%", technologies: ["NLU", "Entity Extraction"] },
    { title: "Análisis de Ensayos Clínicos", description: "Extracción de datos clave de miles de documentos de investigación médica.", impact: "Medio", complexity: "Alta", estimatedROI: "30%", technologies: ["NLP", "Data Extraction"] }
  ],
  "Retail": [
    { title: "Categorización de Catálogo", description: "Clasificación automática de miles de SKUs basada en descripciones de producto.", impact: "Medio", complexity: "Baja", estimatedROI: "20%", technologies: ["Taxonomy", "NLU"] },
    { title: "Análisis de Voz del Cliente", description: "Procesamiento de reseñas y comentarios para identificar tendencias de mercado.", impact: "Alto", complexity: "Media", estimatedROI: "35%", technologies: ["Sentiment Analysis", "Topic Modeling"] }
  ],
  "General": [
    { title: "Automatización de Soporte", description: "Clasificación y respuesta automática a tickets de soporte técnico.", impact: "Alto", complexity: "Baja", estimatedROI: "50%", technologies: ["NLU", "Intent Recognition"] },
    { title: "Gestión de Contratos", description: "Extracción de cláusulas críticas y fechas de vencimiento de documentos legales.", impact: "Alto", complexity: "Media", estimatedROI: "45%", technologies: ["Entity Extraction", "Knowledge Graph"] }
  ]
};

export const generateMockLeads = (criteria: SearchCriteria): Lead[] => {
  const count = Math.floor(Math.random() * 10) + 20; // Generate 20-30 leads
  const leads: Lead[] = [];

  for (let i = 0; i < count; i++) {
    const company = criteria.company || `Empresa ${String.fromCharCode(65 + i)}${Math.floor(Math.random() * 100)}`;
    const firstName = ["Ana", "Carlos", "Elena", "David", "Laura", "Miguel", "Sofia", "Jorge"][Math.floor(Math.random() * 8)];
    const lastName = ["García", "Rodríguez", "López", "Martínez", "Sánchez", "Pérez", "Gómez"][Math.floor(Math.random() * 7)];
    
    const industry = criteria.industry.length > 0 
      ? criteria.industry[Math.floor(Math.random() * criteria.industry.length)]
      : INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)];
    
    const industryProjects = PROJECTS_BY_INDUSTRY[industry] || PROJECTS_BY_INDUSTRY["General"];

    const position = criteria.position.length > 0 
      ? criteria.position[Math.floor(Math.random() * criteria.position.length)]
      : "Director de Innovación";

    leads.push({
      id: Math.random().toString(36).substr(2, 9),
      companyName: company,
      sector: industry,
      industry: industry,
      size: criteria.companySize.length > 0 
        ? criteria.companySize[Math.floor(Math.random() * criteria.companySize.length)]
        : "51-200",
      location: `${criteria.city || "Madrid"}, ${criteria.country || "España"}`,
      contactName: `${firstName} ${lastName}`,
      position: position,
      potentialProblem: PROBLEMS[Math.floor(Math.random() * PROBLEMS.length)],
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${DOMAINS[Math.floor(Math.random() * DOMAINS.length)]}`,
      verificationScore: Math.floor(Math.random() * 30) + 70, // 70-100%
      triggerEvent: "Expansión de mercado detectada recientemente",
      triggerDate: "2024-02-15",
      triggerSource: "Expansión.com",
      purchaseProbability: Math.floor(Math.random() * 60) + 20, // 20-80%
      scoringFactors: [
        { label: "Nivel de Dolor", score: Math.floor(Math.random() * 5) + 5 },
        { label: "Poder de Decisión", score: Math.floor(Math.random() * 5) + 5 },
        { label: "Relevancia Trigger", score: Math.floor(Math.random() * 5) + 5 },
        { label: "Potencial Presupuesto", score: Math.floor(Math.random() * 5) + 5 },
        { label: "Urgencia de Compra", score: Math.floor(Math.random() * 5) + 5 },
      ],
      potentialProjects: industryProjects.map(p => ({
        ...p,
        id: Math.random().toString(36).substr(2, 9)
      }))
    });
  }

  return leads;
};

// Industries are imported from types.ts
