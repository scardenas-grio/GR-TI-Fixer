import os
import sys

import oracledb
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# app.py calls oracledb.init_oracle_client() and build_oracle_pool() at import
# time; neither the Instant Client nor an Oracle server exists in tests.
oracledb.init_oracle_client = lambda *args, **kwargs: None
oracledb.create_pool = lambda *args, **kwargs: None

# Force build_engine() onto a Postgres URL that is never contacted, so the
# module level create_all() fails fast instead of writing to database/sistema.db.
os.environ.setdefault("DB_USER", "test_user")
os.environ.setdefault("DB_PASSWORD", "test_pass")
os.environ.setdefault("DB_HOST", "127.0.0.1")
os.environ.setdefault("DB_NAME", "test_db")
os.environ.setdefault("SECRET_KEY", "test-secret")

import app as app_module  # noqa: E402


@pytest.fixture
def flask_app():
    app_module.app.config["TESTING"] = True
    return app_module.app


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:")
    app_module.Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


@pytest.fixture
def request_ctx(flask_app, db):
    """Request context whose g.db is the in-memory session."""
    with flask_app.test_request_context("/"):
        from flask import g

        g.db = db
        yield g


class FakeCursor:
    def __init__(self, rows=None, error=None):
        self.rows = rows or []
        self.error = error
        self.executed = []
        self.closed = False

    def execute(self, sql, params=None):
        if self.error is not None:
            raise self.error
        self.executed.append((sql, params))

    def fetchone(self):
        return self.rows[0] if self.rows else None

    def fetchall(self):
        return self.rows

    def close(self):
        self.closed = True


class FakeConnection:
    def __init__(self, cursor):
        self._cursor = cursor
        self.committed = False
        self.closed = False

    def cursor(self):
        return self._cursor

    def commit(self):
        self.committed = True

    def close(self):
        self.closed = True


class FakePool:
    def __init__(self, cursor):
        self.connection = FakeConnection(cursor)

    def acquire(self):
        return self.connection


@pytest.fixture
def oracle_pool(monkeypatch):
    """Install a fake Oracle pool and expose (pool, cursor_setter)."""

    def install(rows=None, error=None):
        cursor = FakeCursor(rows=rows, error=error)
        pool = FakePool(cursor)
        monkeypatch.setattr(app_module, "oracle_pool", pool)
        return pool

    return install


@pytest.fixture
def no_oracle_pool(monkeypatch):
    monkeypatch.setattr(app_module, "oracle_pool", None)
