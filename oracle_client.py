# ============================================================
# CLIENTE ORACLE COMPARTIDO
# ============================================================

import os

from contextlib import contextmanager

import oracledb

from dotenv import load_dotenv

load_dotenv()

ORACLE_LIB_DIR = os.getenv("ORACLE_LIB_DIR") or "/opt/oracle/instantclient"


def init_oracle_client(lib_dir=ORACLE_LIB_DIR):
    os.environ["LD_LIBRARY_PATH"] = lib_dir
    oracledb.init_oracle_client(lib_dir=lib_dir)


def build_oracle_pool():
    user = os.getenv("ORACLE_USER")
    password = os.getenv("ORACLE_PASSWORD")
    host = os.getenv("ORACLE_HOST")
    port = os.getenv("ORACLE_PORT")
    service = os.getenv("ORACLE_SERVICE")

    try:
        return oracledb.create_pool(
            user=user,
            password=password,
            dsn=f"{host}:{port}/{service}",
            min=1,
            max=5,
            increment=1,
        )
    except Exception as exc:
        print("ERROR CREANDO POOL ORACLE:")
        print(str(exc))
        return None


@contextmanager
def oracle_cursor(pool, commit=False):
    """Entrega un cursor Oracle y garantiza el cierre de cursor y conexión."""
    if pool is None:
        raise RuntimeError("Pool de Oracle no disponible")

    conn = None
    cursor = None

    try:
        conn = pool.acquire()
        cursor = conn.cursor()
        yield cursor
        if commit:
            conn.commit()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def fetch_one(pool, sql, params=None):
    if pool is None:
        return None

    with oracle_cursor(pool) as cursor:
        cursor.execute(sql, params or {})
        return cursor.fetchone()


def fetch_all(pool, sql, params=None):
    if pool is None:
        return []

    with oracle_cursor(pool) as cursor:
        cursor.execute(sql, params or {})
        return cursor.fetchall()


def fetch_int(pool, sql, params=None, default=0):
    row = fetch_one(pool, sql, params)

    if not row or row[0] is None:
        return default

    return int(row[0])


def execute(pool, sql, params=None):
    """Ejecuta una sentencia con commit. Devuelve False si no hay pool."""
    if pool is None:
        return False

    with oracle_cursor(pool, commit=True) as cursor:
        cursor.execute(sql, params or {})

    return True
