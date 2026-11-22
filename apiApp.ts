import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import QRCode from 'qrcode';
import {
  DEFAULT_SITE_CONTENT,
  MINSORA_WHATSAPP_LOGO_URL,
  type ProductItem,
  type QuoteInquiry,
  type SiteContent,
} from './src/data/asasoraData.ts';

interface AdminCredentialRecord {
  adminEmail: string;
  passwordHash: string;
  claimedAt: string;
}

interface Admin2FAConfig {
  enabled: boolean;
  secretBase32: string;
  enabledAt?: string;
  recoveryCodeHashes: string[];
  lastVerifiedStep?: number;
}

interface PersistedStore {
  siteContent: SiteContent;
  inquiries: QuoteInquiry[];
  adminCredential: AdminCredentialRecord | null;
  adminTwoFactor: Admin2FAConfig | null;
}

interface ServerBackupPayload {
  siteContent: SiteContent;
  inquiries: QuoteInquiry[];
}

interface ServerBackupFile {
  id: string;
  version: 1;
  createdAt: string;
  createdBy: string;
  label: string;
  checksumSha256: string;
  payload: ServerBackupPayload;
}

interface ServerBackupSummary {
  id: string;
  createdAt: string;
  createdBy: string;
  label: string;
  checksumSha256: string;
  productsCount: number;
  inquiriesCount: number;
  sizeBytes: number;
}

interface Pending2FASetup {
  setupId: string;
  adminEmail: string;
  secretBase32: string;
  expiresAt: number;
}

interface AuthenticatedRequest extends Request {
  adminEmail?: string;
  authToken?: string;
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function resolveWritableDataDir(): string {
  if (process.env.DATA_DIR?.trim()) {
    return path.resolve(process.env.DATA_DIR.trim());
  }
  const localDataDir = path.resolve(process.cwd(), 'data');
  try {
    if (!fs.existsSync(localDataDir)) {
      fs.mkdirSync(localDataDir, { recursive: true, mode: 0o700 });
    }
    fs.accessSync(localDataDir, fs.constants.W_OK);
    return localDataDir;
  } catch {
    // Serverless environments (such as Netlify Functions) mount the code directory read-only
    return path.resolve(os.tmpdir(), 'asasora-data');
  }
}

const DATA_DIR = resolveWritableDataDir();
const STORE_PATH = path.resolve(DATA_DIR, 'store.json');
const BACKUPS_DIR = path.resolve(DATA_DIR, 'backups');
const SESSION_KEY_PATH = path.resolve(DATA_DIR, '.session.key');

if (
  !STORE_PATH.startsWith(DATA_DIR + path.sep) ||
  !BACKUPS_DIR.startsWith(DATA_DIR + path.sep) ||
  !SESSION_KEY_PATH.startsWith(DATA_DIR + path.sep)
) {
  throw new Error('Invalid data storage path configuration');
}

function ensurePrivateDirectories(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  }
  try {
    fs.chmodSync(DATA_DIR, 0o700);
  } catch {
    // Best effort on non-POSIX filesystems
  }
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true, mode: 0o700 });
  }
  try {
    fs.chmodSync(BACKUPS_DIR, 0o700);
  } catch {
    // Best effort
  }
}

