import math
from collections.abc import Mapping
from typing import Any


def score_persona(
    player_data: Mapping[str, int | float],
    config: Mapping[str, Any],
) -> dict[str, Any]:
    saw_config = config["saw"]
    weights = saw_config["criteria_weights"]
    normalizers = saw_config["normalization_values"]

    if set(player_data) != set(weights):
        missing = sorted(set(weights).difference(player_data))
        extra = sorted(set(player_data).difference(weights))
        details = []
        if missing:
            details.append(f"kriteria hilang: {', '.join(missing)}")
        if extra:
            details.append(f"kriteria tidak dikenal: {', '.join(extra)}")
        raise ValueError("; ".join(details))

    normalized: dict[str, float] = {}
    for criterion in weights:
        value = player_data[criterion]
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"Kriteria {criterion} harus finite dan nonnegatif.")
        try:
            numeric_value = float(value)
        except OverflowError as error:
            raise ValueError(
                f"Kriteria {criterion} harus finite dan nonnegatif."
            ) from error
        if not math.isfinite(numeric_value) or numeric_value < 0:
            raise ValueError(f"Kriteria {criterion} harus finite dan nonnegatif.")

        p95 = normalizers[f"{criterion}_p95"]
        normalized[criterion] = numeric_value / float(p95)

    score = sum(normalized[key] * float(weights[key]) for key in weights)
    return {
        "normalization": saw_config["normalization"],
        "normalized_criteria": normalized,
        "criteria_weights": weights,
        "persona_score": score,
        "persona_category": None,
    }
