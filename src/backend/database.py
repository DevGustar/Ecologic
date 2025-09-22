# Ecologic/src/backend/database.py (VERSÃO CORRIGIDA FINAL PARA O CAMINHO DO DB)

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os # Importar o módulo os

# Obter o caminho absoluto para o diretório atual (onde database.py está)
# Isso resultará em algo como C:\Users\ander\OneDrive\Documentos\GitHub\Ecologic\src\backend
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Construir o caminho completo para o arquivo ecologic.db
# O arquivo DB será criado DENTRO da pasta src/backend
# Ex: C:\Users\ander\OneDrive\Documentos\GitHub\Ecologic\src\backend\ecologic.db
SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'ecologic.db')}"

# O motor de base de dados que o SQLAlchemy irá usar
# 'connect_args' é necessário para SQLite com múltiplos threads (Uvicorn usa)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Uma 'SessionLocal' é a nossa "sessão de base de dados".
# Cada pedido da API irá obter a sua própria sessão, que será fechada após o pedido.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 'Base' é usada para criar os modelos da base de dados (em models.py)
Base = declarative_base()