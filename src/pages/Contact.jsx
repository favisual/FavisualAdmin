import { useGallery } from "../context/GalleryContext";
import {
  FaEnvelope,
  FaFacebookF,
  FaInstagram,
  FaPhoneAlt,
  FaWhatsapp,
} from "react-icons/fa";
import { motion } from "framer-motion";

function ContactRow({ icon, label, href, value, iconClassName = "text-white", iconWrapperClassName = "bg-white/10 text-white" }) {
  if (!value) {
    return null;
  }

  return (
    <a
      href={href}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noreferrer" : undefined}
      className="group flex w-full min-w-0 max-w-full items-start gap-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 transition-colors hover:bg-white/[0.07] sm:items-center"
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-lg sm:h-12 sm:w-12 ${iconWrapperClassName}`}>
        <span className={iconClassName}>{icon}</span>
      </div>
      <div className="min-w-0 max-w-full flex-1">
        <p className="text-[11px] uppercase tracking-[0.22em] sm:tracking-[0.28em] text-neutral-500">{label}</p>
        <p className="mt-1 break-all text-sm sm:text-base text-white group-hover:text-amber-100 sm:break-words">{value}</p>
      </div>
    </a>
  );
}

function SocialPill({ href, icon, label, iconClassName = "text-white" }) {
  if (!href) {
    return null;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex w-full min-w-0 sm:w-auto items-center justify-center gap-3 rounded-full border border-white/15 bg-white/[0.04] px-4 sm:px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.1]"
    >
      <span className={iconClassName}>{icon}</span>
      <span className="break-words text-center">{label}</span>
    </a>
  );
}

function Contact() {
  const { contact } = useGallery();
  const whatsappLabel = contact?.ctaLabel || "Escribenos por WhatsApp";
  const contactPhotoUrl = contact?.photoUrl || "/FaVisual.svg";
  const socialCards = [
    {
      href: contact?.instagram,
      icon: <FaInstagram />,
      label: "Instagram",
      value: "Siguenos y mira producciones recientes",
      iconClassName: "text-pink-300",
      iconWrapperClassName: "bg-pink-400/15 text-pink-300 shadow-pink-900/20",
    },
    {
      href: contact?.facebook,
      icon: <FaFacebookF />,
      label: "Facebook",
      value: "Conecta con la marca y novedades",
      iconClassName: "text-sky-300",
      iconWrapperClassName: "bg-sky-400/15 text-sky-300 shadow-sky-900/20",
    },
  ].filter((item) => item.href);

  return (
    <section className="min-h-screen w-full max-w-full overflow-x-hidden px-3 sm:px-4 md:px-8 lg:w-11/12 lg:ml-auto lg:px-16 py-16 text-white">
      <div className="max-w-6xl w-full mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 26, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative w-full max-w-full overflow-hidden rounded-[1.6rem] md:rounded-[2.5rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] shadow-[0_35px_90px_rgba(0,0,0,0.35)]"
        >
          <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:26px_26px]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.12),transparent_36%)]" />
          <div className="pointer-events-none absolute -left-16 top-10 h-52 w-52 rounded-full bg-amber-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-y-8 left-1/2 hidden -translate-x-1/2 w-px bg-white/10 lg:block" />

          <div className="grid lg:grid-cols-2">
            <div className="relative min-w-0 p-5 sm:p-8 md:p-12 lg:p-14 xl:p-16">
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.24em] sm:tracking-[0.38em] text-amber-200/80 mb-4">
                Tarjeta de Contacto
              </p>
              <div className="mb-8 sm:mb-10 flex items-center gap-4">
                <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <img src="/FaVisual.svg" alt="FaVisual Logo" className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm uppercase tracking-[0.18em] sm:tracking-[0.35em] text-neutral-500">FaVisual</p>
                  <p className="mt-1 text-sm sm:text-lg text-neutral-300">Visual studio and branded content</p>
                </div>
              </div>

              <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-full border border-white/15 bg-white/5 p-1 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
                  <img
                    src={contactPhotoUrl}
                    alt={contact?.title || "Contacto"}
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>
                <h1 className="max-w-2xl break-words text-[2rem] sm:text-4xl md:text-6xl leading-[1.08] md:leading-[0.95] font-semibold tracking-[-0.03em] sm:tracking-[-0.04em]">
                  {contact?.title || "Contacto"}
                </h1>
              </div>
              <p className="mt-5 sm:mt-6 max-w-2xl break-words text-sm sm:text-base md:text-lg leading-7 sm:leading-8 text-neutral-300">
                {contact?.intro ||
                  "Hablemos de tu siguiente produccion visual, contenidos para redes o propuesta comercial."}
              </p>

              <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row sm:flex-wrap gap-3">
                <SocialPill
                  href={contact?.whatsapp}
                  icon={<FaWhatsapp />}
                  label="WhatsApp"
                  iconClassName="text-emerald-300"
                />
                <SocialPill
                  href={contact?.instagram}
                  icon={<FaInstagram />}
                  label="Instagram"
                  iconClassName="text-pink-300"
                />
                <SocialPill
                  href={contact?.facebook}
                  icon={<FaFacebookF />}
                  label="Facebook"
                  iconClassName="text-sky-300"
                />
              </div>

              <div className="mt-8 sm:mt-12 inline-flex max-w-full items-center gap-3 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs sm:text-sm text-neutral-400 break-words">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
                <span className="break-words">Disponible para nuevos proyectos</span>
              </div>
            </div>

            <div className="relative min-w-0 p-5 sm:p-8 md:p-12 lg:p-14 xl:p-16">
              <div className="rounded-[1.75rem] sm:rounded-[2rem] border border-white/10 bg-black/20 p-5 sm:p-6 md:p-8 backdrop-blur-sm">
                <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] sm:tracking-[0.3em] text-neutral-500">
                      Informacion Directa
                    </p>
                    <p className="mt-2 break-words text-xl sm:text-2xl font-semibold text-white">Canales principales</p>
                  </div>
                  <div className="w-fit max-w-full rounded-full border border-white/10 px-4 py-2 text-[10px] sm:text-xs uppercase tracking-[0.12em] sm:tracking-[0.26em] text-neutral-400">
                    Corporate Card
                  </div>
                </div>

                <div className="grid gap-4">
                  <ContactRow
                    icon={<FaEnvelope />}
                    label="Correo"
                    href={`mailto:${contact?.email}`}
                    value={contact?.email}
                    iconWrapperClassName="bg-white/10 text-white shadow-black/10"
                  />
                  <ContactRow
                    icon={<FaPhoneAlt />}
                    label="Telefono"
                    href={`tel:${contact?.phone}`}
                    value={contact?.phone}
                    iconWrapperClassName="bg-white/10 text-white shadow-black/10"
                  />
                  {socialCards.map((item) => (
                    <ContactRow
                      key={item.label}
                      icon={item.icon}
                      label={item.label}
                      href={item.href}
                      value={item.value}
                      iconClassName={item.iconClassName}
                      iconWrapperClassName={item.iconWrapperClassName}
                    />
                  ))}
                </div>

                {contact?.whatsapp ? (
                  <a
                    href={contact.whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    className="group mt-6 sm:mt-8 block w-full max-w-full rounded-[1.5rem] sm:rounded-[1.75rem] border border-amber-300/20 bg-[linear-gradient(135deg,rgba(251,191,36,0.18),rgba(249,115,22,0.12))] p-4 sm:p-5 shadow-[0_18px_40px_rgba(249,115,22,0.12)] transition-transform duration-300 hover:-translate-y-1"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-neutral-950 shadow-lg">
                          <FaWhatsapp className="text-xl text-emerald-500 sm:text-2xl" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-[0.3em] text-amber-100/75">
                            CTA Principal
                          </p>
                          <p className="mt-1 break-words text-base sm:text-xl font-semibold text-white">
                            {whatsappLabel}
                          </p>
                        </div>
                      </div>
                      <span className="w-full sm:w-fit text-center rounded-full border border-white/15 px-4 py-2 text-[11px] sm:text-xs uppercase tracking-[0.14em] sm:tracking-[0.25em] text-white/80 transition-colors group-hover:bg-white/10">
                        Abrir
                      </span>
                    </div>
                  </a>
                ) : null}

                <div className="mt-6 rounded-[1.35rem] sm:rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-neutral-500">
                    Nota
                  </p>
                  <p className="mt-3 text-sm leading-7 text-neutral-300">
                    Si ya tienes una idea, referencias o un paquete en mente, puedes escribir
                    directo por WhatsApp y seguimos desde ahi.
                  </p>
                </div>
              </div>
            </div>
          </div>
          </motion.div>
        </div>
      </section>
  );
}

export default Contact;
