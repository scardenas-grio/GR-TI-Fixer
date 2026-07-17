import sqlite3
from security.auth import hash_password
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_DIR = os.path.join(BASE_DIR, "database")
DB_PATH = os.path.join(DB_DIR, "sistema.db")

# Crear carpeta database si no existe
if not os.path.exists(DB_DIR):
    os.makedirs(DB_DIR)

# Crear base de datos
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Crear tabla usuarios
cursor.execute("""
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT UNIQUE,
    password BLOB
)
""")

# Crear tabla administradores
cursor.execute("""
CREATE TABLE IF NOT EXISTS administradores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT UNIQUE,
    rol TEXT DEFAULT 'Super',
    password BLOB
)
""")

# Generar hash del admin
admin_pass = hash_password("admin123")

# Insertar admin en usuarios y administradores
cursor.execute(
    "INSERT OR IGNORE INTO usuarios (usuario, password) VALUES (?, ?)",
    ("admin", admin_pass)
)
cursor.execute(
    "INSERT OR IGNORE INTO administradores (usuario, password) VALUES (?, ?)",
    ("admin", admin_pass)
)

conn.commit()
conn.close()

print("Base de datos creada correctamente con admin en usuarios y administradores")