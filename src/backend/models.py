# Define a estrutura das tabelas na nossa base de dados

from sqlalchemy import Column, Integer, String, Float
from .database import Base 

# criando uma classe para representar a tabela que vai ser transformada em SQL através do Base
class Asset(Base):  
    # __tablename__ é o nome oficial que a nossa tabela terá no banco de dados
    __tablename__ = "assets"

    # ---------- aqui será definido as colunas ----------

    id = Column(Integer, primary_key=True, index=True)
    # inteiro, chave primaria e indexada

    asset_uuid = Column(String, unique=True, index=True)
    # uuid é o que geramos na criação, unique garantindo que seja um valor unico

    name = Column(String, index=True)
    # nome do ativo que passamos na criação "Galpão SP"

    latitude = Column(Float)
    longitude = Column(Float)
    elevation_m = Column(Float)
    # vão ser guardados em valores decimais
    