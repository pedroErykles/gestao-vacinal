import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FileText, Plus, Edit2, Trash2, Search, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import type { AplicacaoVacina, Paciente } from '../context/AppContext';

export function RegistrosPage() {
  const { 
    aplicacoes, 
    vacinas, 
    lotes, 
    pacientes, 
    addAplicacao, 
    updateAplicacao, 
    deleteAplicacao,
    addPaciente 
  } = useApp();
  
  const [showModal, setShowModal] = useState(false);
  const [showPacienteModal, setShowPacienteModal] = useState(false);
  const [editingAplicacao, setEditingAplicacao] = useState<AplicacaoVacina | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVacina, setFilterVacina] = useState('');
  const [filterPeriodo, setFilterPeriodo] = useState('todos');
  
  const [formData, setFormData] = useState({
    pacienteId: '',
    vacinaId: '',
    loteId: '',
    dataAplicacao: new Date().toISOString().split('T')[0],
    dose: '1',
    profissionalNome: '',
    local: '',
    observacoes: '',
  });

  const [pacienteFormData, setPacienteFormData] = useState({
    nome: '',
    cpf: '',
    dataNascimento: '',
    telefone: '',
    email: '',
  });

  const resetForm = () => {
    setFormData({
      pacienteId: '',
      vacinaId: '',
      loteId: '',
      dataAplicacao: new Date().toISOString().split('T')[0],
      dose: '1',
      profissionalNome: '',
      local: '',
      observacoes: '',
    });
    setEditingAplicacao(null);
  };

  const resetPacienteForm = () => {
    setPacienteFormData({
      nome: '',
      cpf: '',
      dataNascimento: '',
      telefone: '',
      email: '',
    });
  };

  const handleOpenModal = (aplicacao?: AplicacaoVacina) => {
    if (aplicacao) {
      setEditingAplicacao(aplicacao);
      setFormData({
        pacienteId: aplicacao.pacienteId,
        vacinaId: aplicacao.vacinaId,
        loteId: aplicacao.loteId,
        dataAplicacao: aplicacao.dataAplicacao,
        dose: aplicacao.dose.toString(),
        profissionalNome: aplicacao.profissionalNome,
        local: aplicacao.local,
        observacoes: aplicacao.observacoes || '',
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

  const handleOpenPacienteModal = () => {
    resetPacienteForm();
    setShowPacienteModal(true);
  };

  const handleClosePacienteModal = () => {
    setShowPacienteModal(false);
    resetPacienteForm();
  };

  const validarCPF = (cpf: string) => {
    const cpfLimpo = cpf.replace(/[^\d]/g, '');
    return cpfLimpo.length === 11;
  };

  const handleSubmitPaciente = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarCPF(pacienteFormData.cpf)) {
      toast.error('CPF inválido');
      return;
    }

    // Verificar CPF único
    const cpfExiste = pacientes.some(p => p.cpf === pacienteFormData.cpf);
    if (cpfExiste) {
      toast.error('Já existe um paciente cadastrado com este CPF');
      return;
    }

    addPaciente(pacienteFormData);
    toast.success('Paciente cadastrado com sucesso!');
    handleClosePacienteModal();
  };

  const calcularProximaDose = (vacinaId: string, dataAplicacao: string, dose: number): string | undefined => {
    const vacina = vacinas.find(v => v.id === vacinaId);
    if (!vacina || dose >= vacina.numeroDoses || !vacina.intervaloMinimoDias) {
      return undefined;
    }

    const dataAtual = new Date(dataAplicacao);
    dataAtual.setDate(dataAtual.getDate() + vacina.intervaloMinimoDias);
    return dataAtual.toISOString().split('T')[0];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.pacienteId || !formData.vacinaId || !formData.loteId || 
        !formData.profissionalNome || !formData.local) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const dose = parseInt(formData.dose);
    const vacina = vacinas.find(v => v.id === formData.vacinaId);
    
    if (!vacina) {
      toast.error('Vacina não encontrada');
      return;
    }

    if (dose < 1 || dose > vacina.numeroDoses) {
      toast.error(`Dose inválida. Esta vacina possui ${vacina.numeroDoses} dose(s)`);
      return;
    }

    // Verificar estoque do lote
    const lote = lotes.find(l => l.id === formData.loteId);
    if (!lote || lote.quantidadeAtual <= 0) {
      toast.error('Lote sem estoque disponível');
      return;
    }

    // Calcular próxima dose
    const proximaDose = calcularProximaDose(formData.vacinaId, formData.dataAplicacao, dose);

    if (editingAplicacao) {
      updateAplicacao(editingAplicacao.id, {
        pacienteId: formData.pacienteId,
        vacinaId: formData.vacinaId,
        loteId: formData.loteId,
        dataAplicacao: formData.dataAplicacao,
        dose,
        profissionalNome: formData.profissionalNome,
        local: formData.local,
        proximaDose,
        observacoes: formData.observacoes,
      });
      toast.success('Registro atualizado com sucesso!');
    } else {
      addAplicacao({
        pacienteId: formData.pacienteId,
        vacinaId: formData.vacinaId,
        loteId: formData.loteId,
        dataAplicacao: formData.dataAplicacao,
        dose,
        profissionalNome: formData.profissionalNome,
        local: formData.local,
        proximaDose,
        observacoes: formData.observacoes,
      });
      toast.success('Aplicação registrada com sucesso!');
    }
    
    handleCloseModal();
  };

  const handleDelete = (aplicacao: AplicacaoVacina) => {
    const paciente = pacientes.find(p => p.id === aplicacao.pacienteId);
    if (window.confirm(`Deseja realmente excluir este registro de ${paciente?.nome}?`)) {
      deleteAplicacao(aplicacao.id);
      toast.success('Registro excluído com sucesso!');
    }
  };

  const getPacienteNome = (pacienteId: string) => {
    return pacientes.find(p => p.id === pacienteId)?.nome || 'N/A';
  };

  const getPacienteCPF = (pacienteId: string) => {
    return pacientes.find(p => p.id === pacienteId)?.cpf || 'N/A';
  };

  const getVacinaNome = (vacinaId: string) => {
    return vacinas.find(v => v.id === vacinaId)?.nome || 'N/A';
  };

  const getLoteCodigo = (loteId: string) => {
    return lotes.find(l => l.id === loteId)?.codigo || 'N/A';
  };

  // Filtros
  const filteredAplicacoes = aplicacoes.filter(aplicacao => {
    const pacienteNome = getPacienteNome(aplicacao.pacienteId).toLowerCase();
    const vacinaNome = getVacinaNome(aplicacao.vacinaId).toLowerCase();
    const matchesSearch = pacienteNome.includes(searchTerm.toLowerCase()) ||
                         vacinaNome.includes(searchTerm.toLowerCase());
    
    const matchesVacina = !filterVacina || aplicacao.vacinaId === filterVacina;
    
    let matchesPeriodo = true;
    if (filterPeriodo !== 'todos') {
      const dataAplicacao = new Date(aplicacao.dataAplicacao);
      const hoje = new Date();
      const diff = Math.floor((hoje.getTime() - dataAplicacao.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (filterPeriodo) {
        case '7dias':
          matchesPeriodo = diff <= 7;
          break;
        case '30dias':
          matchesPeriodo = diff <= 30;
          break;
        case '90dias':
          matchesPeriodo = diff <= 90;
          break;
      }
    }
    
    return matchesSearch && matchesVacina && matchesPeriodo;
  });

  // Estatísticas
  const totalAplicacoes = aplicacoes.length;
  const aplicacoesHoje = aplicacoes.filter(a => a.dataAplicacao === new Date().toISOString().split('T')[0]).length;
  const aplicacoesMes = aplicacoes.filter(a => {
    const data = new Date(a.dataAplicacao);
    const hoje = new Date();
    return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
  }).length;
  const proximasDoses = aplicacoes.filter(a => a.proximaDose).length;

  // Filtrar lotes por vacina selecionada
  const lotesDisponiveis = formData.vacinaId 
    ? lotes.filter(l => l.vacinaId === formData.vacinaId && l.quantidadeAtual > 0)
    : [];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Registros de Aplicação</h1>
        <p className="text-gray-600">Controle e histórico de vacinações aplicadas</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total de Aplicações</p>
              <p className="text-3xl mt-2">{totalAplicacoes}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Aplicações Hoje</p>
              <p className="text-3xl mt-2">{aplicacoesHoje}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Este Mês</p>
              <p className="text-3xl mt-2">{aplicacoesMes}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Próximas Doses</p>
              <p className="text-3xl mt-2">{proximasDoses}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Calendar className="w-8 h-8 text-orange-600" />
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
              placeholder="Buscar por paciente ou vacina..."
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
              value={filterPeriodo}
              onChange={(e) => setFilterPeriodo(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="todos">Todos os períodos</option>
              <option value="7dias">Últimos 7 dias</option>
              <option value="30dias">Últimos 30 dias</option>
              <option value="90dias">Últimos 90 dias</option>
            </select>

            <button
              onClick={() => handleOpenModal()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              Nova Aplicação
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Registros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Data</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Paciente</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">CPF</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Vacina</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Dose</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Lote</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Local</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Profissional</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Próxima Dose</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAplicacoes.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                filteredAplicacoes.map(aplicacao => (
                  <tr key={aplicacao.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">
                      {new Date(aplicacao.dataAplicacao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">{getPacienteNome(aplicacao.pacienteId)}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {getPacienteCPF(aplicacao.pacienteId)}
                    </td>
                    <td className="px-6 py-4">{getVacinaNome(aplicacao.vacinaId)}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                        {aplicacao.dose}ª dose
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{getLoteCodigo(aplicacao.loteId)}</td>
                    <td className="px-6 py-4 text-sm">{aplicacao.local}</td>
                    <td className="px-6 py-4 text-sm">{aplicacao.profissionalNome}</td>
                    <td className="px-6 py-4 text-sm">
                      {aplicacao.proximaDose ? (
                        <span className="text-orange-600">
                          {new Date(aplicacao.proximaDose).toLocaleDateString('pt-BR')}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(aplicacao)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(aplicacao)}
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
                {editingAplicacao ? 'Editar Registro' : 'Nova Aplicação'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm">Paciente *</label>
                    <button
                      type="button"
                      onClick={handleOpenPacienteModal}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      + Cadastrar novo paciente
                    </button>
                  </div>
                  <select
                    value={formData.pacienteId}
                    onChange={(e) => setFormData({ ...formData, pacienteId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Selecione...</option>
                    {pacientes.map(paciente => (
                      <option key={paciente.id} value={paciente.id}>
                        {paciente.nome} - {paciente.cpf}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2">Vacina *</label>
                  <select
                    value={formData.vacinaId}
                    onChange={(e) => setFormData({ ...formData, vacinaId: e.target.value, loteId: '' })}
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
                  <label className="block text-sm mb-2">Lote *</label>
                  <select
                    value={formData.loteId}
                    onChange={(e) => setFormData({ ...formData, loteId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                    disabled={!formData.vacinaId}
                  >
                    <option value="">Selecione...</option>
                    {lotesDisponiveis.map(lote => (
                      <option key={lote.id} value={lote.id}>
                        {lote.codigo} (Estoque: {lote.quantidadeAtual})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2">Data de Aplicação *</label>
                  <input
                    type="date"
                    value={formData.dataAplicacao}
                    onChange={(e) => setFormData({ ...formData, dataAplicacao: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Dose *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.dose}
                    onChange={(e) => setFormData({ ...formData, dose: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Profissional Responsável *</label>
                  <input
                    type="text"
                    value={formData.profissionalNome}
                    onChange={(e) => setFormData({ ...formData, profissionalNome: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Local de Aplicação *</label>
                  <input
                    type="text"
                    value={formData.local}
                    onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ex: UBS Central"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm mb-2">Observações</label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Informações adicionais sobre a aplicação..."
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
                  {editingAplicacao ? 'Atualizar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Cadastro de Paciente */}
      {showPacienteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl">Cadastrar Paciente</h2>
            </div>

            <form onSubmit={handleSubmitPaciente} className="p-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm mb-2">Nome Completo *</label>
                  <input
                    type="text"
                    value={pacienteFormData.nome}
                    onChange={(e) => setPacienteFormData({ ...pacienteFormData, nome: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">CPF *</label>
                  <input
                    type="text"
                    value={pacienteFormData.cpf}
                    onChange={(e) => setPacienteFormData({ ...pacienteFormData, cpf: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="000.000.000-00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Data de Nascimento *</label>
                  <input
                    type="date"
                    value={pacienteFormData.dataNascimento}
                    onChange={(e) => setPacienteFormData({ ...pacienteFormData, dataNascimento: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Telefone</label>
                  <input
                    type="tel"
                    value={pacienteFormData.telefone}
                    onChange={(e) => setPacienteFormData({ ...pacienteFormData, telefone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">E-mail</label>
                  <input
                    type="email"
                    value={pacienteFormData.email}
                    onChange={(e) => setPacienteFormData({ ...pacienteFormData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={handleClosePacienteModal}
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