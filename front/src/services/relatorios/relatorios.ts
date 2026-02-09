import api from "../../lib/axios";

export interface DashboardFilter {
  ano: string;
  dataInicio?: string;
  dataFim?: string;
  vacinaId?: string;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface DashboardStats {
  total_aplicacoes: number;
  pacientes_vacinados: number;
  media_mensal: number;
  vacina_mais_aplicada: string;
  mes_mais_ativo: string;
  aplicacoes_por_mes: ChartData[];
  aplicacoes_por_vacina: ChartData[];
  aplicacoes_por_local: ChartData[];
}

export interface ExportData {
  data_aplicacao: string;
  paciente_nome: string;
  vacina_nome: string;
  dose: number;
  local: string;
  profissional_nome: string;
}

export const graficosService = {
  
  getStats: async (filtros: DashboardFilter): Promise<DashboardStats> => {
    const params = new URLSearchParams();
    params.append('ano', filtros.ano);
    if (filtros.dataInicio) params.append('data_inicio', filtros.dataInicio);
    if (filtros.dataFim) params.append('data_fim', filtros.dataFim);
    if (filtros.vacinaId) params.append('vacina_id', filtros.vacinaId);

    const response = await api.get<DashboardStats>(`/dashboard/stats?${params.toString()}`);
    return response.data;
  },

  getExportData: async (filtros: DashboardFilter): Promise<ExportData[]> => {
    const params = new URLSearchParams();
    params.append('ano', filtros.ano);
    if (filtros.dataInicio) params.append('data_inicio', filtros.dataInicio);
    if (filtros.dataFim) params.append('data_fim', filtros.dataFim);
    if (filtros.vacinaId) params.append('vacina_id', filtros.vacinaId);

    const response = await api.get<ExportData[]>(`/dashboard/export?${params.toString()}`);
    return response.data;
  }
};