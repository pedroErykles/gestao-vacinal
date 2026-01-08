import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

// Types
export interface Fabricante {
  id: string;
  nome: string;
  cnpj: string;
  contato: string;
}

export interface Vacina {
  id: string;
  nome: string;
  fabricanteId: string;
  numeroDoses: number;
  descricao?: string;
  intervaloMinimoDias?: number;
}

export interface Lote {
  id: string;
  codigo: string;
  vacinaId: string;
  fabricanteId: string;
  dataValidade: string;
  dataFabricacao: string;
  quantidadeInicial: number;
  quantidadeAtual: number;
  fornecedor?: string;
}

export interface Campanha {
  id: string;
  nome: string;
  vacinas: string[];
  dataInicio: string;
  dataFim: string;
  publicoAlvo: string;
  descricao?: string;
  ativa: boolean;
}

export interface Paciente {
  id: string;
  nome: string;
  cpf: string;
  dataNascimento: string;
  telefone?: string;
  email?: string;
}

export interface AplicacaoVacina {
  id: string;
  pacienteId: string;
  vacinaId: string;
  loteId: string;
  dataAplicacao: string;
  dose: number;
  profissionalNome: string;
  local: string;
  proximaDose?: string;
  observacoes?: string;
}

interface AppContextType {
  // Vacinas
  vacinas: Vacina[];
  addVacina: (vacina: Omit<Vacina, 'id'>) => void;
  updateVacina: (id: string, vacina: Partial<Vacina>) => void;
  deleteVacina: (id: string) => void;
  
  // Fabricantes
  fabricantes: Fabricante[];
  addFabricante: (fabricante: Omit<Fabricante, 'id'>) => void;
  
  // Campanhas
  campanhas: Campanha[];
  addCampanha: (campanha: Omit<Campanha, 'id'>) => void;
  updateCampanha: (id: string, campanha: Partial<Campanha>) => void;
  deleteCampanha: (id: string) => void;
  
  // Aplicações
  aplicacoes: AplicacaoVacina[];
  addAplicacao: (aplicacao: Omit<AplicacaoVacina, 'id'>) => void;
  updateAplicacao: (id: string, aplicacao: Partial<AplicacaoVacina>) => void;
  deleteAplicacao: (id: string) => void;
  
  // Lotes
  lotes: Lote[];
  addLote: (lote: Omit<Lote, 'id'>) => void;
  updateLote: (id: string, lote: Partial<Lote>) => void;
  deleteLote: (id: string) => void;
  
  // Pacientes
  pacientes: Paciente[];
  addPaciente: (paciente: Omit<Paciente, 'id'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [vacinas, setVacinas] = useState<Vacina[]>([]);
  const [fabricantes, setFabricantes] = useState<Fabricante[]>([]);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [aplicacoes, setAplicacoes] = useState<AplicacaoVacina[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);


  const addVacina = (vacina: Omit<Vacina, 'id'>) => {
    const newVacina = { ...vacina, id: Date.now().toString() };
    setVacinas([...vacinas, newVacina]);
  };

  const updateVacina = (id: string, vacina: Partial<Vacina>) => {
    setVacinas(vacinas.map(v => v.id === id ? { ...v, ...vacina } : v));
  };

  const deleteVacina = (id: string) => {
    setVacinas(vacinas.filter(v => v.id !== id));
  };

  const addFabricante = (fabricante: Omit<Fabricante, 'id'>) => {
    const newFabricante = { ...fabricante, id: Date.now().toString() };
    setFabricantes([...fabricantes, newFabricante]);
  };

  const addCampanha = (campanha: Omit<Campanha, 'id'>) => {
    const newCampanha = { ...campanha, id: Date.now().toString() };
    setCampanhas([...campanhas, newCampanha]);
  };

  const updateCampanha = (id: string, campanha: Partial<Campanha>) => {
    setCampanhas(campanhas.map(c => c.id === id ? { ...c, ...campanha } : c));
  };

  const deleteCampanha = (id: string) => {
    setCampanhas(campanhas.filter(c => c.id !== id));
  };

  const addAplicacao = (aplicacao: Omit<AplicacaoVacina, 'id'>) => {
    const newAplicacao = { ...aplicacao, id: Date.now().toString() };
    setAplicacoes([...aplicacoes, newAplicacao]);
    
    // Atualiza estoque do lote
    setLotes(lotes.map(lote => 
      lote.id === aplicacao.loteId 
        ? { ...lote, quantidadeAtual: lote.quantidadeAtual - 1 }
        : lote
    ));
  };

  const updateAplicacao = (id: string, aplicacao: Partial<AplicacaoVacina>) => {
    setAplicacoes(aplicacoes.map(a => a.id === id ? { ...a, ...aplicacao } : a));
  };

  const deleteAplicacao = (id: string) => {
    const aplicacao = aplicacoes.find(a => a.id === id);
    if (aplicacao) {
      // Restaura estoque do lote
      setLotes(lotes.map(lote => 
        lote.id === aplicacao.loteId 
          ? { ...lote, quantidadeAtual: lote.quantidadeAtual + 1 }
          : lote
      ));
    }
    setAplicacoes(aplicacoes.filter(a => a.id !== id));
  };

  const addLote = (lote: Omit<Lote, 'id'>) => {
    const newLote = { ...lote, id: Date.now().toString() };
    setLotes([...lotes, newLote]);
  };

  const updateLote = (id: string, lote: Partial<Lote>) => {
    setLotes(lotes.map(l => l.id === id ? { ...l, ...lote } : l));
  };

  const deleteLote = (id: string) => {
    setLotes(lotes.filter(l => l.id !== id));
  };

  const addPaciente = (paciente: Omit<Paciente, 'id'>) => {
    const newPaciente = { ...paciente, id: Date.now().toString() };
    setPacientes([...pacientes, newPaciente]);
  };

  return (
    <AppContext.Provider
      value={{
        vacinas,
        addVacina,
        updateVacina,
        deleteVacina,
        fabricantes,
        addFabricante,
        campanhas,
        addCampanha,
        updateCampanha,
        deleteCampanha,
        aplicacoes,
        addAplicacao,
        updateAplicacao,
        deleteAplicacao,
        lotes,
        addLote,
        updateLote,
        deleteLote,
        pacientes,
        addPaciente,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}