// ============================================
// 기존 9개 로컬 PNG → ImageKit 업로드 + products.image_url 갱신
// 한 번만 실행하면 됨. 멱등성: 동일 fileName으로 overwrite 옵션 사용.
//   node migrate-images.js
// ============================================
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const ImageKit = require('imagekit');

const {
  DATABASE_URL,
  IMAGEKIT_PUBLIC_KEY,
  IMAGEKIT_PRIVATE_KEY,
  IMAGEKIT_URL_ENDPOINT,
} = process.env;

if (!DATABASE_URL) { console.error('DATABASE_URL missing'); process.exit(1); }
if (!IMAGEKIT_PRIVATE_KEY || IMAGEKIT_PRIVATE_KEY.includes('REPLACE')) {
  console.error('ImageKit keys missing'); process.exit(1);
}

const imagekit = new ImageKit({
  publicKey: IMAGEKIT_PUBLIC_KEY,
  privateKey: IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: IMAGEKIT_URL_ENDPOINT,
});

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// 9개 슬러그 — 파일명도 동일
const PRODUCT_IDS = [
  'aurora-pack', 'sakura-bloom', 'neon-city', 'ocean-wave',
  'mountain-mist', 'galaxy-dust', 'forest-zen', 'desert-sunset', 'crystal-gem',
];

// 로컬 이미지 폴더 (sibling my-contents-app)
const IMAGES_DIR = path.join(__dirname, '..', 'my-contents-app', 'images');

(async () => {
  console.log(`[migrate] source: ${IMAGES_DIR}`);
  console.log(`[migrate] target: ${IMAGEKIT_URL_ENDPOINT}/products/`);
  console.log('');

  let success = 0, skipped = 0, failed = 0;

  for (const id of PRODUCT_IDS) {
    const localPath = path.join(IMAGES_DIR, `${id}.png`);

    if (!fs.existsSync(localPath)) {
      console.log(`[skip] ${id} — 파일 없음 (${localPath})`);
      skipped++;
      continue;
    }

    // 이미 ImageKit URL로 바뀐 상품은 건너뜀 (재실행 안전성)
    const existing = await pool.query(
      `SELECT image_url FROM products WHERE id = $1`,
      [id]
    );
    if (existing.rowCount === 0) {
      console.log(`[skip] ${id} — DB에 없음`);
      skipped++;
      continue;
    }
    if (existing.rows[0].image_url && existing.rows[0].image_url.startsWith('http')) {
      console.log(`[skip] ${id} — 이미 외부 URL: ${existing.rows[0].image_url}`);
      skipped++;
      continue;
    }

    try {
      console.log(`[upload] ${id}.png …`);
      const buffer = fs.readFileSync(localPath);
      const upload = await imagekit.upload({
        file: buffer,
        fileName: `${id}.png`,
        folder: '/products',
        useUniqueFileName: false,
        overwriteFile: true,
      });

      await pool.query(
        `UPDATE products
         SET image_url = $1, image_file_id = $2, updated_at = NOW()
         WHERE id = $3`,
        [upload.url, upload.fileId, id]
      );

      console.log(`   → ${upload.url}`);
      success++;
    } catch (e) {
      console.error(`[fail] ${id}: ${e.message}`);
      failed++;
    }
  }

  console.log('');
  console.log(`결과: 성공 ${success}, 스킵 ${skipped}, 실패 ${failed}`);
  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
})();
