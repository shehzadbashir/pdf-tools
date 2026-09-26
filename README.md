# PDF Tools — 14 PDF utilities that run entirely in the browser

Merge, split, organise, compress, convert (Word/Excel/JPG), watermark, sign, protect, unlock and OCR PDF files. Every tool runs as JavaScript **inside the visitor's browser** — file contents are never uploaded to a server, so the site stays useful, private and cheap to run.

- Stack: Vite 8 · React 19 · TypeScript 6 · Tailwind CSS 4 · react-router 7 · i18next (English / اردو / العربية with RTL)
- Processing: `pdf-lib`, `pdf-lib-encrypt`, `pdfjs-dist`, `mammoth`, `docx`, `xlsx`, `tesseract.js`, `html2canvas`
- Hosting: Cloudflare Pages (static build) + Pages Functions (`/api/*`) + D1 (optional account/history)
- Domain: **https://shehzadbashir.xyz**

---

## 1. Local development

```bash
npm install
npm run dev          # frontend only  → http://localhost:5173
```

To also run the `/api/*` functions locally (Google sign-in + history sync):

```bash
cp .dev.vars.example .dev.vars      # then edit SESSION_SECRET
npm run db:migrate:local            # one-off: creates the local D1 schema
npm run dev:server                  # builds, then serves dist/ with wrangler
```

Checks:

```bash
npm run build        # tsc -b (app + config + functions) && vite build
npm run lint         # oxlint
npm run check:i18n   # en/ur/ar key parity + unresolved t() keys
```

---

## 2. Configuration — `src/config/site.ts`

| Field | What to set |
| --- | --- |
| `url` | ✅ already `https://shehzadbashir.xyz` (no trailing slash). Drives canonical/OG tags, sitemap, robots. |
| `googleSearchConsoleVerification` | Optional — from Google Search Console. |
| `adsenseClient` | e.g. `ca-pub-1234567890123456`. Leave `''` and ad slots render as labelled placeholders. |
| `cloudflareAnalyticsToken` | Web Analytics beacon token (Cloudflare dashboard → Web Analytics). |
| `googleOAuthClientId` | Google OAuth Client ID. Leave `''` and the sign-in button is not rendered at all. |
| `maxUploadMb` | Client-side size guard (default 200). |

Nothing else in the frontend needs editing for a deploy.

---

## 3. Deploy to Cloudflare Pages

### 3.1 Create the project

**Option A — Git integration (recommended)**

1. Push this folder to GitHub/GitLab.
2. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → connect the repo.
3. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node version: 18+ (defaults are fine)

**Option B — Direct upload from this machine**

```bash
npm run deploy          # = npm run build && wrangler pages deploy dist
```

Either way the project is reachable at `https://pdf-tools.pages.dev` immediately — that URL is enough to test before touching DNS.

### 3.2 Attach your domain

1. Cloudflare dashboard → your Pages project → **Custom domains** → **Set up a custom domain**.
2. Add `https://shehzadbashir.xyz` (and `https://www.shehzadbashir.xyz` if you want it). Because the zone is already on Cloudflare, the DNS record and TLS certificate are created automatically.
3. (Optional) Make one hostname canonical in **Custom domains → ... → Set as primary** so the other 301s to it.

The site is now online 24/7 on Cloudflare's edge — no PC, tunnel or origin server involved.

---

## 4. Database (only needed for Google sign-in + synced history)

Everything works without this: history falls back to `localStorage`.

```bash
npx wrangler d1 create pdf-tools
# → copy the printed database_id into wrangler.toml (database_id = "...")

npm run db:migrate       # applies migrations/0001_init.sql remotely
```

| Binding | Where |
| --- | --- |
| `DB` | `wrangler.toml` → `[[d1_databases]]` |

---

## 5. Google sign-in

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → **Create credentials → OAuth client ID → Web application**.
   - Authorized JavaScript origin: `https://shehzadbashir.xyz` (and `https://pdf-tools.pages.dev` while testing)
   - Authorized redirect URI: `https://shehzadbashir.xyz/` (GIS button does not redirect, but Google requires one)
