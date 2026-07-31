"""Compatibilidad: delega en los helpers canónicos de security.auth."""

from security.auth import hash_password as _hash_password, verify_password


def hash_password(password):
    return _hash_password(password).decode()


def check_password(password, hashed):
    return verify_password(password, hashed)
