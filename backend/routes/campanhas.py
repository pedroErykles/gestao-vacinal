from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import model, schemas
from database import SessionLocal
router = APIRouter()

def get_db():
    db = SessionLocal()
    try: 
        yield db
    finally:
        db.close()


@router.post("/", response_model=schemas.CampanhaResponse)
def criar_campanha(campanha: schemas.CampanhaCreate, db: Session = Depends(get_db)):
    admin = db.get(model.Admin, campanha.admin_id)
    if not admin:
        raise HTTPException(status_code=404, detail="Admin não encontrado")

    db_campanha = model.Campanha(
        data_inicio=campanha.data_inicio,
        data_fim=campanha.data_fim,
        nome=campanha.nome,
        admin_id=campanha.admin_id
    )

    db.add(db_campanha)
    db.commit()
    db.refresh(db_campanha)
    return db_campanha


@router.get("/", response_model=list[schemas.CampanhaResponse])
def listar_campanhas(db: Session = Depends(get_db)):
    return db.query(model.Campanha).all()


@router.get("/{campanha_id}", response_model=schemas.CampanhaResponse)
def buscar_campanha(campanha_id: int, db: Session = Depends(get_db)):
    campanha = db.get(model.Campanha, campanha_id)
    if not campanha:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    return campanha


@router.put("/{campanha_id}", response_model=schemas.CampanhaResponse)
def atualizar_campanha(campanha_id: int, dados: schemas.CampanhaCreate, db: Session = Depends(get_db)):
    campanha = db.get(model.Campanha, campanha_id)
    if not campanha:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")

    campanha.data_inicio = dados.data_inicio
    campanha.data_fim = dados.data_fim
    campanha.nome = dados.nome
    campanha.admin_id = dados.admin_id

    db.commit()
    db.refresh(campanha)
    return campanha


@router.delete("/{campanha_id}")
def deletar_campanha(campanha_id: int, db: Session = Depends(get_db)):
    campanha = db.get(model.Campanha, campanha_id)
    if not campanha:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")

    db.delete(campanha)
    db.commit()
    return {"detail": "Campanha removida com sucesso"}


# publicação de campanha

@router.post("/publicacoes")
def criar_publicacao(publicacao: schemas.PublicacaoCreate, db: Session = Depends(get_db)):
    campanha = db.get(model.Campanha, publicacao.campanha_id)
    vacina = db.get(model.Vacina, publicacao.vacina_id)

    if not campanha or not vacina:
        raise HTTPException(
            status_code=404,
            detail="Campanha ou vacina não encontrada"
        )

    existente = (
        db.query(model.Publicacao)
        .filter_by(
            campanha_id=publicacao.campanha_id,
            vacina_id=publicacao.vacina_id
        )
        .first()
    )

    if existente:
        raise HTTPException(
            status_code=400,
            detail="Essa vacina já está publicada nessa campanha"
        )

    db_publicacao = model.Publicacao(
        campanha_id=publicacao.campanha_id,
        vacina_id=publicacao.vacina_id
    )

    db.add(db_publicacao)
    db.commit()
    return {"detail": "Publicação criada com sucesso"}


@router.get("/publicacoes")
def listar_publicacoes(db: Session = Depends(get_db)):
    return db.query(model.Publicacao).all()


@router.delete("/publicacoes")
def deletar_publicacao(campanha_id: int, vacina_id: int, db: Session = Depends(get_db)):
    publicacao = (
        db.query(model.Publicacao)
        .filter_by(
            campanha_id=campanha_id,
            vacina_id=vacina_id
        )
        .first()
    )

    if not publicacao:
        raise HTTPException(status_code=404, detail="Publicação não encontrada")

    db.delete(publicacao)
    db.commit()
    return {"detail": "Publicação removida com sucesso"}