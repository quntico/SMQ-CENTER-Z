import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import SectionHeader from '@/components/SectionHeader';
import EditableField from '@/components/EditableField';
import IconPicker from '@/components/IconPicker';
import { iconMap } from '@/lib/iconMap';
import { Plus, Trash2, Copy, ArrowUp, ArrowDown, Edit, Upload, Loader2, FileDown as DownloadIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from '@/lib/customSupabaseClient';
import { getActiveBucket } from '@/lib/bucketResolver.js';
import { generateFichasTecnicasPDF } from '@/lib/pdfGenerator';

const defaultContentSingle = {
  tabTitle: 'Ficha Principal',
  image: '',
  technicalDataTitle: 'Datos Técnicos',
  componentsTitle: 'Componentes',
  technical_data: [
    { id: 'produccion', icon: 'TrendingUp', label: 'Producción', unit: 'unidades', value: '200 - 300' },
    { id: 'ancho', icon: 'Scale', label: 'Ancho', unit: 'mm', value: '900' },
    { id: 'espesor', icon: 'Layers', label: 'Espesor', unit: 'mm', value: '6' },
    { id: 'potencia', icon: 'Power', label: 'Potencia', unit: 'KW', value: '30' },
    { id: 'dimensiones', icon: 'Maximize', label: 'Dimensiones', unit: 'M', value: '3.5 x 2.2 x 2' },
  ],
  components: [
    { id: 'motor', icon: 'Wrench', label: 'Motor Principal', value: 'SIEMENS' },
    { id: 'plc', icon: 'Server', label: 'PLC', value: 'SIEMENS' },
    { id: 'pantalla', icon: 'Zap', label: 'Pantalla Táctil', value: 'SIEMENS' },
    { id: 'bomba', icon: 'Wind', label: 'Bomba de Vacío', value: 'SIEMENS' },
    { id: 'neumaticos', icon: 'Zap', label: 'Componentes Neumáticos', value: 'FESTO' },
  ],
};

const FichaTecnicaSection = ({ sectionData, quotationData, isEditorMode, onContentChange }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const fileInputRef = useRef(null);

  const migratedContent = (() => {
    const originalContent = sectionData?.content;
    if (!originalContent) return [defaultContentSingle];
    if (Array.isArray(originalContent)) {
      return originalContent.length > 0 ? originalContent.map(tab => ({ ...defaultContentSingle, ...tab })) : [defaultContentSingle];
    }
    if (originalContent.technical_data || originalContent.components) {
      return [{ ...defaultContentSingle, ...originalContent }];
    }
    return [defaultContentSingle];
  })();

  const content = migratedContent;
  const currentTabData = content[activeTab] || defaultContentSingle;

  useEffect(() => {
    if (activeTab >= content.length) {
      setActiveTab(content.length > 0 ? content.length - 1 : 0);
    }
  }, [content, activeTab]);

  const updateAllContent = (newContent) => {
    onContentChange(newContent);
  };
  
  const updateCurrentTab = (newData) => {
    const newContent = [...content];
    newContent[activeTab] = newData;
    updateAllContent(newContent);
  };

  const handleSave = (category, index, field, newValue) => {
    const updatedCategory = [...currentTabData[category]];
    updatedCategory[index] = { ...updatedCategory[index], [field]: newValue };
    updateCurrentTab({ ...currentTabData, [category]: updatedCategory });
    toast({ title: 'Ficha técnica actualizada ☁️', description: 'El cambio se ha guardado en la nube.' });
  };
  
  const handleDuplicateItem = (category, index) => {
    const itemToDuplicate = currentTabData[category][index];
    const duplicatedItem = { ...itemToDuplicate, id: `copy_${Date.now()}` };
    const updatedCategory = [...currentTabData[category]];
    updatedCategory.splice(index + 1, 0, duplicatedItem);
    updateCurrentTab({ ...currentTabData, [category]: updatedCategory });
    toast({ title: 'Fila duplicada' });
  };

  const handleMoveItem = (category, index, direction) => {
    const list = [...currentTabData[category]];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= list.length) return;
    const item = list.splice(index, 1)[0];
    list.splice(newIndex, 0, item);
    updateCurrentTab({ ...currentTabData, [category]: list });
  };

  const handleRemoveItem = (category, index) => {
    const updatedCategory = currentTabData[category].filter((_, i) => i !== index);
    updateCurrentTab({ ...currentTabData, [category]: updatedCategory });
    toast({ title: 'Fila eliminada', variant: 'destructive' });
  };

  const handleAddItem = (category) => {
    const newItem = {
      id: `new_${Date.now()}`,
      icon: 'FileText',
      label: 'Nueva Característica',
      value: 'Valor',
      ...(category === 'technical_data' && { unit: 'unidad' }),
    };
    const updatedCategory = [...(currentTabData[category] || []), newItem];
    updateCurrentTab({ ...currentTabData, [category]: updatedCategory });
    toast({ title: 'Nueva fila añadida' });
  };
  
  const handleAddTab = () => {
    const mainTabTemplate = content[0] || defaultContentSingle;
    const newTechnicalData = mainTabTemplate.technical_data.map(item => ({...item, id: `tech_${Date.now()}_${Math.random()}`}));
    const newComponents = mainTabTemplate.components.map(item => ({...item, id: `comp_${Date.now()}_${Math.random()}`}));
    const newTab = { ...defaultContentSingle, tabTitle: `Alimentador de Vacío`, technical_data: newTechnicalData, components: newComponents, image: '' };
    updateAllContent([...content, newTab]);
    setActiveTab(content.length);
    toast({ title: 'Nueva ficha creada', description: 'Se ha duplicado la Ficha Principal para que la edites.' });
  };
  
  const handleDuplicateTab = () => {
    const tabToDuplicate = content[activeTab];
    const newTab = JSON.parse(JSON.stringify(tabToDuplicate));
    newTab.tabTitle = `${newTab.tabTitle} (Copia)`;
    newTab.technical_data.forEach(item => item.id = `tech_dup_${Date.now()}_${Math.random()}`);
    newTab.components.forEach(item => item.id = `comp_dup_${Date.now()}_${Math.random()}`);
    updateAllContent([...content, newTab]);
    setActiveTab(content.length);
    toast({ title: 'Ficha duplicada' });
  };

  const handleRemoveTab = () => {
    if (content.length <= 1) {
      toast({ title: 'Acción no permitida', description: 'Debe haber al menos una ficha técnica.', variant: 'destructive' });
      return;
    }
    const newContent = content.filter((_, i) => i !== activeTab);
    updateAllContent(newContent);
    toast({ title: 'Ficha eliminada', variant: 'destructive' });
  };

  const handleRenameTab = (newTitle) => {
    updateCurrentTab({ ...currentTabData, tabTitle: newTitle });
  };
  
  const handleCategoryTitleChange = (titleKey, newTitle) => {
    updateCurrentTab({ ...currentTabData, [titleKey]: newTitle });
    toast({ title: 'Título actualizado ☁️' });
  };

  const handleImageUpload = async (event) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const fileName = `${Date.now()}_${sanitizedFileName}`;
    
    setIsUploading(true);
    try {
      const BUCKET = await getActiveBucket();
      const { data, error } = await supabase.storage.from(BUCKET).upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
      updateCurrentTab({ ...currentTabData, image: publicUrl });
      toast({ title: 'Imagen subida con éxito!' });
    } catch (error) {
      toast({ title: 'Error al subir imagen', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    updateCurrentTab({ ...currentTabData, image: '' });
    toast({ title: 'Imagen eliminada', variant: 'destructive' });
  };

  const handleExportPDF = async () => {
    setIsGeneratingPDF(true);
    toast({ title: 'Generando PDF...', description: 'Esto puede tardar unos segundos.' });
    try {
      await generateFichasTecnicasPDF(content, quotationData);
      toast({ title: '¡PDF generado!', description: 'La descarga comenzará en breve.' });
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast({ title: 'Error al generar el PDF', description: error.message, variant: 'destructive' });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const renderList = (category, titleKey, defaultTitle) => (
    <motion.div 
      initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
      className="bg-gray-900/50 p-6 sm:p-8 rounded-2xl border border-gray-800 backdrop-blur-sm"
    >
      <EditableField value={currentTabData[titleKey] || defaultTitle} onSave={(newValue) => handleCategoryTitleChange(titleKey, newValue)} isEditorMode={isEditorMode} className="text-2xl sm:text-3xl font-bold text-primary mb-6" tag="h2"/>
      <div className="space-y-4">
        <AnimatePresence>
          {currentTabData[category] && currentTabData[category].map((item, index) => {
            const Icon = iconMap[item.icon] || iconMap['FileText'];
            return (
              <motion.div key={item.id} layout initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="flex items-center justify-between p-3 bg-black/30 rounded-lg gap-2">
                <div className="flex items-center gap-3 flex-1">
                  {isEditorMode ? (
                    <IconPicker value={item.icon} onChange={(newIcon) => handleSave(category, index, 'icon', newIcon)}>
                      <Button variant="ghost" size="icon" className="h-10 w-10 cursor-pointer hover:bg-primary/20"><Icon className="w-6 h-6 text-primary/80" /></Button>
                    </IconPicker>
                  ) : <Icon className="w-6 h-6 text-primary/80" />}
                  <div className="flex-1">
                    <EditableField value={item.label} onSave={(newValue) => handleSave(category, index, 'label', newValue)} isEditorMode={isEditorMode} className="font-semibold text-base sm:text-lg text-left" tag="div" />
                  </div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div className="min-w-[7rem] max-w-[12rem] flex-shrink">
                    <EditableField value={item.value} onSave={(newValue) => handleSave(category, index, 'value', newValue)} isEditorMode={isEditorMode} className="font-bold text-lg sm:text-xl text-white text-center break-words" tag="div" />
                    {item.unit && <EditableField value={item.unit} onSave={(newValue) => handleSave(category, index, 'unit', newValue)} isEditorMode={isEditorMode} className="text-xs sm:text-sm text-gray-400 text-center" tag="div" />}
                  </div>
                  {isEditorMode && (
                    <><div className="flex flex-col items-center gap-1">
                       <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMoveItem(category, index, -1)} disabled={index === 0}><ArrowUp className="w-4 h-4" /></Button>
                       <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMoveItem(category, index, 1)} disabled={index === currentTabData[category].length - 1}><ArrowDown className="w-4 h-4" /></Button>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9"><Plus className="w-4 h-4 rotate-45" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleDuplicateItem(category, index)}><Copy className="w-4 h-4 mr-2"/>Duplicar Fila</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRemoveItem(category, index)} className="text-red-500"><Trash2 className="w-4 h-4 mr-2"/>Eliminar Fila</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu></>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      {isEditorMode && (<div className="mt-6 text-center"><Button variant="outline" onClick={() => handleAddItem(category)}><Plus className="w-4 h-4 mr-2" />Añadir Fila</Button></div>)}
    </motion.div>
  );

  return (
    <div className="py-16 sm:py-24 bg-gradient-to-b from-black to-gray-900/50 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8 sm:mb-12">
            <div className="flex-1">
                <SectionHeader sectionData={sectionData} />
            </div>
            <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isGeneratingPDF} className="ml-4 flex-shrink-0">
                {isGeneratingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <DownloadIcon className="w-4 h-4 mr-2" />}
                {isGeneratingPDF ? 'Generando...' : 'Exportar PDF'}
            </Button>
        </div>

        <div className="mt-12">
          <div className="flex items-center border-b border-gray-700 mb-8">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {content.map((tab, index) => (
                <button key={index} onClick={() => setActiveTab(index)} className={cn("px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors", activeTab === index ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-gray-400 hover:bg-white/5 hover:text-white')}>
                  {isEditorMode ? <EditableField value={tab.tabTitle} onSave={handleRenameTab} isEditorMode={isEditorMode} className="text-center" /> : tab.tabTitle}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2 pb-2">
              {isEditorMode && (
                <>
                  <Button variant="ghost" size="icon" onClick={handleAddTab}><Plus className="w-5 h-5" /></Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={handleDuplicateTab}><Copy className="w-4 h-4 mr-2" />Duplicar Ficha Actual</DropdownMenuItem>
                      <DropdownMenuItem onClick={handleRemoveTab} disabled={content.length <= 1} className="text-red-500"><Trash2 className="w-4 h-4 mr-2" />Eliminar Ficha Actual</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {renderList('technical_data', 'technicalDataTitle', 'Datos Técnicos')}
                {renderList('components', 'componentsTitle', 'Componentes')}
              </div>
              <div className="mt-12">
                {currentTabData.image && (
                  <div className="relative group w-full max-w-3xl mx-auto px-10">
                    <img src={currentTabData.image} alt={`Imagen de ${currentTabData.tabTitle}`} className="rounded-lg shadow-2xl object-contain mx-auto" />
                    {isEditorMode && (
                      <Button onClick={handleRemoveImage} variant="destructive" size="icon" className="absolute top-4 right-14 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                )}
                {isEditorMode && !currentTabData.image && (
                  <div className="text-center">
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                    <Button variant="outline" onClick={() => fileInputRef.current.click()} disabled={isUploading}>
                      {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                      {isUploading ? 'Subiendo...' : 'Subir Imagen del Equipo'}
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default FichaTecnicaSection;