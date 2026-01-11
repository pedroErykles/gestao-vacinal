from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, text
from sqlalchemy.exc import IntegrityError
import uuid
import model, schemas
from database import SessionLocal

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


# função auxiliar 
def tratar_erro_unico(e: IntegrityError):
    mensagem = str(e.orig).lower()

    if "email" in mensagem:
        raise HTTPException(
            status_code=409,
            detail="Já existe um usuário com este email"
        )
    if "cpf" in mensagem:
        raise HTTPException(
            status_code=409,
            detail="CPF já cadastrado"
        )
    if "telefone" in mensagem:
        raise HTTPException(
            status_code=409,
            detail="Telefone já cadastrado"
        )

    raise HTTPException(
        status_code=409,
        detail="Erro de integridade nos dados enviados"
    )


# busca por similaridade
@router.get("/pacientes/busca", response_model=list[schemas.BaseUsuarioBuscaResponse])
def buscar_pacientes(termo: str = Query(..., min_length=3), db: Session = Depends(get_db)):
    nome_completo = model.Paciente.pnome + " " + model.Paciente.unome
    
    results = (
        db.query(
            model.Usuario.id,
            nome_completo.label("nome_completo")
            )
        .filter(
            model.Usuario.role == model.RoleEnum.PACIENTE,
            or_(
                nome_completo.self_group().ilike(f"%{termo}%"),
                nome_completo.self_group().op("<%", is_comparison=True)(termo)
            ),
            
        )
        .order_by(func.similarity(nome_completo, termo).desc())
        .limit(10)
        .all()
    )

    return results

@router.get("profissionais/busca")
def fuzzysearch_profissional(termo: str = Query(..., min_length=3), db: Session = Depends(get_db)):
    nome_completo = model.Profissional.pnome + " " + model.Profissional.unome
    
    results = (
        db.query(
            model.Usuario.id,
            nome_completo.label("nome_completo")
            )
        .filter(
            model.Usuario.role == model.RoleEnum.PROFISSIONAL,
            or_(
                nome_completo.self_group().ilike(f"%{termo}%"),
                nome_completo.self_group().op("<%", is_comparison=True)(termo)
            ),
            
        )
        .order_by(func.similarity(nome_completo, termo).desc())
        .limit(10)
        .all()
    )

    return results

@router.get("gestores/busca")
def fuzzysearch_gestores(termo: str = Query(..., min_length=3), db: Session = Depends(get_db)):
    nome_completo = model.Gestor.pnome + " " + model.Gestor.unome
    
    results = (
        db.query(
            model.Usuario.id,
            nome_completo.label("nome_completo")
            )
        .filter(
            model.Usuario.role == model.RoleEnum.GESTOR,
            or_(
                nome_completo.self_group().ilike(f"%{termo}%"),
                nome_completo.self_group().op("<%", is_comparison=True)(termo)
            ),
            
        )
        .order_by(func.similarity(nome_completo, termo).desc())
        .limit(10)
        .all()
    )

    return results

@router.get("admins/busca")
def fuzzysearch_admin(termo: str = Query(..., min_length=3), db: Session = Depends(get_db)):
    nome_completo = model.Admin.pnome + " " + model.Admin.unome

    db.execute(text("SELECT set_limit(0.3);"))
    
    results = (
        db.query(
            model.Usuario.id,
            nome_completo.label("nome_completo")
            )
        .filter(
            model.Usuario.role == model.RoleEnum.ADMIN,
            or_(
                nome_completo.self_group().ilike(f"%{termo}%"),
                nome_completo.self_group().op("<%", is_comparison=True)(termo)
            ),
            
        )
        .order_by(func.similarity(nome_completo, termo).desc())
        .limit(10)
        .all()
    )

    return results


# paciente

@router.post("/pacientes", response_model=schemas.PacienteResponse)
def criar_paciente(paciente: schemas.PacienteCreate, db: Session = Depends(get_db)):
    obj = model.Paciente(**paciente.model_dump())
    db.add(obj)
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        tratar_erro_unico(e)

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

    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        tratar_erro_unico(e)

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
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        tratar_erro_unico(e)

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

    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        tratar_erro_unico(e)

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
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        tratar_erro_unico(e)

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

    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        tratar_erro_unico(e)

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
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        tratar_erro_unico(e)

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
    
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        tratar_erro_unico(e)

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