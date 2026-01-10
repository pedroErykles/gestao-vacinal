from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

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

@router.post("/unidades", response_model=schemas.UnidadeResponse)
def criar_unidade(unidade: schemas.UnidadeCreate, db: Session = Depends(get_db)):
    obj = model.UnidadeDeSaude(**unidade.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.get("/unidades", response_model=list[schemas.UnidadeResponse])
def listar_unidades(db: Session = Depends(get_db)):
    return db.query(model.UnidadeDeSaude).all()

@router.get("/unidades/busca", response_model=list[schemas.BuscaUnidade])
def fuzzysearch_unidades(termo: str = Query(..., min_length=3), db: Session = Depends(get_db)):
    results = (
        db.query(
            model.UnidadeDeSaude.id,
            model.UnidadeDeSaude.nome_unidade
            )
        .filter(
            func.similarity(model.UnidadeDeSaude.nome_unidade, termo) > 0.15
        )
        .order_by(func.similarity(model.UnidadeDeSaude.nome_unidade, termo).desc())
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

@router.delete("/unidades/{nome_unidade}")
def deletar_unidade(nome_unidade: str, db: Session = Depends(get_db)):
    obj = db.query(model.UnidadeDeSaude).get(nome_unidade)
    if not obj:
        raise HTTPException(status_code=404, detail="Unidade não encontrada")

    db.delete(obj)
    db.commit()
    return {"detail": "Unidade removida com sucesso"}

# estoque

@router.post("/estoques", response_model=schemas.EstoqueResponse)
def criar_estoque(estoque: schemas.EstoqueCreate, db: Session = Depends(get_db)):
    unidade = db.query(model.UnidadeDeSaude).get(estoque.nome_unidade)
    if not unidade:
        raise HTTPException(status_code=404, detail="Unidade não encontrada")

    obj = model.Estoque(**estoque.model_dump())
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

@router.delete("/estoques/{estoque_id}")
def deletar_estoque(estoque_id: int, db: Session = Depends(get_db)):
    obj = db.query(model.Estoque).get(estoque_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Estoque não encontrado")

    db.delete(obj)
    db.commit()
    return {"detail": "Estoque removido com sucesso"}

# lote

@router.post("/lotes", response_model=schemas.LoteResponse)
def criar_lote(lote: schemas.LoteCreate, db: Session = Depends(get_db)):
    estoque = db.query(model.Estoque).get(lote.estoque_id)
    if not estoque:
        raise HTTPException(status_code=404, detail="Estoque não encontrado")

    obj = model.Lote(**lote.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.get("/lotes", response_model=list[schemas.LoteResponse])
def listar_lotes(db: Session = Depends(get_db)):
    return db.query(model.Lote).all()

@router.get("/lotes/{lote_id}", response_model=schemas.LoteResponse)
def buscar_lote(lote_id: int, db: Session = Depends(get_db)):
    obj = db.query(model.Lote).get(lote_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Lote não encontrado")
    return obj

@router.put("/lotes/{lote_id}", response_model=schemas.LoteResponse)
def atualizar_lote(
    lote_id: int,
    dados: schemas.LoteCreate,
    db: Session = Depends(get_db)
):
    obj = db.query(model.Lote).get(lote_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Lote não encontrado")

    for campo, valor in dados.model_dump().items():
        setattr(obj, campo, valor)

    db.commit()
    db.refresh(obj)
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

@router.post("/fornecedores", response_model=schemas.FornecedorResponse)
def criar_fornecedor(fornecedor: schemas.FornecedorCreate, db: Session = Depends(get_db)):
    obj = model.Fornecedor(
        cnpj_fornecedor=fornecedor.cnpj,
        nome=fornecedor.nome,
        telefone=fornecedor.telefone
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.get("/fornecedores", response_model=list[schemas.FornecedorResponse])
def listar_fornecedores(db: Session = Depends(get_db)):
    return db.query(model.Fornecedor).all()

@router.get("/fornecedores/{cnpj}", response_model=schemas.FornecedorResponse)
def buscar_fornecedor(cnpj: str, db: Session = Depends(get_db)):
    obj = db.query(model.Fornecedor).get(cnpj)
    if not obj:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
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
    return obj

@router.delete("/fornecedores/{cnpj}")
def deletar_fornecedor(cnpj: str, db: Session = Depends(get_db)):
    obj = db.query(model.Fornecedor).get(cnpj)
    if not obj:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")

    db.delete(obj)
    db.commit()
    return {"detail": "Fornecedor removido com sucesso"}