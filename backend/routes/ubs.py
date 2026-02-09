from typing import List
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func, or_, text

import model, schemas
from database import SessionLocal

router = APIRouter(
    prefix="/ubs",
    tags=["UBS"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# unidade de saude

@router.get("/aplicacoes", response_model=List[schemas.AplicacaoDetalhada])
def listar_ultimas_aplicacoes(
    limit: int = 10, 
    db: Session = Depends(get_db)
):

    aplicacoes = (
        db.query(model.Aplicacao)
        .options(
            joinedload(model.Aplicacao.paciente),
            joinedload(model.Aplicacao.lote).joinedload(model.Lote.vacina)
        )
        .order_by(desc(model.Aplicacao.data))
        .limit(limit)
        .all()
    )
    
    return aplicacoes

@router.post("/unidades", response_model=schemas.UnidadeResponse, status_code=201)
def criar_unidade(unidade: schemas.UnidadeCreate, db: Session = Depends(get_db)):
    if db.query(model.UnidadeDeSaude).filter_by(nome_unidade=unidade.nome_unidade).first():
        raise HTTPException(status_code=409, detail="Nome de unidade já existe.")

    obj = model.UnidadeDeSaude(**unidade.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.get("/unidades", response_model=list[schemas.UnidadeResponse])
def listar_unidades(db: Session = Depends(get_db)):
    return db.query(model.UnidadeDeSaude).all()

@router.get("/unidades/busca", response_model=list[schemas.BuscaUnidade])
def busca_unidades(termo: str = Query(..., min_length=3), db: Session = Depends(get_db)):
    db.execute(text("SELECT set_limit(0.1);"))

    results = (
        db.query(
            model.UnidadeDeSaude.id,
            model.UnidadeDeSaude.nome_unidade
        )
        .filter(
            or_(
                model.UnidadeDeSaude.nome_unidade.ilike(func.unaccent(f"%{termo}%")),
                
                model.UnidadeDeSaude.nome_unidade.op("<%")(termo)
            )
        )
        .order_by(
            func.similarity(model.UnidadeDeSaude.nome_unidade, termo).desc()
        )
        .limit(10)
        .all()
    )

    return results
@router.get("/unidades/{nome_unidade}", response_model=schemas.UnidadeResponse)
def buscar_unidade(nome_unidade: str, db: Session = Depends(get_db)):
    obj = db.query(model.UnidadeDeSaude).get(nome_unidade)
    if not obj:
        raise HTTPException(status_code=404, detail="Unidade não encontrada")
    return obj

@router.put("/unidades/{nome_unidade}", response_model=schemas.UnidadeResponse)
def atualizar_unidade(
    nome_unidade: str,
    dados: schemas.UnidadeCreate,
    db: Session = Depends(get_db)
):
    obj = db.query(model.UnidadeDeSaude).get(nome_unidade)
    if not obj:
        raise HTTPException(status_code=404, detail="Unidade não encontrada")

    for campo, valor in dados.model_dump().items():
        setattr(obj, campo, valor)

    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/unidades/{unidade_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_unidade(unidade_id: str, db: Session = Depends(get_db)):
    try:
        uuid_obj = uuid.UUID(unidade_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido. Deve ser um UUID.")

    unidade = db.query(model.UnidadeDeSaude).get(uuid_obj)
    
    if not unidade:
        raise HTTPException(status_code=404, detail="Unidade não encontrada")


    qtd_estoques = db.query(model.Estoque).filter(model.Estoque.nome_unidade == str(unidade.id)).count()

    if qtd_estoques > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Não é possível deletar a unidade. Ela possui estoques vinculados. Delete os estoques primeiro."
        )

    db.delete(unidade)
    db.commit()
    return None

# estoque

@router.post("/estoques", response_model=schemas.EstoqueResponse, status_code=201)
def criar_estoque(estoque: schemas.EstoqueCreate, db: Session = Depends(get_db)):
    
    try:
        unidade_uuid = uuid.UUID(str(estoque.id_unidade)) 
    except ValueError:
        raise HTTPException(status_code=400, detail="ID da unidade inválido.")

    unidade = db.query(model.UnidadeDeSaude).get(unidade_uuid)
    if not unidade:
        raise HTTPException(status_code=404, detail="ID da Unidade de Saúde não encontrado.")

  
    obj = model.Estoque(
        nome_unidade=str(estoque.id_unidade), 
        gestor_id=estoque.gestor_id
    )

    db.add(obj)
    db.commit()
    db.refresh(obj)
    
    return obj

@router.get("/estoques", response_model=list[schemas.EstoqueResponse])
def listar_estoques(db: Session = Depends(get_db)):
    return db.query(model.Estoque).all()

@router.get("/estoques/{estoque_id}", response_model=schemas.EstoqueResponse)
def buscar_estoque(estoque_id: int, db: Session = Depends(get_db)):
    obj = db.query(model.Estoque).get(estoque_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Estoque não encontrado")
    return obj

@router.put("/estoques/{estoque_id}", response_model=schemas.EstoqueResponse)
def atualizar_estoque(
    estoque_id: int,
    dados: schemas.EstoqueCreate,
    db: Session = Depends(get_db)
):
    obj = db.query(model.Estoque).get(estoque_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Estoque não encontrado")

    for campo, valor in dados.model_dump().items():
        setattr(obj, campo, valor)

    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/estoques/{estoque_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_estoque(estoque_id: int, db: Session = Depends(get_db)):
    estoque = db.query(model.Estoque).get(estoque_id)
    if not estoque:
        raise HTTPException(status_code=404, detail="Estoque não encontrado")


    qtd_lotes = db.query(model.Lote).filter(model.Lote.estoque_id == estoque_id).count()

    if qtd_lotes > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Não é possível deletar este estoque. Existem {qtd_lotes} lotes armazenados nele. Delete ou mova os lotes primeiro."
        )

    db.delete(estoque)
    db.commit()
    return None

# lote
# ubs.py

@router.post("/lotes", response_model=schemas.LoteResponse, status_code=201)
def criar_lote(lote: schemas.LoteCreate, db: Session = Depends(get_db)):
    if db.query(model.Lote).filter(model.Lote.codigo == lote.codigo).first():
        raise HTTPException(status_code=409, detail=f"O código '{lote.codigo}' já existe.")

    if not db.query(model.Vacina).get(lote.vacina_id):
        raise HTTPException(status_code=404, detail="Vacina não encontrada.")
    if not db.query(model.Fornecedor).get(lote.fornecedor_cnpj):
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado.")

    obj = model.Lote(
        codigo=lote.codigo,
        validade=lote.validade,
        data_chegada=lote.data_chegada,
        quantidade=lote.quantidade, 
        estoque_id=lote.estoque_id,
        vacina_id=lote.vacina_id,
        fornecedor_cnpj=lote.fornecedor_cnpj
    )
    
    db.add(obj)
    db.commit()
    db.refresh(obj)
    
    if obj.vacina and obj.vacina.fabricante:
        obj.vacina.fabricante.cnpj = obj.vacina.fabricante.cnpj_fabricante
        
    return obj

@router.put("/lotes/{lote_id}", response_model=schemas.LoteResponse)
def atualizar_lote(lote_id: int, dados: dict, db: Session = Depends(get_db)):
    obj = db.query(model.Lote).get(lote_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Lote não encontrado")

    if 'codigo' in dados and dados['codigo'] != obj.codigo:
        if db.query(model.Lote).filter(model.Lote.codigo == dados['codigo']).first():
            raise HTTPException(status_code=409, detail="Código já em uso.")
        obj.codigo = dados['codigo']

    if 'quantidade' in dados:
        obj.quantidade = int(dados['quantidade'])
    
    if 'validade' in dados: obj.validade = dados['validade']
    if 'data_chegada' in dados: obj.data_chegada = dados['data_chegada']
    if 'fornecedor_cnpj' in dados: obj.fornecedor_cnpj = dados['fornecedor_cnpj']

    db.commit()
    db.refresh(obj)
    
    if obj.vacina and obj.vacina.fabricante:
        obj.vacina.fabricante.cnpj = obj.vacina.fabricante.cnpj_fabricante
    
    return obj

@router.get("/lotes", response_model=list[schemas.LoteResponse])
def listar_lotes(db: Session = Depends(get_db)):
    lotes = (
        db.query(model.Lote)
        .options(
            joinedload(model.Lote.vacina).joinedload(model.Vacina.fabricante),
            joinedload(model.Lote.fornecedor)
        )
        .all()
    )
    
    for lote in lotes:
        if lote.fornecedor:
            lote.fornecedor_cnpj = lote.fornecedor.cnpj_fornecedor
            lote.fornecedor.cnpj = lote.fornecedor.cnpj_fornecedor 
            
        if lote.vacina and lote.vacina.fabricante:
            lote.vacina.fabricante.cnpj = lote.vacina.fabricante.cnpj_fabricante

    return lotes

@router.get("/lotes/{lote_id}", response_model=schemas.LoteResponse)
def buscar_lote(lote_id: int, db: Session = Depends(get_db)):
    obj = db.query(model.Lote).get(lote_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Lote não encontrado")
        
    if obj.fornecedor:
        obj.fornecedor.cnpj = obj.fornecedor.cnpj_fornecedor
    if obj.vacina and obj.vacina.fabricante:
        obj.vacina.fabricante.cnpj = obj.vacina.fabricante.cnpj_fabricante
        
    return obj

@router.delete("/lotes/{lote_id}")
def deletar_lote(lote_id: int, db: Session = Depends(get_db)):
    obj = db.query(model.Lote).get(lote_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Lote não encontrado")

    db.delete(obj)
    db.commit()
    return {"detail": "Lote removido com sucesso"}

# fornecedor

@router.post("/fornecedores", response_model=schemas.FornecedorResponse, status_code=201)
def criar_fornecedor(fornecedor: schemas.FornecedorCreate, db: Session = Depends(get_db)):
    if db.query(model.Fornecedor).get(fornecedor.cnpj):
        raise HTTPException(status_code=409, detail="Fornecedor já cadastrado.")

    obj = model.Fornecedor(
        cnpj_fornecedor=fornecedor.cnpj,
        nome=fornecedor.nome,
        telefone=fornecedor.telefone
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    
    obj.cnpj = obj.cnpj_fornecedor 
    return obj

@router.get("/fornecedores", response_model=list[schemas.FornecedorResponse])
def listar_fornecedores(db: Session = Depends(get_db)):
    fornecedores = db.query(model.Fornecedor).all()
    
    for f in fornecedores:
        f.cnpj = f.cnpj_fornecedor
        
    return fornecedores

@router.get("/fornecedores/busca", response_model=list[schemas.FornecedorResponse])
def buscar_fornecedor_por_nome(
    termo: str = Query(..., min_length=3, description="Nome do fornecedor"),
    db: Session = Depends(get_db)
):
    db.execute(text("SELECT set_limit(0.1);"))

    resultados = (
        db.query(model.Fornecedor)
        .filter(
            or_(
                model.Fornecedor.nome.ilike(f"%{termo}%"),
                model.Fornecedor.nome.op("<%")(termo)
            )
        )
        .order_by(
            func.similarity(model.Fornecedor.nome, termo).desc()
        )
        .limit(10)
        .all()
    )

    for f in resultados:
        f.cnpj = f.cnpj_fornecedor

    return resultados

@router.get("/fornecedores/{cnpj}", response_model=schemas.FornecedorResponse)
def buscar_fornecedor(cnpj: str, db: Session = Depends(get_db)):
    obj = db.query(model.Fornecedor).get(cnpj)
    if not obj:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
    
    obj.cnpj = obj.cnpj_fornecedor
    return obj

@router.put("/fornecedores/{cnpj}", response_model=schemas.FornecedorResponse)
def atualizar_fornecedor(
    cnpj: str,
    dados: schemas.FornecedorCreate,
    db: Session = Depends(get_db)
):
    obj = db.query(model.Fornecedor).get(cnpj)
    if not obj:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")

    obj.nome = dados.nome
    obj.telefone = dados.telefone

    db.commit()
    db.refresh(obj)
    
    obj.cnpj = obj.cnpj_fornecedor
    return obj

@router.delete("/fornecedores/{cnpj}", status_code=204)
def deletar_fornecedor(cnpj: str, db: Session = Depends(get_db)):
    obj = db.query(model.Fornecedor).get(cnpj)
    if not obj:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")

    lotes_vinculados = db.query(model.Lote).filter(model.Lote.fornecedor_cnpj == cnpj).count()
    if lotes_vinculados > 0:
         raise HTTPException(status_code=409, detail=f"Não é possível deletar. Existem {lotes_vinculados} lotes deste fornecedor.")

    db.delete(obj)
    db.commit()
    return None