import uuid
import enum
from datetime import date
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict, Field, field_validator

class RoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    GESTOR = "GESTOR"
    PACIENTE = "PACIENTE"
    PROFISSIONAL = "PROFISSIONAL"


class UsuarioBase(BaseModel):
    nome: str
    email: EmailStr
    telefone: str
    cpf_usuario: str

class UsuarioCreateCommon(UsuarioBase):
    senha: str

class UsuarioResponse(UsuarioBase):
    id: uuid.UUID
    role: RoleEnum
    
    model_config = ConfigDict(from_attributes=True)

class BaseUsuarioBuscaResponse(BaseModel):
    id: uuid.UUID
    nome: str
    cpf: str

class PacienteCreate(UsuarioCreateCommon):
    role: RoleEnum = RoleEnum.PACIENTE

class PacienteResponse(UsuarioResponse):
    pass

class GestorCreate(UsuarioCreateCommon):
    role: RoleEnum = RoleEnum.GESTOR

class GestorResponse(UsuarioResponse):
    pass

class AdminCreate(UsuarioCreateCommon):
    role: RoleEnum = RoleEnum.ADMIN

class AdminResponse(UsuarioResponse):
    pass

class ProfissionalCreate(UsuarioCreateCommon):
    role: RoleEnum = RoleEnum.PROFISSIONAL
    grau_formacao: str

class ProfissionalResponse(UsuarioResponse):
    grau_formacao: str
    pass



class FabricanteBase(BaseModel):
    nome: str
    telefone: str

class FabricanteCreate(FabricanteBase):
    cnpj: str = Field(..., min_length=14, max_length=14)

class FabricanteResponse(FabricanteBase):
    cnpj: str = Field(validation_alias=("cnpj_fabricante"))
    model_config = ConfigDict(from_attributes=True)

class FornecedorBase(BaseModel):
    nome: str
    telefone: str

class FornecedorCreate(FornecedorBase):
    cnpj: str

class FornecedorResponse(FornecedorBase):
    cnpj: str  = Field(validation_alias=("cnpj_fornecedor"))
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
    id: uuid.UUID
    nome_unidade: str
    model_config = ConfigDict(from_attributes=True)




class VacinaBase(BaseModel):
    nome: str
    publico_alvo: str
    doenca: str
    quantidade_doses: int
    descricao: str

class VacinaCreate(VacinaBase):
    fabricante_cnpj: str
    intervalo_doses: int
    
class VacinaResponse(VacinaBase):
    codigo_vacina: int
    fabricante: Optional[FabricanteResponse] = None
    
    model_config = ConfigDict(from_attributes=True)

class BuscaVacinaResponse(BaseModel):
    id: int
    nome: str
    fabricante_nome: str
    
    model_config = ConfigDict(from_attributes=True)

class EstoqueCreate(BaseModel):
    id_unidade: str
    gestor_id: uuid.UUID

class EstoqueResponse(BaseModel):
    id_estoque: int
    unidade: Optional[UnidadeResponse] = None
    gestor: Optional[GestorResponse] = None
    model_config = ConfigDict(from_attributes=True)


class LoteCreate(BaseModel):
    codigo: str
    validade: datetime
    data_chegada: datetime
    quantidade: int 
    estoque_id: int
    vacina_id: int
    fornecedor_cnpj: str

class LoteResponse(BaseModel):
    id_lote: int
    codigo: str
    quantidade: int
    validade: datetime
    data_chegada: datetime
    
    vacina_id: int 
    fornecedor_cnpj: str 
    
    vacina: Optional[VacinaResponse] = None
    
    model_config = ConfigDict(from_attributes=True)

class DoseBase(BaseModel):
    numero: int    
    intervalo: int  
    vacina_id: int

class DoseCreate(DoseBase):
    pass

class DoseResponse(DoseBase):
    id_dose: int
    
    vacina: Optional[VacinaResponse] = None 

    model_config = ConfigDict(from_attributes=True)


class AplicacaoCreate(BaseModel):
    data: Optional[datetime] = None
    
    paciente_id: uuid.UUID
    profissional_id: uuid.UUID
    admin_id: uuid.UUID
    unidade_id: uuid.UUID
    
    dose_id: int
    lote_id: int
    observacoes: Optional[str] = None

