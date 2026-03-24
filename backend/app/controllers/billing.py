from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import db_session, get_current_user
from app.models.entities import User
from app.models.schemas import PaymentCreate
from app.repositories.bocra import AuthRepository
from app.services.auth import AuthService
from app.services.portal import BillingService
from app.views.presenters import present_invoices, present_payments, present_receipts

router = APIRouter(tags=["billing"])


def _role_for_user(db: Session, user: User | None) -> str:
    if not user:
        return "public"
    roles = AuthRepository(db).get_roles_for_user(user.id)
    return AuthService.primary_role(roles)


@router.get("/api/invoices")
def invoices(
    user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    role = _role_for_user(db, user)
    return present_invoices(BillingService(db).list_invoices(user, role))


@router.get("/api/payments")
def payments(
    user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    role = _role_for_user(db, user)
    service = BillingService(db)
    payment_records = service.list_payments(user, role)
    invoices = {invoice.id: invoice for invoice in service.list_invoices(user, role)}
    return present_payments(payment_records, invoices)


@router.post("/api/payments")
def create_payment(
    payload: PaymentCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    try:
        result = BillingService(db).create_payment(payload=payload.model_dump(), user=user)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return {
        "success": True,
        "invoiceId": result["invoice"].id,
        "paymentId": result["payment"].id,
        "receiptId": result["receipt"].id if result["receipt"] else None,
        "status": result["payment"].status_code,
    }


@router.get("/api/receipts")
def receipts(
    user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    role = _role_for_user(db, user)
    service = BillingService(db)
    receipt_records = service.list_receipts(user, role)
    payment_records = {payment.id: payment for payment in service.list_payments(user, role)}
    invoices = {invoice.id: invoice for invoice in service.list_invoices(user, role)}
    return present_receipts(receipt_records, payment_records, invoices)
