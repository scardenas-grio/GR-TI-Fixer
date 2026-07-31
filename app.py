# ============================================================
# IMPORTS - Librerías estándar
# ============================================================

import csv
import io
import os
import sys

from collections import Counter
from datetime import date, datetime, timedelta
from math import ceil
from time import time
from urllib.parse import quote_plus

# ============================================================
# IMPORTS - Terceros
# ============================================================

import json

from dotenv import load_dotenv
from flask import Flask, Response, current_app, g, jsonify, redirect, render_template, request, session
from flask_socketio import SocketIO, emit, join_room, leave_room
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from sqlalchemy import Column, DateTime, Integer, String, create_engine, func, or_
from sqlalchemy.orm import declarative_base, sessionmaker
from werkzeug.security import check_password_hash
from sqlalchemy.exc import IntegrityError

# ============================================================
# IMPORTS - Utilidades del proyecto
# ============================================================

import oracle_client

from ldap_client import (
    autenticar_ldap,
    mapear_rol_por_grupo,
    obtener_grupos_ldap,
    obtener_usuarios_ldap,
)
from web_utils import (
    counter_to_chart,
    error_flag_json,
    error_json,
    handle_exception,
    parse_date_param,
    serialize_datetime,
    serialize_dia,
)

# ============================================================
# CONFIGURACIÓN GENERAL
# ============================================================

load_dotenv()
usuarios_online = {}

CACHE_PUNTOS = {}
CACHE_TTL = 60

# ============================================================
# CONFIGURACIÓN ORACLE
# ============================================================

oracle_client.init_oracle_client()

# ============================================================
# CONFIGURACIÓN SUPERADMIN
# ============================================================

SUPERADMIN_USER = os.getenv("SUPERADMIN_USER")
SUPERADMIN_PASSWORD_HASH = os.getenv("SUPERADMIN_PASSWORD_HASH")

# ============================================================
# BASE DE DATOS
# ============================================================

def build_engine():
    db_user = os.getenv("DB_USER")
    db_password = quote_plus(os.getenv("DB_PASSWORD") or "")
    db_host = os.getenv("DB_HOST")
    db_name = os.getenv("DB_NAME")

    if db_user and db_host and db_name:
        return create_engine(
            f"postgresql+psycopg2://{db_user}:{db_password}@{db_host}:5432/{db_name}",
            pool_pre_ping=True,
            pool_recycle=1800,
            pool_size=10,
            max_overflow=20,
            pool_timeout=30,
            echo=False,
        )

    base_dir = os.path.dirname(os.path.abspath(__file__))
    sqlite_path = os.path.join(base_dir, "database", "sistema.db")
    return create_engine(f"sqlite:///{sqlite_path}", future=True)


engine = build_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

# ============================================================
# APLICACIÓN FLASK
# ============================================================

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY") or "clave_super_secreta"
socketio = SocketIO(app, cors_allowed_origins="*",async_mode="gevent") # agregar dominio ahorita slo tiene un simbolo


# ============================================================
# CONSULTAS ORACLE
# ============================================================

SQL_SALDO_PUNTOS = """
    SELECT NVL(SUM(PUNTOS),0)
    FROM SISTSIO.RIOREWARDS_DETALLE
    WHERE IDCLIENTE = :idcliente
"""

SQL_SALDO_RESENA = """
    SELECT NVL(SUM(PUNTOS),0)
    FROM SISTSIO.RIOREWARDS_DETALLE
    WHERE IDCLIENTE = :idcliente
      AND UPPER(TIPORECOMPENSA) IN (
            UPPER('Reseña'),
            UPPER('Cancelación reseña')
      )
"""

SQL_CONTAR_RESENAS = """
    SELECT COUNT(*)
    FROM SISTSIO.RIOREWARDS_DETALLE
    WHERE IDCLIENTE = :idcliente
      AND UPPER(TIPORECOMPENSA) LIKE '%RESE%'
"""

SQL_HISTORIAL_PUNTOS = """
    SELECT
        PUNTOS,
        TIPORECOMPENSA,
        COMENTARIO,
        FECHATRANSACCION
    FROM SISTSIO.RIOREWARDS_DETALLE
    WHERE IDCLIENTE = :idcliente
"""

SQL_PACIENTE_POR_IDCLIENTE = """
    SELECT
        IDCLIENTE,
        NOMBRE,
        APATERNO,
        AMATERNO
    FROM SISTSIO.CLIENTES
    WHERE IDCLIENTE = :valor
"""

SQL_PACIENTE_POR_IDCITA = """
    SELECT
        c.IDCLIENTE,
        c.NOMBRE,
        c.APATERNO,
        c.AMATERNO
    FROM SISTSIO.CLIENTES c,
        SISTSIO.RIOREWARDS_DETALLE r
    WHERE r.IDCLIENTE = c.IDCLIENTE
    AND r.IDCITA = :valor
    AND ROWNUM = 1
"""

SQL_ESTADO_TRANSCRIPCION = """
    SELECT
        CLAVE,
        MODO,
        IDCITA,
        FECHA_MOD,
        USUARIO_MOD
    FROM SISTSIO.V_SEMAFORO_UNIFICADO_ESTADO
"""

SQL_INSERTAR_MOVIMIENTO_RESENA = """
    INSERT INTO SISTSIO.RIOREWARDS_DETALLE
    (
        IDCLIENTE,
        IDCITA,
        CANTIDAD,
        PUNTOS,
        TIPORECOMPENSA,
        COMENTARIO,
        CORREOREGISTRADO
    )
    VALUES
    (
        :idcliente,
        :idcita,
        0,
        :puntos,
        :tipo,
        :comentario,
        NULL
    )
"""


def get_oracle_points(idcliente):

    try:
        return oracle_client.fetch_int(
            oracle_pool,
            SQL_SALDO_PUNTOS,
            {"idcliente": int(idcliente)}
        )

    except Exception as exc:
        print("ORACLE POINTS ERROR:", exc)
        return 0


def insertar_movimiento_resena_oracle(idcliente, idcita, puntos, tipo, comentario):

    return oracle_client.execute(
        oracle_pool,
        SQL_INSERTAR_MOVIMIENTO_RESENA,
        {
            "idcliente": int(idcliente),
            "idcita": int(idcita) if idcita else None,
            "puntos": int(puntos),
            "tipo": tipo,
            "comentario": comentario,
        }
    )


