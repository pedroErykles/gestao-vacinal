import { similaritySearch } from "../global/utils";

//human readable identifier - cnpj ou nome
export interface SearchFabricanteResponse {
  id: string;
  HRId: string;
}

export interface FabricanteResponse {
  nome: string,
  telefone: string,
  cnpj: string
}



export const buscarFabricantePorNomeOuCnpj = async (
  termo: string
): Promise<SearchFabricanteResponse[]> => {
  return similaritySearch<SearchFabricanteResponse[]>(
    termo,
    "fabricantes/busca"
  );
};