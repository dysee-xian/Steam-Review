import json
import math
from pathlib import Path
from typing import Any


MODEL_DIRECTORY = Path(__file__).resolve().parents[1] / "models"
CONFIG_PATH = MODEL_DIRECTORY / "dprf_config.json"


class ModelLoadError(RuntimeError):
    pass


def load_dprf_config() -> dict[str, Any]:
    try:
        config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise ModelLoadError(f"Gagal membaca konfigurasi DPRF: {error}") from error

    if not isinstance(config, dict):
        raise ModelLoadError("Root dprf_config.json harus berupa object.")

    try:
        engagement = config["engagement_prediction"]
        sentiment = config["sentiment_analysis"]
        absa = config["absa"]
        saw = config["saw"]
        versions = config["library_versions"]
        features = engagement["feature_columns"]
        weights = saw["criteria_weights"]
        normalizers = saw["normalization_values"]
        keywords = absa["aspect_keywords"]
    except (KeyError, TypeError) as error:
        raise ModelLoadError(
            f"Struktur dprf_config.json tidak lengkap: {error}"
        ) from error

    if (
        not isinstance(features, list)
        or len(features) != 15
        or not all(isinstance(name, str) and name for name in features)
        or len(set(features)) != len(features)
    ):
        raise ModelLoadError(
            "engagement_prediction.feature_columns harus memuat 15 nama "
            "fitur unik sesuai urutan model."
        )

    threshold = engagement.get("threshold")
    if (
        isinstance(threshold, bool)
        or not isinstance(threshold, (int, float))
        or not math.isfinite(threshold)
        or not 0 <= threshold <= 1
    ):
        raise ModelLoadError("Threshold engagement_prediction tidak valid.")

    class_labels = engagement.get("class_labels")
    if (
        not isinstance(class_labels, dict)
        or set(class_labels) != {"0", "1"}
        or not all(isinstance(label, str) and label for label in class_labels.values())
    ):
        raise ModelLoadError("engagement_prediction.class_labels tidak valid.")

    if not isinstance(sentiment.get("max_length"), int) or sentiment[
        "max_length"
    ] < 1:
        raise ModelLoadError("sentiment_analysis.max_length tidak valid.")

    if not isinstance(sentiment.get("model_directory"), str) or not sentiment[
        "model_directory"
    ]:
        raise ModelLoadError("sentiment_analysis.model_directory tidak valid.")

    if not isinstance(weights, dict) or not isinstance(normalizers, dict):
        raise ModelLoadError("Konfigurasi normalisasi SAW tidak valid.")

    expected_normalizers = {f"{criterion}_p95" for criterion in weights}
    if set(normalizers) != expected_normalizers:
        raise ModelLoadError(
            "normalization_values harus memiliki nilai <kriteria>_p95 untuk "
            "setiap kriteria SAW."
        )

    weight_values = list(weights.values())
    if (
        any(
            isinstance(value, bool)
            or not isinstance(value, (int, float))
            or not math.isfinite(value)
            or value < 0
            for value in weight_values
        )
        or not math.isclose(sum(weight_values), 1.0, rel_tol=1e-6)
    ):
        raise ModelLoadError("Bobot SAW harus finite dan berjumlah 1.")

    if any(
        isinstance(value, bool)
        or not isinstance(value, (int, float))
        or not math.isfinite(value)
        or value <= 0
        for value in normalizers.values()
    ):
        raise ModelLoadError("Nilai normalisasi P95 harus positif dan finite.")

    if not isinstance(keywords, dict) or not keywords:
        raise ModelLoadError("absa.aspect_keywords tidak valid.")

    if any(
        not isinstance(aspect, str)
        or not isinstance(terms, list)
        or not all(isinstance(term, str) and term for term in terms)
        for aspect, terms in keywords.items()
    ):
        raise ModelLoadError("Daftar keyword ABSA tidak valid.")

    for package in ("scikit_learn", "transformers", "torch"):
        if not isinstance(versions.get(package), str):
            raise ModelLoadError(
                f"Versi {package} tidak tercatat di dprf_config.json."
            )

    return config


