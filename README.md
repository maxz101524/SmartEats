# SmartEats - UIUC Dining Nutrition Tracker

A web application that provides comprehensive nutritional information for UIUC dining hall menus. Scrapes daily menu data, generates nutritional estimates using AI, and presents it through a mobile-friendly interface.

## Features

- **Daily Menu Scraping**: Automatically fetches menu data from UIUC dining halls
- **AI-Powered Nutrition**: Uses GPT-4o-mini to estimate calories, macros, vitamins, and allergens
- **Meal Planning**: Track your daily intake with an interactive meal planner
- **Filtering**: Search and filter by dietary preferences, allergens, and macro targets
- **Mobile-First**: Optimized for checking nutrition info while in the dining hall line

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Vercel Postgres + Drizzle ORM
- **Styling**: Tailwind CSS
- **LLM**: OpenAI GPT-4o-mini
- **Scraper**: Direct API calls + Playwright fallback
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Vercel account (for deployment and Postgres)
- OpenAI API key

### Local Development

1. **Clone and install dependencies**
   ```bash
   cd SmartEats
   npm install
   ```

2. **Set up environment variables**
   
   Create a `.env.local` file with:
   ```env
   # Vercel Postgres (get these from Vercel dashboard)
   POSTGRES_URL=
   POSTGRES_PRISMA_URL=
   POSTGRES_URL_NO_SSL=
   POSTGRES_URL_NON_POOLING=
   POSTGRES_USER=
   POSTGRES_HOST=
   POSTGRES_PASSWORD=
   POSTGRES_DATABASE=

   # OpenAI
   OPENAI_API_KEY=sk-...

   # Cron secret (generate a random string)
   CRON_SECRET=your-secret-key
   ```

3. **Set up the database**
   ```bash
   npm run db:push
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Seed initial data** (optional)
   ```bash
   curl -X POST "http://localhost:3000/api/seed?days=3" \
     -H "Authorization: Bearer your-secret-key"
   ```

### Deployment to Vercel

1. **Connect your repository to Vercel**

2. **Add a Postgres database**
   - Go to your Vercel project → Storage → Create Database → Postgres

3. **Configure environment variables**
   - Add `OPENAI_API_KEY` and `CRON_SECRET` in project settings

4. **Deploy**
   - Push to main branch or trigger manual deployment

### Operations & Data Pipeline

- **Scraping (`/api/scrape`)**: Fetches the latest menus from the UIUC Dining API and persists them via Drizzle + Vercel Postgres. Vercel Cron hits this endpoint daily at 6:00 AM (see `vercel.json`). For manual runs, call `/api/scrape?hall=ikenberry&date=2025-01-01`. Protect the route by setting `CRON_SECRET` and configuring the cron job to send `Authorization: Bearer <secret>`.
- **Nutrition generation (`/api/nutrition`)**: Finds menu items without macros, calls GPT‑4o‑mini, and upserts the results. Another cron job runs this endpoint at 7:00 AM daily. Trigger it manually with `curl -H "Authorization: Bearer $CRON_SECRET" https://<your-app>/api/nutrition`.
- **Seeding (`/api/seed`)**: Convenience endpoint that backfills a date range across every hall and then runs the nutrition generator. Run this once after provisioning Postgres on Vercel:  
  `curl -X POST "https://<your-app>/api/seed?days=7&forward=2" -H "Authorization: Bearer $CRON_SECRET"`.
- **Demo fallback**: If `POSTGRES_URL` isn’t provided (e.g., preview builds), `/api/menu` serves live UIUC data without nutrition so the UI still renders.
- **Ongoing maintenance**: After connecting the GitHub repo to Vercel and setting the env vars (`POSTGRES_*`, `OPENAI_API_KEY`, `CRON_SECRET`), scraping and LLM enrichment run automatically via the cron schedule—no manual daily steps required.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/menu` | GET | Fetch menu with nutrition for a hall/date |
| `/api/menu/dates` | GET | Get available dates for a dining hall |
| `/api/scrape` | GET/POST | Trigger menu scraping (cron job) |
| `/api/nutrition` | GET | Generate missing nutrition data |
| `/api/nutrition` | POST | Generate nutrition for specific item |
| `/api/seed` | POST | Seed database with historical data |
| `/api/health` | GET | Health check endpoint |

## Cron Jobs

Configured in `vercel.json`:
- **6:00 AM daily**: Scrape today's menu data
- **7:00 AM daily**: Generate nutrition for new items

## Project Structure

```
/SmartEats
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes
│   │   ├── page.tsx            # Main page
│   │   └── layout.tsx          # Root layout
│   ├── components/             # React components
│   └── lib/
│       ├── db/                 # Database schema & queries
│       ├── scraper/            # Menu scraping logic
│       ├── openai/             # AI nutrition generation
│       └── utils/              # Utility functions
├── drizzle/                    # Database migrations
├── vercel.json                 # Cron configuration
└── package.json
```

## Database Schema

- **dining_halls**: Dining hall locations
- **menu_items**: Cached dish information
- **daily_menus**: Daily menu entries by meal period
- **menu_entries**: Junction table for menu items
- **nutrition_info**: AI-generated nutritional data

## Disclaimer

**Nutritional information is estimated using AI and may not be 100% accurate.** For official nutrition data, please consult [UIUC NetNutrition](http://eatsmart.housing.illinois.edu/NetNutrition/46).

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT
