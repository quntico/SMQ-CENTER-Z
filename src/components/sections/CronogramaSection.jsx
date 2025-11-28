import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, Wrench, Ship, Truck } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import SectionHeader from '@/components/SectionHeader';
import { useLanguage } from '@/contexts/LanguageContext';

const CronogramaSection = ({ quotationData, sectionData }) => {
  const [startDate, setStartDate] = useState(new Date());
  const { t, dateLocale } = useLanguage();

  const {
    phase1_duration = 5,
    phase2_duration = 75,
    phase3_duration = 10,
    phase1_name = 'Confirmación y Orden',
    phase2_name = 'Tiempo de Fabricación',
    phase3_name = 'Transporte',
    phase4_name = 'Instalación y Puesta en Marcha'
  } = quotationData;
  
  const calculateDates = (start) => {
    if (!start) return [];
    
    const date = new Date(start);
    const p1_start = new Date(date);
    const p1_end = new Date(p1_start.getTime() + (phase1_duration - 1) * 24 * 60 * 60 * 1000);

    const p2_start = new Date(p1_end.getTime() + 1 * 24 * 60 * 60 * 1000);
    const p2_end = new Date(p2_start.getTime() + (phase2_duration - 1) * 24 * 60 * 60 * 1000);
    
    const p3_start = new Date(p2_end.getTime() + 1 * 24 * 60 * 60 * 1000);
    const p3_end = new Date(p3_start.getTime() + (phase3_duration - 1) * 24 * 60 * 60 * 1000);
    
    const p4_start = new Date(p3_end.getTime() + 1 * 24 * 60 * 60 * 1000);

    const phases = [
      {
        id: 1,
        title: `${t('cronograma.days')} 1-${phase1_duration}`,
        subtitle: phase1_name,
        icon: CheckCircle,
        start: p1_start,
        end: p1_end,
      },
      {
        id: 2,
        title: `${t('cronograma.days')} ${phase1_duration + 1}-${phase1_duration + phase2_duration}`,
        subtitle: phase2_name,
        icon: Wrench,
        start: p2_start,
        end: p2_end,
      },
      {
        id: 3,
        title: `${t('cronograma.days')} ${phase1_duration + phase2_duration + 1}-${phase1_duration + phase2_duration + phase3_duration}`,
        subtitle: phase3_name,
        icon: Ship,
        start: p3_start,
        end: p3_end,
      },
      {
        id: 4,
        title: `${t('cronograma.day')} ${phase1_duration + phase2_duration + phase3_duration}+`,
        subtitle: phase4_name,
        icon: Truck,
        start: p4_start,
        end: null
      }
    ];

    return phases.map(phase => ({
      ...phase,
      dateRange: phase.end
        ? `${format(phase.start, 'dd MMM yyyy', { locale: dateLocale })} - ${format(phase.end, 'dd MMM yyyy', { locale: dateLocale })}`
        : `${t('cronograma.from')} ${format(phase.start, 'dd MMM yyyy', { locale: dateLocale })}`
    }));
  };

  const phases = calculateDates(startDate);

  return (
    <div className="py-4 sm:py-12 px-4">
      <SectionHeader sectionData={sectionData} />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <p className="text-base sm:text-lg text-gray-400 mb-6 sm:mb-12 text-center">
          {t('cronograma.selectDate')}
        </p>

        <div className="mb-6 sm:mb-12 flex justify-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full sm:w-[280px] justify-start text-left font-normal bg-[#0a0a0a] border-gray-800 text-white hover:bg-gray-800 hover:text-white text-base sm:text-lg p-4 sm:p-6",
                  !startDate && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 sm:mr-4 h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                {startDate ? format(startDate, 'PPP', { locale: dateLocale }) : <span>{t('cronograma.chooseDate')}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-black border-gray-700 text-white">
              <CalendarComponent
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
                locale={dateLocale}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {/* --- DESKTOP VIEW --- */}
        <div className="hidden sm:flex sm:flex-row justify-center items-stretch sm:items-start gap-4 sm:gap-8 mb-6 sm:mb-12 relative">
            <div className="absolute top-10 left-0 right-0 h-1 bg-gray-800 z-0"></div>
            {phases.map((phase, index) => (
              <div 
                key={phase.id}
                className="flex flex-col items-center gap-0 flex-1 relative z-10 p-0"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2">
                   <motion.div
                      className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/50 cursor-pointer"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1, type: 'spring' }}
                      whileHover={{ scale: 1.1, boxShadow: "0 0 25px rgba(var(--color-primary-rgb), 0.8)" }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <phase.icon className="w-10 h-10 text-black" />
                    </motion.div>
                </div>

                <motion.div
                  className="text-center pt-24 w-full"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <h3 className="text-xl font-bold text-white mb-1">{phase.title}</h3>
                  <p className="text-gray-400 mb-2 h-12 flex items-center justify-center text-sm">{phase.subtitle}</p>
                  <p className="text-primary font-semibold text-xs">{phase.dateRange}</p>
                </motion.div>
              </div>
            ))}
        </div>

        {/* --- MOBILE VIEW --- */}
        <div className="sm:hidden relative px-4">
          <div className="absolute left-12 top-0 bottom-0 w-0.5 bg-primary/30"></div>
          {phases.map((phase, index) => (
            <motion.div
              key={phase.id}
              className="flex items-start gap-6 mb-8 relative"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <div className="flex-shrink-0 z-10">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                  <phase.icon className="w-8 h-8 text-black" />
                </div>
              </div>
              <div className="pt-1">
                <h3 className="text-xl font-bold text-white">{phase.title}</h3>
                <p className="text-base text-gray-400 mt-1">{phase.subtitle}</p>
                <p className="text-sm text-primary font-semibold mt-1">{phase.dateRange}</p>
              </div>
            </motion.div>
          ))}
        </div>

      </motion.div>
    </div>
  );
};

export default CronogramaSection;