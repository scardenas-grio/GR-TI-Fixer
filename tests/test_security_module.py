import pytest

from security.fraud_detection import detectar_fraude
from security.security import check_password, hash_password


def test_hash_password_returns_str():
    hashed = hash_password("clave")

    assert isinstance(hashed, str)
    assert hashed.startswith("$2b$")


def test_check_password_roundtrip():
    hashed = hash_password("clave")

    assert check_password("clave", hashed) is True
    assert check_password("clave-mala", hashed) is False


@pytest.mark.parametrize("puntos, esperado", [
    (0, False),
    (10000, False),
    (10001, True),
    (-50, False),
])
def test_detectar_fraude_umbral(puntos, esperado):
    assert detectar_fraude("usuario", puntos) is esperado
