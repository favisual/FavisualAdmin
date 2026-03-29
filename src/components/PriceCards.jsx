import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import logo from "../assets/FaVisual.svg";
import { useGallery } from "../context/GalleryContext";

const themeStyles = {
  cyan: "bg-[radial-gradient(circle_at_top,_rgba(87,213,255,0.5),_rgba(15,15,15,1)35%)]",
  violet: "bg-[radial-gradient(circle_at_top,_rgba(200,99,235,0.5),_rgba(15,15,15,1)35%)]",
  stone: "bg-[radial-gradient(circle_at_top,_rgba(125,125,125,0.5),_rgba(15,15,15,1)35%)]",
  amber: "bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.5),_rgba(15,15,15,1)35%)]",
  emerald: "bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.5),_rgba(15,15,15,1)35%)]",
};

function PackageCard({ card, desktop = false }) {
  const colorBg = themeStyles[card.theme] || themeStyles.cyan;
  const scaleClass = desktop && card.isFeatured ? "scale-110" : "scale-100";

  return (
    <div
      className={`w-full h-[600px] max-w-[340px] mx-auto ${colorBg} p-4 rounded-2xl border border-neutral-700 transition-transform duration-300 flex flex-col justify-between ${scaleClass}`}
    >
      <div>
        <div className="flex items-end mt-2">
          <img className="w-16" src={logo} alt="logo" />
          <h3 className="capitalize text-white text-2xl font-light ml-2">{card.title}</h3>
        </div>
        <ul className="list-disc font-light text-white mt-3 px-5">
          {card.features.map((feature, i) => (
            <li key={`${card.id}-${i}`}>{feature}</li>
          ))}
        </ul>
      </div>
      <div>
        <button className="bg-gradient-to-t from-orange-600 to-orange-300 mt-4 w-full py-3 rounded-md text-xl text-white cursor-pointer">
          {card.buttonText || "Comencemos"}
        </button>
        <div className="text-white rounded-xl mt-6">
          <p className="capitalize font-light text-sm text-neutral-300">precio individual</p>
          <p className="uppercase font-medium text-xl italic">{card.priceIndividual}</p>
          <p className="capitalize font-light text-sm text-neutral-300 mt-4">precio final</p>
          <p>(PLAN MENSUAL 3, 6 O 12 MESES)</p>
          <p className="uppercase font-medium text-xl italic">{card.pricePlan}</p>
          <p className="capitalize font-light text-sm text-neutral-300 mt-4">precio unico sin plan</p>
          <p className="uppercase font-medium text-xl italic">{card.priceUnico}</p>
        </div>
      </div>
    </div>
  );
}

export default function PriceCards() {
  const { packages } = useGallery();
  const desktopGridClass =
    packages.length >= 3 ? "grid-cols-3" : packages.length === 2 ? "grid-cols-2" : "grid-cols-1";

  if (!packages.length) {
    return null;
  }

  return (
    <section id="price-cards" className="w-full py-36 bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4">
        <div className="lg:hidden">
          <Swiper
            effect="coverflow"
            grabCursor={true}
            centeredSlides={true}
            slidesPerView={1.2}
            initialSlide={Math.min(1, packages.length - 1)}
            spaceBetween={46}
            loop={false}
            coverflowEffect={{
              rotate: 0,
              stretch: 0,
              depth: 100,
              modifier: 2,
              slideShadows: false,
            }}
            modules={[EffectCoverflow, Pagination]}
            className="w-full"
          >
            {packages.map((card) => (
              <SwiperSlide key={card.id}>
                <PackageCard card={card} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        <div className={`hidden lg:grid gap-x-12 gap-y-8 mt-12 justify-items-center ${desktopGridClass}`}>
          {packages.map((card) => (
            <PackageCard key={card.id} card={card} desktop />
          ))}
        </div>
      </div>
    </section>
  );
}
