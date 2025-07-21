
# Anony Trading - A Modern Journal for Professionals

![Anony Trading Dashboard](https://firebasestorage.googleapis.com/v0/b/tradevision-journal-pss69.appspot.com/o/readme%2Fanony-trading-screenshot.png?alt=media&token=8679f2ba-20a2-474c-8f4f-6962f3f7ca2b)

## Overview

Anony Trading is a sophisticated and modern trading journal designed for professionals who want to elevate their performance through detailed record-keeping and intelligent analysis. It provides a comprehensive suite of tools to log, review, and analyze trades, helping users identify patterns, refine strategies, and maintain discipline.

The journal is built with a focus on data-driven insights, psychological analysis, and a clean, intuitive user interface.

---

## Core Features

The application is organized into several key pages, each serving a distinct purpose in a trader's workflow.

### 1. Dashboard (`/dashboard`)
The main landing page, providing a high-level, at-a-glance overview of your trading performance.
- **Summary Banner**: Displays progress towards monthly profit/loss targets and highlights the most common mistake for the current month.
- **Key Performance Indicators (KPIs)**: A series of cards showing vital statistics like Total PNL, Win Rate, and Net R for the selected time period.
- **Monthly Calendar**: A visual, color-coded calendar showing daily profitability, allowing for quick identification of winning and losing days.
- **Equity Curve**: A chart that visualizes your cumulative R-value over time, showing the growth of your account.

### 2. Trade Log (`/journal`)
The central hub for all your individual trade records.
- **Paginated Table**: Displays all trades in a clean, organized table with infinite scrolling ("Load More") for efficient performance. A responsive card view is used on mobile devices.
- **Add/Edit Trades**: A comprehensive form allows for detailed logging, including entry/exit prices, strategy, psychological state, and screenshots.
- **AI-Powered Import**: Users can upload a CSV, PDF, or even a screenshot of their broker statement, and the AI will automatically parse and import the trades, skipping any duplicates based on the Ticket/Order ID.
- **Export & Clear**: Functionality to export all trades to CSV/PDF or clear the entire log.

### 3. Analytics (`/analytics`)
A dedicated page for a deep-dive analysis of your trading data.
- **Strategy Analytics**: A breakdown of performance by each trading strategy, showing which are most profitable.
- **Mistake Analysis**: A pie chart visualizing the most frequently made trading errors.
- **Performance Metrics**: A radar chart providing a holistic view of key metrics like Win Rate, Profit Factor, and Discipline.
- **Time-Based Analysis**: Charts that analyze performance by the day of the week and the hour of the day, helping identify your most and least profitable trading times.
- **Rule Adherence**: A table that shows the impact of following or breaking your predefined trading rules on your profitability.

### 4. Performance (`/performance`)
A page focused on advanced risk and return metrics.
- **Drawdown Analysis**: Visualizes your equity curve against its peak to analyze the depth and duration of drawdowns.
- **Risk-Adjusted Returns**: Cards displaying key metrics like Profit Factor, Expectancy, and Recovery Factor.
- **Risk Distribution**: A chart showing your profitability based on how much you risked per trade.

### 5. Trading Model (`/analytics` > `Trading Model` tab)
A page where you can define and manage your personal trading model.
- **Editable Checklists**: Users can create, edit, reorder, and delete items for different phases of their trading plan (e.g., Weekly Prep, Daily Prep, Execution).
- **Persistence**: The model is saved to the user's account and is integrated directly into the trade logging form.

---

## AI-Powered Features

This application leverages Generative AI (via Google's Gemini model and Genkit) to provide intelligent assistance.

- **AI Trade Import (`/ai/flows/import-trades-flow.ts`)**: This AI flow can understand and parse various file formats (CSV, PDF, images) to extract structured trade data, saving significant manual entry time. It intelligently maps fields and handles missing data.

- **AI Pattern Detection (`/ai/flows/pattern-detection.ts`)**: This flow acts as a trading psychologist, analyzing journal notes and psychological data to identify behavioral patterns, emotional correlations, and actionable insights to improve performance.

---

## Technology Stack

- **Framework**: Next.js (with App Router)
- **Language**: TypeScript
- **UI Components**: ShadCN UI
- **Styling**: Tailwind CSS
- **Database & Auth**: Firebase (Firestore, Firebase Auth, Storage)
- **Generative AI**: Genkit (with Google's Gemini models)
- **Charts**: Recharts
- **Deployment**: Firebase App Hosting
