import { useApp } from '../context/AppContext';
import { Syringe, Calendar, Package, FileText, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

export function DashboardPage() {
  const { vacinas, campanhas, aplicacoes, lotes, pacientes } = useApp();

  // Calcular estatísticas
  const totalDosesDisponiveis = lotes.reduce((sum, l) => sum + l.quantidadeAtual, 0);
  const campanhasAtivas = campanhas.filter(c => c.ativa && new Date(c.dataFim) >= new Date()).length;
  const aplicacoesHoje = aplicacoes.filter(a => a.dataAplicacao === new Date().toISOString().split('T')[0]).length;
  const lotesProximoVencimento = lotes.filter(l => {
    const hoje = new Date();
    const vencimento = new Date(l.dataValidade);
    const diasParaVencer = Math.floor((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diasParaVencer <= 30 && diasParaVencer > 0;
  }).length;

  const stats = [
    {
      label: 'Doses Disponíveis',
      value: totalDosesDisponiveis.toLocaleString(),
      icon: Package,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
    },
    {
      label: 'Campanhas Ativas',
      value: campanhasAtivas,
      icon: Calendar,
      color: 'bg-green-500',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
    },
    {
      label: 'Aplicações Hoje',
      value: aplicacoesHoje,
      icon: FileText,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
    },
    {
      label: 'Lotes a Vencer',
      value: lotesProximoVencimento,
      icon: AlertTriangle,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600',
    },
  ];

  // Dados para gráfico de aplicações por vacina
  const aplicacoesPorVacina = vacinas.map(vacina => ({
    nome: vacina.nome.length > 15 ? vacina.nome.substring(0, 15) + '...' : vacina.nome,
    total: aplicacoes.filter(a => a.vacinaId === vacina.id).length
  })).filter(item => item.total > 0).sort((a, b) => b.total - a.total);

  // Dados para gráfico de estoque por vacina
  const estoquePorVacina = vacinas.map(vacina => {
    const lotesVacina = lotes.filter(l => l.vacinaId === vacina.id);
    const estoque = lotesVacina.reduce((sum, l) => sum + l.quantidadeAtual, 0);
    return {
      nome: vacina.nome.length > 15 ? vacina.nome.substring(0, 15) + '...' : vacina.nome,
      estoque
    };
  }).filter(item => item.estoque > 0);

  // Dados para gráfico de aplicações ao longo do tempo (últimos 7 dias)
  const ultimosDias = Array.from({ length: 7 }, (_, i) => {
    const data = new Date();
    data.setDate(data.getDate() - (6 - i));
    return data.toISOString().split('T')[0];
  });

  const aplicacoesPorDia = ultimosDias.map(dia => ({
    dia: new Date(dia).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    aplicacoes: aplicacoes.filter(a => a.dataAplicacao === dia).length
  }));

  // Cores para os gráficos
  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

  // Últimas aplicações
  const ultimasAplicacoes = aplicacoes.slice(-5).reverse();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Dashboard</h1>
        <p className="text-gray-600">Visão geral do sistema de vacinação municipal</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de Aplicações por Dia */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl mb-4">Aplicações nos Últimos 7 Dias</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={aplicacoesPorDia}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="aplicacoes" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Aplicações por Vacina */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl mb-4">Aplicações por Vacina</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={aplicacoesPorVacina}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de Estoque */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl mb-4">Estoque Disponível por Vacina</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={estoquePorVacina}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="nome" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="estoque" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Seções de Informações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campanhas Ativas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl mb-4">Campanhas Ativas</h2>
          <div className="space-y-3">
            {campanhas.filter(c => c.ativa && new Date(c.dataFim) >= new Date()).map((campanha) => (
              <div key={campanha.id} className="border border-gray-200 rounded-lg p-4">
                <h3 className="mb-1">{campanha.nome}</h3>
                <p className="text-sm text-gray-600 mb-2">{campanha.publicoAlvo}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(campanha.dataInicio).toLocaleDateString('pt-BR')} até{' '}
                    {new Date(campanha.dataFim).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            ))}
            {campanhas.filter(c => c.ativa && new Date(c.dataFim) >= new Date()).length === 0 && (
              <p className="text-gray-500 text-center py-4">Nenhuma campanha ativa no momento</p>
            )}
          </div>
        </div>

        {/* Últimas Aplicações */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl mb-4">Últimas Aplicações</h2>
          <div className="space-y-3">
            {ultimasAplicacoes.length > 0 ? (
              ultimasAplicacoes.map((aplicacao) => {
                const vacina = vacinas.find(v => v.id === aplicacao.vacinaId);
                const paciente = pacientes.find(p => p.id === aplicacao.pacienteId);
                return (
                  <div key={aplicacao.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="mb-1">{vacina?.nome}</h3>
                        <p className="text-sm text-gray-600">{paciente?.nome}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            Dose {aplicacao.dose}
                          </span>
                          <span className="text-xs text-gray-500">{aplicacao.local}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(aplicacao.dataAplicacao).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhuma aplicação registrada</p>
            )}
          </div>
        </div>
      </div>

      {/* Alertas */}
      {lotesProximoVencimento > 0 && (
        <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-orange-900 mb-1">Atenção: Lotes próximos ao vencimento</h3>
              <p className="text-sm text-orange-700">
                Existem {lotesProximoVencimento} lote(s) que vencem nos próximos 30 dias. 
                Verifique a seção de Lotes para mais detalhes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}