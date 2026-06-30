# AI Voice Dental Assistant

A Next.js application that provides a voice-enabled dental assistant for appointment booking, admin management, and patient dashboards.

## Quick overview
- Framework: Next.js
- UI: React, Tailwind CSS (shadcn components)
- Auth: Clerk (via `@clerk/nextjs`)
- Database: Prisma + PostgreSQL (`pg`)
- Email: Resend (in `src/lib/resend.ts`)
- Voice / AI: VAPI integration (`@vapi-ai/web`, `src/lib/vapi.ts`)

## Key features
- Voice-enabled appointment booking and assistant (see `src/app/voice`)
- Patient dashboard and appointment flow (`src/app/appointments`, `src/app/dashboard`)
- Admin area for doctor management (`src/app/admin`, `src/components/admin`)
- Email notifications for appointments (`src/app/api/send-appointment-email`)

## Repository layout
- `src/app` — Next.js app routes and pages (app router)
- `src/components` — Shared UI components and feature components
- `src/lib` — Helpers and integrations (`prisma.ts`, `vapi.ts`, `resend.ts`, `utils.ts`)
- `prisma` — Prisma schema and migrations
- `public` — Static assets

For example, the voice client lives at [src/app/voice/page.tsx](src/app/voice/page.tsx) and the server-side VAPI helper is in [src/lib/vapi.ts](src/lib/vapi.ts).

## Setup (developer)
1. Install dependencies

```bash
pnpm install
```

2. Create a `.env` with the required environment variables (example keys used in this project):

- `DATABASE_URL` — Postgres connection string
- `CLERK_SECRET` / `CLERK_PUBLISHABLE_KEY` — Clerk credentials
- `VAPI_KEY` — VAPI AI key
- `RESEND_API_KEY` — Resend API key

3. Prepare the database

```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. Run the development server

```bash
pnpm dev
```

Open http://localhost:3000 to view the app.

## Useful scripts
The project `package.json` exposes these scripts:

- `pnpm dev` — start dev server (uses port 3000)
- `pnpm build` — build for production
- `pnpm start` — start production server
- `pnpm lint` — run biome checks
- `pnpm format` — run biome formatter

These map to the `scripts` in `package.json` (see `package.json` for exact commands).

## Walkthrough: where to look for things
- App entry: [src/app/page.tsx](src/app/page.tsx)
- Voice UI + client: [src/app/voice/page.tsx](src/app/voice/page.tsx) and [src/app/voice/VapiClient.tsx](src/app/voice/VapiClient.tsx)
- API email route: [src/app/api/send-appointment-email/route.ts](src/app/api/send-appointment-email/route.ts)
- Prisma schema: [prisma/schema.prisma](prisma/schema.prisma)
- DB helper: [src/lib/prisma.ts](src/lib/prisma.ts)
- Admin components: [src/components/admin](src/components/admin)

Follow these files to trace the main flows: booking flow (components under `appointments/`), admin doctor management (components under `admin/`), and the voice assistant integration (files under `voice/` and `src/lib/vapi.ts`).

## Deployment notes
- This is a Next.js app and can be deployed to Vercel or other Node hosts supporting Next 16.
- Ensure environment variables are set in the target environment (DB, Clerk, VAPI, Resend).
- Run `pnpm build` then `pnpm start` for production.

## Contributing
- Create a branch per feature.
- Run `pnpm dev` and `pnpm lint` before opening a PR.

## Questions / Next steps
- Need me to add a separate `WALKTHROUGH.md` or expand any section? I can also add an environment example file (`.env.example`).
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
