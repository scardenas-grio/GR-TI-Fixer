<p align="center">
  <img src="./static/image/TI-Fixer-login.png" width="180">
</p>

<h1 align="center">TI-Fixer</h1>

<p align="center">
  <strong>Sistema de Administración de TI</strong>
</p>

<p align="center">
  <em>Centralizando la gestión de TI en una sola plataforma.</em>
</p>

---

![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)
![Flask](https://img.shields.io/badge/Flask-3.x-black?logo=flask)
![Oracle](https://img.shields.io/badge/Oracle-Database-red?logo=oracle)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker)
![Git](https://img.shields.io/badge/Git-Version_Control-F05032?logo=git)
![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?logo=github)
---

## 📑 Contenido

- [✨ Funcionalidades](#-funcionalidades)
- [🛠️ Stack Tecnológico](#️-stack-tecnológico)
- [📋 Requisitos](#-requisitos)
- [📁 Estructura del Proyecto](#-estructura-del-proyecto)
- [🚀 Instalación](#-instalación)
- [⚙️ Configuración](#️-configuración)
- [📅 Próximas versiones](#-próximas-versiones)
- [👨‍💻 Autor](#-autor)

---

## ✨ Funcionalidades

- Dashboard interactivo.
- Administración de usuarios.
- Gestión de puntos.
- Reportes dinámicos.
- Auditoría de movimientos.
- Integración con Oracle.
- Control de acceso mediante roles.
- Interfaz con modo claro y oscuro.
- Despliegue mediante Docker.

---

## 🛠️ Stack Tecnológico

### Backend

- Python
- Flask
- SQLAlchemy

### Frontend

- HTML5
- CSS3
- JavaScript
- Chart.js

### Base de Datos

- Oracle
- SQLite (Desarrollo)

### Infraestructura

- Docker
- Git
- GitHub

---

## 📋 Requisitos

Antes de ejecutar el proyecto es necesario contar con:

- Python 3.12 o superior.
- Oracle Instant Client.
- Git.
- Docker (Opcional).

---

## 📁 Estructura del Proyecto

```text
TI-Fixer/
├── app.py
├── static/
│   ├── css/
│   ├── js/
│   └── img/
├── templates/
├── security/
├── scripts/
├── requirements.txt
├── Dockerfile
└── README.md
```

### Descripción

| Carpeta | Descripción |
|---------|-------------|
| static | Recursos estáticos (CSS, JavaScript, imágenes). |
| templates | Plantillas HTML utilizadas por Flask. |
| security | Funciones relacionadas con autenticación y seguridad. |
| scripts | Scripts auxiliares para mantenimiento o despliegue. |
| app.py | Punto de entrada principal de la aplicación. |

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/USUARIO/TI-Fixer.git
cd TI-Fixer
```

### 2. Crear un entorno virtual

```bash
python -m venv .venv
```

### 3. Activar el entorno virtual

#### Windows

```bash
.venv\Scripts\activate
```

#### Linux / macOS

```bash
source .venv/bin/activate
```

### 4. Instalar las dependencias

```bash
pip install -r requirements.txt
```

### 5. Configurar el archivo `.env`

Crear un archivo `.env` en la raíz del proyecto y completar las variables de entorno necesarias.

### 6. Ejecutar la aplicación

```bash
python app.py
```

---

## 📷 Capturas

Próximamente...

---

## 🚀 Evolución del proyecto

### Versión 1.0

- Dashboard
- Gestión de usuarios
- Gestión de puntos
- Reportes
- Auditoría
- Integración con Oracle
- Docker

---

## 📌 Versión actual

**v1.0.0**

Primera versión estable de TI-Fixer.

---

## 👨‍💻 Autor

Desarrollado por **Grupo RIO**

**TI-Fixer v1.0.0**