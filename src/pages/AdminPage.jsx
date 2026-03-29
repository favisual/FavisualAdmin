import { useEffect, useMemo, useState } from "react";
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
  priceUnico: "",
  buttonText: "Comencemos",
};

const emptyContactForm = {
  title: "",
  intro: "",
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
  heroMediaType: "sequence",
  heroImage: "",
  heroImagesText: "",
  heroVideo: "",
  parallaxTitle: "",
  parallaxIntro: "",
  parallaxCtaLabel: "Reserva tu sesion",
  parallaxCtaHref: "/contacto",
  parallaxImage: "",
};

const ADMIN_MEDIA_ITEMS_PER_PAGE = 6;
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

export default function AdminPage() {
  const { user, signOut } = useAuth();
  const {
    categories,
    store,
    loading,
    saving,
    error,
    mode,
    packages,
    contact,
    homeSettings,
    createCategory,
    deleteCategory,
    createMediaItem,
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
  const [editingPackageId, setEditingPackageId] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [coverFile, setCoverFile] = useState(null);
  const [heroImageFile, setHeroImageFile] = useState(null);
  const [heroSequenceFiles, setHeroSequenceFiles] = useState([]);
  const [heroVideoFile, setHeroVideoFile] = useState(null);
  const [parallaxImageFile, setParallaxImageFile] = useState(null);
  const [signingOut, setSigningOut] = useState(false);
  const [mediaPage, setMediaPage] = useState(1);
  const [mediaSearch, setMediaSearch] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] = useState("all");

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
      heroMediaType: homeSettings?.hero?.mediaType || "sequence",
      heroImage: homeSettings?.hero?.image || "",
      heroImagesText: (homeSettings?.hero?.images || []).join("\n"),
      heroVideo: homeSettings?.hero?.video || "",
      parallaxTitle: homeSettings?.parallax?.title || "",
      parallaxIntro: homeSettings?.parallax?.intro || "",
      parallaxCtaLabel: homeSettings?.parallax?.ctaLabel || "Reserva tu sesion",
      parallaxCtaHref: homeSettings?.parallax?.ctaHref || "/contacto",
      parallaxImage: homeSettings?.parallax?.image || "",
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

  const handleCategorySubmit = async (event) => {
    event.preventDefault();

    const name = categoryForm.name.trim();
    const slug = categoryForm.slug.trim() || slugifyCategoryName(name);

    if (!name || !slug) {
      setNotice("La categoria necesita nombre y slug.", "error");
      return;
    }

    if (categories.some((category) => category.slug === slug)) {
      setNotice("Ya existe una categoria con ese slug.", "error");
      return;
    }

    try {
      const categoryId = await createCategory({
        name,
        slug,
        cover: categoryForm.cover.trim(),
        description: categoryForm.description.trim(),
        coverFile,
      });

      setSelectedCategoryId(categoryId);
      setCategoryForm(emptyCategoryForm);
      setCoverFile(null);
      setNotice(
        mode === "supabase" ? "Categoria guardada en Supabase." : "Categoria guardada en modo local."
      );
    } catch (submitError) {
      setNotice(submitError.message || "No se pudo guardar la categoria.", "error");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      await deleteCategory(categoryId);

      if (selectedCategoryId === categoryId) {
        const nextCategory = categories.find((category) => category.id !== categoryId);
        setSelectedCategoryId(nextCategory?.id || "");
      }

      setNotice("Categoria eliminada.");
    } catch (deleteError) {
      setNotice(deleteError.message || "No se pudo eliminar la categoria.", "error");
    }
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
      await createMediaItem({
        category: selectedCategory,
        type: mediaForm.type,
        src,
        thumbnail,
        title: mediaForm.title.trim(),
        mediaFile: mediaForm.mediaFile,
        thumbnailFile: mediaForm.thumbnailFile,
      });

      setMediaForm(emptyMediaForm);
      setNotice(
        mode === "supabase" ? "Elemento guardado en Supabase." : "Elemento guardado en modo local."
      );
    } catch (submitError) {
      setNotice(submitError.message || "No se pudo guardar el elemento.", "error");
    }
  };

  const moveMedia = async (index, direction) => {
    if (!selectedCategory) {
      return;
    }

    try {
      const nextItems = swapItems(selectedCategory.items, index, index + direction);
      await reorderMediaItems(selectedCategory.id, nextItems);
      setNotice("Orden actualizado.");
    } catch (moveError) {
      setNotice(moveError.message || "No se pudo reordenar.", "error");
    }
  };

  const handleRemoveMedia = async (mediaId) => {
    if (!selectedCategory) {
      return;
    }

    try {
      await removeMediaItem(selectedCategory.id, mediaId);
      setNotice("Elemento eliminado.");
    } catch (removeError) {
      setNotice(removeError.message || "No se pudo eliminar el elemento.", "error");
    }
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
      priceUnico: packageForm.priceUnico.trim(),
      buttonText: packageForm.buttonText.trim() || "Comencemos",
    };

    if (!payload.title) {
      setNotice("El paquete necesita titulo.", "error");
      return;
    }

    try {
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
      priceUnico: item.priceUnico,
      buttonText: item.buttonText || "Comencemos",
    });
  };

  const handleDeletePackage = async (packageId) => {
    try {
      await deletePackage(packageId);

      if (editingPackageId === packageId) {
        resetPackageForm();
      }

      setNotice("Paquete eliminado.");
    } catch (packageError) {
      setNotice(packageError.message || "No se pudo eliminar el paquete.", "error");
    }
  };

  const movePackage = async (index, direction) => {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= packages.length) {
      return;
    }

    try {
      await reorderPackages(swapItems(packages, index, nextIndex));
      setNotice("Orden de paquetes actualizado.");
    } catch (packageError) {
      setNotice(packageError.message || "No se pudo reordenar el paquete.", "error");
    }
  };

  const handleContactSubmit = async (event) => {
    event.preventDefault();

    try {
      await updateContact({
        title: contactForm.title.trim(),
        intro: contactForm.intro.trim(),
        email: contactForm.email.trim(),
        phone: contactForm.phone.trim(),
        whatsapp: contactForm.whatsapp.trim(),
        instagram: contactForm.instagram.trim(),
        facebook: contactForm.facebook.trim(),
        ctaLabel: contactForm.ctaLabel.trim() || "Escribenos",
        homeSettings,
      });
      setNotice("Contacto actualizado.");
    } catch (contactError) {
      setNotice(contactError.message || "No se pudo actualizar el contacto.", "error");
    }
  };

  const handleHomeSubmit = async (event) => {
    event.preventDefault();

    const heroImages = homeForm.heroImagesText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      await updateHomeSettings({
        hero: {
          title: homeForm.heroTitle.trim() || "Agenda tu sesion de contenido",
          ctaLabel: homeForm.heroCtaLabel.trim() || "Ahora",
          ctaHref: homeForm.heroCtaHref.trim() || "/contacto",
          mediaType: homeForm.heroMediaType,
          image: homeForm.heroImage.trim(),
          images: heroImages,
          video: homeForm.heroVideo.trim(),
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
        heroImageFile,
        heroSequenceFiles,
        heroVideoFile,
        parallaxImageFile,
      });

      setHeroImageFile(null);
      setHeroSequenceFiles([]);
      setHeroVideoFile(null);
      setParallaxImageFile(null);
      setNotice("Home actualizado.");
    } catch (homeError) {
      setNotice(homeError.message || "No se pudo actualizar el home.", "error");
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
        </div>

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
            <h2 className="text-2xl font-semibold">Nueva categoria</h2>
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
                type="file"
                accept="image/*"
                onChange={(event) => setCoverFile(event.target.files?.[0] || null)}
                className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
              />
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
              {saving ? "Guardando..." : "Guardar categoria"}
            </button>
            </form>

            <div className="bg-black/10 border border-white/10 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold">Categorias activas</h2>
                <span className="text-sm text-neutral-400">{categories.length} total</span>
              </div>
              <div className="grid gap-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={`rounded-2xl border p-4 ${
                      selectedCategory?.id === category.id
                        ? "border-amber-300 bg-white/10"
                        : "border-white/10 bg-black/10"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedCategoryId(category.id)}
                        className="text-left"
                      >
                        <p className="font-semibold">{category.name}</p>
                        <p className="text-sm text-neutral-400">/{category.slug}</p>
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
              <h2 className="text-2xl font-semibold">Agregar foto o video</h2>
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
                onChange={(event) =>
                  setMediaForm((current) => ({ ...current, type: event.target.value }))
                }
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
                type="file"
                accept={mediaForm.type === "video" ? "video/*" : "image/*"}
                onChange={(event) =>
                  setMediaForm((current) => ({
                    ...current,
                    mediaFile: event.target.files?.[0] || null,
                  }))
                }
                className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
              />
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
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setMediaForm((current) => ({
                    ...current,
                    thumbnailFile: event.target.files?.[0] || null,
                  }))
                }
                className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
              />
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
              {saving ? "Guardando..." : "Guardar elemento"}
            </button>
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
                  <p className="text-sm text-neutral-300">
                    {filteredMediaItems.length} resultado{filteredMediaItems.length === 1 ? "" : "s"} ·
                    pagina <span className="text-white font-medium"> {mediaPage} </span>
                    de <span className="text-white font-medium"> {totalMediaPages}</span>
                  </p>
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
              {paginatedMediaItems.map((item, index) => {
                const absoluteIndex = (mediaPage - 1) * ADMIN_MEDIA_ITEMS_PER_PAGE + index;
                const previewSrc =
                  item.type === "video"
                    ? item.thumbnail || selectedCategory?.cover || "/images/Otras.jpg"
                    : item.src;

                return (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-black/10 p-4">
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
                          <p className="font-medium">{item.title || "Sin titulo"}</p>
                          <p className="text-sm text-neutral-400 break-all line-clamp-2">
                            {item.src}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => moveMedia(absoluteIndex, -1)}
                            disabled={saving}
                            className="px-3 py-1 rounded-full border border-white/15 disabled:opacity-60"
                          >
                            Subir
                          </button>
                          <button
                            type="button"
                            onClick={() => moveMedia(absoluteIndex, 1)}
                            disabled={saving}
                            className="px-3 py-1 rounded-full border border-white/15 disabled:opacity-60"
                          >
                            Bajar
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
              <span className="text-sm text-neutral-300">Precio plan</span>
              <input
                value={packageForm.pricePlan}
                onChange={(event) =>
                  setPackageForm((current) => ({ ...current, pricePlan: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
              />
            </label>
            <label className="block">
              <span className="text-sm text-neutral-300">Precio unico</span>
              <input
                value={packageForm.priceUnico}
                onChange={(event) =>
                  setPackageForm((current) => ({ ...current, priceUnico: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
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
              <h2 className="text-2xl font-semibold">Lista de paquetes</h2>
              <span className="text-sm text-neutral-400">{packages.length} total</span>
            </div>
            {!packages.length ? (
              <p className="text-neutral-400">Todavia no hay paquetes cargados.</p>
            ) : null}
            <div className="grid gap-3">
              {packages.map((item, index) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium capitalize">{item.title}</p>
                      <p className="text-sm text-neutral-400">
                        {item.theme} · {item.isFeatured ? "destacado" : "normal"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => movePackage(index, -1)}
                        disabled={saving}
                        className="px-3 py-1 rounded-full border border-white/15 disabled:opacity-60"
                      >
                        Subir
                      </button>
                      <button
                        type="button"
                        onClick={() => movePackage(index, 1)}
                        disabled={saving}
                        className="px-3 py-1 rounded-full border border-white/15 disabled:opacity-60"
                      >
                        Bajar
                      </button>
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

                <label className="block">
                  <span className="text-sm text-neutral-300">Formato del fondo</span>
                  <select
                    value={homeForm.heroMediaType}
                    onChange={(event) =>
                      setHomeForm((current) => ({
                        ...current,
                        heroMediaType: event.target.value,
                      }))
                    }
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
                        type="file"
                        accept="image/*"
                        onChange={(event) => setHeroImageFile(event.target.files?.[0] || null)}
                        className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                      />
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
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(event) =>
                          setHeroSequenceFiles(Array.from(event.target.files || []))
                        }
                        className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                      />
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
                        type="file"
                        accept="video/*"
                        onChange={(event) => setHeroVideoFile(event.target.files?.[0] || null)}
                        className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                      />
                    </label>
                  </>
                ) : null}

                <p className="text-xs leading-6 text-neutral-500">
                  Si estas en modo local, usa URLs para que el cambio se mantenga. Las subidas de
                  archivos quedan pensadas para Supabase.
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
                    type="file"
                    accept="image/*"
                    onChange={(event) => setParallaxImageFile(event.target.files?.[0] || null)}
                    className="mt-2 w-full rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3"
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-3 rounded-full bg-amber-300 text-neutral-950 font-semibold disabled:opacity-60"
            >
              Guardar home
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

                  <h3 className="mt-8 text-3xl font-semibold leading-tight text-white">
                    {contactForm.title || "Contacto"}
                  </h3>
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
