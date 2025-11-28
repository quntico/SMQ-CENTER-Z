import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';

const Header = ({ quotationData, onLogoClick, onSearchClick, isBannerVisible, isEditorMode, isAdminView }) => {
  const { t } = useLanguage();
  const { company, project, client, logo, logo_size, banner_text, banner_scale, banner_direction, hide_banner } = quotationData;

  const bannerVariants = {
    hidden: { y: '-100%', opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };
  
  const showBanner = !hide_banner && isBannerVisible && (isAdminView || !isEditorMode);

  const bannerStyle = {
    transform: `scale(${(banner_scale || 100) / 100})`,
    transformOrigin: 'center',
  };

  const logoContainerStyle = {
    '--logo-width': `${logo_size || 200}px`
  };

  const marqueeClass = banner_direction === 'right-to-left' ? 'animate-marquee-reverse-once' : 'animate-marquee-once';

  const fullBannerText = [company, client, project, banner_text].filter(Boolean).join(' • ');

  return (
    <header className="relative bg-black text-white z-30">
      <div className="flex items-center justify-between p-4 border-b border-gray-800 h-20">
        <div className="flex items-center gap-4">
          {logo && (
            <button onClick={onLogoClick} className="focus:outline-none focus:ring-2 focus:ring-primary rounded-md">
              <div className="header-logo-container" style={logoContainerStyle}>
                <img 
                  src={logo} 
                  alt={`${company} Logo`}
                  className="header-logo"
                />
              </div>
            </button>
          )}
        </div>
        <div className="hidden md:flex flex-col items-center text-center">
          <h1 className="text-lg font-bold text-gray-200">{project}</h1>
          <p className="text-sm text-gray-400">{client}</p>
        </div>
        <div className="flex items-center gap-2">
           <LanguageSelector />
          {isAdminView && (
            <Button variant="ghost" size="icon" onClick={onSearchClick} className="text-gray-400 hover:text-white hover:bg-gray-800">
              <Search className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={bannerVariants}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="absolute top-full left-0 right-0 bg-black border-2 border-[--color-led-blue] p-3 text-center shadow-lg overflow-hidden whitespace-nowrap"
            style={bannerStyle}
          >
             <div className="inline-block">
                <div className={`flex items-center gap-8 ${marqueeClass}`}>
                    <p className="text-sm font-semibold text-led-blue">
                      {fullBannerText || (isEditorMode && isAdminView ? t('header.editorMode') : t('header.explore'))}
                    </p>
                    <p className="text-sm font-semibold text-led-blue pr-8">
                       {fullBannerText || (isEditorMode && isAdminView ? t('header.editorMode') : t('header.explore'))}
                    </p>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;