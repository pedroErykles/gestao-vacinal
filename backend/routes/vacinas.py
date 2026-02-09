from sqlalchemy.exc import IntegrityError
from fastapi import APIRouter, Depends, HTTPException, Query, status

from sqlalchemy import desc, func, or_, text
from sqlalchemy.orm import Session, joinedload 
from database import SessionLocal
import schemas 
import model 

router = APIRouter(
    tags=["Vacinas"],
)

def get_db():
    db = SessionLocal()
    try: 
        yield db
    finally:
        db.close()

@router.post("/fabricantes", response_model=schemas.FabricanteResponse, status_code=status.HTTP_201_CREATED)
def criar_fabricante(fabricante: schemas.FabricanteCreate, db: Session = Depends(get_db)):
    existe = db.query(model.Fabricante).get(fabricante.cnpj)
    if existe:
        raise HTTPException(status_code=409, detail="CNPJ já cadastrado.")

    novo_fabricante = model.Fabricante(
        cnpj_fabricante=fabricante.cnpj, 
        nome=fabricante.nome,
        telefone=fabricante.telefone
    )
    
    db.add(novo_fabricante)
    db.commit()
    db.refresh(novo_fabricante)
    
    return novo_fabricante 

@router.get("/fabricantes", response_model=list[schemas.FabricanteResponse])
def listar_fabricantes(db: Session = Depends(get_db)):
    return db.query(model.Fabricante).all()

@router.get("/fabricantes/busca", response_model=list[schemas.FabricanteResponse])
def buscar_fabricante(
    termo: str = Query(..., min_length=3, description="Nome do fabricante ou parte do CNPJ"),
    db: Session = Depends(get_db)
):
    db.execute(text("SELECT set_limit(0.3);")) 

    resultados = (
        db.query(model.Fabricante)
        .filter(
            or_(
                model.Fabricante.nome.op("%")(termo),
                model.Fabricante.nome.ilike(f"%{termo}%"),
                model.Fabricante.cnpj_fabricante.ilike(f"%{termo}%")
            )
        )
        .order_by(
            func.similarity(model.Fabricante.nome, termo).desc()
        )
        .limit(10)
        .all()
    )

    return resultados

@router.put("/fabricantes/{cnpj}", response_model=schemas.FabricanteResponse)
def atualizar_fabricante(cnpj: str, dados: schemas.FabricanteBase, db: Session = Depends(get_db)):
    fabricante = db.query(model.Fabricante).get(cnpj)
    if not fabricante:
        raise HTTPException(status_code=404, detail="Fabricante não encontrado")
    
    fabricante.nome = dados.nome
    fabricante.telefone = dados.telefone
    
    db.commit()
    db.refresh(fabricante)
    
    return fabricante

