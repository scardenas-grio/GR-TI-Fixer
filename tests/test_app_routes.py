from datetime import datetime

import pytest
from werkzeug.security import generate_password_hash

import app as app_module
from app import Auditoria, MovimientoPuntos, Notificacion, Rol, Usuario


@pytest.fixture
def client(flask_app, db, monkeypatch):
    monkeypatch.setattr(app_module, "SessionLocal", lambda: db)
    monkeypatch.setattr(app_module, "obtener_usuarios_ldap", lambda: ["ana", "beto"])
    monkeypatch.setattr(app_module.socketio, "emit", lambda *args, **kwargs: None)
    flask_app.config.pop("LDAP_CACHE", None)
    return flask_app.test_client()


@pytest.fixture
def sesion_admin(client, db):
    db.add(Usuario(username="ana", rol="admin", permisos="usuarios,puntos"))
    db.commit()
    with client.session_transaction() as sess:
        sess["usuario"] = "ana"
        sess["rol"] = "admin"
        sess["permisos"] = ["usuarios", "puntos"]
    return client


# ----------------------------------------------------------------- login/logout


def test_login_get_renderiza_formulario(client):
    respuesta = client.get("/")

    assert respuesta.status_code == 200


def test_login_post_sin_datos(client):
    respuesta = client.post("/", data={"username": "", "password": ""})

    assert respuesta.status_code == 200
    assert "Faltan datos" in respuesta.get_data(as_text=True)


def test_login_credenciales_invalidas(client, monkeypatch):
    monkeypatch.setattr(app_module, "autenticar_ldap", lambda u, p: False)

    respuesta = client.post("/", data={"username": "ana", "password": "mala"})

    assert respuesta.status_code == 200
    assert "Credenciales invalidas" in respuesta.get_data(as_text=True)


def test_login_superadmin_crea_usuario(client, db, monkeypatch):
    monkeypatch.setattr(app_module, "SUPERADMIN_USER", "root")
    monkeypatch.setattr(
        app_module, "SUPERADMIN_PASSWORD_HASH", generate_password_hash("clave")
    )

    respuesta = client.post("/", data={"username": "root", "password": "clave"})

    assert respuesta.status_code == 302
    assert respuesta.headers["Location"] == "/dashboard"
    assert db.query(Usuario).filter_by(username="root").first().rol == "superadmin"


def test_login_ldap_crea_usuario_con_rol_de_grupo(client, db, monkeypatch):
    monkeypatch.setattr(app_module, "autenticar_ldap", lambda u, p: True)
    monkeypatch.setattr(app_module, "obtener_grupos_ldap", lambda u: ["cn=admins,dc=x"])

    respuesta = client.post("/", data={"usuario": "beto", "password": "clave"})

    assert respuesta.status_code == 302
    assert db.query(Usuario).filter_by(username="beto").first().rol == "admin"


def test_login_ldap_actualiza_rol_de_usuario_existente(client, db, monkeypatch):
    db.add(Usuario(username="beto", rol="usuario", permisos=""))
    db.commit()
    monkeypatch.setattr(app_module, "autenticar_ldap", lambda u, p: True)
    monkeypatch.setattr(app_module, "obtener_grupos_ldap", lambda u: ["cn=sistemas"])

    client.post("/", data={"username": "beto", "password": "clave"})

    assert db.query(Usuario).filter_by(username="beto").first().rol == "admin"


def test_logout_limpia_sesion(sesion_admin):
    respuesta = sesion_admin.get("/logout")

    assert respuesta.status_code == 302
    with sesion_admin.session_transaction() as sess:
        assert "usuario" not in sess


# -------------------------------------------------------------------- vistas


def test_dashboard_requiere_sesion(client):
    assert client.get("/dashboard").status_code == 302


def test_dashboard_renderiza(sesion_admin, db):
    db.add(Auditoria(usuario_admin="ana", accion="crear", usuario_afectado="x",
                     detalle="d", fecha=datetime.now()))
    db.commit()

    assert sesion_admin.get("/dashboard").status_code == 200


def test_usuarios_requiere_permiso(client, db):
    db.add(Usuario(username="zoe", rol="usuario", permisos=""))
    db.commit()
    with client.session_transaction() as sess:
        sess["usuario"] = "zoe"

    respuesta = client.get("/usuarios")

    assert respuesta.status_code == 403


def test_usuarios_renderiza_para_admin(sesion_admin):
    assert sesion_admin.get("/usuarios").status_code == 200


