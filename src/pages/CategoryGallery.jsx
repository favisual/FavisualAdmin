import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { findCategoryBySlug } from "../data/galleryStore";
import { useGallery } from "../context/GalleryContext";

// Ícono de Play en SVG para superponer sobre los thumbnails de video
const PlayIcon = () => (
    <svg className="absolute w-12 h-12 text-white/80 drop-shadow-md" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm14.024-.983a1.125 1.125 0 010 1.966l-5.603 3.113A1.125 1.125 0 019 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113z" clipRule="evenodd" />
    </svg>
);

const ITEMS_PER_PAGE = 12;

function buildVisiblePages(totalPages, currentPage) {
    if (totalPages <= 5) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 3) {
        return [1, 2, 3, 4, totalPages];
    }

    if (currentPage >= totalPages - 2) {
        return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, currentPage - 1, currentPage, currentPage + 1, totalPages];
}


function CategoryGallery() {
    const { categorySlug } = useParams();
    const { categories, loading } = useGallery();
    const category = findCategoryBySlug(categories, categorySlug);
    const mediaItems = category?.items || [];
    const [currentPage, setCurrentPage] = useState(1);

    const [selectedMedia, setSelectedMedia] = useState(null);

    const totalPages = Math.max(1, Math.ceil(mediaItems.length / ITEMS_PER_PAGE));
    const pageItems = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return mediaItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [currentPage, mediaItems]);
    const visiblePages = useMemo(
        () => buildVisiblePages(totalPages, currentPage),
        [currentPage, totalPages]
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [categorySlug]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const openModal = (item) => {
        setSelectedMedia(item);
    };

    const closeModal = () => {
        setSelectedMedia(null);
    };

    return (
        <>
            <div>
                <h2 className="text-white text-3xl font-semibold mb-6 capitalize text-center">
                    {category?.name || "Categoria no encontrada"}
                </h2>
                {category?.description ? (
                    <p className="text-center text-neutral-300 max-w-2xl mx-auto mb-8 px-4">
                        {category.description}
                    </p>
                ) : null}
                {loading ? (
                    <p className="text-center text-neutral-400">Cargando galeria...</p>
                ) : null}
                {!loading && !category ? (
                    <p className="text-center text-neutral-400">Esta categoria todavia no existe.</p>
                ) : null}
                {!loading && category && mediaItems.length === 0 ? (
                    <p className="text-center text-neutral-400 mb-8">Todavia no hay fotos o videos cargados aqui.</p>
                ) : null}
                {!loading && mediaItems.length > 0 ? (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 px-4">
                        <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-300">
                            <span className="text-white font-medium">
                                Pagina {currentPage}
                            </span>
                            <span className="text-neutral-500">/</span>
                            <span>{totalPages}</span>
                            <span className="hidden sm:inline text-neutral-500">•</span>
                            <span>
                                {mediaItems.length} elementos
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                disabled={currentPage === 1}
                                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10"
                            >
                                Anterior
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                disabled={currentPage === totalPages}
                                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                ) : null}
                <div className="columns-2 sm:columns-3 md:columns-4 gap-4 px-4 space-y-4">
                    {pageItems.map((item, index) => (
                        <motion.div
                            key={item.id}
                            layoutId={`media-${item.id}`}
                            className="w-full overflow-hidden rounded-lg cursor-pointer break-inside-avoid relative"
                            onClick={() => openModal(item)}
                        >
                            {item.type === 'video' ? (
                                <>
                                    <motion.img
                                        src={item.thumbnail || category.cover || "/images/Otras.jpg"}
                                        alt={item.title || `Thumbnail para ${item.src}`}
                                        className="w-full h-auto object-cover"
                                        whileHover={{ scale: 1.05 }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                                        <PlayIcon />
                                    </div>
                                </>
                            ) : (
                                <motion.img
                                    src={item.src}
                                    alt={item.title || category.name}
                                    className="w-full h-auto object-cover"
                                    whileHover={{ scale: 1.05 }}
                                />
                            )}
                        </motion.div>
                    ))}
                </div>
                {!loading && totalPages > 1 ? (
                    <div className="flex flex-wrap items-center justify-center gap-3 mt-10 px-4">
                        {visiblePages.map((pageNumber, index) => {
                            const previousPage = visiblePages[index - 1];
                            const showDivider = previousPage && pageNumber - previousPage > 1;

                            return (
                                <div key={pageNumber} className="contents">
                                    {showDivider ? (
                                        <span className="text-neutral-500 px-1">...</span>
                                    ) : null}
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage(pageNumber)}
                                        className={`min-w-11 rounded-full px-4 py-2 text-sm transition-all ${
                                            currentPage === pageNumber
                                                ? "bg-white text-neutral-950 font-semibold shadow-lg"
                                                : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                                        }`}
                                    >
                                        {pageNumber}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : null}
            </div>

            <AnimatePresence>
                {selectedMedia && (
                    <motion.div
                        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeModal}
                    >
                        {selectedMedia.type === 'video' ? (
                            <motion.video
                                layoutId={`media-${selectedMedia.id}`}
                                src={selectedMedia.src}
                                className="w-auto max-w-full h-auto max-h-full rounded-lg shadow-lg"
                                controls
                                autoPlay
                                onClick={(e) => e.stopPropagation()}
                                transition={{
                                    type: "spring",
                                    stiffness: 260,
                                    damping: 20
                                }}
                            />
                        ) : (
                            <motion.img
                                layoutId={`media-${selectedMedia.id}`}
                                src={selectedMedia.src}
                                alt={selectedMedia.title || "Zoomed"}
                                className="w-auto max-w-full h-auto max-h-full rounded-lg shadow-lg"
                                onClick={(e) => e.stopPropagation()}
                                transition={{
                                    type: "spring",
                                    stiffness: 260,
                                    damping: 20
                                }}
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export default CategoryGallery;
