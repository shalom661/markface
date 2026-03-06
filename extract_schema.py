import json
import pyodbc

conn_str = r"Driver={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=c:\MARK FACE HUB\PIJAMAS novo.mdb;"
try:
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    tables = [t.table_name for t in cursor.tables(tableType='TABLE')]
    
    # Let's find tables that might be related to materials, products or suppliers
    target_tables = []
    for t in tables:
        t_upper = t.upper()
        if 'MAT' in t_upper or 'FORN' in t_upper or 'PROD' in t_upper or 'ESTOQ' in t_upper or 'COMPRA' in t_upper:
            target_tables.append(t)
            
    print(f"Found related tables: {target_tables}")
    
    schema = {}
    for t in target_tables:
        columns = [c.column_name for c in cursor.columns(table=t)]
        schema[t] = columns
        
    with open('target_schema.json', 'w', encoding='utf-8') as f:
        json.dump(schema, f, indent=2, ensure_ascii=False)
        
    print("Saved to target_schema.json")
    
except Exception as e:
    print(f"Error: {e}")