def test_puntos_requiere_sesion(client):
    assert client.get("/puntos").status_code == 302


def test_puntos_renderiza(sesion_admin):
    assert sesion_admin.get("/puntos").status_code == 200


def test_reportes_requiere_sesion(client):
    assert client.get("/reportes").status_code == 302


def test_reportes_renderiza(sesion_admin):
    assert sesion_admin.get("/reportes").status_code == 200


def test_transcripcion_renderiza(client):
    assert client.get("/transcripcion").status_code == 200


# ---------------------------------------------------------------- apis simples


def test_api_dashboard(sesion_admin, db):
    db.add(Auditoria(usuario_admin="ana", accion="crear", usuario_afectado="x",
                     detalle="d", fecha=datetime.now()))
    db.commit()

    datos = sesion_admin.get("/api/dashboard").get_json()

    assert datos["total_ldap"] == 2
    assert datos["total_db"] == 1
    assert datos["total_admins"] == 1
    assert datos["actividad"][0]["accion"] == "crear"


def test_api_reportes_pagina(sesion_admin):
    datos = sesion_admin.get("/api/reportes?pagina=2").get_json()

    assert datos["pagina"] == 2
    assert datos["por_pagina"] == 8


def test_api_reportes_error(sesion_admin):
    respuesta = sesion_admin.get("/api/reportes?pagina=abc")

    assert respuesta.status_code == 500
    assert respuesta.get_json()["error"] is True


def test_api_usuario_existente(sesion_admin):
    datos = sesion_admin.get("/api/usuario/ana").get_json()

    assert datos == {"rol": "admin", "permisos": ["usuarios", "puntos"]}


def test_api_usuario_inexistente(sesion_admin):
    assert sesion_admin.get("/api/usuario/nadie").get_json() == {
        "rol": "usuario",
        "permisos": [],
    }


def test_api_usuarios_activos(sesion_admin, db):
    db.add(Usuario(username="zoe", rol="usuario", permisos=""))
    db.commit()

    datos = sesion_admin.get("/api/usuarios_activos").get_json()

    assert [item["username"] for item in datos] == ["ana"]


def test_api_buscar_ldap_filtra(sesion_admin):
    assert sesion_admin.get("/api/buscar_ldap?q=AN").get_json() == ["ana"]
    assert sesion_admin.get("/api/buscar_ldap").get_json() == ["ana", "beto"]


def test_api_dashboard_kpi(sesion_admin, db):
    db.add(MovimientoPuntos(paciente_id="1", idcita="1", tipo="suma", cantidad=10,
                            usuario_admin="ana", fecha=datetime.now(), motivo="carga"))
    db.commit()

    datos = sesion_admin.get("/api/dashboard/kpi").get_json()

    assert datos["total"] == 10
    assert datos["movimientos"] == 1
    assert datos["hoy"] == 1


def test_api_grafica_puntos(sesion_admin, db):
    db.add(MovimientoPuntos(paciente_id="1", idcita="1", tipo="suma", cantidad=10,
                            usuario_admin="ana", fecha=datetime(2024, 5, 1), motivo="carga"))
    db.commit()

    assert sesion_admin.get("/api/grafica/puntos").get_json() == [
        {"dia": "2024-05-01", "total": 10}
    ]


def test_detalle_reporte_por_rol(sesion_admin):
    assert sesion_admin.get("/api/reportes/detalle?tipo=admin").get_json() == ["ana"]


def test_detalle_reporte_por_movimiento(sesion_admin, db):
    db.add(MovimientoPuntos(paciente_id="1", idcita="1", tipo="resta", cantidad=5,
                            usuario_admin="ana", fecha=datetime.now(), motivo="canje"))
    db.commit()

    datos = sesion_admin.get("/api/reportes/detalle?tipo=resta").get_json()

    assert len(datos) == 1
    assert datos[0]["cantidad"] == 5


def test_detalle_reporte_tipo_desconocido(sesion_admin):
    assert sesion_admin.get("/api/reportes/detalle?tipo=xxx").get_json() == []


def test_exportar_reportes_csv_y_excel(sesion_admin):
    csv_response = sesion_admin.get("/exportar_reportes?formato=csv")
    excel_response = sesion_admin.get("/exportar_reportes")

    assert csv_response.mimetype == "text/csv"
    assert "spreadsheetml" in excel_response.mimetype


# ------------------------------------------------------------------ usuarios


