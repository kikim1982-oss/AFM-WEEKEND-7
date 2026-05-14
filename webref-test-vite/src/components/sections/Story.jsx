import Container from "../design-system/Container.jsx";
import SectionLabel from "../design-system/SectionLabel.jsx";
import Pill from "../design-system/Pill.jsx";

const specs = [
  { k: "FSC", v: "Sourced timber" },
  { k: "47h", v: "Avg. build" },
  { k: "10y", v: "Warranty" },
];

export default function Story() {
  return (
    <section id="story" className="border-t hairline border-ink">
      <Container className="py-20 md:py-28">
        <SectionLabel index="03" label="The Studio" className="mb-12" />
        <div className="grid grid-cols-12 gap-x-6 gap-y-12 items-start">
          <div className="col-span-12 lg:col-span-6">
            <h2
              className="display-large text-ink"
              style={{ fontSize: "clamp(2.25rem, 5.5vw, 4.5rem)" }}
            >
              장인 정신에
              <br />
              <span className="font-serif-italic">깊이</span>를 더하다.
            </h2>
            <p className="mt-8 text-ink/85 text-lg leading-[1.65] max-w-lg">
              Made by hand, designed to last generations. 우리는 30년 이상
              가구를 만들어 온 장인들과 함께, 단순히 사용하는 사물이 아닌
              <span className="font-serif-italic"> 머무는 풍경</span>을
              만듭니다.
            </p>
            <p className="mt-5 text-mute text-[15px] leading-[1.7] max-w-lg">
              지속 가능한 활엽수림에서 자란 오크와 월넛, 자연 가공된 트래버틴,
              그리고 한 올 한 올 짜낸 보클레 패브릭만을 사용합니다. 하나의
              의자가 완성되기까지 평균 47시간이 걸립니다.
            </p>
            <div className="mt-10 flex items-center gap-3">
              <Pill variant="outline" href="#">
                Read our journal
              </Pill>
            </div>

            <div className="mt-14 grid grid-cols-3 gap-6 max-w-md">
              {specs.map((item) => (
                <div
                  key={item.k}
                  className="border-t hairline border-ink/30 pt-3"
                >
                  <div className="font-serif-italic text-2xl text-ink">
                    {item.k}
                  </div>
                  <div className="label-tiny-2 text-mute mt-1">{item.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6 lg:pl-8">
            <div
              className="relative aspect-[4/5] w-full overflow-hidden rounded-sm img-grain"
              style={{
                background: "linear-gradient(160deg, #6B4F3A 0%, #3A2A1E 100%)",
              }}
            >
              <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-8">
                <span className="label-tiny-2 text-cream/80">
                  Atelier · Gyeonggi-do
                </span>
                <div>
                  <div className="font-serif-italic text-cream text-4xl md:text-6xl tracking-tight leading-none">
                    In the
                    <br />
                    workshop.
                  </div>
                  <div className="label-tiny-2 text-cream/70 mt-3">
                    Photograph · 02 of 12
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
