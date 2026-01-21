import api from "../../lib/axios";

export interface CampanhaPayload {
  nome: string;
  data_inicio: string; // Formato ISO (YYYY-MM-DD ou DateTime completo)
  data_fim: string;    // Formato ISO
  admin_id: string;    // UUID do administrador
  vacina_ids: number[];
  
  // Novos campos adicionados
  publico_alvo: string;
  descricao?: string; // Opcional
  ativa: boolean;
}

/**
 * Interface de resposta da API
 * Deve bater com o schema CampanhaResponse do Backend
 */
export interface CampanhaResponse {
  id: number; // O backend mapeia 'id_campanha' para 'id'
  nome: string;
  data_inicio: string;
  data_fim: string;
  vacina_ids: number[];
  
  // Novos campos retornados pela API
  publico_alvo: string;
  descricao?: string;
  ativa: boolean;
}

export const campanhasService = {
  /**
   * Lista todas as campanhas
   * Endpoint: GET /campanhas/
   */
  listar: async (): Promise<CampanhaResponse[]> => {
    const response = await api.get<CampanhaResponse[]>("/campanhas/");
    return response.data;
  },

  /**
   * Busca uma campanha específica pelo ID
   * Endpoint: GET /campanhas/{id}
   */
  obterPorId: async (id: number): Promise<CampanhaResponse> => {
    const response = await api.get<CampanhaResponse>(`/campanhas/${id}`);
    return response.data;
  },

  /**
   * Cria uma nova campanha
   * Endpoint: POST /campanhas/
   */
  criar: async (dados: CampanhaPayload): Promise<CampanhaResponse> => {
    const response = await api.post<CampanhaResponse>("/campanhas/", dados);
    return response.data;
  },

  /**
   * Atualiza uma campanha existente
   * Endpoint: PUT /campanhas/{id}
   */
  atualizar: async (id: number, dados: CampanhaPayload): Promise<CampanhaResponse> => {
    const response = await api.put<CampanhaResponse>(`/campanhas/${id}`, dados);
    return response.data;
  },

  /**
   * Remove uma campanha
   * Endpoint: DELETE /campanhas/{id}
   */
  deletar: async (id: number): Promise<void> => {
    await api.delete(`/campanhas/${id}`);
  },
};