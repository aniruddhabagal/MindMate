# MindMate

A modern, privacy‑first mental‑wellness web app built with Next.js (App Router). The project focuses on a clean, fast UI and an extensible architecture so you can iterate quickly on features such as mood check‑ins, exercises, and resource libraries.

> Live (if deployed): **mindmate.aniruddha.fyi**

---

## Table of contents

* [Features](#features)
* [Tech stack](#tech-stack)
* [Getting started](#getting-started)
* [Environment](#environment)
* [Scripts](#scripts)
* [Project structure](#project-structure)
* [Key files & what they do](#key-files--what-they-do)
* [Coding standards](#coding-standards)
* [Contributing](#contributing)
* [License](#license)

---

## Features

* **Next.js App Router**: server components, file‑system routing, route groups, metadata.
* **Type‑safe, modular code** in `components/` and `lib/` for reuse.
* **Responsive UI** with Tailwind CSS and utility‑first styling.
* **Production‑ready configs** for ESLint, Tailwind, and PostCSS.
* **Easy deployment** to Vercel or your platform of choice.

> Note: Feature modules (e.g., check‑ins, exercises, resources) are organized under `app/` as routes and in `components/` for UI building blocks.

---

## Tech stack

* **Framework:** Next.js (App Router) with React 18+
* **Styling:** Tailwind CSS + PostCSS
* **Linting:** ESLint
* **Package manager:** npm / pnpm / yarn (choose one)

Optional integrations (add as needed):

* Authentication (e.g., NextAuth.js)
* Database (e.g., MongoDB/Prisma; see `models/` if present)
* Analytics/Logging

---

## Getting started

### 1) Prerequisites

* **Node.js** 18+ (LTS recommended)
* A package manager: **npm** / **pnpm** / **yarn** / **bun**

### 2) Install & run

```bash
# clone
git clone https://github.com/aniruddhabagal/MindMate.git
cd MindMate

# install deps (pick one)
npm install
# pnpm i
# yarn
# bun install

# start dev server (http://localhost:3000)
npm run dev
```

### 3) Build & start (production)

```bash
npm run build
npm start
```

---

## Environment

Create a `.env.local` in the project root for any secrets/keys you need. Common examples:

```bash
# Example placeholders – remove any that you do not use
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# AUTH_SECRET=...            # if using NextAuth or JWT-based sessions
# DATABASE_URL=...           # if using a DB (Mongo/Prisma/etc.)
# ANALYTICS_WRITE_KEY=...
```

> Do **not** commit `.env*` files.

---

## Scripts

The project uses standard Next.js scripts (check `package.json`):

* `dev` – start the Next dev server
* `build` – build for production
* `start` – run the production server
* `lint` – run ESLint

Run with your package manager, e.g. `npm run dev`.

---

## Project structure

```
MindMate/
├─ app/                     # App Router pages, route groups, layouts, metadata
├─ components/              # Reusable UI components
├─ lib/                     # Utilities, helpers, constants, API clients
├─ models/                  # (Optional) Data models / schema (e.g., Mongoose/Prisma)
├─ old_html_based/          # Legacy HTML prototype(s); kept for reference
├─ public/                  # Static assets (images, icons, fonts)
├─ middleware.js            # Edge middleware (auth, headers, rewrites) if used
├─ next.config.mjs          # Next.js configuration
├─ tailwind.config.js       # Tailwind configuration
├─ postcss.config.js        # PostCSS configuration
├─ eslint.config.mjs        # ESLint configuration
├─ jsconfig.json            # Path aliases / editor hints
├─ .gitignore               # Git ignores
└─ README.md                # This file
```

---

## Key files & what they do

* **`app/`** – The heart of the app. Each folder under `app/` is a route. Common patterns:

  * `app/layout.tsx|jsx` – Root layout; global providers and styles.
  * `app/page.tsx|jsx` – Index route.
  * `app/(group)/feature/page.tsx` – Route groups for logical separation.
  * `app/api/*` – Route handlers for serverless APIs.
* **`components/`** – Headless, reusable UI building blocks (forms, cards, modals, nav). Keep them pure and prop‑driven.
* **`lib/`** – Non‑UI utilities: fetch wrappers, validation, constants, hooks (client/server), 3rd‑party SDK setup.
* **`models/`** – Centralized data models/schemas. If not using a DB yet, this can be empty or removed.
* **`old_html_based/`** – Earlier HTML/JS prototype; useful for reference or migration history.
* **`public/`** – Static assets served at `/`. Place favicons, og images, logos here.
* **`middleware.js`** – Edge middleware (e.g., simple auth guards, headers, redirects). Runs before requests reach routes.
* **`next.config.mjs`** – Next.js config (image domains, experimental flags, headers/rewrites).
* **`tailwind.config.js`** – Tailwind theme, content globs, and plugins.
* **`postcss.config.js`** – PostCSS plugins used by Tailwind (and others if added).
* **`eslint.config.mjs`** – Lint rules. Keep strict to maintain quality.
* **`jsconfig.json`** – Path aliases like `@/components` / `@/lib` to simplify imports.

---

## Coding standards

* **Type safety:** Prefer TypeScript. If using JS, add JSDoc for clarity.
* **Components:** Keep UI components small, composable, and stateless where possible.
* **Styling:** Use Tailwind utility classes; extract shared patterns to components.
* **Data fetching:** Use server components/route handlers when possible; cache appropriately.
* **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`) and small, focused PRs.
* **Testing:** Add unit tests for critical logic in `lib/` and integration tests for routes.

---

## Contributing

1. Fork the repo & create a feature branch: `git checkout -b feat/my-feature`
2. Install dependencies: `npm i`
3. Run `npm run dev` and implement your changes
4. Lint & format: `npm run lint`
5. Open a PR with a clear description and screenshots if UI changes

> For larger changes, consider opening an issue first to discuss the approach.

---

## License

Add a license of your choice (MIT is common for web apps). Create a `LICENSE` file in the project root.

---

### Notes & next steps

* If you enable authentication or a database, update **Environment** and **Project structure** accordingly.
* Replace generic feature bullets with your real modules (e.g., mood tracker, journaling, breathing exercises, resources, chatbot).
* Add screenshots to `/public` (e.g., `/public/og.png`) and embed them here.

---

**Made with ❤️ by Aniruddha Bagal**
