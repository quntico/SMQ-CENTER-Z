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
// import PropuestaEconomicaSection from '@/components/sections/PropuestaEconomicaSection'; // Removed
// import PropuestaDinamicaSection from '@/components/sections/PropuestaDinamicaSection'; // Removed
import CotizadorPage from '@/components/CotizadorPage';
import CotizadorSMQ from '@/components/CotizadorSMQ';
import CalculadoraProduccion from '@/components/CalculadoraProduccion';
import ExclusionesSection from '@/components/sections/ExclusionesSection';
import CapacidadesSection from '@/components/sections/CapacidadesSection';
import SCR700Page from '@/components/sections/SCR700Page';
import ClientesSection from '@/components/sections/ClientesSection'; // Import the new component

// Mapa de componentes por id de sección
const componentMap = {
  portada: PortadaSection,
  descripcion: DescripcionSection,
  generales: GeneralesSection,
  ficha: FichaTecnicaSection,
  ficha_dinamica: FichaDinamicaSection,
  // propuesta: PropuestaEconomicaSection, // Removed
  // propuesta_dinamica: PropuestaDinamicaSection, // Removed
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
  admin: GenericSection, // Placeholder, puede ser un componente admin específico
  servicios_adicionales: GenericSection, // Placeholder
};

// Configuración base de secciones (orden y visibilidad)
const defaultSections = [
  { id: 'portada', label: 'Home', icon: 'Home', isVisible: true, isLocked: true, component: 'portada' },
  { id: 'descripcion', label: 'Descripción', icon: 'FileText', isVisible: true, component: 'descripcion' },
  { id: 'capacidades', label: 'Capacidades', icon: 'Rocket', isVisible: false, component: 'capacidades' },
  { id: 'generales', label: 'Generales', icon: 'ClipboardList', isVisible: true, component: 'generales' },
  { id: 'proceso', label: 'Flujo del proceso', icon: 'TrendingUp', isVisible: true, component: 'proceso' },
  { id: 'ficha', label: 'Fichas técnicas', icon: 'ListChecks', isVisible: true, component: 'ficha' },
  { id: 'ficha_dinamica', label: 'Ficha Dinámica', icon: 'ListChecks', isVisible: true, component: 'ficha_dinamica' },
  // { id: 'propuesta', label: 'Propuesta económica', icon: 'DollarSign', isVisible: true, component: 'propuesta' }, // Removed
  // { id: 'propuesta_dinamica', label: 'Propuesta Dinámica', icon: 'DollarSign', isVisible: true, component: 'propuesta_dinamica' }, // Removed
  { id: 'cronograma', label: 'Cronograma', icon: 'Calendar', isVisible: true, component: 'cronograma' },
  { id: 'servicios', label: 'Servicios incluidos', icon: 'Package', isVisible: true, component: 'servicios' },
  { id: 'exclusiones', label: 'Exclusiones', icon: 'XCircle', isVisible: true, component: 'exclusiones' },
  { id: 'condiciones', label: 'Condiciones', icon: 'FileCheck', isVisible: true, component: 'condiciones', adminOnly: true },
  { id: 'pdf', label: 'Cotización PDF', icon: 'FileDown', isVisible: true, component: 'pdf' },
  { id: 'video', label: 'Video', icon: 'Video', isVisible: true, component: 'video' },
  { id: 'layout', label: 'Layout', icon: 'LayoutGrid', isVisible: true, component: 'layout' },
  { id: 'scr700_page', label: 'SCR700', icon: 'BrainCircuit', isVisible: true, component: 'scr700_page' },
  { id: 'cotizador_page', label: 'Cotizador', icon: 'Calculator', isVisible: false, isLocked: true, component: 'cotizador_page' },
  { id: 'cotizador_smq', label: 'Cotizador SMQ', icon: 'ClipboardSignature', isVisible: true, isLocked: false, component: 'cotizador_smq' },
  { id: 'calculadora_prod', label: 'Calculadora', icon: 'Calculator', isVisible: true, isLocked: false, component: 'calculadora_prod' },
  { id: 'ia', label: 'Asistente IA', icon: 'BrainCircuit', isVisible: true, isLocked: true, component: 'ia' },
  { id: 'clientes', label: 'Clientes', icon: 'Users', isVisible: true, isLocked: false, component: 'clientes' },
  { id: 'servicios_adicionales', label: 'Servicios Adicionales', icon: 'Briefcase', isVisible: true, component: 'servicios_adicionales', adminOnly: true },
  { id: 'admin', label: 'Admin', icon: 'Sheet', isVisible: true, component: 'admin', adminOnly: true },
];

