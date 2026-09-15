// client/src/pages/Totem.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronRight, 
  RotateCcw, 
  Check, 
  Sparkles,
  ArrowRight,
  Heart,
  Activity,
  Eye,
  Stethoscope,
  Pill,
  Baby,
  ShieldCheck,
  UserCheck,
  Apple,
  Smile,
  FlaskConical,
  Printer,
  CheckCircle2,
  Building2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { socket, playChimeSound } from '../socket';
import scaFlowLogo from '../assets/logo/ScaFlow.svg';
import { printThermalTicket, DEFAULT_PRINTER_CONFIG } from '../utils/thermalPrinter';
import { saasService, isSupabaseConfigured, supabase } from '../supabase';

// Dicionário de Ícones Dinâmicos
const ICON_MAP = {
  Stethoscope,
  Heart,
  Baby,
  Activity,
  ShieldCheck,
  Sparkles,
  Eye,
  UserCheck,
  Pill,
  Apple,
  Smile,
  FlaskConical
};

function getServiceIcon(iconName) {
  if (iconName && ICON_MAP[iconName]) return ICON_MAP[iconName];
  return Stethoscope;
}

export default function Totem({ tenantId: propTenantId }) {
  const isUuid = (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const tenantId = (propTenantId && isUuid(propTenantId)) ? propTenantId : 'f65ac0ed-e001-4da3-87de-8359cdc38762';

  const [tenantInfo, setTenantInfo] = useState({
    name: 'Hospital Odete Valadares',
    unit: 'Unidade Principal'
  });

  const [services, setServices] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [generatedTicket, setGeneratedTicket] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalTimer, setModalTimer] = useState(15);
  const [ticketCountdown, setTicketCountdown] = useState(5);
  
  // Configuração da Impressora Térmica (Epson M352A)
  const [printerConfig, setPrinterConfig] = useState(() => {
    return saasService.getPrinterConfig(tenantId) || DEFAULT_PRINTER_CONFIG;
  });
  const [printStatus, setPrintStatus] = useState(null);

  const modalIntervalRef = useRef(null);

  // Carrega serviços, prioridades e configuração de impressão do Supabase
  useEffect(() => {
    let isMounted = true;
    const loadTenantData = async () => {
      try {
        setLoadingData(true);
        const [srvs, prios, pConfig] = await Promise.all([
          saasService.fetchServices(tenantId),
          saasService.fetchPriorities(tenantId),
          saasService.fetchPrinterConfig(tenantId)
        ]);

        if (isSupabaseConfigured && supabase && tenantId) {
          try {
            const { data: t } = await supabase.from('tenants').select('name').eq('id', tenantId).maybeSingle();
            const { data: u } = await supabase.from('units').select('name').eq('tenant_id', tenantId).limit(1).maybeSingle();
            if (t?.name && isMounted) {
              setTenantInfo({
                name: t.name,
                unit: u?.name || 'Unidade Principal'
              });
              document.title = `Totem Autoatendimento · ${t.name}`;
            }
          } catch (e) {}
        }

        if (isMounted) {
          setServices(srvs || []);
          setPriorities(prios || []);
          if (pConfig) setPrinterConfig(prev => ({ ...prev, ...pConfig }));
        }
      } catch (err) {
        console.error('[Totem] Erro ao carregar dados do tenant:', err);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };

    loadTenantData();

    // Escuta atualizações do banco/realtime
    const unsubscribe = saasService.subscribeToChanges(tenantId, () => {
      loadTenantData();
    });

    const handlePrinterChange = (e) => {
      if (e.detail?.config && isMounted) {
        setPrinterConfig(prev => ({ ...prev, ...e.detail.config }));
      }
    };
    window.addEventListener('scaflow_printer_changed', handlePrinterChange);

    return () => {
      isMounted = false;
      unsubscribe();
      window.removeEventListener('scaflow_printer_changed', handlePrinterChange);
    };
  }, [tenantId]);

  // Sincroniza configurações da impressora com o servidor
  useEffect(() => {
    if (socket.connected) {
      socket.emit('printer:config:get', {}, (res) => {
        if (res && res.success && res.config) {
          setPrinterConfig(prev => ({ ...prev, ...res.config }));
          localStorage.setItem('sca_printer_config', JSON.stringify(res.config));
        }
      });
    }

    const handleConfigUpdated = (cfg) => {
      if (cfg) {
        setPrinterConfig(prev => ({ ...prev, ...cfg }));
        localStorage.setItem('sca_printer_config', JSON.stringify(cfg));
      }
    };

    socket.on('printer:config:updated', handleConfigUpdated);
    return () => {
      socket.off('printer:config:updated', handleConfigUpdated);
    };
  }, []);

  // Timer decrescente de 15s no modal de classificação
  useEffect(() => {
    if (selectedSpecialty && !generatedTicket) {
      setModalTimer(15);
      if (modalIntervalRef.current) clearInterval(modalIntervalRef.current);

      modalIntervalRef.current = setInterval(() => {
        setModalTimer(prev => {
          if (prev <= 1) {
            handleCloseModal();
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (modalIntervalRef.current) clearInterval(modalIntervalRef.current);
    }

    return () => {
      if (modalIntervalRef.current) clearInterval(modalIntervalRef.current);
    };
  }, [selectedSpecialty, generatedTicket]);

  // Contagem regressiva no comprovante (5s)
  useEffect(() => {
    let timer = null;
    if (generatedTicket) {
      setTicketCountdown(5);
      timer = setInterval(() => {
        setTicketCountdown(prev => {
          if (prev <= 1) {
            handleResetTotem();
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [generatedTicket]);

  const handleSelectSpecialty = (srv) => {
    setSelectedSpecialty(srv);
  };

  const handleCloseModal = () => {
    setSelectedSpecialty(null);
    setModalTimer(15);
  };

  const handleResetTotem = () => {
    setSelectedSpecialty(null);
    setGeneratedTicket(null);
    setIsProcessing(false);
    setPrintStatus(null);
  };

  // Emite a senha de acordo com a modalidade selecionada
  const handleChooseClassification = async (prioridadeId) => {
    if (isProcessing || !selectedSpecialty) return;
    setIsProcessing(true);

    try {
      const ticket = await saasService.createTicket(tenantId, {
        serviceId: selectedSpecialty.id,
        priorityId: prioridadeId
      });

      setIsProcessing(false);

      if (ticket) {
        setGeneratedTicket(ticket);
        playChimeSound();

        // Se o socket local estiver ativo, avisa também para sincronização de tela e spool nativo
        if (socket.connected) {
          socket.emit('ticket:create', {
            servicoId: selectedSpecialty.id,
            prioridadeId: prioridadeId,
            ticket: ticket
          });
        }

        // Disparo ultrarrápido imediato para a impressora térmica (Epson M352A)
        if (printerConfig.enabled) {
          setPrintStatus({ printing: true });
          if (printerConfig.printMethod === 'native') {
            setTimeout(() => {
              setPrintStatus({ printing: false, success: true });
            }, 600);
          } else {
            // Método Navegador (Kiosk Printing via iframe)
            printThermalTicket(ticket, printerConfig)
              .then(printRes => {
                setPrintStatus({ printing: false, success: printRes.printed });
              })
              .catch(err => {
                console.error('[Totem] Falha na impressão térmica:', err);
                setPrintStatus({ printing: false, success: false });
              });
          }
        }

        try {
          confetti({
            particleCount: 75,
            spread: 65,
            origin: { y: 0.65 }
          });
        } catch (e) {}
      } else {
        alert('Falha na emissão da senha. Por favor, tente novamente.');
      }
    } catch (err) {
      setIsProcessing(false);
      console.error('[Totem] Erro na emissão:', err);
      alert('Falha na emissão da senha: ' + (err.message || 'Tente novamente.'));
    }
  };

  // Prioridades a exibir no modal (usa as cadastradas no tenant ou default)
  const displayPriorities = priorities.length > 0 ? priorities : [
    { id: 'prio-especial', name: 'Atendimento Especial (80+)', code: 'PE', description: 'Pacientes com 80 anos ou mais e emergências médicas', color: '#ef4444' },
    { id: 'prio-preferencial', name: 'Atendimento Prioritário', code: 'P', description: 'Idosos (60+), PCD, Gestantes, Lactantes e TEA (Lei 10.048)', color: '#f59e0b' },
    { id: 'prio-normal', name: 'Atendimento Convencional', code: 'N', description: 'Atendimento ambulatorial por ordem cronológica', color: '#2E9EFD' }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '28px 16px',
      position: 'relative',
      userSelect: 'none'
    }}>
      
      {/* TELA DE SELEÇÃO: ESPECIALIDADES MÉDICAS EM GRID RESPONSIVO */}
      {!generatedTicket && (
        <div style={{
          width: '100%',
          maxWidth: '1200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '12px 16px'
        }} className="fade-in">
          
          <div style={{ textAlign: 'center', marginBottom: '24px', maxWidth: '640px' }}>
            <img 
              src={scaFlowLogo} 
              alt="ScaFlow" 
              style={{ 
                height: '95px', 
                width: 'auto',
                filter: 'drop-shadow(0 0 24px rgba(46, 158, 253, 0.45))',
                marginBottom: '12px'
              }} 
            />

            {/* Identificação de Hospital e Unidade Conectada */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(46, 158, 253, 0.12)',
              border: '1px solid rgba(46, 158, 253, 0.35)',
              padding: '6px 16px',
              borderRadius: '9999px',
              marginBottom: '14px',
              boxShadow: '0 0 16px rgba(46, 158, 253, 0.15)'
            }}>
              <Building2 size={15} color="#2E9EFD" />
              <span style={{ color: '#2E9EFD', fontSize: '0.86rem', fontWeight: 800, letterSpacing: '0.01em' }}>
                {tenantInfo.name} · {tenantInfo.unit}
              </span>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 8px #10B981' }} />
              <span style={{ color: '#10B981', fontSize: '0.74rem', fontWeight: 800 }}>Totem Conectado</span>
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#FDFCFD', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Selecione a Especialidade
            </h1>
            <p style={{ color: '#B5BCD7', fontSize: '0.98rem', marginTop: '6px' }}>
              Toque na área médica desejada para emitir seu comprovante de atendimento
            </p>
          </div>

          {/* Grid Responsivo de Especialidades */}
          {loadingData ? (
            <div style={{ padding: '40px', color: '#2E9EFD', fontSize: '1rem', fontWeight: 700 }}>
              Carregando especialidades disponíveis...
            </div>
          ) : services.length === 0 ? (
            <div style={{ padding: '40px', color: '#B5BCD7', textAlign: 'center' }}>
              Nenhuma especialidade ativa cadastrada para este terminal.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '16px',
              width: '100%',
              maxHeight: 'calc(100vh - 220px)',
              overflowY: 'auto',
              padding: '4px 6px 36px 4px'
            }}>
              {services.map((srv) => {
                const IconComp = getServiceIcon(srv.icon);
                const srvName = srv.name || srv.nome;
                const srvCode = srv.code || srv.sigla;
                const srvDesc = srv.description || srv.descricao || 'Atendimento especializado';
                return (
                  <button
                    key={srv.id}
                    onClick={() => handleSelectSpecialty(srv)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      minHeight: '128px',
                      padding: '20px',
                      borderRadius: '18px',
                      background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.92) 0%, rgba(2, 8, 23, 0.98) 100%)',
                      border: '1px solid rgba(46, 158, 253, 0.28)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      boxShadow: '0 8px 24px rgba(2, 8, 23, 0.65)',
                      transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(19, 36, 160, 0.65) 0%, #07133F 100%)';
                      e.currentTarget.style.borderColor = '#2E9EFD';
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 12px 30px rgba(46, 158, 253, 0.45)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(7, 19, 63, 0.92) 0%, rgba(2, 8, 23, 0.98) 100%)';
                      e.currentTarget.style.borderColor = 'rgba(46, 158, 253, 0.28)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(2, 8, 23, 0.65)';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: 'rgba(46, 158, 253, 0.15)',
                        border: '1px solid rgba(46, 158, 253, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#2E9EFD'
                      }}>
                        <IconComp size={22} />
                      </div>

                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        color: '#5D5EFC',
                        letterSpacing: '0.08em',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(93, 94, 252, 0.14)'
                      }}>
                        {srvCode}
                      </span>
                    </div>

                    <div>
                      <div style={{
                        color: '#FDFCFD',
                        fontSize: '1.05rem',
                        fontWeight: 800,
                        letterSpacing: '-0.01em',
                        lineHeight: 1.25,
                        marginBottom: '4px'
                      }}>
                        {srvName}
                      </div>
                      <div style={{
                        fontSize: '0.78rem',
                        color: '#B5BCD7',
                        fontWeight: 500
                      }}>
                        {srvDesc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Rodapé informativo de conexão do Totem */}
          <div style={{
            position: 'fixed',
            bottom: '14px',
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: '0.78rem',
            color: '#64748B',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
            <span>ScaFlow Totem · {tenantInfo.name} ({tenantInfo.unit}) · Conectado em Tempo Real</span>
          </div>
        </div>
      )}

      {/* MODAL: CLASSIFICAÇÃO DE ATENDIMENTO (Identidade ScaFlow refinada) */}
      {selectedSpecialty && !generatedTicket && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 8, 23, 0.85)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="pop-in" style={{
            width: '100%',
            maxWidth: '480px',
            borderRadius: '26px',
            background: 'linear-gradient(135deg, #07133F 0%, #020817 100%)',
            border: '1px solid rgba(93, 94, 252, 0.45)',
            boxShadow: '0 25px 65px rgba(2, 8, 23, 0.95), 0 0 35px rgba(46, 158, 253, 0.3)',
            overflow: 'hidden',
            position: 'relative'
          }}>
            
            {/* Cabeçalho do Modal */}
            <div style={{ padding: '32px 30px 22px 30px' }}>
              <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#FDFCFD', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Modalidade de Acolhimento
              </h2>
              <div style={{
                color: '#2E9EFD',
                fontWeight: 800,
                fontSize: '0.98rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginTop: '6px'
              }}>
                {selectedSpecialty.name || selectedSpecialty.nome}
              </div>
            </div>

            {/* Opções Dinâmicas de Prioridade */}
            <div style={{ padding: '0 30px 26px 30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {displayPriorities.map((prio) => {
                const prioColor = prio.color || '#2E9EFD';
                return (
                  <button
                    key={prio.id}
                    onClick={() => handleChooseClassification(prio.id)}
                    disabled={isProcessing}
                    style={{
                      width: '100%',
                      padding: '20px 22px',
                      borderRadius: '16px',
                      background: 'rgba(19, 36, 160, 0.28)',
                      border: '1px solid rgba(93, 94, 252, 0.3)',
                      borderLeft: `6px solid ${prioColor}`,
                      color: '#FDFCFD',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(19, 36, 160, 0.55)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                      e.currentTarget.style.borderColor = prioColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(19, 36, 160, 0.28)';
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.borderColor = 'rgba(93, 94, 252, 0.3)';
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
                        {prio.name || prio.nome}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#B5BCD7', marginTop: '3px' }}>
                        {prio.description || prio.descricao || 'Atendimento ambulatorial'}
                      </div>
                    </div>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FDFCFD'
                    }}>
                      <ChevronRight size={22} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Rodapé: Botão de Retorno com Timer Decrescente */}
            <div style={{ padding: '0 30px 24px 30px', textAlign: 'center' }}>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#2E9EFD',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  padding: '8px 16px',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#FDFCFD'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#2E9EFD'}
              >
                Retornar ao Início ({modalTimer}s)
              </button>
            </div>

            {/* Barra de Progresso Decrescente (Gradiente ScaFlow) */}
            <div style={{
              width: '100%',
              height: '5px',
              background: 'rgba(255, 255, 255, 0.08)',
              position: 'relative'
            }}>
              <div style={{
                height: '100%',
                width: `${(modalTimer / 15) * 100}%`,
                background: 'var(--gradient-symbol)',
                transition: 'width 1s linear'
              }} />
            </div>

          </div>
        </div>
      )}

      {/* COMPROVANTE DE SENHA IMPRESSA */}
      {generatedTicket && (
        <div className="pop-in" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '430px',
          marginTop: '36px'
        }}>
          <div style={{
            width: '100%',
            background: '#ffffff',
            color: '#07133F',
            borderRadius: '24px',
            padding: '36px 28px',
            boxShadow: '0 20px 60px rgba(2, 8, 23, 0.8), 0 0 40px rgba(46, 158, 253, 0.35)',
            textAlign: 'center',
            border: '2px dashed #B5BCD7',
            position: 'relative'
          }}>
            <img 
              src={scaFlowLogo} 
              alt="ScaFlow" 
              style={{ 
                height: '100px', 
                width: 'auto',
                marginBottom: '14px'
              }} 
            />

            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#7e8bb6', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              SENHA DE ATENDIMENTO
            </div>

            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '4.8rem',
              fontWeight: 900,
              color: generatedTicket.prioridadeCor || generatedTicket.priority_color || '#07133F',
              lineHeight: 1.1,
              margin: '8px 0'
            }}>
              {generatedTicket.codigo || generatedTicket.code}
            </div>

            <div style={{
              display: 'inline-block',
              padding: '4px 16px',
              borderRadius: '9999px',
              background: `${generatedTicket.prioridadeCor || generatedTicket.priority_color || '#2E9EFD'}22`,
              color: generatedTicket.prioridadeCor || generatedTicket.priority_color || '#2E9EFD',
              fontWeight: 800,
              fontSize: '0.9rem',
              marginBottom: '16px'
            }}>
              {generatedTicket.prioridadeNome || generatedTicket.priority_name}
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '16px 0', margin: '12px 0', textAlign: 'left', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Especialidade:</span>
                <strong style={{ color: '#07133F' }}>{generatedTicket.servicoNome || generatedTicket.service_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Data / Hora:</span>
                <strong style={{ color: '#07133F' }}>
                  {new Date(generatedTicket.createdAt || generatedTicket.created_at).toLocaleDateString('pt-BR')} · {new Date(generatedTicket.createdAt || generatedTicket.created_at).toLocaleTimeString('pt-BR')}
                </strong>
              </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '12px' }}>
              Aguarde na sala de espera. Seu código será chamado no painel.
            </p>

            {/* STATUS DA IMPRESSÃO TÉRMICA */}
            {printerConfig.enabled && (
              <div style={{
                marginTop: '16px',
                padding: '10px 14px',
                borderRadius: '12px',
                background: printStatus?.printing 
                  ? 'rgba(46, 158, 253, 0.12)' 
                  : printStatus?.success 
                    ? 'rgba(16, 185, 129, 0.12)' 
                    : 'rgba(241, 245, 249, 0.8)',
                border: `1px solid ${
                  printStatus?.printing 
                    ? 'rgba(46, 158, 253, 0.3)' 
                    : printStatus?.success 
                      ? 'rgba(16, 185, 129, 0.3)' 
                      : '#e2e8f0'
                }`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '0.84rem',
                fontWeight: 700,
                color: printStatus?.printing ? '#0284c7' : printStatus?.success ? '#059669' : '#475569'
              }}>
                <Printer size={16} />
                <span>
                  {printStatus?.printing 
                    ? 'Imprimindo comprovante térmico...' 
                    : printStatus?.success 
                      ? 'Comprovante impresso com sucesso! Retire abaixo.' 
                      : 'Comprovante enviado para a impressora.'}
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => {
                setPrintStatus({ printing: true });
                printThermalTicket(generatedTicket, printerConfig)
                  .then(res => setPrintStatus({ printing: false, success: res.printed }))
                  .catch(() => setPrintStatus({ printing: false, success: false }));
              }}
              className="btn-secondary"
              style={{
                padding: '16px 28px',
                borderRadius: '16px',
                fontSize: '0.96rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              title="Reimprimir uma nova via do comprovante"
            >
              <Printer size={18} />
              <span>Reimprimir Comprovante</span>
            </button>

            <button
              onClick={handleResetTotem}
              className="btn-primary"
              style={{
                padding: '16px 36px',
                borderRadius: '16px',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              <span>Concluir ({ticketCountdown}s)</span>
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
