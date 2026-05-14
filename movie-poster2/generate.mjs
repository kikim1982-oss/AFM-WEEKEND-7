// gpt-image-1 poster generator for 「기리고 / If Wishes Could Kill」
// Usage:  node --env-file=.env generate.mjs
//   (requires Node.js 20.6+; reads OPENAI_API_KEY from .env in this directory)
// Output: poster_main_vertical.png, poster_billboard_horizontal.png

import fs from "node:fs/promises";
import path from "node:path";

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error("[ERROR] Set OPENAI_API_KEY env var before running.");
  process.exit(1);
}

const OUT_DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));

const SHARED_STYLE = `
A cinematic, dark and atmospheric key-art-style poster for a Korean mystery thriller streaming series. Premium graphic design, photoreal, 4K, anamorphic cinematic look. Mood: moody, oppressive, beautiful, ominous, A24-style design aesthetic. Stylized and elegant — NOT graphic, NOT gory, NO injuries, NO weapons, NO real blood, NO depiction of harm. This is a graphic-design poster about a stylized digital glow effect on a phone screen.

COLOR PALETTE (strict):
- Background: deep cold gray-blue (#1A2026 to #2E3439), nearly black
- Highlight: stark cold white shirt (#E8EBEE)
- Accent: saturated crimson digital glow from a phone screen (#FF1F2D / #D7232E)
- Subtle cyan ambient emergency-light tint

SUBJECT:
A single young adult figure (mid-twenties), gender-ambiguous, wearing a crisp clean white button-up shirt with a dark slim tie. Standing perfectly still, centered, slightly facing the camera, calm and motionless. The figure holds a modern smartphone vertically at face level. The phone's screen displays a stylized graphic-design pattern — fine geometric line-art rays radiating outward in a fractal sunburst — glowing a saturated crimson red. This stylized screen pattern softly covers the face area, acting like a graphic-design mask of red light lines. The pose is meditative, still, dreamlike. The crimson screen glow gently rims the chin, jawline, collar and the white shirt with elegant cinematic light; everything else falls into cold blue-gray depth.

ENVIRONMENT:
An empty school-style corridor at night, rows of dark lockers and identical doors receding into deep falloff darkness, distant cold-cyan lights at the far end, thin volumetric haze. Cold cyan ambient × crimson phone glow. Wide negative space.

TYPOGRAPHY (these EXACT strings must appear, legibly, no other text anywhere on the poster, no gibberish, no extra letters):
- Korean title: 기리고
   (rendered in extremely BOLD blocky modern sans-serif Korean letters, white, with a subtle red RGB chromatic-aberration design split on each character — looks like a stylized LCD effect)
- English title: IF WISHES COULD KILL
   (small, thin, uppercase, white, wide letterspacing, directly under the Korean title — this is the official series title)
- Korean tagline: 넌 있어? 죽도록 빌고 싶은 소원.
   (clean medium-size white Korean sans-serif — this is the official series tagline, render exactly as written)
- Date + platform line: 2026.04.24   N   ONLY ON NETFLIX
   (very small, white, all caps where Latin)

NEGATIVE: No extra text, no gibberish or garbled letters, no random English/Korean words, no other logos, no watermarks, no captions, no signature. No depiction of violence or injury. Only the four text blocks above and the stylized graphic figure described.
`.trim();

const PROMPT_VERTICAL = `${SHARED_STYLE}

COMPOSITION (vertical 2:3 portrait movie poster):
- Top third: massive '기리고' title centered, with 'IF WISHES COULD KILL' tracked underneath
- Middle two-thirds: the student figure with the cracked red phone-face, centered, framed by the dark corridor depth on both sides
- Bottom strip: tagline '넌 있어? 죽도록 빌고 싶은 소원.' and underneath the tiny '2026.04.24   N   ONLY ON NETFLIX' line
- Symmetrical, balanced, breathing room. A poster that could hang in a Seoul subway station and on Netflix's vertical tile.`.trim();

const PROMPT_HORIZONTAL = `${SHARED_STYLE}

COMPOSITION (horizontal 3:2 landscape billboard / Netflix TV home hero banner):
- RIGHT third of frame: the student figure with the cracked red phone-face, positioned at right, body slightly turned, framed by the corridor falloff. The red glow blooms toward the center of the frame.
- LEFT two-thirds: the deep empty corridor and dark negative space, used as a typographic canvas:
   • Large bold Korean title '기리고' set in the upper-left area
   • Just beneath, small tracked 'IF WISHES COULD KILL'
   • Below that, the tagline '넌 있어? 죽도록 빌고 싶은 소원.'
   • At the very bottom-left, the tiny '2026.04.24   N   ONLY ON NETFLIX' line
- Asymmetric, cinematic widescreen, generous negative space on the left to host typography.`.trim();

async function generate(label, prompt, size, outFile) {
  console.log(`\n[${label}] requesting gpt-image-1  size=${size}  quality=high ...`);
  const t0 = Date.now();
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
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
      path.join(OUT_DIR, "poster_main_vertical.png"),
    );
    await generate(
      "BILLBOARD",
      PROMPT_HORIZONTAL,
      "1536x1024",
      path.join(OUT_DIR, "poster_billboard_horizontal.png"),
    );
    console.log("\n[OK] all posters generated.");
  } catch (e) {
    console.error("\n[FAIL]", e.message);
    process.exit(1);
  }
})();