def insertar_puntos_oracle(idcliente, idcita, cantidad):

    try:
        insertado = insertar_movimiento_resena_oracle(
            idcliente,
            idcita,
            int(cantidad),
            "Reseña",
            "Bonificación por reseña"
        )

    except Exception as exc:
        print("ERROR INSERT ORACLE:", exc)
        raise

    if insertado:
        print(
            f"ORACLE OK -> cliente={idcliente} puntos={cantidad}"
        )


def insertar_cancelacion_resena_oracle(idcliente, idcita, cantidad):

    try:
        insertar_movimiento_resena_oracle(
            idcliente,
            idcita,
            -abs(int(cantidad)),
            "Cancelación reseña",
            "Cancelación de bonificación por reseña"
        )

    except Exception as exc:
        print("ERROR CANCELANDO RESEÑA:", exc)
        raise


def tiene_resena_oracle(idcliente):
    """True si el saldo de reseña del paciente sigue siendo positivo."""

    try:
        saldo = oracle_client.fetch_int(
            oracle_pool,
            SQL_SALDO_RESENA,
            {"idcliente": int(idcliente)}
        )

    except Exception as exc:
        print("ERROR VALIDANDO RESEÑA:", exc)
        return False

    return saldo > 0


oracle_pool = oracle_client.build_oracle_pool()
print("ORACLE POOL CREADO:", oracle_pool)


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True)
    rol = Column(String(50))
    permisos = Column(String(200))


class Permiso(Base):
    __tablename__ = "permisos"

    id = Column(Integer, primary_key=True)
    nombre = Column(String(50), unique=True)


class Rol(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True)
    nombre = Column(String(50), unique=True)
    permisos = Column(String(200))


class Auditoria(Base):
    __tablename__ = "auditoria"

    id = Column(Integer, primary_key=True)
    usuario_admin = Column(String(50))
    accion = Column(String(50))
    usuario_afectado = Column(String(50))
    detalle = Column(String(200))
    fecha = Column(DateTime, default=datetime.now)


class Notificacion(Base):
    __tablename__ = "notificaciones"

    id = Column(Integer, primary_key=True)
    mensaje = Column(String(200))
    usuario = Column(String(50))
    leido = Column(Integer, default=0)
    fecha = Column(DateTime, default=datetime.now)


class Puntos(Base):
    __tablename__ = "puntos"

    id = Column(Integer, primary_key=True)
    paciente_id = Column(String(50), unique=True)
    puntos = Column(Integer, default=0)
    actualizado_en = Column(DateTime, default=datetime.now)


class MovimientoPuntos(Base):
    __tablename__ = "movimientos_puntos"

    id = Column(Integer, primary_key=True)
    paciente_id = Column(String(50))
    idcita = Column(String(50))
    tipo = Column(String(20))
    cantidad = Column(Integer)
    usuario_admin = Column(String(50))
    fecha = Column(DateTime, default=datetime.now)
    motivo = Column(String(50))
    origen = Column(String(50))


def get_db():
    if not hasattr(g, "db") or g.db is None:
        g.db = SessionLocal()
    return g.db


def get_usuario():
    return session.get("usuario")


def get_report_filters(source):
    return {
        "tipo": (source.get("tipo") or "puntos").strip().lower(),

        "usuario": (source.get("usuario") or "").strip(),

        "fecha_inicio": (
            source.get("fecha_inicio") or ""
        ).strip(),

        "fecha_fin": (
            source.get("fecha_fin") or ""
        ).strip(),

        "movimiento_tipo": (
            source.get("movimiento_tipo") or ""
        ).strip().lower(),

        # 🔥 NUEVO
        "pagina": int(source.get("pagina", 1)),

        # 🔥 NUEVO
        "por_pagina": int(source.get("por_pagina", 20)),
    }


def serialize_movimiento(registro):
    return {
        "id": registro.id,
        "paciente_id": str(registro.paciente_id),
        "idcita": registro.idcita or "",
        "tipo": registro.tipo or "",
        "cantidad": int(registro.cantidad or 0),
        "usuario_admin": registro.usuario_admin or "",
        "fecha": serialize_datetime(registro.fecha),
        "motivo": registro.motivo or "",
    }


def serialize_auditoria(registro):
    return {
        "id": registro.id,
        "usuario_admin": registro.usuario_admin or "",
        "accion": registro.accion or "",
        "usuario_afectado": registro.usuario_afectado or "",
        "detalle": registro.detalle or "",
        "fecha": serialize_datetime(registro.fecha),
    }


def aplicar_filtros_admin_fecha(query, modelo, filtros):
    """Filtra por usuario_admin y rango de fechas cualquier modelo que los tenga."""
    usuario = filtros.get("usuario")
    fecha_inicio = parse_date_param(filtros.get("fecha_inicio"))
    fecha_fin = parse_date_param(filtros.get("fecha_fin"), end_of_day=True)

    if usuario:
        query = query.filter(modelo.usuario_admin.ilike(f"%{usuario}%"))
    if fecha_inicio:
        query = query.filter(modelo.fecha >= fecha_inicio)
    if fecha_fin:
        query = query.filter(modelo.fecha <= fecha_fin)

    return query


def build_filtered_movimientos_query(db, filtros):
    query = aplicar_filtros_admin_fecha(
        db.query(MovimientoPuntos),
        MovimientoPuntos,
        filtros
    )

    movimiento_tipo = filtros.get("movimiento_tipo")

    if movimiento_tipo in {"suma", "resta"}:
        query = query.filter(MovimientoPuntos.tipo == movimiento_tipo)

    return query


def build_filtered_auditoria_query(db, filtros):
    return aplicar_filtros_admin_fecha(db.query(Auditoria), Auditoria, filtros)


