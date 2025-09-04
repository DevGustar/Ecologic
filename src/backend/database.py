from sqlalchemy import create_engine # cria comunicação entre app e db - e o dialeto para sqlite
from sqlalchemy.ext.declarative import declarative_base # permite criar tabelas em python e depois ela converte em SQL
from sqlalchemy.orm import sessionmaker # cria sessões para executar comandos no banco de dados

# Comando para usar o sqlite e criar o ecologic.db no mesmo ficheiro do backend
DATABASE_URL = "sqlite:///./ecologic.db"

# cria a engine e arruma o dialeto para o SQL
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
    # check_same_thread permite que outros "trabalhadores" mexam no db
    # necessario para performar bem com o FastAPI já que ele usa multiplos threads para lidar com tarefas
)

# A sessão é a "conversa" com a base de dados. Cada vez que quisermos
# fazer uma operação (criar, ler, apagar), abriremos uma sessão.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    # bind=engine -> é o que liga a engine á todas as 'conversas' com o db
    # autocommit=false -> cria uma medida de segurança para não commitar qualquer alteração
    # autoflush=false -> parametro de performance, impede que alterações sejam enviadas antes do commit

# Constrói e devolve uma classe base para nós, usada para moldar os comandos do models.py
# para uma base de dados sql
Base = declarative_base()