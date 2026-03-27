from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.security import new_session_token, session_expires_at, utcnow, verify_password
from app.integrations.supabase import SupabaseAuthAdapter
from app.models.entities import Role, SessionToken, User, UserRole, uuid_str
from app.repositories.bocra import AuthRepository


ROLE_PRIORITY = {"public": 0, "applicant": 1, "officer": 2, "type_approver": 3, "admin": 4}
settings = get_settings()

# Frontend demo fallback tokens — hardcoded strings that aren't stored in any DB.
# Maps token → email of the corresponding seeded user.
_DEMO_TOKEN_EMAILS: dict[str, str] = {
    "demo-session-applicant": "applicant@bocra.demo",
    "demo-session-officer": "officer@bocra.demo",
    "demo-session-type-approver": "approver@bocra.demo",
    "demo-session-admin": "admin@bocra.demo",
    "demo-session": "applicant@bocra.demo",
}


@dataclass(slots=True)
class LoginResult:
    user: User
    access_token: str          # Supabase JWT — stored in session cookie
    roles: list[Role]
    permissions: list[str]


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = AuthRepository(db)
        self.supabase = SupabaseAuthAdapter()

    # ── Login ──────────────────────────────────────────────────────────────

    def login(self, email: str, password: str) -> LoginResult | None:
        user = self.repo.get_user_by_email(email)
        result = self.supabase.password_sign_in(email, password) if self.supabase.enabled else None

        if result and "access_token" in result:
            access_token = result["access_token"]
            sb_user = result.get("user", {})
            user = self._sync_profile(sb_user, email)
        else:
            if not user or not verify_password(password, user.password_hash):
                return None
            session = SessionToken(token=new_session_token(), user_id=user.id, expires_at=session_expires_at())
            self.repo.create_session(session)
            access_token = session.token

        user.last_login_at = utcnow()
        self.db.commit()
        return self._result_for_user(user, access_token)

    # ── Logout ─────────────────────────────────────────────────────────────

    def logout(self, access_token: str | None) -> None:
        if not access_token:
            return
        if self.repo.get_active_session(access_token):
            self.repo.delete_session(access_token)
            self.db.commit()
            return
        self.supabase.sign_out(access_token)

    # ── Token validation ───────────────────────────────────────────────────

    def get_user_from_token(self, access_token: str) -> LoginResult | None:
        # 0. Recognise frontend demo tokens (non-production only)
        if settings.app_env != "production" and access_token in _DEMO_TOKEN_EMAILS:
            email = _DEMO_TOKEN_EMAILS[access_token]
            user = self.repo.get_user_by_email(email)
            if user:
                return self._result_for_user(user, access_token)

        # 1. Check local session tokens (created by backend login)
        session = self.repo.get_active_session(access_token)
        if session and session.user:
            return self._result_for_user(session.user, access_token)

        # 2. Validate as Supabase JWT
        sb_user = self.supabase.get_user(access_token)
        if sb_user and sb_user.get("email"):
            user = self._sync_profile(sb_user, sb_user["email"])
            if self.db.new or self.db.dirty:
                self.db.commit()
            return self._result_for_user(user, access_token)

        # 3. Check Supabase iam.sessions table (tokens created by frontend login)
        iam_user = self.supabase.get_user_from_session_token(access_token)
        if iam_user and iam_user.get("email"):
            user = self._sync_profile(iam_user, iam_user["email"])
            if self.db.new or self.db.dirty:
                self.db.commit()
            return self._result_for_user(user, access_token)

        return None

    # ── Helpers ────────────────────────────────────────────────────────────

    def _sync_profile(self, sb_user: dict, email: str) -> User:
        """Return the local user profile, creating one if it doesn't exist yet."""
        user = self.repo.get_user_by_email(email)
        if not user:
            meta = sb_user.get("user_metadata", {})
            user = User(
                id=sb_user.get("id", uuid_str()),
                email=email,
                first_name=meta.get("first_name", ""),
                last_name=meta.get("last_name", ""),
                auth_provider="supabase",
                email_verified_at=utcnow(),
            )
            self.db.add(user)
            self.db.flush()
            public_role = self.db.query(Role).filter(Role.role_code == "public").first()
            if public_role:
                self.db.add(UserRole(user_id=user.id, role_id=public_role.id))
                self.db.flush()
        return user

    def _result_for_user(self, user: User, access_token: str) -> LoginResult:
        roles = self.repo.get_roles_for_user(user.id)
        permissions = [p.permission_code for p in self.repo.get_permissions_for_roles([r.id for r in roles])]
        return LoginResult(user=user, access_token=access_token, roles=roles, permissions=permissions)

    @staticmethod
    def primary_role(roles: list[Role]) -> str:
        if not roles:
            return "public"
        return max(roles, key=lambda role: ROLE_PRIORITY.get(role.role_code, -1)).role_code
