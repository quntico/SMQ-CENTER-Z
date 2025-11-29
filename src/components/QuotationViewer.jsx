import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MainContent from '@/components/MainContent';
import AdminModal from '@/components/AdminModal';
import { Toaster } from '@/components/ui/toaster';
import { CommandDialogDemo } from '@/components/CommandDialog';
import { supabase } from '@/lib/customSupabaseClient';
import PasswordPrompt from '@/components/PasswordPrompt';
import BottomNavBar from '@/components/BottomNavBar';
import CloneModal from '@/components/CloneModal';
import { useLanguage } from '@/contexts/LanguageContext';

import PortadaSection from '@/components/sections/PortadaSection';
import DescripcionSection from '@/components/sections/DescripcionSection';
import GeneralesSection from '@/components/sections/GeneralesSection';
import FichaTecnicaSection from '@/components/sections/FichaTecnicaSection';
import FichaDinamicaSection from '@/components/sections/FichaDinamicaSection';
import CronogramaSection from '@/components/sections/CronogramaSection';
import ServiciosSection from '@/components/sections/ServiciosSection';
import LayoutSection from '@/components/sections/LayoutSection';
import VideoSection from '@/components/sections/VideoSection';
import ProcesoSection from '@/components/sections/ProcesoSection';
import PDFSection from '@/components/sections/PDFSection';
import GenericSection from '@/components/sections/GenericSection';
import IASection from '@/components/sections/IASection';
import CondicionesPagoSection from '@/components/sections/CondicionesPagoSection';
import PropuestaEconomicaSection from '@/components/sections/PropuestaEconomicaSection';
import CotizadorPage from '@/components/CotizadorPage';
import CotizadorSMQ from '@/components/CotizadorSMQ';
import CalculadoraProduccion from '@/components/CalculadoraProduccion';
import ExclusionesSection from '@/components/sections/ExclusionesSection';
import CapacidadesSection from '@/components/sections/CapacidadesSection';
import SCR700Page from '@/components/sections/SCR700Page';
import ClientesSection from '@/components/sections/ClientesSection';
import VentajasSection from '@/components/sections/VentajasSection';

const componentMap = {
  ventajas: VentajasSection,
  portada: PortadaSection,
  descripcion: DescripcionSection,
  generales: GeneralesSection,
  ficha: FichaTecnicaSection,
  ficha_dinamica: FichaDinamicaSection,
  propuesta: PropuestaEconomicaSection,
  cronograma: CronogramaSection,
  servicios: ServiciosSection,
  condiciones: CondicionesPagoSection,
  layout: LayoutSection,
  video: VideoSection,
  proceso: ProcesoSection,
  pdf: PDFSection,
  generic: GenericSection,
  ia: IASection,
  cotizador_page: CotizadorPage,
  cotizador_smq: CotizadorSMQ,
  calculadora_prod: CalculadoraProduccion,
  exclusiones: ExclusionesSection,
  capacidades: CapacidadesSection,
  scr700_page: SCR700Page,
  clientes: ClientesSection,
  admin: GenericSection,
  servicios_adicionales: GenericSection,
};

const defaultSections = [
  { id: 'descripcion', label: 'Descripción', icon: 'FileText', isVisible: true, component: 'descripcion' },
  { id: 'ficha', label: 'Ficha Técnica', icon: 'ListChecks', isVisible: true, component: 'ficha' },
  { id: 'cronograma', label: 'Cronograma', icon: 'Calendar', isVisible: true, component: 'cronograma' },
  { id: 'servicios', label: 'Servicios Incluidos', icon: 'Package', isVisible: true, component: 'servicios' },
  { id: 'layout', label: 'Lay Out', icon: 'LayoutGrid', isVisible: true, component: 'layout' },
  { id: 'video', label: 'Video', icon: 'Video', isVisible: true, component: 'video' },
  { id: 'proceso', label: 'Proceso', icon: 'TrendingUp', isVisible: true, component: 'proceso' },
  { id: 'calculadora_prod', label: 'Calculadora', icon: 'Calculator', isVisible: true, isLocked: false, component: 'calculadora_prod' },
  { id: 'pdf', label: 'Cotizaciones PDF', icon: 'FileDown', isVisible: true, component: 'pdf' },
  { id: 'analiticas', label: 'Analíticas', icon: 'BarChart', isVisible: true, component: 'admin', adminOnly: true },
  { id: 'ajustes', label: 'Ajustes', icon: 'Settings', isVisible: true, component: 'admin', adminOnly: true },
  { id: 'propuesta', label: 'Propuesta Económica', icon: 'DollarSign', isVisible: true, component: 'propuesta' },

  // Hidden/Auxiliary
  { id: 'ventajas', label: 'VENTAJAS', icon: 'Star', isVisible: false, isLocked: true, component: 'ventajas' },
  { id: 'portada', label: 'Home', icon: 'Home', isVisible: false, isLocked: true, component: 'portada' },
  { id: 'generales', label: 'Generales', icon: 'ClipboardList', isVisible: false, component: 'generales' },
  { id: 'exclusiones', label: 'Exclusiones', icon: 'XCircle', isVisible: false, component: 'exclusiones' },
  { id: 'ia', label: 'Asistente IA', icon: 'BrainCircuit', isVisible: false, isLocked: true, component: 'ia' },
];

