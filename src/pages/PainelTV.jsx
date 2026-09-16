// client/src/pages/PainelTV.jsx
import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Volume2, 
  VolumeX, 
  Clock, 
  Sparkles, 
  History,
  Megaphone,
  Building2
} from 'lucide-react';
import { socket, playChimeSound, speakTicket } from '../socket';
import scaFlowLogo from '../assets/logo/ScaFlow.svg';
import { saasService, isSupabaseConfigured, supabase } from '../supabase';

export default function PainelTV({ tenantId: propTenantId }) {
  const isUuid = (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const tenantId = (propTenantId && isUuid(propTenantId)) ? propTenantId : 'f65ac0ed-e001-4da3-87de-8359cdc38762';
  const [tenantInfo, setTenantInfo] = useState({
    name: 'Hospital Odete Valadares',
    unit: 'Unidade Principal'
  });
  const [currentCall, setCurrentCall] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('pt-BR'));
  const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  // Carrega informações da clínica/hospital do Supabase
  useEffect(() => {
    async function loadTenantHeader() {
      if (isSupabaseConfigured && supabase && tenantId) {
        try {
          const { data: t } = await supabase.from('tenants').select('name').eq('id', tenantId).maybeSingle();
          const { data: u } = await supabase.from('units').select('name').eq('tenant_id', tenantId).limit(1).maybeSingle();
          if (t?.name) {
            setTenantInfo({
              name: t.name,
              unit: u?.name || 'Unidade Principal'
            });
            document.title = `Painel TV · ${t.name}`;
          }
        } catch (e) {}
      }
    }
    loadTenantHeader();
  }, [tenantId]);

  // Relógio em tempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('pt-BR'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Escuta chamadas da TV (via SaaS, BroadcastChannel, Storage e Realtime)
  useEffect(() => {
    let isMounted = true;
    let lastHandledKey = null;
    let isInitialLoad = true;

    const handleNewCall = (ticket, playAudio = true) => {
      if (!ticket || !ticket.codigo) return;
      const key = `${ticket.id || ticket.codigo}_${ticket.calledAt || ticket.called_at || ticket._broadcast_ts || ''}`;
      if (lastHandledKey === key) return;
      lastHandledKey = key;

      setCurrentCall(ticket);
      setCallHistory(prev => [ticket, ...prev.filter(t => (t.id && ticket.id) ? t.id !== ticket.id : t.codigo !== ticket.codigo)].slice(0, 6));

      if (playAudio) {
        // Animação de flash pulsante
        setIsFlashing(true);
        setTimeout(() => {
          if (isMounted) setIsFlashing(false);
        }, 2800);

        // Toca chime sonoro e fala no alto-falante
        playChimeSound();
        setTimeout(() => {
          speakTicket(ticket);
        }, 700);
      }
    };

    // 1. Carrega dados do Supabase
    const loadSaaSData = async () => {
      try {
        const tkts = await saasService.fetchTickets(tenantId);
        if (isMounted && tkts) {
          const calledList = tkts.filter(t => t.status === 'CALLED' || t.status === 'FINISHED');
          if (calledList.length > 0) {
            const latest = calledList[0];
            const key = `${latest.id || latest.codigo}_${latest.called_at || latest.calledAt || ''}`;
            
            if (isInitialLoad) {
              isInitialLoad = false;
              lastHandledKey = key;
              setCurrentCall(latest);
              setCallHistory(calledList.slice(1, 7));
            } else if (lastHandledKey !== key) {
              // Nova chamada legítima detectada pelo banco
              handleNewCall(latest, true);
              setCallHistory(calledList.slice(1, 7));
            }
          }
        }
      } catch (err) {
        console.error('[PainelTV] Erro ao carregar tickets:', err);
      }
    };

    loadSaaSData();

    // 2. BroadcastChannel nativo (apenas chamadas de TV dedicadas)
    let bc = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('scaflow_tv_channel');
        bc.onmessage = (event) => {
          const data = event.data;
          if (!data || !isMounted) return;
          // Ignora mensagens que não sejam de chamada de TV
          if (data.type && data.type !== 'TV_CALL') return;
          const ticket = data.ticket || data;
          if (ticket && ticket.codigo) {
            handleNewCall(ticket, true);
          }
        };
      } catch (e) {}
    }

    // 3. Escuta evento Storage do navegador (quando outra aba salva no localStorage)
    const handleStorage = (e) => {
      if (e.key === 'scaflow_last_called_ticket' && e.newValue) {
        try {
          const t = JSON.parse(e.newValue);
          if (t && isMounted && t.codigo) {
            handleNewCall(t, true);
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // 4. Escuta evento na própria janela
    const handleCustomCall = (e) => {
      if (e.detail && isMounted && e.detail.codigo) {
        handleNewCall(e.detail, true);
      }
    };
    window.addEventListener('scaflow_tv_call', handleCustomCall);

    // 5. Subscrição Supabase Realtime
    const unsub = saasService.subscribeToChanges(tenantId, () => {
      if (isMounted) {
        loadSaaSData();
      }
    });

    // 6. Polling preventivo a cada 3 segundos (garante atualização constante mesmo entre dispositivos distintos)
    const pollInterval = setInterval(() => {
      if (isMounted) {
        loadSaaSData();
      }
    }, 3000);

    // 7. Fallback Socket Node.js
    const onTvCall = (ticket) => {
      if (ticket && ticket.codigo) {
        handleNewCall(ticket, true);
      }
    };
    socket.on('tv:call', onTvCall);

    return () => {
      isMounted = false;
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('scaflow_tv_call', handleCustomCall);
      clearInterval(pollInterval);
      unsub();
      socket.off('tv:call', onTvCall);
    };
  }, [tenantId]);

  const enableAudio = () => {
    setSoundEnabled(true);
    playChimeSound();
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'radial-gradient(circle at 50% 45%, #1324A0 0%, #07133F 45%, #020817 100%)',
      color: '#FDFCFD',
      padding: '28px 36px',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Banner de Ativação de Áudio centralizado no topo (não cobre a hora nem a logo) */}
      {!soundEnabled && (
        <div
          onClick={enableAudio}
          className="pop-in"
          style={{
            position: 'fixed',
            top: '18px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999,
            background: 'var(--gradient-symbol)',
            color: '#FDFCFD',
            padding: '10px 22px',
            borderRadius: '9999px',
            fontWeight: 800,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 6px 22px rgba(46, 158, 253, 0.5)',
            whiteSpace: 'nowrap'
          }}
        >
          <Volume2 size={18} />
          <span>Ativar Sistema de Áudio & Locução</span>
        </div>
      )}

      {/* Topo do Painel TV com Logo ScaFlow */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '22px',
        borderBottom: '1px solid rgba(93, 94, 252, 0.25)',
        marginBottom: '28px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <img 
            src={scaFlowLogo} 
            alt="ScaFlow" 
            style={{ 
              height: '100px', 
              width: 'auto',
              filter: 'drop-shadow(0 0 16px rgba(46, 158, 253, 0.5))'
            }} 
          />
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.4rem', letterSpacing: '-0.01em', color: '#FDFCFD' }}>
              Painel de Convocação
            </div>
            <div style={{ fontSize: '0.92rem', color: '#2E9EFD', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
              <Building2 size={15} />
              <span>{tenantInfo.name} · {tenantInfo.unit}</span>
            </div>
          </div>
        </div>

        {/* Data e Hora Gigante */}
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '2.5rem',
            fontWeight: 900,
            color: '#FDFCFD',
            lineHeight: 1
          }}>
            {currentTime}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#B5BCD7', textTransform: 'capitalize', marginTop: '4px' }}>
            {currentDate}
          </div>
        </div>
      </header>

      {/* Grade Principal da TV: Chamada Atual Gigante + Histórico Lateral */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '32px',
        alignItems: 'stretch'
      }}>
        
        {/* Painel Central: Senha Chamada Atual */}
        <div className={`glass-panel ${isFlashing ? 'pop-in' : ''}`} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 36px',
          background: isFlashing 
            ? 'linear-gradient(135deg, rgba(46, 158, 253, 0.3) 0%, rgba(7, 19, 63, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(7, 19, 63, 0.8) 0%, rgba(2, 8, 23, 0.95) 100%)',
          border: isFlashing ? '3px solid #2E9EFD' : '1px solid rgba(93, 94, 252, 0.35)',
          boxShadow: isFlashing 
            ? '0 0 70px rgba(46, 158, 253, 0.6), inset 0 0 35px rgba(93, 94, 252, 0.3)' 
            : '0 20px 50px rgba(2, 8, 23, 0.8), 0 0 30px rgba(46, 158, 253, 0.15)',
          borderRadius: '32px',
          textAlign: 'center',
          transition: 'all 0.35s ease'
        }}>
          {currentCall ? (
            <>
              {/* Badge da Modalidade */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 24px',
                borderRadius: '9999px',
                background: `${currentCall.prioridadeCor || '#2E9EFD'}22`,
                border: `2px solid ${currentCall.prioridadeCor || '#2E9EFD'}`,
                color: currentCall.prioridadeCor || '#2E9EFD',
                fontWeight: 800,
                fontSize: '1.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '16px'
              }}>
                <Megaphone size={22} />
                <span>{currentCall.prioridadeNome}</span>
              </div>

              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#B5BCD7', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                SENHA DE ATENDIMENTO
              </div>

              {/* Número da Senha em Tamanho Monumental */}
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'clamp(5.5rem, 14vw, 10.5rem)',
                fontWeight: 900,
                color: currentCall.prioridadeCor || '#2E9EFD',
                lineHeight: 1,
                letterSpacing: '-0.02em',
                textShadow: `0 0 50px ${currentCall.prioridadeCor || '#2E9EFD'}77`,
                margin: '10px 0'
              }}>
                {currentCall.codigo}
              </div>

              {/* Destino: Guichê / Consultório */}
              <div style={{
                background: 'rgba(7, 19, 63, 0.85)',
                border: '1px solid rgba(93, 94, 252, 0.4)',
                padding: '16px 44px',
                borderRadius: '24px',
                marginTop: '12px',
                boxShadow: '0 8px 24px rgba(2, 8, 23, 0.6)'
              }}>
                <div style={{ fontSize: '0.95rem', color: '#B5BCD7', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
                  DIRIJA-SE AO
                </div>
                <div style={{
                  fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
                  fontWeight: 900,
                  color: '#FDFCFD',
                  letterSpacing: '-0.02em',
                  textShadow: '0 0 25px rgba(46, 158, 253, 0.5)'
                }}>
                  {currentCall.guiche || 'GUICHÊ 01'}
                </div>
              </div>

              {/* Especialidade e Atendente */}
              <div style={{ marginTop: '24px', fontSize: '1.25rem', color: '#FDFCFD' }}>
                <span>Especialidade: <strong style={{ color: '#2E9EFD' }}>{currentCall.servicoNome}</strong></span>
                {currentCall.atendenteNome && (
                  <span style={{ color: '#B5BCD7', marginLeft: '12px' }}>· Operador(a): {currentCall.atendenteNome}</span>
                )}
              </div>
            </>
          ) : (
            <div style={{ color: '#7e8bb6', fontSize: '1.4rem' }}>
              Aguardando primeira chamada de atendimento...
            </div>
          )}
        </div>

        {/* Coluna Lateral: Histórico de Últimas Chamadas */}
        <div className="glass-panel" style={{
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.8) 0%, rgba(2, 8, 23, 0.95) 100%)',
          border: '1px solid rgba(93, 94, 252, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid rgba(93, 94, 252, 0.2)' }}>
            <History size={22} color="#5D5EFC" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FDFCFD', letterSpacing: '-0.01em' }}>
              Últimas Chamadas
            </h3>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
            {callHistory.length > 1 ? (
              callHistory.slice(1, 6).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '16px 20px',
                    borderRadius: '16px',
                    background: 'rgba(19, 36, 160, 0.18)',
                    border: '1px solid rgba(93, 94, 252, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1.85rem',
                      fontWeight: 900,
                      color: item.prioridadeCor || '#2E9EFD'
                    }}>
                      {item.codigo}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#B5BCD7', marginTop: '2px' }}>
                      {item.servicoNome}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FDFCFD' }}>
                      {item.guiche || 'Guichê 01'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#7e8bb6', fontFamily: 'var(--font-mono)' }}>
                      {item.calledAt ? new Date(item.calledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#7e8bb6', padding: '40px 10px', fontSize: '0.92rem' }}>
                As chamadas anteriores aparecerão aqui.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Rodapé da TV */}
      <footer style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '24px',
        paddingTop: '16px',
        borderTop: '1px solid rgba(93, 94, 252, 0.2)',
        fontSize: '0.85rem',
        color: '#B5BCD7'
      }}>
        <div>Por favor, dirija-se ao guichê indicado assim que sua senha for anunciada no alto-falante.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="pulse-dot"></span>
          <span style={{ color: '#2E9EFD', fontWeight: 700 }}>
            Conectado em Tempo Real · {tenantInfo.name} ({tenantInfo.unit})
          </span>
        </div>
      </footer>
    </div>
  );
}