function writeAtomicPrivateFile(targetPath: string, baseDir: string, content: string): void {
  const resolved = path.resolve(targetPath);
  if (!resolved.startsWith(baseDir + path.sep)) {
    throw new Error('Path traversal attempt blocked');
  }
  ensurePrivateDirectories();
  const tmpPath = path.resolve(
    baseDir,
    `.tmp.${process.pid}.${crypto.randomBytes(6).toString('hex')}`,
  );
  if (!tmpPath.startsWith(baseDir + path.sep)) {
    throw new Error('Invalid temp path');
  }
  fs.writeFileSync(tmpPath, content, { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(tmpPath, resolved);
  try {
    fs.chmodSync(resolved, 0o600);
  } catch {
    // Best effort
  }
}

function resolveSessionSecret(): string {
  const envSecret = process.env.SESSION_SECRET?.trim();
  if (envSecret) {
    return envSecret;
  }
  try {
    ensurePrivateDirectories();
    if (fs.existsSync(SESSION_KEY_PATH)) {
      const existing = fs.readFileSync(SESSION_KEY_PATH, 'utf8').trim();
      if (existing.length >= 32) {
        try {
          fs.chmodSync(SESSION_KEY_PATH, 0o600);
        } catch {
          // Best effort
        }
        return existing;
      }
    }
    const generated = crypto.randomBytes(32).toString('hex');
    writeAtomicPrivateFile(SESSION_KEY_PATH, DATA_DIR, generated);
    return generated;
  } catch {
    return crypto.randomBytes(32).toString('hex');
  }
}

const SESSION_SECRET = resolveSessionSecret();
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;
const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const SETUP_2FA_TTL_MS = 10 * 60 * 1000;

const revokedTokens = new Map<string, number>();
const consumedChallenges = new Map<string, number>();
const pending2FASetups = new Map<string, Pending2FASetup>();

interface RateBucket {
  count: number;
  resetAt: number;
}
const authBuckets = new Map<string, RateBucket>();
const inquiryBuckets = new Map<string, RateBucket>();
const apiBuckets = new Map<string, RateBucket>();

function pruneExpiredMaps(): void {
  const now = Date.now();
  for (const [k, exp] of revokedTokens.entries()) {
    if (now > exp) revokedTokens.delete(k);
  }
  for (const [k, exp] of consumedChallenges.entries()) {
    if (now > exp) consumedChallenges.delete(k);
  }
  for (const [k, setup] of pending2FASetups.entries()) {
    if (now > setup.expiresAt) pending2FASetups.delete(k);
  }
  for (const bucketMap of [authBuckets, inquiryBuckets, apiBuckets]) {
    for (const [ip, b] of bucketMap.entries()) {
      if (now > b.resetAt) bucketMap.delete(ip);
    }
  }
}

function checkRateLimit(
  bucketMap: Map<string, RateBucket>,
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  if (bucketMap.size > 2000) {
    pruneExpiredMaps();
  }
  const existing = bucketMap.get(key);
  if (!existing || now > existing.resetAt) {
    bucketMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }
  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  existing.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

function enforceAuthRateLimit(req: Request, res: Response): boolean {
  const ip = req.ip || 'unknown';
  const result = checkRateLimit(authBuckets, ip, 10, 15 * 60 * 1000);
  if (!result.allowed) {
    res.setHeader('Retry-After', String(result.retryAfterSec));
    res.status(429).json({
      error: `Too many authentication attempts. Please retry in ${result.retryAfterSec} seconds.`,
    });
    return false;
  }
  return true;
}

function ensureStore(): PersistedStore {
  ensurePrivateDirectories();
  if (!fs.existsSync(STORE_PATH)) {
    const initial: PersistedStore = {
      siteContent: DEFAULT_SITE_CONTENT,
      inquiries: [],
      adminCredential: null,
      adminTwoFactor: null,
    };
    writeAtomicPrivateFile(STORE_PATH, DATA_DIR, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    try {
      fs.chmodSync(STORE_PATH, 0o600);
    } catch {
      // Best effort on non-POSIX filesystems
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<PersistedStore>;
    const siteContent = parsed.siteContent
      ? {
          ...DEFAULT_SITE_CONTENT,
          ...parsed.siteContent,
          footer: {
            ...DEFAULT_SITE_CONTENT.footer,
            ...parsed.siteContent.footer,
          },
        }
      : DEFAULT_SITE_CONTENT;
    return {
      siteContent,
      inquiries: Array.isArray(parsed.inquiries) ? parsed.inquiries : [],
      adminCredential: parsed.adminCredential ?? null,
      adminTwoFactor: parsed.adminTwoFactor ?? null,
    };
  } catch {
    const fallback: PersistedStore = {
      siteContent: DEFAULT_SITE_CONTENT,
      inquiries: [],
      adminCredential: null,
      adminTwoFactor: null,
    };
    writeAtomicPrivateFile(STORE_PATH, DATA_DIR, JSON.stringify(fallback, null, 2));
    return fallback;
  }
}

function writeStore(store: PersistedStore): void {
  writeAtomicPrivateFile(STORE_PATH, DATA_DIR, JSON.stringify(store, null, 2));
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function hashSecretValue(value: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(value, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifySecretHash(value: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  if (!salt || !keyHex) return false;
  const derived = crypto.scryptSync(value, salt, 64);
  const storedBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derived, storedBuf);
}

function signSessionToken(
  adminEmail: string,
  purpose: 'admin_session' | '2fa_challenge',
  ttlMs: number,
): { token: string; expiresAt: number; jti: string } {
  const expiresAt = Date.now() + ttlMs;
  const jti = crypto.randomBytes(12).toString('hex');
  const payload = Buffer.from(
    JSON.stringify({ sub: adminEmail, purpose, exp: expiresAt, jti }),
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return { token: `${payload}.${sig}`, expiresAt, jti };
}

function verifySessionToken(
  token: string,
  expectedPurpose: 'admin_session' | '2fa_challenge',
): { sub: string; exp: number; jti: string } | null {
  if (!token || revokedTokens.has(token)) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  if (!payload || !sig) return null;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  if (!timingSafeStringEqual(sig, expectedSig)) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      sub?: string;
      purpose?: string;
      exp?: number;
      jti?: string;
    };
    if (
      !decoded.sub ||
      !decoded.jti ||
      decoded.purpose !== expectedPurpose ||
      typeof decoded.exp !== 'number' ||
      Date.now() > decoded.exp
    ) {
      return null;
    }
    if (expectedPurpose === '2fa_challenge' && consumedChallenges.has(decoded.jti)) {
      return null;
    }
    return { sub: decoded.sub, exp: decoded.exp, jti: decoded.jti };
  } catch {
    return null;
  }
}

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function generateBase32Secret(byteLength = 20): string {
  const bytes = crypto.randomBytes(byteLength);
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function decodeBase32(base32: string): Buffer {
  const clean = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function computeTotpCode(secretBase32: string, stepCounter: number): string {
  const key = decodeBase32(secretBase32);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(stepCounter));
  const hmac = crypto.createHmac('sha1', key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(binCode % 1_000_000).padStart(6, '0');
}

function verifyTotpWithReplayGuard(
  secretBase32: string,
  submittedCode: string,
  lastVerifiedStep?: number,
): { valid: boolean; matchedStep?: number } {
  const cleanCode = submittedCode.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleanCode)) {
    return { valid: false };
  }
  const currentStep = Math.floor(Date.now() / 30_000);
  for (let delta = -1; delta <= 1; delta += 1) {
    const candidateStep = currentStep + delta;
    if (candidateStep < 0) continue;
    const expected = computeTotpCode(secretBase32, candidateStep);
    if (timingSafeStringEqual(cleanCode, expected)) {
      if (typeof lastVerifiedStep === 'number' && candidateStep <= lastVerifiedStep) {
        return { valid: false };
      }
      return { valid: true, matchedStep: candidateStep };
    }
  }
  return { valid: false };
}

function generateRecoveryCodes(count = 6): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const raw = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${raw.slice(0, 4)}-${raw.slice(4, 8)}`);
  }
  return codes;
}

function verifyPasswordForActiveAdmin(email: string, password: string, store: PersistedStore): boolean {
  const envPassword = process.env.ADMIN_PASSWORD?.trim();
  const envEmail = (process.env.ADMIN_EMAIL?.trim() || 'admin@asasorafood.com').toLowerCase();

  if (envPassword) {
    return (
      timingSafeStringEqual(email.toLowerCase(), envEmail) &&
      timingSafeStringEqual(password, envPassword)
    );
  }
  if (!store.adminCredential) return false;
  return (
    timingSafeStringEqual(email.toLowerCase(), store.adminCredential.adminEmail.toLowerCase()) &&
    verifySecretHash(password, store.adminCredential.passwordHash)
  );
}

function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const token = authHeader.slice(7).trim();
  const verified = verifySessionToken(token, 'admin_session');
  if (!verified) {
    res.status(401).json({ error: 'Invalid or expired session token.' });
    return;
  }
  req.adminEmail = verified.sub;
  req.authToken = token;
  next();
}

function verifySameOriginOnMutations(req: Request, res: Response, next: NextFunction): void {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    next();
    return;
  }
  const origin = req.headers.origin;
  if (!origin) {
    next();
    return;
  }
  try {
    const parsedOrigin = new URL(origin);
    const normalizeHost = (h: string) => h.replace(/:(80|443)$/, '').toLowerCase();
    const originHost = normalizeHost(parsedOrigin.host);

    const allowedHosts = new Set<string>();
    const headerHost = normalizeHost(
      (req.get('x-forwarded-host') || req.get('host') || '').split(',')[0].trim(),
    );
    if (headerHost) {
      allowedHosts.add(headerHost);
    }

    for (const envUrl of [
      process.env.APP_URL,
      process.env.URL,
      process.env.DEPLOY_PRIME_URL,
      process.env.DEPLOY_URL,
    ]) {
      const trimmed = envUrl?.trim();
      if (trimmed && trimmed !== 'MY_APP_URL') {
        try {
          allowedHosts.add(normalizeHost(new URL(trimmed).host));
        } catch {
          // Ignore invalid URL env
        }
      }
    }

    if (!allowedHosts.has(originHost)) {
      res.status(403).json({ error: 'Cross-origin mutation rejected.' });
      return;
    }
    next();
  } catch {
    res.status(403).json({ error: 'Invalid request origin.' });
  }
}

function cleanText(value: unknown, fallback: string, maxLen: number, multiline = false): string {
  if (typeof value !== 'string') return fallback;
  const pattern = multiline
    ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
    : /[\u0000-\u001F\u007F]/g;
  const cleaned = value.replace(pattern, '').trim();
  if (!cleaned) return fallback;
  return cleaned.slice(0, maxLen);
}

function cleanOptionalText(
  value: unknown,
  fallback: string,
  maxLen: number,
  multiline = false,
): string {
  if (typeof value !== 'string') return fallback;
  const pattern = multiline
    ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
    : /[\u0000-\u001F\u007F]/g;
  return value.replace(pattern, '').trim().slice(0, maxLen);
}

function sanitizeSafeUrl(value: unknown, fallback = '#'): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 3_500_000) return fallback;
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    (trimmed.startsWith('/') && !trimmed.startsWith('//')) ||
    trimmed.startsWith('#') ||
    /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)
  ) {
    return trimmed;
  }
  return fallback;
}

function sanitizeVideoEmbedUrl(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  try {
    const parsed = new URL(trimmed);
    const allowedHosts = new Set([
      'www.youtube.com',
      'youtube.com',
      'www.youtube-nocookie.com',
      'player.vimeo.com',
    ]);
    if (parsed.protocol === 'https:' && allowedHosts.has(parsed.hostname)) {
      return parsed.toString();
    }
    return fallback;
  } catch {
    return fallback;
  }
}

const ALLOWED_PRODUCT_CATEGORIES = new Set<ProductItem['category']>([
  'Fruiting Veg',
  'Root & Tuber',
  'Ready-to-Eat',
  'Culinary Ingredients',
]);

function validateAndSanitizeSiteContent(raw: unknown): SiteContent | null {
  if (!raw || typeof raw !== 'object') return null;
  const input = raw as Partial<SiteContent>;
  if (!input.branding || !Array.isArray(input.products) || !Array.isArray(input.heroSlides)) {
    return null;
  }

  const def = DEFAULT_SITE_CONTENT;
  const aboutIn = input.about ?? def.about;
  const headersIn = input.sectionHeaders ?? def.sectionHeaders;
  const footerIn = input.footer ?? def.footer;

  const heroSlides = input.heroSlides.slice(0, 20).map((s, idx) => {
    const d = def.heroSlides[0];
    return {
      id: cleanText(s?.id, `slide-${idx + 1}`, 60),
      kicker: cleanText(s?.kicker, d.kicker, 140),
      title: cleanText(s?.title, d.title, 200),
      subtitle: cleanText(s?.subtitle, d.subtitle, 500, true),
      image: sanitizeSafeUrl(s?.image, d.image),
      imageAlt: cleanText(s?.imageAlt, d.imageAlt, 200),
    };
  });

  const gallery = (Array.isArray(input.gallery) ? input.gallery : def.gallery)
    .slice(0, 40)
    .map((g, idx) => {
      const d = def.gallery[0];
      return {
        id: cleanText(g?.id, `gal-${idx + 1}`, 60),
        title: cleanText(g?.title, d.title, 160),
        location: cleanText(g?.location, d.location, 140),
        image: sanitizeSafeUrl(g?.image, d.image),
      };
    });

  const products = input.products.slice(0, 100).map((p, idx) => {
    const d = def.products[0];
    const cat = ALLOWED_PRODUCT_CATEGORIES.has(p?.category as ProductItem['category'])
      ? (p.category as ProductItem['category'])
      : d.category;
    const specs = p?.specs ?? d.specs;
    return {
      id: cleanText(p?.id, `prod-${idx + 1}`, 60),
      name: cleanText(p?.name, d.name, 160),
      category: cat,
      shortDescription: cleanText(p?.shortDescription, d.shortDescription, 500, true),
      fullDescription: cleanText(p?.fullDescription, d.fullDescription, 1500, true),
      image: sanitizeSafeUrl(p?.image, d.image),
      specs: {
        dimensions: cleanText(specs?.dimensions, d.specs.dimensions, 120),
        materials: cleanText(specs?.materials, d.specs.materials, 120),
        color: cleanText(specs?.color, d.specs.color, 80),
        style: cleanText(specs?.style, d.specs.style, 80),
        capacity: cleanText(specs?.capacity, d.specs.capacity, 80),
        weight: cleanText(specs?.weight, d.specs.weight, 80),
        origin: cleanText(specs?.origin, d.specs.origin, 120),
        grade: cleanText(specs?.grade, d.specs.grade, 100),
      },
      fobEstimate: cleanText(p?.fobEstimate, d.fobEstimate, 80),
      seasonality: cleanText(p?.seasonality, d.seasonality, 80),
    };
  });

  const news = (Array.isArray(input.news) ? input.news : def.news).slice(0, 50).map((n, idx) => {
    const d = def.news[0];
    const bodyArr = Array.isArray(n?.body)
      ? n.body.slice(0, 20).map((b) => cleanOptionalText(b, '', 2000, true)).filter(Boolean)
      : d.body;
    return {
      id: cleanText(n?.id, `news-${idx + 1}`, 60),
      title: cleanText(n?.title, d.title, 200),
      category: cleanText(n?.category, d.category, 80),
      publishedAt: cleanText(n?.publishedAt, d.publishedAt, 60),
      readTime: cleanText(n?.readTime, d.readTime, 40),
      excerpt: cleanText(n?.excerpt, d.excerpt, 600, true),
      body: bodyArr.length > 0 ? bodyArr : d.body,
      image: sanitizeSafeUrl(n?.image, d.image),
    };
  });

  const team = (Array.isArray(input.team) ? input.team : def.team).slice(0, 30).map((m, idx) => {
    const d = def.team[0];
    return {
      id: cleanText(m?.id, `team-${idx + 1}`, 60),
      name: cleanText(m?.name, d.name, 120),
      role: cleanText(m?.role, d.role, 120),
      bio: cleanText(m?.bio, d.bio, 600, true),
      image: sanitizeSafeUrl(m?.image, d.image),
    };
  });

  if (heroSlides.length === 0 || products.length === 0) {
    return null;
  }

  return {
    branding: {
      brandName: cleanText(input.branding.brandName, def.branding.brandName, 100),
      logoUrl: sanitizeSafeUrl(input.branding.logoUrl, def.branding.logoUrl),
      ctaLabel: cleanText(input.branding.ctaLabel, def.branding.ctaLabel, 60),
    },
    heroCtaLabel: cleanText(input.heroCtaLabel, def.heroCtaLabel, 80),
    heroSlides,
    about: {
      kicker: cleanText(aboutIn.kicker, def.about.kicker, 120),
      heading: cleanText(aboutIn.heading, def.about.heading, 200),
      paragraphs: Array.isArray(aboutIn.paragraphs)
        ? aboutIn.paragraphs
            .slice(0, 10)
            .map((p) => cleanOptionalText(p, '', 1500, true))
            .filter(Boolean)
        : def.about.paragraphs,
      bannerImage: sanitizeSafeUrl(aboutIn.bannerImage, def.about.bannerImage),
      kpis: Array.isArray(aboutIn.kpis)
        ? aboutIn.kpis.slice(0, 6).map((k, idx) => ({
            value: cleanText(k?.value, def.about.kpis[idx]?.value ?? '100%', 60),
            label: cleanText(k?.label, def.about.kpis[idx]?.label ?? 'Standard', 80),
          }))
        : def.about.kpis,
      missionHeading: cleanText(aboutIn.missionHeading, def.about.missionHeading, 200),
      missionParagraphs: Array.isArray(aboutIn.missionParagraphs)
        ? aboutIn.missionParagraphs
            .slice(0, 10)
            .map((p) => cleanOptionalText(p, '', 1500, true))
            .filter(Boolean)
        : def.about.missionParagraphs,
      videoEmbedUrl: sanitizeVideoEmbedUrl(aboutIn.videoEmbedUrl, def.about.videoEmbedUrl),
      videoThumbnail: sanitizeSafeUrl(aboutIn.videoThumbnail, def.about.videoThumbnail),
    },
    sectionHeaders: {
      galleryKicker: cleanText(headersIn.galleryKicker, def.sectionHeaders.galleryKicker, 120),
      galleryHeading: cleanText(headersIn.galleryHeading, def.sectionHeaders.galleryHeading, 180),
      gallerySubtitle: cleanText(
        headersIn.gallerySubtitle,
        def.sectionHeaders.gallerySubtitle,
        400,
        true,
      ),
      productKicker: cleanText(headersIn.productKicker, def.sectionHeaders.productKicker, 120),
      productHeading: cleanText(headersIn.productHeading, def.sectionHeaders.productHeading, 180),
      productSubtitle: cleanText(
        headersIn.productSubtitle,
        def.sectionHeaders.productSubtitle,
        400,
        true,
      ),
      newsKicker: cleanText(headersIn.newsKicker, def.sectionHeaders.newsKicker, 120),
      newsHeading: cleanText(headersIn.newsHeading, def.sectionHeaders.newsHeading, 180),
      newsSubtitle: cleanText(headersIn.newsSubtitle, def.sectionHeaders.newsSubtitle, 400, true),
      teamKicker: cleanText(headersIn.teamKicker, def.sectionHeaders.teamKicker, 120),
      teamHeading: cleanText(headersIn.teamHeading, def.sectionHeaders.teamHeading, 180),
      teamSubtitle: cleanText(headersIn.teamSubtitle, def.sectionHeaders.teamSubtitle, 400, true),
    },
    gallery: gallery.length > 0 ? gallery : def.gallery,
    products,
    news: news.length > 0 ? news : def.news,
    team: team.length > 0 ? team : def.team,
    footer: {
      address: cleanText(footerIn.address, def.footer.address, 250),
      phone: cleanText(footerIn.phone, def.footer.phone, 50),
      email: cleanText(footerIn.email, def.footer.email, 160),
      deskSummary: cleanText(footerIn.deskSummary, def.footer.deskSummary, 500, true),
      facebookUrl: sanitizeSafeUrl(footerIn.facebookUrl, '#contact-section'),
      instagramUrl: sanitizeSafeUrl(footerIn.instagramUrl, '#contact-section'),
      youtubeUrl: sanitizeSafeUrl(footerIn.youtubeUrl, '#contact-section'),
      copyrightText: cleanText(footerIn.copyrightText, def.footer.copyrightText, 180),
      locationLabel: cleanText(footerIn.locationLabel, def.footer.locationLabel, 180),
      whatsappNumber: cleanOptionalText(
        footerIn.whatsappNumber,
        def.footer.whatsappNumber ?? def.footer.phone,
        50,
      ),
      whatsappLabel: cleanOptionalText(
        footerIn.whatsappLabel,
        def.footer.whatsappLabel ?? 'WhatsApp Admin',
        60,
      ),
      whatsappMessage: cleanOptionalText(
        footerIn.whatsappMessage,
        def.footer.whatsappMessage ?? '',
        400,
        true,
      ),
      whatsappIconUrl: sanitizeSafeUrl(footerIn.whatsappIconUrl, MINSORA_WHATSAPP_LOGO_URL),
    },
  };
}

function validateInquiriesArray(raw: unknown): QuoteInquiry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((i): i is Record<string, unknown> => Boolean(i && typeof i === 'object'))
    .slice(0, 500)
    .map((inq, idx) => {
      const status =
        inq.status === 'Quoted' || inq.status === 'Archived' ? inq.status : 'Pending';
      const items = Array.isArray(inq.items)
        ? inq.items
            .filter((it): it is Record<string, unknown> => Boolean(it && typeof it === 'object'))
            .slice(0, 50)
            .map((it) => ({
              productId: cleanText(it.productId, '', 80),
              productName: cleanText(it.productName, 'Product', 160),
              containers: Math.max(1, Math.min(100, Number(it.containers) || 1)),
              fobEstimate: cleanOptionalText(it.fobEstimate, '', 80),
            }))
        : [];
      return {
        id: cleanText(inq.id, `inq-restored-${idx}`, 80),
        referenceCode: cleanText(inq.referenceCode, `ASF-RESTORE-${idx}`, 60),
        submittedAt: cleanText(inq.submittedAt, new Date().toLocaleDateString('en-US'), 60),
        companyName: cleanText(inq.companyName, 'Imported Buyer', 160),
        email: cleanText(inq.email, 'buyer@example.com', 160),
        destinationPort: cleanText(inq.destinationPort, 'Rotterdam, NL (CIF)', 120),
        notes: cleanOptionalText(inq.notes, '', 1000, true),
        status,
        items,
      };
    });
}

function computeBackupChecksum(payload: ServerBackupPayload): string {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function resolveBackupFilePath(id: string): string | null {
  if (!/^[a-zA-Z0-9_-]{4,64}$/.test(id)) return null;
  const resolved = path.resolve(BACKUPS_DIR, `${id}.json`);
  if (!resolved.startsWith(BACKUPS_DIR + path.sep)) return null;
  return resolved;
}

function createServerBackup(
  store: PersistedStore,
  createdBy: string,
  label: string,
): ServerBackupSummary {
  ensurePrivateDirectories();
  const id = `bkp-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const filePath = resolveBackupFilePath(id);
  if (!filePath) {
    throw new Error('Failed to generate valid backup file path');
  }

  const payload: ServerBackupPayload = {
    siteContent: store.siteContent,
    inquiries: store.inquiries,
  };
  const checksumSha256 = computeBackupChecksum(payload);
  const backupFile: ServerBackupFile = {
    id,
    version: 1,
    createdAt: new Date().toISOString(),
    createdBy,
    label: cleanText(label, 'Manual Snapshot', 80),
    checksumSha256,
    payload,
  };

  const serialized = JSON.stringify(backupFile, null, 2);
  writeAtomicPrivateFile(filePath, BACKUPS_DIR, serialized);

  return {
    id: backupFile.id,
    createdAt: backupFile.createdAt,
    createdBy: backupFile.createdBy,
    label: backupFile.label,
    checksumSha256: backupFile.checksumSha256,
    productsCount: payload.siteContent.products.length,
    inquiriesCount: payload.inquiries.length,
    sizeBytes: Buffer.byteLength(serialized, 'utf8'),
  };
}

function listServerBackups(): ServerBackupSummary[] {
  ensurePrivateDirectories();
  const files = fs.readdirSync(BACKUPS_DIR).filter((f) => f.endsWith('.json'));
  const summaries: ServerBackupSummary[] = [];

  for (const filename of files) {
    const id = filename.replace(/\.json$/, '');
    const filePath = resolveBackupFilePath(id);
    if (!filePath) continue;
    try {
      const stat = fs.statSync(filePath);
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<ServerBackupFile>;
      if (!parsed.id || !parsed.payload?.siteContent) continue;
      summaries.push({
        id: parsed.id,
        createdAt: parsed.createdAt || stat.mtime.toISOString(),
        createdBy: parsed.createdBy || 'admin',
        label: parsed.label || 'Snapshot',
        checksumSha256: parsed.checksumSha256 || '',
        productsCount: Array.isArray(parsed.payload.siteContent.products)
          ? parsed.payload.siteContent.products.length
          : 0,
        inquiriesCount: Array.isArray(parsed.payload.inquiries)
          ? parsed.payload.inquiries.length
          : 0,
        sizeBytes: stat.size,
      });
    } catch {
      // Skip malformed files
    }
  }

  return summaries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createApiApp(): express.Express {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // Normalize Netlify Function proxy path if invoked directly as /.netlify/functions/api/*
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.url.startsWith('/.netlify/functions/api')) {
      const suffix = req.url.slice('/.netlify/functions/api'.length);
      req.url = `/api${suffix.startsWith('/') || suffix === '' || suffix.startsWith('?') ? suffix : `/${suffix}`}`;
    }
    next();
  });

  // HTTPS redirect & HSTS in production behind reverse proxy
  app.use((req: Request, res: Response, next: NextFunction) => {
    const proto = req.get('x-forwarded-proto');
    if (IS_PRODUCTION && proto === 'http') {
      const rawHost = (req.get('x-forwarded-host') || req.get('host') || '').split(',')[0].trim();
      if (/^[a-zA-Z0-9.-]+(?::\d+)?$/.test(rawHost)) {
        res.redirect(301, `https://${rawHost}${req.originalUrl}`);
        return;
      }
    }
    if (IS_PRODUCTION || proto === 'https' || req.secure) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  app.use(
    helmet({
      frameguard: false,
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false,
      hsts: false,
    }),
  );

  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown';
    const rate = checkRateLimit(apiBuckets, ip, 150, 60 * 1000);
    if (!rate.allowed) {
      res.setHeader('Retry-After', String(rate.retryAfterSec));
      res.status(429).json({ error: 'API rate limit exceeded. Please slow down.' });
      return;
    }
    next();
  });

  app.use('/api', verifySameOriginOnMutations);
  app.use('/api/admin', (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use('/api/inquiries', (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  app.use(express.json({ limit: '5mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, mode: IS_PRODUCTION ? 'production' : 'development' });
  });

  app.get('/api/admin/auth/status', (_req: Request, res: Response) => {
    const store = ensureStore();
    const envPassword = process.env.ADMIN_PASSWORD?.trim();
    const envEmail = process.env.ADMIN_EMAIL?.trim();
    const twoFactorEnabled = Boolean(store.adminTwoFactor?.enabled);

    if (envPassword) {
      res.json({
        configured: true,
        source: 'env',
        adminEmail: envEmail || 'admin@asasorafood.com',
        twoFactorEnabled,
      });
      return;
    }

    if (store.adminCredential) {
      res.json({
        configured: true,
        source: 'claimed',
        adminEmail: store.adminCredential.adminEmail,
        twoFactorEnabled,
      });
      return;
    }

    res.json({
      configured: false,
      source: 'unclaimed',
      adminEmail: envEmail || 'admin@asasorafood.com',
      twoFactorEnabled: false,
    });
  });

  app.post('/api/admin/auth/setup', (req: Request, res: Response) => {
    if (!enforceAuthRateLimit(req, res)) return;

    const envPassword = process.env.ADMIN_PASSWORD?.trim();
    if (envPassword) {
      res.status(403).json({ error: 'Admin password is already configured via environment.' });
      return;
    }

    const store = ensureStore();
    if (store.adminCredential) {
      res.status(403).json({ error: 'Admin account has already been claimed.' });
      return;
    }

    const body = req.body as { email?: unknown; password?: unknown };
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) {
      res.status(400).json({ error: 'Please provide a valid admin email address.' });
      return;
    }
    if (password.length < 8 || password.length > 128) {
      res.status(400).json({ error: 'Admin password must be between 8 and 128 characters.' });
      return;
    }

    store.adminCredential = {
      adminEmail: email,
      passwordHash: hashSecretValue(password),
      claimedAt: new Date().toISOString(),
    };
    writeStore(store);

    const { token, expiresAt } = signSessionToken(email, 'admin_session', TOKEN_TTL_MS);
    res.status(201).json({ token, adminEmail: email, expiresAt });
  });

  app.post('/api/admin/auth/login', (req: Request, res: Response) => {
    if (!enforceAuthRateLimit(req, res)) return;

    const body = req.body as { email?: unknown; password?: unknown };
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const store = ensureStore();
    const envPassword = process.env.ADMIN_PASSWORD?.trim();
    if (!envPassword && !store.adminCredential) {
      res.status(409).json({ error: 'Admin account has not been claimed yet.' });
      return;
    }

    if (!verifyPasswordForActiveAdmin(email, password, store)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const resolvedEmail = envPassword
      ? (process.env.ADMIN_EMAIL?.trim() || 'admin@asasorafood.com').toLowerCase()
      : store.adminCredential!.adminEmail;

    if (store.adminTwoFactor?.enabled && store.adminTwoFactor.secretBase32) {
      const challenge = signSessionToken(resolvedEmail, '2fa_challenge', CHALLENGE_TTL_MS);
      res.json({
        requires2fa: true,
        challengeToken: challenge.token,
        adminEmail: resolvedEmail,
      });
      return;
    }

    const { token, expiresAt } = signSessionToken(resolvedEmail, 'admin_session', TOKEN_TTL_MS);
    res.json({ token, adminEmail: resolvedEmail, expiresAt });
  });

  app.post('/api/admin/auth/login/2fa', (req: Request, res: Response) => {
    if (!enforceAuthRateLimit(req, res)) return;

    const body = req.body as { challengeToken?: unknown; code?: unknown };
    const challengeToken = typeof body.challengeToken === 'string' ? body.challengeToken.trim() : '';
    const code = typeof body.code === 'string' ? body.code.trim() : '';

    const verifiedChallenge = verifySessionToken(challengeToken, '2fa_challenge');
    if (!verifiedChallenge) {
      res.status(401).json({ error: '2FA challenge expired or invalid. Please sign in again.' });
      return;
    }

    const store = ensureStore();
    const twoFactor = store.adminTwoFactor;
    if (!twoFactor?.enabled || !twoFactor.secretBase32) {
      res.status(400).json({ error: 'Two-factor authentication is not enabled.' });
      return;
    }

    let verified = false;
    const totpCheck = verifyTotpWithReplayGuard(
      twoFactor.secretBase32,
      code,
      twoFactor.lastVerifiedStep,
    );
    if (totpCheck.valid && typeof totpCheck.matchedStep === 'number') {
      twoFactor.lastVerifiedStep = totpCheck.matchedStep;
      verified = true;
    } else {
      const normalizedRecovery = code.toUpperCase().replace(/\s+/g, '');
      const matchIndex = twoFactor.recoveryCodeHashes.findIndex((h) =>
        verifySecretHash(normalizedRecovery, h),
      );
      if (matchIndex !== -1) {
        twoFactor.recoveryCodeHashes.splice(matchIndex, 1);
        verified = true;
      }
    }

    if (!verified) {
      res.status(401).json({ error: 'Invalid 2FA verification code.' });
      return;
    }

    consumedChallenges.set(verifiedChallenge.jti, verifiedChallenge.exp);
    writeStore(store);

    const { token, expiresAt } = signSessionToken(
      verifiedChallenge.sub,
      'admin_session',
      TOKEN_TTL_MS,
    );
    res.json({ token, adminEmail: verifiedChallenge.sub, expiresAt });
  });

  app.get('/api/admin/auth/verify', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
    res.json({ authenticated: true, adminEmail: req.adminEmail });
  });

  app.post('/api/admin/auth/logout', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
    if (req.authToken) {
      const verified = verifySessionToken(req.authToken, 'admin_session');
      revokedTokens.set(req.authToken, verified?.exp ?? Date.now() + TOKEN_TTL_MS);
    }
    res.json({ ok: true });
  });

  app.get('/api/admin/2fa/status', requireAdminAuth, (_req: AuthenticatedRequest, res: Response) => {
    const store = ensureStore();
    res.json({
      enabled: Boolean(store.adminTwoFactor?.enabled),
      enabledAt: store.adminTwoFactor?.enabledAt ?? null,
      remainingRecoveryCodes: store.adminTwoFactor?.recoveryCodeHashes?.length ?? 0,
    });
  });

  app.post(
    '/api/admin/2fa/setup',
    requireAdminAuth,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const adminEmail = req.adminEmail || 'admin@asasorafood.com';
        const secretBase32 = generateBase32Secret(20);
        const setupId = crypto.randomBytes(16).toString('hex');
        const issuer = 'Asasora Food';
        const otpauthUri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(adminEmail)}?secret=${secretBase32}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

        pending2FASetups.set(setupId, {
          setupId,
          adminEmail,
          secretBase32,
          expiresAt: Date.now() + SETUP_2FA_TTL_MS,
        });

        const qrDataUrl = await QRCode.toDataURL(otpauthUri, {
          width: 220,
          margin: 2,
          color: { dark: '#1B3B2B', light: '#FAF9F6' },
        });

        res.json({
          setupId,
          qrDataUrl,
          manualSecret: secretBase32,
        });
      } catch (err) {
        next(err);
      }
    },
  );

  app.post('/api/admin/2fa/enable', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
    if (!enforceAuthRateLimit(req, res)) return;

    const body = req.body as { setupId?: unknown; code?: unknown };
    const setupId = typeof body.setupId === 'string' ? body.setupId.trim() : '';
    const code = typeof body.code === 'string' ? body.code.trim() : '';

    const pending = pending2FASetups.get(setupId);
    if (!pending || Date.now() > pending.expiresAt || pending.adminEmail !== req.adminEmail) {
      res.status(400).json({ error: '2FA setup session expired. Please generate a new QR code.' });
      return;
    }

    const totpCheck = verifyTotpWithReplayGuard(pending.secretBase32, code);
    if (!totpCheck.valid) {
      res.status(400).json({ error: 'The 6-digit code did not match. Verify device clock and retry.' });
      return;
    }

    const recoveryCodes = generateRecoveryCodes(6);
    const store = ensureStore();
    store.adminTwoFactor = {
      enabled: true,
      secretBase32: pending.secretBase32,
      enabledAt: new Date().toISOString(),
      recoveryCodeHashes: recoveryCodes.map((c) => hashSecretValue(c)),
      lastVerifiedStep: totpCheck.matchedStep,
    };
    writeStore(store);
    pending2FASetups.delete(setupId);

    res.json({
      enabled: true,
      enabledAt: store.adminTwoFactor.enabledAt,
      recoveryCodes,
    });
  });

  app.post('/api/admin/2fa/disable', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
    if (!enforceAuthRateLimit(req, res)) return;

    const body = req.body as { password?: unknown; code?: unknown };
    const password = typeof body.password === 'string' ? body.password : '';
    const code = typeof body.code === 'string' ? body.code.trim() : '';

    const store = ensureStore();
    if (!req.adminEmail || !verifyPasswordForActiveAdmin(req.adminEmail, password, store)) {
      res.status(401).json({ error: 'Current administrator password is incorrect.' });
      return;
    }

    const twoFactor = store.adminTwoFactor;
    if (!twoFactor?.enabled || !twoFactor.secretBase32) {
      res.json({ enabled: false });
      return;
    }

    const totpCheck = verifyTotpWithReplayGuard(
      twoFactor.secretBase32,
      code,
      twoFactor.lastVerifiedStep,
    );
    const normalizedRecovery = code.toUpperCase().replace(/\s+/g, '');
    const recoveryMatched = twoFactor.recoveryCodeHashes.some((h) =>
      verifySecretHash(normalizedRecovery, h),
    );

    if (!totpCheck.valid && !recoveryMatched) {
      res.status(401).json({ error: 'Valid 6-digit authenticator or recovery code required.' });
      return;
    }

    store.adminTwoFactor = null;
    writeStore(store);
    res.json({ enabled: false });
  });

  app.get('/api/site-content', (_req: Request, res: Response) => {
    const store = ensureStore();
    res.json(store.siteContent);
  });

  app.put('/api/site-content', requireAdminAuth, (req: Request, res: Response) => {
    const sanitized = validateAndSanitizeSiteContent(req.body);
    if (!sanitized) {
      res.status(400).json({ error: 'Invalid or incomplete site content payload.' });
      return;
    }

    const store = ensureStore();
    store.siteContent = sanitized;
    writeStore(store);
    res.json(store.siteContent);
  });

  app.post('/api/site-content/reset', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
    const store = ensureStore();
    createServerBackup(store, req.adminEmail || 'admin', 'Pre-Reset Auto Snapshot');
    store.siteContent = DEFAULT_SITE_CONTENT;
    writeStore(store);
    res.json(store.siteContent);
  });

  app.post('/api/inquiries', (req: Request, res: Response) => {
    const ip = req.ip || 'unknown';
    const rate = checkRateLimit(inquiryBuckets, ip, 10, 15 * 60 * 1000);
    if (!rate.allowed) {
      res.setHeader('Retry-After', String(rate.retryAfterSec));
      res.status(429).json({ error: 'Too many quote submissions. Please try again later.' });
      return;
    }

    const body = req.body as {
      companyName?: unknown;
      email?: unknown;
      destinationPort?: unknown;
      notes?: unknown;
      items?: unknown;
    };

    const companyName = cleanOptionalText(body.companyName, '', 160);
    const email = cleanOptionalText(body.email, '', 160);
    const destinationPort = cleanOptionalText(body.destinationPort, '', 120);
    const notes = cleanOptionalText(body.notes, '', 1000, true);

    if (!companyName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !destinationPort) {
      res.status(400).json({ error: 'Valid company name, email, and destination port are required.' });
      return;
    }

    const items = Array.isArray(body.items)
      ? body.items
          .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
          .slice(0, 50)
          .map((item) => ({
            productId: cleanOptionalText(item.productId, '', 80),
            productName: cleanText(item.productName, 'Product', 120),
            containers: Math.max(1, Math.min(100, Number(item.containers) || 1)),
            fobEstimate: cleanOptionalText(item.fobEstimate, '', 60),
          }))
      : [];

    const newInquiry: QuoteInquiry = {
      id: `inq-${Date.now()}`,
      referenceCode: `ASF-${new Date().getFullYear()}-${crypto.randomInt(1000, 9999)}`,
      submittedAt: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      companyName,
      email,
      destinationPort,
      notes,
      status: 'Pending',
      items,
    };

    const store = ensureStore();
    store.inquiries = [newInquiry, ...store.inquiries].slice(0, 500);
    writeStore(store);
    res.status(201).json(newInquiry);
  });

  app.get('/api/inquiries', requireAdminAuth, (_req: Request, res: Response) => {
    const store = ensureStore();
    res.json(store.inquiries);
  });

  app.patch('/api/inquiries/:id', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    if (!/^[a-zA-Z0-9_-]{3,80}$/.test(id)) {
      res.status(400).json({ error: 'Invalid inquiry identifier.' });
      return;
    }
    const body = req.body as { status?: unknown };
    if (body.status !== 'Pending' && body.status !== 'Quoted' && body.status !== 'Archived') {
      res.status(400).json({ error: 'Invalid status value.' });
      return;
    }

    const store = ensureStore();
    const found = store.inquiries.find((i) => i.id === id);
    if (!found) {
      res.status(404).json({ error: 'Inquiry not found.' });
      return;
    }

    found.status = body.status;
    writeStore(store);
    res.json(found);
  });

  app.delete('/api/inquiries/:id', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    if (!/^[a-zA-Z0-9_-]{3,80}$/.test(id)) {
      res.status(400).json({ error: 'Invalid inquiry identifier.' });
      return;
    }
    const store = ensureStore();
    store.inquiries = store.inquiries.filter((i) => i.id !== id);
    writeStore(store);
    res.json({ ok: true });
  });

  app.get('/api/admin/backups', requireAdminAuth, (_req: Request, res: Response) => {
    res.json(listServerBackups());
  });

  app.post('/api/admin/backups', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
    const body = req.body as { label?: unknown };
    const label = cleanText(body?.label, 'Manual Snapshot', 80);
    const store = ensureStore();
    const summary = createServerBackup(store, req.adminEmail || 'admin', label);
    res.status(201).json(summary);
  });

  app.get('/api/admin/backups/:id/download', requireAdminAuth, (req: Request, res: Response) => {
    const filePath = resolveBackupFilePath(req.params.id);
    if (!filePath || !fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Backup snapshot not found.' });
      return;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="asasora-${req.params.id}.json"`);
    res.send(raw);
  });

  app.post(
    '/api/admin/backups/:id/restore',
    requireAdminAuth,
    (req: AuthenticatedRequest, res: Response) => {
      const filePath = resolveBackupFilePath(req.params.id);
      if (!filePath || !fs.existsSync(filePath)) {
        res.status(404).json({ error: 'Backup snapshot not found.' });
        return;
      }

      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw) as Partial<ServerBackupFile>;
        if (!parsed.payload || !parsed.checksumSha256) {
          res.status(400).json({ error: 'Backup file structure is corrupted.' });
          return;
        }

        const expectedHash = computeBackupChecksum(parsed.payload);
        if (!timingSafeStringEqual(parsed.checksumSha256, expectedHash)) {
          res.status(422).json({ error: 'Backup checksum verification failed.' });
          return;
        }

        const sanitizedContent = validateAndSanitizeSiteContent(parsed.payload.siteContent);
        if (!sanitizedContent) {
          res.status(400).json({ error: 'Backup site content failed schema validation.' });
          return;
        }
        const sanitizedInquiries = validateInquiriesArray(parsed.payload.inquiries);

        const store = ensureStore();
        createServerBackup(store, req.adminEmail || 'admin', `Auto-Backup before restore (${req.params.id})`);

        store.siteContent = sanitizedContent;
        store.inquiries = sanitizedInquiries;
        writeStore(store);

        res.json({
          siteContent: store.siteContent,
          inquiries: store.inquiries,
          backups: listServerBackups(),
        });
      } catch {
        res.status(400).json({ error: 'Unable to parse or verify backup snapshot.' });
      }
    },
  );

  app.delete('/api/admin/backups/:id', requireAdminAuth, (req: Request, res: Response) => {
    const filePath = resolveBackupFilePath(req.params.id);
    if (!filePath || !fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Backup snapshot not found.' });
      return;
    }
    fs.unlinkSync(filePath);
    res.json({ ok: true });
  });

  app.post('/api/admin/restore-json', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
    const body = req.body as Record<string, unknown> | null;
    if (!body || typeof body !== 'object') {
      res.status(400).json({ error: 'Invalid JSON payload.' });
      return;
    }

    const rawPayload =
      body.payload && typeof body.payload === 'object'
        ? (body.payload as Record<string, unknown>)
        : body;

    const candidateContent = rawPayload.siteContent ?? rawPayload;
    const sanitizedContent = validateAndSanitizeSiteContent(candidateContent);
    if (!sanitizedContent) {
      res.status(400).json({ error: 'Uploaded JSON does not match valid Asasora Food CMS structure.' });
      return;
    }

    const store = ensureStore();
    createServerBackup(store, req.adminEmail || 'admin', 'Auto-Backup before JSON upload restore');

    store.siteContent = sanitizedContent;
    if (Array.isArray(rawPayload.inquiries)) {
      store.inquiries = validateInquiriesArray(rawPayload.inquiries);
    }
    writeStore(store);

    res.json({
      siteContent: store.siteContent,
      inquiries: store.inquiries,
      backups: listServerBackups(),
    });
  });

  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found.' });
  });

  return app;
}

export function attachGlobalErrorHandler(app: express.Express): void {
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status =
      typeof err === 'object' &&
      err !== null &&
      'status' in err &&
      typeof (err as { status?: unknown }).status === 'number'
        ? (err as { status: number }).status
        : 500;
    if (status === 400) {
      res.status(400).json({ error: 'Malformed JSON request body.' });
      return;
    }
    if (status === 413) {
      res.status(413).json({ error: 'Payload exceeds maximum allowed size (5 MB).' });
      return;
    }
    res.status(500).json({ error: 'Internal server error.' });
  });
}
