// client/src/pages/AdminDash.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  UserX, 
  AlertTriangle, 
  TrendingUp, 
  Activity, 
  Play, 
  FileSpreadsheet, 
  Sparkles, 
  Headphones, 
  Check, 
  LayoutGrid, 
  List, 
  UserPlus, 
  ChevronRight, 
  ChevronLeft, 
  ChevronDown,
  Menu, 
  Search,
  Bell,
  Volume2,
  Sliders,
  Layers, 
  ShieldCheck, 
  Zap, 
  Filter, 
  ArrowRight,
  RefreshCw,
  LogOut,
  Stethoscope,
  Building2,
  Calendar,
  Eye,
  Radio,
  BarChart3,
  Flame,
  ArrowUpRight,
  Compass,
  Coffee,
  UserCheck,
  History,
  Moon,
  Sun,
  User,
  Key,
  Copy,
  ArrowLeftRight,
  Edit3,
  Trash2,
  Lock,
  X,
  Plus,
  Tv,
  Monitor,
  MapPin,
  Globe,
  SlidersHorizontal,
  Save,
  QrCode,
  HelpCircle,
  Briefcase,
  Printer,
  Ticket
} from 'lucide-react';
import { socket, formatDuration } from '../socket';
import scaFlowLogo from '../assets/logo/ScaFlow.svg';
import ThermalPrinterConfig from '../components/ThermalPrinterConfig';
import { saasService } from '../supabase';

