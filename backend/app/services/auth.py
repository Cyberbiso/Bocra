from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.core.security import hash_password, is_legacy_hash, new_session_token, session_expires_at, utcnow, verify_password
from app.integrations.supabase import SupabaseAuthAdapter
from app.models.entities import Role, SessionToken, User, UserRole
from app.repositories.bocra import AuthRepository


ROLE_PRIORITY = {"public": 0, "applicant": 1, "officer": 2, "admin": 3}


@dataclass(slots=True)
class LoginResult:
    user: User
    session: SessionToken
    roles: list[Role]
    permissions: list[str]


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = AuthRepository(db)
        self.supabase = SupabaseAuthAdapter()

    def login(self, email: str, password: str) -> LoginResult | None:
        user = self.repo.get_user_by_email(email)

        if self.supabase.enabled:
            result = self.supabase.password_sign_in(email, password)
            if not result:
                return None
            if not user:
                auth_user = result.get("user", {})
                user = User(
                    email=auth_user.get("email", email),
                    first_name=auth_user.get("user_metadata", {}).get("first_name", "Supabase"),
                    last_name=auth_user.get("user_metadata", {}).get("last_name", "User"),
                    auth_provider="supabase",
                    email_verified_at=utcnow(),
                )
                self.db.add(user)
                self.db.flush()
                public_role = self.db.query(Role).filter(Role.role_code == "public").one()
                self.db.add(UserRole(user_id=user.id, role_id=public_role.id))
                self.db.flush()
        else:
            if not user or not verify_password(password, user.password_hash):
                return None
            # Upgrade legacy SHA-256 hash to bcrypt on first successful login.
            if user.password_hash and is_legacy_hash(user.password_hash):
                user.password_hash = hash_password(password)

        user.last_login_at = utcnow()
        session = SessionToken(token=new_session_token(), user_id=user.id, expires_at=session_expires_at())
        self.repo.create_session(session)
        roles = self.repo.get_roles_for_user(user.id)
        permissions = [permission.permission_code for permission in self.repo.get_permissions_for_roles([role.id for role in roles])]
        self.db.commit()
        self.db.refresh(session)
        return LoginResult(user=user, session=session, roles=roles, permissions=permissions)

    def logout(self, token: str | None) -> None:
        if not token:
            return
        self.repo.delete_session(token)
        self.db.commit()

    def get_session_context(self, token: str) -> LoginResult | None:
        session = self.repo.get_active_session(token)
        if not session or not session.user:
            return None
        roles = self.repo.get_roles_for_user(session.user.id)
        permissions = [permission.permission_code for permission in self.repo.get_permissions_for_roles([role.id for role in roles])]
        return LoginResult(user=session.user, session=session, roles=roles, permissions=permissions)

    def register(
        self,
        email: str,
        password: str,
        first_name: str,
        last_name: str,
        phone: str | None = None,
        national_id: str | None = None,
    ) -> LoginResult | None:
        """Self-registration for external applicants. Returns None if email already taken."""
        if self.repo.get_user_by_email(email):
            return None

        user = User(
            email=email,
            password_hash=hash_password(password),
            first_name=first_name,
            last_name=last_name,
            phone_e164=phone or None,
            national_id=national_id or None,
            auth_provider="local",
        )
        self.db.add(user)
        self.db.flush()

        applicant_role = self.db.query(Role).filter(Role.role_code == "applicant").first()
        if not applicant_role:
            applicant_role = self.db.query(Role).filter(Role.role_code == "public").first()
        if applicant_role:
            self.db.add(UserRole(user_id=user.id, role_id=applicant_role.id))
            self.db.flush()

        session = SessionToken(token=new_session_token(), user_id=user.id, expires_at=session_expires_at())
        self.repo.create_session(session)
        roles = self.repo.get_roles_for_user(user.id)
        permissions = [permission.permission_code for permission in self.repo.get_permissions_for_roles([role.id for role in roles])]
        self.db.commit()
        self.db.refresh(session)
        return LoginResult(user=user, session=session, roles=roles, permissions=permissions)

    @staticmethod
    def primary_role(roles: list[Role]) -> str:
        if not roles:
            return "public"
        return max(roles, key=lambda role: ROLE_PRIORITY.get(role.role_code, -1)).role_code
