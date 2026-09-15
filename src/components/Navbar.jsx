// client/src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Headphones, 
  Ticket, 
  Tv, 
  RotateCw, 
  Clock 
} from 'lucide-react';
import { socket } from '../socket';
import { isSupabaseConfigured } from '../supabase';
import scaFlowLogo from '../assets/logo/ScaFlow.svg';

export default function Navbar({ currentUser, tenant, onSwitchUser }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString('pt-BR'));
  const [connected, setConnected] = useState(() => {
    return socket.connected || (isSupabaseConfigured && typeof navigator !== 'undefined' && navigator.onLine);
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('pt-BR'));
    }, 1000);

    const updateStatus = () => {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      setConnected(socket.connected || (isSupabaseConfigured && isOnline));
    };

    const onConnect = () => setConnected(true);
    const onDisconnect = () => {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      setConnected(isSupabaseConfigured && isOnline);
    };

    const handleOnline = () => setConnected(true);
    const handleOffline = () => setConnected(false);
    const handleRealtimeStatus = (e) => {
      if (e.detail?.connected !== undefined) {
        setConnected(e.detail.connected);
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('scaflow_realtime_status', handleRealtimeStatus);

    updateStatus();

    return () => {
      clearInterval(timer);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('scaflow_realtime_status', handleRealtimeStatus);
    };
  }, []);

  const getRoleBadge = () => {
    const role = typeof currentUser === 'object' ? currentUser?.role : currentUser;
    const userName = typeof currentUser === 'object' ? currentUser?.name : 'Laura';

    if (role === 'admin') {
      return {
        label: `${userName} · Gestão Geral`,
        icon: <ShieldCheck size={16} />,
        color: '#2E9EFD'
      };
    }
    if (role === 'atendente' || currentUser === 'laura') {
      return {
        label: `${userName} · Atendimento de Balcão`,
        icon: <Headphones size={16} />,
        color: '#5D5EFC'
      };
    }
    if (role === 'senha' || role === 'totem') {
      return {
        label: 'Terminal de Emissão · Autoatendimento',
        icon: <Ticket size={16} />,
        color: '#7F48FC'
      };
    }
    if (role === 'painel') {
      return {
        label: 'Monitor Público · Sala de Espera',
        icon: <Tv size={16} />,
        color: '#286DFC'
      };
    }
    return { label: userName || 'Acesso Livre', icon: null, color: '#B5BCD7' };
  };

  const role = getRoleBadge();

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 28px',
      background: 'rgba(7, 19, 63, 0.82)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(93, 94, 252, 0.25)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Logo ScaFlow & Nome do Cliente */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src={scaFlowLogo} 
            alt="ScaFlow" 
            style={{ 
              height: '100px', 
              width: 'auto',
              filter: 'drop-shadow(0 0 12px rgba(46, 158, 253, 0.45))'
            }} 
          />
          {tenant?.name && (
            <span style={{
              fontSize: '0.86rem',
              color: '#FDFCFD',
              fontWeight: 700,
              borderLeft: '1px solid rgba(93, 94, 252, 0.35)',
              paddingLeft: '12px',
              maxWidth: '220px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {tenant.name}
            </span>
          )}
        </div>
      </div>

      {/* Perfil Ativo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '9999px',
          fontSize: '0.85rem',
          fontWeight: 700,
          background: 'rgba(7, 19, 63, 0.9)',
          border: '1px solid rgba(93, 94, 252, 0.35)',
          color: '#FDFCFD',
          boxShadow: '0 4px 12px rgba(2, 8, 23, 0.5)'
        }}>
          <span style={{ color: role.color, display: 'inline-flex', alignItems: 'center' }}>
            {role.icon}
          </span>
          <span>{role.label}</span>
        </div>

        {/* Status de Conexão */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: connected ? '#2E9EFD' : '#f87171',
          background: connected ? 'rgba(46, 158, 253, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          padding: '5px 12px',
          borderRadius: '9999px',
          border: `1px solid ${connected ? 'rgba(46, 158, 253, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`
        }}>
          <span className={connected ? 'pulse-dot' : 'pulse-dot pulse-dot-red'}></span>
          <span>{connected ? 'Conexão em Tempo Real' : 'Reconectando...'}</span>
        </div>
      </div>

      {/* Relógio & Troca de Estação */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.9rem',
          fontFamily: 'var(--font-mono)',
          color: '#B5BCD7',
          background: 'rgba(2, 8, 23, 0.5)',
          padding: '6px 14px',
          borderRadius: '10px',
          border: '1px solid rgba(93, 94, 252, 0.2)'
        }}>
          <Clock size={15} color="#2E9EFD" />
          <span>{time}</span>
        </div>

        <button 
          onClick={onSwitchUser}
          className="btn-secondary"
          style={{
            padding: '8px 14px',
            fontSize: '0.82rem',
            borderRadius: '10px',
            cursor: 'pointer'
          }}
          title="Alternar perfil ou estação de trabalho"
        >
          <RotateCw size={14} />
          <span>Alternar Estação</span>
        </button>
      </div>
    </header>
  );
}
