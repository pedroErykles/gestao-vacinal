import api from "../../lib/axios";


export interface AplicacaoPayload {
  data?: string;
  paciente_id: string;
  profissional_id: string;
  admin_id: string;
  unidade_id: string;
  dose_id: number;
  lote_id: number;
  vacina_id: number;
}


export interface AplicacaoUI {
  id_aplicacao: number;
  data: string;

  nome_paciente: string;
  cpf_paciente: string;
  nome_vacina: string;
  numero_dose: number;
  codigo_lote: number | string;
  nome_unidade: string;
  nome_profissional: string;
  fabricante_nome: string;
  observacoes: string | undefined;

  paciente_id: string;
  vacina_id: number;
  lote_id: number;
  unidade_id: string;
  profissional_id: string;
  dose_id: number;

  data_proxima_dose?: string;
}

export interface DoseInfo {
  id_dose: number;
  numero: number;
  intervalo: number;
  vacina_id: number;
}


export const aplicacaoService = {
  listar: async (): Promise<AplicacaoUI[]> => {
    const response = await api.get<any[]>("/aplicacoes"); // ou a rota correta

    return response.data.map((app) => ({
      id_aplicacao: app.id_aplicacao,
      data: app.data,

      dose_id: app.dose_id,
      lote_id: app.lote_id,
      observacoes: app.observacoes,

      unidade_id: app.unidade_id,
      profissional_id: app.profissional_id,

      nome_paciente: app.paciente_nome || "Desconhecido",
      cpf_paciente: app.paciente_cpf || "",

      nome_vacina: app.vacina_nome || "Desconhecida",
      numero_dose: app.dose_numero || 0,

      codigo_lote: app.lote_codigo || "N/A",

      nome_unidade: app.nome_unidade,
      nome_profissional: app.profissional_nome,

      fabricante_nome: app.fabricante_nome,

      paciente_id: app.paciente_id,
      vacina_id: app.vacina_id,

      data_proxima_dose: app.proxima_dose,
    }));
  },

  criar: async (dados: AplicacaoPayload): Promise<any> => {
    const response = await api.post("/aplicacoes", dados);
    return response.data;
  },

  atualizar: async (id: number, dados: AplicacaoPayload): Promise<any> => {
    const response = await api.put(`/aplicacoes/${id}`, dados);
    return response.data;
  },

  deletar: async (id: number): Promise<void> => {
    await api.delete(`/aplicacoes/${id}`);
  },

  listarDosesDaVacina: async (vacinaId: number): Promise<DoseInfo[]> => {
    const response = await api.get<DoseInfo[]>(`/doses/vacina/${vacinaId}`);
    return response.data;
  },
};
