import enum
import uuid
import datetime
from typing import List

from sqlalchemy import String, Integer, BigInteger, ForeignKey, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

# 1. Definimos os papeis possíveis
class RoleEnum(enum.Enum):
    ADMIN = "admin"
    GESTOR = "gestor"
    PACIENTE = "patient"
    PROFISSIONAL = "profissional"

# 2. Tabela Pai (Tudo que é COMUM a todos vai aqui)
class Usuario(Base):
    __tablename__ = "usuario"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Campos comuns
    first_name: Mapped[str] = mapped_column(String(20), nullable=False)
    last_name: Mapped[str] = mapped_column(String(20), nullable=False)
    password: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    phone: Mapped[str] = mapped_column(String(30), nullable=False)
    cpf: Mapped[str] = mapped_column(String(13), nullable=False, unique=True)
    
    # O campo discriminador (A tal da ROLE)
    role: Mapped[RoleEnum] = mapped_column(Enum(RoleEnum), nullable=False)

    # Configuração do Polimorfismo
    __mapper_args__ = {
        "polymorphic_identity": "usuario",
        "polymorphic_on": "role",
    }

# 3. Tabelas Filhas (Só dados específicos)

class Paciente(Usuario):
    __tablename__ = "paciente"
    
    # O ID é FK para usuario.id e PK do paciente ao mesmo tempo
    id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuario.id"), primary_key=True)
    
    # Campos específicos de paciente (ex: número do SUS, histórico, etc)
    # num_sus: Mapped[str] = mapped_column(String, nullable=True) 

    aplicacoes: Mapped[List["Aplicacao"]] = relationship(back_populates="paciente")

    __mapper_args__ = {
        "polymorphic_identity": RoleEnum.PACIENTE,
    }

class Gestor(Usuario):
    __tablename__ = "gestor"
    id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuario.id"), primary_key=True)
    
    # Campos específicos de gestor (se houver)
    departamento: Mapped[str] = mapped_column(String, nullable=True)

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
    
    # Exemplo: CRM ou Registro profissional só existe aqui
    registro_conselho: Mapped[str] = mapped_column(String(20), nullable=True)

    __mapper_args__ = {
        "polymorphic_identity": RoleEnum.PROFISSIONAL,
    }
# --- Entidades Básicas ---

class Fabricante(Base):
    __tablename__ = "fabricante"
    cnpj: Mapped[str] = mapped_column("cnpj_fabricante", String(14), primary_key=True)
    nome: Mapped[str] = mapped_column(String(40), nullable=False)
    telefone: Mapped[str] = mapped_column(String(20), nullable=False)

class Fornecedor(Base):
    __tablename__ = "fornecedor"
    cnpj: Mapped[str] = mapped_column("cnpj_fornecedor", String(14), primary_key=True)
    nome: Mapped[str] = mapped_column(String(40), nullable=False)
    telefone: Mapped[str] = mapped_column(String(20), nullable=False)

class UnidadeDeSaude(Base): 
    __tablename__ = "unidade_de_saude"
    # Atenção: Usar nome como PK. Se o nome mudar, quebra os relacionamentos.
    nome_unidade: Mapped[str] = mapped_column("nome_unidade", String, primary_key=True)
    tipo: Mapped[str] = mapped_column(String(100), nullable=False)
    rua: Mapped[str] = mapped_column(String(40), nullable=False)
    bairro: Mapped[str] = mapped_column(String(30), nullable=False)
    cidade: Mapped[str] = mapped_column(String(30), nullable=False)
    numero: Mapped[int] = mapped_column(Integer, nullable=False)

class Vacina(Base):
    __tablename__ = "vacina"
    codigo_vacina: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(30), nullable=False)
    publico_alvo: Mapped[str] = mapped_column("publico_alvo", String(40), nullable=False)
    doenca: Mapped[str] = mapped_column(String(50), nullable=False)
    quantidade_doses: Mapped[int] = mapped_column("quantidade_de_doses", Integer, nullable=False)
    
    # Correção: Separar ID do Objeto
    fabricante_cnpj: Mapped[str] = mapped_column(ForeignKey("fabricante.cnpj_fabricante"))
    fabricante: Mapped["Fabricante"] = relationship()

