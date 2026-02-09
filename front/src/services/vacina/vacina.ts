import { similaritySearch } from "../global/utils";
import api from "../../lib/axios";

export interface FabricanteResponse {
  nome: string;
  telefone: string;
  cnpj: string; 
}

export interface VacinaPayload {
  nome: string;
  publico_alvo: string;
  doenca: string;
  quantidade_doses: number;

  intervalo_doses: number; 
  // -----------------------------

  descricao: string;
  fabricante_cnpj: string; 
}

export interface VacinaResponse {
  codigo_vacina: number;
  nome: string;
  publico_alvo: string;
  doenca: string;
  quantidade_doses: number;
  descricao: string;
  fabricante: FabricanteResponse | null;
  intervaloDoses?: number;
  
  intervalo_padrao?: number; 
}

export interface SearchVacinaResponse {
  id: number;
  nome: string;
  fabricante_nome: string; 
}

export const vacinasService = {

  listar: async (): Promise<VacinaResponse[]> => {
    const response = await api.get<VacinaResponse[]>("/vacinas");
    return response.data;
  },

  criar: async (dados: VacinaPayload): Promise<VacinaResponse> => {
    const response = await api.post<VacinaResponse>("/vacinas", dados);
    return response.data;
  },

  atualizar: async (
    id: number,
    dados: VacinaPayload
  ): Promise<VacinaResponse> => {
    const response = await api.put<VacinaResponse>(`/vacinas/${id}`, dados);
    return response.data;
  },

  deletar: async (id: number): Promise<void> => {
    await api.delete(`/vacinas/${id}`);
  },

  buscarVacinaPeloNome: async (
    termo: string
  ): Promise<SearchVacinaResponse[]> => {
    return similaritySearch<SearchVacinaResponse[]>(termo, "vacinas");
  },

  obterPorId: async (id: number): Promise<VacinaResponse> => {
    const response = await api.get<VacinaResponse>(`/vacinas/${id}`);
    return response.data;
  },
};