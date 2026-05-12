// ============================================
// my-contents-admin — 관리자 백엔드
// Express + Postgres (read-only on users/orders) + JWT (shared secret)
// ============================================
require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const ImageKit = require('imagekit');

const {
  PORT = 3002,
  DATABASE_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN = '7d',
  ADMIN_EMAILS = '',
  NODE_ENV = 'development',
  IMAGEKIT_PUBLIC_KEY,
  IMAGEKIT_PRIVATE_KEY,
  IMAGEKIT_URL_ENDPOINT,
} = process.env;

// --------------------------------------------
// Startup validation (warn but don't crash on missing optional values)
// --------------------------------------------
if (!DATABASE_URL) {
  console.warn('[WARN] DATABASE_URL is not set — DB queries will fail.');
}
if (!JWT_SECRET) {
  console.warn('[WARN] JWT_SECRET is not set — tokens cannot be verified.');
} else if (JWT_SECRET.startsWith('dev_change_me')) {
  console.warn('[WARN] JWT_SECRET is the default dev value. Replace in production.');
}
if (!ADMIN_EMAILS || !ADMIN_EMAILS.trim()) {
  console.warn('[WARN] ADMIN_EMAILS is empty — no user will be able to access admin endpoints.');
}

// --------------------------------------------
// ImageKit (이미지 업로드용)
// --------------------------------------------
let imagekit = null;
const imagekitConfigured =
  IMAGEKIT_PUBLIC_KEY && !IMAGEKIT_PUBLIC_KEY.includes('REPLACE') &&
  IMAGEKIT_PRIVATE_KEY && !IMAGEKIT_PRIVATE_KEY.includes('REPLACE') &&
  IMAGEKIT_URL_ENDPOINT && !IMAGEKIT_URL_ENDPOINT.includes('REPLACE');

if (imagekitConfigured) {
  imagekit = new ImageKit({
    publicKey: IMAGEKIT_PUBLIC_KEY,
    privateKey: IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: IMAGEKIT_URL_ENDPOINT,
  });
  console.log('[imagekit] initialized:', IMAGEKIT_URL_ENDPOINT);
} else {
  console.warn('[WARN] ImageKit keys are placeholder/missing — 이미지 업로드 기능이 비활성화됩니다.');
}

// 어드민 이메일 화이트리스트 (소문자/trim 정규화)
const ADMIN_EMAIL_SET = new Set(
  (ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
);
console.log(`[admin] ${ADMIN_EMAIL_SET.size}개의 관리자 이메일이 등록되었습니다:`, [...ADMIN_EMAIL_SET]);

// --------------------------------------------
// Postgres pool (Supabase pooler — SSL required)
// --------------------------------------------
const pool = new Pool({
  connectionString: (DATABASE_URL || '').trim(),
  ssl: { rejectUnauthorized: false },
  max: 10,
});

pool.on('error', (err) => {
  console.error('[pg pool error]', err);
});

// --------------------------------------------
// 안전 변환 — pg는 bigint/numeric을 문자열로 반환하므로 숫자로 변환
// --------------------------------------------
const toInt = (v) => {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

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
    req.user = { id: Number(payload.sub), email: String(payload.email || '').toLowerCase() };
    next();
  } catch (_) {
    return res.status(401).json({ error: 'INVALID_TOKEN', message: '유효하지 않은 토큰입니다.' });
  }
}

function isAdminEmail(email) {
  if (!email) return false;
  return ADMIN_EMAIL_SET.has(String(email).toLowerCase().trim());
}

function adminRequired(req, res, next) {
  if (!req.user || !isAdminEmail(req.user.email)) {
    return res.status(403).json({ error: 'NOT_ADMIN', message: '관리자 권한이 없습니다.' });
  }
  next();
}

// --------------------------------------------
// App
// --------------------------------------------
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname)));

// --------------------------------------------
// Public — Health
// --------------------------------------------
app.get('/api/health', async (_req, res) => {
  try {
    const r = await pool.query('SELECT NOW() as now');
    res.json({ ok: true, db_time: r.rows[0].now });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --------------------------------------------
// Public — Auth
// 메인 앱과 동일한 users 테이블·JWT_SECRET을 공유하므로
// 기존 사용자 로그인이 그대로 작동한다.
// 비관리자라도 로그인은 허용 (isAdmin: false). 권한 차단은 관리 라우트에서 수행.
// --------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'VALIDATION', message: '이메일과 비밀번호를 입력해주세요.' });
  }
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const r = await pool.query(
      `SELECT id, email, password_hash, created_at FROM users WHERE email = $1`,
      [normalizedEmail]
    );
    if (r.rowCount === 0) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }
    const row = r.rows[0];
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }
    const user = { id: row.id, email: row.email, created_at: row.created_at };
    const isAdmin = isAdminEmail(user.email);
    res.json({ token: signToken(user), user, isAdmin });
  } catch (e) {
    console.error('[login error]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: '로그인 중 오류가 발생했습니다.' });
  }
});

