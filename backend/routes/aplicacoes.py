from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
import schemas 
import model 

router = APIRouter(
    prefix="/aplicacoes",
    tags=["Aplicacoes"]
)

def get_db():
    db = SessionLocal()
    try: 
        yield db
    finally:
        db.close()

