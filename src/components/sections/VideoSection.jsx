import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Upload, Link as LinkIcon, Save, Loader2, Video as VideoIcon, Trash2, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { getActiveBucket } from '@/lib/bucketResolver';

const VideoSection = ({ sectionData, quotationData, isEditorMode, onVideoUrlUpdate, onContentChange }) => {
  // Prioritize quotationData.video_url, but keep fallbacks.
  const currentVideoUrl = quotationData?.video_url || sectionData.video_url || sectionData.content?.video_url || '';
  const title = sectionData.content?.title || "VIDEO EXPERIENCE";
  const subtitle = sectionData.content?.subtitle || "Visualiza el funcionamiento y los detalles técnicos en alta definición.";

  const [urlInput, setUrlInput] = useState('');
  const [titleInput, setTitleInput] = useState(title);
  const [subtitleInput, setSubtitleInput] = useState(subtitle);
  const [isUploading, setIsUploading] = useState(false);
  const [playerError, setPlayerError] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  // Initialize inputs
  useEffect(() => {
    if (currentVideoUrl) {
      setUrlInput(currentVideoUrl);
      setPlayerError(false);
    }
  }, [currentVideoUrl]);

  useEffect(() => {
    setTitleInput(title);
    setSubtitleInput(subtitle);
  }, [title, subtitle]);

  const handleContentSave = () => {
    if (onContentChange) {
      onContentChange({
        title: titleInput,
        subtitle: subtitleInput
      });
      toast({ title: "Contenido actualizado", description: "El título y subtítulo se han guardado." });
    }
  };

  const handleUrlSave = () => {
    let urlToSave = urlInput.trim();
    if (!urlToSave) return;

    // Auto-fix common YouTube URL issues
    if (urlToSave.includes('youtube.com') || urlToSave.includes('youtu.be')) {
      if (!urlToSave.startsWith('http')) {
        urlToSave = `https://${urlToSave}`;
      }
    }

    if (onVideoUrlUpdate) {
      onVideoUrlUpdate(urlToSave);
      toast({
        title: "URL Actualizada",
        description: "El video se ha vinculado correctamente.",
      });
      setPlayerError(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast({ title: "Archivo inválido", description: "Selecciona un video válido.", variant: "destructive" });
      return;
    }

    if (file.size > 100 * 1024 * 1024) { // Increased to 100MB
      toast({ title: "Archivo grande", description: "El límite es 100MB. Usa YouTube para videos más largos.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const bucketName = await getActiveBucket();
      const fileExt = file.name.split('.').pop();
      const fileName = `videos/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from(bucketName).upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(fileName);

      if (onVideoUrlUpdate) {
        onVideoUrlUpdate(publicUrl);
        toast({ title: "Video subido", description: "El video se ha cargado correctamente." });
        setPlayerError(false);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: "Error al subir", description: "No se pudo cargar el video.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClearVideo = () => {
    if (onVideoUrlUpdate) {
      onVideoUrlUpdate('');
      setUrlInput('');
      toast({ title: "Video eliminado", description: "Se ha quitado el video." });
    }
  };

  return (
    <div className="w-full min-h-[70vh] bg-black text-white p-6 sm:p-12 flex flex-col items-center justify-center font-sans">
      <div className="max-w-6xl w-full space-y-10">

        <div className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <h2 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light">
            {subtitle}
          </p>
        </div>

        {/* Professional Player Container */}
        <div className="relative w-full aspect-video bg-[#050505] rounded-3xl overflow-hidden border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] group">
          {currentVideoUrl ? (
            <>
              <ReactPlayer
                key={currentVideoUrl} // Force re-mount on URL change
                url={currentVideoUrl}
                width="100%"
                height="100%"
                controls={true}
                playing={false}
                playsinline={true}
                onError={(e) => {
                  console.error("Player Error:", e);
                  setPlayerError(true);
                }}
                config={{
                  youtube: {
                    playerVars: { showinfo: 0, modestbranding: 1, rel: 0 }
                  },
                  file: {
                    attributes: {
                      controlsList: 'nodownload',
                      playsInline: true
                    }
                  }
                }}
              />
              {playerError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10">
                  <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                  <p className="text-xl font-bold text-white">Error al reproducir el video</p>
                  <p className="text-gray-400 mt-2">La URL no es válida o el archivo no es accesible.</p>
                  {isEditorMode && <p className="text-sm text-blue-400 mt-4 font-mono bg-blue-900/20 px-4 py-2 rounded">{currentVideoUrl}</p>}
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 to-black">
              <div className="p-6 rounded-full bg-gray-900/50 border border-gray-800 mb-6">
                <VideoIcon className="w-12 h-12 opacity-40" />
              </div>
              <p className="text-xl font-medium tracking-wide">Esperando contenido multimedia</p>
              {isEditorMode && <p className="text-sm opacity-60 mt-2 animate-pulse">Configura el video en el panel de administración</p>}
            </div>
          )}
        </div>

        {/* Admin Controls */}
        {isEditorMode && (
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <VideoIcon className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-white">Gestión de Video</h3>
                  <p className="text-xs text-gray-500">Configura la fuente del video y los textos</p>
                </div>
              </div>
              {currentVideoUrl && (
                <div className="flex items-center gap-2 text-xs font-mono text-gray-500 bg-gray-900 px-3 py-1 rounded border border-gray-800 max-w-[200px] truncate">
                  <LinkIcon className="w-3 h-3" />
                  {currentVideoUrl}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Text Configuration */}
              <div className="space-y-5">
                <Label className="text-gray-300 flex items-center gap-2 text-sm font-medium uppercase tracking-wider">
                  <span className="text-blue-500">T</span> Títulos de la Sección
                </Label>
                <div className="space-y-3">
                  <Input
                    placeholder="Título Principal"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    className="bg-black border-gray-700 focus:border-blue-500"
                  />
                  <Input
                    placeholder="Subtítulo / Descripción"
                    value={subtitleInput}
                    onChange={(e) => setSubtitleInput(e.target.value)}
                    className="bg-black border-gray-700 focus:border-blue-500"
                  />
                  <Button onClick={handleContentSave} className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700">
                    <Save className="w-4 h-4 mr-2" /> Actualizar Textos
                  </Button>
                </div>
              </div>

              {/* Video Configuration */}
              <div className="space-y-5 border-l border-gray-800 lg:pl-10">
                <Label className="text-gray-300 flex items-center gap-2 text-sm font-medium uppercase tracking-wider">
                  <LinkIcon className="w-4 h-4 text-red-500" /> Fuente del Video
                </Label>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Input
                      placeholder="https://youtube.com/..."
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="bg-black border-gray-700 focus:border-blue-500"
                    />
                    <Button onClick={handleUrlSave} className="bg-blue-600 hover:bg-blue-700">
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex gap-3 items-center">
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
                          <Upload className="w-4 h-4 mr-2" /> Subir MP4
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {currentVideoUrl && (
              <div className="mt-8 pt-6 border-t border-gray-800 flex justify-between items-center">
                <a
                  href={currentVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" /> Probar enlace original
                </a>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearVideo}
                  className="bg-red-950/30 text-red-500 hover:bg-red-900/50 border border-red-900/30"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Eliminar Video
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