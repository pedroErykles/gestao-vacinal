from fastapi import FastAPI
import model
from database import engine 
from routes import users, ubs, vacinas, campanhas, aplicacoes, dashboard, graficos
from fastapi.middleware.cors import CORSMiddleware
from database import Base

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],  
)

app.include_router(users.router)
app.include_router(ubs.router)
app.include_router(vacinas.router)
app.include_router(campanhas.router)
app.include_router(aplicacoes.router)
app.include_router(dashboard.router)
app.include_router(graficos.router)