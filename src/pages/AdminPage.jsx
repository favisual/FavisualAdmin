import { useEffect, useMemo, useRef, useState } from "react";
import { FaEnvelope, FaFacebookF, FaInstagram, FaPhoneAlt, FaWhatsapp } from "react-icons/fa";
import { getDefaultGalleryStore, resetGalleryStore, saveGalleryStore, slugifyCategoryName } from "../data/galleryStore";
import { isSupabaseConfigured, supabaseBucket } from "../lib/supabaseClient";
import { useGallery } from "../context/GalleryContext";
import { useAuth } from "../context/AuthContext";

const emptyCategoryForm = {
  name: "",
  slug: "",
  cover: "",
  description: "",
};

const emptyMediaForm = {
  type: "image",
  src: "",
  thumbnail: "",
  title: "",
  mediaFile: null,
  thumbnailFile: null,
};

const emptyPackageForm = {
  title: "",
  theme: "cyan",
  isFeatured: false,
  featuresText: "",
  priceIndividual: "",
  pricePlan: "",
  pricePlanLabel: "Precio plan mensual",
  pricePlanNote: "Ideal para marcas que quieren mantener una imagen constante y profesional.",
  buttonText: "Comencemos",
};

const emptyContactForm = {
  title: "",
  intro: "",
  photoUrl: "",
  email: "",
  phone: "",
  whatsapp: "",
  instagram: "",
  facebook: "",
  ctaLabel: "Escribenos",
};

const emptyHomeForm = {
  heroTitle: "",
  heroCtaLabel: "Ahora",
  heroCtaHref: "/contacto",
  heroSecondaryCtaLabel: "Ver categorias",
  heroSecondaryCtaHref: "/categories",
  heroMediaType: "sequence",
  heroImage: "",
  heroImagesText: "",
  heroVideo: "",
  categoriesTitle: "",
  brandLogosTitle: "",
  brandLogosIntro: "",
  brandLogosText: "",
  parallaxTitle: "",
  parallaxIntro: "",
  parallaxCtaLabel: "Reserva tu sesion",
  parallaxCtaHref: "/contacto",
  parallaxImage: "",
  packageCtaTitle: "",
  packageCtaIntro: "",
  packageCtaLabel: "Quiero mi paquete",
  packageCtaHref: "/contacto",
};

const ADMIN_MEDIA_ITEMS_PER_PAGE = 6;
const MAX_IMAGE_UPLOAD_MB = 15;
const MAX_VIDEO_UPLOAD_MB = 45;
const MIN_GLOBAL_LOADER_MS = 450;
const ADMIN_SECTIONS = [
  { id: "categorias", label: "Categorias" },
  { id: "media", label: "Fotos y videos" },
  { id: "paquetes", label: "Paquetes" },
  { id: "home", label: "Home" },
  { id: "contacto-admin", label: "Contacto" },
  { id: "preview-contacto", label: "Preview" },
];

