import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import mysql.connector
from security.auth import hash_password

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="sistema_puntos_v5"
)

cursor = conn.cursor()

password = hash_password("holi").decode()

cursor.execute(
    "UPDATE administradores SET password=%s WHERE usuario=%s",
    (password, "admin")
)

conn.commit()

print("Filas modificadas:", cursor.rowcount)

conn.close()