def obtener_historial_oracle(idcliente):

    historial = []

    # ======================
    # HISTORIAL ORACLE
    # ======================
    rows = oracle_client.fetch_all(
        oracle_pool,
        SQL_HISTORIAL_PUNTOS,
        {"idcliente": int(idcliente)}
    )

    for row in rows:

        puntos = int(row[0] or 0)

        historial.append({
            "tipo": "suma" if puntos >= 0 else "resta",
            "cantidad": abs(puntos),
            "motivo": row[1] or "",
            "comentario": row[2] or "",
            "usuario_admin": "Oracle",
            "fecha": serialize_datetime(row[3])
        })

    # ======================
    # HISTORIAL LOCAL
    # ======================
    db = get_db()

    movimientos = (
        db.query(MovimientoPuntos)
        .filter(
            MovimientoPuntos.paciente_id == str(idcliente)
        )
        .all()
    )

    for mov in movimientos:

        if (mov.motivo or "").lower() == "reseña":
            continue

        historial.append({
            "tipo": mov.tipo,
            "cantidad": mov.cantidad,
            "motivo": mov.motivo or "",
            "comentario": mov.motivo or "",
            "usuario_admin": mov.usuario_admin or "",
            "fecha": serialize_datetime(mov.fecha)
        })

    historial.sort(
        key=lambda x: x["fecha"],
        reverse=True
    )

    return historial

        

def calcular_saldo_local(db, idcliente):

    movimientos = (
        db.query(MovimientoPuntos)
        .filter(
            MovimientoPuntos.paciente_id == str(idcliente)
        )
        .all()
    )

    total = 0

    for mov in movimientos:

        # IGNORAR cualquier movimiento de reseña
        if (mov.motivo or "").lower() == "reseña":
            continue

        if mov.tipo == "suma":
            total += mov.cantidad

        elif mov.tipo == "resta":
            total -= mov.cantidad

    return total

def calcular_puntos_netos(db):
    """Suma de todos los movimientos locales (suma - resta)."""
    return sum(
        movimiento.cantidad
        if movimiento.tipo == "suma"
        else -movimiento.cantidad
        for movimiento in db.query(MovimientoPuntos).all()
    )


def get_operational_points(db, idcliente):

    oracle_points = get_oracle_points(idcliente)
    local_delta = calcular_saldo_local(db, idcliente)

    return {
        "oracle": oracle_points,
        "ajustes_locales": local_delta,
        "total": (oracle_points or 0) + (local_delta or 0),
    }


def tiene_resena(idcliente):
    """True si el paciente tiene algún movimiento de reseña registrado."""

    try:
        total = oracle_client.fetch_int(
            oracle_pool,
            SQL_CONTAR_RESENAS,
            {"idcliente": idcliente}
        )

    except Exception as exc:
        print("ORACLE RESENA ERROR:", exc)
        return False

    return total > 0

def ya_tiene_resena_local(db, idcliente):
    existe = db.query(MovimientoPuntos).filter(
        MovimientoPuntos.paciente_id == str(idcliente),
        MovimientoPuntos.motivo == "reseña"
    ).first()
    return existe is not None


def paginar_por_fecha(query, modelo, offset, por_pagina):
    """Devuelve (todos, pagina_actual) ordenados por fecha e id descendente."""
    ordenada = query.order_by(modelo.fecha.desc(), modelo.id.desc())

    return ordenada.all(), ordenada.offset(offset).limit(por_pagina).all()


def build_report_context(db, filtros):
    pagina = int(filtros.get("pagina", 1))
    por_pagina = int(
        filtros.get("por_pagina", 8)
    )
    offset = (pagina - 1) * por_pagina

    query_movimientos = build_filtered_movimientos_query(db, filtros)

    total_movimientos = query_movimientos.count()

    movimientos_chart, movimientos = paginar_por_fecha(
        query_movimientos,
        MovimientoPuntos,
        offset,
        por_pagina
    )

    query_auditoria = build_filtered_auditoria_query(db, filtros)

    auditoria_chart, auditoria = paginar_por_fecha(
        query_auditoria,
        Auditoria,
        offset,
        por_pagina
    )

    usuarios = db.query(Usuario).order_by(
        Usuario.username.asc()
    ).all()

    puntos_por_fecha = Counter()
    movimientos_por_fecha = Counter()
    movimientos_por_admin = Counter()
    for movimiento in movimientos_chart:

        fecha_key = serialize_dia(movimiento.fecha)

        valor = (
            movimiento.cantidad
            if movimiento.tipo == "suma"
            else -movimiento.cantidad
        )

        puntos_por_fecha[fecha_key] += valor

        movimientos_por_fecha[fecha_key] += 1

        movimientos_por_admin[
            movimiento.usuario_admin
            or "Sin usuario"
        ] += 1

    auditoria_por_accion = Counter(
        registro.accion or "Sin accion"
        for registro in auditoria_chart
    )
    auditoria_por_fecha = Counter(
        serialize_dia(registro.fecha)
        for registro in auditoria_chart
        if registro.fecha
    )
    roles = Counter((usuario.rol or "usuario") for usuario in usuarios)

    chart_roles = {
        "labels": ["Admin", "Usuario", "Superadmin"],
        "valores": [
            roles.get("admin", 0),
            roles.get("usuario", 0),
            roles.get("superadmin", 0),
        ],
    }
    chart_puntos_fecha = counter_to_chart(puntos_por_fecha)
    chart_movimientos_fecha = counter_to_chart(movimientos_por_fecha)
    chart_movimientos_admin = counter_to_chart(movimientos_por_admin)
    chart_auditoria = counter_to_chart(auditoria_por_accion)
    chart_auditoria_fecha = counter_to_chart(auditoria_por_fecha)

    datos_puntos = [serialize_movimiento(movimiento) for movimiento in movimientos]
    datos_admin = [serialize_auditoria(registro) for registro in auditoria]
    tipo = filtros.get("tipo", "puntos")

    kpis = {
        "usuarios": len(usuarios),

        "admins":
            roles.get("admin", 0)
            + roles.get("superadmin", 0),

        "movimientos_puntos":
            total_movimientos,

        "auditoria":
            len(auditoria),

        "puntos_netos":
            len(auditoria)
            if tipo == "admin"
            else calcular_puntos_netos(db),

        "movimientos_hoy":
            len(auditoria_chart)
            if tipo == "admin"
            else sum(
                1
                for registro in datos_puntos
                if registro["fecha"].startswith(
                    date.today().isoformat()
                )
            )
    }

    if tipo == "admin":

        chart_principal = dict(chart_auditoria)
        chart_fechas = dict(chart_auditoria_fecha)

    else:

        chart_principal = dict(chart_movimientos_admin)
        chart_fechas = dict(chart_puntos_fecha)
    return {
        "tipo": filtros.get("tipo", "puntos"),
        "filtros": filtros,
        "datos_puntos": datos_puntos,
        "datos_admin": datos_admin,
        "kpis": kpis,
        "pagina": pagina,
        "por_pagina": por_pagina,
        "total_movimientos": total_movimientos,
        "chart_roles": chart_roles,
        "chart_puntos_fecha": chart_puntos_fecha,
        "chart_movimientos_fecha": chart_movimientos_fecha,
        "chart_movimientos_admin": chart_movimientos_admin,
        "chart_auditoria": chart_auditoria,
        "chart_auditoria_fecha": chart_auditoria_fecha,
        "labels": chart_roles["labels"],
        "valores": chart_roles["valores"],
        "valores_admin": [roles.get("admin", 0)],
        "valores_user": [roles.get("usuario", 0)],
        "valores_super": [roles.get("superadmin", 0)],
        "chart_principal": chart_principal,
        "chart_fechas": chart_fechas,
    }