def test_guardar_usuario_crea(sesion_admin, db):
    respuesta = sesion_admin.post(
        "/guardar_usuario",
        data={"username": "zoe", "rol": "usuario", "permisos[]": ["dashboard"]},
    )

    assert respuesta.get_json() == {"status": "ok"}
    creado = db.query(Usuario).filter_by(username="zoe").first()
    assert creado.permisos == "dashboard"
    assert db.query(Auditoria).filter_by(accion="CREAR").count() == 1


def test_guardar_usuario_edita(sesion_admin, db):
    db.add(Usuario(username="zoe", rol="usuario", permisos=""))
    db.commit()

    sesion_admin.post("/guardar_usuario", data={"username": "zoe", "rol": "admin"})

    assert db.query(Usuario).filter_by(username="zoe").first().rol == "admin"
    assert db.query(Auditoria).filter_by(accion="EDITAR").count() == 1


def test_guardar_usuario_datos_incompletos(sesion_admin):
    respuesta = sesion_admin.post("/guardar_usuario", data={"username": "zoe"})

    assert respuesta.status_code == 400


def test_guardar_usuario_admin_root_protegido(sesion_admin):
    respuesta = sesion_admin.post(
        "/guardar_usuario", data={"username": "admin_root", "rol": "admin"}
    )

    assert respuesta.status_code == 403


def test_guardar_usuario_sin_admin_valido(client):
    with client.session_transaction() as sess:
        sess["usuario"] = "fantasma"

    respuesta = client.post("/guardar_usuario", data={"username": "zoe", "rol": "admin"})

    assert respuesta.status_code == 403


def test_guardar_usuario_solo_superadmin_asigna_superadmin(sesion_admin):
    respuesta = sesion_admin.post(
        "/guardar_usuario", data={"username": "zoe", "rol": "superadmin"}
    )

    assert respuesta.status_code == 403


def test_guardar_usuario_no_modifica_superadmin(sesion_admin, db):
    db.add(Usuario(username="root", rol="superadmin", permisos="all"))
    db.commit()

    respuesta = sesion_admin.post(
        "/guardar_usuario", data={"username": "root", "rol": "admin"}
    )

    assert respuesta.status_code == 403


def test_eliminar_usuario_quita_acceso(sesion_admin, db):
    db.add(Usuario(username="zoe", rol="admin", permisos="usuarios"))
    db.commit()

    respuesta = sesion_admin.post("/eliminar_usuario/zoe")

    assert respuesta.get_json() == {"status": "ok"}
    zoe = db.query(Usuario).filter_by(username="zoe").first()
    assert (zoe.rol, zoe.permisos) == ("usuario", "")


def test_eliminar_usuario_admin_root(sesion_admin):
    assert sesion_admin.post("/eliminar_usuario/admin_root").status_code == 403


def test_eliminar_usuario_inexistente(sesion_admin):
    assert sesion_admin.post("/eliminar_usuario/nadie").status_code == 404


def test_eliminar_usuario_superadmin_protegido(sesion_admin, db):
    db.add(Usuario(username="root", rol="superadmin", permisos="all"))
    db.commit()

    assert sesion_admin.post("/eliminar_usuario/root").status_code == 403


# -------------------------------------------------------------- notificaciones


@pytest.fixture
def notificaciones(db):
    db.add_all([
        Notificacion(mensaje="m1", usuario="ana", leido=0, fecha=datetime.now()),
        Notificacion(mensaje="m2", usuario="ana", leido=0, fecha=datetime.now()),
    ])
    db.commit()


def test_api_notificaciones_lista(sesion_admin, notificaciones):
    datos = sesion_admin.get("/api/notificaciones").get_json()

    assert datos["total"] == 2
    assert datos["data"][0]["mensaje"] == "m2"


def test_api_notificaciones_usuario_sin_rol(client, db, notificaciones):
    db.add(Usuario(username="zoe", rol="usuario", permisos=""))
    db.commit()
    with client.session_transaction() as sess:
        sess["usuario"] = "zoe"

    assert client.get("/api/notificaciones").get_json()["total"] == 0


def test_leer_notificaciones_requiere_sesion(client):
    assert client.post("/api/notificaciones/leer").status_code == 401


def test_leer_notificaciones_marca_todas(sesion_admin, db, notificaciones):
    respuesta = sesion_admin.post("/api/notificaciones/leer")

    assert respuesta.get_json() == {"status": "ok"}
    assert db.query(Notificacion).filter_by(leido=0).count() == 0


