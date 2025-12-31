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

## MVP launch (Career Coach + AI Companion)

### 1) Environment variables

Create `.env.local` with at least:

- `OPENAI_API_KEY=...`
- `OPENAI_MODEL=gpt-4o` (or whatever you want to run in production)

For public internet launch (production), also set:

- `APP_SECRET=...` (required; use a long random value)

Optional (only if you want DB-backed auth/user records):

- `DATABASE_URL=...`

### 2) Verify readiness

Run the app and confirm the health endpoint:

- `npm run dev`
- Visit `http://localhost:3000/api/health` (returns 200 when AI is configured; 503 otherwise)

### 3) Production build

- `npm run lint` (warnings are ok; zero errors required)
- `npm run build`
- `npm start`

### MVP scope notes

- Career Coach: Resume Optimizer, LinkedIn Optimizer, Cover Letter Generator are functional.
- AI Companion: ChatGPT-style UI + voice call (speech-to-text + optional TTS) + video call (local preview) are functional.
- Items labeled “Coming soon” are intentionally non-functional for the MVP.

### Public launch notes

- The current “Sign in” endpoint is not verified authentication (no password/OAuth/magic link). For safety on public launch, production mode creates a new identity instead of allowing login-as-any-email.
- API routes are rate limited in-memory (best-effort). For high traffic, use a shared rate limit store (e.g. Redis) at the edge or gateway.
