// client/src/pages/Atendente.jsx
import React, { useState, useEffect } from 'react';
import { 
  Play, 
  ListChecks, 
  Keyboard, 
  CheckCircle2, 
  ArrowRightCircle, 
  UserX, 
  Megaphone, 
  Clock, 
  User, 
  Sparkles,
  ChevronDown,
  X,
  Search,
  Check,
  Coffee,
  Utensils,
  Armchair,
  Bath,
  Zap,
  RotateCw,
  Pause,
  Monitor
} from 'lucide-react';
import { socket, formatDuration } from '../socket';
import { saasService } from '../supabase';

export default function Atendente({ user, tenant }) {
  const currentUsername = user?.login || user?.email?.split('@')[0] || 'laura';
  const currentDisplayName = user?.name || 'Laura Guimarães';
  const tenantId = tenant?.id || user?.tenant_id || 'tenant-demo-01';

  // Lista dinâmica de guichês ativos configurados na unidade
  const [activeGuiches, setActiveGuiches] = useState(() => {
    try {
      const stored = localStorage.getItem('sca_active_guiches');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return ['Guichê 01', 'Guichê 02', 'Guichê 03', 'Guichê 04'];
  });

  const [guiche, setGuiche] = useState(() => {
    try {
      const saved = sessionStorage.getItem(`sca_${currentUsername}_guiche`);
      if (saved) return saved;
    } catch (e) {}
    return user?.assigned_counter || 'Guichê 01';
  });

  // Modal para atendente escolher o posto de trabalho
  const [showGuicheModal, setShowGuicheModal] = useState(false);
  const [ticketAtual, setTicketAtual] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [services, setServices] = useState([]);
  const [statsLaura, setStatsLaura] = useState({ atendimentosHoje: 0, historico: [] });

  // Modo Automático & Pausa (Padrão: LIGADO)
  const [modoAutomatico, setModoAutomatico] = useState(true);
  const [statusAtendente, setStatusAtendente] = useState('LIVRE'); // 'LIVRE' | 'ATENDENDO' | 'PAUSA'
  const [pausaMotivo, setPausaMotivo] = useState(null);
  const [pausaSeconds, setPausaSeconds] = useState(0);
  const [showPausaMenu, setShowPausaMenu] = useState(false);

  // Modais
  const [showFilaModal, setShowFilaModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [codeInputValue, setCodeInputValue] = useState('');
  const [transferServiceId, setTransferServiceId] = useState('');
  const [transferObs, setTransferObs] = useState('');
  const [searchQueueTerm, setSearchQueueTerm] = useState('');

  // Sincroniza escolha de guichê e escuta atualizações do Admin em tempo real
  useEffect(() => {
    const savedGuiche = sessionStorage.getItem(`sca_${currentUsername}_guiche`);
    if (!savedGuiche && !user?.assigned_counter) {
      setShowGuicheModal(true);
    }

    const handleStorageChange = (e) => {
      if (e.key === 'sca_active_guiches' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setActiveGuiches(parsed);
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentUsername, user]);

  // Carrega dados (Serviços e Fila)
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [srvs, tkts] = await Promise.all([
          saasService.fetchServices(tenantId),
          saasService.fetchTickets(tenantId)
        ]);
        if (isMounted) {
          if (srvs && srvs.length > 0) {
            setServices(srvs);
            setTransferServiceId(srvs[0].id);
          }
          if (tkts) {
            const waiting = tkts.filter(t => t.status === 'WAITING');
            setWaitingQueue(waiting);
            const myCalled = tkts.find(t => t.status === 'CALLED' && (t.attendant_name === currentDisplayName || t.attendant_id === currentUsername));
            if (myCalled && !ticketAtual) {
              setTicketAtual(myCalled);
              setStatusAtendente('ATENDENDO');
            }
          }
        }
      } catch (err) {
        console.error('[Atendente] Erro ao carregar dados:', err);
      }
    };

    loadData();

    const unsub = saasService.subscribeToChanges(tenantId, () => {
      loadData();
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, [tenantId, currentUsername, currentDisplayName]);

  // Sincroniza socket local se conectado
  useEffect(() => {
    if (socket.connected) {
      fetch('/api/services')
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) setServices(data);
        })
        .catch(() => {});

      fetch('/api/dashboard')
        .then(res => res.json())
        .then(data => {
          const found = data.attendants?.find(a => a.username === currentUsername || a.username === 'laura');
          if (found) {
            if (found.ticketAtual) {
              setTicketAtual(found.ticketAtual);
              setStatusAtendente('ATENDENDO');
            } else if (found.status === 'PAUSA') {
              setStatusAtendente('PAUSA');
              setPausaMotivo(found.pausaMotivo || 'Pausa');
            }
            setModoAutomatico(found.modoAutomatico !== undefined ? !!found.modoAutomatico : true);
            setStatsLaura({
              atendimentosHoje: found.atendimentosHoje || 0,
              historico: found.historico || []
            });
          }
        })
        .catch(() => {});
    }

    const onQueueUpdate = (queue) => {
      if (queue) setWaitingQueue(queue);
    };

    const onStateUpdate = (state) => {
      const found = state.attendants?.find(a => a.username === currentUsername || a.username === 'laura');
      if (found) {
        if (found.ticketAtual) {
          setTicketAtual(found.ticketAtual);
          setStatusAtendente('ATENDENDO');
        } else if (found.status === 'PAUSA') {
          setStatusAtendente('PAUSA');
          setPausaMotivo(found.pausaMotivo || 'Pausa');
          setTicketAtual(null);
        } else if (statusAtendente !== 'PAUSA' && !ticketAtual) {
          setStatusAtendente('LIVRE');
        }
        setStatsLaura({
          atendimentosHoje: found.atendimentosHoje || 0,
          historico: found.historico || []
        });
      }
    };

    socket.on('queue:update', onQueueUpdate);
    socket.on('state:update', onStateUpdate);

    return () => {
      socket.off('queue:update', onQueueUpdate);
      socket.off('state:update', onStateUpdate);
    };
  }, [currentUsername]);

  // Cronômetro do Atendimento Ativo
  useEffect(() => {
    let interval = null;
    if (ticketAtual) {
      const startMs = new Date(ticketAtual.calledAt || ticketAtual.called_at || ticketAtual.createdAt || ticketAtual.created_at).getTime() || Date.now();
      const update = () => {
        const secs = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
        setTimerSeconds(secs);
      };
      update();
      interval = setInterval(update, 1000);
    } else {
      setTimerSeconds(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [ticketAtual]);

  // Cronômetro de Pausa
  useEffect(() => {
    let interval = null;
    if (statusAtendente === 'PAUSA') {
      interval = setInterval(() => {
        setPausaSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setPausaSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [statusAtendente]);

  // Alterna Modo Automático
  const handleToggleAuto = () => {
    const nextVal = !modoAutomatico;
    setModoAutomatico(nextVal);
    if (socket.connected) {
      socket.emit('attendant:toggleAuto', {
        username: currentUsername,
        enabled: nextVal
      });
    }
  };

  // Entrar em Pausa
  const handleStartPause = (motivo) => {
    setShowPausaMenu(false);
    setStatusAtendente('PAUSA');
    setPausaMotivo(motivo);
    setPausaSeconds(0);

    if (socket.connected) {
      socket.emit('attendant:pause', {
        username: currentUsername,
        motivo: motivo
      });
    }
  };

  // Retornar da Pausa
  const handleResumePause = () => {
    setStatusAtendente('LIVRE');
    setPausaMotivo(null);
    setPausaSeconds(0);

    if (socket.connected) {
      socket.emit('attendant:resume', {
        username: currentUsername
      });
    }
  };

  // Atualiza guichê
  const handleGuicheChange = (newGuiche) => {
    setGuiche(newGuiche);
    try {
      sessionStorage.setItem(`sca_${currentUsername}_guiche`, newGuiche);
    } catch (e) {}
    if (socket.connected) {
      socket.emit('attendant:update', {
        username: currentUsername,
        guiche: newGuiche,
        status: ticketAtual ? 'ATENDENDO' : statusAtendente,
        modoAutomatico
      });
    }
    setShowGuicheModal(false);
  };

  // 1. Chamar Próxima Senha
  const handleCallNext = async () => {
    try {
      const ticket = await saasService.callNextTicket(tenantId, {
        attendantId: currentUsername,
        attendantName: currentDisplayName,
        counterName: guiche
      });

      if (ticket) {
        setTicketAtual(ticket);
        setStatusAtendente('ATENDENDO');
        if (socket.connected) {
          socket.emit('tv:call', ticket);
          socket.emit('attendant:update', {
            username: currentUsername,
            guiche,
            status: 'ATENDENDO',
            ticketAtual: ticket
          });
        }
      } else {
        alert('A fila de espera está vazia no momento.');
      }
    } catch (err) {
      console.error('[Atendente] Erro ao chamar próxima senha:', err);
      alert('A fila de espera está vazia no momento.');
    }
  };

  // 2. Chamar Senha Específica da Lista
  const handleCallSpecific = async (ticketId) => {
    try {
      const tkts = await saasService.fetchTickets(tenantId);
      const target = tkts.find(t => t.id === ticketId);
      if (target) {
        target.status = 'CALLED';
        target.attendant_name = currentDisplayName;
        target.counter_name = guiche;
        const ticket = await saasService.callNextTicket(tenantId, {
          attendantId: currentUsername,
          attendantName: currentDisplayName,
          counterName: guiche,
          serviceId: target.service_id
        }) || target;

        setTicketAtual(ticket);
        setStatusAtendente('ATENDENDO');
        setShowFilaModal(false);
        if (socket.connected) {
          socket.emit('tv:call', ticket);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Buscar e Chamar por Código
  const handleCallByCode = async (e) => {
    e.preventDefault();
    if (!codeInputValue.trim()) return;

    try {
      const tkts = await saasService.fetchTickets(tenantId);
      const found = tkts.find(t => t.status === 'WAITING' && t.codigo?.toLowerCase() === codeInputValue.trim().toLowerCase());
      if (found) {
        await handleCallSpecific(found.id);
        setShowCodeModal(false);
        setCodeInputValue('');
      } else {
        alert('Senha não encontrada na fila de espera.');
      }
    } catch (err) {
      alert('Senha não encontrada na fila de espera.');
    }
  };

  // 4. Rechamar Senha Atual
  const handleRecall = async () => {
    if (!ticketAtual) return;
    const recalled = await saasService.recallTicket(tenantId, ticketAtual.id);
    if (socket.connected) {
      socket.emit('tv:call', recalled || ticketAtual);
    }
  };

  // 5. Finalizar Atendimento
  const handleFinish = async () => {
    if (!ticketAtual) return;
    await saasService.finishTicket(tenantId, ticketAtual.id);

    setStatsLaura(prev => ({
      atendimentosHoje: prev.atendimentosHoje + 1,
      historico: [{
        codigo: ticketAtual.codigo,
        servico: ticketAtual.servicoNome,
        duracao: formatDuration(timerSeconds),
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }, ...prev.historico.slice(0, 9)]
    }));

    if (modoAutomatico) {
      handleCallNext();
    } else {
      setTicketAtual(null);
      setStatusAtendente('LIVRE');
    }
  };

  // 6. Não Compareceu (No-Show)
  const handleNoShow = async () => {
    if (!ticketAtual) return;
    if (window.confirm(`Deseja registrar ausência para a senha ${ticketAtual.codigo}?`)) {
      await saasService.noShowTicket(tenantId, ticketAtual.id);
      if (modoAutomatico) {
        handleCallNext();
      } else {
        setTicketAtual(null);
        setStatusAtendente('LIVRE');
      }
    }
  };

  // 7. Confirmar Transferência
  const handleConfirmTransfer = async (e) => {
    e.preventDefault();
    if (!ticketAtual) return;

    await saasService.finishTicket(tenantId, ticketAtual.id);
    setShowTransferModal(false);
    setTransferObs('');

    if (modoAutomatico) {
      handleCallNext();
    } else {
      setTicketAtual(null);
      setStatusAtendente('LIVRE');
    }
  };

  const filteredQueue = waitingQueue.filter(t => 
    t.codigo.toLowerCase().includes(searchQueueTerm.toLowerCase()) ||
    t.servicoNome.toLowerCase().includes(searchQueueTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }} className="fade-in">
      
      {/* Topo do Guichê: Identificação, Modo Automático e Seletor de Posição */}
      <div className="glass-panel" style={{
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px',
        borderLeft: '4px solid #2E9EFD',
        position: 'relative',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'var(--gradient-symbol)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(46, 158, 253, 0.45)'
          }}>
            <User size={24} color="#FDFCFD" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FDFCFD' }}>
                {currentDisplayName}
              </h2>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                background: statusAtendente === 'PAUSA' ? 'rgba(245, 158, 11, 0.2)' : ticketAtual ? 'rgba(46, 158, 253, 0.2)' : 'rgba(93, 94, 252, 0.2)',
                color: statusAtendente === 'PAUSA' ? '#fbbf24' : ticketAtual ? '#2E9EFD' : '#5D5EFC',
                padding: '3px 10px',
                borderRadius: '9999px',
                border: `1px solid ${statusAtendente === 'PAUSA' ? 'rgba(245, 158, 11, 0.4)' : ticketAtual ? 'rgba(46, 158, 253, 0.4)' : 'rgba(93, 94, 252, 0.4)'}`
              }}>
                {statusAtendente === 'PAUSA' ? `Intervalo (${pausaMotivo})` : ticketAtual ? 'Em Consulta' : 'Livre para Atender'}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#B5BCD7', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span>Posto Atual:</span>
              <button
                type="button"
                onClick={() => setShowGuicheModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(46, 158, 253, 0.15)',
                  border: '1px solid rgba(46, 158, 253, 0.4)',
                  borderRadius: '6px',
                  padding: '2px 9px',
                  color: '#2E9EFD',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                title="Clique para alterar seu guichê de trabalho"
              >
                <Monitor size={13} color="#2E9EFD" />
                <span>{guiche}</span>
                <span style={{ fontSize: '0.7rem', color: '#93c5fd', textDecoration: 'underline' }}>Trocar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Controles: Modo Automático, Pausa e Seletor de Posição */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          
          {/* Botão de Fluxo Automático */}
          <button
            onClick={handleToggleAuto}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              borderRadius: '10px',
              background: modoAutomatico ? 'rgba(46, 158, 253, 0.22)' : 'rgba(7, 19, 63, 0.7)',
              border: `1px solid ${modoAutomatico ? '#2E9EFD' : 'rgba(93, 94, 252, 0.3)'}`,
              color: modoAutomatico ? '#FDFCFD' : '#B5BCD7',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: modoAutomatico ? '0 0 16px rgba(46, 158, 253, 0.3)' : 'none'
            }}
            title="Ao ativar, as senhas da fila são despachadas automaticamente"
          >
            <Zap size={16} color={modoAutomatico ? '#2E9EFD' : '#7e8bb6'} />
            <span>Fluxo Automático: {modoAutomatico ? 'LIGADO' : 'DESLIGADO'}</span>
          </button>

          {/* Botão / Menu de Pausa */}
          {statusAtendente !== 'PAUSA' ? (
            <div style={{ position: 'relative', zIndex: 110 }}>
              <button
                onClick={() => setShowPausaMenu(!showPausaMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 15px',
                  borderRadius: '10px',
                  background: 'rgba(127, 72, 252, 0.18)',
                  border: '1px solid rgba(127, 72, 252, 0.4)',
                  color: '#FDFCFD',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Coffee size={15} color="#5D5EFC" />
                <span>Registrar Intervalo</span>
                <ChevronDown size={14} color="#B5BCD7" />
              </button>

              {showPausaMenu && (
                <>
                  {/* Backdrop para fechar ao clicar fora */}
                  <div 
                    onClick={() => setShowPausaMenu(false)}
                    style={{
                      position: 'fixed',
                      inset: 0,
                      zIndex: 9998,
                      background: 'transparent'
                    }}
                  />

                  <div className="pop-in" style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '230px',
                    padding: '8px',
                    background: '#07133F',
                    border: '1px solid rgba(93, 94, 252, 0.4)',
                    borderRadius: '14px',
                    boxShadow: '0 20px 50px rgba(2, 8, 23, 0.95), 0 0 25px rgba(46, 158, 253, 0.2)',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                  <button
                    onClick={() => handleStartPause('Intervalo Café')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: 'none',
                      color: '#FDFCFD',
                      fontSize: '0.85rem',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(19, 36, 160, 0.4)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Coffee size={16} color="#f59e0b" />
                    <span>Intervalo Café / Lanche</span>
                  </button>

                  <button
                    onClick={() => handleStartPause('Horário de Almoço')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: 'none',
                      color: '#FDFCFD',
                      fontSize: '0.85rem',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(19, 36, 160, 0.4)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Utensils size={16} color="#2E9EFD" />
                    <span>Horário de Almoço / Refeição</span>
                  </button>

                  <button
                    onClick={() => handleStartPause('Descanso Regulamentar')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: 'none',
                      color: '#FDFCFD',
                      fontSize: '0.85rem',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(19, 36, 160, 0.4)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Armchair size={16} color="#5D5EFC" />
                    <span>Descanso Regulamentar</span>
                  </button>

                  <button
                    onClick={() => handleStartPause('Pausa Operacional Breve')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: 'none',
                      color: '#FDFCFD',
                      fontSize: '0.85rem',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(19, 36, 160, 0.4)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Bath size={16} color="#7F48FC" />
                    <span>Pausa Operacional Breve</span>
                  </button>
                </div>
              </>
            )}
            </div>
          ) : (
            <button
              onClick={handleResumePause}
              className="btn-primary"
              style={{
                padding: '9px 18px',
                fontSize: '0.85rem'
              }}
            >
              <Play size={14} />
              <span>Retomar Atendimento</span>
            </button>
          )}

          {/* Seletor de Posição / Guichê */}
          <select
            value={guiche}
            onChange={(e) => handleGuicheChange(e.target.value)}
            style={{
              padding: '9px 14px',
              borderRadius: '10px',
              background: '#07133F',
              border: '1px solid rgba(93, 94, 252, 0.35)',
              color: '#FDFCFD',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {activeGuiches.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ESTADO DE PAUSA ATIVA */}
      {statusAtendente === 'PAUSA' && (
        <div className="glass-panel pop-in" style={{
          padding: '48px 24px',
          textAlign: 'center',
          marginBottom: '28px',
          background: 'linear-gradient(135deg, rgba(127, 72, 252, 0.12) 0%, rgba(7, 19, 63, 0.95) 100%)',
          border: '2px solid rgba(127, 72, 252, 0.4)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(127, 72, 252, 0.2)',
            color: '#7F48FC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Coffee size={32} />
          </div>

          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FDFCFD', marginBottom: '8px' }}>
            Atendimento em Pausa
          </h3>
          <p style={{ color: '#5D5EFC', fontSize: '1.1rem', fontWeight: 600, marginBottom: '20px' }}>
            Motivo: {pausaMotivo || 'Pausa Operacional'}
          </p>

          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '2.8rem',
            fontWeight: 800,
            color: '#FDFCFD',
            marginBottom: '24px'
          }}>
            {formatDuration(pausaSeconds)}
          </div>

          <button
            onClick={handleResumePause}
            className="btn-primary"
            style={{
              padding: '16px 36px',
              fontSize: '1.05rem',
              display: 'inline-flex',
              gap: '10px'
            }}
          >
            <Play size={20} />
            <span>Retornar ao Atendimento</span>
          </button>
        </div>
      )}

      {/* PAINEL CENTRAL DE ATENDIMENTO (MANTÉM O FORMATO DA IMAGEM 2) */}
      {statusAtendente !== 'PAUSA' && (
        <div className="glass-panel pop-in" style={{
          padding: '36px 30px',
          marginBottom: '28px',
          border: '2px solid rgba(46, 158, 253, 0.4)',
          background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.85) 0%, rgba(2, 8, 23, 0.95) 100%)'
        }}>
          {/* Topo: Identificação / Código / Cronômetro */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#B5BCD7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {ticketAtual ? 'PACIENTE EM ATENDIMENTO' : 'POSTO DE ATENDIMENTO DISPONÍVEL'}
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginTop: '4px' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'clamp(3.5rem, 8vw, 5.5rem)',
                  fontWeight: 900,
                  color: ticketAtual ? (ticketAtual.prioridadeCor || '#2E9EFD') : '#5D5EFC',
                  lineHeight: 1
                }}>
                  {ticketAtual ? ticketAtual.codigo : '---'}
                </span>

                <span style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  background: ticketAtual
                    ? `${ticketAtual.prioridadeCor}22`
                    : (waitingQueue[0] ? `${waitingQueue[0].prioridadeCor}22` : 'rgba(46, 158, 253, 0.15)'),
                  color: ticketAtual
                    ? ticketAtual.prioridadeCor
                    : (waitingQueue[0] ? waitingQueue[0].prioridadeCor : '#2E9EFD'),
                  border: ticketAtual
                    ? `1px solid ${ticketAtual.prioridadeCor}44`
                    : (waitingQueue[0] ? `1px solid ${waitingQueue[0].prioridadeCor}44` : '1px solid rgba(46, 158, 253, 0.35)'),
                  fontWeight: 800,
                  fontSize: '0.9rem'
                }}>
                  {ticketAtual
                    ? ticketAtual.prioridadeNome
                    : (waitingQueue[0] ? `Próximo: ${waitingQueue[0].prioridadeNome}` : 'Aguardando Chamada')}
                </span>
              </div>
            </div>

            {/* Cronômetro */}
            <div style={{
              background: 'rgba(2, 8, 23, 0.6)',
              padding: '16px 28px',
              borderRadius: '16px',
              border: '1px solid rgba(93, 94, 252, 0.25)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B5BCD7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {ticketAtual ? 'Tempo de Atendimento' : 'Duração do Atendimento'}
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '2.4rem',
                fontWeight: 800,
                color: timerSeconds > 600 ? '#ef4444' : '#2E9EFD',
                marginTop: '4px'
              }}>
                {ticketAtual ? formatDuration(timerSeconds) : '00:00'}
              </div>
            </div>
          </div>

          {/* Grid de Informações Técnicas */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            padding: '18px',
            borderRadius: '12px',
            background: 'rgba(2, 8, 23, 0.4)',
            border: '1px solid rgba(93, 94, 252, 0.2)',
            marginBottom: '32px'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#B5BCD7' }}>Especialidade Clínica</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#2E9EFD', marginTop: '2px' }}>
                {ticketAtual ? ticketAtual.servicoNome : (waitingQueue[0]?.servicoNome || 'Triagem Geral / Livre')}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#B5BCD7' }}>Horário de Emissão</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#FDFCFD', marginTop: '2px' }}>
                {ticketAtual 
                  ? new Date(ticketAtual.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                  : (waitingQueue[0] 
                      ? new Date(waitingQueue[0].createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                      : '--:--')}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#B5BCD7' }}>Fluxo de Chamada</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: modoAutomatico ? '#2E9EFD' : '#B5BCD7', marginTop: '2px' }}>
                {modoAutomatico ? 'Automático' : 'Manual'}
              </div>
            </div>
          </div>

          {/* Barra de Ações Rápidas */}
          {ticketAtual ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '14px'
            }}>
              <button
                onClick={handleFinish}
                className="btn-primary"
                style={{
                  padding: '16px',
                  fontSize: '1rem'
                }}
              >
                <CheckCircle2 size={20} />
                <span>Concluir {modoAutomatico ? '(Próxima Auto)' : ''}</span>
              </button>

              <button
                onClick={handleRecall}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(127, 72, 252, 0.18)',
                  color: '#FDFCFD',
                  border: '1px solid rgba(127, 72, 252, 0.45)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(127, 72, 252, 0.35)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(127, 72, 252, 0.18)'}
              >
                <Megaphone size={20} color="#5D5EFC" />
                <span>Rechamar</span>
              </button>

              <button
                onClick={() => setShowTransferModal(true)}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(46, 158, 253, 0.15)',
                  color: '#FDFCFD',
                  border: '1px solid rgba(46, 158, 253, 0.4)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(46, 158, 253, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(46, 158, 253, 0.15)'}
              >
                <ArrowRightCircle size={20} color="#2E9EFD" />
                <span>Encaminhar</span>
              </button>

              <button
                onClick={handleNoShow}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
              >
                <UserX size={20} />
                <span>Ausente</span>
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '14px'
            }}>
              <button
                onClick={handleCallNext}
                className="btn-primary"
                style={{
                  padding: '16px',
                  fontSize: '1rem'
                }}
              >
                <Megaphone size={20} />
                <span>Chamar Próximo Paciente</span>
              </button>

              <button
                onClick={() => setShowFilaModal(true)}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(127, 72, 252, 0.18)',
                  color: '#FDFCFD',
                  border: '1px solid rgba(127, 72, 252, 0.45)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(127, 72, 252, 0.35)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(127, 72, 252, 0.18)'}
              >
                <ListChecks size={20} color="#5D5EFC" />
                <span>Atender da Fila ({waitingQueue.length})</span>
              </button>

              <button
                onClick={() => setShowCodeModal(true)}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(46, 158, 253, 0.15)',
                  color: '#FDFCFD',
                  border: '1px solid rgba(46, 158, 253, 0.4)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(46, 158, 253, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(46, 158, 253, 0.15)'}
              >
                <Keyboard size={20} color="#2E9EFD" />
                <span>Digitar Código da Senha</span>
              </button>

              <button
                onClick={() => setShowPausaMenu(!showPausaMenu)}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
              >
                <Coffee size={20} />
                <span>Registrar Intervalo</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Histórico do Dia da Laura */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
            Meus Atendimentos Hoje
          </h3>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Total atendidos: <strong style={{ color: '#34d399' }}>{statsLaura.atendimentosHoje}</strong>
          </span>
        </div>

        {statsLaura.historico && statsLaura.historico.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {statsLaura.historico.slice(0, 5).map((h, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.03)',
                fontSize: '0.88rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: h.prioridadeCor || '#60a5fa' }}>{h.codigo}</span>
                  <span style={{ color: '#cbd5e1' }}>{h.servicoNome}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#94a3b8', fontSize: '0.8rem' }}>
                  <span>Duração: <strong style={{ color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>{formatDuration(h.tempoAtendimentoSegundos)}</strong></span>
                  <span>{new Date(h.finishedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '16px' }}>
            Nenhum atendimento concluído hoje ainda.
          </div>
        )}
      </div>

      {/* MODAL: Atender da Fila */}
      {showFilaModal && (
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
          <div className="glass-panel pop-in" style={{
            width: '100%',
            maxWidth: '540px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            padding: '28px',
            background: 'linear-gradient(135deg, #07133F 0%, #020817 100%)',
            border: '1px solid rgba(93, 94, 252, 0.45)',
            boxShadow: '0 25px 65px rgba(2, 8, 23, 0.95), 0 0 35px rgba(46, 158, 253, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FDFCFD' }}>Escolher Senha da Fila</h3>
              <button onClick={() => setShowFilaModal(false)} style={{ background: 'transparent', border: 'none', color: '#B5BCD7', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ position: 'relative', marginBottom: '18px' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#5D5EFC' }} />
              <input
                type="text"
                placeholder="Buscar por código ou especialidade..."
                value={searchQueueTerm}
                onChange={(e) => setSearchQueueTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  borderRadius: '12px',
                  background: 'rgba(2, 8, 23, 0.7)',
                  border: '1px solid rgba(93, 94, 252, 0.35)',
                  color: '#FDFCFD',
                  fontSize: '0.92rem'
                }}
              />
            </div>

            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredQueue.length > 0 ? (
                filteredQueue.map((t) => (
                  <div key={t.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    background: 'rgba(19, 36, 160, 0.15)',
                    border: '1px solid rgba(93, 94, 252, 0.25)'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.15rem', color: t.prioridadeCor || '#2E9EFD' }}>
                          {t.codigo}
                        </span>
                        <span style={{
                          padding: '3px 9px',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          background: `${t.prioridadeCor}22`,
                          color: t.prioridadeCor,
                          border: `1px solid ${t.prioridadeCor}44`
                        }}>
                          {t.prioridadeNome}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#B5BCD7', marginTop: '3px' }}>
                        {t.servicoNome}
                      </div>
                    </div>

                    <button
                      onClick={() => handleCallSpecific(t.id)}
                      className="btn-primary"
                      style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    >
                      <Play size={14} />
                      <span>Atender</span>
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#7e8bb6', padding: '30px' }}>
                  Nenhuma senha encontrada na fila.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Digitar Código */}
      {showCodeModal && (
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
          <div className="glass-panel pop-in" style={{
            width: '100%',
            maxWidth: '430px',
            padding: '30px',
            background: 'linear-gradient(135deg, #07133F 0%, #020817 100%)',
            border: '1px solid rgba(93, 94, 252, 0.45)',
            boxShadow: '0 25px 65px rgba(2, 8, 23, 0.95), 0 0 35px rgba(46, 158, 253, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FDFCFD' }}>Digitar Código da Senha</h3>
              <button onClick={() => setShowCodeModal(false)} style={{ background: 'transparent', border: 'none', color: '#B5BCD7', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#B5BCD7', marginBottom: '22px' }}>
              Insira o código do paciente para chamada direta (ex: PE001, P002, N003).
            </p>

            <form onSubmit={handleCallByCode}>
              <input
                type="text"
                autoFocus
                placeholder="Ex: P001"
                value={codeInputValue}
                onChange={(e) => setCodeInputValue(e.target.value.toUpperCase())}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '14px',
                  background: 'rgba(2, 8, 23, 0.7)',
                  border: '1px solid rgba(46, 158, 253, 0.45)',
                  color: '#2E9EFD',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.9rem',
                  fontWeight: 900,
                  textAlign: 'center',
                  letterSpacing: '0.12em',
                  marginBottom: '24px',
                  boxShadow: '0 0 20px rgba(46, 158, 253, 0.2)'
                }}
              />

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCodeModal(false)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '12px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, padding: '12px' }}
                >
                  Buscar e Atender
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Encaminhar / Transferir Senha */}
      {showTransferModal && ticketAtual && (
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
          <div className="glass-panel pop-in" style={{
            width: '100%',
            maxWidth: '470px',
            padding: '30px',
            background: 'linear-gradient(135deg, #07133F 0%, #020817 100%)',
            border: '1px solid rgba(93, 94, 252, 0.45)',
            boxShadow: '0 25px 65px rgba(2, 8, 23, 0.95), 0 0 35px rgba(46, 158, 253, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FDFCFD' }}>Encaminhar Senha {ticketAtual.codigo}</h3>
              <button onClick={() => setShowTransferModal(false)} style={{ background: 'transparent', border: 'none', color: '#B5BCD7', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmTransfer}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#B5BCD7', marginBottom: '6px', fontWeight: 600 }}>
                  Transferir para a Especialidade:
                </label>
                <select
                  value={transferServiceId}
                  onChange={(e) => setTransferServiceId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: '#07133F',
                    border: '1px solid rgba(93, 94, 252, 0.35)',
                    color: '#FDFCFD',
                    fontSize: '0.95rem'
                  }}
                >
                  {services.filter(s => s.id !== ticketAtual.servicoId).map(s => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#B5BCD7', marginBottom: '6px', fontWeight: 600 }}>
                  Observação médica / encaminhamento:
                </label>
                <textarea
                  rows={3}
                  value={transferObs}
                  onChange={(e) => setTransferObs(e.target.value)}
                  placeholder="Ex: Encaminhado para parecer cardiológico com prioridade mantida"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'rgba(2, 8, 23, 0.7)',
                    border: '1px solid rgba(93, 94, 252, 0.35)',
                    color: '#FDFCFD',
                    fontSize: '0.9rem',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '12px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, padding: '12px' }}
                >
                  Confirmar Envio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Escolha de Guichê Operacional da Laura */}
      {showGuicheModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 8, 23, 0.88)',
          backdropFilter: 'blur(14px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-panel pop-in" style={{
            width: '100%',
            maxWidth: '520px',
            padding: '32px',
            background: 'linear-gradient(135deg, #07133F 0%, #020817 100%)',
            border: '2px solid rgba(46, 158, 253, 0.45)',
            borderRadius: '20px',
            boxShadow: '0 25px 65px rgba(2, 8, 23, 0.95), 0 0 35px rgba(46, 158, 253, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(46, 158, 253, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Monitor size={22} color="#2E9EFD" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FDFCFD' }}>
                    Posto de Atendimento
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#B5BCD7' }}>
                    Selecione onde você irá operar neste turno
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowGuicheModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#B5BCD7', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.86rem', color: '#B5BCD7', margin: '16px 0 20px', lineHeight: 1.45 }}>
              Olá <strong style={{ color: '#FDFCFD' }}>{currentDisplayName.split(' ')[0]}</strong>! O painel central e as TVs de chamada indicarão aos pacientes o guichê ativo que você escolher abaixo:
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
              gap: '12px',
              marginBottom: '26px'
            }}>
              {activeGuiches.map((itemGuiche) => {
                const isSelected = guiche === itemGuiche;
                return (
                  <div
                    key={itemGuiche}
                    onClick={() => handleGuicheChange(itemGuiche)}
                    style={{
                      background: isSelected 
                        ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.3) 0%, rgba(46, 158, 253, 0.25) 100%)' 
                        : 'rgba(255, 255, 255, 0.04)',
                      border: `2px solid ${isSelected ? '#2E9EFD' : 'rgba(93, 94, 252, 0.2)'}`,
                      borderRadius: '14px',
                      padding: '16px 12px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      boxShadow: isSelected ? '0 0 20px rgba(46, 158, 253, 0.35)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'rgba(46, 158, 253, 0.6)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'rgba(93, 94, 252, 0.2)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    <Monitor size={26} color={isSelected ? '#2E9EFD' : '#B5BCD7'} style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '0.94rem', fontWeight: 800, color: isSelected ? '#FDFCFD' : '#cbd5e1' }}>
                      {itemGuiche}
                    </div>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      marginTop: '6px',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: isSelected ? 'rgba(46, 158, 253, 0.3)' : 'rgba(52, 211, 153, 0.15)',
                      color: isSelected ? '#93c5fd' : '#34d399'
                    }}>
                      {isSelected ? 'Posto Atual' : 'Disponível'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowGuicheModal(false)}
                className="btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '0.9rem' }}
              >
                Confirmar e Iniciar Atendimento no {guiche}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
