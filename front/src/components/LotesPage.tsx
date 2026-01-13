import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Package, Plus, Edit2, Trash2, AlertTriangle, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import type { Lote } from '../context/AppContext';

export function LotesPage() {
  const { lotes, vacinas, fabricantes, addLote, updateLote, deleteLote } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingLote, setEditingLote] = useState<Lote | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVacina, setFilterVacina] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  
  const [formData, setFormData] = useState({
    codigo: '',
    vacinaId: '',
    fabricanteId: '',
    dataValidade: '',
    dataFabricacao: '',
    quantidadeInicial: '',
    quantidadeAtual: '',
    fornecedor: '',
  });

  const resetForm = () => {
    setFormData({
      codigo: '',
      vacinaId: '',
      fabricanteId: '',
      dataValidade: '',
      dataFabricacao: '',
      quantidadeInicial: '',
      quantidadeAtual: '',
      fornecedor: '',
    });
    setEditingLote(null);
  };

  const handleOpenModal = (lote?: Lote) => {
    if (lote) {
      setEditingLote(lote);
      setFormData({
        codigo: lote.codigo,
        vacinaId: lote.vacinaId,
        fabricanteId: lote.fabricanteId,
        dataValidade: lote.dataValidade,
        dataFabricacao: lote.dataFabricacao,
        quantidadeInicial: lote.quantidadeInicial.toString(),
        quantidadeAtual: lote.quantidadeAtual.toString(),
        fornecedor: lote.fornecedor || '',
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.codigo || !formData.vacinaId || !formData.fabricanteId || 
        !formData.dataValidade || !formData.dataFabricacao) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const quantidadeInicial = parseInt(formData.quantidadeInicial);
    const quantidadeAtual = parseInt(formData.quantidadeAtual);

    if (isNaN(quantidadeInicial) || quantidadeInicial <= 0) {
      toast.error('Quantidade inicial deve ser maior que zero');
      return;
    }

    if (isNaN(quantidadeAtual) || quantidadeAtual < 0) {
      toast.error('Quantidade atual deve ser maior ou igual a zero');
      return;
    }

    if (quantidadeAtual > quantidadeInicial) {
      toast.error('Quantidade atual não pode ser maior que quantidade inicial');
      return;
    }

    // Validar datas
    const dataFab = new Date(formData.dataFabricacao);
    const dataVal = new Date(formData.dataValidade);
    
    if (dataVal <= dataFab) {
      toast.error('Data de validade deve ser posterior à data de fabricação');
      return;
    }

    if (editingLote) {
      updateLote(editingLote.id, {
        codigo: formData.codigo,
        vacinaId: formData.vacinaId,
        fabricanteId: formData.fabricanteId,
        dataValidade: formData.dataValidade,
        dataFabricacao: formData.dataFabricacao,
        quantidadeInicial,
        quantidadeAtual,
        fornecedor: formData.fornecedor,
      });
      toast.success('Lote atualizado com sucesso!');
    } else {
      addLote({
        codigo: formData.codigo,
        vacinaId: formData.vacinaId,
        fabricanteId: formData.fabricanteId,
        dataValidade: formData.dataValidade,
        dataFabricacao: formData.dataFabricacao,
        quantidadeInicial,
        quantidadeAtual,
        fornecedor: formData.fornecedor,
      });
      toast.success('Lote cadastrado com sucesso!');
    }
    
    handleCloseModal();
  };

  const handleDelete = (lote: Lote) => {
    if (window.confirm(`Deseja realmente excluir o lote ${lote.codigo}?`)) {
      deleteLote(lote.id);
      toast.success('Lote excluído com sucesso!');
    }
  };

  const getVacinaNome = (vacinaId: string) => {
    return vacinas.find(v => v.id === vacinaId)?.nome || 'N/A';
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
    return diasParaVencer <= 30 && diasParaVencer >= 0;
  };

  const getLoteStatus = (lote: Lote) => {
    if (isLoteVencido(lote.dataValidade)) return 'vencido';
    if (isLoteProximoVencimento(lote.dataValidade)) return 'proximo-vencimento';
    if (lote.quantidadeAtual === 0) return 'esgotado';
    if (lote.quantidadeAtual < lote.quantidadeInicial * 0.1) return 'estoque-baixo';
    return 'normal';
  };

  const getStatusBadge = (lote: Lote) => {
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

  // Filtros
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

  // Estatísticas
  const totalLotes = lotes.length;
  const lotesVencidos = lotes.filter(l => isLoteVencido(l.dataValidade)).length;
  const lotesProximoVencimento = lotes.filter(l => isLoteProximoVencimento(l.dataValidade)).length;
  const totalDosesDisponiveis = lotes.reduce((sum, l) => sum + l.quantidadeAtual, 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Gestão de Lotes</h1>
        <p className="text-gray-600">Controle e gerenciamento de lotes de vacinas</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total de Lotes</p>
              <p className="text-3xl mt-2">{totalLotes}</p>
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
              <p className="text-3xl mt-2">{totalDosesDisponiveis.toLocaleString()}</p>
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
              <p className="text-3xl mt-2">{lotesProximoVencimento}</p>
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
              <p className="text-3xl mt-2">{lotesVencidos}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Ações e Filtros */}
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
                <option key={vacina.id} value={vacina.id}>{vacina.nome}</option>
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

      {/* Tabela de Lotes */}
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
                        <span className="font-medium">{lote.quantidadeAtual.toLocaleString()}</span>
                        <span className="text-xs text-gray-500">de {lote.quantidadeInicial.toLocaleString()}</span>
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

      {/* Modal de Cadastro/Edição */}
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
                  <label className="block text-sm mb-2">Vacina *</label>
                  <select
                    value={formData.vacinaId}
                    onChange={(e) => setFormData({ ...formData, vacinaId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Selecione...</option>
                    {vacinas.map(vacina => (
                      <option key={vacina.id} value={vacina.id}>{vacina.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2">Fabricante *</label>
                  <select
                    value={formData.fabricanteId}
                    onChange={(e) => setFormData({ ...formData, fabricanteId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Selecione...</option>
                    {fabricantes.map(fabricante => (
                      <option key={fabricante.id} value={fabricante.id}>{fabricante.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2">Fornecedor</label>
                  <input
                    type="text"
                    value={formData.fornecedor}
                    onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Data de Fabricação *</label>
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
                  <label className="block text-sm mb-2">Quantidade Inicial *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantidadeInicial}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        quantidadeInicial: e.target.value,
                        quantidadeAtual: formData.quantidadeAtual || e.target.value 
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Quantidade Atual *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantidadeAtual}
                    onChange={(e) => setFormData({ ...formData, quantidadeAtual: e.target.value })}
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
    </div>
  );
}
