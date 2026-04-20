import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import logo from "../assets/FaVisual.svg";
import { useGallery } from "../context/GalleryContext";

const themeStyles = {
  cyan: {
    card:
      "border-cyan-300/20 bg-[radial-gradient(circle_at_top,rgba(87,213,255,0.22),rgba(10,10,10,0.96)_44%,rgba(10,10,10,0.98))]",
    accent: "from-cyan-200 via-sky-300 to-cyan-500",
    glow: "shadow-[0_30px_90px_rgba(34,211,238,0.16)]",
    badge: "border-cyan-300/20 bg-cyan-400/10 text-cyan-100",
  },
  violet: {
    card:
      "border-fuchsia-300/20 bg-[radial-gradient(circle_at_top,rgba(214,120,255,0.2),rgba(10,10,10,0.96)_42%,rgba(10,10,10,0.98))]",
    accent: "from-fuchsia-200 via-pink-300 to-fuchsia-500",
    glow: "shadow-[0_34px_96px_rgba(217,70,239,0.18)]",
    badge: "border-fuchsia-300/20 bg-fuchsia-400/10 text-fuchsia-100",
  },
  stone: {
    card:
      "border-stone-300/20 bg-[radial-gradient(circle_at_top,rgba(214,211,209,0.18),rgba(10,10,10,0.96)_42%,rgba(10,10,10,0.98))]",
    accent: "from-stone-200 via-neutral-200 to-stone-400",
    glow: "shadow-[0_30px_90px_rgba(168,162,158,0.14)]",
    badge: "border-stone-300/20 bg-stone-400/10 text-stone-100",
  },
  amber: {
    card:
      "border-amber-300/20 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.2),rgba(10,10,10,0.96)_42%,rgba(10,10,10,0.98))]",
    accent: "from-amber-100 via-amber-300 to-orange-500",
    glow: "shadow-[0_30px_90px_rgba(251,146,60,0.16)]",
    badge: "border-amber-300/20 bg-amber-400/10 text-amber-100",
  },
  emerald: {
    card:
      "border-emerald-300/20 bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.2),rgba(10,10,10,0.96)_42%,rgba(10,10,10,0.98))]",
    accent: "from-emerald-100 via-emerald-300 to-emerald-500",
    glow: "shadow-[0_30px_90px_rgba(16,185,129,0.16)]",
    badge: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
  },
};

