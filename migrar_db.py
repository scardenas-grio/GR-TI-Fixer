import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from urllib.parse import quote_plus
from dotenv import load_dotenv

# 🔥 carga variables
load_dotenv()

# =========================
# MYSQL
# =========================
MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
MYSQL_HOST = os.getenv("MYSQL_HOST")
MYSQL_DB = os.getenv("MYSQL_DB")

# =========================
# POSTGRES
# =========================
PG_USER = os.getenv("DB_USER")
PG_PASSWORD = quote_plus(os.getenv("DB_PASSWORD"))
PG_HOST = os.getenv("DB_HOST")
PG_DB = os.getenv("DB_NAME")

# =========================
# CONEXIONES
# =========================
mysql_engine = create_engine(
    f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}/{MYSQL_DB}"
)

pg_engine = create_engine(
    f"postgresql+psycopg2://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:5432/{PG_DB}"
)

SessionMySQL = sessionmaker(bind=mysql_engine)
SessionPG = sessionmaker(bind=pg_engine)

mysql = SessionMySQL()
pg = SessionPG()

# =========================
# IMPORTA TUS MODELOS
# =========================
from app import Usuario, Permiso, Rol, Auditoria, Notificacion

print("🚀 Iniciando migración...")

# =========================
# USUARIOS
# =========================
usuarios = mysql.query(Usuario).all()
for u in usuarios:
    pg.merge(Usuario(
        id=u.id,
        username=u.username,
        rol=u.rol,
        permisos=u.permisos
    ))
print(f"✔ Usuarios: {len(usuarios)}")

# =========================
# ROLES
# =========================
roles = mysql.query(Rol).all()
for r in roles:
    pg.merge(Rol(
        id=r.id,
        nombre=r.nombre,
        permisos=r.permisos
    ))
print(f"✔ Roles: {len(roles)}")

# =========================
# PERMISOS
# =========================
permisos = mysql.query(Permiso).all()
for p in permisos:
    pg.merge(Permiso(
        id=p.id,
        nombre=p.nombre
    ))
print(f"✔ Permisos: {len(permisos)}")

# =========================
# AUDITORIA
# =========================
auditoria = mysql.query(Auditoria).all()
for a in auditoria:
    pg.merge(Auditoria(
        id=a.id,
        usuario_admin=a.usuario_admin,
        accion=a.accion,
        usuario_afectado=a.usuario_afectado,
        detalle=a.detalle,
        fecha=a.fecha
    ))
print(f"✔ Auditoria: {len(auditoria)}")

# =========================
# NOTIFICACIONES
# =========================
notifs = mysql.query(Notificacion).all()
for n in notifs:
    pg.merge(Notificacion(
        id=n.id,
        mensaje=n.mensaje,
        usuario=n.usuario,
        leido=n.leido,
        fecha=n.fecha
    ))
print(f"✔ Notificaciones: {len(notifs)}")

# =========================
# COMMIT FINAL
# =========================
pg.commit()

print("🎉 Migración completada con éxito")