# NSE Participant OI Dashboard

A Bloomberg-terminal-style React dashboard for analysing NSE Participant Open Interest data (FII · DII · Client · Pro). Auto-refreshes daily from your GitHub repo.

---

## 📁 Recommended Repository Layout

```
your-repo/
├── nse_participant_oi_combined.csv   ← your daily-updated data file
├── dashboard/                        ← this entire folder (the React app)
│   ├── .github/workflows/deploy.yml
│   ├── public/config.json
│   ├── src/
│   ├── package.json
│   └── vite.config.js
└── (your data-fetch scripts, etc.)
```

---

## 🚀 Quick-Start: Local Development

```bash
cd dashboard
npm install
npm run dev          # opens http://localhost:5173
```

On first load, a config modal asks for your CSV URL. Paste it (format below) and it is saved in browser `localStorage`.

---

## ⚙ Step 1 — Configure the CSV URL

Edit **`public/config.json`**:

```json
{
  "csvUrl": "https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/nse_participant_oi_combined.csv",
  "refreshIntervalMinutes": 60,
  "dashboardTitle": "NSE Participant OI Dashboard"
}
```

Replace `YOUR_USERNAME` and `YOUR_REPO` with your actual GitHub username and repository name.

---

## 🌐 Step 2 — Deploy to GitHub Pages (one-time setup)

### A. Enable GitHub Pages

1. Go to your repo → **Settings → Pages**
2. Under **Source**, select **GitHub Actions**
3. Click Save

### B. Adjust the workflow path (if needed)

The workflow file (`.github/workflows/deploy.yml`) assumes the React app lives in a `dashboard/` sub-folder. If you put it at the repo root, change:
```yaml
working-directory: ./dashboard   →   working-directory: .
path: ./dashboard/dist           →   path: ./dist
```

### C. Push to main

```bash
git add .
git commit -m "deploy: initial dashboard"
git push origin main
```

GitHub Actions will build and deploy automatically. Your dashboard will be live at:

```
https://YOUR_USERNAME.github.io/YOUR_REPO/
```

---

## 🔄 Step 3 — Automatic Daily Refresh

The workflow runs at **04:00 UTC (≈ 9:30 IST)** Mon–Fri via a `cron` schedule. Every rebuild picks up the latest CSV from your repo, so just keep your CSV-update script committing to `main` and the dashboard stays fresh.

You can also trigger a rebuild manually:  
**Actions → Deploy NSE Dashboard → Run workflow**

---

## 📊 Dashboard Features

| Section | What it shows |
|---|---|
| ⚡ Signals panel | Auto-derived FII bias, PCR alert, DII hedge alert, OI momentum, retail vs FII conflict |
| 📊 Summary cards | FII net index fut · PCR · FII L/S ratio · DII put hedge · Total OI |
| FII Futures chart | Index + stock futures net position over time (area chart, zero-anchored) |
| PCR Trend chart | Put/Call ratio with fear (>1.2) and greed (<0.7) zones |
| L/S Ratio chart | Long/short ratio for all four participant types |
| FII–DII Divergence | Bar + line combo — wide gaps = contrarian watch |
| FII Options chart | FII call vs put long + net options bias |
| OI Momentum chart | Day-on-day OI change bars + total OI level |
| Weekly Heatmap | % week-on-week change across 8 metrics, colour-coded |
| Reading Guide | Plain-English signal interpretation for each chart |

---

## 🧠 Derived Metrics

```
FII Net Index Fut   = future_index_long - future_index_short         (for FII)
PCR Index           = Σ(all_put_index_long) / Σ(all_call_index_long)
FII L/S Ratio       = FII total_long / FII total_short
DII Put Hedge Ratio = DII option_index_put_long / DII option_index_call_long
FII–DII Divergence  = FII net index fut − DII net index fut
FII Opt Net         = FII option_index_call_long − FII option_index_put_long
OI Momentum         = totalOI[today] − totalOI[yesterday]
```

---

## 📝 CSV Format Required

```
trade_date,client_type,future_index_long,future_index_short,future_stock_long,
future_stock_short,option_index_call_long,option_index_put_long,
option_index_call_short,option_index_put_short,option_stock_call_long,
option_stock_put_long,option_stock_call_short,option_stock_put_short,
total_long,total_short
```

`client_type` values: `FII`, `DII`, `Client`, `Pro`, `TOTAL`

---

## ⚠ Disclaimer

This dashboard is for analytical and educational purposes only. It is **not investment advice**. Always do your own research.