2. Put the client id in **both** places:
   - `src/config/site.ts` → `googleOAuthClientId`
   - `wrangler.toml` → `[vars] GOOGLE_CLIENT_ID`
3. Create the session secret and the database (§4):

```bash
npx wrangler pages secret put SESSION_SECRET   # any long random string, e.g. openssl rand -hex 32
```

4. Redeploy (`npm run deploy`).

API surface (`functions/`):

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/me` | GET | Returns `{ user }` from the session cookie |
| `/api/auth/google` | POST | Verifies the Google ID token, upserts the user, sets the session cookie |
| `/api/auth/logout` | POST | Clears the session cookie |
| `/api/history` | GET / POST / DELETE | Per-user tool history (names + sizes only, capped at 200 rows) |

Sessions are HS256 JWTs signed with `SESSION_SECRET` (`server/shared.ts`), `HttpOnly; Secure; SameSite=Lax`, 30 days. **Files are never sent to these endpoints.**

---

## 6. Ads (optional)

1. Get approved for AdSense for `shehzadbashir.xyz`.
2. Set `adsenseClient: 'ca-pub-…'` in `src/config/site.ts` and redeploy.
3. `src/components/AdSlot.tsx` injects the AdSense script on first render and fills every reserved slot (`horizontal` on tool pages, `rectangle` in the sidebar/home). The script id/slot numbers are currently `data-ad-slot=""` — paste your real slot ids there when AdSense gives them to you.

---

## 7. Project layout

```
src/
  config/site.ts        single source of truth for URL, ads, OAuth
  i18n/                 en.ts (source of truth) → ur.ts, ar.ts (typed Dict)
  lib/                  all PDF logic — runs in the browser
    ops.ts              merge / split / organise / watermark / page numbers
    compress.ts         re-render + recompress strategy
    secure.ts           protect (pdf-lib-encrypt) / unlock (2 strategies)
    convert.ts          pdf→images/docx/xlsx, images→pdf, docx→pdf
    ocr.ts              tesseract text, DOCX, searchable PDF
    esign.ts            signature pad → PNG, preview, annotations, export
  tools/registry.ts     14 tool definitions (slug, category, icon, lazy page)
  tools/pages/          one component per tool
  pages/                Home, History, Legal, NotFound
  auth/AuthProvider.tsx Google GIS loader + /api session state
functions/api/          Pages Functions (Cloudflare)
server/shared.ts        session JWT, Google JWKS verification, D1 helpers
migrations/             SQL schema
scripts/check-i18n.mjs  translation parity check
```

Routing is generated from `TOOLS` in `src/tools/registry.ts`; `vite.config.ts` emits `dist/sitemap.xml` and `dist/robots.txt` from `TOOL_SLUGS` in `src/config/site.ts` — keep the two lists in sync when adding a tool.

---

## 8. Adding a tool

1. Add the slug to `TOOL_SLUGS` in `src/config/site.ts`.
2. Add an entry to `TOOLS` in `src/tools/registry.ts` with `lazy(() => import('./pages/YourTool'))`.
3. Create `src/tools/pages/YourTool.tsx` using `useToolRunner()` + `<Results />`.
4. Add `tools.<slug>.{name, short, long, steps, ui…}` to `src/i18n/en.ts`, then translate into `ur.ts`/`ar.ts` (both are typed as `Dict`, so a missing key is a compile error) and run `npm run check:i18n`.

---

## 9. Known limits (by design)

- **Compression** re-renders pages at a lower DPI — it shrinks scans/vector-heavy files well, but a text-only PDF is already near-optimal.
- **PDF → Word/Excel** reconstructs layout from the text layer; complex multi-column documents are approximate. Scanned files → use OCR first.
- **Protect** uses AES-256/RC4 via `pdf-lib-encrypt`; files with compressed object streams are rejected with a clear message (re-export from your editor, or use Unlock's pdf.js fallback path).
- **OCR** downloads Tesseract language data from a CDN on first use; Urdu/Arabic get text/DOCX output but **not** searchable-PDF (Helvetica cannot encode those glyphs).
- Practical upload ceiling is device memory, ~200 MB (`maxUploadMb`).
