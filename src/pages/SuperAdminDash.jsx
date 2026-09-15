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
  Crown,
  Edit3,
  Trash2,
  X,
  Stethoscope,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { saasService, isSupabaseConfigured } from '../supabase';
import { useAuth } from '../context/AuthContext';
import scaFlowLogo from '../assets/logo/ScaFlow.svg';

const SPECIALTY_TEMPLATES = {
  hospitalar: {
    label: 'Hospitalar & Clínica Geral',
    desc: 'Triagem, Cardiologia, Pediatria, Ortopedia, Gineco e Coleta',
    services: [
      { name: 'Clínica Geral & Acolhimento', code: 'CG', description: 'Triagem e Avaliação Geral', icon: 'Stethoscope', color: '#2E9EFD', sort_order: 1 },
      { name: 'Cardiologia & Check-up', code: 'CARD', description: 'Avaliação Cardiovascular', icon: 'Heart', color: '#ef4444', sort_order: 2 },
      { name: 'Pediatria & Puericultura', code: 'PED', description: 'Saúde Infantil e Bebês', icon: 'Baby', color: '#f59e0b', sort_order: 3 },
      { name: 'Ortopedia & Traumatologia', code: 'ORT', description: 'Ossos e Articulações', icon: 'Activity', color: '#10b981', sort_order: 4 },
      { name: 'Ginecologia & Obstetrícia', code: 'GIN', description: 'Saúde Feminina e Pré-Natal', icon: 'ShieldCheck', color: '#ec4899', sort_order: 5 },
      { name: 'Diagnósticos & Coleta', code: 'LAB', description: 'Análises Clínicas e Sangue', icon: 'FlaskConical', color: '#8b5cf6', sort_order: 6 }
    ]
  },
  laboratorio: {
    label: 'Laboratório & Análises Clínicas',
    desc: 'Coleta de sangue, exames de rotina, curva e laudos',
    services: [
      { name: 'Coleta de Sangue & Exames', code: 'COL', description: 'Coleta de rotina e hemogramas', icon: 'FlaskConical', color: '#ef4444', sort_order: 1 },
      { name: 'Exames Toxicológicos & DNA', code: 'TOX', description: 'Coleta especializada e laudos', icon: 'Activity', color: '#f59e0b', sort_order: 2 },
      { name: 'Curva Glicêmica & Especiais', code: 'GLIC', description: 'Exames de tempo prolongado', icon: 'Clock', color: '#8b5cf6', sort_order: 3 },
      { name: 'Ultrassonografia & Raios-X', code: 'IMG', description: 'Diagnóstico por imagem', icon: 'Eye', color: '#2E9EFD', sort_order: 4 },
      { name: 'Retirada de Resultados & Laudos', code: 'RES', description: 'Entrega física de exames', icon: 'CheckCircle2', color: '#10b981', sort_order: 5 }
    ]
  },
  odontologia: {
    label: 'Clínica Odontológica',
    desc: 'Triagem, ortodontia, endodontia, prótese e implantes',
    services: [
      { name: 'Avaliação & Triagem Odonto', code: 'AVAL', description: 'Primeira consulta e orçamento', icon: 'Stethoscope', color: '#2E9EFD', sort_order: 1 },
      { name: 'Ortodontia & Aparelhos', code: 'ORTO', description: 'Manutenção e alinhamento', icon: 'Activity', color: '#8b5cf6', sort_order: 2 },
      { name: 'Endodontia & Canal', code: 'ENDO', description: 'Tratamento de canais radiculares', icon: 'Heart', color: '#ef4444', sort_order: 3 },
      { name: 'Cirurgia & Implantes', code: 'CIR', description: 'Extrações e implantes dentários', icon: 'ShieldCheck', color: '#10b981', sort_order: 4 },
      { name: 'Profilaxia & Clareamento', code: 'LIMP', description: 'Limpeza, clareamento e estética', icon: 'Sparkles', color: '#06b6d4', sort_order: 5 }
    ]
  },
  cartorio: {
    label: 'Cartório / Balcão de Atendimento',
    desc: 'Reconhecimento de firma, certidões, autenticação e balcão',
    services: [
      { name: 'Reconhecimento de Firma & Autenticação', code: 'FIR', description: 'Validação de assinaturas e cópias', icon: 'CheckCircle2', color: '#2E9EFD', sort_order: 1 },
      { name: 'Procurações & Escrituras', code: 'PROC', description: 'Instrumentos públicos e contratos', icon: 'FileSpreadsheet', color: '#8b5cf6', sort_order: 2 },
      { name: 'Certidões & Registro Civil', code: 'CERT', description: 'Nascimento, casamento e óbito', icon: 'ShieldCheck', color: '#10b981', sort_order: 3 },
      { name: 'Triagem & Informações Gerais', code: 'INFO', description: 'Dúvidas e encaminhamentos', icon: 'Users', color: '#f59e0b', sort_order: 4 }
    ]
  }
};

