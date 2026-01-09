from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend import model
from backend.database import engine, Base
from backend.routes import users, ubs

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # para produção, use apenas seus domínios autorizados
    allow_credentials=True,
    allow_methods=["*"],  # Permite GET, POST, PUT, DELETE, OPTIONS etc
    allow_headers=["*"],  # Permite qualquer header
)

app.include_router(users.router)
app.include_router(ubs.router)