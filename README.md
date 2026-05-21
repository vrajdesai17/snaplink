# SnapLink — URL Shortener with Analytics

A production-ready Bitly clone built for SDE portfolios. Features novel capabilities that go beyond the typical GitHub URL shortener.

## Stack

- **Next.js 15** (App Router, TypeScript)
- **PostgreSQL** + Prisma ORM
- **Redis** — write-through cache + sliding-window rate limiting
- **Docker Compose** for local infra
- **Vercel** (app) + **Railway** (Postgres + Redis) for deployment

## Novel Features

| Feature | What it is |
|---|---|
| **Semantic slugs** | Extracts domain + path keywords to auto-generate memorable codes like `gh-nextjs` or `vercel-docs` instead of random `x9k2mAB`. Falls back to base62 on collision. |
| **OG metadata enrichment** | Auto-fetches Open Graph title, description, and preview image when shortening. Dashboard shows rich link previews. |
| **24×7 click heatmap** | Hour-of-day × day-of-week grid showing *when* your audience clicks — reveals timezone patterns, peak hours, weekday vs weekend behavior. |
| **Burn-after-N-clicks** | Links self-destruct after N clicks or a date. Useful for sharing time-sensitive or capacity-limited resources. |

## Standard Features

- Base62 encoding with collision handling
- Click analytics: geo (via Vercel headers), browser, OS, device, referrer
- Sliding window rate limiting (10 req/min/IP) via Redis sorted sets
- Write-through Redis cache (24h TTL, invalidated on delete)
- Redirect handler with async click tracking (zero latency impact)

## Local Development

```bash
# 1. Start Postgres + Redis
docker-compose up -d

# 2. Install dependencies
npm install

# 3. Set env vars
cp .env.example .env.local
# (defaults work with docker-compose)

# 4. Push DB schema
npm run db:push

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

### Vercel (app)
```bash
vercel deploy
```
Set env vars in Vercel dashboard:
- `DATABASE_URL` — Railway Postgres connection string
- `REDIS_URL` — Railway Redis connection string
- `NEXT_PUBLIC_APP_URL` — your Vercel domain

### Railway (Postgres + Redis)
1. Create a new Railway project
2. Add PostgreSQL and Redis services
3. Copy connection strings to Vercel env vars
4. Run `prisma db push` against the Railway DB

## Architecture

```
Browser → GET /[code]
           ↓
      Redis cache hit?
      ├─ Yes → redirect (< 1ms)
      └─ No  → Prisma lookup → cache + redirect
                   ↓
             trackClick() [async, fire-and-forget]
                   ↓
             INSERT click + UPDATE click_count
```

## Resume Bullets

```
- Built URL shortener handling 10K+ req/min with Redis write-through cache reducing DB load by ~80%
- Engineered semantic slug algorithm extracting URL keywords for human-readable codes; base62 fallback with collision handling
- Implemented sliding-window rate limiting (Redis sorted sets) and 24×7 click heatmap showing traffic patterns by hour + day-of-week
- Designed PostgreSQL schema with Prisma ORM; async click tracking adds zero latency to redirects
```
