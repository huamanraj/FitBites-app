# FitBites 🥗

**The simplest AI calorie tracker. Free, open source, and as easy as taking notes.**

[![Android](https://img.shields.io/badge/Android-APK-green)](https://github.com/huamanraj/FitBites-app/releases/tag/v1.0)
[![Web App](https://img.shields.io/badge/Web-Live-blue)](https://app.fitbites.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

FitBites is a free, open-source AI food analyzer and calorie tracker. Just type what you ate — like "2 roti and dal" — and the AI instantly calculates calories, protein, carbs, and fat. No barcode scanning. No complex menus. Just type and go.

## Features

- **AI Calorie Estimation** — Type meals in plain English, get instant nutrition data
- **Daily Food Log** — Notes-style interface for logging meals throughout the day
- **Macro Tracking** — Protein, carbs, and fat breakdowns for every entry
- **Weekly & Monthly Analytics** — Bar charts with calorie averages, best days, and macro splits
- **AI Goal Calculator** — Personalized calorie and macro targets based on your body stats and goals
- **Cross-Platform** — Android app (Expo) + Web app (Next.js)
- **100% Free** — No ads, no subscriptions, no premium tiers
- **Open Source** — Inspect, fork, or contribute

## Screenshots

| Today View | Analytics | Goals |
|---|---|---|
| Log meals by typing | Weekly/monthly charts | AI-powered goal calculation |

## Architecture

```
fitbites-app/
├── app/                    # Expo React Native app (Android/iOS)
│   ├── (drawer)/           # Main screens (today, analytics, goals, settings)
│   ├── login.tsx
│   └── register.tsx
├── webapp-next/            # Next.js web app (SSR landing + client dashboard)
│   └── src/app/
│       ├── page.tsx        # Landing page (SSR, SEO optimized)
│       ├── login/
│       ├── register/
│       └── (dashboard)/    # Authenticated area
├── lib/                    # Shared services
│   ├── appwrite.ts         # Appwrite client config
│   ├── auth.ts             # Email/password authentication
│   ├── food-service.ts     # Food CRUD + AI calorie estimation
│   └── goals-service.ts    # Goals CRUD + AI goal calculation
├── context/
│   └── auth-context.tsx    # React auth context provider
├── appwrite-functions/     # Serverless AI functions
│   ├── estimate-calories/  # Calorie estimation via AI
│   └── calculate-goals/    # Goal calculation via AI
├── scripts/
│   └── setup-appwrite.mjs  # Database setup script
└── landing-page/           # Static landing page reference
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile App | React Native + Expo (file-based routing) |
| Web App | Next.js 16 + Tailwind CSS v4 |
| Backend | Appwrite (auth, database, functions) |
| AI | Pollinations API (Gemini model) |
| Functions | Appwrite Functions (Bun runtime) |
| Database | Appwrite Database (food_logs, user_goals collections) |
| Charts (web) | CSS bar charts |
| Charts (mobile) | Custom SVG + Reanimated |

## Getting Started

### Prerequisites

- Node.js 18+
- [Bun](https://bun.sh) (recommended) or npm
- An [Appwrite](https://appwrite.io) instance (cloud or self-hosted)

### 1. Clone the repository

```bash
git clone https://github.com/huamanraj/FitBites-app.git
cd FitBites-app
```

### 2. Configure environment

Copy the example and fill in your Appwrite credentials:

```bash
cp .env.local.example .env.local
```

Required variables:

```env
# Appwrite
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://your-appwrite-instance.com/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
EXPO_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
EXPO_PUBLIC_APPWRITE_COLLECTION_ID=food_logs
EXPO_PUBLIC_APPWRITE_GOALS_COLLECTION_ID=user_goals
EXPO_PUBLIC_APPWRITE_FUNCTION_ID=estimate-calories
EXPO_PUBLIC_APPWRITE_GOALS_FUNCTION_ID=calculate-goals

# For setup script (server-side only)
APPWRITE_API_KEY=your_api_key
```

### 3. Set up Appwrite

```bash
bun install
bun run setup-appwrite
```

This creates the database, collections, attributes, and indexes needed by the app.

### 4. Run the mobile app

```bash
bun install
npx expo start
```

### 5. Run the web app

```bash
cd webapp-next
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Download

Get the Android APK from the [releases page](https://github.com/huamanraj/FitBites-app/releases/tag/v1.0).

## How It Works

1. **Set Your Goals** — Enter your age, weight, height, and goal. The AI calculates your ideal daily calorie and macro targets.

2. **Log with AI** — Type what you ate naturally: "1 roti", "100g rice", "chicken biryani". The AI instantly estimates calories and macros.

3. **Track Progress** — View your daily log, weekly charts, and macro breakdowns. Stay on target with visual progress bars.

## Contributing

FitBites is open source and contributions are welcome.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Appwrite](https://appwrite.io) — Backend as a Service
- [Pollinations AI](https://pollinations.ai) — AI inference
- [Expo](https://expo.dev) — React Native framework
- [Next.js](https://nextjs.org) — React framework for web

---

**FitBites** — Track calories as easily as writing notes.