def _model_path(configured_path: str) -> Path:
    path = (MODEL_DIRECTORY / configured_path).resolve()
    if not path.is_relative_to(MODEL_DIRECTORY.resolve()):
        raise ModelLoadError("Path artefak model harus berada di folder models.")
    if not path.exists():
        raise ModelLoadError(f"Artefak model tidak ditemukan: {path.name}")
    return path


def load_model_bundle(config: dict[str, Any]) -> dict[str, Any]:
    try:
        import joblib
        import pandas as pd
        import sklearn
        import torch
        import transformers
        from sklearn.ensemble import HistGradientBoostingClassifier
        from transformers import AutoModelForSequenceClassification, AutoTokenizer
    except (ImportError, OSError, RuntimeError) as error:
        raise ModelLoadError(
            "Dependensi model belum tersedia atau gagal dimuat. Verifikasi "
            "versi paket dan dukungan native DLL pada komputer ini."
        ) from error

    versions = config["library_versions"]
    for package, installed in (
        ("scikit_learn", sklearn.__version__),
        ("transformers", transformers.__version__),
        ("torch", str(torch.__version__)),
    ):
        expected = versions[package]
        if installed != expected:
            raise ModelLoadError(
                f"Versi {package} tidak cocok: konfigurasi {expected}, "
                f"terpasang {installed}."
            )

    engagement_config = config["engagement_prediction"]
    engagement_path = _model_path(engagement_config["model_file"])
    try:
        engagement_model = joblib.load(engagement_path)
    except Exception as error:
        raise ModelLoadError(
            "Model engagement tidak dapat dimuat. Pastikan artefak joblib "
            "berasal dari sumber tepercaya dan kompatibel dengan "
            f"scikit-learn {versions['scikit_learn']}."
        ) from error

    if not isinstance(engagement_model, HistGradientBoostingClassifier):
        raise ModelLoadError(
            "Artefak engagement bukan HistGradientBoostingClassifier."
        )

    feature_columns = engagement_config["feature_columns"]
    feature_count = getattr(engagement_model, "n_features_in_", None)
    if feature_count != len(feature_columns):
        raise ModelLoadError(
            "Jumlah fitur pada model tidak cocok dengan konfigurasi DPRF."
        )

    model_feature_names = getattr(engagement_model, "feature_names_in_", None)
    if model_feature_names is not None and list(model_feature_names) != feature_columns:
        raise ModelLoadError(
            "Urutan fitur model tidak cocok dengan dprf_config.json."
        )

    model_classes = {int(value) for value in engagement_model.classes_}
    if model_classes != {0, 1}:
        raise ModelLoadError(
            "Model engagement harus memiliki kelas 0 dan 1."
        )

    sentiment_directory = _model_path(
        config["sentiment_analysis"]["model_directory"]
    )
    if not sentiment_directory.is_dir():
        raise ModelLoadError("Folder model DistilBERT tidak valid.")

    try:
        tokenizer = AutoTokenizer.from_pretrained(
            sentiment_directory,
            local_files_only=True,
            use_fast=True,
            trust_remote_code=False,
        )
        sentiment_model = AutoModelForSequenceClassification.from_pretrained(
            sentiment_directory,
            local_files_only=True,
            use_safetensors=True,
            trust_remote_code=False,
        )
        sentiment_model.to(torch.device("cpu"))
        sentiment_model.eval()
    except Exception as error:
        raise ModelLoadError(
            "DistilBERT lokal tidak dapat dimuat. Verifikasi file model dan "
            "kompatibilitas transformers, torch, dan safetensors."
        ) from error

    max_length = config["sentiment_analysis"]["max_length"]
    model_max_length = getattr(
        sentiment_model.config, "max_position_embeddings", None
    )
    if model_max_length is not None and max_length > model_max_length:
        raise ModelLoadError(
            "sentiment_analysis.max_length melebihi batas posisi model."
        )

    return {
        "config": config,
        "engagement_model": engagement_model,
        "sentiment_model": sentiment_model,
        "sentiment_tokenizer": tokenizer,
        "torch": torch,
        "pandas": pd,
    }


def get_model_bundle(application: Any) -> dict[str, Any]:
    bundle = getattr(application.state, "model_bundle", None)
    if bundle is None:
        raise ModelLoadError("Model DPRF belum dimuat saat startup.")
    return bundle
