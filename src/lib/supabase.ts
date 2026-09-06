import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Minicurso,
  Inscricao,
  PaymentStatus,
  RegistrationFormData,
  FooterConfig,
  DEFAULT_FOOTER_CONFIG
} from '../types';
import { INITIAL_COURSES } from '../data/initialCourses';

const ENV_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const ENV_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Chaves no LocalStorage para fallback / preview
const STORAGE_KEY_COURSES = 'aph_minicursos_v1';
const STORAGE_KEY_INSCRICOES = 'aph_inscricoes_v1';
const STORAGE_KEY_SUPABASE_CUSTOM = 'aph_custom_supabase_config_v1';
const STORAGE_KEY_FOOTER = 'aph_footer_config_v1';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isCustom: boolean;
}

let supabaseInstance: SupabaseClient | null = null;
let currentConfig: SupabaseConfig = {
  url: ENV_SUPABASE_URL,
  anonKey: ENV_SUPABASE_ANON_KEY,
  isCustom: false
};

// Carrega custom config se salva no navegador
try {
  const saved = localStorage.getItem(STORAGE_KEY_SUPABASE_CUSTOM);
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed.url && parsed.anonKey) {
      currentConfig = { ...parsed, isCustom: true };
    }
  }
} catch (e) {
  console.warn('Erro ao carregar credenciais locais de teste:', e);
}

export function getSupabaseConfig(): SupabaseConfig {
  return currentConfig;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    currentConfig.url &&
    currentConfig.anonKey &&
    currentConfig.url.startsWith('https://') &&
    !currentConfig.url.includes('your-project')
  );
}

export function initSupabase(url?: string, anonKey?: string): SupabaseClient | null {
  const targetUrl = url || currentConfig.url;
  const targetKey = anonKey || currentConfig.anonKey;

  if (targetUrl && targetKey && targetUrl.startsWith('https://') && !targetUrl.includes('your-project')) {
    try {
      supabaseInstance = createClient(targetUrl, targetKey);
      currentConfig = { url: targetUrl, anonKey: targetKey, isCustom: Boolean(url) };
      if (url && anonKey) {
        localStorage.setItem(STORAGE_KEY_SUPABASE_CUSTOM, JSON.stringify({ url, anonKey }));
      }
      return supabaseInstance;
    } catch (err) {
      console.error('Falha ao inicializar Supabase Client:', err);
      supabaseInstance = null;
      return null;
    }
  }
  supabaseInstance = null;
  return null;
}

// Inicializa na inicialização
initSupabase();

// ==============================================================================
// Repositório Local (Fallback inteligente para Preview & Offline)
// ==============================================================================

const SEED_INSCRICOES: Inscricao[] = [
  {
    id: 'e4a1c5d0-9981-4b12-8822-112233445566',
    minicurso_id: 'c1d9b3a0-7f21-4f9e-8c10-1a2b3c4d5e6f',
    nome_completo: 'Dra. Gabriela Albuquerque Prado',
    cpf: '142.890.345-21',
    email: 'gabriela.prado@hospital.med.br',
    whatsapp: '(11) 98765-4321',
    status_pagamento: 'pago',
    comprovante_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    valor_pago: 380.0,
    concluido: true,
    data_conclusao: new Date(Date.now() - 3600000 * 12).toISOString(),
    codigo_certificado: 'RC-2026-E4A1C5D0'
  },
  {
    id: 'f8b2d6e1-1122-4a33-9944-5566778899aa',
    minicurso_id: 'c1d9b3a0-7f21-4f9e-8c10-1a2b3c4d5e6f',
    nome_completo: 'Enf. Rodrigo Mendonça Silva',
    cpf: '235.678.901-44',
    email: 'rodrigo.samu@sp.gov.br',
    whatsapp: '(11) 97654-3210',
    status_pagamento: 'pendente',
    comprovante_url: null,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    valor_pago: 380.0,
    concluido: false,
    data_conclusao: null,
    codigo_certificado: null
  },
  {
    id: 'a9c3e7f2-3344-5b55-aa66-778899aabbcc',
    minicurso_id: 'c1d9b3a0-7f21-4f9e-8c10-1a2b3c4d5e6f',
    nome_completo: 'Sargento Bombeiro Carlos Eduardo Rocha',
    cpf: '389.123.456-78',
    email: 'carlos.rocha@corpodebombeiros.sp.gov.br',
    whatsapp: '(19) 98123-4567',
    status_pagamento: 'pago',
    comprovante_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop',
    created_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    valor_pago: 380.0,
    concluido: false,
    data_conclusao: null,
    codigo_certificado: null
  }
];

