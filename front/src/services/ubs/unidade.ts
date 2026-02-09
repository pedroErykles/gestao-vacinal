import api from "../../lib/axios";

export interface UnidadeResponse {
  id: string;
  nome_unidade: string;
  tipo: string;
  cidade: string;
  estado: string;
}

export interface BuscaUnidadeSaude {
    id: string;
    nome_unidade: string;
}

export const unidadeService = {
  listar: async (): Promise<UnidadeResponse[]> => {
    const response = await api.get<UnidadeResponse[]>("/ubs/unidades");
    return response.data;
  },

  buscarPorNome: async (termo: string): Promise<BuscaUnidadeSaude[]> => {
    const response = await api.get<BuscaUnidadeSaude[]>(`/ubs/unidades/busca?termo=${termo}`);
    return response.data;
  }
};