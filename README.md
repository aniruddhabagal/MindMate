# MindMate

A modern, privacy‑first **mental‑wellness companion web app** built with Next.js (App Router). MindMate is designed to help users take small but meaningful steps toward better mental health by offering guided exercises, mood tracking, journaling, and resource sharing. It emphasizes simplicity, privacy, and accessibility, so users can focus on their wellness without friction.

> Live: **mindmate.aniruddha.fyi**

---

## Table of contents

* [What it does](#what-it-does)
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

## What it does

MindMate acts as a **personal wellness toolkit**. It is not a replacement for therapy, but it provides helpful, everyday tools for stress management and reflection:

* **Daily mood check‑ins** – Users can log their emotions in seconds and see trends over time.
* **Guided activities** – Short exercises like deep breathing, gratitude journaling, or positive affirmations to reduce stress.
* **Journaling space** – A private place to note thoughts, reflections, or progress.
* **Wellness resources** – Curated articles, tips, and links related to mental health.
* **Chatbot support (optional)** – A friendly AI chatbot for reflective conversations or quick mood support.
* **Responsive design** – Works seamlessly on mobile and desktop.

MindMate is lightweight, fast, and can easily integrate new features such as reminders, gamification (streaks/points), or community spaces.

---

## Features

* **Next.js App Router**: server components, file‑system routing, route groups, metadata.
* **Type‑safe, modular code** in `components/` and `lib/` for reuse.
* **Responsive UI** with Tailwind CSS and utility‑first styling.
* **Production‑ready configs** for ESLint, Tailwind, and PostCSS.
* **Easy deployment** to Vercel or your platform of choice.

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
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# AUTH_SECRET=...
# DATABASE_URL=...
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

* **`app/`** – The heart of the app. Each folder under `app/` is a route.
* **`components/`** – Reusable UI building blocks.
* **`lib/`** – Utilities, constants, hooks, and API wrappers.
* **`models/`** – Data models/schemas.
* **`old_html_based/`** – Legacy prototypes for reference.
* **`public/`** – Static assets served at `/`.
* **`middleware.js`** – Edge middleware for auth/headers.
* **Configs** (`next.config.mjs`, `tailwind.config.js`, `postcss.config.js`, `eslint.config.mjs`) – project tooling and optimizations.

---

## Coding standards

* Keep components small and composable.
* Use Tailwind utility classes.
* Favor server components and caching for data fetching.
* Use Conventional Commits (`feat:`, `fix:`, etc.).
* Add tests for critical logic.

---

## Contributing

1. Fork the repo & create a feature branch.
2. Install dependencies & run dev server.
3. Lint and test before committing.
4. Open a PR with clear details.

---

## License

Add a license of your choice (MIT is common).

---

### Notes & next steps

* Document real modules as you build them (e.g., mood tracker, journaling, breathing exercises).
* Add screenshots to `/public` and reference them here.
* Expand chatbot or AI‑driven features if integrated.

---

**Made with ❤️ by Aniruddha Bagal**
