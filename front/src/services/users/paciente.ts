import { similaritySearch } from "../global/utils";
import api from "../../lib/axios";

export interface PacienteSearchResponse {
  id: string;
  nome: string;
  cpf: string;
}

export interface PacienteDTO {
  nome: string;
  cpf: string;
  data_nascimento: string;
  telefone?: string;
  email?: string;
}

export interface PacienteResponse {
  id: string; // UUID
  nome: string; // Nome completo (pnome + unome concatenados no backend)
  cpf: string;
  data_nascimento: string; // Vem como string ISO do banco
  telefone: string | null;
  email: string | null;
}

export const pacienteService = {
  criar: async (dados: PacienteDTO): Promise<PacienteResponse> => {
    const response = await api.post<PacienteResponse>("/users/pacientes", dados);
    return response.data;
  },

  obterPorId: async (id: string): Promise<PacienteResponse> => {
        const response = await api.get<PacienteResponse>(`/users/pacientes/${id}`);
        return response.data;
  },

  atualizar: async (id: string, dados: Partial<PacienteDTO>): Promise<PacienteResponse> => {
        const response = await api.put<PacienteResponse>(`/users/pacientes/${id}`, dados);
        return response.data;
  },

  deletar: async (id: string): Promise<void> => {
        await api.delete(`/users/pacientes/${id}`);
    },

  buscarPacientes: async (termo: string): Promise<PacienteSearchResponse[]> => {
    return similaritySearch(termo, "users/pacientes");
  },
};
