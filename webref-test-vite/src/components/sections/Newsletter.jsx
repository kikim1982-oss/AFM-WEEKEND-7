import { useState } from "react";
import Container from "../design-system/Container.jsx";
import SectionLabel from "../design-system/SectionLabel.jsx";
import Pill from "../design-system/Pill.jsx";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section className="bg-cream">
      <Container className="py-24 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <SectionLabel
            index="06"
            label="Stay in touch"
            className="justify-center mb-8"
          />
          <h2
            className="display-large text-ink mx-auto"
            style={{ fontSize: "clamp(2rem, 5.5vw, 4.5rem)" }}
          >
            Receive our <span className="font-serif-italic">letters.</span>
          </h2>
          <p className="mt-6 text-mute text-[15px] leading-[1.7] max-w-md mx-auto">
            새로운 컬렉션과 아틀리에 소식, 그리고 가끔의 에세이를 한 달에 한 번
            보내드립니다.
          </p>

          {!submitted ? (
            <form
              onSubmit={submit}
              className="mt-12 flex flex-col sm:flex-row gap-3 max-w-xl mx-auto items-center"
            >
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-underline w-full text-center sm:text-left text-base"
              />
              <Pill variant="primary" onClick={submit} className="shrink-0">
                Subscribe
              </Pill>
            </form>
          ) : (
            <div className="mt-12 inline-flex items-center gap-3 label-tiny text-ink border border-ink/30 rounded-full px-5 py-3">
              <span className="font-serif-italic normal-case tracking-normal text-base">
                감사합니다.
              </span>
              <span>You're on the list.</span>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
