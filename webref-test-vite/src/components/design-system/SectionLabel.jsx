export default function SectionLabel({ index, label, className = "" }) {
  return (
    <div
      className={`flex items-center gap-3 label-tiny text-ink ${className}`}
    >
      {index && <span className="text-mute">—{index}</span>}
      <span>{label}</span>
    </div>
  );
}
