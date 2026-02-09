import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Calendar, Users, CheckCircle, XCircle, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

import { campanhasService, type CampanhaResponse } from '../services/campanha/campanha';
import { vacinasService, type VacinaResponse } from '../services/vacina/vacina';

import { AsyncSearchSelect } from '../components/AsyncSearchSelect';

const ADMIN_ID_FIXO = "88967ab8-cd93-44c6-b64b-d3e869f20c9d"; 

interface CampanhaUI extends CampanhaResponse {}

export function CampanhasPage() {
  const [campanhas, setCampanhas] = useState<CampanhaUI[]>([]);
  const [vacinas, setVacinas] = useState<VacinaResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todas');
  const [showModal, setShowModal] = useState(false);
  const [editingCampanha, setEditingCampanha] = useState<CampanhaUI | null>(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    dataInicio: '',
    dataFim: '',
    publicoAlvo: '',
    descricao: '',
    vacinas: [] as string[],
    ativa: true,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [listaCampanhas, listaVacinas] = await Promise.all([
        campanhasService.listar(),
        vacinasService.listar()
      ]);
      setCampanhas(listaCampanhas);
      setVacinas(listaVacinas);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar dados.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const buscarVacinasDisponiveis = async (query: string) => {
    return vacinas.filter(v => 
      v.nome.toLowerCase().includes(query.toLowerCase()) && 
      !formData.vacinas.includes(v.codigo_vacina.toString())
    );
  };

  const handleAddVacina = (vacina: VacinaResponse | null) => {
    if (!vacina) return;
    const id = vacina.codigo_vacina.toString();
    
    if (!formData.vacinas.includes(id)) {
      setFormData(prev => ({
        ...prev,
        vacinas: [...prev.vacinas, id]
      }));
    }
  };

  const handleRemoveVacina = (idToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      vacinas: prev.vacinas.filter(id => id !== idToRemove)
    }));
  };

  const campanhasFiltradas = useMemo(() => {
    return campanhas.filter((campanha) => {
      const termo = searchTerm.toLowerCase();
      const nomeMatch = campanha.nome?.toLowerCase().includes(termo) ?? false;
      const publicoMatch = campanha.publico_alvo?.toLowerCase().includes(termo) ?? false;
      const matchSearch = nomeMatch || publicoMatch;
      
      let matchStatus = true;
      if (filterStatus !== 'todas') {
        const now = new Date();
        const inicio = new Date(campanha.data_inicio);
        const fim = new Date(campanha.data_fim);
        
        if (filterStatus === 'ativas') matchStatus = campanha.ativa && now >= inicio && now <= fim;
        else if (filterStatus === 'agendadas') matchStatus = now < inicio;
        else if (filterStatus === 'encerradas') matchStatus = now > fim || !campanha.ativa;
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

  const handleOpenModal = (campanha?: CampanhaUI) => {
    if (campanha) {
      setEditingCampanha(campanha);
      setFormData({
        nome: campanha.nome,
        dataInicio: campanha.data_inicio.split('T')[0],
        dataFim: campanha.data_fim.split('T')[0],
        publicoAlvo: campanha.publico_alvo,
        descricao: campanha.descricao || '',
        vacinas: campanha.vacina_ids.map(String),
        ativa: campanha.ativa,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.dataInicio || !formData.dataFim || !formData.publicoAlvo) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    if (formData.vacinas.length === 0) {
      toast.error('Selecione pelo menos uma vacina');
      return;
    }

    if (formData.dataFim <= formData.dataInicio) {
      toast.error('Data final deve ser maior que inicial');
      return;
    }

    const payload = {
      nome: formData.nome,
      data_inicio: new Date(formData.dataInicio).toISOString(),
      data_fim: new Date(formData.dataFim).toISOString(),
      admin_id: ADMIN_ID_FIXO,
      vacina_ids: formData.vacinas.map(Number),
      publico_alvo: formData.publicoAlvo,
      descricao: formData.descricao,
      ativa: formData.ativa
    };

    try {
      if (editingCampanha) {
        await campanhasService.atualizar(editingCampanha.id, payload);
        toast.success('Atualizado com sucesso!');
      } else {
        await campanhasService.criar(payload);
        toast.success('Criado com sucesso!');
      }
      loadData();
      handleCloseModal();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar.');
    }
  };

  const handleDelete = async (campanha: CampanhaUI) => {
    if (window.confirm(`Excluir "${campanha.nome}"?`)) {
      try {
        await campanhasService.deletar(campanha.id);
        toast.success('Excluído!');
        loadData();
      } catch (error) { toast.error('Erro ao excluir.'); }
    }
  };

  const handleToggleAtiva = async (campanha: CampanhaUI) => {
    try {
      await campanhasService.atualizar(campanha.id, {
        nome: campanha.nome,
        data_inicio: campanha.data_inicio,
        data_fim: campanha.data_fim,
        admin_id: ADMIN_ID_FIXO,
        vacina_ids: campanha.vacina_ids,
        publico_alvo: campanha.publico_alvo,
        descricao: campanha.descricao,
        ativa: !campanha.ativa
      });
      toast.success('Status atualizado!');
      loadData();
    } catch (error) { toast.error("Erro ao alterar status."); }
  };

  const getCampanhaStatus = (campanha: CampanhaUI) => {
    const now = new Date();
    const inicio = new Date(campanha.data_inicio);
    const fim = new Date(campanha.data_fim);
    if (!campanha.ativa) return { label: 'Desativada', color: 'bg-gray-100 text-gray-700' };
    if (now < inicio) return { label: 'Agendada', color: 'bg-blue-100 text-blue-700' };
    if (now > fim) return { label: 'Encerrada', color: 'bg-gray-100 text-gray-700' };
    return { label: 'Ativa', color: 'bg-green-100 text-green-700' };
  };

  const stats = {
    total: campanhas.length,
    ativas: campanhas.filter(c => c.ativa && new Date() >= new Date(c.data_inicio) && new Date() <= new Date(c.data_fim)).length,
    agendadas: campanhas.filter(c => c.ativa && new Date() < new Date(c.data_inicio)).length,
    encerradas: campanhas.filter(c => !c.ativa || new Date() > new Date(c.data_fim)).length
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Gestão de Campanhas</h1>
        <p className="text-gray-600">Cadastro e gerenciamento de campanhas de vacinação</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total</p>
              <p className="text-3xl mt-2">{isLoading ? <Loader2 className="animate-spin"/> : stats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg"><Calendar className="w-8 h-8 text-blue-600" /></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Ativas</p>
              <p className="text-3xl mt-2">{isLoading ? '...' : stats.ativas}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg"><CheckCircle className="w-8 h-8 text-green-600" /></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Agendadas</p>
              <p className="text-3xl mt-2">{isLoading ? '...' : stats.agendadas}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg"><Calendar className="w-8 h-8 text-blue-600" /></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Encerradas</p>
              <p className="text-3xl mt-2">{isLoading ? '...' : stats.encerradas}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg"><XCircle className="w-8 h-8 text-gray-600" /></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar..."
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
              <option value="todas">Todas</option>
              <option value="ativas">Ativas</option>
              <option value="agendadas">Agendadas</option>
              <option value="encerradas">Encerradas</option>
            </select>
            <button
              onClick={() => handleOpenModal()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Nova Campanha
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campanhasFiltradas.map((campanha) => {
          const status = getCampanhaStatus(campanha);
          return (
            <div key={campanha.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg flex-1 font-medium">{campanha.nome}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${status.color}`}>{status.label}</span>
                </div>
                {campanha.descricao && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{campanha.descricao}</p>}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" /> <span>{campanha.publico_alvo}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" /> 
                    <span>{new Date(campanha.data_inicio).toLocaleDateString()} até {new Date(campanha.data_fim).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-xs text-gray-600 mb-2">Vacinas:</p>
                  <div className="flex flex-wrap gap-1">
                    {campanha.vacina_ids.map(vacinaId => {
                      const vacina = vacinas.find(v => v.codigo_vacina === vacinaId);
                      return <span key={vacinaId} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{vacina?.nome || `#${vacinaId}`}</span>;
                    })}
                  </div>
                </div>
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button onClick={() => handleToggleAtiva(campanha)} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg ${campanha.ativa ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}>
                    {campanha.ativa ? <XCircle className="w-4 h-4"/> : <CheckCircle className="w-4 h-4"/>} <span className="text-sm">{campanha.ativa ? 'Desativar' : 'Ativar'}</span>
                  </button>
                  <button onClick={() => handleOpenModal(campanha)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Edit2 className="w-4 h-4" /> <span className="text-sm">Editar</span>
                  </button>
                  <button onClick={() => handleDelete(campanha)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" /> <span className="text-sm">Excluir</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl">{editingCampanha ? 'Editar Campanha' : 'Nova Campanha'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm mb-2">Nome *</label>
                  <input type="text" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm mb-2">Público-Alvo *</label>
                  <input type="text" value={formData.publicoAlvo} onChange={e => setFormData({ ...formData, publicoAlvo: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm mb-2">Descrição</label>
                  <textarea value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2">Início *</label>
                    <input type="date" value={formData.dataInicio} onChange={e => setFormData({ ...formData, dataInicio: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Término *</label>
                    <input type="date" value={formData.dataFim} onChange={e => setFormData({ ...formData, dataFim: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2">Vacinas Disponíveis *</label>
                  
                  <AsyncSearchSelect<VacinaResponse>
                    label=""
                    placeholder="Digite para adicionar uma vacina..."
                    fetchData={buscarVacinasDisponiveis} 
                    initialValue={null}
                    getDisplayValue={(v) => v.nome}
                    clearAfterSelect ={true}
                    renderItem={(v) => (
                      <div className="flex flex-col">
                        <span className="font-medium">{v.nome}</span>
                        <span className="text-xs text-gray-500">{v.fabricante?.nome}</span>
                      </div>
                    )}
                    onSelect={handleAddVacina}
                  />

                  <div className="mt-3 flex flex-wrap gap-2 min-h-[40px] p-2 border border-gray-100 rounded-lg bg-gray-50">
                    {formData.vacinas.length === 0 && <span className="text-sm text-gray-400 italic p-1">Nenhuma vacina selecionada.</span>}
                    
                    {formData.vacinas.map(id => {
                      const vacina = vacinas.find(v => v.codigo_vacina.toString() === id);
                      return (
                        <div key={id} className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          <span>{vacina?.nome || `Vacina ${id}`}</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveVacina(id)}
                            className="hover:text-red-600 focus:outline-none"
                            title="Remover"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.ativa} onChange={e => setFormData({ ...formData, ativa: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm">Campanha ativa</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={handleCloseModal} className="flex-1 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
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