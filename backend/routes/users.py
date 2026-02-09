from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, text
import uuid
from model import Usuario, RoleEnum

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

# paciente

@router.get("/pacientes", response_model=list[schemas.PacienteResponse])
def listar_pacientes(db: Session = Depends(get_db)):
    return db.query(model.Paciente).all()

@router.get("/pacientes/busca", response_model=list[schemas.BaseUsuarioBuscaResponse])
def buscar_pacientes(termo: str = Query(..., min_length=3), db: Session = Depends(get_db)):    
    results = (
        db.query(
            model.Usuario.id,
            model.Usuario.nome.label("nome"),
            model.Usuario.cpf_usuario.label("cpf")
            )
        .filter(
            Usuario.role == RoleEnum.PACIENTE,
            or_(
                model.Usuario.nome.self_group().ilike(f"%{termo}%"),
                model.Usuario.nome.self_group().op("<%", is_comparison=True)(termo),

                model.Usuario.cpf_usuario.ilike(f"%{termo}%")
            ),
            
        )
        .order_by(func.similarity(model.Usuario.nome, termo).desc())
        .limit(10)
        .all()
    )

    return results

@router.get("/pacientes/{paciente_id}", response_model=schemas.PacienteResponse)
def buscar_paciente(paciente_id: uuid.UUID, db: Session = Depends(get_db)):
    obj = db.query(model.Paciente).get(paciente_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    return obj


@router.post("/pacientes", response_model=schemas.PacienteResponse)
def criar_paciente(paciente: schemas.UsuarioBase, db: Session = Depends(get_db)):

    usuarios_existentes = db.query(model.Usuario).filter(
        or_(
            model.Usuario.cpf_usuario == paciente.cpf_usuario,
            model.Usuario.email == paciente.email,
            model.Usuario.telefone == paciente.telefone
        )
    ).all()

    if usuarios_existentes:
        campos_conflitantes = []
        
        for usuario in usuarios_existentes:
            if usuario.cpf_usuario == paciente.cpf_usuario:
                campos_conflitantes.append("CPF")
            if usuario.email == paciente.email:
                campos_conflitantes.append("Email")
            if usuario.telefone == paciente.telefone:
                campos_conflitantes.append("Telefone")
        
        campos_limpos = sorted(list(set(campos_conflitantes)))
        msg_erro = ", ".join(campos_limpos)

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Os seguintes campos já estão cadastrados: {msg_erro}"
        )

    obj = model.Paciente(**paciente.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
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

    conflitos = db.query(model.Usuario).filter(
        model.Usuario.id != paciente_id,
        or_(
            model.Usuario.cpf_usuario == dados.cpf_usuario,
            model.Usuario.email == dados.email,
            model.Usuario.telefone == dados.telefone
        )
    ).all()

    if conflitos:
        campos_conflitantes = []
        for usuario in conflitos:
            if usuario.cpf_usuario == dados.cpf_usuario:
                campos_conflitantes.append("CPF")
            if usuario.email == dados.email:
                campos_conflitantes.append("Email")
            if usuario.telefone == dados.telefone:
                campos_conflitantes.append("Telefone")
        
        campos_limpos = sorted(list(set(campos_conflitantes)))
        msg_erro = ", ".join(campos_limpos)

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Não foi possível atualizar. Campos já em uso por outro usuário: {msg_erro}"
        )

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

@router.get("/profissionais", response_model=list[schemas.ProfissionalResponse])
def listar_profissionais(db: Session = Depends(get_db)):
    return db.query(model.Profissional).all()

@router.get("/profissionais/busca", response_model=list[schemas.BaseUsuarioBuscaResponse])
def fuzzysearch_profissional(termo: str = Query(..., min_length=3), db: Session = Depends(get_db)):
    results = (
        db.query(
            model.Usuario.id,
            model.Usuario.nome.label("nome"),
            model.Usuario.cpf_usuario.label("cpf")
            )
        .filter(
            Usuario.role == RoleEnum.PROFISSIONAL,
            or_(
                model.Usuario.nome.self_group().ilike(f"%{termo}%"),
                model.Usuario.nome.self_group().op("<%", is_comparison=True)(termo)
            ),
            
        )
        .order_by(func.similarity(model.Usuario.nome, termo).desc())
        .limit(10)
        .all()
    )

    return results


