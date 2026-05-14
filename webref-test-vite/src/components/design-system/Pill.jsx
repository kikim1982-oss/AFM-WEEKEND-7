import ArrowRight from "../icons/ArrowRight.jsx";

export default function Pill({
  children,
  variant = "primary",
  href = "#",
  onClick,
  className = "",
  icon = true,
}) {
  const base =
    "group inline-flex items-center gap-3 rounded-full px-6 py-3.5 text-sm font-medium tracking-tight transition-colors duration-300";
  const variants = {
    primary: "bg-ink text-cream hover:bg-ink-2",
    outline: "border border-ink text-ink hover:bg-ink hover:text-cream",
    ghost: "text-ink hover:bg-ink/5",
    light: "bg-cream text-ink hover:bg-white",
  };
  const content = (
    <>
      <span>{children}</span>
      {icon && <ArrowRight className="btn-arrow w-4 h-4" />}
    </>
  );
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${base} ${variants[variant]} ${className}`}
      >
        {content}
      </button>
    );
  }
  return (
    <a
      href={href}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {content}
    </a>
  );
}
