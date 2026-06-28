# OpnForm Technical Docs — Use Reference

> Source: https://docs.opnform.com (captured 2026-06-28)
> Scope: All technical-documentation pages (Get Started → Embedding). For end-user feature guides see https://help.opnform.com.

OpnForm is an open-source (AGPLv3) form builder. Core/self-hosted is free; advanced workspace features require a self-hosted **Enterprise license** (free self-hosted is capped at **2 users**, including OIDC-provisioned users).

## Index

| Section | Page | URL |
|---------|------|-----|
| Get Started | Introduction | `/introduction` |
| Get Started | Tech Stack | `/tech-stack` |
| Features | Computed Variables | `/features/computed-variables` |
| Deployment | Docker Deployment | `/deployment/docker` |
| Deployment | Docker Development Setup | `/deployment/docker-development` |
| Deployment | Local Deployment | `/deployment/local-deployment` |
| Deployment | Cloud vs Self-Hosting | `/deployment/cloud-vs-self-hosting` |
| Deployment | Self-hosted License | `/deployment/self-hosted-license` |
| Deployment | License Activation | `/deployment/license-activation` |
| Enterprise | Workspace Custom SMTP | `/deployment/enterprise-features/workspace-custom-smtp` |
| Enterprise | Single Sign-On | `/deployment/enterprise-features/single-sign-on` |
| Enterprise | Multiple Workspaces & Team Roles | `/deployment/enterprise-features/multiple-workspaces` |
| Enterprise | White Label & Advanced Branding | `/deployment/enterprise-features/white-label-branding` |
| Enterprise | Custom Code | `/deployment/enterprise-features/custom-code` |
| Enterprise | Audit Logs | `/deployment/enterprise-features/audit-logs` |
| Enterprise | External Storage | `/deployment/enterprise-features/external-storage` |
| Configuration | Environment Variables | `/configuration/environment-variables` |
| Configuration | OAuth Integration Setup | `/configuration/oauth-setup` |
| Configuration | AWS S3 Configuration | `/configuration/aws-s3` |
| Configuration | Email Setup | `/configuration/email-setup` |
| Configuration | Using your own domain | `/configuration/custom-domain` |
| Configuration | Subdomain Redirect | `/configuration/subdomain-redirect` |
| Configuration | OIDC SSO Configuration | `/configuration/oidc-sso` |
| Configuration | Disable Two-Factor Authentication | `/configuration/disable-2fa` |
| Embedding | JavaScript SDK | `/embedding/javascript-sdk` |

---

# Get Started

## Introduction

OpnForm is an open-source form builder for developers and users. Self-hosted core works without an Enterprise license; free self-hosted instances include OIDC within a 2-user limit.

**Key features:** no-code builder (unlimited forms/fields/submissions); many input types (Text, Date, URL, Phone, Email, Checkboxes, Select, Multi-Select, Number, Star-ratings, File uploads…); embed anywhere (website, Notion); email notifications; hidden fields & form passwords; URL pre-fill; Slack/Discord integrations; webhooks; form logic + AI form generation; customizable colors/images/custom code; Captcha protection; form closing date; submission limits; analytics; file uploads; unique submission ID; single/multi-page; templates; editable submissions; custom domain; remove branding; confirmation emails.

