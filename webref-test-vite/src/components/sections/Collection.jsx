import Container from "../design-system/Container.jsx";
import SectionLabel from "../design-system/SectionLabel.jsx";
import ProductCard from "../design-system/ProductCard.jsx";
import ArrowUpRight from "../icons/ArrowUpRight.jsx";

const products = [
  {
    index: "01",
    name: "Linen Lounge Chair",
    italicWord: "Lounge",
    category: "Seating",
    price: "₩ 1,890,000",
    color: "#C6B79A",
  },
  {
    index: "02",
    name: "Oak Dining Table",
    italicWord: "Dining",
    category: "Tables",
    price: "₩ 3,450,000",
    color: "#5A3E2B",
  },
  {
    index: "03",
    name: "Travertine Side Table",
    italicWord: "Travertine",
    category: "Tables",
    price: "₩    980,000",
    color: "#D9D2C2",
  },
  {
    index: "04",
    name: "Brass Floor Lamp",
    italicWord: "Floor",
    category: "Lighting",
    price: "₩ 1,240,000",
    color: "#4E5340",
  },
  {
    index: "05",
    name: "Walnut Bookshelf",
    italicWord: "Walnut",
    category: "Storage",
    price: "₩ 2,780,000",
    color: "#B96A4B",
  },
  {
    index: "06",
    name: "Boucle Sofa",
    italicWord: "Boucle",
    category: "Seating",
    price: "₩ 4,890,000",
    color: "#A8B89A",
  },
];

export default function Collection() {
  return (
    <section id="collection" className="bg-cream">
      <Container className="pt-20 md:pt-28 pb-20 md:pb-28">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14 md:mb-20">
          <div className="max-w-2xl">
            <SectionLabel index="02" label="The Collection" className="mb-6" />
            <h2
              className="display-large text-ink"
              style={{ fontSize: "clamp(2.5rem, 6vw, 5.5rem)" }}
            >
              Pieces that <span className="font-serif-italic">linger.</span>
            </h2>
          </div>
          <a
            href="#"
            className="group inline-flex items-center gap-2 link-underline text-sm tracking-tight self-start md:self-end pb-1"
          >
            View all 42 pieces{" "}
            <ArrowUpRight className="w-3.5 h-3.5 btn-arrow" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-16 md:gap-y-20">
          {products.map((p) => (
            <ProductCard key={p.index} {...p} />
          ))}
        </div>
      </Container>
    </section>
  );
}