def test_leer_notificacion_individual(sesion_admin, db, notificaciones):
    notif_id = db.query(Notificacion).first().id

    respuesta = sesion_admin.post(f"/api/notificaciones/{notif_id}/leer")

    assert respuesta.get_json() == {"status": "ok"}
    assert db.query(Notificacion).filter_by(id=notif_id).first().leido == 1


def test_leer_notificacion_inexistente(sesion_admin):
    assert sesion_admin.post("/api/notificaciones/999/leer").get_json() == {"status": "ok"}


def test_limpiar_notificaciones(sesion_admin, db, notificaciones):
    respuesta = sesion_admin.post("/api/notificaciones/clear")

    assert respuesta.get_json() == {"status": "ok"}
    assert db.query(Notificacion).count() == 0


# -------------------------------------------------------------------- puntos


def test_modificar_puntos_sin_sesion(client):
    respuesta = client.post("/api/puntos", json={"idcliente": 1, "tipo": "suma", "cantidad": 5})

    assert respuesta.status_code == 401


@pytest.mark.parametrize("payload, mensaje", [
    ({"idcliente": 1, "tipo": "suma", "cantidad": "x"}, "Cantidad invalida"),
    ({"idcliente": 1, "tipo": "suma", "cantidad": 0}, "Cantidad invalida"),
    ({"idcliente": None, "tipo": "suma", "cantidad": 5}, "Datos incompletos"),
    ({"idcliente": 1, "tipo": "otro", "cantidad": 5}, "Tipo invalido"),
])
def test_modificar_puntos_validaciones(sesion_admin, payload, mensaje):
    respuesta = sesion_admin.post("/api/puntos", json=payload)

    assert respuesta.status_code == 400
    assert respuesta.get_json()["msg"] == mensaje


def test_modificar_puntos_suma(sesion_admin, db, no_oracle_pool):
    respuesta = sesion_admin.post(
        "/api/puntos",
        json={"idcliente": 7, "idcita": "55", "tipo": "suma", "cantidad": 30},
    )
    datos = respuesta.get_json()

    assert datos["status"] == "ok"
    assert datos["saldo"]["total"] == 30
    assert datos["movimiento"]["idcita"] == "55"
    assert db.query(MovimientoPuntos).count() == 1
    assert db.query(Notificacion).count() == 1


def test_modificar_puntos_resta_sin_saldo(sesion_admin, no_oracle_pool):
    respuesta = sesion_admin.post(
        "/api/puntos", json={"idcliente": 7, "tipo": "resta", "cantidad": 30}
    )

    assert respuesta.status_code == 400
    assert respuesta.get_json()["msg"] == "Saldo insuficiente"


def test_modificar_puntos_resta_resena_requiere_rol(client, db, no_oracle_pool):
    db.add(Usuario(username="zoe", rol="usuario", permisos="puntos"))
    db.commit()
    with client.session_transaction() as sess:
        sess["usuario"] = "zoe"

    respuesta = client.post(
        "/api/puntos",
        json={"idcliente": 7, "tipo": "resta", "cantidad": 5, "categoria": "reseña"},
    )

    assert respuesta.status_code == 403


def test_modificar_puntos_resena_duplicada(sesion_admin, oracle_pool):
    oracle_pool(rows=[(100,)])

    respuesta = sesion_admin.post(
        "/api/puntos",
        json={"idcliente": 7, "tipo": "suma", "cantidad": 5, "categoria": "reseña"},
    )

    assert respuesta.status_code == 400
    assert "ya tiene una reseña" in respuesta.get_json()["msg"]


def test_modificar_puntos_resena_inserta_en_oracle(sesion_admin, db, oracle_pool):
    pool = oracle_pool(rows=[(0,)])

    respuesta = sesion_admin.post(
        "/api/puntos",
        json={"idcliente": 7, "idcita": 55, "tipo": "suma", "cantidad": 5, "categoria": "reseña"},
    )

    assert respuesta.get_json()["status"] == "ok"
    assert pool.connection.committed is True
    assert db.query(MovimientoPuntos).count() == 1


# ------------------------------------------------------------------ pacientes


def test_buscar_paciente_valor_no_numerico(sesion_admin):
    assert sesion_admin.get("/api/buscar_paciente?q=abc").get_json() == []


def test_buscar_paciente_por_idcliente(sesion_admin, oracle_pool):
    oracle_pool(rows=[(7, "Ana", "Lopez", "Ruiz")])

    datos = sesion_admin.get("/api/buscar_paciente?q=7").get_json()

    assert datos == [{"idcliente": 7, "nombre": "Ana Lopez Ruiz", "saldo": 7}]


