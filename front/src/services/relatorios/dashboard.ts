import api from "../../lib/axios";

export interface GraficoDia {
  dia: string;
  total: number;
}

export interface GraficoVacinaTotal {
  vacina: string;
  total: number;
}

export interface GraficoEstoque {
  vacina: string;
  quantidade: number;
}

export interface GraficoMes {
  mes: string;
  total: number;
}

export interface DistribuicaoVacina {
  vacina: string;
  quantidade: number;
  percentual: number;
}

export interface DistribuicaoLocal {
  ubs: string;
  total: number;
}

export interface ResumoMensal {
  mes: string;
  total_aplicacoes: number;
  percentual: number;
}

export interface DashboardFilters {
  ano?: string | number;
  dataInicio?: string; 
  dataFim?: string;  
  vacina?: string;    
}

// --- Service ---

export const dashboardService = {
 
  getAplicacoesUltimos7Dias: async (): Promise<GraficoDia[]> => {
    const response = await api.get<GraficoDia[]>("/graficos/aplicacoes-ultimos-7-dias");
    return response.data;
  },


  getAplicacoesPorVacina: async (filters?: DashboardFilters): Promise<GraficoVacinaTotal[]> => {
    const params = new URLSearchParams();
    if (filters?.ano) params.append('ano', String(filters.ano));
    if (filters?.dataInicio) params.append('data_inicio', filters.dataInicio);
    if (filters?.dataFim) params.append('data_fim', filters.dataFim);
    if (filters?.vacina) params.append('vacina', filters.vacina);

    const response = await api.get<GraficoVacinaTotal[]>(`/graficos/aplicacoes-por-vacina?${params.toString()}`);
    return response.data;
  },


  getEstoquePorVacina: async (): Promise<GraficoEstoque[]> => {
    const response = await api.get<GraficoEstoque[]>("/graficos/estoque-por-vacina");
    return response.data;
  },

  getAplicacoesPorMes: async (filters?: DashboardFilters): Promise<GraficoMes[]> => {
    const params = new URLSearchParams();
    if (filters?.ano) params.append('ano', String(filters.ano));
    if (filters?.dataInicio) params.append('data_inicio', filters.dataInicio);
    if (filters?.dataFim) params.append('data_fim', filters.dataFim);
    if (filters?.vacina) params.append('vacina', filters.vacina);

    const response = await api.get<GraficoMes[]>(`/graficos/aplicacoes-por-mes?${params.toString()}`);
    return response.data;
  },


  getDistribuicaoPorVacina: async (): Promise<DistribuicaoVacina[]> => {
    const response = await api.get<DistribuicaoVacina[]>("/graficos/distribuicao-por-vacina");
    return response.data;
  },


  getTendenciaVacinacao: async (ano: string | number): Promise<GraficoMes[]> => {
    const response = await api.get<GraficoMes[]>(`/graficos/tendencia-vacinacao?ano=${ano}`);
    return response.data;
  },


  getDistribuicaoPorLocal: async (): Promise<DistribuicaoLocal[]> => {
    const response = await api.get<DistribuicaoLocal[]>("/graficos/distribuicao-por-local");
    return response.data;
  },


  getResumoMensal: async (): Promise<ResumoMensal[]> => {
    const response = await api.get<ResumoMensal[]>("/graficos/resumo-mensal");
    return response.data;
  }
};