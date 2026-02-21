# FitBites – Appwrite Setup Guide

## What the setup script creates

| Resource       | ID / Name                            | Details             |
| -------------- | ------------------------------------ | ------------------- |
| **Database**   | `EXPO_PUBLIC_APPWRITE_DATABASE_ID`   | `FitBites`          |
| **Collection** | `EXPO_PUBLIC_APPWRITE_COLLECTION_ID` | `Food Logs`         |
| **Attributes** | see below                            | 8 attributes        |
| **Indexes**    | `userId_date`, `userId_createdAt`    | 2 composite indexes |

### Collection: `food_logs`

| Attribute   | Type        | Required | Notes                                        |
| ----------- | ----------- | -------- | -------------------------------------------- |
| `userId`    | string(128) | ✅       | Appwrite user `$id`                          |
| `date`      | string(10)  | ✅       | Format: `yyyy-MM-dd`                         |
| `foodName`  | string(512) | ✅       | Free text, up to 512 chars                   |
| `calories`  | float       | ✅       | Negative for exercise entries                |
| `protein`   | float       | ✅       | Grams                                        |
| `carbs`     | float       | ✅       | Grams                                        |
| `fat`       | float       | ✅       | Grams                                        |
| `createdAt` | string(30)  | ✅       | ISO 8601 string (`new Date().toISOString()`) |

---

## Prerequisites

1. **Node 18+** – The script uses native `fetch` (no extra packages needed).
2. An **Appwrite project** – created at [cloud.appwrite.io](https://cloud.appwrite.io).
3. An **Appwrite API Key** with the following scopes:
   - `databases.read` / `databases.write`
   - `collections.read` / `collections.write`
   - `attributes.read` / `attributes.write`
   - `indexes.read` / `indexes.write`

---

## Step 1 – Fill in `.env.local`

```env
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=<your_project_id>
EXPO_PUBLIC_APPWRITE_DATABASE_ID=<your_database_id>
EXPO_PUBLIC_APPWRITE_COLLECTION_ID=food_logs
EXPO_PUBLIC_POLLINATIONS_API_KEY=<your_pollinations_key>

# Server-side only – never expose this in the app bundle
APPWRITE_API_KEY=<your_secret_api_key>
```

> ⚠️ `APPWRITE_API_KEY` is a **server-side** key used only by the setup script.  
> It is never bundled into the Expo app (it has no `EXPO_PUBLIC_` prefix).

---

## Step 2 – Run the script

```bash
node scripts/setup-appwrite.mjs
```

The script is **idempotent** – running it multiple times is safe. Resources that already exist are skipped.

---

## Step 3 – Verify in the Appwrite Console

1. Open your project → **Databases**
2. Select **FitBites** → **Food Logs**
3. Check **Attributes** and **Indexes** tabs

---

## Troubleshooting

| Error                                    | Fix                                                          |
| ---------------------------------------- | ------------------------------------------------------------ |
| `Missing required environment variables` | Add `APPWRITE_API_KEY` to `.env.local`                       |
| `401 Unauthorized`                       | Make sure the API key has the required scopes                |
| `Attribute already exists`               | Safe to ignore – the script skips existing resources         |
| `Free plan limit`                        | Appwrite free tier allows 1 database; reuse the existing one |
