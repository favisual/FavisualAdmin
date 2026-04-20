import CardsCategories from "../components/CardsCategories";
import BrandLogosSection from "../components/BrandLogosSection";
import Hero from "../components/Hero";
import ParallaxFrame from "../components/ParallaxFrame";
import PackageCTASection from "../components/PackageCTASection";
import PriceCards from "../components/PriceCards";

function Home() {
    return (
        <>
            <Hero />
            <CardsCategories/>
            <ParallaxFrame />
            <BrandLogosSection />
            <PriceCards />
            <PackageCTASection />
        </>
    )
}

export default Home
