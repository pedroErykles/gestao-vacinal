import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Calendar, TrendingUp, Activity, Award, Download, Filter, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { graficosService } from '../services/relatorios/relatorios';
import { vacinasService, type VacinaResponse } from '../services/vacina/vacina';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const StatValue = ({ loading, value, suffix }: { loading: boolean, value: string | number, suffix?: string }) => {
  if (loading) {
    return <Loader2 className="h-8 w-8 animate-spin text-gray-300" />;
  }
  return (
    <>
      <span className="text-3xl">{value}</span>
      {suffix && <p className="text-xs text-gray-500 mt-1">{suffix}</p>}
    </>
  );
};

export function RelatoriosPage() {
  const [anoSelecionado, setAnoSelecionado] = useState('2024');
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  const [vacinaFiltro, setVacinaFiltro] = useState('');
  
  const [listaVacinas, setListaVacinas] = useState<VacinaResponse[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  

  const [data, setData] = useState({
    stats: {
      totalAplicacoes: 0,
      mediaMensal: 0,
      vacinaMaisAplicada: '-',
      mesMaisAtivo: '-',
      pacientesVacinados: 0
    },
    graficos: {
      porMes: [] as any[],
      porVacina: [] as any[],
      porLocal: [] as any[]
    }
  });

  useEffect(() => {
    vacinasService.listar().then(setListaVacinas).catch(console.error);
  }, []);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const resultado = await graficosService.getStats({
        ano: anoSelecionado,
        dataInicio: periodoInicio || undefined,
        dataFim: periodoFim || undefined,
        vacinaId: vacinaFiltro || undefined
      });

      const porMesAdaptado = resultado.aplicacoes_por_mes.map(item => ({
        mes: item.name,  
        total: item.value 
      }));

      const porVacinaAdaptado = resultado.aplicacoes_por_vacina.map(item => ({
        nome: item.name,
        total: item.value
      }));

      const porLocalAdaptado = resultado.aplicacoes_por_local.map(item => ({
        nome: item.name,
        total: item.value
      }));

      setData({
        stats: {
          totalAplicacoes: resultado.total_aplicacoes,
          mediaMensal: resultado.media_mensal,
          vacinaMaisAplicada: resultado.vacina_mais_aplicada,
          mesMaisAtivo: resultado.mes_mais_ativo,
          pacientesVacinados: resultado.pacientes_vacinados
        },
        graficos: {
          porMes: porMesAdaptado,
          porVacina: porVacinaAdaptado,
          porLocal: porLocalAdaptado
        }
      });

    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, [anoSelecionado, periodoInicio, periodoFim, vacinaFiltro]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);


  const exportarCSV = async () => {
    try {
      toast.info('Preparando download...');
      const dadosExport = await graficosService.getExportData({
        ano: anoSelecionado,
        dataInicio: periodoInicio || undefined,
        dataFim: periodoFim || undefined,
        vacinaId: vacinaFiltro || undefined
      });

      if (dadosExport.length === 0) {
        toast.warning("Nenhum dado encontrado para exportar.");
        return;
      }

      const headers = ['Data', 'Paciente', 'Vacina', 'Dose', 'Local', 'Profissional'];
      const rows = dadosExport.map(row => [
        new Date(row.data_aplicacao).toLocaleDateString('pt-BR'),
        row.paciente_nome,
        row.vacina_nome,
        `${row.dose}ª dose`,
        row.local,
        row.profissional_nome
      ]);

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio_${anoSelecionado}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      toast.error("Erro ao exportar.");
    }
  };

  const limparFiltros = () => {
    setPeriodoInicio('');
    setPeriodoFim('');
    setVacinaFiltro('');
    toast.info('Filtros limpos');
  };

  const { stats, graficos } = data;

  return (
    <div className="p-8">
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
              {listaVacinas.map(vacina => (
                <option key={vacina.codigo_vacina} value={vacina.codigo_vacina}>{vacina.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          <button onClick={limparFiltros} className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg">
            Limpar filtros
          </button>
          <button onClick={exportarCSV} className="px-4 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg flex items-center gap-2">
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-blue-100 p-3 rounded-lg"><Activity className="w-6 h-6 text-blue-600" /></div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Total de Aplicações</p>
          <div className="min-h-[48px] flex flex-col justify-center">
             <StatValue loading={isLoading} value={stats.totalAplicacoes} suffix="filtradas" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-purple-100 p-3 rounded-lg"><Activity className="w-6 h-6 text-purple-600" /></div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Pacientes Vacinados</p>
          <div className="min-h-[48px] flex flex-col justify-center">
            <StatValue loading={isLoading} value={stats.pacientesVacinados} suffix="únicos" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-green-100 p-3 rounded-lg"><TrendingUp className="w-6 h-6 text-green-600" /></div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Média Mensal</p>
          <div className="min-h-[48px] flex flex-col justify-center">
            <StatValue loading={isLoading} value={stats.mediaMensal} suffix="aplicações/mês" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-orange-100 p-3 rounded-lg"><Award className="w-6 h-6 text-orange-600" /></div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Vacina Mais Aplicada</p>
          <div className="min-h-[48px] flex flex-col justify-center">
            <StatValue loading={isLoading} value={stats.vacinaMaisAplicada} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-pink-100 p-3 rounded-lg"><Calendar className="w-6 h-6 text-pink-600" /></div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Mês Mais Ativo</p>
          <div className="min-h-[48px] flex flex-col justify-center">
            <StatValue loading={isLoading} value={stats.mesMaisAtivo} suffix={`de ${anoSelecionado}`} />
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de Aplicações por Mês */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl mb-6">Aplicações por Mês</h2>
          <div className="h-[300px]">
            {/* Verifica se tem dados antes de renderizar para evitar glitch, ou mostra vazio */}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graficos.porMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" fill="#3B82F6" name="Aplicações" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Aplicações por Vacina */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl mb-6">Distribuição por Vacina</h2>
          <div className="h-[300px]">
            {graficos.porVacina.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={graficos.porVacina}
                    dataKey="total"
                    nameKey="nome"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {graficos.porVacina.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">Sem dados para o período</div>
            )}
          </div>
        </div>

        {/* Gráfico de Tendência */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl mb-6">Tendência de Vacinação</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={graficos.porMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#10B981" strokeWidth={2} name="Aplicações" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Aplicações por Local */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl mb-6">Aplicações por Local</h2>
          <div className="h-[300px]">
            {graficos.porLocal.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graficos.porLocal} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="nome" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#F59E0B" name="Aplicações" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">Sem dados para o período</div>
            )}
          </div>
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
                <th className="px-6 py-3 text-right text-sm text-gray-600">Total</th>
                <th className="px-6 py-3 text-right text-sm text-gray-600">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {graficos.porMes.map((mes) => {
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