from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, desc
from typing import Optional
from datetime import date

import model
import schemas
from database import SessionLocal

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard e Relatórios"]
)

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def aplicar_filtros(query, ano, data_inicio, data_fim, vacina_id):
    query = query.filter(extract('year', model.Aplicacao.data) == ano)
    
    if data_inicio:
        query = query.filter(model.Aplicacao.data >= data_inicio)
    if data_fim:
        query = query.filter(model.Aplicacao.data <= data_fim)
    if vacina_id:
        query = query.filter(model.Aplicacao.vacina_id == vacina_id)
        
    return query

@router.get("/stats", response_model=schemas.DashboardStats)
def obter_estatisticas(
    ano: int = Query(..., description="Ano de referência"),
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    vacina_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    base_query = db.query(model.Aplicacao)
    base_query = aplicar_filtros(base_query, ano, data_inicio, data_fim, vacina_id)

    total_aplicacoes = base_query.count()
    
    if total_aplicacoes == 0:
        return {
            "total_aplicacoes": 0,
            "pacientes_vacinados": 0,
            "media_mensal": 0,
            "vacina_mais_aplicada": "N/A",
            "mes_mais_ativo": "N/A",
            "aplicacoes_por_mes": [{"name": m, "value": 0} for m in ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']],
            "aplicacoes_por_vacina": [],
            "aplicacoes_por_local": []
        }

    pacientes_vacinados = base_query.distinct(model.Aplicacao.paciente_id).count()
    media_mensal = int(total_aplicacoes / 12) if total_aplicacoes > 0 else 0

    stats_mes_query = (
        db.query(
            func.extract('month', model.Aplicacao.data).label('mes'),
            func.count(model.Aplicacao.id_aplicacao).label('total')
        )
        .filter(extract('year', model.Aplicacao.data) == ano)
    )
    
    if data_inicio: stats_mes_query = stats_mes_query.filter(model.Aplicacao.data >= data_inicio)
    if data_fim: stats_mes_query = stats_mes_query.filter(model.Aplicacao.data <= data_fim)
    if vacina_id: stats_mes_query = stats_mes_query.filter(model.Aplicacao.vacina_id == vacina_id)
    
    db_resultados = stats_mes_query.group_by('mes').all()
    
    mapa_meses = {int(r.mes): r.total for r in db_resultados}
    meses_nome = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    
    dados_mes = []
    max_mes_valor = -1
    mes_mais_ativo_nome = "N/A"

    for i in range(1, 13):
        total = mapa_meses.get(i, 0)
        nome_mes = meses_nome[i-1]
        
        dados_mes.append({"name": nome_mes, "value": total})
        
        if total > max_mes_valor and total > 0:
            max_mes_valor = total
            mes_mais_ativo_nome = nome_mes
            
    if max_mes_valor <= 0:
        mes_mais_ativo_nome = "Nenhum"
    query_vacina = (
        db.query(
            model.Vacina.nome.label("name"), 
            func.count(model.Aplicacao.id_aplicacao).label("value")
        )
        .select_from(model.Aplicacao)
        .join(model.Aplicacao.dose)
        .join(model.Dose.vacina)
    )

    if data_inicio:
        query_vacina = query_vacina.filter(model.Aplicacao.data >= data_inicio)
    
    if data_fim:
        query_vacina = query_vacina.filter(model.Aplicacao.data <= data_fim)
        
    if vacina_id:
        query_vacina = query_vacina.filter(model.Dose.vacina_id == vacina_id)

    stats_vacina = (
        query_vacina
        .group_by(model.Vacina.nome)
        .order_by(desc("value"))
        .all()
    )
    
    dados_vacina = [{"name": s.name, "value": s.value} for s in stats_vacina]
    vacina_mais_aplicada = dados_vacina[0]['name'] if dados_vacina else "Nenhuma"

    query_local = (
        db.query(
            model.UnidadeDeSaude.nome_unidade.label("name"),
            func.count(model.Aplicacao.id_aplicacao).label("value")
        )
        .select_from(model.Aplicacao)
        .join(model.Aplicacao.unidade)
        .filter(extract('year', model.Aplicacao.data) == ano)
    )

    if data_inicio:
        query_local = query_local.filter(model.Aplicacao.data >= data_inicio)
    if data_fim:
        query_local = query_local.filter(model.Aplicacao.data <= data_fim)
    if vacina_id:
        query_local = query_local.join(model.Aplicacao.dose).filter(model.Dose.vacina_id == vacina_id)

    stats_local = (
        query_local
        .group_by(model.UnidadeDeSaude.nome_unidade)
        .order_by(desc("value"))
        .all()
    )
    
    dados_local = [{"name": s.name, "value": s.value} for s in stats_local]

    return {
        "total_aplicacoes": total_aplicacoes,
        "pacientes_vacinados": pacientes_vacinados,
        "media_mensal": media_mensal,
        "vacina_mais_aplicada": vacina_mais_aplicada,
        "mes_mais_ativo": mes_mais_ativo_nome,
        "aplicacoes_por_mes": dados_mes,
        "aplicacoes_por_vacina": dados_vacina,
        "aplicacoes_por_local": dados_local
    }

@router.get("/export", response_model=list[schemas.ExportData])
def exportar_dados(
    ano: int = Query(...),
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    vacina_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(model.Aplicacao).join(model.Paciente).join(model.Vacina)
    query = aplicar_filtros(query, ano, data_inicio, data_fim, vacina_id)
    
    resultados = query.all()
    
    dados_export = []
    for app in resultados:
        dados_export.append({
            "data_aplicacao": app.data,
            "paciente_nome": app.paciente.nome,
            "vacina_nome": app.vacina.nome,
            "dose": app.dose,
            "local": app.local,
            "profissional_nome": app.profissional_nome if hasattr(app, 'profissional_nome') else "N/A"
        })
        
    return dados_export