import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Users, 
  BarChart3, 
  FileText, 
  Download, 
  Plus, 
  Mail, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  Briefcase,
  ChevronRight,
  Loader2,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Target,
  History,
  Trash2,
  Calendar,
  Zap,
  Magnet,
  Thermometer,
  ExternalLink,
  RefreshCw,
  Lightbulb,
  Rocket,
  Shield,
  Cpu,
  Check,
  ChevronDown,
  X,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { cn } from './lib/utils';
import { 
  YEARS_IN_ROLE_RANGES,
  GROWTH_RATE_RANGES,
  Lead, 
  SearchCriteria, 
  COMPANY_SIZES, 
  INDUSTRIES, 
  POSITIONS, 
  SearchSession,
  REVENUE_RANGES,
  SENIORITY_LEVELS,
  FUNDING_ROUNDS,
  Language
} from './types';
import { generateMockLeads } from './utils';
import { generateSalesScript } from './services/geminiService';
import { searchRealLeads } from './services/leadSearchService';
import { useTranslation } from './i18n';

function MultiSelect({ 
  label, 
  options, 
  selected, 
  onChange, 
  placeholder = "Seleccionar..." 
}: { 
  label: string, 
  options: string[], 
  selected: string[], 
  onChange: (val: string[]) => void,
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="space-y-1.5 relative">
      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">{label}</label>
      <div 
        className="min-h-[44px] w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500 outline-none transition-all cursor-pointer flex items-center justify-between gap-2 flex-wrap"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1">
          {selected.length === 0 ? (
            <span className="text-gray-400 text-sm">{placeholder}</span>
          ) : (
            selected.map(s => (
              <span key={s} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                {s}
                <X 
                  size={10} 
                  className="cursor-pointer hover:text-white/70" 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOption(s);
                  }} 
                />
              </span>
            ))
          )}
        </div>
        <ChevronDown size={16} className={cn("text-gray-400 transition-transform", isOpen && "rotate-180")} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-20 top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto p-2"
            >
              {options.map(option => (
                <div 
                  key={option}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors",
                    selected.includes(option) ? "bg-indigo-50 font-bold text-indigo-700" : "text-gray-600"
                  )}
                  onClick={() => toggleOption(option)}
                >
                  {option}
                  {selected.includes(option) && <Check size={14} className="text-indigo-600" />}
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const MemoizedMultiSelect = React.memo(MultiSelect);

export default function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'leads' | 'dashboard' | 'script' | 'history' | 'projects'>('search');
  const [criteria, setCriteria] = useState<SearchCriteria>({
    industry: [],
    country: '',
    city: '',
    company: '',
    companySize: [],
    position: [],
    positionArea: '',
    revenueRange: [],
    fundingRound: [],
    growthRate: [],
    hiringStatus: false,
    seniorityLevel: [],
    yearsInRole: [],
    educationLevel: '',
    prompt: '',
  });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [salesScript, setSalesScript] = useState<{ step1: string, step2: string, step3: string } | null>(null);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [language, setLanguage] = useState<Language>('es');
  const { t } = useTranslation(language);
  
  const toggleLeadStatus = (leadId: string) => {
    setLeads(prev => prev.map(lead => 
      lead.id === leadId 
        ? { ...lead, status: lead.status === 'contacted' ? 'new' : 'contacted' } 
        : lead
    ));
  };
  
  // Script cache to avoid redundant API calls
  const [scriptCache, setScriptCache] = useState<Record<string, { step1: string, step2: string, step3: string }>>({});
  
  const [sessions, setSessions] = useState<SearchSession[]>(() => {
    const saved = localStorage.getItem('leads_gen_pro_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('leads_gen_pro_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const handleSearch = async () => {
    setIsGenerating(true);
    try {
      const realLeads = await searchRealLeads(criteria);
      setLeads(realLeads);
      
      // Save to history
      const newSession: SearchSession = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        criteria: { ...criteria },
        leads: realLeads,
        name: criteria.prompt ? `Prompt: ${criteria.prompt.substring(0, 20)}...` : (criteria.company ? `Búsqueda: ${criteria.company}` : `Búsqueda: ${criteria.industry[0] || 'General'}`)
      };
      setSessions(prev => [newSession, ...prev]);
      
      setActiveTab('leads');
    } catch (error: any) {
      console.error("Error fetching real leads:", error);
      const newLeads = generateMockLeads(criteria);
      setLeads(newLeads);
      
      const newSession: SearchSession = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        criteria: { ...criteria },
        leads: newLeads,
        name: `(Demo) ${criteria.company || criteria.industry[0] || 'General'}`
      };
      setSessions(prev => [newSession, ...prev]);
      
      if (error.message === "GEMINI_API_KEY_MISSING") {
        alert(t('apiKeyMissing'));
      } else {
        alert(t('realTimeError'));
      }
      setActiveTab('leads');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateScript = async (lead: Lead) => {
    setSelectedLead(lead);
    setActiveStep(1);
    setActiveTab('script');

    // Check cache first
    if (scriptCache[lead.id]) {
      setSalesScript(scriptCache[lead.id]);
      return;
    }

    setSalesScript(null);
    setIsGeneratingScript(true);
    try {
      const sequence = await generateSalesScript(lead);
      setSalesScript(sequence);
      setScriptCache(prev => ({ ...prev, [lead.id]: sequence }));
    } catch (error) {
      console.error("Error generating script:", error);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Empresa', 'Sector', 'Ubicación', 'Contacto', 'Cargo', 'Problema Potencial', 'Email', 'Verificación %'];
    const rows = leads.map(l => [
      l.companyName,
      l.sector,
      l.location,
      l.contactName,
      l.position,
      l.potentialProblem,
      l.email,
      `${l.verificationScore}%`
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "leads_gen_pro_export.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentStats = useMemo(() => {
    if (leads.length === 0) return null;
    const avgVerification = Math.round(leads.reduce((acc, curr) => acc + curr.verificationScore, 0) / leads.length);
    const sectors = leads.reduce((acc: any, curr) => {
      acc[curr.sector] = (acc[curr.sector] || 0) + 1;
      return acc;
    }, {});
    const sectorData = Object.keys(sectors).map(key => ({ name: key, value: sectors[key] }));
    return { total: leads.length, avgVerification, sectorData };
  }, [leads]);

  const cumulativeStats = useMemo(() => {
    const allLeads = sessions.flatMap(s => s.leads);
    if (allLeads.length === 0) return null;
    const avgVerification = Math.round(allLeads.reduce((acc, curr) => acc + curr.verificationScore, 0) / allLeads.length);
    const sectors = allLeads.reduce((acc: any, curr) => {
      acc[curr.sector] = (acc[curr.sector] || 0) + 1;
      return acc;
    }, {});
    const sectorData = Object.keys(sectors).map(key => ({ name: key, value: sectors[key] }));
    return { total: allLeads.length, avgVerification, sectorData };
  }, [sessions]);

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="min-h-screen flex bg-[#F8F9FA]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-200 cursor-pointer"
            >
              <Magnet size={24} fill="currentColor" />
            </motion.div>
            <div className="flex flex-col">
              <h1 className="font-bold text-lg tracking-tight leading-none text-gray-900">{t('appName')}</h1>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-2">{t('appDescription')}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem 
            icon={<Search size={20} />} 
            label={t('searchTab')} 
            active={activeTab === 'search'} 
            onClick={() => setActiveTab('search')} 
          />
          <SidebarItem 
            icon={<Users size={20} />} 
            label={t('leadsTab')} 
            active={activeTab === 'leads'} 
            onClick={() => setActiveTab('leads')} 
            badge={leads.length > 0 ? leads.length : undefined}
          />
          <SidebarItem 
            icon={<Lightbulb size={20} />} 
            label={t('projects')} 
            active={activeTab === 'projects'} 
            onClick={() => setActiveTab('projects')} 
            disabled={leads.length === 0}
          />
          <SidebarItem 
            icon={<BarChart3 size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={<History size={20} />} 
            label={t('historyTab')} 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
            badge={sessions.length > 0 ? sessions.length : undefined}
          />
          <SidebarItem 
            icon={<FileText size={20} />} 
            label={t('viewScript')} 
            active={activeTab === 'script'} 
            onClick={() => setActiveTab('script')} 
            disabled={!selectedLead}
          />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Sugerencia Pro</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              Integra con LinkedIn Sales Navigator para una precisión del 100% en cargos.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="font-semibold text-gray-800">
            {activeTab === 'search' && t('searchTab')}
            {activeTab === 'leads' && t('leadsTab')}
            {activeTab === 'dashboard' && 'Análisis de Resultados'}
            {activeTab === 'history' && t('historyTab')}
            {activeTab === 'script' && 'Generador de Scripts IA'}
          </h2>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
              <Globe size={14} className="text-gray-400" />
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-transparent text-xs font-bold text-gray-600 outline-none cursor-pointer"
              >
                <option value="es">{t('spanish')}</option>
                <option value="en">{t('english')}</option>
                <option value="it">{t('italian')}</option>
              </select>
            </div>
            {leads.length > 0 && (
              <button 
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <Download size={16} />
                {t('action')}
              </button>
            )}
            <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-xs font-bold">
              MF
            </div>
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'search' && (
              <motion.div 
                key="search"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <InputGroup label={`${t('additionalPrompt')} *`}>
                      <div className="relative">
                        <textarea 
                          placeholder={t('promptPlaceholder')}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[100px] resize-none"
                          value={criteria.prompt}
                          onChange={(e) => setCriteria({...criteria, prompt: e.target.value})}
                        />
                        <div className="absolute bottom-3 right-3 flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                          <Sparkles size={12} className="text-yellow-400" />
                          Potenciado por Gemini
                        </div>
                      </div>
                    </InputGroup>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Target className="text-blue-600" size={20} />
                      {t('industry')}
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <MemoizedMultiSelect 
                        label={`${t('industry')} *`}
                        options={INDUSTRIES}
                        selected={criteria.industry}
                        onChange={(val) => setCriteria({...criteria, industry: val})}
                        placeholder={t('industry')}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <InputGroup label={`${t('country')} *`}>
                          <input 
                            type="text" 
                            placeholder={t('country')}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            value={criteria.country}
                            onChange={(e) => setCriteria({...criteria, country: e.target.value})}
                          />
                        </InputGroup>
                        <InputGroup label={t('city')}>
                          <input 
                            type="text" 
                            placeholder={t('city')}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            value={criteria.city}
                            onChange={(e) => setCriteria({...criteria, city: e.target.value})}
                          />
                        </InputGroup>
                      </div>

                      <MemoizedMultiSelect 
                        label={`${t('companySize')} *`}
                        options={COMPANY_SIZES}
                        selected={criteria.companySize}
                        onChange={(val) => setCriteria({...criteria, companySize: val})}
                        placeholder={t('companySize')}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <MemoizedMultiSelect 
                          label={`${t('revenue')} *`}
                          options={REVENUE_RANGES}
                          selected={criteria.revenueRange}
                          onChange={(val) => setCriteria({...criteria, revenueRange: val})}
                          placeholder={t('revenue')}
                        />
                        <MemoizedMultiSelect 
                          label={`${t('funding')} *`}
                          options={FUNDING_ROUNDS}
                          selected={criteria.fundingRound}
                          onChange={(val) => setCriteria({...criteria, fundingRound: val})}
                          placeholder={t('funding')}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <MemoizedMultiSelect 
                          label={t('growth')}
                          options={GROWTH_RATE_RANGES}
                          selected={criteria.growthRate}
                          onChange={(val) => setCriteria({...criteria, growthRate: val})}
                          placeholder={t('growth')}
                        />
                        <div className="flex items-end pb-3">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input 
                              type="checkbox" 
                              className="w-5 h-5 rounded border-gray-200 text-black focus:ring-black"
                              checked={criteria.hiringStatus}
                              onChange={(e) => setCriteria({...criteria, hiringStatus: e.target.checked})}
                            />
                            <span className="text-sm font-bold text-gray-600 group-hover:text-black transition-colors">Contratando actualmente</span>
                          </label>
                        </div>
                      </div>

                      </div>
                    </div>

                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Users className="text-emerald-600" size={20} />
                      {t('contactPosition')}
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <MemoizedMultiSelect 
                        label={`${t('seniority')} *`}
                        options={SENIORITY_LEVELS}
                        selected={criteria.seniorityLevel}
                        onChange={(val) => setCriteria({...criteria, seniorityLevel: val})}
                        placeholder={t('seniority')}
                      />
                      <MemoizedMultiSelect 
                        label={t('yearsInRole')}
                        options={YEARS_IN_ROLE_RANGES}
                        selected={criteria.yearsInRole}
                        onChange={(val) => setCriteria({...criteria, yearsInRole: val})}
                        placeholder={t('yearsInRole')}
                      />

                      <InputGroup label="Nivel Educativo / Certificaciones">
                        <input 
                          type="text" 
                          placeholder="Ej: MBA, PhD, Certificación AWS"
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          value={criteria.educationLevel}
                          onChange={(e) => setCriteria({...criteria, educationLevel: e.target.value})}
                        />
                      </InputGroup>

                      <MemoizedMultiSelect 
                        label={`${t('position')} *`}
                        options={POSITIONS}
                        selected={criteria.position}
                        onChange={(val) => setCriteria({...criteria, position: val})}
                        placeholder={t('position')}
                      />
                      <InputGroup label={t('positionArea')}>
                        <input 
                          type="text" 
                          placeholder="Ej: Operaciones, IT, Legal"
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          value={criteria.positionArea}
                          onChange={(e) => setCriteria({...criteria, positionArea: e.target.value})}
                        />
                      </InputGroup>
                      <InputGroup label="Compañía Específica">
                        <input 
                          type="text" 
                          placeholder="Ej: Telefónica"
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          value={criteria.company}
                          onChange={(e) => setCriteria({...criteria, company: e.target.value})}
                        />
                      </InputGroup>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-100 flex justify-center">
                  <button 
                    onClick={handleSearch}
                    disabled={isGenerating}
                    className="group relative flex items-center gap-3 px-12 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white rounded-2xl font-bold text-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-purple-200"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="animate-spin" size={24} />
                        {t('searching')}
                      </>
                    ) : (
                      <>
                        <Sparkles size={24} className="text-yellow-400 group-hover:rotate-12 transition-transform" />
                        {t('generateLeads')}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'leads' && (
              <motion.div 
                key="leads"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {leads.length === 0 ? (
                  <EmptyState 
                    title={t('noLeads')} 
                    description={t('noLeadsDesc')}
                    action={() => setActiveTab('search')}
                  />
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center gap-2">
                      <Shield size={14} className="text-amber-600" />
                      <p className="text-[10px] text-amber-700 font-medium">
                        {t('emailDisclaimer')}
                      </p>
                    </div>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('companySector')}</th>
                          <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('contactPosition')}</th>
                          <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('problemTrigger')}</th>
                          <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('emailLinkedin')}</th>
                          <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">{t('status')}</th>
                          <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">{t('score')}</th>
                          <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">{t('action')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {leads.map((lead) => (
                          <tr 
                            key={lead.id} 
                            className="hover:bg-gray-50 transition-colors group cursor-pointer"
                            onClick={() => handleGenerateScript(lead)}
                          >
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                                  <Building2 size={16} />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-gray-900 text-xs truncate">{lead.companyName}</p>
                                  <p className="text-[10px] text-gray-500 truncate">{lead.sector}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <p className="font-semibold text-gray-900 text-xs">{lead.contactName}</p>
                              <p className="text-[10px] text-gray-500 truncate max-w-[150px]">{lead.position}</p>
                              {lead.potentialProjects && lead.potentialProjects.length > 0 && (
                                <div className="mt-1 flex items-center gap-1 text-[8px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full w-fit uppercase tracking-tighter">
                                  <Rocket size={8} />
                                  {lead.potentialProjects.length} Proyectos IA
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2 max-w-[200px]">
                              <p className="text-[11px] text-gray-600 line-clamp-1 italic">"{lead.potentialProblem}"</p>
                              {lead.triggerEvent && (
                                <div className="mt-0.5 flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1 text-[9px] font-bold text-amber-600 uppercase bg-amber-50 px-1 py-0.25 rounded w-fit">
                                    <Zap size={8} />
                                    <span className="truncate max-w-[120px]">{lead.triggerEvent}</span>
                                  </div>
                                  {(lead.triggerDate || lead.triggerSource) && (
                                    <p className="text-[8px] text-gray-400 flex items-center gap-1 ml-1">
                                      {lead.triggerDate && <span>{lead.triggerDate}</span>}
                                      {lead.triggerDate && lead.triggerSource && <span>•</span>}
                                      {lead.triggerSource && <span className="truncate max-w-[80px]">{lead.triggerSource}</span>}
                                    </p>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                              <div className="flex flex-col">
                                <a href={`mailto:${lead.email}`} className="text-[11px] text-gray-600 hover:text-blue-600 transition-colors truncate max-w-[180px]">{lead.email}</a>
                                {lead.linkedinUrl && (
                                  <a 
                                    href={lead.linkedinUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-[9px] text-blue-500 hover:underline flex items-center gap-1"
                                  >
                                    <ExternalLink size={10} />
                                    LinkedIn
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => toggleLeadStatus(lead.id)}
                                className={cn(
                                  "px-2 py-1 rounded-full text-[9px] font-bold uppercase transition-all",
                                  lead.status === 'contacted' 
                                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                                    : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
                                )}
                              >
                                {lead.status === 'contacted' ? 'Contactado' : 'Pendiente'}
                              </button>
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1">
                                  <div className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    lead.purchaseProbability > 70 ? "bg-red-500 animate-pulse" : 
                                    lead.purchaseProbability > 40 ? "bg-amber-500" : "bg-blue-500"
                                  )} />
                                  <span className="text-[11px] font-bold">{lead.purchaseProbability}%</span>
                                </div>
                                <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden mt-1">
                                  <div 
                                    className={cn(
                                      "h-full rounded-full",
                                      lead.verificationScore > 90 ? "bg-emerald-500" : 
                                      lead.verificationScore > 80 ? "bg-blue-500" : "bg-amber-500"
                                    )}
                                    style={{ width: `${lead.verificationScore}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-right">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGenerateScript(lead);
                                }}
                                className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-600 hover:text-white transition-all"
                              >
                                <Sparkles size={12} />
                                Script
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-12"
              >
                {/* Current Search Dashboard */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Target className="text-blue-600" size={20} />
                      Búsqueda Actual
                    </h3>
                  </div>
                  {!currentStats ? (
                    <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center">
                      <p className="text-gray-500">No hay datos de búsqueda actual. Genera leads para ver estadísticas.</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard 
                          icon={<Users className="text-blue-600" />} 
                          label="Leads Actuales" 
                          value={currentStats.total} 
                          trend="Sesión activa"
                        />
                        <StatCard 
                          icon={<CheckCircle2 className="text-emerald-600" />} 
                          label="Verificación Media" 
                          value={`${currentStats.avgVerification}%`} 
                          trend="Calidad Actual"
                        />
                        <StatCard 
                          icon={<TrendingUp className="text-purple-600" />} 
                          label="Oportunidades" 
                          value={Math.round(currentStats.total * 0.4)} 
                          trend="Estimado"
                        />
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <DashboardChart title="Sectores (Actual)" data={currentStats.sectorData} />
                        <DashboardPie title="Calidad (Actual)" data={currentStats.sectorData} />
                      </div>
                    </>
                  )}
                </section>

                {/* Cumulative History Dashboard */}
                <section className="space-y-6 pt-12 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <TrendingUp className="text-emerald-600" size={20} />
                      Dashboard Acumulativo (Histórico)
                    </h3>
                  </div>
                  {!cumulativeStats ? (
                    <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center">
                      <p className="text-gray-500">El historial está vacío. Tus búsquedas se acumularán aquí.</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard 
                          icon={<Briefcase className="text-indigo-600" />} 
                          label="Total Histórico" 
                          value={cumulativeStats.total} 
                          trend={`${sessions.length} sesiones`}
                        />
                        <StatCard 
                          icon={<CheckCircle2 className="text-emerald-600" />} 
                          label="Verificación Global" 
                          value={`${cumulativeStats.avgVerification}%`} 
                          trend="Promedio Total"
                        />
                        <StatCard 
                          icon={<TrendingUp className="text-purple-600" />} 
                          label="Conversión Est." 
                          value={Math.round(cumulativeStats.total * 0.15)} 
                          trend="Basado en histórico"
                        />
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <DashboardChart title="Sectores Globales" data={cumulativeStats.sectorData} />
                        <DashboardPie title="Mix de Mercado" data={cumulativeStats.sectorData} />
                      </div>
                    </>
                  )}
                </section>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {sessions.length === 0 ? (
                  <EmptyState 
                    title="Historial vacío" 
                    description="Tus búsquedas guardadas aparecerán aquí para que puedas retomarlas en cualquier momento."
                    action={() => setActiveTab('search')}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <button 
                        onClick={() => {
                          if (confirm('¿Estás seguro de que deseas borrar todo el historial?')) {
                            setSessions([]);
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl text-sm font-bold transition-all"
                      >
                        <Trash2 size={16} />
                        Borrar Todo el Historial
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                    {sessions.map((session) => (
                      <div key={session.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-colors">
                              <Calendar size={24} />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900">{session.name || 'Búsqueda sin nombre'}</h4>
                              <p className="text-xs text-gray-500 flex items-center gap-2">
                                {new Date(session.timestamp).toLocaleString()} • {session.leads.length} leads encontrados
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                setLeads(session.leads);
                                setCriteria(session.criteria);
                                setActiveTab('leads');
                              }}
                              className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-bold hover:bg-black hover:text-white transition-all"
                            >
                              {t('viewLeads')}
                            </button>
                            <button 
                              onClick={() => {
                                setSessions(prev => prev.filter(s => s.id !== session.id));
                              }}
                              className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {session.criteria.industry && <span className="text-[10px] px-2 py-1 bg-blue-50 text-blue-600 rounded-md font-bold uppercase">{session.criteria.industry}</span>}
                          {session.criteria.country && <span className="text-[10px] px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md font-bold uppercase">{session.criteria.country}</span>}
                          {session.criteria.position && <span className="text-[10px] px-2 py-1 bg-purple-50 text-purple-600 rounded-md font-bold uppercase">{session.criteria.position}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </motion.div>
            )}

            {activeTab === 'projects' && (
              <motion.div 
                key="projects"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{t('projects')}</h2>
                    <p className="text-sm text-gray-500">{t('projectsDesc')}</p>
                  </div>
                </div>

                {leads.length === 0 ? (
                  <EmptyState 
                    title={t('noLeadsAnalyze')} 
                    description={t('noLeadsAnalyzeDesc')}
                    action={() => setActiveTab('search')}
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-8">
                    {leads.filter(l => l.potentialProjects && l.potentialProjects.length > 0).map((lead) => (
                      <div key={lead.id} className="space-y-4">
                        <div className="flex items-center gap-3 px-2">
                          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
                            <Building2 size={16} />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{lead.companyName}</h3>
                            <p className="text-xs text-gray-500">{lead.industry} • {lead.contactName} ({lead.position})</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {lead.potentialProjects?.map((project) => (
                            <div key={project.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col">
                              <div className="flex items-start justify-between mb-4">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                  <Rocket size={20} />
                                </div>
                                <div className="flex gap-2">
                                  <span className={cn(
                                    "text-[10px] font-bold px-2 py-1 rounded-full uppercase",
                                    project.impact === 'Alto' ? "bg-red-50 text-red-600" : 
                                    project.impact === 'Medio' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                                  )}>
                                    {t('impact')} {project.impact}
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded-full uppercase">
                                    ROI {project.estimatedROI}
                                  </span>
                                </div>
                              </div>
                              
                              <h4 className="font-bold text-gray-900 mb-2">{project.title}</h4>
                              <p className="text-sm text-gray-600 mb-4 flex-grow">{project.description}</p>
                              
                              <div className="flex flex-wrap gap-2 mb-4">
                                {project.technologies.map(tech => (
                                  <span key={tech} className="text-[10px] font-medium px-2 py-0.5 bg-gray-50 text-gray-500 rounded border border-gray-100">
                                    {tech}
                                  </span>
                                ))}
                              </div>
                              
                              <button 
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setActiveTab('script');
                                }}
                                className="w-full py-2 bg-gray-50 text-gray-700 rounded-xl text-xs font-bold hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2"
                              >
                                <FileText size={14} />
                                {t('viewScript')}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'script' && (
              <motion.div 
                key="script"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {!selectedLead ? (
                  <EmptyState 
                    title={t('selectLead')} 
                    description={t('selectLeadDesc')}
                    action={() => setActiveTab('leads')}
                  />
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                          <Thermometer className="text-red-500" size={20} />
                          {t('decisionThermometer')}
                        </h3>
                        
                        <div className="relative h-4 bg-gray-100 rounded-full mb-6 overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-1000",
                              selectedLead.purchaseProbability > 70 ? "bg-gradient-to-r from-orange-500 to-red-600" : 
                              selectedLead.purchaseProbability > 40 ? "bg-gradient-to-r from-blue-500 to-amber-500" : 
                              "bg-gradient-to-r from-gray-400 to-blue-500"
                            )}
                            style={{ width: `${selectedLead.purchaseProbability}%` }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] font-black text-white drop-shadow-md">
                              {selectedLead.purchaseProbability}% {t('probability')}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {selectedLead.scoringFactors.map((factor, idx) => (
                            <div key={idx}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-500 font-medium">{factor.label}</span>
                                <span className="font-bold">{factor.score}/10</span>
                              </div>
                              <div className="h-1 bg-gray-50 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-600"
                                  style={{ width: `${factor.score * 10}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        {selectedLead.triggerEvent && (
                          <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
                            <p className="text-[10px] font-black text-amber-600 uppercase mb-1 flex items-center justify-between">
                              <span className="flex items-center gap-1"><Zap size={12} /> {t('triggerEventDetected')}</span>
                              {selectedLead.triggerDate && <span className="text-gray-400 font-bold">{selectedLead.triggerDate}</span>}
                            </p>
                            <p className="text-xs text-amber-900 leading-relaxed italic mb-2">
                              "{selectedLead.triggerEvent}"
                            </p>
                            {selectedLead.triggerSource && (
                              <div className="flex items-center gap-1 text-[10px] text-amber-700/60 font-medium">
                                <ExternalLink size={10} />
                                <span>{t('source')}: {selectedLead.triggerSource}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-bold mb-4 text-gray-500 uppercase tracking-wider">Secuencia Multi-Paso</h3>
                        <div className="space-y-2">
                          {[1, 2, 3].map((step) => (
                            <button
                              key={step}
                              onClick={() => setActiveStep(step as 1 | 2 | 3)}
                              className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left border",
                                activeStep === step 
                                  ? "bg-blue-600 text-white border-blue-600 shadow-md" 
                                  : "bg-white text-gray-600 border-gray-100 hover:bg-gray-50"
                              )}
                            >
                              <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                                activeStep === step ? "bg-white/20" : "bg-gray-100"
                              )}>
                                {step}
                              </div>
                              <span className="text-xs font-bold">
                                {step === 1 ? "Email Inicial" : step === 2 ? "LinkedIn Message" : "Seguimiento"}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {selectedLead.potentialProjects && selectedLead.potentialProjects.length > 0 && (
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                          <h3 className="text-sm font-bold mb-4 text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <Rocket size={16} className="text-blue-600" />
                            Proyectos IA Sugeridos
                          </h3>
                          <div className="space-y-3">
                            {selectedLead.potentialProjects.map((project) => (
                              <div key={project.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-xs font-bold text-gray-900 mb-1">{project.title}</p>
                                <p className="text-[10px] text-gray-600 line-clamp-2 leading-tight">{project.description}</p>
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="text-[8px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded uppercase">
                                    ROI {project.estimatedROI}
                                  </span>
                                  <span className="text-[8px] font-bold px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded uppercase">
                                    {project.impact} Impacto
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm min-h-[600px] flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                              {activeStep === 1 ? "Paso 1: Gancho Inicial" : activeStep === 2 ? "Paso 2: Conexión LinkedIn" : "Paso 3: Seguimiento de Valor"}
                            </h2>
                            <p className="text-sm text-gray-500">
                              Secuencia personalizada para {selectedLead.contactName} • <span className="font-bold text-indigo-600">{selectedLead.email}</span>
                            </p>
                          </div>
                          <button 
                            onClick={() => handleGenerateScript(selectedLead)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold transition-all"
                          >
                            <RefreshCw size={16} />
                            Regenerar Secuencia
                          </button>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-8 flex-grow relative border border-gray-100 shadow-inner">
                          {isGeneratingScript ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/50 backdrop-blur-sm rounded-xl">
                              <div className="relative">
                                <Loader2 className="animate-spin text-blue-600" size={48} />
                                <Sparkles className="absolute -top-2 -right-2 text-yellow-400 animate-pulse" size={20} />
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-bold text-gray-900">Redactando secuencia...</p>
                                <p className="text-sm text-gray-500">Gemini está analizando el Trigger Event de {selectedLead.companyName}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="relative h-full">
                              {!salesScript ? (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                  <FileText size={48} className="mb-4 opacity-20" />
                                  <p>Haz clic en "Regenerar" para crear la secuencia</p>
                                </div>
                              ) : (
                                <>
                                  <div className="absolute top-2 right-2 flex gap-2">
                                    <button 
                                      onClick={() => {
                                        const text = activeStep === 1 ? salesScript.step1 : activeStep === 2 ? salesScript.step2 : salesScript.step3;
                                        navigator.clipboard.writeText(text);
                                        alert('Copiado al portapapeles');
                                      }}
                                      className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-black hover:shadow-sm transition-all"
                                      title="Copiar"
                                    >
                                      <History size={16} />
                                    </button>
                                    <button 
                                      onClick={() => {
                                        const text = activeStep === 1 ? salesScript.step1 : activeStep === 2 ? salesScript.step2 : salesScript.step3;
                                        const subject = `Contacto para ${selectedLead.companyName}`;
                                        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
                                      }}
                                      className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-black hover:shadow-sm transition-all"
                                      title="Enviar por Email"
                                    >
                                      <Mail size={16} />
                                    </button>
                                  </div>
                                  <p className="whitespace-pre-wrap text-gray-800 leading-relaxed font-mono text-sm bg-white p-6 rounded-lg border border-gray-100 shadow-sm h-full overflow-auto">
                                    {(() => {
                                      const content = activeStep === 1 ? salesScript.step1 : activeStep === 2 ? salesScript.step2 : salesScript.step3;
                                      if (typeof content === 'object' && content !== null) {
                                        // Handle the case where Gemini returns an object with subject/body
                                        const obj = content as any;
                                        return (
                                          <div className="space-y-4">
                                            {obj.subject && (
                                              <div className="pb-4 border-b border-gray-100">
                                                <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Asunto:</span>
                                                <span className="font-bold text-gray-900">{obj.subject}</span>
                                              </div>
                                            )}
                                            <div>
                                              {obj.subject && <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Mensaje:</span>}
                                              {obj.body || JSON.stringify(obj, null, 2)}
                                            </div>
                                          </div>
                                        );
                                      }
                                      return content;
                                    })()}
                                  </p>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick, badge, disabled = false }: { 
  icon: React.ReactNode, 
  label: string, 
  active: boolean, 
  onClick: () => void,
  badge?: number,
  disabled?: boolean
}) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200",
        active ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-purple-200" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
        disabled && "opacity-30 cursor-not-allowed"
      )}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-semibold">{label}</span>
      </div>
      {badge !== undefined && (
        <span className={cn(
          "text-[10px] font-bold px-2 py-0.5 rounded-full",
          active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
        )}>
          {badge}
        </span>
      )}
    </button>
  );
}

function InputGroup({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">{label}</label>
      {children}
    </div>
  );
}

function StatCard({ icon, label, value, trend }: { icon: React.ReactNode, label: string, value: string | number, trend: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{trend}</span>
      </div>
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function DashboardChart({ title, data }: { title: string, data: any[] }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <h4 className="text-sm font-bold text-gray-500 uppercase mb-6">{title}</h4>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
            <Tooltip 
              cursor={{ fill: '#F8FAFC' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="value" fill="#000000" radius={[4, 4, 0, 0]} barSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DashboardPie({ title, data }: { title: string, data: any[] }) {
  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <h4 className="text-sm font-bold text-gray-500 uppercase mb-6">{title}</h4>
      <div className="h-[250px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function EmptyState({ title, description, action }: { title: string, description: string, action: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Search className="text-gray-400" size={32} />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-xs mb-8">{description}</p>
      <button 
        onClick={action}
        className="px-6 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors"
      >
        Empezar ahora
      </button>
    </div>
  );
}
