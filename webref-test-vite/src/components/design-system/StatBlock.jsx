export default function StatBlock({ number, label, suffix }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-start">
        <span className="display-large text-cream text-[clamp(4rem,10vw,9rem)]">
          {number}
        </span>
        {suffix && (
          <span className="font-serif-italic text-cream/80 text-3xl md:text-5xl mt-3 md:mt-6 ml-1">
            {suffix}
          </span>
        )}
      </div>
      <div className="label-tiny text-cream/60 mt-2">{label}</div>
    </div>
  );
}
