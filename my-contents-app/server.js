// ============================================
// my-contents-app — Express + Postgres + JWT 인증 서버
// ============================================
require('dotenv').config();

const path = require('path');
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
  NODE_ENV = 'development',
} = process.env;

if (!DATABASE_URL) {
  console.error('[FATAL] DATABASE_URL is not set in .env');
  process.exit(1);
}
if (!JWT_SECRET || JWT_SECRET.startsWith('dev_change_me')) {
  console.warn('[WARN] JWT_SECRET is using the default dev value. Replace it in production!');
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
  console.log('[db] users table ready');
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
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return '올바른 이메일 형식이 아닙니다.';
  }
  if (typeof password !== 'string' || password.length < 8) {
    return '비밀번호는 최소 8자 이상이어야 합니다.';
  }
  if (password.length > 128) {
    return '비밀번호가 너무 깁니다.';
  }
  return null;
}

// --------------------------------------------
// App
// --------------------------------------------
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Static frontend (index.html과 같은 디렉토리 서빙)
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

// --------------------------------------------
// POST /api/auth/signup
// --------------------------------------------
app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body || {};
  const err = validateCredentials(email, password);
  if (err) return res.status(400).json({ error: 'VALIDATION', message: err });

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const password_hash = await bcrypt.hash(password, 10);

    const insert = await pool.query(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, created_at`,
      [normalizedEmail, password_hash]
    );
    const user = insert.rows[0];
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'EMAIL_TAKEN', message: '이미 가입된 이메일입니다.' });
    }
    console.error('[signup error]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: '회원가입 중 오류가 발생했습니다.' });
  }
});

// --------------------------------------------
// POST /api/auth/login
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
    const token = signToken(user);
    res.json({ token, user });
  } catch (e) {
    console.error('[login error]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: '로그인 중 오류가 발생했습니다.' });
  }
});

// --------------------------------------------
// GET /api/auth/me
// --------------------------------------------
app.get('/api/auth/me', authRequired, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, email, created_at FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (r.rowCount === 0) {
      return res.status(404).json({ error: 'NOT_FOUND', message: '사용자를 찾을 수 없습니다.' });
    }
    res.json({ user: r.rows[0] });
  } catch (e) {
    console.error('[me error]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: '사용자 조회 중 오류가 발생했습니다.' });
  }
});

// SPA fallback (해시 라우팅이라 굳이 필요 없지만 안전망)
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
