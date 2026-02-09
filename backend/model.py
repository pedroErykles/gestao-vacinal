import enum
import uuid
import datetime
from typing import List

from database import Base

from sqlalchemy import Boolean, Index, String, Integer, BigInteger, ForeignKey, DateTime, Enum, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

class RoleEnum(enum.Enum):
    ADMIN = "ADMIN"
    GESTOR = "GESTOR"
    PACIENTE = "PACIENTE"
    PROFISSIONAL = "PROFISSIONAL"

class Usuario(Base):
    __tablename__ = "usuario"

    __table_args__ = (
        Index(
            'idx_usuario_nome_completo_trgm',
            text("(nome) gin_trgm_ops"),
            postgresql_using='gin'
        ),
    )
    
    id: Mapped[uuid.UUID] = mapped_column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    senha: Mapped[str] = mapped_column(String, nullable=True)
    email: Mapped[str] = mapped_column(String, nullable=True, unique=True)
    telefone: Mapped[str] = mapped_column(String(30), nullable=False)
    cpf_usuario: Mapped[str] = mapped_column(String(13), nullable=False, unique=True)
    
    role: Mapped[RoleEnum] = mapped_column(Enum(RoleEnum), nullable=False)

    __mapper_args__ = {
        "polymorphic_on": "role",
    }


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
    
    grau_formacao: Mapped[str] = mapped_column(String(50), nullable=False)

    __mapper_args__ = {
        "polymorphic_identity": RoleEnum.PROFISSIONAL,
    }

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
    descricao: Mapped[str] = mapped_column(String(200), nullable=False)

    intervalo_doses: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    doses: Mapped[List["Dose"]] = relationship(back_populates="vacina", cascade="all, delete-orphan")

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

class Estoque(Base): 
    __tablename__ = "estoque"
    id_estoque: Mapped[int] = mapped_column("id_estoque", Integer, primary_key=True, autoincrement=True)
    
    nome_unidade: Mapped[str] = mapped_column(ForeignKey("unidade_de_saude.id"))
    unidade: Mapped["UnidadeDeSaude"] = relationship()
    
    gestor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("gestor.id"))
    gestor: Mapped["Gestor"] = relationship()

class Lote(Base): 
    __tablename__ = "lote"
    id_lote: Mapped[int] = mapped_column("id_lote", BigInteger, primary_key=True, autoincrement=True)
    codigo: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    validade: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    data_chegada: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    quantidade: Mapped[int] = mapped_column(Integer, nullable=False)
    
    estoque_id: Mapped[int] = mapped_column(ForeignKey("estoque.id_estoque"))
    estoque: Mapped["Estoque"] = relationship()
    
    vacina_id: Mapped[int] = mapped_column(ForeignKey("vacina.codigo_vacina"))
    vacina: Mapped["Vacina"] = relationship()
    
    fornecedor_cnpj: Mapped[str] = mapped_column(ForeignKey("fornecedor.cnpj_fornecedor"))
    fornecedor: Mapped["Fornecedor"] = relationship()


class Dose(Base): 
    __tablename__ = "dose"
    id_dose: Mapped[int] = mapped_column("id_dose", BigInteger, primary_key=True, autoincrement=True)
    intervalo: Mapped[int] = mapped_column(Integer, nullable=False)
    numero: Mapped[int] = mapped_column(Integer)
    
    vacina_id: Mapped[int] = mapped_column(ForeignKey("vacina.codigo_vacina"))
    vacina: Mapped["Vacina"] = relationship(back_populates="doses")

class Aplicacao(Base): 
    __tablename__ = "aplicacao"
    id_aplicacao: Mapped[int] = mapped_column("id_aplicação", BigInteger, primary_key=True, autoincrement=True)
    data: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.now)
    
    paciente_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("paciente.id"))
    paciente: Mapped["Paciente"] = relationship(back_populates="aplicacoes")
    
    profissional_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profissional_de_saude.id"))
    profissional: Mapped["Profissional"] = relationship()
    
    admin_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("admin.id"))
    admin: Mapped["Admin"] = relationship()
    
    unidade_id: Mapped[str] = mapped_column(ForeignKey("unidade_de_saude.id"))
    unidade: Mapped["UnidadeDeSaude"] = relationship()
    
    dose_id: Mapped[int] = mapped_column(ForeignKey("dose.id_dose"))
    dose: Mapped["Dose"] = relationship()

    lote_id: Mapped[int] = mapped_column(ForeignKey("lote.id_lote"))
    lote: Mapped["Lote"] = relationship()

    observacoes: Mapped[str] = mapped_column("observacoes", Text, nullable= True)

    @property
    def nome_unidade(self):
        return self.unidade.nome_unidade if self.unidade else None
    
    @property
    def fabricante_nome(self):
        if self.dose and self.dose.vacina and self.dose.vacina.fabricante:
            return self.dose.vacina.fabricante.nome
        return "Desconhecido"
    
    @property
    def nome_paciente(self):
        if self.paciente:
            return f"{self.paciente.nome} "
        return "Desconhecido"

    @property
    def cpf_paciente(self):
        return self.paciente.cpf_usuario if self.paciente else ""

    @property
    def nome_vacina(self):
        if self.dose and self.dose.vacina:
            return self.dose.vacina.nome
        return "Desconhecido"

    @property
    def numero_dose(self):
        return self.dose.numero if self.dose else 0

    @property
    def codigo_lote(self):
        return self.lote_id
    
    @property
    def id_vacina(self):
        if self.dose and self.dose.vacina:
            return self.dose.vacina.codigo_vacina 
        return 0

    @property
    def nome_profissional(self):
        if self.profissional:
            return f"{self.profissional.nome}"
        return "Desconhecido"

    @property
    def data_proxima_dose(self):
        
        if not self.data or not self.dose or not self.lote or not self.lote.vacina:
            return None

        numero_proxima = self.dose.numero + 1
        

        proxima_dose_config = next(
            (d for d in self.lote.vacina.doses if d.numero == numero_proxima), 
            None
        )

        if not proxima_dose_config:
            return None

        intervalo_dias = proxima_dose_config.intervalo
        
        if intervalo_dias > 0:
            return self.data + datetime.timedelta(days=intervalo_dias)
        
        return None


class Campanha(Base):
    __tablename__ = "campanha"
    id_campanha: Mapped[int] = mapped_column("id_campanha", Integer, autoincrement=True, primary_key=True)
    
    nome: Mapped[str] = mapped_column("nome_campanha", String(100), nullable=False)
    data_inicio: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    data_fim: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    
    publico_alvo: Mapped[str] = mapped_column(String(200), nullable=False)
    descricao: Mapped[str] = mapped_column(Text, nullable=True)            
    ativa: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False) 

    admin_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("admin.id"))
    admin: Mapped["Admin"] = relationship()

    publicacoes: Mapped[List["Publicacao"]] = relationship(cascade="all, delete-orphan") 

    @property
    def vacina_ids(self) -> List[int]:
        return [p.vacina_id for p in self.publicacoes] if self.publicacoes else []
class Publicacao(Base): 
    __tablename__ = "publicacao_campanha"
    campanha_id: Mapped[int] = mapped_column(ForeignKey("campanha.id_campanha"), primary_key=True)
    vacina_id: Mapped[int] = mapped_column(ForeignKey("vacina.codigo_vacina"), primary_key=True)
    