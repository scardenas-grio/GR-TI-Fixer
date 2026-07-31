from datetime import datetime

import pytest

import app as app_module
from app import (
    MovimientoPuntos,
    build_oracle_pool,
    get_operational_points,
    get_oracle_points,
    get_puntos_cache,
    insertar_cancelacion_resena_oracle,
    insertar_puntos_oracle,
    obtener_historial_oracle,
    paciente_tiene_resena_oracle,
    tiene_resena,
    tiene_resena_oracle,
)


def test_build_oracle_pool_devuelve_none_si_falla(monkeypatch):
    def boom(**kwargs):
        raise RuntimeError("sin instant client")

    monkeypatch.setattr(app_module.oracledb, "create_pool", boom)

    assert build_oracle_pool() is None


def test_build_oracle_pool_ok(monkeypatch):
    sentinel = object()
    llamadas = {}

    def fake_create_pool(**kwargs):
        llamadas.update(kwargs)
        return sentinel

    monkeypatch.setattr(app_module.oracledb, "create_pool", fake_create_pool)

    assert build_oracle_pool() is sentinel
    assert llamadas["dsn"] == (
        f"{app_module.ORACLE_HOST}:{app_module.ORACLE_PORT}/{app_module.ORACLE_SERVICE}"
    )


# ------------------------------------------------------------- puntos oracle


def test_get_oracle_points_sin_pool(no_oracle_pool):
    assert get_oracle_points(1) == 0


def test_get_oracle_points_suma(oracle_pool):
    pool = oracle_pool(rows=[(150,)])

    assert get_oracle_points("77") == 150
    assert pool.connection._cursor.executed[0][1] == {"idcliente": 77}
    assert pool.connection.closed is True


def test_get_oracle_points_null(oracle_pool):
    oracle_pool(rows=[(None,)])

    assert get_oracle_points(1) == 0


def test_get_oracle_points_error_devuelve_cero(oracle_pool):
    oracle_pool(error=RuntimeError("ORA-0001"))

    assert get_oracle_points(1) == 0


def test_get_puntos_cache_delega_en_oracle(oracle_pool):
    oracle_pool(rows=[(42,)])

    assert get_puntos_cache(5) == 42


# ----------------------------------------------------------------- inserciones


def test_insertar_puntos_oracle_sin_pool(no_oracle_pool):
    assert insertar_puntos_oracle(1, 2, 3, "cat", "ana") is None


def test_insertar_puntos_oracle_commit(oracle_pool):
    pool = oracle_pool()

    insertar_puntos_oracle("7", "9", 100, "resena", "ana")

    _, params = pool.connection._cursor.executed[0]
    assert params["idcliente"] == 7
    assert params["idcita"] == 9
    assert params["puntos"] == 100
    assert params["tipo"] == "Reseña"
    assert pool.connection.committed is True


def test_insertar_puntos_oracle_sin_idcita(oracle_pool):
    pool = oracle_pool()

    insertar_puntos_oracle(7, None, 50, "resena", "ana")

    assert pool.connection._cursor.executed[0][1]["idcita"] is None


def test_insertar_puntos_oracle_propaga_error(oracle_pool):
    oracle_pool(error=RuntimeError("ORA-9999"))

    with pytest.raises(RuntimeError):
        insertar_puntos_oracle(1, 1, 1, "cat", "ana")


def test_insertar_cancelacion_resena_oracle_usa_puntos_negativos(oracle_pool):
    pool = oracle_pool()

    insertar_cancelacion_resena_oracle(7, 9, 100, "ana")

    params = pool.connection._cursor.executed[0][1]
    assert params["puntos"] == -100
    assert params["tipo"] == "Cancelación reseña"
    assert pool.connection.committed is True


def test_insertar_cancelacion_resena_oracle_sin_pool(no_oracle_pool):
    assert insertar_cancelacion_resena_oracle(1, 2, 3, "ana") is None


