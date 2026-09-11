// client/src/pages/PainelTV.jsx
import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Volume2, 
  VolumeX, 
  Clock, 
  Sparkles, 
  History,
  Megaphone
} from 'lucide-react';
import { socket, playChimeSound, speakTicket } from '../socket';
import scaFlowLogo from '../assets/logo/ScaFlow.svg';

export default function PainelTV() {
  const [currentCall, setCurrentCall] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('pt-BR'));
  const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  // Relógio em tempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('pt-BR'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Escuta chamadas da TV
  useEffect(() => {
    // Carrega dados iniciais do dashboard
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        if (data.lastCalled) setCurrentCall(data.lastCalled);
        if (data.recentHistory) setCallHistory(data.recentHistory);
      })
      .catch(console.error);

    const onTvCall = (ticket) => {
      setCurrentCall(ticket);
      setCallHistory(prev => [ticket, ...prev.filter(t => t.id !== ticket.id)].slice(0, 6));

      // Animação de flash pulsante
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 2800);

      // Toca chime sonoro e fala no alto-falante
      playChimeSound();
      setTimeout(() => {
        speakTicket(ticket);
      }, 700);
    };

    socket.on('tv:call', onTvCall);

    return () => {
      socket.off('tv:call', onTvCall);
    };
  }, []);

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
      {/* Banner de Ativação de Áudio se o navegador tiver bloqueado */}
      {!soundEnabled && (
        <div
          onClick={enableAudio}
          className="pop-in"
          style={{
            position: 'fixed',
            top: '20px',
            right: '28px',
            zIndex: 999,
            background: 'var(--gradient-symbol)',
            color: '#FDFCFD',
            padding: '11px 22px',
            borderRadius: '9999px',
            fontWeight: 800,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 6px 22px rgba(46, 158, 253, 0.5)'
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
            <div style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.01em', color: '#FDFCFD' }}>
              Painel de Convocação
            </div>
            <div style={{ fontSize: '0.86rem', color: '#B5BCD7' }}>
              Sala de Espera · Atendimento Médico Especializado
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
          <span style={{ color: '#2E9EFD', fontWeight: 600 }}>ScaFlow · Conectado em Tempo Real</span>
        </div>
      </footer>
    </div>
  );
}
