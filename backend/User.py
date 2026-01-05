from database import Base
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, Integer, String, ForeignKey, BigInteger, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.orm import DeclarativeBase
import datetime

import uuid

class Base(DeclarativeBase):
    pass

class User(Base):
    __abstract__= True

class Paciente(DeclarativeBase):
    __tablename__ = "paciente"
    id = Column("user_id",UUID(as_uuid=True), primary_key=True),
    fname = Column("first_name", String(20), nullable=False)
    lname = Column("last_name", String(20), nullable=False)
    password = Column("password", String, nullable=False)
    email = Column("email", String, nullable=False, unique=True)
    phone = Column("phone", String(30), nullable = False)
    cpf = Column("cpf", String(13), nullable=False, unique=True)
    
    __mapped_args__ = {
        'polymorphic_identity' : 'patient',
        'polymorphic_on': 'type'
    }


class Admin(DeclarativeBase):
    __tablename__ = "admin"
    id = Column("user_id",UUID(as_uuid=True), primary_key=True),
    fname = Column("first_name", String(20), nullable=False)
    lname = Column("last_name", String(20), nullable=False)
    password = Column("password", String, nullable=False)
    email = Column("email", String, nullable=False, unique=True)
    phone = Column("phone", String(30), nullable = False)
    cpf = Column("cpf", String(13), nullable=False, unique=True)
    
    __mapped_args__ = {
        'polymorphic_identity' : 'admin',
        'polymorphic_on': 'type'
    }

class Profissional(Base): 
    __tablename__ = "profissional_de_saude"
    id = Column("user_id",UUID(as_uuid=True), primary_key=True),
    fname = Column("first_name", String(20), nullable=False)
    lname = Column("last_name", String(20), nullable=False)
    password = Column("password", String, nullable=False)
    email = Column("email", String, nullable=False, unique=True)
    phone = Column("phone", String(30), nullable = False)
    cpf = Column("cpf", String(13), nullable=False, unique=True)
    
    __mapped_args__ = {
        'polymorphic_identity' : 'healthcare_prof',
        'polymorphic_on': 'type'
    }

class HealthcareUnit(): 
    __tablename__ = "unidade_de_saude"
    nome_unidade = Column("nome_unidade", String, primary_key=True)
    tipo = Column("tipo", String(30))
    rua = Column("rua", String(40))
    bairo = Column("bairro", String(30))
    cidade = Column("cidade", String(30))
    numero = Column("numero", Integer)

class Application(): 
    __tablename__ = "aplicacao"
    id = Column("id_aplicação", BigInteger, primary_key=True, autoincrement=True)
    data = Column("data", DateTime, default=datetime.datetime.now)
    paciente: Mapped["Paciente"] = mapped_column(ForeignKey("paciente.id"))
    profissional: Mapped["Profissional"] = mapped_column(ForeignKey("profissional_de_saude.id"))

class Vacina():
    __tablename__ = "vacina"
    id = Column("codigo_vacina", Integer, primary_key=True, autoincrement=True)
    nome = Column("nome", String(30))
    publico = Column("publico_alvo", String(40))
    doenca = Column("doenca", String(50))
    quantidadeDoses = Column("quantidade_de_doses", Integer)
    
class Fabricante():
    __tablename__ = "fabricante"
    cnpj = Column("cnpj", String(14), primary_key=True)
    nome = Column("nome", String(40))

