from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from backend import model, schemas
from ..database import SessionLocal

router = APIRouter(
    prefix="/users",
    tags=["Usuários"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# paciente

@router.post("/pacientes", response_model=schemas.PacienteResponse)
def criar_paciente(paciente: schemas.PacienteCreate, db: Session = Depends(get_db)):
    obj = model.Paciente(**paciente.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.get("/pacientes", response_model=list[schemas.PacienteResponse])
def listar_pacientes(db: Session = Depends(get_db)):
    return db.query(model.Paciente).all()

@router.get("/pacientes/{paciente_id}", response_model=schemas.PacienteResponse)
def buscar_paciente(paciente_id: uuid.UUID, db: Session = Depends(get_db)):
    obj = db.query(model.Paciente).get(paciente_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    return obj

@router.put("/pacientes/{paciente_id}", response_model=schemas.PacienteResponse)
def atualizar_paciente(
    paciente_id: uuid.UUID,
    dados: schemas.UsuarioCreateCommon,
    db: Session = Depends(get_db)
):
    obj = db.query(model.Paciente).get(paciente_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")

    for campo, valor in dados.model_dump().items():
        setattr(obj, campo, valor)

    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/pacientes/{paciente_id}")
def deletar_paciente(paciente_id: uuid.UUID, db: Session = Depends(get_db)):
    obj = db.query(model.Paciente).get(paciente_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")

    db.delete(obj)
    db.commit()
    return {"detail": "Paciente removido com sucesso"}

# profissional

@router.post("/profissionais", response_model=schemas.ProfissionalResponse)
def criar_profissional(profissional: schemas.ProfissionalCreate, db: Session = Depends(get_db)):
    obj = model.Profissional(**profissional.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.get("/profissionais", response_model=list[schemas.ProfissionalResponse])
def listar_profissionais(db: Session = Depends(get_db)):
    return db.query(model.Profissional).all()

@router.get("/profissionais/{profissional_id}", response_model=schemas.ProfissionalResponse)
def buscar_profissional(profissional_id: uuid.UUID, db: Session = Depends(get_db)):
    obj = db.query(model.Profissional).get(profissional_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Profissional não encontrado")
    return obj

@router.put("/profissionais/{profissional_id}", response_model=schemas.ProfissionalResponse)
def atualizar_profissional(
    profissional_id: uuid.UUID,
    dados: schemas.UsuarioCreateCommon,
    db: Session = Depends(get_db)
):
    obj = db.query(model.Profissional).get(profissional_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Profissional não encontrado")

    for campo, valor in dados.model_dump().items():
        setattr(obj, campo, valor)

    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/profissionais/{profissional_id}")
def deletar_profissional(profissional_id: uuid.UUID, db: Session = Depends(get_db)):
    obj = db.query(model.Profissional).get(profissional_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Profissional não encontrado")

    db.delete(obj)
    db.commit()
    return {"detail": "Profissional removido com sucesso"}

# gestor

@router.post("/gestores", response_model=schemas.GestorResponse)
def criar_gestor(gestor: schemas.GestorCreate, db: Session = Depends(get_db)):
    obj = model.Gestor(**gestor.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.get("/gestores", response_model=list[schemas.GestorResponse])
def listar_gestores(db: Session = Depends(get_db)):
    return db.query(model.Gestor).all()

@router.get("/gestores/{gestor_id}", response_model=schemas.GestorResponse)
def buscar_gestor(gestor_id: uuid.UUID, db: Session = Depends(get_db)):
    obj = db.query(model.Gestor).get(gestor_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Gestor não encontrado")
    return obj

@router.put("/gestores/{gestor_id}", response_model=schemas.GestorResponse)
def atualizar_gestor(
    gestor_id: uuid.UUID,
    dados: schemas.UsuarioCreateCommon,
    db: Session = Depends(get_db)
):
    obj = db.query(model.Gestor).get(gestor_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Gestor não encontrado")

    for campo, valor in dados.model_dump().items():
        setattr(obj, campo, valor)

    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/gestores/{gestor_id}")
def deletar_gestor(gestor_id: uuid.UUID, db: Session = Depends(get_db)):
    obj = db.query(model.Gestor).get(gestor_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Gestor não encontrado")

    db.delete(obj)
    db.commit()
    return {"detail": "Gestor removido com sucesso"}

# admin

@router.post("/admins", response_model=schemas.AdminResponse)
def criar_admin(admin: schemas.AdminCreate, db: Session = Depends(get_db)):
    obj = model.Admin(**admin.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.get("/admins", response_model=list[schemas.AdminResponse])
def listar_admins(db: Session = Depends(get_db)):
    return db.query(model.Admin).all()

@router.get("/admins/{admin_id}", response_model=schemas.AdminResponse)
def buscar_admin(admin_id: uuid.UUID, db: Session = Depends(get_db)):
    obj = db.query(model.Admin).get(admin_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Admin não encontrado")
    return obj

@router.put("/admins/{admin_id}", response_model=schemas.AdminResponse)
def atualizar_admin(
    admin_id: uuid.UUID,
    dados: schemas.UsuarioCreateCommon,
    db: Session = Depends(get_db)
):
    obj = db.query(model.Admin).get(admin_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Admin não encontrado")

    for campo, valor in dados.model_dump().items():
        setattr(obj, campo, valor)

    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/admins/{admin_id}")
def deletar_admin(admin_id: uuid.UUID, db: Session = Depends(get_db)):
    obj = db.query(model.Admin).get(admin_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Admin não encontrado")

    db.delete(obj)
    db.commit()
    return {"detail": "Admin removido com sucesso"}