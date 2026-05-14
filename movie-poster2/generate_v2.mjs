// gpt-image-2 poster generator — CONCEPT D (Shamanic × Digital Collision)
// Usage:  node --env-file=.env generate_v2.mjs
//   (requires Node.js 20.6+; reads OPENAI_API_KEY from .env in this directory)
// Output: poster_v2_concept_d_vertical.png, poster_v2_concept_d_billboard.png

import fs from "node:fs/promises";
import path from "node:path";

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error("[ERROR] Set OPENAI_API_KEY env var before running.");
  process.exit(1);
}

const OUT_DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const MODEL = "gpt-image-2";

const SHARED_STYLE = `
A cinematic, atmospheric key-art-style poster for a Korean mystery thriller streaming series. Premium graphic design, photoreal, 4K, anamorphic cinematic look. Mood: ominous, beautiful, ritualistic, supernatural — the clash of ancient Korean folk-shamanism and modern digital technology. A24 / Park Chan-wook design language. Stylized and elegant — NOT gory, NO injuries, NO weapons aimed at anyone, NO depiction of harm. This is a graphic-design poster about the symbolic collision of ritual objects and a glowing smartphone.

COLOR PALETTE (strict):
- Background base: deep desaturated charcoal black-blue (#0F1419 to #1A2026)
- Ritual warm accent: smoldering ember-orange and incense-amber glow (#FF6A2D, #C44A1A)
- Crimson digital accent: saturated red glow from a smartphone (#FF1F2D / #D7232E)
- Sacred talisman accent: aged paper yellow with red Hanja calligraphy (#E8C56A)
- Highlights: cold parchment white (#E8EBEE)

SUBJECT (THE SHAMAN, "햇살"):
A young Korean woman in her late twenties standing perfectly still, full-body shot, centered. She wears a stylized modern interpretation of Korean shaman attire: a long flowing dark-indigo robe with deep crimson trim, layered over a white inner garment. Hair tied back. Expression: calm, severe, prophetic — eyes closed or in a meditative trance, NOT angry. In her LEFT hand she holds a traditional Korean ceremonial bow (전통 활) held vertically, parallel to her body, with NO arrow nocked and NO one in the line of fire — purely a ritual prop. In her RIGHT hand she holds a modern smartphone, screen-out toward the viewer; the phone screen glows a saturated crimson red with a stylized fractal sunburst pattern radiating outward. The phone glow uplights her chin and the white inner collar. The bow has a softly glowing yellow paper talisman (부적) tied to it with a thin red cord, the talisman bearing stylized red Hanja-style brushstroke marks.

ENVIRONMENT:
A ritual space — a darkened Korean shamanic shrine (굿당) interior at night. Suspended yellow paper talismans (부적) hang in rows from above on thin red cords, fluttering slightly. Distant glow of red ceremonial candles and a brass bowl with rising incense smoke. The far background dissolves into deep falloff darkness. Subtle volumetric haze from the incense. The light is dual-source: warm ember-orange from candles behind her (silhouette rim), and cold crimson digital glow from the phone in front. Lots of negative space.

COMPOSITION DETAIL — symbolic clash:
The figure is the literal axis of the poster: ancient ritual (the bow + talisman, warm ember light) on one side, modern digital curse (the smartphone, crimson screen glow) on the other. The two light sources meet on her face. This is the visual thesis of the poster.

TYPOGRAPHY (these EXACT strings must appear, legibly, no other text anywhere, no gibberish):
- Korean title: 기리고
   (extremely BOLD blocky modern sans-serif Korean letters, white, with a subtle red RGB chromatic-aberration split — stylized LCD glitch design)
- English title: IF WISHES COULD KILL
   (small, thin, uppercase, white, wide letterspacing, directly under the Korean title — official series title)
- Korean tagline: 넌 있어? 죽도록 빌고 싶은 소원.
   (clean medium-size white Korean sans-serif — official tagline, render exactly)
- Date + platform line: 2026.04.24   N   ONLY ON NETFLIX
   (very small, white, all caps where Latin)

NEGATIVE: No extra text, no gibberish or garbled letters, no random words, no other logos, no watermarks, no captions, no signature. No depiction of violence — the bow is a symbolic ritual object only, never drawn or aimed. Only the four text blocks above.
`.trim();

const PROMPT_VERTICAL = `${SHARED_STYLE}

COMPOSITION (vertical 2:3 portrait movie poster):
- Top third: massive '기리고' title centered, 'IF WISHES COULD KILL' tracked beneath
- Middle two-thirds: the shaman figure full-body centered — bow on her left side, smartphone with crimson glow held forward on her right side, hanging talismans framing left and right edges, candle glow rim from behind
- Bottom strip: tagline '넌 있어? 죽도록 빌고 싶은 소원.' and the tiny '2026.04.24   N   ONLY ON NETFLIX' line
- Symmetrical, ritualistic, ominous. The two light sources (warm candle + cold crimson phone) create the chromatic tension.`.trim();

const PROMPT_HORIZONTAL = `${SHARED_STYLE}

COMPOSITION (horizontal 3:2 landscape billboard / Netflix TV hero banner):
- CENTER-RIGHT: the shaman figure, three-quarter body framing, body slightly turned, bow held vertical on her left, smartphone with crimson glow extended slightly forward on her right toward the camera, hanging yellow talismans cascading behind her on red cords
- LEFT THIRD: deep dark ritual space, distant candles, drifting incense smoke — used as typographic canvas:
   • Large bold Korean title '기리고' set in the upper-left
   • Just beneath: small tracked 'IF WISHES COULD KILL'
   • Below: tagline '넌 있어? 죽도록 빌고 싶은 소원.'
   • At the very bottom-left, tiny '2026.04.24   N   ONLY ON NETFLIX'
- Asymmetric widescreen, cinematic, generous negative space on the left for typography.`.trim();

async function generate(label, prompt, size, outFile) {
  console.log(`\n[${label}] requesting ${MODEL}  size=${size}  quality=high ...`);
  const t0 = Date.now();
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      n: 1,
      size,
      quality: "high",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[${label}] HTTP ${res.status}  ${text}`);
  }

  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error(`[${label}] no b64_json in response`);

  const buf = Buffer.from(b64, "base64");
  await fs.writeFile(outFile, buf);
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`[${label}] saved → ${path.basename(outFile)}  (${(buf.length / 1024).toFixed(0)} KB,  ${elapsed}s)`);
}

(async () => {
  try {
    await generate(
      "VERTICAL",
      PROMPT_VERTICAL,
      "1024x1536",
      path.join(OUT_DIR, "poster_v2_concept_d_vertical.png"),
    );
    await generate(
      "BILLBOARD",
      PROMPT_HORIZONTAL,
      "1536x1024",
      path.join(OUT_DIR, "poster_v2_concept_d_billboard.png"),
    );
    console.log(`\n[OK] all v2 posters generated with ${MODEL}.`);
  } catch (e) {
    console.error("\n[FAIL]", e.message);
    process.exit(1);
  }
})();
