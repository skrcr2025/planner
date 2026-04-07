# Planner – Personal Finance Tracker

A personal financial planning and expense tracking application built with Next.js, SQLite, and Tailwind CSS.

## Features

- **Dashboard** – Monthly summary of income, expenses, and net balance with a 6-month trend chart and budget progress indicators
- **Transactions** – Add, edit, and delete income/expense transactions; filter by month, type, or category; search by description
- **Budgets** – Set monthly spending limits per category and track progress against actual spending
- **Reports** – Visual charts: income vs expenses bar chart, net balance trend line, expense breakdown pie chart, and category bar chart

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router) with TypeScript
- [SQLite](https://www.sqlite.org/) via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) for local data storage
- [Tailwind CSS v4](https://tailwindcss.com/) for styling
- [Recharts](https://recharts.org/) for data visualizations
- [Lucide React](https://lucide.dev/) for icons
- [date-fns](https://date-fns.org/) for date formatting

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Seed sample data (optional)

Populates the database with 3 months of sample transactions and budgets to explore the app.

```bash
npm run seed
```

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
  layout.tsx              # Root layout with sidebar navigation
  page.tsx                # Redirects to /dashboard
  dashboard/page.tsx      # Dashboard with summary cards and charts
  transactions/page.tsx   # Transaction list with CRUD
  budgets/page.tsx        # Monthly budget management
  reports/page.tsx        # Spending analytics and charts
  api/
    transactions/route.ts      # GET list / POST create
    transactions/[id]/route.ts # PUT update / DELETE
    categories/route.ts        # GET all categories
    budgets/route.ts           # GET list / POST upsert
    summary/route.ts           # GET dashboard & reports data
components/
  Navigation.tsx          # Sidebar navigation
  TransactionForm.tsx     # Add/edit transaction form
lib/
  db.ts                   # SQLite connection and schema initialization
  types.ts                # TypeScript type definitions
scripts/
  seed.js                 # Database seeding script
data/
  planner.db              # SQLite database (auto-created, gitignored)
```

## Database Schema

| Table          | Description                              |
| -------------- | ---------------------------------------- |
| `categories`   | Income/expense categories with colors    |
| `transactions` | Individual income or expense entries     |
| `budgets`      | Monthly budget limits per category       |

## Scripts

| Command        | Description                              |
| -------------- | ---------------------------------------- |
| `npm run dev`  | Start development server                 |
| `npm run build`| Build for production                     |
| `npm run start`| Start production server                  |
| `npm run seed` | Seed database with sample data           |
| `npm run lint` | Run ESLint                               |