function getLocalCourses(): Minicurso[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COURSES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_COURSES, JSON.stringify(INITIAL_COURSES));
      return INITIAL_COURSES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_COURSES;
  }
}

function saveLocalCourses(courses: Minicurso[]) {
  localStorage.setItem(STORAGE_KEY_COURSES, JSON.stringify(courses));
}

function getLocalInscricoes(): Inscricao[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INSCRICOES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_INSCRICOES, JSON.stringify(SEED_INSCRICOES));
      return SEED_INSCRICOES;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_INSCRICOES;
  }
}

export function notifyInscricoesChanged(action: string, payload?: any) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('redcode_inscricoes_sync', { detail: { action, payload } }));
  }
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('redcode_broadcast_channel');
      channel.postMessage({ action, payload, timestamp: Date.now() });
      channel.close();
    }
  } catch {
    // BroadcastChannel não suportado em ambientes restritos
  }
}

function saveLocalInscricoes(list: Inscricao[]) {
  localStorage.setItem(STORAGE_KEY_INSCRICOES, JSON.stringify(list));
  notifyInscricoesChanged('save', list);
}

// ==============================================================================
// Data Access Service (Unifica Supabase Client + Fallback LocalStorage)
// ==============================================================================

export const DataService = {
  /**
   * Busca minicursos ativos
   */
  async getCourses(): Promise<{ data: Minicurso[]; source: 'supabase' | 'local'; error?: string }> {
    if (supabaseInstance) {
      try {
        const { data, error } = await supabaseInstance
          .from('minicursos')
          .select('*')
          .order('data_evento', { ascending: true });

        if (!error && data && data.length > 0) {
          return { data: data as Minicurso[], source: 'supabase' };
        }
        if (error) {
          console.warn('Erro ao consultar Supabase, usando dados locais:', error.message);
        }
      } catch (e: any) {
        console.warn('Exceção ao conectar no Supabase:', e.message);
      }
    }
    return { data: getLocalCourses(), source: 'local' };
  },

  /**
   * Busca um minicurso por slug ou ID
   */
  async getCourse(slugOrId: string): Promise<Minicurso | null> {
    const { data } = await this.getCourses();
    return data.find((c) => c.slug === slugOrId || c.id === slugOrId) || null;
  },

  /**
   * Grava inscrição com status 'pendente'
   */
  async createRegistration(
    formData: RegistrationFormData,
    minicurso: Minicurso
  ): Promise<{ success: boolean; data?: Inscricao; error?: string; source: 'supabase' | 'local' }> {
    const newRecord: Inscricao = {
      id: crypto.randomUUID ? crypto.randomUUID() : `ins-${Date.now()}`,
      minicurso_id: formData.minicurso_id,
      nome_completo: formData.nome_completo.trim(),
      cpf: formData.cpf,
      email: formData.email.trim().toLowerCase(),
      whatsapp: formData.whatsapp,
      status_pagamento: 'pendente',
      comprovante_url: null,
      created_at: new Date().toISOString(),
      valor_pago: minicurso.valor
    };

    if (supabaseInstance) {
      try {
        const { data, error } = await supabaseInstance
          .from('inscricoes')
          .insert([
            {
              minicurso_id: newRecord.minicurso_id,
              nome_completo: newRecord.nome_completo,
              cpf: newRecord.cpf,
              email: newRecord.email,
              whatsapp: newRecord.whatsapp,
              status_pagamento: 'pendente'
            }
          ])
          .select()
          .single();

        if (!error && data) {
          // Também sincroniza com cache local
          const localList = getLocalInscricoes();
          saveLocalInscricoes([data as Inscricao, ...localList]);
          return { success: true, data: data as Inscricao, source: 'supabase' };
        }
        console.warn('Falha na inserção remota Supabase, salvando localmente:', error?.message);
      } catch (e: any) {
        console.warn('Exceção na chamada do Supabase:', e.message);
      }
    }

    // Gravação local resiliente (imediatamente acessível na área de inscritos)
    const currentList = getLocalInscricoes();
    // Verifica se já existia inscrição deste CPF no minicurso
    const existingIndex = currentList.findIndex(
      (i) => i.minicurso_id === formData.minicurso_id && i.cpf === formData.cpf
    );

    let finalRecord: Inscricao;
    if (existingIndex !== -1) {
      // Atualiza os dados cadastrais (caso o aluno tenha ajustado telefone, e-mail ou nome)
      const existing = currentList[existingIndex];
      finalRecord = {
        ...existing,
        nome_completo: formData.nome_completo.trim(),
        email: formData.email.trim().toLowerCase(),
        whatsapp: formData.whatsapp,
        valor_pago: minicurso.valor,
        // Mantém 'pago' se já tiver sido confirmado pela coordenação; caso contrário, garante 'pendente'
        status_pagamento: existing.status_pagamento === 'pago' ? 'pago' : 'pendente'
      };
      // Move para o topo da lista de inscritos para visibilidade imediata
      const rest = currentList.filter((_, idx) => idx !== existingIndex);
      const updated = [finalRecord, ...rest];
      saveLocalInscricoes(updated);
    } else {
      finalRecord = newRecord;
      const updated = [newRecord, ...currentList];
      saveLocalInscricoes(updated);
    }

    return { success: true, data: finalRecord, source: 'local' };
  },

  /**
   * Consulta inscrição por ID
   */
  async getRegistrationById(id: string): Promise<Inscricao | null> {
    if (supabaseInstance) {
      try {
        const { data, error } = await supabaseInstance
          .from('inscricoes')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          return data as Inscricao;
        }
      } catch (e) {
        // Fallback local
      }
    }
    const local = getLocalInscricoes();
    return local.find((i) => i.id === id) || null;
  },

  /**
   * Altera status de pagamento ('pendente' -> 'pago' ou 'cancelado')
   */
  async updatePaymentStatus(
    id: string,
    status: PaymentStatus
  ): Promise<{ success: boolean; data?: Inscricao; error?: string }> {
    let remoteSuccess = false;
    const credCode = `RC-PASS-2026-${id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}`;

    if (supabaseInstance) {
      try {
        const updatePayload: any = { status_pagamento: status };
        if (status === 'pago') {
          updatePayload.codigo_credencial = credCode;
        }

        const { error } = await supabaseInstance
          .from('inscricoes')
          .update(updatePayload)
          .eq('id', id);

        if (!error) {
          remoteSuccess = true;
        } else {
          console.warn('Erro ao atualizar status no Supabase:', error.message);
        }
      } catch (e: any) {
        console.warn('Exceção ao atualizar status no Supabase:', e.message);
      }
    }

    // Atualiza localmente sempre para responsividade imediata na UI
    const local = getLocalInscricoes();
    const index = local.findIndex((i) => i.id === id);
    if (index !== -1) {
      local[index].status_pagamento = status;
      if (status === 'pago' && !local[index].codigo_credencial) {
        local[index].codigo_credencial = credCode;
      }
      saveLocalInscricoes(local);
      return { success: true, data: local[index] };
    }

    if (remoteSuccess) return { success: true };
    return { success: false, error: 'Inscrição não encontrada.' };
  },

  /**
   * Registra comprovante de pagamento
   */
  async saveComprovante(id: string, urlOrData: string): Promise<{ success: boolean; error?: string }> {
    if (supabaseInstance) {
      try {
        await supabaseInstance
          .from('inscricoes')
          .update({ comprovante_url: urlOrData })
          .eq('id', id);
      } catch (e) {
        // Fallback local
      }
    }

    const local = getLocalInscricoes();
    const index = local.findIndex((i) => i.id === id);
    if (index !== -1) {
      local[index].comprovante_url = urlOrData;
      saveLocalInscricoes(local);
      return { success: true };
    }
    return { success: false, error: 'Inscrição não encontrada.' };
  },

  /**
   * Busca todas as inscrições para a visão do gestor
   */
  async getAllRegistrations(minicursoId?: string): Promise<{ data: Inscricao[]; source: 'supabase' | 'local' }> {
    if (supabaseInstance) {
      try {
        let query = supabaseInstance
          .from('inscricoes')
          .select('*')
          .order('created_at', { ascending: false });

        if (minicursoId && minicursoId !== 'all') {
          query = query.eq('minicurso_id', minicursoId);
        }

        const { data, error } = await query;
        if (!error && data) {
          return { data: data as Inscricao[], source: 'supabase' };
        }
      } catch (e) {
        console.warn('Erro ao consultar inscrições remotas:', e);
      }
    }

    let local = getLocalInscricoes();
    if (minicursoId && minicursoId !== 'all') {
      local = local.filter((i) => i.minicurso_id === minicursoId);
    }
    return { data: local, source: 'local' };
  },

  /**
   * Atualiza os dados completos de um minicurso (nome, valor, data, local, conteudo, etc.)
   */
  async updateCourse(course: Minicurso): Promise<{ success: boolean; error?: string }> {
    if (supabaseInstance) {
      try {
        const { error } = await supabaseInstance
          .from('minicursos')
          .update({
            titulo: course.titulo,
            slug: course.slug,
            descricao: course.descricao,
            data_evento: course.data_evento,
            vagas_limite: course.vagas_limite,
            valor: course.valor,
            status: course.status,
            carga_horaria: course.carga_horaria,
            local: course.local,
            publico_alvo: course.publico_alvo,
            conteudo_programatico: course.conteudo_programatico,
            instrutor: course.instrutor,
            instrutores: course.instrutores
          })
          .eq('id', course.id);

        if (error) {
          console.warn('Erro ao atualizar minicurso no Supabase:', error.message);
        }
      } catch (e: any) {
        console.warn('Exceção ao atualizar minicurso no Supabase:', e.message);
      }
    }

    // Persistência local imediata
    const courses = getLocalCourses();
    const idx = courses.findIndex((c) => c.id === course.id);
    if (idx !== -1) {
      courses[idx] = { ...course };
      saveLocalCourses(courses);
      return { success: true };
    } else {
      // Se não existia, insere
      courses.push(course);
      saveLocalCourses(courses);
      return { success: true };
    }
  },

  /**
   * Cria um novo minicurso / edição
   */
  async createCourse(course: Minicurso): Promise<{ success: boolean; error?: string }> {
    if (supabaseInstance) {
      try {
        await supabaseInstance.from('minicursos').insert([course]);
      } catch (e) {
        console.warn('Erro ao inserir curso no Supabase:', e);
      }
    }
    const courses = getLocalCourses();
    courses.push(course);
    saveLocalCourses(courses);
    return { success: true };
  },

  /**
   * Marca ou desmarca participante como CONCLUÍDO
   * Só permite emissão de certificado se estiver PAGO e CONCLUÍDO
   */
  async updateCompletionStatus(
    id: string,
    concluido: boolean
  ): Promise<{ success: boolean; data?: Inscricao; error?: string }> {
    const certCode = concluido
      ? `RC-2026-${id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}`
      : null;
    const completionDate = concluido ? new Date().toISOString() : null;

    if (supabaseInstance) {
      try {
        await supabaseInstance
          .from('inscricoes')
          .update({
            concluido,
            data_conclusao: completionDate,
            codigo_certificado: certCode
          })
          .eq('id', id);
      } catch (e) {
        console.warn('Exceção ao atualizar conclusao no Supabase:', e);
      }
    }

    const local = getLocalInscricoes();
    const index = local.findIndex((i) => i.id === id);
    if (index !== -1) {
      local[index].concluido = concluido;
      local[index].data_conclusao = completionDate;
      local[index].codigo_certificado = certCode;
      saveLocalInscricoes(local);
      return { success: true, data: local[index] };
    }

    return { success: false, error: 'Inscrição não encontrada.' };
  },

  /**
   * Busca inscrições confirmadas e concluídas para emissão de certificado
   */
  async getCertifiedRegistrations(): Promise<Inscricao[]> {
    const all = await this.getAllRegistrations();
    return all.data.filter((i) => i.status_pagamento === 'pago' && i.concluido === true);
  },

  /**
   * Obtém as configurações e dados institucionais do rodapé
   */
  getFooterConfig(): FooterConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_FOOTER);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Atualiza para o e-mail oficial se ainda constar o antigo
        if (!parsed.email || parsed.email === 'contato@redcode.med.br') {
          parsed.email = 'red.codearea17@gmail.com';
        }
        return { ...DEFAULT_FOOTER_CONFIG, ...parsed };
      }
    } catch (e) {
      console.warn('Erro ao carregar footer config:', e);
    }
    return DEFAULT_FOOTER_CONFIG;
  },

  /**
   * Salva configurações e dados do rodapé
   */
  saveFooterConfig(config: FooterConfig): FooterConfig {
    try {
      localStorage.setItem(STORAGE_KEY_FOOTER, JSON.stringify(config));
    } catch (e) {
      console.error('Erro ao salvar footer config:', e);
    }
    return config;
  },

  /**
   * Dispara sincronização em tempo real de inscrições entre abas e telas
   */
  notifySync(action: string = 'manual_sync') {
    notifyInscricoesChanged(action);
  }
};
