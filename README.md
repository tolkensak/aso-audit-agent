# ASO Audit Agent

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38B2AC.svg)](https://tailwindcss.com/)

An AI-powered App Store Optimization audit tool that analyzes iOS app listings and provides actionable recommendations to improve visibility and conversions.

<br />

## ✨ Features

- 🔍 **Smart URL Parsing** — Paste any Apple App Store URL, and the agent extracts the app ID automatically

- 📊 **Comprehensive Audits** — Scores 7 ASO dimensions (Title, Subtitle, Keywords, Description, Screenshots, Ratings, Icon) with weighted scoring

- 🎯 **Actionable Insights** — Prioritized recommendations divided into Quick Wins, High-Impact Changes, and Strategic Improvements

- 📈 **Visual Feedback** — Progress bars, per-dimension scores, and overall score out of 100 with color coding

- 💬 **Conversational Interface** — Chat-based UX that confirms the app before running the audit

- 🤖 **AI-Powered** — Uses Groq's Mixtral 8x7B model for natural language responses

<br />

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or 20+
- npm or yarn
- A [Groq API key](https://console.groq.com) (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tolkensak/aso-audit-agent.git
   cd aso-audit-agent
   ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Set up environment variables**

    ```bash
    cp .env.example .env.local
    ```

    Then edit .env.local with your Groq API key:

    ```env
    OPENAI_API_KEY=your_groq_api_key_here
    OPENAI_BASE_URL=https://api.groq.com/openai/v1
    OPENAI_MODEL=mixtral-8x7b-32768
    ```

4. **Run the development server**

    ```bash
    npm run dev
    ```

5. **Open your browser at http://localhost:3000**

### Getting a Free Groq API Key

1. Go to console.groq.com

2. Sign up for a free account

3. Navigate to API Keys

4. Click Create API Key

5. Copy the key and add it to your .env.local

<br />

## 🧠 How It Works

### 1. URL Parsing & Scraping

When you paste an App Store URL, the app:

- Extracts the app ID and country code

- Fetches metadata from Apple's iTunes API

- Displays the app name, developer, category, and rating

### 2. User Confirmation

The agent asks: "Is this the app you meant to audit?"

- Yes → Proceeds to the full audit

- No → Resets and waits for a new URL

### 3. ASO Audit Engine
The audit scores 7 dimensions on a 0–10 scale:

| Dimension | Weight | Key Checks |
| :--- | :---: | :--- |
| Title | 20% | Length ≤30 chars, primary keywords present, natural reading |
| Subtitle | 15% | Length ≤30 chars, benefit-driven, secondary keywords |
| Keyword Field | 15% | 100-char utilization, no duplicates, singular forms |
|  Description | 10% | Hook in first 3 lines, benefit-framed features, CTA |
| Screenshots | 15% | All 10 slots used, first 2-3 communicate value |
| Ratings & Reviews | 15% | Average rating, recent trend, developer responses |
| Icon | 10% | Distinctive in search, clear at small sizes |

The weighted sum produces an **Overall ASO Score** out of 100.

### 4. Results Presentation

The agent presents:

- **ASO Score Card** — Overall score with color coding and per-dimension progress bars

- **Quick Wins** — 3–5 high-impact, low-effort changes you can make today

- **High-Impact Changes** — 3–5 recommendations requiring more effort

- **Strategic Recommendations** — 2–3 longer-term improvements

- **Before/After Examples** — Specific text changes with evidence

<br />

## 🧪 Testing with Different Apps

The tool works with any Apple App Store URL. Try these:

| App | URL |
| :--- | :--- |
| Spotify | https://apps.apple.com/us/app/spotify-music-and-podcasts/id324684580 |
| Headspace | https://apps.apple.com/us/app/headspace-meditation/id493145008 |
| Duolingo | https://apps.apple.com/us/app/duolingo-language-lessons/id570060128 |
| Calm | https://apps.apple.com/us/app/calm-meditation-sleep-stories/id571800810 |

<br />

## 🏗️ Architecture

```text
User Input → URL Parsing → iTunes API → App Metadata → User Confirmation → ASO Audit Engine → Results
```

### Key Components

- **src/app/api/chat/route.ts** — API route handling chat requests and session management

- **src/lib/scraper.ts** — Scrapes App Store metadata via iTunes API

- **src/lib/audit-engine.ts** — Core ASO audit logic with weighted scoring

- **src/lib/openai-client.ts** — Groq API client for AI-powered responses

- **src/types/aso-types.ts** — TypeScript types for the entire application

- **src/app/page.tsx** — Chat UI with real-time updates

### Session Management

The app maintains conversation state in memory:

- **idle** → Waiting for a URL

- **scraping** → Fetching app metadata

- **confirming** → Waiting for user confirmation

- **auditing** → Running the ASO audit

- **complete** → Audit complete, accepting follow-up questions

<br />

## 🛠️ Development

### Scripts
| Command | Description |
| :--- | :--- |
| **npm run dev** | Start development server with hot reload |
| **npm run build** | Build for production |
| **npm start** | Start production server |
| **npm run lint** | Run ESLint |
| **npm run type-check** | Run TypeScript type checking |

### Adding New Audit Dimensions

1. Add your dimension to the scoring functions in **src/lib/audit-engine.ts**

2. Update the dimension list in the **performAudit** function

3. The new dimension will automatically appear in results

<br />

## 🔧 Environment Variables

| Variable | Description | Required |
| :--- | :--- | :--- |
| **OPENAI_API_KEY** | Groq API key | Yes |
| **OPENAI_BASE_URL** | Groq API endpoint | No (defaults to Groq) |
| **OPENAI_MODEL** | Model to use | No (defaults to mixtral-8x7b-32768) |

<br />

## 🤝 Contributing

1. Fork the repository

2. Create a feature branch: **git checkout -b feature/amazing-feature**

3. Commit your changes: **git commit -m 'Add amazing feature'**

4. Push to the branch: **git push origin feature/amazing-feature**

5. Open a Pull Request

<br />

## 📝 License

MIT — feel free to use this project for any purpose.

<br />

## 🙏 Acknowledgments

- Built with Next.js

- AI powered by Groq

- App data from Apple's iTunes API

- Inspired by the open-source aso-skills project

<br />

## 🔗 Links

GitHub Repository: https://github.com/tolkensak/aso-audit-agent

GitHub Portfolio: https://tolkensak.github.io/tolkensak/

LinkedIn Profile: https://www.linkedin.com/in/tolkyn-akhmetollauly-0a3873a9/

<br />

---

Made with ❤️ by Tolkyn Akhmetollauly
