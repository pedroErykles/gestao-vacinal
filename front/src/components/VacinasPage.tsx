import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Syringe } from 'lucide-react';
import { toast } from 'sonner';

// Serviços e Utilitários
import api from '../lib/axios'; // Assumindo que seu axios está aqui
import { vacinasService, type VacinaResponse, type SearchVacinaResponse } from '../services/vacina/vacina';
import { AsyncSearchSelect } from '../components/AsyncSearchSelect'; // Assumindo que você salvou o componente aqui

// --- INTERFACES LOCAIS PARA O FORMULÁRIO ---
// (Necessário pois o backend retorna snake_case e o form usa camelCase/strings)

interface Fabricante {
  cnpj: string;
  nome: string;
  telefone: string;
}

export function VacinasPage() {
  // --- STATES DE DADOS (Vindos da API) ---
  const [vacinas, setVacinas] = useState<VacinaResponse[]>([]);
  const [fabricantes, setFabricantes] = useState<Fabricante[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- STATES DE FILTRO ---
  // Agora o searchTerm é controlado pelo AsyncSearchSelect (pode ser um objeto de busca ou null)
  const [selectedSearchItem, setSelectedSearchItem] = useState<SearchVacinaResponse | null>(null);
  const [filterFabricante, setFilterFabricante] = useState('');
  const [filterDoses, setFilterDoses] = useState('');

  // --- STATES DE DIALOGS ---
  const [showModal, setShowModal] = useState(false);
  const [showFabricanteModal, setShowFabricanteModal] = useState(false);
  const [editingVacina, setEditingVacina] = useState<VacinaResponse | null>(null);

  // --- FORM STATES ---
  const [formData, setFormData] = useState({
    nome: '',
    fabricanteId: '', // Isso armazenará o CNPJ
    numeroDoses: '1',
    descricao: '',
    intervaloMinimoDias: '',
    publico_alvo: 'Geral', // Valor padrão
    doenca: 'COVID-19' // Valor padrão ou campo novo se quiser adicionar no form
  });

  const [fabricanteFormData, setFabricanteFormData] = useState({
    nome: '',
    cnpj: '',
    telefone: '',
  });

  // --- CARREGAMENTO INICIAL ---
  const loadData = async () => {
    setIsLoading(true);
    try {
      // Carrega vacinas e fabricantes em paralelo
      const [listaVacinas, listaFabricantes] = await Promise.all([
        vacinasService.listar(),
        api.get<Fabricante[]>('/fabricantes').then(res => res.data)
      ]);
      
      setVacinas(listaVacinas);
      setFabricantes(listaFabricantes);
    } catch (error) {
      toast.error('Erro ao carregar dados.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- LÓGICA DE FILTRAGEM ---
  const vacinasFiltradas = vacinas.filter((vacina) => {
    // 1. Filtro por Busca (AsyncSearchSelect)
    // Se tiver um item selecionado na busca, só mostra ele. Se não, mostra todos.
    const matchSearch = selectedSearchItem 
      ? vacina.codigo_vacina === selectedSearchItem.id 
      : true;

    // 2. Filtro por Fabricante (Dropdown)
    const matchFabricante = !filterFabricante || vacina.fabricante?.cnpj === filterFabricante;
    
    // 3. Filtro por Doses
    const matchDoses = !filterDoses || vacina.quantidade_doses.toString() === filterDoses;

    return matchSearch && matchFabricante && matchDoses;
  });

  // --- HANDLERS DE FORMULÁRIO ---

  const resetForm = () => {
    setFormData({
      nome: '',
      fabricanteId: '',
      numeroDoses: '1',
      descricao: '',
      intervaloMinimoDias: '',
      publico_alvo: 'Geral',
      doenca: 'Prevenção Geral'
    });
    setEditingVacina(null);
  };

  const resetFabricanteForm = () => {
    setFabricanteFormData({ nome: '', cnpj: '', telefone: '' });
  };

  const handleCloseFabricanteModal = () => {
    setShowFabricanteModal(false);
    resetFabricanteForm();
    
    // Se o usuário estava preenchendo uma vacina antes, reabre o modal dela
    // para ele não perder o fluxo
    if (formData.nome || formData.descricao) {
      setShowModal(true);
    }
  };

  const handleOpenModal = (vacina?: VacinaResponse) => {
    if (vacina) {
      setFormData({
        nome: vacina.nome,
        fabricanteId: vacina.fabricante?.cnpj || '',
        numeroDoses: vacina.quantidade_doses.toString(),
        descricao: (vacina as any).descricao || '', // Cast any caso a interface TS ainda não tenha descricao
        intervaloMinimoDias: (vacina as any).intervaloMinimoDias?.toString() || '', // Ajustar conforme backend real
        publico_alvo: vacina.publico_alvo,
        doenca: vacina.doenca
      });
      setEditingVacina(vacina);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  // --- ACTIONS (CRUD) ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.fabricanteId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const qtdDoses = parseInt(formData.numeroDoses);
    
    const payload = {
      nome: formData.nome,
      fabricante_cnpj: formData.fabricanteId, // Mapeando para o campo do backend
      quantidade_doses: qtdDoses,
      publico_alvo: formData.publico_alvo,
      doenca: formData.doenca,
      // Se o backend aceitar descricao, adicione aqui. 
      // Nota: O schema VacinaCreate fornecido anteriormente não tinha 'descricao', 
      // mas você disse que adicionou. Adicione no payload se o backend esperar.
      descricao: formData.descricao 
    };

    try {
      if (editingVacina) {
        await vacinasService.atualizar(editingVacina.codigo_vacina, payload);
        toast.success('Vacina atualizada com sucesso!');
      } else {
        await vacinasService.criar(payload);
        toast.success('Vacina cadastrada com sucesso!');
      }
      loadData(); // Recarrega a lista
      handleCloseModal();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar vacina.');
    }
  };

  const handleDelete = async (vacina: VacinaResponse) => {
    if (window.confirm(`Tem certeza que deseja excluir a vacina "${vacina.nome}"?`)) {
      try {
        await vacinasService.deletar(vacina.codigo_vacina);
        toast.success('Vacina excluída com sucesso!');
        loadData();
      } catch (error: any) {
        toast.error(error.response?.data?.detail || 'Erro ao excluir vacina.');
      }
    }
  };

  // --- ACTIONS FABRICANTE ---

  const validarCNPJ = (cnpj: string) => {
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
    return cnpjLimpo.length === 14;
  };

  const handleSubmitFabricante = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarCNPJ(fabricanteFormData.cnpj)) {
      toast.error('CNPJ inválido (deve ter 14 dígitos)');
      return;
    }

    try {
      await api.post('/fabricantes', {
        cnpj: fabricanteFormData.cnpj,
        nome: fabricanteFormData.nome,
        telefone: fabricanteFormData.telefone
      });
      toast.success('Fabricante cadastrado com sucesso!');
      
      // Atualiza lista de fabricantes e fecha modal
      const fabs = await api.get<Fabricante[]>('/fabricantes');
      setFabricantes(fabs.data);
      handleCloseFabricanteModal();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erro ao criar fabricante.');
    }
  };

  // --- UTILS ---
  const getFabricanteNome = (cnpj: string | undefined) => {
    if (!cnpj) return 'N/A';
    return fabricantes.find(f => f.cnpj === cnpj)?.nome || cnpj;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Gestão de Vacinas</h1>
        <p className="text-gray-600">Cadastro e gerenciamento de vacinas disponíveis</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total de Vacinas</p>
              <p className="text-3xl mt-2">{vacinas.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Syringe className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Fabricantes</p>
              <p className="text-3xl mt-2">{fabricantes.length}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Syringe className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Vacinas Filtradas</p>
              <p className="text-3xl mt-2">{vacinasFiltradas.length}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Syringe className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Ações */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4 items-end">
          
          {/* Novo Componente de Busca Assíncrona */}
          <div className="flex-1 w-full">
            <AsyncSearchSelect<SearchVacinaResponse>
              label="Buscar Vacina"
              placeholder="Digite o nome para buscar..."
              fetchData={vacinasService.buscarVacinaPeloNome}
              getDisplayValue={(item) => `${item.nome} (${item.fabricante_nome})`}
              renderItem={(item) => (
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">{item.nome}</span>
                  <span className="text-xs text-gray-500">{item.fabricante_nome}</span>
                </div>
              )}
              onSelect={(item) => setSelectedSearchItem(item)}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col">
               <label className="text-sm font-medium text-gray-700 mb-2">Filtrar Fabricante</label>
               <select
                value={filterFabricante}
                onChange={(e) => setFilterFabricante(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white h-[42px]"
              >
                <option value="">Todos</option>
                {fabricantes.map(f => (
                  <option key={f.cnpj} value={f.cnpj}>{f.nome}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">Doses</label>
              <select
                value={filterDoses}
                onChange={(e) => setFilterDoses(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white h-[42px]"
              >
                <option value="">Todas</option>
                <option value="1">1 dose</option>
                <option value="2">2 doses</option>
                <option value="3">3 doses</option>
              </select>
            </div>

            <div className="flex items-end">
                <button
                onClick={() => handleOpenModal()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap h-[42px]"
                >
                <Plus className="w-5 h-5" />
                Nova Vacina
                </button>
            </div>
          </div>
        </div>

        {(selectedSearchItem || filterFabricante || filterDoses) && (
          <button
            onClick={() => {
                setSelectedSearchItem(null); // Limpa a busca do componente (precisaria resetar o input visualmente, mas limpando o state já reseta o filtro)
                setFilterFabricante('');
                setFilterDoses('');
                // Hack para forçar re-render do componente de busca limpo se necessário, 
                // mas idealmente passamos uma prop 'value' para o AsyncSelect.
                // Como o componente AsyncSearchSelect fornecido usa estado interno para query, 
                // clicar no 'X' dele é o caminho padrão. Aqui limpamos os filtros da tabela.
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            Limpar filtros da tabela
          </button>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Nome</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Fabricante</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Nº Doses</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Descrição</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Carregando dados...
                    </td>
                  </tr>
              ) : vacinasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Nenhuma vacina encontrada
                  </td>
                </tr>
              ) : (
                vacinasFiltradas.map((vacina) => (
                  <tr key={vacina.codigo_vacina} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-medium">{vacina.nome}</span>
                      <div className="text-xs text-gray-400">{vacina.doenca}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                        {vacina.fabricante?.nome || 'Desconhecido'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                        {vacina.quantidade_doses} {vacina.quantidade_doses === 1 ? 'dose' : 'doses'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {(vacina as any).descricao ? (
                        <span className="max-w-xs truncate block">{(vacina as any).descricao}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(vacina)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(vacina)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro/Edição de VACINA */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl">
                {editingVacina ? 'Editar Vacina' : 'Nova Vacina'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm mb-2">Nome da Vacina *</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ex: CoronaVac"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm">Fabricante *</label>
                    <button
                      type="button"
                      onClick={() => {
                          setShowModal(false); // Fecha este modal temporariamente ou sobrepoe
                          setShowFabricanteModal(true);
                      }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      + Novo
                    </button>
                  </div>
                  <select
                    value={formData.fabricanteId}
                    onChange={(e) => setFormData({ ...formData, fabricanteId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Selecione...</option>
                    {fabricantes.map(f => (
                      <option key={f.cnpj} value={f.cnpj}>{f.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2">Número de Doses *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.numeroDoses}
                    onChange={(e) => setFormData({ ...formData, numeroDoses: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                
                {/* Campos adicionais exigidos pelo backend/interface */}
                <div>
                  <label className="block text-sm mb-2">Público Alvo</label>
                  <input
                    type="text"
                    value={formData.publico_alvo}
                    onChange={(e) => setFormData({ ...formData, publico_alvo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Doença</label>
                  <input
                    type="text"
                    value={formData.doenca}
                    onChange={(e) => setFormData({ ...formData, doenca: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm mb-2">Descrição</label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Descrição técnica..."
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingVacina ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Cadastro de FABRICANTE */}
      {showFabricanteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl">Cadastrar Fabricante</h2>
            </div>

            <form onSubmit={handleSubmitFabricante} className="p-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm mb-2">Nome do Fabricante *</label>
                  <input
                    type="text"
                    value={fabricanteFormData.nome}
                    onChange={(e) => setFabricanteFormData({ ...fabricanteFormData, nome: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">CNPJ *</label>
                  <input
                    type="text"
                    value={fabricanteFormData.cnpj}
                    onChange={(e) => setFabricanteFormData({ ...fabricanteFormData, cnpj: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="00.000.000/0000-00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Telefone *</label>
                  <input
                    type="text"
                    value={fabricanteFormData.telefone}
                    onChange={(e) => setFabricanteFormData({ ...fabricanteFormData, telefone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="(00) 0000-0000"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowFabricanteModal(false);
                    // Se estiver criando vacina, reabre o modal da vacina
                    if (formData.nome) setShowModal(true);
                  }}
                  className="flex-1 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}