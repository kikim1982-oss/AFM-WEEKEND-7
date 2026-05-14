export default function ArrowUpRight({ className = "w-4 h-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M7 17L17 7M9 7h8v8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
