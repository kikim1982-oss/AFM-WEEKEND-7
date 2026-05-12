// ============================================
// my-contents-app — Express + Postgres + JWT + TossPayments
// ============================================
require('dotenv').config();

const path = require('path');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const {
  PORT = 3001,
  DATABASE_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN = '7d',
  TOSS_CLIENT_KEY,
  TOSS_SECRET_KEY,
  NODE_ENV = 'development',
} = process.env;

if (!DATABASE_URL) {
  console.error('[FATAL] DATABASE_URL is not set in .env');
  process.exit(1);
}
if (!JWT_SECRET || JWT_SECRET.startsWith('dev_change_me')) {
  console.warn('[WARN] JWT_SECRET is using the default dev value. Replace it in production!');
}
if (!TOSS_CLIENT_KEY || !TOSS_SECRET_KEY) {
  console.warn('[WARN] TOSS keys are not set in .env');
}

// --------------------------------------------
// 상품 시드 — DB 첫 부팅 시 한 번만 INSERT (이후엔 DB가 진실)
// --------------------------------------------
const SEED_PRODUCTS = [
  { id: 'aurora-pack',   title: 'Aurora Pack',   tagline: '북유럽 오로라 일러스트',  description: '신비로운 오로라의 빛깔을 담은 고해상도 일러스트.', price: 4900, original_price: 9900,  category: '자연 · 풍경',  tag: '베스트', image_url: '/images/aurora-pack.png' },
  { id: 'sakura-bloom',  title: 'Sakura Bloom',  tagline: '벚꽃 흩날리는 봄날',     description: '부드러운 파스텔 핑크의 벚꽃 일러스트.',            price: 3900, original_price: 7900,  category: '자연 · 식물',  tag: '신상',   image_url: '/images/sakura-bloom.png' },
  { id: 'neon-city',     title: 'Neon City',     tagline: '사이버펑크 네온 야경',   description: '비 내리는 미래 도시.',                              price: 5900, original_price: 11900, category: '도시 · 미래',  tag: '인기',   image_url: '/images/neon-city.png' },
  { id: 'ocean-wave',    title: 'Ocean Wave',    tagline: '미니멀 푸른 파도',       description: '우키요에 스타일의 깔끔한 파도 일러스트.',           price: 3900, original_price: 6900,  category: '자연 · 바다',  tag: null,     image_url: '/images/ocean-wave.png' },
  { id: 'mountain-mist', title: 'Mountain Mist', tagline: '운무 낀 산 수채화',      description: '동양화 느낌의 안개 낀 산 수채화.',                   price: 4900, original_price: 8900,  category: '자연 · 풍경',  tag: null,     image_url: '/images/mountain-mist.png' },
  { id: 'galaxy-dust',   title: 'Galaxy Dust',   tagline: '우주 성운 그라데이션',   description: '깊은 보라와 핑크의 코스믹 그라데이션.',             price: 4900, original_price: 9900,  category: '우주 · 추상',  tag: '베스트', image_url: '/images/galaxy-dust.png' },
  { id: 'forest-zen',    title: 'Forest Zen',    tagline: '일본풍 대나무 숲',       description: '평온한 대나무 숲의 동양적 분위기.',                  price: 3900, original_price: 7900,  category: '자연 · 동양',  tag: null,     image_url: '/images/forest-zen.png' },
  { id: 'desert-sunset', title: 'Desert Sunset', tagline: '사막 일몰 그라데이션',   description: '따뜻한 오렌지·핑크의 사막 노을.',                    price: 4900, original_price: 8900,  category: '자연 · 풍경',  tag: null,     image_url: '/images/desert-sunset.png' },
  { id: 'crystal-gem',   title: 'Crystal Gem',   tagline: '영롱한 크리스탈',        description: '홀로그래픽 크리스탈 3D 렌더.',                       price: 6900, original_price: 12900, category: '오브제 · 럭셔리', tag: '인기',  image_url: '/images/crystal-gem.png' },
];

async function findProduct(id) {
  const r = await pool.query(`SELECT id, title, price FROM products WHERE id = $1`, [id]);
  return r.rowCount > 0 ? r.rows[0] : null;
}

// --------------------------------------------
// Postgres pool (Supabase pooler)
// --------------------------------------------
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