export default function AdminDash({ tenant, onSwitchUser, onOpenTotem, onOpenPainel }) {
  const tenantId = tenant?.id || 'tenant-demo-01';
  const tenantName = tenant?.name || 'Complexo Hospitalar Central';

  // Menu Lateral Retrátil
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Roteamento Real via Hash (Abre rotas/janelas diferentes e separadas)
  const validRoutes = ['visao_geral', 'usuarios', 'unidades', 'consultorios', 'especialidades', 'fila', 'historico', 'impressao'];
  const [currentRoute, setCurrentRoute] = useState(() => {
    const hash = window.location.hash.replace(/^#\/?/, '') || 'visao_geral';
    return validRoutes.includes(hash) ? hash : 'visao_geral';
  });

  const navigateTo = (route) => {
    window.location.hash = `#/${route}`;
    setCurrentRoute(route);
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '') || 'visao_geral';
      if (validRoutes.includes(hash)) {
        setCurrentRoute(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    // Verificação inicial
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  // Voltar na navegação
  const handleVoltar = () => {
    if (window.location.hash && window.location.hash !== '#/' && window.location.hash !== '#/visao_geral') {
      window.history.back();
    } else if (onSwitchUser) {
      onSwitchUser();
    }
  };

  // Top Navbar Controls
  const [theme, setTheme] = useState('dark');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Dropdown de Unidades
  const [unidadeDropdownOpen, setUnidadeDropdownOpen] = useState(false);
  const [selectedUnidade, setSelectedUnidade] = useState(tenantName);

  // Filtros Globais
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState('TODAS');

  // Gestão de Operadores & Quadro Clínico (Dinâmico SaaS)
  const [usersList, setUsersList] = useState([]);

  // Filtros e Modo de Visualização dos Colaboradores
  const [userCategoryFilter, setUserCategoryFilter] = useState('TODOS');
  const [userStatusFilter, setUserStatusFilter] = useState('TODOS');
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [userViewMode, setUserViewMode] = useState('cards'); // 'cards' | 'list'

  // Modais de Colaboradores
  const [modalUserOpen, setModalUserOpen] = useState(false);
  const [userFormData, setUserFormData] = useState({
    id: null,
    nome: '',
    cargo: '',
    posto: '',
    categoria: 'atendimento',
    cpf: '',
    email: '',
    celular: '',
    login: '',
    senha: '',
    ativo: true,
    chamadaAuto: true
  });

  const [modalVincularOpen, setModalVincularOpen] = useState(false);
  const [selectedUserForVinculo, setSelectedUserForVinculo] = useState(null);
  const [tempVinculoServicos, setTempVinculoServicos] = useState([]);

  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Gestão de Unidades & Complexos Hospitalares (Dinâmico SaaS)
  const [unidadesList, setUnidadesList] = useState([]);

  const [expandedUnidadeId, setExpandedUnidadeId] = useState(null);
  const [filtroEmpresaUnidade, setFiltroEmpresaUnidade] = useState('TODAS');
  const [searchUnidadeQuery, setSearchUnidadeQuery] = useState('');
  const [unidadeViewMode, setUnidadeViewMode] = useState('accordion'); // 'accordion' | 'cards'
  const [saveFeedbackUnidadeId, setSaveFeedbackUnidadeId] = useState(null);

  // Modais de Unidade
  const [modalUnidadeOpen, setModalUnidadeOpen] = useState(false);
  const [unidadeFormData, setUnidadeFormData] = useState({
    id: null,
    nome: '',
    sigla: '',
    empresa: 'Rede ScaFlow Saúde',
    endereco: '',
    fuso: 'America/Sao_Paulo',
    quantidadeGuiches: 4,
    proporcaoPref: 2,
    proporcaoNorm: 1,
    maxFila: '∞',
    esperaMin: 15,
    atendMin: 15,
    rechamadas: 3,
    janelaSenhaHoras: 3,
    formularioDados: true,
    exibirNomePainel: true,
    vozTV: true,
    tutoriaisAtendentes: true,
    ativo: true
  });

  const [modalDeleteUnidadeOpen, setModalDeleteUnidadeOpen] = useState(false);
  const [unidadeToDelete, setUnidadeToDelete] = useState(null);

  // Estados de Dados do Dashboard
  const [stats, setStats] = useState({
    kpis: {
      filaTotal: 0,
      tmeSegundos: 0,
      atendimentosDia: 0,
      tmaSegundos: 0,
      emAtendimento: 0,
      naoCompareceuDia: 0,
      totalEmitidasHoje: 0
    },
    capacidade: {
      activeAttendants: 2,
      capacidadeHora: 14,
      demandaHora: 8,
      taxaOcupacao: 62,
      status: 'ADEQUADA',
      mensagem: 'Fluxo estável. Consultórios operando dentro da margem de conforto.'
    },
    filasSemVazao: [],
    servicosResumo: [],
    waitingQueue: [],
    attendants: [],
    recentHistory: [],
    alertInfo: null
  });

  const [services, setServices] = useState([]);
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());
  const [soundAlertNotice, setSoundAlertNotice] = useState(false);

  // Live Activity Stream (Dinâmico)
  const [recentEvents, setRecentEvents] = useState([]);

  // Atualizador do relógio local
  useEffect(() => {
    const timer = setInterval(() => setNowTimestamp(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Carga e subscrição de dados (Multi-tenant & 100% dinâmico)
  useEffect(() => {
    let isMounted = true;

    const calculateAnalytics = (tickets, srvs, cntrs) => {
      const today = new Date().toDateString();
      const todayTickets = tickets.filter(t => new Date(t.created_at || t.createdAt).toDateString() === today);
      
      const waiting = tickets.filter(t => t.status === 'WAITING');
      const finished = todayTickets.filter(t => t.status === 'FINISHED');
      const called = tickets.filter(t => t.status === 'CALLED');
      const noShow = todayTickets.filter(t => t.status === 'NO_SHOW');

      // TME: Espera média em segundos
      let totalWaitSec = 0;
      let countWait = 0;
      todayTickets.forEach(t => {
        if (t.called_at || t.calledAt) {
          const diff = Math.max(0, Math.floor((new Date(t.called_at || t.calledAt) - new Date(t.created_at || t.createdAt)) / 1000));
          totalWaitSec += diff;
          countWait++;
        }
      });
      const tmeSegundos = countWait > 0 ? Math.round(totalWaitSec / countWait) : 180;

      // TMA: Atendimento médio em segundos
      let totalAttSec = 0;
      let countAtt = 0;
      finished.forEach(t => {
        if (t.finished_at || t.finishedAt) {
          const diff = Math.max(0, Math.floor((new Date(t.finished_at || t.finishedAt) - new Date(t.called_at || t.calledAt)) / 1000));
          totalAttSec += diff;
          countAtt++;
        }
      });
      const tmaSegundos = countAtt > 0 ? Math.round(totalAttSec / countAtt) : 360;

      // Resumo por Serviço
      const servicosResumo = (srvs || []).map(s => {
        const srvTickets = todayTickets.filter(t => t.service_id === s.id);
        const srvWait = waiting.filter(t => t.service_id === s.id);
        const srvDone = finished.filter(t => t.service_id === s.id);
        return {
          id: s.id,
          nome: s.name || s.nome,
          sigla: s.code || s.sigla,
          emitidas: srvTickets.length,
          atendidas: srvDone.length,
          espera: srvWait.length,
          tmeSegundos: tmeSegundos,
          taxaConclusao: srvTickets.length > 0 ? Math.round((srvDone.length / srvTickets.length) * 100) : 100
        };
      });

      // Mapeia consultórios/atendentes
      const attendants = (cntrs || []).map(c => ({
        username: c.name.toLowerCase().replace(/\s+/g, '_'),
        nome: c.name,
        guiche: c.name,
        status: c.status || 'LIVRE',
        modoAutomatico: c.auto_mode !== false,
        atendimentosHoje: finished.filter(t => t.counter_name === c.name).length,
        ticketAtual: called.find(t => t.counter_name === c.name) || null
      }));

      return {
        kpis: {
          filaTotal: waiting.length,
          tmeSegundos,
          atendimentosDia: finished.length,
          tmaSegundos,
          emAtendimento: called.length,
          naoCompareceuDia: noShow.length,
          totalEmitidasHoje: todayTickets.length
        },
        capacidade: {
          activeAttendants: attendants.filter(a => a.status === 'ATENDENDO' || a.status === 'LIVRE').length,
          capacidadeHora: 15,
          demandaHora: waiting.length + 4,
          taxaOcupacao: Math.min(100, Math.round(((called.length + 1) / Math.max(1, attendants.length)) * 100)),
          status: waiting.length > 10 ? 'ALERTA' : 'ADEQUADA',
          mensagem: waiting.length > 10 ? 'Demanda elevada. Recomenda-se acionar guichê de apoio.' : 'Fluxo estável. Consultórios operando dentro da margem de conforto.'
        },
        servicosResumo,
        waitingQueue: waiting,
        attendants,
        recentHistory: finished.slice(0, 10),
        alertInfo: null
      };
    };

    const loadTenantData = async () => {
      try {
        const [users, units, srvs, cntrs, tkts] = await Promise.all([
          saasService.fetchUsers(tenantId),
          saasService.fetchUnits(tenantId),
          saasService.fetchServices(tenantId),
          saasService.fetchCounters(tenantId),
          saasService.fetchTickets(tenantId)
        ]);

        if (isMounted) {
          if (users) {
            setUsersList(users.map(u => ({
              id: u.id,
              nome: u.name,
              login: u.email?.split('@')[0] || (u.name || 'user').toLowerCase().replace(/\s+/g, '.'),
              cargo: u.position || 'Operador Clínico',
              posto: u.assigned_counter || 'Guichê 01',
              categoria: u.role === 'admin' ? 'supervisao' : 'atendimento',
              categoriaNome: u.role === 'admin' ? 'Diretoria & Gestão' : 'Atendimento & Recepção',
              cpf: '—',
              email: u.email,
              celular: '—',
              servicosIds: u.assigned_services || [],
              chamadaAuto: true,
              ativo: true,
              unidade: tenantName
            })));
          }

          if (units && units.length > 0) {
            setUnidadesList(units.map(u => ({
              id: u.id,
              nome: u.name,
              sigla: (u.name || 'UNI').split(' ').map(w => w[0]).slice(0, 3).join('').toUpperCase() || 'UNI',
              empresa: tenantName,
              endereco: u.address ? `${u.address} - ${u.city || ''}` : 'Endereço Principal',
              fuso: 'America/Sao_Paulo',
              fusoNome: 'Brasília (UTC-3)',
              quantidadeGuiches: 4,
              proporcaoPref: 2,
              proporcaoNorm: 1,
              maxFila: '∞',
              esperaMin: 15,
              atendMin: 15,
              rechamadas: 3,
              janelaSenhaHoras: 3,
              formularioDados: true,
              exibirNomePainel: true,
              vozTV: true,
              tutoriaisAtendentes: true,
              ativo: u.is_active !== false,
              totensCount: 1,
              paineisCount: 1,
              consultoriosCount: (cntrs || []).length,
              especialidadesCount: (srvs || []).length,
              profissionaisCount: (users || []).length
            })));
            setSelectedUnidade(units[0].name);
          } else {
            setSelectedUnidade(tenantName);
          }

          if (srvs) setServices(srvs);

          const analytics = calculateAnalytics(tkts || [], srvs || [], cntrs || []);
          setStats(analytics);
        }
      } catch (e) {
        console.error('[AdminDash] Erro ao carregar dados do tenant:', e);
      }
    };

    loadTenantData();

    // Subscrição em tempo real no Supabase / Local Event
    const unsubscribe = saasService.subscribeToChanges(tenantId, () => {
      loadTenantData();
    });

    const onTvCall = (ticket) => {
      if (ticket) {
        setRecentEvents(prev => [
          {
            id: Date.now(),
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            text: `Senha ${ticket.codigo} chamada para ${ticket.guiche || 'Consultório'}`,
            type: 'call'
          },
          ...prev.slice(0, 15)
        ]);
      }
    };

    const onTicketCreated = (ticket) => {
      if (ticket) {
        setRecentEvents(prev => [
          {
            id: Date.now(),
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            text: `Senha ${ticket.codigo} emitida (${ticket.servicoNome})`,
            type: 'emit'
          },
          ...prev.slice(0, 15)
        ]);
      }
    };

    socket.on('tv:call', onTvCall);
    socket.on('ticket:created', onTicketCreated);

    return () => {
      isMounted = false;
      unsubscribe();
      socket.off('tv:call', onTvCall);
      socket.off('ticket:created', onTicketCreated);
    };
  }, [tenantId, tenantName]);

  // Alternador de tema visual
  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  };


  // Chamar próxima senha de maior espera (direciona para posto de atendimento real, nunca admin)
  const handleCallLongestWait = () => {
    if (stats.waitingQueue && stats.waitingQueue.length > 0) {
      const longest = stats.waitingQueue[0];
      const targetAttendant = (attendants || []).find(a => a.status === 'LIVRE') || (attendants || [])[0] || { username: 'laura', guiche: 'Guichê 01' };
      socket.emit('ticket:callSpecific', {
        ticketId: longest.id,
        username: targetAttendant.username || 'laura',
        guiche: targetAttendant.guiche || 'Guichê 01'
      });
    }
  };

  // Disparo de Alerta Geral no Painel
  const handleBroadcastAlert = () => {
    setSoundAlertNotice(true);
    socket.emit('tv:call', {
      codigo: 'AVISO',
      guiche: 'Triagem Geral',
      prioridadeNome: 'Informação',
      prioridadeCor: '#2E9EFD',
      servicoNome: 'Atenção aos Chamados no Painel'
    });
    setTimeout(() => setSoundAlertNotice(false), 3500);
  };

  // Ativar ou desativar modo automático em um atendente
  const handleToggleAuto = (username, currentState) => {
    socket.emit('attendant:toggleAuto', {
      username,
      enabled: !currentState
    });
  };

  // Exportar Relatório em CSV Executivo
  const handleExportCSV = () => {
    const rows = [
      ['RELATÓRIO DE INTELIGÊNCIA OPERACIONAL — SCAFLOW'],
      ['Unidade:', selectedUnidade, 'Data de Extração:', new Date().toLocaleString('pt-BR')],
      [''],
      ['INDICADORES GERAIS DE DESEMPENHO'],
      ['Métrica', 'Valor'],
      ['Total de Pacientes na Fila', stats.kpis?.filaTotal || 0],
      ['Consultas Concluídas Hoje', stats.kpis?.atendimentosDia || 0],
      ['Tempo Médio de Espera (TME)', formatDuration(stats.kpis?.tmeSegundos || 0)],
      ['Tempo Médio de Consulta (TMA)', formatDuration(stats.kpis?.tmaSegundos || 0)],
      ['Postos em Atendimento Ativo', stats.kpis?.emAtendimento || 0],
      ['Evasões / Ausências (No-Show)', stats.kpis?.naoCompareceuDia || 0],
      ['Total de Senhas Geradas', stats.kpis?.totalEmitidasHoje || 0],
      ['Taxa de Ocupação dos Consultórios', `${stats.capacidade?.taxaOcupacao || 0}%`],
      [''],
      ['ESPECIALIDADES MÉDICAS E TEMPOS'],
      ['Especialidade', 'Sigla', 'Emitidas', 'Concluídas', 'Fila Atual', 'TME Médio', 'Aproveitamento'],
      ...(stats.servicosResumo || []).map(s => [
        s.nome, s.sigla, s.emitidas, s.atendidas, s.espera, formatDuration(s.tmeSegundos), `${s.taxaConclusao}%`
      ])
    ];

    const csvContent = '\uFEFF' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ScaFlow_Relatorio_Gerencial_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Alternar Status Ativo do Usuário
  const handleToggleUserAtivo = (userId) => {
    setUsersList(prev => prev.map(u => {
      if (u.id === userId) return { ...u, ativo: !u.ativo };
      return u;
    }));
  };

  // Alternar Chamada Automática do Usuário na Tabela
  const handleToggleUserChamadaAuto = (userId) => {
    setUsersList(prev => prev.map(u => {
      if (u.id === userId) return { ...u, chamadaAuto: !u.chamadaAuto };
      return u;
    }));
  };

  // Abrir Modal de Novo Colaborador
  const handleOpenNovoUsuario = () => {
    setUserFormData({
      id: null,
      nome: '',
      cargo: 'Atendente de Recepção',
      posto: 'Guichê de Atendimento',
      categoria: 'atendimento',
      cpf: '',
      email: '',
      celular: '',
      login: '',
      senha: '',
      ativo: true,
      chamadaAuto: true
    });
    setModalUserOpen(true);
  };

  // Abrir Modal de Edição de Colaborador
  const handleOpenEditarUsuario = (user) => {
    setUserFormData({
      id: user.id,
      nome: user.nome,
      cargo: user.cargo || 'Atendente',
      posto: user.posto || 'Guichê',
      categoria: user.categoria || 'atendimento',
      cpf: user.cpf !== '—' ? user.cpf : '',
      email: user.email !== '—' ? user.email : '',
      celular: user.celular !== '—' ? user.celular : '',
      login: user.login,
      senha: '',
      ativo: user.ativo,
      chamadaAuto: user.chamadaAuto
    });
    setModalUserOpen(true);
  };

  // Salvar Colaborador (Criação / Atualização)
  const handleSalvarUsuario = async (e) => {
    e.preventDefault();
    if (!userFormData.nome.trim() || !userFormData.login.trim()) {
      alert('Por favor, preencha o Nome e o Login do colaborador.');
      return;
    }

    const catName = userFormData.categoria === 'clinico' 
      ? 'Corpo Clínico' 
      : userFormData.categoria === 'supervisao' 
        ? 'Gestão & Apoio' 
        : 'Atendimento & Recepção';

    const saved = await saasService.saveUser(tenantId, {
      id: userFormData.id,
      name: userFormData.nome,
      position: userFormData.cargo,
      assigned_counter: userFormData.posto,
      role: userFormData.categoria === 'supervisao' ? 'admin' : 'atendente',
      email: userFormData.email || `${userFormData.login.toLowerCase()}@${tenant?.slug || 'clinica'}.com.br`,
      password: userFormData.senha || '123'
    });

    if (userFormData.id) {
      setUsersList(prev => prev.map(u => {
        if (u.id === userFormData.id) {
          return {
            ...u,
            nome: userFormData.nome,
            cargo: userFormData.cargo,
            posto: userFormData.posto,
            categoria: userFormData.categoria,
            categoriaNome: catName,
            cpf: userFormData.cpf || '—',
            email: userFormData.email || '—',
            celular: userFormData.celular || '—',
            login: userFormData.login,
            ativo: userFormData.ativo,
            chamadaAuto: userFormData.chamadaAuto
          };
        }
        return u;
      }));
    } else {
      const novoId = saved?.id || `COLAB-${Date.now().toString().slice(-4)}`;
      const novoUser = {
        id: novoId,
        nome: userFormData.nome,
        cargo: userFormData.cargo,
        posto: userFormData.posto,
        categoria: userFormData.categoria,
        categoriaNome: catName,
        login: userFormData.login,
        cpf: userFormData.cpf || '—',
        email: userFormData.email || '—',
        celular: userFormData.celular || '—',
        servicosIds: [],
        chamadaAuto: userFormData.chamadaAuto,
        ativo: userFormData.ativo,
        unidade: selectedUnidade
      };
      setUsersList(prev => [novoUser, ...prev]);
    }
    setModalUserOpen(false);
  };

  // Abrir Modal de Vinculação de Especialidades
  const handleOpenVinculo = (user) => {
    setSelectedUserForVinculo(user);
    setTempVinculoServicos(user.servicosIds || []);
    setModalVincularOpen(true);
  };

  // Salvar Vínculos de Especialidades
  const handleSalvarVinculo = () => {
    if (!selectedUserForVinculo) return;
    setUsersList(prev => prev.map(u => {
      if (u.id === selectedUserForVinculo.id) {
        return {
          ...u,
          servicosIds: tempVinculoServicos,
          servicosCount: tempVinculoServicos.length
        };
      }
      return u;
    }));
    setModalVincularOpen(false);
  };

  // Confirmar Exclusão de Usuário
  const handleConfirmarExclusao = async () => {
    if (!userToDelete) return;
    try {
      await saasService.deleteUser(tenantId, userToDelete.id);
    } catch (e) {}
    setUsersList(prev => prev.filter(u => u.id !== userToDelete.id));
    setModalDeleteOpen(false);
    setUserToDelete(null);
  };

  const { 
    kpis = { filaTotal: 0, tmeSegundos: 0, atendimentosDia: 0, tmaSegundos: 0, emAtendimento: 0, naoCompareceuDia: 0, totalEmitidasHoje: 0 }, 
    capacidade = { activeAttendants: 0, taxaOcupacao: 0 }, 
    filasSemVazao = [], 
    servicosResumo = [], 
    waitingQueue = [], 
    attendants: rawAttendants = [], 
    recentHistory = [] 
  } = stats || {};

  // O administrador NUNCA participa das estações/consultórios nem da fila de atendimento
  const attendants = useMemo(() => {
    return (rawAttendants || []).filter(a => {
      if (!a) return false;
      const u = (a.username || '').toLowerCase();
      const n = (a.nome || '').toLowerCase();
      const g = (a.guiche || '').toLowerCase();
      return u !== 'admin' && !n.includes('administrador') && !g.includes('gestão');
    });
  }, [rawAttendants]);

  // Cálculo de SLA Legal
  const slaCompliance = useMemo(() => {
    const totalConcluidos = kpis?.atendimentosDia || 0;
    if (totalConcluidos === 0) return 96;
    const dentroDaMeta = Math.max(0, totalConcluidos - Math.floor(((kpis?.tmeSegundos || 0) > 900 ? 2 : 0)));
    return Math.min(100, Math.round((dentroDaMeta / totalConcluidos) * 100));
  }, [kpis?.atendimentosDia, kpis?.tmeSegundos]);

  // Estimativa Preditiva de Conclusão da Fila
  const tempoEstimadoRestanteMinutos = useMemo(() => {
    const queue = waitingQueue || [];
    if (queue.length === 0) return 0;
    const tmaMin = Math.max(3, Math.round((kpis?.tmaSegundos || 300) / 60));
    const consultoriosAtivos = Math.max(1, (attendants || []).filter(a => a.status === 'ATENDENDO' || a.status === 'LIVRE').length);
    return Math.round((queue.length * tmaMin) / consultoriosAtivos);
  }, [waitingQueue, kpis?.tmaSegundos, attendants]);

  // Filtro de Fila em Tempo Real por Busca e Prioridade
  const filteredQueue = useMemo(() => {
    return (waitingQueue || []).filter(t => {
      if (!t) return false;
      const cod = t.codigo || t.code || '';
      const srv = t.servicoNome || t.service_name || '';
      const nom = t.nomeCliente || t.patient_name || '';
      const matchesSearch = !searchQuery.trim() || 
        cod.toLowerCase().includes(searchQuery.toLowerCase()) || 
        srv.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nom.toLowerCase().includes(searchQuery.toLowerCase());
      
      const pId = t.prioridadeId || t.priority_id || '';
      const matchesPriority = selectedPriorityFilter === 'TODAS' || pId === selectedPriorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [waitingQueue, searchQuery, selectedPriorityFilter]);

  // Filtro de Colaboradores
  const filteredUsers = useMemo(() => {
    return (usersList || []).filter(u => {
      if (!u) return false;
      const q = searchUserQuery.trim().toLowerCase();
      const nom = u.nome || u.name || '';
      const log = u.login || u.email || '';
      const car = u.cargo || u.position || '';
      const pos = u.posto || u.assigned_counter || '';
      const matchesSearch = !q || 
        nom.toLowerCase().includes(q) || 
        log.toLowerCase().includes(q) ||
        car.toLowerCase().includes(q) ||
        pos.toLowerCase().includes(q);

      const cat = u.categoria || (u.role === 'admin' ? 'supervisao' : 'atendimento');
      const matchesCategory = userCategoryFilter === 'TODOS' || cat === userCategoryFilter;
      const matchesStatus = userStatusFilter === 'TODOS' || (userStatusFilter === 'ativo' ? u.ativo !== false : u.ativo === false);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [usersList, searchUserQuery, userCategoryFilter, userStatusFilter]);

  // Filtro e Handlers de Unidades de Atendimento
  const filteredUnidades = useMemo(() => {
    return (unidadesList || []).filter(u => {
      if (!u) return false;
      const q = searchUnidadeQuery.trim().toLowerCase();
      const nom = u.nome || u.name || '';
      const sig = u.sigla || '';
      const emp = u.empresa || '';
      const end = u.endereco || u.address || '';
      const matchesSearch = !q || 
        nom.toLowerCase().includes(q) || 
        sig.toLowerCase().includes(q) ||
        emp.toLowerCase().includes(q) ||
        end.toLowerCase().includes(q);

      const matchesEmpresa = filtroEmpresaUnidade === 'TODAS' || emp === filtroEmpresaUnidade;
      return matchesSearch && matchesEmpresa;
    });
  }, [unidadesList, searchUnidadeQuery, filtroEmpresaUnidade]);

  const redesEmpresasList = useMemo(() => {
    return Array.from(new Set((unidadesList || []).map(u => u.empresa || u.name).filter(Boolean)));
  }, [unidadesList]);

  const handleToggleUnidadeAtivo = (unidadeId) => {
    setUnidadesList(prev => prev.map(u => {
      if (u.id === unidadeId) return { ...u, ativo: !u.ativo };
      return u;
    }));
  };

  // Sincroniza guichês iniciais com localStorage se ainda não existirem
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sca_active_guiches');
      if (!stored) {
        const uDefault = unidadesList[0];
        const count = uDefault?.quantidadeGuiches || 4;
        const initialGuiches = Array.from({ length: count }, (_, i) => `Guichê ${String(i + 1).padStart(2, '0')}`);
        localStorage.setItem('sca_active_guiches', JSON.stringify(initialGuiches));
      }
    } catch (e) {}
  }, []);

  const handleUpdateUnitOperationalConfig = (unidadeId, updates) => {
    setUnidadesList(prev => prev.map(u => {
      if (u.id === unidadeId) {
        const updated = { ...u, ...updates };
        if (updates.quantidadeGuiches !== undefined) {
          const count = Math.max(1, parseInt(updates.quantidadeGuiches, 10) || 1);
          const guichesNames = Array.from({ length: count }, (_, i) => `Guichê ${String(i + 1).padStart(2, '0')}`);
          localStorage.setItem('sca_active_guiches', JSON.stringify(guichesNames));
        }
        return updated;
      }
      return u;
    }));

    setSaveFeedbackUnidadeId(unidadeId);
    setTimeout(() => {
      setSaveFeedbackUnidadeId(null);
    }, 2800);
  };

  const handleOpenNovaUnidade = () => {
    setUnidadeFormData({
      id: null,
      nome: '',
      sigla: '',
      empresa: redesEmpresasList[0] || 'Rede ScaFlow Saúde',
      endereco: '',
      fuso: 'America/Sao_Paulo',
      quantidadeGuiches: 4,
      proporcaoPref: 2,
      proporcaoNorm: 1,
      maxFila: '∞',
      esperaMin: 15,
      atendMin: 15,
      rechamadas: 3,
      janelaSenhaHoras: 3,
      formularioDados: true,
      exibirNomePainel: true,
      vozTV: true,
      tutoriaisAtendentes: true,
      ativo: true
    });
    setModalUnidadeOpen(true);
  };

  const handleOpenEditarUnidade = (unidade) => {
    setUnidadeFormData({
      id: unidade.id,
      nome: unidade.nome,
      sigla: unidade.sigla,
      empresa: unidade.empresa || 'Rede ScaFlow Saúde',
      endereco: unidade.endereco || '',
      fuso: unidade.fuso || 'America/Sao_Paulo',
      quantidadeGuiches: unidade.quantidadeGuiches || 4,
      proporcaoPref: unidade.proporcaoPref || 2,
      proporcaoNorm: unidade.proporcaoNorm || 1,
      maxFila: unidade.maxFila || '∞',
      esperaMin: unidade.esperaMin || 15,
      atendMin: unidade.atendMin || 15,
      rechamadas: unidade.rechamadas || 3,
      janelaSenhaHoras: unidade.janelaSenhaHoras || 3,
      formularioDados: unidade.formularioDados !== false,
      exibirNomePainel: unidade.exibirNomePainel !== false,
      vozTV: unidade.vozTV !== false,
      tutoriaisAtendentes: unidade.tutoriaisAtendentes !== false,
      ativo: unidade.ativo
    });
    setModalUnidadeOpen(true);
  };

  const handleSalvarUnidade = async (e) => {
    e.preventDefault();
    if (!unidadeFormData.nome.trim() || !unidadeFormData.sigla.trim()) {
      alert('Por favor, informe o Nome da Unidade e a Sigla.');
      return;
    }

    const fusoMap = {
      'America/Sao_Paulo': 'Brasília (UTC-3)',
      'America/Manaus': 'Manaus (UTC-4)',
      'America/Rio_Branco': 'Acre (UTC-5)',
      'America/Noronha': 'Fernando de Noronha (UTC-2)'
    };

    const guichesCount = Math.max(1, parseInt(unidadeFormData.quantidadeGuiches, 10) || 4);

    const saved = await saasService.saveUnit(tenantId, {
      id: unidadeFormData.id,
      name: unidadeFormData.nome,
      address: unidadeFormData.endereco,
      is_active: unidadeFormData.ativo
    });

    if (unidadeFormData.id) {
      setUnidadesList(prev => prev.map(u => {
        if (u.id === unidadeFormData.id) {
          return {
            ...u,
            nome: unidadeFormData.nome,
            sigla: unidadeFormData.sigla.toUpperCase(),
            empresa: unidadeFormData.empresa,
            endereco: unidadeFormData.endereco,
            fuso: unidadeFormData.fuso,
            fusoNome: fusoMap[unidadeFormData.fuso] || 'Brasília (UTC-3)',
            quantidadeGuiches: guichesCount,
            proporcaoPref: parseInt(unidadeFormData.proporcaoPref, 10) || 2,
            proporcaoNorm: parseInt(unidadeFormData.proporcaoNorm, 10) || 1,
            maxFila: unidadeFormData.maxFila || '∞',
            esperaMin: parseInt(unidadeFormData.esperaMin, 10) || 15,
            atendMin: parseInt(unidadeFormData.atendMin, 10) || 15,
            rechamadas: parseInt(unidadeFormData.rechamadas, 10) || 3,
            janelaSenhaHoras: parseInt(unidadeFormData.janelaSenhaHoras, 10) || 3,
            formularioDados: unidadeFormData.formularioDados,
            exibirNomePainel: unidadeFormData.exibirNomePainel,
            vozTV: unidadeFormData.vozTV,
            tutoriaisAtendentes: unidadeFormData.tutoriaisAtendentes,
            ativo: unidadeFormData.ativo
          };
        }
        return u;
      }));
    } else {
      const novoId = saved?.id || `UNI-0${unidadesList.length + 1}`;
      const novaUni = {
        id: novoId,
        nome: unidadeFormData.nome,
        sigla: unidadeFormData.sigla.toUpperCase(),
        empresa: unidadeFormData.empresa,
        endereco: unidadeFormData.endereco || 'Endereço não informado',
        fuso: unidadeFormData.fuso,
        fusoNome: fusoMap[unidadeFormData.fuso] || 'Brasília (UTC-3)',
        quantidadeGuiches: guichesCount,
        proporcaoPref: parseInt(unidadeFormData.proporcaoPref, 10) || 2,
        proporcaoNorm: parseInt(unidadeFormData.proporcaoNorm, 10) || 1,
        maxFila: unidadeFormData.maxFila || '∞',
        esperaMin: parseInt(unidadeFormData.esperaMin, 10) || 15,
        atendMin: parseInt(unidadeFormData.atendMin, 10) || 15,
        rechamadas: parseInt(unidadeFormData.rechamadas, 10) || 3,
        janelaSenhaHoras: parseInt(unidadeFormData.janelaSenhaHoras, 10) || 3,
        formularioDados: unidadeFormData.formularioDados,
        exibirNomePainel: unidadeFormData.exibirNomePainel,
        vozTV: unidadeFormData.vozTV,
        tutoriaisAtendentes: unidadeFormData.tutoriaisAtendentes,
        ativo: unidadeFormData.ativo,
        totensCount: 1,
        paineisCount: 1,
        consultoriosCount: 2,
        especialidadesCount: 3,
        profissionaisCount: 3
      };
      setUnidadesList(prev => [...prev, novaUni]);
    }

    // Atualiza lista de guichês no storage para demais telas
    const guichesNames = Array.from({ length: guichesCount }, (_, i) => `Guichê ${String(i + 1).padStart(2, '0')}`);
    localStorage.setItem('sca_active_guiches', JSON.stringify(guichesNames));

    setModalUnidadeOpen(false);
  };

  const handleConfirmarExclusaoUnidade = async () => {
    if (!unidadeToDelete) return;
    try {
      await saasService.deleteUnit(tenantId, unidadeToDelete.id);
    } catch (e) {}
    setUnidadesList(prev => prev.filter(u => u.id !== unidadeToDelete.id));
    setModalDeleteUnidadeOpen(false);
    setUnidadeToDelete(null);
  };

  // Título da Janela / Rota Ativa
  const getPageTitle = () => {
    switch (currentRoute) {
      case 'usuarios':
        return 'Quadro Profissional & Escala';
      case 'unidades':
        return 'Unidades de Atendimento & Policlínicas';
      case 'consultorios':
        return 'Estações & Consultórios';
      case 'especialidades':
        return 'Especialidades Médicas';
      case 'fila':
        return 'Fila de Espera em Tempo Real';
      case 'historico':
        return 'Histórico do Plantão';
      default:
        return 'ScaFlow · Central de Atendimento';
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 45%, #1324A0 0%, #07133F 45%, #020817 100%)',
      position: 'relative',
      color: '#FDFCFD',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
    }}>

      {/* =========================================================================
          1. MENU LATERAL RETRÁTIL NA ESQUERDA (SIDEBAR DE ROTAS)
          ========================================================================= */}
      <aside style={{
        width: sidebarCollapsed ? '76px' : '260px',
        minWidth: sidebarCollapsed ? '76px' : '260px',
        background: 'linear-gradient(180deg, #07133F 0%, #020817 100%)',
        borderRight: '1px solid rgba(93, 94, 252, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 300,
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.45)',
        overflowX: 'hidden'
      }}>
        {/* Bloco Superior */}
        <div>
          {/* Topo do Sidebar com Logo e Botão de Recolher */}
          <div style={{
            padding: '20px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'space-between',
            borderBottom: '1px solid rgba(93, 94, 252, 0.18)'
          }}>
            {!sidebarCollapsed ? (
              <div 
                onClick={() => navigateTo('visao_geral')}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
              >
                <img 
                  src={scaFlowLogo} 
                  alt="ScaFlow" 
                  style={{ height: '34px', width: 'auto', filter: 'drop-shadow(0 0 10px rgba(46, 158, 253, 0.5))' }} 
                />
                <span style={{ 
                  fontSize: '0.7rem', 
                  fontWeight: 800, 
                  color: '#2E9EFD', 
                  letterSpacing: '0.08em',
                  background: 'rgba(46, 158, 253, 0.15)',
                  padding: '3px 8px',
                  borderRadius: '6px'
                }}>
                  GESTOR
                </span>
              </div>
            ) : (
              <img 
                src={scaFlowLogo} 
                alt="ScaFlow" 
                onClick={() => navigateTo('visao_geral')}
                style={{ height: '30px', width: 'auto', cursor: 'pointer' }} 
              />
            )}

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
              className="sidebar-collapse-btn"
              style={{
                background: 'rgba(46, 158, 253, 0.12)',
                border: '1px solid rgba(46, 158, 253, 0.3)',
                color: '#2E9EFD',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginLeft: sidebarCollapsed ? 0 : '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(46, 158, 253, 0.25)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(46, 158, 253, 0.12)'}
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          {/* Seletor Rápido de Unidade */}
          {!sidebarCollapsed && (
            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(93, 94, 252, 0.12)', position: 'relative' }}>
              <div style={{ fontSize: '0.7rem', color: '#B5BCD7', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px', letterSpacing: '0.06em' }}>
                Unidade Hospitalar
              </div>
              <button
                onClick={() => setUnidadeDropdownOpen(!unidadeDropdownOpen)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(2, 8, 23, 0.6)',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(93, 94, 252, 0.25)',
                  cursor: 'pointer',
                  color: '#FDFCFD'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <Building2 size={16} color="#2E9EFD" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {selectedUnidade}
                  </span>
                </div>
                <ChevronDown size={14} color="#B5BCD7" />
              </button>

              {unidadeDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '16px',
                  right: '16px',
                  background: '#07133F',
                  border: '1px solid rgba(93, 94, 252, 0.4)',
                  borderRadius: '10px',
                  padding: '6px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
                  zIndex: 400,
                  marginTop: '4px'
                }}>
                  {unidadesList.map((uni) => (
                    <div
                      key={uni.id}
                      onClick={() => {
                        setSelectedUnidade(uni.nome);
                        setUnidadeDropdownOpen(false);
                      }}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        color: selectedUnidade === uni.nome ? '#2E9EFD' : '#FDFCFD',
                        fontWeight: selectedUnidade === uni.nome ? 800 : 500,
                        background: selectedUnidade === uni.nome ? 'rgba(46, 158, 253, 0.15)' : 'transparent'
                      }}
                    >
                      {uni.nome}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Navegação por Rotas Reais */}
          <nav style={{ padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { id: 'visao_geral', label: 'Visão Geral & SLA', icon: Activity, badge: `${slaCompliance || 96}%` },
              { id: 'usuarios', label: 'Quadro Profissional', icon: UserCheck, badge: `${usersList?.length || 0}` },
              { id: 'unidades', label: 'Unidades', icon: Building2, badge: `${unidadesList?.length || 0}` },
              { id: 'consultorios', label: 'Estações & Consultórios', icon: Stethoscope, badge: `${attendants?.length || 0}` },
              { id: 'especialidades', label: 'Especialidades Médicas', icon: Layers, badge: `${servicosResumo?.length || 0}` },
              { id: 'fila', label: 'Fila de Espera ao Vivo', icon: Users, badge: `${waitingQueue?.length || 0}` },
              { id: 'historico', label: 'Histórico do Plantão', icon: History, badge: `${kpis?.atendimentosDia || 0}` },
              { id: 'impressao', label: 'Impressão Térmica (Totem)', icon: Printer, badge: 'Epson' }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: sidebarCollapsed ? '12px 0' : '12px 14px',
                    justifyContent: sidebarCollapsed ? 'center' : 'space-between',
                    borderRadius: '12px',
                    background: isActive ? 'linear-gradient(135deg, rgba(46, 158, 253, 0.22) 0%, rgba(127, 72, 252, 0.15) 100%)' : 'transparent',
                    border: isActive ? '1px solid rgba(46, 158, 253, 0.5)' : '1px solid transparent',
                    color: isActive ? '#FDFCFD' : '#B5BCD7',
                    fontWeight: isActive ? 800 : 600,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(19, 36, 160, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={19} color={isActive ? '#2E9EFD' : '#5D5EFC'} />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      background: isActive ? '#2E9EFD' : 'rgba(255, 255, 255, 0.1)',
                      color: isActive ? '#020817' : '#B5BCD7',
                      padding: '2px 8px',
                      borderRadius: '9999px'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bloco Inferior: Perfil do Administrador */}
        <div style={{
          padding: '16px 14px',
          borderTop: '1px solid rgba(93, 94, 252, 0.15)',
          background: 'rgba(2, 8, 23, 0.5)'
        }}>
          {!sidebarCollapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #286DFC 0%, #2E9EFD 45%, #5D5EFC 70%, #7F48FC 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FDFCFD',
                  fontWeight: 800,
                  fontSize: '0.95rem'
                }}>
                  G
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FDFCFD' }}>Coordenação Médica</div>
                  <div style={{ fontSize: '0.72rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span className="pulse-dot" style={{ width: '6px', height: '6px', background: '#34d399' }}></span>
                    Operação ao Vivo
                  </div>
                </div>
              </div>

              {onSwitchUser && (
                <button
                  onClick={onSwitchUser}
                  title="Trocar de Estação / Desconectar"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#B5BCD7',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '6px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#B5BCD7'}
                >
                  <LogOut size={17} />
                </button>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => setSidebarCollapsed(false)}
                title="Coordenação Médica (Conectado) — Clique para abrir o menu"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #286DFC 0%, #2E9EFD 45%, #7F48FC 100%)',
                  color: '#FDFCFD',
                  border: 'none',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                G
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* =========================================================================
          2. ÁREA CENTRAL (RENDERIZAÇÃO DA ROTA SELECIONADA)
          ========================================================================= */}
      <main style={{
        flex: 1,
        padding: '24px 30px',
        maxWidth: '1680px',
        margin: '0 auto',
        width: '100%',
        overflowX: 'hidden'
      }}>

        {/* ALERTA SONORO DISPARADO (FEEDBACK VISUAL) */}
        {soundAlertNotice && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 20px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(46, 158, 253, 0.3) 0%, rgba(127, 72, 252, 0.25) 100%)',
            border: '1px solid #2E9EFD',
            color: '#FDFCFD',
            marginBottom: '18px',
            boxShadow: '0 0 20px rgba(46, 158, 253, 0.3)'
          }}>
            <Volume2 size={20} color="#2E9EFD" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              Alerta geral de atenção emitido no Monitor TV da Sala de Espera!
            </span>
          </div>
        )}

        {/* =======================================================================
            TOP HEADER EXATO CONFORME REFERÊNCIA DO USUÁRIO
            ======================================================================= */}
        <header className="top-header" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(93, 94, 252, 0.2)'
        }}>
          {/* header-left: botão menuToggle + page-title com << Voltar */}
          <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              id="menuToggle"
              className="menu-toggle"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title="Menu"
              style={{
                background: 'rgba(7, 19, 63, 0.85)',
                border: '1px solid rgba(46, 158, 253, 0.35)',
                color: '#2E9EFD',
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(46, 158, 253, 0.2)';
                e.currentTarget.style.borderColor = '#2E9EFD';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(7, 19, 63, 0.85)';
                e.currentTarget.style.borderColor = 'rgba(46, 158, 253, 0.35)';
              }}
            >
              <Menu size={22} />
            </button>

            <div className="page-title">
              <h1 style={{ fontSize: '1.65rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#FDFCFD', lineHeight: 1.15 }}>
                {getPageTitle()}
              </h1>
              {currentRoute !== 'visao_geral' ? (
                <button
                  id="link-voltar-topo"
                  className="btn-voltar-link"
                  onClick={handleVoltar}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#2E9EFD',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: '3px 0 0 0',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <ChevronLeft size={14} /> Voltar ao Painel Geral
                </button>
              ) : (
                <div style={{ fontSize: '0.78rem', color: '#B5BCD7', marginTop: '2px' }}>
                  Monitoramento em tempo real do fluxo ambulatorial
                </div>
              )}
            </div>
          </div>

          {/* user-controls: botão themeToggle + container userProfileContainer */}
          <div className="user-controls" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Theme Toggle Button */}
            <button
              id="themeToggle"
              className="theme-toggle-btn"
              onClick={handleToggleTheme}
              title="Alternar tema claro / escuro"
              style={{
                background: 'rgba(7, 19, 63, 0.8)',
                border: '1px solid rgba(93, 94, 252, 0.3)',
                borderRadius: '10px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FDFCFD',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {theme === 'dark' ? <Moon size={18} color="#2E9EFD" /> : <Sun size={18} color="#f59e0b" />}
            </button>

            {/* userProfileContainer: Avatar + ADMINISTRADOR + Caret Down + Dropdown */}
            <div id="userProfileContainer" style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'rgba(7, 19, 63, 0.85)',
                  border: '1px solid rgba(93, 94, 252, 0.35)',
                  borderRadius: '12px',
                  padding: '7px 14px',
                  cursor: 'pointer',
                  color: '#FDFCFD',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(46, 158, 253, 0.25)',
                  border: '1px solid #2E9EFD',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2E9EFD'
                }}>
                  <User size={16} />
                </div>
                <span style={{ fontSize: '0.84rem', fontWeight: 800, letterSpacing: '0.04em' }}>
                  ADMINISTRADOR
                </span>
                <ChevronDown size={15} color="#B5BCD7" />
              </button>

              {profileMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  minWidth: '220px',
                  background: '#07133F',
                  border: '1px solid rgba(93, 94, 252, 0.4)',
                  borderRadius: '12px',
                  boxShadow: '0 15px 35px rgba(0,0,0,0.85)',
                  zIndex: 500,
                  padding: '8px'
                }}>
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(93, 94, 252, 0.15)' }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#FDFCFD' }}>Administrador</div>
                    <div style={{ fontSize: '0.74rem', color: '#2E9EFD' }}>admin.scaflow · Diretoria & Supervisão</div>
                  </div>
                  <div
                    onClick={() => { navigateTo('usuarios'); setProfileMenuOpen(false); }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      color: '#FDFCFD',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '4px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(46, 158, 253, 0.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <UserCheck size={16} color="#2E9EFD" />
                    <span>Quadro Profissional & Escala</span>
                  </div>
                  <div
                    onClick={() => { onSwitchUser && onSwitchUser(); setProfileMenuOpen(false); }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      color: '#f87171',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={16} color="#ef4444" />
                    <span>Alternar Estação / Sair</span>
                  </div>
                </div>
              )}
            </div>

            {/* Ações Rápidas */}
            <button
              onClick={handleBroadcastAlert}
              className="btn-secondary"
              style={{
                padding: '9px 14px',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '7px'
              }}
              title="Disparar aviso sonoro no monitor da recepção"
            >
              <Volume2 size={16} color="#2E9EFD" />
              <span>Sinal Sonoro (TV)</span>
            </button>

            {onOpenTotem && (
              <button
                onClick={onOpenTotem}
                className="btn-secondary"
                style={{
                  padding: '9px 14px',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  border: '1px solid rgba(46, 158, 253, 0.4)'
                }}
                title="Abrir terminal de autoatendimento para pacientes"
              >
                <Ticket size={16} color="#2E9EFD" />
                <span>Abrir Totem</span>
              </button>
            )}

            {onOpenPainel && (
              <button
                onClick={onOpenPainel}
                className="btn-secondary"
                style={{
                  padding: '9px 14px',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  border: '1px solid rgba(127, 72, 252, 0.4)'
                }}
                title="Abrir monitor de chamada da sala de espera"
              >
                <Tv size={16} color="#7F48FC" />
                <span>Abrir TV</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="btn-secondary"
              style={{
                padding: '9px 14px',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '7px'
              }}
              title="Exportar dados consolidados em formato CSV/Excel"
            >
              <FileSpreadsheet size={16} color="#34d399" />
              <span>Exportar Relatório</span>
            </button>

          </div>
        </header>

        {/* =======================================================================
            ROTA 1: VISÃO GERAL & SLA (PULSO CLÍNICO E BENTO GRID)
            ======================================================================= */}
        {currentRoute === 'visao_geral' && (
          <div className="fade-in">
            {/* LINHA 1: BENTO BAR DE PULSO CLÍNICO */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              {/* Card 1: Fila em Espera Atual */}
              <div 
                onClick={() => navigateTo('fila')}
                style={{
                  background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.9) 0%, rgba(2, 8, 23, 0.95) 100%)',
                  border: '1px solid rgba(93, 94, 252, 0.25)',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B5BCD7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Pacientes Aguardando
                  </span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={17} color="#ef4444" />
                  </div>
                </div>
                <div style={{ fontSize: '2.3rem', fontWeight: 900, color: '#FDFCFD', lineHeight: 1.1 }}>
                  {kpis.filaTotal}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.78rem', color: '#B5BCD7' }}>
                  <span>TME Médio:</span>
                  <strong style={{ color: '#f87171', fontFamily: 'monospace', fontSize: '0.88rem' }}>{formatDuration(kpis.tmeSegundos)}</strong>
                </div>
              </div>

              {/* Card 2: Consultas Realizadas */}
              <div 
                onClick={() => navigateTo('historico')}
                style={{
                  background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.9) 0%, rgba(2, 8, 23, 0.95) 100%)',
                  border: '1px solid rgba(93, 94, 252, 0.25)',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B5BCD7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Atendimentos Concluídos
                  </span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(46, 158, 253, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={17} color="#2E9EFD" />
                  </div>
                </div>
                <div style={{ fontSize: '2.3rem', fontWeight: 900, color: '#FDFCFD', lineHeight: 1.1 }}>
                  {kpis.atendimentosDia}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.78rem', color: '#B5BCD7' }}>
                  <span>TMA Médio:</span>
                  <strong style={{ color: '#2E9EFD', fontFamily: 'monospace', fontSize: '0.88rem' }}>{formatDuration(kpis.tmaSegundos)}</strong>
                </div>
              </div>

              {/* Card 3: Conformidade com SLA Legal */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.9) 0%, rgba(2, 8, 23, 0.95) 100%)',
                border: '1px solid rgba(93, 94, 252, 0.25)',
                borderRadius: '16px',
                padding: '18px 20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B5BCD7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Conformidade com SLA
                  </span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(52, 211, 153, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={17} color="#34d399" />
                  </div>
                </div>
                <div style={{ fontSize: '2.3rem', fontWeight: 900, color: '#34d399', lineHeight: 1.1 }}>
                  {slaCompliance}%
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.78rem', color: '#B5BCD7' }}>
                  <span>Meta Legal (&lt;15m):</span>
                  <strong style={{ color: '#34d399' }}>Conforme</strong>
                </div>
              </div>

              {/* Card 4: Postos Ativos & Ocupação */}
              <div 
                onClick={() => navigateTo('consultorios')}
                style={{
                  background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.9) 0%, rgba(2, 8, 23, 0.95) 100%)',
                  border: '1px solid rgba(93, 94, 252, 0.25)',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B5BCD7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Eficiência Operacional
                  </span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(127, 72, 252, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Activity size={17} color="#7F48FC" />
                  </div>
                </div>
                <div style={{ fontSize: '2.3rem', fontWeight: 900, color: '#FDFCFD', lineHeight: 1.1 }}>
                  {capacidade?.taxaOcupacao || 65}%
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.78rem', color: '#B5BCD7' }}>
                  <span>Postos em Atendimento:</span>
                  <strong style={{ color: '#5D5EFC' }}>{kpis.emAtendimento} ativos</strong>
                </div>
              </div>
            </div>

            {/* GRID PRINCIPAL: PREVISÃO + RETENÇÃO + FEED AO VIVO */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr',
              gap: '24px',
              marginBottom: '28px'
            }}>
              {/* Esquerda: Previsão Preditiva e Ações de Acolhimento */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(19, 36, 160, 0.35) 0%, rgba(7, 19, 63, 0.95) 100%)',
                  border: '1px solid rgba(46, 158, 253, 0.4)',
                  borderRadius: '20px',
                  padding: '24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <Sparkles size={20} color="#2E9EFD" />
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#2E9EFD', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Previsão Preditiva da Fila
                    </span>
                  </div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#FDFCFD', margin: '8px 0' }}>
                    ~ {tempoEstimadoRestanteMinutos} minutos
                  </div>
                  <p style={{ fontSize: '0.88rem', color: '#B5BCD7', lineHeight: 1.4, marginBottom: '16px' }}>
                    Tempo estimado para desobstrução completa das {waitingQueue.length} senhas pendentes com a velocidade atual dos consultórios.
                  </p>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => navigateTo('fila')}
                      className="btn-primary"
                      style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                    >
                      Ver Fila Completa
                    </button>
                    <button
                      onClick={() => navigateTo('consultorios')}
                      className="btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                    >
                      Ver Estações & Médicos
                    </button>
                  </div>
                </div>

                {/* Alertas de Retenção */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.85) 0%, rgba(2, 8, 23, 0.95) 100%)',
                  border: '1px solid rgba(93, 94, 252, 0.3)',
                  borderRadius: '20px',
                  padding: '22px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={18} color={filasSemVazao.length > 0 ? '#f87171' : '#34d399'} />
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FDFCFD' }}>
                        Alertas de Retenção Crítica
                      </h3>
                    </div>
                    <span style={{
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: filasSemVazao.length > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(52, 211, 153, 0.2)',
                      color: filasSemVazao.length > 0 ? '#f87171' : '#34d399'
                    }}>
                      {filasSemVazao.length} em alerta
                    </span>
                  </div>

                  {filasSemVazao.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {filasSemVazao.slice(0, 3).map((f, i) => (
                        <div key={i} style={{
                          padding: '12px 14px',
                          borderRadius: '12px',
                          background: 'rgba(2, 8, 23, 0.6)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#FDFCFD' }}>{f.servicoNome}</div>
                            <div style={{ fontSize: '0.74rem', color: '#B5BCD7', marginTop: '2px' }}>
                              Mais antiga: <strong style={{ color: '#2E9EFD', fontFamily: 'monospace' }}>{f.maisAntiga}</strong> ({f.quantidade} na fila)
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ef4444', fontFamily: 'monospace' }}>
                              {formatDuration(f.tempoMaxEspera)}
                            </div>
                            <span style={{ fontSize: '0.68rem', color: '#B5BCD7' }}>espera máxima</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px 10px', color: '#34d399', fontSize: '0.86rem' }}>
                      <CheckCircle2 size={24} style={{ margin: '0 auto 6px' }} />
                      <div>Fluxo em ordem. Nenhuma especialidade retida.</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Direita: Feed de Eventos ao Vivo */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.85) 0%, rgba(2, 8, 23, 0.95) 100%)',
                border: '1px solid rgba(93, 94, 252, 0.3)',
                borderRadius: '20px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Radio size={17} color="#2E9EFD" className="pulse-dot" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FDFCFD' }}>
                      Feed de Eventos ao Vivo
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#B5BCD7' }}>Tempo Real</span>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  maxHeight: '380px',
                  overflowY: 'auto'
                }}>
                  {recentEvents.map((ev) => (
                    <div key={ev.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'rgba(2, 8, 23, 0.5)',
                      border: '1px solid rgba(93, 94, 252, 0.15)',
                      fontSize: '0.82rem'
                    }}>
                      <span style={{ fontFamily: 'monospace', color: '#5D5EFC', fontWeight: 700, fontSize: '0.78rem' }}>
                        {ev.time}
                      </span>
                      <span style={{ color: '#FDFCFD' }}>{ev.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================================
            ROTA 2: QUADRO DE COLABORADORES & OPERADORES (ROTA EXCLUSIVA / JANELA SEPARADA)
            ======================================================================= */}
        {currentRoute === 'usuarios' && (
          <div className="fade-in">
            {/* 1. PAINEL SUPERIOR BENTO: MÉTRICAS DA EQUIPE */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '16px',
              marginBottom: '22px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.85) 0%, rgba(2, 8, 23, 0.95) 100%)',
                border: '1px solid rgba(46, 158, 253, 0.3)',
                borderRadius: '16px',
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#B5BCD7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Efetivo Clínico
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FDFCFD', marginTop: '4px' }}>
                    {usersList.length}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#34d399', marginTop: '2px' }}>
                    Plantonistas cadastrados
                  </div>
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(46, 158, 253, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={20} color="#2E9EFD" />
                </div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.85) 0%, rgba(2, 8, 23, 0.95) 100%)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                borderRadius: '16px',
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#B5BCD7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Consultórios Operantes
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#34d399', marginTop: '4px' }}>
                    {usersList.filter(u => u.ativo).length}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#B5BCD7', marginTop: '2px' }}>
                    Acessos habilitados
                  </div>
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(52, 211, 153, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={20} color="#34d399" />
                </div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.85) 0%, rgba(2, 8, 23, 0.95) 100%)',
                border: '1px solid rgba(93, 94, 252, 0.3)',
                borderRadius: '16px',
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#B5BCD7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Despacho Inteligente
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#5D5EFC', marginTop: '4px' }}>
                    {usersList.filter(u => u.chamadaAuto).length}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#B5BCD7', marginTop: '2px' }}>
                    Fila automatizada
                  </div>
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(93, 94, 252, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={20} color="#5D5EFC" />
                </div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.85) 0%, rgba(2, 8, 23, 0.95) 100%)',
                border: '1px solid rgba(127, 72, 252, 0.3)',
                borderRadius: '16px',
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#B5BCD7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Cobertura Assistencial
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#7F48FC', marginTop: '4px' }}>
                    {usersList.reduce((acc, u) => acc + (u.servicosIds?.length || 0), 0)}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#B5BCD7', marginTop: '2px' }}>
                    Especialidades ativas
                  </div>
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(127, 72, 252, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Stethoscope size={20} color="#7F48FC" />
                </div>
              </div>
            </div>

            {/* 2. CARD PRINCIPAL COM TOOLBAR MODERNA */}
            <section style={{
              background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.85) 0%, rgba(2, 8, 23, 0.95) 100%)',
              border: '1px solid rgba(93, 94, 252, 0.3)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
            }}>
              {/* Barra Superior: Título + Ações */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '14px'
              }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FDFCFD' }}>
                    Quadro Profissional & Alocação de Postos
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: '#B5BCD7', marginTop: '3px' }}>
                    Gestão de plantonistas, perfis de atendimento e vinculação de consultórios
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Seletor de Modo de Visualização: Grade vs Lista */}
                  <div style={{
                    display: 'flex',
                    background: 'rgba(2, 8, 23, 0.8)',
                    border: '1px solid rgba(93, 94, 252, 0.3)',
                    borderRadius: '10px',
                    padding: '3px'
                  }}>
                    <button
                      onClick={() => setUserViewMode('cards')}
                      title="Visualização em Grade de Cartões"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '7px',
                        background: userViewMode === 'cards' ? 'linear-gradient(135deg, #286DFC, #2E9EFD)' : 'transparent',
                        border: 'none',
                        color: userViewMode === 'cards' ? '#FDFCFD' : '#B5BCD7',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700
                      }}
                    >
                      <LayoutGrid size={15} />
                      <span>Grade</span>
                    </button>
                    <button
                      onClick={() => setUserViewMode('list')}
                      title="Visualização em Lista Executiva"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '7px',
                        background: userViewMode === 'list' ? 'linear-gradient(135deg, #286DFC, #2E9EFD)' : 'transparent',
                        border: 'none',
                        color: userViewMode === 'list' ? '#FDFCFD' : '#B5BCD7',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700
                      }}
                    >
                      <List size={15} />
                      <span>Lista</span>
                    </button>
                  </div>

                  {/* Botão Novo Colaborador */}
                  <button
                    onClick={handleOpenNovoUsuario}
                    className="btn-primary"
                    style={{
                      padding: '9px 18px',
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      borderRadius: '10px'
                    }}
                  >
                    <UserPlus size={16} />
                    <span>Cadastrar Profissional</span>
                  </button>
                </div>
              </div>

              {/* 3. BARRA DE FILTROS POR CATEGORIA E BUSCA */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '22px',
                flexWrap: 'wrap',
                gap: '12px',
                background: 'rgba(2, 8, 23, 0.45)',
                border: '1px solid rgba(93, 94, 252, 0.15)',
                borderRadius: '14px',
                padding: '10px 14px'
              }}>
                {/* Abas de Setores Assistenciais */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'TODOS', label: 'Todos os Setores' },
                    { id: 'atendimento', label: 'Atendimento & Recepção' },
                    { id: 'clinico', label: 'Corpo Clínico' },
                    { id: 'supervisao', label: 'Gestão & Apoio' }
                  ].map((cat) => {
                    const active = userCategoryFilter === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setUserCategoryFilter(cat.id)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: active ? 800 : 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          background: active ? 'rgba(46, 158, 253, 0.2)' : 'transparent',
                          border: active ? '1px solid rgba(46, 158, 253, 0.5)' : '1px solid transparent',
                          color: active ? '#2E9EFD' : '#B5BCD7'
                        }}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>

                {/* Filtro de Status + Busca Rápida */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    style={{
                      background: 'rgba(2, 8, 23, 0.8)',
                      border: '1px solid rgba(93, 94, 252, 0.25)',
                      color: '#FDFCFD',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      outline: 'none'
                    }}
                  >
                    <option value="TODOS" style={{ background: '#07133F' }}>Todos os Status</option>
                    <option value="ativo" style={{ background: '#07133F' }}>Somente Ativos</option>
                    <option value="inativo" style={{ background: '#07133F' }}>Somente Inativos</option>
                  </select>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(2, 8, 23, 0.8)',
                    border: '1px solid rgba(93, 94, 252, 0.25)',
                    borderRadius: '8px',
                    padding: '6px 12px'
                  }}>
                    <Search size={15} color="#B5BCD7" />
                    <input
                      type="text"
                      value={searchUserQuery}
                      onChange={(e) => setSearchUserQuery(e.target.value)}
                      placeholder="Buscar por nome ou CRM..."
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#FDFCFD',
                        fontSize: '0.82rem',
                        width: '160px'
                      }}
                    />
                    {searchUserQuery && (
                      <button
                        onClick={() => setSearchUserQuery('')}
                        style={{ background: 'transparent', border: 'none', color: '#B5BCD7', cursor: 'pointer', padding: 0 }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. GRADE DE CARTÕES (VIEW PRINCIPAL) */}
              {userViewMode === 'cards' ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
                  gap: '18px'
                }}>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => {
                      const initials = ((user.nome || user.name || 'U').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('') || 'U').toUpperCase();
                      const isClinico = user.categoria === 'clinico';
                      const isSupervisao = user.categoria === 'supervisao';
                      return (
                        <div
                          key={user.id}
                          style={{
                            background: 'rgba(2, 8, 23, 0.65)',
                            border: '1px solid rgba(93, 94, 252, 0.25)',
                            borderRadius: '16px',
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '16px',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.2)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(46, 158, 253, 0.5)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(93, 94, 252, 0.25)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                  position: 'relative',
                                  width: '44px',
                                  height: '44px',
                                  borderRadius: '12px',
                                  background: isClinico 
                                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                                    : isSupervisao 
                                      ? 'linear-gradient(135deg, #7F48FC 0%, #5D5EFC 100%)' 
                                      : 'linear-gradient(135deg, #286DFC 0%, #2E9EFD 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#FDFCFD',
                                  fontWeight: 900,
                                  fontSize: '1rem',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                }}>
                                  {initials}
                                  <span style={{
                                    position: 'absolute',
                                    bottom: '-2px',
                                    right: '-2px',
                                    width: '11px',
                                    height: '11px',
                                    borderRadius: '50%',
                                    background: user.ativo ? '#10b981' : '#64748b',
                                    border: '2px solid #020817'
                                  }} />
                                </div>

                                <div>
                                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#FDFCFD', lineHeight: 1.2 }}>
                                    {user.nome}
                                  </h3>
                                  <div style={{ fontSize: '0.78rem', color: '#B5BCD7', marginTop: '3px' }}>
                                    {user.cargo}
                                  </div>
                                </div>
                              </div>

                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: isClinico ? 'rgba(16, 185, 129, 0.15)' : isSupervisao ? 'rgba(127, 72, 252, 0.15)' : 'rgba(46, 158, 253, 0.15)',
                                color: isClinico ? '#34d399' : isSupervisao ? '#a78bfa' : '#2E9EFD',
                                border: `1px solid ${isClinico ? '#10b98133' : isSupervisao ? '#7F48FC33' : '#2E9EFD33'}`
                              }}>
                                {user.categoriaNome}
                              </span>
                            </div>

                            {/* Alocação e Login */}
                            <div style={{
                              background: 'rgba(7, 19, 63, 0.6)',
                              border: '1px solid rgba(93, 94, 252, 0.18)',
                              borderRadius: '10px',
                              padding: '10px 12px',
                              marginBottom: '12px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.78rem'
                            }}>
                              <div>
                                <span style={{ color: '#B5BCD7' }}>Alocação: </span>
                                <strong style={{ color: '#FDFCFD' }}>{user.posto || 'Geral'}</strong>
                              </div>
                              <div>
                                <span style={{ color: '#B5BCD7' }}>Login: </span>
                                <code style={{ color: '#2E9EFD', fontFamily: 'monospace' }}>{user.login}</code>
                              </div>
                            </div>

                            {/* Especialidades */}
                            <div style={{ marginBottom: '14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#B5BCD7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  Especialidades Vinculadas ({user.servicosIds?.length || 0})
                                </span>
                                <button
                                  onClick={() => handleOpenVinculo(user)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#2E9EFD',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    padding: 0
                                  }}
                                >
                                  + Vincular
                                </button>
                              </div>

                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                {user.servicosIds && user.servicosIds.length > 0 ? (
                                  user.servicosIds.map(srvId => {
                                    const srv = services.find(s => s.id === srvId);
                                    return (
                                      <span
                                        key={srvId}
                                        onClick={() => handleOpenVinculo(user)}
                                        style={{
                                          fontSize: '0.72rem',
                                          fontWeight: 600,
                                          padding: '2px 8px',
                                          borderRadius: '6px',
                                          background: 'rgba(46, 158, 253, 0.12)',
                                          color: '#93c5fd',
                                          border: '1px solid rgba(46, 158, 253, 0.25)',
                                          cursor: 'pointer'
                                        }}
                                        title={srv ? srv.nome : srvId}
                                      >
                                        {srv ? srv.sigla : srvId}
                                      </span>
                                    );
                                  })
                                ) : (
                                  <span style={{ fontSize: '0.74rem', color: '#64748b', fontStyle: 'italic' }}>
                                    Nenhuma especialidade vinculada
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Chamada Contínua Switch */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 10px',
                              borderRadius: '8px',
                              background: 'rgba(2, 8, 23, 0.4)',
                              border: '1px solid rgba(93, 94, 252, 0.15)'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Sparkles size={14} color={user.chamadaAuto ? '#34d399' : '#64748b'} />
                                <span style={{ fontSize: '0.76rem', color: '#B5BCD7' }}>Despacho Automático</span>
                              </div>
                              <button
                                onClick={() => handleToggleUserChamadaAuto(user.id)}
                                style={{
                                  padding: '3px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  border: 'none',
                                  background: user.chamadaAuto ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                                  color: user.chamadaAuto ? '#10b981' : '#94a3b8'
                                }}
                              >
                                {user.chamadaAuto ? 'Ativo' : 'Manual'}
                              </button>
                            </div>
                          </div>

                          {/* Rodapé do Card */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderTop: '1px solid rgba(93, 94, 252, 0.15)',
                            paddingTop: '12px'
                          }}>
                            <button
                              onClick={() => handleToggleUserAtivo(user.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0
                              }}
                            >
                              <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: user.ativo ? '#10b981' : '#ef4444'
                              }} />
                              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: user.ativo ? '#10b981' : '#ef4444' }}>
                                {user.ativo ? 'Em Atividade' : 'Desativado'}
                              </span>
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <button
                                onClick={() => handleOpenVinculo(user)}
                                title="Vincular Especialidades Clínicas"
                                style={{
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  borderRadius: '6px',
                                  padding: '5px 8px',
                                  color: '#B5BCD7',
                                  cursor: 'pointer'
                                }}
                              >
                                <Stethoscope size={14} />
                              </button>
                              <button
                                onClick={() => handleOpenEditarUsuario(user)}
                                title="Editar Cadastro"
                                style={{
                                  background: 'rgba(46, 158, 253, 0.1)',
                                  border: '1px solid rgba(46, 158, 253, 0.3)',
                                  borderRadius: '6px',
                                  padding: '5px 8px',
                                  color: '#2E9EFD',
                                  cursor: 'pointer'
                                }}
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => { setUserToDelete(user); setModalDeleteOpen(true); }}
                                title="Excluir Colaborador"
                                style={{
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  borderRadius: '6px',
                                  padding: '5px 8px',
                                  color: '#ef4444',
                                  cursor: 'pointer'
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 10px', color: '#B5BCD7' }}>
                      Nenhum colaborador encontrado com os filtros selecionados.
                    </div>
                  )}
                </div>
              ) : (
                /* 5. VISÃO EM LISTA EXECUTIVA */
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ color: '#B5BCD7', borderBottom: '1px solid rgba(93, 94, 252, 0.2)' }}>
                        <th style={{ padding: '12px 14px' }}>Profissional</th>
                        <th style={{ padding: '12px 14px' }}>Posto / Alocação</th>
                        <th style={{ padding: '12px 14px' }}>Setor</th>
                        <th style={{ padding: '12px 14px' }}>Especialidades</th>
                        <th style={{ padding: '12px 14px', textAlign: 'center' }}>Despacho Auto</th>
                        <th style={{ padding: '12px 14px', textAlign: 'center' }}>Situação</th>
                        <th style={{ padding: '12px 14px', textAlign: 'right' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => {
                          const initials = ((user.nome || user.name || 'U').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('') || 'U').toUpperCase();
                          return (
                            <tr key={user.id} style={{ borderBottom: '1px solid rgba(93, 94, 252, 0.08)' }}>
                              <td style={{ padding: '14px 14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #286DFC, #7F48FC)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontWeight: 800,
                                    fontSize: '0.82rem'
                                  }}>
                                    {initials}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 800, color: '#FDFCFD', fontSize: '0.9rem' }}>{user.nome}</div>
                                    <div style={{ fontSize: '0.74rem', color: '#B5BCD7' }}>{user.cargo} · {user.login}</div>
                                  </div>
                                </div>
                              </td>

                              <td style={{ padding: '14px 14px', color: '#FDFCFD', fontWeight: 600 }}>
                                {user.posto || 'Ambulatório Geral'}
                              </td>

                              <td style={{ padding: '14px 14px' }}>
                                <span style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  background: 'rgba(46, 158, 253, 0.15)',
                                  color: '#2E9EFD',
                                  border: '1px solid rgba(46, 158, 253, 0.3)'
                                }}>
                                  {user.categoriaNome}
                                </span>
                              </td>

                              <td style={{ padding: '14px 14px' }}>
                                <button
                                  onClick={() => handleOpenVinculo(user)}
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    color: user.servicosIds?.length > 0 ? '#2E9EFD' : '#B5BCD7',
                                    padding: '4px 10px',
                                    borderRadius: '8px',
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  {user.servicosIds?.length || 0} vinculadas
                                </button>
                              </td>

                              <td style={{ padding: '14px 14px', textAlign: 'center' }}>
                                <button
                                  onClick={() => handleToggleUserChamadaAuto(user.id)}
                                  style={{
                                    padding: '3px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    border: 'none',
                                    background: user.chamadaAuto ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                                    color: user.chamadaAuto ? '#10b981' : '#94a3b8'
                                  }}
                                >
                                  {user.chamadaAuto ? 'Ligado' : 'Manual'}
                                </button>
                              </td>

                              <td style={{ padding: '14px 14px', textAlign: 'center' }}>
                                <button
                                  onClick={() => handleToggleUserAtivo(user.id)}
                                  style={{
                                    padding: '3px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    border: 'none',
                                    background: user.ativo ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                    color: user.ativo ? '#10b981' : '#ef4444'
                                  }}
                                >
                                  {user.ativo ? 'Ativo' : 'Inativo'}
                                </button>
                              </td>

                              <td style={{ padding: '14px 14px', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                  <button
                                    onClick={() => handleOpenEditarUsuario(user)}
                                    title="Editar Cadastro"
                                    style={{ background: 'transparent', border: 'none', color: '#2E9EFD', cursor: 'pointer', padding: '5px' }}
                                  >
                                    <Edit3 size={15} />
                                  </button>
                                  <button
                                    onClick={() => { setUserToDelete(user); setModalDeleteOpen(true); }}
                                    title="Excluir Colaborador"
                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' }}
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '30px 14px', color: '#B5BCD7' }}>
                            Nenhum colaborador encontrado com os filtros selecionados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* =======================================================================
            ROTA 3: UNIDADES DE ATENDIMENTO & POLICLÍNICAS (ROTA EXCLUSIVA / JANELA SEPARADA)
            ======================================================================= */}
        {currentRoute === 'unidades' && (
          <div className="fade-in">
            {/* 1. PAINEL SUPERIOR BENTO: TELEMETRIA DE UNIDADES */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '16px',
              marginBottom: '22px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.85) 0%, rgba(2, 8, 23, 0.95) 100%)',
                border: '1px solid rgba(46, 158, 253, 0.3)',
                borderRadius: '16px',
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#B5BCD7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Polos Operacionais
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FDFCFD', marginTop: '4px' }}>
                    {unidadesList.length}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#34d399', marginTop: '2px' }}>
                    Complexos & Policlínicas ativos
                  </div>
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(46, 158, 253, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={20} color="#2E9EFD" />
                </div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.85) 0%, rgba(2, 8, 23, 0.95) 100%)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                borderRadius: '16px',
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#B5BCD7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Capacidade de Postos
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#34d399', marginTop: '4px' }}>
                    {unidadesList.reduce((acc, u) => acc + (u.consultoriosCount || 0), 0)}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#B5BCD7', marginTop: '2px' }}>
                    Guichês & Consultórios
                  </div>
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(52, 211, 153, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Stethoscope size={20} color="#34d399" />
                </div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.85) 0%, rgba(2, 8, 23, 0.95) 100%)',
                border: '1px solid rgba(93, 94, 252, 0.3)',
                borderRadius: '16px',
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#B5BCD7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Ecosistema em Rede
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#5D5EFC', marginTop: '4px' }}>
                    {unidadesList.reduce((acc, u) => acc + (u.totensCount || 0) + (u.paineisCount || 0), 0)}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#B5BCD7', marginTop: '2px' }}>
                    Totens e Telas TV conectadas
                  </div>
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(93, 94, 252, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Monitor size={20} color="#5D5EFC" />
                </div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.85) 0%, rgba(2, 8, 23, 0.95) 100%)',
                border: '1px solid rgba(46, 158, 253, 0.3)',
                borderRadius: '16px',
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#B5BCD7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Guichês em Operação
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#2E9EFD', marginTop: '4px' }}>
                    {unidadesList.reduce((acc, u) => acc + (u.quantidadeGuiches || 4), 0)}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#B5BCD7', marginTop: '2px' }}>
                    Postos configurados nas unidades
                  </div>
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(46, 158, 253, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Monitor size={20} color="#2E9EFD" />
                </div>
              </div>
            </div>

            {/* 2. CARD PRINCIPAL COM TOOLBAR & GAVETA INTERATIVA */}
            <section style={{
              background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.85) 0%, rgba(2, 8, 23, 0.95) 100%)',
              border: '1px solid rgba(93, 94, 252, 0.3)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
            }}>
              {/* Barra Superior */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '14px'
              }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FDFCFD' }}>
                    Gestão de Unidades & Policlínicas
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: '#B5BCD7', marginTop: '3px' }}>
                    Configuração de redes hospitalares, protocolos de acolhimento e telemetria de estações
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Seletor de Modo: Gaveta Accordion vs Grade */}
                  <div style={{
                    display: 'flex',
                    background: 'rgba(2, 8, 23, 0.8)',
                    border: '1px solid rgba(93, 94, 252, 0.3)',
                    borderRadius: '10px',
                    padding: '3px'
                  }}>
                    <button
                      onClick={() => setUnidadeViewMode('accordion')}
                      title="Tabela com Gaveta Expansível"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '7px',
                        background: unidadeViewMode === 'accordion' ? 'linear-gradient(135deg, #286DFC, #2E9EFD)' : 'transparent',
                        border: 'none',
                        color: unidadeViewMode === 'accordion' ? '#FDFCFD' : '#B5BCD7',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700
                      }}
                    >
                      <List size={15} />
                      <span>Gaveta</span>
                    </button>
                    <button
                      onClick={() => setUnidadeViewMode('cards')}
                      title="Visualização em Grade de Cartões"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '7px',
                        background: unidadeViewMode === 'cards' ? 'linear-gradient(135deg, #286DFC, #2E9EFD)' : 'transparent',
                        border: 'none',
                        color: unidadeViewMode === 'cards' ? '#FDFCFD' : '#B5BCD7',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700
                      }}
                    >
                      <LayoutGrid size={15} />
                      <span>Grade</span>
                    </button>
                  </div>

                  {/* Botão Nova Unidade */}
                  <button
                    onClick={handleOpenNovaUnidade}
                    className="btn-primary"
                    style={{
                      padding: '9px 18px',
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      borderRadius: '10px'
                    }}
                  >
                    <Plus size={16} />
                    <span>Cadastrar Unidade</span>
                  </button>
                </div>
              </div>

              {/* Barra de Filtros */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '22px',
                flexWrap: 'wrap',
                gap: '12px',
                background: 'rgba(2, 8, 23, 0.45)',
                border: '1px solid rgba(93, 94, 252, 0.15)',
                borderRadius: '14px',
                padding: '10px 14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', color: '#B5BCD7', fontWeight: 600 }}>Rede Mantenedora:</span>
                  <select
                    value={filtroEmpresaUnidade}
                    onChange={(e) => setFiltroEmpresaUnidade(e.target.value)}
                    style={{
                      background: 'rgba(2, 8, 23, 0.8)',
                      border: '1px solid rgba(93, 94, 252, 0.25)',
                      color: '#FDFCFD',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      outline: 'none',
                      minWidth: '220px'
                    }}
                  >
                    <option value="TODAS" style={{ background: '#07133F' }}>Todas as Redes e Grupos</option>
                    {redesEmpresasList.map((emp) => (
                      <option key={emp} value={emp} style={{ background: '#07133F' }}>{emp}</option>
                    ))}
                  </select>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(2, 8, 23, 0.8)',
                  border: '1px solid rgba(93, 94, 252, 0.25)',
                  borderRadius: '8px',
                  padding: '6px 12px'
                }}>
                  <Search size={15} color="#B5BCD7" />
                  <input
                    type="text"
                    value={searchUnidadeQuery}
                    onChange={(e) => setSearchUnidadeQuery(e.target.value)}
                    placeholder="Buscar unidade, sigla ou região..."
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#FDFCFD',
                      fontSize: '0.82rem',
                      width: '220px'
                    }}
                  />
                  {searchUnidadeQuery && (
                    <button
                      onClick={() => setSearchUnidadeQuery('')}
                      style={{ background: 'transparent', border: 'none', color: '#B5BCD7', cursor: 'pointer', padding: 0 }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* 3. VISUALIZAÇÃO: TABELA COM GAVETA ACCORDION INTERATIVA */}
              {unidadeViewMode === 'accordion' ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px', textAlign: 'left', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ color: '#B5BCD7', borderBottom: '1px solid rgba(93, 94, 252, 0.2)' }}>
                        <th style={{ width: '40px', padding: '10px 8px' }}></th>
                        <th style={{ width: '75px', padding: '10px 10px', textAlign: 'center' }}># ID</th>
                        <th style={{ padding: '10px 14px' }}>Unidade / Sigla</th>
                        <th style={{ padding: '10px 14px' }}>Rede Mantenedora</th>
                        <th style={{ padding: '10px 14px', textAlign: 'center' }}>Guichês Operacionais</th>
                        <th style={{ padding: '10px 14px' }}>Fuso Horário</th>
                        <th style={{ padding: '10px 14px', textAlign: 'center' }}>Status</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUnidades.length > 0 ? (
                        filteredUnidades.map((u) => {
                          const isExpanded = expandedUnidadeId === u.id;
                          return (
                            <React.Fragment key={u.id}>
                              {/* Linha Principal da Unidade */}
                              <tr 
                                onClick={() => setExpandedUnidadeId(isExpanded ? null : u.id)}
                                style={{
                                  background: isExpanded ? 'rgba(46, 158, 253, 0.12)' : 'rgba(2, 8, 23, 0.45)',
                                  border: `1px solid ${isExpanded ? 'rgba(46, 158, 253, 0.4)' : 'rgba(93, 94, 252, 0.12)'}`,
                                  cursor: 'pointer',
                                  transition: 'background 0.2s',
                                  borderRadius: '10px'
                                }}
                              >
                                <td style={{ padding: '14px 8px', textAlign: 'center', color: '#2E9EFD' }}>
                                  <ChevronRight 
                                    size={16} 
                                    style={{
                                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                      transition: 'transform 0.25s ease'
                                    }} 
                                  />
                                </td>

                                <td style={{ padding: '14px 10px', textAlign: 'center', fontFamily: 'monospace', color: '#93c5fd', fontWeight: 800 }}>
                                  {u.id}
                                </td>

                                <td style={{ padding: '14px 14px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                      width: '36px',
                                      height: '36px',
                                      borderRadius: '10px',
                                      background: 'linear-gradient(135deg, #286DFC, #2E9EFD)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#FDFCFD',
                                      fontWeight: 900,
                                      fontSize: '0.8rem'
                                    }}>
                                      {u.sigla}
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 800, color: '#FDFCFD', fontSize: '0.92rem' }}>
                                        {u.nome}
                                      </div>
                                      <div style={{ fontSize: '0.74rem', color: '#B5BCD7', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                        <MapPin size={12} color="#B5BCD7" />
                                        <span>{u.endereco}</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td style={{ padding: '14px 14px', color: '#FDFCFD', fontWeight: 600 }}>
                                  {u.empresa}
                                </td>

                                <td style={{ padding: '14px 14px', textAlign: 'center' }}>
                                  <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                                    <span style={{
                                      fontSize: '0.76rem',
                                      fontWeight: 800,
                                      padding: '4px 10px',
                                      borderRadius: '8px',
                                      background: 'rgba(46, 158, 253, 0.15)',
                                      color: '#2E9EFD',
                                      border: '1px solid rgba(46, 158, 253, 0.35)'
                                    }}>
                                      {u.quantidadeGuiches || 4} Guichês Ativos
                                    </span>
                                    <span style={{ fontSize: '0.68rem', color: '#B5BCD7' }}>
                                      Proporção {u.proporcaoPref || 2}:{u.proporcaoNorm || 1} Pref
                                    </span>
                                  </div>
                                </td>

                                <td style={{ padding: '14px 14px', color: '#B5BCD7', fontSize: '0.8rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Globe size={13} color="#2E9EFD" />
                                    <span>{u.fusoNome}</span>
                                  </div>
                                </td>

                                <td style={{ padding: '14px 14px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => handleToggleUnidadeAtivo(u.id)}
                                    style={{
                                      padding: '4px 12px',
                                      borderRadius: '6px',
                                      fontSize: '0.74rem',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      border: 'none',
                                      background: u.ativo ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                                      color: u.ativo ? '#10b981' : '#ef4444'
                                    }}
                                  >
                                    {u.ativo ? 'Ativo' : 'Inativo'}
                                  </button>
                                </td>

                                <td style={{ padding: '14px 14px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    <button
                                      onClick={() => handleOpenEditarUnidade(u)}
                                      title="Editar Cadastro da Unidade"
                                      style={{ background: 'transparent', border: 'none', color: '#2E9EFD', cursor: 'pointer', padding: '5px' }}
                                    >
                                      <Edit3 size={15} />
                                    </button>
                                    <button
                                      onClick={() => { setUnidadeToDelete(u); setModalDeleteUnidadeOpen(true); }}
                                      title="Excluir Unidade"
                                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' }}
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* GAVETA EXPANSÍVEL: CENTRAL DE OPERAÇÕES DO POLO (ScaFlow Architecture) */}
                              {isExpanded && (
                                <tr style={{ background: 'transparent' }}>
                                  <td colSpan={8} style={{ padding: '0 0 16px 0', border: 'none' }}>
                                    <div style={{
                                      background: 'linear-gradient(145deg, rgba(8, 18, 48, 0.98) 0%, rgba(2, 6, 20, 0.99) 100%)',
                                      border: '1px solid rgba(46, 158, 253, 0.35)',
                                      borderRadius: '18px',
                                      padding: '24px',
                                      marginTop: '6px',
                                      boxShadow: 'inset 0 2px 20px rgba(0, 0, 0, 0.5), 0 12px 35px rgba(2, 8, 23, 0.7)'
                                    }}>
                                      {/* TOPO: IDENTIFICAÇÃO DO POLO & AÇÕES PRINCIPAIS */}
                                      <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: '16px',
                                        paddingBottom: '18px',
                                        marginBottom: '22px',
                                        borderBottom: '1px solid rgba(93, 94, 252, 0.2)'
                                      }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                          <div style={{
                                            width: '46px',
                                            height: '46px',
                                            borderRadius: '12px',
                                            background: 'linear-gradient(135deg, #286DFC, #2E9EFD)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#FDFCFD',
                                            fontWeight: 900,
                                            fontSize: '1rem',
                                            boxShadow: '0 4px 14px rgba(46, 158, 253, 0.3)'
                                          }}>
                                            {u.sigla}
                                          </div>
                                          <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FDFCFD', margin: 0 }}>
                                                {u.nome}
                                              </h4>
                                              <span style={{
                                                fontSize: '0.7rem',
                                                fontWeight: 800,
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                background: 'rgba(52, 211, 153, 0.15)',
                                                color: '#34d399',
                                                border: '1px solid rgba(52, 211, 153, 0.3)'
                                              }}>
                                                ● Sincronização em Tempo Real
                                              </span>
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: '#B5BCD7', marginTop: '3px' }}>
                                              {u.empresa} · {u.endereco}
                                            </div>
                                          </div>
                                        </div>

                                        {/* AÇÕES DE CABEÇALHO */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                          <button
                                            type="button"
                                            onClick={handleBroadcastAlert}
                                            style={{
                                              background: 'rgba(46, 158, 253, 0.12)',
                                              border: '1px solid rgba(46, 158, 253, 0.35)',
                                              color: '#2E9EFD',
                                              padding: '8px 14px',
                                              borderRadius: '8px',
                                              fontSize: '0.78rem',
                                              fontWeight: 700,
                                              cursor: 'pointer',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '6px',
                                              transition: 'all 0.2s'
                                            }}
                                            title="Emitir sinal de bip sonoro nas TVs conectadas nesta unidade"
                                          >
                                            <Volume2 size={14} />
                                            <span>Testar Áudio TV</span>
                                          </button>

                                          {saveFeedbackUnidadeId === u.id && (
                                            <span style={{
                                              fontSize: '0.78rem',
                                              fontWeight: 800,
                                              color: '#34d399',
                                              background: 'rgba(52, 211, 153, 0.15)',
                                              border: '1px solid rgba(52, 211, 153, 0.35)',
                                              padding: '8px 14px',
                                              borderRadius: '8px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '6px'
                                            }}>
                                              <Check size={14} />
                                              <span>Parâmetros gravados!</span>
                                            </span>
                                          )}

                                          <button
                                            type="button"
                                            onClick={() => handleUpdateUnitOperationalConfig(u.id, {})}
                                            className="btn-primary"
                                            style={{
                                              padding: '9px 20px',
                                              borderRadius: '10px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '8px',
                                              fontSize: '0.86rem',
                                              fontWeight: 800,
                                              boxShadow: '0 4px 14px rgba(46, 158, 253, 0.35)'
                                            }}
                                          >
                                            <Save size={15} />
                                            <span>Salvar Alterações</span>
                                          </button>
                                        </div>
                                      </div>

                                      {/* GRID PRINCIPAL EM 3 COLUNAS MODULARES (BENTO OPERACIONAL REORGANIZADO) */}
                                      <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                        gap: '20px',
                                        marginBottom: '22px'
                                      }}>
                                        {/* COLUNA 1: METAS & PRAZOS (SLA) */}
                                        <div style={{
                                          background: 'rgba(2, 8, 23, 0.55)',
                                          border: '1px solid rgba(46, 158, 253, 0.25)',
                                          borderRadius: '14px',
                                          padding: '18px',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: '14px'
                                        }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(46, 158, 253, 0.2)', paddingBottom: '10px' }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(46, 158, 253, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                              <Clock size={16} color="#2E9EFD" />
                                            </div>
                                            <div>
                                              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#FDFCFD' }}>Metas de Tempo (SLA)</div>
                                              <div style={{ fontSize: '0.7rem', color: '#B5BCD7' }}>Prazos de resposta e vigência da senha</div>
                                            </div>
                                          </div>

                                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            {/* Espera Máxima */}
                                            <div style={{ background: 'rgba(7, 19, 63, 0.6)', border: '1px solid rgba(46, 158, 253, 0.2)', borderRadius: '10px', padding: '10px' }}>
                                              <span style={{ display: 'block', fontSize: '0.7rem', color: '#B5BCD7', fontWeight: 700 }}>Espera Máxima</span>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                                <input
                                                  type="number"
                                                  min="1"
                                                  value={u.esperaMin ?? 15}
                                                  onChange={(e) => handleUpdateUnitOperationalConfig(u.id, { esperaMin: parseInt(e.target.value, 10) || 1 })}
                                                  style={{
                                                    width: '100%',
                                                    padding: '2px 4px',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#2E9EFD',
                                                    fontWeight: 900,
                                                    fontSize: '1.05rem',
                                                    outline: 'none'
                                                  }}
                                                />
                                                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>min</span>
                                              </div>
                                            </div>

                                            {/* TMA Alvo */}
                                            <div style={{ background: 'rgba(7, 19, 63, 0.6)', border: '1px solid rgba(46, 158, 253, 0.2)', borderRadius: '10px', padding: '10px' }}>
                                              <span style={{ display: 'block', fontSize: '0.7rem', color: '#B5BCD7', fontWeight: 700 }}>TMA Atendimento</span>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                                <input
                                                  type="number"
                                                  min="1"
                                                  value={u.atendMin ?? 15}
                                                  onChange={(e) => handleUpdateUnitOperationalConfig(u.id, { atendMin: parseInt(e.target.value, 10) || 1 })}
                                                  style={{
                                                    width: '100%',
                                                    padding: '2px 4px',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#34d399',
                                                    fontWeight: 900,
                                                    fontSize: '1.05rem',
                                                    outline: 'none'
                                                  }}
                                                />
                                                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>min</span>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Rechamadas */}
                                          <div style={{ background: 'rgba(7, 19, 63, 0.6)', border: '1px solid rgba(46, 158, 253, 0.2)', borderRadius: '10px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                              <span style={{ display: 'block', fontSize: '0.74rem', color: '#FDFCFD', fontWeight: 700 }}>Tolerância de Rechamada</span>
                                              <span style={{ fontSize: '0.68rem', color: '#B5BCD7' }}>Tentativas antes de no-show</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                              <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                value={u.rechamadas ?? 3}
                                                onChange={(e) => handleUpdateUnitOperationalConfig(u.id, { rechamadas: parseInt(e.target.value, 10) || 1 })}
                                                style={{
                                                  width: '45px',
                                                  padding: '4px 6px',
                                                  background: 'rgba(2, 8, 23, 0.8)',
                                                  border: '1px solid rgba(249, 115, 22, 0.4)',
                                                  borderRadius: '6px',
                                                  color: '#f97316',
                                                  fontWeight: 900,
                                                  fontSize: '0.95rem',
                                                  textAlign: 'center',
                                                  outline: 'none'
                                                }}
                                              />
                                              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>vezes</span>
                                            </div>
                                          </div>

                                          {/* Janela de Senha */}
                                          <div style={{ background: 'rgba(7, 19, 63, 0.6)', border: '1px solid rgba(46, 158, 253, 0.2)', borderRadius: '10px', padding: '10px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                              <span style={{ fontSize: '0.74rem', color: '#FDFCFD', fontWeight: 700 }}>Janela de Validade</span>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <input
                                                  type="number"
                                                  min="0"
                                                  max="72"
                                                  value={u.janelaSenhaHoras ?? 3}
                                                  onChange={(e) => handleUpdateUnitOperationalConfig(u.id, { janelaSenhaHoras: parseInt(e.target.value, 10) || 0 })}
                                                  style={{
                                                    width: '45px',
                                                    padding: '4px 6px',
                                                    background: 'rgba(2, 8, 23, 0.8)',
                                                    border: '1px solid rgba(46, 158, 253, 0.4)',
                                                    borderRadius: '6px',
                                                    color: '#f8fafc',
                                                    fontWeight: 900,
                                                    fontSize: '0.95rem',
                                                    textAlign: 'center',
                                                    outline: 'none'
                                                  }}
                                                />
                                                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>horas</span>
                                              </div>
                                            </div>
                                            <div style={{ fontSize: '0.67rem', color: '#94a3b8', lineHeight: 1.3 }}>
                                              0 = somente no mesmo dia; &gt;0 = últimas N horas (ideal p/ unidades 24h).
                                            </div>
                                          </div>
                                        </div>

                                        {/* COLUNA 2: CAPACIDADE, GUICHÊS (LAURA/EQUIPE) & CADÊNCIA */}
                                        <div style={{
                                          background: 'rgba(2, 8, 23, 0.55)',
                                          border: '1px solid rgba(93, 94, 252, 0.25)',
                                          borderRadius: '14px',
                                          padding: '18px',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: '14px'
                                        }}>
                                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(93, 94, 252, 0.2)', paddingBottom: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(93, 94, 252, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Monitor size={16} color="#7F48FC" />
                                              </div>
                                              <div>
                                                <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#FDFCFD' }}>Estações & Dimensionamento</div>
                                                <div style={{ fontSize: '0.7rem', color: '#B5BCD7' }}>Guichês para atendentes e cadência da fila</div>
                                              </div>
                                            </div>

                                            {/* Stepper de Guichês */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(7, 19, 63, 0.8)', padding: '3px 6px', borderRadius: '8px', border: '1px solid rgba(93, 94, 252, 0.3)' }}>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const current = u.quantidadeGuiches || 4;
                                                  if (current > 1) handleUpdateUnitOperationalConfig(u.id, { quantidadeGuiches: current - 1 });
                                                }}
                                                style={{ width: '22px', height: '22px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#fff', fontWeight: 900, cursor: 'pointer' }}
                                                title="Reduzir guichê"
                                              >-</button>
                                              <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#2E9EFD', minWidth: '22px', textAlign: 'center' }}>
                                                {u.quantidadeGuiches || 4}
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const current = u.quantidadeGuiches || 4;
                                                  if (current < 15) handleUpdateUnitOperationalConfig(u.id, { quantidadeGuiches: current + 1 });
                                                }}
                                                style={{ width: '22px', height: '22px', borderRadius: '4px', background: 'rgba(46, 158, 253, 0.3)', border: 'none', color: '#fff', fontWeight: 900, cursor: 'pointer' }}
                                                title="Adicionar guichê"
                                              >+</button>
                                            </div>
                                          </div>

                                          {/* Visualizador de Guichês da Unidade */}
                                          <div style={{ background: 'rgba(7, 19, 63, 0.4)', border: '1px dashed rgba(93, 94, 252, 0.25)', borderRadius: '10px', padding: '10px' }}>
                                            <div style={{ fontSize: '0.68rem', color: '#B5BCD7', fontWeight: 700, marginBottom: '6px' }}>
                                              Postos liberados p/ Laura e atendentes escolherem no início do turno:
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                              {Array.from({ length: u.quantidadeGuiches || 4 }, (_, i) => (
                                                <div key={i} style={{
                                                  fontSize: '0.72rem',
                                                  fontWeight: 700,
                                                  padding: '4px 8px',
                                                  borderRadius: '6px',
                                                  background: 'rgba(2, 8, 23, 0.9)',
                                                  border: '1px solid rgba(46, 158, 253, 0.3)',
                                                  color: '#93c5fd',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: '5px'
                                                }}>
                                                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }}></span>
                                                  <span>Guichê {String(i + 1).padStart(2, '0')}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>

                                          {/* Proporção de Atendimento & Lotação Máxima */}
                                          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '10px' }}>
                                            <div style={{ background: 'rgba(7, 19, 63, 0.6)', border: '1px solid rgba(93, 94, 252, 0.2)', borderRadius: '10px', padding: '10px' }}>
                                              <span style={{ display: 'block', fontSize: '0.7rem', color: '#B5BCD7', fontWeight: 700, marginBottom: '4px' }}>
                                                Proporção de Chamada
                                              </span>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1 }}>
                                                  <input
                                                    type="number"
                                                    min="1"
                                                    max="10"
                                                    value={u.proporcaoPref ?? 2}
                                                    onChange={(e) => handleUpdateUnitOperationalConfig(u.id, { proporcaoPref: parseInt(e.target.value, 10) || 1 })}
                                                    style={{ width: '100%', padding: '5px 8px', paddingRight: '38px', background: 'rgba(2, 8, 23, 0.8)', border: '1px solid rgba(249, 115, 22, 0.4)', borderRadius: '6px', color: '#f8fafc', fontWeight: 800, fontSize: '0.84rem', outline: 'none' }}
                                                  />
                                                  <span style={{ position: 'absolute', right: '6px', fontSize: '0.64rem', fontWeight: 800, color: '#f97316' }}>PREF</span>
                                                </div>
                                                <span style={{ color: '#B5BCD7', fontWeight: 800, fontSize: '0.75rem' }}>:</span>
                                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1 }}>
                                                  <input
                                                    type="number"
                                                    min="1"
                                                    max="10"
                                                    value={u.proporcaoNorm ?? 1}
                                                    onChange={(e) => handleUpdateUnitOperationalConfig(u.id, { proporcaoNorm: parseInt(e.target.value, 10) || 1 })}
                                                    style={{ width: '100%', padding: '5px 8px', paddingRight: '38px', background: 'rgba(2, 8, 23, 0.8)', border: '1px solid rgba(93, 94, 252, 0.35)', borderRadius: '6px', color: '#f8fafc', fontWeight: 800, fontSize: '0.84rem', outline: 'none' }}
                                                  />
                                                  <span style={{ position: 'absolute', right: '6px', fontSize: '0.64rem', fontWeight: 800, color: '#93c5fd' }}>GER</span>
                                                </div>
                                              </div>
                                            </div>

                                            <div style={{ background: 'rgba(7, 19, 63, 0.6)', border: '1px solid rgba(93, 94, 252, 0.2)', borderRadius: '10px', padding: '10px' }}>
                                              <span style={{ display: 'block', fontSize: '0.7rem', color: '#B5BCD7', fontWeight: 700, marginBottom: '4px' }}>
                                                Lotação Máx. Fila
                                              </span>
                                              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                                <input
                                                  type="text"
                                                  value={u.maxFila || '∞'}
                                                  onChange={(e) => handleUpdateUnitOperationalConfig(u.id, { maxFila: e.target.value })}
                                                  style={{ width: '100%', padding: '5px 8px', paddingRight: '38px', background: 'rgba(2, 8, 23, 0.8)', border: '1px solid rgba(93, 94, 252, 0.35)', borderRadius: '6px', color: '#f8fafc', fontWeight: 800, fontSize: '0.84rem', outline: 'none' }}
                                                />
                                                <span style={{ position: 'absolute', right: '6px', fontSize: '0.64rem', fontWeight: 800, color: '#B5BCD7' }}>FILA</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* COLUNA 3: POLÍTICAS, LGPD & GOVERNANÇA */}
                                        <div style={{
                                          background: 'rgba(2, 8, 23, 0.55)',
                                          border: '1px solid rgba(52, 211, 153, 0.25)',
                                          borderRadius: '14px',
                                          padding: '18px',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: '12px'
                                        }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(52, 211, 153, 0.2)', paddingBottom: '10px' }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(52, 211, 153, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                              <ShieldCheck size={16} color="#34d399" />
                                            </div>
                                            <div>
                                              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#FDFCFD' }}>Diretrizes & Governança</div>
                                              <div style={{ fontSize: '0.7rem', color: '#B5BCD7' }}>Políticas de exibição, voz e compliance</div>
                                            </div>
                                          </div>

                                          {/* 4 Cards de Switches Interativos */}
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {/* Toggle 1: Formulário */}
                                            <label style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'space-between',
                                              background: u.formularioDados !== false ? 'rgba(52, 211, 153, 0.08)' : 'rgba(7, 19, 63, 0.4)',
                                              border: `1px solid ${u.formularioDados !== false ? 'rgba(52, 211, 153, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                                              borderRadius: '8px',
                                              padding: '8px 12px',
                                              cursor: 'pointer',
                                              transition: 'all 0.2s'
                                            }}>
                                              <div>
                                                <div style={{ fontSize: '0.76rem', color: '#FDFCFD', fontWeight: 700 }}>Ficha cadastral do paciente</div>
                                                <div style={{ fontSize: '0.66rem', color: '#B5BCD7' }}>Solicitar dados na emissão</div>
                                              </div>
                                              <input
                                                type="checkbox"
                                                checked={u.formularioDados !== false}
                                                onChange={(e) => handleUpdateUnitOperationalConfig(u.id, { formularioDados: e.target.checked })}
                                                style={{ width: '16px', height: '16px', accentColor: '#10b981', cursor: 'pointer' }}
                                              />
                                            </label>

                                            {/* Toggle 2: LGPD */}
                                            <label style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'space-between',
                                              background: u.exibirNomePainel !== false ? 'rgba(52, 211, 153, 0.08)' : 'rgba(7, 19, 63, 0.4)',
                                              border: `1px solid ${u.exibirNomePainel !== false ? 'rgba(52, 211, 153, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                                              borderRadius: '8px',
                                              padding: '8px 12px',
                                              cursor: 'pointer',
                                              transition: 'all 0.2s'
                                            }}>
                                              <div>
                                                <div style={{ fontSize: '0.76rem', color: '#FDFCFD', fontWeight: 700 }}>Exibir nome no painel (LGPD)</div>
                                                <div style={{ fontSize: '0.66rem', color: '#B5BCD7' }}>Privacidade visual na TV</div>
                                              </div>
                                              <input
                                                type="checkbox"
                                                checked={u.exibirNomePainel !== false}
                                                onChange={(e) => handleUpdateUnitOperationalConfig(u.id, { exibirNomePainel: e.target.checked })}
                                                style={{ width: '16px', height: '16px', accentColor: '#10b981', cursor: 'pointer' }}
                                              />
                                            </label>

                                            {/* Toggle 3: Voz TV */}
                                            <label style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'space-between',
                                              background: u.vozTV !== false ? 'rgba(52, 211, 153, 0.08)' : 'rgba(7, 19, 63, 0.4)',
                                              border: `1px solid ${u.vozTV !== false ? 'rgba(52, 211, 153, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                                              borderRadius: '8px',
                                              padding: '8px 12px',
                                              cursor: 'pointer',
                                              transition: 'all 0.2s'
                                            }}>
                                              <div>
                                                <div style={{ fontSize: '0.76rem', color: '#FDFCFD', fontWeight: 700 }}>Sintetizador de voz na TV</div>
                                                <div style={{ fontSize: '0.66rem', color: '#B5BCD7' }}>Chamada falada automática</div>
                                              </div>
                                              <input
                                                type="checkbox"
                                                checked={u.vozTV !== false}
                                                onChange={(e) => handleUpdateUnitOperationalConfig(u.id, { vozTV: e.target.checked })}
                                                style={{ width: '16px', height: '16px', accentColor: '#10b981', cursor: 'pointer' }}
                                              />
                                            </label>

                                            {/* Toggle 4: Tutoriais */}
                                            <label style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'space-between',
                                              background: u.tutoriaisAtendentes !== false ? 'rgba(52, 211, 153, 0.08)' : 'rgba(7, 19, 63, 0.4)',
                                              border: `1px solid ${u.tutoriaisAtendentes !== false ? 'rgba(52, 211, 153, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                                              borderRadius: '8px',
                                              padding: '8px 12px',
                                              cursor: 'pointer',
                                              transition: 'all 0.2s'
                                            }}>
                                              <div>
                                                <div style={{ fontSize: '0.76rem', color: '#FDFCFD', fontWeight: 700 }}>Tutoriais aos atendentes</div>
                                                <div style={{ fontSize: '0.66rem', color: '#B5BCD7' }}>Instruções ativas no posto</div>
                                              </div>
                                              <input
                                                type="checkbox"
                                                checked={u.tutoriaisAtendentes !== false}
                                                onChange={(e) => handleUpdateUnitOperationalConfig(u.id, { tutoriaisAtendentes: e.target.checked })}
                                                style={{ width: '16px', height: '16px', accentColor: '#10b981', cursor: 'pointer' }}
                                              />
                                            </label>
                                          </div>
                                        </div>
                                      </div>

                                      {/* FAIXA INFERIOR: TELEMETRIA OPERACIONAL INTEGRADA EM REDE (Horizontal Ribbon) */}
                                      <div style={{
                                        background: 'rgba(2, 8, 23, 0.65)',
                                        border: '1px solid rgba(93, 94, 252, 0.25)',
                                        borderRadius: '14px',
                                        padding: '14px 18px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '10px'
                                      }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#B5BCD7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <LayoutGrid size={14} color="#2E9EFD" />
                                            <span>Métricas em Rede & Atalhos Rápidos da Unidade</span>
                                          </div>
                                          <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Clique em qualquer cartão para gerenciar o setor correspondente</span>
                                        </div>

                                        <div style={{
                                          display: 'grid',
                                          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                                          gap: '8px'
                                        }}>
                                          <div 
                                            onClick={() => navigateTo('consultorios')}
                                            style={{ background: 'rgba(7, 19, 63, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '8px 6px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2E9EFD'}
                                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                                          >
                                            <Stethoscope size={16} color="#2E9EFD" style={{ margin: '0 auto 2px' }} />
                                            <div style={{ fontSize: '0.66rem', color: '#B5BCD7', fontWeight: 600 }}>Consultórios</div>
                                            <div style={{ fontSize: '0.86rem', fontWeight: 900, color: '#f97316', marginTop: '1px' }}>{u.consultoriosCount || 0}</div>
                                          </div>

                                          <div 
                                            onClick={() => navigateTo('usuarios')}
                                            style={{ background: 'rgba(7, 19, 63, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '8px 6px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2E9EFD'}
                                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                                          >
                                            <Users size={16} color="#2E9EFD" style={{ margin: '0 auto 2px' }} />
                                            <div style={{ fontSize: '0.66rem', color: '#B5BCD7', fontWeight: 600 }}>Plantonistas</div>
                                            <div style={{ fontSize: '0.86rem', fontWeight: 900, color: '#f97316', marginTop: '1px' }}>{u.profissionaisCount || 6}</div>
                                          </div>

                                          <div 
                                            onClick={() => navigateTo('especialidades')}
                                            style={{ background: 'rgba(7, 19, 63, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '8px 6px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2E9EFD'}
                                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                                          >
                                            <Layers size={16} color="#2E9EFD" style={{ margin: '0 auto 2px' }} />
                                            <div style={{ fontSize: '0.66rem', color: '#B5BCD7', fontWeight: 600 }}>Setores</div>
                                            <div style={{ fontSize: '0.86rem', fontWeight: 900, color: '#f97316', marginTop: '1px' }}>{u.especialidadesCount || 0}</div>
                                          </div>

                                          <div 
                                            onClick={() => navigateTo('especialidades')}
                                            style={{ background: 'rgba(7, 19, 63, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '8px 6px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2E9EFD'}
                                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                                          >
                                            <List size={16} color="#2E9EFD" style={{ margin: '0 auto 2px' }} />
                                            <div style={{ fontSize: '0.66rem', color: '#B5BCD7', fontWeight: 600 }}>Serviços</div>
                                            <div style={{ fontSize: '0.86rem', fontWeight: 900, color: '#f97316', marginTop: '1px' }}>16</div>
                                          </div>

                                          <div 
                                            onClick={() => navigateTo('fila')}
                                            style={{ background: 'rgba(7, 19, 63, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '8px 6px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2E9EFD'}
                                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                                          >
                                            <Clock size={16} color="#2E9EFD" style={{ margin: '0 auto 2px' }} />
                                            <div style={{ fontSize: '0.66rem', color: '#B5BCD7', fontWeight: 600 }}>Em Espera</div>
                                            <div style={{ fontSize: '0.86rem', fontWeight: 900, color: '#f97316', marginTop: '1px' }}>{stats?.kpis?.filaTotal || 0}</div>
                                          </div>

                                          <div 
                                            onClick={() => navigateTo('historico')}
                                            style={{ background: 'rgba(7, 19, 63, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '8px 6px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2E9EFD'}
                                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                                          >
                                            <Coffee size={16} color="#2E9EFD" style={{ margin: '0 auto 2px' }} />
                                            <div style={{ fontSize: '0.66rem', color: '#B5BCD7', fontWeight: 600 }}>Ausências</div>
                                            <div style={{ fontSize: '0.86rem', fontWeight: 900, color: '#f97316', marginTop: '1px' }}>{stats?.kpis?.naoCompareceuDia || 4}</div>
                                          </div>

                                          <div 
                                            style={{ background: 'rgba(7, 19, 63, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '8px 6px', textAlign: 'center' }}
                                          >
                                            <QrCode size={16} color="#2E9EFD" style={{ margin: '0 auto 2px' }} />
                                            <div style={{ fontSize: '0.66rem', color: '#B5BCD7', fontWeight: 600 }}>Totens / QR</div>
                                            <div style={{ fontSize: '0.86rem', fontWeight: 900, color: '#f97316', marginTop: '1px' }}>{u.totensCount || 2}</div>
                                          </div>

                                          <div 
                                            style={{ background: 'rgba(7, 19, 63, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '8px 6px', textAlign: 'center' }}
                                          >
                                            <Tv size={16} color="#2E9EFD" style={{ margin: '0 auto 2px' }} />
                                            <div style={{ fontSize: '0.66rem', color: '#B5BCD7', fontWeight: 600 }}>Telas TV</div>
                                            <div style={{ fontSize: '0.86rem', fontWeight: 900, color: '#f97316', marginTop: '1px' }}>{u.paineisCount || 3}</div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', padding: '40px 10px', color: '#B5BCD7' }}>
                            Nenhuma unidade hospitalar encontrada com os filtros selecionados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* 4. VISUALIZAÇÃO EM GRADE DE CARTÕES */
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                  gap: '18px'
                }}>
                  {filteredUnidades.length > 0 ? (
                    filteredUnidades.map((u) => (
                      <div
                        key={u.id}
                        style={{
                          background: 'rgba(2, 8, 23, 0.65)',
                          border: '1px solid rgba(93, 94, 252, 0.25)',
                          borderRadius: '16px',
                          padding: '20px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '16px',
                          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.2)',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(46, 158, 253, 0.5)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(93, 94, 252, 0.25)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #286DFC 0%, #2E9EFD 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#FDFCFD',
                                fontWeight: 900,
                                fontSize: '0.9rem'
                              }}>
                                {u.sigla}
                              </div>
                              <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#FDFCFD', lineHeight: 1.2 }}>
                                  {u.nome}
                                </h3>
                                <div style={{ fontSize: '0.78rem', color: '#2E9EFD', marginTop: '3px' }}>
                                  {u.empresa}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handleToggleUnidadeAtivo(u.id)}
                              style={{
                                padding: '3px 10px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                border: 'none',
                                background: u.ativo ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                                color: u.ativo ? '#10b981' : '#ef4444'
                              }}
                            >
                              {u.ativo ? 'Ativo' : 'Inativo'}
                            </button>
                          </div>

                          <div style={{ fontSize: '0.78rem', color: '#B5BCD7', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                            <MapPin size={13} color="#B5BCD7" />
                            <span>{u.endereco}</span>
                          </div>

                          {/* Telemetria Rápida no Card */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '8px',
                            background: 'rgba(7, 19, 63, 0.5)',
                            border: '1px solid rgba(93, 94, 252, 0.15)',
                            borderRadius: '10px',
                            padding: '10px',
                            textAlign: 'center',
                            marginBottom: '14px'
                          }}>
                            <div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#FDFCFD' }}>{u.consultoriosCount}</div>
                              <div style={{ fontSize: '0.7rem', color: '#B5BCD7' }}>Consultórios</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#34d399' }}>{u.totensCount}</div>
                              <div style={{ fontSize: '0.7rem', color: '#B5BCD7' }}>Totens</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#5D5EFC' }}>{u.paineisCount}</div>
                              <div style={{ fontSize: '0.7rem', color: '#B5BCD7' }}>Telas TV</div>
                            </div>
                          </div>
                        </div>

                        {/* Rodapé do Card */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderTop: '1px solid rgba(93, 94, 252, 0.15)',
                          paddingTop: '12px'
                        }}>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(46, 158, 253, 0.15)',
                            color: '#2E9EFD',
                            border: '1px solid rgba(46, 158, 253, 0.3)'
                          }}>
                            {u.quantidadeGuiches || 4} Guichês ({u.proporcaoPref || 2}:{u.proporcaoNorm || 1})
                          </span>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              onClick={() => handleOpenEditarUnidade(u)}
                              title="Editar Unidade"
                              style={{
                                background: 'rgba(46, 158, 253, 0.1)',
                                border: '1px solid rgba(46, 158, 253, 0.3)',
                                borderRadius: '6px',
                                padding: '5px 8px',
                                color: '#2E9EFD',
                                cursor: 'pointer'
                              }}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => { setUnidadeToDelete(u); setModalDeleteUnidadeOpen(true); }}
                              title="Excluir Unidade"
                              style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '6px',
                                padding: '5px 8px',
                                color: '#ef4444',
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 10px', color: '#B5BCD7' }}>
                      Nenhuma unidade hospitalar encontrada com os filtros selecionados.
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        {/* =======================================================================
            ROTA 4: ESTAÇÕES & CONSULTÓRIOS (JANELA SEPARADA)
            ======================================================================= */}
        {currentRoute === 'consultorios' && (
          <div className="fade-in">
            <section style={{
              background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.85) 0%, rgba(2, 8, 23, 0.95) 100%)',
              border: '1px solid rgba(93, 94, 252, 0.3)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FDFCFD' }}>
                    Estações Clínicas & Consultórios Ativos
                  </h2>
                  <p style={{ fontSize: '0.84rem', color: '#B5BCD7', marginTop: '3px' }}>
                    Status em tempo real de médicos e operadores no balcão
                  </p>
                </div>
                <button
                  onClick={handleCallLongestWait}
                  className="btn-secondary"
                  style={{
                    padding: '9px 16px',
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#2E9EFD',
                    border: '1px solid rgba(46, 158, 253, 0.4)'
                  }}
                >
                  <Play size={14} />
                  <span>Chamar Maior Espera</span>
                </button>
              </div>

              {/* Grid dos Consultórios */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '18px'
              }}>
                {attendants.length > 0 ? (
                  attendants.map((att, idx) => {
                    const isBusy = att.status === 'ATENDENDO';
                    const isPause = att.status === 'PAUSA';
                    return (
                      <div key={idx} style={{
                        padding: '18px',
                        borderRadius: '16px',
                        background: 'rgba(2, 8, 23, 0.55)',
                        border: `1px solid ${isBusy ? 'rgba(46, 158, 253, 0.45)' : isPause ? 'rgba(245, 158, 11, 0.4)' : 'rgba(93, 94, 252, 0.3)'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '14px'
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                background: isBusy ? 'rgba(46, 158, 253, 0.2)' : isPause ? 'rgba(245, 158, 11, 0.2)' : 'rgba(93, 94, 252, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isBusy ? '#2E9EFD' : isPause ? '#f59e0b' : '#5D5EFC',
                                fontWeight: 800
                              }}>
                                {att.nome.charAt(0)}
                              </div>
                              <div>
                                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#FDFCFD' }}>{att.nome}</div>
                                <div style={{ fontSize: '0.78rem', color: '#B5BCD7' }}>{att.guiche}</div>
                              </div>
                            </div>

                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              background: isBusy ? 'rgba(46, 158, 253, 0.2)' : isPause ? 'rgba(245, 158, 11, 0.2)' : 'rgba(52, 211, 153, 0.15)',
                              color: isBusy ? '#2E9EFD' : isPause ? '#fbbf24' : '#34d399',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}>
                              <span className="pulse-dot" style={{
                                width: '6px',
                                height: '6px',
                                background: isBusy ? '#2E9EFD' : isPause ? '#fbbf24' : '#34d399'
                              }}></span>
                              {att.status}
                            </span>
                          </div>

                          <div style={{
                            padding: '12px 14px',
                            borderRadius: '12px',
                            background: 'rgba(7, 19, 63, 0.6)',
                            border: '1px solid rgba(93, 94, 252, 0.2)',
                            marginTop: '8px'
                          }}>
                            {isBusy && att.ticketAtual ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                  <div style={{ fontSize: '0.72rem', color: '#B5BCD7' }}>Senha em Consulta</div>
                                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#2E9EFD', fontFamily: 'monospace' }}>
                                    {att.ticketAtual.codigo}
                                  </div>
                                </div>
                                <span style={{ fontSize: '0.78rem', color: '#FDFCFD', fontWeight: 700 }}>
                                  {att.ticketAtual.servicoNome}
                                </span>
                              </div>
                            ) : isPause ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '0.84rem' }}>
                                <Coffee size={15} />
                                <span>Intervalo Técnico ({att.pausaMotivo || 'Pausa'})</span>
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.84rem', color: '#34d399', fontWeight: 600 }}>
                                Posto livre · Aguardando chamada
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(93, 94, 252, 0.15)', paddingTop: '12px' }}>
                          <div style={{ fontSize: '0.78rem', color: '#B5BCD7' }}>
                            Concluídos hoje: <strong style={{ color: '#FDFCFD' }}>{att.atendimentosHoje || 0}</strong>
                          </div>

                          <button
                            onClick={() => handleToggleAuto(att.username, att.modoAutomatico)}
                            style={{
                              background: att.modoAutomatico ? 'rgba(46, 158, 253, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                              border: `1px solid ${att.modoAutomatico ? '#2E9EFD' : 'rgba(255, 255, 255, 0.15)'}`,
                              color: att.modoAutomatico ? '#2E9EFD' : '#B5BCD7',
                              padding: '5px 12px',
                              borderRadius: '8px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <Sparkles size={13} />
                            <span>{att.modoAutomatico ? 'Auto Ativo' : 'Manual'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#B5BCD7', gridColumn: '1/-1' }}>
                    Nenhum consultório conectado no momento.
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* =======================================================================
            ROTA 4: ESPECIALIDADES MÉDICAS (JANELA SEPARADA)
            ======================================================================= */}
        {currentRoute === 'especialidades' && (
          <div className="fade-in">
            <section style={{
              background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.85) 0%, rgba(2, 8, 23, 0.95) 100%)',
              border: '1px solid rgba(93, 94, 252, 0.3)',
              borderRadius: '20px',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FDFCFD' }}>
                    Jornada por Especialidade Clínica
                  </h2>
                  <p style={{ fontSize: '0.84rem', color: '#B5BCD7', marginTop: '3px' }}>
                    Volume de senhas, fila em espera e taxa de conclusão
                  </p>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ color: '#B5BCD7', borderBottom: '1px solid rgba(93, 94, 252, 0.2)' }}>
                      <th style={{ padding: '12px 10px' }}>Especialidade</th>
                      <th style={{ padding: '12px 10px' }}>Sigla</th>
                      <th style={{ padding: '12px 10px' }}>Emitidas</th>
                      <th style={{ padding: '12px 10px' }}>Atendidas</th>
                      <th style={{ padding: '12px 10px' }}>Em Espera</th>
                      <th style={{ padding: '12px 10px' }}>TME</th>
                      <th style={{ padding: '12px 10px', textAlign: 'right' }}>Aproveitamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servicosResumo && servicosResumo.map((srv) => (
                      <tr key={srv.id} style={{ borderBottom: '1px solid rgba(93, 94, 252, 0.08)' }}>
                        <td style={{ padding: '12px 10px', fontWeight: 700, color: '#FDFCFD' }}>{srv.nome}</td>
                        <td style={{ padding: '12px 10px', fontFamily: 'monospace', color: '#5D5EFC', fontWeight: 800 }}>{srv.sigla}</td>
                        <td style={{ padding: '12px 10px', color: '#2E9EFD', fontWeight: 700 }}>{srv.emitidas}</td>
                        <td style={{ padding: '12px 10px', color: '#34d399', fontWeight: 700 }}>{srv.atendidas}</td>
                        <td style={{ padding: '12px 10px', color: srv.espera > 0 ? '#ef4444' : '#B5BCD7', fontWeight: 800 }}>
                          {srv.espera}
                        </td>
                        <td style={{ padding: '12px 10px', fontFamily: 'monospace', color: '#B5BCD7' }}>
                          {formatDuration(srv.tmeSegundos)}
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            background: srv.taxaConclusao >= 70 ? 'rgba(52, 211, 153, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: srv.taxaConclusao >= 70 ? '#34d399' : '#fbbf24'
                          }}>
                            {srv.taxaConclusao}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* =======================================================================
            ROTA 5: FILA DE ESPERA AO VIVO (JANELA SEPARADA)
            ======================================================================= */}
        {currentRoute === 'fila' && (
          <div className="fade-in">
            <section style={{
              background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.85) 0%, rgba(2, 8, 23, 0.95) 100%)',
              border: '1px solid rgba(93, 94, 252, 0.3)',
              borderRadius: '20px',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FDFCFD' }}>
                    Fila de Espera em Tempo Real
                  </h2>
                  <span style={{
                    background: 'rgba(46, 158, 253, 0.15)',
                    color: '#2E9EFD',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    padding: '4px 14px',
                    borderRadius: '9999px',
                    border: '1px solid rgba(46, 158, 253, 0.35)'
                  }}>
                    {filteredQueue.length} pacientes na fila
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {[
                    { id: 'TODAS', label: 'Todas' },
                    { id: 'ESPECIAL', label: 'Emergência' },
                    { id: 'PREFERENCIAL', label: 'Prioritário' },
                    { id: 'NORMAL', label: 'Convencional' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedPriorityFilter(f.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: selectedPriorityFilter === f.id ? '#2E9EFD' : 'rgba(2, 8, 23, 0.6)',
                        color: selectedPriorityFilter === f.id ? '#020817' : '#B5BCD7',
                        border: `1px solid ${selectedPriorityFilter === f.id ? '#2E9EFD' : 'rgba(93, 94, 252, 0.25)'}`
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ color: '#B5BCD7', borderBottom: '1px solid rgba(93, 94, 252, 0.2)' }}>
                      <th style={{ padding: '12px 10px' }}>Código</th>
                      <th style={{ padding: '12px 10px' }}>Especialidade</th>
                      <th style={{ padding: '12px 10px' }}>Prioridade</th>
                      <th style={{ padding: '12px 10px' }}>Paciente</th>
                      <th style={{ padding: '12px 10px' }}>Tempo em Espera</th>
                      <th style={{ padding: '12px 10px', textAlign: 'right' }}>Despacho do Gestor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQueue.length > 0 ? (
                      filteredQueue.map((t) => {
                        const elapsed = Math.max(1, Math.round((nowTimestamp - new Date(t.createdAt).getTime()) / 1000));
                        const isAlert = elapsed > 600;
                        return (
                          <tr key={t.id} style={{ borderBottom: '1px solid rgba(93, 94, 252, 0.08)' }}>
                            <td style={{ padding: '14px 10px', fontFamily: 'monospace', fontWeight: 900, fontSize: '1.15rem', color: t.prioridadeCor || '#2E9EFD' }}>
                              {t.codigo}
                            </td>
                            <td style={{ padding: '14px 10px', color: '#FDFCFD', fontWeight: 600 }}>{t.servicoNome}</td>
                            <td style={{ padding: '14px 10px' }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '9999px',
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                background: `${t.prioridadeCor}22`,
                                color: t.prioridadeCor
                              }}>
                                {t.prioridadeNome}
                              </span>
                            </td>
                            <td style={{ padding: '14px 10px', color: '#B5BCD7' }}>
                              {t.nomeCliente || 'Acolhimento Convencional'}
                            </td>
                            <td style={{ padding: '14px 10px', fontFamily: 'monospace', color: isAlert ? '#ef4444' : '#FDFCFD', fontWeight: isAlert ? 800 : 600 }}>
                              {formatDuration(elapsed)}
                            </td>
                            <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                              <button
                                onClick={() => {
                                  const targetAttendant = (attendants || []).find(a => a.status === 'LIVRE') || (attendants || [])[0] || { username: 'laura', guiche: 'Guichê 01' };
                                  socket.emit('ticket:callSpecific', {
                                    ticketId: t.id,
                                    username: targetAttendant.username || 'laura',
                                    guiche: targetAttendant.guiche || 'Guichê 01'
                                  });
                                }}
                                style={{
                                  padding: '7px 16px',
                                  borderRadius: '8px',
                                  background: 'rgba(46, 158, 253, 0.15)',
                                  border: '1px solid rgba(46, 158, 253, 0.4)',
                                  color: '#2E9EFD',
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                <Play size={13} />
                                <span>Chamar Agora</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '40px 10px', color: '#B5BCD7' }}>
                          Nenhum paciente aguardando no filtro selecionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* =======================================================================
            ROTA 6: HISTÓRICO DO PLANTÃO (JANELA SEPARADA)
            ======================================================================= */}
        {currentRoute === 'historico' && (
          <div className="fade-in">
            <section style={{
              background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.85) 0%, rgba(2, 8, 23, 0.95) 100%)',
              border: '1px solid rgba(93, 94, 252, 0.3)',
              borderRadius: '20px',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FDFCFD' }}>
                    Histórico de Atendimentos Concluídos
                  </h2>
                  <p style={{ fontSize: '0.84rem', color: '#B5BCD7', marginTop: '3px' }}>
                    Registro auditável de consultas finalizadas no plantão de hoje
                  </p>
                </div>
                <span style={{ fontSize: '0.84rem', color: '#34d399', fontWeight: 700 }}>
                  {kpis.atendimentosDia} consultas finalizadas
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ color: '#B5BCD7', borderBottom: '1px solid rgba(93, 94, 252, 0.2)' }}>
                      <th style={{ padding: '12px 10px' }}>Código</th>
                      <th style={{ padding: '12px 10px' }}>Especialidade</th>
                      <th style={{ padding: '12px 10px' }}>Guichê / Consultório</th>
                      <th style={{ padding: '12px 10px' }}>Operador</th>
                      <th style={{ padding: '12px 10px', textAlign: 'right' }}>Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentHistory && recentHistory.length > 0 ? (
                      recentHistory.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(93, 94, 252, 0.08)' }}>
                          <td style={{ padding: '12px 10px', fontFamily: 'monospace', fontWeight: 900, color: '#2E9EFD', fontSize: '1rem' }}>
                            {item.codigo}
                          </td>
                          <td style={{ padding: '12px 10px', color: '#FDFCFD' }}>{item.servicoNome}</td>
                          <td style={{ padding: '12px 10px', color: '#B5BCD7' }}>{item.guiche}</td>
                          <td style={{ padding: '12px 10px', color: '#B5BCD7' }}>{item.atendenteNome || 'Atendente'}</td>
                          <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              background: 'rgba(52, 211, 153, 0.15)',
                              color: '#34d399'
                            }}>
                              Concluído
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '36px 10px', color: '#B5BCD7' }}>
                          Nenhum atendimento finalizado registrado recentemente.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* =======================================================================
            ROTA 7: IMPRESSÃO TÉRMICA & GESTÃO DA BOBINA EPSON M352A
            ======================================================================= */}
        {currentRoute === 'impressao' && (
          <ThermalPrinterConfig />
        )}

      </main>

      {/* =======================================================================
          MODAIS GLOBAIS
          ======================================================================= */}
      {modalUserOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 8, 23, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '680px',
            background: 'linear-gradient(135deg, #07133F 0%, #020817 100%)',
            border: '1px solid rgba(93, 94, 252, 0.4)',
            borderRadius: '20px',
            boxShadow: '0 25px 65px rgba(2, 8, 23, 0.95), 0 0 35px rgba(46, 158, 253, 0.25)',
            overflow: 'hidden'
          }}>
            {/* Cabeçalho do Modal */}
            <div style={{
              background: 'linear-gradient(135deg, #286DFC 0%, #7F48FC 100%)',
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#FDFCFD', fontWeight: 900 }}>
                  {userFormData.id ? 'Editar Dados do Colaborador' : 'Cadastrar Novo Colaborador'}
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.85)' }}>
                  Defina o posto de atendimento, credenciais e parâmetros assistenciais
                </p>
              </div>
              <button
                onClick={() => setModalUserOpen(false)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSalvarUsuario} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#B5BCD7', marginBottom: '6px', fontWeight: 600 }}>Nome Completo</label>
                  <input
                    type="text"
                    value={userFormData.nome}
                    onChange={(e) => setUserFormData({ ...userFormData, nome: e.target.value })}
                    required
                    placeholder="Ex: Dra. Juliana Ramos"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(2, 8, 23, 0.7)', border: '1px solid rgba(93, 94, 252, 0.35)', color: '#FDFCFD', fontSize: '0.88rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#B5BCD7', marginBottom: '6px', fontWeight: 600 }}>Cargo / Função</label>
                  <input
                    type="text"
                    value={userFormData.cargo}
                    onChange={(e) => setUserFormData({ ...userFormData, cargo: e.target.value })}
                    placeholder="Ex: Médica Generalista ou Atendente"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(2, 8, 23, 0.7)', border: '1px solid rgba(93, 94, 252, 0.35)', color: '#FDFCFD', fontSize: '0.88rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#B5BCD7', marginBottom: '6px', fontWeight: 600 }}>Posto / Alocação</label>
                  <input
                    type="text"
                    value={userFormData.posto}
                    onChange={(e) => setUserFormData({ ...userFormData, posto: e.target.value })}
                    placeholder="Ex: Guichê 01 ou Consultório 02"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(2, 8, 23, 0.7)', border: '1px solid rgba(93, 94, 252, 0.35)', color: '#FDFCFD', fontSize: '0.88rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#B5BCD7', marginBottom: '6px', fontWeight: 600 }}>Setor Assistencial</label>
                  <select
                    value={userFormData.categoria}
                    onChange={(e) => setUserFormData({ ...userFormData, categoria: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(2, 8, 23, 0.7)', border: '1px solid rgba(93, 94, 252, 0.35)', color: '#FDFCFD', fontSize: '0.88rem', outline: 'none' }}
                  >
                    <option value="atendimento" style={{ background: '#07133F' }}>Atendimento & Recepção</option>
                    <option value="clinico" style={{ background: '#07133F' }}>Corpo Clínico & Médicos</option>
                    <option value="supervisao" style={{ background: '#07133F' }}>Gestão & Apoio Operacional</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#B5BCD7', marginBottom: '6px', fontWeight: 600 }}>Login de Acesso</label>
                  <input
                    type="text"
                    value={userFormData.login}
                    onChange={(e) => setUserFormData({ ...userFormData, login: e.target.value })}
                    required
                    placeholder="juliana.ramos"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(2, 8, 23, 0.7)', border: '1px solid rgba(93, 94, 252, 0.35)', color: '#FDFCFD', fontSize: '0.88rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#B5BCD7', marginBottom: '6px', fontWeight: 600 }}>Senha de Acesso</label>
                  <input
                    type="password"
                    value={userFormData.senha}
                    onChange={(e) => setUserFormData({ ...userFormData, senha: e.target.value })}
                    placeholder={userFormData.id ? 'Preencha para alterar' : 'Senha de acesso'}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(2, 8, 23, 0.7)', border: '1px solid rgba(93, 94, 252, 0.35)', color: '#FDFCFD', fontSize: '0.88rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#B5BCD7', marginBottom: '6px', fontWeight: 600 }}>E-mail Institucional</label>
                  <input
                    type="email"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    placeholder="colaborador@scaflow.med.br"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(2, 8, 23, 0.7)', border: '1px solid rgba(93, 94, 252, 0.35)', color: '#FDFCFD', fontSize: '0.88rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#B5BCD7', marginBottom: '6px', fontWeight: 600 }}>Celular / Ramal</label>
                  <input
                    type="tel"
                    value={userFormData.celular}
                    onChange={(e) => setUserFormData({ ...userFormData, celular: e.target.value })}
                    placeholder="(11) 98000-0000"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(2, 8, 23, 0.7)', border: '1px solid rgba(93, 94, 252, 0.35)', color: '#FDFCFD', fontSize: '0.88rem', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Parâmetros de Funcionamento */}
              <div style={{
                background: 'rgba(2, 8, 23, 0.5)',
                border: '1px solid rgba(93, 94, 252, 0.25)',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '22px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FDFCFD' }}>Colaborador em Atividade</div>
                    <div style={{ fontSize: '0.72rem', color: '#B5BCD7' }}>Permite login e despacho no guichê</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={userFormData.ativo}
                    onChange={(e) => setUserFormData({ ...userFormData, ativo: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                  />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FDFCFD' }}>Despacho Automático</div>
                    <div style={{ fontSize: '0.72rem', color: '#B5BCD7' }}>Chama próxima senha ao concluir</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={userFormData.chamadaAuto}
                    onChange={(e) => setUserFormData({ ...userFormData, chamadaAuto: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#2E9EFD', cursor: 'pointer' }}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalUserOpen(false)}
                  className="btn-secondary"
                  style={{ padding: '10px 18px', fontSize: '0.84rem' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '10px 24px', fontSize: '0.84rem' }}
                >
                  Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Vincular Serviços */}
      {modalVincularOpen && selectedUserForVinculo && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 8, 23, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '580px',
            background: '#1e293b',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '16px',
            boxShadow: '0 25px 65px rgba(0,0,0,0.95)',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>
                  Vincular Especialidades ao Operador
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#fef3c7' }}>
                  Operador: {selectedUserForVinculo.nome}
                </span>
              </div>
              <button
                onClick={() => setModalVincularOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '14px' }}>
                Selecione as especialidades médicas que este operador poderá chamar e atender no balcão:
              </div>

              <div style={{
                maxHeight: '320px',
                overflowY: 'auto',
                border: '1px solid #334155',
                borderRadius: '10px',
                padding: '12px',
                background: 'rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {services.map((srv) => {
                  const isChecked = tempVinculoServicos.includes(srv.id);
                  return (
                    <label
                      key={srv.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: isChecked ? 'rgba(46, 158, 253, 0.12)' : 'transparent',
                        border: `1px solid ${isChecked ? 'rgba(46, 158, 253, 0.3)' : 'transparent'}`,
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'monospace', color: '#2E9EFD', fontWeight: 700 }}>[{srv.sigla}]</span>
                        <span style={{ color: '#f8fafc', fontSize: '0.88rem' }}>{srv.nome}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTempVinculoServicos(prev => [...prev, srv.id]);
                          } else {
                            setTempVinculoServicos(prev => prev.filter(id => id !== srv.id));
                          }
                        }}
                        style={{ width: '18px', height: '18px', accentColor: '#2E9EFD', cursor: 'pointer' }}
                      />
                    </label>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  onClick={() => setModalVincularOpen(false)}
                  className="btn-secondary"
                  style={{ padding: '10px 18px', background: 'transparent', border: '1px solid #475569', color: '#cbd5e1' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvarVinculo}
                  className="btn-primary"
                  style={{ padding: '10px 22px' }}
                >
                  Salvar Vínculos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Excluir Usuário */}
      {modalDeleteOpen && userToDelete && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 8, 23, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '420px',
            background: '#1e293b',
            border: '2px solid #ef4444',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
            boxShadow: '0 25px 65px rgba(0,0,0,0.95)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#ef4444'
            }}>
              <Trash2 size={28} />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', marginBottom: '6px' }}>
              Excluir Usuário?
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#94a3b8', marginBottom: '20px' }}>
              Deseja realmente remover o operador <strong>{userToDelete.nome}</strong> ({userToDelete.login})? Esta ação é irreversível.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                onClick={() => setModalDeleteOpen(false)}
                className="btn-secondary"
                style={{ padding: '10px 18px', background: 'transparent', border: '1px solid #475569', color: '#cbd5e1' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarExclusao}
                style={{
                  padding: '10px 20px',
                  background: '#ef4444',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL CADASTRAR / EDITAR UNIDADE
          ======================================================================= */}
      {modalUnidadeOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 8, 23, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '650px',
            background: 'linear-gradient(135deg, #07133F 0%, #020817 100%)',
            border: '1px solid rgba(93, 94, 252, 0.4)',
            borderRadius: '20px',
            boxShadow: '0 25px 65px rgba(2, 8, 23, 0.95), 0 0 35px rgba(46, 158, 253, 0.25)',
            overflow: 'hidden'
          }}>
            {/* Cabeçalho do Modal */}
            <div style={{
              background: 'linear-gradient(135deg, #286DFC 0%, #7F48FC 100%)',
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#FDFCFD', fontWeight: 900 }}>
                  {unidadeFormData.id ? 'Editar Dados da Unidade' : 'Cadastrar Nova Unidade Hospitalar'}
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.85)' }}>
                  Defina o complexo, rede mantenedora e protocolos de regulação
                </p>
              </div>
              <button
                onClick={() => setModalUnidadeOpen(false)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSalvarUnidade} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                    Rede / Empresa Responsável
                  </label>
                  <input
                    type="text"
                    value={unidadeFormData.empresa}
                    onChange={(e) => setUnidadeFormData({ ...unidadeFormData, empresa: e.target.value })}
                    placeholder="Ex: Rede ScaFlow Saúde, Grupo Hospitalar Central..."
                    style={{
                      width: '100%',
                      background: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#f8fafc',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                    Nome Oficial da Unidade *
                  </label>
                  <input
                    type="text"
                    required
                    value={unidadeFormData.nome}
                    onChange={(e) => setUnidadeFormData({ ...unidadeFormData, nome: e.target.value })}
                    placeholder="Ex: Complexo Hospitalar Central, Ambulatório Integrado..."
                    style={{
                      width: '100%',
                      background: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#f8fafc',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                    Sigla de Identificação (até 10 carac.) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={unidadeFormData.sigla}
                    onChange={(e) => setUnidadeFormData({ ...unidadeFormData, sigla: e.target.value.toUpperCase() })}
                    placeholder="Ex: CHC, AIS, CME..."
                    style={{
                      width: '100%',
                      background: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#f8fafc',
                      fontSize: '0.88rem',
                      outline: 'none',
                      fontFamily: 'monospace',
                      fontWeight: 800
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                    Fuso Horário Operacional
                  </label>
                  <select
                    value={unidadeFormData.fuso}
                    onChange={(e) => setUnidadeFormData({ ...unidadeFormData, fuso: e.target.value })}
                    style={{
                      width: '100%',
                      background: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#f8fafc',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  >
                    <option value="America/Sao_Paulo">Horário de Brasília (Padrão UTC-3)</option>
                    <option value="America/Manaus">Manaus / Amazonas (UTC-4)</option>
                    <option value="America/Rio_Branco">Acre (UTC-5)</option>
                    <option value="America/Noronha">Fernando de Noronha (UTC-2)</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                    Endereço / Polo de Localização
                  </label>
                  <input
                    type="text"
                    value={unidadeFormData.endereco}
                    onChange={(e) => setUnidadeFormData({ ...unidadeFormData, endereco: e.target.value })}
                    placeholder="Ex: Av. Paulista, 1500 - Bela Vista, São Paulo/SP"
                    style={{
                      width: '100%',
                      background: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#f8fafc',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                    Guichês Ativos na Unidade
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={unidadeFormData.quantidadeGuiches || 4}
                    onChange={(e) => setUnidadeFormData({ ...unidadeFormData, quantidadeGuiches: parseInt(e.target.value, 10) || 1 })}
                    style={{
                      width: '100%',
                      background: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#f8fafc',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Postos disponíveis para seleção dos atendentes
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                    Prioridade (Pref x Normal)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={unidadeFormData.proporcaoPref || 2}
                      onChange={(e) => setUnidadeFormData({ ...unidadeFormData, proporcaoPref: parseInt(e.target.value, 10) || 1 })}
                      style={{
                        width: '100%',
                        background: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        color: '#f8fafc',
                        fontSize: '0.88rem',
                        outline: 'none'
                      }}
                      placeholder="Pref (2)"
                    />
                    <span style={{ color: '#cbd5e1', fontWeight: 800 }}>X</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={unidadeFormData.proporcaoNorm || 1}
                      onChange={(e) => setUnidadeFormData({ ...unidadeFormData, proporcaoNorm: parseInt(e.target.value, 10) || 1 })}
                      style={{
                        width: '100%',
                        background: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        color: '#f8fafc',
                        fontSize: '0.88rem',
                        outline: 'none'
                      }}
                      placeholder="Norm (1)"
                    />
                  </div>
                </div>

                <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={unidadeFormData.ativo}
                      onChange={(e) => setUnidadeFormData({ ...unidadeFormData, ativo: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: '#2E9EFD', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#FDFCFD' }}>
                      Unidade Habilitada e em Operação Ativa
                    </span>
                  </label>
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setModalUnidadeOpen(false)}
                  className="btn-secondary"
                  style={{ padding: '10px 18px', background: 'transparent', border: '1px solid #475569', color: '#cbd5e1' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '10px 24px' }}
                >
                  Salvar Unidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL EXCLUIR UNIDADE
          ======================================================================= */}
      {modalDeleteUnidadeOpen && unidadeToDelete && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 8, 23, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '420px',
            background: '#1e293b',
            border: '2px solid #ef4444',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
            boxShadow: '0 25px 65px rgba(0,0,0,0.95)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#ef4444'
            }}>
              <Trash2 size={28} />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', marginBottom: '6px' }}>
              Excluir Unidade?
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#94a3b8', marginBottom: '20px' }}>
              Deseja realmente remover a unidade hospitalar <strong>{unidadeToDelete.nome}</strong> ({unidadeToDelete.sigla})? Esta ação desconectará os dispositivos associados.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                onClick={() => setModalDeleteUnidadeOpen(false)}
                className="btn-secondary"
                style={{ padding: '10px 18px', background: 'transparent', border: '1px solid #475569', color: '#cbd5e1' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarExclusaoUnidade}
                style={{
                  padding: '10px 20px',
                  background: '#ef4444',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
