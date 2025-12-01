import React, { useState, useEffect } from "react";

function getYouTubeEmbedUrl(input) {
  const url = input.trim();
  if (!url) return { id: null, embedUrl: null };

  // Intentar detectar ID desde formatos comunes
  let id = null;

  // youtu.be/VIDEO_ID
  if (url.includes("youtu.be/")) {
    const parts = url.split("youtu.be/");
    if (parts[1]) {
      id = parts[1].split(/[?&]/)[0];
    }
  }

  // /embed/VIDEO_ID
  if (!id && url.includes("/embed/")) {
    const parts = url.split("/embed/");
    if (parts[1]) {
      id = parts[1].split(/[?&]/)[0];
    }
  }

  // watch?v=VIDEO_ID
  if (!id && url.includes("watch?")) {
    const match = url.match(/[?&]v=([^&]+)/);
    if (match && match[1]) {
      id = match[1];
    }
  }

  // Si sólo pegaron el ID directamente
  if (!id && /^[a-zA-Z0-9_-]{6,}$/.test(url)) {
    id = url;
  }

  if (!id) {
    return { id: null, embedUrl: null };
  }

  const embedUrl = `https://www.youtube.com/embed/${id}?rel=0`;
  return { id, embedUrl };
}

export default function VideoSection({ quotationData, onVideoUrlUpdate, isEditorMode }) {
  const initialUrl = quotationData?.video_url || "";
  const [input, setInput] = useState(initialUrl);
  const [embedUrl, setEmbedUrl] = useState(null);
  const [error, setError] = useState(null);

  // Initialize embedUrl on mount or when prop changes
  useEffect(() => {
    if (initialUrl) {
      const { embedUrl: computedUrl } = getYouTubeEmbedUrl(initialUrl);
      if (computedUrl) {
        setEmbedUrl(computedUrl);
        setInput(initialUrl);
      }
    }
  }, [initialUrl]);

  const handleLoad = () => {
    const { id, embedUrl } = getYouTubeEmbedUrl(input);
    if (!id || !embedUrl) {
      setEmbedUrl(null);
      setError("No pude reconocer el ID del video. Verifica la liga de YouTube.");
      return;
    }
    setError(null);
    setEmbedUrl(embedUrl);
    console.log("Usando URL embed de YouTube:", embedUrl);

    // Save to DB if prop is provided
    if (onVideoUrlUpdate) {
      onVideoUrlUpdate(input);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "16px",
        boxSizing: "border-box",
        backgroundColor: "#111111",
        color: "#FFFFFF",
        gap: "16px",
      }}
    >
      {/* Input para la liga de YouTube - Only visible in Editor Mode */}
      {isEditorMode && (
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pega aquí la liga de YouTube"
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid #444",
              backgroundColor: "#000",
              color: "#fff",
              fontSize: "16px",
            }}
          />
          <button
            onClick={handleLoad}
            style={{
              padding: "10px 18px",
              border: "none",
              borderRadius: "10px",
              backgroundColor: "#007BFF",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Cargar video
          </button>
        </div>
      )}

      {/* Mensaje de error */}
      {isEditorMode && error && (
        <div
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            backgroundColor: "#661111",
            color: "#FFDADA",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      {/* Mostrar la URL embed que realmente se está usando (debug visible) */}
      {isEditorMode && embedUrl && (
        <div
          style={{
            fontSize: "12px",
            color: "#AAAAAA",
            wordBreak: "break-all",
          }}
        >
          URL embed en uso: {embedUrl}
        </div>
      )}

      {/* Contenedor del iframe */}
      <div
        style={{
          position: "relative",
          paddingBottom: "56.25%",
          height: 0,
          width: "100%",
          borderRadius: "12px",
          overflow: "hidden",
          backgroundColor: "#000",
          boxShadow: "0 0 24px rgba(0,0,0,0.7)",
          marginTop: "8px",
        }}
      >
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title="Video de presentación"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              border: "none",
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#808080",
              fontSize: "14px",
              padding: "12px",
              textAlign: "center",
            }}
          >
            {isEditorMode ? 'Pega una liga de YouTube y haz clic en "Cargar video" para mostrar el visor.' : 'No hay video disponible.'}
          </div>
        )}
      </div>
    </div>
  );
}