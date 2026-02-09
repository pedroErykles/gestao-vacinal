from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import exists, select
from datetime import datetime
import uuid
from typing import List

import schemas 
import model 
from database import SessionLocal

router = APIRouter(
    tags=["Logística de Aplicacões e Esquema Vacinal"]
)

def get_db():
    db = SessionLocal()
    try: 
        yield db
    finally:
        db.close()

@router.post("/aplicacoes", response_model=schemas.AplicacaoResponse, status_code=status.HTTP_201_CREATED)
def registrar_aplicacao(aplicacao: schemas.AplicacaoCreate, db: Session = Depends(get_db)):
    unidade = db.get(model.UnidadeDeSaude, aplicacao.unidade_id)
    
    if not unidade:
        raise HTTPException(status_code=404, detail=f"Unidade com ID '{aplicacao.unidade_id}' não encontrada")

    stmt_lote = select(model.Lote).where(model.Lote.id_lote == aplicacao.lote_id).with_for_update()
    lote = db.scalar(stmt_lote)

    if not lote:
        raise HTTPException(status_code=404, detail="Lote não encontrado")
    
    if lote.quantidade <= 0:
        raise HTTPException(status_code=400, detail="Lote sem estoque disponível")
    
    if aplicacao.data and lote.validade > aplicacao.data: 
        raise HTTPException(status_code=400, detail="Lote vencido, não é possível registar aplicação")

    dose_obj = db.get(model.Dose, aplicacao.dose_id)
    if not dose_obj:
        raise HTTPException(status_code=404, detail=f"Dose com id {aplicacao.dose_id} não encontrada.")

    if dose_obj.vacina_id != lote.vacina_id:
        raise HTTPException(status_code=400, detail="Erro de Segurança: Vacina do lote não bate com a vacina da dose.")

    if not db.get(model.Paciente, aplicacao.paciente_id):
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    if not db.get(model.Profissional, aplicacao.profissional_id):
        raise HTTPException(status_code=404, detail="Profissional não encontrado")
    if not db.get(model.Admin, aplicacao.admin_id):
        raise HTTPException(status_code=404, detail="Admin não encontrado")

    lote.quantidade -= 1
    
    nova_aplicacao = model.Aplicacao(
        data=aplicacao.data if aplicacao.data else datetime.now(),
        paciente_id=aplicacao.paciente_id,
        profissional_id=aplicacao.profissional_id,
        admin_id=aplicacao.admin_id,
        
        
        unidade_id=str(aplicacao.unidade_id), 
        
        dose_id=aplicacao.dose_id,
        lote_id=aplicacao.lote_id,
        observacoes=aplicacao.observacoes
    )

    db.add(nova_aplicacao)
    
    try:
        db.commit()
        db.refresh(nova_aplicacao)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

    
    _ = nova_aplicacao.unidade

    return nova_aplicacao

@router.put("/aplicacoes/{id_aplicacao}", response_model=schemas.AplicacaoResponse)
def atualizar_aplicacao(id_aplicacao: int, dados: schemas.AplicacaoCreate, db: Session = Depends(get_db)):
    aplicacao_atual = db.get(model.Aplicacao, id_aplicacao)
    if not aplicacao_atual:
        raise HTTPException(status_code=404, detail="Aplicação não encontrada")

    if not db.get(model.UnidadeDeSaude, dados.unidade_id):
        raise HTTPException(status_code=404, detail=f"Unidade {dados.unidade_id} não encontrada")
    
    if not db.get(model.Paciente, dados.paciente_id):
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    
    if not db.get(model.Profissional, dados.profissional_id):
        raise HTTPException(status_code=404, detail="Profissional não encontrado")

    if not db.get(model.Admin, dados.admin_id):
        raise HTTPException(status_code=404, detail="Admin não encontrado")

    if dados.lote_id != aplicacao_atual.lote_id:
        
        novo_lote = db.get(model.Lote, dados.lote_id)
        if not novo_lote:
            raise HTTPException(status_code=404, detail="Novo Lote informado não encontrado")
        
        if novo_lote.quantidade <= 0:
            raise HTTPException(status_code=400, detail="O novo lote selecionado não tem estoque.")

        lote_antigo = db.get(model.Lote, aplicacao_atual.lote_id)
        if lote_antigo:
            lote_antigo.quantidade += 1
        
        novo_lote.quantidade -= 1
        
        lote_para_validar = novo_lote
    else:
        lote_para_validar = db.get(model.Lote, aplicacao_atual.lote_id)


    if dados.dose_id != aplicacao_atual.dose_id or dados.lote_id != aplicacao_atual.lote_id:
        nova_dose = db.get(model.Dose, dados.dose_id)
        if not nova_dose:
             raise HTTPException(status_code=404, detail="Nova Dose não encontrada")
        
        if not lote_para_validar:
            raise HTTPException(status_code=404, detail="Lote para validação não encontrado")
        
        if lote_para_validar.vacina_id != nova_dose.vacina_id:
            db.rollback() 
            raise HTTPException(
                status_code=400, 
                detail="Erro de Segurança: A vacina do lote não corresponde à vacina da dose selecionada."
            )

    aplicacao_atual.paciente_id = dados.paciente_id
    aplicacao_atual.profissional_id = dados.profissional_id
    aplicacao_atual.admin_id = dados.admin_id
    aplicacao_atual.unidade_id = str(dados.unidade_id)
    aplicacao_atual.lote_id = dados.lote_id
    aplicacao_atual.dose_id = dados.dose_id
    if dados.observacoes:
        aplicacao_atual.observacoes = dados.observacoes
    
    if dados.data:
        aplicacao_atual.data = dados.data

    try:
        db.commit()
        db.refresh(aplicacao_atual)
        
        _ = aplicacao_atual.unidade 
        
        return aplicacao_atual
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar: {str(e)}")

