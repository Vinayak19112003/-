# Anony Trading - A Modern Journal for Professionals

## Overview

This application is a sophisticated and modern trading journal designed for professional traders who want to elevate their performance through detailed record-keeping and intelligent analysis. It provides a comprehensive suite of tools to log, review, and analyze trades, helping users identify patterns, refine strategies, and maintain discipline.

The journal is built with a focus on data-driven insights, psychological analysis, and a clean, intuitive user interface.

---

## Core Features

The application is organized into several key sections, each serving a distinct purpose in a trader's workflow.

### 1. Dashboard (`/dashboard`)
The main landing page, providing a high-level, at-a-glance overview of your trading performance.
- **Summary Banner**: Displays progress towards monthly profit/loss targets and highlights the most common mistake for the current month.
- **Key Performance Indicators (KPIs)**: A series of cards showing vital statistics like Total PNL, Net R, Win Rate, and more for the selected time period.
- **Monthly Calendar**: A visual, color-coded calendar showing daily profitability, allowing for quick identification of winning and losing days.
- **Equity Curve**: A chart that visualizes your cumulative R-value over time, showing the growth of your account.

### 2. Trade Log (`/trades`)
The central hub for all your individual trade records.
- **Paginated Table**: Displays all trades in a clean, organized table with infinite scrolling ("Load More") for efficient performance.
- **Add/Edit Trades**: A comprehensive form allows for detailed logging, including entry/exit prices, strategy, psychological state, and screenshots.
- **AI-Powered Import**: Users can upload a CSV, PDF, or even a screenshot of their broker statement, and the AI will automatically parse and import the trades, skipping any duplicates.
- **Export & Clear**: Functionality to export all trades to CSV/PDF or clear the entire log.

### 3. Analysis (`/analysis`)
A dedicated page for a deep-dive analysis of your trading data.
- **Strategy Analytics**: A breakdown of performance by each trading strategy, showing which are most profitable.
- **Mistake Analysis**: A pie chart visualizing the most frequently made trading errors.
- **Performance Metrics**: A radar chart providing a holistic view of key metrics like Win Rate, Profit Factor, and Discipline.
- **Time-Based Analysis**: Charts that analyze performance by the day of the week and the hour of the day, helping identify your most and least profitable trading times.
- **Rule Adherence**: A table that shows the impact of following or breaking your predefined trading rules on your profitability.

### 4. Trading Model (`/model`)
A page where you can define and manage your personal trading model.
- **Editable Checklists**: Users can create, edit, reorder, and delete items for different phases of their trading plan (e.g., Weekly Prep, Daily Prep, Execution).
- **Persistence**: The model is saved to the user's account and is integrated directly into the trade logging form.

### 5. Discipline (`/discipline`)
A read-only page that serves as a quick reference to your defined trading model.
- **Simple Checklist View**: Displays your saved trading model in a clean, easy-to-read checklist format, reinforcing your trading plan before each session.

---

## AI-Powered Features

This application leverages Generative AI (via Google's Gemini model and Genkit) to provide intelligent assistance.

- **AI Trade Import (`/ai/flows/import-trades-flow.ts`)**: This AI flow can understand and parse various file formats (CSV, PDF, images) to extract structured trade data, saving significant manual entry time.
- **AI Pattern Detection (`/ai/flows/pattern-detection.ts`)**: This flow acts as a trading psychologist, analyzing journal notes and psychological data to identify behavioral patterns, emotional correlations, and actionable insights to improve performance.

---

## Technology Stack

- **Framework**: Next.js (with App Router)
- **Language**: TypeScript
- **UI Components**: ShadCN UI
- **Styling**: Tailwind CSS
- **Database & Auth**: Firebase (Firestore, Firebase Auth)
- **Generative AI**: Genkit (with Google's Gemini models)
- **Charts**: Recharts
