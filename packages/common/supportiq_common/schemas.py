from pydantic import BaseModel, Field


class AnalysisResult(BaseModel):
    category: str = Field(..., examples=["delivery_issue"])
    priority: str = Field(..., examples=["high"])
    sentiment: str = Field(..., examples=["negative"])
    summary: str = Field(..., examples=["Customer requests refund for delayed shipment."])
    explanation: str = Field(..., examples=["Priority is high because the message includes a refund request and negative sentiment."])
    assigned_team: str = Field(..., examples=["customer_operations"])
    suggested_reply: str = Field(..., examples=["We are sorry for the delay..."])
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    model_source: str = Field(..., examples=["openai"])
