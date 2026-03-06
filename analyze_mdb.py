import json
import sqlite3
import pyodbc 
from pathlib import Path

# Provide standard connection string for Access
def get_tables(db_path):
    # Depending on windows version, the driver name might vary. 
    # Usually "Microsoft Access Driver (*.mdb, *.accdb)" for 64-bit/32-bit.
    try:
        conn_str = f"Driver={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={db_path};"
        print(f"Connecting to: {conn_str}")
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        
        tables = []
        for table_info in cursor.tables(tableType='TABLE'):
            tables.append(table_info.table_name)
            
        print(json.dumps({"tables": tables}))
        
        # for each table, get columns
        schema = {}
        for table in tables:
            columns = []
            for row in cursor.columns(table=table):
                columns.append({
                    "name": row.column_name,
                    "type": row.type_name,
                    "size": row.column_size
                })
            schema[table] = columns
            
        print("\nSCHEMA:")
        print(json.dumps(schema, indent=2))
        
        # sample data
        print("\nSAMPLE DATA (top 3):")
        for table in tables[:3]:
            try:
                cursor.execute(f"SELECT TOP 3 * FROM [{table}]")
                rows = cursor.fetchall()
                print(f"Table: {table}")
                for r in rows:
                    print(list(r))
            except Exception as e:
                print(f"Error reading {table}: {e}")
                
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

get_tables(r"c:\MARK FACE HUB\PIJAMAS novo.mdb")
