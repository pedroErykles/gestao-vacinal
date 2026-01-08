import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Search, Edit2, Trash2, Syringe } from 'lucide-react';
import { toast } from 'sonner';

export function VacinasPage() {
  const { vacinas, fabricantes, addVacina, updateVacina, deleteVacina, addFabricante } = useApp();
  
  // States para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFabricante, setFilterFabricante] = useState('');
  const [filterDoses, setFilterDoses] = useState('');
  
  // States para dialog
  const [showModal, setShowModal] = useState(false);
  const [showFabricanteModal, setShowFabricanteModal] = useState(false);
  const [editingVacina, setEditingVacina] = useState<any>(null);
  
  // States para formulário de vacina
  const [formData, setFormData] = useState({
    nome: '',
    fabricanteId: '',
    numeroDoses: '1',
    descricao: '',
    intervaloMinimoDias: '',
  });

  // States para formulário de fabricante
  const [fabricanteFormData, setFabricanteFormData] = useState({
    nome: '',
    cnpj: '',
    contato: '',
  });

  // Vacinas filtradas
  const vacinasFiltradas = useMemo(() => {
    return vacinas.filter((vacina) => {
      const matchSearch = vacina.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFabricante = !filterFabricante || vacina.fabricanteId === filterFabricante;
      const matchDoses = !filterDoses || vacina.numeroDoses.toString() === filterDoses;
      return matchSearch && matchFabricante && matchDoses;
    });
  }, [vacinas, searchTerm, filterFabricante, filterDoses]);

  const resetForm = () => {
    setFormData({
      nome: '',
      fabricanteId: '',
      numeroDoses: '1',
      descricao: '',
      intervaloMinimoDias: '',
    });
    setEditingVacina(null);
  };

  const resetFabricanteForm = () => {
    setFabricanteFormData({
      nome: '',
      cnpj: '',
      contato: '',
    });
  };

  const handleOpenModal = (vacina?: any) => {
    if (vacina) {
      setFormData({
        nome: vacina.nome,
        fabricanteId: vacina.fabricanteId,
        numeroDoses: vacina.numeroDoses.toString(),
        descricao: vacina.descricao || '',
        intervaloMinimoDias: vacina.intervaloMinimoDias?.toString() || '',
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

  const handleOpenFabricanteModal = () => {
    resetFabricanteForm();
    setShowFabricanteModal(true);
  };

  const handleCloseFabricanteModal = () => {
    setShowFabricanteModal(false);
    resetFabricanteForm();
  };

  const validarCNPJ = (cnpj: string) => {
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
    return cnpjLimpo.length === 14;
  };

  const handleSubmitFabricante = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarCNPJ(fabricanteFormData.cnpj)) {
      toast.error('CNPJ inválido');
      return;
    }

    addFabricante(fabricanteFormData);
    toast.success('Fabricante cadastrado com sucesso!');
    handleCloseFabricanteModal();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.fabricanteId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const numeroDoses = parseInt(formData.numeroDoses);
    if (isNaN(numeroDoses) || numeroDoses < 1 || numeroDoses > 10) {
      toast.error('Número de doses deve estar entre 1 e 10');
      return;
    }

    const intervaloMinimoDias = formData.intervaloMinimoDias ? parseInt(formData.intervaloMinimoDias) : undefined;
    if (intervaloMinimoDias && (isNaN(intervaloMinimoDias) || intervaloMinimoDias < 0)) {
      toast.error('Intervalo mínimo deve ser um número positivo');
      return;
    }

    const vacinaData = {
      nome: formData.nome,
      fabricanteId: formData.fabricanteId,
      numeroDoses,
      descricao: formData.descricao,
      intervaloMinimoDias,
    };

    if (editingVacina) {
      updateVacina(editingVacina.id, vacinaData);
      toast.success('Vacina atualizada com sucesso!');
    } else {
      addVacina(vacinaData);
      toast.success('Vacina cadastrada com sucesso!');
    }
    
    handleCloseModal();
  };

  const handleDelete = (vacina: any) => {
    if (window.confirm(`Tem certeza que deseja excluir a vacina "${vacina.nome}"?`)) {
      deleteVacina(vacina.id);
      toast.success('Vacina excluída com sucesso!');
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterFabricante('');
    setFilterDoses('');
  };

  const getFabricanteNome = (fabricanteId: string) => {
    return fabricantes.find(f => f.id === fabricanteId)?.nome || 'N/A';
  };

  // Estatísticas
  const totalVacinas = vacinas.length;
  const totalFabricantes = fabricantes.length;

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
              <p className="text-3xl mt-2">{totalVacinas}</p>
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
              <p className="text-3xl mt-2">{totalFabricantes}</p>
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
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome da vacina..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex gap-4">
            <select
              value={filterFabricante}
              onChange={(e) => setFilterFabricante(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="">Todos os fabricantes</option>
              {fabricantes.map(f => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>

            <select
              value={filterDoses}
              onChange={(e) => setFilterDoses(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="">Todas as doses</option>
              <option value="1">1 dose</option>
              <option value="2">2 doses</option>
              <option value="3">3 doses</option>
            </select>

            <button
              onClick={() => handleOpenModal()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              Nova Vacina
            </button>
          </div>
        </div>

        {(searchTerm || filterFabricante || filterDoses) && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-blue-600 hover:underline"
          >
            Limpar filtros
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
                <th className="px-6 py-4 text-left text-sm text-gray-600">Intervalo (dias)</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Descrição</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {vacinasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Nenhuma vacina encontrada
                  </td>
                </tr>
              ) : (
                vacinasFiltradas.map((vacina) => (
                  <tr key={vacina.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-medium">{vacina.nome}</span>
                    </td>
                    <td className="px-6 py-4 text-sm">{getFabricanteNome(vacina.fabricanteId)}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                        {vacina.numeroDoses} {vacina.numeroDoses === 1 ? 'dose' : 'doses'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {vacina.intervaloMinimoDias ? `${vacina.intervaloMinimoDias} dias` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {vacina.descricao ? (
                        <span className="max-w-xs truncate block">{vacina.descricao}</span>
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

      {/* Modal de Cadastro/Edição */}
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
                      onClick={handleOpenFabricanteModal}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      + Adicionar fabricante
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
                      <option key={f.id} value={f.id}>{f.nome}</option>
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

                <div>
                  <label className="block text-sm mb-2">Intervalo Mínimo (dias)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.intervaloMinimoDias}
                    onChange={(e) => setFormData({ ...formData, intervaloMinimoDias: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ex: 28"
                  />
                  <p className="text-xs text-gray-500 mt-1">Intervalo mínimo entre doses em dias</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm mb-2">Descrição</label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Descrição da vacina..."
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

      {/* Modal de Cadastro de Fabricante */}
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
                  <label className="block text-sm mb-2">Contato *</label>
                  <input
                    type="text"
                    value={fabricanteFormData.contato}
                    onChange={(e) => setFabricanteFormData({ ...fabricanteFormData, contato: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="(00) 0000-0000"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={handleCloseFabricanteModal}
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