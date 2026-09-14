// client/src/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http') && 
  !supabaseUrl.includes('seu-projeto')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// ==============================================================================
// SEED PADRÃO (Para primeiro acesso e fallback local)
// ==============================================================================
const DEFAULT_TENANT = {
  id: 'tenant-demo-01',
  name: 'Complexo Hospitalar Central',
  slug: 'hospital-central',
  plan: 'enterprise',
  status: 'active',
  logo_url: null,
  primary_color: '#2E9EFD',
  max_counters: 20,
  created_at: new Date().toISOString()
};

const DEFAULT_USERS = [
  {
    id: 'user-superadmin',
    tenant_id: null,
    role: 'superadmin',
    name: 'Administrador da Plataforma (Você)',
    email: 'admin@scaflow.com.br',
    password: 'admin',
    position: 'Platform Owner'
  },
  {
    id: 'user-tenant-admin',
    tenant_id: 'tenant-demo-01',
    role: 'admin',
    name: 'Diretoria Médica Central',
    email: 'gestao@hospitalcentral.com.br',
    password: '123',
    position: 'Diretor Geral'
  },
  {
    id: 'user-atendente-laura',
    tenant_id: 'tenant-demo-01',
    role: 'atendente',
    name: 'Laura Guimarães',
    email: 'laura@hospitalcentral.com.br',
    password: '123',
    position: 'Atendente de Guichê Plena',
    assigned_counter: 'Guichê 01',
    assigned_services: ['clinica_geral', 'cardiologia', 'pediatria', 'ortopedia']
  }
];

const DEFAULT_SERVICES = [
  { id: 'clinica_geral', tenant_id: 'tenant-demo-01', name: 'Clínica Geral & Acolhimento', code: 'CG', description: 'Triagem e Avaliação Geral', icon: 'Stethoscope', color: '#2E9EFD', is_active: true, sort_order: 1 },
  { id: 'cardiologia', tenant_id: 'tenant-demo-01', name: 'Cardiologia & Check-up', code: 'CARD', description: 'Avaliação Cardiovascular', icon: 'Heart', color: '#2E9EFD', is_active: true, sort_order: 2 },
  { id: 'pediatria', tenant_id: 'tenant-demo-01', name: 'Pediatria & Puericultura', code: 'PED', description: 'Saúde Infantil e Bebês', icon: 'Baby', color: '#2E9EFD', is_active: true, sort_order: 3 },
  { id: 'ortopedia', tenant_id: 'tenant-demo-01', name: 'Ortopedia & Traumatologia', code: 'ORT', description: 'Ossos e Articulações', icon: 'Activity', color: '#2E9EFD', is_active: true, sort_order: 4 },
  { id: 'ginecologia', tenant_id: 'tenant-demo-01', name: 'Ginecologia & Obstetrícia', code: 'GIN', description: 'Saúde Feminina e Pré-Natal', icon: 'ShieldCheck', color: '#2E9EFD', is_active: true, sort_order: 5 },
  { id: 'dermatologia', tenant_id: 'tenant-demo-01', name: 'Dermatologia Clínica', code: 'DERM', description: 'Cuidados da Pele e Cabelos', icon: 'Sparkles', color: '#2E9EFD', is_active: true, sort_order: 6 },
  { id: 'exames_lab', tenant_id: 'tenant-demo-01', name: 'Diagnósticos & Coleta', code: 'LAB', description: 'Análises Clínicas e Sangue', icon: 'FlaskConical', color: '#2E9EFD', is_active: true, sort_order: 7 }
];

const DEFAULT_PRIORITIES = [
  { id: 'prio-especial', tenant_id: 'tenant-demo-01', name: 'Atendimento Especial (80+)', code: 'PE', description: 'Pacientes com 80 anos ou mais e emergências médicas', weight: 3, color: '#ef4444', is_active: true },
  { id: 'prio-preferencial', tenant_id: 'tenant-demo-01', name: 'Atendimento Prioritário', code: 'P', description: 'Idosos (60+), PCD, Gestantes, Lactantes e TEA (Lei 10.048)', weight: 2, color: '#f59e0b', is_active: true },
  { id: 'prio-normal', tenant_id: 'tenant-demo-01', name: 'Atendimento Convencional', code: 'N', description: 'Atendimento ambulatorial por ordem cronológica', weight: 1, color: '#2E9EFD', is_active: true }
];