pool.on('error', (err) => {
  console.error('[pg pool error]', err);
});

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            BIGSERIAL PRIMARY KEY,
      email         VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id            BIGSERIAL PRIMARY KEY,
      order_id      VARCHAR(64) UNIQUE NOT NULL,
      user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id    VARCHAR(64) NOT NULL,
      amount        INTEGER NOT NULL,
      status        VARCHAR(16) NOT NULL DEFAULT 'PENDING',
      payment_key   VARCHAR(200),
      method        VARCHAR(32),
      approved_at   TIMESTAMPTZ,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS orders_user_idx ON orders (user_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS orders_user_paid_idx ON orders (user_id, product_id) WHERE status = 'PAID';`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id              VARCHAR(64) PRIMARY KEY,
      title           VARCHAR(200) NOT NULL,
      tagline         VARCHAR(300),
      description     TEXT,
      price           INTEGER NOT NULL,
      original_price  INTEGER,
      category        VARCHAR(100),
      tag             VARCHAR(40),
      image_url       TEXT NOT NULL,
      image_file_id   VARCHAR(100),
      is_active       BOOLEAN NOT NULL DEFAULT TRUE,
      sort_order      INTEGER NOT NULL DEFAULT 0,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS products_active_idx ON products (is_active, sort_order);`);

  // 시드 (id 충돌 시 무시 — 이미 있으면 그대로 유지)
  for (let i = 0; i < SEED_PRODUCTS.length; i++) {
    const p = SEED_PRODUCTS[i];
    await pool.query(
      `INSERT INTO products (id, title, tagline, description, price, original_price, category, tag, image_url, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (id) DO NOTHING`,
      [p.id, p.title, p.tagline, p.description, p.price, p.original_price, p.category, p.tag, p.image_url, i]
    );
  }

  console.log('[db] users + orders + products tables ready');
}

// --------------------------------------------
// JWT helpers
// --------------------------------------------
function signToken(user) {
  return jwt.sign(
    { sub: String(user.id), email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: '인증이 필요합니다.' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: Number(payload.sub), email: payload.email };
    next();
  } catch (_) {
    return res.status(401).json({ error: 'INVALID_TOKEN', message: '유효하지 않은 토큰입니다.' });
  }
}

// --------------------------------------------
// Validation
// --------------------------------------------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCredentials(email, password) {
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) return '올바른 이메일 형식이 아닙니다.';
  if (typeof password !== 'string' || password.length < 8) return '비밀번호는 최소 8자 이상이어야 합니다.';
  if (password.length > 128) return '비밀번호가 너무 깁니다.';
  return null;
}

// --------------------------------------------
// App
// --------------------------------------------
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname)));

// Health
app.get('/api/health', async (_req, res) => {
  try {
    const r = await pool.query('SELECT NOW() as now');
    res.json({ ok: true, db_time: r.rows[0].now });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 프론트가 사용할 공개 설정 (시크릿 절대 포함 금지)
app.get('/api/config', (_req, res) => {
  res.json({ tossClientKey: TOSS_CLIENT_KEY });
});

// 활성 상품 목록 (공개)
app.get('/api/products', async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, title, tagline, description, price, original_price, category, tag, image_url
       FROM products WHERE is_active = TRUE
       ORDER BY sort_order ASC, created_at ASC`
    );
    // 프론트가 쓰기 쉬운 카멜케이스로
    const products = r.rows.map((p) => ({
      id: p.id,
      title: p.title,
      tagline: p.tagline,
      description: p.description,
      price: p.price,
      originalPrice: p.original_price,
      category: p.category,
      tag: p.tag,
      previewUrl: p.image_url,
    }));
    res.json({ products });
  } catch (e) {
    console.error('[products list error]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: '상품 목록을 불러오지 못했습니다.' });
  }
});

// --------------------------------------------
// Auth
// --------------------------------------------
app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body || {};
  const err = validateCredentials(email, password);
  if (err) return res.status(400).json({ error: 'VALIDATION', message: err });

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const password_hash = await bcrypt.hash(password, 10);
    const insert = await pool.query(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at`,
      [normalizedEmail, password_hash]
    );
    const user = insert.rows[0];
    res.status(201).json({ token: signToken(user), user });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'EMAIL_TAKEN', message: '이미 가입된 이메일입니다.' });
    console.error('[signup error]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: '회원가입 중 오류가 발생했습니다.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'VALIDATION', message: '이메일과 비밀번호를 입력해주세요.' });
  }
  try {
    const r = await pool.query(
      `SELECT id, email, password_hash, created_at FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );
    if (r.rowCount === 0) return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    const row = r.rows[0];
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    const user = { id: row.id, email: row.email, created_at: row.created_at };
    res.json({ token: signToken(user), user });
  } catch (e) {
    console.error('[login error]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: '로그인 중 오류가 발생했습니다.' });
  }
});

app.get('/api/auth/me', authRequired, async (req, res) => {
  try {
    const r = await pool.query(`SELECT id, email, created_at FROM users WHERE id = $1`, [req.user.id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'NOT_FOUND', message: '사용자를 찾을 수 없습니다.' });
    res.json({ user: r.rows[0] });
  } catch (e) {
    console.error('[me error]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: '사용자 조회 중 오류가 발생했습니다.' });
  }
});

// --------------------------------------------
// Orders & Payments
// --------------------------------------------

// 결제 직전 — 주문 생성 (서버가 orderId와 금액의 진실)
app.post('/api/orders', authRequired, async (req, res) => {
  const { productId } = req.body || {};
  const product = await findProduct(productId);
  if (!product) return res.status(404).json({ error: 'PRODUCT_NOT_FOUND', message: '상품을 찾을 수 없습니다.' });

  try {
    // 이미 결제 완료된 상품 차단
    const dup = await pool.query(
      `SELECT 1 FROM orders WHERE user_id = $1 AND product_id = $2 AND status = 'PAID' LIMIT 1`,
      [req.user.id, productId]
    );
    if (dup.rowCount > 0) {
      return res.status(409).json({ error: 'ALREADY_PURCHASED', message: '이미 구매하신 상품입니다.' });
    }

    // orderId: 토스 권장 — 영문/숫자/하이픈, 6~64자
    const orderId = `${productId}-u${req.user.id}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const r = await pool.query(
      `INSERT INTO orders (order_id, user_id, product_id, amount, status)
       VALUES ($1, $2, $3, $4, 'PENDING')
       RETURNING order_id, amount`,
      [orderId, req.user.id, productId, product.price]
    );
    res.status(201).json({
      orderId: r.rows[0].order_id,
      amount: r.rows[0].amount,
      orderName: product.title,
    });
  } catch (e) {
    console.error('[create order error]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: '주문 생성에 실패했습니다.' });
  }
});

