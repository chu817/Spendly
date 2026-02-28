"""Flask app: routes and error handling. Stateless REST API for impulse behaviour analytics."""
import logging
import tempfile
import os
from flask import Flask, jsonify, request
from flask_cors import CORS

from config import config
from src.data_loader import load_upload, load_demo, get_users_list, get_dataset, get_user_transactions
from src.features import compute_features
from src.scoring import compute_score
from src.profiling import ensure_profiler_fitted, get_profile
from src.explain import top_drivers, evidence_text, build_chart_series
from src.nudges_gemini import get_nudges

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=config["CORS_ORIGINS"], supports_credentials=True)


def success_response(data):
    """Return JSON success: { data }."""
    return jsonify({"data": data})


def error_response(message: str, code: str = "ERROR", status: int = 400):
    """Return JSON error: { error: { code, message } }."""
    return jsonify({"error": {"code": code, "message": message}}), status


@app.route("/api/health", methods=["GET"])
def health():
    """Health check for deployment."""
    return success_response({"status": "ok"})


@app.route("/api/upload", methods=["POST"])
def upload():
    """Accept CSV file or demo=1; return dataset_id, rows, users, date_range."""
    try:
        if request.args.get("demo") == "1":
            demo_path = config.get("DEMO_DATASET_PATH") or ""
            if not demo_path:
                return error_response("Demo dataset path not configured", "CONFIG_ERROR", 500)
            dataset_id, rows, n_users, date_range = load_demo(demo_path)
            return success_response({
                "dataset_id": dataset_id,
                "rows": rows,
                "users": n_users,
                "date_range": list(date_range),
            })
        file = request.files.get("file")
        if not file or file.filename == "":
            return error_response("No file provided", "VALIDATION_ERROR", 400)
        if not file.filename.lower().endswith(".csv"):
            return error_response("File must be a CSV", "VALIDATION_ERROR", 400)
        max_mb = config.get("MAX_UPLOAD_MB", 3200)
        chunk_size = config.get("CHUNK_SIZE", 100000)
        with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
            file.save(tmp.name)
            try:
                dataset_id, rows, n_users, date_range, _ = load_upload(
                    tmp.name, chunk_size=chunk_size
                )
                return success_response({
                    "dataset_id": dataset_id,
                    "rows": rows,
                    "users": n_users,
                    "date_range": list(date_range),
                })
            finally:
                try:
                    os.unlink(tmp.name)
                except OSError:
                    pass
    except FileNotFoundError as e:
        return error_response(str(e), "NOT_FOUND", 404)
    except ValueError as e:
        return error_response(str(e), "VALIDATION_ERROR", 400)
    except Exception as e:
        logger.exception("Upload failed")
        return error_response("Upload failed", "SERVER_ERROR", 500)


@app.route("/api/users", methods=["GET"])
def users():
    """Return list of card_id with tx_count and date_range for the dataset."""
    dataset_id = request.args.get("dataset_id")
    if not dataset_id:
        return error_response("dataset_id is required", "VALIDATION_ERROR", 400)
    users_list = get_users_list(dataset_id)
    if users_list is None:
        return error_response("Dataset not found", "NOT_FOUND", 404)
    return success_response({"users": users_list})


@app.route("/api/analyze", methods=["GET"])
def analyze():
    """Run features, score, profile, explain for one user; return score, profile, breakdown, chart series."""
    dataset_id = request.args.get("dataset_id")
    card_id = request.args.get("card_id")
    if not dataset_id or not card_id:
        return error_response("dataset_id and card_id are required", "VALIDATION_ERROR", 400)
    df_full = get_dataset(dataset_id)
    if df_full is None:
        return error_response("Dataset not found", "NOT_FOUND", 404)
    user_df = get_user_transactions(dataset_id, card_id)
    if user_df is None or len(user_df) == 0:
        return error_response("User not found or no transactions", "NOT_FOUND", 404)
    try:
        features = compute_features(user_df)
        ensure_profiler_fitted(dataset_id, df_full, compute_features)
        profile = get_profile(dataset_id, features)
        score, breakdown, risk_band = compute_score(features)
        drivers = top_drivers(breakdown)
        evidence = evidence_text(features, breakdown)
        chart_series = build_chart_series(user_df, features)
        return success_response({
            "risk_score": score,
            "risk_band": risk_band,
            "score_breakdown": breakdown,
            "top_drivers": drivers,
            "profile": profile,
            "chart_series": chart_series,
            "evidence": evidence,
        })
    except Exception as e:
        logger.exception("Analyze failed")
        return error_response("Analysis failed", "SERVER_ERROR", 500)


@app.route("/api/nudges", methods=["POST"])
def nudges():
    """Generate nudges from analysis summary (aggregated metrics only). Returns Gemini or fallback nudges."""
    try:
        body = request.get_json() or {}
        risk_score = float(body.get("risk_score", 0))
        risk_band = str(body.get("risk_band", "Low"))
        profile_label = str(body.get("profile_label", ""))
        top_drivers = body.get("top_drivers") or []
        metrics = body.get("metrics") or {}
        api_key = config.get("GEMINI_API_KEY") or ""
        nudges_list = get_nudges(risk_score, risk_band, profile_label, top_drivers, metrics, api_key)
        return success_response({"nudges": nudges_list})
    except Exception as e:
        logger.exception("Nudges failed")
        return error_response("Nudge generation failed", "SERVER_ERROR", 500)


@app.errorhandler(404)
def not_found(e):
    return error_response("Not found", "NOT_FOUND", 404)


@app.errorhandler(500)
def server_error(e):
    logger.exception("Server error")
    return error_response("An unexpected error occurred", "SERVER_ERROR", 500)


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=(config["FLASK_ENV"] == "development"))