def test_buscar_paciente_sin_resultados(sesion_admin, oracle_pool):
    oracle_pool(rows=[])

    assert sesion_admin.get("/api/buscar_paciente?q=7").get_json() == []


def test_buscar_paciente_error_oracle(sesion_admin, oracle_pool):
    oracle_pool(error=RuntimeError("ORA-1"))

    assert sesion_admin.get("/api/buscar_paciente?q=7").get_json() == []


def test_api_historial(sesion_admin, oracle_pool):
    oracle_pool(rows=[(15, "Carga", "ok", datetime(2024, 5, 1, 10, 0, 0))])

    datos = sesion_admin.get("/api/historial/7").get_json()

    assert datos == [{
        "tipo": "suma",
        "cantidad": 15,
        "motivo": "Carga",
        "comentario": "ok",
        "usuario_admin": "Oracle",
        "fecha": "2024-05-01 10:00:00",
    }]


def test_api_paciente(sesion_admin, db, no_oracle_pool):
    db.add(MovimientoPuntos(paciente_id="7", idcita="1", tipo="suma", cantidad=20,
                            usuario_admin="ana", fecha=datetime.now(), motivo="carga"))
    db.commit()

    datos = sesion_admin.get("/api/paciente/7").get_json()

    assert datos["puntos"] == 20
    assert datos["tiene_resena"] is False
    assert len(datos["historial"]) == 1


def test_api_tiene_resena(sesion_admin, oracle_pool):
    oracle_pool(rows=[(3,)])

    assert sesion_admin.get("/api/tiene_resena/7").get_json() == {"tiene": True}


# ------------------------------------------------------------- transcripcion


def test_estado_transcripcion_sin_datos(sesion_admin, oracle_pool):
    oracle_pool(rows=[])

    assert sesion_admin.get("/api/transcripcion/estado").get_json() == {
        "status": "success",
        "modo": None,
    }


def test_estado_transcripcion_con_datos(sesion_admin, oracle_pool):
    oracle_pool(rows=[("clave", "modo", 5, datetime(2024, 5, 1), "ana")])

    datos = sesion_admin.get("/api/transcripcion/estado").get_json()

    assert datos["clave"] == "clave"
    assert datos["idcita"] == 5
    assert datos["fecha_mod"] == "2024-05-01 00:00:00"
    assert datos["usuario_mod"] == "ana"


def test_estado_transcripcion_error(sesion_admin, no_oracle_pool):
    respuesta = sesion_admin.get("/api/transcripcion/estado")

    assert respuesta.status_code == 500
    assert respuesta.get_json()["status"] == "error"


# ------------------------------------------------------------------- sockets


def test_socket_connect_y_disconnect(flask_app, monkeypatch):
    emitidos = []
    monkeypatch.setattr(app_module, "join_room", lambda room: emitidos.append(("join", room)))
    monkeypatch.setattr(app_module, "leave_room", lambda room: emitidos.append(("leave", room)))
    monkeypatch.setattr(app_module, "emit", lambda *args, **kwargs: emitidos.append(args))

    with flask_app.test_request_context("/"):
        from flask import session

        session["usuario"] = "ana"
        app_module.socket_connect()

        assert app_module.usuarios_online.get("ana") is True

        app_module.socket_disconnect()

        assert "ana" not in app_module.usuarios_online

    assert ("join", "user_ana") in emitidos
    assert ("leave", "user_ana") in emitidos


def test_socket_connect_sin_usuario(flask_app, monkeypatch):
    monkeypatch.setattr(app_module, "join_room", lambda room: pytest.fail("no debe unirse"))

    with flask_app.test_request_context("/"):
        app_module.socket_connect()
        app_module.socket_disconnect()


# ----------------------------------------------------------- ciclo de peticion


def test_teardown_cierra_sesion_db(flask_app, monkeypatch):
    cerradas = []

    class FakeSession:
        def close(self):
            cerradas.append("close")

        def rollback(self):
            cerradas.append("rollback")

    monkeypatch.setattr(app_module, "SessionLocal", FakeSession)

    flask_app.test_client().get("/logout")

    assert "close" in cerradas


def test_crear_base_rellena_roles(db):
    app_module.crear_base(db)

    assert {rol.nombre for rol in db.query(Rol).all()} == {
        "usuario",
        "admin",
        "superadmin",
    }
