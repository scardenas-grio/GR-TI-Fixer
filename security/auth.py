import bcrypt
from functools import wraps
from flask import session, redirect


def hash_password(password: str) -> bytes:

    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)

    return hashed


def verify_password(password: str, hashed) -> bool:

    if isinstance(hashed, str):
        hashed = hashed.encode("utf-8")

    return bcrypt.checkpw(password.encode("utf-8"), hashed)


def login_required(f):

    @wraps(f)
    def decorated(*args, **kwargs):

        if "usuario" not in session:
            return redirect("/")

        return f(*args, **kwargs)

    return decorated