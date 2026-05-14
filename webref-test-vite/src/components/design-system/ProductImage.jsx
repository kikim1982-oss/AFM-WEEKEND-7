import { shade } from "../../utils/shade.js";

export default function ProductImage({
  color,
  name,
  ratio = "aspect-[4/5]",
}) {
  return (
    <div className={`relative ${ratio} w-full overflow-hidden rounded-sm`}>
      <div
        className="product-img absolute inset-0 img-grain"
        style={{
          background: `linear-gradient(135deg, ${color} 0%, ${shade(color, -12)} 100%)`,
        }}
      />
      <div className="absolute inset-0 flex items-end p-5">
        <span className="font-serif-italic text-cream/90 text-xl tracking-tight drop-shadow-sm">
          {name}
        </span>
      </div>
    </div>
  );
}
