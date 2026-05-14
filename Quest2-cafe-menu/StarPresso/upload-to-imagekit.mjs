import { readFile } from "node:fs/promises";
import { basename } from "node:path";

const PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error("IMAGEKIT_PRIVATE_KEY env not set");
  process.exit(1);
}

const FILES = [
  "drink-01_americano.png",
  "drink-02_cafe-latte.png",
  "drink-03_caramel-macchiato.png",
  "drink-04_dolce-latte.png",
  "drink-05_cold-brew.png",
  "drink-06_vanilla-latte.png",
  "drink-07_grapefruit-ade.png",
  "drink-08_lime-mint-sparkler.png",
  "drink-09_mango-juice.png",
  "drink-10_grapefruit-honey-tea.png",
  "drink-11_java-chip-frappuccino.png",
  "drink-12_caramel-frappuccino.png",
  "drink-13_jeju-matcha-frappuccino.png",
  "drink-14_strawberry-yogurt-smoothie.png",
  "starpresso-logo-male-v2_4.png",
  "starpresso-store-exterior_4.png",
];

const FOLDER = "/starpresso";
const AUTH = "Basic " + Buffer.from(PRIVATE_KEY + ":").toString("base64");

async function uploadOne(filename) {
  const buf = await readFile(filename);
  const fd = new FormData();
  fd.append("file", new Blob([buf]), filename);
  fd.append("fileName", filename);
  fd.append("folder", FOLDER);
  fd.append("useUniqueFileName", "false");
  fd.append("overwriteFile", "true");

  const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    headers: { Authorization: AUTH },
    body: fd,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`${filename}: ${res.status} ${JSON.stringify(json)}`);
  }
  return json.url;
}

const results = {};
for (const f of FILES) {
  try {
    const url = await uploadOne(f);
    results[f] = url;
    console.log(`OK  ${f} -> ${url}`);
  } catch (e) {
    console.error(`ERR ${f}: ${e.message}`);
    process.exitCode = 1;
  }
}

console.log("\n=== SUMMARY ===");
console.log(JSON.stringify(results, null, 2));
