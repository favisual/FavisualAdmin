import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as tus from "tus-js-client";
import {
  getDefaultGalleryStore,
  getGalleryStore,
  saveGalleryStore,
  slugifyCategoryName,
} from "../data/galleryStore";
import {
  isSupabaseConfigured,
  supabase,
  supabaseBucket,
  supabaseUrl,
} from "../lib/supabaseClient";

const GalleryContext = createContext(null);

function sortByOrder(items) {
  return [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

const CONTACT_SETTINGS_BASE_SELECT =
  "id, title, intro, email, phone, whatsapp, instagram, facebook, cta_label";
const CONTACT_SETTINGS_HOME_SELECT = [
  "hero_title",
  "hero_cta_label",
  "hero_cta_href",
  "hero_secondary_cta_label",
  "hero_secondary_cta_href",
  "hero_media_type",
  "hero_image_url",
  "hero_image_urls",
  "hero_video_url",
  "home_categories_title",
  "home_parallax_title",
  "home_parallax_intro",
  "home_parallax_cta_label",
  "home_parallax_cta_href",
  "home_parallax_image_url",
].join(", ");
const CONTACT_SETTINGS_NEW_HOME_FIELDS = [
  "hero_secondary_cta_label",
  "hero_secondary_cta_href",
  "home_categories_title",
];

function stripUnsupportedContactFields(fields) {
  const nextFields = { ...fields };
  CONTACT_SETTINGS_NEW_HOME_FIELDS.forEach((field) => {
    delete nextFields[field];
  });
  return nextFields;
}

function mapSupabaseStore(categoriesRows, mediaRows, packageRows, contactRow) {
  const defaultStore = getDefaultGalleryStore();
  const groupedMedia = mediaRows.reduce((acc, item) => {
    const categoryItems = acc.get(item.category_id) || [];
    categoryItems.push({
      id: item.id,
      type: item.type,
      src: item.src,
      thumbnail: item.thumbnail || "",
      title: item.title || "",
      sortOrder: item.sort_order ?? 0,
    });
    acc.set(item.category_id, categoryItems);
    return acc;
  }, new Map());

  return {
    categories: sortByOrder(categoriesRows).map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      cover: category.cover_url || "",
      description: category.description || "",
      sortOrder: category.sort_order ?? 0,
      items: sortByOrder(groupedMedia.get(category.id) || []),
    })),
    packages: sortByOrder(packageRows).map((item) => ({
      id: item.id,
      title: item.title,
      theme: item.theme || "cyan",
      isFeatured: Boolean(item.is_featured),
      features: item.features || [],
      priceIndividual: item.price_individual || "",
      pricePlan: item.price_plan || "",
      priceUnico: item.price_unico || "",
      buttonText: item.button_text || "Comencemos",
      sortOrder: item.sort_order ?? 0,
    })),
    contact: {
      title: contactRow?.title || "Contacto",
      intro: contactRow?.intro || "",
      email: contactRow?.email || "",
      phone: contactRow?.phone || "",
      whatsapp: contactRow?.whatsapp || "",
      instagram: contactRow?.instagram || "",
      facebook: contactRow?.facebook || "",
      ctaLabel: contactRow?.cta_label || "Escribenos",
    },
    homeSettings: {
      hero: {
        title: contactRow?.hero_title || defaultStore.homeSettings.hero.title,
        ctaLabel: contactRow?.hero_cta_label || defaultStore.homeSettings.hero.ctaLabel,
        ctaHref: contactRow?.hero_cta_href || defaultStore.homeSettings.hero.ctaHref,
        secondaryCtaLabel:
          contactRow?.hero_secondary_cta_label ||
          defaultStore.homeSettings.hero.secondaryCtaLabel,
        secondaryCtaHref:
          contactRow?.hero_secondary_cta_href || defaultStore.homeSettings.hero.secondaryCtaHref,
        mediaType: ["image", "sequence", "video"].includes(contactRow?.hero_media_type)
          ? contactRow.hero_media_type
          : defaultStore.homeSettings.hero.mediaType,
        image: contactRow?.hero_image_url || defaultStore.homeSettings.hero.image,
        images:
          Array.isArray(contactRow?.hero_image_urls) && contactRow.hero_image_urls.length
            ? contactRow.hero_image_urls.filter(Boolean)
            : defaultStore.homeSettings.hero.images,
        video: contactRow?.hero_video_url || "",
      },
      categories: {
        title: contactRow?.home_categories_title || defaultStore.homeSettings.categories.title,
      },
      parallax: {
        title: contactRow?.home_parallax_title || defaultStore.homeSettings.parallax.title,
        intro: contactRow?.home_parallax_intro || defaultStore.homeSettings.parallax.intro,
        ctaLabel:
          contactRow?.home_parallax_cta_label || defaultStore.homeSettings.parallax.ctaLabel,
        ctaHref:
          contactRow?.home_parallax_cta_href || defaultStore.homeSettings.parallax.ctaHref,
        image: contactRow?.home_parallax_image_url || defaultStore.homeSettings.parallax.image,
      },
    },
  };
}

