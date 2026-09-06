import React, { useState, useEffect } from 'react';
import { Minicurso, Inscricao } from '../types';
import { RedCodeLogo } from './RedCodeLogo';
import { DataService } from '../lib/supabase';
import {
  buildParticipantTicketData,
  generateParticipantTicketQrCode,
  getCourseInstructors,
  getParticipantProtocol,
  getStudentPortalUrl,
  buildWhatsAppTicketMessage
} from '../utils/participantTicket';
import {
  generateVectorCertificatePdf,
  triggerFileDownload
} from '../utils/certificatePdf';
import {
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
  Award,
  QrCode,
  Download,
  Share2,
  Copy,
  Check,
  FileCheck,
  AlertCircle,
  ExternalLink,
  Phone,
  Mail,
  Instagram,
  UserCheck,
  ShieldCheck,
  RefreshCw,
  Printer,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';

interface StudentPortalProps {
  inscricaoId: string;
  onNavigateToRegistration: () => void;
  onOpenCertificateModal?: (inscricao: Inscricao, curso: Minicurso) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  inscricaoId,
  onNavigateToRegistration,
  onOpenCertificateModal
}) => {
  const [inscricao, setInscricao] = useState<Inscricao | null>(null);
  const [curso, setCurso] = useState<Minicurso | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isCopiedPix, setIsCopiedPix] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Carrega dados da inscrição e minicurso
  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const reg = await DataService.getRegistrationById(inscricaoId);
      if (!reg) {
        setError('Inscrição não encontrada com o identificador informado. Digite seu CPF ou E-mail abaixo para localizar.');
        setLoading(false);
        setIsRefreshing(false);
        return;
      }
      setInscricao(reg);

      const coursesRes = await DataService.getCourses();
      const course = coursesRes.data.find((c) => c.id === reg.minicurso_id) || coursesRes.data[0];
      setCurso(course);

      // Gera QR code da credencial
      if (reg && course) {
        const qr = await generateParticipantTicketQrCode(reg, course, 340);
        setQrCodeUrl(qr);
      }
      setError(null);
    } catch (err: any) {
      console.error('Erro ao carregar dados do portal do aluno:', err);
      setError('Não foi possível carregar os dados. Tente novamente.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleLookupByCpfOrEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const regs = await DataService.getAllRegistrations();
      const cleanDigits = query.replace(/\D/g, '');
      const queryLower = query.toLowerCase();

      const found = regs.data.find((item) => {
        const itemCpfClean = (item.cpf || '').replace(/\D/g, '');
        const itemEmail = (item.email || '').toLowerCase();
        const itemPhoneClean = (item.whatsapp || '').replace(/\D/g, '');
        const itemId = item.id;

        return (
          itemId === query ||
          (cleanDigits.length >= 7 && itemCpfClean.includes(cleanDigits)) ||
          (itemEmail.length > 3 && itemEmail === queryLower) ||
          (cleanDigits.length >= 8 && itemPhoneClean.includes(cleanDigits))
        );
      });

      if (found) {
        setInscricao(found);
        const coursesRes = await DataService.getCourses();
        const course = coursesRes.data.find((c) => c.id === found.minicurso_id) || coursesRes.data[0];
        setCurso(course);
        const qr = await generateParticipantTicketQrCode(found, course, 340);
        setQrCodeUrl(qr);
        setError(null);

        // Atualiza URL amigável
        try {
          const newUrl = `?inscricao=${found.id}`;
          window.history.pushState({ inscricaoId: found.id }, '', newUrl);
        } catch {
          // ignora
        }
      } else {
        setSearchError('Nenhuma inscrição encontrada com este CPF, E-mail ou Telefone. Verifique os dados digitados ou realize uma nova inscrição.');
      }
    } catch (err) {
      console.error('Erro na busca de inscrição:', err);
      setSearchError('Erro ao buscar. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (inscricaoId) {
      loadData();
    } else {
      setLoading(false);
      setError('Acesse informando seu CPF ou realize sua inscrição.');
    }
  }, [inscricaoId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-white">Carregando seu Portal do Aluno...</h2>
        <p className="text-sm text-gray-400">Verificando status de inscrição e autenticação na base RED CODE.</p>
      </div>
    );
  }

  if (error || !inscricao || !curso) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Acessar Portal do Aluno</h2>
          <p className="text-sm text-gray-400">
            {error || 'Informe seu CPF ou E-mail para consultar sua credencial e status de pagamento.'}
          </p>
        </div>

        {/* Formulário de Busca */}
        <form onSubmit={handleLookupByCpfOrEmail} className="p-6 rounded-3xl bg-[#14161F] border border-white/10 space-y-4 shadow-xl">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              CPF, E-mail ou Código da Inscrição:
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Digite seu CPF (apenas números) ou E-mail"
              className="w-full px-4 py-3 bg-white/5 border border-white/15 focus:border-red-500 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none"
              required
            />
          </div>

          {searchError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
              {searchError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSearching}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer"
          >
            {isSearching ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <span>Localizar Minha Inscrição</span>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-gray-500 mb-3">Ainda não realizou sua inscrição no treinamento?</p>
          <button
            onClick={onNavigateToRegistration}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 inline-flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>Ir para Página de Inscrição</span>
            <ArrowRight className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
    );
  }

  const isPaid = inscricao.status_pagamento === 'pago';
  const isCompleted = Boolean(inscricao.concluido);
  const protocol = getParticipantProtocol(inscricao);
  const ticketData = buildParticipantTicketData(inscricao, curso);
  const instructors = getCourseInstructors(curso);
  const portalUrl = getStudentPortalUrl(inscricao.id);

  const eventDate = new Date(curso.data_evento);
  const formattedDate = eventDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setIsCopiedLink(true);
    setTimeout(() => setIsCopiedLink(false), 3000);
  };

  const handleCopyPix = () => {
    const pixKey = 'red.codearea17@gmail.com';
    navigator.clipboard.writeText(pixKey);
    setIsCopiedPix(true);
    setTimeout(() => setIsCopiedPix(false), 3000);
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `Olá! Segue minha credencial oficial e link de acompanhamento no Treinamento RED CODE:\n\n` +
      `📌 Aluno: ${inscricao.nome_completo}\n` +
      `🩺 Treinamento: ${curso.titulo}\n` +
      `🎟️ Credencial: ${protocol}\n` +
      `🔗 Acompanhe online: ${portalUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
  };

  const handleDownloadCertificate = () => {
    setIsDownloadingPdf(true);
    try {
      const { blob, filename } = generateVectorCertificatePdf({
        inscricao,
        curso,
        certCode: inscricao.codigo_certificado || undefined
      });
      triggerFileDownload(blob, filename);
    } catch (err) {
      console.error('Erro ao gerar certificado:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-fadeIn">
      {/* Top Banner de Identificação do Aluno */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Portal Oficial do Aluno
              </span>

              {isPaid ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Vaga Confirmada & Garantida
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Aguardando Pagamento PIX
                </span>
              )}

              {isCompleted && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  Certificado Liberado
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Olá, {inscricao.nome_completo}
            </h1>

            <p className="text-xs sm:text-sm text-gray-300 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono">
              <span>CPF: {inscricao.cpf}</span>
              <span className="text-gray-500">•</span>
              <span>Protocolo: <strong className="text-red-400">{protocol}</strong></span>
              <span className="text-gray-500">•</span>
              <span>Inscrito em: {new Date(inscricao.created_at).toLocaleDateString('pt-BR')}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
              title="Atualizar status da inscrição"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-red-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Atualizando...' : 'Atualizar Status'}</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-red-600/10"
              title="Copiar link permanente desta página"
            >
              {isCopiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Link Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salvar / Copiar Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stepper de 4 Etapas do Aluno */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Etapa 1: Inscrição */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Etapa 1</p>
              <h4 className="text-xs font-bold text-white">Inscrição Efetuada</h4>
              <p className="text-[10px] text-emerald-400">Dados Confirmados</p>
            </div>
          </div>

          {/* Etapa 2: Pagamento PIX */}
          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
            isPaid
              ? 'bg-emerald-500/5 border-emerald-500/20'
              : 'bg-amber-500/5 border-amber-500/20'
          }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isPaid
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {isPaid ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Etapa 2</p>
              <h4 className="text-xs font-bold text-white">Pagamento PIX</h4>
              <p className={`text-[10px] font-semibold ${isPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isPaid ? 'Aprovado ✓' : 'Aguardando PIX'}
              </p>
            </div>
          </div>

          {/* Etapa 3: Treinamento Presencial */}
          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
            isCompleted
              ? 'bg-emerald-500/5 border-emerald-500/20'
              : 'bg-white/[0.02] border-white/5'
          }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isCompleted
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-white/10 text-gray-400 border border-white/10'
            }`}>
              {isCompleted ? <Check className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Etapa 3</p>
              <h4 className="text-xs font-bold text-white">Treinamento Prático</h4>
              <p className="text-[10px] text-gray-400">
                {isCompleted ? 'Aprovado 100%' : 'No dia do evento'}
              </p>
            </div>
          </div>

          {/* Etapa 4: Certificado Digital */}
          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
            isCompleted
              ? 'bg-amber-500/10 border-amber-500/30'
              : 'bg-white/[0.02] border-white/5'
          }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isCompleted
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-white/10 text-gray-400 border border-white/10'
            }`}>
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Etapa 4</p>
              <h4 className="text-xs font-bold text-white">Certificado PDF</h4>
              <p className={`text-[10px] font-semibold ${isCompleted ? 'text-amber-400' : 'text-gray-500'}`}>
                {isCompleted ? 'Liberado para Download' : 'Aguardando prática'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Seção Principal: Credencial Oficial com QR Code & Ação de Pagamento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Coluna Esquerda: Credencial Oficial do Participante */}
        <div className="lg:col-span-2 space-y-8">
          {/* Card da Credencial Oficial */}
          <div className="relative rounded-3xl bg-[#090A0F] border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div className="flex items-center gap-3">
                <RedCodeLogo size="sm" showTagline={false} variant="emblem" />
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">
                    Credencial Oficial de Acesso
                  </h3>
                  <p className="text-xs text-gray-400">
                    Apresente este QR Code na entrada do treinamento
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShareWhatsApp}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Enviar para meu WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Enviar no WhatsApp</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Imprimir credencial"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Imprimir</span>
                </button>
              </div>
            </div>

            {/* Conteúdo da Credencial */}
            <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-4 bg-white/[0.03] rounded-2xl border border-white/10 text-center space-y-3">
                <div className="w-48 h-48 sm:w-52 sm:h-52 bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center">
                  {qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt="QR Code da Credencial"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <QrCode className="w-12 h-12 animate-pulse" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-mono font-bold text-red-400">
                    {protocol}
                  </span>
                  <p className="text-[10px] text-gray-400">
                    QR Code Único e Inviolável
                  </p>
                </div>
              </div>

              {/* Informações Estruturadas do Aluno e Treinamento */}
              <div className="md:col-span-2 space-y-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                    Treinamento Inscrito
                  </span>
                  <h4 className="text-base sm:text-lg font-bold text-white leading-snug">
                    {curso.titulo}
                  </h4>
                  <p className="text-xs text-gray-400 line-clamp-2">
                    {curso.descricao}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase">Data do Evento</span>
                      <p className="text-gray-200 font-semibold">{formattedDate}</p>
                      <p className="text-gray-400 text-[11px]">Horário: {ticketData.horario}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase">Carga Horária</span>
                      <p className="text-gray-200 font-semibold">{curso.carga_horaria || 20} Horas Certificadas</p>
                      <p className="text-gray-400 text-[11px]">Diretrizes ILCOR/AHA</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5 sm:col-span-2">
                    <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase">Local do Treinamento</span>
                      <p className="text-gray-200 font-semibold">{curso.local || 'Centro de Simulação Realística APH'}</p>
                      <p className="text-gray-400 text-[11px]">Auditório & Laboratório de Habilidades de Urgência</p>
                    </div>
                  </div>
                </div>

                {/* Instrutores Cadastrados */}
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-red-400" />
                    Corpo Docente & Instrutores do Evento:
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {instructors.map((inst, idx) => (
                      <div
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300 font-medium text-[11px]"
                      >
                        <strong className="text-white">{inst.nome}</strong>
                        {inst.registro && <span className="text-red-400 ml-1">({inst.registro})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seção de Certificado Oficial (Quando Concluído) */}
          {isCompleted ? (
            <div className="rounded-3xl bg-gradient-to-br from-amber-500/10 via-white/[0.02] to-transparent border border-amber-500/30 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 inline-flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />
                    Certificação Concluída
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Seu Certificado Oficial Está Liberado!
                  </h3>
                  <p className="text-xs text-gray-300">
                    Você concluiu satisfatoriamente a carga horária de {curso.carga_horaria || 20}h práticas.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleDownloadCertificate}
                    disabled={isDownloadingPdf}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs sm:text-sm shadow-xl shadow-red-600/30 flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isDownloadingPdf ? 'Baixando...' : 'Baixar Certificado em PDF (HD)'}</span>
                  </button>

                  {onOpenCertificateModal && (
                    <button
                      onClick={() => onOpenCertificateModal(inscricao, curso)}
                      className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm border border-white/20 flex items-center gap-2 cursor-pointer"
                    >
                      <FileCheck className="w-4 h-4 text-amber-400" />
                      <span>Visualizar em Tela Cheia</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-xs font-mono text-gray-300 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-gray-500">Chave de Registro:</span>{' '}
                  <strong className="text-red-400">{inscricao.codigo_certificado || protocol}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Validade Jurídica:</span>{' '}
                  <strong className="text-emerald-400">Lei Federal nº 9.394/96</strong>
                </div>
              </div>
            </div>
          ) : (
            /* Banner informativo sobre liberação do certificado */
            <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5 text-xs text-gray-400 flex items-start gap-3">
              <Info className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-gray-200">Como funciona a liberação do Certificado?</strong>
                <p className="mt-0.5 leading-relaxed">
                  O Certificado Digital Oficial com QR Code e carga horária certificada é liberado diretamente aqui nesta página logo após a validação da sua participação prática no dia do evento pelos instrutores.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Coluna Direita: Status do Pagamento, Instruções e Suporte */}
        <div className="space-y-6">
          {/* Card de Pagamento */}
          <div className="rounded-3xl bg-[#090A0F] border border-white/10 p-6 backdrop-blur-xl shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 ${isPaid ? 'text-emerald-400' : 'text-amber-400'}`} />
                Status do Pagamento
              </h4>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isPaid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {isPaid ? 'PAGO / CONFIRMADO' : 'PENDENTE'}
              </span>
            </div>

            {isPaid ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <Check className="w-5 h-5" />
                  </div>
                  <h5 className="text-sm font-bold text-emerald-300">
                    Pagamento Validado pela Coordenação
                  </h5>
                  <p className="text-xs text-emerald-200/80">
                    Sua matrícula está 100% regularizada. Não há pendências financeiras.
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-white/5 text-gray-400">
                    <span>Valor Pago:</span>
                    <strong className="text-white">R$ {(inscricao.valor_pago || curso.valor).toFixed(2).replace('.', ',')}</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/5 text-gray-400">
                    <span>Forma:</span>
                    <strong className="text-white">PIX Oficial</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-xs">
                  <p className="text-amber-200 font-semibold">
                    Realize o PIX para garantir sua vaga:
                  </p>
                  <div className="text-xl font-black text-white">
                    R$ {curso.valor.toFixed(2).replace('.', ',')}
                  </div>
                </div>

                {/* Chave PIX Oficial */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-gray-400">
                    Chave PIX Oficial (E-mail):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value="red.codearea17@gmail.com"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-gray-200"
                    />
                    <button
                      onClick={handleCopyPix}
                      className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shrink-0 cursor-pointer"
                    >
                      {isCopiedPix ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href={`https://api.whatsapp.com/send?phone=5517997426187&text=${encodeURIComponent(
                      `Olá! Acabei de fazer o PIX da minha inscrição no curso ${curso.titulo}. Aluno: ${inscricao.nome_completo} (CPF: ${inscricao.cpf})`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Avisar Coordenação no WhatsApp</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Card: Orientações Práticas para o Aluno */}
          <div className="rounded-3xl bg-[#090A0F] border border-white/10 p-6 backdrop-blur-xl shadow-2xl space-y-4 text-xs">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-500" />
              Orientações para o Dia
            </h4>

            <ul className="space-y-2.5 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span>Chegar com <strong>15 minutos de antecedência</strong> para conferência da credencial.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span>Traje: Calçado fechado e calça confortável para as estações práticas de simulação realística.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span>Apresente o <strong>QR Code desta página</strong> na recepção para registrar sua presença.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span>Material didático e equipamentos de simulação são fornecidos pela RED CODE.</span>
              </li>
            </ul>
          </div>

          {/* Card: Canais de Atendimento da Coordenação */}
          <div className="rounded-3xl bg-[#090A0F] border border-white/10 p-6 backdrop-blur-xl shadow-2xl space-y-3 text-xs">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Phone className="w-4 h-4 text-red-400" />
              Canais Oficiais RED CODE
            </h4>

            <div className="space-y-2 text-gray-400">
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-red-400" />
                <a href="mailto:red.codearea17@gmail.com" className="text-gray-300 hover:text-red-400">
                  red.codearea17@gmail.com
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Instagram className="w-3.5 h-3.5 text-red-400" />
                <a
                  href="https://www.instagram.com/red.code17?stkn=MXB0bmgxM2U2bGFkcw=="
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-red-400"
                >
                  @red.code17
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
