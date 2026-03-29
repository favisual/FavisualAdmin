import CardsCategories from "../components/CardsCategories";
import Hero from "../components/Hero";
import ParallaxFrame from "../components/ParallaxFrame";
import PriceCards from "../components/PriceCards";

function Home() {
    return (
        <>
            <Hero />
            <CardsCategories/>
            <ParallaxFrame />
            <PriceCards />
        </>
    )
}

export default Home