const DEFAULT_COUNTERS = [
  { id: 'cnt-1', tenant_id: 'tenant-demo-01', name: 'Guichê 01', counter_type: 'guiche', status: 'LIVRE', auto_mode: true },
  { id: 'cnt-2', tenant_id: 'tenant-demo-01', name: 'Guichê 02', counter_type: 'guiche', status: 'LIVRE', auto_mode: true },
  { id: 'cnt-3', tenant_id: 'tenant-demo-01', name: 'Consultório 01', counter_type: 'consultorio', status: 'LIVRE', auto_mode: true },
  { id: 'cnt-4', tenant_id: 'tenant-demo-01', name: 'Consultório 02', counter_type: 'consultorio', status: 'LIVRE', auto_mode: true }
];

const DEFAULT_UNITS = [
  { id: 'unit-1', tenant_id: 'tenant-demo-01', name: 'Complexo Hospitalar Central', address: 'Av. Paulista, 1000', city: 'São Paulo - SP', is_active: true },
  { id: 'unit-2', tenant_id: 'tenant-demo-01', name: 'Unidade Ambulatorial Jardins', address: 'Rua Oscar Freire, 420', city: 'São Paulo - SP', is_active: true }
];

// ==============================================================================
// LOCAL STORAGE DATA LAYER (GARANTE FUNCIONAMENTO OFFLINE OU ANTES DO .ENV)
// ==============================================================================
function getStorage(key, defaultVal) {
  try {
    const raw = localStorage.getItem(`scaflow_${key}`);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function setStorage(key, val) {
  try {
    localStorage.setItem(`scaflow_${key}`, JSON.stringify(val));
    window.dispatchEvent(new CustomEvent(`scaflow_${key}_changed`, { detail: val }));
  } catch (e) {}
}

// Inicializa seed de dados locais se vazios
if (!localStorage.getItem('scaflow_tenants')) setStorage('tenants', [DEFAULT_TENANT]);
if (!localStorage.getItem('scaflow_users')) setStorage('users', DEFAULT_USERS);
if (!localStorage.getItem('scaflow_services')) setStorage('services', DEFAULT_SERVICES);
if (!localStorage.getItem('scaflow_priorities')) setStorage('priorities', DEFAULT_PRIORITIES);
if (!localStorage.getItem('scaflow_counters')) setStorage('counters', DEFAULT_COUNTERS);
if (!localStorage.getItem('scaflow_units')) setStorage('units', DEFAULT_UNITS);
if (!localStorage.getItem('scaflow_tickets')) setStorage('tickets', []);

// ==============================================================================
// SERVICE: CAMADA DE DADOS UNIFICADA E ESCALÁVEL
// ==============================================================================
export const saasService = {
  // --------------------------------------------------------------------------
  // AUTENTICAÇÃO E PERFIL
  // --------------------------------------------------------------------------
  async login(email, password) {
    // 1. Tenta Supabase Auth se configurado
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, tenants(*)')
          .eq('id', data.user.id)
          .single();
        return { user: profile, session: data.session };
      }
    }

    // 2. Fallback Local para desenvolvimento / teste
    const users = getStorage('users', DEFAULT_USERS);
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!found) {
      throw new Error('E-mail ou senha incorretos.');
    }

    const tenants = getStorage('tenants', [DEFAULT_TENANT]);
    const tenant = found.tenant_id ? tenants.find(t => t.id === found.tenant_id) : null;

    const userProfile = {
      ...found,
      tenant: tenant || null
    };

    localStorage.setItem('scaflow_current_user', JSON.stringify(userProfile));
    return { user: userProfile, session: { token: 'mock-session-token' } };
  },

  getCurrentUser() {
    return getStorage('current_user', null);
  },

  logout() {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut();
    }
    localStorage.removeItem('scaflow_current_user');
  },

  // --------------------------------------------------------------------------
  // GESTÃO MULTI-TENANT (SUPERADMIN)
  // --------------------------------------------------------------------------
  async listTenants() {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('tenants').select('*').order('created_at', { ascending: false });
      if (data) return data;
    }
    return getStorage('tenants', [DEFAULT_TENANT]);
  },

  async createTenant({ name, slug, plan = 'pro', adminName, adminEmail, adminPassword }) {
    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
    const maxCounters = plan === 'enterprise' ? 30 : plan === 'pro' ? 12 : 5;

    if (isSupabaseConfigured && supabase) {
      // 1. Cria o Tenant no Supabase com ID UUID gerado pelo PostgreSQL
      const { data: createdTenant, error: tenantErr } = await supabase
        .from('tenants')
        .insert({
          name,
          slug: cleanSlug,
          plan,
          status: 'active',
          primary_color: '#2E9EFD',
          max_counters: maxCounters
        })
        .select()
        .single();

      if (tenantErr) throw new Error(tenantErr.message);

      const tenantId = createdTenant.id;

      // 2. Cria a Unidade Principal do Cliente
      await supabase.from('units').insert({
        tenant_id: tenantId,
        name: `${name} - Unidade Principal`,
        address: 'Sede Principal'
      }).select();

      // 3. Clona as Prioridades Médicas Padrão (Lei 10.048)
      await supabase.from('priorities').insert([
        { tenant_id: tenantId, name: 'Atendimento Especial (80+)', code: 'PE', description: 'Pacientes com 80 anos ou mais e emergências médicas', weight: 3, color: '#ef4444', sort_order: 1 },
        { tenant_id: tenantId, name: 'Atendimento Prioritário', code: 'P', description: 'Idosos (60+), PCD, Gestantes, Lactantes e TEA (Lei 10.048)', weight: 2, color: '#f59e0b', sort_order: 2 },
        { tenant_id: tenantId, name: 'Atendimento Convencional', code: 'N', description: 'Atendimento ambulatorial por ordem cronológica', weight: 1, color: '#2E9EFD', sort_order: 3 }
      ]);

      // 4. Clona Especialidades Médicas Padrão
      await supabase.from('services').insert([
        { tenant_id: tenantId, name: 'Clínica Geral & Acolhimento', code: 'CG', description: 'Triagem e Avaliação Geral', icon: 'Stethoscope', color: '#2E9EFD', sort_order: 1 },
        { tenant_id: tenantId, name: 'Cardiologia & Check-up', code: 'CARD', description: 'Avaliação Cardiovascular', icon: 'Heart', color: '#2E9EFD', sort_order: 2 },
        { tenant_id: tenantId, name: 'Pediatria & Puericultura', code: 'PED', description: 'Saúde Infantil e Bebês', icon: 'Baby', color: '#2E9EFD', sort_order: 3 },
        { tenant_id: tenantId, name: 'Ortopedia & Traumatologia', code: 'ORT', description: 'Ossos e Articulações', icon: 'Activity', color: '#2E9EFD', sort_order: 4 },
        { tenant_id: tenantId, name: 'Ginecologia & Obstetrícia', code: 'GIN', description: 'Saúde Feminina e Pré-Natal', icon: 'ShieldCheck', color: '#2E9EFD', sort_order: 5 },
        { tenant_id: tenantId, name: 'Diagnósticos & Coleta', code: 'LAB', description: 'Análises Clínicas e Sangue', icon: 'FlaskConical', color: '#2E9EFD', sort_order: 6 }
      ]);

      // 5. Cria Guichês e Consultórios Iniciais
      await supabase.from('counters').insert([
        { tenant_id: tenantId, name: 'Guichê 01', counter_type: 'guiche', status: 'LIVRE', auto_mode: true },
        { tenant_id: tenantId, name: 'Guichê 02', counter_type: 'guiche', status: 'LIVRE', auto_mode: true },
        { tenant_id: tenantId, name: 'Consultório 01', counter_type: 'consultorio', status: 'LIVRE', auto_mode: true }
      ]);

      // 6. Cria Configuração de Impressora Padrão
      await supabase.from('printer_configs').insert({
        tenant_id: tenantId,
        enabled: true,
        paper_width: '80mm',
        model_name: 'Epson M352A (ESC/POS)',
        header_title: name,
        header_subtitle: 'Centro Integrado de Atendimento',
        unit_name: 'Unidade Principal',
        footer_message: 'Aguarde ser chamado no painel da sala de espera.',
        footer_sub_message: 'Tenha em mãos documento oficial com foto e carteirinha.',
        show_qr_code: true,
        print_method: 'native'
      });

      // 7. Cria Perfil do Gestor na tabela profiles
      await supabase.from('profiles').insert({
        tenant_id: tenantId,
        role: 'admin',
        name: adminName,
        email: adminEmail,
        position: 'Diretor / Gestor da Clínica',
        is_active: true
      });

      // 8. Tenta criar usuário no Auth do Supabase
      try {
        await supabase.auth.signUp({
          email: adminEmail,
          password: adminPassword,
          options: {
            data: {
              name: adminName,
              role: 'admin',
              tenant_id: tenantId
            }
          }
        });
      } catch (authErr) {
        console.warn('Supabase Auth signup notice:', authErr);
      }

      return createdTenant;
    }

    // Fallback Local
    const genLocalUuid = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
      return '00000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0');
    };

    const newTenant = {
      id: genLocalUuid(),
      name,
      slug: cleanSlug,
      plan,
      status: 'active',
      logo_url: null,
      primary_color: '#2E9EFD',
      max_counters: maxCounters,
      created_at: new Date().toISOString()
    };

    const tenants = getStorage('tenants', [DEFAULT_TENANT]);
    if (tenants.some(t => t.slug === cleanSlug)) {
      throw new Error(`O slug "${cleanSlug}" já está em uso por outro cliente.`);
    }

    tenants.push(newTenant);
    setStorage('tenants', tenants);

    const users = getStorage('users', DEFAULT_USERS);
    users.push({
      id: genLocalUuid(),
      tenant_id: newTenant.id,
      role: 'admin',
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      position: 'Gestor da Unidade'
    });
    setStorage('users', users);

    const priorities = getStorage('priorities', DEFAULT_PRIORITIES);
    DEFAULT_PRIORITIES.forEach(dp => {
      priorities.push({ ...dp, id: genLocalUuid(), tenant_id: newTenant.id });
    });
    setStorage('priorities', priorities);

    const services = getStorage('services', DEFAULT_SERVICES);
    DEFAULT_SERVICES.forEach(ds => {
      services.push({ ...ds, id: genLocalUuid(), tenant_id: newTenant.id });
    });
    setStorage('services', services);

    const counters = getStorage('counters', DEFAULT_COUNTERS);
    counters.push(
      { id: genLocalUuid(), tenant_id: newTenant.id, name: 'Guichê 01', counter_type: 'guiche', status: 'LIVRE', auto_mode: true },
      { id: genLocalUuid(), tenant_id: newTenant.id, name: 'Consultório 01', counter_type: 'consultorio', status: 'LIVRE', auto_mode: true }
    );
    setStorage('counters', counters);

    return newTenant;
  },

  async updateTenant(tenantId, updates) {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('tenants').update(updates).eq('id', tenantId).select().single();
      return data;
    }
    const tenants = getStorage('tenants', [DEFAULT_TENANT]);
    const idx = tenants.findIndex(t => t.id === tenantId);
    if (idx !== -1) {
      tenants[idx] = { ...tenants[idx], ...updates };
      setStorage('tenants', tenants);
      return tenants[idx];
    }
    return null;
  },

  // --------------------------------------------------------------------------
  // DADOS ESPECÍFICOS DO TENANT (CLÍNICA CLIENTE)
  // --------------------------------------------------------------------------
  async fetchServices(tenantId) {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('services').select('*').eq('tenant_id', tenantId).eq('is_active', true).order('sort_order');
      if (data) return data;
    }
    const all = getStorage('services', DEFAULT_SERVICES);
    return all.filter(s => s.tenant_id === tenantId && s.is_active !== false);
  },

  async saveService(tenantId, service) {
    if (isSupabaseConfigured && supabase) {
      if (service.id && !service.id.startsWith('temp_')) {
        const { data } = await supabase.from('services').update(service).eq('id', service.id).select().single();
        return data;
      } else {
        const { data } = await supabase.from('services').insert({ ...service, tenant_id: tenantId }).select().single();
        return data;
      }
    }
    const services = getStorage('services', DEFAULT_SERVICES);
    if (service.id) {
      const idx = services.findIndex(s => s.id === service.id);
      if (idx !== -1) {
        services[idx] = { ...services[idx], ...service };
        setStorage('services', services);
        return services[idx];
      }
    }
    const newService = {
      id: `srv_${Date.now()}`,
      tenant_id: tenantId,
      ...service,
      is_active: true
    };
    services.push(newService);
    setStorage('services', services);
    return newService;
  },

  async deleteService(tenantId, serviceId) {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('services').delete().eq('id', serviceId).eq('tenant_id', tenantId);
      return;
    }
    let services = getStorage('services', DEFAULT_SERVICES);
    services = services.filter(s => !(s.id === serviceId && s.tenant_id === tenantId));
    setStorage('services', services);
  },

  async fetchPriorities(tenantId) {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('priorities').select('*').eq('tenant_id', tenantId).order('weight', { ascending: false });
      if (data) return data;
    }
    const all = getStorage('priorities', DEFAULT_PRIORITIES);
    return all.filter(p => p.tenant_id === tenantId);
  },

  async fetchCounters(tenantId) {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('counters').select('*').eq('tenant_id', tenantId);
      if (data) return data;
    }
    const all = getStorage('counters', DEFAULT_COUNTERS);
    return all.filter(c => c.tenant_id === tenantId);
  },

  async saveCounter(tenantId, counter) {
    if (isSupabaseConfigured && supabase) {
      if (counter.id && !counter.id.startsWith('temp_')) {
        const { data } = await supabase.from('counters').update(counter).eq('id', counter.id).select().single();
        return data;
      } else {
        const { data } = await supabase.from('counters').insert({ ...counter, tenant_id: tenantId }).select().single();
        return data;
      }
    }
    const counters = getStorage('counters', DEFAULT_COUNTERS);
    if (counter.id) {
      const idx = counters.findIndex(c => c.id === counter.id);
      if (idx !== -1) {
        counters[idx] = { ...counters[idx], ...counter };
        setStorage('counters', counters);
        return counters[idx];
      }
    }
    const newCounter = {
      id: `cnt_${Date.now()}`,
      tenant_id: tenantId,
      status: 'LIVRE',
      auto_mode: true,
      ...counter
    };
    counters.push(newCounter);
    setStorage('counters', counters);
    return newCounter;
  },

  async deleteCounter(tenantId, counterId) {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('counters').delete().eq('id', counterId).eq('tenant_id', tenantId);
      return;
    }
    let counters = getStorage('counters', DEFAULT_COUNTERS);
    counters = counters.filter(c => !(c.id === counterId && c.tenant_id === tenantId));
    setStorage('counters', counters);
  },

  async fetchUnits(tenantId) {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('units').select('*').eq('tenant_id', tenantId);
      if (data) return data;
    }
    const all = getStorage('units', DEFAULT_UNITS);
    return all.filter(u => u.tenant_id === tenantId);
  },

  async saveUnit(tenantId, unit) {
    if (isSupabaseConfigured && supabase) {
      if (unit.id && !unit.id.startsWith('temp_')) {
        const { data } = await supabase.from('units').update(unit).eq('id', unit.id).select().single();
        return data;
      } else {
        const { data } = await supabase.from('units').insert({ ...unit, tenant_id: tenantId }).select().single();
        return data;
      }
    }
    const units = getStorage('units', DEFAULT_UNITS);
    if (unit.id) {
      const idx = units.findIndex(u => u.id === unit.id);
      if (idx !== -1) {
        units[idx] = { ...units[idx], ...unit };
        setStorage('units', units);
        return units[idx];
      }
    }
    const newUnit = {
      id: `unit_${Date.now()}`,
      tenant_id: tenantId,
      ...unit
    };
    units.push(newUnit);
    setStorage('units', units);
    return newUnit;
  },

  async fetchUsers(tenantId) {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('profiles').select('*').eq('tenant_id', tenantId);
      if (data) return data;
    }
    const all = getStorage('users', DEFAULT_USERS);
    return all.filter(u => u.tenant_id === tenantId && u.role !== 'superadmin');
  },

  async saveUser(tenantId, userData) {
    const users = getStorage('users', DEFAULT_USERS);
    if (userData.id) {
      const idx = users.findIndex(u => u.id === userData.id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...userData };
        setStorage('users', users);
        return users[idx];
      }
    }
    const newUser = {
      id: `usr_${Date.now()}`,
      tenant_id: tenantId,
      role: 'atendente',
      ...userData
    };
    users.push(newUser);
    setStorage('users', users);
    return newUser;
  },

  async deleteUser(tenantId, userId) {
    let users = getStorage('users', DEFAULT_USERS);
    users = users.filter(u => !(u.id === userId && u.tenant_id === tenantId));
    setStorage('users', users);
  },

  // --------------------------------------------------------------------------
  // TICKETS / FILA / ATENDIMENTO EM TEMPO REAL
  // --------------------------------------------------------------------------
  async fetchTickets(tenantId) {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('tickets')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      if (data) return data.map(t => this.normalizeTicket(t));
    }
    const all = getStorage('tickets', []);
    return all.filter(t => t.tenant_id === tenantId).map(t => this.normalizeTicket(t));
  },

  async createTicket(tenantId, { serviceId, priorityId, unitId }) {
    // 1. Tenta RPC atômica no Supabase
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc('create_ticket', {
        p_tenant_id: tenantId,
        p_service_id: serviceId,
        p_priority_id: priorityId,
        p_unit_id: unitId || null
      });
      if (!error && data) return this.normalizeTicket(data);
    }

    // 2. Fallback Local Atômico
    const services = await this.fetchServices(tenantId);
    const priorities = await this.fetchPriorities(tenantId);

    const srv = services.find(s => s.id === serviceId) || services[0] || { name: 'Atendimento', code: 'AT' };
    const prio = priorities.find(p => p.id === priorityId) || priorities[0] || { name: 'Convencional', code: 'N', color: '#2E9EFD' };

    const tickets = getStorage('tickets', []);
    
    // Conta senhas de hoje desta prioridade
    const today = new Date().toDateString();
    const todayCount = tickets.filter(t => 
      t.tenant_id === tenantId && 
      t.priority_id === prio.id && 
      new Date(t.created_at || t.createdAt).toDateString() === today
    ).length;

    const num = String(todayCount + 1).padStart(3, '0');
    const code = `${prio.code}${num}`;

    const newTicket = this.normalizeTicket({
      id: `tkt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      tenant_id: tenantId,
      unit_id: unitId || null,
      service_id: srv.id,
      priority_id: prio.id,
      code,
      codigo: code,
      service_name: srv.name,
      servicoNome: srv.name,
      priority_name: prio.name,
      prioridadeNome: prio.name,
      priority_color: prio.color || '#2E9EFD',
      prioridadeCor: prio.color || '#2E9EFD',
      status: 'WAITING',
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });

    tickets.unshift(newTicket);
    setStorage('tickets', tickets);
    return newTicket;
  },

  normalizeTicket(t) {
    if (!t) return null;
    const code = t.code || t.codigo || 'A001';
    const srvName = t.service_name || t.servicoNome || 'Atendimento Geral';
    const prioName = t.priority_name || t.prioridadeNome || 'Convencional';
    const prioColor = t.priority_color || t.prioridadeCor || '#2E9EFD';
    const created = t.created_at || t.createdAt || new Date().toISOString();
    const counter = t.counter_name || t.guiche || 'Guichê 01';

    return {
      ...t,
      code,
      codigo: code,
      service_name: srvName,
      servicoNome: srvName,
      priority_name: prioName,
      prioridadeNome: prioName,
      priority_color: prioColor,
      prioridadeCor: prioColor,
      created_at: created,
      createdAt: created,
      counter_name: counter,
      guiche: counter
    };
  },

  async callNextTicket(tenantId, { attendantId, attendantName, counterName, serviceId }) {
    const tickets = getStorage('tickets', []);
    const waiting = tickets
      .filter(t => t.tenant_id === tenantId && t.status === 'WAITING' && (!serviceId || t.service_id === serviceId))
      .sort((a, b) => new Date(a.created_at || a.createdAt) - new Date(b.created_at || b.createdAt));

    if (waiting.length === 0) return null;

    const ticket = waiting[0];
    ticket.status = 'CALLED';
    ticket.called_at = new Date().toISOString();
    ticket.calledAt = ticket.called_at;
    ticket.attendant_id = attendantId;
    ticket.attendant_name = attendantName;
    ticket.counter_name = counterName;
    ticket.guiche = counterName;

    const normalized = this.normalizeTicket(ticket);
    setStorage('tickets', tickets);
    setStorage('last_called_ticket', normalized);

    return normalized;
  },

  async recallTicket(tenantId, ticketId) {
    const tickets = getStorage('tickets', []);
    const ticket = tickets.find(t => t.id === ticketId && t.tenant_id === tenantId);
    if (ticket) {
      ticket.called_at = new Date().toISOString();
      ticket.calledAt = ticket.called_at;
      const normalized = this.normalizeTicket(ticket);
      setStorage('tickets', tickets);
      setStorage('last_called_ticket', normalized);
      return normalized;
    }
    return null;
  },

  async finishTicket(tenantId, ticketId) {
    const tickets = getStorage('tickets', []);
    const ticket = tickets.find(t => t.id === ticketId && t.tenant_id === tenantId);
    if (ticket) {
      ticket.status = 'FINISHED';
      ticket.finished_at = new Date().toISOString();
      ticket.finishedAt = ticket.finished_at;
      setStorage('tickets', tickets);
      return this.normalizeTicket(ticket);
    }
    return null;
  },

  async noShowTicket(tenantId, ticketId) {
    const tickets = getStorage('tickets', []);
    const ticket = tickets.find(t => t.id === ticketId && t.tenant_id === tenantId);
    if (ticket) {
      ticket.status = 'NO_SHOW';
      ticket.finished_at = new Date().toISOString();
      ticket.finishedAt = ticket.finished_at;
      setStorage('tickets', tickets);
      return this.normalizeTicket(ticket);
    }
    return null;
  },

  // --------------------------------------------------------------------------
  // CONFIGURAÇÃO DA IMPRESSORA TÉRMICA (POR TENANT)
  // --------------------------------------------------------------------------
  getPrinterConfig(tenantId) {
    const all = getStorage('printer_configs', {});
    return all[tenantId] || {
      enabled: true,
      paperWidth: '80mm',
      modelName: 'Epson M352A (ESC/POS)',
      headerTitle: 'ScaFlow',
      headerSubtitle: 'Centro Integrado de Atendimento',
      unitName: 'Complexo Hospitalar Central',
      footerMessage: 'Aguarde ser chamado no painel da sala de espera.',
      footerSubMessage: 'Tenha em mãos documento oficial com foto e carteirinha.',
      showQrCode: true,
      qrCodeUrl: 'https://scaflow.med.br/fila/',
      showDateTime: true,
      showSpecialty: true,
      showPriority: true,
      fontSize: 'normal',
      ticketNumberSize: 'xlarge',
      cutPaper: true,
      printMethod: 'native'
    };
  },

  savePrinterConfig(tenantId, config) {
    const all = getStorage('printer_configs', {});
    all[tenantId] = { ...this.getPrinterConfig(tenantId), ...config };
    setStorage('printer_configs', all);
    return all[tenantId];
  },

  // --------------------------------------------------------------------------
  // SUBSCRIÇÃO EM TEMPO REAL
  // --------------------------------------------------------------------------
  subscribeToChanges(tenantId, callback) {
    // Escuta evento local imediato
    const handler = () => {
      callback({ timestamp: Date.now() });
    };

    window.addEventListener('scaflow_tickets_changed', handler);
    window.addEventListener('scaflow_counters_changed', handler);
    window.addEventListener('scaflow_services_changed', handler);

    // Se Supabase Realtime estiver ativo
    let channel = null;
    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel(`tenant_${tenantId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets', filter: `tenant_id=eq.${tenantId}` }, callback)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'counters', filter: `tenant_id=eq.${tenantId}` }, callback)
        .subscribe();
    }

    return () => {
      window.removeEventListener('scaflow_tickets_changed', handler);
      window.removeEventListener('scaflow_counters_changed', handler);
      window.removeEventListener('scaflow_services_changed', handler);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }
};
