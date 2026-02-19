# 🔑 Moris — API Keys & Service Setup Guide

This guide walks you through setting up every external service Moris depends on.
Copy `.env.local.example` → `.env.local` and fill in each key as you go.

---

## Table of Contents

1. [Clerk (Authentication)](#1-clerk-authentication)
2. [Supabase (Database + Realtime)](#2-supabase-database--realtime)
3. [Azure Blob Storage (File Storage)](#3-azure-blob-storage-file-storage)
4. [AI Providers](#4-ai-providers)
5. [Firecrawl (Web Scraping)](#5-firecrawl-web-scraping)
6. [Upstash Redis (Caching)](#6-upstash-redis-caching)
7. [Razorpay (Payments)](#7-razorpay-payments)
8. [E2B (Code Sandbox)](#8-e2b-code-sandbox)
9. [Inngest (Background Jobs)](#9-inngest-background-jobs)

---

## 1. Clerk (Authentication)

| Key | Example |
|-----|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...` |
| `CLERK_SECRET_KEY` | `sk_test_...` |
| `CLERK_JWT_ISSUER_DOMAIN` | `https://your-app.clerk.accounts.dev` |

### Steps
1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Create an application (or select existing)
3. Click **API Keys** in the sidebar
4. Copy the **Publishable Key** and **Secret Key**
5. JWT Issuer Domain is shown in **Sessions** → **Edit** → **Issuer**

---

## 2. Supabase (Database + Realtime)

| Key | Example |
|-----|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` |
| `DATABASE_URL` | `postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres` |
| `DIRECT_DATABASE_URL` | Same format, direct connection |

### Steps
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project** → choose a name, password, region
3. **Save the database password** — you'll need it for `DATABASE_URL`!
4. Once created, go to **Settings** → **API**:
   - Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Go to **Settings** → **Database**:
   - Copy **Connection string** (URI format) → `DATABASE_URL`
   - Replace `[YOUR-PASSWORD]` with your database password
   - For `DIRECT_DATABASE_URL`, use the same string with port `5432` (direct connection)

### Enable Realtime (Required for live chat)
1. In Supabase Dashboard → **Database** → **Publications**
2. Click on `supabase_realtime`
3. Toggle on tables: `messages`, `files`
4. Click **Save**

### Run Prisma Migration
```bash
npx prisma migrate dev --name init
```

---

## 3. Azure Blob Storage (File Storage)

> ⚠️ This is the most involved setup. Follow each step carefully.

| Key | Example |
|-----|---------|
| `AZURE_STORAGE_CONNECTION_STRING` | `DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net` |

### Step 1: Create an Azure Account
1. Go to [portal.azure.com](https://portal.azure.com)
2. Sign up for a free account (you get **$200 credit** for 30 days)
3. A credit card is required but **won't be charged** during the free tier

### Step 2: Create a Resource Group
1. In the Azure Portal, search for **"Resource groups"** in the top search bar
2. Click **+ Create**
3. Fill in:
   - **Subscription**: Your subscription (usually "Azure subscription 1")
   - **Resource group name**: `moris-rg` (or any name you prefer)
   - **Region**: Choose the closest to your users (e.g., `(US) East US` or `(Asia Pacific) Central India`)
4. Click **Review + Create** → **Create**

### Step 3: Create a Storage Account
1. Search for **"Storage accounts"** in the top search bar
2. Click **+ Create**
3. Fill in:
   - **Subscription**: Same as above
   - **Resource group**: Select `moris-rg`
   - **Storage account name**: `morisfiles` (must be globally unique, lowercase, 3-24 chars, only letters and numbers)
   - **Region**: Same region as your resource group
   - **Performance**: Standard
   - **Redundancy**: LRS (Locally-redundant) — cheapest option, fine for dev
4. Click **Review + Create** → **Create**
5. Wait for deployment to complete (takes ~30 seconds)

### Step 4: Create a Blob Container
1. Go to your new storage account (click **Go to resource**)
2. In the left sidebar, click **Data storage** → **Containers**
3. Click **+ Container**
4. Name it: `project-files`
5. **Public access level**: Private (no anonymous access)
6. Click **Create**

### Step 5: Get the Connection String
1. In your storage account, go to **Security + networking** → **Access keys**
2. Click **Show** on either key1 or key2
3. Copy the **Connection string** (the full string starting with `DefaultEndpointsProtocol=...`)
4. Paste it as `AZURE_STORAGE_CONNECTION_STRING` in your `.env.local`

```env
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=morisfiles;AccountKey=xxxxxxxxxxx==;EndpointSuffix=core.windows.net
```

### Azure Free Tier Limits
| Resource | Free Allowance |
|----------|---------------|
| Storage | 5 GB LRS |
| Operations | 20,000 read + 10,000 write/month |
| Data transfer | 15 GB/month outbound |

> **Tip**: For development, this is more than enough. For production, Azure Blob Storage costs ~$0.02/GB/month.

---

## 4. AI Providers

### Google AI (Gemini)
| Key | `GOOGLE_GENERATIVE_AI_API_KEY` |
|-----|------|
1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Click **Create API Key**
3. Select or create a Google Cloud project
4. Copy the key

### OpenRouter (Multi-Model Proxy)
| Key | `OPENROUTER_API_KEY` |
|-----|------|
1. Go to [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys)
2. Click **Create Key**
3. Copy the key (starts with `sk-or-v1-`)

> OpenRouter gives access to Claude, GPT-4, Gemini, DeepSeek, Moonshot, and 100+ other models through a single API.

### Groq (Fast Inference)
| Key | `GROQ_API_KEY` |
|-----|------|
1. Go to [console.groq.com/keys](https://console.groq.com/keys)
2. Click **Create API Key**
3. Copy the key (starts with `gsk_`)

### Anthropic (Optional — Direct API)
| Key | `ANTHROPIC_API_KEY` |
|-----|------|
1. Go to [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
2. Click **Create Key**
3. Copy the key (starts with `sk-ant-`)

---

## 5. Firecrawl (Web Scraping)

Firecrawl is used by Moris for **scraping documentation URLs** in quick-edit and conversation tools. When a user pastes a URL in their prompt, Firecrawl converts the page to clean markdown for the AI to use.

| Key | `FIRECRAWL_API_KEY` |
|-----|------|

### Steps
1. Go to [firecrawl.dev](https://www.firecrawl.dev)
2. Sign up / Log in
3. Go to [API Keys page](https://www.firecrawl.dev/app/api-keys)
4. Click **Create new API Key**
5. Copy the key (starts with `fc-`)

### Free Tier
- **500 credits/month** (1 credit = 1 page scrape)
- More than enough for development

---

## 6. Upstash Redis (Caching)

| Key | Example |
|-----|---------|
| `UPSTASH_REDIS_REST_URL` | `https://xxxx.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | `AXxxxx...` |

### Steps
1. Go to [console.upstash.com](https://console.upstash.com)
2. Click **Create Database**
3. Choose a name (e.g., `moris-cache`) and region
4. Select **REST API** (default)
5. Once created, go to **Details** tab
6. Copy **UPSTASH_REDIS_REST_URL** and **UPSTASH_REDIS_REST_TOKEN**

### Free Tier
- 10,000 commands/day
- 256 MB storage

---

## 7. Razorpay (Payments — India)

> Skip this if you don't need billing. The app will work without it.

| Key | Example |
|-----|---------|
| `RAZORPAY_KEY_ID` | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | `xxx...` |
| `RAZORPAY_WEBHOOK_SECRET` | Your chosen secret |

### Steps
1. Go to [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Sign up (KYC is needed for live mode; test mode works immediately)
3. Make sure you're in **Test Mode** (toggle at top)
4. Go to **Settings** → **API Keys** → **Generate Key**
5. Copy **Key ID** and **Key Secret**
6. For webhooks:
   - Go to **Settings** → **Webhooks** → **+ Add New Webhook**
   - URL: `https://yourdomain.com/api/billing/webhook`
   - Events: `payment.captured`, `subscription.charged`, `subscription.cancelled`
   - Secret: set a custom secret string → paste as `RAZORPAY_WEBHOOK_SECRET`

---

## 8. E2B (Code Sandbox)

> For server-side code execution (Python, Rust, C++, etc.). Skip for development.

| Key | `E2B_API_KEY` |
|-----|------|

### Steps
1. Go to [e2b.dev](https://e2b.dev)
2. Sign up / Log in
3. Go to [Dashboard](https://e2b.dev/dashboard)
4. Copy your **API Key**

### Free Tier
- 100 sandbox hours/month

---

## 9. Inngest (Background Jobs)

> Only needed for production. In development, Inngest runs locally via the dev server.

| Key | Example |
|-----|---------|
| `INNGEST_EVENT_KEY` | `xxx...` |
| `INNGEST_SIGNING_KEY` | `signkey-...` |

### Steps
1. Go to [app.inngest.com](https://app.inngest.com)
2. Create an app
3. Go to **Manage** → **Signing Key** (for `INNGEST_SIGNING_KEY`)
4. Go to **Manage** → **Event Keys** → create one (for `INNGEST_EVENT_KEY`)

### Local Development
For local dev, just run:
```bash
npx inngest-cli@latest dev
```
No API keys needed for local development.

---

## Quick Start Checklist

```
□ Clerk keys filled in
□ Supabase URL + anon key + DATABASE_URL filled in  
□ Supabase Realtime enabled for messages & files tables
□ npx prisma migrate dev --name init ← run this!
□ Azure Storage Account created + connection string pasted
□ Google AI or OpenRouter key filled in (at least one AI provider)
□ Firecrawl key filled in
□ Upstash Redis URL + token filled in
□ (Optional) Razorpay keys for billing
□ (Optional) E2B key for server-side sandboxing
```

After filling in the keys, start the dev server:
```bash
npm run dev
```

In a separate terminal, start Inngest:
```bash
npx inngest-cli@latest dev
```
