import math
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ReviewRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    review: str = Field(min_length=1)

    @field_validator("review")
    @classmethod
    def review_must_contain_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Ulasan tidak boleh hanya berisi spasi.")
        return value


class SentimentResponse(BaseModel):
    label: str
    score: float


class AspectSentiment(BaseModel):
    aspect: str
    matched_keywords: list[str]
    review_sentiment: str
    score: float


class ABSAResponse(BaseModel):
    review_sentiment: str
    review_sentiment_score: float
    sentiment_scope: str
    aspects: list[AspectSentiment]


class PersonaRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    review_count: float = Field(ge=0, allow_inf_nan=False)
    avg_playtime_hours: float = Field(ge=0, allow_inf_nan=False)
    avg_games_owned: float = Field(ge=0, allow_inf_nan=False)
    avg_helpful_votes: float = Field(ge=0, allow_inf_nan=False)


class PersonaResponse(BaseModel):
    normalization: str
    normalized_criteria: dict[str, float]
    criteria_weights: dict[str, float]
    persona_score: float
    persona_category: str | None = None


class EngagementPredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    features: dict[str, Any]

    @field_validator("features")
    @classmethod
    def feature_values_must_be_finite_numbers(
        cls, value: dict[str, Any]
    ) -> dict[str, Any]:
        for name, feature_value in value.items():
            if isinstance(feature_value, bool) or not isinstance(
                feature_value, (int, float)
            ):
                raise ValueError(
                    f"Nilai fitur {name!r} harus berupa angka finite."
                )
            try:
                finite = math.isfinite(float(feature_value))
            except OverflowError:
                finite = False
            if not finite:
                raise ValueError(
                    f"Nilai fitur {name!r} harus berupa angka finite."
                )
        return value


class EngagementPredictionResponse(BaseModel):
    prediction: int
    label: str
    probability_decline: float
    threshold: float
    target: str
