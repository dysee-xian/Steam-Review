from collections.abc import Mapping
from typing import Any

from app.services.data_processing import prepare_engagement_features


def predict_engagement_decline(
    features: Mapping[str, int | float],
    model_bundle: Mapping[str, Any],
) -> dict[str, Any]:
    config = model_bundle["config"]["engagement_prediction"]
    columns = config["feature_columns"]
    ordered_values = prepare_engagement_features(features, columns)
    dataframe = model_bundle["pandas"].DataFrame(
        [ordered_values], columns=columns
    )

    model = model_bundle["engagement_model"]
    probabilities = model.predict_proba(dataframe)[0]
    classes = [int(value) for value in model.classes_]
    decline_probability = float(probabilities[classes.index(1)])
    threshold = float(config["threshold"])
    prediction = int(decline_probability >= threshold)
    labels = config["class_labels"]

    return {
        "prediction": prediction,
        "label": labels[str(prediction)],
        "probability_decline": decline_probability,
        "threshold": threshold,
        "target": config["target"],
    }
