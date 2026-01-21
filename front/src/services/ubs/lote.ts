import api from "../../lib/axios";

interface VacinaResumo {
  codigo_vacina: number;
  nome: string;
}

export interface LotePayload {
  codigo: string;
  validade: string;
  data_chegada: string;
  quantidade: number;
  estoque_id: number;
  vacina_id: number;
  fornecedor_cnpj: string;
}

// src/services/lotes/lotes.service.ts

export interface LoteResponse {
  id_lote: number;      // O Python manda id_lote
  codigo: string;
  quantidade: number;   // O Python manda quantidade (única)
  validade: string;
  data_chegada: string;
  
  vacina_id: number;
  fornecedor_cnpj: string;
  
  // Opcionais (podem vir null)
  vacina?: {
    codigo_vacina: number;
    nome: string;
    fabricante?: {
      cnpj: string;
      nome: string;
    } | null;
  } | null;
}
// ... resto do arquivo

export const lotesService = {

  listar: async (): Promise<LoteResponse[]> => {
    const response = await api.get<LoteResponse[]>("/ubs/lotes");
    return response.data;
  },


  obterPorId: async (id: number): Promise<LoteResponse> => {
    const response = await api.get<LoteResponse>(`/ubs/lotes/${id}`);
    return response.data;
  },


  criar: async (dados: LotePayload): Promise<LoteResponse> => {
    const response = await api.post<LoteResponse>("/ubs/lotes", dados);
    return response.data;
  },


  atualizar: async (id: number, dados: LotePayload): Promise<LoteResponse> => {
    const response = await api.put<LoteResponse>(`/ubs/lotes/${id}`, dados);
    return response.data;
  },


  deletar: async (id: number): Promise<void> => {
    await api.delete(`/ubs/lotes/${id}`);
  },


  filtrarPorVacinaNoFront: (lotes: LoteResponse[], vacinaId: number): LoteResponse[] => {
    return lotes.filter(lote => lote.vacina_id === vacinaId);
  }
};