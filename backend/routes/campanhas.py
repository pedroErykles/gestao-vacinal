from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status, Depends
from sqlalchemy.orm import Session, joinedload
import schemas
import model
from database import SessionLocal

router = APIRouter(
    prefix="/campanhas",
    tags=["Gestão de Campanhas"]
)

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

@router.get("/", response_model=list[schemas.CampanhaResponse])
def listar_campanhas(db: Session = Depends(get_db)):
    return db.query(model.Campanha).options(joinedload(model.Campanha.publicacoes)).all()

@router.get("/{id_campanha}", response_model=schemas.CampanhaResponse)
def obter_campanha(id_campanha: int, db: Session = Depends(get_db)):
    campanha = db.query(model.Campanha)\
        .options(joinedload(model.Campanha.publicacoes))\
        .filter(model.Campanha.id_campanha == id_campanha)\
        .first()
        
    if not campanha:
        raise HTTPException(status_code=404, detail="Campanha não encontrada.")
    return campanha

@router.post("/", response_model=schemas.CampanhaResponse, status_code=status.HTTP_201_CREATED)
def criar_campanha(dados: schemas.CampanhaCreate, db: Session = Depends(get_db)):

    nova_campanha = model.Campanha(
        nome=dados.nome,
        data_inicio=dados.data_inicio,
        data_fim=dados.data_fim,
        admin_id=dados.admin_id,
        
        publico_alvo=dados.publico_alvo,
        descricao=dados.descricao,
        ativa=dados.ativa
    )
    
    db.add(nova_campanha)
    db.flush() 

    if dados.vacina_ids:
        for vac_id in set(dados.vacina_ids):
            db.add(model.Publicacao(campanha_id=nova_campanha.id_campanha, vacina_id=vac_id))

    db.commit()
    db.refresh(nova_campanha)
    return nova_campanha

@router.put("/{id_campanha}", response_model=schemas.CampanhaResponse)
def atualizar_campanha(id_campanha: int, dados: schemas.CampanhaCreate, db: Session = Depends(get_db)):
    campanha = db.query(model.Campanha).get(id_campanha)
    if not campanha:
        raise HTTPException(status_code=404, detail="Campanha não encontrada.")

    campanha.nome = dados.nome
    campanha.data_inicio = dados.data_inicio
    campanha.data_fim = dados.data_fim
    campanha.admin_id = dados.admin_id
    
    campanha.publico_alvo = dados.publico_alvo
    campanha.descricao = dados.descricao
    campanha.ativa = dados.ativa

    db.query(model.Publicacao).filter(model.Publicacao.campanha_id == id_campanha).delete()
    
    if dados.vacina_ids:
        for vac_id in set(dados.vacina_ids):
            db.add(model.Publicacao(campanha_id=id_campanha, vacina_id=vac_id))

    db.commit()
    db.refresh(campanha)
    return campanha

@router.delete("/{id_campanha}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_campanha(id_campanha: int, db: Session = Depends(get_db)):
    campanha = db.get(model.Campanha, id_campanha)
    if not campanha:
        raise HTTPException(status_code=404, detail="Campanha não encontrada.")

    db.query(model.Publicacao).filter(model.Publicacao.campanha_id == id_campanha).delete()
    
    db.delete(campanha)
    db.commit()
    return None
