# ImmoAI — AI Home Staging

A full-stack web application that lets real estate agents, property managers, and homeowners upload a photo of an empty or sparsely furnished room and instantly generate a professionally staged, listing-ready version using AI.

Built with [TanStack Start](https://tanstack.com/start), [React 19](https://react.dev), [Tailwind CSS v4](https://tailwindcss.com), and the [Lovable AI Gateway](https://docs.lovable.dev/ai-gateway).

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [How it works](#how-it-works)
- [Staging engines](#staging-engines)
- [API endpoint](#api-endpoint)
- [Deployment](#deployment)
- [Customizing](#customizing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features

- **AI-powered home staging** — Upload an interior photo and get a fully furnished, photorealistic staged version in seconds.
- **Before/after interactive slider** — Compare the original image with the AI-generated result using a draggable slider with mouse and touch support.
- **Interior photo validation** — The AI gateway first verifies the uploaded image is an indoor room, preventing accidental uploads of outdoor scenes, people, food, etc.
- **Dual staging engines** — Choose between the built-in Lovable AI gateway or connect your own [n8n](https://n8n.io) webhook workflow.
- **Download ready** — Save the generated staged image as a PNG with one click.
- **Responsive UI** — Clean, mobile-friendly interface using Tailwind CSS and shadcn/ui components.
- **SSR-safe error handling** — Server-side errors are captured and rendered as a friendly HTML error page.

---

## Tech stack

| Layer | Technology |
|-------|-------------|
| Framework | TanStack Start v1 (full-stack React, SSR/SSG, file-based routing) |
| UI | React 19, Tailwind CSS v4, shadcn/ui (Radix primitives), Lucide icons |
| State | React `useState`, `useEffect`, `useRef`, `useCallback` |
| Query client | TanStack Query |
| Server | TanStack server routes under `src/routes/api/` |
| Build tool | Vite 7 via `@lovable.dev/vite-tanstack-config` |
| Runtime | Cloudflare Workers (edge) with `nodejs_compat` |
| AI | Lovable AI Gateway — `google/gemini-3.1-flash-image` for image generation, `google/gemini-2.5-flash` for validation |

---

## Project structure

```
.
├── src/
│   ├── components/ui/          # shadcn/ui components (Button, Card, Input, etc.)
│   ├── hooks/                  # Custom React hooks
│   ├── lib/
│   │   ├── utils.ts            # cn() Tailwind class merger
│   │   ├── error-capture.ts    # SSR error capture helper
│   │   ├── error-page.ts       # HTML error page renderer
│   │   └── lovable-error-reporting.ts  # Error reporting integration
│   ├── routes/
│   │   ├── __root.tsx          # Root layout, head metadata, QueryClient provider
│   │   ├── index.tsx           # Home page with upload, slider, and download
│   │   └── api/
│   │       └── home-staging.ts # POST /api/home-staging staging endpoint
│   ├── router.tsx              # TanStack Router setup with QueryClient context
│   ├── server.ts               # SSR entry wrapper with error normalization
│   ├── start.ts                # App start configuration
│   └── styles.css              # Tailwind v4 theme, design tokens, and utilities
├── public/                     # Static assets
├── package.json
├── vite.config.ts
├── components.json             # shadcn/ui configuration
└── README.md                   # This file
```

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ or [Bun](https://bun.sh/) 1.0+
- A Lovable AI Gateway API key (or an n8n webhook for the custom mode)

### Install dependencies

```bash
bun install
# or
npm install
```

### Run the development server

```bash
bun dev
# or
npm run dev
```

The app runs on `http://localhost:8080` by default.

### Build for production

```bash
bun run build
# or
npm run build
```

---

## Environment variables

Create a `.env` file in the project root (or add secrets via Lovable Cloud):

| Variable | Required | Description |
|----------|----------|-------------|
| `LOVABLE_API_KEY` | Yes, for Lovable mode | API key for the Lovable AI Gateway (`ai.gateway.lovable.dev`). |
| `VITE_*` | Optional | Public environment variables exposed to the browser (currently none required). |

> **Note:** Server-side secrets are read inside route handlers with `process.env.LOVABLE_API_KEY`. They are never exposed to the client bundle.

---

## How it works

### User flow

1. The user selects a staging engine: **Lovable AI** or **n8n webhook**.
2. In Lovable mode, they drag & drop or click to upload a local image (JPG/PNG/WEBP).
3. In n8n mode, they paste a public image URL and their n8n webhook URL.
4. The frontend sends a `POST` request to `/api/home-staging` with `image_url`, `mode`, and an optional `webhook_url`.
5. The server validates the request and calls the chosen staging engine.
6. The staged image is returned as a base64 data URL (or public URL) and rendered in an interactive before/after slider.
7. The user can download the final image.

### AI prompting strategy

The app uses a carefully tuned prompt that instructs the model to:

- Preserve the exact room: walls, windows, doors, ceiling, floor, perspective, and lighting.
- Add tasteful modern furniture, rugs, decor, plants, and warm accent lighting.
- Avoid repainting, removing, or moving any architectural elements.
- Produce a photorealistic real-estate listing photo with no text or watermark.

This balance between architectural preservation and virtual furnishing is the core of the home-staging experience.

---

## Staging engines

### 1. Lovable AI (default)

This mode uses the Lovable AI Gateway directly:

- **Validation:** `google/gemini-2.5-flash` checks whether the uploaded image is an interior room.
- **Staging:** `google/gemini-3.1-flash-image` generates the staged image from the original photo and the prompt.
- **Error handling:** Rate limits (429), exhausted credits (402), and invalid images return clear, user-friendly messages.

### 2. n8n webhook

For users who want to build their own workflow (e.g. using Pollinations, Kontext, or a custom model):

- The frontend sends `{ image_base64, prompt }` to the user-provided webhook URL.
- The webhook must respond with either:
  - Binary image bytes (`Content-Type: image/*`),
  - A JSON object containing one of: `staged_url`, `image_url`, `url`, `b64_json`, `image_base64`, or a `data` array with `url`/`b64_json`.

This is useful for power users who want to chain additional tools, apply style presets, or use alternative image models.

---

## API endpoint

### `POST /api/home-staging`

Request body:

```json
{
  "image_url": "data:image/png;base64,… or https://…",
  "mode": "lovable" | "n8n",
  "webhook_url": "https://your-n8n.example.com/webhook/…",  // required only when mode is "n8n"
  "prompt": "optional custom staging prompt"
}
```

Response (success):

```json
{
  "staged_url": "data:image/png;base64,… or https://…"
}
```

Response (error):

```json
{
  "error": "Human-readable error message"
}
```

Status codes:

- `200` — Success
- `400` — Missing/invalid input, or image is not an interior photo
- `429` — AI gateway rate limit
- `402` — AI credits exhausted
- `500` — Missing API key or internal server error
- `502` — Upstream AI gateway or n8n webhook failed

---

## Deployment

This project is configured to deploy on Lovable Cloud / Cloudflare Workers by default.

1. Push your code to GitHub.
2. In Lovable, connect your repository and publish the project.
3. Add the `LOVABLE_API_KEY` secret in the Lovable Cloud dashboard.
4. The preview URL and production URL are generated automatically.

> You can also publish directly from the Lovable editor using the **Publish** button.

---

## Customizing

### Branding

Update the following in `src/routes/index.tsx` and `src/routes/__root.tsx`:

- App name (`ImmoAI` → your brand)
- Tagline and hero copy
- Logo (`iA` badge in the header)
- Meta title/description and Open Graph/Twitter images
- Accent color in `src/styles.css` (`--color-accent-500` and related tokens)

### Staging prompt

The default prompt is in `src/routes/api/home-staging.ts` at the top of the file. You can edit it to:

- Target a specific interior style (Scandinavian, luxury, minimalist, etc.).
- Add seasonal decorations.
- Change furniture density or price point.

### Add a style preset selector

A common next feature is to let users pick from presets like "Modern", "Scandinavian", or "Luxury". Each preset would append a style-specific sentence to the base prompt before sending it to the AI.

### Add authentication and credits

If you want per-user limits, enable Lovable Cloud and add:

- A `profiles` table and user accounts.
- A `credits` or `usage` table.
- A server-side check in `src/routes/api/home-staging.ts` before calling the AI gateway.

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---------|--------------|-----|
| `LOVABLE_API_KEY not configured` | Missing API key | Add `LOVABLE_API_KEY` to your environment. |
| `Rate limit reached` | Too many requests in a short window | Wait a moment and retry. |
| `AI credits exhausted` | Gateway usage limit reached | Check your Lovable AI Gateway balance. |
| `This image doesn't look like the interior of a room` | The validation model rejected the image | Upload a clear photo of an indoor room. |
| `Could not reach n8n webhook` | Webhook URL is unreachable or offline | Verify the URL and that the workflow is active. |
| `n8n returned invalid JSON` | Webhook response format is wrong | Ensure the workflow returns a supported image URL or binary image. |
| Blank white screen with 500 | SSR error swallowed by h3 | Check the dev server output for the real error. |

---

## License

MIT — feel free to remix, customize, and deploy as your own product.

---

Built with ❤️ on [Lovable](https://lovable.dev).