async function fetchSupabaseStore() {
  const { data: categoriesRows, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name, slug, cover_url, description, sort_order")
    .order("sort_order", { ascending: true });

  if (categoriesError) {
    throw categoriesError;
  }

  const categoryIds = categoriesRows.map((category) => category.id);
  let mediaRows = [];

  if (categoryIds.length > 0) {
    const mediaResponse = await supabase
      .from("media_items")
      .select("id, category_id, type, src, thumbnail, title, sort_order")
      .in("category_id", categoryIds)
      .order("sort_order", { ascending: true });

    if (mediaResponse.error) {
      throw mediaResponse.error;
    }

    mediaRows = mediaResponse.data;
  }

  const { data: packageRows, error: packageError } = await supabase
    .from("packages")
    .select(
      "id, title, theme, is_featured, features, price_individual, price_plan, price_unico, button_text, sort_order"
    )
    .order("sort_order", { ascending: true });

  if (packageError) {
    throw packageError;
  }

  const { data: contactRow, error: contactError } = await supabase
    .from("contact_settings")
    .select(`${CONTACT_SETTINGS_BASE_SELECT}, ${CONTACT_SETTINGS_HOME_SELECT}`)
    .limit(1)
    .maybeSingle();

  if (contactError) {
    if (contactError.code === "42703") {
      const fallbackContactResponse = await supabase
        .from("contact_settings")
        .select(CONTACT_SETTINGS_BASE_SELECT)
        .limit(1)
        .maybeSingle();

      if (fallbackContactResponse.error) {
        throw fallbackContactResponse.error;
      }

      return mapSupabaseStore(
        categoriesRows,
        mediaRows,
        packageRows,
        fallbackContactResponse.data
      );
    }

    throw contactError;
  }

  return mapSupabaseStore(categoriesRows, mediaRows, packageRows, contactRow);
}

function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function getPublicUrl(filePath) {
  const { data } = supabase.storage.from(supabaseBucket).getPublicUrl(filePath);
  return data.publicUrl;
}

function getResumableUploadUrl() {
  if (!supabaseUrl) {
    throw new Error("Falta configurar la URL de Supabase.");
  }

  const parsedUrl = new URL(supabaseUrl);

  if (parsedUrl.hostname.endsWith(".supabase.co")) {
    parsedUrl.hostname = parsedUrl.hostname.replace(".supabase.co", ".storage.supabase.co");
  }

  parsedUrl.pathname = "/storage/v1/upload/resumable";
  parsedUrl.search = "";
  parsedUrl.hash = "";
  return parsedUrl.toString();
}

function getStoragePathFromPublicUrl(publicUrl) {
  if (!publicUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(publicUrl);
    const publicPrefix = `/storage/v1/object/public/${supabaseBucket}/`;
    const pathIndex = parsedUrl.pathname.indexOf(publicPrefix);

    if (pathIndex === -1) {
      return null;
    }

    const filePath = parsedUrl.pathname.slice(pathIndex + publicPrefix.length);
    return filePath ? decodeURIComponent(filePath) : null;
  } catch {
    return null;
  }
}

function getStoragePathsFromUrls(urls) {
  return [...new Set(urls.map((url) => getStoragePathFromPublicUrl(url)).filter(Boolean))];
}

async function removeFilesFromSupabase(urls) {
  const filePaths = getStoragePathsFromUrls(urls);

  if (!filePaths.length) {
    return;
  }

  const { error } = await supabase.storage.from(supabaseBucket).remove(filePaths);

  if (error) {
    throw error;
  }
}

async function uploadFileToSupabase(file, categorySlug, folder) {
  const cleanFileName = sanitizeFileName(file.name);
  const filePath = `${categorySlug}/${folder}/${Date.now()}-${cleanFileName}`;

  const { error } = await supabase.storage.from(supabaseBucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: true,
  });

  if (error) {
    throw error;
  }

  return getPublicUrl(filePath);
}

