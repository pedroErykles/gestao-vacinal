import api from "../../lib/axios";

export interface Aplicacao {
    id_aplicacao: number;
    data: string; 
    
    paciente_nome: string;
    paciente_id: string;
    paciente_cpf: string;
    
    vacina_nome: string;
    dose_numero: number;
    lote_codigo: number;
    
    nome_unidade: string;
    profissional_nome: string;
    
    proxima_dose: string | null; 
}


export interface CriarAplicacaoDTO {
    paciente_id: string;    
    profissional_id: string;  
    admin_id: string;         
    unidade_id: string;       
    
    dose_id: number;
    lote_id: number;
    data?: string;
}


export const aplicacoesService = {
    
    listarTodas: async (): Promise<Aplicacao[]> => {
        const response = await api.get<Aplicacao[]>("/aplicacoes");
        return response.data;
    },


    listarPorPaciente: async (idUsuario: string): Promise<Aplicacao[]> => {
        const response = await api.get<Aplicacao[]>(`/aplicacoes/paciente/${idUsuario}`);
        return response.data;
    },


    criar: async (dados: CriarAplicacaoDTO): Promise<Aplicacao> => {
        const response = await api.post<Aplicacao>("/aplicacoes", dados);
        return response.data;
    },

    atualizar: async (idAplicacao: number, dados: CriarAplicacaoDTO): Promise<Aplicacao> => {
        const response = await api.put<Aplicacao>(`/aplicacoes/${idAplicacao}`, dados);
        return response.data;
    },


    deletar: async (idAplicacao: number): Promise<void> => {
        await api.delete(`/aplicacoes/${idAplicacao}`);
    }
};