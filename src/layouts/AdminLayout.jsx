import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import LoadingScreen from '@/components/LoadingScreen';
const QuotationViewer = React.lazy(() => import('@/components/QuotationViewer'));
import { useLanguage } from '@/contexts/LanguageContext';

const AdminLayout = () => {
  const [appIsLoading, setAppIsLoading] = useState(true);
  const [initialQuotationData, setInitialQuotationData] = useState(null);
  const [allThemes, setAllThemes] = useState({});
  const [error, setError] = useState(null);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchAllData = async () => {
      setAppIsLoading(true);
      setError(null);

      try {
        // Fetch only metadata first to avoid downloading large Base64 logos/favicons/sections_config
        const { data: allData, error: allError } = await supabase
          .from('quotations')
          .select('id, theme_key, project, client, company, title, is_home, is_template, updated_at');

        if (allError) {
          throw new Error(`${t('adminLayout.loadError')} ${allError.message}`);
        }

        const themesObject = {};
        allData.forEach(item => {
          themesObject[item.theme_key] = item;
        });
        setAllThemes(themesObject);

        // Then, specifically fetch the home quotation
        // Then, specifically fetch the home quotation
        const { data: homeDataList, error: homeError } = await supabase
          .from('quotations')
          .select('*')
          .eq('is_home', true)
          .limit(1);

        if (homeError || !homeDataList || homeDataList.length === 0) {
          // If no home page is set, fallback to a default or show an error
          const fallbackTheme = themesObject['NOVA'] || Object.values(themesObject)[0];
          if (fallbackTheme) {
            setInitialQuotationData(fallbackTheme);
            console.warn(t('adminLayout.noHome'));
          } else {
            throw new Error(t('adminLayout.noHomeNoFallback'));
          }
        } else {
          const homeData = homeDataList[0];
          setInitialQuotationData(homeData);

          // IMPORTANT: Merge the FULL data of the home quotation into themesObject
          // This ensures the active quotation has all fields (sections_config, logo, etc.)
          themesObject[homeData.theme_key] = homeData;
          setAllThemes(themesObject);
          // Note: We call setAllThemes here again to ensure it includes the full home data
        }

      } catch (e) {
        console.error(e);
        setError(e.message);
      } finally {
        setAppIsLoading(false);
      }
    };

    fetchAllData();
  }, []); // Remove 't' dependency to prevent loop

  if (appIsLoading) {
    return <LoadingScreen message="Cargando configuración del sistema..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-4 text-center">
        <h1 className="text-3xl font-bold text-red-500 mb-4">{t('adminLayout.loadErrorTitle')}</h1>
        <p className="text-lg mb-8 max-w-md">{error}</p>
      </div>
    );
  }

  if (!initialQuotationData) {
    return <LoadingScreen message="Preparando datos de la cotización..." />;
  }

  return (
    <React.Suspense fallback={<LoadingScreen message="Cargando visor..." />}>
      <QuotationViewer
        initialQuotationData={initialQuotationData}
        allThemes={allThemes}
        isAdminView={true}
      />
    </React.Suspense>
  );
};

export default AdminLayout;