// AHORA: las secciones visibles para el cliente se calculan AUTOMÁTICAMENTE
// a partir de defaultSections (excluyendo las adminOnly)
const clientVisibleSections = new Set(
  defaultSections
    .filter(s => !s.adminOnly)
    .map(s => s.id)
);

// Variante de secciones para temas SCR700 (activa "capacidades")
const scr700Sections = defaultSections.map(s =>
  s.id === 'capacidades' ? { ...s, isVisible: true } : s
);

// Fusiona configuración guardada con defaults, respetando orden
const mergeWithDefaults = (config, themeKey) => {
  const baseSections = (themeKey || '').startsWith('SCR700') ? scr700Sections : defaultSections;

  if (!config || !Array.isArray(config)) {
    return baseSections;
  }

  const defaultConfigMap = new Map(baseSections.map(s => [s.id, s]));

  let mergedConfig = config.map(s => {
    const defaultConfig = defaultConfigMap.get(s.id) || {};
    return { ...defaultConfig, ...s };
  });

  const existingIds = new Set(mergedConfig.map(s => s.id));
  baseSections.forEach(ds => {
    if (!existingIds.has(ds.id)) {
      mergedConfig.push(ds);
    }
  });

  const orderedIds = baseSections.map(s => s.id);
  mergedConfig.sort((a, b) => {
    const indexA = orderedIds.indexOf(a.id);
    const indexB = orderedIds.indexOf(b.id);
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return mergedConfig;
};

const QuotationViewer = ({ initialQuotationData, allThemes = {}, isAdminView = false }) => {
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [activeTheme, setActiveTheme] = useState(initialQuotationData.theme_key);
  const [themes, setThemes] = useState(isAdminView ? allThemes : { [initialQuotationData.theme_key]: initialQuotationData });
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [activeSection, setActiveSection] = useState('portada');
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
    setActiveSection('portada');
    const homeEl = document.getElementById('main-content-scroll-area');
    if (homeEl) {
      homeEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
      if (isAdminView) {
        localStorage.setItem('activeTheme', activeTheme);
      }
      const themeClass = (activeTheme || '').startsWith('SMQ')
        ? 'theme-smq'
        : (activeTheme || '').startsWith('SCR700')
          ? 'theme-scr700'
          : 'theme-nova';
      document.body.className = themeClass;
    }
  }, [activeTheme, quotationData, isAdminView]);

  const handleSectionSelect = useCallback((sectionId) => {
    setActiveSection(sectionId);

    const specialPages = ['ia', 'cotizador_page', 'cotizador_smq', 'calculadora_prod', 'scr700_page', 'clientes', 'admin', 'servicios_adicionales'];
    if (specialPages.includes(sectionId)) {
      const mainContent = document.getElementById('main-content-scroll-area');
      if (mainContent) {
        mainContent.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, []);

  const setSectionsConfig = async (newConfig) => {
    const sortedConfig = mergeWithDefaults(newConfig, activeTheme);
    setThemes(prevThemes => ({
      ...prevThemes,
      [activeTheme]: {
        ...prevThemes[activeTheme],
        sections_config: sortedConfig,
      },
    }));
    await supabase
      .from('quotations')
      .update({ sections_config: sortedConfig })
      .eq('theme_key', activeTheme);
  };

  const handleVideoUrlUpdate = async (newUrl) => {
    setThemes(prevThemes => ({
      ...prevThemes,
      [activeTheme]: {
        ...prevThemes[activeTheme],
        video_url: newUrl,
      },
    }));
    await supabase
      .from('quotations')
      .update({ video_url: newUrl })
      .eq('theme_key', activeTheme);
  };

  if (!quotationData) {
    return null;
  }

  let menuItems = (quotationData.sections_config || defaultSections).map(section => ({
    ...section,
    Component: componentMap[section.component || section.id],
    label: t(`sections.${section.id}`) || section.label,
  }));

  // Vista cliente: filtrar por visibilidad, lista de permitidos y no admin
  if (!isAdminView) {
    menuItems = menuItems.filter(item => {
      return item.isVisible && clientVisibleSections.has(item.id) && !item.adminOnly;
    });
  }

  // Vista admin sin autenticarse: ocultar secciones admin-only
  if (isAdminView && !isAdminAuthenticated) {
    menuItems = menuItems.filter(item => !item.adminOnly);
  }

  const mainContentSections = menuItems.filter(
    s =>
      ![
        'cotizador_page',
        'cotizador_smq',
        'calculadora_prod',
        'ia',
        'scr700_page',
        'clientes',
        'admin',
        'servicios_adicionales',
      ].includes(s.id)
  );

  let sidebarMenuItems = [...menuItems];
  if (!isAdminView) {
    sidebarMenuItems = menuItems.filter(item => (!item.isLocked || item.id === 'portada'));
  }

  const isSpecialPageActive = [
    'cotizador_page',
    'cotizador_smq',
    'calculadora_prod',
    'ia',
    'scr700_page',
    'clientes',
    'admin',
    'servicios_adicionales',
  ].includes(activeSection);

  const renderActiveComponent = () => {
    const ActiveComponent = componentMap[activeSection];
    if (!ActiveComponent) return null;

    const componentWrapper = (Component, props) => (
      <div className="px-4">
        <Component {...props} />
      </div>
    );

    if (isSpecialPageActive) {
      const specialProps = {
        cotizador_page: { quotationData, activeTheme, setThemes },
        cotizador_smq: {},
        calculadora_prod: { quotationData, isEditorMode, activeTheme },
        ia: { initialQuery: aiQuery, setInitialQuery: setAiQuery },
        scr700_page: {},
        clientes: {},
        admin: { sectionId: 'admin' },
        servicios_adicionales: { sectionId: 'servicios_adicionales' },
        condiciones: { sectionId: 'condiciones' },
      };
      if (
        !isAdminAuthenticated &&
        (specialProps[activeSection]?.adminOnly ||
          ['cotizador_page', 'cotizador_smq', 'clientes', 'admin', 'servicios_adicionales', 'condiciones'].includes(
            activeSection
          ))
      )
        return null;
      return componentWrapper(ActiveComponent, specialProps[activeSection]);
    } else {
      return (
        <MainContent
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          quotationData={quotationData}
          aiQuery={aiQuery}
          setAiQuery={setAiQuery}
          sections={mainContentSections}
          allSectionsData={menuItems}
          isEditorMode={isEditorMode && isAdminView}
          setIsEditorMode={setIsEditorMode}
          activeTheme={activeTheme}
          onSectionContentUpdate={setSectionsConfig}
          onVideoUrlUpdate={handleVideoUrlUpdate}
        />
      );
    }
  };

  return (
    <>
      <Helmet>
        <title>
          {quotationData.company} - {quotationData.project}
        </title>
        <meta
          name="description"
          content={`Cotización para el proyecto ${quotationData.project} de ${quotationData.company}.`}
        />
        {quotationData.favicon && <link rel="icon" href={quotationData.favicon} />}
      </Helmet>

      {isAdminView && showPasswordPrompt && (
        <PasswordPrompt
          onCorrectPassword={() => {
            setIsAdminAuthenticated(true);
            setShowPasswordPrompt(false);
          }}
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
            sections={sidebarMenuItems}
            setSections={setSectionsConfig}
            isAdminAuthenticated={isAdminAuthenticated && isAdminView}
            onAdminLogin={() => isAdminView && setShowPasswordPrompt(true)}
            onAdminLogout={handleAdminLogout}
            isAdminView={isAdminView}
          />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            quotationData={quotationData}
            onLogoClick={handleHomeClick}
            onSearchClick={() => isAdminView && setShowCommandDialog(true)}
            isBannerVisible={isBannerVisible && !isSpecialPageActive}
            isEditorMode={isEditorMode}
            isAdminView={isAdminView}
          />

          <div
            id="main-content-scroll-area"
            className="flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain pb-20 lg:pb-0"
          >
            {renderActiveComponent()}
          </div>
        </div>

        <BottomNavBar
          sections={sidebarMenuItems}
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

        {isAdminView && (
          <>
            <AdminModal
              isOpen={showAdminModal}
              onClose={() => setShowAdminModal(false)}
              themes={themes}
              setThemes={setThemes}
              activeTheme={activeTheme}
              setActiveTheme={setActiveTheme}
              onCloneClick={() => setShowCloneModal(true)}
            />

            <CloneModal
              isOpen={showCloneModal}
              onClose={() => setShowCloneModal(false)}
              themes={themes}
              setThemes={setThemes}
              setActiveTheme={setActiveTheme}
            />

            <CommandDialogDemo
              open={showCommandDialog}
              onOpenChange={setShowCommandDialog}
              setActiveSection={handleSectionSelect}
              setAiQuery={setAiQuery}
              setIsEditorMode={setIsEditorMode}
            />
          </>
        )}

        <Toaster />
      </div>
    </>
  );
};

export default QuotationViewer;