# Contributing to GreenGrocer-AI

Thanks for considering a contribution! This is an agentic grocery e-commerce
platform — keep the AI honest (no invented product data) and the UI fast.

## Ground rules

- **No fabricated product data.** The agent must always call `searchProducts`
  before recommending; never hard-code a "fresh" answer about a product.
- **Graceful no-key behaviour.** Anything touching `@google/genai` must
  degrade gracefully when `GEMINI_API_KEY` is unset (see the `Sprout` fallback
  in `services/geminiService.ts`).
- **No new runtime deps via npm.** The app uses an importmap (deps from
  `esm.sh`) — add new deps to the importmap in `index.html`, not to
  `package.json` runtime deps (tooling-only deps are fine).
- **Charts are hand-rolled SVG.** Don't add recharts/chart.js — keep the
  bundle light. See `AdminDashboard.tsx` for the pattern.

## Development setup

```bash
git clone https://github.com/Vaskoor/GreenGrocer-AI.git
cd GreenGrocer-AI
bun install                 # or npm install
cp .env.example .env.local  # add your GEMINI_API_KEY (optional — works in demo mode without)
bun run dev                 # http://localhost:3000
```

## Typical workflow

1. **Branch:** `git switch -c feat/<desc>` (or `fix/`, `docs/`).
2. **Make changes.** Type-hint everything; the app is `tsc --noEmit` clean.
3. **Verify locally:**
   ```bash
   bunx tsc --noEmit    # type-check
   bun run build        # production build (must succeed)
   bun run dev          # manual smoke-test in the browser
   ```
4. **Commit** using Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`.
5. **Open a PR** describing the change + how you tested it (with and without
   a `GEMINI_API_KEY`).

## Adding a new product

Edit `constants.ts` — append to `PRODUCTS` with all required fields
(`id`, `name`, `category`, `price`, `unit`, `image`, `seasonal`, `organic`,
`description`, `longDescription`, `stock`, `tags`, `rating`, `reviewCount`,
`origin`, `nutrition`, `reviews`). Use a real Unsplash photo URL.

## Adding a new agent tool

1. Add a `FunctionDeclaration` in `services/geminiService.ts`.
2. Add it to the `Chat` config's `tools` array.
3. Add a handler to the `ToolHandlers` interface + wire it in `App.tsx`.
4. Handle the tool-call round-trip in `sendMessageStream`.
5. Document it in the README's "Meet Sprout" tool table.

## Style

- **Formatter:** Prettier (2-space indent, double quotes, 100 cols) — not
  enforced by CI yet; follow the existing style.
- **Types:** strict; the package is fully typed.
- **Components:** function components, JSDoc on each, accessible (aria), responsive.

## Reporting issues

Open an issue with: OS, Node version, `bun run build` output, and whether you
reproduce with or without `GEMINI_API_KEY` set.

## License

By contributing you agree your contributions are licensed under the project's
MIT license (see [`LICENSE`](LICENSE)).
