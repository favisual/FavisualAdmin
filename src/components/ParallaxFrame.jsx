import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useGallery } from "../context/GalleryContext";

export default function ParallaxFrame() {
  const { homeSettings } = useGallery();
  const parallax = homeSettings?.parallax;
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Imagen se desplaza suavemente: de 0 a 80px en scroll
  const yImage = useTransform(scrollYProgress, [0, 1], [0, 80]);

  // Texto entra desde abajo y sale hacia arriba
  const yText = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const opacityText = useTransform(scrollYProgress, [0.05, 0.25, 0.75, 1], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="relative max-h-screen w-full overflow-hidden bg-neutral-800">
      {/* Imagen con parallax */}
      <motion.div style={{ y: yImage }} className="absolute inset-0">
        <img
          src={parallax?.image || "/parallax.jpg"}
          alt={parallax?.title || "Hero"}
          className="w-full h-full object-cover object-center"
        />
      </motion.div>

      {/* Capa oscura */}
      <div className="absolute inset-0 bg-black/40 z-10"></div>

      {/* Texto con parallax */}
      <motion.div
        style={{ y: yText, opacity: opacityText }}
        className="relative z-20 flex flex-col items-center justify-center min-h-screen text-center text-white px-14"
      >
        <h1 className="text-4xl md:text-6xl font-bold drop-shadow-lg mb-6">
          {parallax?.title || "Captura momentos inolvidables"}
        </h1>
        <p className="text-lg md:text-xl mb-8 drop-shadow-md max-w-xl">
          {parallax?.intro || "Fotografia profesional para marcas, eventos y personas que buscan calidad."}
        </p>
        <a
          href={parallax?.ctaHref || "/contacto"}
          className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-neutral-200 transition"
        >
          {parallax?.ctaLabel || "Reserva tu sesion"}
        </a>
      </motion.div>
    </section>
  );
}