export default function SuperAdminDash({ onNavigateToAdmin }) {
  const { user, signOut, switchTenant } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Gestão de Especialidades por Tenant
  const [servicesModalOpen, setServicesModalOpen] = useState(false);
  const [selectedTenantForServices, setSelectedTenantForServices] = useState(null);
  const [tenantServices, setTenantServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  // Form de Criar/Editar Especialidade
  const [serviceEditModalOpen, setServiceEditModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceFormData, setServiceFormData] = useState({
    name: '',
    code: '',
    description: '',
    color: '#2E9EFD',
    is_active: true
  });
  const [serviceSaving, setServiceSaving] = useState(false);
  const [serviceError, setServiceError] = useState('');

  // Form de Novo Cliente
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    plan: 'pro',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  });
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
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

  const generateSlug = (text) => {
    return (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (val) => {
    setFormData(prev => ({
      ...prev,
      name: val,
      slug: isSlugManuallyEdited ? prev.slug : generateSlug(val)
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
      setIsSlugManuallyEdited(false);
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

  const handleOpenServicesModal = async (tenant) => {
    setSelectedTenantForServices(tenant);
    setServicesModalOpen(true);
    setServicesLoading(true);
    try {
      const data = await saasService.fetchServices(tenant.id, true);
      setTenantServices(data || []);
    } catch (err) {
      console.error('Erro ao buscar especialidades do tenant:', err);
    } finally {
      setServicesLoading(false);
    }
  };

  const handleOpenCreateService = () => {
    setEditingService(null);
    setServiceFormData({
      name: '',
      code: '',
      description: '',
      color: '#2E9EFD',
      is_active: true
    });
    setServiceError('');
    setServiceEditModalOpen(true);
  };

  const handleOpenEditService = (service) => {
    setEditingService(service);
    setServiceFormData({
      name: service.name || service.nome || '',
      code: service.code || service.sigla || '',
      description: service.description || service.descricao || '',
      color: service.color || '#2E9EFD',
      is_active: service.is_active !== false
    });
    setServiceError('');
    setServiceEditModalOpen(true);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!selectedTenantForServices) return;
    setServiceSaving(true);
    setServiceError('');

    try {
      if (!serviceFormData.name.trim() || !serviceFormData.code.trim()) {
        throw new Error('Nome e Sigla são obrigatórios.');
      }

      const cleanCode = serviceFormData.code.trim().toUpperCase().slice(0, 6);
      const payload = {
        ...(editingService?.id ? { id: editingService.id } : {}),
        name: serviceFormData.name.trim(),
        code: cleanCode,
        description: serviceFormData.description.trim(),
        color: serviceFormData.color,
        is_active: serviceFormData.is_active,
        sort_order: editingService?.sort_order || (tenantServices.length + 1)
      };

      await saasService.saveService(selectedTenantForServices.id, payload);
      const updated = await saasService.fetchServices(selectedTenantForServices.id, true);
      setTenantServices(updated || []);
      setServiceEditModalOpen(false);
    } catch (err) {
      setServiceError(err.message || 'Erro ao salvar especialidade.');
    } finally {
      setServiceSaving(false);
    }
  };

  const handleToggleServiceStatus = async (service) => {
    if (!selectedTenantForServices) return;
    try {
      const newStatus = !service.is_active;
      await saasService.saveService(selectedTenantForServices.id, {
        id: service.id,
        is_active: newStatus
      });
      setTenantServices(prev => prev.map(s => s.id === service.id ? { ...s, is_active: newStatus } : s));
    } catch (err) {
      console.error('Erro ao alternar status da especialidade:', err);
    }
  };

  const handleDeleteService = async (service) => {
    if (!selectedTenantForServices) return;
    if (!window.confirm(`Tem certeza que deseja excluir a especialidade "${service.name || service.nome}"?`)) {
      return;
    }
    try {
      await saasService.deleteService(selectedTenantForServices.id, service.id);
      setTenantServices(prev => prev.filter(s => s.id !== service.id));
    } catch (err) {
      alert(`Erro ao excluir especialidade: ${err.message}`);
    }
  };

  const handleApplyTemplate = async (templateKey) => {
    if (!selectedTenantForServices) return;
    const tpl = SPECIALTY_TEMPLATES[templateKey];
    if (!tpl) return;

    if (!window.confirm(`Substituir especialidades de "${selectedTenantForServices.name}" pelo modelo "${tpl.label}"? As especialidades atuais serão atualizadas.`)) {
      return;
    }

    setServicesLoading(true);
    try {
      const updated = await saasService.applyServiceTemplate(selectedTenantForServices.id, tpl.services);
      setTenantServices(updated || []);
    } catch (err) {
      alert(`Erro ao aplicar modelo: ${err.message}`);
    } finally {
      setServicesLoading(false);
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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
              }
            }}
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '12px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'none',
              border: '1px solid rgba(46, 158, 253, 0.4)',
              color: '#FDFCFD'
            }}
            title="Abrir terminal do Totem em nova aba"
          >
            <Ticket size={16} color="#2E9EFD" />
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
              }
            }}
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '12px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'none',
              border: '1px solid rgba(127, 72, 252, 0.4)',
              color: '#FDFCFD'
            }}
            title="Abrir monitor de TV em nova aba"
          >
            <Tv size={16} color="#7F48FC" />
            <span>Abrir TV</span>
          </a>

          <button
            onClick={() => {
              setFormData({
                name: '',
                slug: '',
                plan: 'pro',
                adminName: '',
                adminEmail: '',
                adminPassword: ''
              });
              setIsSlugManuallyEdited(false);
              setFormError('');
              setModalOpen(true);
            }}
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '12px',
              fontSize: '0.88rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <Plus size={18} />
            <span>+ Novo Cliente</span>
          </button>

          <button
            onClick={signOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <a
                    href={`#totem?tenant=${t.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      const url = `${window.location.origin}/#totem?tenant=${t.id}`;
                      const win = window.open(url, '_blank');
                      if (win) {
                        e.preventDefault();
                        win.focus();
                      }
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '10px',
                      background: 'rgba(46, 158, 253, 0.12)',
                      border: '1px solid rgba(46, 158, 253, 0.35)',
                      color: '#2E9EFD',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      textDecoration: 'none'
                    }}
                    title="Abrir terminal do Totem deste cliente em nova aba"
                  >
                    <Ticket size={14} />
                    <span>Totem</span>
                  </a>

                  <a
                    href={`#painel?tenant=${t.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      const url = `${window.location.origin}/#painel?tenant=${t.id}`;
                      const win = window.open(url, '_blank');
                      if (win) {
                        e.preventDefault();
                        win.focus();
                      }
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '10px',
                      background: 'rgba(127, 72, 252, 0.12)',
                      border: '1px solid rgba(127, 72, 252, 0.35)',
                      color: '#c084fc',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      textDecoration: 'none'
                    }}
                    title="Abrir monitor de TV deste cliente em nova aba"
                  >
                    <Tv size={14} />
                    <span>Painel TV</span>
                  </a>
                </div>

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
                    onChange={(e) => {
                      const clean = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      if (clean === '') {
                        setIsSlugManuallyEdited(false);
                        setFormData(prev => ({ ...prev, slug: generateSlug(prev.name) }));
                      } else {
                        setIsSlugManuallyEdited(true);
                        setFormData(prev => ({ ...prev, slug: clean }));
                      }
                    }}
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
                  onClick={() => {
                    setModalOpen(false);
                    setIsSlugManuallyEdited(false);
                  }}
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

      {/* MODAL DE GESTÃO DE ESPECIALIDADES DO TENANT (SUPERADMIN) */}
      {servicesModalOpen && selectedTenantForServices && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 8, 23, 0.88)',
          backdropFilter: 'blur(14px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(135deg, #07133F 0%, #020817 100%)',
            border: '1px solid rgba(46, 158, 253, 0.4)',
            borderRadius: '24px',
            padding: '28px',
            boxShadow: '0 24px 70px rgba(0, 0, 0, 0.75)',
            overflow: 'hidden'
          }}>
            {/* Header do Modal */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid rgba(93, 94, 252, 0.2)', paddingBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#FDFCFD', letterSpacing: '-0.01em' }}>
                    Especialidades & Filas
                  </h2>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    background: 'rgba(46, 158, 253, 0.2)',
                    color: '#2E9EFD',
                    border: '1px solid rgba(46, 158, 253, 0.4)'
                  }}>
                    {selectedTenantForServices.name}
                  </span>
                </div>
                <p style={{ fontSize: '0.84rem', color: '#B5BCD7', marginTop: '4px' }}>
                  Gerencie especialidades médicas, siglas das senhas e visibilidade para este cliente.
                </p>
              </div>

              <button
                onClick={() => setServicesModalOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px',
                  color: '#B5BCD7',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Barra de Ações Rápidas e Modelos */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '16px',
              background: 'rgba(7, 19, 63, 0.5)',
              padding: '12px 16px',
              borderRadius: '14px',
              border: '1px solid rgba(93, 94, 252, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#B5BCD7' }}>
                  Modelos Prontos:
                </span>
                {Object.entries(SPECIALTY_TEMPLATES).map(([key, tpl]) => (
                  <button
                    key={key}
                    onClick={() => handleApplyTemplate(key)}
                    title={tpl.desc}
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(93, 94, 252, 0.25)',
                      borderRadius: '8px',
                      padding: '5px 10px',
                      color: '#FDFCFD',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s'
                    }}
                  >
                    <Sparkles size={12} color="#2E9EFD" />
                    <span>{tpl.label.split('&')[0].trim()}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={handleOpenCreateService}
                className="btn-primary"
                style={{
                  padding: '7px 14px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={15} />
                <span>Nova Especialidade</span>
              </button>
            </div>

            {/* Tabela de Especialidades */}
            <div style={{ flex: 1, overflowY: 'auto', borderRadius: '14px', border: '1px solid rgba(93, 94, 252, 0.15)' }}>
              {servicesLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#B5BCD7' }}>
                  Carregando especialidades do cliente...
                </div>
              ) : tenantServices.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#B5BCD7' }}>
                  Nenhuma especialidade cadastrada para este cliente. Adicione uma nova ou escolha um modelo acima.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(7, 19, 63, 0.9)', color: '#B5BCD7', borderBottom: '1px solid rgba(93, 94, 252, 0.2)' }}>
                      <th style={{ padding: '12px 14px' }}>Especialidade</th>
                      <th style={{ padding: '12px 14px' }}>Sigla Senha</th>
                      <th style={{ padding: '12px 14px' }}>Descrição</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenantServices.map((srv) => (
                      <tr key={srv.id} style={{ borderBottom: '1px solid rgba(93, 94, 252, 0.1)', background: srv.is_active === false ? 'rgba(0,0,0,0.2)' : 'transparent' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: srv.is_active === false ? '#6b7280' : '#FDFCFD' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: srv.color || '#2E9EFD', flexShrink: 0 }} />
                            <span>{srv.name || srv.nome}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(93, 94, 252, 0.15)',
                            color: '#5D5EFC',
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            fontSize: '0.82rem'
                          }}>
                            {srv.code || srv.sigla}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#B5BCD7', fontSize: '0.8rem', maxWidth: '280px' }}>
                          {srv.description || srv.descricao || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleToggleServiceStatus(srv)}
                            style={{
                              border: 'none',
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              background: srv.is_active !== false ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: srv.is_active !== false ? '#34d399' : '#f87171'
                            }}
                          >
                            {srv.is_active !== false ? '● Ativo' : '○ Inativo'}
                          </button>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleOpenEditService(srv)}
                              title="Editar Especialidade"
                              style={{
                                background: 'rgba(46, 158, 253, 0.15)',
                                border: '1px solid rgba(46, 158, 253, 0.3)',
                                borderRadius: '8px',
                                padding: '6px',
                                color: '#2E9EFD',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteService(srv)}
                              title="Excluir Especialidade"
                              style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '8px',
                                padding: '6px',
                                color: '#f87171',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Rodapé do Modal */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
              <button
                type="button"
                onClick={() => setServicesModalOpen(false)}
                style={{
                  padding: '9px 20px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#FDFCFD',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL DE CADASTRO / EDIÇÃO DE UMA ESPECIALIDADE */}
      {serviceEditModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 8, 23, 0.92)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '520px',
            background: 'linear-gradient(135deg, #07133F 0%, #020817 100%)',
            border: '1px solid rgba(46, 158, 253, 0.45)',
            borderRadius: '24px',
            padding: '28px',
            boxShadow: '0 24px 70px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FDFCFD' }}>
                  {editingService ? 'Editar Especialidade Médica' : 'Nova Especialidade Médica'}
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#B5BCD7', marginTop: '2px' }}>
                  Cliente: <strong style={{ color: '#2E9EFD' }}>{selectedTenantForServices?.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setServiceEditModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#B5BCD7', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {serviceError && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '0.84rem',
                marginBottom: '14px'
              }}>
                {serviceError}
              </div>
            )}

            <form onSubmit={handleSaveService} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#B5BCD7', marginBottom: '5px' }}>
                  Nome da Especialidade *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cardiologia & Check-up"
                  value={serviceFormData.name}
                  onChange={(e) => setServiceFormData(prev => ({ ...prev, name: e.target.value }))}
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
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#B5BCD7', marginBottom: '5px' }}>
                    Sigla / Prefixo da Senha *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="CARD"
                    value={serviceFormData.code}
                    onChange={(e) => setServiceFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'rgba(2, 8, 23, 0.8)',
                      border: '1px solid rgba(93, 94, 252, 0.3)',
                      color: '#5D5EFC',
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      fontSize: '0.9rem'
                    }}
                  />
                  <small style={{ fontSize: '0.72rem', color: '#B5BCD7' }}>Ex: CARD-001</small>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#B5BCD7', marginBottom: '5px' }}>
                    Cor de Destaque
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '6px' }}>
                    {['#2E9EFD', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444'].map(color => (
                      <div
                        key={color}
                        onClick={() => setServiceFormData(prev => ({ ...prev, color }))}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: color,
                          cursor: 'pointer',
                          border: serviceFormData.color === color ? '2px solid #ffffff' : '2px solid transparent',
                          transform: serviceFormData.color === color ? 'scale(1.2)' : 'scale(1)',
                          transition: 'all 0.15s'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#B5BCD7', marginBottom: '5px' }}>
                  Descrição Curta (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Avaliação cardiovascular e ECG"
                  value={serviceFormData.description}
                  onChange={(e) => setServiceFormData(prev => ({ ...prev, description: e.target.value }))}
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="srv_active_check"
                  checked={serviceFormData.is_active}
                  onChange={(e) => setServiceFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
                <label htmlFor="srv_active_check" style={{ fontSize: '0.84rem', color: '#FDFCFD', fontWeight: 600, cursor: 'pointer' }}>
                  Ativo para emissão de senhas no Totem
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setServiceEditModalOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.08)',
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
                  disabled={serviceSaving}
                  className="btn-primary"
                  style={{
                    padding: '10px 22px',
                    borderRadius: '10px',
                    fontSize: '0.86rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {serviceSaving ? 'Salvando...' : 'Salvar Especialidade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
