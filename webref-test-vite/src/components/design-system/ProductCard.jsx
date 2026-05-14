import ProductImage from "./ProductImage.jsx";
import PlusIcon from "../icons/PlusIcon.jsx";

export default function ProductCard({
  index,
  name,
  italicWord,
  category,
  price,
  color,
}) {
  const parts = italicWord ? name.split(italicWord) : null;
  return (
    <article className="product-card group cursor-pointer">
      <ProductImage color={color} name={name} />
      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <div className="label-tiny-2 text-mute mb-2">
            — {index} / {category}
          </div>
          <h3 className="text-2xl md:text-[26px] leading-tight tracking-tight font-medium text-ink">
            {parts ? (
              <>
                {parts[0]}
                <span className="font-serif-italic">{italicWord}</span>
                {parts[1]}
              </>
            ) : (
              name
            )}
          </h3>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm text-ink tabular-nums">{price}</div>
          <button
            className="mt-3 inline-flex items-center justify-center w-9 h-9 rounded-full border border-ink/30 group-hover:border-ink group-hover:bg-ink group-hover:text-cream transition-colors duration-300"
            aria-label="Add to cart"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
