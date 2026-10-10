"""Encrypted vault storage (no GUI dependencies)."""
import base64
import json
import os
import secrets
import string
from pathlib import Path

from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

KDF_ITERATIONS = 600_000
DEFAULT_PATH = Path.home() / ".passmanager" / "vault.json"


class VaultError(Exception):
    pass


class WrongPassword(VaultError):
    pass


def _derive_key(password: str, salt: bytes, iterations: int) -> bytes:
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=iterations)
    return base64.urlsafe_b64encode(kdf.derive(password.encode("utf-8")))


def generate_password(length: int = 16, symbols: bool = True) -> str:
    if length < 4:
        raise ValueError("length must be >= 4")
    pools = [string.ascii_lowercase, string.ascii_uppercase, string.digits]
    if symbols:
        pools.append("!@#$%^&*()-_=+")
    chars = [secrets.choice(p) for p in pools]
    alphabet = "".join(pools)
    chars += [secrets.choice(alphabet) for _ in range(length - len(chars))]
    secrets.SystemRandom().shuffle(chars)
    return "".join(chars)


class Vault:
    def __init__(self, path=DEFAULT_PATH):
        self.path = Path(path)
        self.entries: list[dict] = []
        self._fernet = None
        self._salt = b""
        self._iterations = KDF_ITERATIONS

    def exists(self) -> bool:
        return self.path.exists()

    def create(self, master_password: str):
        if not master_password:
            raise VaultError("Master password required")
        if self.exists():
            raise VaultError("Vault already exists")
        self._salt = os.urandom(16)
        self._fernet = Fernet(_derive_key(master_password, self._salt, self._iterations))
        self.entries = []
        self.save()

    def unlock(self, master_password: str):
        try:
            data = json.loads(self.path.read_text())
            self._salt = base64.b64decode(data["salt"])
            self._iterations = data["iterations"]
            fernet = Fernet(_derive_key(master_password, self._salt, self._iterations))
            self.entries = json.loads(fernet.decrypt(data["data"].encode()))
        except InvalidToken:
            raise WrongPassword("Wrong master password") from None
        except (OSError, KeyError, ValueError) as e:
            raise VaultError(f"Corrupt vault: {e}") from e
        self._fernet = fernet

    def lock(self):
        self._fernet = None
        self.entries = []

    def save(self):
        if self._fernet is None:
            raise VaultError("Vault is locked")
        payload = self._fernet.encrypt(json.dumps(self.entries).encode()).decode()
        blob = {"salt": base64.b64encode(self._salt).decode(),
                "iterations": self._iterations, "data": payload}
        self.path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps(blob))
        os.chmod(tmp, 0o600)
        tmp.replace(self.path)

    def add(self, site: str, username: str, password: str, notes: str = "") -> int:
        if not site:
            raise VaultError("Site is required")
        self.entries.append({"site": site, "username": username,
                             "password": password, "notes": notes})
        self.save()
        return len(self.entries) - 1

    def update(self, index: int, **fields):
        self.entries[index].update(fields)
        self.save()

    def delete(self, index: int):
        del self.entries[index]
        self.save()

    def search(self, query: str):
        q = query.lower()
        return [(i, e) for i, e in enumerate(self.entries)
                if q in e["site"].lower() or q in e["username"].lower()]
