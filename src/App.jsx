// client/src/App.jsx
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import AdminDash from './pages/AdminDash';
import Atendente from './pages/Atendente';
import Totem from './pages/Totem';
import PainelTV from './pages/PainelTV';
import { RotateCw } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem('sca_user') || null;
  });

  const handleSelectUser = (userId) => {
    setCurrentUser(userId);
    if (userId) {
      localStorage.setItem('sca_user', userId);
    } else {
      localStorage.removeItem('sca_user');
    }
  };

  const handleSwitchUser = () => {
    handleSelectUser(null);
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Camada Atmosférica de Fundo */}
      <div className="app-atmosphere">
        <div className="aurora-gradient-1" />
        <div className="aurora-gradient-2" />
        <div className="noise-layer" />
      </div>

      {/* Renderização Condicional com Base no Perfil */}
      {!currentUser && (
        <Login onSelectUser={handleSelectUser} />
      )}

      {currentUser === 'admin' && (
        <AdminDash onSwitchUser={handleSwitchUser} />
      )}

      {currentUser === 'laura' && (
        <>
          <Navbar currentUser={currentUser} onSwitchUser={handleSwitchUser} />
          <main>
            <Atendente />
          </main>
        </>
      )}

      {currentUser === 'senha' && (
        <>
          {/* Botão flutuante sutil no canto para sair do totem em desenvolvimento */}
          <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 9999 }}>
            <button
              onClick={handleSwitchUser}
              className="btn-secondary"
              style={{
                padding: '8px 14px',
                fontSize: '0.8rem',
                borderRadius: '9999px',
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)',
                cursor: 'pointer'
              }}
              title="Trocar de Usuário / Sair do Totem"
            >
              <RotateCw size={13} />
              <span>Trocar Perfil</span>
            </button>
          </div>
          <main>
            <Totem />
          </main>
        </>
      )}

      {currentUser === 'painel' && (
        <>
          {/* Botão flutuante para sair da TV */}
          <div style={{ position: 'fixed', top: '16px', left: '16px', zIndex: 9999 }}>
            <button
              onClick={handleSwitchUser}
              className="btn-secondary"
              style={{
                padding: '8px 14px',
                fontSize: '0.8rem',
                borderRadius: '9999px',
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)',
                cursor: 'pointer'
              }}
              title="Trocar de Usuário / Sair do Painel"
            >
              <RotateCw size={13} />
              <span>Trocar Perfil</span>
            </button>
          </div>
          <main>
            <PainelTV />
          </main>
        </>
      )}
    </div>
  );
}
