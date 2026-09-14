// client/src/pages/SuperAdminDash.jsx
import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  ShieldCheck, 
  Key, 
  Copy, 
  Check, 
  ExternalLink, 
  Search, 
  LogOut, 
  Tv, 
  Ticket, 
  Sliders, 
  Layers, 
  Globe, 
  AlertCircle,
  Eye,
  Crown
} from 'lucide-react';
import { saasService, isSupabaseConfigured } from '../supabase';
import { useAuth } from '../context/AuthContext';
import scaFlowLogo from '../assets/logo/ScaFlow.svg';

export default function SuperAdminDash({ onNavigateToAdmin }) {
  const { user, signOut, switchTenant } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Form de Novo Cliente
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    plan: 'pro',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const loadTenants = async () => {
    setLoading(true);
    try {
      const data = await saasService.listTenants();
      setTenants(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const handleNameChange = (val) => {
    const autoSlug = val
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    setFormData(prev => ({
      ...prev,
      name: val,
      slug: prev.slug === '' || prev.slug === autoSlug.slice(0, -1) ? autoSlug : prev.slug
    }));
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      if (!formData.name || !formData.slug || !formData.adminEmail || !formData.adminPassword) {
        throw new Error('Preencha todos os campos obrigatórios.');
      }

      await saasService.createTenant(formData);
      setModalOpen(false);
      setFormData({
        name: '',
        slug: '',
        plan: 'pro',
        adminName: '',
        adminEmail: '',
        adminPassword: ''
      });
      loadTenants();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCopyAccess = (tenant, e) => {
    e.stopPropagation();
    const text = `🏥 *Dados de Acesso ao ScaFlow Health*\n\n` +
      `*Cliente:* ${tenant.name}\n` +
      `*Painel Gestor:* ${window.location.origin}\n` +
      `*Totem de Autoatendimento:* ${window.location.origin}/#totem?tenant=${tenant.slug}\n` +
      `*Painel TV Sala de Espera:* ${window.location.origin}/#painel?tenant=${tenant.slug}\n\n` +
      `_Sistema Multi-Tenant Ativo & Seguro._`;

    navigator.clipboard.writeText(text);
    setCopiedId(tenant.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleAccessTenant = (tenant) => {
    switchTenant(tenant);
    if (onNavigateToAdmin) {
      onNavigateToAdmin();
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#020817', color: '#FDFCFD', padding: '32px 24px' }}>
      
      {/* HEADER SUPERADMIN */}
      <header style={{
        maxWidth: '1360px',
        margin: '0 auto 36px auto',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        borderBottom: '1px solid rgba(46, 158, 253, 0.2)',
        paddingBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src={scaFlowLogo} alt="ScaFlow" style={{ height: '52px', width: 'auto' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#FDFCFD' }}>
                Painel Master
              </h1>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(127, 72, 252, 0.2)',
                border: '1px solid rgba(127, 72, 252, 0.5)',
                color: '#a78bfa',
                fontSize: '0.72rem',
                fontWeight: 800
              }}>
                <Crown size={12} />
                PLATAFORMA OWNER
              </span>
            </div>
            <p style={{ fontSize: '0.86rem', color: '#B5BCD7', marginTop: '4px' }}>
              Gerencie seus clientes, planos e forneça acessos para venda do software
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '12px',
              fontSize: '0.88rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <Plus size={18} />
            <span>+ Cadastrar Novo Cliente</span>
          </button>

          <button
            onClick={signOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* BENTO CARDS DE TELEMETRIA */}
      <div style={{
        maxWidth: '1360px',
        margin: '0 auto 32px auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '20px'
      }}>
        
        <div style={{
          background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.85) 0%, rgba(2, 8, 23, 0.95) 100%)',
          border: '1px solid rgba(46, 158, 253, 0.3)',
          borderRadius: '20px',
          padding: '22px 24px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#B5BCD7', textTransform: 'uppercase' }}>
              Clientes Ativos (Tenants)
            </span>
            <Building2 size={22} color="#2E9EFD" />
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#FDFCFD', margin: '8px 0 2px 0' }}>
            {tenants.length}
          </div>
          <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 700 }}>
            ● 100% Operacionais no Supabase
          </span>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.85) 0%, rgba(2, 8, 23, 0.95) 100%)',
          border: '1px solid rgba(127, 72, 252, 0.3)',
          borderRadius: '20px',
          padding: '22px 24px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#B5BCD7', textTransform: 'uppercase' }}>
              Motor de Banco & Dados
            </span>
            <Globe size={22} color="#7F48FC" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FDFCFD', margin: '14px 0 6px 0' }}>
            {isSupabaseConfigured ? 'Supabase PostgreSQL Cloud' : 'Modo Local / Demo Storage'}
          </div>
          <span style={{ fontSize: '0.78rem', color: isSupabaseConfigured ? '#34d399' : '#f59e0b', fontWeight: 700 }}>
            {isSupabaseConfigured ? '● Conectado em Produção' : '● Chaves .env pendentes (Pronto p/ plugar)'}
          </span>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.85) 0%, rgba(2, 8, 23, 0.95) 100%)',
          border: '1px solid rgba(46, 158, 253, 0.3)',
          borderRadius: '20px',
          padding: '22px 24px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#B5BCD7', textTransform: 'uppercase' }}>
              Segurança Multi-Tenant
            </span>
            <ShieldCheck size={22} color="#34d399" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FDFCFD', margin: '14px 0 6px 0' }}>
            Row Level Security (RLS)
          </div>
          <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 700 }}>
            ● Isolamento absoluto por tenant
          </span>
        </div>

      </div>

      {/* BARRA DE PESQUISA */}
      <div style={{
        maxWidth: '1360px',
        margin: '0 auto 20px auto',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'rgba(7, 19, 63, 0.6)',
        border: '1px solid rgba(93, 94, 252, 0.25)',
        borderRadius: '16px',
        padding: '10px 18px'
      }}>
        <Search size={18} color="#B5BCD7" />
        <input
          type="text"
          placeholder="Buscar cliente por nome da clínica ou slug..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* LISTA DE CLIENTES */}
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
          gap: '20px'
        }}>
          {filteredTenants.map((t) => (
            <div
              key={t.id}
              style={{
                background: 'linear-gradient(135deg, rgba(7, 19, 63, 0.88) 0%, rgba(2, 8, 23, 0.96) 100%)',
                border: '1px solid rgba(46, 158, 253, 0.25)',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    background: t.plan === 'enterprise' ? 'rgba(127, 72, 252, 0.2)' : 'rgba(46, 158, 253, 0.2)',
                    color: t.plan === 'enterprise' ? '#c084fc' : '#2E9EFD',
                    border: `1px solid ${t.plan === 'enterprise' ? 'rgba(127, 72, 252, 0.4)' : 'rgba(46, 158, 253, 0.4)'}`
                  }}>
                    Plano {t.plan}
                  </span>

                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    color: '#34d399'
                  }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399' }} />
                    {t.status === 'active' ? 'Ativo' : t.status}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FDFCFD', letterSpacing: '-0.01em', marginBottom: '4px' }}>
                  {t.name}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#B5BCD7', fontFamily: 'monospace' }}>
                  slug: /{t.slug}
                </div>

                <div style={{ borderTop: '1px solid rgba(93, 94, 252, 0.15)', margin: '16px 0', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B5BCD7' }}>
                    <span>Capacidade Guichês:</span>
                    <strong style={{ color: '#FDFCFD' }}>Até {t.max_counters || 10} estações</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B5BCD7' }}>
                    <span>Cadastrado em:</span>
                    <strong style={{ color: '#FDFCFD' }}>{new Date(t.created_at).toLocaleDateString('pt-BR')}</strong>
                  </div>
                </div>
              </div>

              {/* AÇÕES DO CLIENTE */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                <button
                  onClick={() => handleAccessTenant(t)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #2E9EFD 0%, #7F48FC 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Eye size={16} />
                  <span>Acessar Painel Deste Cliente</span>
                </button>

                <button
                  onClick={(e) => handleCopyAccess(t, e)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: copiedId === t.id ? 'rgba(52, 211, 153, 0.2)' : 'rgba(19, 36, 160, 0.25)',
                    border: `1px solid ${copiedId === t.id ? '#34d399' : 'rgba(93, 94, 252, 0.3)'}`,
                    color: copiedId === t.id ? '#34d399' : '#B5BCD7',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  {copiedId === t.id ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedId === t.id ? 'Copiado para Área de Transferência!' : 'Copiar Links & Acesso para o Cliente'}</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* MODAL DE CADASTRO DE NOVO CLIENTE */}
      {modalOpen && (
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
            maxWidth: '560px',
            background: 'linear-gradient(135deg, #07133F 0%, #020817 100%)',
            border: '1px solid rgba(46, 158, 253, 0.4)',
            borderRadius: '24px',
            padding: '30px',
            boxShadow: '0 24px 70px rgba(0, 0, 0, 0.7)'
          }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#FDFCFD', marginBottom: '6px' }}>
              Cadastrar Novo Cliente
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#B5BCD7', marginBottom: '20px' }}>
              Crie a empresa cliente e defina o e-mail e senha do gestor
            </p>

            {formError && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '0.84rem',
                marginBottom: '16px'
              }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateTenant} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#B5BCD7', marginBottom: '4px' }}>
                  Nome da Clínica / Empresa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Hospital São Lucas"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(2, 8, 23, 0.8)',
                    border: '1px solid rgba(93, 94, 252, 0.3)',
                    color: '#FDFCFD',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#B5BCD7', marginBottom: '4px' }}>
                    Slug (Identificador na URL) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="sao-lucas"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'rgba(2, 8, 23, 0.8)',
                      border: '1px solid rgba(93, 94, 252, 0.3)',
                      color: '#FDFCFD',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#B5BCD7', marginBottom: '4px' }}>
                    Plano Contratado
                  </label>
                  <select
                    value={formData.plan}
                    onChange={(e) => setFormData(prev => ({ ...prev, plan: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'rgba(2, 8, 23, 0.8)',
                      border: '1px solid rgba(93, 94, 252, 0.3)',
                      color: '#FDFCFD',
                      fontSize: '0.88rem'
                    }}
                  >
                    <option value="starter">Starter (Até 5 Guichês)</option>
                    <option value="pro">Pro (Até 12 Guichês)</option>
                    <option value="enterprise">Enterprise (Ilimitado)</option>
                  </select>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(93, 94, 252, 0.2)', paddingTop: '14px', marginTop: '4px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#2E9EFD', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Acesso Inicial do Gestor da Clínica
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#B5BCD7', marginBottom: '4px' }}>
                  Nome do Administrador
                </label>
                <input
                  type="text"
                  placeholder="Ex: Dr. Roberto Martins"
                  value={formData.adminName}
                  onChange={(e) => setFormData(prev => ({ ...prev, adminName: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(2, 8, 23, 0.8)',
                    border: '1px solid rgba(93, 94, 252, 0.3)',
                    color: '#FDFCFD',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#B5BCD7', marginBottom: '4px' }}>
                    E-mail de Login *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="gestor@saolucas.com.br"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'rgba(2, 8, 23, 0.8)',
                      border: '1px solid rgba(93, 94, 252, 0.3)',
                      color: '#FDFCFD',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#B5BCD7', marginBottom: '4px' }}>
                    Senha Provisória *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 6 dígitos"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, adminPassword: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'rgba(2, 8, 23, 0.8)',
                      border: '1px solid rgba(93, 94, 252, 0.3)',
                      color: '#FDFCFD',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: '#FDFCFD',
                    fontSize: '0.86rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="btn-primary"
                  style={{
                    padding: '10px 22px',
                    borderRadius: '10px',
                    fontSize: '0.86rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {formLoading ? 'Cadastrando no Banco...' : 'Criar Cliente e Ativar'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
