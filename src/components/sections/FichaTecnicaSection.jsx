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
    const newTechnicalData = mainTabTemplate.technical_data.map(item => ({ ...item, id: `tech_${Date.now()}_${Math.random()}` }));
    const newComponents = mainTabTemplate.components.map(item => ({ ...item, id: `comp_${Date.now()}_${Math.random()}` }));
    const newTab = { ...defaultContentSingle, tabTitle: `Nueva Ficha`, technical_data: newTechnicalData, components: newComponents, image: '' };
    updateAllContent([...content, newTab]);
    setActiveTab(content.length);
    toast({ title: 'Nueva ficha creada', description: 'Se ha duplicado la estructura base.' });
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
      className={cn(
        "rounded-2xl border backdrop-blur-sm transition-colors duration-300",
        isEditorMode ? "bg-gray-900/90 border-blue-500/30 p-6 sm:p-8" : "bg-gray-900/50 border-gray-800 p-6 sm:p-8"
      )}
    >
      <EditableField
        value={currentTabData[titleKey] || defaultTitle}
        onSave={(newValue) => handleCategoryTitleChange(titleKey, newValue)}
        isEditorMode={isEditorMode}
        className={cn(
          "font-bold text-primary mb-6",
          isEditorMode ? "text-3xl bg-gray-800 p-2 rounded border border-gray-700 focus:border-blue-500" : "text-2xl sm:text-3xl"
        )}
        tag="h2"
        placeholder="Título de sección..."
      />

      <div className="space-y-4">
        <AnimatePresence>
          {currentTabData[category] && currentTabData[category].map((item, index) => {
            const Icon = iconMap[item.icon] || iconMap['FileText'];
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "flex items-center justify-between rounded-lg gap-4 transition-all",
                  isEditorMode
                    ? "p-4 bg-gray-800/50 border border-gray-700 hover:border-blue-500/50 hover:bg-gray-800"
                    : "p-3 bg-black/30 border border-transparent"
                )}
              >
                <div className="flex items-center gap-4 flex-1">
                  {isEditorMode ? (
                    <IconPicker value={item.icon} onChange={(newIcon) => handleSave(category, index, 'icon', newIcon)} isEditorMode={isEditorMode}>
                      <Button variant="secondary" size="icon" className="h-12 w-12 shrink-0 cursor-pointer bg-gray-700 hover:bg-gray-600 text-primary border border-gray-600">
                        <Icon className="w-6 h-6" />
                      </Button>
                    </IconPicker>
                  ) : (
                    <div className="h-10 w-10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-[#2563eb]" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <EditableField
                      value={item.label}
                      onSave={(newValue) => handleSave(category, index, 'label', newValue)}
                      isEditorMode={isEditorMode}
                      className={cn(
                        "text-left",
                        isEditorMode
                          ? "font-bold text-lg bg-black/40 border border-gray-600 rounded px-3 py-2 text-white w-full focus:ring-2 focus:ring-blue-500"
                          : "font-semibold text-base sm:text-lg text-[#2563eb]"
                      )}
                      placeholder="Etiqueta (ej: Potencia)"
                      tag="div"
                    />
                  </div>
                </div>

                <div className="text-right flex items-center gap-3">
                  <div className="flex flex-col gap-1 min-w-[8rem] max-w-[14rem]">
                    <EditableField
                      value={item.value}
                      onSave={(newValue) => handleSave(category, index, 'value', newValue)}
                      isEditorMode={isEditorMode}
                      className={cn(
                        "text-center break-words",
                        isEditorMode
                          ? "font-bold text-lg bg-black/40 border border-gray-600 rounded px-3 py-2 text-white w-full focus:ring-2 focus:ring-blue-500"
                          : "font-bold text-lg sm:text-xl text-white"
                      )}
                      placeholder="Valor"
                      tag="div"
                    />

                    {/* Units or secondary text */}
                    {(item.unit || isEditorMode) && (
                      <EditableField
                        value={item.unit}
                        onSave={(newValue) => handleSave(category, index, 'unit', newValue)}
                        isEditorMode={isEditorMode}
                        className={cn(
                          "text-center",
                          isEditorMode
                            ? "text-sm bg-black/40 border border-gray-600 rounded px-2 py-1 text-gray-300 w-full mt-1"
                            : "text-xs sm:text-sm text-gray-400"
                        )}
                        placeholder="Unidad"
                        tag="div"
                      />
                    )}
                  </div>

                  {isEditorMode && (
                    <div className="flex items-center gap-1 pl-2 border-l border-gray-700 ml-2">
                      <div className="flex flex-col">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white" onClick={() => handleMoveItem(category, index, -1)} disabled={index === 0}><ArrowUp className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white" onClick={() => handleMoveItem(category, index, 1)} disabled={index === currentTabData[category].length - 1}><ArrowDown className="w-4 h-4" /></Button>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"><Plus className="w-4 h-4 rotate-45" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                          <DropdownMenuItem onClick={() => handleDuplicateItem(category, index)} className="text-white hover:bg-gray-800 cursor-pointer"><Copy className="w-4 h-4 mr-2" />Duplicar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRemoveItem(category, index)} className="text-red-400 hover:bg-red-900/30 cursor-pointer"><Trash2 className="w-4 h-4 mr-2" />Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      {isEditorMode && (
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={() => handleAddItem(category)}
            className="border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-primary hover:bg-primary/10 w-full py-6"
          >
            <Plus className="w-5 h-5 mr-2" />
            Añadir nueva fila a {currentTabData[titleKey]}
          </Button>
        </div>
      )}
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
          {/* Tabs Navigation */}
          <div className="flex items-center border-b border-gray-700 mb-8">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 max-w-full scrollbar-hide">
              {content.map((tab, index) => (
                <div
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={cn(
                    "relative group cursor-pointer px-1 transition-all",
                    activeTab === index ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                  )}
                >
                  <div className={cn(
                    "px-6 py-3 text-sm font-medium rounded-t-lg whitespace-nowrap transition-all flex items-center justify-center min-w-[120px]",
                    activeTab === index
                      ? 'bg-primary/10 text-[#2563eb] border-b-2 border-[#2563eb] shadow-[0_4px_10px_-4px_rgba(37,99,235,0.5)]'
                      : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-[#2563eb] hover:drop-shadow-[0_0_8px_rgba(37,99,235,0.5)]',
                    isEditorMode && "border border-gray-800 border-b-0 bg-gray-900/50"
                  )}>
                    {isEditorMode ? (
                      <EditableField
                        value={tab.tabTitle}
                        onSave={handleRenameTab}
                        isEditorMode={isEditorMode}
                        className="text-center font-bold bg-gray-800 border border-gray-600 rounded px-2 py-1 min-w-[100px] focus:ring-2 focus:ring-primary"
                        placeholder="Nombre Ficha"
                      />
                    ) : (
                      tab.tabTitle
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2 pb-2 pl-4 border-l border-gray-800">
              {isEditorMode && (
                <>
                  <Button variant="outline" size="sm" onClick={handleAddTab} className="border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-primary">
                    <Plus className="w-4 h-4 mr-2" /> Nueva Ficha
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white"><Edit className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                      <DropdownMenuItem onClick={handleDuplicateTab} className="text-white hover:bg-gray-800 cursor-pointer"><Copy className="w-4 h-4 mr-2" />Duplicar Ficha Actual</DropdownMenuItem>
                      <DropdownMenuItem onClick={handleRemoveTab} disabled={content.length <= 1} className="text-red-400 hover:bg-red-900/30 cursor-pointer"><Trash2 className="w-4 h-4 mr-2" />Eliminar Ficha Actual</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>

          {/* Content Area */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {renderList('technical_data', 'technicalDataTitle', 'Datos Técnicos')}
                {renderList('components', 'componentsTitle', 'Componentes')}
              </div>

              <div className="mt-12">
                {currentTabData.image && (
                  <div className={cn("relative group w-full max-w-3xl mx-auto", isEditorMode && "border-2 border-dashed border-gray-700 rounded-xl p-4")}>
                    <img src={currentTabData.image} alt={`Imagen de ${currentTabData.tabTitle}`} className="rounded-lg shadow-2xl object-contain mx-auto max-h-[500px]" />
                    {isEditorMode && (
                      <div className="absolute top-6 right-6 flex gap-2">
                        <Button onClick={handleRemoveImage} variant="destructive" size="icon" className="shadow-lg">
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {isEditorMode && !currentTabData.image && (
                  <div className="text-center p-12 border-2 border-dashed border-gray-800 rounded-xl bg-gray-900/30 hover:bg-gray-900/50 transition-colors">
                    <div className="mb-4">
                      <Upload className="w-12 h-12 text-gray-600 mx-auto" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">Imagen del Equipo</h3>
                    <p className="text-gray-500 mb-6">Sube una imagen técnica o fotografía del equipo para esta ficha.</p>

                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                    <Button variant="outline" onClick={() => fileInputRef.current.click()} disabled={isUploading} className="min-w-[200px]">
                      {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                      {isUploading ? 'Subiendo...' : 'Seleccionar Imagen'}
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