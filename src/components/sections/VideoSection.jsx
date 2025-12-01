import React, { useState, useEffect } from 'react';
import { Video, Link as LinkIcon, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const VideoSection = ({ sectionData, quotationData, isEditorMode, onVideoUrlUpdate, onContentChange }) => {
  const { toast } = useToast();

  // Prioritize quotationData.video_url, but keep fallbacks.
  const currentVideoUrl = quotationData?.video_url || sectionData.video_url || sectionData.content?.video_url || '';
  const title = sectionData.content?.title || "VIDEO EXPERIENCE";
  const subtitle = sectionData.content?.subtitle || "Visualiza el funcionamiento y los detalles técnicos en alta definición.";

  const [urlInput, setUrlInput] = useState('');
  const [titleInput, setTitleInput] = useState(title);
  const [subtitleInput, setSubtitleInput] = useState(subtitle);

  // Initialize inputs
  useEffect(() => {
    if (currentVideoUrl) {
      setUrlInput(currentVideoUrl);
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

    if (onVideoUrlUpdate) {
      onVideoUrlUpdate(urlToSave);
      toast({
        title: "URL Actualizada",
        description: "El video se ha vinculado correctamente.",
      });
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return '';
    try {
      // Already an embed link
      if (url.includes('youtube.com/embed/')) return url;

      let videoId = '';
      // Standard watch URL
      if (url.includes('watch?v=')) {
        videoId = url.split('watch?v=')[1].split('&')[0];
      }
      // Shortened URL
      else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      }

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
      }
    } catch (e) {
      console.error("Error parsing video URL", e);
    }
    // Return original if no known pattern matched (might be valid iframe src already)
    return url;
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

        {/* Simple Iframe Player Container */}
        <div className="relative w-full aspect-video bg-[#050505] rounded-3xl overflow-hidden border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] group">
          {currentVideoUrl ? (
            <iframe
              src={getEmbedUrl(currentVideoUrl)}
              title="Video Player"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 to-black">
              <div className="p-6 rounded-full bg-gray-900/50 border border-gray-800 mb-6">
                <Video className="w-12 h-12 opacity-40" />
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
                  <Video className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-white">Gestión de Video</h3>
                  <p className="text-xs text-gray-500">Configura la fuente del video y los textos</p>
                </div>
              </div>
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
                  <LinkIcon className="w-4 h-4 text-red-500" /> Fuente del Video (YouTube)
                </Label>

                <div className="space-y-4">
                  <div className="flex gap-3">
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
                    Ingresa una URL de YouTube. El sistema generará el código de inserción automáticamente.
                  </p>

                  {/* Debug / Warning Info */}
                  {currentVideoUrl && !currentVideoUrl.includes('youtube') && !currentVideoUrl.includes('youtu.be') && !currentVideoUrl.includes('vimeo') && (
                    <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg text-yellow-200 text-xs">
                      <p className="font-bold mb-1">⚠️ URL no compatible con este reproductor</p>
                      <p>La URL actual parece ser un archivo o un enlace no reconocido. La versión original solo soporta YouTube/Vimeo.</p>
                      <p className="mt-2 font-mono bg-black/50 p-1 rounded break-all">{currentVideoUrl}</p>
                    </div>
                  )}
                  {currentVideoUrl && (currentVideoUrl.includes('youtube') || currentVideoUrl.includes('youtu.be')) && (
                    <div className="mt-2 text-xs text-green-500 flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" /> URL de YouTube detectada
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoSection;