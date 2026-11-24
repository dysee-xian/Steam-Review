import math
from collections.abc import Mapping, Sequence


def prepare_engagement_features(
    features: Mapping[str, int | float],
    feature_columns: Sequence[str],
) -> list[float]:
    expected = list(feature_columns)
    actual = set(features)
    missing = [name for name in expected if name not in actual]
    extra = sorted(actual.difference(expected))
    if missing or extra:
        details = []
        if missing:
            details.append(f"fitur hilang: {', '.join(missing)}")
        if extra:
            details.append(f"fitur tidak dikenal: {', '.join(extra)}")
        raise ValueError("; ".join(details))

    ordered_values: list[float] = []
    for name in expected:
        value = features[name]
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"Fitur {name} harus berupa angka finite.")
        try:
            numeric_value = float(value)
        except OverflowError as error:
            raise ValueError(
                f"Fitur {name} harus berupa angka finite."
            ) from error
        if not math.isfinite(numeric_value):
            raise ValueError(f"Fitur {name} harus berupa angka finite.")
        ordered_values.append(numeric_value)

    return ordered_values


def load_reviews(path):
    raise NotImplementedError("Pemuatan dataset belum dikonfigurasi.")
