# schemas.py
from pydantic import BaseModel

# Este é o "molde" do pacote JSON que o frontend vai enviar
class AssetCreate(BaseModel):
    name: str
    latitude: float
    longitude: float