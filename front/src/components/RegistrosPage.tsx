import { useState, useEffect, useRef } from "react";
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Search,
  Calendar,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { AsyncSearchSelect } from "../components/AsyncSearchSelect";

import {
  aplicacaoService,
  type AplicacaoUI,
  type DoseInfo,
} from "../services/aplicacoes/aplicacoes";
import {
  unidadeService,
  type BuscaUnidadeSaude,
  type UnidadeResponse,
} from "../services/ubs/unidade";
import { lotesService, type LoteResponse } from "../services/ubs/lote";
import {
  vacinasService,
  type SearchVacinaResponse,
} from "../services/vacina/vacina";
import {
  pacienteService,
  type PacienteSearchResponse,
} from "../services/users/paciente";
import {
  profissionaisService,
  type ProfissionalBuscaResponse,
  type ProfissionalResponse,
} from "../services/profissional/profissional";
import { OptionSelect } from "./ui/OptionSelect";

const ADMIN_ID_FIXO = "88967ab8-cd93-44c6-b64b-d3e869f20c9d";

const formatarCPF = (cpf: string | number | undefined | null): string => {
  if (!cpf) return "";

  const cpfLimpo = cpf.toString().replace(/\D/g, "");

  const cpfPad = cpfLimpo.padStart(11, "0");

  return cpfPad.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

export function RegistrosPage() {
  const doseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickFora = (event: MouseEvent) => {
      if (doseRef.current && !doseRef.current.contains(event.target as Node)) {
        setIsDoseOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickFora);
    return () => {
      document.removeEventListener("mousedown", handleClickFora);
    };
  }, []);

  const [isDoseOpen, setIsDoseOpen] = useState(false);
  const [aplicacoes, setAplicacoes] = useState<AplicacaoUI[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showPacienteModal, setShowPacienteModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [filterVacina, setFilterVacina] = useState("");
  const [filterPeriodo, setFilterPeriodo] = useState("todos");

  const [dosesDisponiveis, setDosesDisponiveis] = useState<DoseInfo[]>([]);
  const [lotesDisponiveis, setLotesDisponiveis] = useState<LoteResponse[]>([]);
  const [todasVacinas, setTodasVacinas] = useState<SearchVacinaResponse[]>([]);

  const [selectedPaciente, setSelectedPaciente] =
    useState<PacienteSearchResponse | null>(null);
  const [selectedVacina, setSelectedVacina] =
    useState<SearchVacinaResponse | null>(null);
  const [selectedProfissional, setSelectedProfissional] =
    useState<ProfissionalBuscaResponse | null>(null);
  const [selectedUnidade, setSelectedUnidade] =
    useState<UnidadeResponse | null>(null);

  const [formData, setFormData] = useState({
    pacienteId: "",
    vacinaId: "",
    loteId: "",
    dataAplicacao: new Date().toISOString().split("T")[0],
    doseId: "",
    profissionalId: "",
    unidadeId: "",
    observacoes: "",
  });

  const [pacienteFormData, setPacienteFormData] = useState({
    nome: "",
    cpf: "",
    dataNascimento: "",
    telefone: "",
    email: "",
  });

  const prepararDosesELotes = async (
    vacinaId: number,
    loteIdAtual?: string,
  ) => {
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const [doses, todosLotes] = await Promise.all([
        aplicacaoService.listarDosesDaVacina(vacinaId),
        lotesService.listar(),
      ]);

      setDosesDisponiveis(doses);

      const filtrados = todosLotes.filter((l) => {
        const dataValidade = new Date(l.validade);
        const isDaVacina = l.vacina_id === vacinaId;
        const emEstoque = l.quantidade > 0;
        const estaValido = dataValidade >= hoje;
        const isLoteAtual = String(l.id_lote) === String(loteIdAtual);

        return isDaVacina && (isLoteAtual || (emEstoque && estaValido));
      });

      setLotesDisponiveis(filtrados);
    } catch (error) {
      toast.error("Erro ao carregar dados complementares");
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [apps, vacinasList] = await Promise.all([
        aplicacaoService.listar(),
        vacinasService.listar(),
      ]);
      setAplicacoes(apps);
      setTodasVacinas(vacinasList);
    } catch (error) {
      toast.error("Erro ao carregar registros.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.vacinaId) {
      const vacinaIdInt = parseInt(formData.vacinaId);
      aplicacaoService
        .listarDosesDaVacina(vacinaIdInt)
        .then(setDosesDisponiveis)
        .catch(() => toast.error("Erro ao carregar doses"));
    }
  }, [formData.vacinaId]);

  const resetForm = () => {
    setFormData({
      pacienteId: "",
      vacinaId: "",
      loteId: "",
      dataAplicacao: new Date().toISOString().split("T")[0],
      doseId: "",
      profissionalId: "",
      unidadeId: "",
      observacoes: "",
    });
    setSelectedPaciente(null);
    setSelectedVacina(null);
    setSelectedProfissional(null);
    setSelectedUnidade(null);
    setEditingId(null);
    setDosesDisponiveis([]);
    setLotesDisponiveis([]);
  };

  const resetPacienteForm = () => {
    setPacienteFormData({
      nome: "",
      cpf: "",
      dataNascimento: "",
      telefone: "",
      email: "",
    });
  };

  const handleOpenModal = async (aplicacao?: AplicacaoUI) => {
    setIsLoading(true);

    if (aplicacao) {
      setEditingId(aplicacao.id_aplicacao);

      await prepararDosesELotes(
        aplicacao.vacina_id,
        aplicacao.lote_id.toString(),
      );

      setSelectedPaciente({
        id: aplicacao.paciente_id,
        nome: aplicacao.nome_paciente,
        cpf: aplicacao.cpf_paciente,
      } as PacienteSearchResponse);
      setSelectedVacina({
        id: aplicacao.vacina_id.toString(),
        nome: aplicacao.nome_vacina,
        fabricante_nome: aplicacao.fabricante_nome || "Não informado",
      } as any);
      setSelectedProfissional({
        id: aplicacao.profissional_id,
        nome: aplicacao.nome_profissional,
      } as any);
      setSelectedUnidade({
        id: aplicacao.unidade_id,
        nome_unidade: aplicacao.nome_unidade,
      } as any);

      setFormData({
        pacienteId: aplicacao.paciente_id,
        vacinaId: aplicacao.vacina_id.toString(),
        loteId: aplicacao.lote_id.toString(),
        dataAplicacao: aplicacao.data ? aplicacao.data.split("T")[0] : "",
        doseId: aplicacao.dose_id?.toString() || "",
        profissionalId: aplicacao.profissional_id,
        unidadeId: aplicacao.unidade_id,
        observacoes: aplicacao.observacoes || "",
      });
      toast.info("Para editar, por favor confirme a Dose.");
    } else {
      resetForm();
    }

    setIsLoading(false);
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

  const handleSubmitPaciente = async (e: React.FormEvent) => {
    e.preventDefault();

    const hoje = new Date().toISOString().split("T")[0];
    if (pacienteFormData.dataNascimento > hoje) {
      toast.error("A data de nascimento não pode ser maior que hoje.");
      return;
    }
    try {
      const novo = await pacienteService.criar({
        nome: pacienteFormData.nome,
        cpf_usuario: pacienteFormData.cpf.replace(/\D/g, ""),
        data_nascimento: pacienteFormData.dataNascimento,
        email: pacienteFormData.email,
        telefone: pacienteFormData.telefone,
      });

      toast.success("Paciente cadastrado com sucesso!");

      setSelectedPaciente({
        id: novo.id,
        nome: novo.nome,
        cpf: novo.cpf || (novo as any).cpf_usuario,
      });
      setFormData((prev) => ({ ...prev, pacienteId: novo.id }));

      handleClosePacienteModal();
    } catch (error: any) {
      console.error("Erro no cadastro:", error);

      const detalhe = error.response?.data?.detail;

      if (Array.isArray(detalhe)) {
        toast.error(`Erro: ${detalhe[0].msg} no campo ${detalhe[0].loc[1]}`);
      } else if (typeof detalhe === "string") {
        toast.error(detalhe);
      } else {
        toast.error("Erro ao cadastrar paciente. Verifique os dados.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.pacienteId ||
      !formData.vacinaId ||
      !formData.loteId ||
      !formData.doseId ||
      !formData.profissionalId ||
      !formData.unidadeId
    ) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const payload = {
      data: new Date(formData.dataAplicacao + "T12:00:00").toISOString(),
      paciente_id: formData.pacienteId,
      profissional_id: formData.profissionalId,
      admin_id: ADMIN_ID_FIXO,
      unidade_id: formData.unidadeId,
      vacina_id: parseInt(formData.vacinaId),
      dose_id: parseInt(formData.doseId),
      lote_id: parseInt(formData.loteId),
      observacoes: formData.observacoes,
    };

    try {
      if (editingId) {
        await aplicacaoService.atualizar(editingId, payload);
        toast.success("Registro atualizado com sucesso!");
      } else {
        await aplicacaoService.criar(payload);
        toast.success("Aplicação registrada com sucesso!");
      }
      loadData();
      handleCloseModal();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Erro ao salvar registro.");
    }
  };

  const handleDelete = async (aplicacao: AplicacaoUI) => {
    if (
      window.confirm(
        `Deseja realmente excluir este registro de ${aplicacao.nome_paciente}?`,
      )
    ) {
      try {
        await aplicacaoService.deletar(aplicacao.id_aplicacao);
        toast.success("Registro excluído com sucesso!");
        loadData();
      } catch (error) {
        toast.error("Erro ao excluir registro.");
      }
    }
  };

  const filteredAplicacoes = aplicacoes.filter((aplicacao) => {
    const termo = searchTerm.toLowerCase();
    const matchesSearch =
      aplicacao.nome_paciente.toLowerCase().includes(termo) ||
      aplicacao.nome_vacina.toLowerCase().includes(termo) ||
      aplicacao.cpf_paciente.includes(termo);

    const matchesVacina =
      !filterVacina || aplicacao.vacina_id.toString() === filterVacina;

    let matchesPeriodo = true;
    if (filterPeriodo !== "todos") {
      const dataApp = new Date(aplicacao.data);
      const hoje = new Date();
      const diff = Math.floor(
        (hoje.getTime() - dataApp.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (filterPeriodo === "7dias") matchesPeriodo = diff <= 7;
      if (filterPeriodo === "30dias") matchesPeriodo = diff <= 30;
      if (filterPeriodo === "90dias") matchesPeriodo = diff <= 90;
    }

    return matchesSearch && matchesVacina && matchesPeriodo;
  });

  const totalAplicacoes = aplicacoes.length;
  const hojeStr = new Date().toISOString().split("T")[0];
  const aplicacoesHoje = aplicacoes.filter((a) =>
    a.data.startsWith(hojeStr),
  ).length;
  const aplicacoesMes = aplicacoes.filter((a) => {
    const d = new Date(a.data);
    const h = new Date();
    return d.getMonth() === h.getMonth() && d.getFullYear() === h.getFullYear();
  }).length;
  const proximasDoses = aplicacoes.filter((a) => a.data_proxima_dose).length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Registros de Aplicação</h1>
        <p className="text-gray-600">
          Controle e histórico de vacinações aplicadas
        </p>
      </div>

      {/* Cards Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total</p>
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
              <p className="text-gray-600 text-sm">Hoje</p>
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

      {/* Barra de Filtros */}
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
              {todasVacinas.map((vacina) => (
                <option key={vacina.id} value={vacina.id}>
                  {vacina.nome}
                </option>
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

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-gray-600">
                  Data
                </th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">
                  Paciente
                </th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">
                  CPF
                </th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">
                  Vacina
                </th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">
                  Dose
                </th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">
                  Lote
                </th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">
                  Local
                </th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">
                  Profissional
                </th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">
                  Próxima Dose
                </th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center">
                    <Loader2 className="animate-spin inline mr-2" />{" "}
                    Carregando...
                  </td>
                </tr>
              ) : filteredAplicacoes.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                filteredAplicacoes.map((aplicacao) => (
                  <tr key={aplicacao.id_aplicacao} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">
                      {new Date(aplicacao.data).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">
                        {aplicacao.nome_paciente}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatarCPF(aplicacao.cpf_paciente)}
                    </td>
                    <td className="px-6 py-4">{aplicacao.nome_vacina}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                        {aplicacao.numero_dose}ª dose
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {aplicacao.codigo_lote}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {aplicacao.nome_unidade}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {aplicacao.nome_profissional}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {aplicacao.data_proxima_dose ? (
                        <span className="text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded">
                          {new Date(
                            aplicacao.data_proxima_dose,
                          ).toLocaleDateString("pt-BR")}
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
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(aplicacao)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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

      {/* MODAL DE APLICAÇÃO */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl">
                {editingId ? "Editar Registro" : "Nova Aplicação"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium">
                      Paciente *
                    </label>
                    <button
                      type="button"
                      onClick={handleOpenPacienteModal}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Cadastrar novo paciente
                    </button>
                  </div>
                  <AsyncSearchSelect<PacienteSearchResponse>
                    label=""
                    placeholder="Digite nome ou CPF..."
                    fetchData={pacienteService.buscarPacientes}
                    initialValue={selectedPaciente}
                    getDisplayValue={(p) => `${p.nome} - ${formatarCPF(p.cpf)}`}
                    renderItem={(p) => (
                      <div>
                        <p className="font-medium">{p.nome}</p>
                        <small>{formatarCPF(p.cpf)}</small>
                      </div>
                    )}
                    onSelect={(p) => {
                      setSelectedPaciente(p);

                      setFormData((prev) => ({
                        ...prev,
                        pacienteId: p?.id || "",
                      }));
                    }}
                  />
                </div>

                <div>
                  <AsyncSearchSelect<SearchVacinaResponse>
                    label="Vacina *"
                    placeholder="Buscar vacina..."
                    fetchData={vacinasService.buscarVacinaPeloNome}
                    initialValue={selectedVacina}
                    getDisplayValue={(v) => `${v.nome} - ${v.fabricante_nome}`}
                    renderItem={(v) => (
                      <span>{`${v.nome} - ${v.fabricante_nome}`}</span>
                    )}
                    onSelect={(v) => {
                      setSelectedVacina(v);
                      setFormData((prev) => ({
                        ...prev,
                        vacinaId: v
                          ? (v.id || (v as any).codigo_vacina).toString()
                          : "",
                        ...(prev.vacinaId !== v?.id?.toString() && {
                          loteId: "",
                          doseId: "",
                        }),
                      }));
                    }}
                  />
                </div>

                <OptionSelect
                  label="Lote"
                  required
                  placeholder="Selecione o lote..."
                  options={lotesDisponiveis.map((lote) => ({
                    id: lote.id_lote,
                    label: `${lote.codigo} [${lote.quantidade} Unidades]`, // Exibe código e estoque
                  }))}
                  value={formData.loteId}
                  onChange={(val) => setFormData({ ...formData, loteId: val })}
                  disabled={!formData.vacinaId || lotesDisponiveis.length === 0}
                />

                <OptionSelect
                  label="Dose"
                  required
                  placeholder="Selecione a dose..."
                  options={dosesDisponiveis.map((d) => ({
                    id: d.id_dose,
                    label: `${d.numero}ª Dose`,
                  }))}
                  value={formData.doseId}
                  onChange={(val) => setFormData({ ...formData, doseId: val })}
                  disabled={!formData.vacinaId || dosesDisponiveis.length === 0}
                />
                <div>
                  <label className="block text-sm mb-2 font-medium">
                    Data de Aplicação *
                  </label>
                  <input
                    type="date"
                    value={formData.dataAplicacao}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dataAplicacao: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <AsyncSearchSelect<ProfissionalBuscaResponse>
                    label="Profissional Responsável *"
                    placeholder="Buscar..."
                    fetchData={profissionaisService.buscarPorNome}
                    initialValue={selectedProfissional}
                    getDisplayValue={(p) => `${p.nome}`}
                    renderItem={(p) => (
                      <span>{`${p.nome} - ${formatarCPF(p.cpf)}`}</span>
                    )}
                    onSelect={(p) =>
                      setFormData((prev) => ({
                        ...prev,
                        profissionalId: p?.id || "",
                      }))
                    }
                  />
                </div>

                <div>
                  <AsyncSearchSelect<BuscaUnidadeSaude>
                    label="Local de Aplicação (Unidade) *"
                    placeholder="Buscar UBS..."
                    fetchData={unidadeService.buscarPorNome}
                    initialValue={selectedUnidade}
                    getDisplayValue={(u) => u.nome_unidade}
                    renderItem={(u) => (
                      <div>
                        <p>{u.nome_unidade}</p>
                      </div>
                    )}
                    onSelect={(u) =>
                      setFormData((prev) => ({
                        ...prev,
                        unidadeId: u?.id || "",
                      }))
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm mb-2">Observações</label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) =>
                      setFormData({ ...formData, observacoes: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={3}
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
                  {editingId ? "Atualizar" : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PACIENTE */}
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
                    onChange={(e) =>
                      setPacienteFormData({
                        ...pacienteFormData,
                        nome: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">CPF *</label>
                  <input
                    type="text"
                    value={pacienteFormData.cpf}
                    onChange={(e) =>
                      setPacienteFormData({
                        ...pacienteFormData,
                        cpf: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="000.000.000-00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">
                    Data de Nascimento *
                  </label>
                  <input
                    type="date"
                    value={pacienteFormData.dataNascimento}
                    onChange={(e) =>
                      setPacienteFormData({
                        ...pacienteFormData,
                        dataNascimento: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Telefone</label>
                  <input
                    type="tel"
                    value={pacienteFormData.telefone}
                    onChange={(e) =>
                      setPacienteFormData({
                        ...pacienteFormData,
                        telefone: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">E-mail</label>
                  <input
                    type="email"
                    value={pacienteFormData.email}
                    onChange={(e) =>
                      setPacienteFormData({
                        ...pacienteFormData,
                        email: e.target.value,
                      })
                    }
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
