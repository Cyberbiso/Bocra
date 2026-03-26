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


class TypeApprovalPartyCreate(BaseModel):
    partyType: Literal["applicant", "customer", "manufacturer", "repair_provider"]
    displayName: str = Field(min_length=1)
    organizationId: str | None = None
    contactUserId: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class TypeApprovalApplicationCreate(BaseModel):
    accreditationType: Literal["customer", "manufacturer", "repair_provider"]
    brandName: str
    modelName: str
    simEnabled: Literal["yes", "no"]
    techSpec: str | None = ""
    sampleImei: str | None = ""
    countryOfManufacture: str
    declaration: bool = False
    parties: list[TypeApprovalPartyCreate] = Field(default_factory=list)


class TypeApprovalCommentCreate(BaseModel):
    body: str = Field(min_length=1)
    visibility: Literal["APPLICANT", "INTERNAL", "PUBLIC"] = "APPLICANT"


class TypeApprovalDocumentReviewCreate(BaseModel):
    reviewStatus: Literal["PENDING", "APPROVED", "REJECTED", "NEEDS_UPDATE"]
    note: str | None = ""


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
