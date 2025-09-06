# schemas.py

from pydantic import BaseModel
from uuid import UUID
from datetime import datetime # Importe o datetime

# ... (a sua classe AssetCreate continua aqui)
class AssetCreate(BaseModel):
    name: str
    latitude: float
    longitude: float

# --- ADICIONE ESTA NOVA CLASSE ---
# Este é o "molde" para um ativo que já existe no banco de dados
class Asset(BaseModel):
    asset_uuid: UUID
    name: str
    latitude: float
    longitude: float
    elevation_m: float
    # created_at foi removido

    class Config:
        orm_mode = True