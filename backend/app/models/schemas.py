from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)
    firstName: str = Field(min_length=1)
    lastName: str = Field(min_length=1)
    phone: str | None = None
    nationalId: str | None = None


class ComplaintMessageCreate(BaseModel):
    content: str = Field(min_length=1)
    authorId: str | None = None


class LicenseApplicationCreate(BaseModel):
    category: str
    licenceType: str
    applicantName: str
    applicantEmail: str
    coverageArea: str | None = None
    formData: dict[str, Any] = Field(default_factory=dict)


class TypeApprovalApplicationCreate(BaseModel):
    accreditationType: Literal["customer", "manufacturer", "repair_provider"]
    brandName: str
    modelName: str
    simEnabled: Literal["yes", "no"]
    techSpec: str | None = ""
    sampleImei: str | None = ""
    countryOfManufacture: str
    declaration: bool = False


class ExternalSystemCreate(BaseModel):
    systemCode: str = Field(min_length=1)
    name: str = Field(min_length=1)
    description: str | None = None
    baseUrl: str = Field(min_length=1)
    healthEndpoint: str = "/health"
    contactEmail: str | None = None


class PaymentCreate(BaseModel):
    invoiceId: str
    method: Literal["mobile_money", "bank_transfer", "card"]
    reference: str


class AgentChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class AgentChatRequest(BaseModel):
    messages: list[AgentChatMessage]
    threadId: str | None = None


class PublicChatRequest(BaseModel):
    message: str
