import api from "../../lib/axios";

export interface ProfissionalBuscaResponse {
  id: string;
  nome: string;
  cpf: string;
}

export interface ProfissionalResponse {
  id: string;
  pnome: string;
  unome: string;
  cpf_usuario: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  sexo: string;

  grau_formacao: string;

  nome?: string;
}

export interface ProfissionalPayload {
  pnome: string;
  unome: string;
  cpf_usuario: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  sexo: string;
  grau_formacao: string;
}

export const profissionaisService = {
  listar: async (): Promise<ProfissionalResponse[]> => {
    const response = await api.get<ProfissionalResponse[]>("/profissionais");
    return response.data.map((p) => ({
      ...p,
      nome: `${p.pnome} ${p.unome}`,
    }));
  },

  buscarPorNome: async (
    termo: string,
  ): Promise<ProfissionalBuscaResponse[]> => {
    if (!termo || termo.length < 3) return [];

    const response = await api.get<ProfissionalBuscaResponse[]>(
      `/users/profissionais/busca?termo=${termo}`,
    );
    return response.data;
  },

  obterPorId: async (id: string): Promise<ProfissionalResponse> => {
    const response = await api.get<ProfissionalResponse>(
      `/profissionais/${id}`,
    );
    const p = response.data;
    return { ...p, nome: `${p.pnome} ${p.unome}` };
  },

  criar: async (dados: ProfissionalPayload): Promise<ProfissionalResponse> => {
    const response = await api.post<ProfissionalResponse>(
      "/profissionais",
      dados,
    );
    return response.data;
  },

  atualizar: async (
    id: string,
    dados: ProfissionalPayload,
  ): Promise<ProfissionalResponse> => {
    const response = await api.put<ProfissionalResponse>(
      `/profissionais/${id}`,
      dados,
    );
    return response.data;
  },

  deletar: async (id: string): Promise<void> => {
    await api.delete(`/profissionais/${id}`);
  },
};
