# Impulse Finance – Detecting Financial Impulse Behaviour in Young Adults

A full-stack behavioural analytics web application that detects impulsive spending patterns from transaction history (Elo Merchant Category Recommendation dataset) and provides:

- **Impulse Risk Score** (0–100) with risk band (Low / Medium / High / Critical)
- **Spending Behaviour Profile** (cluster-based persona, e.g. Late-night spender, Burst buyer)
- **Personalized behavioural nudges** (Gemini-powered, with deterministic fallback)
- **Transparent explanations** grounded in measurable behavioural indicators

**Important:** This system detects **behavioural indicators** of impulse spending from transaction patterns. It is not a medical or psychological diagnosis tool. Elo data is anonymized and `purchase_amount` is not real currency.

---

## Stack

- **Backend:** Flask (Python), pandas, scikit-learn, Google Generative AI (Gemini) for nudges
- **Frontend:** Next.js (React), TypeScript

---

## Setup

### Backend

```bash
cd impulse-finance-app/backend
python -m venv .venv
source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
```

Copy `.env.example` to `.env` in the project root and set:

- `GEMINI_API_KEY` – optional; if not set, deterministic fallback nudges are used
- `DEMO_DATASET_PATH` – path to `historical_transactions.csv` (e.g. `../historical_transactions.csv` relative to repo root)
- `CORS_ORIGINS` – default `http://localhost:3000` for the Next.js dev server

Run the API:

```bash
cd backend && python app.py
```

API runs at `http://localhost:5000` by default. If port 5000 is busy, set `PORT` (example: 5001) in your `.env`.

### Frontend

```bash
cd impulse-finance-app/frontend
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL=http://localhost:5000` in `.env.local` if the API is on another host.
If you change the backend port, also update `NEXT_PUBLIC_API_URL` (example: `http://localhost:5001`).

---

## Usage

1. **Upload / Load data** – Upload a CSV with columns `card_id`, `purchase_date`, `purchase_amount`, `category_1`, `category_2`, `category_3`, or use **Use demo dataset** (requires `DEMO_DATASET_PATH`).
2. **Select a user** – Choose a `card_id` from the dashboard.
3. **View results** – Impulse risk score, behaviour profile, top drivers, evidence, nudges, and charts (daily spend, hour-of-day, category distribution, EOM comparison).

---

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/upload` | POST | Upload CSV file, or `?demo=1` to load demo dataset. Returns `dataset_id`, `rows`, `users`, `date_range`. |
| `GET /api/users?dataset_id=...` | GET | List of `card_id` with tx count and date range. |
| `GET /api/analyze?dataset_id=...&card_id=...` | GET | Risk score, profile, breakdown, chart series, evidence. |
| `POST /api/nudges` | POST | Body: `{ risk_score, risk_band, profile_label, top_drivers, metrics }`. Returns Gemini or fallback nudges. |

---

## Repo structure

```
impulse-finance-app/
  backend/
    app.py              # Flask routes
    config.py           # Env config
    src/
      data_loader.py    # CSV validation, chunked load, dataset store
      features.py       # Behavioural feature computation
      scoring.py        # Risk score and breakdown
      profiling.py      # KMeans clustering, profile labels
      nudges_gemini.py  # Gemini API + fallback nudges
      explain.py        # Top drivers, evidence, chart series
      utils.py          # Validation, constants
  frontend/
    pages/              # Next.js pages
    components/         # UploadCard, UserSelector, ScoreGauge, etc.
    lib/                # api.ts, types.ts, utils.ts
  .gitignore
  .env.example
  README.md
```

---

## Data and safety

- Only **aggregated metrics** and top drivers are sent to Gemini for nudges; no raw transactions or PII.
- Datasets are held in memory keyed by `dataset_id`; server restart clears them.
- For very large CSVs, the loader caps rows (see `MAX_ROWS_DEFAULT` in `data_loader.py`) and uses chunked reads.