# ============================================================
# EXPORTACIONES
# ============================================================

# (encabezado, clave del registro serializado)
COLUMNAS_PUNTOS = [
    ("Paciente", "paciente_id"),
    ("IDCita", "idcita"),
    ("Tipo", "tipo"),
    ("Cantidad", "cantidad"),
    ("Admin", "usuario_admin"),
    ("Fecha", "fecha"),
]

COLUMNAS_AUDITORIA = [
    ("Admin", "usuario_admin"),
    ("Accion", "accion"),
    ("Usuario", "usuario_afectado"),
    ("Detalle", "detalle"),
    ("Fecha", "fecha"),
]


def filas_reporte(registros, columnas):
    return [[registro[clave] for _, clave in columnas] for registro in registros]


def respuesta_descarga(contenido, mimetype, filename):
    return Response(
        contenido,
        mimetype=mimetype,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


def exportar_reportes_excel(context):
    workbook = Workbook()
    resumen = workbook.active
    resumen.title = "Resumen"

    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="1D4ED8", end_color="1D4ED8", fill_type="solid")
    center = Alignment(horizontal="center", vertical="center")
    border = Border(
        left=Side(style="thin"),
        right=Side(style="thin"),
        top=Side(style="thin"),
        bottom=Side(style="thin"),
    )

    def style_sheet(sheet):
        for cell in sheet[1]:
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = center
            cell.border = border
        for row in sheet.iter_rows(min_row=2):
            for cell in row:
                cell.border = border
        for column in sheet.columns:
            width = max(len(str(cell.value or "")) for cell in column)
            sheet.column_dimensions[column[0].column_letter].width = width + 2

    resumen.append(["Metrica", "Valor"])
    resumen.append(["Usuarios", context["kpis"]["usuarios"]])
    resumen.append(["Admins", context["kpis"]["admins"]])
    resumen.append(["Movimientos puntos", context["kpis"]["movimientos_puntos"]])
    resumen.append(["Puntos netos", context["kpis"]["puntos_netos"]])
    resumen.append(["Registros auditoria", context["kpis"]["auditoria"]])
    style_sheet(resumen)

    def agregar_hoja(titulo, columnas, registros):
        sheet = workbook.create_sheet(titulo)
        sheet.append([encabezado for encabezado, _ in columnas])
        for fila in filas_reporte(registros, columnas):
            sheet.append(fila)
        style_sheet(sheet)

    agregar_hoja("Puntos", COLUMNAS_PUNTOS, context["datos_puntos"])
    agregar_hoja("Auditoria", COLUMNAS_AUDITORIA, context["datos_admin"])

    output = io.BytesIO()
    workbook.save(output)
    output.seek(0)
    return respuesta_descarga(
        output.getvalue(),
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "reporte_sistema.xlsx",
    )


def exportar_reportes_csv(context):
    stream = io.StringIO()
    writer = csv.writer(stream)
    writer.writerow(["seccion", "campo_1", "campo_2", "campo_3", "campo_4", "campo_5", "campo_6"])

    for fila in filas_reporte(context["datos_puntos"], COLUMNAS_PUNTOS):
        writer.writerow(["puntos", *fila])

    for fila in filas_reporte(context["datos_admin"], COLUMNAS_AUDITORIA):
        writer.writerow(["auditoria", *fila, ""])

    return respuesta_descarga(
        stream.getvalue(),
        "text/csv; charset=utf-8",
        "reporte_sistema.csv",
    )


def crear_base(db):
    permisos_base = ["dashboard", "usuarios", "reportes", "puntos"]
    roles_base = {
        "usuario": "dashboard",
        "admin": "dashboard,usuarios,reportes,puntos",
        "superadmin": "all",
    }

    for permiso in permisos_base:
        if not db.query(Permiso).filter_by(nombre=permiso).first():
            db.add(Permiso(nombre=permiso))

    for nombre, permisos in roles_base.items():
        rol = db.query(Rol).filter_by(nombre=nombre).first()
        if not rol:
            db.add(Rol(nombre=nombre, permisos=permisos))
        elif nombre != "superadmin" and "puntos" not in (rol.permisos or ""):
            rol.permisos = permisos

    db.commit()


def sync_ldap(db):
    for username in obtener_usuarios_ldap():
        if not db.query(Usuario).filter_by(username=username).first():
            db.add(Usuario(username=username, rol="usuario", permisos=""))
    db.commit()


def lista_permisos(valor):
    return [permiso.strip() for permiso in (valor or "").split(",") if permiso.strip()]


def iniciar_sesion(user):
    session["usuario"] = user.username
    session["rol"] = user.rol
    session["permisos"] = lista_permisos(user.permisos)
    print("Permisos cargados:", session["permisos"])


def registrar_notificacion(db, mensaje, usuario):
    db.add(
        Notificacion(
            mensaje=mensaje,
            usuario=usuario,
            leido=0,
            fecha=datetime.now(),
        )
    )
    db.commit()


