export type Language = 'es' | 'en' | 'it';

export interface SearchSession {
  id: string;
  timestamp: number;
  criteria: SearchCriteria;
  leads: Lead[];
  name?: string;
}

export interface Lead {
  id: string;
  companyName: string;
  sector: string;
  industry: string;
  size: string;
  location: string;
  contactName: string;
  position: string;
  potentialProblem: string;
  email: string;
  verificationScore: number;
  verificationDetails?: string[];
  domain?: string;
  linkedinUrl?: string;
  triggerEvent?: string;
  triggerDate?: string;
  triggerSource?: string;
  purchaseProbability: number; // 0-100
  scoringFactors: {
    label: string;
    score: number; // 0-10
  }[];
  followupSequence?: {
    step1: string; // Initial Email
    step2: string; // LinkedIn Message
    step3: string; // Follow-up Email
  };
  potentialProjects?: AIProject[];
  status?: 'new' | 'contacted';
  discProfile?: {
    type: 'D' | 'I' | 'S' | 'C';
    label: string;
    description: string;
    tips: string[];
  };
  icebreaker?: string;
  isEnriched?: boolean;
  phone?: string;
}

export interface AIProject {
  id: string;
  title: string;
  description: string;
  impact: 'Alto' | 'Medio' | 'Bajo';
  complexity: 'Alta' | 'Media' | 'Baja';
  estimatedROI: string;
  technologies: string[];
}

export interface SearchCriteria {
  industry: string[];
  country: string;
  city: string;
  company: string;
  companySize: string[];
  position: string[];
  positionArea: string;
  revenueRange: string[];
  fundingRound: string[];
  growthRate: string[];
  hiringStatus?: boolean;
  seniorityLevel: string[];
  yearsInRole: string[];
  educationLevel?: string;
  prompt?: string;
  language?: Language;
}

export const COMPANY_SIZES = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
];

export const INDUSTRIES = [
  "Tecnología",
  "Finanzas",
  "Banca",
  "Seguros",
  "Salud",
  "Farmacéutica",
  "Manufactura",
  "Automotriz",
  "Retail",
  "E-commerce",
  "Energía",
  "Telecomunicaciones",
  "Educación",
  "Logística",
  "Turismo",
  "Construcción",
  "Inmobiliario / Real Estate",
  "PropTech",
  "Gestión de Activos / Asset Management",
  "Inversión Inmobiliaria",
  "Desarrollo Urbano",
  "Arquitectura y Diseño",
  "Administración de Fincas",
  "Defensa",
  "Medios",
  "Consultoría",
  "Agricultura",
  "Alimentación y Bebidas",
  "Moda / Fashion",
  "Servicios Profesionales",
];

export const POSITIONS = [
  "CEO / Director General",
  "CTO / Director de Tecnología",
  "COO / Director de Operaciones",
  "CMO / Director de Marketing",
  "CDO / Director de Datos",
  "Director de Innovación",
  "Director de IT",
  "Responsable de Transformación Digital",
  "Gerente de Operaciones",
  "Jefe de Estrategia",
  "Director de Recursos Humanos",
  "Director Legal / Compliance",
  "VP de Ingeniería",
  "Gerente de Producto",
  "Director de Logística",
  "Director de E-commerce",
  "Head of AI / Data Science",
  "Director de Sostenibilidad / ESG",
  "Director de Expansión Internacional",
  "Director de Compras / Procurement",
  "Director de Ventas / Sales Director",
  "Director de Customer Success",
  "Chief of Staff",
  "Director de Estrategia Digital",
  "Director de Ciberseguridad / CISO",
  "Director Financiero / CFO",
];

export const YEARS_IN_ROLE_RANGES = [
  "0 - 5 años",
  "5 - 10 años",
  "10 - 15 años",
  "15 - 20 años",
  "20+ años",
];

export const GROWTH_RATE_RANGES = [
  "< 0% (Decrecimiento)",
  "0 - 10% (Estable)",
  "10 - 25% (Crecimiento Moderado)",
  "25 - 50% (Crecimiento Rápido)",
  "50 - 100% (Crecimiento Acelerado)",
  "> 100% (Hipercrecimiento)",
];

export const REVENUE_RANGES = [
  "< 1M€",
  "1M€ - 10M€",
  "10M€ - 50M€",
  "50M€ - 250M€",
  "250M€ - 1B€",
  "> 1B€",
];

export const SENIORITY_LEVELS = [
  "C-Level / Ejecutivo",
  "VP / Vicepresidente",
  "Senior Director",
  "Director",
  "Manager / Head of",
  "Principal / Lead",
  "Senior Individual Contributor",
  "Founder / Co-Founder",
  "Board Member / Asesor",
  "Partner / Socio",
];

export const FUNDING_ROUNDS = [
  "Bootstrapped",
  "Seed / Pre-Seed",
  "Series A",
  "Series B",
  "Series C+",
  "Public (IPO)",
];
