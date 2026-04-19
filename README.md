# KeepMyMotivation

Personalized motivational emails on a user-chosen schedule. Next.js 16 + Prisma + Postgres + Resend + OpenAI + Lemon Squeezy.

## Stack

- **Frontend / API**: Next.js 16 (App Router), React 19, Tailwind v4
- **DB**: PostgreSQL 16 (Docker)
- **ORM**: Prisma 6
- **Auth**: Email OTP + PIN, HMAC-signed session cookies
- **Email**: Resend + React Email
- **AI**: OpenAI (`gpt-4o-mini`) for clarify agent + motivation copy
- **Imagery**: Pexels
- **Payments**: Lemon Squeezy (webhook + hosted checkout)
- **Process manager**: PM2 (app + hourly cron)

## Project layout

```
app/                  Next.js routes
  api/                API routes (agent, auth, signup, lemonsqueezy, cron)
  (pages)/            UI pages
components/           Shared client components
emails/               React Email templates
lib/                  Server helpers (prisma, session, resend, gemini, ...)
prisma/               schema + migrations
scripts/send-emails.js  Hourly cron entry
```

## Environment

Copy `.env` (or create) with:

```env
DATABASE_URL="postgresql://kmm:kmm_dev_pw@localhost:5433/keepmemotivated?schema=public"

OPENAI_API_KEY="..."
PEXELS_API_KEY="..."

RESEND_API_KEY="..."
RESEND_FROM="KeepMyMotivation <noreply@keepmymotivation.com>"

LEMONSQUEEZY_WEBHOOK_SECRET="..."            # max 40 chars, HMAC secret set in LS dashboard
LEMONSQUEEZY_CHECKOUT_BOOST="https://<store>.lemonsqueezy.com/checkout/buy/<uuid>"
LEMONSQUEEZY_CHECKOUT_DRIVE="https://<store>.lemonsqueezy.com/checkout/buy/<uuid>"

APP_URL="http://localhost:3000"
CRON_SECRET="openssl rand -hex 32"
SESSION_SECRET="openssl rand -hex 32"        # >= 32 chars
```

## Local development

```bash
# DB
docker compose up -d postgres

# Deps
npm ci

# Prisma
npm run db:migrate     # creates + applies dev migration
npx prisma generate

# Dev server
npm run dev            # http://localhost:3000
```

Scripts:

| Script         | Purpose                                |
|----------------|----------------------------------------|
| `dev`          | Next.js dev server                      |
| `build`        | Production build                        |
| `start`        | Production server                       |
| `lint`         | ESLint                                  |
| `db:migrate`   | `prisma migrate dev`                    |
| `db:deploy`    | `prisma migrate deploy` (prod)          |
| `db:studio`    | Prisma Studio                           |

## Lemon Squeezy webhook

- LS dashboard → Webhooks → URL: `https://<domain>/api/lemonsqueezy/webhook`
- Signing secret: must match `LEMONSQUEEZY_WEBHOOK_SECRET` (≤ 40 chars)
- Events: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`, `subscription_payment_success`, `subscription_payment_failed`
- Checkout URL passes `custom[user_id]` + `custom[plan]` — webhook reads from `meta.custom_data`

## Resend domain

- Resend → Domains → add `keepmymotivation.com`
- Paste DKIM/SPF/DMARC DNS records
- Until verified, sends from custom domain fail silently. Use `onboarding@resend.dev` for tests (delivers only to Resend account owner).

## VPS deployment

One-time setup:

```bash
# Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # re-login

# PM2
sudo npm i -g pm2
```

Project setup:

```bash
cd /var/www
git clone <repo> keepmymotivation
cd keepmymotivation
npm ci
cp .env.example .env            # fill real values

docker compose up -d postgres
npm run db:deploy
npx prisma generate
npm run build
```

Start app + hourly cron with PM2:

```bash
pm2 start npm --name kmm -- start
pm2 start scripts/send-emails.js --name kmm-cron --no-autorestart --cron-restart "0 * * * *"
pm2 save
pm2 startup                     # run printed command → survives reboot
```

### Reverse proxy (Caddy)

```
keepmymotivation.com {
  reverse_proxy localhost:3000
}
```

```bash
sudo systemctl reload caddy
```

### Firewall

```bash
sudo ufw allow 22,80,443/tcp
sudo ufw enable
```

## Cron

`scripts/send-emails.js` runs every hour via PM2 `--cron-restart "0 * * * *"` + `--no-autorestart`. Picks users where `sendHour == local_hour` and plan cadence (Spark monthly, Boost weekly, Drive daily) is due. Protected by `CRON_SECRET`.

Manual trigger:

```bash
node scripts/send-emails.js
```

## Deploy updates

```bash
cd /var/www/keepmymotivation
git pull
npm ci
npm run db:deploy
npm run build
pm2 restart kmm
```

## Troubleshooting

- **`EADDRINUSE :::3000`**: `pm2 delete kmm && sudo fuser -k 3000/tcp && pm2 start npm --name kmm -- start`
- **Email not arriving**: Resend logs + domain verification status. Check `pm2 logs kmm` for `Preview email failed`
- **Webhook 400 Invalid signature**: ensure LS signing secret matches `LEMONSQUEEZY_WEBHOOK_SECRET` exactly
- **Migration drift**: `npx prisma migrate status`

## Plans

| Plan  | Cadence        | Price     |
|-------|----------------|-----------|
| Spark | 1 / month      | Free      |
| Boost | 1 / week       | $1 / mo   |
| Drive | 1 / day        | $5 / mo   |
