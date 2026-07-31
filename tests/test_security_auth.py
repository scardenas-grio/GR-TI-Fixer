import pytest
from flask import Flask

from security.auth import hash_password, login_required, verify_password


def test_hash_password_returns_bcrypt_bytes():
    hashed = hash_password("secreto123")

    assert isinstance(hashed, bytes)
    assert hashed.startswith(b"$2b$")


def test_hash_password_is_salted():
    assert hash_password("secreto123") != hash_password("secreto123")


def test_verify_password_accepts_correct_password():
    assert verify_password("secreto123", hash_password("secreto123")) is True


def test_verify_password_rejects_wrong_password():
    assert verify_password("otra", hash_password("secreto123")) is False


def test_verify_password_accepts_str_hash():
    hashed = hash_password("secreto123").decode("utf-8")

    assert verify_password("secreto123", hashed) is True


def test_verify_password_handles_unicode():
    assert verify_password("contraseña", hash_password("contraseña")) is True


@pytest.fixture
def protected_app():
    flask_app = Flask(__name__)
    flask_app.config["SECRET_KEY"] = "test"

    @flask_app.route("/privado")
    @login_required
    def privado():
        return "contenido"

    return flask_app


def test_login_required_redirects_anonymous(protected_app):
    response = protected_app.test_client().get("/privado")

    assert response.status_code == 302
    assert response.headers["Location"].endswith("/")


def test_login_required_allows_logged_user(protected_app):
    client = protected_app.test_client()
    with client.session_transaction() as sess:
        sess["usuario"] = "admin"

    response = client.get("/privado")

    assert response.status_code == 200
    assert response.data == b"contenido"


def test_login_required_preserves_metadata():
    @login_required
    def vista():
        """docstring"""

    assert vista.__name__ == "vista"
    assert vista.__doc__ == "docstring"
