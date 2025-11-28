import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, Droplet, HardHat, Wheat, XCircle } from 'lucide-react';
import SectionHeader from '@/components/SectionHeader';

const exclusionesData = [
  {
    icon: Wrench,
    title: 'Maniobras de Descarga y Montaje',
    description: 'El cliente debe proveer personal y equipo (grúa, montacargas) para la descarga y montaje de la máquina.',
  },
  {
    icon: Droplet,
    title: 'Sistema de Abastecimiento de Agua',
    description: 'La instalación de tuberías, conexiones y sistemas de recirculación de agua no están incluidos.',
  },
  {
    icon: HardHat,
    title: 'Obra Civil y Adecuaciones',
    description: 'Cualquier modificación estructural o trabajos de construcción en el área de instalación son responsabilidad del cliente.',
  },
  {
    icon: Wheat,
    title: 'Materias Primas Iniciales',
    description: 'Los ingredientes y materiales de empaque para las pruebas de producción y arranque no están incluidos.',
  },
];

const ExclusionesSection = ({ sectionData }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  return (
    <div id="exclusiones" className="py-12 sm:py-24 bg-black text-white">
      <div className="container mx-auto px-4">
        <SectionHeader
          sectionData={{
            ...sectionData,
            icon: 'XCircle',
            label: 'Exclusiones de la Propuesta',
          }}
          titleClassName="text-3xl md:text-5xl font-bold mb-12"
        />
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {exclusionesData.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={index}
                className="flex items-start space-x-6 p-6 rounded-2xl bg-gray-900/50 border border-gray-800/80 transition-all duration-300 hover:bg-gray-900 hover:border-primary/50"
                variants={itemVariants}
              >
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-white">{item.title}</h3>
                  <p className="text-gray-400 text-base">{item.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default ExclusionesSection;