export default function MarqueeRow({ items, separator = "✱" }) {
  const repeated = [...items, ...items, ...items, ...items];
  return (
    <div className="overflow-hidden">
      <div className="marquee-track py-6 md:py-7">
        {repeated.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center text-3xl md:text-5xl tracking-tight font-medium text-ink"
          >
            <span className="px-8">{item}</span>
            <span className="font-serif-italic text-ink/70 text-2xl md:text-4xl">
              {separator}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