def emitir_actividad(mensaje, tipo):
    """Publica el mismo evento en notificaciones, dashboard y feed de actividad."""
    ahora = datetime.now()

    socketio.emit(
        "nueva_notificacion",
        {
            "mensaje": mensaje,
            "fecha": serialize_datetime(ahora)
        }
    )

    socketio.emit(
        "actualizar_dashboard",
        {
            "tipo": tipo
        }
    )

    socketio.emit(
        "activity_feed",
        {
            "mensaje": mensaje,
            "hora": ahora.strftime("%H:%M")
        }
    )


def log_auditoria(admin, accion, usuario, detalle):
    db = get_db()
    db.add(
        Auditoria(
            usuario_admin=admin,
            accion=accion,
            usuario_afectado=usuario,
            detalle=detalle,
            fecha=datetime.now(),
        )
    )
    db.commit()


def requiere_permiso(permiso):
    def decorator(funcion):
        def wrapped(*args, **kwargs):
            db = get_db()
            if "usuario" not in session:
                return redirect("/")

            usuario = db.query(Usuario).filter_by(username=session["usuario"]).first()
            if not usuario:
                return redirect("/")

            if usuario.rol == "superadmin":
                return funcion(*args, **kwargs)

            rol = db.query(Rol).filter_by(nombre=usuario.rol).first()
            permisos_finales = set(
                lista_permisos(rol.permisos if rol else "")
                + lista_permisos(usuario.permisos)
            )

            if permiso not in permisos_finales:
                return "No tienes permiso", 403
            return funcion(*args, **kwargs)

        wrapped.__name__ = funcion.__name__
        return wrapped

    return decorator


def obtener_usuarios_ldap_cache():
    cache = current_app.config.setdefault("LDAP_CACHE", {"data": [], "last_update": None})
    last_update = cache.get("last_update")
    if not last_update or datetime.now() - last_update > timedelta(minutes=2):
        cache["data"] = obtener_usuarios_ldap()
        cache["last_update"] = datetime.now()
    return cache["data"]


def get_unread_notifications_count(db, username):
    if not username:
        return 0
    return db.query(Notificacion).filter_by(usuario=username, leido=0).count()


try:
    Base.metadata.create_all(engine)
    db_bootstrap = SessionLocal()
    crear_base(db_bootstrap)
    db_bootstrap.close()
except Exception as exc:
    print("DATABASE INIT ERROR:", exc)


@app.before_request
def before_request():
    if not hasattr(g, "db"):
        g.db = SessionLocal()


@app.teardown_appcontext
def shutdown_session(exception=None):
    db = getattr(g, "db", None)
    if db is not None:
        try:
            if exception:
                db.rollback()
            db.close()
        except Exception as exc:
            print("DB CLOSE ERROR:", exc)


@app.route("/", methods=["GET", "POST"])
def login():
    db = get_db()
    error = None

    if request.method == "POST":
        username = request.form.get("username") or request.form.get("usuario")
        password = request.form.get("password")

        if not username or not password:
            error = "Faltan datos"
            return render_template("login.html", error=error)

        if username == SUPERADMIN_USER and SUPERADMIN_PASSWORD_HASH:
            if check_password_hash(SUPERADMIN_PASSWORD_HASH, password):
                user = db.query(Usuario).filter_by(username=username).first()
                if not user:
                    user = Usuario(username=username, rol="superadmin", permisos="all")
                    db.add(user)
                    db.commit()
                iniciar_sesion(user)
                return redirect(obtener_pagina_inicio())

        if autenticar_ldap(username, password):
            user = db.query(Usuario).filter_by(username=username).first()
            if not user:
                grupos = obtener_grupos_ldap(username)
                user = Usuario(username=username, rol=mapear_rol_por_grupo(grupos), permisos="")
                db.add(user)
            elif not user.rol or user.rol == "usuario":
                user.rol = mapear_rol_por_grupo(obtener_grupos_ldap(username))

            db.commit()
            iniciar_sesion(user)
            return redirect(obtener_pagina_inicio())

        error = "Credenciales invalidas"

    return render_template("login.html", error=error)

def obtener_pagina_inicio():
    if session.get("rol") == "superadmin":
        return "/dashboard"

    permisos = session.get("permisos", [])

    if "dashboard" in permisos:
        return "/dashboard"

    if "puntos" in permisos:
        return "/puntos"

    if "usuarios" in permisos:
        return "/usuarios"

    if "reportes" in permisos:
        return "/reportes"

    if "transcripcion" in permisos:
        return "/transcripcion"

    return "/logout"


@app.route("/dashboard")
def dashboard():
    db = get_db()
    if "usuario" not in session:
        return redirect("/")

    try:
        total_ldap = len(obtener_usuarios_ldap_cache())
        total_db = db.query(Usuario).count()
        total_admins = db.query(Usuario).filter(Usuario.rol.in_(["admin", "superadmin"])).count()
        actividad = db.query(Auditoria).order_by(Auditoria.id.desc()).limit(10).all()
        print("Hora Python:", datetime.now())
    except Exception as exc:
        print("DASHBOARD ERROR:", exc)
        total_ldap = 0
        total_db = 0
        total_admins = 0
        actividad = []

    return render_template(
        "dashboard.html",
        total_ldap=total_ldap,
        total_db=total_db,
        total_admins=total_admins,
        actividad=actividad,
        now=datetime.now(),
        notificaciones=get_unread_notifications_count(db, session.get("usuario")),
    )

@app.route("/api/dashboard")
def api_dashboard():
    db = get_db()
    try:
        actividad = db.query(Auditoria).order_by(Auditoria.id.desc()).limit(5).all()
        actividad_json = [
            {
                "admin": registro.usuario_admin,
                "accion": registro.accion,
                "usuario": registro.usuario_afectado,
                "detalle": registro.detalle,
                "fecha": serialize_datetime(registro.fecha),
            }
            for registro in actividad
        ]
        return jsonify(
            {
                "total_ldap": len(obtener_usuarios_ldap_cache()),
                "total_db": db.query(Usuario).count(),
                "total_admins": db.query(Usuario).filter(Usuario.rol.in_(["admin", "superadmin"])).count(),
                "actividad": actividad_json,
                "hora_servidor": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
            }
        )
    except Exception as exc:
        print("API DASHBOARD ERROR:", exc)
        return jsonify({"error": True}), 500


