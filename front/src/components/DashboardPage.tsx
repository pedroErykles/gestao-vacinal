import { useState, useEffect } from 'react';
import { Calendar, Package, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { toast } from 'sonner';

import api from '../lib/axios';
import { dashboardService } from '../services/relatorios/dashboard';
import { campanhasService } from '../services/campanha/campanha';
import { lotesService } from '../services/ubs/lote';

interface StatCard {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  bgColor: string;
  textColor: string;
}

export function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);

  const [aplicacoesPorDia, setAplicacoesPorDia] = useState<any[]>([]);
  const [aplicacoesPorVacina, setAplicacoesPorVacina] = useState<any[]>([]);
  const [estoquePorVacina, setEstoquePorVacina] = useState<any[]>([]);
  
  const [campanhasAtivas, setCampanhasAtivas] = useState<any[]>([]);
  const [ultimasAplicacoes, setUltimasAplicacoes] = useState<any[]>([]);
  
  const [statsValues, setStatsValues] = useState({
    dosesDisponiveis: 0,
    qtdCampanhasAtivas: 0,
    aplicacoesHoje: 0,
    lotesVencendo: 0
  });

  const loadData = async () => {
    try {
      setIsLoading(true);

      const [
        dadosDias,
        dadosVacinas,
        dadosEstoque,
        listaCampanhas,
        listaLotes,
        resUltimasApps
      ] = await Promise.all([
        dashboardService.getAplicacoesUltimos7Dias(),
        dashboardService.getAplicacoesPorVacina(),
        dashboardService.getEstoquePorVacina(),
        campanhasService.listar(),
        lotesService.listar(),
        api.get('/ubs/aplicacoes')
      ]);

      setAplicacoesPorDia(dadosDias.map(d => ({ dia: d.dia, aplicacoes: d.total })));
      
      setAplicacoesPorVacina(dadosVacinas.slice(0, 10).map(v => ({ nome: v.vacina, total: v.total })));
      
      setEstoquePorVacina(dadosEstoque.map(e => ({ nome: e.vacina, estoque: e.quantidade })));


      const totalDoses = dadosEstoque.reduce((acc, curr) => acc + curr.quantidade, 0);

      const hojeStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const appsHoje = dadosDias.find(d => d.dia === hojeStr)?.total || 0;

      const now = new Date();
      const campanhasFiltradas = listaCampanhas.filter((c: any) => {
        return c.ativa && new Date(c.data_fim) >= now;
      });
      setCampanhasAtivas(campanhasFiltradas);

      const lotesCriticos = listaLotes.filter((l: any) => {
        const validade = new Date(l.validade || l.dataValidade);
        const diffTime = validade.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 30;
      }).length;

      setStatsValues({
        dosesDisponiveis: totalDoses,
        qtdCampanhasAtivas: campanhasFiltradas.length,
        aplicacoesHoje: appsHoje,
        lotesVencendo: lotesCriticos
      });

      setUltimasAplicacoes(resUltimasApps.data);

    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar dados do dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats: StatCard[] = [
    {
      label: 'Doses Disponíveis',
      value: statsValues.dosesDisponiveis.toLocaleString(),
      icon: Package,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
    },
    {
      label: 'Campanhas Ativas',
      value: statsValues.qtdCampanhasAtivas,
      icon: Calendar,
      color: 'bg-green-500',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
    },
    {
      label: 'Aplicações Hoje',
      value: statsValues.aplicacoesHoje,
      icon: FileText,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
    },
    {
      label: 'Lotes a Vencer',
      value: statsValues.lotesVencendo,
      icon: AlertTriangle,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-500 text-sm">Carregando indicadores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Dashboard</h1>
        <p className="text-gray-600">Visão geral do sistema de vacinação municipal</p>
      </div>

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
              <p className="text-3xl font-semibold">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl mb-4">Aplicações nos Últimos 7 Dias</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={aplicacoesPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="aplicacoes" stroke="#3b82f6" strokeWidth={2} name="Aplicações" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl mb-4">Aplicações por Vacina</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aplicacoesPorVacina}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" tick={{fontSize: 12}} interval={0} angle={-45} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" fill="#3b82f6" name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl mb-4">Estoque Disponível por Vacina</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={estoquePorVacina}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" tick={{fontSize: 12}} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="estoque" fill="#10b981" name="Doses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl mb-4">Campanhas Ativas</h2>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {campanhasAtivas.length > 0 ? (
              campanhasAtivas.map((campanha: any) => (
                <div key={campanha.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <h3 className="mb-1 font-medium text-gray-900">{campanha.nome}</h3>
                  <p className="text-sm text-gray-600 mb-2">{campanha.publico_alvo}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(campanha.data_inicio).toLocaleDateString('pt-BR')} até{' '}
                      {new Date(campanha.data_fim).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">Nenhuma campanha ativa no momento</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl mb-4">Últimas Aplicações</h2>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {ultimasAplicacoes.length > 0 ? (
              ultimasAplicacoes.map((aplicacao: any) => (
                <div key={aplicacao.id_aplicacao} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="mb-1 font-medium text-gray-900">
                        {aplicacao.lote?.vacina?.nome || aplicacao.vacina_nome || 'Vacina'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {aplicacao.paciente?.nome || 'Paciente'}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                          Dose {aplicacao.dose}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                           • {aplicacao.local}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap ml-4">
                      {new Date(aplicacao.data).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">Nenhuma aplicação registrada</p>
            )}
          </div>
        </div>
      </div>

      {statsValues.lotesVencendo > 0 && (
        <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-orange-900 mb-1 font-medium">Atenção: Lotes próximos ao vencimento</h3>
              <p className="text-sm text-orange-700">
                Existem <strong>{statsValues.lotesVencendo}</strong> lote(s) que vencem nos próximos 30 dias. 
                Verifique a página de Gestão de Lotes para tomar providências.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}