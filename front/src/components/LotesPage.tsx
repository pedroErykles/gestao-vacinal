import { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, AlertTriangle, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Services
import { lotesService } from '../services/ubs/lote';
import { vacinasService, type SearchVacinaResponse } from '../services/vacina/vacina';
import { fornecedoresService, type FornecedorResponse } from '../services/fornecedores/fornecedores';

// Componente de Busca
import { AsyncSearchSelect } from '../components/AsyncSearchSelect';

// Função auxiliar de validação de CNPJ
function validarCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]+/g, '');
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  const digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;
  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) return false;
  return true;
}

interface LoteUI {
  id: number;
  codigo: string;
  vacinaId: string;
  fabricanteId: string;
  dataValidade: string;
  dataFabricacao: string;
  quantidade: number;
  fornecedor: string;
}

export function LotesPage() {
  const [lotes, setLotes] = useState<LoteUI[]>([]);
  const [vacinas, setVacinas] = useState<any[]>([]);
  const [fabricantes, setFabricantes] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<FornecedorResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // States Visuais Principais
  const [showModal, setShowModal] = useState(false);
  const [editingLote, setEditingLote] = useState<LoteUI | null>(null);
  
  // State do Modal de Fornecedor
  const [showFornecedorModal, setShowFornecedorModal] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVacina, setFilterVacina] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  
  // Form Lote
  const [formData, setFormData] = useState({
    codigo: '',
    vacinaId: '',
    dataValidade: '',
    dataFabricacao: '',
    quantidade: '',
    fornecedor: '',
  });

  // Form Fornecedor
  const [fornecedorForm, setFornecedorForm] = useState({
    nome: '',
    cnpj: '',
    telefone: ''
  });

  // Objetos para AsyncSelect
  const [selectedVacinaObj, setSelectedVacinaObj] = useState<SearchVacinaResponse | null>(null);
  const [selectedFornecedorObj, setSelectedFornecedorObj] = useState<FornecedorResponse | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [listaLotes, listaVacinas, listaFornecedores] = await Promise.all([
        lotesService.listar(),
        vacinasService.listar(),
        fornecedoresService.listar()
      ]);

      const lotesAdaptados: LoteUI[] = listaLotes.map(l => ({
        id: l.id_lote,
        codigo: l.codigo,
        vacinaId: l.vacina_id.toString(),
        fabricanteId: l.vacina?.fabricante?.cnpj || '', 
        dataValidade: l.validade,
        dataFabricacao: l.data_chegada,
        quantidade: l.quantidade,
        fornecedor: l.fornecedor_cnpj
      }));

      setLotes(lotesAdaptados);
      setVacinas(listaVacinas);
      setFornecedores(listaFornecedores);

      const fabsMap = new Map();
      listaVacinas.forEach(v => {
        if(v.fabricante) {
          fabsMap.set(v.fabricante.cnpj, { id: v.fabricante.cnpj, nome: v.fabricante.nome });
        }
      });
      setFabricantes(Array.from(fabsMap.values()));

    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar dados.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFormData({
      codigo: '',
      vacinaId: '',
      dataValidade: '',
      dataFabricacao: '',
      quantidade: '',
      fornecedor: '',
    });
    setEditingLote(null);
    setSelectedVacinaObj(null);
    setSelectedFornecedorObj(null);
  };

  const handleOpenModal = (lote?: LoteUI) => {
    if (lote) {
      setEditingLote(lote);
      setFormData({
        codigo: lote.codigo,
        vacinaId: lote.vacinaId,
        dataValidade: lote.dataValidade.split('T')[0],
        dataFabricacao: lote.dataFabricacao.split('T')[0],
        quantidade: lote.quantidade.toString(),
        fornecedor: lote.fornecedor || '',
      });

      const vacinaEncontrada = vacinas.find(v => v.codigo_vacina.toString() === lote.vacinaId);
      if (vacinaEncontrada) {
        setSelectedVacinaObj({
          id: vacinaEncontrada.codigo_vacina.toString(),
          nome: vacinaEncontrada.nome,
          fabricante: vacinaEncontrada.fabricante?.nome || 'N/A'
        } as any); 
      }

      const fornecedorEncontrado = fornecedores.find(f => f.cnpj === lote.fornecedor);
      if (fornecedorEncontrado) {
        setSelectedFornecedorObj(fornecedorEncontrado);
      }

    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  // --- Lógica do Novo Fornecedor ---
  const handleOpenFornecedorModal = () => {
    setFornecedorForm({ nome: '', cnpj: '', telefone: '' });
    setShowFornecedorModal(true);
  };

  const handleCloseFornecedorModal = () => {
    setShowFornecedorModal(false);
    setFornecedorForm({ nome: '', cnpj: '', telefone: '' });
  };

  const handleSubmitFornecedor = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarCNPJ(fornecedorForm.cnpj)) {
      toast.error('CNPJ inválido');
      return;
    }

    try {
      const cnpjLimpo = fornecedorForm.cnpj.replace(/[^\d]/g, '');
      const novoFornecedor = await fornecedoresService.criar({
        nome: fornecedorForm.nome,
        cnpj: cnpjLimpo,
        telefone: fornecedorForm.telefone
      });

      toast.success('Fornecedor criado!');
      
      // Atualiza a lista local (opcional, mas bom para cache)
      setFornecedores([...fornecedores, novoFornecedor]);
      
      // AUTO-SELECIONA o novo fornecedor no formulário de Lote
      setSelectedFornecedorObj(novoFornecedor);
      setFormData(prev => ({ ...prev, fornecedor: novoFornecedor.cnpj }));
      
      handleCloseFornecedorModal();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erro ao criar fornecedor.');
    }
  };

  // --- Lógica do Lote ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.codigo || !formData.vacinaId || !formData.dataValidade || !formData.dataFabricacao || !formData.fornecedor) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const qtd = parseInt(formData.quantidade);

    if (isNaN(qtd) || qtd < 0) {
      toast.error('Quantidade inválida');
      return;
    }

    const dataFab = new Date(formData.dataFabricacao);
    const dataVal = new Date(formData.dataValidade);
    
    if (dataVal <= dataFab) {
      toast.error('Data de validade deve ser posterior à data de fabricação');
      return;
    }

    const payload = {
        codigo: formData.codigo,
        vacina_id: parseInt(formData.vacinaId),
        fornecedor_cnpj: formData.fornecedor, 
        quantidade: qtd,
        validade: dataVal.toISOString(),
        data_chegada: dataFab.toISOString(),
        estoque_id: 1
    };

    try {
        if (editingLote) {
          await lotesService.atualizar(editingLote.id, payload);
          toast.success('Lote atualizado com sucesso!');
        } else {
          await lotesService.criar(payload);
          toast.success('Lote cadastrado com sucesso!');
        }
        loadData();
        handleCloseModal();
    } catch (error: any) {
        console.error(error);
        const msg = error.response?.data?.detail || 'Erro ao salvar lote.';
        toast.error(msg);
    }
  };

  const handleDelete = async (lote: LoteUI) => {
    if (window.confirm(`Deseja realmente excluir o lote ${lote.codigo}?`)) {
      try {
          await lotesService.deletar(lote.id);
          toast.success('Lote excluído com sucesso!');
          loadData();
      } catch (error) {
          toast.error('Erro ao excluir lote.');
      }
    }
  };

  const getVacinaNome = (vacinaId: string) => {
    return vacinas.find(v => v.codigo_vacina.toString() === vacinaId)?.nome || 'N/A';
  };

  const getFabricanteNome = (fabricanteId: string) => {
    return fabricantes.find(f => f.id === fabricanteId)?.nome || 'N/A';
  };

  const isLoteVencido = (dataValidade: string) => {
    return new Date(dataValidade) < new Date();
  };

  const isLoteProximoVencimento = (dataValidade: string) => {
    const hoje = new Date();
    const vencimento = new Date(dataValidade);
    const diasParaVencer = Math.floor((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diasParaVencer <= 30 && diasParaVencer > 0;
  };

  const getLoteStatus = (lote: LoteUI) => {
    if (isLoteVencido(lote.dataValidade)) return 'vencido';
    if (isLoteProximoVencimento(lote.dataValidade)) return 'proximo-vencimento';
    if (lote.quantidade === 0) return 'esgotado';
    if (lote.quantidade < 50) return 'estoque-baixo';
    return 'normal';
  };

  const getStatusBadge = (lote: LoteUI) => {
    const status = getLoteStatus(lote);
    
    switch (status) {
      case 'vencido':
        return <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Vencido</span>;
      case 'proximo-vencimento':
        return <span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-700">Próximo ao vencimento</span>;
      case 'esgotado':
        return <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">Esgotado</span>;
      case 'estoque-baixo':
        return <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700">Estoque baixo</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">Normal</span>;
    }
  };

  const filteredLotes = lotes.filter(lote => {
    const matchesSearch = lote.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getVacinaNome(lote.vacinaId).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesVacina = !filterVacina || lote.vacinaId === filterVacina;
    
    let matchesStatus = true;
    if (filterStatus !== 'todos') {
      const status = getLoteStatus(lote);
      matchesStatus = status === filterStatus;
    }
    
    return matchesSearch && matchesVacina && matchesStatus;
  });

  const totalLotes = lotes.length;
  const lotesVencidos = lotes.filter(l => isLoteVencido(l.dataValidade)).length;
  const lotesProximoVencimento = lotes.filter(l => isLoteProximoVencimento(l.dataValidade)).length;
  const totalDosesDisponiveis = lotes.reduce((sum, l) => sum + l.quantidade, 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Gestão de Lotes</h1>
        <p className="text-gray-600">Controle e gerenciamento de lotes de vacinas</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total de Lotes</p>
              <p className="text-3xl mt-2">{isLoading ? <Loader2 className="animate-spin" /> : totalLotes}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Doses Disponíveis</p>
              <p className="text-3xl mt-2">{isLoading ? '...' : totalDosesDisponiveis.toLocaleString()}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Package className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Próximo ao Vencimento</p>
              <p className="text-3xl mt-2">{isLoading ? '...' : lotesProximoVencimento}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Lotes Vencidos</p>
              <p className="text-3xl mt-2">{isLoading ? '...' : lotesVencidos}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por código ou vacina..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex gap-4">
            <select
              value={filterVacina}
              onChange={(e) => setFilterVacina(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="">Todas as vacinas</option>
              {vacinas.map(vacina => (
                <option key={vacina.codigo_vacina} value={vacina.codigo_vacina}>{vacina.nome}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="todos">Todos os status</option>
              <option value="normal">Normal</option>
              <option value="estoque-baixo">Estoque baixo</option>
              <option value="proximo-vencimento">Próximo ao vencimento</option>
              <option value="vencido">Vencido</option>
              <option value="esgotado">Esgotado</option>
            </select>

            <button
              onClick={() => handleOpenModal()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Novo Lote
            </button>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Código</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Vacina</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Fabricante</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Fabricação</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Validade</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Estoque</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Status</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Nenhum lote encontrado
                  </td>
                </tr>
              ) : (
                filteredLotes.map(lote => (
                  <tr key={lote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-medium">{lote.codigo}</span>
                    </td>
                    <td className="px-6 py-4">{getVacinaNome(lote.vacinaId)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{getFabricanteNome(lote.fabricanteId)}</td>
                    <td className="px-6 py-4 text-sm">{new Date(lote.dataFabricacao).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 text-sm">{new Date(lote.dataValidade).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{lote.quantidade.toLocaleString()}</span>
                        <span className="text-xs text-gray-500">doses</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(lote)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(lote)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(lote)}
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

      {/* Modal LOTE (z-index 50) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl">
                {editingLote ? 'Editar Lote' : 'Novo Lote'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm mb-2">Código do Lote *</label>
                  <input
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <AsyncSearchSelect<SearchVacinaResponse>
                    label="Vacina *"
                    placeholder="Digite para buscar..."
                    fetchData={vacinasService.buscarVacinaPeloNome}
                    initialValue={selectedVacinaObj}
                    getDisplayValue={(v) => `${v.nome} - ${v.fabricante_nome}`} 
                    renderItem={(v) => (
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{v.nome}</span>
                        <span className="text-xs text-gray-500">{v.fabricante_nome}</span>
                      </div>
                    )}
                    onSelect={(v) => {
                      if (v) {
                         const id = (v.id || '').toString();
                         setFormData({ ...formData, vacinaId: id });
                      } else {
                         setFormData({ ...formData, vacinaId: '' });
                      }
                    }}
                  />
                </div>

                <div>
                   {/* Label com Link para abrir Modal de Novo Fornecedor */}
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">Fornecedor *</label>
                    <button
                      type="button"
                      onClick={handleOpenFornecedorModal}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Novo
                    </button>
                  </div>
                  
                  <AsyncSearchSelect<FornecedorResponse>
                    label="" // Label já renderizado acima customizado
                    placeholder="Nome ou CNPJ..."
                    fetchData={fornecedoresService.buscarPorNome}
                    initialValue={selectedFornecedorObj}
                    getDisplayValue={(f) => f.nome}
                    renderItem={(f) => (
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{f.nome}</span>
                        <span className="text-xs text-gray-500">{f.cnpj}</span>
                      </div>
                    )}
                    onSelect={(f) => {
                       if (f) {
                         setFormData({ ...formData, fornecedor: f.cnpj });
                       } else {
                         setFormData({ ...formData, fornecedor: '' });
                       }
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Data de Chegada *</label>
                  <input
                    type="date"
                    value={formData.dataFabricacao}
                    onChange={(e) => setFormData({ ...formData, dataFabricacao: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Data de Validade *</label>
                  <input
                    type="date"
                    value={formData.dataValidade}
                    onChange={(e) => setFormData({ ...formData, dataValidade: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Quantidade *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantidade}
                    onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
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
                  {editingLote ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal FORNECEDOR (z-index 60 = acima do modal de lote) */}
      {showFornecedorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Novo Fornecedor</h2>
            </div>
            
            <form onSubmit={handleSubmitFornecedor} className="p-6">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm mb-2">Nome do Fornecedor *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={fornecedorForm.nome}
                    onChange={e => setFornecedorForm({...fornecedorForm, nome: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">CNPJ *</label>
                  <input
                    type="text"
                    required
                    placeholder="00.000.000/0000-00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={fornecedorForm.cnpj}
                    onChange={e => setFornecedorForm({...fornecedorForm, cnpj: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Telefone *</label>
                  <input
                    type="text"
                    required
                    placeholder="(00) 0000-0000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={fornecedorForm.telefone}
                    onChange={e => setFornecedorForm({...fornecedorForm, telefone: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={handleCloseFornecedorModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Salvar Fornecedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}