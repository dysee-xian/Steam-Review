from collections.abc import Mapping
from typing import Any


def predict_sentiment(
    review: str,
    model_bundle: Mapping[str, Any],
) -> dict[str, str | float]:
    config = model_bundle["config"]["sentiment_analysis"]
    tokenizer = model_bundle["sentiment_tokenizer"]
    model = model_bundle["sentiment_model"]
    torch = model_bundle["torch"]

    encoded = tokenizer(
        review,
        truncation=True,
        max_length=config["max_length"],
        return_tensors="pt",
    )
    with torch.inference_mode():
        logits = model(**encoded).logits[0]
        probabilities = torch.softmax(logits, dim=-1)
        class_index = int(torch.argmax(probabilities).item())

    labels = model.config.id2label
    label = labels.get(class_index, labels.get(str(class_index)))
    if not isinstance(label, str):
        raise RuntimeError(
            f"Label DistilBERT untuk kelas {class_index} tidak tersedia."
        )

    return {
        "label": label,
        "score": float(probabilities[class_index].item()),
    }
