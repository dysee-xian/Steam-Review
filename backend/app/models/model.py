from pydantic import BaseModel, Field


class ReviewRequest(BaseModel):
    review: str = Field(min_length=1)
