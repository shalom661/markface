import pyodbc
import requests
import sys
import math

# Configuration
DB_PATH = r"c:\MARK FACE HUB\PIJAMAS novo.mdb"
API_BASE_URL = "http://localhost:8000/api/v1"
ADMIN_EMAIL = "admin@markface.com"
ADMIN_PASSWORD = "Admin@1234"

def get_auth_token():
    print("Authenticating with API...")
    data = {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    response = requests.post(f"{API_BASE_URL}/auth/login", json=data)
    if response.status_code == 200:
        print("Successfully authenticated.")
        return response.json()["access_token"]
    else:
        print(f"Failed to authenticate: {response.text}")
        sys.exit(1)

def get_db_connection():
    conn_str = f"Driver={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={DB_PATH};"
    return pyodbc.connect(conn_str)

def clean_val(val):
    if val is None:
        return None
    if isinstance(val, float) and math.isnan(val):
        return None
    s = str(val).strip()
    return s if s else None

def import_suppliers(token):
    headers = {"Authorization": f"Bearer {token}"}
    conn = get_db_connection()
    cursor = conn.cursor()
    
    print("Fetching suppliers from the database...")
    cursor.execute("SELECT * FROM [PRODUTOS MP Fornecedores]")
    rows = cursor.fetchall()
    columns = [column[0] for column in cursor.description]
    
    success_count = 0
    error_count = 0
    
    for row in rows:
        row_dict = dict(zip(columns, row))
        
        name = clean_val(row_dict.get('Fornecedor'))
        if not name:
            continue
            
        email = clean_val(row_dict.get('E-MAIL'))
        # basic email validation to avoid pydantic errors
        if email and ('@' not in email or '.' not in email):
            email = None
            
        notes_parts = []
        for key in ['Endereço', 'Cidade', 'Est', 'CEP', 'CNPJ', 'INSC', 'Produto', 'Unidade']:
            val = clean_val(row_dict.get(key))
            if val:
                notes_parts.append(f"{key}: {val}")
        
        payload = {
            "name": name[:100],
            "contact_name": clean_val(row_dict.get('Contato'))[:100] if clean_val(row_dict.get('Contato')) else None,
            "phone": clean_val(row_dict.get('Fone'))[:20] if clean_val(row_dict.get('Fone')) else None,
            "email": email,
            "notes": "\n".join(notes_parts) if notes_parts else None
        }
        
        # POST to API
        resp = requests.post(f"{API_BASE_URL}/suppliers/", json=payload, headers=headers)
        if resp.status_code == 200 or resp.status_code == 201:
            success_count += 1
            print(f"[{success_count}] Created supplier: {name}")
        else:
            error_count += 1
            print(f"Error creating {name}: {resp.status_code} - {resp.text}")
            
    conn.close()
    print(f"\nFinished importing suppliers. Success: {success_count}, Errors: {error_count}")


def get_supplier_map(token):
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{API_BASE_URL}/suppliers/", headers=headers, params={"limit": 1000})
    if resp.status_code != 200:
        print("Failed to get suppliers map")
        return {}
    
    suppliers = resp.json().get("items", [])
    mapping = {}
    for sup in suppliers:
        mapping[sup["name"].lower().strip()] = sup["id"]
    return mapping


def import_raw_materials(token, supplier_map):
    headers = {"Authorization": f"Bearer {token}"}
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Mapping of Table -> (Category Name, Fields rules)
    table_mappings = {
        "PRODUTOS MP Tecidos": {
            "category": "Tecidos",
            "desc_col": "Nome", "unit_col": "Unid", "supplier_col": "Fornec",
            "cat_fields": {"composition": "Composição", "gramatura": "Gramatura", "largura": "Largura", "rendimento_comp": "Comp", "valor_kg": "Valor Pago", "valor_metro": "Valor Metro Tecido"}
        },
        "PRODUTOS MP Botão": {
            "category": "Botões",
            "desc_col": "Nome", "unit_col": "Unid", "supplier_col": "Fornec",
            "cat_fields": {"valor_embalagem": "Valor embal", "qtde_embalagem": "Embal", "valor_unidade": "Botão valor unid"}
        },
        "PRODUTOS MP Renda": {
            "category": "Rendas",
            "desc_col": "Nome", "unit_col": "Unid", "supplier_col": "Fornec",
            "cat_fields": {"valor_embalagem": "Valor embal", "qtde_embalagem": "Embal", "valor_unidade": "Renda valor unid"}
        },
        "PRODUTOS MP Rib": {
            "category": "Ribanas",
            "desc_col": "Nome", "unit_col": "Unid", "supplier_col": "Fornec",
            "cat_fields": {"gramatura": "Gramatura", "valor_kg": "Rib valor unid", "largura": "Largura", "rendimento_comp": "Comp", "valor_metro": "Valor Metro"}
        },
        "PRODUTOS MP Zippers": {
            "category": "Zíperes",
            "desc_col": "Nome", "unit_col": "Unid", "supplier_col": "Fornec",
            "cat_fields": {"valor_unidade": "Zipper valor unid"}
        },
        "PRODUTOS MP Elástico": {
            "category": "Elásticos",
            "desc_col": "Nome", "unit_col": "Unid", "supplier_col": "Fornec",
            "cat_fields": {"valor_embalagem": "Valor embal", "qtde_embalagem": "embalagem", "valor_unidade": "Elástico valor unid"}
        },
        "PRODUTOS MP Etiquetas": {
            "category": "Etiquetas",
            "desc_col": "Nome", "unit_col": "Unid", "supplier_col": "Fornec",
            "cat_fields": {"valor_unidade": "Etiq valor unid"}
        },
        "PRODUTOS MP Embalagem": {
            "category": "Embalagens",
            "desc_col": "Nome", "unit_col": "Unid", "supplier_col": "Fornec",
            "cat_fields": {"valor_embalagem": "Valor embal", "qtde_embalagem": "embalagem", "valor_unidade": "Embalagem valor unid"}
        }
    }
    
    total_success = 0
    total_errors = 0
    
    for table, conf in table_mappings.items():
        print(f"\nProcessing table: {table}")
        try:
            cursor.execute(f"SELECT * FROM [{table}]")
            rows = cursor.fetchall()
            columns = [column[0] for column in cursor.description]
            
            for row in rows:
                row_dict = dict(zip(columns, row))
                desc = clean_val(row_dict.get(conf["desc_col"]))
                if not desc:
                    continue
                    
                unit = clean_val(row_dict.get(conf["unit_col"])) or "UND"
                sup_name = clean_val(row_dict.get(conf["supplier_col"]))
                
                supplier_id = None
                if sup_name and sup_name.lower().strip() in supplier_map:
                    supplier_id = supplier_map[sup_name.lower().strip()]
                
                cat_fields_data = {}
                for json_key, db_col in conf["cat_fields"].items():
                    val = clean_val(row_dict.get(db_col))
                    if val is not None:
                        # Try cast to float if applicable
                        if isinstance(val, str) and ',' in val and '.' not in val:
                            try:
                                val = float(val.replace(',', '.'))
                            except ValueError:
                                pass
                        elif isinstance(val, (int, float)):
                            pass
                        cat_fields_data[json_key] = val
                
                raw_code = clean_val(row_dict.get("Código")) or clean_val(row_dict.get("Cód"))
                internal_code = f"{conf['category'][:3].upper()}-{raw_code}" if raw_code else None
                
                payload = {
                    "description": desc,
                    "internal_code": internal_code,
                    "category": conf["category"],
                    "unit": unit,
                    "category_fields": cat_fields_data,
                    "supplier_id": supplier_id,
                    "active": True
                }
                
                resp = requests.post(f"{API_BASE_URL}/raw-materials/", json=payload, headers=headers)
                if resp.status_code == 200 or resp.status_code == 201:
                    total_success += 1
                else:
                    total_errors += 1
                    print(f"Error creating {desc}: {resp.status_code} - {resp.text}")
                    
        except pyodbc.Error as e:
            print(f"Error executing sql for {table}: {e}")
            
    conn.close()
    print(f"\nFinished importing Raw Materials. Success: {total_success}, Errors: {total_errors}")


if __name__ == "__main__":
    token = get_auth_token()
    # import_suppliers(token) # Already done
    supplier_map = get_supplier_map(token)
    import_raw_materials(token, supplier_map)
