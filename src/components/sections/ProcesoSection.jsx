import React, { useState, useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Layers, LayoutTemplate, Scissors, Package, Edit, Save, X, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import SectionHeader from '@/components/SectionHeader';

const iconMap = {
  extrusión: Layers,
  formado: LayoutTemplate,
  corte: Scissors,
  apilado: Package,
};

const EditableItem = ({ value, onSave, isEditorMode, className = '', tag: Tag = 'p' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(text);
    setIsSaving(false);
    setIsEditing(false);
  };
  
  const cleanText = value.replace(/^- /, '');

  if (!isEditorMode) {
    return <Tag className={className}>{cleanText}</Tag>;
  }

  return (
    <div className="relative group">
      {isEditing ? (
        <div className="flex items-center gap-2">
          <input
            value={text.replace(/^- /, '')}
            onChange={(e) => setText(`- ${e.target.value}`)}
            className="w-full bg-gray-900 border border-primary rounded-md p-1 text-white focus:outline-none"
          />
          <button onClick={handleSave} className="p-1.5 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:bg-gray-500" disabled={isSaving}>
            {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          </button>
          <button onClick={() => setIsEditing(false)} className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700">
            <X size={12} />
          </button>
        </div>
      ) : (
        <Tag onClick={() => setIsEditing(true)} className={`${className} cursor-pointer p-1 border border-transparent group-hover:border-primary/30 rounded-md transition-all relative`}>
          <Edit className="absolute -top-0.5 -right-0.5 w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          {cleanText}
        </Tag>
      )}
    </div>
  );
};


const ProcesoSection = ({ sectionData, isEditorMode, onContentChange }) => {
  const { toast } = useToast();
  const timelineRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start end", "end start"]
  });
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });


  const defaultContent = {
    steps: [
      {
        id: 'extrusión',
        title: '01 - Extrusión de Alta Precisión',
        details: [
          '- Extrusora SJ120/38 con tornillo único',
          '- Capacidad de fusión hasta 600kg/h',
          '- Control de temperatura avanzado',
          '- Homogeneización perfecta del material',
        ],
      },
      {
        id: 'formado',
        title: '02 - Sistema de Formado',
        details: [
          '- Molde T de acero 5CrNiMo',
          '- Ancho efectivo 1300mm',
          '- Calibración automática',
          '- Enfriamiento controlado por agua',
        ],
      },
      {
        id: 'corte',
        title: '03 - Corte y Acabado',
        details: [
          '- Cortadora de precisión automática',
          '- Dimensiones exactas 900mm x 6mm',
          '- Sistema neumático de ajuste',
          '- Control de velocidad variable',
        ],
      },
      {
        id: 'apilado',
        title: '04 - Apilado Automático',
        details: [
          '- Sistema de apilado de 3 metros',
          '- Organización automática',
          '- Capacidad 200-300 piezas por hora',
          '- Listo para empaque inmediato',
        ],
      },
    ],
  };

  const content = { ...defaultContent, ...sectionData.content };

  const handleSave = (stepId, updatedItem, itemIndex = -1) => {
    const newSteps = content.steps.map(step => {
      if (step.id === stepId) {
        if (itemIndex === -1) { // -1 means it's the title
          return { ...step, title: updatedItem };
        }
        const newDetails = [...step.details];
        newDetails[itemIndex] = updatedItem;
        return { ...step, details: newDetails };
      }
      return step;
    });

    onContentChange({ ...content, steps: newSteps });
    toast({ title: 'Proceso actualizado ☁️', description: 'Los cambios se han guardado en la nube.' });
  };


  return (
    <div className="py-16 sm:py-24 bg-black text-white">
      <div className="max-w-7xl mx-auto px-4">
        <SectionHeader sectionData={sectionData} />
        
        <div ref={timelineRef} className="relative mt-16 max-w-5xl mx-auto">
          {/* Animated Vertical line */}
          <motion.div 
            className="absolute left-8 sm:left-1/2 top-0 bottom-0 w-0.5 bg-primary origin-top"
            style={{ scaleY, transformOrigin: 'top', translateX: '-50%' }}
          />
          
          <div className="space-y-16">
            {content.steps.map((step, index) => {
              const IconComponent = iconMap[step.id] || Layers;
              const isLeft = index % 2 === 0;

              return (
                <div key={step.id} className="grid grid-cols-[auto_1fr] sm:grid-cols-[1fr_auto_1fr] items-start gap-x-6 sm:gap-x-8">
                  {/* Left Card (Desktop only) */}
                  {isLeft && (
                     <motion.div
                      initial={{ x: -50, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ duration: 0.6 }}
                      className="hidden sm:block bg-gray-900/50 p-6 rounded-xl border border-gray-800 backdrop-blur-sm text-right"
                    >
                      <TimelineCardContent step={step} isEditorMode={isEditorMode} handleSave={handleSave} isLeft={true} />
                    </motion.div>
                  )}
                  {!isLeft && <div className="hidden sm:block"></div>}
                  
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true, amount: 0.8 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                    className="row-start-1 sm:col-start-2 sm:row-start-auto z-10 p-3 sm:p-4 bg-gray-900 rounded-full border-2 border-primary"
                  >
                    <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                  </motion.div>
                  
                  {/* Right Card (or Mobile Card) */}
                   <motion.div
                    initial={{ x: isLeft ? 0 : 50, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.6 }}
                    className={`bg-gray-900/50 p-6 rounded-xl border border-gray-800 backdrop-blur-sm ${!isLeft ? 'sm:block' : 'sm:hidden'}`}
                  >
                    <TimelineCardContent step={step} isEditorMode={isEditorMode} handleSave={handleSave} isLeft={false} />
                  </motion.div>
                   {!isLeft && <div className="hidden sm:block"></div>}

                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const TimelineCardContent = ({ step, isEditorMode, handleSave, isLeft }) => (
  <>
    <h3 className="text-base font-bold text-white mb-2 sm:text-lg"> {/* Adjusted text size for mobile */}
      <EditableItem
        value={step.title}
        onSave={(newTitle) => handleSave(step.id, newTitle)}
        isEditorMode={isEditorMode}
        className={`font-bold text-base sm:text-lg ${isLeft ? 'sm:justify-end' : 'justify-start'}`} // Kept for consistency, text-base is effective
        tag="div"
      />
    </h3>
    <ul className={`space-y-1.5 text-gray-400 text-sm ${isLeft ? 'sm:items-end' : 'items-start'} flex flex-col`}> {/* Adjusted text size for mobile */}
      {step.details.map((detail, detailIndex) => (
        <li key={detailIndex} className="flex items-center gap-2">
          <EditableItem
            value={detail}
            onSave={(newDetail) => handleSave(step.id, newDetail, detailIndex)}
            isEditorMode={isEditorMode}
          />
        </li>
      ))}
    </ul>
  </>
);


export default ProcesoSection;