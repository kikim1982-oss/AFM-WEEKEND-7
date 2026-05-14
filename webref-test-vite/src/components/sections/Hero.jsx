import Container from "../design-system/Container.jsx";
import SectionLabel from "../design-system/SectionLabel.jsx";
import Pill from "../design-system/Pill.jsx";

export default function Hero() {
  return (
    <section className="relative">
      <Container className="pt-14 md:pt-20 pb-12 md:pb-20">
        <SectionLabel index="01" label="New Collection · SS26" />

        <div className="mt-10 md:mt-14 grid grid-cols-12 gap-x-6 gap-y-10">
          {/* Headline */}
          <div className="col-span-12 lg:col-span-8">
            <h1
              className="display-hero text-ink"
              style={{ fontSize: "clamp(3.5rem, 12vw, 13rem)" }}
            >
              Furniture
              <br />
              for the way
              <br />
              you{" "}
              <span
                className="font-serif-italic"
                style={{ fontWeight: 400 }}
              >
                live.
              </span>
            </h1>
          </div>

          {/* Side meta */}
          <div className="col-span-12 lg:col-span-4 flex flex-col justify-end gap-8">
            <div className="hidden lg:block">
              <div className="label-tiny-2 text-mute mb-3">
                — A note from the studio
              </div>
              <p className="text-mute text-[15px] leading-[1.7] max-w-sm">
                장인의 손에서 완성되는, 시간을 초월한 디자인. 매일의 풍경을
                조용히 다시 쓰는 가구를 만듭니다.
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-6 text-xs label-tiny-2 text-mute">
              <span>EST. 2014</span>
              <span className="w-8 h-px bg-ink/40" />
              <span>SEOUL · COPENHAGEN</span>
            </div>
          </div>
        </div>

        {/* Tagline + CTA + lead image */}
        <div className="mt-14 md:mt-20 grid grid-cols-12 gap-x-6 gap-y-12 items-end">
          <div className="col-span-12 md:col-span-5">
            <p className="text-ink text-lg md:text-xl leading-[1.45] max-w-md font-medium tracking-tight">
              삶의 <span className="font-serif-italic">결</span>을 담은 가구.
              <br />
              Made by hand, designed to last generations.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Pill variant="primary" href="#collection">
                Shop Collection
              </Pill>
              <Pill variant="outline" href="#story">
                Our Story
              </Pill>
            </div>
          </div>

          {/* Lead image */}
          <div className="col-span-12 md:col-span-7">
            <div
              className="relative aspect-[16/10] w-full overflow-hidden rounded-sm img-grain"
              style={{
                background:
                  "linear-gradient(140deg, #C6B79A 0%, #8E7A5A 60%, #5A4530 100%)",
              }}
            >
              <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-8">
                <div className="flex items-start justify-between">
                  <span className="label-tiny-2 text-cream/80">
                    Featured · No. 014
                  </span>
                  <span className="label-tiny-2 text-cream/80">01 / 06</span>
                </div>
                <div>
                  <div className="font-serif-italic text-cream text-3xl md:text-5xl tracking-tight">
                    Linen Lounge
                  </div>
                  <div className="label-tiny-2 text-cream/70 mt-2">
                    Seating — Oak & natural linen
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
