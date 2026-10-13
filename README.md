# StadiumIQ (FanWay) 🏏🏟️

> **Spend less time on stadium hassles, Spend more time enjoying the game.**

StadiumIQ is an AI-powered match-day companion designed for cricket fans attending TATA Indian Premier League (IPL) matches. It bridges the gap between ticketing, venue navigation, and concourse services, eliminating stadium friction and reducing wait times so spectators can focus on the match.

---

## 🌟 Key Features

### 1. 🎟️ Digital Ticket Authentication & Barcode Scanner
- **Camera Barcode & QR Scanner**: Scan ticket barcodes in real time using the device camera.
- **Instant Seat Allocation**: Automatically reads and sets Gate, Stand/Section, Row, and Seat number.
- **Seat Tier Perks & Inclusions**: Unlocks VIP lounge access, express counter lanes, and complimentary concessions based on ticket tier.

### 2. 🗺️ Authentic Stadium Layouts & Interactive Navigation
- **Top IPL Stadiums Supported**:
  - Wankhede Stadium (Mumbai)
  - M. A. Chidambaram Stadium / Chepauk (Chennai)
  - Narendra Modi Stadium (Ahmedabad)
  - Eden Gardens (Kolkata)
  - M. Chinnaswamy Stadium (Bengaluru)
  - Arun Jaitley Stadium (Delhi)
  - *Plus regional configurations for Dharamshala, Jaipur, Lucknow, Uppal, Mullanpur, and Guwahati.*
- **Turn-by-Turn Route Calculator**: Calculates walking distance and estimated minutes from your seat to any gate, stand, concession, or restroom.
- **Accessibility Routing**: Toggle step-free accessible routes for wheelchair users and strollers.

### 3. ⏱️ Concourse Queue Estimation & Wait Time Predictions
- **Smart Queue Tracking**: Continuously calculates queue length and turnaround times across entry gates, concourse food stalls, water refill stations, and restrooms.
- **Faster Alternative Recommendations**: Automatically flags nearby lower-wait facilities when current queues are congested.

### 4. 🍔 Concourse Food & Beverage Finder
- **Categorized Menus**: Browse items in **Snack**, **Meal**, **Beverage**, and **Dessert** categories.
- **Dietary Preferences**: Filter easily by *Pure Veg Only*, *Jain Available*, *High Protein*, and *Gluten-Free*.
- **Live In-Stock & Price Controls**: Interactive slider filters by maximum budget (₹) and maximum acceptable queue wait time.
- **Simulated Ordering**: Add items to your cart with instant order codes for express counter pickup or seat delivery.

### 5. 🏏 Live Match Center & Venue Weather
- **Live Scoreboard**: Real-time score, required run rate, current overs, and partnership stats.
- **Phase & Interval Countdown**: Know precisely when strategy timeouts, innings breaks, and play resumes.
- **Atmospheric Conditions**: Live pitch-side temperature, humidity, and weather conditions.

### 6. 🌐 Multilingual Support & Safety Hub
- **Languages**: Available in English, Hindi (हिन्दी), and Odia (ଓଡ଼ିଆ).
- **Incident & Facility Reporting**: Log cleanliness, safety, or medical concerns directly to ground stewards.
- **Emergency Hub**: Direct hotlines, first-aid station locators, and designated assembly points.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons & Motion**: [Lucide React](https://lucide.dev/), [Motion](https://motion.dev/)
- **Backend & Proxy**: [Express](https://expressjs.com/) with Vite dev middleware
- **AI Concierge**: Server-side [@google/genai](https://www.npmjs.com/package/@google/genai) integration powered by Gemini

---

## 🚀 Getting Started

### Prerequisites

- Node.js 22+
- npm (Node Package Manager)

### Installation

1. Clone or open the repository:
   ```bash
   git clone https://github.com/ketchuphere/fanway.git
   cd fanway
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key (optional for the server-side concierge chat):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be running at `http://localhost:3000`.

### Building for Production

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
├── .env.example              # Environment variables template
├── index.html                # HTML entry point with metadata and fonts
├── metadata.json             # AI Studio applet capabilities & metadata
├── package.json              # Project dependencies and scripts
├── server.ts                 # Express server with Vite middleware & Gemini API endpoint
├── src/
│   ├── App.tsx               # Root view router and providers
│   ├── main.tsx              # React DOM entry point
│   ├── index.css             # Tailwind CSS global styles and typography
│   ├── assets/               # High-res stadium imagery and assets
│   ├── components/           # View components:
│   │   ├── AppShell.tsx          # Navigation bars, seat badge, and language switcher
│   │   ├── LandingPageView.tsx   # Hero landing page & quick IPL ticket scan entry
│   │   ├── TicketAuthView.tsx    # Live camera barcode reader & ticket simulator
│   │   ├── FanHomeView.tsx       # Main fan hub with quick actions & announcements
│   │   ├── StadiumMapView.tsx    # Interactive SVG stadium seating & facility map
│   │   ├── FoodFinderView.tsx    # Concourse food ordering, filters, & cart
│   │   ├── MatchCenterView.tsx   # Live score, overs, and weather overview
│   │   ├── HelpSafetyView.tsx    # Incident reporting, medical posts, & helpline
│   │   ├── FanActivityView.tsx   # Order statuses and reported issues history
│   │   └── SeatSetupModal.tsx    # Seat configuration and dietary preferences modal
│   ├── context/
│   │   └── StadiumContext.tsx    # Global stadium state, cart, profile, and ticket store
│   ├── data/
│   │   ├── iplStadiumsData.ts    # Configurations & layouts for 12 IPL venues
│   │   └── seedData.ts           # Demo orders, facilities, and initial announcements
│   ├── types/
│   │   └── stadium.ts            # TypeScript definitions for venues, items, & tickets
│   └── utils/
│       ├── i18n.ts               # Translations for English, Hindi, and Odia
│       └── queuePrediction.ts    # Queue wait heuristic and Dijkstra shortest path routing
└── tsconfig.json             # TypeScript configuration
```

---

## 📄 License

This project is licensed under the Apache-2.0 License.
