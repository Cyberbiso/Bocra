from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.core.security import utcnow
from app.integrations.supabase import SupabaseAuthAdapter
from app.models.entities import Role, User, UserRole, uuid_str
from app.repositories.bocra import AuthRepository


ROLE_PRIORITY = {"public": 0, "applicant": 1, "officer": 2, "admin": 3}


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
        result = self.supabase.password_sign_in(email, password)
        if not result or "access_token" not in result:
            return None

        access_token = result["access_token"]
        sb_user = result.get("user", {})

        user = self._sync_profile(sb_user, email)
        user.last_login_at = utcnow()

        roles = self.repo.get_roles_for_user(user.id)
        permissions = [p.permission_code for p in self.repo.get_permissions_for_roles([r.id for r in roles])]
        self.db.commit()
        return LoginResult(user=user, access_token=access_token, roles=roles, permissions=permissions)

    # ── Logout ─────────────────────────────────────────────────────────────

    def logout(self, access_token: str | None) -> None:
        if access_token:
            self.supabase.sign_out(access_token)

    # ── Token validation ───────────────────────────────────────────────────

    def get_user_from_token(self, access_token: str) -> LoginResult | None:
        """Validate a Supabase JWT and return the corresponding local user context."""
        sb_user = self.supabase.get_user(access_token)
        if not sb_user or not sb_user.get("email"):
            return None

        user = self._sync_profile(sb_user, sb_user["email"])
        roles = self.repo.get_roles_for_user(user.id)
        permissions = [p.permission_code for p in self.repo.get_permissions_for_roles([r.id for r in roles])]
        return LoginResult(user=user, access_token=access_token, roles=roles, permissions=permissions)

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

    @staticmethod
    def primary_role(roles: list[Role]) -> str:
        if not roles:
            return "public"
        return max(roles, key=lambda role: ROLE_PRIORITY.get(role.role_code, -1)).role_code
