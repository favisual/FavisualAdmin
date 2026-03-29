import { useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow, Navigation, Pagination } from "swiper/modules";
import { NavLink } from "react-router-dom";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { useGallery } from "../context/GalleryContext";

function CardsCategories() {
  const { categories } = useGallery();
  const [activeIndex, setActiveIndex] = useState(0);
  const canLoop = categories.length > 4;
  const progressPercentage = useMemo(() => {
    if (categories.length <= 1) {
      return 100;
    }

    return ((activeIndex + 1) / categories.length) * 100;
  }, [activeIndex, categories.length]);

  if (!categories.length) {
    return null;
  }

  return (
    <section className="bg-neutral-900">
      <div className="w-full max-w-7xl mx-auto py-28 px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-neutral-500 mb-3">
              Categorias
            </p>
            <h2 className="text-3xl md:text-5xl font-semibold text-white max-w-2xl">
              Explora el trabajo por linea visual
            </h2>
            <p className="mt-4 max-w-xl text-neutral-400">
              Desliza, usa las flechas o deja que el carrusel avance para descubrir mas categorias.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="categories-prev flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10"
              aria-label="Categorias anteriores"
            >
              <FaArrowLeft />
            </button>
            <button
              type="button"
              className="categories-next flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10"
              aria-label="Categorias siguientes"
            >
              <FaArrowRight />
            </button>
          </div>
        </div>

        <Swiper
          effect="coverflow"
          grabCursor={true}
          centeredSlides={false}
          loop={canLoop}
          autoplay={{
            delay: 3600,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          navigation={{
            prevEl: ".categories-prev",
            nextEl: ".categories-next",
          }}
          pagination={{
            el: ".categories-pagination",
            clickable: true,
            bulletClass:
              "categories-bullet inline-block h-2.5 w-2.5 rounded-full bg-white/20 transition-all duration-300",
            bulletActiveClass: "!w-9 !bg-white",
          }}
          onSlideChange={(swiper) => {
            const nextIndex = canLoop ? swiper.realIndex : swiper.activeIndex;
            setActiveIndex(nextIndex);
          }}
          onSwiper={(swiper) => {
            const nextIndex = canLoop ? swiper.realIndex : swiper.activeIndex;
            setActiveIndex(nextIndex);
          }}
          slidesPerView={1.15}
          spaceBetween={18}
          breakpoints={{
            640: {
              slidesPerView: 2.1,
              spaceBetween: 22,
            },
            900: {
              slidesPerView: 3.15,
              spaceBetween: 24,
            },
            1200: {
              slidesPerView: 4.15,
              spaceBetween: 26,
            },
          }}
          coverflowEffect={{
            rotate: 0,
            stretch: 0,
            depth: 90,
            modifier: 1.2,
            slideShadows: false,
            scale: 0.96,
          }}
          modules={[Autoplay, EffectCoverflow, Navigation, Pagination]}
          className="w-full overflow-visible"
        >
          {categories.map((category) => (
            <SwiperSlide key={category.id} className="h-[430px] md:h-[500px]">
              <NavLink
                to={`/categories/${category.slug}`}
                className="relative overflow-hidden bg-black text-neutral-900 h-[430px] md:h-[500px] w-full flex items-end justify-center text-xl font-light text-center rounded-[1.7rem] shadow-lg group"
              >
                <img
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                  src={category.cover || "/images/Otras.jpg"}
                  alt={category.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute inset-x-4 bottom-5 rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.35em] text-white/60 mb-2">
                    Categoria
                  </p>
                  <p className="text-white text-base md:text-lg tracking-[0.18em] uppercase">
                    {category.name}
                  </p>
                </div>
              </NavLink>
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="mt-8 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="categories-pagination flex flex-wrap items-center gap-2" />
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              {String(activeIndex + 1).padStart(2, "0")} / {String(categories.length).padStart(2, "0")}
            </p>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-white transition-[width] duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default CardsCategories;