function buildWhatsAppHref(baseUrl, card) {
  if (!baseUrl) {
    return "";
  }

  const message = [
    `Hola, me interesa el paquete ${card.title}.`,
    card.pricePlan ? `${card.pricePlanLabel || "Precio plan mensual"}: ${card.pricePlan}.` : "",
    "Quiero mas informacion.",
  ]
    .filter(Boolean)
    .join(" ");

  const rawValue = baseUrl.trim();
  const normalizedValue = rawValue.startsWith("http://") || rawValue.startsWith("https://")
    ? rawValue
    : rawValue.startsWith("wa.me/") || rawValue.startsWith("api.whatsapp.com/")
      ? `https://${rawValue}`
      : rawValue;

  try {
    const url = new URL(normalizedValue);
    const isWhatsAppHost = /(^|\.)wa\.me$/i.test(url.hostname) || /(^|\.)whatsapp\.com$/i.test(url.hostname);

    if (isWhatsAppHost) {
      url.searchParams.set("text", message);
      return url.toString();
    }
  } catch {
    // Continue with phone normalization below.
  }

  const digits = rawValue.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function PackageCard({ card, whatsappUrl, desktop = false }) {
  const theme = themeStyles[card.theme] || themeStyles.cyan;
  const ctaHref = buildWhatsAppHref(whatsappUrl, card);
  const isFeatured = Boolean(card.isFeatured);

  return (
    <article
      className={`relative flex h-full min-h-[620px] flex-col overflow-hidden rounded-[2rem] border px-6 py-6 text-white transition duration-300 ${theme.card} ${theme.glow} ${
        desktop && isFeatured ? "lg:-translate-y-4 lg:scale-[1.03]" : ""
      }`}
    >
      {isFeatured ? (
        <>
          <div className="pointer-events-none absolute -inset-[1px] rounded-[2rem] bg-[linear-gradient(110deg,rgba(255,255,255,0.12)_0%,rgba(255,233,220,0.98)_16%,rgba(251,113,133,0.84)_30%,rgba(255,252,248,0.96)_46%,rgba(251,191,36,0.94)_60%,rgba(249,115,22,0.9)_74%,rgba(255,214,205,0.98)_86%,rgba(255,255,255,0.12)_100%)] bg-[length:220%_220%] animate-[premiumBorder_4.2s_ease-in-out_infinite]" />
          <div className="pointer-events-none absolute -inset-[3px] rounded-[2.2rem] bg-[linear-gradient(130deg,rgba(255,244,238,0.5),rgba(255,255,255,0),rgba(251,113,133,0.34),rgba(255,255,255,0),rgba(251,191,36,0.36))] bg-[length:200%_200%] opacity-95 blur-md animate-[premiumBorder_5.8s_ease-in-out_infinite_reverse]" />
          <div className="pointer-events-none absolute inset-[1px] rounded-[calc(2rem-1px)] bg-[linear-gradient(180deg,rgba(9,9,11,0.82),rgba(9,9,11,0.95))]" />
          <div className="pointer-events-none absolute left-8 top-8 h-24 w-24 rounded-full bg-rose-200/24 blur-2xl" />
          <div className="pointer-events-none absolute right-8 top-14 h-20 w-20 rounded-full bg-amber-200/24 blur-2xl" />
          <div className="pointer-events-none absolute right-12 bottom-28 h-28 w-28 rounded-full bg-pink-100/14 blur-3xl" />
          <div className="pointer-events-none absolute left-6 top-6 h-5 w-5 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.98)_0%,rgba(255,228,214,0.74)_35%,rgba(255,255,255,0)_72%)] opacity-95 animate-[pulse_2.1s_ease-in-out_infinite]" />
          <div className="pointer-events-none absolute right-8 top-20 h-4 w-4 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.98)_0%,rgba(251,182,206,0.68)_38%,rgba(255,255,255,0)_72%)] opacity-90 animate-[pulse_2.8s_ease-in-out_infinite]" />
          <div className="pointer-events-none absolute bottom-24 left-12 h-4 w-4 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.98)_0%,rgba(251,191,36,0.66)_42%,rgba(255,255,255,0)_72%)] opacity-90 animate-[pulse_2.5s_ease-in-out_infinite]" />
          <div className="pointer-events-none absolute inset-y-8 left-0 w-28 bg-[linear-gradient(120deg,transparent_15%,rgba(255,246,241,0.32)_42%,transparent_72%)] opacity-75 blur-md animate-[premiumGlow_4.6s_ease-in-out_infinite]" />
        </>
      ) : null}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className={`absolute inset-x-10 top-0 h-24 rounded-full bg-gradient-to-r ${theme.accent} blur-3xl`} />
        <div className="absolute -right-12 bottom-12 h-32 w-32 rounded-full bg-white/6 blur-3xl" />
      </div>

      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <img className="w-9" src={logo} alt="FaVisual" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/45">Paquete</p>
              <h3
                className={`mt-2 text-2xl font-semibold capitalize leading-none ${
                  isFeatured
                    ? "bg-[linear-gradient(180deg,#fff8f4_0%,#ffd8c8_28%,#ffffff_56%,#fda4af_78%,#fde68a_100%)] bg-clip-text text-transparent drop-shadow-[0_0_22px_rgba(251,146,60,0.26)]"
                    : ""
                }`}
              >
                {card.title}
              </h3>
            </div>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.3em] ${
              isFeatured
                ? "border-rose-100/35 bg-[linear-gradient(135deg,rgba(255,247,243,0.22),rgba(251,191,36,0.16),rgba(244,114,182,0.16))] text-rose-50 shadow-[0_0_24px_rgba(251,146,60,0.18)]"
                : "border-white/10 bg-white/5 text-white/65"
            }`}
          >
            {isFeatured ? "Seleccion estrella" : "Disponible"}
          </span>
        </div>

        <div
          className={`relative mt-6 overflow-hidden rounded-[1.6rem] border px-5 py-5 backdrop-blur-sm ${
            isFeatured
              ? "border-rose-100/22 bg-[linear-gradient(180deg,rgba(255,243,238,0.14),rgba(0,0,0,0.18))] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_0_32px_rgba(251,146,60,0.1)]"
              : "border-white/10 bg-black/25"
          }`}
        >
          <p className="text-[11px] uppercase tracking-[0.32em] text-white/45">
            {card.pricePlanLabel || "Precio plan mensual"}
          </p>
          <p
            className={`mt-3 text-3xl font-semibold leading-none md:text-[2.5rem] ${
              isFeatured
                ? "bg-[linear-gradient(180deg,#fffaf6_0%,#ffd7c2_36%,#ffffff_68%,#f9a8d4_100%)] bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(251,146,60,0.24)]"
                : ""
            }`}
          >
            {card.pricePlan || "A convenir"}
          </p>
          <p className="mt-3 max-w-[14rem] text-sm text-white/60">
            {card.pricePlanNote ||
              "Ideal para marcas que quieren mantener una imagen constante y profesional."}
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">
            Precio individual
          </p>
          <p className="mt-2 text-lg font-medium">{card.priceIndividual || "A convenir"}</p>
        </div>

        <div className="mt-6 flex-1 rounded-[1.6rem] border border-white/10 bg-black/20 px-5 py-5">
          <p className="text-[11px] uppercase tracking-[0.32em] text-white/45">Incluye</p>
          <ul className="mt-4 space-y-3">
            {card.features.map((feature, index) => (
              <li key={`${card.id}-${index}`} className="flex items-start gap-3 text-sm text-white/88">
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-r ${theme.accent}`} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6">
          <a
            href={ctaHref || undefined}
            target={ctaHref ? "_blank" : undefined}
            rel={ctaHref ? "noreferrer" : undefined}
            className={`group inline-flex w-full items-center justify-center gap-3 overflow-hidden rounded-full px-6 py-3.5 text-base font-semibold text-neutral-950 transition duration-300 hover:-translate-y-0.5 ${
              isFeatured
                ? "bg-[linear-gradient(135deg,#fff7f2_0%,#fdba74_28%,#fb7185_78%,#fda4af_100%)] shadow-[0_0_34px_rgba(251,146,60,0.22)]"
                : `bg-gradient-to-r ${theme.accent}`
            }`}
          >
            <span>{card.buttonText || "Comencemos"}</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </a>
        </div>
      </div>
    </article>
  );
}