@router.get("/profissionais/{profissional_id}", response_model=schemas.ProfissionalResponse)
def buscar_profissional(profissional_id: uuid.UUID, db: Session = Depends(get_db)):
    obj = db.query(model.Profissional).get(profissional_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Profissional não encontrado")
    return obj


@router.post("/profissionais", response_model=schemas.ProfissionalResponse)
def criar_profissional(profissional: schemas.ProfissionalCreate, db: Session = Depends(get_db)):
    usuarios_existentes = db.query(model.Usuario).filter(
        or_(
            model.Usuario.cpf_usuario == profissional.cpf_usuario,
            model.Usuario.email == profissional.email,
            model.Usuario.telefone == profissional.telefone
        )
    ).all()

    if usuarios_existentes:
        campos_conflitantes = []
        
        for usuario in usuarios_existentes:
            if usuario.cpf_usuario == profissional.cpf_usuario:
                campos_conflitantes.append("CPF")
            if usuario.email == profissional.email:
                campos_conflitantes.append("Email")
            if usuario.telefone == profissional.telefone:
                campos_conflitantes.append("Telefone")
        
        campos_limpos = sorted(list(set(campos_conflitantes)))
        msg_erro = ", ".join(campos_limpos)

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Os seguintes campos já estão cadastrados: {msg_erro}"
        )

    obj = model.Profissional(**profissional.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
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

    conflitos = db.query(model.Usuario).filter(
        model.Usuario.id != profissional_id,
        or_(
            model.Usuario.cpf_usuario == dados.cpf_usuario,
            model.Usuario.email == dados.email,
            model.Usuario.telefone == dados.telefone
        )
    ).all()

    if conflitos:
        campos_conflitantes = []
        for usuario in conflitos:
            if usuario.cpf_usuario == dados.cpf_usuario:
                campos_conflitantes.append("CPF")
            if usuario.email == dados.email:
                campos_conflitantes.append("Email")
            if usuario.telefone == dados.telefone:
                campos_conflitantes.append("Telefone")
        
        campos_limpos = sorted(list(set(campos_conflitantes)))
        msg_erro = ", ".join(campos_limpos)

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Não foi possível atualizar. Campos já em uso por outro usuário: {msg_erro}"
        )

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
    usuarios_existentes = db.query(model.Usuario).filter(
        or_(
            model.Usuario.cpf_usuario == gestor.cpf_usuario,
            model.Usuario.email == gestor.email,
            model.Usuario.telefone == gestor.telefone
        )
    ).all()

    if usuarios_existentes:
        campos_conflitantes = []
        
        for usuario in usuarios_existentes:
            if usuario.cpf_usuario == gestor.cpf_usuario:
                campos_conflitantes.append("CPF")
            if usuario.email == gestor.email:
                campos_conflitantes.append("Email")
            if usuario.telefone == gestor.telefone:
                campos_conflitantes.append("Telefone")
        
        campos_limpos = sorted(list(set(campos_conflitantes)))
        msg_erro = ", ".join(campos_limpos)

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Os seguintes campos já estão cadastrados: {msg_erro}"
        )

    obj = model.Gestor(**gestor.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.get("/gestores", response_model=list[schemas.GestorResponse])
def listar_gestores(db: Session = Depends(get_db)):
    return db.query(model.Gestor).all()

@router.get("/gestores/busca", response_model=list[schemas.BaseUsuarioBuscaResponse])
def fuzzysearch_gestores(termo: str = Query(..., min_length=3), db: Session = Depends(get_db)):
    
    results = (
        db.query(
            model.Usuario.id,
            model.Usuario.nome.label("nome")
            )
        .filter(
            Usuario.role == RoleEnum.GESTOR,
            or_(
                model.Usuario.nome.self_group().ilike(f"%{termo}%"),
                model.Usuario.nome.self_group().op("<%", is_comparison=True)(termo)
            ),
            
        )
        .order_by(func.similarity(model.Usuario.nome, termo).desc())
        .limit(10)
        .all()
    )

    return results

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

    conflitos = db.query(model.Usuario).filter(
        model.Usuario.id != gestor_id,
        or_(
            model.Usuario.cpf_usuario == dados.cpf_usuario,
            model.Usuario.email == dados.email,
            model.Usuario.telefone == dados.telefone
        )
    ).all()

    if conflitos:
        campos_conflitantes = []
        for usuario in conflitos:
            if usuario.cpf_usuario == dados.cpf_usuario:
                campos_conflitantes.append("CPF")
            if usuario.email == dados.email:
                campos_conflitantes.append("Email")
            if usuario.telefone == dados.telefone:
                campos_conflitantes.append("Telefone")
        
        campos_limpos = sorted(list(set(campos_conflitantes)))
        msg_erro = ", ".join(campos_limpos)

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Não foi possível atualizar. Campos já em uso por outro usuário: {msg_erro}"
        )

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
    usuarios_existentes = db.query(model.Usuario).filter(
        or_(
            model.Usuario.cpf_usuario == admin.cpf_usuario,
            model.Usuario.email == admin.email,
            model.Usuario.telefone == admin.telefone
        )
    ).all()

    if usuarios_existentes:
        campos_conflitantes = []
        
        for usuario in usuarios_existentes:
            if usuario.cpf_usuario == admin.cpf_usuario:
                campos_conflitantes.append("CPF")
            if usuario.email == admin.email:
                campos_conflitantes.append("Email")
            if usuario.telefone == admin.telefone:
                campos_conflitantes.append("Telefone")
        
        campos_limpos = sorted(list(set(campos_conflitantes)))
        msg_erro = ", ".join(campos_limpos)

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Os seguintes campos já estão cadastrados: {msg_erro}"
        )

    obj = model.Admin(**admin.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.get("/admins", response_model=list[schemas.AdminResponse])
def listar_admins(db: Session = Depends(get_db)):
    return db.query(model.Admin).all()

@router.get("/admins/busca", response_model=list[schemas.BaseUsuarioBuscaResponse])
def fuzzysearch_admin(termo: str = Query(..., min_length=3), db: Session = Depends(get_db)):
    results = (
        db.query(
            model.Usuario.id,
            model.Usuario.nome.label("nome"),
            model.Usuario.cpf_usuario.label("cpf")
            )
        .filter(
            Usuario.role == RoleEnum.ADMIN,
            or_(
                model.Usuario.nome.self_group().ilike(f"%{termo}%"),
                model.Usuario.nome.self_group().op("<%", is_comparison=True)(termo)
            ),
            
        )
        .order_by(func.similarity(model.Usuario.nome, termo).desc())
        .limit(10)
        .all()
    )

    return results


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

    conflitos = db.query(model.Usuario).filter(
        model.Usuario.id != admin_id,
        or_(
            model.Usuario.cpf_usuario == dados.cpf_usuario,
            model.Usuario.email == dados.email,
            model.Usuario.telefone == dados.telefone
        )
    ).all()

    if conflitos:
        campos_conflitantes = []
        for usuario in conflitos:
            if usuario.cpf_usuario == dados.cpf_usuario:
                campos_conflitantes.append("CPF")
            if usuario.email == dados.email:
                campos_conflitantes.append("Email")
            if usuario.telefone == dados.telefone:
                campos_conflitantes.append("Telefone")
        
        campos_limpos = sorted(list(set(campos_conflitantes)))
        msg_erro = ", ".join(campos_limpos)

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Não foi possível atualizar. Campos já em uso por outro usuário: {msg_erro}"
        )

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