async function uploadVideoToSupabaseResumable(
  file,
  categorySlug,
  folder,
  accessToken,
  onProgress
) {
  const cleanFileName = sanitizeFileName(file.name);
  const filePath = `${categorySlug}/${folder}/${Date.now()}-${cleanFileName}`;
  const startedAt = Date.now();

  await new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: getResumableUploadUrl(),
      chunkSize: 6 * 1024 * 1024,
      retryDelays: [0, 1000, 3000, 5000],
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: supabaseBucket,
        objectName: filePath,
        contentType: file.type || "video/mp4",
        cacheControl: "3600",
      },
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-upsert": "true",
      },
      onError: (error) => reject(error),
      onProgress: (uploadedBytes, totalBytes) => {
        if (!totalBytes) {
          return;
        }

        const elapsedSeconds = Math.max((Date.now() - startedAt) / 1000, 0.001);
        const bytesPerSecond = uploadedBytes / elapsedSeconds;
        const remainingBytes = Math.max(totalBytes - uploadedBytes, 0);
        const remainingSeconds =
          bytesPerSecond > 0 ? Math.ceil(remainingBytes / bytesPerSecond) : null;

        onProgress?.({
          uploadedBytes,
          totalBytes,
          percentage: Math.round((uploadedBytes / totalBytes) * 100),
          bytesPerSecond,
          remainingSeconds,
        });
      },
      onSuccess: () => resolve(),
    });

    upload
      .findPreviousUploads()
      .then((previousUploads) => {
        if (previousUploads.length > 0) {
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }

        upload.start();
      })
      .catch(reject);
  });

  return getPublicUrl(filePath);
}

async function ensureAuthenticatedSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  if (!data.session) {
    throw new Error("Necesitas iniciar sesion para administrar contenido.");
  }

  return data.session;
}

