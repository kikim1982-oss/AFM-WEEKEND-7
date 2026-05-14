import MarqueeRow from "../design-system/MarqueeRow.jsx";

export default function MarqueeSection() {
  return (
    <section className="border-y hairline border-ink">
      <MarqueeRow
        items={[
          "Sofas",
          "Tables",
          "Lighting",
          "Chairs",
          "Storage",
          "Beds",
          "Textiles",
          "Objects",
        ]}
        separator="✱"
      />
    </section>
  );
}
