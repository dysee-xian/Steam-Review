# DPRF FastAPI backend

The backend keeps the existing React + Vite frontend and exposes the API at
`http://127.0.0.1:8000`. Models are loaded once during application startup from
`app/models/`; the DistilBERT loader is local-only and does not download weights.

## Windows setup

Use 64-bit Python 3.13. The checked-in model configuration records
scikit-learn 1.6.1, Transformers 5.20.2, and CPU PyTorch 2.11.0. The pinned
scikit-learn and CPU PyTorch releases have Windows/Python 3.13 wheels.

From the repository root:

```powershell
py -3.13 -m venv backend\.venv
backend\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt
```

Copy `backend\.env.example` to `backend\.env` only if no backend `.env` exists;
otherwise merge the example variables into the existing file. Configure
`FIREBASE_DATABASE_URL` and `FRONTEND_ORIGIN`. For local Firebase Admin access,
set `GOOGLE_APPLICATION_CREDENTIALS` to a service-account JSON stored outside
the repository with restricted file permissions. Do not commit the credential
or put it in a `VITE_*` variable. A deployment may instead use its
Application Default Credentials.

Firebase Admin reads `steam_review_analytics/v1`; the backend does not write
to RTDB. Admin credentials can bypass Realtime Database Security Rules, so do
not expose this API publicly without an appropriate access-control layer.
Only load the joblib model artifact if it came from a trusted source; joblib
uses Python serialization formats that are unsafe for untrusted files.

Run from the repository root:

```powershell
python -m uvicorn app.main:app --app-dir backend --reload
```

The backend attempts to load both model artifacts once at startup. If model
loading fails, the API remains available in a degraded state so health and
batch-readiness endpoints can report the issue; model inference endpoints
return an explicit service-unavailable error. A malformed or unreadable DPRF
configuration still prevents startup. Interactive API documentation is
available at `http://127.0.0.1:8000/docs`.

## Endpoints

| Method and path | Purpose |
|---|---|
| `GET /api/health` | Backend health and whether models loaded |
| `GET /api/dataset` | Read-only value of RTDB node `steam_review_analytics/v1` |
| `GET /api/persona/batch` | SAW metrics derivable from the verified aggregated persona summaries |
| `POST /api/sentiment` | DistilBERT SST-2 sentiment for a review |
| `POST /api/absa` | Keyword-matched aspects plus whole-review DistilBERT sentiment |
| `POST /api/persona` | SAW score using configured weights and P95 values |
| `GET /api/prediction/batch` | Model configuration and batch-readiness status; does not infer when the original feature pipeline is unavailable |
| `POST /api/prediction` | Engagement decline inference from 15 precomputed features |

### Batch analysis availability

The batch persona endpoint reads only
`steam_review_analytics/v1/saw/persona_summary`. It can report the number of
players represented by those groups, calculate a population-average SAW score
from their stored criterion averages using the configured weights and P95
values, chart aggregate criterion contributions, and return the stored group
summaries. The node does not contain individual player rows or individual
scores, so individual score extremes, a per-player score distribution, and a
per-player result table are returned as unavailable rather than inferred.

The engagement batch endpoint reads the documented
`engagement_prediction/evaluation_metrics` node and returns the algorithm,
model filename, target, threshold, and ordered feature columns from
`dprf_config.json`. No raw per-player input schema or original feature
engineering/preprocessing code is present in the repository or
`backend/data/raw` / `backend/data/processed`. Consequently, it explicitly
blocks batch inference and returns no predicted player records. The existing
`POST /api/prediction` remains available for one caller-supplied, already
preprocessed feature record; it does not provide an alternative batch pipeline.

### Request and response shapes

These are schemas; replace placeholders with real input values. The backend
does not derive or fabricate model features.

`POST /api/sentiment`

```json
{"review": "<actual review text>"}
```

```json
{"label": "<NEGATIVE or POSITIVE>", "score": "<model confidence>"}
```

`POST /api/absa`

```json
{"review": "<actual review text>"}
```

```json
{
  "review_sentiment": "<NEGATIVE or POSITIVE>",
  "review_sentiment_score": "<model confidence>",
  "sentiment_scope": "entire_review",
  "aspects": [
    {
      "aspect": "<configured aspect>",
      "matched_keywords": ["<matched configured keyword>"],
      "review_sentiment": "<NEGATIVE or POSITIVE>",
      "score": "<model confidence>"
    }
  ]
}
```

Each configured aspect with a keyword match is returned; a review can match
multiple aspects. Sentiment is currently predicted for the whole review and
reported for each matched aspect. This does not claim sentence- or
aspect-specific polarity.

`POST /api/persona`

```json
{
  "review_count": "<actual number>",
  "avg_playtime_hours": "<actual number>",
  "avg_games_owned": "<actual number>",
  "avg_helpful_votes": "<actual number>"
}
```

The response contains `persona_score`, `normalized_criteria`,
`criteria_weights`, `normalization`, and `persona_category: null`. Category
cutoffs are not defined in `dprf_config.json`; no low/medium/high label is
assigned.

`POST /api/prediction`

```json
{
  "features": {
    "review_count_2019": "<actual number>",
    "unique_games_2019": "<actual number>",
    "reviews_q1": "<actual number>",
    "reviews_q2": "<actual number>",
    "reviews_q3": "<actual number>",
    "reviews_q4": "<actual number>",
    "avg_playtime_2019": "<actual number>",
    "avg_playtime_at_review_2019": "<actual number>",
    "avg_games_owned_2019": "<actual number>",
    "avg_votes_up_2019": "<actual number>",
    "avg_votes_funny_2019": "<actual number>",
    "avg_weighted_score_2019": "<actual number>",
    "positive_ratio_2019": "<actual number>",
    "days_since_last_review": "<actual number>",
    "active_quarters": "<actual number>"
  }
}
```

JSON object order is not used as the model column order: the backend validates
that all and only the configured features are supplied, then arranges them in
the exact `feature_columns` order in `dprf_config.json`.

```json
{
  "prediction": "<0 or 1>",
  "label": "<Tidak Menurun or Menurun>",
  "probability_decline": "<model probability>",
  "threshold": 0.62,
  "target": "engagement_decline"
}
```

Invalid or missing feature values return HTTP 422 before model inference.
Firebase configuration/access errors return HTTP 503; a missing RTDB root
returns HTTP 404.

## Verification

On the Windows machine where the native runtimes are supported:

1. Run `python -m pip check`.
2. Start the server and confirm `/api/health` reports `"models_loaded": true`.
3. Use `/docs` to submit real review text to `/api/sentiment` and `/api/absa`.
   The ABSA result should only include aspects matched by configured keywords.
4. Submit actual measured persona criteria to `/api/persona`; verify returned
   normalized criteria against `dprf_config.json`. No category is assigned.
5. Submit an actual precomputed 15-feature record to `/api/prediction`; confirm
   validation rejects missing/extra features and the response uses the
   configured threshold and class labels.
6. Call `/api/dataset` and compare the read-only response with the existing
   RTDB root.

No raw review dataset, source preprocessing, feature-construction code,
category cutoffs, or analysis-history node is present in this repository.
Accordingly, feature engineering, persona category assignment, and history
storage are not implemented here.
