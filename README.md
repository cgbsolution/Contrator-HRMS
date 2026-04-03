# Contractor HRMS - Frontend

Next.js frontend for Contractor Workforce Management at Manufacturing Plants (India).

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI:** Tailwind CSS + shadcn/ui (Radix primitives)
- **State:** Zustand
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **HTTP Client:** Axios

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment (Vercel)

1. Push this repo to GitHub
2. Import in Vercel
3. Set environment variable:
   - `NEXT_PUBLIC_API_URL` = your deployed backend URL (e.g. `https://your-backend.railway.app/api/v1`)
4. Deploy

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
├── components/             # React components
│   └── ui/                 # shadcn/ui components
├── lib/                    # Utilities, API client, stores
├── public/                 # Static assets
├── tailwind.config.ts
└── package.json
```
"# Contrator-HRMS" 
