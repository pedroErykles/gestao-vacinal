import uuid
import enum
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict, Field

# --- 0. Enums (Deve ser igual ao do model) ---
class RoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    GESTOR = "GESTOR"
    PACIENTE = "PACIENTE"
    PROFISSIONAL = "PROFISSIONAL"

# --- 1. Schemas de Usuário (Hierarquia) ---

# Base: Campos comuns a todos os seres humanos do sistema
class UsuarioBase(BaseModel):
    pnome: str
    unome: str
    email: EmailStr
    telefone: str
    cpf_usuario: str

# Create Base: Adiciona senha (comum a todos na criação)
class UsuarioCreateCommon(UsuarioBase):
    senha: str

# Response Base: O que todo usuário retorna (sem senha, com ID e Role)
class UsuarioResponse(UsuarioBase):
    id: uuid.UUID
    role: RoleEnum
    
    model_config = ConfigDict(from_attributes=True)

class BaseUsuarioBuscaResponse(BaseModel):
    id: uuid.UUID
    nome_completo: str

# --- 1.1 Schemas Específicos por Papel ---

# PACIENTE
class PacienteCreate(UsuarioCreateCommon):
    role: RoleEnum = RoleEnum.PACIENTE

class PacienteResponse(UsuarioResponse):
    pass

# GESTOR
class GestorCreate(UsuarioCreateCommon):
    role: RoleEnum = RoleEnum.GESTOR

class GestorResponse(UsuarioResponse):
    pass

# ADMIN
class AdminCreate(UsuarioCreateCommon):
    role: RoleEnum = RoleEnum.ADMIN

class AdminResponse(UsuarioResponse):
    pass

# PROFISSIONAL
class ProfissionalCreate(UsuarioCreateCommon):
    role: RoleEnum = RoleEnum.PROFISSIONAL
    # Exemplo: registro_conselho: str

class ProfissionalResponse(UsuarioResponse):
    # Exemplo: registro_conselho: Optional[str] = None
    pass


# --- 2. Entidades de Apoio (Fabricante, Fornecedor, Unidade) ---

class FabricanteBase(BaseModel):
    nome: str
    telefone: str

class FabricanteCreate(FabricanteBase):
    cnpj: str

class FabricanteResponse(FabricanteBase):
    cnpj: str
    model_config = ConfigDict(from_attributes=True)

class FornecedorBase(BaseModel):
    nome: str
    telefone: str

class FornecedorCreate(FornecedorBase):
    cnpj: str

class FornecedorResponse(FornecedorBase):
    cnpj: str
    model_config = ConfigDict(from_attributes=True)

class UnidadeBase(BaseModel):
    tipo: str
    rua: str
    bairro: str
    cidade: str
    estado: str
    numero: int

class BuscaUnidade(BaseModel):
    id: uuid.UUID
    nome_unidade: str

class UnidadeCreate(UnidadeBase):
    nome_unidade: str

class UnidadeResponse(UnidadeBase):
    nome_unidade: str
    model_config = ConfigDict(from_attributes=True)


# --- 3. Vacinas e Estoque ---

class VacinaBase(BaseModel):
    nome: str
    publico_alvo: str
    doenca: str
    quantidade_doses: int

class BuscaVacina(BaseModel): 
    nome: str
    fabricante: str

class VacinaCreate(VacinaBase):
    fabricante_cnpj: str

class VacinaResponse(VacinaBase):
    codigo_vacina: int
    fabricante: Optional[FabricanteResponse] = None
    model_config = ConfigDict(from_attributes=True)

class EstoqueCreate(BaseModel):
    gestor_id: uuid.UUID
    nome_unidade: str

class EstoqueResponse(BaseModel):
    id_estoque: int
    gestor: Optional[GestorResponse] = None
    unidade: Optional[UnidadeResponse] = None
    model_config = ConfigDict(from_attributes=True)

class LoteCreate(BaseModel):    
    vacina_id: int
    estoque_id: int
    fornecedor_cnpj: str
    validade: datetime
    data_chegada: datetime
    quantidade: int

class LoteResponse(LoteCreate):
    id_lote: int
    vacina: Optional[VacinaResponse] = None
    model_config = ConfigDict(from_attributes=True)


# --- 4. Aplicação e Dose ---

class DoseCreate(BaseModel):
    vacina_id: int
    numero: int
    intervalo: int

class DoseResponse(DoseCreate):
    id_dose: int
    model_config = ConfigDict(from_attributes=True)

class AplicacaoCreate(BaseModel):    
    profissional_id: uuid.UUID
    lote_id: int    
    paciente_id: uuid.UUID
    admin_id: uuid.UUID
    unidade_nome: str
    data_aplicacao: Optional[datetime] = None
    dose_id: int

class AplicacaoResponse(BaseModel):
    id_aplicacao: int
    profissional: Optional[ProfissionalResponse] = None
    lote: Optional[int] = None
    paciente: Optional[PacienteResponse] = None
    admin: Optional[GestorResponse] = None
    unidade: Optional[UnidadeResponse] = None
    data_aplicacao: datetime
    dose: Optional[DoseResponse] = None

    model_config = ConfigDict(from_attributes=True)


# --- 5. Campanhas ---

class CampanhaCreate(BaseModel):
    admin_id: uuid.UUID
    nome: str
    data_inicio: datetime
    data_fim: datetime

class CampanhaResponse(CampanhaCreate):
    id: int
    admin: Optional[AdminResponse] = None
    model_config = ConfigDict(from_attributes=True)

# Many-to-Many
class PublicacaoCreate(BaseModel):
    campanha_id: int
    vacina_id: int