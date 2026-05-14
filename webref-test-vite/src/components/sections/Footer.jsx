import Container from "../design-system/Container.jsx";
import SectionLabel from "../design-system/SectionLabel.jsx";

const columns = [
  {
    title: "Shop",
    items: ["Seating", "Tables", "Lighting", "Storage", "Beds", "Accessories"],
  },
  { title: "Studio", items: ["About", "Craft", "Press", "Contact"] },
  { title: "Help", items: ["Shipping", "Returns", "Care Guide", "FAQ"] },
  { title: "Connect", items: ["Instagram", "Pinterest", "Newsletter"] },
];

export default function Footer() {
  return (
    <footer className="bg-ink-2 text-cream">
      <Container className="pt-20 md:pt-28 pb-10">
        {/* Top row */}
        <div className="grid grid-cols-12 gap-x-6 gap-y-12">
          <div className="col-span-12 lg:col-span-4">
            <SectionLabel
              index="07"
              label="Maison Ord — Atelier"
              className="mb-6 text-cream"
            />
            <p className="text-cream/70 text-[15px] leading-[1.7] max-w-xs">
              An atelier of furniture-makers based in Seoul and Copenhagen.
              Every piece, hand-finished.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <a href="#" className="link-underline-rev text-sm">
                Instagram
              </a>
              <a href="#" className="link-underline-rev text-sm">
                Pinterest
              </a>
              <a href="#" className="link-underline-rev text-sm">
                Are.na
              </a>
            </div>
          </div>

          {columns.map((col) => (
            <div
              key={col.title}
              className="col-span-6 md:col-span-3 lg:col-span-2"
            >
              <div className="label-tiny-2 text-cream/50 mb-5">{col.title}</div>
              <ul className="space-y-2.5">
                {col.items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-cream/90 text-[15px] hover:text-cream link-underline-rev"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Huge wordmark */}
        <div className="mt-20 md:mt-28 border-t border-cream/15 pt-10">
          <div
            className="footer-wordmark text-cream leading-none"
            style={{ fontSize: "clamp(4.5rem, 22vw, 24rem)" }}
          >
            Maison <span className="font-serif-italic">Ord</span>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-10 border-t border-cream/15 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-6 label-tiny-2 text-cream/60">
            <span>© 2026 Maison Ord. All rights reserved.</span>
            <a href="#" className="link-underline-rev hidden md:inline">
              Privacy
            </a>
            <a href="#" className="link-underline-rev hidden md:inline">
              Terms
            </a>
          </div>
          <div className="flex items-center gap-2 label-tiny-2 text-cream/60">
            <button className="px-3 py-1.5 rounded-full border border-cream/20 hover:bg-cream hover:text-ink transition-colors">
              KR · 한국어
            </button>
            <button className="px-3 py-1.5 rounded-full border border-cream/20 hover:bg-cream hover:text-ink transition-colors">
              EN
            </button>
            <button className="px-3 py-1.5 rounded-full border border-cream/20 hover:bg-cream hover:text-ink transition-colors">
              DK
            </button>
          </div>
        </div>
      </Container>
    </footer>
  );
}
