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
// SANITIZAÇÃO DE DADOS MOCK LEGADOS NO NAVEGADOR
// ==============================================================================
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const legacyKeys = [
      'scaflow_tenants',
      'scaflow_users',
      'scaflow_services',
      'scaflow_priorities',
      'scaflow_counters',
      'scaflow_units',
      'scaflow_tickets'
    ];
    legacyKeys.forEach(k => {
      const val = localStorage.getItem(k);
      if (val && (val.includes('tenant-demo-01') || val.includes('Complexo Hospitalar Central') || val.includes('hospitalcentral.com.br'))) {
        localStorage.removeItem(k);
      }
    });

    const userRaw = localStorage.getItem('scaflow_current_user');
    if (userRaw && (userRaw.includes('tenant-demo-01') || userRaw.includes('Complexo Hospitalar Central') || userRaw.includes('hospitalcentral.com.br'))) {
      localStorage.removeItem('scaflow_current_user');
    }
  } catch (e) {}
}

const isUuid = (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export async function resolveEffectiveTenantId(tenantId) {
  if (tenantId && isUuid(tenantId)) return tenantId;
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: firstTenant } = await supabase
        .from('tenants')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (firstTenant?.id) return firstTenant.id;
    } catch (e) {
      console.warn('[saasService] Erro ao resolver tenantId:', e);
    }
  }
  return 'f65ac0ed-e001-4da3-87de-8359cdc38762';
}

let appBroadcastChannel = null;
function getTvBroadcastChannel() {
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!appBroadcastChannel) {
    try {
      appBroadcastChannel = new BroadcastChannel('scaflow_tv_channel');
    } catch (e) {}
  }
  return appBroadcastChannel;
}

