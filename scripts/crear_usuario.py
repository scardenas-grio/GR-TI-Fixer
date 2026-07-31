import os
import sys
from getpass import getpass

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import mysql.connector

from config import DB_HOST, DB_NAME, DB_PASSWORD, DB_USER
from security.auth import hash_password

conn = mysql.connector.connect(
    host=DB_HOST,
    user=DB_USER,
    password=DB_PASSWORD,
    database=DB_NAME
)

cursor = conn.cursor()

usuario = input("Usuario a actualizar: ").strip()
password = hash_password(getpass("Nueva contraseña: ")).decode()

cursor.execute(
    "UPDATE administradores SET password=%s WHERE usuario=%s",
    (password, usuario)
)

conn.commit()

print("Filas modificadas:", cursor.rowcount)

conn.close()