const clientVisibleSections = new Set(defaultSections.filter(s => !s.adminOnly).map(s => s.id));

const mergeWithDefaults = (config, themeKey) => {
  if (!config || !Array.isArray(config)) return defaultSections;
  const defaultConfigMap = new Map(defaultSections.map(s => [s.id, s]));
  let mergedConfig = config
    .filter(s => s.id !== 'propuesta_dinamica') // Explicitly filter out prop_dinamica from DB configs
    .map(s => {
      if (!defaultConfigMap.has(s.id)) {
        const baseComponentId = s.component || s.id.split('_copy')[0];
        const baseConfig = defaultConfigMap.get(baseComponentId) || {};
        return { ...baseConfig, ...s, component: baseComponentId };
      }
      return { ...defaultConfigMap.get(s.id), ...s };
    });
  const existingIds = new Set(mergedConfig.map(s => s.id));
  defaultSections.forEach(ds => {
    if (!existingIds.has(ds.id)) mergedConfig.push(ds);
  });
  return mergedConfig;
};

const QuotationViewer = ({ initialQuotationData, allThemes = {}, isAdminView = false }) => {
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [activeTheme, setActiveTheme] = useState(initialQuotationData.theme_key);
  const [themes, setThemes] = useState(isAdminView ? allThemes : { [initialQuotationData.theme_key]: initialQuotationData });
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [activeSection, setActiveSection] = useState('descripcion');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showCommandDialog, setShowCommandDialog] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const idleTimerRef = useRef(null);
  const initialDisplayTimerRef = useRef(null);
  const hasInteracted = useRef(false);
  const { t } = useLanguage();

  const quotationData = themes[activeTheme];

  useEffect(() => {
    const processedData = {
      ...initialQuotationData,
      sections_config: mergeWithDefaults(initialQuotationData.sections_config, initialQuotationData.theme_key),
    };
    const initialThemes = isAdminView ? allThemes : { [initialQuotationData.theme_key]: processedData };
    setThemes(initialThemes);
    setActiveTheme(initialQuotationData.theme_key);
  }, [initialQuotationData, allThemes, isAdminView]);

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setIsEditorMode(false);
  };

  const handleHomeClick = useCallback(() => {
    setActiveSection('descripcion');
    const homeEl = document.getElementById('main-content-scroll-area');
    if (homeEl) homeEl.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (!quotationData) return;
    if (!hasInteracted.current) {
      hasInteracted.current = true;
      clearTimeout(initialDisplayTimerRef.current);
    }
    setIsBannerVisible(false);
    clearTimeout(idleTimerRef.current);
    const timeoutDuration = (quotationData.idle_timeout || 10) * 1000;
    idleTimerRef.current = setTimeout(() => {
      setIsBannerVisible(true);
    }, timeoutDuration);
  }, [quotationData]);

  useEffect(() => {
    if (!quotationData) return;
    const initialTime = (quotationData.initial_display_time || 5) * 1000;
    initialDisplayTimerRef.current = setTimeout(() => {
      if (!hasInteracted.current) setIsBannerVisible(false);
    }, initialTime);

    const events = ['mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetIdleTimer));
    return () => {
      events.forEach(event => window.removeEventListener(event, resetIdleTimer));
      clearTimeout(idleTimerRef.current);
      clearTimeout(initialDisplayTimerRef.current);
    };
  }, [resetIdleTimer, quotationData]);

  useEffect(() => {
    if (quotationData) {
      if (isAdminView) localStorage.setItem('activeTheme', activeTheme);
      document.body.className = 'theme-nova';
    }
  }, [activeTheme, quotationData, isAdminView]);

  const handleSectionSelect = useCallback((sectionId) => {
    setActiveSection(sectionId);
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else {
      const mainContent = document.getElementById('main-content-scroll-area');
      if (mainContent) mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const setSectionsConfig = async (newConfig) => {
    setThemes(prevThemes => ({
      ...prevThemes,
      [activeTheme]: { ...prevThemes[activeTheme], sections_config: newConfig },
    }));
    await supabase.from('quotations').update({ sections_config: newConfig }).eq('theme_key', activeTheme);
  };

  if (!quotationData) return null;

  let menuItems = (quotationData.sections_config || defaultSections).map(section => {
    const cleanCompKey = (section.component || section.id).split('_copy')[0];
    return {
      ...section,
      Component: componentMap[cleanCompKey] || componentMap[section.id] || GenericSection,
      label: section.label || t(`sections.${section.id}`)
    };
  });

  // Extra safety filter to ensure removed components don't crash
  menuItems = menuItems.filter(section => section.id !== 'propuesta_dinamica');

  if (!isAdminView) {
    // Filter hidden items and admin items for normal view
    menuItems = menuItems.filter(item => item.isVisible && clientVisibleSections.has(item.id.split('_copy')[0]) && !item.adminOnly);
  } else if (!isAdminAuthenticated) {
    // Filter admin items for non-authenticated admin view
    menuItems = menuItems.filter(item => !item.adminOnly);
  }

  const renderActiveComponent = () => {
    if (activeSection === 'cotizador_page') {
      return (
        <CotizadorPage
          quotationData={quotationData}
          activeTheme={activeTheme}
          setThemes={setThemes}
        />
      );
    }

    const activeSectionObj = menuItems.find(s => s.id === activeSection);
    const ActiveComponent = activeSectionObj?.Component || componentMap[activeSection] || GenericSection;

    return (
      <MainContent
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        quotationData={quotationData}
        aiQuery={aiQuery}
        setAiQuery={setAiQuery}
        sections={menuItems}
        allSectionsData={quotationData.sections_config} // Pass full config including hidden items
        isEditorMode={isEditorMode && isAdminView}
        setIsEditorMode={setIsEditorMode}
        activeTheme={activeTheme}
        onSectionContentUpdate={setSectionsConfig}
      />
    );
  };

  return (
    <>
      <Helmet>
        <title>{quotationData.company} - {quotationData.project}</title>
      </Helmet>
      {isAdminView && showPasswordPrompt && (
        <PasswordPrompt
          onCorrectPassword={() => { setIsAdminAuthenticated(true); setShowPasswordPrompt(false); }}
          onCancel={() => setShowPasswordPrompt(false)}
        />
      )}
      <div className="flex h-screen overflow-hidden bg-black">
        <div className="hidden lg:flex lg:flex-shrink-0">
          <Sidebar
            activeSection={activeSection}
            onSectionSelect={handleSectionSelect}
            onHomeClick={handleHomeClick}
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
            onAdminClick={() => isAdminView && setShowAdminModal(true)}
            isEditorMode={isEditorMode && isAdminView}
            setIsEditorMode={setIsEditorMode}
            sections={menuItems}
            setSections={setSectionsConfig}
            isAdminAuthenticated={isAdminAuthenticated && isAdminView}
            onAdminLogin={() => isAdminView && setShowPasswordPrompt(true)}
            onAdminLogout={handleAdminLogout}
            isAdminView={isAdminView}
            onCotizadorClick={() => handleSectionSelect('cotizador_page')}
          />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            quotationData={quotationData}
            onLogoClick={handleHomeClick}
            onSearchClick={() => isAdminView && setShowCommandDialog(true)}
            isBannerVisible={isBannerVisible}
            isEditorMode={isEditorMode}
            isAdminView={isAdminView}
          />
          <div id="main-content-scroll-area" className="flex-1 overflow-y-auto overflow-x-hidden pb-20 lg:pb-0">
            {renderActiveComponent()}
          </div>
        </div>
        <BottomNavBar
          sections={menuItems}
          activeSection={activeSection}
          onSectionSelect={handleSectionSelect}
          onHomeClick={handleHomeClick}
          isEditorMode={isEditorMode && isAdminView}
          isAdminAuthenticated={isAdminAuthenticated && isAdminView}
          onAdminClick={() => isAdminView && setShowAdminModal(true)}
          setIsEditorMode={setIsEditorMode}
          onAdminLogin={() => isAdminView && setShowPasswordPrompt(true)}
          onAdminLogout={handleAdminLogout}
          activeTheme={activeTheme}
          isAdminView={isAdminView}
        />
        <Toaster />
      </div>
    </>
  );
};

export default QuotationViewer;