# --- Logística ---

class Estoque(Base): 
    __tablename__ = "estoque"
    id: Mapped[int] = mapped_column("id_estoque", Integer, primary_key=True, autoincrement=True)
    
    # Correção: FK aponta para a tabela, Relationship carrega o objeto
    nome_unidade_id: Mapped[str] = mapped_column(ForeignKey("unidade_de_saude.nome_unidade"))
    unidade: Mapped["UnidadeDeSaude"] = relationship()
    
    gestor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("gestor.id_gestor"))
    gestor: Mapped["Gestor"] = relationship()

class Lote(Base): 
    __tablename__ = "lote"
    id: Mapped[int] = mapped_column("id_lote", BigInteger, primary_key=True, autoincrement=True)
    validade: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    data_chegada: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    quantidade: Mapped[int] = mapped_column(Integer, nullable=False)
    
    estoque_id: Mapped[int] = mapped_column(ForeignKey("estoque.id_estoque"))
    estoque: Mapped["Estoque"] = relationship()
    
    vacina_id: Mapped[int] = mapped_column(ForeignKey("vacina.codigo_vacina"))
    vacina: Mapped["Vacina"] = relationship()
    
    fornecedor_cnpj: Mapped[str] = mapped_column(ForeignKey("fornecedor.cnpj_fornecedor"))
    fornecedor: Mapped["Fornecedor"] = relationship()

# --- Aplicação ---

class Dose(Base): 
    __tablename__ = "dose" # Faltava isso
    id: Mapped[int] = mapped_column("id_dose", BigInteger, primary_key=True, autoincrement=True)
    intervalo: Mapped[int] = mapped_column(Integer, nullable=False)
    numero: Mapped[int] = mapped_column(Integer)
    
    vacina_id: Mapped[int] = mapped_column(ForeignKey("vacina.codigo_vacina"))
    vacina: Mapped["Vacina"] = relationship()

class Aplicacao(Base): 
    __tablename__ = "aplicacao"
    id: Mapped[int] = mapped_column("id_aplicação", BigInteger, primary_key=True, autoincrement=True)
    data: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.now)
    
    # Todas as FKs corrigidas para apontar para Tabela.Coluna
    paciente_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("paciente.id_paciente"))
    paciente: Mapped["Paciente"] = relationship(back_populates="aplicacoes")
    
    profissional_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profissional_de_saude.id_profissional"))
    profissional: Mapped["Profissional"] = relationship()
    
    gestor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("gestor.id_gestor"))
    gestor: Mapped["Gestor"] = relationship()
    
    unidade_nome: Mapped[str] = mapped_column(ForeignKey("unidade_de_saude.nome_unidade"))
    unidade: Mapped["UnidadeDeSaude"] = relationship()
    
    dose_id: Mapped[int] = mapped_column(ForeignKey("dose.id_dose"))
    dose: Mapped["Dose"] = relationship()

# --- Campanhas ---

class Campanha(Base):
    __tablename__ = "campanha"
    id: Mapped[int] = mapped_column("id_campanha", Integer, autoincrement=True, primary_key=True)
    data_inicio: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    data_fim: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    nome: Mapped[str] = mapped_column("nome_campanha", String(100), nullable=False)

    admin_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("admin.id_admin"))
    admin: Mapped["Admin"] = relationship()

class Publicacao(Base): 
    __tablename__ = "publicacao_campanha"
    # Correção: As FKs devem apontar para 'tabela.coluna_pk'
    campanha_id: Mapped[int] = mapped_column(ForeignKey("campanha.id_campanha"), primary_key=True)
    vacina_id: Mapped[int] = mapped_column(ForeignKey("vacina.codigo_vacina"), primary_key=True)