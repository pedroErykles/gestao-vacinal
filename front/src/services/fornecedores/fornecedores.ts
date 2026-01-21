import { similaritySearch } from "../global/utils"; // Ajuste o caminho conforme seu projeto
import api from "../../lib/axios";


export interface FornecedorPayload {
  nome: string;
  telefone: string;
  cnpj: string;
}

export interface FornecedorResponse {
  nome: string;
  telefone: string;
  cnpj: string;
}


export const fornecedoresService = {

  listar: async (): Promise<FornecedorResponse[]> => {
    const response = await api.get<FornecedorResponse[]>("/ubs/fornecedores");
    return response.data;
  },


  obterPorId: async (cnpj: string): Promise<FornecedorResponse> => {
    // Remove caracteres não numéricos caso venha formatado
    const cleanCnpj = cnpj.replace(/[^\d]/g, '');
    const response = await api.get<FornecedorResponse>(`/ubs/fornecedores/${cleanCnpj}`);
    return response.data;
  },


  criar: async (dados: FornecedorPayload): Promise<FornecedorResponse> => {
    const response = await api.post<FornecedorResponse>("/ubs/fornecedores", dados);
    return response.data;
  },

  atualizar: async (cnpj: string, dados: FornecedorPayload): Promise<FornecedorResponse> => {
    const cleanCnpj = cnpj.replace(/[^\d]/g, '');
    const response = await api.put<FornecedorResponse>(`/ubs/fornecedores/${cleanCnpj}`, dados);
    return response.data;
  },


  deletar: async (cnpj: string): Promise<void> => {
    const cleanCnpj = cnpj.replace(/[^\d]/g, '');
    await api.delete(`/ubs/fornecedores/${cleanCnpj}`);
  },


  buscarPorNome: async (termo: string): Promise<FornecedorResponse[]> => {
    return similaritySearch<FornecedorResponse[]>(termo, "ubs/fornecedores");
  },
};