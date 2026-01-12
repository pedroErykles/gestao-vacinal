import enum
import uuid
import datetime
from typing import List

from database import Base

from sqlalchemy import Index, String, Integer, BigInteger, ForeignKey, DateTime, Enum, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

# Definimos os papeis possíveis
class RoleEnum(enum.Enum):
    ADMIN = "ADMIN"
    GESTOR = "GESTOR"
    PACIENTE = "PACIENTE"
    PROFISSIONAL = "PROFISSIONAL"

# Tabela Pai
class Usuario(Base):
    __tablename__ = "usuario"

    __table_args__ = (
        # Cria um índice para busca rápida na concatenação dos nomes
        Index(
            'idx_usuario_nome_completo_trgm',
            text("(pnome || ' ' || unome) gin_trgm_ops"),
            postgresql_using='gin'
        ),
    )
    
    id: Mapped[uuid.UUID] = mapped_column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    pnome: Mapped[str] = mapped_column(String(20), nullable=False)
    unome: Mapped[str] = mapped_column(String(20), nullable=False)
    senha: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    telefone: Mapped[str] = mapped_column(String(30), nullable=False)
    cpf_usuario: Mapped[str] = mapped_column(String(13), nullable=False, unique=True)
    
    role: Mapped[RoleEnum] = mapped_column(Enum(RoleEnum), nullable=False)

    __mapper_args__ = {
        "polymorphic_on": "role",
    }

# Tabelas Filhas 
class Paciente(Usuario):
    __tablename__ = "paciente"
    id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuario.id"), primary_key=True)

    aplicacoes: Mapped[List["Aplicacao"]] = relationship(back_populates="paciente")

    __mapper_args__ = {
        "polymorphic_identity": RoleEnum.PACIENTE,
    }

class Gestor(Usuario):
    __tablename__ = "gestor"
    id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuario.id"), primary_key=True)

    __mapper_args__ = {
        "polymorphic_identity": RoleEnum.GESTOR,
    }

class Admin(Usuario):
    __tablename__ = "admin"
    id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuario.id"), primary_key=True)

    __mapper_args__ = {
        "polymorphic_identity": RoleEnum.ADMIN,
    }

class Profissional(Usuario): 
    __tablename__ = "profissional_de_saude"
    id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuario.id"), primary_key=True)
    
    grau_formacao: Mapped[str] = mapped_column(String(20), nullable=False)

    __mapper_args__ = {
        "polymorphic_identity": RoleEnum.PROFISSIONAL,
    }

# Entidades Básicas
class Fabricante(Base):
    __tablename__ = "fabricante"
    cnpj_fabricante: Mapped[str] = mapped_column("cnpj_fabricante", String(14), primary_key=True)
    nome: Mapped[str] = mapped_column(String(40), nullable=False)
    telefone: Mapped[str] = mapped_column(String(20), nullable=False)

class Fornecedor(Base):
    __tablename__ = "fornecedor"
    cnpj_fornecedor: Mapped[str] = mapped_column("cnpj_fornecedor", String(14), primary_key=True)
    nome: Mapped[str] = mapped_column(String(40), nullable=False)
    telefone: Mapped[str] = mapped_column(String(20), nullable=False)

class UnidadeDeSaude(Base): 
    __tablename__ = "unidade_de_saude"

    id: Mapped[uuid.UUID] = mapped_column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    nome_unidade: Mapped[str] = mapped_column("nome_unidade", String, unique=True)
    tipo: Mapped[str] = mapped_column(String(100), nullable=False)
    rua: Mapped[str] = mapped_column(String(40), nullable=False)
    bairro: Mapped[str] = mapped_column(String(30), nullable=False)
    cidade: Mapped[str] = mapped_column(String(30), nullable=False)
    estado: Mapped[str] = mapped_column(String(30), nullable=False)
    numero: Mapped[int] = mapped_column(Integer, nullable=True)

    __table_args__ = (

        Index(
            "idx_nome_unidade",
            text("nome_unidade gin_trgm_ops"),
            postgresql_using='gin'
        ),
    )

