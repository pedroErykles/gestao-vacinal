import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Calendar, TrendingUp, Activity, Award, Download, Filter } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function RelatoriosPage() {
  const { aplicacoes, vacinas, lotes, pacientes, campanhas } = useApp();
  const [anoSelecionado, setAnoSelecionado] = useState('2024');
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  const [vacinaFiltro, setVacinaFiltro] = useState('');

  // Aplicações filtradas
  const aplicacoesFiltradas = useMemo(() => {
    return aplicacoes.filter(aplicacao => {
      const data = new Date(aplicacao.dataAplicacao);
      const ano = data.getFullYear() === parseInt(anoSelecionado);
      
      let periodo = true;
      if (periodoInicio && periodoFim) {
        const inicio = new Date(periodoInicio);
        const fim = new Date(periodoFim);
        periodo = data >= inicio && data <= fim;
      }
      
      const vacina = !vacinaFiltro || aplicacao.vacinaId === vacinaFiltro;
      
      return ano && periodo && vacina;
    });
  }, [aplicacoes, anoSelecionado, periodoInicio, periodoFim, vacinaFiltro]);

  // Dados para gráfico de aplicações por mês
  const aplicacoesPorMes = useMemo(() => {
    const meses = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    
    const dados = meses.map((mes, index) => {
      const count = aplicacoesFiltradas.filter(aplicacao => {
        const data = new Date(aplicacao.dataAplicacao);
        return data.getMonth() === index;
      }).length;
      
      return { mes, total: count };
    });
    
    return dados;
  }, [aplicacoesFiltradas]);

  // Dados para gráfico de aplicações por vacina
  const aplicacoesPorVacina = useMemo(() => {
    const vacinasCount: { [key: string]: number } = {};
    
    aplicacoesFiltradas.forEach(aplicacao => {
      const vacinaId = aplicacao.vacinaId;
      vacinasCount[vacinaId] = (vacinasCount[vacinaId] || 0) + 1;
    });
    
    return Object.entries(vacinasCount).map(([vacinaId, count]) => {
      const vacina = vacinas.find(v => v.id === vacinaId);
      return {
        nome: vacina?.nome || 'Desconhecida',
        total: count,
      };
    }).sort((a, b) => b.total - a.total);
  }, [aplicacoesFiltradas, vacinas]);

  // Dados para gráfico de aplicações por local
  const aplicacoesPorLocal = useMemo(() => {
    const locaisCount: { [key: string]: number } = {};
    
    aplicacoesFiltradas.forEach(aplicacao => {
      const local = aplicacao.local;
      locaisCount[local] = (locaisCount[local] || 0) + 1;
    });
    
    return Object.entries(locaisCount).map(([local, count]) => ({
      nome: local,
      total: count,
    })).sort((a, b) => b.total - a.total);
  }, [aplicacoesFiltradas]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const totalAplicacoes = aplicacoesFiltradas.length;
    
    // Média mensal
    const mediaMensal = Math.round(totalAplicacoes / 12);
    
    // Vacina mais aplicada
    const vacinaMaisAplicada = aplicacoesPorVacina.length > 0 
      ? aplicacoesPorVacina[0].nome 
      : 'N/A';
    
    // Mês com mais aplicações
    const mesMaisAtivo = aplicacoesPorMes.reduce((max, mes) => 
      mes.total > max.total ? mes : max
    , aplicacoesPorMes[0]);

    // Total de pacientes vacinados (únicos)
    const pacientesVacinados = new Set(aplicacoesFiltradas.map(a => a.pacienteId)).size;

    return {
      totalAplicacoes,
      mediaMensal,
      vacinaMaisAplicada,
      mesMaisAtivo: mesMaisAtivo?.mes || 'N/A',
      pacientesVacinados,
    };
  }, [aplicacoesFiltradas, aplicacoesPorVacina, aplicacoesPorMes]);

  const exportarCSV = () => {
    const headers = ['Data', 'Paciente', 'Vacina', 'Dose', 'Local', 'Profissional'];
    const rows = aplicacoesFiltradas.map(aplicacao => {
      const paciente = pacientes.find(p => p.id === aplicacao.pacienteId);
      const vacina = vacinas.find(v => v.id === aplicacao.vacinaId);
      return [
        new Date(aplicacao.dataAplicacao).toLocaleDateString('pt-BR'),
        paciente?.nome || 'N/A',
        vacina?.nome || 'N/A',
        `${aplicacao.dose}ª dose`,
        aplicacao.local,
        aplicacao.profissionalNome
      ];
    });

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_vacinacao_${anoSelecionado}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Relatório exportado com sucesso!');
  };

  const limparFiltros = () => {
    setPeriodoInicio('');
    setPeriodoFim('');
    setVacinaFiltro('');
    toast.info('Filtros limpos');
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Relatórios e Análises</h1>
        <p className="text-gray-600">Visualização de dados e estatísticas de vacinação</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg">Filtros</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm mb-2">Ano</label>
            <select
              value={anoSelecionado}
              onChange={(e) => setAnoSelecionado(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2">Período Início</label>
            <input
              type="date"
              value={periodoInicio}
              onChange={(e) => setPeriodoInicio(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Período Fim</label>
            <input
              type="date"
              value={periodoFim}
              onChange={(e) => setPeriodoFim(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Vacina</label>
            <select
              value={vacinaFiltro}
              onChange={(e) => setVacinaFiltro(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Todas</option>
              {vacinas.map(vacina => (
                <option key={vacina.id} value={vacina.id}>{vacina.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          <button
            onClick={limparFiltros}
            className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            Limpar filtros
          </button>
          <button
            onClick={exportarCSV}
            className="px-4 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Total de Aplicações</p>
          <p className="text-3xl">{stats.totalAplicacoes}</p>
          <p className="text-xs text-gray-500 mt-1">filtradas</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Pacientes Vacinados</p>
          <p className="text-3xl">{stats.pacientesVacinados}</p>
          <p className="text-xs text-gray-500 mt-1">únicos</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Média Mensal</p>
          <p className="text-3xl">{stats.mediaMensal}</p>
          <p className="text-xs text-gray-500 mt-1">aplicações/mês</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Vacina Mais Aplicada</p>
          <p className="text-sm">{stats.vacinaMaisAplicada}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-pink-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-pink-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Mês Mais Ativo</p>
          <p className="text-3xl">{stats.mesMaisAtivo}</p>
          <p className="text-xs text-gray-500 mt-1">de {anoSelecionado}</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de Aplicações por Mês */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl mb-6">Aplicações por Mês</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={aplicacoesPorMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#3B82F6" name="Aplicações" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Aplicações por Vacina */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl mb-6">Distribuição por Vacina</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={aplicacoesPorVacina}
                dataKey="total"
                nameKey="nome"
                cx="50%"
                cy="50%"
                outerRadius={100}
              >

                {aplicacoesPorVacina.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Tendência */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl mb-6">Tendência de Vacinação</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={aplicacoesPorMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Aplicações"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Aplicações por Local */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl mb-6">Aplicações por Local</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={aplicacoesPorLocal} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="nome" type="category" width={120} />
              <Tooltip />
              <Bar dataKey="total" fill="#F59E0B" name="Aplicações" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela Resumida */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl mb-4">Resumo Mensal Detalhado</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Mês</th>
                <th className="px-6 py-3 text-right text-sm text-gray-600">Total de Aplicações</th>
                <th className="px-6 py-3 text-right text-sm text-gray-600">% do Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {aplicacoesPorMes.map((mes) => {
                const percentual = stats.totalAplicacoes > 0 
                  ? ((mes.total / stats.totalAplicacoes) * 100).toFixed(1)
                  : '0.0';
                return (
                  <tr key={mes.mes} className="hover:bg-gray-50">
                    <td className="px-6 py-3">{mes.mes}</td>
                    <td className="px-6 py-3 text-right">{mes.total}</td>
                    <td className="px-6 py-3 text-right">{percentual}%</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-300">
              <tr>
                <td className="px-6 py-3 font-medium">Total</td>
                <td className="px-6 py-3 text-right font-medium">{stats.totalAplicacoes}</td>
                <td className="px-6 py-3 text-right font-medium">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}