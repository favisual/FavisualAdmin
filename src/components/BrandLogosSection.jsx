import { useGallery } from "../context/GalleryContext";

function getLogoLabel(url, index) {
  if (!url) {
    return `Marca ${index + 1}`;
  }

  try {
    const parsedUrl = new URL(url, "https://example.com");
    const fileName = parsedUrl.pathname.split("/").filter(Boolean).pop() || "";
    const baseName = fileName.replace(/\.[^.]+$/, "");
    const readableName = baseName
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return readableName ? readableName.charAt(0).toUpperCase() + readableName.slice(1) : `Marca ${index + 1}`;
  } catch {
    return `Marca ${index + 1}`;
  }
}

export default function BrandLogosSection() {
  const { homeSettings } = useGallery();
  const brandLogos = homeSettings?.brandLogos;
  const logos = Array.isArray(brandLogos?.logos) ? brandLogos.logos.filter(Boolean) : [];

  if (!logos.length) {
    return null;
  }

  return (
    <section className="relative overflow-hidden bg-neutral-950 py-24 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[10%] top-12 h-56 w-56 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute right-[6%] top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4">
        <div className="grid gap-8 rounded-[2.25rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02),rgba(251,191,36,0.08))] p-6 md:p-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/45">
              Portafolio de marcas
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight md:text-5xl">
              {brandLogos?.title || "Marcas con las que he trabajado"}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/65">
              {brandLogos?.intro ||
                "Una vitrina limpia para mostrar logos de clientes, aliados o marcas que ya confiaron en tu trabajo."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {logos.map((logo, index) => (
              <div
                key={`${logo}-${index}`}
                className="group flex min-h-28 items-center justify-center rounded-3xl border border-white/10 bg-black/20 px-6 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]"
              >
                <img
                  src={logo}
                  alt={getLogoLabel(logo, index)}
                  className="max-h-12 w-full object-contain opacity-80 transition duration-300 group-hover:opacity-100"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