// 결제 승인 — 토스 confirm API 서버 호출 + 금액 검증
app.post('/api/payments/confirm', authRequired, async (req, res) => {
  const { paymentKey, orderId, amount } = req.body || {};
  if (!paymentKey || !orderId || amount == null) {
    return res.status(400).json({ error: 'VALIDATION', message: '결제 정보가 누락되었습니다.' });
  }

  try {
    // 1. 주문 조회
    const orderR = await pool.query(
      `SELECT id, user_id, product_id, amount, status FROM orders WHERE order_id = $1`,
      [orderId]
    );
    if (orderR.rowCount === 0) {
      return res.status(404).json({ error: 'ORDER_NOT_FOUND', message: '주문을 찾을 수 없습니다.' });
    }
    const order = orderR.rows[0];

    // 2. 소유권 검증
    if (Number(order.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: 'FORBIDDEN', message: '본인의 주문이 아닙니다.' });
    }

    // 3. 금액 검증 — 서버 측 가격과 일치해야 함 (변조 방지)
    if (Number(amount) !== Number(order.amount)) {
      return res.status(400).json({ error: 'AMOUNT_MISMATCH', message: '결제 금액이 일치하지 않습니다.' });
    }

    // 4. 멱등 처리 — 이미 승인된 주문이면 그대로 성공 반환
    if (order.status === 'PAID') {
      return res.json({
        alreadyPaid: true,
        order: { orderId, productId: order.product_id, amount: order.amount, status: 'PAID' },
      });
    }
    if (order.status !== 'PENDING') {
      return res.status(409).json({ error: 'INVALID_STATUS', message: '결제 가능한 상태가 아닙니다.' });
    }

    // 5. 토스 confirm 호출
    const basicAuth = Buffer.from(TOSS_SECRET_KEY + ':').toString('base64');
    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(order.amount) }),
    });
    const tossData = await tossRes.json();

    if (!tossRes.ok) {
      await pool.query(
        `UPDATE orders SET status = 'FAILED', updated_at = NOW() WHERE id = $1`,
        [order.id]
      );
      return res.status(tossRes.status || 400).json({
        error: tossData.code || 'PAYMENT_FAILED',
        message: tossData.message || '결제 승인이 실패했습니다.',
      });
    }

    // 6. 승인 성공 — 주문 갱신
    await pool.query(
      `UPDATE orders
       SET status = 'PAID', payment_key = $1, method = $2, approved_at = NOW(), updated_at = NOW()
       WHERE id = $3`,
      [paymentKey, tossData.method || null, order.id]
    );

    res.json({
      order: {
        orderId,
        productId: order.product_id,
        amount: order.amount,
        status: 'PAID',
      },
      method: tossData.method,
      approvedAt: tossData.approvedAt,
    });
  } catch (e) {
    console.error('[confirm error]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: '결제 승인 처리 중 오류가 발생했습니다.' });
  }
});

// 사용자의 구매(결제 완료) 목록
app.get('/api/purchases', authRequired, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT product_id, order_id, amount, method, approved_at
       FROM orders
       WHERE user_id = $1 AND status = 'PAID'
       ORDER BY approved_at DESC NULLS LAST`,
      [req.user.id]
    );
    res.json({
      productIds: r.rows.map((o) => o.product_id),
      orders: r.rows,
    });
  } catch (e) {
    console.error('[purchases error]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: '구매 내역 조회에 실패했습니다.' });
  }
});

// SPA fallback (해시 라우팅이지만 안전망)
app.get(/^\/(?!api\/).*/, (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --------------------------------------------
// Boot
// --------------------------------------------
(async () => {
  try {
    await initSchema();
    app.listen(PORT, () => {
      console.log(`[ready] http://localhost:${PORT}  (env=${NODE_ENV})`);
    });
  } catch (e) {
    console.error('[FATAL] failed to start:', e);
    process.exit(1);
  }
})();
