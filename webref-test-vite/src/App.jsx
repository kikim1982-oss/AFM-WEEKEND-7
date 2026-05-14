import Header from "./components/layout/Header.jsx";
import Hero from "./components/sections/Hero.jsx";
import MarqueeSection from "./components/sections/MarqueeSection.jsx";
import Collection from "./components/sections/Collection.jsx";
import Story from "./components/sections/Story.jsx";
import Stats from "./components/sections/Stats.jsx";
import Testimonial from "./components/sections/Testimonial.jsx";
import Newsletter from "./components/sections/Newsletter.jsx";
import Footer from "./components/sections/Footer.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <Header />
      <main>
        <Hero />
        <MarqueeSection />
        <Collection />
        <Story />
        <Stats />
        <Testimonial />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
}
