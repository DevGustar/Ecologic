# --- database.py ---
# Responsável por toda a configuração e gestão da ligação com a base de dados SQLite.

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# --- 1. CONFIGURAÇÃO DA LIGAÇÃO ---
# Esta é a "morada" do nosso ficheiro de base de dados.
# O 'sqlite:///./ecologic.db' significa: "use o SQLite e crie um ficheiro chamado ecologic.db
# no mesmo diretório (./) em que a aplicação está a rodar".
DATABASE_URL = "sqlite:///./ecologic.db"

# --- 2. CRIAÇÃO DO "MOTOR" ---
# O "motor" é o ponto central de comunicação da SQLAlchemy com a base de dados.
# O 'connect_args' é uma necessidade específica do SQLite com FastAPI para permitir
# que múltiplos pedidos usem a mesma ligação de forma segura.
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

# --- 3. CRIAÇÃO DA "SESSÃO" ---
# A sessão é a nossa "conversa" com a base de dados. Cada vez que quisermos
# fazer uma operação (criar, ler, apagar), abriremos uma sessão.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- 4. A BASE DOS NOSSOS MODELOS ---
# Esta é uma classe "mágica" da qual todos os nossos modelos de tabelas (como a de ativos)
# irão herdar para terem os poderes da SQLAlchemy.
Base = declarative_base()