app.get('/api/auth/me', authRequired, async (req, res) => {
  try {
    const r = await pool.query(`SELECT id, email, created_at FROM users WHERE id = $1`, [req.user.id]);
    if (r.rowCount === 0) {
      return res.status(404).json({ error: 'NOT_FOUND', message: '사용자를 찾을 수 없습니다.' });
    }
    const user = r.rows[0];
    res.json({ user, isAdmin: isAdminEmail(user.email) });
  } catch (e) {
    console.error('[me error]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: '사용자 조회 중 오류가 발생했습니다.' });
  }
});

// --------------------------------------------
// Admin — 인증 + 어드민 권한 동시 적용
// --------------------------------------------
app.use('/api/admin', authRequired, adminRequired);

// 대시보드 통계
app.get('/api/admin/stats', async (_req, res) => {
  try {
    const [usersR, revenueR, paidR, pendingR, failedR, productSalesR] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS c FROM users`),
      pool.query(`SELECT COALESCE(SUM(amount), 0) AS s FROM orders WHERE status = 'PAID'`),
      pool.query(`SELECT COUNT(*) AS c FROM orders WHERE status = 'PAID'`),
      pool.query(`SELECT COUNT(*) AS c FROM orders WHERE status = 'PENDING'`),
      pool.query(`SELECT COUNT(*) AS c FROM orders WHERE status = 'FAILED'`),
      pool.query(`
        SELECT product_id, COUNT(*) AS sold_count, COALESCE(SUM(amount), 0) AS revenue
        FROM orders
        WHERE status = 'PAID'
        GROUP BY product_id
        ORDER BY revenue DESC
      `),
    ]);

    res.json({
      totalUsers: toInt(usersR.rows[0].c),
      totalRevenue: toInt(revenueR.rows[0].s),
      paidOrders: toInt(paidR.rows[0].c),
      pendingOrders: toInt(pendingR.rows[0].c),
      failedOrders: toInt(failedR.rows[0].c),
      productSales: productSalesR.rows.map((r) => ({
        productId: r.product_id,
        count: toInt(r.sold_count),
        revenue: toInt(r.revenue),
      })),
    });
  } catch (e) {
    console.error('[admin stats error]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: '통계 조회에 실패했습니다.' });
  }
});

// 페이지네이션 파라미터 헬퍼
function parsePagination(req, defaultLimit = 20, maxLimit = 200) {
  let limit = parseInt(req.query.limit, 10);
  let offset = parseInt(req.query.offset, 10);
  if (!Number.isFinite(limit) || limit <= 0) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;
  if (!Number.isFinite(offset) || offset < 0) offset = 0;
  return { limit, offset };
}

// 사용자 목록 (구매 횟수/누적 결제 금액 포함)
app.get('/api/admin/users', async (req, res) => {
  const { limit, offset } = parsePagination(req);
  try {
    const [usersR, totalR] = await Promise.all([
      pool.query(
        `SELECT u.id, u.email, u.created_at,
                COUNT(o.id) FILTER (WHERE o.status = 'PAID') AS purchase_count,
                COALESCE(SUM(o.amount) FILTER (WHERE o.status = 'PAID'), 0) AS total_spent
         FROM users u
         LEFT JOIN orders o ON o.user_id = u.id
         GROUP BY u.id
         ORDER BY u.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      pool.query(`SELECT COUNT(*) AS c FROM users`),
    ]);

    res.json({
      users: usersR.rows.map((u) => ({
        id: toInt(u.id),
        email: u.email,
        created_at: u.created_at,
        purchase_count: toInt(u.purchase_count),
        total_spent: toInt(u.total_spent),
      })),
      total: toInt(totalR.rows[0].c),
      limit,
      offset,
    });
  } catch (e) {
    console.error('[admin users error]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: '사용자 목록 조회에 실패했습니다.' });
  }
});

