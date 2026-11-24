import re
from collections.abc import Mapping
from typing import Any

from app.services.sentiment_analysis import predict_sentiment


def analyze_review(
    review: str,
    model_bundle: Mapping[str, Any],
) -> dict[str, Any]:
    sentiment = predict_sentiment(review, model_bundle)
    configured_keywords = model_bundle["config"]["absa"]["aspect_keywords"]
    aspects = []

    for aspect, keywords in configured_keywords.items():
        matched_keywords = [
            keyword
            for keyword in keywords
            if re.search(
                rf"(?<!\w){re.escape(keyword)}(?!\w)",
                review,
                flags=re.IGNORECASE,
            )
        ]
        if matched_keywords:
            aspects.append(
                {
                    "aspect": aspect,
                    "matched_keywords": matched_keywords,
                    "review_sentiment": sentiment["label"],
                    "score": sentiment["score"],
                }
            )

    return {
        "review_sentiment": sentiment["label"],
        "review_sentiment_score": sentiment["score"],
        "sentiment_scope": "entire_review",
        "aspects": aspects,
    }
