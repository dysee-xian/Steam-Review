import re
from collections.abc import Mapping
from typing import Any

from app.services.sentiment_analysis import predict_sentiment


def split_review_sentences(review: str) -> list[str]:
    """
    Memisahkan ulasan menjadi beberapa kalimat.
    """
    sentences = re.split(r"(?<=[.!?])\s+", review.strip())

    return [
        sentence.strip()
        for sentence in sentences
        if sentence.strip()
    ]


def find_aspect_context(
    sentences: list[str],
    keywords: list[str],
) -> tuple[list[str], list[str]]:
    """
    Mengambil kalimat yang mengandung keyword aspek.
    """
    matched_keywords = []
    matched_sentences = []

    for sentence in sentences:
        for keyword in keywords:
            pattern = rf"(?<!\w){re.escape(keyword)}(?!\w)"

            if re.search(pattern, sentence, flags=re.IGNORECASE):
                if keyword not in matched_keywords:
                    matched_keywords.append(keyword)

                if sentence not in matched_sentences:
                    matched_sentences.append(sentence)

    return matched_keywords, matched_sentences


def analyze_review(
    review: str,
    model_bundle: Mapping[str, Any],
) -> dict[str, Any]:

    # Analisis sentimen keseluruhan ulasan
    overall_sentiment = predict_sentiment(
        review,
        model_bundle,
    )

    # Mengambil konfigurasi keyword aspek
    configured_keywords = model_bundle["config"]["absa"]["aspect_keywords"]

    # Memecah ulasan menjadi kalimat
    sentences = split_review_sentences(review)

    aspects = []

    # Analisis sentimen setiap aspek
    for aspect, keywords in configured_keywords.items():

        matched_keywords, aspect_sentences = find_aspect_context(
            sentences,
            keywords,
        )

        # Lewati aspek yang tidak ditemukan
        if not matched_keywords:
            continue

        # Menggabungkan kalimat yang berkaitan dengan aspek
        aspect_context = " ".join(aspect_sentences)

        # Prediksi sentimen berdasarkan konteks aspek
        aspect_sentiment = predict_sentiment(
            aspect_context,
            model_bundle,
        )

        aspects.append(
            {
                "aspect": aspect,
                "matched_keywords": matched_keywords,
                "review_sentiment": aspect_sentiment["label"],
                "score": aspect_sentiment["score"],
                "context": aspect_context
            }
        )

    return {
        "review_sentiment": overall_sentiment["label"],
        "review_sentiment_score": overall_sentiment["score"],
        "sentiment_scope": "entire_review",
        "aspects": aspects
    }
