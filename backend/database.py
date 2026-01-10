from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "postgresql://postgres:yasmip10@localhost:5432/projkaua"

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False)
Base = declarative_base()

def init_db():
    with engine.connect() as connection:
        
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm;"))
        connection.commit() 

# Chame essa função antes de criar as tabelas ou iniciar o app
init_db()