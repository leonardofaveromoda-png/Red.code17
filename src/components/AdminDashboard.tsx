import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  FileSpreadsheet,
  RefreshCw,
  Phone,
  DollarSign,
  TrendingUp,
  AlertCircle,
  X,
  Award,
  FileEdit,
  GraduationCap,
  Check,
  ShieldCheck,
  Calendar,
  Building,
  QrCode,
  Send,
  Mail,
  Sparkles,
  Link2,
  Copy,
  ExternalLink,
  Share2,
  Globe,
  Settings2
} from 'lucide-react';
import { Inscricao, Minicurso, PaymentStatus } from '../types';
import { DataService } from '../lib/supabase';
import { exportRegistrationsToCSV, exportRegistrationsToTSV } from '../utils/export';
import { buildWhatsAppLink } from '../utils/phone';
import { RedCodeLogo } from './RedCodeLogo';
import { ParticipantTicketModal } from './ParticipantTicketModal';
import {
  getParticipantWhatsAppShareUrl,
  getStudentPortalUrl,
  getPublicRegistrationUrl,
  getEffectivePublicOrigin,
  setCustomPublicBaseUrl,
  getCustomPublicBaseUrl
} from '../utils/participantTicket';

interface AdminDashboardProps {
  courses: Minicurso[];
  onOpenSpecs: () => void;
  onOpenEditor: () => void;
  onOpenCertificate: (inscricao: Inscricao, course: Minicurso) => void;
  onOpenFooterSettings?: () => void;
  onOpenStudentPortal?: (inscricaoId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  courses,
  onOpenSpecs,
  onOpenEditor,
  onOpenCertificate,
  onOpenFooterSettings,
  onOpenStudentPortal
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [completionFilter, setCompletionFilter] = useState<string>('all');
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dataSource, setDataSource] = useState<'supabase' | 'local'>('local');
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedTicketItem, setSelectedTicketItem] = useState<{
    inscricao: Inscricao;
    curso: Minicurso;
  } | null>(null);
  const [pixSuccessNotification, setPixSuccessNotification] = useState<string | null>(null);
  const [copiedPublicLink, setCopiedPublicLink] = useState(false);
  const [copiedStudentId, setCopiedStudentId] = useState<string | null>(null);
  const [isDomainModalOpen, setIsDomainModalOpen] = useState(false);
  const [customDomainInput, setCustomDomainInput] = useState(() => getCustomPublicBaseUrl());

  const handleCopyPublicRegistrationLink = () => {
    const url = getPublicRegistrationUrl();
    navigator.clipboard.writeText(url);
    setCopiedPublicLink(true);
    setTimeout(() => setCopiedPublicLink(false), 2500);
  };

  const handleSaveCustomDomain = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomPublicBaseUrl(customDomainInput);
    setIsDomainModalOpen(false);
  };

  const handleResetCustomDomain = () => {
    setCustomPublicBaseUrl('');
    setCustomDomainInput('');
    setIsDomainModalOpen(false);
  };

  const handleCopyStudentLink = (id: string) => {
    const url = getStudentPortalUrl(id);
    navigator.clipboard.writeText(url);
    setCopiedStudentId(id);
    setTimeout(() => setCopiedStudentId(null), 2500);
  };

  // Mapeia cursos para acesso rápido por ID
  const coursesMap = React.useMemo(() => {
    return courses.reduce((acc, c) => {
      acc[c.id] = c;
      return acc;
    }, {} as Record<string, Minicurso>);
  }, [courses]);

  const loadRegistrations = async (silent: boolean = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await DataService.getAllRegistrations(
        selectedCourseId === 'all' ? undefined : selectedCourseId
      );
      setInscricoes(res.data);
      setDataSource(res.source);
    } catch (err) {
      console.error('Erro ao carregar inscrições:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrations();

    // Sincronização em tempo real: assim que o aluno avança para o pagamento na página pública,
    // a inscrição dele surge imediatamente aqui na área de inscritos sem necessidade de recarregar.
    const handleSync = () => {
      loadRegistrations(true);
    };

    window.addEventListener('redcode_inscricoes_sync', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('redcode_broadcast_channel');
        bc.onmessage = () => {
          loadRegistrations(true);
        };
      }
    } catch (e) {
      // Ignora restrições de ambiente
    }

    // Polling resiliente em segundo plano (atualiza silenciosamente a cada 3 segundos)
    const interval = setInterval(() => {
      loadRegistrations(true);
    }, 3000);

    return () => {
      window.removeEventListener('redcode_inscricoes_sync', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
      if (bc) bc.close();
      clearInterval(interval);
    };
  }, [selectedCourseId]);

  // Alterar status de pagamento
  const handleUpdateStatus = async (id: string, newStatus: PaymentStatus) => {
    setUpdatingId(id);
    try {
      const res = await DataService.updatePaymentStatus(id, newStatus);
      setInscricoes((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status_pagamento: newStatus,
                codigo_credencial: res.data?.codigo_credencial || item.codigo_credencial
              }
            : item
        )
      );
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Confirmação funcional direta de pagamento PIX ("eu seleciono pago assim que o pix cair")
  // Gera automaticamente o código de credencial e abre a credencial com QR Code único para envio ao aluno
  const handleConfirmPixPayment = async (item: Inscricao) => {
    setUpdatingId(item.id);
    try {
      const res = await DataService.updatePaymentStatus(item.id, 'pago');
      const updatedItem: Inscricao = {
        ...item,
        status_pagamento: 'pago',
        codigo_credencial:
          res.data?.codigo_credencial ||
          item.codigo_credencial ||
          `RC-PASS-2026-${item.id.slice(0, 8).toUpperCase()}`
      };

      setInscricoes((prev) =>
        prev.map((i) => (i.id === item.id ? updatedItem : i))
      );

      const targetCourse = coursesMap[item.minicurso_id] || courses[0];

      // Exibe notificação de confirmação
      setPixSuccessNotification(
        `✓ PIX Confirmado! Credencial oficial com QR Code único gerada para ${item.nome_completo}.`
      );

      // Abre automaticamente a credencial oficial com QR Code único para envio
      setSelectedTicketItem({
        inscricao: updatedItem,
        curso: targetCourse
      });

      // Auto-hide alert after 5s
      setTimeout(() => {
        setPixSuccessNotification(null);
      }, 6000);
    } catch (err) {
      console.error('Erro ao confirmar pagamento PIX:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Abrir credencial do participante com QR Code
  const handleOpenTicket = (item: Inscricao) => {
    const targetCourse = coursesMap[item.minicurso_id] || courses[0];
    setSelectedTicketItem({
      inscricao: item,
      curso: targetCourse
    });
  };

  // Alternar Conclusão do Minicurso (para liberar certificado)
  const handleToggleCompletion = async (item: Inscricao) => {
    const nextStatus = !item.concluido;
    setUpdatingId(item.id);
    try {
      const res = await DataService.updateCompletionStatus(item.id, nextStatus);
      if (res.success && res.data) {
        setInscricoes((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, ...res.data } : i))
        );
      }
    } catch (err) {
      console.error('Erro ao atualizar conclusão:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtragem dos inscritos
  const filteredInscricoes = inscricoes.filter((item) => {
    const matchesSearch =
      item.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cpf.includes(searchTerm) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.whatsapp.includes(searchTerm) ||
      (item.codigo_certificado && item.codigo_certificado.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || item.status_pagamento === statusFilter;
    const matchesCourse = selectedCourseId === 'all' || item.minicurso_id === selectedCourseId;
    const matchesCompletion =
      completionFilter === 'all' ||
      (completionFilter === 'concluido' && item.concluido) ||
      (completionFilter === 'pendente_conclusao' && !item.concluido);

    return matchesSearch && matchesStatus && matchesCourse && matchesCompletion;
  });

  // Métricas do Gestor
  const totalInscritos = filteredInscricoes.length;
  const pagos = filteredInscricoes.filter((i) => i.status_pagamento === 'pago');
  const concluidosComCertificado = filteredInscricoes.filter(
    (i) => i.status_pagamento === 'pago' && i.concluido === true
  );
  const pendentes = filteredInscricoes.filter((i) => i.status_pagamento === 'pendente');

  const receitaConfirmada = pagos.reduce((acc, curr) => {
    const curso = coursesMap[curr.minicurso_id];
    return acc + (curr.valor_pago || curso?.valor || 0);
  }, 0);

  // Vagas do curso selecionado (se filtrado por 1 curso)
  const currentCourse = selectedCourseId !== 'all' ? coursesMap[selectedCourseId] : null;
  const vagasLimite = currentCourse ? currentCourse.vagas_limite : 30;
  const vagasOcupadas = pagos.length;
  const vagasRestantes = Math.max(0, vagasLimite - vagasOcupadas);

  const handleExportCSV = () => {
    exportRegistrationsToCSV(filteredInscricoes, coursesMap, `red_code_inscricoes_${selectedCourseId}.csv`);
  };

  const handleExportTSV = () => {
    exportRegistrationsToTSV(filteredInscricoes, coursesMap, `red_code_inscricoes_${selectedCourseId}.tsv`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Top Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge-red">
              Painel do Gestor RED CODE
            </span>
            {dataSource === 'supabase' ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                Sincronizado Supabase
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Armazenamento Local Ativo
              </span>
            )}
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-red-400" />
              red.codearea17@gmail.com
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Gestão Operacional, Certificados & Inscrições
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Aprovação de pagamentos PIX com geração de credencial com QR Code único, validação de conclusão e certificados digitais.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            id="btn-open-event-editor"
            onClick={onOpenEditor}
            className="btn-primary text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-600/30"
          >
            <FileEdit className="w-4 h-4" />
            <span>Editar Dados do Evento</span>
          </button>

          {onOpenFooterSettings && (
            <button
              id="btn-open-footer-settings"
              onClick={onOpenFooterSettings}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Building className="w-4 h-4 text-red-400" />
              <span>Personalizar Rodapé</span>
            </button>
          )}

          <button
            onClick={loadRegistrations}
            className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-red-400' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>

          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-red-400" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Link de Inscrição Oficial Separado para Alunos (Ambiente Isolado) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#14161F] via-[#0E1017] to-[#14161F] border border-red-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-bold uppercase tracking-wider">
                Ambiente 100% Isolado
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Sem Login Google Necessário</span>
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Link2 className="w-5 h-5 text-red-500" />
              <span>Link de Inscrição e Acompanhamento do Aluno</span>
            </h3>
            <p className="text-xs text-gray-400 max-w-3xl">
              Envie este link direto para os alunos se inscreverem. Ele é <strong>100% público e independente de login Google</strong> (não exibe 'Page not found'). Após a inscrição, o aluno acompanha o status do pagamento e baixa o certificado com segurança sem acesso ao painel de edição.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              id="btn-copy-public-enroll-link"
              onClick={handleCopyPublicRegistrationLink}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer"
            >
              {copiedPublicLink ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Link Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Link de Inscrição</span>
                </>
              )}
            </button>

            <a
              href={getPublicRegistrationUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Abrir em nova aba para testar exatamente como o aluno verá"
            >
              <ExternalLink className="w-3.5 h-3.5 text-red-400" />
              <span>Testar Acesso</span>
            </a>

            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                `🚨 *RED CODE - INSCRIÇÕES ABERTAS!*\nTreinamento Prático & Imersivo de APH Avançado.\nGaranta sua vaga oficial pelo link exclusivo:\n🔗 ${getPublicRegistrationUrl()}\n\nEquipe de Coordenação: red.codearea17@gmail.com`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Divulgar no WhatsApp</span>
            </a>

            <button
              onClick={() => {
                setCustomDomainInput(getCustomPublicBaseUrl());
                setIsDomainModalOpen(true);
              }}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="Configurar Domínio ou URL Pública Personalizada"
            >
              <Settings2 className="w-4 h-4 text-gray-400 hover:text-white" />
            </button>
          </div>
        </div>

        {/* Visual Link Box */}
        <div className="p-3 rounded-2xl bg-black/50 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs font-mono text-gray-300">
          <div className="truncate text-red-400 font-semibold select-all w-full sm:w-auto">
            {getPublicRegistrationUrl()}
          </div>
          <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
            Acesso Livre sem Login
          </span>
        </div>
      </div>

      {/* Metrics Cards Grid (com destaque para novos inscritos na etapa de pagamento) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Registrations */}
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-4 sm:p-5 rounded-2xl bg-white/[0.03] backdrop-blur-xl border transition-all text-left cursor-pointer hover:bg-white/[0.06] ${
            statusFilter === 'all' ? 'border-white/30 shadow-lg' : 'border-white/10 shadow-xl'
          }`}
        >
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Inscritos</span>
            <Users className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
            {totalInscritos}
          </div>
          <span className="text-[11px] text-gray-400 block mt-1">
            Cadastros no sistema
          </span>
        </button>

        {/* Pending PIX (Avançaram para pagamento) */}
        <button
          onClick={() => setStatusFilter(statusFilter === 'pendente' ? 'all' : 'pendente')}
          className={`p-4 sm:p-5 rounded-2xl bg-amber-500/10 backdrop-blur-xl border transition-all text-left cursor-pointer hover:bg-amber-500/15 ${
            statusFilter === 'pendente'
              ? 'border-amber-400 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/50'
              : 'border-amber-500/30 shadow-xl'
          }`}
          title="Filtrar alunos aguardando confirmação do PIX"
        >
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <span>Aguardando PIX</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-400 font-mono">
            {pendentes.length}
          </div>
          <span className="text-[11px] text-amber-300/80 block mt-1">
            Na área de pagamento
          </span>
        </button>

        {/* Confirmed / Paid */}
        <button
          onClick={() => setStatusFilter(statusFilter === 'pago' ? 'all' : 'pago')}
          className={`p-4 sm:p-5 rounded-2xl bg-white/[0.03] backdrop-blur-xl border transition-all text-left cursor-pointer hover:bg-white/[0.06] ${
            statusFilter === 'pago'
              ? 'border-emerald-400 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/50'
              : 'border-white/10 shadow-xl'
          }`}
          title="Filtrar matrículas confirmadas"
        >
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Confirmados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono">
            {pagos.length}
          </div>
          <span className="text-[11px] text-gray-400 block mt-1">
            PIX / Matrícula paga
          </span>
        </button>

        {/* Certificates Ready */}
        <div className="p-4 sm:p-5 rounded-2xl bg-red-600/10 border border-red-500/30 text-white shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between text-red-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Certificados</span>
            <Award className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
            {concluidosComCertificado.length}
          </div>
          <span className="text-[11px] text-red-300/80 block mt-1">
            Pago + Conclusão
          </span>
        </div>

        {/* Revenue Confirmed */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-xl">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Receita</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-white font-mono">
            R$ {receitaConfirmada.toFixed(2).replace('.', ',')}
          </div>
          <span className="text-[11px] text-gray-400 block mt-1">
            Confirmada em caixa
          </span>
        </div>

        {/* Course Capacity */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-xl">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Vagas Turma</span>
            <TrendingUp className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-white font-mono">
            {vagasOcupadas}/{vagasLimite}
          </div>
          <span className="text-[11px] text-gray-400 block mt-1">
            {vagasRestantes} vagas restantes
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/10 shadow-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Buscar por Nome, CPF, WhatsApp ou Código de Certificado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-white placeholder-gray-500 text-xs sm:text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
            />
          </div>

          {/* Filter Course */}
          <div className="sm:col-span-3">
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-black/40 text-white text-xs sm:text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            >
              <option value="all" className="bg-[#0A0B0E] text-white">Todos os Minicursos</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0A0B0E] text-white">
                  {c.titulo}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div className="sm:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-black/40 text-white text-xs sm:text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            >
              <option value="all" className="bg-[#0A0B0E] text-white">Todos os Pagamentos</option>
              <option value="pago" className="bg-[#0A0B0E] text-white">Apenas Pagos</option>
              <option value="pendente" className="bg-[#0A0B0E] text-white">Apenas Pendentes</option>
              <option value="cancelado" className="bg-[#0A0B0E] text-white">Cancelados</option>
            </select>
          </div>

          {/* Filter Completion */}
          <div className="sm:col-span-2">
            <select
              value={completionFilter}
              onChange={(e) => setCompletionFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-black/40 text-white text-xs sm:text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            >
              <option value="all" className="bg-[#0A0B0E] text-white">Conclusão: Todos</option>
              <option value="concluido" className="bg-[#0A0B0E] text-white">Certificado Liberado</option>
              <option value="pendente_conclusao" className="bg-[#0A0B0E] text-white">Pendente Conclusão</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notification banner if payment confirmed */}
      {pixSuccessNotification && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 font-semibold text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{pixSuccessNotification}</span>
          </div>
          <button
            onClick={() => setPixSuccessNotification(null)}
            className="p-1 text-emerald-400 hover:text-white rounded-lg hover:bg-emerald-500/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Registrations Data Table */}
      <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Listagem de Alunos, Confirmação PIX & Credenciais Únicas
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-gray-300">
              {filteredInscricoes.length} {filteredInscricoes.length === 1 ? 'registro' : 'registros'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sincronização Ativa</span>
            </span>
          </div>

          <p className="text-xs text-gray-400">
            * Clique em <strong className="text-emerald-400">Confirmar PIX</strong> assim que o valor for creditado para gerar a credencial única do aluno.
          </p>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/10 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <th className="py-3.5 px-4 sm:px-6">Aluno / Profissional</th>
                <th className="py-3.5 px-4">Minicurso</th>
                <th className="py-3.5 px-4">Contato</th>
                <th className="py-3.5 px-4 text-center">Status PIX & Confirmação</th>
                <th className="py-3.5 px-4 text-center">Credencial & QR Code</th>
                <th className="py-3.5 px-4 text-center">Conclusão Prática</th>
                <th className="py-3.5 px-4 text-center">Certificado Digital</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs sm:text-sm">
              {filteredInscricoes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                    Nenhuma inscrição encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredInscricoes.map((item) => {
                  const curso = coursesMap[item.minicurso_id];
                  const whatsAppText = `Olá ${item.nome_completo}! Aqui é da coordenação técnica RED CODE (${curso?.titulo}).`;
                  const waUrl = buildWhatsAppLink(item.whatsapp, whatsAppText);
                  const isEligibleForCert = item.status_pagamento === 'pago' && item.concluido;

                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Aluno & CPF */}
                      <td className="py-4 px-4 sm:px-6">
                        <strong className="text-white block font-semibold text-sm">
                          {item.nome_completo}
                        </strong>
                        <span className="text-xs text-gray-400 font-mono">
                          CPF: {item.cpf}
                        </span>
                      </td>

                      {/* Minicurso */}
                      <td className="py-4 px-4 max-w-xs">
                        <span className="text-xs text-gray-200 font-medium line-clamp-2">
                          {curso ? curso.titulo : 'Minicurso APH'}
                        </span>
                        <span className="text-[11px] text-red-400 block font-mono font-bold mt-0.5">
                          R$ {curso ? curso.valor.toFixed(2).replace('.', ',') : '0,00'}
                        </span>
                      </td>

                      {/* Contato */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-red-400 hover:text-red-300"
                          >
                            <Phone className="w-3.5 h-3.5 text-red-400" />
                            <span>{item.whatsapp}</span>
                          </a>
                          <span className="text-xs text-gray-400 block truncate max-w-[180px]">
                            {item.email}
                          </span>
                        </div>
                      </td>

                      {/* Status Pagamento & Confirmação PIX */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center gap-1.5 min-w-[130px]">
                          {item.status_pagamento === 'pago' ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                Pago (PIX Confirmado)
                              </span>
                              <select
                                id={`select-status-${item.id}`}
                                disabled={updatingId === item.id}
                                value={item.status_pagamento}
                                onChange={(e) => handleUpdateStatus(item.id, e.target.value as PaymentStatus)}
                                className="text-[10px] bg-black/50 text-gray-400 border border-white/10 rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
                                title="Alterar status de pagamento"
                              >
                                <option value="pago" className="bg-[#0C0D12] text-emerald-400">✓ Pago</option>
                                <option value="pendente" className="bg-[#0C0D12] text-amber-400">⏳ Pendente</option>
                                <option value="cancelado" className="bg-[#0C0D12] text-rose-400">✕ Cancelado</option>
                              </select>
                            </div>
                          ) : item.status_pagamento === 'pendente' ? (
                            <div className="flex flex-col items-center gap-1.5">
                              <button
                                id={`btn-confirm-pix-${item.id}`}
                                disabled={updatingId === item.id}
                                onClick={() => handleConfirmPixPayment(item)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-black transition-all shadow-md shadow-emerald-600/30 border border-emerald-400/40 flex items-center gap-1.5 cursor-pointer"
                                title="Confirmar recebimento do PIX e gerar credencial do aluno com QR Code único"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                <span>Confirmar PIX</span>
                              </button>
                              <select
                                id={`select-status-${item.id}`}
                                disabled={updatingId === item.id}
                                value={item.status_pagamento}
                                onChange={(e) => {
                                  const val = e.target.value as PaymentStatus;
                                  if (val === 'pago') {
                                    handleConfirmPixPayment(item);
                                  } else {
                                    handleUpdateStatus(item.id, val);
                                  }
                                }}
                                className="text-[10px] bg-black/50 text-amber-400 border border-amber-500/30 rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
                              >
                                <option value="pendente" className="bg-[#0C0D12] text-amber-400">⏳ Pendente</option>
                                <option value="pago" className="bg-[#0C0D12] text-emerald-400">✓ Confirmar Pago</option>
                                <option value="cancelado" className="bg-[#0C0D12] text-rose-400">✕ Cancelado</option>
                              </select>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                <XCircle className="w-3.5 h-3.5" />
                                Cancelado
                              </span>
                              <button
                                onClick={() => handleUpdateStatus(item.id, 'pendente')}
                                className="text-[10px] text-gray-400 hover:text-white underline cursor-pointer"
                              >
                                Reativar Inscrição
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Credencial Oficial & QR Code Único */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            id={`btn-ticket-qr-${item.id}`}
                            onClick={() => handleOpenTicket(item)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                              item.status_pagamento === 'pago'
                                ? 'bg-red-600/20 text-red-300 border border-red-500/40 hover:bg-red-600/30 shadow-red-600/10'
                                : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                            }`}
                            title="Abrir Credencial Oficial e QR Code Único do Participante"
                          >
                            <QrCode className="w-3.5 h-3.5 text-red-400" />
                            <span>QR Code</span>
                          </button>

                          <button
                            onClick={() => handleCopyStudentLink(item.id)}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                            title="Copiar link permanente de acompanhamento e certificado deste aluno"
                          >
                            {copiedStudentId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Link2 className="w-3.5 h-3.5 text-red-400" />
                            )}
                          </button>

                          {onOpenStudentPortal && (
                            <button
                              onClick={() => onOpenStudentPortal(item.id)}
                              className="p-1.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-300 border border-red-500/20 transition-colors cursor-pointer"
                              title="Abrir página exclusiva do aluno (visão sem acesso de edição)"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <a
                            href={getParticipantWhatsAppShareUrl(item, curso || courses[0])}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors"
                            title="Enviar Confirmação e QR Code direto no WhatsApp do participante"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* Conclusão Prática */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {item.status_pagamento !== 'pago' ? (
                          <span className="text-xs text-gray-500 italic">
                            Requer Pagamento
                          </span>
                        ) : (
                          <button
                            id={`btn-toggle-completion-${item.id}`}
                            disabled={updatingId === item.id}
                            onClick={() => handleToggleCompletion(item)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 mx-auto cursor-pointer ${
                              item.concluido
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                                : 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30'
                            }`}
                            title={item.concluido ? 'Clique para desmarcar' : 'Validar conclusão e aprovação prática'}
                          >
                            {item.concluido ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Concluído ✓</span>
                              </>
                            ) : (
                              <>
                                <GraduationCap className="w-3.5 h-3.5" />
                                <span>Validar Conclusão</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>

                      {/* Certificado Digital */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {isEligibleForCert ? (
                          <button
                            id={`btn-view-cert-${item.id}`}
                            onClick={() => onOpenCertificate(item, curso || courses[0])}
                            className="btn-primary py-1.5 px-3 text-xs inline-flex items-center gap-1.5 shadow-md shadow-red-600/30"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Emitir PDF</span>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500 font-mono">
                            {item.status_pagamento !== 'pago'
                              ? 'Aguardando Pago'
                              : 'Aguardando Conclusão'}
                          </span>
                        )}
                      </td>

                      {/* Ações Gerais */}
                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.comprovante_url && (
                            <button
                              onClick={() => setSelectedProof(item.comprovante_url || null)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors cursor-pointer"
                              title="Ver Comprovante Anexado"
                            >
                              <Eye className="w-4 h-4 text-red-400" />
                            </button>
                          )}

                          {item.status_pagamento !== 'pago' ? (
                            <button
                              id={`btn-mark-paid-${item.id}`}
                              disabled={updatingId === item.id}
                              onClick={() => handleConfirmPixPayment(item)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1 cursor-pointer"
                              title="Aprovar Pagamento PIX e Gerar Credencial"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Aprovar</span>
                            </button>
                          ) : (
                            <button
                              id={`btn-mark-pending-${item.id}`}
                              disabled={updatingId === item.id}
                              onClick={() => handleUpdateStatus(item.id, 'pendente')}
                              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition-colors cursor-pointer border border-white/10"
                              title="Reverter para Pendente"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Pendente</span>
                            </button>
                          )}

                          {item.status_pagamento !== 'cancelado' && (
                            <button
                              onClick={() => handleUpdateStatus(item.id, 'cancelado')}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Cancelar Inscrição"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Visualização de Comprovante */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0A0B0E] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white tracking-tight">
                Comprovante de Pagamento Anexado
              </h3>
              <button
                onClick={() => setSelectedProof(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto rounded-xl border border-white/10 p-2 flex items-center justify-center bg-black/40">
              {selectedProof.startsWith('data:image') || selectedProof.startsWith('http') ? (
                <img
                  src={selectedProof}
                  alt="Comprovante de Pagamento"
                  className="max-h-80 object-contain rounded"
                />
              ) : (
                <div className="p-8 text-center text-xs text-gray-400">
                  Arquivo anexado.
                  <a
                    href={selectedProof}
                    target="_blank"
                    rel="noreferrer"
                    className="block mt-2 font-bold text-red-400 underline"
                  >
                    Abrir anexo
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedProof(null)}
                className="btn-primary text-xs py-2 px-4"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal da Credencial Oficial do Participante com QR Code Único */}
      {selectedTicketItem && (
        <ParticipantTicketModal
          isOpen={!!selectedTicketItem}
          onClose={() => setSelectedTicketItem(null)}
          inscricao={selectedTicketItem.inscricao}
          curso={selectedTicketItem.curso}
        />
      )}

      {/* Modal de Configuração de Domínio / URL Base Pública */}
      {isDomainModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0F1117] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setIsDomainModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">
                    Configuração de Domínio / URL Pública
                  </h3>
                  <p className="text-xs text-gray-400">
                    Acesso 100% público e independente de contas Google
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/25 text-xs text-emerald-300 leading-relaxed space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Por que o erro "Page not found" acontecia?</span>
              </div>
              <p>
                O endereço interno <code className="bg-black/40 px-1 py-0.5 rounded text-red-300">ais-dev-*.run.app</code> exige autenticação na conta do desenvolvedor. A plataforma converte agora automaticamente para o endereço de distribuição pública livre <code className="bg-black/40 px-1 py-0.5 rounded text-emerald-300">ais-pre-*.run.app</code>, que funciona instantaneamente em qualquer celular, computador ou aba anônima.
              </p>
            </div>

            <form onSubmit={handleSaveCustomDomain} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  URL Base Atual em Uso:
                </label>
                <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 font-mono text-xs text-red-400 select-all break-all">
                  {getEffectivePublicOrigin()}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Personalizar Domínio Próprio (Opcional):
                </label>
                <input
                  type="url"
                  value={customDomainInput}
                  onChange={(e) => setCustomDomainInput(e.target.value)}
                  placeholder="https://exemplo.com.br ou URL do seu Cloud Run"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/15 focus:border-red-500 rounded-xl text-sm text-white focus:outline-none font-mono"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Deixe vazio para usar a URL pública oficial auto-detectada.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetCustomDomain}
                  className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Restaurar Padrão Automático
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDomainModalOpen(false)}
                    className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                  >
                    Salvar Configuração
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