@app.route("/api/reportes")
def api_reportes():
    db = get_db()

    try:

        filtros = get_report_filters(request.args)

        filtros["pagina"] = int(
            request.args.get("pagina", 1)
        )

        filtros["por_pagina"] = 8

        return jsonify(
            build_report_context(
                db,
                filtros
            )
        )

    except Exception as exc:
        print("API REPORTES ERROR:", exc)

        return error_flag_json(exc)


@app.route("/usuarios")
@requiere_permiso("usuarios")
def usuarios():
    db = get_db()
    page_ldap = request.args.get("page_ldap", default=1, type=int)
    page_activos = request.args.get("page_activos", default=1, type=int)
    per_page = 7

    ldap_users_all = obtener_usuarios_ldap_cache()
    total_ldap = len(ldap_users_all)
    total_pages = max(1, ceil(total_ldap / per_page)) if total_ldap else 1
    ldap_users = ldap_users_all[(page_ldap - 1) * per_page : page_ldap * per_page]

    query = db.query(Usuario).filter(
        or_(
            func.coalesce(Usuario.permisos, "") != "",
            Usuario.rol != "usuario",
        )
    )
    total_db = query.count()
    total_pages_db = max(1, ceil(total_db / per_page)) if total_db else 1
    usuarios_db = query.offset((page_activos - 1) * per_page).limit(per_page).all()

    return render_template(
        "usuarios.html",
        ldap_users=ldap_users,
        total_pages=total_pages,
        current_page=page_ldap,
        usuarios_db=usuarios_db,
        total_db=total_db,
        total_pages_activos=total_pages_db,
        current_page_activos=page_activos,
        permisos=db.query(Permiso).all(),
        roles=db.query(Rol).all(),
        usuarios_dict={usuario.username: usuario for usuario in db.query(Usuario).all()},
        notificaciones=get_unread_notifications_count(db, session.get("usuario")),
    )


@app.route("/guardar_usuario", methods=["POST"])
def guardar_usuario():
    db = get_db()
    try:
        print("FORM:", request.form)
        username = request.form.get("username")
        rol = request.form.get("rol")
        permisos = request.form.getlist("permisos[]")

        # usuario logueado
        usuario_actual = session.get("usuario")

        admin_actual = db.query(Usuario)\
            .filter_by(username=usuario_actual)\
            .first()

        if not admin_actual:
            return error_json("Usuario inválido", 403)

        if not username or not rol:
            return error_json("Datos incompletos")
        if username == "admin_root":
            return error_json("No se puede modificar el usuario principal", 403)

        permisos_str = ",".join(permisos) if permisos else ""
        admin = session.get("usuario") or "sistema"
        user = db.query(Usuario).filter_by(username=username).first()

        # ==========================
        # SEGURIDAD DE ROLES
        # ==========================

        # Solo superadmin puede asignar superadmin
        if rol == "superadmin" and admin_actual.rol != "superadmin":
            return error_json("Solo un superadmin puede asignar ese rol", 403)

        # Si el usuario destino ya es superadmin,
        # solo otro superadmin puede modificarlo
        if (
            user
            and user.rol == "superadmin"
            and admin_actual.rol != "superadmin"
        ):
            return error_json("No puedes modificar un superadmin", 403)

        if user:
            user.rol = rol
            user.permisos = permisos_str
            accion = "EDITAR"
            detalle = permisos_str or rol
        else:
            user = Usuario(username=username, rol=rol, permisos=permisos_str)
            db.add(user)
            accion = "CREAR"
            detalle = permisos_str or rol

        db.commit()
        log_auditoria(admin, accion, username, detalle)

        mensaje = f"{admin} modificó a {username}"

        registrar_notificacion(db, mensaje, admin)
        emitir_actividad(mensaje, "usuarios")

        return jsonify({"status": "ok"})
    except Exception as exc:
        return handle_exception("ERROR API PUNTOS", exc, db)


@app.route("/api/usuario/<username>")
def api_usuario(username):
    db = get_db()
    try:
        user = db.query(Usuario).filter_by(username=username).first()
        if not user:
            return jsonify({"rol": "usuario", "permisos": []})
        permisos = lista_permisos(user.permisos)
        return jsonify({"rol": user.rol or "usuario", "permisos": permisos})
    except Exception as exc:
        print("API USUARIO ERROR:", exc)
        return jsonify({"error": True}), 500



@app.route("/reportes", methods=["GET", "POST"])
def reportes():
    db = get_db()
    if "usuario" not in session:
        return redirect("/")
    filtros = get_report_filters(request.values)
    context = build_report_context(db, filtros)
    return render_template("reportes.html", **context, notificaciones=get_unread_notifications_count(db, session.get("usuario")))


@app.route("/exportar_reportes", methods=["GET", "POST"])
def exportar_reportes():
    db = get_db()
    filtros = get_report_filters(request.values)
    context = build_report_context(db, filtros)
    formato = (request.values.get("formato") or "excel").lower()
    if formato == "csv":
        return exportar_reportes_csv(context)
    return exportar_reportes_excel(context)


@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")


@app.route("/eliminar_usuario/<username>", methods=["POST"])
def eliminar_usuario(username):

    db = get_db()

    try:

        # No tocar admin_root
        if username == "admin_root":
            return error_json("No se puede eliminar admin_root", 403)

        admin = session.get("usuario")

        admin_actual = db.query(Usuario)\
            .filter_by(username=admin)\
            .first()

        user = db.query(Usuario)\
            .filter_by(username=username)\
            .first()

        if not user:
            return error_json("Usuario no encontrado", 404)

        # Solo superadmin puede modificar otro superadmin
        if (
            user.rol == "superadmin"
            and admin_actual.rol != "superadmin"
        ):
            return error_json("No puedes eliminar un superadmin", 403)

        # ==========================
        # QUITAR ACCESO
        # ==========================

        user.rol = "usuario"
        user.permisos = ""

        db.commit()

        emitir_actividad(f"{admin} quitó acceso a {username}", "usuarios")

        return jsonify({"status": "ok"})

    except Exception as exc:

        return handle_exception("ERROR API PUNTOS", exc, db)


