// client/src/App.jsx
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import SuperAdminDash from './pages/SuperAdminDash';
import AdminDash from './pages/AdminDash';
import Atendente from './pages/Atendente';
import Totem from './pages/Totem';
import PainelTV from './pages/PainelTV';
import { RotateCw, LogOut, ArrowLeft, Shield } from 'lucide-react';

function AppContent() {
  const { user, currentTenant, isSuperAdmin, isTenantAdmin, isAttendant, signOut } = useAuth();
  
  // Estação direta (totem / kiosk ou monitor de TV na recepção)
  const [stationOverride, setStationOverride] = useState(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('totem') || hash.includes('senha')) return 'totem';
    if (hash.includes('painel') || hash.includes('tv')) return 'painel';
    return null;
  });

  // Modo de visualização para o SuperAdmin que quer inspecionar o painel do cliente
  const [superAdminViewAsAdmin, setSuperAdminViewAsAdmin] = useState(false);

  // Escuta hashchange para permitir navegar diretamente via URL (#totem / #painel)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('totem') || hash.includes('senha')) {
        setStationOverride('totem');
      } else if (hash.includes('painel') || hash.includes('tv')) {
        setStationOverride('painel');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const tenantId = currentTenant?.id || 'tenant-demo-01';

  // 1. Terminal Kiosk de Autoatendimento (Totem)
  if (stationOverride === 'totem') {
    return (
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        <div className="app-atmosphere">
          <div className="aurora-gradient-1" />
          <div className="aurora-gradient-2" />
          <div className="noise-layer" />
        </div>
        <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 9999 }}>
          <button
            onClick={() => {
              window.location.hash = '';
              setStationOverride(null);
            }}
            className="btn-secondary"
            style={{
              padding: '8px 14px',
              fontSize: '0.8rem',
              borderRadius: '9999px',
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(8px)',
              cursor: 'pointer'
            }}
            title="Sair do modo Totem"
          >
            <RotateCw size={13} />
            <span>Sair do Totem</span>
          </button>
        </div>
        <main>
          <Totem tenantId={tenantId} />
        </main>
      </div>
    );
  }

  // 2. Monitor Público da Sala de Espera (Painel TV)
  if (stationOverride === 'painel') {
    return (
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        <div style={{ position: 'fixed', top: '16px', left: '16px', zIndex: 9999 }}>
          <button
            onClick={() => {
              window.location.hash = '';
              setStationOverride(null);
            }}
            className="btn-secondary"
            style={{
              padding: '8px 14px',
              fontSize: '0.8rem',
              borderRadius: '9999px',
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(8px)',
              cursor: 'pointer'
            }}
            title="Sair do Painel TV"
          >
            <RotateCw size={13} />
            <span>Sair do Painel</span>
          </button>
        </div>
        <main>
          <PainelTV tenantId={tenantId} />
        </main>
      </div>
    );
  }

  // 3. Usuário Deslogado -> Formulário de Login Profissional
  if (!user) {
    return (
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        <div className="app-atmosphere">
          <div className="aurora-gradient-1" />
          <div className="aurora-gradient-2" />
          <div className="noise-layer" />
        </div>
        <Login onQuickAccess={(station) => setStationOverride(station)} />
      </div>
    );
  }

  // 4. SuperAdmin (Dono da Plataforma)
  if (isSuperAdmin && !superAdminViewAsAdmin) {
    return (
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        <SuperAdminDash onNavigateToAdmin={() => setSuperAdminViewAsAdmin(true)} />
      </div>
    );
  }

  // 5. Admin do Cliente (Gestor da Clínica / Hospital) ou SuperAdmin inspecionando
  if (isTenantAdmin || (isSuperAdmin && superAdminViewAsAdmin)) {
    return (
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        {isSuperAdmin && (
          <div style={{
            background: 'linear-gradient(90deg, #7F48FC 0%, #286DFC 100%)',
            color: '#fff',
            padding: '6px 16px',
            fontSize: '0.78rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 1000
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={14} />
              <span>Modo Inspeção SuperAdmin · Visualizando painel da clínica: <strong>{currentTenant?.name || 'Clínica Demonstração'}</strong></span>
            </div>
            <button
              onClick={() => setSuperAdminViewAsAdmin(false)}
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: 'none',
                color: '#fff',
                padding: '3px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.74rem',
                fontWeight: 700
              }}
            >
              Voltar ao Cockpit SuperAdmin
            </button>
          </div>
        )}
        <AdminDash 
          tenant={currentTenant}
          onSwitchUser={signOut}
          onOpenTotem={() => setStationOverride('totem')}
          onOpenPainel={() => setStationOverride('painel')}
        />
      </div>
    );
  }

  // 6. Atendente (Recepção / Triagem / Guichê)
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <div className="app-atmosphere">
        <div className="aurora-gradient-1" />
        <div className="aurora-gradient-2" />
        <div className="noise-layer" />
      </div>
      <Navbar currentUser={user} tenant={currentTenant} onSwitchUser={signOut} />
      <main>
        <Atendente user={user} tenant={currentTenant} />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
