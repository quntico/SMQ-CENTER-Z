import React, { useState, useEffect, useRef } from 'react';
import { Upload, Link as LinkIcon, Save, Video as VideoIcon, Trash2, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { getActiveBucket } from '@/lib/bucketResolver';

export default function VideoSection({ sectionData, quotationData, isEditorMode, onVideoUrlUpdate, onContentChange }) {
  const { toast } = useToast();

  // Load initial state from props
  const initialTitle = sectionData.content?.title || "VIDEO DE LA MÁQUINA";
  const initialSubtitle = sectionData.content?.subtitle || "Visualiza el funcionamiento y los detalles técnicos en alta definición.";
  const initialUrl = quotationData?.video_url || sectionData.video_url || sectionData.content?.video_url || "";

  const [title, setTitle] = useState(initialTitle);
  const [subtitle, setSubtitle] = useState(initialSubtitle);
  const [videoUrl, setVideoUrl] = useState(initialUrl);
  const [storedUrl, setStoredUrl] = useState(initialUrl);
  const [error, setError] = useState("");
  const [savingTexts, setSavingTexts] = useState(false);
  const [savingVideo, setSavingVideo] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Sync with props if they change externally
  useEffect(() => {
    if (initialUrl) {
      setVideoUrl(initialUrl);
      setStoredUrl(initialUrl);
    }
  }, [initialUrl]);

  useEffect(() => {
    setTitle(initialTitle);
    setSubtitle(initialSubtitle);
  }, [initialTitle, initialSubtitle]);

  const handleUpdateTexts = () => {
    setSavingTexts(true);
    setError("");

    if (onContentChange) {
      onContentChange({
        title,
        subtitle
      });
      toast({ title: "Textos actualizados", description: "El título y subtítulo se han guardado." });
    }

    setTimeout(() => {
      setSavingTexts(false);
    }, 400);
  };

  const handleVideoUrlChange = (e) => {
    setVideoUrl(e.target.value);
    setError("");
  };

  const handleSaveVideo = () => {
    if (!videoUrl.trim()) {
      setError("Ingresa una URL de video o selecciona un archivo MP4.");
      return;
    }
    setSavingVideo(true);

    if (onVideoUrlUpdate) {
      onVideoUrlUpdate(videoUrl.trim());
      setStoredUrl(videoUrl.trim());
      toast({ title: "Video actualizado", description: "La URL del video se ha guardado." });
    }

    setTimeout(() => setSavingVideo(false), 400);
  };

  const handleChooseFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["video/mp4", "video/webm", "video/ogg"];
    if (!validTypes.includes(file.type)) {
      setError("Formato no soportado. Usa MP4, WebM u OGG.");
      return;
    }

    setIsUploading(true);
    try {
      // Force 'public' bucket for videos to ensure public access
      let bucketName = 'public';
      const { error: checkError } = await supabase.storage.from(bucketName).list('', { limit: 1 });
      if (checkError) {
        console.warn("Public bucket not found, falling back to resolver");
        bucketName = await getActiveBucket();
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `videos/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from(bucketName).upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(fileName);

      setVideoUrl(publicUrl);
      setStoredUrl(publicUrl);

      if (onVideoUrlUpdate) {
        onVideoUrlUpdate(publicUrl);
        toast({ title: "Video subido", description: "El archivo se ha cargado correctamente." });
      }

    } catch (err) {
      console.error("Error uploading file:", err);
      setError("Error al subir el archivo. Intenta de nuevo.");
      toast({ title: "Error", description: "No se pudo subir el video.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleTestOriginal = () => {
    if (!storedUrl) return;
    window.open(storedUrl, "_blank", "noopener,noreferrer");
  };

  const handleDeleteVideo = () => {
    if (onVideoUrlUpdate) {
      onVideoUrlUpdate("");
      setVideoUrl("");
      setStoredUrl("");
      setError("");
      toast({ title: "Video eliminado", description: "Se ha quitado el video." });
    }
  };

  // --- render del player (Adapted from user code) ---
  const renderPlayer = () => {
    if (!storedUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-gray-900/50 rounded-xl border border-gray-800 p-10">
          <span className="text-4xl mb-4">🎬</span>
          <p className="text-lg font-medium">No hay video configurado aún.</p>
          {isEditorMode && (
            <p className="text-sm mt-2 text-gray-400">
              En modo editor, usa el panel de “Gestión de Video” para agregar uno.
            </p>
          )}
        </div>
      );
    }

    const lower = storedUrl.toLowerCase();
    const isYouTube = /youtube\.com|youtu\.be/.test(lower);

    if (isYouTube) {
      let embedUrl = storedUrl;
      if (storedUrl.includes("watch?v=")) {
        embedUrl = storedUrl.replace("watch?v=", "embed/");
        // Remove any extra query params after video ID if needed, but simple replace is usually enough for basic links
        if (embedUrl.includes("&")) {
          const parts = embedUrl.split("&");
          embedUrl = parts[0];
        }
      } else if (storedUrl.includes("youtu.be/")) {
        embedUrl = storedUrl.replace("youtu.be/", "www.youtube.com/embed/");
      }

      return (
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800">
          <iframe
            className="w-full h-full"
            src={embedUrl}
            title="Video de la máquina"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    return (
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800">
        <video className="w-full h-full object-contain" controls preload="metadata">
          <source src={storedUrl} />
          Tu navegador no soporta la reproducción de video.
        </video>
      </div>
    );
  };

  return (
    <section className="w-full min-h-[70vh] bg-black text-white p-6 sm:p-12 font-sans">
      {/* Encabezado visible en modo cliente y editor */}
      <header className="text-center space-y-4 mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <div>
          <h2 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light mt-4">
            {subtitle}
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className={`lg:col-span-${isEditorMode ? '2' : '3'}`}>
          {renderPlayer()}
        </div>

        {/* Panel de edición: aparece solo en modo editor */}
        {isEditorMode && (
          <aside className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-6 shadow-2xl h-fit">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
              <div className="text-2xl">🎥</div>
              <div>
                <h3 className="font-bold text-xl text-white">Gestión de Video</h3>
                <p className="text-xs text-gray-500">
                  Configura la fuente del video y los textos.
                </p>
              </div>
            </div>

            <div className="space-y-8">
              {/* Títulos de la sección */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">TÍTULOS DE LA SECCIÓN</p>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Título principal</Label>
                    <Input
                      type="text"
                      className="bg-black border-gray-700 focus:border-blue-500"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Subtítulo / descripción</Label>
                    <Input
                      type="text"
                      className="bg-black border-gray-700 focus:border-blue-500"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-gray-700 hover:bg-gray-800 hover:text-white"
                    onClick={handleUpdateTexts}
                    disabled={savingTexts}
                  >
                    {savingTexts ? "Guardando..." : "Actualizar Textos"}
                  </Button>
                </div>
              </div>

              {/* Fuente del video */}
              <div className="space-y-4 pt-4 border-t border-gray-800">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">FUENTE DEL VIDEO</p>

                <div className="space-y-3">
                  <Label className="text-xs text-gray-500">URL del video (YouTube o MP4)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      className="bg-black border-gray-700 focus:border-blue-500"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={videoUrl}
                      onChange={handleVideoUrlChange}
                    />
                    <Button
                      type="button"
                      className="bg-blue-600 hover:bg-blue-700 px-3"
                      onClick={handleSaveVideo}
                      title="Guardar URL de video"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full bg-gray-800 hover:bg-gray-700 text-white"
                    onClick={handleChooseFile}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Subiendo...</>
                    ) : (
                      <>⬆ Subir MP4</>
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/ogg"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                </div>

                {error && <div className="text-red-500 text-xs bg-red-900/20 p-2 rounded border border-red-900/50">{error}</div>}

                <div className="flex flex-col gap-2 pt-4 border-t border-gray-800">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-xs text-blue-500 hover:text-blue-400 justify-start px-0"
                    onClick={handleTestOriginal}
                    disabled={!storedUrl}
                  >
                    <ExternalLink className="w-3 h-3 mr-2" /> Probar enlace original
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="text-xs text-red-500 hover:text-red-400 hover:bg-red-950/20 justify-start px-0"
                    onClick={handleDeleteVideo}
                  >
                    <Trash2 className="w-3 h-3 mr-2" /> Eliminar Video
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}