@app.route("/api/notificaciones")
def api_notificaciones():
    db = get_db()
    try:
        usuario = session.get("usuario")
        user = db.query(Usuario).filter_by(username=usuario).first()
        if not user or user.rol == "usuario":
            return jsonify({"status": "ok", "total": 0, "data": []})

        registros = db.query(Notificacion).filter(
            Notificacion.usuario == usuario,
            Notificacion.leido == 0,
        ).order_by(Notificacion.id.desc()).limit(10).all()

        data = [
            {"id": registro.id, "mensaje": registro.mensaje, "fecha": serialize_datetime(registro.fecha)}
            for registro in registros
        ]
        return jsonify({"status": "ok", "total": len(data), "data": data})
    except Exception as exc:
        print("API NOTIFICACIONES ERROR:", exc)
        return jsonify({"status": "error", "data": []}), 500


@app.route("/api/notificaciones/leer", methods=["POST"])
def leer_notificaciones():
    db = get_db()
    usuario = session.get("usuario")
    if not usuario:
        return jsonify({"status": "error"}), 401
    try:
        db.query(Notificacion).filter(
            Notificacion.usuario == usuario,
            Notificacion.leido == 0,
        ).update({"leido": 1})
        db.commit()
        return jsonify({"status": "ok"})
    except Exception as exc:
        return handle_exception("ERROR API PUNTOS", exc, db)


@app.route("/api/notificaciones/<int:notif_id>/leer", methods=["POST"])
def leer_notificacion(notif_id):
    db = get_db()
    usuario = session.get("usuario")
    try:
        notif = db.query(Notificacion).filter_by(id=notif_id, usuario=usuario).first()
        if notif:
            notif.leido = 1
            db.commit()
        return jsonify({"status": "ok"})
    except Exception as exc:
        return handle_exception("ERROR API PUNTOS", exc, db)


@app.route("/api/notificaciones/clear", methods=["POST"])
def limpiar_notificaciones():
    db = get_db()
    usuario = session.get("usuario")
    try:
        db.query(Notificacion).filter(Notificacion.usuario == usuario).delete()
        db.commit()
        return jsonify({"status": "ok"})
    except Exception as exc:
        return handle_exception("ERROR API PUNTOS", exc, db)


@app.route("/api/usuarios_activos")
def api_usuarios_activos():
    db = get_db()
    try:
        usuarios_con_acceso = db.query(Usuario).filter(
            or_(func.coalesce(Usuario.permisos, "") != "", Usuario.rol != "usuario")
        ).all()
        return jsonify(
            [
                {"username": usuario.username, "rol": usuario.rol or "usuario", "permisos": usuario.permisos or ""}
                for usuario in usuarios_con_acceso
            ]
        )
    except Exception as exc:
        print("API USUARIOS ACTIVOS ERROR:", exc)
        return jsonify([])


@app.route("/api/buscar_ldap")
def api_buscar_ldap():
    q = (request.args.get("q") or "").lower()
    usuarios_ldap = obtener_usuarios_ldap_cache()
    if q:
        usuarios_ldap = [usuario for usuario in usuarios_ldap if q in usuario.lower()]
    return jsonify(usuarios_ldap)


@app.route("/puntos")
def puntos():
    if "usuario" not in session:
        return redirect("/")
    return render_template("puntos.html", notificaciones=get_unread_notifications_count(get_db(), session.get("usuario")))


@app.route("/api/buscar_paciente")
def buscar_paciente():
    
    valor = request.args.get("q", "").strip()
    print("VALOR:", valor)
    if not valor.isdigit():
        return jsonify([])

    try:

        params = {"valor": int(valor)}

        # 1. Buscar por IDCLIENTE y, si no existe, por IDCITA
        row = oracle_client.fetch_one(
            oracle_pool,
            SQL_PACIENTE_POR_IDCLIENTE,
            params
        )

        if not row:
            row = oracle_client.fetch_one(
                oracle_pool,
                SQL_PACIENTE_POR_IDCITA,
                params
            )

        if not row:
            return jsonify([])

        return jsonify([{
            "idcliente": int(row[0]),
            "nombre": f"{row[1]} {row[2]} {row[3]}",
            "saldo": get_oracle_points(int(row[0]))
        }])

    except Exception as exc:
        import traceback

        print("BUSCAR PACIENTE ERROR:")
        traceback.print_exc()

        return jsonify([])