export function GalleryProvider({ children }) {
  const emptyUploadProgress = {
    active: false,
    label: "",
    percentage: 0,
    uploadedBytes: 0,
    totalBytes: 0,
    bytesPerSecond: 0,
    remainingSeconds: null,
  };
  const [store, setStore] = useState(() =>
    isSupabaseConfigured
      ? {
          categories: [],
          packages: [],
          contact: getDefaultGalleryStore().contact,
          homeSettings: getDefaultGalleryStore().homeSettings,
        }
      : getGalleryStore()
  );
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState(isSupabaseConfigured ? "supabase" : "local");
  const [uploadProgress, setUploadProgress] = useState(emptyUploadProgress);

  const resetUploadProgress = () => {
    setUploadProgress(emptyUploadProgress);
  };

  const refreshStore = async () => {
    setLoading(true);
    setError("");

    try {
      if (isSupabaseConfigured) {
        const remoteStore = await fetchSupabaseStore();
        setStore(remoteStore);
        setMode("supabase");
      } else {
        setStore(getGalleryStore());
        setMode("local");
      }
    } catch (refreshError) {
      setError(refreshError.message || "No se pudo cargar la galeria.");

      if (mode !== "local") {
        const localStore = getGalleryStore();
        setStore(localStore.categories.length ? localStore : getDefaultGalleryStore());
        setMode("local");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStore();
  }, []);

  const persistLocalStore = async (nextStore) => {
    const savedStore = saveGalleryStore(nextStore);
    setStore(savedStore);
    setMode("local");
    return savedStore;
  };

  const createCategory = async ({ name, slug, cover, description, coverFile }) => {
    setSaving(true);
    setError("");

    try {
      const normalizedSlug = slug || slugifyCategoryName(name);

      if (!normalizedSlug) {
        throw new Error("La categoria necesita slug.");
      }

      if (mode === "supabase" && isSupabaseConfigured) {
        const session = await ensureAuthenticatedSession();
        let coverUrl = cover || "";

        if (coverFile) {
          coverUrl = await uploadFileToSupabase(coverFile, normalizedSlug, "covers");
        }

        const sortOrder = store.categories.length;
        const { data, error: insertError } = await supabase
          .from("categories")
          .insert({
            name,
            slug: normalizedSlug,
            cover_url: coverUrl,
            description,
            sort_order: sortOrder,
          })
          .select("id")
          .single();

        if (insertError) {
          throw insertError;
        }

        await refreshStore();
        return data.id;
      }

      const nextCategory = {
        id: normalizedSlug,
        name,
        slug: normalizedSlug,
        cover: cover || "",
        description: description || "",
        items: [],
      };

      await persistLocalStore({
        ...store,
        categories: [...store.categories, nextCategory],
      });

      return nextCategory.id;
    } finally {
      setSaving(false);
    }
  };

  const updateContact = async (payload) => {
    setSaving(true);
    setError("");

    try {
      const homeSettingsFields = payload.homeSettings
        ? {
            hero_title: payload.homeSettings.hero?.title,
            hero_cta_label: payload.homeSettings.hero?.ctaLabel,
            hero_cta_href: payload.homeSettings.hero?.ctaHref,
            hero_secondary_cta_label: payload.homeSettings.hero?.secondaryCtaLabel,
            hero_secondary_cta_href: payload.homeSettings.hero?.secondaryCtaHref,
            hero_media_type: payload.homeSettings.hero?.mediaType,
            hero_image_url: payload.homeSettings.hero?.image,
            hero_image_urls: payload.homeSettings.hero?.images,
            hero_video_url: payload.homeSettings.hero?.video,
            home_categories_title: payload.homeSettings.categories?.title,
            home_parallax_title: payload.homeSettings.parallax?.title,
            home_parallax_intro: payload.homeSettings.parallax?.intro,
            home_parallax_cta_label: payload.homeSettings.parallax?.ctaLabel,
            home_parallax_cta_href: payload.homeSettings.parallax?.ctaHref,
            home_parallax_image_url: payload.homeSettings.parallax?.image,
          }
        : {};

      if (mode === "supabase" && isSupabaseConfigured) {
        await ensureAuthenticatedSession();

        const { data: existing, error: existingError } = await supabase
          .from("contact_settings")
          .select("id")
          .limit(1)
          .maybeSingle();

        if (existingError) {
          throw existingError;
        }

        if (existing?.id) {
          const basePayload = {
            title: payload.title,
            intro: payload.intro,
            email: payload.email,
            phone: payload.phone,
            whatsapp: payload.whatsapp,
            instagram: payload.instagram,
            facebook: payload.facebook,
            cta_label: payload.ctaLabel,
            ...homeSettingsFields,
          };
          let { error: updateError } = await supabase
            .from("contact_settings")
            .update(basePayload)
            .eq("id", existing.id);

          if (updateError?.code === "42703") {
            const safeHomeSettingsFields = stripUnsupportedContactFields(homeSettingsFields);
            ({ error: updateError } = await supabase
              .from("contact_settings")
              .update({
                title: payload.title,
                intro: payload.intro,
                email: payload.email,
                phone: payload.phone,
                whatsapp: payload.whatsapp,
                instagram: payload.instagram,
                facebook: payload.facebook,
                cta_label: payload.ctaLabel,
                ...safeHomeSettingsFields,
              })
              .eq("id", existing.id));
          }

          if (updateError) {
            throw updateError;
          }
        } else {
          const basePayload = {
            title: payload.title,
            intro: payload.intro,
            email: payload.email,
            phone: payload.phone,
            whatsapp: payload.whatsapp,
            instagram: payload.instagram,
            facebook: payload.facebook,
            cta_label: payload.ctaLabel,
            ...homeSettingsFields,
          };
          let { error: insertError } = await supabase.from("contact_settings").insert(basePayload);

          if (insertError?.code === "42703") {
            const safeHomeSettingsFields = stripUnsupportedContactFields(homeSettingsFields);
            ({ error: insertError } = await supabase.from("contact_settings").insert({
              title: payload.title,
              intro: payload.intro,
              email: payload.email,
              phone: payload.phone,
              whatsapp: payload.whatsapp,
              instagram: payload.instagram,
              facebook: payload.facebook,
              cta_label: payload.ctaLabel,
              ...safeHomeSettingsFields,
            }));
          }

          if (insertError) {
            throw insertError;
          }
        }

        await refreshStore();
        return;
      }

      await persistLocalStore({
        ...store,
        contact: {
          title: payload.title,
          intro: payload.intro,
          email: payload.email,
          phone: payload.phone,
          whatsapp: payload.whatsapp,
          instagram: payload.instagram,
          facebook: payload.facebook,
          ctaLabel: payload.ctaLabel,
        },
      });
    } finally {
      setSaving(false);
    }
  };

  const createPackage = async (payload) => {
    setSaving(true);
    setError("");

    try {
      if (mode === "supabase" && isSupabaseConfigured) {
        await ensureAuthenticatedSession();
        const { error: insertError } = await supabase.from("packages").insert({
          title: payload.title,
          theme: payload.theme,
          is_featured: payload.isFeatured,
          features: payload.features,
          price_individual: payload.priceIndividual,
          price_plan: payload.pricePlan,
          price_unico: payload.priceUnico,
          button_text: payload.buttonText,
          sort_order: store.packages.length,
        });

        if (insertError) {
          throw insertError;
        }

        await refreshStore();
        return;
      }

      await persistLocalStore({
        ...store,
        packages: [...store.packages, { ...payload, id: `${payload.title}-${Date.now()}` }],
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePackage = async (packageId, payload) => {
    setSaving(true);
    setError("");

    try {
      if (mode === "supabase" && isSupabaseConfigured) {
        await ensureAuthenticatedSession();
        const { error: updateError } = await supabase
          .from("packages")
          .update({
            title: payload.title,
            theme: payload.theme,
            is_featured: payload.isFeatured,
            features: payload.features,
            price_individual: payload.priceIndividual,
            price_plan: payload.pricePlan,
            price_unico: payload.priceUnico,
            button_text: payload.buttonText,
          })
          .eq("id", packageId);

        if (updateError) {
          throw updateError;
        }

        await refreshStore();
        return;
      }

      await persistLocalStore({
        ...store,
        packages: store.packages.map((item) =>
          item.id === packageId ? { ...item, ...payload } : item
        ),
      });
    } finally {
      setSaving(false);
    }
  };

  const deletePackage = async (packageId) => {
    setSaving(true);
    setError("");

    try {
      if (mode === "supabase" && isSupabaseConfigured) {
        await ensureAuthenticatedSession();
        const { error: deleteError } = await supabase.from("packages").delete().eq("id", packageId);

        if (deleteError) {
          throw deleteError;
        }

        await refreshStore();
        return;
      }

      await persistLocalStore({
        ...store,
        packages: store.packages.filter((item) => item.id !== packageId),
      });
    } finally {
      setSaving(false);
    }
  };

  const reorderPackages = async (nextPackages) => {
    setSaving(true);
    setError("");

    try {
      if (mode === "supabase" && isSupabaseConfigured) {
        await ensureAuthenticatedSession();
        const updates = nextPackages.map((item, index) =>
          supabase.from("packages").update({ sort_order: index }).eq("id", item.id)
        );

        const results = await Promise.all(updates);
        const failedResult = results.find(({ error: updateError }) => updateError);

        if (failedResult?.error) {
          throw failedResult.error;
        }

        await refreshStore();
        return;
      }

      await persistLocalStore({
        ...store,
        packages: nextPackages,
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (categoryId) => {
    setSaving(true);
    setError("");

    try {
      if (mode === "supabase" && isSupabaseConfigured) {
        const session = await ensureAuthenticatedSession();
        const category = store.categories.find((item) => item.id === categoryId);
        const { error: mediaError } = await supabase
          .from("media_items")
          .delete()
          .eq("category_id", categoryId);

        if (mediaError) {
          throw mediaError;
        }

        const { error: categoryError } = await supabase
          .from("categories")
          .delete()
          .eq("id", categoryId);

        if (categoryError) {
          throw categoryError;
        }

        await removeFilesFromSupabase([
          category?.cover,
          ...(category?.items || []).flatMap((item) => [item.src, item.thumbnail]),
        ]);

        await refreshStore();
        return;
      }

      await persistLocalStore({
        ...store,
        categories: store.categories.filter((category) => category.id !== categoryId),
      });
    } finally {
      resetUploadProgress();
      setSaving(false);
    }
  };

  const updateCategory = async (categoryId, { name, slug, cover, description, coverFile }) => {
    setSaving(true);
    setError("");

    try {
      const existingCategory = store.categories.find((item) => item.id === categoryId);
      const normalizedSlug = slug || slugifyCategoryName(name);

      if (!existingCategory) {
        throw new Error("No se encontro la categoria a editar.");
      }

      if (!normalizedSlug) {
        throw new Error("La categoria necesita slug.");
      }

      if (mode === "supabase" && isSupabaseConfigured) {
        const session = await ensureAuthenticatedSession();
        let coverUrl = cover || "";

        if (coverFile) {
          coverUrl = await uploadFileToSupabase(coverFile, normalizedSlug, "covers");
        }

        const { error: updateError } = await supabase
          .from("categories")
          .update({
            name,
            slug: normalizedSlug,
            cover_url: coverUrl,
            description,
          })
          .eq("id", categoryId);

        if (updateError) {
          throw updateError;
        }

        if (existingCategory.cover && existingCategory.cover !== coverUrl) {
          await removeFilesFromSupabase([existingCategory.cover]);
        }

        await refreshStore();
        return;
      }

      await persistLocalStore({
        ...store,
        categories: store.categories.map((category) =>
          category.id === categoryId
            ? {
                ...category,
                name,
                slug: normalizedSlug,
                cover: cover || "",
                description,
              }
            : category
        ),
      });
    } finally {
      resetUploadProgress();
      setSaving(false);
    }
  };

  const reorderCategories = async (nextCategories) => {
    setSaving(true);
    setError("");

    try {
      if (mode === "supabase" && isSupabaseConfigured) {
        const session = await ensureAuthenticatedSession();
        const updates = nextCategories.map((category, index) =>
          supabase.from("categories").update({ sort_order: index }).eq("id", category.id)
        );

        const results = await Promise.all(updates);
        const failedResult = results.find(({ error: updateError }) => updateError);

        if (failedResult?.error) {
          throw failedResult.error;
        }

        await refreshStore();
        return;
      }

      await persistLocalStore({
        ...store,
        categories: nextCategories,
      });
    } finally {
      setSaving(false);
    }
  };

  const createMediaItem = async ({
    category,
    type,
    src,
    thumbnail,
    title,
    mediaFile,
    thumbnailFile,
  }) => {
    setSaving(true);
    setError("");

    try {
      if (!category) {
        throw new Error("Selecciona una categoria.");
      }

      if (mode === "supabase" && isSupabaseConfigured) {
        const session = await ensureAuthenticatedSession();
        let mediaUrl = src || "";
        let thumbnailUrl = thumbnail || "";

        if (mediaFile) {
          if (type === "video") {
            setUploadProgress({
              active: true,
              label: `Subiendo video ${mediaFile.name}`,
              percentage: 0,
              uploadedBytes: 0,
              totalBytes: mediaFile.size || 0,
              bytesPerSecond: 0,
              remainingSeconds: null,
            });
            mediaUrl = await uploadVideoToSupabaseResumable(
              mediaFile,
              category.slug,
              "videos",
              session.access_token,
              ({ percentage, uploadedBytes, totalBytes, bytesPerSecond, remainingSeconds }) =>
                setUploadProgress({
                  active: true,
                  label: `Subiendo video ${mediaFile.name}`,
                  percentage,
                  uploadedBytes,
                  totalBytes,
                  bytesPerSecond,
                  remainingSeconds,
                })
            );
          } else {
            mediaUrl = await uploadFileToSupabase(mediaFile, category.slug, "images");
          }
        }

        if (thumbnailFile) {
          thumbnailUrl = await uploadFileToSupabase(thumbnailFile, category.slug, "thumbnails");
        }

        const sortOrder = category.items.length;
        const { error: insertError } = await supabase.from("media_items").insert({
          category_id: category.id,
          type,
          src: mediaUrl,
          thumbnail: thumbnailUrl,
          title,
          sort_order: sortOrder,
        });

        if (insertError) {
          throw insertError;
        }

        await refreshStore();
        return;
      }

      const nextMedia = {
        id: `${category.slug}-${Date.now()}`,
        type,
        src,
        thumbnail,
        title,
      };

      await persistLocalStore({
        ...store,
        categories: store.categories.map((item) =>
          item.id === category.id
            ? { ...item, items: [...item.items, nextMedia] }
            : item
        ),
      });
    } finally {
      resetUploadProgress();
      setSaving(false);
    }
  };

  const updateMediaItem = async (
    categoryId,
    mediaId,
    { type, src, thumbnail, title, mediaFile, thumbnailFile }
  ) => {
    setSaving(true);
    setError("");

    try {
      const category = store.categories.find((item) => item.id === categoryId);
      const existingItem = category?.items.find((item) => item.id === mediaId);

      if (!category || !existingItem) {
        throw new Error("No se encontro el elemento a editar.");
      }

      if (mode === "supabase" && isSupabaseConfigured) {
        const session = await ensureAuthenticatedSession();
        let mediaUrl = src || "";
        let thumbnailUrl = type === "video" ? thumbnail || "" : "";

        if (mediaFile) {
          if (type === "video") {
            setUploadProgress({
              active: true,
              label: `Subiendo video ${mediaFile.name}`,
              percentage: 0,
              uploadedBytes: 0,
              totalBytes: mediaFile.size || 0,
              bytesPerSecond: 0,
              remainingSeconds: null,
            });
            mediaUrl = await uploadVideoToSupabaseResumable(
              mediaFile,
              category.slug,
              "videos",
              session.access_token,
              ({ percentage, uploadedBytes, totalBytes, bytesPerSecond, remainingSeconds }) =>
                setUploadProgress({
                  active: true,
                  label: `Subiendo video ${mediaFile.name}`,
                  percentage,
                  uploadedBytes,
                  totalBytes,
                  bytesPerSecond,
                  remainingSeconds,
                })
            );
          } else {
            mediaUrl = await uploadFileToSupabase(mediaFile, category.slug, "images");
          }
        }

        if (type === "video" && thumbnailFile) {
          thumbnailUrl = await uploadFileToSupabase(thumbnailFile, category.slug, "thumbnails");
        }

        const { error: updateError } = await supabase
          .from("media_items")
          .update({
            type,
            src: mediaUrl,
            thumbnail: thumbnailUrl,
            title,
          })
          .eq("id", mediaId);

        if (updateError) {
          throw updateError;
        }

        const obsoleteUrls = [];

        if (existingItem.src && existingItem.src !== mediaUrl) {
          obsoleteUrls.push(existingItem.src);
        }

        if (existingItem.thumbnail && existingItem.thumbnail !== thumbnailUrl) {
          obsoleteUrls.push(existingItem.thumbnail);
        }

        await removeFilesFromSupabase(obsoleteUrls);
        await refreshStore();
        return;
      }

      await persistLocalStore({
        ...store,
        categories: store.categories.map((item) =>
          item.id === categoryId
            ? {
                ...item,
                items: item.items.map((mediaItem) =>
                  mediaItem.id === mediaId
                    ? {
                        ...mediaItem,
                        type,
                        src,
                        thumbnail: type === "video" ? thumbnail : "",
                        title,
                      }
                    : mediaItem
                ),
              }
            : item
        ),
      });
    } finally {
      resetUploadProgress();
      setSaving(false);
    }
  };

  const removeMediaItem = async (categoryId, mediaId) => {
    setSaving(true);
    setError("");

    try {
      if (mode === "supabase" && isSupabaseConfigured) {
        const session = await ensureAuthenticatedSession();
        const category = store.categories.find((item) => item.id === categoryId);
        const mediaItem = category?.items.find((item) => item.id === mediaId);
        const { error: deleteError } = await supabase
          .from("media_items")
          .delete()
          .eq("id", mediaId);

        if (deleteError) {
          throw deleteError;
        }

        await removeFilesFromSupabase([mediaItem?.src, mediaItem?.thumbnail]);

        await refreshStore();
        return;
      }

      await persistLocalStore({
        ...store,
        categories: store.categories.map((category) =>
          category.id === categoryId
            ? {
                ...category,
                items: category.items.filter((item) => item.id !== mediaId),
              }
            : category
        ),
      });
    } finally {
      resetUploadProgress();
      setSaving(false);
    }
  };

  const reorderMediaItems = async (categoryId, nextItems) => {
    setSaving(true);
    setError("");

    try {
      if (mode === "supabase" && isSupabaseConfigured) {
        await ensureAuthenticatedSession();
        const updates = nextItems.map((item, index) =>
          supabase.from("media_items").update({ sort_order: index }).eq("id", item.id)
        );

        const results = await Promise.all(updates);
        const failedResult = results.find(({ error: updateError }) => updateError);

        if (failedResult?.error) {
          throw failedResult.error;
        }

        await refreshStore();
        return;
      }

      await persistLocalStore({
        ...store,
        categories: store.categories.map((category) =>
          category.id === categoryId ? { ...category, items: nextItems } : category
        ),
      });
    } finally {
      setSaving(false);
    }
  };

  const updateHomeSettings = async ({
    hero,
    categories,
    parallax,
    heroImageFile,
    heroSequenceFiles,
    heroVideoFile,
    parallaxImageFile,
  }) => {
    setSaving(true);
    setError("");

    try {
      const previousHero = store.homeSettings?.hero || getDefaultGalleryStore().homeSettings.hero;
      const previousParallax =
        store.homeSettings?.parallax || getDefaultGalleryStore().homeSettings.parallax;
      const nextHero = {
        ...getDefaultGalleryStore().homeSettings.hero,
        ...hero,
      };
      const nextCategories = {
        ...getDefaultGalleryStore().homeSettings.categories,
        ...categories,
      };
      const nextParallax = {
        ...getDefaultGalleryStore().homeSettings.parallax,
        ...parallax,
      };

      if (mode === "supabase" && isSupabaseConfigured) {
        const session = await ensureAuthenticatedSession();

        if (heroImageFile) {
          nextHero.image = await uploadFileToSupabase(heroImageFile, "home", "hero");
        }

        if (heroSequenceFiles?.length) {
          nextHero.images = await Promise.all(
            heroSequenceFiles.map((file) => uploadFileToSupabase(file, "home", "hero-sequence"))
          );
        }

        if (heroVideoFile) {
          setUploadProgress({
            active: true,
            label: `Subiendo video ${heroVideoFile.name}`,
            percentage: 0,
            uploadedBytes: 0,
            totalBytes: heroVideoFile.size || 0,
            bytesPerSecond: 0,
            remainingSeconds: null,
          });
          nextHero.video = await uploadVideoToSupabaseResumable(
            heroVideoFile,
            "home",
            "hero-video",
            session.access_token,
            ({ percentage, uploadedBytes, totalBytes, bytesPerSecond, remainingSeconds }) =>
              setUploadProgress({
                active: true,
                label: `Subiendo video ${heroVideoFile.name}`,
                percentage,
                uploadedBytes,
                totalBytes,
                bytesPerSecond,
                remainingSeconds,
              })
          );
        }

        if (parallaxImageFile) {
          nextParallax.image = await uploadFileToSupabase(parallaxImageFile, "home", "parallax");
        }

        await updateContact({
          ...store.contact,
          homeSettings: {
            hero: nextHero,
            categories: nextCategories,
            parallax: nextParallax,
          },
        });

        const previousUrls = [
          previousHero.image,
          ...(previousHero.images || []),
          previousHero.video,
          previousParallax.image,
        ];
        const nextUrls = new Set([
          nextHero.image,
          ...(nextHero.images || []),
          nextHero.video,
          nextParallax.image,
        ]);

        await removeFilesFromSupabase(previousUrls.filter((url) => url && !nextUrls.has(url)));
        return;
      }

      await persistLocalStore({
        ...store,
        homeSettings: {
          hero: nextHero,
          categories: nextCategories,
          parallax: nextParallax,
        },
      });
    } finally {
      resetUploadProgress();
      setSaving(false);
    }
  };

  const value = useMemo(
    () => ({
      store,
      categories: store.categories,
      packages: store.packages || [],
      contact: store.contact || getDefaultGalleryStore().contact,
      homeSettings: store.homeSettings || getDefaultGalleryStore().homeSettings,
      loading,
      saving,
      uploadProgress,
      error,
      mode,
      refreshStore,
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
    }),
    [store, loading, saving, uploadProgress, error, mode]
  );

  return <GalleryContext.Provider value={value}>{children}</GalleryContext.Provider>;
}

export function useGallery() {
  const context = useContext(GalleryContext);

  if (!context) {
    throw new Error("useGallery debe usarse dentro de GalleryProvider.");
  }

  return context;
}
