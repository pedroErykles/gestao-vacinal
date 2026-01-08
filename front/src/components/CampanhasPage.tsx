import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Search, Edit2, Trash2, Calendar, Users, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export function CampanhasPage() {
  const { campanhas, vacinas, addCampanha, updateCampanha, deleteCampanha } = useApp();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todas');
  const [showModal, setShowModal] = useState(false);
  const [editingCampanha, setEditingCampanha] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    dataInicio: '',
    dataFim: '',
    publicoAlvo: '',
    descricao: '',
    vacinas: [] as string[],
    ativa: true,
  });

  const campanhasFiltradas = useMemo(() => {
    return campanhas.filter((campanha) => {
      const matchSearch = campanha.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campanha.publicoAlvo.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchStatus = true;
      if (filterStatus !== 'todas') {
        const now = new Date();
        const inicio = new Date(campanha.dataInicio);
        const fim = new Date(campanha.dataFim);
        
        if (filterStatus === 'ativas') {
          matchStatus = campanha.ativa && now >= inicio && now <= fim;
        } else if (filterStatus === 'agendadas') {
          matchStatus = now < inicio;
        } else if (filterStatus === 'encerradas') {
          matchStatus = now > fim || !campanha.ativa;
        }
      }
      
      return matchSearch && matchStatus;
    });
  }, [campanhas, searchTerm, filterStatus]);

  const resetForm = () => {
    setFormData({
      nome: '',
      dataInicio: '',
      dataFim: '',
      publicoAlvo: '',
      descricao: '',
      vacinas: [],
      ativa: true,
    });
    setEditingCampanha(null);
  };

  const handleOpenModal = (campanha?: any) => {
    if (campanha) {
      setFormData({
        nome: campanha.nome,
        dataInicio: campanha.dataInicio,
        dataFim: campanha.dataFim,
        publicoAlvo: campanha.publicoAlvo,
        descricao: campanha.descricao || '',
        vacinas: campanha.vacinas,
        ativa: campanha.ativa,
      });
      setEditingCampanha(campanha);
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
    
    if (!formData.nome || !formData.dataInicio || !formData.dataFim || !formData.publicoAlvo) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.vacinas.length === 0) {
      toast.error('Selecione pelo menos uma vacina');
      return;
    }

    // Validar datas
    const dataInicio = new Date(formData.dataInicio);
    const dataFim = new Date(formData.dataFim);
    
    if (dataFim <= dataInicio) {
      toast.error('Data de término deve ser posterior à data de início');
      return;
    }

    if (editingCampanha) {
      updateCampanha(editingCampanha.id, formData);
      toast.success('Campanha atualizada com sucesso!');
    } else {
      addCampanha(formData);
      toast.success('Campanha cadastrada com sucesso!');
    }
    
    handleCloseModal();
  };

  const handleDelete = (campanha: any) => {
    if (window.confirm(`Tem certeza que deseja excluir a campanha "${campanha.nome}"?`)) {
      deleteCampanha(campanha.id);
      toast.success('Campanha excluída com sucesso!');
    }
  };

  const handleToggleAtiva = (campanha: any) => {
    updateCampanha(campanha.id, { ativa: !campanha.ativa });
    toast.success(campanha.ativa ? 'Campanha desativada' : 'Campanha ativada');
  };

  const handleVacinaToggle = (vacinaId: string) => {
    setFormData(prev => ({
      ...prev,
      vacinas: prev.vacinas.includes(vacinaId)
        ? prev.vacinas.filter(id => id !== vacinaId)
        : [...prev.vacinas, vacinaId]
    }));
  };

  const getCampanhaStatus = (campanha: any) => {
    const now = new Date();
    const inicio = new Date(campanha.dataInicio);
    const fim = new Date(campanha.dataFim);
    
    if (!campanha.ativa) return { label: 'Desativada', color: 'bg-gray-100 text-gray-700' };
    if (now < inicio) return { label: 'Agendada', color: 'bg-blue-100 text-blue-700' };
    if (now > fim) return { label: 'Encerrada', color: 'bg-gray-100 text-gray-700' };
    return { label: 'Ativa', color: 'bg-green-100 text-green-700' };
  };

  // Estatísticas
  const campanhasAtivas = campanhas.filter(c => {
    const now = new Date();
    const inicio = new Date(c.dataInicio);
    const fim = new Date(c.dataFim);
    return c.ativa && now >= inicio && now <= fim;
  }).length;

  const campanhasAgendadas = campanhas.filter(c => {
    const now = new Date();
    const inicio = new Date(c.dataInicio);
    return now < inicio;
  }).length;

  const campanhasEncerradas = campanhas.filter(c => {
    const now = new Date();
    const fim = new Date(c.dataFim);
    return now > fim || !c.ativa;
  }).length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Gestão de Campanhas</h1>
        <p className="text-gray-600">Cadastro e gerenciamento de campanhas de vacinação</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total de Campanhas</p>
              <p className="text-3xl mt-2">{campanhas.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Campanhas Ativas</p>
              <p className="text-3xl mt-2">{campanhasAtivas}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Agendadas</p>
              <p className="text-3xl mt-2">{campanhasAgendadas}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Encerradas</p>
              <p className="text-3xl mt-2">{campanhasEncerradas}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
              <XCircle className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Ações */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar campanhas por nome ou público-alvo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="todas">Todas as campanhas</option>
              <option value="ativas">Ativas</option>
              <option value="agendadas">Agendadas</option>
              <option value="encerradas">Encerradas</option>
            </select>

            <button
              onClick={() => handleOpenModal()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              Nova Campanha
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Campanhas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campanhasFiltradas.map((campanha) => {
          const status = getCampanhaStatus(campanha);
          return (
            <div key={campanha.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg flex-1">{campanha.nome}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                
                {campanha.descricao && (
                  <p className="text-sm text-gray-600 mb-3">{campanha.descricao}</p>
                )}
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{campanha.publicoAlvo}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(campanha.dataInicio).toLocaleDateString('pt-BR')} até{' '}
                      {new Date(campanha.dataFim).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-600 mb-2">Vacinas:</p>
                  <div className="flex flex-wrap gap-1">
                    {campanha.vacinas.map(vacinaId => {
                      const vacina = vacinas.find(v => v.id === vacinaId);
                      return (
                        <span key={vacinaId} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                          {vacina?.nome}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleToggleAtiva(campanha)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      campanha.ativa 
                        ? 'text-orange-600 hover:bg-orange-50' 
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={campanha.ativa ? 'Desativar' : 'Ativar'}
                  >
                    {campanha.ativa ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    <span className="text-sm">{campanha.ativa ? 'Desativar' : 'Ativar'}</span>
                  </button>
                  <button
                    onClick={() => handleOpenModal(campanha)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="text-sm">Editar</span>
                  </button>
                  <button
                    onClick={() => handleDelete(campanha)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm">Excluir</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {campanhasFiltradas.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          Nenhuma campanha encontrada
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl">
                {editingCampanha ? 'Editar Campanha' : 'Nova Campanha'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm mb-2">Nome da Campanha *</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ex: Campanha COVID-19 2024"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm mb-2">Público-Alvo *</label>
                  <input
                    type="text"
                    value={formData.publicoAlvo}
                    onChange={(e) => setFormData({ ...formData, publicoAlvo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ex: Adultos acima de 18 anos"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Descrição</label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Descrição da campanha..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2">Data de Início *</label>
                    <input
                      type="date"
                      value={formData.dataInicio}
                      onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-2">Data de Término *</label>
                    <input
                      type="date"
                      value={formData.dataFim}
                      onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2">Vacinas Disponíveis *</label>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                    {vacinas.map(vacina => (
                      <label key={vacina.id} className="flex items-center gap-2 py-2 cursor-pointer hover:bg-gray-50 px-2 rounded">
                        <input
                          type="checkbox"
                          checked={formData.vacinas.includes(vacina.id)}
                          onChange={() => handleVacinaToggle(vacina.id)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm">{vacina.nome}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.ativa}
                      onChange={(e) => setFormData({ ...formData, ativa: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm">Campanha ativa</span>
                  </label>
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
                  {editingCampanha ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}