from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, desc
from database import SessionLocal
from datetime import date, timedelta
from typing import List, Optional


import model
import schemas 

router = APIRouter(
    prefix="/graficos",
    tags=["Gráficos e Dashboard"]
)

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def aplicar_filtros_comuns(query, ano, data_inicio, data_fim, vacina_nome):
    
    if vacina_nome and vacina_nome.lower() != "todas":
         pass 

    if ano:
        query = query.filter(extract('year', model.Aplicacao.data) == ano)
    
    if data_inicio:
        query = query.filter(model.Aplicacao.data >= data_inicio)
    
    if data_fim:
        query = query.filter(model.Aplicacao.data <= data_fim)
        
    return query

@router.get("/aplicacoes-ultimos-7-dias", response_model=List[schemas.GraficoDia])
def aplicacoes_ultimos_7_dias(db: Session = Depends(get_db)):
    hoje = date.today()
    inicio = hoje - timedelta(days=6)
    
    dados_db = (
        db.query(
            func.date(model.Aplicacao.data).label("dia"),
            func.count(model.Aplicacao.id_aplicacao).label("total")
        ).filter(
            model.Aplicacao.data >= inicio
        ).group_by(
            func.date(model.Aplicacao.data)
        ).all()
            )

    mapa = {d[0]: d[1] for d in dados_db}
    
    resultado = []
    for i in range(7):
        dia_corrente = inicio + timedelta(days=i)
        resultado.append({
            "dia": dia_corrente.strftime("%d/%m"),
            "total": mapa.get(dia_corrente, 0)
        })
        
    return resultado

@router.get("/aplicacoes-por-vacina", response_model=List[schemas.GraficoVacinaTotal])
def aplicacoes_por_vacina(
    ano: Optional[int] = Query(None),
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    vacina: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = (
        db.query(
            model.Vacina.nome.label("vacina"),
            func.count(model.Aplicacao.id_aplicacao).label("total")
        )
        .select_from(model.Aplicacao)
        .join(model.Lote, model.Lote.id_lote == model.Aplicacao.lote_id)
        .join(model.Vacina, model.Vacina.codigo_vacina == model.Lote.vacina_id)
    )

    if ano: query = query.filter(extract('year', model.Aplicacao.data) == ano)
    if data_inicio: query = query.filter(model.Aplicacao.data >= data_inicio)
    if data_fim: query = query.filter(model.Aplicacao.data <= data_fim)
    if vacina and vacina.lower() != "todas":
        query = query.filter(func.lower(model.Vacina.nome).contains(vacina.lower()))

    dados = query.group_by(model.Vacina.nome).order_by(desc("total")).all()
    
    return [{"vacina": d.vacina, "total": d.total} for d in dados]

@router.get("/estoque-por-vacina", response_model=List[schemas.GraficoEstoque])
def estoque_por_vacina(db: Session = Depends(get_db)):
    dados = (
        db.query(
            model.Vacina.nome.label("vacina"),
            func.sum(model.Lote.quantidade).label("quantidade")
        )
        .join(model.Vacina, model.Vacina.codigo_vacina == model.Lote.vacina_id)
        .group_by(model.Vacina.nome)
        .all()
    )
    
    resultado = [{"vacina": d.vacina, "quantidade": d.quantidade} for d in dados if d.quantidade > 0]
    return resultado

@router.get("/aplicacoes-por-mes", response_model=List[schemas.GraficoMes])
def aplicacoes_por_mes(
    ano: Optional[int] = Query(None),
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    vacina: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = (
        db.query(
            extract('month', model.Aplicacao.data).label("mes"),
            func.count(model.Aplicacao.id_aplicacao).label("total")
        )
        .select_from(model.Aplicacao)
    )
    
    if vacina and vacina.lower() != "todas":
        query = query.join(model.Lote).join(model.Vacina)
        query = query.filter(func.lower(model.Vacina.nome).contains(vacina.lower()))

    if ano: query = query.filter(extract('year', model.Aplicacao.data) == ano)
    if data_inicio: query = query.filter(model.Aplicacao.data >= data_inicio)
    if data_fim: query = query.filter(model.Aplicacao.data <= data_fim)

    dados = query.group_by("mes").all()
    
    mapa = {int(d.mes): d.total for d in dados}
    meses_nome = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    
    return [{"mes": meses_nome[i-1], "total": mapa.get(i, 0)} for i in range(1, 13)]

@router.get("/distribuicao-por-vacina", response_model=List[schemas.DistribuicaoVacina])
def distribuicao_por_vacina(db: Session = Depends(get_db)):
    total_geral = db.query(func.count(model.Aplicacao.id_aplicacao)).scalar() or 0
    
    if total_geral == 0:
        return []

    dados = (
        db.query(
            model.Vacina.nome.label("vacina"),
            func.count(model.Aplicacao.id_aplicacao).label("total")
        )
        .select_from(model.Aplicacao)
        .join(model.Lote).join(model.Vacina)
        .group_by(model.Vacina.nome)
        .all()
    )
    
    return [
        {
            "vacina": d.vacina,
            "quantidade": d.total,
            "percentual": round((d.total / total_geral) * 100, 2)
        }
        for d in dados
    ]

@router.get("/tendencia-vacinacao", response_model=List[schemas.GraficoMes])
def tendencia_vacinacao(ano: int, db: Session = Depends(get_db)):
    return aplicacoes_por_mes(ano=ano, data_inicio=None, data_fim=None, vacina=None, db=db)

@router.get("/distribuicao-por-local", response_model=List[schemas.DistribuicaoLocal])
def distribuicao_por_local(db: Session = Depends(get_db)):
    dados = (
        db.query(
            model.Aplicacao.local.label("ubs"),
            func.count(model.Aplicacao.id_aplicacao).label("total")
        )
        .group_by(model.Aplicacao.local)
        .order_by(desc("total"))
        .all()
    )
        
    return [{"ubs": d.ubs or "Indefinido", "total": d.total} for d in dados]

@router.get("/resumo-mensal", response_model=List[schemas.ResumoMensal])
def resumo_mensal(db: Session = Depends(get_db)):
    ano_atual = date.today().year
    
    total_ano = db.query(func.count(model.Aplicacao.id_aplicacao))\
        .filter(extract('year', model.Aplicacao.data) == ano_atual).scalar() or 0

    dados = (
        db.query(
            extract('month', model.Aplicacao.data).label("mes"),
            func.count(model.Aplicacao.id_aplicacao).label("total")
        )
        .filter(extract('year', model.Aplicacao.data) == ano_atual)
        .group_by("mes")
        .all()
    )
    
    mapa = {int(d.mes): d.total for d in dados}
    meses_nome = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    
    return [
        {
            "mes": meses_nome[i-1],
            "total_aplicacoes": mapa.get(i, 0),
            "percentual": round((mapa.get(i, 0) / total_ano) * 100, 2) if total_ano > 0 else 0
        } 
        for i in range(1, 13)
    ]