# Free Fire Point Table Calculator & Broadcast Graphic Generator

A tournament control room and broadcast-quality standings graphic generator built for esports tournament organizers in Bangladesh.

---

## 1. Quick Start

### Prerequisites
- Node.js 18+ (tested on Node v24)
- npm 9+

### Installation & Launch
```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Or build & preview production build
npm run build
npm run preview
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 2. Tournament Modes & Rules

### Mode A: Scrim
- Fixed number of matches: 2, 3, 5, or custom (1–10).
- Final standings decided strictly by cumulative points and 5-tier tie-break rules.

### Mode B: Champion Rush
- **Target Points**: 50, 60, 70, or custom.
- **Max Matches**: 5, 8, 10, or custom.
- **Activation Rule**: A squad becomes **Rush ACTIVE** starting from the match *after* crossing the target points.
- **Winning Condition**: The first active team to secure a **Booyah** (1st place) in a subsequent match is crowned **CHAMPION** and locked at **#1**, regardless of total points.
- **Same-Match Booyah Toggle**: By default OFF (a team crossing target in Match X cannot win in Match X). Can be enabled in Settings if desired.
- **Fallback**: If max matches is reached without an active Booyah, ranking falls back to total points.

---

## 3. How to Change Point Values & Tie-Breaks

1. Navigate to the **Setup & Teams** tab.
2. In the **Point System Settings** panel:
   - **Kill Points**: Enter the points awarded per kill (default: `1`).
   - **Placement Points Scale**: Edit individual finish positions 1st through 15th directly (defaults: `1st=12`, `2nd=9`, `3rd=8`, `4th=7`, `5th=6`, `6th=5`, `7th=4`, `8th=3`, `9th=2`, `10th=1`, `11th-15th=0`).
3. Changes apply dynamically across all completed and future matches.
4. **Tie-Break Hierarchy**:
   1. Total Points (descending)
   2. Booyah Count (descending)
   3. Placement Points (descending)
   4. Total Kills (descending)
   5. Last Match Finish Placement (ascending)

---

## 4. How to Export & Share Graphics

1. Go to the **Results & Standing Graphic** tab.
2. Select your desired view:
   - **Overall Standing** (cumulative tournament standings) or **Single Match** (isolated match finishes).
3. Choose the design aspect ratio:
   - **16:9 Landscape** (1920×1080) for streaming overlays, YouTube, and broadcast displays.
   - **4:5 Portrait** (1080×1350) for Facebook and Instagram posts.
4. Click:
   - **Download PNG (2X)**: Exports a pixel-perfect, ultra-crisp 4K/retina PNG via `html-to-image` with row entrance animations automatically bypassed.
   - **Copy to Clipboard**: Copies the PNG image directly to your clipboard for instant pasting into WhatsApp, Discord, or Facebook.

---

## 5. Testing & Verification

Run the pure scoring engine Vitest test suite:
```bash
npx vitest run
```
Tests verify Scrim modes (12 & 15 teams), Champion Rush activation timing edge cases, past match edit recalculations, and tie-breakers.
