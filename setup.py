import os
import mysql.connector
from getpass import getpass
import bcrypt

# --- Instalar dependencias ---
print("Instalando dependencias...")
os.system("pip install -r requirements.txt")

# --- Solicitar credenciales MySQL ---
print("\nConfigura tu base de datos MySQL")
db_user = input("Usuario MySQL (ej: root): ")
db_password = getpass("Contraseña MySQL: ")

# --- Crear base de datos y tablas ---
try:
    conn = mysql.connector.connect(
        host="localhost",
        user=db_user,
        password=db_password
    )
    cursor = conn.cursor()
    cursor.execute("CREATE DATABASE IF NOT EXISTS sistema_puntos_v5")
    cursor.execute("USE sistema_puntos_v5")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS administradores(
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario VARCHAR(50),
        password VARCHAR(255),
        rol_id INT,
        twofa_secret VARCHAR(255),
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS usuarios(
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100),
        telefono VARCHAR(20),
        email VARCHAR(100),
        puntos_totales INT DEFAULT 0,
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transacciones_puntos(
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT,
        puntos INT,
        tipo VARCHAR(20),
        cita VARCHAR(50),
        admin_id INT,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.commit()
    print("\nBase de datos y tablas creadas correctamente ✅")
except mysql.connector.Error as e:
    print("Error al conectar con MySQL:", e)
    exit()

# --- Crear administrador inicial ---
admin_user = input("\nCrea un usuario administrador: ")
admin_pass = getpass("Contraseña administrador: ")
hashed_pass = bcrypt.hashpw(admin_pass.encode(), bcrypt.gensalt()).decode()
cursor.execute("INSERT INTO administradores (usuario,password,rol_id) VALUES (%s,%s,%s)",
               (admin_user, hashed_pass, 1))
conn.commit()
conn.close()
print("Administrador creado correctamente ✅")

# --- Crear archivo config.py ---
config_content = f"""
DB_HOST = 'localhost'
DB_USER = '{db_user}'
DB_PASSWORD = '{db_password}'
DB_NAME = 'sistema_puntos_v5'
SECRET_KEY = 'clave_super_secreta'
"""
with open("config.py","w") as f:
    f.write(config_content)
print("Archivo config.py generado ✅")

# --- Ejecutar servidor Flask ---
print("\nIniciando servidor Flask en http://127.0.0.1:5000 ...")
os.system("python app.py")