The easiest way to start is the managed Cloud service (https://opnform.com).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | PHP 8.0+, Laravel |
| Database | SQL (MySQL/MariaDB or PostgreSQL) |
| Frontend | Vue.js 3, Nuxt.js, TailwindCSS |
| Asset compilation | Node.js, NPM |
| Additional | Docker, Redis (cache/queue), AWS S3 (file storage or compatible) |

---

# Features

## Computed Variables

Calculated fields defined with Excel-like formulas. They evaluate **live client-side during fill** and **server-side on submission** (for integrations/notifications). Support math/text/logic functions, chaining, and mentions.

### Creating
Editor → Settings (gear) → **Variables** tab → **Add Variable**. Each variable has a **Name** and a **Formula**. The formula editor offers a field picker, function picker, live validation, and preview.

### Syntax
- Field references: `{field_id}` (inserted as interactive pills).
- Operators: `+` (add/concat), `-`, `*`, `/`, `=`, `<>`, `<` `>`, `<=` `>=`.
- Text concat: `+` or `CONCAT()` — e.g. `"Hello, " + {name} + "!"`.

### Functions
**Math:** `SUM`, `AVERAGE`, `MIN`, `MAX`, `ROUND(value, decimals)`, `FLOOR`, `CEIL`, `ABS`, `MOD(value, divisor)`, `POWER(base, exp)`, `SQRT`.
**Text:** `CONCAT`, `UPPER`, `LOWER`, `TRIM`, `LEFT(text, n)`, `RIGHT(text, n)`, `MID(text, start, len)`, `LEN`, `SUBSTITUTE(text, old, new)`, `REPT(text, n)`.
**Logic:** `IF(cond, true, false)`, `AND`, `OR`, `NOT`, `ISBLANK`, `ISNUMBER`, `ISTEXT`, `IFBLANK(value, fallback)`, `COALESCE`, `SWITCH(val, case1, res1, …)`, `CHOOSE(index, val1, …)`.

### Examples
```text
Total price:        {price} * {quantity}
Apply discount:     {subtotal} * (1 - {discount_percent} / 100)
Conditional price:  IF({membership} = "premium", {price} * 0.8, {price})
Full name:          CONCAT({first_name}, " ", {last_name})
Email domain:       RIGHT({email}, LEN({email}) - FIND("@", {email}))
```

### Usage & details
- Appear in mention dropdown (📊 icon): Thank You page, email notifications, redirect URLs, integration payloads.
- Usable in **conditional logic** (e.g. show field when `cv_total greater_than 100`).
- Can reference other computed variables; **circular references auto-detected/prevented**.
- **Not stored** in submissions — calculated on demand (always up to date; formula edits affect past submissions when viewed).
- Failed eval returns `null`; use `IFBLANK()` / `COALESCE()` for fallbacks.
- Best practice: descriptive names, test with preview, break complex calcs into modular variables, avoid 10+ interdependent chains.

| Context | Evaluated |
|---------|-----------|
| Form fill | Live as values change |
| Conditional logic | Before rendering each field |
| Thank-you page | After submission |
| Email notifications | When email sent |
| Integrations | When integration runs |

---

# Deployment

## Docker Deployment (production)

```bash
git clone https://github.com/OpnForm/OpnForm.git
cd OpnForm
chmod +x scripts/docker-setup.sh
./scripts/docker-setup.sh
```
Setup script creates env files, pulls images, starts containers (production), shows access info. Access at `http://localhost`. First visit redirects to a setup page to create the admin account.

> **Windows:** keep LF line endings. `git config core.autocrlf false`; fix artisan if needed: `dos2unix api/artisan`. CRLF causes containers to hang at "Waiting for DB to be ready".

**Notes:** Public registration is disabled after setup; invite users via admin. Free self-hosted = 2 users max. Enterprise license is optional (OIDC works within the 2-user limit).

**Components:** Frontend (SSR Nuxt/Vue 3/Tailwind), Backend, Workers, Databases, Proxy (nginx). Official images: OpnForm API Image, OpnForm Client Image.

```bash
# Build custom images
docker compose build
docker build -t opnform-api:local -f docker/Dockerfile.api .
docker build -t opnform-ui:local -f docker/Dockerfile.client .
```

Customize via `docker-compose.override.yml`:
```yaml
services:
  api:
    image: opnform-api:local
    environment:
      PHP_MEMORY_LIMIT: 1G
  ui:
    image: opnform-ui:local
  ingress:
    volumes:
      - ./custom-nginx.conf:/etc/nginx/conf.d/default.conf
```

**Maintenance / troubleshooting:**
```bash
git pull origin main && docker compose pull && docker compose up -d   # update
docker compose logs -f [api]                                          # logs
docker compose ps                                                     # health
docker compose down && docker compose up -d                           # recreate
docker compose exec db pg_isready                                     # DB check
sed -i 's/\r$//' api/artisan                                          # fix CRLF
docker compose exec api php artisan cache:clear|config:clear|route:clear
docker compose exec api chown -R www-data:www-data storage
docker compose exec api chmod -R 775 storage
```

## Docker Development Setup

```bash
git clone https://github.com/OpnForm/OpnForm.git && cd OpnForm
chmod +x scripts/docker-setup.sh
./scripts/docker-setup.sh --dev
```
- **No `.env` files** — all config embedded in `docker-compose.dev.yml` (incl. `JWT_SKIP_IP_UA_VALIDATION=true`, dev `APP_KEY`/`JWT_SECRET`, mail = log driver).
- Frontend: `http://localhost:3000` (direct Nuxt dev server, HMR, Vue DevTools, source maps, error overlay). API: `http://localhost/api` (nginx proxy). Setup page: `http://localhost:3000/setup`.
- **Differences from prod:** no Redis (file cache/sessions), no queue workers (synchronous jobs), no scheduler, smart dependency install (skips npm install if `package.json` unchanged), persistent node_modules volume.

```bash
# Run commands
docker compose -f docker-compose.dev.yml exec api php artisan [cmd]
docker compose -f docker-compose.dev.yml exec ui npm [cmd]
docker compose -f docker-compose.dev.yml exec db psql -U forge
# Logs / restart
docker compose -f docker-compose.dev.yml logs -f [ui]
docker compose -f docker-compose.dev.yml restart ui
```
**DB defaults:** host `db` (in containers) / `localhost:5432`; database/user/pass = `forge`/`forge`/`forge`.
**Troubleshooting:** use `http://127.0.0.1:3000` (IPv4, avoids 503 from `::1`); force reinstall deps: `rm -f node_modules/.install-complete` or `docker volume rm opnform_client_node_modules`; HMR needs ports 3000 & 24678.

## Local Deployment (manual, no Docker)

Docker dev is recommended. Manual requirements: PHP 8.0+, Composer, Node.js 14+, NPM/Yarn, MySQL or PostgreSQL.
```bash
# Install Laravel Herd: https://herd.laravel.com/
git clone https://github.com/OpnForm/OpnForm && cd OpnForm
cd api && composer install
cd ../client && npm install
cd client && npm run dev          # or build
./scripts/setup-env.sh            # creates api & client .env
cd api && php artisan migrate
```
Add the `api` dir to Herd (auto local domain, e.g. `http://opnform.test`). Frontend at `http://localhost:3000`.

## Cloud vs Self-Hosting

| | Self-Hosted | OpnForm Cloud |
|---|---|---|
| HA servers / LB / managed DB / SMTP | ~$50/$15/$45-70/$15+/mo | ✅ |
| Users | 2 free; Enterprise license for more | per plan |
| OIDC SSO | within 2-user free limit | per plan |
| Support | Discord | Live Chat |
| Setup / Upgrades / Backups / Monitoring / SSL | Manual | ✅ Automatic |
| Custom code & forks | ✅ | ❌ |

**Self-host when:** regulatory/air-gapped compliance (e.g. HIPAA), custom builds/forks, custom/community integrations. Otherwise Cloud is recommended.

## Self-hosted License (Community vs Enterprise)

OpnForm core is AGPLv3 and self-hostable without a license. Enterprise features ship in the repo/images but require an active Enterprise license.

| Capability | Community | Enterprise |
|---|---|---|
| Personal/commercial use, modify & redistribute (AGPLv3) | Yes | Yes |
| Core form builder | Yes | Yes |
| Up to 2 users / >2 users | Yes / No | Yes / Yes |
| Instance-wide SMTP, storage, domains, OAuth | Yes | Yes |
| OIDC SSO | within 2-user limit | Yes |
| Enterprise workspace features & support | No | Yes |

**Community includes:** core builder + public pages, submissions/exports, embeds & JS SDK, webhooks/integrations, instance email (`MAIL_*`), instance domain (`APP_URL`/`FRONT_URL` + reverse proxy), instance storage (local/S3), standard auth/OAuth, OIDC for ≤2 users.

**Enterprise unlocks:** SAML/LDAP SSO; multiple workspaces + >2 users + advanced roles; white-label/branding removal; Workspace Custom SMTP; audit logs; external storage; custom code. License key controls which areas are enabled.

**Two-level settings:** Email (`MAIL_*` instance vs workspace SMTP), Storage (default vs Enterprise external), Branding (core customization vs white-label), Auth (standard/OAuth/OIDC≤2 vs SAML/LDAP + more users), Domains (instance URL vs workspace/form domains).

## License Activation

Prereqs: running self-hosted instance, a workspace-admin account, an Enterprise license key, network access from API to license API (`https://api.opnform.com`).

**UI steps:** Sign in as workspace admin → User Settings → **Enterprise License** → paste key → **Activate License** (refreshes feature flags).

| Variable | Description |
|---|---|
| `LICENSE_API_ENDPOINT` | Backend license API (default `https://api.opnform.com`) |
| `LICENSE_CHECKOUT_SUCCESS_URL` / `LICENSE_CHECKOUT_CANCEL_URL` | Checkout success/cancel URLs |
| `LICENSE_PORTAL_RETURN_URL` | Billing portal return URL |
| `NUXT_PUBLIC_LICENSE_API_ENDPOINT` | Front-end license API (default `https://api.opnform.com`) |

> After changing env vars in Docker, **recreate** containers (a restart won't reload them).

**License statuses:** `active`, `grace` (within window after temporary API failure), `expired`, `activation_limit_reached` (key used on another instance — contact support), `invalid`.

---

# Self-hosted Enterprise

## Workspace Custom SMTP
Lets a workspace send form email notifications via its own SMTP instead of the instance mailer. Enterprise feature; instance-wide `MAIL_*` remains free. Setup: workspace → **Email Settings** → enter host/port/encryption/username/password/sender → save. Overrides instance mailer only for that workspace.

## Single Sign-On
Enterprise unlocks **SAML** and **LDAP** SSO, plus **>2 users** via OIDC provisioning. **OIDC** itself works on Community within the 2-user limit (see OIDC SSO Configuration for full setup: provider setup, redirect URI, field/group-to-role mappings, force-login).

## Multiple Workspaces & Team Roles
Enterprise unlocks multiple workspaces, >2 users (manual or OIDC), advanced member roles, org-level workspace administration. Community is capped at 2 users instance-wide.

## White Label & Advanced Branding
Enterprise unlocks branding removal, advanced form branding, custom CSS/branding controls, white-label presentation. Community includes core form customization only.

## Custom Code
Inject JS/CSS into forms for tracking, styling, integrations. **Disabled by default on self-hosted** for safety. Enable with:
```bash
CUSTOM_CODE_ENABLE_SELF_HOSTED=true   # then recreate containers
```
Env var controls whether code can execute; Enterprise license controls workspace access to the feature. (See JavaScript SDK.)

## Audit Logs
Enterprise visibility for compliance/operations: track admin changes, compliance activity records, review of sensitive workspace changes. Requires Enterprise license with audit features + admin access + retention/access policies.

## External Storage
Enterprise workspace/org-level storage controls beyond the instance default. Instance-wide file storage (local or S3-compatible via Laravel filesystem) does **not** require a license (see AWS S3 Configuration).

---

# Configuration

## Environment Variables

OpnForm uses two `.env` files: Laravel backend (`api/`) and Nuxt frontend (`client/`). Dedicated guides: OAuth, OIDC SSO, S3, Email, Custom Domain, Subdomain Redirect.

**Configuration (backend):**
| Variable | Description |
|---|---|
| `H_CAPTCHA_SITE_KEY` / `H_CAPTCHA_SECRET_KEY` | hCaptcha keys |
| `RE_CAPTCHA_SITE_KEY` / `RE_CAPTCHA_SECRET_KEY` | reCAPTCHA keys |
| `OPEN_AI_API_KEY` | OpenAI access |
| `UNSPLASH_ACCESS_KEY` / `UNSPLASH_SECRET_KEY` | Unsplash API |
| `FRONT_URL` / `FRONT_API_SECRET` | Front-end URL & shared secret |
| `JWT_TTL` / `JWT_SECRET` | JWT TTL & signing key |
| `JWT_SKIP_IP_UA_VALIDATION` | Disable JWT UA validation (default false; keep off in prod) |
| `PUBLIC_UPLOADS_RATE_LIMIT_PER_MINUTE` / `_PER_HOUR` | Upload rate limits (default 30 / 300) |
| `OIDC_FORCE_LOGIN` | Force OIDC-only login (disables password login) |
| `CUSTOM_CODE_ENABLE_SELF_HOSTED` | Allow custom code on self-hosted (default false) |
| `LICENSE_*` | License API/checkout/portal URLs (default `https://api.opnform.com`) |

**OAuth (backend):** `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (auth + Sheets), `GOOGLE_FONTS_API_KEY` (optional), `STRIPE_CLIENT_ID` / `STRIPE_CLIENT_SECRET` (Connect), `TELEGRAM_BOT_TOKEN` (bot ID auto-extracted). OpnForm auto-generates redirect URLs.

**User options:** `ADMIN_EMAILS`, `TEMPLATE_EDITOR_EMAILS`, `EXTRA_PRO_USERS_EMAILS`, `MODERATOR_EMAILS` (comma-separated), `SHOW_OFFICIAL_TEMPLATES` (default true).

**PHP:** `PHP_MEMORY_LIMIT`, `PHP_MAX_EXECUTION_TIME`, `PHP_UPLOAD_MAX_FILESIZE`, `PHP_POST_MAX_SIZE` (set in `docker-compose.yml` for Docker, or `php.ini` otherwise).

**Database:** `DB_CONNECTION` (`mysql`/`pgsql`), `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`.

**Telemetry:** Anonymous usage stats only (no PII, no form content). Active when `APP_ENV=production` + `SELF_HOSTED=true`. Opt out: `OPNFORM_ANONYMOUS_TELEMETRY_DISABLED=true`.

**Front-end:** `NUXT_PUBLIC_APP_URL`, `NUXT_PUBLIC_API_BASE`, `NUXT_PUBLIC_LICENSE_API_ENDPOINT`, `NUXT_PUBLIC_H_CAPTCHA_SITE_KEY`, `NUXT_PUBLIC_RE_CAPTCHA_SITE_KEY`, `NUXT_API_SECRET`, `NUXT_PUBLIC_ROOT_REDIRECT_URL` (see Subdomain Redirect).

**Docker:** Changing `.env` requires recreating containers — `docker compose down [svc] && docker compose up -d [svc]`. `docker compose restart` does **not** reload env vars.

## OAuth Integration Setup

OpnForm auto-handles redirect URLs (no manual config in providers).

**Google** (auth, One Tap, Sheets export): Google Cloud project → enable Google+ API, Drive API, Sheets API → configure OAuth consent (External) → create OAuth 2.0 Web client, add authorized origin `https://yourdomain.com` (leave redirect URIs empty) →
```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_FONTS_API_KEY=...   # optional
```

**Stripe** (payments, multi-account): Dashboard → Settings → Connect → Platform settings → enable Connect → set platform name/support email/brand URL → copy Platform client ID + client secret →
```bash
STRIPE_CLIENT_ID=...
STRIPE_CLIENT_SECRET=...   # separate from regular API keys
```

**Telegram** (notifications): requires a valid HTTPS domain (no localhost; use `localtunnel` for dev). `@BotFather` → `/newbot` → save token → `/setdomain` → select bot → enter domain →
```bash
TELEGRAM_BOT_TOKEN=1234567890:ABCdef...   # bot ID auto-extracted
```

**Security:** never commit credentials; use env vars; rotate secrets; monitor provider dashboards.

## AWS S3 Configuration

Instance-wide storage via Laravel filesystem (local or S3-compatible). Create S3 bucket + IAM user (read/write), set CORS:
```json
[{ "AllowedHeaders": ["*"], "AllowedMethods": ["PUT","POST","GET","DELETE"], "AllowedOrigins": ["*"], "ExposeHeaders": [] }]
```
```bash
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=...
AWS_BUCKET=...
```

## Email Setup

Default Docker mail driver is `log` (logs instead of sends). Uses Laravel mail. Two levels: **instance-wide** (`MAIL_*` env vars) and **workspace SMTP** (Enterprise, overrides instance for that workspace).

**Instance SMTP env vars:** `MAIL_MAILER=smtp`, `MAIL_HOST`, `MAIL_PORT` (25/465/587), `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_ENCRYPTION` (tls/ssl), `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`. Restart API after changes.

**Workspace SMTP:** workspace → Email Settings → host/port/encryption/username/password/sender → save. Does not replace instance config (which stays as default/fallback). Requires Enterprise license.

## Using your own domain

Instance-wide domain (separate from workspace/form custom domains). Steps: buy domain → DNS to your instance → set `APP_URL` in `.env` and `NUXT_PUBLIC_APP_URL` + `NUXT_PUBLIC_API_BASE` in `client/.env` → add SSL.

## Subdomain Redirect

`NUXT_PUBLIC_ROOT_REDIRECT_URL` hides public pages by **301-redirecting** root (`/`), `/integrations`, and 404 routes to your main site. Forms (`/forms/*`), `/login`, `/home`, and admin pages stay accessible.
```bash
NUXT_PUBLIC_ROOT_REDIRECT_URL=https://yourdomain.com   # client/.env; include protocol
```
Client-side (Nuxt) redirect. Recreate Docker containers after change (`down ui && up -d ui`; restart won't reload).

## OIDC SSO Configuration

OIDC works on self-hosted **without** an Enterprise license, but instance stays capped at 2 users (any provisioning method). OpnForm auto-handles redirect URLs (shown in connection settings).

**Features:** domain-based routing by email domain, group-to-role mapping, custom claim field mappings, automatic user provisioning, force-login mode.

**Setup:** collect from IdP — Issuer URL (`{issuer}/.well-known/openid-configuration`), Client ID, Client Secret, Email Domain → workspace Settings → **SSO** → **Add Connection** (Name, Slug, Email Domain, Issuer URL, Client ID/Secret) → copy displayed **Redirect URI** into IdP allowed list (must match exactly) → optional **Role Mappings** (IdP group → owner/admin/editor/member; multiple groups → highest role; priority owner > admin > editor > member) → optional **Field Mappings** (custom email/name claim names) → **Enable** + test (enter domain email → redirected to IdP).

**Force Login Mode:** `OIDC_FORCE_LOGIN=true` disables password login (blocked with message; auto-redirect to IdP by domain). Ensure ≥1 enabled OIDC connection exists first (else password login stays as fallback).

**Supported providers:** Azure Entra ID, Authentik, Okta, Keycloak, Google Workspace (via OIDC), any OIDC-compliant.
- *Azure:* configure group claims in app registration → Token configuration (Security groups / Directory roles); may need `groups` scope.
- *Authentik:* groups usually included automatically.

**Security:** HTTPS required in prod; state validation on by default (rejects callbacks without valid/unexpired state — CSRF protection; can disable per connection via `options.require_state=false`, not recommended); **no automatic account linking** (existing same-email unlinked accounts fail — contact admin); SSO-only accounts get random 64-char password, verified email, provider metadata (cannot use password login).

**Best practices:** test with a small group first, monitor logs, keep a backup admin account, keep IdP config in sync, document config.

## Disable Two-Factor Authentication

Admin command to disable 2FA for users who lost authenticator/recovery codes. All usage logged (Slack admin channel: user ID, email, reason, override status).
```bash
php artisan user:disable-two-factor {user_email} {reason} [--force] [--allow-admin]
```
| Param/Option | Description |
|---|---|
| `user_email` | Target email (case-insensitive) |
| `reason` | Required, for audit logging |
| `--force` | Skip confirmation (non-admin users only) |
| `--allow-admin` | Allow disabling for admin users (always interactive; cannot use `--force`) |

```bash
# Docker
docker compose exec api php artisan user:disable-two-factor user@example.com "Lost authenticator" --force
docker compose exec -it api php artisan user:disable-two-factor admin@example.com "Emergency" --allow-admin
```
Users with authenticator access should disable 2FA via account settings instead.

---

# Embedding

## JavaScript SDK

Programmatically control embedded forms, listen to events, auto-resize iframes; backward compatible with `initEmbed()`.

**Install** (after iframe):
```html
<iframe id="my-form" src="https://opnform.com/forms/my-form-slug" style="border:none;width:100%;"></iframe>
<script src="https://opnform.com/widgets/opnform-sdk.min.js"></script>
```
Auto-discovers and initializes OpnForm iframes.

**Quick start:**
```js
opnform.on("submit", (data) => console.log(data.data));
opnform.get("my-form").setField("email", "user@example.com");
opnform.get("my-form").toggleDarkMode();
```

**Events:** `ready` `{form,slug,id}`, `submit` `{form,data,submissionId,completionTime}`, `submitStart`, `submitError` `{form,errors}`, `dataChange` `{form,data,changedField,previousValue,newValue}`, `error` `{form,errors}`, `pageChange` `{form,fromPage,toPage,totalPages}`, `nextPage`, `previousPage`, `reset`, `show`, `hide`.
```js
opnform.on('submit', handler);
opnform.off('submit', handler);   // or off('submit') to remove all
opnform.once('ready', handler);
```

**Form methods** (`opnform.get('slug')`):
- Fields: `setField(id, value)`, `setFields(data)`, `getField(id)`, `getData()`, `clearField(id)`, `clearAll()`.
- Errors: `hasError(id)`, `getError(id)`, `getErrors()`.
- Theme: `toggleDarkMode()`, `setDarkMode(true|false|"auto")`, `isDarkMode()`.
- Navigation: `goToPage(n)`, `nextPage()`, `previousPage()`, `getCurrentPage()` → `{index,total}`, `canGoNext()`, `canGoPrevious()`.
- Actions: `submit()`, `reset()`, `focusFirstError()`.
- Popup: `open()`, `close()`, `toggle()`, `isOpen()`.

**Global methods:** `opnform.get(slug)`, `getAll()`, `isReady(slug)`.
```js
opnform.init({ autoResize: true, defaultDarkMode: "auto", preventRedirect: false, onReady: (forms)=>{} });
opnform.create("slug", { container: "#form-container", width: "100%", height: "auto", darkMode: false, onSubmit: (d)=>{} });
```

**Integrations:** GA4 (`gtag('event','form_submission',{...})` on `submit`/`pageChange`), custom API (`fetch` on `submit`), error tracking (`Sentry` on `submitError`/`error`), dynamic prefill (`setFields` from URL params on `ready`).

**Custom Code:** when using OpnForm's Custom Code feature, `window.opnform` SDK is auto-available (no iframe — initialized directly on the form page). Add `<script>` in Form Settings → Custom Code (or Workspace Settings). Examples: GA tracking, Facebook Pixel (`fbq('track','Lead',...)`), conditional logic with external data, custom validation toasts, live `dataChange` tracking.

**Backward compatibility:** old `initEmbed("my-form", { autoResize: true })` with `widgets/iframe.min.js` still works; upgrading to the SDK adds events + programmatic control.