function swapItems(items, fromIndex, toIndex) {
  if (toIndex < 0 || toIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

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

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 MB";
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTransferSpeed(bytesPerSecond) {
  if (!Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) {
    return "Calculando velocidad...";
  }

  if (bytesPerSecond >= 1024 * 1024) {
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
  }

  return `${(bytesPerSecond / 1024).toFixed(0)} KB/s`;
}

function formatRemainingTime(seconds) {
  if (!Number.isFinite(seconds) || seconds === null || seconds < 0) {
    return "Calculando tiempo restante...";
  }

  if (seconds < 60) {
    return `${seconds}s restantes`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s restantes`;
}

function normalizeWhatsAppValue(value) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  const normalizedValue =
    trimmedValue.startsWith("http://") || trimmedValue.startsWith("https://")
      ? trimmedValue
      : trimmedValue.startsWith("wa.me/") || trimmedValue.startsWith("api.whatsapp.com/")
        ? `https://${trimmedValue}`
        : "";

  if (normalizedValue) {
    try {
      const url = new URL(normalizedValue);
      const isWhatsAppHost =
        /(^|\.)wa\.me$/i.test(url.hostname) || /(^|\.)whatsapp\.com$/i.test(url.hostname);

      if (isWhatsAppHost) {
        if (/^wa\.me$/i.test(url.hostname)) {
          const digits = url.pathname.replace(/\D/g, "");
          return digits ? `https://wa.me/${digits}` : trimmedValue;
        }

        const phone = url.searchParams.get("phone")?.replace(/\D/g, "");
        return phone ? `https://wa.me/${phone}` : trimmedValue;
      }
    } catch {
      return trimmedValue;
    }
  }

  const digits = trimmedValue.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : trimmedValue;
}

function getMaxUploadBytes(type) {
  return (type === "video" ? MAX_VIDEO_UPLOAD_MB : MAX_IMAGE_UPLOAD_MB) * 1024 * 1024;
}

function validateFileSize(file, type) {
  if (!file) {
    return "";
  }

  const maxBytes = getMaxUploadBytes(type);

  if (file.size > maxBytes) {
    return `El archivo ${file.name} pesa ${formatFileSize(file.size)}. El maximo permitido para ${
      type === "video" ? "videos" : "imagenes"
    } es ${type === "video" ? MAX_VIDEO_UPLOAD_MB : MAX_IMAGE_UPLOAD_MB} MB.`;
  }

  return "";
}

export default function AdminPage() {
  const { user, signOut } = useAuth();
  const {
    categories,
    store,
    loading,
    saving,
    uploadProgress,
    error,
    mode,
    packages,
    contact,
    homeSettings,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    createMediaItem,
    updateMediaItem,
    removeMediaItem,
    reorderMediaItems,
    createPackage,
    updatePackage,
    deletePackage,
    reorderPackages,
    updateContact,
    updateHomeSettings,
  } = useGallery();
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [mediaForm, setMediaForm] = useState(emptyMediaForm);
  const [packageForm, setPackageForm] = useState(emptyPackageForm);
  const [contactForm, setContactForm] = useState(emptyContactForm);
  const [homeForm, setHomeForm] = useState(emptyHomeForm);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState("");
  const [editingMediaId, setEditingMediaId] = useState("");
  const [editingPackageId, setEditingPackageId] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [uploadingLabel, setUploadingLabel] = useState("");
  const [visibleLoaderText, setVisibleLoaderText] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [contactPhotoFile, setContactPhotoFile] = useState(null);
  const [heroImageFile, setHeroImageFile] = useState(null);
  const [heroSequenceFiles, setHeroSequenceFiles] = useState([]);
  const [heroVideoFile, setHeroVideoFile] = useState(null);
  const [brandLogoFiles, setBrandLogoFiles] = useState([]);
  const [parallaxImageFile, setParallaxImageFile] = useState(null);
  const [signingOut, setSigningOut] = useState(false);
  const [mediaPage, setMediaPage] = useState(1);
  const [mediaSearch, setMediaSearch] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] = useState("all");
  const [draggedCategoryId, setDraggedCategoryId] = useState("");
  const [dragOverCategoryId, setDragOverCategoryId] = useState("");
  const [draggedMediaId, setDraggedMediaId] = useState("");
  const [dragOverMediaId, setDragOverMediaId] = useState("");
  const [draggedPackageId, setDraggedPackageId] = useState("");
  const [dragOverPackageId, setDragOverPackageId] = useState("");
  const coverFileInputRef = useRef(null);
  const contactPhotoFileInputRef = useRef(null);
  const mediaFileInputRef = useRef(null);
  const mediaThumbnailFileInputRef = useRef(null);
  const heroImageFileInputRef = useRef(null);
  const heroSequenceFileInputRef = useRef(null);
  const heroVideoFileInputRef = useRef(null);
  const brandLogoFileInputRef = useRef(null);
  const parallaxImageFileInputRef = useRef(null);
  const loaderShownAtRef = useRef(0);
  const loaderHideTimeoutRef = useRef(null);

  const selectedCategory =
    categories.find((category) => category.id === selectedCategoryId) || categories[0];

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ id: category.id, name: category.name })),
    [categories]
  );

  const packageThemes = [
    { value: "cyan", label: "Azul" },
    { value: "violet", label: "Violeta" },
    { value: "stone", label: "Gris" },
    { value: "amber", label: "Dorado" },
    { value: "emerald", label: "Verde" },
  ];
  const selectedMediaItems = selectedCategory?.items || [];
  const filteredMediaItems = useMemo(() => {
    const normalizedSearch = mediaSearch.trim().toLowerCase();

    return selectedMediaItems.filter((item) => {
      const matchesType = mediaTypeFilter === "all" ? true : item.type === mediaTypeFilter;
      const matchesSearch = normalizedSearch
        ? (item.title || "").toLowerCase().includes(normalizedSearch)
        : true;

      return matchesType && matchesSearch;
    });
  }, [mediaSearch, mediaTypeFilter, selectedMediaItems]);
  const totalMediaPages = Math.max(
    1,
    Math.ceil(filteredMediaItems.length / ADMIN_MEDIA_ITEMS_PER_PAGE)
  );
  const paginatedMediaItems = useMemo(() => {
    const startIndex = (mediaPage - 1) * ADMIN_MEDIA_ITEMS_PER_PAGE;
    return filteredMediaItems.slice(startIndex, startIndex + ADMIN_MEDIA_ITEMS_PER_PAGE);
  }, [filteredMediaItems, mediaPage]);
  const mediaVisiblePages = useMemo(
    () => buildVisiblePages(totalMediaPages, mediaPage),
    [mediaPage, totalMediaPages]
  );
  const isMediaReorderDisabled = Boolean(mediaSearch.trim()) || mediaTypeFilter !== "all";

  useEffect(() => {
    setMediaPage(1);
  }, [selectedCategory?.id]);

  useEffect(() => {
    setMediaPage(1);
  }, [mediaSearch, mediaTypeFilter]);

  useEffect(() => {
    if (mediaPage > totalMediaPages) {
      setMediaPage(totalMediaPages);
    }
  }, [mediaPage, totalMediaPages]);

  useEffect(() => {
    setContactForm({
      title: contact?.title || "",
      intro: contact?.intro || "",
      photoUrl: contact?.photoUrl || "",
      email: contact?.email || "",
      phone: contact?.phone || "",
      whatsapp: contact?.whatsapp || "",
      instagram: contact?.instagram || "",
      facebook: contact?.facebook || "",
      ctaLabel: contact?.ctaLabel || "Escribenos",
    });
  }, [contact]);

  useEffect(() => {
    setHomeForm({
      heroTitle: homeSettings?.hero?.title || "",
      heroCtaLabel: homeSettings?.hero?.ctaLabel || "Ahora",
      heroCtaHref: homeSettings?.hero?.ctaHref || "/contacto",
      heroSecondaryCtaLabel:
        homeSettings?.hero?.secondaryCtaLabel || "Ver categorias",
      heroSecondaryCtaHref: homeSettings?.hero?.secondaryCtaHref || "/categories",
      heroMediaType: homeSettings?.hero?.mediaType || "sequence",
      heroImage: homeSettings?.hero?.image || "",
      heroImagesText: (homeSettings?.hero?.images || []).join("\n"),
      heroVideo: homeSettings?.hero?.video || "",
      categoriesTitle:
        homeSettings?.categories?.title || "Explora el trabajo por linea visual",
      brandLogosTitle:
        homeSettings?.brandLogos?.title || "Marcas con las que he trabajado",
      brandLogosIntro:
        homeSettings?.brandLogos?.intro ||
        "Logos de marcas, clientes o proyectos que puedes destacar como referencia visual.",
      brandLogosText: (homeSettings?.brandLogos?.logos || []).join("\n"),
      parallaxTitle: homeSettings?.parallax?.title || "",
      parallaxIntro: homeSettings?.parallax?.intro || "",
      parallaxCtaLabel: homeSettings?.parallax?.ctaLabel || "Reserva tu sesion",
      parallaxCtaHref: homeSettings?.parallax?.ctaHref || "/contacto",
      parallaxImage: homeSettings?.parallax?.image || "",
      packageCtaTitle: homeSettings?.packageCta?.title || "Arma tu paquete conmigo",
      packageCtaIntro:
        homeSettings?.packageCta?.intro ||
        "Creamos una propuesta visual a tu medida para que tu marca mantenga una imagen clara, elegante y coherente.",
      packageCtaLabel: homeSettings?.packageCta?.ctaLabel || "Quiero mi paquete",
      packageCtaHref: homeSettings?.packageCta?.ctaHref || "/contacto",
    });
  }, [homeSettings]);

  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setMessage("");
    }, 4500);

    return () => window.clearTimeout(timeout);
  }, [message]);

  const setNotice = (text, type = "success") => {
    setMessageType(type);
    setMessage(text);
  };

  const resetCoverFileInput = () => {
    setCoverFile(null);

    if (coverFileInputRef.current) {
      coverFileInputRef.current.value = "";
    }
  };

  const resetInputRef = (inputRef) => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const resetMediaFileInputs = () => {
    resetInputRef(mediaFileInputRef);
    resetInputRef(mediaThumbnailFileInputRef);
  };

  const resetContactPhotoInput = () => {
    setContactPhotoFile(null);

    if (contactPhotoFileInputRef.current) {
      contactPhotoFileInputRef.current.value = "";
    }
  };

  const resetHomeFileInputs = () => {
    setHeroImageFile(null);
    setHeroSequenceFiles([]);
    setHeroVideoFile(null);
    setBrandLogoFiles([]);
    setParallaxImageFile(null);
    resetInputRef(heroImageFileInputRef);
    resetInputRef(heroSequenceFileInputRef);
    resetInputRef(heroVideoFileInputRef);
    resetInputRef(brandLogoFileInputRef);
    resetInputRef(parallaxImageFileInputRef);
  };

  const formatSelectedFiles = (files) => {
    if (!files?.length) {
      return "Ningun archivo seleccionado";
    }

    return `Archivos seleccionados: ${files.map((file) => file.name).join(", ")}`;
  };

  const handleValidatedSingleFile = ({ file, type, setter }) => {
    const validationError = validateFileSize(file, type);

    if (validationError) {
      setter(null);
      setNotice(validationError, "error");
      return false;
    }

    setter(file || null);
    return true;
  };

  const handleValidatedMultiFile = ({ files, type, setter }) => {
    const invalidFile = files.find((file) => validateFileSize(file, type));

    if (invalidFile) {
      setter([]);
      setNotice(validateFileSize(invalidFile, type), "error");
      return false;
    }

    setter(files);
    return true;
  };

  const uploadButtonLabel = uploadProgress?.active
    ? `${uploadProgress.percentage}%`
    : saving
      ? "Guardando..."
      : "";
  const globalLoaderText = uploadProgress?.active
    ? uploadProgress.label || "Subiendo video..."
    : uploadingLabel;

  useEffect(() => {
    if (globalLoaderText) {
      if (loaderHideTimeoutRef.current) {
        window.clearTimeout(loaderHideTimeoutRef.current);
        loaderHideTimeoutRef.current = null;
      }

      loaderShownAtRef.current = Date.now();
      setVisibleLoaderText(globalLoaderText);
      return;
    }

    if (!visibleLoaderText) {
      return;
    }

    const elapsed = Date.now() - loaderShownAtRef.current;
    const remaining = Math.max(MIN_GLOBAL_LOADER_MS - elapsed, 0);

    loaderHideTimeoutRef.current = window.setTimeout(() => {
      setVisibleLoaderText("");
      loaderHideTimeoutRef.current = null;
    }, remaining);

    return () => {
      if (loaderHideTimeoutRef.current) {
        window.clearTimeout(loaderHideTimeoutRef.current);
        loaderHideTimeoutRef.current = null;
      }
    };
  }, [globalLoaderText, visibleLoaderText]);

  useEffect(() => {
    if (!saving && !uploadProgress?.active && !uploadingLabel && visibleLoaderText) {
      setVisibleLoaderText("");
    }
  }, [saving, uploadProgress, uploadingLabel, visibleLoaderText]);

  const handleCategorySubmit = async (event) => {
    event.preventDefault();

    const name = categoryForm.name.trim();
    const slug = categoryForm.slug.trim() || slugifyCategoryName(name);

    if (!name || !slug) {
      setNotice("La categoria necesita nombre y slug.", "error");
      return;
    }

    if (
      categories.some(
        (category) => category.slug === slug && category.id !== editingCategoryId
      )
    ) {
      setNotice("Ya existe una categoria con ese slug.", "error");
      return;
    }

    try {
      setUploadingLabel(coverFile ? "Subiendo portada de categoria..." : "");
      const payload = {
        name,
        slug,
        cover: categoryForm.cover.trim(),
        description: categoryForm.description.trim(),
        coverFile,
      };
      let categoryId = editingCategoryId;

      if (editingCategoryId) {
        await updateCategory(editingCategoryId, payload);
      } else {
        categoryId = await createCategory(payload);
      }

      setSelectedCategoryId(categoryId);
      setCategoryForm(emptyCategoryForm);
      setEditingCategoryId("");
      resetCoverFileInput();
      setNotice(
        editingCategoryId
          ? "Categoria actualizada."
          : mode === "supabase"
            ? "Categoria guardada en Supabase."
            : "Categoria guardada en modo local."
      );
    } catch (submitError) {
      setNotice(submitError.message || "No se pudo guardar la categoria.", "error");
    } finally {
      setUploadingLabel("");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      setUploadingLabel("Eliminando categoria...");
      await deleteCategory(categoryId);

      if (editingCategoryId === categoryId) {
        setCategoryForm(emptyCategoryForm);
        setEditingCategoryId("");
        resetCoverFileInput();
      }

      if (selectedCategoryId === categoryId) {
        const nextCategory = categories.find((category) => category.id !== categoryId);
        setSelectedCategoryId(nextCategory?.id || "");
      }

      setNotice("Categoria eliminada.");
    } catch (deleteError) {
      setNotice(deleteError.message || "No se pudo eliminar la categoria.", "error");
    } finally {
      setUploadingLabel("");
    }
  };

  const handleCategoryDragStart = (categoryId) => {
    setDraggedCategoryId(categoryId);
    setDragOverCategoryId(categoryId);
  };

  const handleCategoryDragEnter = (categoryId) => {
    if (!draggedCategoryId || draggedCategoryId === categoryId) {
      return;
    }

    setDragOverCategoryId(categoryId);
  };

  const handleCategoryDragEnd = () => {
    setDraggedCategoryId("");
    setDragOverCategoryId("");
  };

  const handleCategoryDrop = async (targetCategoryId) => {
    if (!draggedCategoryId || draggedCategoryId === targetCategoryId) {
      handleCategoryDragEnd();
      return;
    }

    const fromIndex = categories.findIndex((category) => category.id === draggedCategoryId);
    const toIndex = categories.findIndex((category) => category.id === targetCategoryId);

    if (fromIndex === -1 || toIndex === -1) {
      handleCategoryDragEnd();
      return;
    }

    try {
      setUploadingLabel("Reordenando categorias...");
      await reorderCategories(swapItems(categories, fromIndex, toIndex));
      setNotice("Orden de categorias actualizado.");
    } catch (moveError) {
      setNotice(moveError.message || "No se pudo reordenar la categoria.", "error");
    } finally {
      setUploadingLabel("");
      handleCategoryDragEnd();
    }
  };

  const handleMediaDragStart = (mediaId) => {
    if (isMediaReorderDisabled) {
      return;
    }

    setDraggedMediaId(mediaId);
    setDragOverMediaId(mediaId);
  };

  const handleMediaDragEnter = (mediaId) => {
    if (isMediaReorderDisabled) {
      return;
    }

    if (!draggedMediaId || draggedMediaId === mediaId) {
      return;
    }

    setDragOverMediaId(mediaId);
  };

  const handleMediaDragEnd = () => {
    setDraggedMediaId("");
    setDragOverMediaId("");
  };

  const handleMediaDrop = async (targetMediaId) => {
    if (isMediaReorderDisabled) {
      handleMediaDragEnd();
      return;
    }

    if (!selectedCategory || !draggedMediaId || draggedMediaId === targetMediaId) {
      handleMediaDragEnd();
      return;
    }

    const fromIndex = selectedCategory.items.findIndex((item) => item.id === draggedMediaId);
    const toIndex = selectedCategory.items.findIndex((item) => item.id === targetMediaId);

    if (fromIndex === -1 || toIndex === -1) {
      handleMediaDragEnd();
      return;
    }

    try {
      setUploadingLabel("Reordenando elementos...");
      await reorderMediaItems(selectedCategory.id, swapItems(selectedCategory.items, fromIndex, toIndex));
      setNotice("Orden actualizado.");
    } catch (moveError) {
      setNotice(moveError.message || "No se pudo reordenar.", "error");
    } finally {
      setUploadingLabel("");
      handleMediaDragEnd();
    }
  };

  const handlePackageDragStart = (packageId) => {
    setDraggedPackageId(packageId);
    setDragOverPackageId(packageId);
  };

  const handlePackageDragEnter = (packageId) => {
    if (!draggedPackageId || draggedPackageId === packageId) {
      return;
    }

    setDragOverPackageId(packageId);
  };

  const handlePackageDragEnd = () => {
    setDraggedPackageId("");
    setDragOverPackageId("");
  };

  const handlePackageDrop = async (targetPackageId) => {
    if (!draggedPackageId || draggedPackageId === targetPackageId) {
      handlePackageDragEnd();
      return;
    }

    const fromIndex = packages.findIndex((item) => item.id === draggedPackageId);
    const toIndex = packages.findIndex((item) => item.id === targetPackageId);

    if (fromIndex === -1 || toIndex === -1) {
      handlePackageDragEnd();
      return;
    }

    try {
      setUploadingLabel("Reordenando paquetes...");
      await reorderPackages(swapItems(packages, fromIndex, toIndex));
      setNotice("Orden de paquetes actualizado.");
    } catch (packageError) {
      setNotice(packageError.message || "No se pudo reordenar el paquete.", "error");
    } finally {
      setUploadingLabel("");
      handlePackageDragEnd();
    }
  };

  const startEditingCategory = (category) => {
    setEditingCategoryId(category.id);
    setSelectedCategoryId(category.id);
    setCategoryForm({
      name: category.name || "",
      slug: category.slug || "",
      cover: category.cover || "",
      description: category.description || "",
    });
    resetCoverFileInput();
  };

  const resetCategoryForm = () => {
    setCategoryForm(emptyCategoryForm);
    setEditingCategoryId("");
    resetCoverFileInput();
  };

  const handleMediaSubmit = async (event) => {
    event.preventDefault();

    if (!selectedCategory) {
      setNotice("Primero crea una categoria.", "error");
      return;
    }

    const src = mediaForm.src.trim();
    const thumbnail = mediaForm.thumbnail.trim();

    if (!src && !mediaForm.mediaFile) {
      setNotice("Agrega una URL o selecciona un archivo.", "error");
      return;
    }

    if (mediaForm.type === "video" && !thumbnail && !mediaForm.thumbnailFile) {
      setNotice("Los videos necesitan thumbnail por URL o archivo.", "error");
      return;
    }

    try {
      setUploadingLabel(
        mediaForm.mediaFile || mediaForm.thumbnailFile
          ? editingMediaId
            ? "Actualizando archivos del elemento..."
            : "Subiendo archivos del elemento..."
          : editingMediaId
            ? "Actualizando elemento..."
            : "Guardando elemento..."
      );
      if (editingMediaId) {
        await updateMediaItem(selectedCategory.id, editingMediaId, {
          type: mediaForm.type,
          src,
          thumbnail,
          title: mediaForm.title.trim(),
          mediaFile: mediaForm.mediaFile,
          thumbnailFile: mediaForm.thumbnailFile,
        });
      } else {
        await createMediaItem({
          category: selectedCategory,
          type: mediaForm.type,
          src,
          thumbnail,
          title: mediaForm.title.trim(),
          mediaFile: mediaForm.mediaFile,
          thumbnailFile: mediaForm.thumbnailFile,
        });
      }

      setMediaForm(emptyMediaForm);
      setEditingMediaId("");
      resetMediaFileInputs();
      setNotice(
        editingMediaId
          ? "Elemento actualizado."
          : mode === "supabase"
            ? "Elemento guardado en Supabase."
            : "Elemento guardado en modo local."
      );
    } catch (submitError) {
      setNotice(submitError.message || "No se pudo guardar el elemento.", "error");
    } finally {
      setUploadingLabel("");
    }
  };

  const handleRemoveMedia = async (mediaId) => {
    if (!selectedCategory) {
      return;
    }

    try {
      setUploadingLabel("Eliminando elemento...");
      await removeMediaItem(selectedCategory.id, mediaId);
      if (editingMediaId === mediaId) {
        setMediaForm(emptyMediaForm);
        setEditingMediaId("");
        resetMediaFileInputs();
      }
      setNotice("Elemento eliminado.");
    } catch (removeError) {
      setNotice(removeError.message || "No se pudo eliminar el elemento.", "error");
    } finally {
      setUploadingLabel("");
    }
  };

  const startEditingMedia = (item) => {
    setEditingMediaId(item.id);
    setMediaForm({
      type: item.type || "image",
      src: item.src || "",
      thumbnail: item.thumbnail || "",
      title: item.title || "",
      mediaFile: null,
      thumbnailFile: null,
    });
    resetMediaFileInputs();
  };

  const resetMediaForm = () => {
    setMediaForm(emptyMediaForm);
    setEditingMediaId("");
    resetMediaFileInputs();
  };

  const restoreDefaults = () => {
    const defaults = getDefaultGalleryStore();
    resetGalleryStore();
    saveGalleryStore(defaults);
    setSelectedCategoryId(defaults.categories[0]?.id || "");
    setNotice("Datos demo restaurados en localStorage.");
  };

  const handleSignOut = async () => {
    setSigningOut(true);

    try {
      await signOut();
    } catch (signOutError) {
      setNotice(signOutError.message || "No se pudo cerrar sesion.", "error");
    } finally {
      setSigningOut(false);
    }
  };

  const resetPackageForm = () => {
    setPackageForm(emptyPackageForm);
    setEditingPackageId("");
  };

  const handlePackageSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      title: packageForm.title.trim(),
      theme: packageForm.theme,
      isFeatured: packageForm.isFeatured,
      features: packageForm.featuresText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      priceIndividual: packageForm.priceIndividual.trim(),
      pricePlan: packageForm.pricePlan.trim(),
      pricePlanLabel: packageForm.pricePlanLabel.trim() || "Precio plan mensual",
      pricePlanNote:
        packageForm.pricePlanNote.trim() ||
        "Ideal para marcas que quieren mantener una imagen constante y profesional.",
      buttonText: packageForm.buttonText.trim() || "Comencemos",
    };

    if (!payload.title) {
      setNotice("El paquete necesita titulo.", "error");
      return;
    }

    try {
      setUploadingLabel(editingPackageId ? "Actualizando paquete..." : "Guardando paquete...");
      if (editingPackageId) {
        await updatePackage(editingPackageId, payload);
        setNotice("Paquete actualizado.");
      } else {
        await createPackage(payload);
        setNotice("Paquete creado.");
      }

      resetPackageForm();
    } catch (packageError) {
      setNotice(packageError.message || "No se pudo guardar el paquete.", "error");
    } finally {
      setUploadingLabel("");
    }
  };

  const startEditingPackage = (item) => {
    setEditingPackageId(item.id);
    setPackageForm({
      title: item.title,
      theme: item.theme,
      isFeatured: item.isFeatured,
      featuresText: item.features.join("\n"),
      priceIndividual: item.priceIndividual,
      pricePlan: item.pricePlan,
      pricePlanLabel: item.pricePlanLabel || "Precio plan mensual",
      pricePlanNote:
        item.pricePlanNote ||
        "Ideal para marcas que quieren mantener una imagen constante y profesional.",
      buttonText: item.buttonText || "Comencemos",
    });
  };

  const handleDeletePackage = async (packageId) => {
    try {
      setUploadingLabel("Eliminando paquete...");
      await deletePackage(packageId);

      if (editingPackageId === packageId) {
        resetPackageForm();
      }

      setNotice("Paquete eliminado.");
    } catch (packageError) {
      setNotice(packageError.message || "No se pudo eliminar el paquete.", "error");
    } finally {
      setUploadingLabel("");
    }
  };

  const handleContactSubmit = async (event) => {
    event.preventDefault();

    try {
      setUploadingLabel("Guardando contacto...");
      const normalizedWhatsApp = normalizeWhatsAppValue(contactForm.whatsapp);

      await updateContact({
        title: contactForm.title.trim(),
        intro: contactForm.intro.trim(),
        photoUrl: contactForm.photoUrl.trim(),
        email: contactForm.email.trim(),
        phone: contactForm.phone.trim(),
        whatsapp: normalizedWhatsApp,
        instagram: contactForm.instagram.trim(),
        facebook: contactForm.facebook.trim(),
        ctaLabel: contactForm.ctaLabel.trim() || "Escribenos",
        contactPhotoFile,
        homeSettings,
      });
      setContactForm((current) => ({ ...current, whatsapp: normalizedWhatsApp }));
      resetContactPhotoInput();
      setNotice("Contacto actualizado.");
    } catch (contactError) {
      setNotice(contactError.message || "No se pudo actualizar el contacto.", "error");
    } finally {
      setUploadingLabel("");
    }
  };

  const handleHomeSubmit = async (event) => {
    event.preventDefault();

    const heroImages = homeForm.heroImagesText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    const brandLogoUrls = homeForm.brandLogosText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      setUploadingLabel(
        heroImageFile ||
          heroSequenceFiles.length ||
          heroVideoFile ||
          brandLogoFiles.length ||
          parallaxImageFile
          ? "Subiendo archivos del home..."
          : "Guardando home..."
      );
      await updateHomeSettings({
        hero: {
          title: homeForm.heroTitle.trim() || "Agenda tu sesion de contenido",
          ctaLabel: homeForm.heroCtaLabel.trim() || "Ahora",
          ctaHref: homeForm.heroCtaHref.trim() || "/contacto",
          secondaryCtaLabel: homeForm.heroSecondaryCtaLabel.trim() || "Ver categorias",
          secondaryCtaHref: homeForm.heroSecondaryCtaHref.trim() || "/categories",
          mediaType: homeForm.heroMediaType,
          image: homeForm.heroImage.trim(),
          images: heroImages,
          video: homeForm.heroVideo.trim(),
        },
        categories: {
          title:
            homeForm.categoriesTitle.trim() || "Explora el trabajo por linea visual",
        },
        brandLogos: {
          title: homeForm.brandLogosTitle.trim() || "Marcas con las que he trabajado",
          intro:
            homeForm.brandLogosIntro.trim() ||
            "Logos de marcas, clientes o proyectos que puedes destacar como referencia visual.",
          logos: brandLogoUrls,
        },
        parallax: {
          title: homeForm.parallaxTitle.trim() || "Captura momentos inolvidables",
          intro:
            homeForm.parallaxIntro.trim() ||
            "Fotografia profesional para marcas, eventos y personas que buscan calidad.",
          ctaLabel: homeForm.parallaxCtaLabel.trim() || "Reserva tu sesion",
          ctaHref: homeForm.parallaxCtaHref.trim() || "/contacto",
          image: homeForm.parallaxImage.trim(),
        },
        packageCta: {
          title: homeForm.packageCtaTitle.trim() || "Arma tu paquete conmigo",
          intro:
            homeForm.packageCtaIntro.trim() ||
            "Creamos una propuesta visual a tu medida para que tu marca mantenga una imagen clara, elegante y coherente.",
          ctaLabel: homeForm.packageCtaLabel.trim() || "Quiero mi paquete",
          ctaHref: homeForm.packageCtaHref.trim() || "/contacto",
        },
        heroImageFile,
        heroSequenceFiles,
        heroVideoFile,
        brandLogoFiles,
        parallaxImageFile,
      });

      resetHomeFileInputs();
      setNotice("Home actualizado.");
    } catch (homeError) {
      setNotice(homeError.message || "No se pudo actualizar el home.", "error");
    } finally {
      setUploadingLabel("");
    }
  };

  return (
    <section className="min-h-screen w-11/12 ml-auto px-4 md:px-8 lg:px-16 py-12 text-white">
      <div className="max-w-6xl mx-auto grid gap-8">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-400 mb-3">Admin</p>
          <h1 className="text-3xl md:text-5xl font-semibold mb-4">Administrador del sitio</h1>
          <p className="text-neutral-300 max-w-3xl">
            {mode === "supabase"
              ? `Supabase esta conectado. Desde aqui puedes editar galeria, paquetes, contacto y archivos del sitio usando el bucket ${supabaseBucket}.`
              : isSupabaseConfigured
                ? "Hay variables de Supabase, pero ahora mismo la app esta usando el respaldo local porque no pudo leer la nube."
                : "Todavia no hay variables de Supabase. El panel sigue funcionando en modo local para que no te quedes bloqueado."}
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <span className="px-4 py-2 rounded-full bg-white text-neutral-900 font-medium">
              Modo: {mode === "supabase" ? "Supabase" : "Local"}
            </span>
            {user?.email ? (
              <span className="px-4 py-2 rounded-full border border-white/20 text-white">
                {user.email}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => downloadJson("favisual-gallery.json", store)}
              className="px-4 py-2 rounded-full border border-white/20 text-white"
            >
              Exportar JSON
            </button>
            {!isSupabaseConfigured ? (
              <button
                type="button"
                onClick={restoreDefaults}
                className="px-4 py-2 rounded-full border border-white/20 text-white"
              >
                Restaurar demo local
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="px-4 py-2 rounded-full border border-white/20 text-white disabled:opacity-60"
            >
              {signingOut ? "Cerrando..." : "Cerrar sesion"}
            </button>
          </div>
          {loading ? <p className="mt-4 text-sm text-neutral-300">Cargando datos...</p> : null}
          {message ? (
            <div
              className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                messageType === "error"
                  ? "border-red-400/30 bg-red-500/10 text-red-100"
                  : "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
              }`}
            >
              {message}
            </div>
          ) : null}
          {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
          {saving && uploadProgress?.active ? (
            <div className="mt-4 rounded-2xl border border-sky-300/20 bg-sky-400/10 px-4 py-4 text-sm text-sky-100">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{uploadProgress.label || "Subiendo video..."}</p>
                <span className="text-xs font-semibold tabular-nums text-sky-100/80">
                  {uploadProgress.percentage}%
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-sky-950/60">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,rgba(125,211,252,0.95),rgba(56,189,248,1))] transition-[width] duration-200"
                  style={{ width: `${uploadProgress.percentage}%` }}
                />
              </div>
              <p className="mt-2 text-sky-100/75">
                La subida es resumible. Si la red se pone lenta, el proceso puede continuar.
              </p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-sky-100/75">
                <span>{formatTransferSpeed(uploadProgress.bytesPerSecond)}</span>
                <span>{formatRemainingTime(uploadProgress.remainingSeconds)}</span>
                <span>
                  {formatFileSize(uploadProgress.uploadedBytes)} / {formatFileSize(uploadProgress.totalBytes)}
                </span>
              </div>
            </div>
          ) : null}
          {saving && uploadingLabel && !uploadProgress?.active ? (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-sky-300/20 bg-sky-400/10 px-4 py-3 text-sm text-sky-100">
              <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 border-sky-200/40 border-t-sky-100 animate-spin" />
              <div>
                <p className="font-medium">{uploadingLabel}</p>
                <p className="mt-1 text-sky-100/75">
                  No cierres esta ventana mientras termina la subida.
                </p>
              </div>
            </div>
          ) : null}
        </div>
        {visibleLoaderText ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]">
            <div className="w-full max-w-md rounded-[1.75rem] border border-white/10 bg-neutral-950/95 px-6 py-5 text-white shadow-2xl">
              <div className="flex items-start gap-4">
                <span className="mt-1 h-5 w-5 shrink-0 rounded-full border-2 border-amber-200/30 border-t-amber-300 animate-spin" />
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.26em] text-neutral-500">Procesando</p>
                  <p className="mt-2 text-lg font-medium">{visibleLoaderText}</p>
                  {uploadProgress?.active ? (
                    <>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,rgba(253,224,71,0.95),rgba(251,146,60,1))] transition-[width] duration-200"
                          style={{ width: `${uploadProgress.percentage}%` }}
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-300">
                        <span>{uploadProgress.percentage}%</span>
                        <span>{formatTransferSpeed(uploadProgress.bytesPerSecond)}</span>
                        <span>{formatRemainingTime(uploadProgress.remainingSeconds)}</span>
                      </div>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-neutral-400">
                      Espera un momento mientras terminamos este cambio.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="sticky top-20 z-30 -mx-4 px-4 md:-mx-8 md:px-8 lg:top-24 lg:-mx-16 lg:px-16">
          <div className="overflow-x-auto">
            <div className="min-w-max rounded-3xl border border-white/10 bg-neutral-950/88 p-3 shadow-2xl backdrop-blur-xl">
              <div className="flex gap-2 sm:gap-3">
                {ADMIN_SECTIONS.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="whitespace-nowrap rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:border-amber-300/40 hover:bg-amber-300/10"
                  >
                    {section.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">

        <div
          id="categorias"
          className="scroll-mt-32 rounded-[2rem] border border-white/10 bg-white/5 p-6"
        >
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8">
            <form
              onSubmit={handleCategorySubmit}
              className="bg-black/10 border border-white/10 rounded-3xl p-6 space-y-4"
            >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">
                  {editingCategoryId ? "Editar categoria" : "Nueva categoria"}
                </h2>
                {editingCategoryId ? (
                  <p className="mt-1 text-sm text-neutral-400">
                    Si reemplazas el cover en Supabase, el archivo anterior se elimina del storage.
                  </p>
                ) : null}
              </div>
              {editingCategoryId ? (
                <button
                  type="button"
                  onClick={resetCategoryForm}
                  className="rounded-full border border-white/15 px-4 py-2 text-sm text-white"
                >
                  Cancelar edicion
                </button>
              ) : null}
            </div>
            <label className="block">
              <span className="text-sm text-neutral-300">Nombre</span>
              <input
                value={categoryForm.name}
                onChange={(event) => {
                  const name = event.target.value;
                  setCategoryForm((current) => ({
                    ...current,
                    name,
                    slug: current.slug ? current.slug : slugifyCategoryName(name),
                  }));
                }}
                className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                placeholder="Bodas"
              />
            </label>
            <label className="block">
              <span className="text-sm text-neutral-300">Slug</span>
              <input
                value={categoryForm.slug}
                onChange={(event) =>
                  setCategoryForm((current) => ({
                    ...current,
                    slug: slugifyCategoryName(event.target.value),
                  }))
                }
                className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                placeholder="bodas"
              />
            </label>
            <label className="block">
              <span className="text-sm text-neutral-300">Portada por URL</span>
              <input
                value={categoryForm.cover}
                onChange={(event) =>
                  setCategoryForm((current) => ({ ...current, cover: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                placeholder="https://... o /images/..."
              />
            </label>
            <label className="block">
              <span className="text-sm text-neutral-300">Portada por archivo</span>
              <input
                ref={coverFileInputRef}
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0] || null;
                  const isValid = handleValidatedSingleFile({
                    file: selectedFile,
                    type: "image",
                    setter: setCoverFile,
                  });

                  if (!isValid) {
                    resetInputRef(coverFileInputRef);
                  }
                }}
                className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
              />
              <p className="mt-2 text-xs text-neutral-500">
                {coverFile ? `Archivo seleccionado: ${coverFile.name}` : "Ningun archivo seleccionado"}
              </p>
              <p className="mt-1 text-xs text-neutral-600">
                Maximo recomendado: {MAX_IMAGE_UPLOAD_MB} MB.
              </p>
            </label>
            <label className="block">
              <span className="text-sm text-neutral-300">Descripcion</span>
              <textarea
                value={categoryForm.description}
                onChange={(event) =>
                  setCategoryForm((current) => ({ ...current, description: event.target.value }))
                }
                className="mt-2 w-full min-h-28 rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                placeholder="Que tipo de contenido entra aqui"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-3 rounded-full bg-amber-300 text-neutral-950 font-semibold disabled:opacity-60"
            >
              {uploadProgress?.active
                ? `Subiendo video... ${uploadButtonLabel}`
                : saving
                  ? "Guardando..."
                  : editingCategoryId
                    ? "Actualizar categoria"
                    : "Guardar categoria"}
            </button>
            </form>

            <div className="bg-black/10 border border-white/10 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">Categorias activas</h2>
                  <p className="mt-1 text-sm text-neutral-400">
                    Arrastra y suelta para cambiar el orden.
                  </p>
                </div>
                <span className="text-sm text-neutral-400">{categories.length} total</span>
              </div>
              <div className="grid gap-3">
                {categories.map((category, index) => (
                  <div
                    key={category.id}
                    draggable={!saving}
                    onDragStart={() => handleCategoryDragStart(category.id)}
                    onDragEnter={() => handleCategoryDragEnter(category.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleCategoryDrop(category.id)}
                    onDragEnd={handleCategoryDragEnd}
                    className={`rounded-2xl border p-4 transition ${
                      draggedCategoryId === category.id ? "opacity-50" : ""
                    } ${
                      dragOverCategoryId === category.id && draggedCategoryId !== category.id
                        ? "border-sky-300 bg-sky-400/10"
                        : ""
                    } ${
                      selectedCategory?.id === category.id
                        ? "border-amber-300 bg-white/10"
                        : "border-white/10 bg-black/10"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="cursor-grab select-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.2em] text-neutral-400">
                          Drag
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedCategoryId(category.id)}
                          className="text-left"
                        >
                          <p className="font-semibold">{category.name}</p>
                          <p className="text-sm text-neutral-400">/{category.slug}</p>
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEditingCategory(category)}
                          className="px-3 py-1 rounded-full border border-white/15"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(category.id)}
                          disabled={saving}
                          className="px-3 py-1 rounded-full border border-red-400/30 text-red-200 disabled:opacity-60"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          id="media"
          className="scroll-mt-32 rounded-[2rem] border border-white/10 bg-white/5 p-6"
        >
          <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-8">
            <form
              onSubmit={handleMediaSubmit}
              className="bg-black/10 border border-white/10 rounded-3xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between gap-4">
               <div>
                 <h2 className="text-2xl font-semibold">
                   {editingMediaId ? "Editar foto o video" : "Agregar foto o video"}
                 </h2>
                 {editingMediaId ? (
                   <p className="mt-1 text-sm text-neutral-400">
                     Si cambias el archivo o thumbnail en Supabase, el anterior se elimina del storage.
                   </p>
                 ) : null}
               </div>
               <select
                 value={selectedCategory?.id || ""}
                 onChange={(event) => setSelectedCategoryId(event.target.value)}
                 className="rounded-full bg-neutral-950 border border-white/10 px-4 py-2"
               >
                 {categoryOptions.map((category) => (
                   <option key={category.id} value={category.id}>
                     {category.name}
                   </option>
                 ))}
               </select>
             </div>
            <label className="block">
              <span className="text-sm text-neutral-300">Tipo</span>
              <select
                value={mediaForm.type}
                onChange={(event) => {
                  setMediaForm((current) => ({
                    ...current,
                    type: event.target.value,
                    mediaFile: null,
                    thumbnailFile: null,
                    thumbnail: event.target.value === "video" ? current.thumbnail : "",
                  }));
                  resetMediaFileInputs();
                }}
                className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
              >
                <option value="image">Foto</option>
                <option value="video">Video</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm text-neutral-300">URL del archivo</span>
              <input
                value={mediaForm.src}
                onChange={(event) =>
                  setMediaForm((current) => ({ ...current, src: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                placeholder="https://... o /videos/..."
              />
            </label>
            <label className="block">
              <span className="text-sm text-neutral-300">Archivo</span>
              <input
                ref={mediaFileInputRef}
                type="file"
                accept={mediaForm.type === "video" ? "video/*" : "image/*"}
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0] || null;
                  const isValid = validateFileSize(selectedFile, mediaForm.type);

                  if (isValid) {
                    setMediaForm((current) => ({
                      ...current,
                      mediaFile: null,
                    }));
                    resetInputRef(mediaFileInputRef);
                    setNotice(isValid, "error");
                    return;
                  }

                  setMediaForm((current) => ({
                    ...current,
                    mediaFile: selectedFile,
                  }));
                }}
                className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
              />
              <p className="mt-2 text-xs text-neutral-500">
                {mediaForm.mediaFile
                  ? `Archivo seleccionado: ${mediaForm.mediaFile.name}`
                  : "Ningun archivo seleccionado"}
              </p>
              <p className="mt-1 text-xs text-neutral-600">
                Maximo recomendado: {mediaForm.type === "video" ? MAX_VIDEO_UPLOAD_MB : MAX_IMAGE_UPLOAD_MB} MB.
              </p>
            </label>
            <label className="block">
              <span className="text-sm text-neutral-300">Thumbnail URL para video</span>
              <input
                value={mediaForm.thumbnail}
                onChange={(event) =>
                  setMediaForm((current) => ({ ...current, thumbnail: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                placeholder="https://... o /images/..."
              />
            </label>
            <label className="block">
              <span className="text-sm text-neutral-300">Thumbnail archivo para video</span>
              <input
                ref={mediaThumbnailFileInputRef}
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0] || null;
                  const validationError = validateFileSize(selectedFile, "image");

                  if (validationError) {
                    setMediaForm((current) => ({
                      ...current,
                      thumbnailFile: null,
                    }));
                    resetInputRef(mediaThumbnailFileInputRef);
                    setNotice(validationError, "error");
                    return;
                  }

                  setMediaForm((current) => ({
                    ...current,
                    thumbnailFile: selectedFile,
                  }));
                }}
                className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
              />
              <p className="mt-2 text-xs text-neutral-500">
                {mediaForm.thumbnailFile
                  ? `Archivo seleccionado: ${mediaForm.thumbnailFile.name}`
                  : "Ningun archivo seleccionado"}
              </p>
              <p className="mt-1 text-xs text-neutral-600">
                Maximo recomendado: {MAX_IMAGE_UPLOAD_MB} MB.
              </p>
            </label>
            <label className="block">
              <span className="text-sm text-neutral-300">Titulo</span>
              <input
                value={mediaForm.title}
                onChange={(event) =>
                  setMediaForm((current) => ({ ...current, title: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                placeholder="Campana primavera"
              />
            </label>
             <button
               type="submit"
               disabled={saving}
               className="px-4 py-3 rounded-full bg-white text-neutral-950 font-semibold disabled:opacity-60"
             >
               {uploadProgress?.active
                 ? `Subiendo video... ${uploadButtonLabel}`
                 : saving
                   ? "Guardando..."
                   : editingMediaId
                     ? "Actualizar elemento"
                     : "Guardar elemento"}
             </button>
             {editingMediaId ? (
               <button
                 type="button"
                 onClick={resetMediaForm}
                 className="ml-3 px-4 py-3 rounded-full border border-white/15 text-white"
               >
                 Cancelar edicion
               </button>
             ) : null}
             </form>

            <div className="bg-black/10 border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">{selectedCategory?.name || "Sin categoria"}</h2>
                <p className="text-sm text-neutral-400">
                  {selectedMediaItems.length || 0} elementos cargados
                </p>
              </div>
            </div>

            {!selectedMediaItems.length ? (
              <p className="text-neutral-400">Todavia no hay fotos o videos en esta categoria.</p>
            ) : null}

            {selectedMediaItems.length > 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4 space-y-4">
                <div className="grid sm:grid-cols-[1fr_auto] gap-3">
                  <label className="block">
                    <span className="text-sm text-neutral-300">Buscar por titulo</span>
                    <input
                      value={mediaSearch}
                      onChange={(event) => setMediaSearch(event.target.value)}
                      className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                      placeholder="Ej. primavera"
                    />
                  </label>
                  <label className="block sm:min-w-44">
                    <span className="text-sm text-neutral-300">Tipo</span>
                    <select
                      value={mediaTypeFilter}
                      onChange={(event) => setMediaTypeFilter(event.target.value)}
                      className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                    >
                      <option value="all">Todos</option>
                      <option value="image">Fotos</option>
                      <option value="video">Videos</option>
                    </select>
                  </label>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm text-neutral-300">
                      {filteredMediaItems.length} resultado{filteredMediaItems.length === 1 ? "" : "s"} ·
                      pagina <span className="text-white font-medium"> {mediaPage} </span>
                      de <span className="text-white font-medium"> {totalMediaPages}</span>
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {isMediaReorderDisabled
                        ? "Limpia la busqueda y el filtro para reordenar elementos."
                        : "Arrastra y suelta elementos para cambiar el orden de la categoria."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMediaSearch("");
                      setMediaTypeFilter("all");
                    }}
                    className="px-3 py-1 rounded-full border border-white/15"
                  >
                    Limpiar
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaPage((page) => Math.max(1, page - 1))}
                    disabled={mediaPage === 1}
                    className="px-3 py-1 rounded-full border border-white/15 disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaPage((page) => Math.min(totalMediaPages, page + 1))}
                    disabled={mediaPage === totalMediaPages}
                    className="px-3 py-1 rounded-full border border-white/15 disabled:opacity-40"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
              </div>
            ) : null}

            <div className="grid gap-3">
              {paginatedMediaItems.map((item) => {
                const previewSrc =
                  item.type === "video"
                    ? item.thumbnail || selectedCategory?.cover || "/images/Otras.jpg"
                    : item.src;

                return (
                  <div
                    key={item.id}
                    draggable={!saving && !isMediaReorderDisabled}
                    onDragStart={() => handleMediaDragStart(item.id)}
                    onDragEnter={() => handleMediaDragEnter(item.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleMediaDrop(item.id)}
                    onDragEnd={handleMediaDragEnd}
                    className={`rounded-2xl border bg-black/10 p-4 transition ${
                      draggedMediaId === item.id ? "opacity-50" : ""
                    } ${
                      dragOverMediaId === item.id && draggedMediaId !== item.id
                        ? "border-sky-300 bg-sky-400/10"
                        : "border-white/10"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative w-full sm:w-32 h-32 overflow-hidden rounded-2xl bg-neutral-950 border border-white/10 shrink-0">
                        <img
                          src={previewSrc}
                          alt={item.title || item.src}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-white">
                          {item.type === "video" ? "Video" : "Foto"}
                        </span>
                      </div>
                      <div className="flex-1 flex flex-col justify-between gap-3">
                        <div>
                          <div className="mb-3 flex items-center gap-2">
                            <span
                              className={`select-none rounded-xl border px-3 py-2 text-[10px] uppercase tracking-[0.2em] ${
                                isMediaReorderDisabled
                                  ? "cursor-not-allowed border-white/5 bg-white/[0.03] text-neutral-600"
                                  : "cursor-grab border-white/10 bg-white/5 text-neutral-400"
                              }`}
                            >
                              Drag
                            </span>
                          </div>
                          <p className="font-medium">{item.title || "Sin titulo"}</p>
                          <p className="text-sm text-neutral-400 break-all line-clamp-2">
                            {item.src}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEditingMedia(item)}
                            className="px-3 py-1 rounded-full border border-white/15"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveMedia(item.id)}
                            disabled={saving}
                            className="px-3 py-1 rounded-full border border-red-400/30 text-red-200 disabled:opacity-60"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredMediaItems.length === 0 && selectedMediaItems.length > 0 ? (
              <p className="text-center text-neutral-400">No hay resultados con ese filtro.</p>
            ) : null}

            {filteredMediaItems.length > 0 && totalMediaPages > 1 ? (
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {mediaVisiblePages.map((pageNumber, index) => {
                  const previousPage = mediaVisiblePages[index - 1];
                  const showDivider = previousPage && pageNumber - previousPage > 1;

                  return (
                    <div key={pageNumber} className="contents">
                      {showDivider ? <span className="text-neutral-500">...</span> : null}
                      <button
                        type="button"
                        onClick={() => setMediaPage(pageNumber)}
                        className={`min-w-10 rounded-full px-4 py-2 text-sm ${
                          mediaPage === pageNumber
                            ? "bg-white text-neutral-950 font-semibold"
                            : "border border-white/10 bg-white/5 text-white"
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
          </div>
        </div>

        <div
          id="paquetes"
          className="scroll-mt-32 rounded-[2rem] border border-white/10 bg-white/5 p-6"
        >
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8">
            <form
              onSubmit={handlePackageSubmit}
              className="bg-black/10 border border-white/10 rounded-3xl p-6 space-y-4"
            >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold">Paquetes</h2>
              {editingPackageId ? (
                <button
                  type="button"
                  onClick={resetPackageForm}
                  className="px-4 py-2 rounded-full border border-white/20 text-white"
                >
                  Nuevo paquete
                </button>
              ) : null}
            </div>
            <label className="block">
              <span className="text-sm text-neutral-300">Titulo</span>
              <input
                value={packageForm.title}
                onChange={(event) =>
                  setPackageForm((current) => ({ ...current, title: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                placeholder="pack premium"
              />
            </label>
            <label className="block">
              <span className="text-sm text-neutral-300">Tema visual</span>
              <select
                value={packageForm.theme}
                onChange={(event) =>
                  setPackageForm((current) => ({ ...current, theme: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
              >
                {packageThemes.map((theme) => (
                  <option key={theme.value} value={theme.value}>
                    {theme.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={packageForm.isFeatured}
                onChange={(event) =>
                  setPackageForm((current) => ({ ...current, isFeatured: event.target.checked }))
                }
              />
              <span className="text-sm text-neutral-300">Destacar paquete</span>
            </label>
            <label className="block">
              <span className="text-sm text-neutral-300">Beneficios, uno por linea</span>
              <textarea
                value={packageForm.featuresText}
                onChange={(event) =>
                  setPackageForm((current) => ({ ...current, featuresText: event.target.value }))
                }
                className="mt-2 w-full min-h-36 rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                placeholder={"10 fotos editadas\nSesion de 4 horas\nEntrega en 5 dias"}
              />
            </label>
            <label className="block">
              <span className="text-sm text-neutral-300">Precio individual</span>
              <input
                value={packageForm.priceIndividual}
                onChange={(event) =>
                  setPackageForm((current) => ({ ...current, priceIndividual: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
              />
            </label>
            <label className="block">
              <span className="text-sm text-neutral-300">Precio plan mensual</span>
              <input
                value={packageForm.pricePlan}
                onChange={(event) =>
                  setPackageForm((current) => ({ ...current, pricePlan: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
              />
            </label>
            <label className="block">
              <span className="text-sm text-neutral-300">Etiqueta del plan mensual</span>
              <input
                value={packageForm.pricePlanLabel}
                onChange={(event) =>
                  setPackageForm((current) => ({ ...current, pricePlanLabel: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                placeholder="Precio plan mensual"
              />
            </label>
            <label className="block">
              <span className="text-sm text-neutral-300">Descripcion del plan mensual</span>
              <textarea
                value={packageForm.pricePlanNote}
                onChange={(event) =>
                  setPackageForm((current) => ({ ...current, pricePlanNote: event.target.value }))
                }
                className="mt-2 w-full min-h-28 rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                placeholder="Ideal para marcas que quieren mantener una imagen constante y profesional."
              />
            </label>
            <label className="block">
              <span className="text-sm text-neutral-300">Texto del boton</span>
              <input
                value={packageForm.buttonText}
                onChange={(event) =>
                  setPackageForm((current) => ({ ...current, buttonText: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-3 rounded-full bg-amber-300 text-neutral-950 font-semibold disabled:opacity-60"
            >
              {editingPackageId ? "Actualizar paquete" : "Guardar paquete"}
            </button>
            </form>

            <div className="bg-black/10 border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Lista de paquetes</h2>
                <p className="mt-1 text-sm text-neutral-400">
                  Arrastra y suelta para cambiar el orden.
                </p>
              </div>
              <span className="text-sm text-neutral-400">{packages.length} total</span>
            </div>
            {!packages.length ? (
              <p className="text-neutral-400">Todavia no hay paquetes cargados.</p>
            ) : null}
            <div className="grid gap-3">
              {packages.map((item) => (
                <div
                  key={item.id}
                  draggable={!saving}
                  onDragStart={() => handlePackageDragStart(item.id)}
                  onDragEnter={() => handlePackageDragEnter(item.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handlePackageDrop(item.id)}
                  onDragEnd={handlePackageDragEnd}
                  className={`rounded-2xl border bg-black/10 p-4 transition ${
                    draggedPackageId === item.id ? "opacity-50" : ""
                  } ${
                    dragOverPackageId === item.id && draggedPackageId !== item.id
                      ? "border-sky-300 bg-sky-400/10"
                      : "border-white/10"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="cursor-grab select-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                        Drag
                      </span>
                      <div>
                      <p className="font-medium capitalize">{item.title}</p>
                      <p className="text-sm text-neutral-400">
                        {item.theme} · {item.isFeatured ? "destacado" : "normal"}
                      </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEditingPackage(item)}
                        className="px-3 py-1 rounded-full border border-white/15"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePackage(item.id)}
                        disabled={saving}
                        className="px-3 py-1 rounded-full border border-red-400/30 text-red-200 disabled:opacity-60"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <form
            id="home"
            onSubmit={handleHomeSubmit}
            className="scroll-mt-32 bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6"
          >
            <div>
              <h2 className="text-2xl font-semibold">Home del sitio</h2>
              <p className="mt-2 text-sm text-neutral-400">
                Aqui puedes cambiar el visual principal de agenda y la imagen de captura de
                momentos inolvidables.
              </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-black/10 p-5 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                    Hero inicial
                  </p>
                  <h3 className="mt-2 text-xl font-semibold">Agenda tu contenido</h3>
                </div>

                <label className="block">
                  <span className="text-sm text-neutral-300">Titulo</span>
                  <input
                    value={homeForm.heroTitle}
                    onChange={(event) =>
                      setHomeForm((current) => ({ ...current, heroTitle: event.target.value }))
                    }
                    className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm text-neutral-300">Texto del boton</span>
                    <input
                      value={homeForm.heroCtaLabel}
                      onChange={(event) =>
                        setHomeForm((current) => ({ ...current, heroCtaLabel: event.target.value }))
                      }
                      className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-neutral-300">Link del boton</span>
                    <input
                      value={homeForm.heroCtaHref}
                      onChange={(event) =>
                        setHomeForm((current) => ({ ...current, heroCtaHref: event.target.value }))
                      }
                      className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                      placeholder="/contacto"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm text-neutral-300">Texto del segundo boton</span>
                    <input
                      value={homeForm.heroSecondaryCtaLabel}
                      onChange={(event) =>
                        setHomeForm((current) => ({
                          ...current,
                          heroSecondaryCtaLabel: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                      placeholder="Ver categorias"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-neutral-300">Link del segundo boton</span>
                    <input
                      value={homeForm.heroSecondaryCtaHref}
                      onChange={(event) =>
                        setHomeForm((current) => ({
                          ...current,
                          heroSecondaryCtaHref: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                      placeholder="/categories"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm text-neutral-300">Formato del fondo</span>
                  <select
                    value={homeForm.heroMediaType}
                    onChange={(event) => {
                      setHomeForm((current) => ({
                        ...current,
                        heroMediaType: event.target.value,
                      }));
                      resetHomeFileInputs();
                    }}
                    className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                  >
                    <option value="sequence">Secuencia de imagenes</option>
                    <option value="image">Una sola imagen</option>
                    <option value="video">Video</option>
                  </select>
                </label>

                {homeForm.heroMediaType === "image" ? (
                  <>
                    <label className="block">
                      <span className="text-sm text-neutral-300">Imagen por URL</span>
                      <input
                        value={homeForm.heroImage}
                        onChange={(event) =>
                          setHomeForm((current) => ({ ...current, heroImage: event.target.value }))
                        }
                        className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                        placeholder="https://... o /images/..."
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm text-neutral-300">Imagen por archivo</span>
                      <input
                        ref={heroImageFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const selectedFile = event.target.files?.[0] || null;
                          const isValid = handleValidatedSingleFile({
                            file: selectedFile,
                            type: "image",
                            setter: setHeroImageFile,
                          });

                          if (!isValid) {
                            resetInputRef(heroImageFileInputRef);
                          }
                        }}
                        className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                      />
                      <p className="mt-2 text-xs text-neutral-500">
                        {heroImageFile
                          ? `Archivo seleccionado: ${heroImageFile.name}`
                          : "Ningun archivo seleccionado"}
                      </p>
                      <p className="mt-1 text-xs text-neutral-600">
                        Maximo recomendado: {MAX_IMAGE_UPLOAD_MB} MB.
                      </p>
                    </label>
                  </>
                ) : null}

                {homeForm.heroMediaType === "sequence" ? (
                  <>
                    <label className="block">
                      <span className="text-sm text-neutral-300">
                        URLs de imagenes, una por linea
                      </span>
                      <textarea
                        value={homeForm.heroImagesText}
                        onChange={(event) =>
                          setHomeForm((current) => ({
                            ...current,
                            heroImagesText: event.target.value,
                          }))
                        }
                        className="mt-2 w-full min-h-36 rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                        placeholder={"/images/hero-1.webp\n/images/hero-2.webp"}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm text-neutral-300">
                        Subir varias imagenes
                      </span>
                      <input
                        ref={heroSequenceFileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(event) => {
                          const selectedFiles = Array.from(event.target.files || []);
                          const isValid = handleValidatedMultiFile({
                            files: selectedFiles,
                            type: "image",
                            setter: setHeroSequenceFiles,
                          });

                          if (!isValid) {
                            resetInputRef(heroSequenceFileInputRef);
                          }
                        }}
                        className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                      />
                      <p className="mt-2 text-xs text-neutral-500">
                        {formatSelectedFiles(heroSequenceFiles)}
                      </p>
                      <p className="mt-1 text-xs text-neutral-600">
                        Maximo recomendado por imagen: {MAX_IMAGE_UPLOAD_MB} MB.
                      </p>
                    </label>
                  </>
                ) : null}

                {homeForm.heroMediaType === "video" ? (
                  <>
                    <label className="block">
                      <span className="text-sm text-neutral-300">Video por URL</span>
                      <input
                        value={homeForm.heroVideo}
                        onChange={(event) =>
                          setHomeForm((current) => ({ ...current, heroVideo: event.target.value }))
                        }
                        className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                        placeholder="https://... o /videos/..."
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm text-neutral-300">Video por archivo</span>
                      <input
                        ref={heroVideoFileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={(event) => {
                          const selectedFile = event.target.files?.[0] || null;
                          const isValid = handleValidatedSingleFile({
                            file: selectedFile,
                            type: "video",
                            setter: setHeroVideoFile,
                          });

                          if (!isValid) {
                            resetInputRef(heroVideoFileInputRef);
                          }
                        }}
                        className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                      />
                      <p className="mt-2 text-xs text-neutral-500">
                        {heroVideoFile
                          ? `Archivo seleccionado: ${heroVideoFile.name}`
                          : "Ningun archivo seleccionado"}
                      </p>
                      <p className="mt-1 text-xs text-neutral-600">
                        Maximo recomendado: {MAX_VIDEO_UPLOAD_MB} MB.
                      </p>
                    </label>
                  </>
                ) : null}

                <p className="text-xs leading-6 text-neutral-500">
                  Si estas en modo local, usa URLs para que el cambio se mantenga. Las subidas de
                  archivos quedan pensadas para Supabase.
                </p>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border border-white/10 bg-black/10 p-5 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                      Seccion categorias
                    </p>
                    <h3 className="mt-2 text-xl font-semibold">Titulo del carrusel</h3>
                  </div>

                  <label className="block">
                    <span className="text-sm text-neutral-300">Titulo principal</span>
                    <textarea
                      value={homeForm.categoriesTitle}
                      onChange={(event) =>
                        setHomeForm((current) => ({
                          ...current,
                          categoriesTitle: event.target.value,
                        }))
                      }
                      className="mt-2 w-full min-h-28 rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                      placeholder="Explora el trabajo por linea visual"
                    />
                  </label>

                  <p className="text-xs leading-6 text-neutral-500">
                    Este texto aparece arriba del carrusel de categorias en el home.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/10 p-5 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                      Marcas trabajadas
                    </p>
                    <h3 className="mt-2 text-xl font-semibold">Bloque de logos</h3>
                  </div>

                  <label className="block">
                    <span className="text-sm text-neutral-300">Titulo</span>
                    <input
                      value={homeForm.brandLogosTitle}
                      onChange={(event) =>
                        setHomeForm((current) => ({
                          ...current,
                          brandLogosTitle: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm text-neutral-300">Descripcion</span>
                    <textarea
                      value={homeForm.brandLogosIntro}
                      onChange={(event) =>
                        setHomeForm((current) => ({
                          ...current,
                          brandLogosIntro: event.target.value,
                        }))
                      }
                      className="mt-2 w-full min-h-28 rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm text-neutral-300">
                      URLs de logos, uno por linea
                    </span>
                    <textarea
                      value={homeForm.brandLogosText}
                      onChange={(event) =>
                        setHomeForm((current) => ({
                          ...current,
                          brandLogosText: event.target.value,
                        }))
                      }
                      className="mt-2 w-full min-h-32 rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                      placeholder={"https://.../logo-1.png\nhttps://.../logo-2.png"}
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm text-neutral-300">Subir logos por archivo</span>
                    <input
                      ref={brandLogoFileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) => {
                        const selectedFiles = Array.from(event.target.files || []);
                        const isValid = handleValidatedMultiFile({
                          files: selectedFiles,
                          type: "image",
                          setter: setBrandLogoFiles,
                        });

                        if (!isValid) {
                          resetInputRef(brandLogoFileInputRef);
                        }
                      }}
                      className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                    />
                    <p className="mt-2 text-xs text-neutral-500">
                      {formatSelectedFiles(brandLogoFiles)}
                    </p>
                    <p className="mt-1 text-xs text-neutral-600">
                      Maximo recomendado por logo: {MAX_IMAGE_UPLOAD_MB} MB.
                    </p>
                  </label>

                  <p className="text-xs leading-6 text-neutral-500">
                    Usa logos claros y horizontales para que la galeria se vea limpia y uniforme.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/10 p-5 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                      Bloque parallax
                    </p>
                    <h3 className="mt-2 text-xl font-semibold">Captura momentos inolvidables</h3>
                  </div>

                  <label className="block">
                    <span className="text-sm text-neutral-300">Titulo</span>
                    <input
                      value={homeForm.parallaxTitle}
                      onChange={(event) =>
                        setHomeForm((current) => ({
                          ...current,
                          parallaxTitle: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm text-neutral-300">Descripcion</span>
                    <textarea
                      value={homeForm.parallaxIntro}
                      onChange={(event) =>
                        setHomeForm((current) => ({
                          ...current,
                          parallaxIntro: event.target.value,
                        }))
                      }
                      className="mt-2 w-full min-h-32 rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="text-sm text-neutral-300">Texto del boton</span>
                      <input
                        value={homeForm.parallaxCtaLabel}
                        onChange={(event) =>
                          setHomeForm((current) => ({
                            ...current,
                            parallaxCtaLabel: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm text-neutral-300">Link del boton</span>
                      <input
                        value={homeForm.parallaxCtaHref}
                        onChange={(event) =>
                          setHomeForm((current) => ({
                            ...current,
                            parallaxCtaHref: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-sm text-neutral-300">Imagen por URL</span>
                    <input
                      value={homeForm.parallaxImage}
                      onChange={(event) =>
                        setHomeForm((current) => ({
                          ...current,
                          parallaxImage: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                      placeholder="https://... o /images/..."
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm text-neutral-300">Imagen por archivo</span>
                    <input
                      ref={parallaxImageFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const selectedFile = event.target.files?.[0] || null;
                        const isValid = handleValidatedSingleFile({
                          file: selectedFile,
                          type: "image",
                          setter: setParallaxImageFile,
                        });

                        if (!isValid) {
                          resetInputRef(parallaxImageFileInputRef);
                        }
                      }}
                      className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                    />
                    <p className="mt-2 text-xs text-neutral-500">
                      {parallaxImageFile
                        ? `Archivo seleccionado: ${parallaxImageFile.name}`
                        : "Ningun archivo seleccionado"}
                    </p>
                  <p className="mt-1 text-xs text-neutral-600">
                      Maximo recomendado: {MAX_IMAGE_UPLOAD_MB} MB.
                    </p>
                  </label>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/10 p-5 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                      CTA final
                    </p>
                    <h3 className="mt-2 text-xl font-semibold">Arma tu paquete conmigo</h3>
                  </div>

                  <label className="block">
                    <span className="text-sm text-neutral-300">Titulo</span>
                    <input
                      value={homeForm.packageCtaTitle}
                      onChange={(event) =>
                        setHomeForm((current) => ({
                          ...current,
                          packageCtaTitle: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm text-neutral-300">Descripcion</span>
                    <textarea
                      value={homeForm.packageCtaIntro}
                      onChange={(event) =>
                        setHomeForm((current) => ({
                          ...current,
                          packageCtaIntro: event.target.value,
                        }))
                      }
                      className="mt-2 w-full min-h-32 rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="text-sm text-neutral-300">Texto del boton</span>
                      <input
                        value={homeForm.packageCtaLabel}
                        onChange={(event) =>
                          setHomeForm((current) => ({
                            ...current,
                            packageCtaLabel: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm text-neutral-300">Link del boton</span>
                      <input
                        value={homeForm.packageCtaHref}
                        onChange={(event) =>
                          setHomeForm((current) => ({
                            ...current,
                            packageCtaHref: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                        placeholder="/contacto"
                      />
                    </label>
                  </div>

                  <p className="text-xs leading-6 text-neutral-500">
                    Este bloque se muestra al final del home para cerrar la pagina con una llamada
                    a la accion clara.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-3 rounded-full bg-amber-300 text-neutral-950 font-semibold disabled:opacity-60"
            >
              {uploadProgress?.active
                ? `Subiendo video... ${uploadButtonLabel}`
                : saving
                  ? "Guardando..."
                  : "Guardar home"}
            </button>
          </form>

          <form
            id="contacto-admin"
            onSubmit={handleContactSubmit}
            className="scroll-mt-32 bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4"
          >
            <h2 className="text-2xl font-semibold">Contacto del sitio</h2>
            <label className="block">
              <span className="text-sm text-neutral-300">Titulo</span>
              <input
                value={contactForm.title}
                onChange={(event) =>
                  setContactForm((current) => ({ ...current, title: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
              />
            </label>
            <label className="block">
              <span className="text-sm text-neutral-300">Descripcion</span>
              <textarea
                value={contactForm.intro}
                onChange={(event) =>
                  setContactForm((current) => ({ ...current, intro: event.target.value }))
                }
                className="mt-2 w-full min-h-28 rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
              />
            </label>
            <label className="block">
              <span className="text-sm text-neutral-300">Foto de contacto por URL</span>
              <input
                value={contactForm.photoUrl}
                onChange={(event) =>
                  setContactForm((current) => ({ ...current, photoUrl: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                placeholder="https://... o /images/..."
              />
            </label>
            <label className="block">
              <span className="text-sm text-neutral-300">Foto de contacto por archivo</span>
              <input
                ref={contactPhotoFileInputRef}
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0] || null;
                  const isValid = handleValidatedSingleFile({
                    file: selectedFile,
                    type: "image",
                    setter: setContactPhotoFile,
                  });

                  if (!isValid) {
                    resetInputRef(contactPhotoFileInputRef);
                  }
                }}
                className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
              />
              <p className="mt-2 text-xs text-neutral-500">
                {contactPhotoFile
                  ? `Archivo seleccionado: ${contactPhotoFile.name}`
                  : "Ningun archivo seleccionado"}
              </p>
              <p className="mt-1 text-xs text-neutral-600">
                Maximo recomendado: {MAX_IMAGE_UPLOAD_MB} MB.
              </p>
            </label>
            <label className="block">
              <span className="text-sm text-neutral-300">Correo</span>
              <input
                value={contactForm.email}
                onChange={(event) =>
                  setContactForm((current) => ({ ...current, email: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
              />
            </label>
            <label className="block">
              <span className="text-sm text-neutral-300">Telefono</span>
              <input
                value={contactForm.phone}
                onChange={(event) =>
                  setContactForm((current) => ({ ...current, phone: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
              />
            </label>
            <label className="block">
              <span className="text-sm text-neutral-300">WhatsApp URL</span>
              <input
                value={contactForm.whatsapp}
                onChange={(event) =>
                  setContactForm((current) => ({ ...current, whatsapp: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
              />
            </label>
            <label className="block">
              <span className="text-sm text-neutral-300">Instagram URL</span>
              <input
                value={contactForm.instagram}
                onChange={(event) =>
                  setContactForm((current) => ({ ...current, instagram: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
              />
            </label>
            <label className="block">
              <span className="text-sm text-neutral-300">Facebook URL</span>
              <input
                value={contactForm.facebook}
                onChange={(event) =>
                  setContactForm((current) => ({ ...current, facebook: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
              />
            </label>
            <label className="block">
              <span className="text-sm text-neutral-300">Texto del boton</span>
              <input
                value={contactForm.ctaLabel}
                onChange={(event) =>
                  setContactForm((current) => ({ ...current, ctaLabel: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-3 rounded-full bg-amber-300 text-neutral-950 font-semibold disabled:opacity-60"
            >
              Guardar contacto
            </button>
          </form>

          <div
            id="preview-contacto"
            className="scroll-mt-32 bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Vista rapida</h2>
                <p className="text-sm text-neutral-400">
                  Replica la estructura general del modulo publico de contacto.
                </p>
              </div>
              <span className="w-fit rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-neutral-400">
                Preview estructural
              </span>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]">
              <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:24px_24px]" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.12),transparent_34%)]" />
              <div className="pointer-events-none absolute inset-y-8 left-1/2 hidden w-px -translate-x-1/2 bg-white/10 xl:block" />

              <div className="relative grid gap-0 xl:grid-cols-2">
                <div className="min-w-0 p-6 md:p-8 xl:p-10">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-amber-100/75">
                    Tarjeta de Contacto
                  </p>

                  <div className="mt-5 flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                      <img src="/FaVisual.svg" alt="FaVisual Logo" className="h-7 w-7" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">FaVisual</p>
                      <p className="mt-1 text-sm text-neutral-300">
                        Visual studio and branded content
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="h-16 w-16 shrink-0 rounded-full border border-white/15 bg-white/5 p-1 shadow-[0_16px_36px_rgba(0,0,0,0.28)]">
                      <img
                        src={contactForm.photoUrl || "/FaVisual.svg"}
                        alt={contactForm.title || "Contacto"}
                        className="h-full w-full rounded-full object-cover"
                      />
                    </div>
                    <h3 className="text-3xl font-semibold leading-tight text-white">
                      {contactForm.title || "Contacto"}
                    </h3>
                  </div>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-300">
                    {contactForm.intro || "Agrega una descripcion para esta seccion."}
                  </p>

                  <div className="mt-8 flex flex-wrap gap-3">
                    {contactForm.whatsapp ? (
                      <span className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white">
                        <FaWhatsapp className="text-emerald-300" />
                        WhatsApp
                      </span>
                    ) : null}
                    {contactForm.instagram ? (
                      <span className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white">
                        <FaInstagram className="text-pink-300" />
                        Instagram
                      </span>
                    ) : null}
                    {contactForm.facebook ? (
                      <span className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white">
                        <FaFacebookF className="text-sky-300" />
                        Facebook
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-8 inline-flex max-w-full items-center gap-3 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs text-neutral-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.75)]" />
                    Disponible para nuevos proyectos
                  </div>
                </div>

                <div className="min-w-0 p-6 md:p-8 xl:p-10">
                  <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5 md:p-6">
                    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.28em] text-neutral-500">
                          Informacion Directa
                        </p>
                        <p className="mt-2 text-xl font-semibold text-white">Canales principales</p>
                      </div>
                      <span className="w-fit rounded-full border border-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                        Corporate Card
                      </span>
                    </div>

                    <div className="grid gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-neutral-300">
                        <p className="flex items-center gap-3">
                          <FaEnvelope className="text-neutral-400" />
                          <span className="font-medium text-white">Correo</span>
                        </p>
                        <p className="mt-2 break-all text-neutral-400">{contactForm.email || "-"}</p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-neutral-300">
                        <p className="flex items-center gap-3">
                          <FaPhoneAlt className="text-neutral-400" />
                          <span className="font-medium text-white">Telefono</span>
                        </p>
                        <p className="mt-2 break-words text-neutral-400">{contactForm.phone || "-"}</p>
                      </div>

                      {contactForm.instagram ? (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-neutral-300">
                          <p className="flex items-center gap-3">
                            <FaInstagram className="text-neutral-400" />
                            <span className="font-medium text-white">Instagram</span>
                          </p>
                          <p className="mt-2 break-all text-neutral-400">{contactForm.instagram}</p>
                        </div>
                      ) : null}

                      {contactForm.facebook ? (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-neutral-300">
                          <p className="flex items-center gap-3">
                            <FaFacebookF className="text-neutral-400" />
                            <span className="font-medium text-white">Facebook</span>
                          </p>
                          <p className="mt-2 break-all text-neutral-400">{contactForm.facebook}</p>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-6 rounded-[1.5rem] border border-amber-300/20 bg-[linear-gradient(135deg,rgba(251,191,36,0.18),rgba(249,115,22,0.12))] p-4 shadow-[0_18px_40px_rgba(249,115,22,0.12)]">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-neutral-950 shadow-lg">
                            <FaWhatsapp className="text-xl" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] uppercase tracking-[0.28em] text-amber-100/80">
                              CTA Principal
                            </p>
                            <p className="mt-1 break-words text-base font-semibold text-white">
                              {contactForm.ctaLabel || "Escribenos por WhatsApp"}
                            </p>
                          </div>
                        </div>
                        <span className="w-full rounded-full border border-white/15 px-4 py-2 text-center text-[11px] uppercase tracking-[0.18em] text-white/80 sm:w-fit">
                          Abrir
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-[11px] uppercase tracking-[0.28em] text-neutral-500">
                        Nota
                      </p>
                      <p className="mt-3 text-sm leading-7 text-neutral-300">
                        Si ya tienes una idea, referencias o un paquete en mente, puedes
                        escribir directo por WhatsApp y continuar la conversacion desde ahi.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
      {message ? (
        <div className="pointer-events-none fixed bottom-6 right-6 z-50 max-w-sm">
          <div
            className={`rounded-2xl border px-5 py-4 shadow-2xl backdrop-blur-xl ${
              messageType === "error"
                ? "border-red-400/40 bg-red-500/90 text-white"
                : "border-emerald-300/40 bg-emerald-500/90 text-neutral-950"
            }`}
          >
            <p className="text-xs uppercase tracking-[0.24em]">
              {messageType === "error" ? "Error" : "Guardado"}
            </p>
            <p className="mt-2 text-sm font-medium">{message}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
