import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
import mysql.connector
from security.auth import hash_password

load_dotenv()

conn = mysql.connector.connect(
    host=os.getenv("DB_HOST", "localhost"),
    user=os.getenv("DB_USER", "root"),
    password=os.getenv("DB_PASSWORD", ""),
    database=os.getenv("DB_NAME", "sistema_puntos_v5")
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