@router.get("/aplicacoes", response_model=List[schemas.AplicacaoResponse])
def listar_aplicacoes(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return db.scalars(
        select(model.Aplicacao)
        .options(
            joinedload(model.Aplicacao.unidade),
            joinedload(model.Aplicacao.paciente),
            joinedload(model.Aplicacao.profissional),
            joinedload(model.Aplicacao.dose).joinedload(model.Dose.vacina)
            ) 
        .offset(skip)
        .limit(limit)
    ).all()

@router.get("/aplicacoes/paciente/{id_paciente}", response_model=List[schemas.AplicacaoResponse])
def pegar_historico_do_paciente(
    id_paciente: uuid.UUID, 
    skip: int = 0, 
    limit: int = 10, 
    db: Session = Depends(get_db)
):
    paciente = db.get(model.Paciente, id_paciente)
    
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente não cadastrado")
    
   
    historico = db.scalars(
        select(model.Aplicacao)
        .where(model.Aplicacao.paciente_id == id_paciente)
        .options(joinedload(model.Aplicacao.unidade))
        .offset(skip)
        .limit(limit)
        .order_by(model.Aplicacao.data.desc())
    ).all()

    return historico

@router.delete("/aplicacoes/{id_aplicacao}", status_code=status.HTTP_204_NO_CONTENT)
def estornar_aplicacao(id_aplicacao: int, db: Session = Depends(get_db)):
    aplicacao = db.get(model.Aplicacao, id_aplicacao)
    
    if not aplicacao:
        raise HTTPException(status_code=404, detail="Aplicação não encontrada")

    lote = db.get(model.Lote, aplicacao.lote_id)
    if lote:
        lote.quantidade += 1
    
    db.delete(aplicacao)
    db.commit()
    return None

@router.post("/doses", response_model=schemas.DoseResponse, status_code=status.HTTP_201_CREATED)
def criar_dose(dose: schemas.DoseCreate, db: Session = Depends(get_db)):
    vacina = db.get(model.Vacina, dose.vacina_id)
    if not vacina:
        raise HTTPException(status_code=404, detail=f"Vacina com ID {dose.vacina_id} não encontrada.")

    if dose.numero > vacina.quantidade_doses:
        raise HTTPException(
            status_code=400,
            detail=f"Erro de Regra: A vacina '{vacina.nome}' foi configurada para ter apenas {vacina.quantidade_doses} doses. Você tentou cadastrar a dose {dose.numero}."
        )

    dose_existente = db.query(model.Dose).filter(
        model.Dose.vacina_id == dose.vacina_id,
        model.Dose.numero == dose.numero
    ).first()

    if dose_existente:
        raise HTTPException(
            status_code=409, 
            detail=f"A dose número {dose.numero} já está cadastrada para esta vacina."
        )

    nova_dose = model.Dose(**dose.model_dump())
    db.add(nova_dose)
    db.commit()
    db.refresh(nova_dose)
    
    return nova_dose

@router.get("/doses", response_model=list[schemas.DoseResponse])
def listar_doses(db: Session = Depends(get_db)):
    return db.query(model.Dose).all()

@router.get("/doses/vacina/{vacina_id}", response_model=list[schemas.DoseResponse])
def listar_doses_da_vacina(vacina_id: int, db: Session = Depends(get_db)):
    if not db.get(model.Vacina, vacina_id):
        raise HTTPException(status_code=404, detail="Vacina não encontrada.")

    doses = db.query(model.Dose)\
              .filter(model.Dose.vacina_id == vacina_id)\
              .order_by(model.Dose.numero)\
              .all()
    return doses

@router.put("/doses/{id_dose}", response_model=schemas.DoseResponse)
def atualizar_dose(id_dose: int, dados: schemas.DoseCreate, db: Session = Depends(get_db)):
    dose_obj = db.get(model.Dose, id_dose)
    vacina = db.get(model.Vacina, dados.vacina_id)
    if not dose_obj:
        raise HTTPException(status_code=404, detail="Dose não encontrada.")
    
    if not vacina:
        raise HTTPException(status_code=404, detail="Vacina não encontrada")
    
    if dados.numero > vacina.quantidade_doses:
        raise HTTPException(status_code=400, detail="Número da dose maior do que o permitido pelo esquema")

    dose_obj.intervalo = dados.intervalo
    dose_obj.numero = dados.numero
    dose_obj.vacina_id = dados.vacina_id

    db.commit()
    db.refresh(dose_obj)
    return dose_obj

@router.delete("/doses/{id_dose}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_dose(id_dose: int, db: Session = Depends(get_db)):
    dose_obj = db.get(model.Dose, id_dose)
    if not dose_obj:
        raise HTTPException(status_code=404, detail="Dose não encontrada.")

    usada_em_aplicacao = db.query(model.Aplicacao).filter(model.Aplicacao.dose_id == id_dose).count()
    
    if usada_em_aplicacao > 0:
        raise HTTPException(
            status_code=409, 
            detail=f"Não é possível apagar esta dose. Existem {usada_em_aplicacao} registros de aplicação vinculados a ela."
        )

    db.delete(dose_obj)
    db.commit()
    return None