import sys
import types

import config
import database


def test_config_defaults():
    assert config.DB_HOST == "localhost"
    assert config.DB_NAME == "sistema_puntos_v5"


def test_get_db_uses_config_credentials(monkeypatch):
    llamadas = {}
    sentinel = object()

    def fake_connect(**kwargs):
        llamadas.update(kwargs)
        return sentinel

    monkeypatch.setattr(database.mysql.connector, "connect", fake_connect)

    assert database.get_db() is sentinel
    assert llamadas == {
        "host": config.DB_HOST,
        "user": config.DB_USER,
        "password": config.DB_PASSWORD,
        "database": config.DB_NAME,
    }


def test_instalar_dependencias_invoca_pip(monkeypatch, capsys):
    import installer

    comandos = []
    monkeypatch.setattr(installer.os, "system", comandos.append)

    installer.instalar_dependencias()

    assert comandos == ["pip install -r requirements.txt"]
    assert "Dependencias instaladas" in capsys.readouterr().out


def test_exportar_historial_escribe_excel(monkeypatch, tmp_path):
    # excel_export imports `get_connection` from `database`, which does not
    # define it; the name is injected here so the module can be exercised.
    conexion = object()
    monkeypatch.setattr(database, "get_connection", lambda: conexion, raising=False)
    sys.modules.pop("excel_export", None)

    import pandas as pd

    import excel_export

    consultas = {}

    def fake_read_sql(query, conn):
        consultas["query"] = query
        consultas["conn"] = conn
        return pd.DataFrame([{"id": 1, "puntos": 10}])

    escritos = {}

    def fake_to_excel(self, path, index=False):
        escritos["path"] = path
        escritos["index"] = index

    monkeypatch.setattr(excel_export, "pd", types.SimpleNamespace(read_sql=fake_read_sql))
    monkeypatch.setattr(pd.DataFrame, "to_excel", fake_to_excel)

    excel_export.exportar_historial()

    assert consultas["conn"] is conexion
    assert "transacciones_puntos" in consultas["query"]
    assert escritos == {"path": "historial.xlsx", "index": False}
