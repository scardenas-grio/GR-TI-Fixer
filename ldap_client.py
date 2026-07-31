# ============================================================
# CLIENTE LDAP COMPARTIDO
# ============================================================

import os

from contextlib import contextmanager

import ldap3

from dotenv import load_dotenv

load_dotenv()

LDAP_SERVER = os.getenv("LDAP_SERVER")
LDAP_BASE_DN = os.getenv("LDAP_BASE_DN")
LDAP_ADMIN_USER = os.getenv("LDAP_USER_DN")
LDAP_ADMIN_PASSWORD = os.getenv("LDAP_PASSWORD")

GRUPOS_POR_ROL = {
    "cn=admins": "admin",
    "cn=sistemas": "admin",
    "cn=rh": "usuario",
}


@contextmanager
def ldap_connection(user, password):
    """Abre una conexión LDAP y garantiza el unbind al terminar."""
    conn = ldap3.Connection(
        ldap3.Server(LDAP_SERVER),
        user=user,
        password=password,
        auto_bind=True,
    )

    try:
        yield conn
    finally:
        conn.unbind()


@contextmanager
def ldap_admin_connection():
    with ldap_connection(LDAP_ADMIN_USER, LDAP_ADMIN_PASSWORD) as conn:
        yield conn


def _admin_configurado(*extras):
    return all(
        [
            LDAP_SERVER,
            LDAP_BASE_DN,
            LDAP_ADMIN_USER,
            LDAP_ADMIN_PASSWORD,
            *extras,
        ]
    )


def autenticar_ldap(username, password):
    if not all([LDAP_SERVER, LDAP_BASE_DN, username, password]):
        return False

    try:
        with ldap_connection(f"uid={username},{LDAP_BASE_DN}", password):
            return True
    except Exception as exc:
        print("LDAP LOGIN ERROR:", exc)
        return False


def obtener_usuarios_ldap():
    if not _admin_configurado():
        return []

    try:
        with ldap_admin_connection() as conn:
            conn.search(LDAP_BASE_DN, "(objectClass=person)", attributes=["uid"])
            return sorted(
                {entry.uid.value for entry in conn.entries if hasattr(entry, "uid")}
            )
    except Exception as exc:
        print("LDAP USERS ERROR:", exc)
        return []


def obtener_grupos_ldap(username):
    if not _admin_configurado(username):
        return []

    try:
        with ldap_admin_connection() as conn:
            conn.search(LDAP_BASE_DN, f"(uid={username})", attributes=["memberOf"])
            grupos = []
            for entry in conn.entries:
                if "memberOf" in entry:
                    grupos = list(entry.memberOf.values)
            return grupos
    except Exception as exc:
        print("LDAP GROUP ERROR:", exc)
        return []


def mapear_rol_por_grupo(grupos):
    for grupo in grupos:
        grupo_normalizado = grupo.lower()
        for clave, rol in GRUPOS_POR_ROL.items():
            if clave in grupo_normalizado:
                return rol
    return "usuario"