class Vacina(Base):
    __tablename__ = "vacina"
    codigo_vacina: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(30), nullable=False)
    publico_alvo: Mapped[str] = mapped_column("publico_alvo", String(40), nullable=False)
    doenca: Mapped[str] = mapped_column(String(50), nullable=False)
    quantidade_doses: Mapped[int] = mapped_column("quantidade_de_doses", Integer, nullable=False)

    __table_args__ = (
        Index(
            "idx_nome_vacina",
            text("nome gin_trgm_ops"),
            postgresql_using='gin'
        ),

        Index(
            "idx_vacina_doenca_trgm",
            text("doenca gin_trgm_ops"),
            postgresql_using='gin'
        )
    )
    
    fabricante_cnpj: Mapped[str] = mapped_column(ForeignKey("fabricante.cnpj_fabricante"))
    fabricante: Mapped["Fabricante"] = relationship()

# Logística
class Estoque(Base): 
    __tablename__ = "estoque"
    id_estoque: Mapped[int] = mapped_column("id_estoque", Integer, primary_key=True, autoincrement=True)
    
    gestor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("gestor.id"))
    gestor: Mapped["Gestor"] = relationship()

    nome_unidade: Mapped[str] = mapped_column(ForeignKey("unidade_de_saude.id"))
    unidade: Mapped["UnidadeDeSaude"] = relationship()
    

class Lote(Base): 
    __tablename__ = "lote"
    id_lote: Mapped[int] = mapped_column("id_lote", BigInteger, primary_key=True, autoincrement=True)
    
    vacina_id: Mapped[int] = mapped_column(ForeignKey("vacina.codigo_vacina"))
    vacina: Mapped["Vacina"] = relationship()
    
    estoque_id: Mapped[int] = mapped_column(ForeignKey("estoque.id_estoque"))
    estoque: Mapped["Estoque"] = relationship()

    fornecedor_cnpj: Mapped[str] = mapped_column(ForeignKey("fornecedor.cnpj_fornecedor"))
    fornecedor: Mapped["Fornecedor"] = relationship()

    validade: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    data_chegada: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    quantidade: Mapped[int] = mapped_column(Integer, nullable=False)
    

# Aplicação
class Dose(Base): 
    __tablename__ = "dose"
    id_dose: Mapped[int] = mapped_column("id_dose", BigInteger, primary_key=True, autoincrement=True)
    
    vacina_id: Mapped[int] = mapped_column(ForeignKey("vacina.codigo_vacina"))
    vacina: Mapped["Vacina"] = relationship()

    numero: Mapped[int] = mapped_column(Integer)
    intervalo: Mapped[int] = mapped_column(Integer, nullable=False)

class Aplicacao(Base): 
    __tablename__ = "aplicacao"
    id_aplicacao: Mapped[int] = mapped_column("id_aplicação", BigInteger, primary_key=True, autoincrement=True)
    
    profissional_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profissional_de_saude.id"))
    profissional: Mapped["Profissional"] = relationship()

    lote_id: Mapped[int] = mapped_column(ForeignKey("lote.id_lote"))
    lote: Mapped["Lote"] = relationship()

    paciente_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("paciente.id"))
    paciente: Mapped["Paciente"] = relationship(back_populates="aplicacoes")

    admin_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("admin.id"))
    admin: Mapped["Admin"] = relationship()
    
    unidade_nome: Mapped[str] = mapped_column(ForeignKey("unidade_de_saude.id"))
    unidade: Mapped["UnidadeDeSaude"] = relationship()
    
    data_aplicacao: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.now)

    dose_id: Mapped[int] = mapped_column(ForeignKey("dose.id_dose"))
    dose: Mapped["Dose"] = relationship()


# Campanhas de Vacinação

class Campanha(Base):
    __tablename__ = "campanha"
    id_campanha: Mapped[int] = mapped_column("id_campanha", Integer, autoincrement=True, primary_key=True)

    admin_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("admin.id"))
    admin: Mapped["Admin"] = relationship()
    
    nome: Mapped[str] = mapped_column("nome_campanha", String(100), nullable=False)    
    data_inicio: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    data_fim: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)

class Publicacao(Base): 
    __tablename__ = "publicacao_campanha"
    campanha_id: Mapped[int] = mapped_column(ForeignKey("campanha.id_campanha"), primary_key=True)
    vacina_id: Mapped[int] = mapped_column(ForeignKey("vacina.codigo_vacina"), primary_key=True)