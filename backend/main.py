from fastapi import FastAPI
import model
from database import engine 
from routes import users, ubs
from fastapi.middleware.cors import CORSMiddleware
from database import Base

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # para produção, use apenas seus domínios autorizados
    allow_credentials=True,
    allow_methods=["*"],  # Permite GET, POST, PUT, DELETE, OPTIONS etc
    allow_headers=["*"],  # Permite qualquer header
)

@app.get("/")
def teste():
    return {"bora pro racha hoje à noite?"}

app.include_router(users.router)
app.include_router(ubs.router)