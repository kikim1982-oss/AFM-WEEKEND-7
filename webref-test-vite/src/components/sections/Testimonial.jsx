import Container from "../design-system/Container.jsx";
import SectionLabel from "../design-system/SectionLabel.jsx";

export default function Testimonial() {
  return (
    <section className="bg-cream-2 border-y hairline border-ink">
      <Container className="py-24 md:py-36">
        <SectionLabel index="05" label="In their words" className="mb-12" />
        <figure className="max-w-5xl">
          <blockquote
            className="text-ink leading-[1.05] tracking-tight"
            style={{ fontSize: "clamp(2rem, 5vw, 4.5rem)", fontWeight: 400 }}
          >
            <span className="font-serif-italic text-mute mr-2">“</span>
            MAISON ORD의 가구는 단순한 사물이 아닌, 공간에{" "}
            <span className="font-serif-italic">시간</span>을 더하는{" "}
            <span className="font-serif-italic">조각</span>이다.
            <span className="font-serif-italic text-mute ml-1">”</span>
          </blockquote>
          <figcaption className="mt-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-walnut/80 img-grain" />
            <div>
              <div className="text-sm font-medium text-ink">김민지</div>
              <div className="label-tiny-2 text-mute mt-0.5">
                Interior Designer · Studio Mok
              </div>
            </div>
          </figcaption>
        </figure>
      </Container>
    </section>
  );
}
