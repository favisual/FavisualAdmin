import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGallery } from "../context/GalleryContext";

function Hero() {
    const { homeSettings } = useGallery();
    const hero = homeSettings?.hero;
    const images = hero?.images?.length ? hero.images : [hero?.image].filter(Boolean);
    const [index, setIndex] = useState(0);
    const mediaType = hero?.mediaType === "video"
        ? "video"
        : hero?.mediaType === "image"
            ? "image"
            : "sequence";
    const activeImage = mediaType === "sequence"
        ? images[index] || hero?.image
        : hero?.image || images[0];

    useEffect(() => {
        if (mediaType !== "sequence" || images.length <= 1) {
            return undefined;
        }

        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % images.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [images, mediaType]);

    useEffect(() => {
        setIndex(0);
    }, [mediaType, hero?.image, hero?.video, images.length]);

    return (
        <>
            <div className="relative h-screen overflow-hidden -mt-36 lg:-mt-34">
                {mediaType === "video" && hero?.video ? (
                    <video
                        key={hero.video}
                        src={hero.video}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="absolute top-0 left-0 w-full h-full object-cover object-center"
                    />
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={activeImage}
                            src={activeImage}
                            alt={hero?.title || "Hero"}
                            initial={{ scale: 1.2, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.8 }}
                            className="absolute top-0 left-0 w-full h-full object-cover object-top "
                        />
                    </AnimatePresence>
                )}
                <div className="absolute inset-0 bg-black/35" />

                <div className="absolute inset-0 ml-auto flex w-11/12 items-end justify-center py-24 text-white sm:py-28 lg:w-11/12 lg:py-36">
                    <div className="grid w-full max-w-sm gap-4 sm:max-w-lg lg:w-2/7 lg:max-w-none">
                        <p className="text-3xl leading-tight sm:text-4xl lg:text-5xl">
                            {hero?.title || "Agenda tu sesion de contenido"}
                        </p>
                        <a
                            href={hero?.ctaHref || "/contacto"}
                            className="group relative inline-flex w-fit items-center gap-2.5 self-start overflow-hidden rounded-full border border-amber-200/40 bg-[linear-gradient(135deg,rgba(255,248,235,0.96),rgba(245,196,108,0.92))] px-6 py-2.5 text-base font-semibold text-neutral-950 shadow-[0_18px_45px_rgba(191,134,37,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_55px_rgba(191,134,37,0.36)] sm:gap-3 sm:px-8 sm:py-3 sm:text-xl"
                        >
                            <span className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.45),transparent)] translate-x-[-120%] transition duration-700 group-hover:translate-x-[120%]" />
                            <span className="relative">{hero?.ctaLabel || "Ahora"}</span>
                            <span className="relative text-base transition-transform duration-300 group-hover:translate-x-1 sm:text-lg">
                                →
                            </span>
                        </a>
                    </div>
                </div>

            </div>
        </>
    );
}

export default Hero
