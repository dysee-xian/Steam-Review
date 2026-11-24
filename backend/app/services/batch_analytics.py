import math
from collections.abc import Mapping
from typing import Any

from app.services.persona_scoring import score_persona


PERSONA_SUMMARY_PATH = "steam_review_analytics/v1/saw/persona_summary"
ENGAGEMENT_METRICS_PATH = (
    "steam_review_analytics/v1/engagement_prediction/evaluation_metrics"
)

PERSONA_CRITERION_FIELDS = {
    "review_count": "avg_reviews",
    "avg_playtime_hours": "avg_playtime_hours",
    "avg_games_owned": "avg_games_owned",
    "avg_helpful_votes": "avg_helpful_votes",
}

PERSONA_SUMMARY_FIELDS = (
    "persona",
    "total_players",
    "avg_saw_score",
    *PERSONA_CRITERION_FIELDS.values(),
)


class BatchAnalyticsDataError(ValueError):
    pass


def _numeric_keyed_rows(value: Any, source: str) -> list[tuple[str, Any]]:
    if isinstance(value, list):
        entries = [(str(index), item) for index, item in enumerate(value)]
    elif isinstance(value, Mapping) and all(
        isinstance(key, str) and key.isdigit() for key in value
    ):
        entries = sorted(value.items(), key=lambda entry: int(entry[0]))
    else:
        raise BatchAnalyticsDataError(
            f"Struktur {source} harus berupa array atau object berkunci numerik."
        )

    if not entries:
        return []

    for key, row in entries:
        if not isinstance(row, Mapping):
            raise BatchAnalyticsDataError(
                f"Item {source}/{key} bukan object persona."
            )
    return entries


def _finite_number(value: Any, field: str, *, nonnegative: bool = True) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise BatchAnalyticsDataError(f"Field {field} harus berupa angka.")
    try:
        number = float(value)
    except OverflowError as error:
        raise BatchAnalyticsDataError(f"Field {field} tidak valid.") from error
    if not math.isfinite(number) or (nonnegative and number < 0):
        raise BatchAnalyticsDataError(f"Field {field} tidak valid.")
    return number


def build_persona_batch_analysis(
    source: Any,
    config: Mapping[str, Any],
) -> dict[str, Any]:
    if source is None:
        return {
            "analysis_status": "unavailable",
            "source_path": PERSONA_SUMMARY_PATH,
            "message": "Node ringkasan persona tidak tersedia di Firebase.",
            "players_in_summary": None,
            "players_analyzed": None,
            "average_saw_score": None,
            "highest_player_score": None,
            "lowest_player_score": None,
            "score_distribution": None,
            "persona_groups": [],
            "criteria_contributions": [],
            "player_results": None,
        }

    entries = _numeric_keyed_rows(source, PERSONA_SUMMARY_PATH)
    if not entries:
        return {
            "analysis_status": "unavailable",
            "source_path": PERSONA_SUMMARY_PATH,
            "message": "Node ringkasan persona kosong.",
            "players_in_summary": None,
            "players_analyzed": None,
            "average_saw_score": None,
            "highest_player_score": None,
            "lowest_player_score": None,
            "score_distribution": None,
            "persona_groups": [],
            "criteria_contributions": [],
            "player_results": None,
        }

    groups = []
    weighted_criteria = {name: 0.0 for name in PERSONA_CRITERION_FIELDS}
    weighted_players = 0
    for key, raw_group in entries:
        missing = [field for field in PERSONA_SUMMARY_FIELDS if field not in raw_group]
        if missing:
            raise BatchAnalyticsDataError(
                f"Field {', '.join(missing)} tidak tersedia di "
                f"{PERSONA_SUMMARY_PATH}/{key}."
            )

        persona = raw_group["persona"]
        if not isinstance(persona, str) or not persona.strip():
            raise BatchAnalyticsDataError(
                f"Field persona pada {PERSONA_SUMMARY_PATH}/{key} tidak valid."
            )

        player_count = _finite_number(
            raw_group["total_players"],
            f"{PERSONA_SUMMARY_PATH}/{key}/total_players",
        )
        if not player_count.is_integer():
            raise BatchAnalyticsDataError(
                f"Field total_players pada {PERSONA_SUMMARY_PATH}/{key} "
                "harus berupa bilangan bulat."
            )

        avg_saw_score = _finite_number(
            raw_group["avg_saw_score"],
            f"{PERSONA_SUMMARY_PATH}/{key}/avg_saw_score",
        )
        avg_criteria = {
            criterion: _finite_number(
                raw_group[source_field],
                f"{PERSONA_SUMMARY_PATH}/{key}/{source_field}",
            )
            for criterion, source_field in PERSONA_CRITERION_FIELDS.items()
        }

        groups.append(
            {
                "source_key": key,
                "persona": persona,
                "total_players": int(player_count),
                "avg_saw_score": avg_saw_score,
                "avg_criteria": avg_criteria,
            }
        )
        for criterion, average in avg_criteria.items():
            weighted_criteria[criterion] += average * player_count
        weighted_players += int(player_count)

    if weighted_players <= 0:
        return {
            "analysis_status": "unavailable",
            "source_path": PERSONA_SUMMARY_PATH,
            "message": "Ringkasan Firebase tidak mencakup pemain yang dapat dianalisis.",
            "players_in_summary": 0,
            "players_analyzed": None,
            "average_saw_score": None,
            "highest_player_score": None,
            "lowest_player_score": None,
            "score_distribution": None,
            "persona_groups": groups,
            "criteria_contributions": [],
            "player_results": None,
        }

    population_averages = {
        criterion: total / weighted_players
        for criterion, total in weighted_criteria.items()
    }
    saw_result = score_persona(population_averages, config)
    contributions = [
        {
            "criterion": criterion,
            "normalized_average": saw_result["normalized_criteria"][criterion],
            "weight": saw_result["criteria_weights"][criterion],
            "contribution": (
                saw_result["normalized_criteria"][criterion]
                * saw_result["criteria_weights"][criterion]
            ),
        }
        for criterion in saw_result["criteria_weights"]
    ]

    return {
        "analysis_status": "summary_only",
        "source_path": PERSONA_SUMMARY_PATH,
        "players_in_summary": weighted_players,
        "players_analyzed": None,
        "average_saw_score": saw_result["persona_score"],
        "highest_player_score": None,
        "lowest_player_score": None,
        "score_distribution": None,
        "population_average_criteria": population_averages,
        "persona_groups": groups,
        "criteria_contributions": contributions,
        "player_results": None,
        "limitations": [
            "Firebase hanya menyediakan ringkasan agregat per persona; "
            "skor dan kriteria individual tidak tersedia.",
            "Skor tertinggi/terendah individual, distribusi skor, dan tabel "
            "hasil per pemain tidak dapat dihitung dari ringkasan agregat.",
        ],
    }


def build_engagement_batch_status(
    config: Mapping[str, Any],
    evaluation_metrics: Any,
    firebase_error: str | None = None,
) -> dict[str, Any]:
    if evaluation_metrics is not None and not isinstance(
        evaluation_metrics, Mapping
    ):
        raise BatchAnalyticsDataError(
            f"Struktur {ENGAGEMENT_METRICS_PATH} harus berupa object."
        )

    engagement = config["engagement_prediction"]
    return {
        "analysis_status": "blocked",
        "source_path": ENGAGEMENT_METRICS_PATH,
        "firebase_status": "error" if firebase_error else "connected",
        "firebase_error": firebase_error,
        "message": (
            "Prediksi batch belum dijalankan. Repository tidak berisi proses "
            "feature engineering asli dan skema data per pemain Firebase "
            "untuk membentuk 15 fitur model belum terverifikasi."
        ),
        "model_configuration": {
            "algorithm": engagement["algorithm"],
            "model_file": engagement["model_file"],
            "target": engagement["target"],
            "threshold": engagement["threshold"],
            "class_labels": engagement["class_labels"],
            "feature_columns": engagement["feature_columns"],
        },
        "evaluation_metrics": evaluation_metrics,
        "evaluation_metrics_status": (
            "available" if evaluation_metrics is not None else "not_available"
        ),
        "summary": None,
        "predictions": None,
        "limitations": [
            "Tidak ada inferensi yang dijalankan karena fitur per pemain "
            "tidak dapat dibentuk tanpa proses preprocessing yang terverifikasi.",
            "Metrik evaluasi yang tersimpan bukan hasil prediksi per pemain.",
        ],
    }