@router.delete("/fabricantes/{cnpj}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_fabricante(cnpj: str, db: Session = Depends(get_db)):
    fabricante = db.query(model.Fabricante).get(cnpj)
    if not fabricante:
        raise HTTPException(status_code=404, detail="Fabricante não encontrado")

    qtd_vacinas = db.query(model.Vacina).filter(model.Vacina.fabricante_cnpj == cnpj).count()
    if qtd_vacinas > 0:
        raise HTTPException(status_code=409, detail=f"Impossível deletar: Existem {qtd_vacinas} vacinas deste fabricante.")

    db.delete(fabricante)
    db.commit()


@router.post("/vacinas", response_model=schemas.VacinaResponse, status_code=status.HTTP_201_CREATED)
def criar_vacina(vacina: schemas.VacinaCreate, db: Session = Depends(get_db)):
    fab = db.query(model.Fabricante).get(vacina.fabricante_cnpj)
    if not fab:
        raise HTTPException(status_code=404, detail="Fabricante informado não encontrado.")

    nova_vacina = model.Vacina(**vacina.model_dump())
    
    db.add(nova_vacina)
    db.flush()

    try:
        for i in range(1, nova_vacina.quantidade_doses + 1):
            
        
            dias_intervalo = 0 if i == 1 else nova_vacina.intervalo_doses
            
            nova_dose = model.Dose(
                numero=i,
                intervalo=dias_intervalo,
                vacina_id=nova_vacina.codigo_vacina
            )
            db.add(nova_dose)

        db.commit()
        db.refresh(nova_vacina)
        return nova_vacina

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao criar esquema vacinal: {str(e)}")


@router.get("/vacinas", response_model=list[schemas.VacinaResponse])
def listar_vacinas(db: Session = Depends(get_db)):
    lista = db.query(model.Vacina).options(joinedload(model.Vacina.fabricante)).all()
    
    return lista


@router.put("/vacinas/{vacina_id}", response_model=schemas.VacinaResponse)
def atualizar_vacina(vacina_id: int, dados: schemas.VacinaCreate, db: Session = Depends(get_db)):
    vacina_bd = db.query(model.Vacina).filter(model.Vacina.codigo_vacina == vacina_id).first()

    if not vacina_bd:
        raise HTTPException(status_code=404, detail="Vacina não encontrada")

    if dados.fabricante_cnpj != vacina_bd.fabricante_cnpj:
         if not db.query(model.Fabricante).get(dados.fabricante_cnpj):
             raise HTTPException(status_code=404, detail="Novo fabricante não encontrado.")


    precisa_recriar_doses = (
        dados.quantidade_doses != vacina_bd.quantidade_doses or 
        dados.intervalo_doses != vacina_bd.intervalo_doses
    )

    try:
        for key, value in dados.model_dump().items():
            setattr(vacina_bd, key, value)

        if precisa_recriar_doses:
            db.query(model.Dose).filter(model.Dose.vacina_id == vacina_id).delete()
            
            for i in range(1, dados.quantidade_doses + 1):
                dias_intervalo = 0 if i == 1 else dados.intervalo_doses
                
                nova_dose = model.Dose(
                    numero=i,
                    intervalo=dias_intervalo,
                    vacina_id=vacina_id
                )
                db.add(nova_dose)

        db.commit()
        db.refresh(vacina_bd)
        return vacina_bd

    except Exception as e:
        db.rollback()
        if "foreign key constraint" in str(e).lower() or "update or delete on table" in str(e).lower():
            raise HTTPException(
                status_code=409, 
                detail="Não é possível alterar a quantidade de doses ou intervalo pois JÁ EXISTEM APLICAÇÕES registradas com o esquema antigo."
            )
        
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar vacina: {str(e)}")

@router.get("/vacinas/busca", response_model=list[schemas.BuscaVacinaResponse])
def buscar_vacinas(
    termo: str = Query(..., min_length=3, description="Busca vacina ou fabricante"), 
    db: Session = Depends(get_db)
):
    db.execute(text("SELECT set_limit(0.1);"))

    vacinas = (
        db.query(
            model.Vacina.codigo_vacina.label("id"),
            model.Vacina.nome.label("nome"),
            model.Fabricante.nome.label("fabricante_nome")
        )
        .join(model.Fabricante, model.Vacina.fabricante_cnpj == model.Fabricante.cnpj_fabricante)
        .filter(
            or_(
                model.Vacina.nome.ilike(f"%{termo}%"),
                model.Fabricante.nome.ilike(f"%{termo}%"),
                model.Vacina.nome.op("<%")(termo),
                model.Fabricante.nome.op("<%")(termo)
            )
        )
        .order_by(
            func.greatest(
                func.similarity(model.Vacina.nome, termo),
                func.similarity(model.Fabricante.nome, termo)
            ).desc()
        )
        .limit(20)
        .all()
    )

    return vacinas

@router.delete("/vacinas/{vacina_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_vacina(vacina_id: int, db: Session = Depends(get_db)):
    obj = db.query(model.Vacina).filter(model.Vacina.codigo_vacina == vacina_id).first()
    
    if not obj:
        raise HTTPException(status_code=404, detail="Vacina não encontrada")
    


    try:
        db.delete(obj)
        db.commit()

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Não é possível excluir esta vacina pois já existem aplicações registradas com ela. Considere desativá-la em vez de excluir."
        )
    return None
