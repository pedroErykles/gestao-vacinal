from fastapi import FastAPI
import model
from database import engine 
from routes import users

app = FastAPI()

app.include_router(users.router)