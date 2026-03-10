import os
import subprocess
import sys
from dotenv import load_dotenv

def run_migrations():
    print("Preparando migracoes para o Supabase...")
    
    # Load environment variables from backend/.env
    dotenv_path = os.path.join("backend", ".env")
    if os.path.exists(dotenv_path):
        load_dotenv(dotenv_path)
        print(f"Variaveis carregadas de {dotenv_path}")
    else:
        print(f"Erro: Arquivo {dotenv_path} não encontrado.")
        return

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Erro: DATABASE_URL não encontrada no .env")
        return

    print(f"Conectando ao banco de dados...")
    
    try:
        # Run alembic upgrade head from the backend directory
        # Using python -m alembic is more reliable on Windows
        result = subprocess.run(
            ["python", "-m", "alembic", "upgrade", "head"],
            cwd="backend",
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("Migracoes aplicadas com sucesso!")
            print(result.stdout)
        else:
            print("Erro ao aplicar migracoes:")
            print(result.stderr)
            print(result.stdout)
            
    except Exception as e:
        print(f"Ocorreu um erro inesperado: {e}")

if __name__ == "__main__":
    run_migrations()