@app.route("/api/puntos", methods=["POST"])
def modificar_puntos():
    db = get_db()
    data = request.json or {}

    try:
        idcliente = data.get("idcliente")
        idcita = data.get("idcita")
        if idcita not in [None, "", "null"]:
            idcita = str(idcita)
        else:
            idcita = None

        tipo = data.get("tipo")

        try:
            cantidad = int(data.get("cantidad"))
        except Exception:
            return error_json("Cantidad invalida")

        if "usuario" not in session:
            return error_json("Sesion expirada", 401)
        if not idcliente or not tipo:
            return error_json("Datos incompletos")
        if cantidad <= 0:
            return error_json("Cantidad invalida")
        if tipo not in {"suma", "resta"}:
            return error_json("Tipo invalido")
        categoria = data.get("categoria", "ajuste")

        # 🔒 solo admin/superadmin pueden quitar reseñas
        usuario_actual = session.get("usuario")

        usuario_db = db.query(Usuario).filter_by(
            username=usuario_actual
        ).first()

        rol_usuario = usuario_db.rol if usuario_db else "usuario"

        if (
            tipo == "resta"
            and categoria == "reseña"
            and rol_usuario not in ["admin", "superadmin"]
        ):
            return error_json(
                "No tienes permisos para retirar puntos de reseña",
                403
            )


        # 💰 Validación saldo
        saldo_actual = get_operational_points(db, idcliente)

        if tipo == "resta" and cantidad > saldo_actual["total"]:
            return jsonify({
                "status": "error",
                "msg": "Saldo insuficiente",
                "saldo_actual": saldo_actual["total"]
            }), 400

        if tipo == "suma" and categoria == "reseña":

            if tiene_resena_oracle(idcliente):

                return error_json("Este paciente ya tiene una reseña aplicada")
        # 💾 Guardar
        nuevo = MovimientoPuntos(
            paciente_id=str(idcliente),
            idcita=idcita,
            tipo=tipo,
            cantidad=cantidad,
            motivo=categoria,
            origen="manual",
            usuario_admin=session.get("usuario")
        )

        try:
            db.add(nuevo)

            if tipo == "suma" and categoria == "reseña":

                insertar_puntos_oracle(
                    idcliente=idcliente,
                    idcita=idcita,
                    cantidad=cantidad
                )
            if tipo == "resta" and categoria == "reseña":

                insertar_cancelacion_resena_oracle(
                    idcliente=idcliente,
                    idcita=idcita,
                    cantidad=cantidad
                )
            db.commit()
            if tipo == "suma" and categoria == "reseña":
                print(
                    f"RESEÑA APLICADA -> cliente={idcliente} cita={idcita}"
                )

            if tipo == "resta" and categoria == "reseña":
                print(
                    f"RESEÑA CANCELADA -> cliente={idcliente} cita={idcita}"
                )
            db.refresh(nuevo)
            # 🔔 crear notificación
            mensaje = (
                f"{session.get('usuario')} agregó {cantidad} puntos"
                if tipo == "suma"
                else f"{session.get('usuario')} retiró {cantidad} puntos"
            )

            registrar_notificacion(db, mensaje, session.get("usuario"))

            # 🔥 socket tiempo real
            emitir_actividad(mensaje, "puntos")

            socketio.emit(
                "nuevo_movimiento",
                {
                    "fecha":
                        datetime.now().strftime("%Y-%m-%d"),

                    "puntos":
                        cantidad,

                    "admin":
                        session.get("usuario"),

                    "tipo":
                        tipo
                }
            )

            socketio.emit(
                "kpi_update",
                {
                    "puntos": calcular_puntos_netos(db),
                    "movimientos": db.query(MovimientoPuntos).count()
                }
            )

        except IntegrityError:
            db.rollback()
            return error_json("Esta cita ya tiene reseña aplicada (bloqueo BD)")

        # 🔄 limpiar cache
        CACHE_PUNTOS.pop(str(idcliente), None)

        saldo_nuevo = get_operational_points(db, idcliente)

        return jsonify({
            "status": "ok",
            "saldo": saldo_nuevo,
            "movimiento": serialize_movimiento(nuevo)
        })
    except Exception as exc:
        return handle_exception("ERROR API PUNTOS", exc, db)


@app.route("/api/historial/<idcliente>")
def historial(idcliente):
    return jsonify(
        obtener_historial_oracle(idcliente)
    )

@app.route("/api/paciente/<idcliente>")
def api_paciente(idcliente):

    db = get_db()

    try:

        historial = obtener_historial_oracle(idcliente)
        saldo = get_operational_points(db, idcliente)

        return jsonify({
            "puntos": saldo["total"],
            "saldo": saldo,
            "historial": historial,
            "tiene_resena": tiene_resena_oracle(idcliente)
        })

    except Exception as exc:

        print("ERROR API PACIENTE:", exc)

        return error_flag_json(exc)

def get_puntos_cache(idcliente):
    return get_oracle_points(idcliente)


@app.route("/api/tiene_resena/<idcliente>")
def api_tiene_resena(idcliente):
    return jsonify({"tiene": tiene_resena(idcliente)})


@app.route("/api/grafica/puntos")
def api_grafica_puntos():
    db = get_db()
    filtros = get_report_filters(request.args)
    context = build_report_context(db, filtros)
    chart = context["chart_puntos_fecha"]
    return jsonify(
        [
            {"dia": chart["labels"][index], "total": chart["valores"][index]}
            for index in range(len(chart["labels"]))
        ]
    )


@app.route("/api/dashboard/kpi")
def api_dashboard_kpi():
    db = get_db()
    filtros = get_report_filters(request.args)
    context = build_report_context(db, filtros)
    return jsonify(
        {
            "total": context["kpis"]["puntos_netos"],
            "hoy": context["kpis"]["movimientos_hoy"],
            "movimientos": context["kpis"]["movimientos_puntos"],
            "auditoria": context["kpis"]["auditoria"],
        }
    )


@app.route("/api/reportes/detalle")
def detalle_reporte():
    db = get_db()
    tipo = (request.args.get("tipo") or "").lower()

    if tipo in {"admin", "usuario", "superadmin"}:
        usuarios = db.query(Usuario).filter(Usuario.rol == tipo).all()
        return jsonify([usuario.username for usuario in usuarios])

    if tipo in {"suma", "resta"}:
        movimientos = db.query(MovimientoPuntos).filter(
            MovimientoPuntos.tipo == tipo
        ).order_by(MovimientoPuntos.fecha.desc()).limit(20).all()
        return jsonify([serialize_movimiento(movimiento) for movimiento in movimientos])

    return jsonify([])

@app.route("/transcripcion")
def transcripcion():
    return render_template("transcripcion.html")

@app.route("/api/transcripcion/estado")
def estado_transcripcion():

    try:

        row = oracle_client.fetch_one(
            oracle_pool,
            SQL_ESTADO_TRANSCRIPCION
        )

        if not row:

            return jsonify({
                "status": "success",
                "modo": None
            })

        return jsonify({
            "status": "success",
            "clave": row[0],
            "modo": row[1],
            "idcita": row[2],
            "fecha_mod": str(row[3]) if row[3] else None,
            "usuario_mod": row[4]
        })

    except Exception as exc:

        print("ERROR ESTADO:", exc)

        return error_json(exc, 500)

@socketio.on("connect")
def socket_connect():

    try:

        username = session.get("usuario")

        if username:

            room = f"user_{username}"

            join_room(room)

            usuarios_online[username] = True

            emit(
                "usuarios_online",
                list(usuarios_online.keys()),
                broadcast=True
            )

    except Exception as e:

        print("SOCKET CONNECT ERROR:", e)

@socketio.on("disconnect")
def socket_disconnect():

    try:

        username = session.get("usuario")

        if username:

            room = f"user_{username}"

            leave_room(room)

            usuarios_online.pop(
                username,
                None
            )

            emit(
                "usuarios_online",
                list(usuarios_online.keys()),
                broadcast=True
            )

    except Exception as e:

        print(
            "SOCKET DISCONNECT ERROR:",
            e
        )


if __name__ == "__main__":
    socketio.run(
    app,
    host="0.0.0.0",
    port=5000,
    debug=False,
    use_reloader=False
)
