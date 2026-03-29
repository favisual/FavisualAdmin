import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Importar función para comprobar y guardar si ya se mostró el preloader
import { hasPreloadedOnce, setPreloaded } from "../utils/preloadState";

export default function Preloader() {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(() => !hasPreloadedOnce());

  useEffect(() => {
    if (!isLoading) return;

    if (progress < 100) {
      const timeout = setTimeout(() => setProgress(progress + 1), 20);
      return () => clearTimeout(timeout);
    } else {
      setTimeout(() => {
        setIsLoading(false);
        setPreloaded(true);
      }, 500);
    }
  }, [progress, isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center flex-col"
        >
          <img
            src="/FaVisual.svg"
            alt="Logo"
            className="w-28 mb-6"
          />
          <motion.p
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-white text-xl"
          >
            {progress}%
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
