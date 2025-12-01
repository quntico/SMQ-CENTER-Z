import React, { useState, useRef } from 'react';
import ReactPlayer from 'react-player';
import { Upload, Link as LinkIcon, Save, Loader2, Video as VideoIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { getActiveBucket } from '@/lib/bucketResolver';

const VideoSection = ({ sectionData, quotationData, isEditorMode, onVideoUrlUpdate }) => {
  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  // The video URL comes from sectionData (merged with quotationData in MainContent)
  // In MainContent.jsx, handleVideoUrlUpdate updates the 'video_url' field in the root of quotationData.
  // However, MainContent passes 'sectionData' which is a merge of config and section props.
  // We need to check where the video URL is actually stored.
  // Looking at QuotationViewer.jsx: handleVideoUrlUpdate updates 'video_url' on the root object.
  // MainContent passes 'quotationData' as a prop too.
  // Let's use quotationData.video_url if available, falling back to sectionData.video_url.

  // The video URL is stored in the root of quotationData (managed by QuotationViewer)
  // We prioritize quotationData.video_url, but keep fallbacks just in case.
  const currentVideoUrl = quotationData?.video_url || sectionData.video_url || sectionData.content?.video_url || '';

  const handleUrlSave = () => {
    if (!urlInput.trim()) return;
    if (onVideoUrlUpdate) {
      onVideoUrlUpdate(urlInput.trim());
      toast({
        title: "URL Actualizada",
        description: "El video se ha vinculado correctamente.",
      });
      setUrlInput('');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Archivo inválido",
        description: "Por favor selecciona un archivo de video válido.",
        variant: "destructive"
      });
      return;
    }

    // Limit size (e.g., 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "Archivo demasiado grande",
        description: "El límite es de 50MB. Para videos más largos, usa YouTube.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const bucketName = await getActiveBucket();
      const fileExt = file.name.split('.').pop();
      const fileName = `videos/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      if (onVideoUrlUpdate) {
        onVideoUrlUpdate(publicUrl);
        toast({
          title: "Video subido",
          description: "El video se ha cargado y guardado correctamente.",
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error al subir",
        description: "No se pudo cargar el video. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearVideo = () => {
    if (onVideoUrlUpdate) {
      onVideoUrlUpdate('');
      toast({
        title: "Video eliminado",
        description: "Se ha quitado el video de la cotización.",
      });
    }
  };

  return (
    <div className="w-full min-h-[60vh] bg-black text-white p-6 sm:p-12 flex flex-col items-center justify-center">
      <div className="max-w-5xl w-full space-y-8">

        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight uppercase">
            Video <span className="text-blue-500">Demostrativo</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Conoce el funcionamiento y los detalles técnicos en acción.
          </p>
        </div>

        {/* Video Player Container */}
        <div className="relative w-full aspect-video bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl shadow-blue-900/10">
          {currentVideoUrl ? (
            <ReactPlayer
              url={currentVideoUrl}
              width="100%"
              height="100%"
              controls
              playing={false}
              config={{
                youtube: {
                  playerVars: { showinfo: 1 }
                }
              }}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 bg-[#0a0a0a]">
              <VideoIcon className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">No hay video disponible</p>
              {isEditorMode && <p className="text-sm opacity-60 mt-2">Usa el panel de abajo para agregar uno</p>}
            </div>
          )}
        </div>

        {/* Admin Controls */}
        {isEditorMode && (
          <div className="bg-[#111] border border-gray-800 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-800">
              <VideoIcon className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-lg">Administrar Video</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* YouTube Option */}
              <div className="space-y-4">
                <Label className="text-gray-300 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" /> Enlace de YouTube
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://youtube.com/watch?v=..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="bg-black border-gray-700 focus:border-blue-500"
                  />
                  <Button onClick={handleUrlSave} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Pega la URL directa de YouTube para incrustar el video.
                </p>
              </div>

              {/* Upload Option */}
              <div className="space-y-4 border-l border-gray-800 md:pl-8">
                <Label className="text-gray-300 flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Subir archivo (MP4)
                </Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="video/mp4,video/webm"
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full border-gray-700 hover:bg-gray-800 hover:text-white"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" /> Seleccionar Video
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Sube un video directamente desde tu dispositivo (Máx 50MB).
                </p>
              </div>
            </div>

            {currentVideoUrl && (
              <div className="mt-6 pt-4 border-t border-gray-800 flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearVideo}
                  className="bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/50"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Eliminar Video Actual
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoSection;