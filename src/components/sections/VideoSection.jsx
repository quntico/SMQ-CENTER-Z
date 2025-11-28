import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import SectionHeader from '@/components/SectionHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, VideoOff, Youtube } from 'lucide-react';

const VideoSection = ({ sectionData, quotationData, isEditorMode, onVideoUrlUpdate }) => {
  const { toast } = useToast();
  const [videoUrl, setVideoUrl] = useState(quotationData?.video_url || '');
  const [embedUrl, setEmbedUrl] = useState('');

  useEffect(() => {
    setVideoUrl(quotationData?.video_url || '');
  }, [quotationData?.video_url]);

  useEffect(() => {
    if (videoUrl) {
      // Convert YouTube watch URL to embed URL
      const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
      const youtubeMatch = videoUrl.match(youtubeRegex);
      if (youtubeMatch && youtubeMatch[1]) {
        setEmbedUrl(`https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${youtubeMatch[1]}&controls=0`);
        return;
      }
      // Basic check for other embeddable URLs
      if (videoUrl.includes('player.vimeo.com') || videoUrl.includes('.mp4')) {
        setEmbedUrl(videoUrl);
        return;
      }
    }
    setEmbedUrl('');
  }, [videoUrl]);

  const handleSave = () => {
    onVideoUrlUpdate(videoUrl);
    toast({
      title: '¡Video actualizado! 🎬',
      description: 'El enlace del video ha sido guardado.',
    });
  };

  return (
    <div className="py-4 sm:py-8 w-full h-full flex flex-col">
      <SectionHeader sectionData={sectionData} />
      
      <div className="flex-grow flex flex-col items-center justify-center mt-8">
        <AnimatePresence>
          {isEditorMode && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl mb-8"
            >
              <div className="flex items-center gap-2 bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                <Youtube className="text-primary w-6 h-6" />
                <Input
                  type="text"
                  placeholder="Pega aquí la URL del video (ej. YouTube, Vimeo)"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="flex-grow"
                />
                <Button onClick={handleSave} size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full max-w-6xl aspect-video bg-black rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden border-2 border-gray-800">
          {embedUrl ? (
            <div className="w-full h-full overflow-auto [-webkit-overflow-scrolling:touch]">
              <iframe
                src={embedUrl}
                title="Video Player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-grid-gray-700/20">
              <VideoOff className="w-16 h-16 mb-4" />
              <h3 className="text-xl font-bold text-gray-400">No hay video disponible</h3>
              {isEditorMode && <p className="text-sm mt-2">Pega una URL en el campo de arriba para mostrar un video.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoSection;