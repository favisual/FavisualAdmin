import { useEffect, useState } from "react";

const STORAGE_KEY = "favisual.gallery.store";
const STORAGE_EVENT = "favisual-gallery-updated";

const defaultGalleryStore = {
  categories: [
    {
      id: "gastronomia",
      name: "Gastronomia",
      slug: "gastronomia",
      cover: "/images/Gastronomia01.jpg",
      description: "Fotografia y video para comida, producto y experiencias.",
      items: [
        { id: "g-1", type: "image", src: "/images/g-foto-1.webp", title: "Galeria 1" },
        { id: "g-2", type: "image", src: "/images/g-foto-2.webp", title: "Galeria 2" },
        { id: "g-3", type: "image", src: "/images/g-foto-3.webp", title: "Galeria 3" },
        { id: "g-4", type: "image", src: "/images/g-foto-4.webp", title: "Galeria 4" },
        { id: "g-5", type: "image", src: "/images/g-foto-5.webp", title: "Galeria 5" },
        { id: "g-6", type: "image", src: "/images/g-foto-6.webp", title: "Galeria 6" },
        { id: "g-7", type: "image", src: "/images/g-foto-7.webp", title: "Galeria 7" },
        { id: "g-8", type: "image", src: "/images/g-foto-8.webp", title: "Galeria 8" },
        {
          id: "g-video-1",
          type: "video",
          src: "/videos/video-4.mp4",
          thumbnail: "/images/video-4-thumb.webp",
          title: "Video 4",
        },
        {
          id: "g-video-2",
          type: "video",
          src: "/videos/video-7.mp4",
          thumbnail: "/images/video-7-thumb.webp",
          title: "Video 7",
        },
      ],
    },
    {
      id: "hosteleria",
      name: "Hosteleria",
      slug: "hosteleria",
      cover: "/images/Otras.jpg",
      description: "Categoria lista para cargar contenido nuevo.",
      items: [],
    },
    {
      id: "proyectos-especificos",
      name: "Proyectos Especificos",
      slug: "proyectos-especificos",
      cover: "/images/p-foto-1.webp",
      description: "Campanas, branding y producciones puntuales.",
      items: [
        { id: "p-1", type: "image", src: "/images/p-foto-1.webp", title: "Proyecto 1" },
        { id: "p-2", type: "image", src: "/images/p-foto-2.webp", title: "Proyecto 2" },
        { id: "p-3", type: "image", src: "/images/p-foto-3.webp", title: "Proyecto 3" },
        { id: "p-4", type: "image", src: "/images/p-foto-4.webp", title: "Proyecto 4" },
        { id: "p-5", type: "image", src: "/images/p-foto-5.webp", title: "Proyecto 5" },
      ],
    },
  ],
  packages: [
    {
      id: "pack-basico",
      title: "pack basico",
      theme: "cyan",
      isFeatured: false,
      features: [
        "10 fotos retocadas y editadas",
        "Sesion de hasta 4 horas",
        "Correccion de color y retoque basico",
        "Entrega en 5 dias habiles",
        "Ideal para pequenas colecciones o menus",
      ],
      priceIndividual: "COP 1.200.000",
      pricePlan: "COP 1.000.000",
      priceUnico: "COP 1.200.000",
      buttonText: "Comencemos",
    },
    {
      id: "pack-premium",
      title: "pack premium",
      theme: "violet",
      isFeatured: true,
      features: [
        "20 fotos profesionales",
        "Hasta 6 horas de sesion",
        "Retoque avanzado y edicion de color",
        "Entrega en 3 dias habiles",
        "Ideal para lanzamientos de marca",
      ],
      priceIndividual: "COP 2.000.000",
      pricePlan: "COP 1.800.000",
      priceUnico: "COP 2.000.000",
      buttonText: "Comencemos",
    },
    {
      id: "pack-personalizado",
      title: "pack personalizado",
      theme: "stone",
      isFeatured: false,
      features: [
        "Cantidad de fotos a eleccion",
        "Duracion de sesion segun necesidad",
        "Estilo de edicion adaptado al cliente",
        "Entrega flexible",
        "Ideal para proyectos unicos, productos especiales o branding",
      ],
      priceIndividual: "A convenir",
      pricePlan: "Descuento disponible segun volumen",
      priceUnico: "Cotizacion personalizada",
      buttonText: "Comencemos",
    },
  ],
  contact: {
    title: "Contacto",
    intro: "Hablemos de tu proyecto, tus paquetes o la produccion visual que necesitas.",
    email: "hola@favisual.com",
    phone: "+57 300 000 0000",
    whatsapp: "https://wa.me/573000000000",
    instagram: "https://instagram.com/favisual",
    facebook: "https://facebook.com/favisual",
    ctaLabel: "Escribenos",
  },
  homeSettings: {
    hero: {
      title: "Agenda tu sesion de contenido",
      ctaLabel: "Ahora",
      ctaHref: "/contacto",
      mediaType: "sequence",
      image: "/images/hero-bg01.webp",
      images: ["/images/hero-bg01.webp", "/images/hero-bg02.webp"],
      video: "",
    },
    parallax: {
      title: "Captura momentos inolvidables",
      intro: "Fotografia profesional para marcas, eventos y personas que buscan calidad.",
      ctaLabel: "Reserva tu sesion",
      ctaHref: "/contacto",
      image: "/parallax.jpg",
    },
  },
};

const fallbackClone = () => JSON.parse(JSON.stringify(defaultGalleryStore));

export function slugifyCategoryName(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeMediaItem(item, index) {
  const normalizedType = item.type === "video" ? "video" : "image";

  return {
    id: item.id || `media-${index + 1}`,
    type: normalizedType,
    src: item.src || "",
    thumbnail: item.thumbnail || "",
    title: item.title || "",
  };
}

function normalizePackage(item, index) {
  return {
    id: item.id || `package-${index + 1}`,
    title: item.title?.trim() || `pack ${index + 1}`,
    theme: item.theme || "cyan",
    isFeatured: Boolean(item.isFeatured),
    features: Array.isArray(item.features) ? item.features.filter(Boolean) : [],
    priceIndividual: item.priceIndividual || "",
    pricePlan: item.pricePlan || "",
    priceUnico: item.priceUnico || "",
    buttonText: item.buttonText || "Comencemos",
  };
}

function normalizeHomeSettings(homeSettings) {
  const defaults = fallbackClone().homeSettings;
  const hero = homeSettings?.hero || {};
  const parallax = homeSettings?.parallax || {};
  const normalizedImages = Array.isArray(hero.images)
    ? hero.images.map((item) => item?.trim()).filter(Boolean)
    : [];

  return {
    hero: {
      title: hero.title || defaults.hero.title,
      ctaLabel: hero.ctaLabel || defaults.hero.ctaLabel,
      ctaHref: hero.ctaHref || defaults.hero.ctaHref,
      mediaType: ["image", "sequence", "video"].includes(hero.mediaType)
        ? hero.mediaType
        : defaults.hero.mediaType,
      image: hero.image || defaults.hero.image,
      images: normalizedImages.length ? normalizedImages : defaults.hero.images,
      video: hero.video || "",
    },
    parallax: {
      title: parallax.title || defaults.parallax.title,
      intro: parallax.intro || defaults.parallax.intro,
      ctaLabel: parallax.ctaLabel || defaults.parallax.ctaLabel,
      ctaHref: parallax.ctaHref || defaults.parallax.ctaHref,
      image: parallax.image || defaults.parallax.image,
    },
  };
}

function normalizeCategory(category, index) {
  const fallbackName = category.name?.trim() || `Categoria ${index + 1}`;
  const slug = category.slug?.trim() || slugifyCategoryName(fallbackName);

  return {
    id: category.id || slug || `category-${index + 1}`,
    name: fallbackName,
    slug,
    cover: category.cover || "",
    description: category.description || "",
    items: Array.isArray(category.items)
      ? category.items.map((item, itemIndex) => normalizeMediaItem(item, itemIndex))
      : [],
  };
}

function normalizeStore(store) {
  if (!store || !Array.isArray(store.categories)) {
    return fallbackClone();
  }

  return {
    categories: store.categories.map((category, index) => normalizeCategory(category, index)),
    packages: Array.isArray(store.packages)
      ? store.packages.map((item, index) => normalizePackage(item, index))
      : fallbackClone().packages,
    contact: {
      ...fallbackClone().contact,
      ...(store.contact || {}),
    },
    homeSettings: normalizeHomeSettings(store.homeSettings),
  };
}

export function getDefaultGalleryStore() {
  return fallbackClone();
}

export function getGalleryStore() {
  if (typeof window === "undefined") {
    return fallbackClone();
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return fallbackClone();
  }

  try {
    return normalizeStore(JSON.parse(saved));
  } catch {
    return fallbackClone();
  }
}

export function saveGalleryStore(store) {
  if (typeof window === "undefined") {
    return normalizeStore(store);
  }

  const normalized = normalizeStore(store);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new Event(STORAGE_EVENT));
  return normalized;
}

export function resetGalleryStore() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }

  return fallbackClone();
}

export function useGalleryStore() {
  const [store, setStore] = useState(() => getGalleryStore());

  useEffect(() => {
    const syncStore = () => {
      setStore(getGalleryStore());
    };

    window.addEventListener("storage", syncStore);
    window.addEventListener(STORAGE_EVENT, syncStore);

    return () => {
      window.removeEventListener("storage", syncStore);
      window.removeEventListener(STORAGE_EVENT, syncStore);
    };
  }, []);

  return store;
}

export function findCategoryBySlug(categories, slug) {
  return categories.find((category) => category.slug === slug);
}