// 주문 목록 (선택적 status 필터)
const ALLOWED_STATUSES = new Set(['PAID', 'PENDING', 'FAILED']);
app.get('/api/admin/orders', async (req, res) => {
  const { limit, offset } = parsePagination(req);
  let status = req.query.status;
  if (status) {
    status = String(status).toUpperCase();
    if (!ALLOWED_STATUSES.has(status)) {
      return res.status(400).json({ error: 'VALIDATION', message: 'status는 PAID, PENDING, FAILED 중 하나여야 합니다.' });
    }
  } else {
    status = null;
  }

  try {
    const [ordersR, totalR] = await Promise.all([
      pool.query(
        `SELECT o.order_id, o.user_id, u.email AS user_email, o.product_id, o.amount,
                o.status, o.method, o.payment_key, o.approved_at, o.created_at
         FROM orders o
         JOIN users u ON u.id = o.user_id
         WHERE ($1::text IS NULL OR o.status = $1)
         ORDER BY o.created_at DESC
         LIMIT $2 OFFSET $3`,
        [status, limit, offset]
      ),
      pool.query(
        `SELECT COUNT(*) AS c FROM orders WHERE ($1::text IS NULL OR status = $1)`,
        [status]
      ),
    ]);

    res.json({
      orders: ordersR.rows.map((o) => ({
        order_id: o.order_id,
        user_id: toInt(o.user_id),
        user_email: o.user_email,
        product_id: o.product_id,
        amount: toInt(o.amount),
        status: o.status,
        method: o.method,
        payment_key: o.payment_key,
        approved_at: o.approved_at,
        created_at: o.created_at,
      })),
      total: toInt(totalR.rows[0].c),
      limit,
      offset,
    });
  } catch (e) {
    console.error('[admin orders error]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: '주문 목록 조회에 실패했습니다.' });
  }
});

// --------------------------------------------
// 상품 목록 (DB의 products + 판매 집계 조인)
// --------------------------------------------
app.get('/api/admin/products', async (_req, res) => {
  try {
    const [productsR, salesR] = await Promise.all([
      pool.query(
        `SELECT id, title, tagline, description, price, original_price, category, tag,
                image_url, image_file_id, is_active, sort_order, created_at, updated_at
         FROM products ORDER BY sort_order ASC, created_at ASC`
      ),
      pool.query(
        `SELECT product_id, COUNT(*) AS sold_count, COALESCE(SUM(amount), 0) AS revenue
         FROM orders WHERE status = 'PAID' GROUP BY product_id`
      ),
    ]);
    const salesMap = new Map();
    for (const row of salesR.rows) {
      salesMap.set(row.product_id, {
        soldCount: toInt(row.sold_count),
        revenue: toInt(row.revenue),
      });
    }
    const products = productsR.rows.map((p) => {
      const s = salesMap.get(p.id) || { soldCount: 0, revenue: 0 };
      return {
        id: p.id, title: p.title, tagline: p.tagline, description: p.description,
        price: toInt(p.price), originalPrice: p.original_price ? toInt(p.original_price) : null,
        category: p.category, tag: p.tag,
        imageUrl: p.image_url, imageFileId: p.image_file_id,
        isActive: p.is_active, sortOrder: toInt(p.sort_order),
        createdAt: p.created_at, updatedAt: p.updated_at,
        soldCount: s.soldCount, revenue: s.revenue,
      };
    });
    res.json({ products });
  } catch (e) {
    console.error('[admin products error]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: '상품 목록 조회에 실패했습니다.' });
  }
});

// 단일 상품 조회
app.get('/api/admin/products/:id', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, title, tagline, description, price, original_price, category, tag,
              image_url, image_file_id, is_active, sort_order, created_at, updated_at
       FROM products WHERE id = $1`,
      [req.params.id]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'NOT_FOUND', message: '상품을 찾을 수 없습니다.' });
    const p = r.rows[0];
    res.json({
      product: {
        id: p.id, title: p.title, tagline: p.tagline, description: p.description,
        price: toInt(p.price), originalPrice: p.original_price ? toInt(p.original_price) : null,
        category: p.category, tag: p.tag,
        imageUrl: p.image_url, imageFileId: p.image_file_id,
        isActive: p.is_active, sortOrder: toInt(p.sort_order),
      },
    });
  } catch (e) {
    console.error('[admin product get error]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: '조회 실패' });
  }
});

// 상품 등록
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function validateProductPayload(body) {
  const { id, title, price } = body || {};
  if (typeof id !== 'string' || !SLUG_RE.test(id) || id.length > 64) {
    return '상품 ID는 영문 소문자/숫자/하이픈만 사용 가능 (예: my-product).';
  }
  if (typeof title !== 'string' || !title.trim() || title.length > 200) {
    return '상품명을 입력해주세요 (최대 200자).';
  }
  const n = Number(price);
  if (!Number.isFinite(n) || n < 0 || n > 100000000) {
    return '가격은 0 이상의 숫자여야 합니다.';
  }
  return null;
}

app.post('/api/admin/products', async (req, res) => {
  const err = validateProductPayload(req.body);
  if (err) return res.status(400).json({ error: 'VALIDATION', message: err });

  const {
    id, title, tagline = null, description = null,
    price, originalPrice = null, category = null, tag = null,
    imageUrl, imageFileId = null,
  } = req.body;

  if (typeof imageUrl !== 'string' || !/^https?:\/\//.test(imageUrl)) {
    return res.status(400).json({ error: 'VALIDATION', message: '이미지 URL을 등록해주세요 (https://…).' });
  }

  try {
    // sort_order: 마지막 + 1
    const maxR = await pool.query(`SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM products`);
    const sortOrder = toInt(maxR.rows[0].next);

    const insert = await pool.query(
      `INSERT INTO products (id, title, tagline, description, price, original_price, category, tag,
                             image_url, image_file_id, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id`,
      [id, title.trim(), tagline, description, Number(price),
       originalPrice ? Number(originalPrice) : null,
       category, tag, imageUrl, imageFileId, sortOrder]
    );
    res.status(201).json({ id: insert.rows[0].id });
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'ID_TAKEN', message: '이미 사용 중인 상품 ID입니다.' });
    }
    console.error('[admin product create error]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: '상품 등록에 실패했습니다.' });
  }
});

// 상품 수정 (id는 변경 불가)
app.put('/api/admin/products/:id', async (req, res) => {
  const { title, price } = req.body || {};
  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'VALIDATION', message: '상품명은 필수입니다.' });
  }
  const n = Number(price);
  if (!Number.isFinite(n) || n < 0) {
    return res.status(400).json({ error: 'VALIDATION', message: '가격이 올바르지 않습니다.' });
  }
  const {
    tagline = null, description = null, originalPrice = null,
    category = null, tag = null, imageUrl, imageFileId = null,
    isActive,
  } = req.body;

  try {
    const r = await pool.query(
      `UPDATE products SET
         title = $2, tagline = $3, description = $4, price = $5, original_price = $6,
         category = $7, tag = $8,
         image_url = COALESCE($9, image_url),
         image_file_id = COALESCE($10, image_file_id),
         is_active = COALESCE($11, is_active),
         updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [req.params.id, title.trim(), tagline, description, n,
       originalPrice ? Number(originalPrice) : null,
       category, tag, imageUrl || null, imageFileId,
       typeof isActive === 'boolean' ? isActive : null]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'NOT_FOUND', message: '상품을 찾을 수 없습니다.' });
    res.json({ id: r.rows[0].id });
  } catch (e) {
    console.error('[admin product update error]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: '상품 수정에 실패했습니다.' });
  }
});

