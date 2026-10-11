import json

import pytest

from passmanager import vault as v


@pytest.fixture(autouse=True)
def fast_kdf(monkeypatch):
    monkeypatch.setattr(v, "KDF_ITERATIONS", 1000)


def test_roundtrip(tmp_path):
    p = tmp_path / "vault.json"
    a = v.Vault(p)
    a.create("master-pass")
    a.add("example.com", "bob", "s3cret")
    assert "s3cret" not in p.read_text()
    b = v.Vault(p)
    b.unlock("master-pass")
    assert b.entries[0]["password"] == "s3cret"


def test_wrong_password(tmp_path):
    a = v.Vault(tmp_path / "v.json")
    a.create("right")
    with pytest.raises(v.WrongPassword):
        v.Vault(tmp_path / "v.json").unlock("wrong")


def test_search_update_delete(tmp_path):
    a = v.Vault(tmp_path / "v.json")
    a.create("pw")
    a.add("github.com", "alice", "x")
    a.add("mail.com", "bob", "y")
    assert [i for i, _ in a.search("GIT")] == [0]
    a.update(1, password="z")
    a.delete(0)
    assert a.entries[0]["password"] == "z"


def test_corrupt(tmp_path):
    p = tmp_path / "v.json"
    p.write_text(json.dumps({"bad": 1}))
    with pytest.raises(v.VaultError):
        v.Vault(p).unlock("x")


def test_generate_password():
    pw = v.generate_password(24)
    assert len(pw) == 24
    assert any(c.isdigit() for c in pw) and any(c.isupper() for c in pw)