export default function PriceCards() {
  const { packages, contact } = useGallery();
  const featuredPackage = packages.find((item) => item.isFeatured) || packages[0];
  const desktopGridClass =
    packages.length >= 3 ? "xl:grid-cols-3" : packages.length === 2 ? "lg:grid-cols-2" : "grid-cols-1";

  if (!packages.length) {
    return null;
  }

  return (
    <section
      id="price-cards"
      className="relative overflow-hidden bg-[linear-gradient(180deg,#0a0a0a_0%,#111111_35%,#0b0b0b_100%)] py-28 text-white"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-20 h-56 w-56 rounded-full bg-amber-400/12 blur-3xl" />
        <div className="absolute right-[7%] top-36 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.4em] text-white/45">Paquetes</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl"></h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/62">
              Cada paquete esta pensado para ayudarte a mostrar tu producto, servicio o proyecto
              con una imagen mas cuidada, coherente y lista para vender mejor.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-[0.34em] text-white/45">Paquete destacado</p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-2xl font-semibold capitalize">{featuredPackage?.title}</p>
                <p className="mt-2 text-sm text-white/60">
                  {featuredPackage?.pricePlan || featuredPackage?.priceIndividual || "Precio a convenir"}
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-white/70">
                {packages.length} opciones
              </span>
            </div>
          </div>
        </div>

        <div className="mt-12 lg:hidden">
          <Swiper
            effect="coverflow"
            grabCursor={true}
            centeredSlides={true}
            slidesPerView={1.08}
            initialSlide={Math.max(0, packages.findIndex((item) => item.id === featuredPackage?.id))}
            spaceBetween={28}
            loop={false}
            coverflowEffect={{
              rotate: 0,
              stretch: 0,
              depth: 100,
              modifier: 1.6,
              slideShadows: false,
              scale: 0.94,
            }}
            pagination={{ clickable: true }}
            modules={[EffectCoverflow, Pagination]}
            className="w-full overflow-visible"
          >
            {packages.map((card) => (
              <SwiperSlide key={card.id} className="pb-12">
                <PackageCard card={card} whatsappUrl={contact?.whatsapp} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        <div className={`mt-12 hidden gap-6 lg:grid ${desktopGridClass}`}>
          {packages.map((card) => (
            <PackageCard
              key={card.id}
              card={card}
              whatsappUrl={contact?.whatsapp}
              desktop
            />
          ))}
        </div>
      </div>
    </section>
  );
}
