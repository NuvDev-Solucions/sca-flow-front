// client/src/pages/Login.jsx
import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Building2, 
  Ticket, 
  Tv, 
  Headphones, 
  Crown,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import scaFlowLogo from '../assets/logo/ScaFlow.svg';

export default function Login({ onQuickAccess }) {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await signIn(email, password);
    } catch (err) {
      setErrorMsg(err.message || 'Falha na autenticação. Verifique seu e-mail e senha.');
    }
  };

  const handleFillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMsg('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '30px 20px',
      position: 'relative'
    }}>
      
      {/* CARD PRINCIPAL DE LOGIN */}
      <div className="fade-in" style={{
        width: '100%',
        maxWidth: '440px',
        background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.92) 0%, rgba(2, 8, 23, 0.98) 100%)',
        border: '1px solid rgba(46, 158, 253, 0.35)',
        borderRadius: '24px',
        padding: '36px 32px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(46, 158, 253, 0.15)',
        textAlign: 'center',
        position: 'relative'
      }}>
        
        {/* LOGO */}
        <div style={{ marginBottom: '24px' }}>
          <img 
            src={scaFlowLogo} 
            alt="ScaFlow" 
            style={{ 
              height: '110px', 
              width: 'auto',
              filter: 'drop-shadow(0 0 20px rgba(46, 158, 253, 0.45))'
            }} 
          />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FDFCFD', letterSpacing: '-0.01em', marginTop: '12px' }}>
            Acesso à Plataforma
          </h1>
          <p style={{ fontSize: '0.84rem', color: '#B5BCD7', marginTop: '4px' }}>
            Entre com suas credenciais de gestor ou atendente
          </p>
        </div>

        {errorMsg && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#f87171',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '18px',
            textAlign: 'left'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#B5BCD7', marginBottom: '6px' }}>
              E-mail Profissional
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'rgba(2, 8, 23, 0.8)',
              border: '1px solid rgba(93, 94, 252, 0.3)'
            }}>
              <Mail size={18} color="#2E9EFD" />
              <input
                type="email"
                required
                placeholder="seu.email@clinica.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#FDFCFD',
                  fontSize: '0.9rem',
                  width: '100%'
                }}
              />
            </div>
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#B5BCD7', marginBottom: '6px' }}>
              Senha de Acesso
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'rgba(2, 8, 23, 0.8)',
              border: '1px solid rgba(93, 94, 252, 0.3)'
            }}>
              <Lock size={18} color="#2E9EFD" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#FDFCFD',
                  fontSize: '0.9rem',
                  width: '100%'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              fontSize: '0.95rem',
              fontWeight: 800,
              cursor: 'pointer',
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span>{loading ? 'Autenticando...' : 'Entrar no Sistema'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* ACESSOS RÁPIDOS DE DEMONSTRAÇÃO */}
        <div style={{ marginTop: '28px', borderTop: '1px solid rgba(93, 94, 252, 0.2)', paddingTop: '20px' }}>
          <div style={{ fontSize: '0.74rem', color: '#B5BCD7', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.06em', marginBottom: '12px' }}>
            Acessos Rápidos da Plataforma
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleFillDemo('admin@scaflow.com.br', 'admin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(127, 72, 252, 0.15)',
                border: '1px solid rgba(127, 72, 252, 0.35)',
                color: '#c084fc',
                fontSize: '0.8rem',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Crown size={14} />
                <strong>SuperAdmin</strong>
              </div>
              <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>Preencher</span>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('teste@teste.com', '123')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(46, 158, 253, 0.15)',
                border: '1px solid rgba(46, 158, 253, 0.35)',
                color: '#2E9EFD',
                fontSize: '0.8rem',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={14} />
                <strong>Gestor</strong>
              </div>
              <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>Preencher</span>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('atendente@hospital.com', '123')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(19, 36, 160, 0.25)',
                border: '1px solid rgba(93, 94, 252, 0.3)',
                color: '#FDFCFD',
                fontSize: '0.8rem',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Headphones size={14} />
                <strong>Atendente</strong>
              </div>
              <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>Preencher</span>
            </button>
          </div>

          {/* Atalhos Diretos para Totem e TV */}
          {onQuickAccess && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '14px' }}>
              <a
                href="#totem"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  const url = `${window.location.origin}/#totem`;
                  const win = window.open(url, '_blank');
                  if (win) {
                    e.preventDefault();
                    win.focus();
                  } else if (onQuickAccess) {
                    onQuickAccess('totem');
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FDFCFD',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'none'
                }}
              >
                <Ticket size={15} color="#2E9EFD" />
                <span>Abrir Totem</span>
              </a>

              <a
                href="#painel"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  const url = `${window.location.origin}/#painel`;
                  const win = window.open(url, '_blank');
                  if (win) {
                    e.preventDefault();
                    win.focus();
                  } else if (onQuickAccess) {
                    onQuickAccess('painel');
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FDFCFD',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'none'
                }}
              >
                <Tv size={15} color="#7F48FC" />
                <span>Abrir Painel TV</span>
              </a>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
