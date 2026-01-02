import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const loadingTexts = [
  "Inicializando sistema...",
  "Cargando módulos de IA...",
  "Optimizando interfaz...",
  "Estableciendo conexión segura...",
  "Verificando integridad de datos...",
  "Compilando shaders de UI...",
  "Despertando al asistente virtual...",
  "¡Casi listo!",
];

const CodeLine = ({ children, delay }) => (
  <motion.p
    initial={{ opacity: 0 }}
    animate={{ opacity: [0, 1, 1, 0] }}
    transition={{ duration: 2, repeat: Infinity, delay, ease: "linear" }}
    className="font-mono text-xs text-green-400/50"
  >
    {children}
  </motion.p>
);

// Simplified LoadingScreen without icon animations
const LoadingScreen = ({ message }) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  useEffect(() => {
    if (message) return; // If a static message is provided, skip cycling
    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [message]);

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center overflow-hidden p-4">
      {/* Optional static or rotating message */}
      <div className="mt-8 text-center bg-black/50 p-4 rounded-lg backdrop-blur-sm z-[110]">
        <AnimatePresence mode="wait">
          {message ? (
            <motion.p
              key="static-message"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-xl font-bold text-white tracking-wider"
            >
              {message}
            </motion.p>
          ) : (
            <motion.p
              key={currentTextIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="text-lg font-medium text-white"
            >
              {loadingTexts[currentTextIndex]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      {/* Code lines for visual effect */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-center items-center">
        <CodeLine delay={0}>[AI.core] Bootstrapping services...</CodeLine>
        <CodeLine delay={0.25}>[render.v8] Initializing virtual DOM...</CodeLine>
        <CodeLine delay={0.5}>[auth.jwt] Validating session token: SUCCESS</CodeLine>
        <CodeLine delay={0.75}>[db.supa] SELECT * FROM themes WHERE active=true</CodeLine>
        <CodeLine delay={1.0}>[net.edge] Invoking function 'get-user-prefs'...</CodeLine>
        <CodeLine delay={1.25}>[crypto.argon2] Hashing assets for verification...</CodeLine>
        <CodeLine delay={1.5}>[ui.framer] Staggering intro animations...</CodeLine>
        <CodeLine delay={1.75}>[finalizer] All systems nominal. Handing over to user.</CodeLine>
      </div>
    </div>
  );
};

export default LoadingScreen;