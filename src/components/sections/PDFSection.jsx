import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Trash2, Eye, Download, Plus, Save, Edit, X, Lock, Unlock, Loader2, FilePlus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import SectionHeader from '@/components/SectionHeader';

const AdminLoginDialog = ({ isOpen, onClose, onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (password === '2025') {
      onLogin();
      onClose();
      setPassword('');
      setError('');
    } else {
      setError('Contraseña incorrecta.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Acceso de Administrador</DialogTitle>
          <DialogDescription>Ingresa la contraseña para activar el modo administrador.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>Ingresar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AddQuotationDialog = ({ isOpen, onClose, onAdd, activeTheme }) => {
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const resetState = () => {
        setName('');
        setFile(null);
        setIsUploading(false);
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === "application/pdf") {
            setFile(selectedFile);
        } else if (selectedFile) {
            toast({ title: "Archivo no válido", description: "Por favor, selecciona un archivo PDF.", variant: "destructive" });
        }
    };
    
    const handleSubmit = async () => {
        if (!name.trim() || !file) {
            toast({ title: "Faltan datos", description: "Por favor, ingresa un nombre y selecciona un archivo PDF.", variant: "destructive" });
            return;
        }

        setIsUploading(true);
        try {
            // 1. Insert DB record to get an ID
            const { data: dbData, error: dbError } = await supabase
                .from('pdf_quotations')
                .insert({ name: name.trim(), theme_key: activeTheme, file_path: 'uploading' })
                .select()
                .single();

            if (dbError) throw dbError;

            // 2. Upload file to storage with the new ID
            const filePath = `${activeTheme}/${dbData.id}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            const { error: uploadError } = await supabase.storage
                .from('quotation-pdfs')
                .upload(filePath, file);

            if (uploadError) {
                 await supabase.from('pdf_quotations').delete().eq('id', dbData.id);
                 throw uploadError;
            }

            // 3. Update DB record with the final file path
            const { data: updatedData, error: updateError } = await supabase
                .from('pdf_quotations')
                .update({ file_path: filePath })
                .eq('id', dbData.id)
                .select()
                .single();
            
            if (updateError) throw updateError;
            
            onAdd(updatedData);
            toast({ title: "Éxito", description: "Nueva cotización añadida correctamente." });
            resetState();
            onClose();

        } catch (error) {
            toast({ title: "Error", description: `No se pudo añadir la cotización: ${error.message}`, variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if(!open) { resetState(); onClose(); } }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Añadir Nueva Cotización</DialogTitle>
                    <DialogDescription>Ingresa el nombre y sube el archivo PDF correspondiente.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <Input
                        placeholder="Nombre de la cotización"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isUploading}
                    />
                    <Input 
                        type="file" 
                        accept=".pdf" 
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isUploading}
                    />
                    <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                        <Upload className="w-4 h-4 mr-2" />
                        {file ? `Archivo: ${file.name}` : 'Seleccionar PDF'}
                    </Button>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => { resetState(); onClose(); }} disabled={isUploading}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={!name.trim() || !file || isUploading}>
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        Añadir Cotización
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const PDFSection = ({ isEditorMode, setIsEditorMode, activeTheme, sectionData }) => {
  const { toast } = useToast();
  const [quotations, setQuotations] = useState([]);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);

  const fetchQuotations = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('pdf_quotations')
      .select('*')
      .eq('theme_key', activeTheme)
      .order('created_at', { ascending: true });

    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar las cotizaciones.", variant: "destructive" });
    } else {
      setQuotations(data);
      if (data.length > 0 && !selectedQuotation) {
        setSelectedQuotation(data[0]);
      } else if (data.length === 0) {
        setSelectedQuotation(null);
      }
    }
    setIsLoading(false);
  }, [activeTheme, toast, selectedQuotation]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  const handleAdminToggle = () => {
    if (isEditorMode) {
      setIsEditorMode(false);
      setEditingQuotation(null);
      toast({ title: "Modo Editor Desactivado" });
    } else {
      setIsLoginDialogOpen(true);
    }
  };

  const handleLoginSuccess = () => {
    setIsEditorMode(true);
    toast({ title: "Modo Editor Activado", description: "Ahora puedes editar las cotizaciones." });
  };
  
  const handleAddSuccess = (newQuotation) => {
    setQuotations(prev => [...prev, newQuotation]);
    setSelectedQuotation(newQuotation);
  };

  const handleDeleteQuotation = async (id, filePath) => {
    if (filePath) {
      const { error: fileError } = await supabase.storage.from('quotation-pdfs').remove([filePath]);
      if (fileError) {
        toast({ title: "Error de Almacenamiento", description: `No se pudo eliminar el archivo: ${fileError.message}`, variant: "destructive" });
      }
    }

    const { error } = await supabase.from('pdf_quotations').delete().eq('id', id);
    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar la cotización.", variant: "destructive" });
    } else {
      const updatedQuotations = quotations.filter(q => q.id !== id);
      setQuotations(updatedQuotations);
      if (selectedQuotation?.id === id) {
        setSelectedQuotation(updatedQuotations.length > 0 ? updatedQuotations[0] : null);
      }
      toast({ title: "Éxito", description: "Cotización eliminada." });
    }
  };

  const handleNameChange = (id, newName) => {
    setQuotations(quotations.map(q => q.id === id ? { ...q, name: newName } : q));
  };

  const handleSaveName = async (id, name) => {
    const { error } = await supabase.from('pdf_quotations').update({ name }).eq('id', id);
    if (error) {
      toast({ title: "Error", description: "No se pudo guardar el nombre.", variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Nombre guardado." });
      setEditingQuotation(null);
    }
  };
  
  const getPublicUrl = (filePath) => {
    if (!filePath || filePath === 'uploading') return null;
    const { data } = supabase.storage.from('quotation-pdfs').getPublicUrl(filePath);
    return data.publicUrl;
  };

  return (
    <div className="py-4 sm:py-8 w-full">
      <AdminLoginDialog isOpen={isLoginDialogOpen} onClose={() => setIsLoginDialogOpen(false)} onLogin={handleLoginSuccess} />
      <AddQuotationDialog isOpen={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} onAdd={handleAddSuccess} activeTheme={activeTheme} />
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4 sm:gap-0">
          <SectionHeader sectionData={sectionData} />
          <Button variant="outline" onClick={handleAdminToggle} className="flex items-center gap-2 w-full sm:w-auto shrink-0 mt-4 sm:mt-12">
            {isEditorMode ? <Unlock className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-red-500" />}
            Modo Editor {isEditorMode ? 'ON' : 'OFF'}
          </Button>
        </div>
        <p className="text-gray-400 text-base sm:text-lg mb-6 sm:mb-12 text-center -mt-8">
          {isEditorMode ? 'Gestiona las cotizaciones.' : 'Selecciona una cotización para visualizarla.'}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Documentos</h2>
                {isEditorMode && (
                    <Button onClick={() => setIsAddDialogOpen(true)} className="text-sm sm:text-base">
                      <FilePlus className="w-4 h-4 mr-2" /> Añadir
                    </Button>
                )}
            </div>
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 space-y-2 min-h-[40vh] sm:min-h-[60vh] overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : quotations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                    <FileText className="w-10 h-10 sm:w-12 sm:h-12 mb-4"/>
                    <p className="text-sm sm:text-base">No hay cotizaciones.</p>
                    {isEditorMode && <p className="text-xs sm:text-sm">Haz clic en "Añadir" para empezar.</p>}
                </div>
              ) : (
                quotations.map((q, index) => (
                  <div key={q.id} className={ `p-3 rounded-lg transition-all cursor-pointer group ${selectedQuotation?.id === q.id ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-white/5'}` }>
                    <div className="flex justify-between items-center" onClick={() => !editingQuotation && setSelectedQuotation(q)}>
                      {editingQuotation === q.id ? (
                        <Input
                          value={q.name}
                          onChange={(e) => handleNameChange(q.id, e.target.value)}
                          className="flex-grow mr-2 h-8 text-sm sm:text-base"
                          autoFocus
                          onBlur={() => handleSaveName(q.id, q.name)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSaveName(q.id, q.name)}
                        />
                      ) : (
                        <span className="font-semibold text-white flex-grow truncate pr-2 text-sm sm:text-base">{index + 1}. {q.name}</span>
                      )}
                      
                      {isEditorMode && (
                        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {editingQuotation === q.id ? (
                             <Button size="icon" variant="ghost" onClick={() => setEditingQuotation(null)}><X className="w-4 h-4 text-gray-500" /></Button>
                          ) : (
                            <Button size="icon" variant="ghost" onClick={() => setEditingQuotation(q.id)}><Edit className="w-4 h-4 text-gray-400 hover:text-white" /></Button>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => handleDeleteQuotation(q.id, q.file_path)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedQuotation && getPublicUrl(selectedQuotation.file_path) ? (
              <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg overflow-hidden h-[60vh] sm:h-[75vh]">
                <div className="p-3 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <span className="text-white font-semibold truncate text-sm sm:text-base">{selectedQuotation.name}</span>
                  </div>
                  <a href={getPublicUrl(selectedQuotation.file_path)} download target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon"><Download className="w-4 h-4 sm:w-5 sm:h-5" /></Button>
                  </a>
                </div>
                <div className="h-full overflow-auto [-webkit-overflow-scrolling:touch]">
                  <iframe
                    src={getPublicUrl(selectedQuotation.file_path)}
                    className="w-full h-full"
                    title={selectedQuotation.name}
                  />
                </div>
              </div>
            ) : (
              <div className="h-[60vh] sm:h-full flex flex-col items-center justify-center bg-[#0a0a0a] border-2 border-dashed border-gray-800 rounded-lg text-center p-8">
                <Eye className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mb-4" />
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  {quotations.length > 0 ? 'Selecciona una cotización' : 'No hay cotizaciones para mostrar'}
                </h3>
                <p className="text-sm sm:text-base text-gray-500 mt-2">
                  {isEditorMode ? 'Añade una cotización para empezar.' : 'Elige un documento de la lista para visualizarlo.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PDFSection;