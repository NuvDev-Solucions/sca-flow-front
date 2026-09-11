// client/src/pages/Login.jsx
import React from 'react';
import { 
  ShieldCheck, 
  Headphones, 
  Ticket, 
  Tv, 
  ArrowRight, 
  BarChart3,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import scaFlowLogo from '../assets/logo/ScaFlow.svg';

export default function Login({ onSelectUser }) {
  const profiles = [
    {
      id: 'admin',
      title: 'Gestão Estratégica',
      badge: 'Visão Operacional',
      badgeColor: '#2E9EFD',
      description: 'Acompanhamento em tempo real de indicadores, fluxo de atendimento, tempo de espera e produtividade.',
      icon: <BarChart3 size={32} color="#2E9EFD" />,
      borderColor: 'rgba(46, 158, 253, 0.45)',
      btnLabel: 'Acessar Gestão',
      features: ['Indicadores ao Vivo', 'Tempos Médios (TME/TMA)', 'Monitoramento de Posições']
    },
    {
      id: 'laura',
      title: 'Estação de Atendimento',
      badge: 'Guichê Laura',
      badgeColor: '#5D5EFC',
      description: 'Chamada sequencial ou direta de senhas, modo automático inteligente, cronômetro e pausas programadas.',
      icon: <Headphones size={32} color="#5D5EFC" />,
      borderColor: 'rgba(93, 94, 252, 0.45)',
      btnLabel: 'Iniciar Atendimento',
      features: ['Chamada Automática', 'Pausas com Registro', 'Transferência Rápida']
    },
    {
      id: 'senha',
      title: 'Terminal de Autoatendimento',
      badge: 'Totem de Emissão',
      badgeColor: '#7F48FC',
      description: 'Interface tátil para clientes emitirem senhas por especialidade com classificação de prioridade.',
      icon: <Ticket size={32} color="#7F48FC" />,
      borderColor: 'rgba(127, 72, 252, 0.45)',
      btnLabel: 'Abrir Totem Touch',
      features: ['Seleção Direta', 'Classificação Legal', 'Comprovante Instantâneo']
    },
    {
      id: 'painel',
      title: 'Painel de Sinalização',
      badge: 'Monitor de TV',
      badgeColor: '#286DFC',
      description: 'Exibição em tela cheia para área de espera com sonorização de alerta e anúncio por voz sintetizada.',
      icon: <Tv size={32} color="#286DFC" />,
      borderColor: 'rgba(40, 109, 252, 0.45)',
      btnLabel: 'Abrir Tela de Chamadas',
      features: ['Áudio Harmonioso', 'Locução em Português', 'Histórico Recente']
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative'
    }}>
      {/* Header Central com Logo Oficial */}
      <div style={{ textAlign: 'center', maxWidth: '720px', marginBottom: '44px' }} className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
          <img 
            src={scaFlowLogo} 
            alt="ScaFlow" 
            style={{ 
              height: '200px', 
              width: 'auto',
              filter: 'drop-shadow(0 0 25px rgba(46, 158, 253, 0.5))'
            }} 
          />
        </div>

        <p style={{ fontSize: '1.08rem', color: '#B5BCD7', lineHeight: 1.6, marginTop: '8px' }}>
          Sistema Integrado de Fluxo, Triagem e Atendimento em Tempo Real
        </p>
      </div>

      {/* Grid de Estações de Trabalho */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        width: '100%',
        maxWidth: '1240px'
      }}>
        {profiles.map((p, idx) => (
          <div
            key={p.id}
            onClick={() => onSelectUser(p.id)}
            className="glass-panel glass-panel-glow"
            style={{
              cursor: 'pointer',
              padding: '32px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.85) 0%, rgba(2, 8, 23, 0.95) 100%)',
              border: `1px solid ${p.borderColor}`,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{
                  width: '58px',
                  height: '58px',
                  borderRadius: '16px',
                  background: 'rgba(7, 19, 63, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${p.borderColor}`,
                  boxShadow: `0 8px 20px -4px ${p.borderColor}`
                }}>
                  {p.icon}
                </div>

                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  background: 'rgba(2, 8, 23, 0.6)',
                  color: p.badgeColor,
                  border: `1px solid ${p.borderColor}`
                }}>
                  {p.badge}
                </span>
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '8px', color: '#FDFCFD' }}>
                {p.title}
              </h2>

              <p style={{ fontSize: '0.9rem', color: '#B5BCD7', lineHeight: 1.5, marginBottom: '22px' }}>
                {p.description}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                {p.features.map((feat, fIdx) => (
                  <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#FDFCFD' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.badgeColor }} />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              style={{
                width: '100%',
                padding: '13px 18px',
                borderRadius: '12px',
                background: 'rgba(19, 36, 160, 0.35)',
                border: `1px solid ${p.borderColor}`,
                color: '#FDFCFD',
                fontWeight: 700,
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--gradient-symbol)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(19, 36, 160, 0.35)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>{p.btnLabel}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '45px', fontSize: '0.82rem', color: '#7e8bb6', textAlign: 'center' }}>
        <span>ScaFlow v3.1 · Plataforma de Gestão de Filas e Atendimento Médico</span>
      </div>
    </div>
  );
}
