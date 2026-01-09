import uuid
import enum
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict, Field

# --- 0. Enums (Deve ser igual ao do model) ---
class RoleEnum(str, enum.Enum):
    ADMIN = "admin"
    GESTOR = "gestor"
    PACIENTE = "patient"
    PROFISSIONAL = "healthcare_prof"

# --- 1. Schemas de Usuário (Hierarquia) ---

# Base: Campos comuns a todos os seres humanos do sistema
class UsuarioBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    cpf: str

# Create Base: Adiciona senha (comum a todos na criação)
class UsuarioCreateCommon(UsuarioBase):
    password: str

# Response Base: O que todo usuário retorna (sem senha, com ID e Role)
class UsuarioResponse(UsuarioBase):
    id: uuid.UUID
    role: RoleEnum
    
    model_config = ConfigDict(from_attributes=True)

# --- 1.1 Schemas Específicos por Papel ---

# PACIENTE
class PacienteCreate(UsuarioCreateCommon):
    # Forçamos o role para garantir segurança na criação
    role: RoleEnum = RoleEnum.PACIENTE
    # Se tiver campos extras (ex: num_sus), coloque aqui

class PacienteResponse(UsuarioResponse):
    # Se o paciente tiver campos extras no model, adicione aqui
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
    numero: int

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

class VacinaCreate(VacinaBase):
    fabricante_cnpj: str

class VacinaResponse(VacinaBase):
    codigo_vacina: int
    fabricante: Optional[FabricanteResponse] = None
    model_config = ConfigDict(from_attributes=True)

class EstoqueCreate(BaseModel):
    nome_unidade_id: str
    gestor_id: uuid.UUID

class EstoqueResponse(BaseModel):
    id: int
    unidade: Optional[UnidadeResponse] = None
    # Note que agora usamos GestorResponse (que herda de UsuarioResponse)
    gestor: Optional[GestorResponse] = None
    model_config = ConfigDict(from_attributes=True)

class LoteCreate(BaseModel):
    validade: datetime
    data_chegada: datetime
    quantidade: int
    estoque_id: int
    vacina_id: int
    fornecedor_cnpj: str

class LoteResponse(LoteCreate):
    id: int
    vacina: Optional[VacinaResponse] = None
    model_config = ConfigDict(from_attributes=True)


# --- 4. Aplicação e Dose ---

class DoseCreate(BaseModel):
    intervalo: int
    numero: int
    vacina_id: int

class DoseResponse(DoseCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)

class AplicacaoCreate(BaseModel):
    data: Optional[datetime] = None
    paciente_id: uuid.UUID
    profissional_id: uuid.UUID
    gestor_id: uuid.UUID
    unidade_nome: str
    dose_id: int

class AplicacaoResponse(BaseModel):
    id: int
    data: datetime
    
    # Aqui a mágica acontece: O Pydantic usa os Schemas Específicos
    paciente: Optional[PacienteResponse] = None
    profissional: Optional[ProfissionalResponse] = None
    gestor: Optional[GestorResponse] = None
    
    dose: Optional[DoseResponse] = None
    unidade: Optional[UnidadeResponse] = None
    
    model_config = ConfigDict(from_attributes=True)


# --- 5. Campanhas ---

class CampanhaCreate(BaseModel):
    data_inicio: datetime
    data_fim: datetime
    nome: str
    admin_id: uuid.UUID

class CampanhaResponse(CampanhaCreate):
    id: int
    admin: Optional[AdminResponse] = None
    model_config = ConfigDict(from_attributes=True)

# Many-to-Many
class PublicacaoCreate(BaseModel):
    campanha_id: int
    vacina_id: int