def test_insertar_cancelacion_resena_oracle_propaga_error(oracle_pool):
    oracle_pool(error=RuntimeError("ORA-9999"))

    with pytest.raises(RuntimeError):
        insertar_cancelacion_resena_oracle(1, 1, 1, "ana")


# --------------------------------------------------------------------- reseñas


@pytest.mark.parametrize("rows, esperado", [
    ([(10,)], True),
    ([(0,)], False),
    ([(None,)], False),
])
def test_paciente_tiene_resena_oracle(oracle_pool, rows, esperado):
    oracle_pool(rows=rows)

    assert paciente_tiene_resena_oracle(3) is esperado


def test_paciente_tiene_resena_oracle_sin_pool(no_oracle_pool):
    assert paciente_tiene_resena_oracle(3) is False


def test_paciente_tiene_resena_oracle_error(oracle_pool):
    oracle_pool(error=RuntimeError("ORA-1"))

    assert paciente_tiene_resena_oracle(3) is False


def test_tiene_resena_oracle(oracle_pool):
    oracle_pool(rows=[(5,)])

    assert tiene_resena_oracle(3) is True


def test_tiene_resena_oracle_sin_pool(no_oracle_pool):
    assert tiene_resena_oracle(3) is False


def test_tiene_resena_oracle_propaga_error(oracle_pool):
    oracle_pool(error=RuntimeError("ORA-1"))

    with pytest.raises(RuntimeError):
        tiene_resena_oracle(3)


def test_tiene_resena_cuenta_registros(oracle_pool):
    oracle_pool(rows=[(2,)])

    assert tiene_resena(3) is True


def test_tiene_resena_sin_registros(oracle_pool):
    oracle_pool(rows=[(0,)])

    assert tiene_resena(3) is False


def test_tiene_resena_sin_pool(no_oracle_pool):
    assert tiene_resena(3) is False


def test_tiene_resena_error(oracle_pool):
    oracle_pool(error=RuntimeError("ORA-1"))

    assert tiene_resena(3) is False


# -------------------------------------------------------------------- historial


@pytest.fixture
def movimientos_locales(db):
    db.add_all([
        MovimientoPuntos(
            paciente_id="7", idcita="1", tipo="suma", cantidad=30,
            usuario_admin="ana", fecha=datetime(2024, 6, 1, 12, 0, 0), motivo="carga",
        ),
        MovimientoPuntos(
            paciente_id="7", idcita="2", tipo="suma", cantidad=500,
            usuario_admin="ana", fecha=datetime(2024, 6, 2, 12, 0, 0), motivo="reseña",
        ),
    ])
    db.commit()


def test_obtener_historial_oracle_combina_y_ordena(request_ctx, oracle_pool, movimientos_locales):
    oracle_pool(rows=[
        (-20, "Canje", "comentario", datetime(2024, 7, 1, 9, 0, 0)),
        (40, None, None, None),
    ])

    historial = obtener_historial_oracle("7")

    assert [item["fecha"] for item in historial] == [
        "2024-07-01 09:00:00",
        "2024-06-01 12:00:00",
        "",
    ]
    assert historial[0] == {
        "tipo": "resta",
        "cantidad": 20,
        "motivo": "Canje",
        "comentario": "comentario",
        "usuario_admin": "Oracle",
        "fecha": "2024-07-01 09:00:00",
    }
    assert historial[2]["tipo"] == "suma"


def test_obtener_historial_oracle_sin_pool(request_ctx, no_oracle_pool, movimientos_locales):
    historial = obtener_historial_oracle("7")

    assert len(historial) == 1
    assert historial[0]["usuario_admin"] == "ana"


def test_get_operational_points(db, oracle_pool, movimientos_locales):
    oracle_pool(rows=[(100,)])

    assert get_operational_points(db, "7") == {
        "oracle": 100,
        "ajustes_locales": 30,
        "total": 130,
    }
