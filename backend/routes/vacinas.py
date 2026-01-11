from fastapi import APIRouter, Depends, HTTPException, status

from sqlalchemy import desc, func, or_
from sqlalchemy.orm import Session, joinedload
from database import SessionLocal
import schemas 
import model 

router = APIRouter(
    prefix="/vacinas",
    tags=["Vacinas"]
)

def get_db():
    db = SessionLocal()
    try: 
        yield db
    finally:
        db.close()


@router.get("", response_model=list[schemas.VacinaResponse])
def listar_vacinas(db: Session = Depends(get_db)): 
    return db.query(model.Vacina).all()

@router.post("", response_model=schemas.VacinaResponse)
def criar_vacina(vacina: schemas.VacinaCreate, db: Session = Depends(get_db)):
    obj = model.Vacina(**vacina.model_dump())
    db.add(vacina)
    db.commit()
    db.refresh(obj)

    return obj

@router.get("/buscar", response_model=list[schemas.BuscaVacina])
def buscar_vacinas(
    termo: str, 
    db: Session = Depends(get_db)
):

    vacinas = db.query(
        model.Vacina.codigo_vacina.label("id"),
        model.Vacina.nome.label("nome"),
        model.Fabricante.nome.label("fabricante")
        )\
        .join(model.Fabricante, model.Vacina.fabricante_cnpj == model.Fabricante.cnpj_fabricante)\
        .filter(
            or_(
                model.Vacina.nome.op("<%")(termo),
                model.Fabricante.nome.op("<%")(termo)
            )
        )\
        .order_by(func.least(func.similarity(model.Vacina.nome, termo), func.similarity(model.Fabricante.nome)))\
        .limit(10)\
        .all()

    return vacinas

@router.put("/{vacina_id}", response_model=schemas.VacinaResponse)
def atualizar_vacina(
    vacina_id: int,                  
    vacina_dados: schemas.VacinaCreate,
    db: Session = Depends(get_db)
):
    
    vacina_existente = db.query(model.Vacina).filter(model.Vacina.id == vacina_id).first()

    
    if not vacina_existente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Vacina não encontrada"
        )

    for key, value in vacina_dados.model_dump().items():
        setattr(vacina_existente, key, value)

    db.commit()
    db.refresh(vacina_existente)

    return vacina_existente

@router.delete("/{vacina_id}")
def deletar_vacina(vacina_id: str, db: Session = Depends(get_db)):
    obj = db.query(model.UnidadeDeSaude).get(vacina_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Vacina não encontrada")

    db.delete(obj)
    db.commit()
    return {"detail": "Vacina removida com sucesso"}

