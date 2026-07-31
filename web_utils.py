# ============================================================
# UTILIDADES COMPARTIDAS PARA LAS VISTAS Y APIS
# ============================================================

from datetime import datetime, timedelta

from flask import jsonify


def serialize_datetime(value):
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M:%S")
    if value is None:
        return ""
    return str(value)


def serialize_dia(value):
    """Devuelve solo la parte de fecha (YYYY-MM-DD) de un datetime."""
    return serialize_datetime(value).split(" ")[0]


def parse_date_param(value, end_of_day=False):
    if not value:
        return None
    try:
        parsed = datetime.strptime(value, "%Y-%m-%d")
        if end_of_day:
            return parsed + timedelta(days=1) - timedelta(seconds=1)
        return parsed
    except ValueError:
        return None


def counter_to_chart(contador):
    """Convierte un Counter en el formato {labels, valores} usado por Chart.js."""
    return {
        "labels": list(contador.keys()),
        "valores": [int(valor) for valor in contador.values()],
    }


def error_json(mensaje, status=400):
    return jsonify({"status": "error", "msg": str(mensaje)}), status


def error_flag_json(mensaje, status=500):
    return jsonify({"error": True, "msg": str(mensaje)}), status


def handle_exception(prefijo, exc, db=None, status=500):
    """Registra la excepción, revierte la transacción y responde en JSON."""
    if db is not None:
        db.rollback()

    print(f"{prefijo}:", exc)

    return error_json(exc, status)
