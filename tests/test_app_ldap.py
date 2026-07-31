from datetime import datetime, timedelta

import pytest

import app as app_module
from app import (
    Usuario,
    autenticar_ldap,
    mapear_rol_por_grupo,
    obtener_grupos_ldap,
    obtener_usuarios_ldap,
    obtener_usuarios_ldap_cache,
    sync_ldap,
)


class FakeAttribute:
    def __init__(self, value):
        self.value = value
        self.values = value if isinstance(value, list) else [value]


class FakeEntry:
    def __init__(self, **attrs):
        for nombre, valor in attrs.items():
            setattr(self, nombre, FakeAttribute(valor))
        self._attrs = attrs

    def __contains__(self, nombre):
        return nombre in self._attrs


class FakeLdapConnection:
    def __init__(self, entries=None, bind_error=None, **kwargs):
        if bind_error:
            raise bind_error
        self.kwargs = kwargs
        self.entries = entries or []
        self.searches = []
        self.unbound = False

    def search(self, base, filtro, attributes=None):
        self.searches.append((base, filtro, attributes))

    def unbind(self):
        self.unbound = True


@pytest.fixture
def ldap_config(monkeypatch):
    monkeypatch.setattr(app_module, "LDAP_SERVER", "ldap://fake")
    monkeypatch.setattr(app_module, "LDAP_BASE_DN", "dc=grio,dc=com")
    monkeypatch.setattr(app_module, "LDAP_ADMIN_USER", "cn=admin,dc=grio,dc=com")
    monkeypatch.setattr(app_module, "LDAP_ADMIN_PASSWORD", "secreto")
    monkeypatch.setattr(app_module.ldap3, "Server", lambda url: ("server", url))


@pytest.fixture
def sin_ldap_config(monkeypatch):
    monkeypatch.setattr(app_module, "LDAP_SERVER", None)
    monkeypatch.setattr(app_module, "LDAP_BASE_DN", None)
    monkeypatch.setattr(app_module, "LDAP_ADMIN_USER", None)
    monkeypatch.setattr(app_module, "LDAP_ADMIN_PASSWORD", None)


def _install_connection(monkeypatch, **conn_kwargs):
    creadas = []

    def factory(server, user=None, password=None, auto_bind=False):
        conexion = FakeLdapConnection(user=user, password=password, **conn_kwargs)
        creadas.append(conexion)
        return conexion

    monkeypatch.setattr(app_module.ldap3, "Connection", factory)
    return creadas


# --------------------------------------------------------------------- login


def test_autenticar_ldap_sin_configuracion(sin_ldap_config):
    assert autenticar_ldap("ana", "clave") is False


def test_autenticar_ldap_sin_credenciales(ldap_config):
    assert autenticar_ldap("ana", "") is False


def test_autenticar_ldap_exitoso(ldap_config, monkeypatch):
    creadas = _install_connection(monkeypatch)

    assert autenticar_ldap("ana", "clave") is True
    assert creadas[0].kwargs["user"] == "uid=ana,dc=grio,dc=com"
    assert creadas[0].unbound is True


def test_autenticar_ldap_bind_fallido(ldap_config, monkeypatch):
    _install_connection(monkeypatch, bind_error=RuntimeError("invalid credentials"))

    assert autenticar_ldap("ana", "clave") is False


# ------------------------------------------------------------------- usuarios


def test_obtener_usuarios_ldap_sin_configuracion(sin_ldap_config):
    assert obtener_usuarios_ldap() == []


def test_obtener_usuarios_ldap_ordena_y_deduplica(ldap_config, monkeypatch):
    entries = [FakeEntry(uid="zoe"), FakeEntry(uid="ana"), FakeEntry(uid="ana")]
    creadas = _install_connection(monkeypatch, entries=entries)

    assert obtener_usuarios_ldap() == ["ana", "zoe"]
    assert creadas[0].searches[0][1] == "(objectClass=person)"


def test_obtener_usuarios_ldap_error(ldap_config, monkeypatch):
    _install_connection(monkeypatch, bind_error=RuntimeError("timeout"))

    assert obtener_usuarios_ldap() == []


# --------------------------------------------------------------------- grupos


def test_obtener_grupos_ldap_sin_configuracion(sin_ldap_config):
    assert obtener_grupos_ldap("ana") == []


def test_obtener_grupos_ldap_sin_username(ldap_config):
    assert obtener_grupos_ldap("") == []


def test_obtener_grupos_ldap(ldap_config, monkeypatch):
    entries = [FakeEntry(memberOf=["cn=admins,dc=grio", "cn=rh,dc=grio"])]
    _install_connection(monkeypatch, entries=entries)

    assert obtener_grupos_ldap("ana") == ["cn=admins,dc=grio", "cn=rh,dc=grio"]


def test_obtener_grupos_ldap_entrada_sin_memberof(ldap_config, monkeypatch):
    _install_connection(monkeypatch, entries=[FakeEntry(uid="ana")])

    assert obtener_grupos_ldap("ana") == []


def test_obtener_grupos_ldap_error(ldap_config, monkeypatch):
    _install_connection(monkeypatch, bind_error=RuntimeError("timeout"))

    assert obtener_grupos_ldap("ana") == []


@pytest.mark.parametrize("grupos, esperado", [
    ([], "usuario"),
    (["CN=Admins,DC=grio"], "admin"),
    (["cn=sistemas,dc=grio"], "admin"),
    (["cn=rh,dc=grio"], "usuario"),
    (["cn=otro,dc=grio"], "usuario"),
    (["cn=otro,dc=grio", "cn=admins,dc=grio"], "admin"),
])
def test_mapear_rol_por_grupo(grupos, esperado):
    assert mapear_rol_por_grupo(grupos) == esperado


# ------------------------------------------------------------ sync y caché


def test_sync_ldap_crea_usuarios_faltantes(db, monkeypatch):
    db.add(Usuario(username="ana", rol="admin", permisos="dashboard"))
    db.commit()
    monkeypatch.setattr(app_module, "obtener_usuarios_ldap", lambda: ["ana", "beto"])

    sync_ldap(db)

    assert {u.username for u in db.query(Usuario).all()} == {"ana", "beto"}
    assert db.query(Usuario).filter_by(username="ana").first().rol == "admin"
    assert db.query(Usuario).filter_by(username="beto").first().rol == "usuario"


def test_obtener_usuarios_ldap_cache_consulta_una_vez(flask_app, monkeypatch):
    llamadas = []

    def fake_usuarios():
        llamadas.append(1)
        return ["ana"]

    monkeypatch.setattr(app_module, "obtener_usuarios_ldap", fake_usuarios)
    flask_app.config.pop("LDAP_CACHE", None)

    with flask_app.test_request_context("/"):
        assert obtener_usuarios_ldap_cache() == ["ana"]
        assert obtener_usuarios_ldap_cache() == ["ana"]

    assert len(llamadas) == 1


def test_obtener_usuarios_ldap_cache_expira(flask_app, monkeypatch):
    monkeypatch.setattr(app_module, "obtener_usuarios_ldap", lambda: ["beto"])
    flask_app.config["LDAP_CACHE"] = {
        "data": ["ana"],
        "last_update": datetime.now() - timedelta(minutes=5),
    }

    with flask_app.test_request_context("/"):
        assert obtener_usuarios_ldap_cache() == ["beto"]
