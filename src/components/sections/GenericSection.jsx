import React from 'react';
import SectionHeader from '@/components/SectionHeader';
import { motion } from 'framer-motion';
import { PenSquare } from 'lucide-react';

const GenericSection = ({ sectionData }) => {
  return (
    <div className="py-12 sm:py-24">
      <SectionHeader sectionData={sectionData} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center text-gray-500 max-w-md mx-auto flex flex-col items-center gap-4"
      >
        <PenSquare className="w-16 h-16 text-gray-700" />
        <h3 className="text-xl font-bold text-gray-400">Sección en Construcción</h3>
        <p className="text-sm">
          Este es un espacio reservado para tu nuevo contenido. Puedes empezar a editar esta sección en el "Modo Editor".
        </p>
      </motion.div>
    </div>
  );
};

export default GenericSection;