// 상품 비활성화 (소프트 삭제) — 결제 이력이 있을 수 있으므로 hard delete는 위험
app.delete('/api/admin/products/:id', async (req, res) => {
  try {
    const r = await pool.query(
      `UPDATE products SET is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING id`,
      [req.params.id]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'NOT_FOUND', message: '상품을 찾을 수 없습니다.' });
    res.json({ id: r.rows[0].id, isActive: false });
  } catch (e) {
    console.error('[admin product delete error]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: '상품 비활성화에 실패했습니다.' });
  }
});

// --------------------------------------------
// ImageKit — 클라이언트 직접 업로드용 인증 토큰 발급
// --------------------------------------------
app.get('/api/admin/imagekit/config', (_req, res) => {
  if (!imagekitConfigured) {
    return res.status(503).json({ error: 'IMAGEKIT_DISABLED', message: '서버에 ImageKit 키가 설정되어 있지 않습니다.' });
  }
  res.json({
    publicKey: IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: IMAGEKIT_URL_ENDPOINT,
  });
});

app.get('/api/admin/imagekit/auth', (_req, res) => {
  if (!imagekitConfigured) {
    return res.status(503).json({ error: 'IMAGEKIT_DISABLED', message: '서버에 ImageKit 키가 설정되어 있지 않습니다.' });
  }
  try {
    const params = imagekit.getAuthenticationParameters();
    res.json(params); // { token, expire, signature }
  } catch (e) {
    console.error('[imagekit auth error]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'ImageKit 인증 토큰 발급에 실패했습니다.' });
  }
});

// --------------------------------------------
// SPA fallback — index.html이 있으면 서빙, 없으면 안내 텍스트
// 프론트(single-react-dev)가 index.html을 만들기 전까지의 임시 응답
// --------------------------------------------
const indexHtmlPath = path.join(__dirname, 'index.html');
app.get(/^\/(?!api\/).*/, (_req, res) => {
  if (fs.existsSync(indexHtmlPath)) {
    return res.sendFile(indexHtmlPath);
  }
  res
    .status(200)
    .type('text/plain; charset=utf-8')
    .send('my-contents-admin: index.html 파일이 아직 없습니다. 프론트엔드 빌드 결과를 이 폴더에 배치하세요.');
});

// --------------------------------------------
// Boot
// --------------------------------------------
app.listen(PORT, () => {
  console.log(`[ready] http://localhost:${PORT}  (env=${NODE_ENV})`);
});
