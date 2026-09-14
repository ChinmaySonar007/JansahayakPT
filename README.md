# JanSahayak — SIH26089 Prototype (Team FoursPush, Team ID 54)

Cooperative gig services platform: households book verified workers through
their local cooperative; workers get fair, rotation-based job offers instead
of "fastest-finger-first"; a 1.5% micro-fee on every job auto-funds a shared
welfare pool.

This is a **2-day hackathon prototype**, not the production architecture in
the pitch deck. It demonstrates the three mechanisms judges will want to see
actually work — rotational equity matching, escrow + welfare-fee split, and
phygital (WhatsApp-style) worker access — end to end, with everything else
mocked. See "Scope & what's mocked" below.

## Three views, one app

| Route | Role | What it shows |
|---|---|---|
| `/` | Consumer | Browse service categories, see ranked nearby workers, book |
| `/worker` | Worker | Chat-style inbox: accept/decline job offers, mark complete, wallet |
| `/admin` | Cooperative | Live job feed, worker equity register, welfare pool ledger |

Switch between them with the nav bar — no login system, this is a single
demo build.

## How the core logic works

- **`src/lib/engine.ts`** — the rotational equity matching engine. Score =
  proximity + idle-time (weighted higher) with a rating floor of 3.5 as a
  hard gate. Workers below the floor are excluded from offers and flagged
  `upskilling` in the admin view, rather than banned. Decline → re-offers to
  the next eligible candidate automatically.
- Job completion triggers escrow settlement: 1.5% to `welfarePool`, the rest
  to the worker's wallet, logged as a transaction — visible live in `/admin`.

## Run locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Deploy (Render — recommended over Vercel)

The app uses an **in-memory data store** (`src/lib/store.ts`, module-level
state seeded on boot) instead of a database — the right call for a 2-day
build, but it means state only persists within a single long-running
process. Vercel's serverless functions spin up separate instances per
request/region, so state would look inconsistent during a demo. Render (or
Railway) runs `next start` as one persistent process, so it works correctly.

1. Push this repo to GitHub.
2. On Render: **New → Web Service** → connect the repo.
3. Build command: `npm install && npm run build`
4. Start command: `npm run start`
5. No environment variables or database needed.
6. Deploy — Render gives you a public URL immediately.

If you'd rather use Vercel for the URL/branding, it'll still work for a demo
where one person drives the whole flow in one browser session; just don't
expect consistent state across multiple simultaneous viewers.

## Scope & what's mocked (be upfront about this to judges)

- **WhatsApp/voice**: `/worker` is a chat-style UI standing in for a real
  Twilio WhatsApp / Bhashini IVR integration. Wire-up point is
  `src/app/api/jobs/[id]/respond` — a real webhook would call the same
  function.
- **UPI escrow**: `completeJob()` in `engine.ts` does the split math and
  ledger entry; there's no real NPCI/UPI call. Swap in an actual escrow
  provider at that function boundary.
- **e-Shram / Aadhaar KYC**: workers are seeded as pre-verified; no real KYC
  call.
- **Geo-matching**: uses straight-line (haversine) distance on seeded
  lat/lng, not PostGIS — fine at this scale, would need PostGIS if this grew
  past a few hundred workers per area.

## Next steps if you get more time

1. Swap the in-memory store for Postgres (Neon) — schema maps directly onto
   the types in `src/lib/types.ts`.
2. Real Twilio WhatsApp Sandbox webhook instead of the in-app chat UI.
3. Add the "rate card" enforcement UI (currently just a fixed number per
   category — deck calls for cooperative-set rate cards per district).
