import pandas as pd
from database import get_connection

def exportar_historial():
    conn = get_connection()
    df = pd.read_sql("SELECT * FROM transacciones_puntos", conn)
    df.to_excel("historial.xlsx", index=False)