class AplicacaoResponse(BaseModel):
    id_aplicacao: int
    data: datetime

    fabricante_nome: str = Field(validation_alias="fabricante_nome")
    observacoes: Optional[str] = None
        
    paciente_nome: str = Field(validation_alias="nome_paciente")
    paciente_cpf: str = Field(validation_alias="cpf_paciente")
    
    vacina_nome: str = Field(validation_alias="nome_vacina")
    dose_numero: int = Field(validation_alias="numero_dose")
    lote_codigo: int = Field(validation_alias="codigo_lote")
    lote_id: int    
    nome_unidade: str = Field(validation_alias="nome_unidade")
    profissional_nome: str = Field(validation_alias="nome_profissional")
    paciente_id: uuid.UUID
    dose_id: int

    profissional_id: uuid.UUID = Field(validation_alias="profissional_id")
    unidade_id: uuid.UUID = Field(validation_alias=("unidade_id"))

    vacina_id: int = Field(validation_alias="id_vacina")
    
    
    proxima_dose: Optional[datetime] = Field(default=None, validation_alias="data_proxima_dose")

    model_config = ConfigDict(from_attributes=True)

class CampanhaCreate(BaseModel):
    nome: str
    data_inicio: datetime
    data_fim: datetime
    admin_id: uuid.UUID
    vacina_ids: List[int] = []
    
    publico_alvo: str
    descricao: Optional[str] = None
    ativa: bool = True

    @field_validator('data_fim')
    def validar_datas(cls, v, values):
        data_inicio = values.data.get('data_inicio')
        if data_inicio and v <= data_inicio:
            raise ValueError('A data de fim deve ser posterior à data de início.')
        return v

class CampanhaResponse(BaseModel):
    id: int = Field(validation_alias="id_campanha")
    nome: str
    data_inicio: datetime
    data_fim: datetime
    
    publico_alvo: str
    descricao: Optional[str] = None
    ativa: bool
    # --------------------

    admin: Optional[AdminResponse] = None
    vacina_ids: List[int] = []
    
    model_config = ConfigDict(from_attributes=True)

class PublicacaoCreate(BaseModel):
    campanha_id: int
    vacina_id: int

class DashboardFilter(BaseModel):
    ano: int
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None
    vacina_id: Optional[int] = None

class ChartData(BaseModel):
    name: str
    value: int

class DashboardStats(BaseModel):
    total_aplicacoes: int
    pacientes_vacinados: int
    media_mensal: int
    vacina_mais_aplicada: str
    mes_mais_ativo: str
    
    aplicacoes_por_mes: List[ChartData]
    aplicacoes_por_vacina: List[ChartData]
    aplicacoes_por_local: List[ChartData]

class ExportData(BaseModel):
    data_aplicacao: date
    paciente_nome: str
    vacina_nome: str
    dose: int
    local: str
    profissional_nome: str

    
class GraficoDia(BaseModel):
    dia: str
    total: int

class GraficoVacinaTotal(BaseModel):
    vacina: str
    total: int

class GraficoEstoque(BaseModel):
    vacina: str
    quantidade: int

class GraficoMes(BaseModel):
    mes: str
    total: int

class DistribuicaoVacina(BaseModel):
    vacina: str
    quantidade: int
    percentual: float

class DistribuicaoLocal(BaseModel):
    ubs: str
    total: int

class ResumoMensal(BaseModel):
    mes: str
    total_aplicacoes: int
    percentual: float


class PacienteResumo(BaseModel):
    id: uuid.UUID 
    
    nome: str
    
    cpf: str = Field(validation_alias="cpf_usuario")

    model_config = ConfigDict(from_attributes=True)

class VacinaResumo(BaseModel):
    codigo: int = Field(validation_alias="codigo_vacina")
    nome: str

class LoteResumo(BaseModel):
    id: int = Field(validation_alias="id_lote")
    vacina: Optional[VacinaResumo] = None

class AplicacaoDetalhada(BaseModel):
    id_aplicacao: int
    
    data: datetime 
    
    dose: int = Field(validation_alias="numero_dose")
    
    local: str = Field(validation_alias="nome_unidade")
    
    profissional_nome: Optional[str] = Field(default=None, validation_alias="nome_profissional")
    
    paciente: Optional[PacienteResumo] = None
    lote: Optional[LoteResumo] = None

    @property
    def vacina_nome(self):
        if self.lote and self.lote.vacina:
            return self.lote.vacina.nome
        return "Desconhecida"

    model_config = ConfigDict(from_attributes=True)