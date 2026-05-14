import Container from "../design-system/Container.jsx";
import SectionLabel from "../design-system/SectionLabel.jsx";
import StatBlock from "../design-system/StatBlock.jsx";
import Pill from "../design-system/Pill.jsx";

export default function Stats() {
  return (
    <section className="bg-ink-2 text-cream">
      <Container className="py-20 md:py-28">
        <SectionLabel
          index="04"
          label="By the numbers"
          className="mb-14 text-cream"
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-14">
          <StatBlock number="12" suffix="" label="Years of craft" />
          <StatBlock number="180" suffix="+" label="Artisans" />
          <StatBlock number="40" suffix="" label="Countries shipped" />
          <StatBlock number="1500" suffix="+" label="Pieces made" />
        </div>

        <div className="mt-20 border-t border-cream/15 pt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-cream/70 max-w-md text-[15px] leading-[1.6]">
            From a small atelier outside Seoul to studios in Copenhagen — every
            piece begins with a drawing and ends in your home.
          </p>
          <Pill variant="light" href="#">
            Visit the atelier
          </Pill>
        </div>
      </Container>
    </section>
  );
}