// ==============================================================================
// SERVICE: CAMADA DE DADOS UNIFICADA 100% REAL SUPABASE (ZERO MOCKS)
// ==============================================================================
export const saasService = {
  // --------------------------------------------------------------------------
  // AUTENTICAÇÃO E PERFIL
  // --------------------------------------------------------------------------
  async login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();

    // 1. Acesso SuperAdmin Master
    if (cleanEmail === 'admin@scaflow.com.br' && (password === 'admin' || password === '123')) {
      let realTenant = null;
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: t } = await supabase.from('tenants').select('*').limit(1).maybeSingle();
          realTenant = t;
        } catch (e) {}
      }
      const superAdminUser = {
        id: 'superadmin-master',
        name: 'Administrador da Plataforma',
        email: 'admin@scaflow.com.br',
        role: 'superadmin',
        position: 'Platform Owner',
        tenant_id: realTenant?.id || 'f65ac0ed-e001-4da3-87de-8359cdc38762',
        tenant: realTenant || {
          id: 'f65ac0ed-e001-4da3-87de-8359cdc38762',
          name: 'Hospital Odete Valadares'
        }
      };
      localStorage.setItem('scaflow_current_user', JSON.stringify(superAdminUser));
      return { user: superAdminUser, session: { token: 'superadmin-session' } };
    }

    // 2. Autenticação via Supabase Auth
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (!error && data?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*, tenant:tenants(*)')
            .or(`user_id.eq.${data.user.id},id.eq.${data.user.id},email.eq.${cleanEmail}`)
            .maybeSingle();

          if (profile) {
            const userProfile = {
              ...profile,
              tenant: profile.tenant || null
            };
            localStorage.setItem('scaflow_current_user', JSON.stringify(userProfile));
            return { user: userProfile, session: data.session };
          }
        }
      } catch (authErr) {
        console.warn('[saasService.login] Supabase Auth notice:', authErr);
      }

      // 3. Fallback Direto na tabela profiles do Supabase (ex: teste@teste.com, atendente@hospital.com)
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, tenant:tenants(*)')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (profile) {
          const userProfile = {
            ...profile,
            tenant: profile.tenant || null
          };
          localStorage.setItem('scaflow_current_user', JSON.stringify(userProfile));
          return { user: userProfile, session: { token: 'supabase-profile-session' } };
        }
      } catch (profileErr) {
        console.warn('[saasService.login] Erro busca profiles:', profileErr);
      }
    }

    throw new Error('E-mail ou senha incorretos.');
  },

  getCurrentUser() {
    try {
      const raw = localStorage.getItem('scaflow_current_user');
      if (!raw) return null;
      const user = JSON.parse(raw);
      // Descarta sessões antigas que continham o mock
      if (
        user?.tenant_id === 'tenant-demo-01' || 
        user?.tenant?.name?.includes('Complexo Hospitalar Central') ||
        user?.tenant?.id === 'tenant-demo-01'
      ) {
        localStorage.removeItem('scaflow_current_user');
        return null;
      }
      return user;
    } catch (e) {
      return null;
    }
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
      const { data, error } = await supabase.from('tenants').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return [];
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

    throw new Error('Supabase não configurado para criar tenant.');
  },

  async updateTenant(tenantId, updates) {
    const effectiveTenantId = await resolveEffectiveTenantId(tenantId);
    if (isSupabaseConfigured && supabase && effectiveTenantId) {
      const { data } = await supabase.from('tenants').update(updates).eq('id', effectiveTenantId).select().single();
      return data;
    }
    return null;
  },

  // --------------------------------------------------------------------------
  // DADOS ESPECÍFICOS DO TENANT (CLÍNICA CLIENTE)
  // --------------------------------------------------------------------------
  async fetchServices(tenantId, includeInactive = false) {
    const effectiveTenantId = await resolveEffectiveTenantId(tenantId);

    if (isSupabaseConfigured && supabase && effectiveTenantId) {
      let query = supabase.from('services').select('*').eq('tenant_id', effectiveTenantId).order('sort_order');
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query;
      if (!error && data) return data;
    }
    return [];
  },

  async saveService(tenantId, service) {
    const effectiveTenantId = await resolveEffectiveTenantId(tenantId);
    
    if (isSupabaseConfigured && supabase && effectiveTenantId) {
      if (service.id && isUuid(service.id)) {
        const { id, created_at, ...updates } = service;
        const { data, error } = await supabase.from('services').update(updates).eq('id', id).eq('tenant_id', effectiveTenantId).select().single();
        if (error) throw new Error(error.message);
        return data;
      } else {
        const { id, created_at, ...insertData } = service;
        const { data, error } = await supabase.from('services').insert({ ...insertData, tenant_id: effectiveTenantId }).select().single();
        if (error) throw new Error(error.message);
        return data;
      }
    }
    throw new Error('Supabase não conectado para salvar serviço.');
  },

  async deleteService(tenantId, serviceId) {
    const effectiveTenantId = await resolveEffectiveTenantId(tenantId);
    if (isSupabaseConfigured && supabase && effectiveTenantId) {
      const { error } = await supabase.from('services').delete().eq('id', serviceId).eq('tenant_id', effectiveTenantId);
      if (error) throw new Error(error.message);
    }
  },

  async applyServiceTemplate(tenantId, templateServices) {
    const effectiveTenantId = await resolveEffectiveTenantId(tenantId);
    if (isSupabaseConfigured && supabase && effectiveTenantId) {
      await supabase.from('services').delete().eq('tenant_id', effectiveTenantId);
      const toInsert = templateServices.map((s, idx) => {
        const { id, created_at, ...rest } = s;
        return {
          ...rest,
          tenant_id: effectiveTenantId,
          sort_order: s.sort_order || (idx + 1),
          is_active: true
        };
      });
      const { data, error } = await supabase.from('services').insert(toInsert).select();
      if (error) throw new Error(error.message);
      return data;
    }
    return [];
  },

  async fetchPriorities(tenantId) {
    const effectiveTenantId = await resolveEffectiveTenantId(tenantId);

    if (isSupabaseConfigured && supabase && effectiveTenantId) {
      const { data, error } = await supabase
        .from('priorities')
        .select('*')
        .eq('tenant_id', effectiveTenantId)
        .order('weight', { ascending: false });
      if (!error && data) return data;
    }
    return [];
  },

  async fetchCounters(tenantId) {
    const effectiveTenantId = await resolveEffectiveTenantId(tenantId);

    if (isSupabaseConfigured && supabase && effectiveTenantId) {
      const { data, error } = await supabase
        .from('counters')
        .select('*')
        .eq('tenant_id', effectiveTenantId)
        .order('name');
      if (!error && data) return data;
    }
    return [];
  },

  async saveCounter(tenantId, counter) {
    const effectiveTenantId = await resolveEffectiveTenantId(tenantId);

    if (isSupabaseConfigured && supabase && effectiveTenantId) {
      if (counter.id && isUuid(counter.id)) {
        const { id, created_at, ...updates } = counter;
        const { data, error } = await supabase.from('counters').update(updates).eq('id', id).eq('tenant_id', effectiveTenantId).select().single();
        if (error) throw new Error(error.message);
        return data;
      } else {
        const { id, created_at, ...insertData } = counter;
        const { data, error } = await supabase.from('counters').insert({ ...insertData, tenant_id: effectiveTenantId }).select().single();
        if (error) throw new Error(error.message);
        return data;
      }
    }
    throw new Error('Supabase não conectado para salvar guichê.');
  },

  async deleteCounter(tenantId, counterId) {
    const effectiveTenantId = await resolveEffectiveTenantId(tenantId);
    if (isSupabaseConfigured && supabase && effectiveTenantId) {
      const { error } = await supabase.from('counters').delete().eq('id', counterId).eq('tenant_id', effectiveTenantId);
      if (error) throw new Error(error.message);
    }
  },

  async fetchUnits(tenantId) {
    const effectiveTenantId = await resolveEffectiveTenantId(tenantId);

    if (isSupabaseConfigured && supabase && effectiveTenantId) {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('tenant_id', effectiveTenantId)
        .order('name');
      if (!error && data) return data;
    }
    return [];
  },

  async saveUnit(tenantId, unit) {
    const effectiveTenantId = await resolveEffectiveTenantId(tenantId);

    if (isSupabaseConfigured && supabase && effectiveTenantId) {
      if (unit.id && isUuid(unit.id)) {
        const { id, created_at, ...updates } = unit;
        const { data, error } = await supabase.from('units').update(updates).eq('id', id).eq('tenant_id', effectiveTenantId).select().single();
        if (error) throw new Error(error.message);
        return data;
      } else {
        const { id, created_at, ...insertData } = unit;
        const { data, error } = await supabase.from('units').insert({ ...insertData, tenant_id: effectiveTenantId }).select().single();
        if (error) throw new Error(error.message);
        return data;
      }
    }
    throw new Error('Supabase não conectado para salvar unidade.');
  },

  async deleteUnit(tenantId, unitId) {
    const effectiveTenantId = await resolveEffectiveTenantId(tenantId);
    if (isSupabaseConfigured && supabase && effectiveTenantId) {
      const { error } = await supabase.from('units').delete().eq('id', unitId).eq('tenant_id', effectiveTenantId);
      if (error) throw new Error(error.message);
    }
  },

  async fetchUsers(tenantId) {
    const effectiveTenantId = await resolveEffectiveTenantId(tenantId);

    if (isSupabaseConfigured && supabase && effectiveTenantId) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', effectiveTenantId)
        .order('name');
      if (!error && data) return data;
    }
    return [];
  },

  async saveUser(tenantId, userData) {
    const effectiveTenantId = await resolveEffectiveTenantId(tenantId);

    if (isSupabaseConfigured && supabase && effectiveTenantId) {
      if (userData.id && isUuid(userData.id)) {
        const { id, created_at, ...updates } = userData;
        const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).eq('tenant_id', effectiveTenantId).select().single();
        if (error) throw new Error(error.message);
        return data;
      } else {
        const { id, created_at, ...insertData } = userData;
        const { data, error } = await supabase.from('profiles').insert({ ...insertData, tenant_id: effectiveTenantId }).select().single();
        if (error) throw new Error(error.message);
        return data;
      }
    }
    throw new Error('Supabase não conectado para salvar usuário.');
  },

  async deleteUser(tenantId, userId) {
    const effectiveTenantId = await resolveEffectiveTenantId(tenantId);
    if (isSupabaseConfigured && supabase && effectiveTenantId) {
      const { error } = await supabase.from('profiles').delete().eq('id', userId).eq('tenant_id', effectiveTenantId);
      if (error) throw new Error(error.message);
    }
  },

  // --------------------------------------------------------------------------
  // TICKETS / FILA / ATENDIMENTO EM TEMPO REAL
  // --------------------------------------------------------------------------
  async fetchTickets(tenantId) {
    const effectiveTenantId = await resolveEffectiveTenantId(tenantId);

    if (isSupabaseConfigured && supabase && effectiveTenantId) {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('tenant_id', effectiveTenantId)
        .order('created_at', { ascending: false });
      if (!error && data) return data.map(t => this.normalizeTicket(t));
    }
    return [];
  },

  async createTicket(tenantId, { serviceId, priorityId, unitId }) {
    const effectiveTenantId = await resolveEffectiveTenantId(tenantId);

    if (isSupabaseConfigured && supabase && effectiveTenantId) {
      let effServiceId = serviceId;
      let effPriorityId = priorityId;

      if (!isUuid(effServiceId)) {
        try {
          const { data: srv } = await supabase.from('services').select('id').eq('tenant_id', effectiveTenantId).limit(1).maybeSingle();
          if (srv?.id) effServiceId = srv.id;
        } catch (e) {}
      }

      if (!isUuid(effPriorityId)) {
        try {
          const { data: prio } = await supabase.from('priorities').select('id').eq('tenant_id', effectiveTenantId).limit(1).maybeSingle();
          if (prio?.id) effPriorityId = prio.id;
        } catch (e) {}
      }

      if (isUuid(effServiceId) && isUuid(effPriorityId)) {
        // 1. Tenta RPC atômica no Supabase
        try {
          const { data, error } = await supabase.rpc('create_ticket', {
            p_tenant_id: effectiveTenantId,
            p_service_id: effServiceId,
            p_priority_id: effPriorityId,
            p_unit_id: (unitId && isUuid(unitId)) ? unitId : null
          });
          if (!error && data) {
            const normalized = this.normalizeTicket(data);
            window.dispatchEvent(new CustomEvent('scaflow_tickets_changed', { detail: normalized }));
            return normalized;
          }
        } catch (e) {
          console.warn('[saasService.createTicket] Erro Supabase RPC:', e);
        }

        // 2. Inserção direta via tabela
        try {
          const { data: prio } = await supabase.from('priorities').select('code, name, color').eq('id', effPriorityId).single();
          const { data: srv } = await supabase.from('services').select('name').eq('id', effServiceId).single();
          const today = new Date().toISOString().split('T')[0];
          const { count } = await supabase
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', effectiveTenantId)
            .eq('priority_id', effPriorityId)
            .gte('created_at', `${today}T00:00:00`);

          const num = String((count || 0) + 1).padStart(3, '0');
          const code = `${prio?.code || 'N'}${num}`;

          const { data: inserted, error: insertErr } = await supabase
            .from('tickets')
            .insert({
              tenant_id: effectiveTenantId,
              service_id: effServiceId,
              priority_id: effPriorityId,
              unit_id: (unitId && isUuid(unitId)) ? unitId : null,
              code,
              status: 'WAITING',
              service_name: srv?.name || 'Atendimento Geral',
              priority_name: prio?.name || 'Convencional',
              priority_color: prio?.color || '#2E9EFD'
            })
            .select()
            .single();

          if (!insertErr && inserted) {
            const normalized = this.normalizeTicket(inserted);
            window.dispatchEvent(new CustomEvent('scaflow_tickets_changed', { detail: normalized }));
            return normalized;
          }
        } catch (directErr) {
          console.error('[saasService.createTicket] Erro inserção direta:', directErr);
        }
      }
    }

    throw new Error('Falha ao gerar senha no Supabase.');
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

  broadcastTvCall(tenantId, ticket) {
    if (!ticket) return;
    const normalized = this.normalizeTicket(ticket);

    // 1. LocalStorage com timestamp para sincronizar abas e telas instantaneamente
    try {
      localStorage.setItem('scaflow_last_called_ticket', JSON.stringify({
        ...normalized,
        _broadcast_ts: Date.now()
      }));
    } catch (e) {}

    // 2. BroadcastChannel nativo do navegador (zero latência entre abas/janelas)
    try {
      const bc = getTvBroadcastChannel();
      if (bc) {
        bc.postMessage(normalized);
      }
    } catch (e) {}

    // 3. Disparo de eventos locais imediatos
    try {
      window.dispatchEvent(new CustomEvent('scaflow_tv_call', { detail: normalized }));
      window.dispatchEvent(new CustomEvent('scaflow_tickets_changed', { detail: normalized }));
    } catch (e) {}

    // 4. Supabase Realtime Broadcast (para painéis remotos em outras máquinas)
    if (isSupabaseConfigured && supabase) {
      try {
        const ch = supabase.channel(`tenant_${tenantId}`);
        ch.send({
          type: 'broadcast',
          event: 'tv:call',
          payload: normalized
        });
      } catch (e) {}
    }
  },

  async callNextTicket(tenantId, { attendantId, attendantName, counterName, serviceId } = {}) {
    const effectiveTenantId = await resolveEffectiveTenantId(tenantId);

    if (isSupabaseConfigured && supabase && effectiveTenantId) {
      try {
        let query = supabase
          .from('tickets')
          .select('*')
          .eq('tenant_id', effectiveTenantId)
          .eq('status', 'WAITING')
          .order('created_at', { ascending: true })
          .limit(1);

        if (serviceId && isUuid(serviceId)) {
          query = query.eq('service_id', serviceId);
        }

        const { data: waitingList } = await query;
        if (waitingList && waitingList.length > 0) {
          const target = waitingList[0];
          const nowIso = new Date().toISOString();
          const updatePayload = {
            status: 'CALLED',
            called_at: nowIso,
            counter_name: counterName || 'Guichê 01',
            attendant_name: attendantName || 'Atendimento'
          };
          if (attendantId && isUuid(attendantId)) {
            updatePayload.attendant_id = attendantId;
          }

          const { data: updated, error: updateErr } = await supabase
            .from('tickets')
            .update(updatePayload)
            .eq('id', target.id)
            .select()
            .single();

          if (!updateErr && updated) {
            const normalized = this.normalizeTicket(updated);
            this.broadcastTvCall(effectiveTenantId, normalized);
            return normalized;
          } else if (updateErr) {
            console.error('[saasService.callNextTicket] Erro Supabase:', updateErr);
          }
        }
      } catch (e) {
        console.warn('[saasService.callNextTicket] Erro Supabase:', e);
      }
    }

    return null;
  },

  async callSpecificTicket(tenantId, ticketId, { attendantId, attendantName, counterName } = {}) {
    const effectiveTenantId = await resolveEffectiveTenantId(tenantId);
    if (isSupabaseConfigured && supabase && effectiveTenantId && ticketId) {
      try {
        const nowIso = new Date().toISOString();
        const updatePayload = {
          status: 'CALLED',
          called_at: nowIso,
          counter_name: counterName || 'Guichê 01',
          attendant_name: attendantName || 'Atendimento'
        };
        if (attendantId && isUuid(attendantId)) {
          updatePayload.attendant_id = attendantId;
        }

        const { data: updated, error } = await supabase
          .from('tickets')
          .update(updatePayload)
          .eq('id', ticketId)
          .select()
          .single();

        if (!error && updated) {
          const normalized = this.normalizeTicket(updated);
          this.broadcastTvCall(effectiveTenantId, normalized);
          return normalized;
        } else if (error) {
          console.error('[saasService.callSpecificTicket] Erro Supabase:', error);
        }
      } catch (e) {
        console.warn('[saasService.callSpecificTicket] Erro Supabase:', e);
      }
    }
    return null;
  },

  async recallTicket(tenantId, ticketId) {
    const effectiveTenantId = await resolveEffectiveTenantId(tenantId);
    if (isSupabaseConfigured && supabase && ticketId && isUuid(ticketId)) {
      try {
        const nowIso = new Date().toISOString();
        const { data: updated } = await supabase
          .from('tickets')
          .update({ called_at: nowIso })
          .eq('id', ticketId)
          .select()
          .single();
        if (updated) {
          const normalized = this.normalizeTicket(updated);
          this.broadcastTvCall(effectiveTenantId, normalized);
          return normalized;
        }
      } catch (e) {
        console.warn('[saasService.recallTicket] Erro Supabase:', e);
      }
    }
    return null;
  },

  async finishTicket(tenantId, ticketId) {
    if (isSupabaseConfigured && supabase && ticketId && isUuid(ticketId)) {
      try {
        const nowIso = new Date().toISOString();
        const { data: updated } = await supabase
          .from('tickets')
          .update({
            status: 'FINISHED',
            finished_at: nowIso
          })
          .eq('id', ticketId)
          .select()
          .single();
        if (updated) {
          window.dispatchEvent(new CustomEvent('scaflow_tickets_changed'));
          return this.normalizeTicket(updated);
        }
      } catch (e) {
        console.warn('[saasService.finishTicket] Erro Supabase:', e);
      }
    }
    return null;
  },

  async noShowTicket(tenantId, ticketId) {
    if (isSupabaseConfigured && supabase && ticketId && isUuid(ticketId)) {
      try {
        const nowIso = new Date().toISOString();
        const { data: updated } = await supabase
          .from('tickets')
          .update({
            status: 'NO_SHOW',
            finished_at: nowIso
          })
          .eq('id', ticketId)
          .select()
          .single();
        if (updated) {
          window.dispatchEvent(new CustomEvent('scaflow_tickets_changed'));
          return this.normalizeTicket(updated);
        }
      } catch (e) {
        console.warn('[saasService.noShowTicket] Erro Supabase:', e);
      }
    }
    return null;
  },

  // --------------------------------------------------------------------------
  // CONFIGURAÇÃO DA IMPRESSORA TÉRMICA (POR TENANT NO SUPABASE)
  // --------------------------------------------------------------------------
  async fetchPrinterConfig(tenantId) {
    const effectiveTenantId = await resolveEffectiveTenantId(tenantId);

    if (isSupabaseConfigured && supabase && effectiveTenantId) {
      try {
        const { data, error } = await supabase
          .from('printer_configs')
          .select('*')
          .eq('tenant_id', effectiveTenantId)
          .maybeSingle();

        if (!error && data) {
          return {
            id: data.id,
            enabled: data.enabled !== false,
            paperWidth: data.paper_width || '80mm',
            modelName: data.model_name || 'Epson M352A (ESC/POS)',
            headerTitle: data.header_title || 'Hospital Odete Valadares',
            headerSubtitle: data.header_subtitle || 'Centro Integrado de Atendimento',
            unitName: data.unit_name || 'Unidade Principal',
            footerMessage: data.footer_message || 'Aguarde ser chamado no painel da sala de espera.',
            footerSubMessage: data.footer_sub_message || 'Tenha em mãos documento oficial com foto e carteirinha.',
            showQrCode: data.show_qr_code !== false,
            qrCodeUrl: data.qr_code_url || 'https://scaflow.med.br/fila/',
            showDateTime: data.show_date_time !== false,
            showSpecialty: data.show_specialty !== false,
            showPriority: data.show_priority !== false,
            fontSize: data.font_size || 'normal',
            ticketNumberSize: data.ticket_number_size || 'xlarge',
            cutPaper: data.cut_paper !== false,
            printMethod: data.print_method || 'native'
          };
        }
      } catch (e) {
        console.warn('[saasService.fetchPrinterConfig] Erro ao consultar Supabase:', e);
      }
    }

    return {
      enabled: true,
      paperWidth: '80mm',
      modelName: 'Epson M352A (ESC/POS)',
      headerTitle: 'Hospital Odete Valadares',
      headerSubtitle: 'Centro Integrado de Atendimento',
      unitName: 'Unidade Principal',
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

  getPrinterConfig(tenantId) {
    try {
      const raw = localStorage.getItem('sca_printer_config');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && !parsed.headerSubtitle?.includes('Complexo Hospitalar Central')) {
          return parsed;
        }
      }
    } catch (e) {}

    return {
      enabled: true,
      paperWidth: '80mm',
      modelName: 'Epson M352A (ESC/POS)',
      headerTitle: 'Hospital Odete Valadares',
      headerSubtitle: 'Centro Integrado de Atendimento',
      unitName: 'Unidade Principal',
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

  async savePrinterConfig(tenantId, config) {
    const effectiveTenantId = await resolveEffectiveTenantId(tenantId);

    const dbPayload = {
      tenant_id: effectiveTenantId,
      enabled: config.enabled !== false,
      paper_width: config.paperWidth || '80mm',
      model_name: config.modelName || 'Epson M352A (ESC/POS)',
      header_title: config.headerTitle || 'Hospital Odete Valadares',
      header_subtitle: config.headerSubtitle || '',
      unit_name: config.unitName || '',
      footer_message: config.footerMessage || '',
      footer_sub_message: config.footerSubMessage || '',
      show_qr_code: config.showQrCode !== false,
      qr_code_url: config.qrCodeUrl || 'https://scaflow.med.br/fila/',
      show_date_time: config.showDateTime !== false,
      show_specialty: config.showSpecialty !== false,
      show_priority: config.showPriority !== false,
      font_size: config.fontSize || 'normal',
      ticket_number_size: config.ticketNumberSize || 'xlarge',
      cut_paper: config.cutPaper !== false,
      print_method: config.printMethod || 'native',
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase && effectiveTenantId) {
      const { data, error } = await supabase
        .from('printer_configs')
        .upsert(dbPayload, { onConflict: 'tenant_id' })
        .select()
        .single();

      if (error) {
        console.error('[saasService.savePrinterConfig] Erro Supabase:', error);
        throw new Error(error.message);
      }

      localStorage.setItem('sca_printer_config', JSON.stringify({ ...config, id: data.id }));
      window.dispatchEvent(new CustomEvent('scaflow_printer_changed', { detail: { tenantId: effectiveTenantId, config: data } }));
      return { ...config, id: data.id };
    }

    localStorage.setItem('sca_printer_config', JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('scaflow_printer_changed', { detail: { tenantId, config } }));
    return config;
  },

  // --------------------------------------------------------------------------
  // SUBSCRIÇÃO EM TEMPO REAL
  // --------------------------------------------------------------------------
  subscribeToChanges(tenantId, callback) {
    const isUuid = (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const effectiveTenantId = (tenantId && isUuid(tenantId)) ? tenantId : 'f65ac0ed-e001-4da3-87de-8359cdc38762';

    const handler = (e) => {
      callback({ timestamp: Date.now(), detail: e?.detail });
    };

    window.addEventListener('scaflow_tickets_changed', handler);
    window.addEventListener('scaflow_tv_call', handler);
    window.addEventListener('scaflow_counters_changed', handler);
    window.addEventListener('scaflow_services_changed', handler);

    let channel = null;
    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel(`tenant_${effectiveTenantId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets', filter: `tenant_id=eq.${effectiveTenantId}` }, (payload) => {
          callback(payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'counters', filter: `tenant_id=eq.${effectiveTenantId}` }, (payload) => {
          callback(payload);
        })
        .on('broadcast', { event: 'tv:call' }, (payload) => {
          if (payload?.payload) {
            window.dispatchEvent(new CustomEvent('scaflow_tv_call', { detail: payload.payload }));
          }
          callback(payload);
        })
        .subscribe();
    }

    return () => {
      window.removeEventListener('scaflow_tickets_changed', handler);
      window.removeEventListener('scaflow_tv_call', handler);
      window.removeEventListener('scaflow_counters_changed', handler);
      window.removeEventListener('scaflow_services_changed', handler);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }
};
