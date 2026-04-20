import { useGallery } from "../context/GalleryContext";

export default function PackageCTASection() {
  const { homeSettings } = useGallery();
  const packageCta = homeSettings?.packageCta;

  const title = packageCta?.title || "Arma tu paquete conmigo";
  const intro =
    packageCta?.intro ||
    "Creamos una propuesta visual a tu medida para que tu marca mantenga una imagen clara, elegante y coherente.";
  const ctaLabel = packageCta?.ctaLabel || "Quiero mi paquete";
  const ctaHref = packageCta?.ctaHref || "/contacto";

  if (!title && !intro) {
    return null;
  }

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#0b0b0b_0%,#090909_100%)] py-24 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-8 h-80 w-80 -translate-x-1/2 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute -right-8 bottom-0 h-64 w-64 rounded-full bg-rose-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4">
        <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02),rgba(251,191,36,0.12))] p-7 md:p-10 lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.38em] text-white/45">
                Paquete personalizado
              </p>
              <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
                {title}
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/68 md:text-lg">
                {intro}
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-black/20 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
              <p className="text-[11px] uppercase tracking-[0.32em] text-white/45">CTA final</p>
              <div className="mt-4 space-y-4">
                <p className="text-xl font-semibold text-white">
                  Una tarjeta para cerrar la pagina con una invitacion clara y directa.
                </p>
                <p className="text-sm leading-6 text-white/62">
                  Este bloque funciona muy bien cuando quieres convertir la visita en una
                  conversacion. Es un cierre visual fuerte y fácil de editar desde el panel.
                </p>
              </div>

              <a
                href={ctaHref}
                className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-neutral-950 transition duration-300 hover:-translate-y-0.5 hover:bg-amber-100"
              >
                <span>{ctaLabel}</span>
                <span>→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
