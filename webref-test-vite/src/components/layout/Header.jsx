import { useState, useEffect } from "react";
import Container from "../design-system/Container.jsx";
import Divider from "../design-system/Divider.jsx";
import SearchIcon from "../icons/SearchIcon.jsx";
import CartIcon from "../icons/CartIcon.jsx";
import MenuIcon from "../icons/MenuIcon.jsx";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "bg-cream/95 backdrop-blur-sm border-b border-ink/15"
          : "bg-cream"
      }`}
    >
      <Container>
        <div className="flex items-center justify-between py-5">
          {/* Brand */}
          <a href="#" className="flex items-baseline gap-2">
            <span className="font-serif-italic text-2xl md:text-[28px] leading-none">
              Maison
            </span>
            <span className="text-2xl md:text-[28px] tracking-tight leading-none font-medium">
              Ord
            </span>
            <span className="hidden md:inline label-tiny-2 text-mute ml-2">
              SS26
            </span>
          </a>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-9">
            {["Collection", "Studio", "Journal", "Contact"].map((item, i) => (
              <a
                key={item}
                href="#"
                className="link-underline text-sm tracking-tight text-ink"
              >
                <span className="text-mute mr-1.5 label-tiny-2">
                  0{i + 1}
                </span>
                {item}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              className="p-1.5 -m-1.5 text-ink hover:opacity-60 transition-opacity"
              aria-label="Search"
            >
              <SearchIcon />
            </button>
            <button
              className="relative p-1.5 -m-1.5 text-ink hover:opacity-60 transition-opacity"
              aria-label="Cart"
            >
              <CartIcon />
              <span className="absolute -top-1 -right-1 bg-ink text-cream text-[10px] font-medium rounded-full w-4 h-4 flex items-center justify-center">
                2
              </span>
            </button>
            <button
              className="md:hidden p-1.5 -m-1.5 text-ink"
              aria-label="Menu"
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </Container>
      <Divider />
    </header>
  );
}
