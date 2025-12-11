import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import LoadingScreen from '@/components/LoadingScreen';
import QuotationViewer from '@/components/QuotationViewer';
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
        // 1. Fetch lightweight list (metadata only) for the sidebar/admin panel
        const { data: allData, error: allError } = await supabase
          .from('quotations')
          .select('*'); // Fetch ALL data to prevent crashes when switching

        if (allError) {
          throw new Error(`${t('adminLayout.loadError')} ${allError.message}`);
        }


        const themesObject = {};
        allData.forEach(item => {
          themesObject[item.theme_key] = item;
        });

        // 2. Determine initial/home data from the ALREADY fetched data
        const homeData = allData.find(item => item.is_home);

        if (homeData) {
          setInitialQuotationData(homeData);
        } else if (allData.length > 0) {
          // Fallback to first item
          console.warn(t('adminLayout.noHome'));
          setInitialQuotationData(allData[0]);
        } else {
          throw new Error(t('adminLayout.noHomeNoFallback'));
        }

        setAllThemes(themesObject);

      } catch (e) {
        console.error(e);
        setError(e.message);
      } finally {
        setAppIsLoading(false);
      }
    };

    fetchAllData();
  }, [t]);

  if (appIsLoading) {
    return <LoadingScreen message={t('adminLayout.loadingConfig')} />;
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
    return <LoadingScreen message={t('adminLayout.loadingConfig')} />;
  }

  return (
    <QuotationViewer
      initialQuotationData={initialQuotationData}
      allThemes={allThemes}
      isAdminView={true}
    />
  );
};

export default AdminLayout;