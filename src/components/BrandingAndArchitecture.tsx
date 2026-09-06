import React, { useState } from 'react';
import {
  Sparkles,
  Database,
  Copy,
  Check,
  ShieldCheck,
  Server,
  Layers,
  Key,
  ExternalLink,
  Code2,
  Terminal,
  Zap,
  BookOpen
} from 'lucide-react';
import { NAMING_PROPOSALS } from '../data/namingProposals';
import { SUPABASE_DDL_SQL } from '../data/sqlDdl';
import { getSupabaseConfig, initSupabase } from '../lib/supabase';

export const BrandingAndArchitecture: React.FC = () => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [activeTab, setActiveTab] = useState<'branding' | 'sql' | 'architecture' | 'env'>('branding');

  const config = getSupabaseConfig();
  const [customUrl, setCustomUrl] = useState(config.url || '');
  const [customKey, setCustomKey] = useState(config.anonKey || '');
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_DDL_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const envSample = `# Arquivo de configuração de ambiente (.env)
VITE_SUPABASE_URL="${customUrl || 'https://seu-projeto.supabase.co'}"
VITE_SUPABASE_ANON_KEY="${customKey || 'sua-chave-anonima-publica'}"
VITE_MERCADO_PAGO_PUBLIC_KEY="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
VITE_MERCADO_PAGO_CHECKOUT_URL="https://mpago.la/pos/seu-link-checkout"
VITE_ORGANIZATION_WHATSAPP="5511999999999"
VITE_PIX_KEY="financeiro@aphpro.med.br"
VITE_PIX_BENEFICIARY="APH PRO TREINAMENTOS MEDICOS LTDA"
VITE_PIX_CITY="SAO PAULO"`;

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(envSample);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2500);
  };

  const handleTestConnection = () => {
    if (!customUrl.startsWith('https://') || !customKey) {
      setConnectionMessage('Insira uma URL HTTPS válida e uma Anon Key.');
      return;
    }
    const client = initSupabase(customUrl, customKey);
    if (client) {
      setConnectionMessage('Cliente Supabase inicializado com sucesso! Os próximos envios sincronizarão diretamente.');
    } else {
      setConnectionMessage('Falha ao instanciar cliente com as credenciais fornecidas.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner Header */}
      <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl p-6 sm:p-8 text-white border border-white/10 shadow-2xl space-y-6">
        <div className="max-w-3xl space-y-3">
          <div className="badge-blue">
            <Sparkles className="w-3.5 h-3.5" />
            Documentação Técnica & Soluções Arquiteturais
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Especificação de Engenharia & Modelagem de Dados
          </h1>
          <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
            Visão detalhada de branding, script SQL DDL para Supabase/PostgreSQL com Row Level Security (RLS),
            fluxo de dados em tempo real e diretrizes de integração para pagamentos com PIX e Mercado Pago.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap gap-2 pt-6 border-t border-white/10">
          <button
            id="tab-branding-btn"
            onClick={() => setActiveTab('branding')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'branding'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            1. Naming & Branding (3 Propostas)
          </button>

          <button
            id="tab-sql-btn"
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'sql'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Database className="w-4 h-4" />
            2. Script SQL DDL & RLS (Supabase)
          </button>

          <button
            id="tab-arch-btn"
            onClick={() => setActiveTab('architecture')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'architecture'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Layers className="w-4 h-4" />
            3. Arquitetura de Solução & Segurança
          </button>

          <button
            id="tab-env-btn"
            onClick={() => setActiveTab('env')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'env'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Key className="w-4 h-4" />
            4. Variáveis de Ambiente (.env)
          </button>
        </div>
      </div>

      {/* SECTION 1: NAMING & BRANDING */}
      {activeTab === 'branding' && (
        <div className="space-y-6">
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
              Propostas Estratégicas de Naming e Branding
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Equilíbrio cirúrgico entre <strong className="text-white">autoridade técnica médica</strong> (respeito de médicos, enfermeiros intervencionistas e socorristas) e <strong className="text-white">apelo comercial de conversão</strong> (urgência, alto valor percebido e escalabilidade para edições futuras).
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {NAMING_PROPOSALS.map((prop, idx) => (
                <div
                  key={prop.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col justify-between hover:border-blue-500/40 transition-all relative overflow-hidden group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/5 text-gray-300 border border-white/10">
                        Opção {idx + 1}
                      </span>
                      {idx === 0 && (
                        <span className="text-[11px] font-bold text-blue-400 bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 rounded-full">
                          Recomendada
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">
                        {prop.programName}
                      </h3>
                      <p className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-wide">
                        {prop.programTagline}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                      <span className="text-[11px] font-bold uppercase text-blue-400 block tracking-wider">
                        Primeira Edição Temática:
                      </span>
                      <h4 className="text-sm font-bold text-white">
                        {prop.module1Name}
                      </h4>
                      <p className="text-xs text-gray-400 italic">
                        "{prop.module1Subtitle}"
                      </p>
                    </div>

                    <div className="space-y-3 pt-2 text-xs">
                      <div>
                        <strong className="text-white block font-semibold mb-0.5">
                          Autoridade Técnica:
                        </strong>
                        <p className="text-gray-400 leading-relaxed">
                          {prop.authorityFocus}
                        </p>
                      </div>
                      <div>
                        <strong className="text-white block font-semibold mb-0.5">
                          Apelo Comercial & Conversão:
                        </strong>
                        <p className="text-gray-400 leading-relaxed">
                          {prop.commercialAppeal}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10 text-[11px] text-gray-500">
                    <strong className="text-gray-400">Público:</strong> SAMU 192, Resgate Aéreo, Pronto-Socorro e Forças de Segurança.
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: SQL DDL SCRIPT */}
      {activeTab === 'sql' && (
        <div className="space-y-6">
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Script DDL Supabase / PostgreSQL (Pronto para Execução)
                </h2>
                <p className="text-sm text-gray-400">
                  Copie e cole este código diretamente no <strong>SQL Editor</strong> do painel do seu projeto Supabase.
                </p>
              </div>
              <button
                id="btn-copy-sql-script"
                onClick={handleCopySql}
                className="btn-primary inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 self-start sm:self-auto"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Copiado com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Script SQL Completo</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Box */}
            <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black/70 text-slate-100 shadow-2xl">
              <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/10 text-xs text-gray-400">
                <span className="flex items-center gap-2 font-mono text-blue-400">
                  <Terminal className="w-3.5 h-3.5" />
                  supabase_schema_aph_pro.sql
                </span>
                <span className="font-mono text-[11px] text-gray-400">PostgreSQL 15+ • RLS Habilitado</span>
              </div>
              <pre className="p-4 sm:p-6 text-xs sm:text-sm font-mono overflow-x-auto leading-relaxed text-blue-300 max-h-[550px] overflow-y-auto">
                {SUPABASE_DDL_SQL}
              </pre>
            </div>

            {/* Highlights cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  Row Level Security (RLS)
                </div>
                <p className="text-xs text-gray-400">
                  Garante que anônimos só possam inserir inscrições 'pendente' e ler cursos ativos. Edições financeiras são restritas à role autenticada de gestão.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Zap className="w-4 h-4 text-blue-400" />
                  Índices de Performance
                </div>
                <p className="text-xs text-gray-400">
                  Índices B-Tree compostos em <code className="text-blue-300 font-mono">cpf</code>, <code className="text-blue-300 font-mono">status_pagamento</code>, e <code className="text-blue-300 font-mono">slug</code> para consultas em tempo real sub-milissegundo.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Layers className="w-4 h-4 text-blue-400" />
                  Integridade Relacional
                </div>
                <p className="text-xs text-gray-400">
                  Restrição <code className="text-blue-300 font-mono">uk_minicurso_cpf</code> impede que o mesmo aluno submeta inscrições duplicadas no mesmo módulo.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: ARCHITECTURE */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Arquitetura de Solução & Fluxo de Pagamentos
            </h2>

            {/* Flow Diagram */}
            <div className="p-6 rounded-2xl bg-black/40 text-white space-y-6 border border-white/10">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Fluxo de Dados Ponta a Ponta
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="w-8 h-8 mx-auto rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm shadow-md shadow-blue-600/30">
                    1
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-white">Ficha Pública</h4>
                  <p className="text-[11px] text-gray-400">
                    Validação algorítmica de CPF e telefone no client. Inserção direta via client API do Supabase (status: pendente).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="w-8 h-8 mx-auto rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm shadow-md shadow-blue-600/30">
                    2
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-white">Checkout Dinâmico</h4>
                  <p className="text-[11px] text-gray-400">
                    Geração imediata de PIX EMV Copia e Cola com CRC16 e QR Code nativo. Redirecionamento Mercado Pago.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="w-8 h-8 mx-auto rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm shadow-md shadow-blue-600/30">
                    3
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-white">Comprovante / WhatsApp</h4>
                  <p className="text-[11px] text-gray-400">
                    Upload de comprovante ou acionamento de validação manual via WhatsApp da organização com template preenchido.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="w-8 h-8 mx-auto rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm shadow-md shadow-blue-600/30">
                    4
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-white">Gestão & Auditoria</h4>
                  <p className="text-[11px] text-gray-400">
                    Painel administrativo com filtros, métricas de vagas e receita, conciliação manual e exportação em CSV/TSV.
                  </p>
                </div>
              </div>
            </div>

            {/* Architecture Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-300">
              <div className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-400" />
                  Camada de Persistência & Resiliência
                </h3>
                <p className="leading-relaxed text-gray-400">
                  A aplicação adota um padrão de <strong className="text-white">Data Repository Resiliente</strong>: conecta prioritariamente à API do Supabase (<code className="text-xs bg-white/10 px-1 py-0.5 rounded text-blue-300">@supabase/supabase-js</code>). Em ambientes de desenvolvimento ou caso a infraestrutura ainda esteja em fase de provisionamento, o client chaveia transparentemente para o armazenamento local reativo, garantindo zero travamentos e permitindo testes funcionais completos.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  Segurança, RLS e LGPD
                </h3>
                <p className="leading-relaxed text-gray-400">
                  Com o <strong className="text-white">Row Level Security (RLS)</strong> ativado, usuários não autenticados só possuem permissão de <code className="text-xs bg-white/10 px-1 py-0.5 rounded text-blue-300">INSERT</code> com status 'pendente' garantido por constraint de checagem. Os dados sensíveis (CPF, WhatsApp) ficam protegidos contra listagem em lote pública.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: ENVIRONMENT VARIABLES */}
      {activeTab === 'env' && (
        <div className="space-y-6">
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Configuração de Variáveis de Ambiente (.env)
                </h2>
                <p className="text-sm text-gray-400">
                  Copie as variáveis abaixo para o seu arquivo <code className="font-mono text-blue-300">.env</code> na raiz do projeto.
                </p>
              </div>
              <button
                id="btn-copy-env"
                onClick={handleCopyEnv}
                className="btn-primary inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 self-start sm:self-auto"
              >
                {copiedEnv ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Variáveis .env</span>
                  </>
                )}
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/70 text-slate-100">
              <pre className="p-4 sm:p-6 text-xs sm:text-sm font-mono overflow-x-auto leading-relaxed text-blue-400">
                {envSample}
              </pre>
            </div>

            {/* Live Credential Tester Form */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Conexão Direta em Tempo Real (Opcional para Testes no Preview)
                </h3>
              </div>
              <p className="text-xs text-gray-400">
                Se já criou seu projeto no Supabase e rodou o SQL DDL, você pode colar aqui a URL e a Anon Key para conectar esta instância imediatamente:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">
                    VITE_SUPABASE_URL
                  </label>
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-white placeholder-gray-500 text-xs font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">
                    VITE_SUPABASE_ANON_KEY
                  </label>
                  <input
                    type="text"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-white placeholder-gray-500 text-xs font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  id="btn-test-supabase-connection"
                  onClick={handleTestConnection}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
                >
                  Conectar e Salvar
                </button>
                {connectionMessage && (
                  <span className="text-xs font-medium text-blue-400">
                    {connectionMessage}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
