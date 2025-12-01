import React, { useState } from "react";

function buildYouTubeEmbed(input) {
  const url = input.trim();
  if (!url) return null;

  // youtu.be/VIDEO_ID
  if (url.includes("youtu.be/")) {
    const parts = url.split("youtu.be/");
    if (parts[1]) {
      const id = parts[1].split(/[?&]/)[0];
      return `https://www.youtube.com/embed/${id}?rel=0`;
    }
  }

  // /embed/VIDEO_ID
  if (url.includes("/embed/")) {
    const parts = url.split("/embed/");
    if (parts[1]) {
      const id = parts[1].split(/[?&]/)[0];
      return `https://www.youtube.com/embed/${id}?rel=0`;
    }
  }

  // watch?v=VIDEO_ID
  if (url.includes("watch?")) {
    const match = url.match(/[?&]v=([^&]+)/);
    if (match && match[1]) {
      const id = match[1];
      return `https://www.youtube.com/embed/${id}?rel=0`;
    }
  }

  // Si pegaron directamente el ID
  if (/^[a-zA-Z0-9_-]{6,}$/.test(url)) {
    return `https://www.youtube.com/embed/${url}?rel=0`;
  }

  return null;
}

function detectKind(url) {
  const value = url.trim().toLowerCase();
  if (!value) return "none";

  if (value.includes("youtube.com") || value.includes("youtu.be")) {
    return "youtube";
  }

  if (value.endsWith(".mp4") || value.endsWith(".webm") || value.endsWith(".ogg")) {
    return "file";
  }

  return "none";
}

const VideoSection = () => {
  const [urlInput, setUrlInput] = useState(
    "https://www.youtube.com/watch?v=dmf6bYGeb6w"
  );
  const [kind, setKind] = useState("none");
  const [youtubeEmbed, setYouTubeEmbed] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleLoad = () => {
    const detected = detectKind(urlInput);
    setKind(detected);

    if (detected === "youtube") {
      const embed = buildYouTubeEmbed(urlInput);
      if (!embed) {
        setError("No pude construir la URL de embed de YouTube. Revisa la liga.");
        setYouTubeEmbed(null);
        setFileUrl(null);
        return;
      }
      setError(null);
      setYouTubeEmbed(embed);
      setFileUrl(null);
      console.log("YouTube embed URL:", embed);
    } else if (detected === "file") {
      setError(null);
      setFileUrl(urlInput.trim());
      setYouTubeEmbed(null);
      console.log("Archivo de video URL:", urlInput.trim());
    } else {
      setError(
        "La URL no parece ser ni un video de YouTube ni un archivo .mp4 / .webm / .ogg"
      );
      setYouTubeEmbed(null);
      setFileUrl(null);
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
      {/* Input + botón */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Pega una liga de YouTube o un archivo .mp4"
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
          type="button"
          onClick={handleLoad}
          style={{
            padding: "10px 18px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#007BFF",
            color: "#FFFFFF",
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Cargar video
        </button>
      </div>

      {/* Info de depuración */}
      <div style={{ fontSize: "12px", color: "#AAAAAA" }}>
        Tipo detectado: {kind}
        {youtubeEmbed && (
          <div style={{ marginTop: 4 }}>YouTube embed: {youtubeEmbed}</div>
        )}
        {fileUrl && (
          <div style={{ marginTop: 4 }}>Archivo de video: {fileUrl}</div>
        )}
      </div>

      {/* Error */}
      {error && (
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

      {/* Contenedor del reproductor */}
      <div
        style={{
          position: "relative",
          paddingBottom: "56.25%",
          height: 0,
          width: "100%",
          borderRadius: "12px",
          overflow: "hidden",
          backgroundColor: "#000000",
          boxShadow: "0 0 24px rgba(0,0,0,0.7)",
          marginTop: "8px",
        }}
      >
        {kind === "youtube" && youtubeEmbed && (
          <iframe
            src={youtubeEmbed}
            title="Video YouTube"
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
        )}

        {kind === "file" && fileUrl && (
          <video
            src={fileUrl}
            controls
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "black",
            }}
          >
            Tu navegador no soporta video HTML5.
          </video>
        )}

        {kind === "none" && (
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
            Pega una liga de YouTube o la URL directa de un archivo .mp4 y haz
            clic en "Cargar video".
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoSection;