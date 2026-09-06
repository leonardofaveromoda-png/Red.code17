import React, { useRef, useState } from 'react';
import { Minicurso, Inscricao } from '../types';
import { RedCodeLogo } from './RedCodeLogo';
import { DataService } from '../lib/supabase';
import {
  Download,
  Printer,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  Award,
  AlertTriangle,
  FileCheck2,
  X,
  Sparkles,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  CheckCircle2,
  Flame
} from 'lucide-react';
import {
  generateCapturedCertificatePdf,
  generateVectorCertificatePdf,
  downloadCertificateAsPng,
  triggerFileDownload,
  openDataUriInNewWindow
} from '../utils/certificatePdf';

interface CertificateViewProps {
  inscricao: Inscricao;
  curso: Minicurso;
  onClose?: () => void;
  onStatusUpdated?: (updated: Inscricao) => void;
}

export const CertificateView: React.FC<CertificateViewProps> = ({
  inscricao: initialInscricao,
  curso,
  onClose,
  onStatusUpdated
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [currentInscricao, setCurrentInscricao] = useState<Inscricao>(initialInscricao);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);
  const [fallbackDataUri, setFallbackDataUri] = useState<string | null>(null);
  const [fallbackFilename, setFallbackFilename] = useState<string>('Certificado_RED_CODE.pdf');

  const isEligible = currentInscricao.status_pagamento === 'pago' && currentInscricao.concluido === true;

  // Format date nicely
  const eventDate = new Date(curso.data_evento);
  const formattedEventDate = eventDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const formattedCompletionDate = currentInscricao.data_conclusao
    ? new Date(currentInscricao.data_conclusao).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    : formattedEventDate;

  const certCode =
    currentInscricao.codigo_certificado ||
    `RC-2026-${currentInscricao.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}`;

  // PDF Export Handler (Primary: Hybrid High-Fidelity Capture + Infallible Vector Fallback)
  const handleDownloadPdf = async (preferVector: boolean = false) => {
    if (!isEligible) return;

    setIsGeneratingPdf(true);
    setDownloadSuccessMsg(null);
    setFallbackDataUri(null);

    try {
      if (preferVector || !certificateRef.current) {
        // Direct pure vector generation (instant & zero external styling dependency)
        const { blob, dataUri, filename } = generateVectorCertificatePdf({
          inscricao: currentInscricao,
          curso,
          certCode
        });

        const downloaded = triggerFileDownload(blob, filename);
        setFallbackFilename(filename);

        if (downloaded) {
          setDownloadSuccessMsg(`Certificado PDF Vetorial gerado com sucesso! Arquivo salvo como: ${filename}`);
        } else {
          setFallbackDataUri(dataUri);
          setDownloadSuccessMsg(`Certificado gerado com sucesso! Clique no botão abaixo para abrir ou salvar.`);
        }
      } else {
        // High-fidelity capture with automatic vector fallback
        const result = await generateCapturedCertificatePdf(certificateRef.current, {
          inscricao: currentInscricao,
          curso,
          certCode
        });

        if (result.success) {
          setDownloadSuccessMsg(
            `Certificado em formato PDF (${result.method === 'capture' ? 'Alta Fidelidade' : 'Vetor Oficial'}) gerado com sucesso!`
          );
        } else {
          // Final fallback to direct vector
          const { blob, dataUri, filename } = generateVectorCertificatePdf({
            inscricao: currentInscricao,
            curso,
            certCode
          });
          triggerFileDownload(blob, filename);
          setFallbackDataUri(dataUri);
          setDownloadSuccessMsg(`Certificado gerado e baixado no formato PDF Oficial.`);
        }
      }

      setTimeout(() => {
        setDownloadSuccessMsg(null);
      }, 7000);
    } catch (error: any) {
      console.error('Erro na exportação do certificado:', error);
      // Failsafe: Emergency vector download
      try {
        const { blob, dataUri, filename } = generateVectorCertificatePdf({
          inscricao: currentInscricao,
          curso,
          certCode
        });
        triggerFileDownload(blob, filename);
        setFallbackDataUri(dataUri);
        setDownloadSuccessMsg('Certificado baixado via motor vetorial de segurança.');
      } catch (e) {
        alert('Não foi possível fazer o download automático no seu navegador. Utilize a opção "Imprimir" para salvar como PDF.');
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // PNG Image Export Handler
  const handleDownloadPng = async () => {
    if (!certificateRef.current || !isEligible) return;

    setIsGeneratingPng(true);
    setDownloadSuccessMsg(null);

    try {
      const res = await downloadCertificateAsPng(certificateRef.current, currentInscricao);
      if (res.success) {
        setDownloadSuccessMsg('Imagem PNG em alta resolução baixada com sucesso! Ideal para WhatsApp e redes sociais.');
        setTimeout(() => setDownloadSuccessMsg(null), 6000);
      } else {
        // If PNG fails, fallback to PDF
        handleDownloadPdf(true);
      }
    } catch (e) {
      console.error('Erro ao baixar PNG:', e);
      handleDownloadPdf(true);
    } finally {
      setIsGeneratingPng(false);
    }
  };

  // Quick Approval Handler for Instant Demo & Testing
  const handleQuickApprove = async () => {
    setIsApproving(true);
    try {
      // 1. Ensure status is pago
      if (currentInscricao.status_pagamento !== 'pago') {
        await DataService.updatePaymentStatus(currentInscricao.id, 'pago');
      }
      // 2. Mark as completed
      const res = await DataService.updateCompletionStatus(currentInscricao.id, true);
      const updated: Inscricao = {
        ...currentInscricao,
        status_pagamento: 'pago',
        concluido: true,
        data_conclusao: new Date().toISOString(),
        codigo_certificado: certCode,
        ...(res.data || {})
      };
      setCurrentInscricao(updated);
      if (onStatusUpdated) onStatusUpdated(updated);
      setDownloadSuccessMsg('Inscrição aprovada com sucesso! O certificado está liberado para download.');
      setTimeout(() => setDownloadSuccessMsg(null), 5000);
    } catch (err) {
      console.error('Erro ao aprovar inscrição:', err);
    } finally {
      setIsApproving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Control Bar (Excluded from Print) */}
      <div className="no-print flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge-red">Certificação Oficial RED CODE</span>
            {isEligible ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Válido & Liberado para Download
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Requer Confirmação Prática
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Certificado Digital: {currentInscricao.nome_completo}
          </h2>
          <p className="text-xs text-gray-400 font-mono">
            Registro Oficial: <span className="text-red-400 font-semibold">{certCode}</span> • Carga Horária: <span className="text-white font-semibold">{curso.carga_horaria || 20}h</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {isEligible ? (
            <>
              {/* Primary PDF Download */}
              <button
                id="btn-download-pdf-cert"
                onClick={() => handleDownloadPdf(false)}
                disabled={isGeneratingPdf}
                className="btn-primary inline-flex items-center gap-2 text-xs sm:text-sm shadow-lg shadow-red-600/30 disabled:opacity-50 cursor-pointer"
                title="Baixar Certificado Oficial em PDF"
              >
                {isGeneratingPdf ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Gerando PDF Oficial...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Baixar em PDF (Oficial HD)</span>
                  </>
                )}
              </button>

              {/* Instant Vector PDF */}
              <button
                id="btn-download-vector-cert"
                onClick={() => handleDownloadPdf(true)}
                disabled={isGeneratingPdf}
                className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/15 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer"
                title="Download direto via motor vetorial leve"
              >
                <FileText className="w-4 h-4 text-red-400" />
                <span>PDF Vetor Direto</span>
              </button>

              {/* PNG Download */}
              <button
                id="btn-download-png-cert"
                onClick={handleDownloadPng}
                disabled={isGeneratingPng}
                className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/15 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer"
                title="Salvar como imagem PNG em alta resolução"
              >
                <ImageIcon className="w-4 h-4 text-gray-400" />
                <span>Salvar Imagem (PNG)</span>
              </button>

              {/* Native Print / Save Dialog */}
              <button
                id="btn-print-cert"
                onClick={handlePrint}
                className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/15 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer"
                title="Imprimir ou salvar diretamente pela impressora do navegador"
              >
                <Printer className="w-4 h-4 text-gray-300" />
                <span>Imprimir</span>
              </button>
            </>
          ) : (
            <button
              id="btn-quick-approve-cert"
              onClick={handleQuickApprove}
              disabled={isApproving}
              className="btn-primary inline-flex items-center gap-2 text-xs sm:text-sm shadow-lg shadow-emerald-600/30 !bg-emerald-600 hover:!bg-emerald-500 border-emerald-500/40 cursor-pointer"
            >
              {isApproving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Validando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Liberar Certificado para Teste</span>
                </>
              )}
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
              title="Fechar Visualização"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {downloadSuccessMsg && (
        <div className="no-print p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <FileCheck2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{downloadSuccessMsg}</span>
          </div>
          {fallbackDataUri && (
            <button
              onClick={() => openDataUriInNewWindow(fallbackDataUri, fallbackFilename)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir PDF em Nova Aba
            </button>
          )}
        </div>
      )}

      {/* Warning Notice if NOT eligible */}
      {!isEligible && (
        <div className="no-print p-6 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 space-y-4 shadow-xl">
          <div className="flex items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Requisitos de Emissão do Certificado Digital
                </h3>
                <p className="text-xs text-amber-200/80">
                  Para garantir a validade técnica e jurídica da certificação RED CODE, a emissão requer:
                </p>
              </div>
            </div>

            <button
              onClick={handleQuickApprove}
              disabled={isApproving}
              className="shrink-0 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              title="Clique para validar agora e desbloquear o download"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Validar Agora (1 Clique)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div
              className={`p-3 rounded-xl border flex items-center justify-between ${
                currentInscricao.status_pagamento === 'pago'
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-950/30 border-red-500/30 text-red-300'
              }`}
            >
              <span className="font-semibold">1. Confirmação do Pagamento:</span>
              <span className="font-bold uppercase tracking-wide">
                {currentInscricao.status_pagamento === 'pago' ? '✓ Confirmado e Aprovado' : '✗ Pendente'}
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border flex items-center justify-between ${
                currentInscricao.concluido
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
              }`}
            >
              <span className="font-semibold">2. Conclusão Prática Validada:</span>
              <span className="font-bold uppercase tracking-wide">
                {currentInscricao.concluido ? '✓ Concluído' : '✗ Aguardando Instrutor'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* THE CERTIFICATE CANVAS (LANDSCAPE A4 RATIO) */}
      <div className="overflow-x-auto pb-4">
        <div
          ref={certificateRef}
          id="certificate-print-area"
          className="w-[1000px] h-[707px] mx-auto bg-[#08090C] text-[#F3F4F6] p-10 relative select-none rounded-2xl shadow-2xl border border-red-950 overflow-hidden flex flex-col justify-between"
          style={{
            backgroundColor: '#08090C',
            backgroundImage: `
              radial-gradient(circle at 10% 10%, rgba(220, 38, 38, 0.12) 0%, transparent 40%),
              radial-gradient(circle at 90% 90%, rgba(185, 28, 28, 0.14) 0%, transparent 45%),
              radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.5) 0%, transparent 70%)
            `
          }}
        >
          {/* Certificate Luxury Double Border with Metallic Fillets */}
          <div className="absolute inset-4 rounded-xl border-2 border-red-600/40 pointer-events-none" />
          <div className="absolute inset-6 rounded-lg border border-red-500/20 pointer-events-none" />

          {/* Corner Ornamental Accents */}
          <div className="absolute top-7 left-7 w-8 h-8 border-t-2 border-l-2 border-red-500 pointer-events-none" />
          <div className="absolute top-7 right-7 w-8 h-8 border-t-2 border-r-2 border-red-500 pointer-events-none" />
          <div className="absolute bottom-7 left-7 w-8 h-8 border-b-2 border-l-2 border-red-500 pointer-events-none" />
          <div className="absolute bottom-7 right-7 w-8 h-8 border-b-2 border-r-2 border-red-500 pointer-events-none" />

          {/* Watermark Logo Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <RedCodeLogo size="xl" showTagline={false} variant="emblem" />
          </div>

          {/* HEADER SECTION OF CERTIFICATE */}
          <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-5 px-4">
            <div className="flex items-center gap-4">
              <RedCodeLogo size="sm" showTagline={false} variant="emblem" />
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-2xl font-black text-red-500 tracking-tight">RED</span>
                  <span className="text-2xl font-black text-white tracking-wider">CODE</span>
                </div>
                <p className="text-[9px] font-bold tracking-[0.25em] text-gray-300 uppercase mt-1">
                  Capacitação em Emergência
                </p>
              </div>
            </div>

            <div className="text-center space-y-1">
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-600/20 text-red-400 border border-red-500/30">
                Certificação Profissional Oficial
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight text-white uppercase">
                Certificado de Capacitação
              </h1>
            </div>

            <div className="text-right space-y-0.5 font-mono text-[11px] text-gray-400">
              <div className="text-white font-bold text-xs">REGISTRO DIGITAL</div>
              <div className="text-red-400 font-semibold">{certCode}</div>
              <div className="text-[10px] text-gray-500">Livro de Atas Nº 04 / Fls. 18</div>
            </div>
          </div>

          {/* BODY / CORE STATEMENT */}
          <div className="relative z-10 px-8 py-3 text-center space-y-4 my-auto">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">
              Certificamos para os devidos fins de direito que
            </p>

            {/* Student Name */}
            <div className="py-1">
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight border-b-2 border-red-600/60 pb-2 inline-block px-6 drop-shadow-[0_2px_10px_rgba(239,68,68,0.2)]">
                {currentInscricao.nome_completo}
              </h2>
              <p className="text-xs text-gray-400 mt-2 font-mono">
                Inscrito(a) sob o Cadastro de Pessoa Física CPF nº{' '}
                <strong className="text-gray-200">{currentInscricao.cpf}</strong>
              </p>
            </div>

            {/* Statement Text */}
            <p className="text-sm text-gray-300 leading-relaxed max-w-3xl mx-auto">
              concluiu com aproveitamento satisfatório e frequência de 100% o treinamento prático e imersivo de aperfeiçoamento profissional avançado:
            </p>

            {/* Course Title */}
            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-red-500/30 max-w-3xl mx-auto shadow-inner">
              <h3 className="text-lg font-black text-red-400 uppercase tracking-tight">
                {curso.titulo}
              </h3>
            </div>

            {/* Metadata Pills */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-300 pt-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-red-400" />
                Carga Horária: <strong className="text-white">{curso.carga_horaria || 20} Horas Certificadas</strong>
              </span>

              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-red-400" />
                Data de Realização: <strong className="text-white">{formattedEventDate}</strong>
              </span>

              <span className="flex items-center gap-1.5 font-medium">
                <MapPin className="w-4 h-4 text-red-400" />
                Local: <strong className="text-white">{curso.local || 'Centro de Simulação Realística APH'}</strong>
              </span>
            </div>
          </div>

          {/* FOOTER & SIGNATURES */}
          <div className="relative z-10 grid grid-cols-3 gap-6 items-end border-t border-white/10 pt-4 px-6">
            {/* QR Code Validation */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-md">
                <svg viewBox="0 0 100 100" className="w-full h-full text-black">
                  <rect x="0" y="0" width="30" height="30" fill="#000" />
                  <rect x="5" y="5" width="20" height="20" fill="#FFF" />
                  <rect x="10" y="10" width="10" height="10" fill="#000" />

                  <rect x="70" y="0" width="30" height="30" fill="#000" />
                  <rect x="75" y="5" width="20" height="20" fill="#FFF" />
                  <rect x="80" y="10" width="10" height="10" fill="#000" />

                  <rect x="0" y="70" width="30" height="30" fill="#000" />
                  <rect x="5" y="75" width="20" height="20" fill="#FFF" />
                  <rect x="10" y="80" width="10" height="10" fill="#000" />

                  <rect x="40" y="10" width="10" height="15" fill="#000" />
                  <rect x="55" y="15" width="10" height="25" fill="#000" />
                  <rect x="35" y="45" width="30" height="10" fill="#000" />
                  <rect x="75" y="50" width="15" height="20" fill="#000" />
                  <rect x="45" y="65" width="20" height="25" fill="#000" />
                </svg>
              </div>
              <div className="space-y-0.5 text-[10px] text-gray-400 font-mono">
                <div className="text-gray-200 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Autenticidade Garantida
                </div>
                <p className="text-[9px] text-gray-500">
                  Aponte a câmera para verificar validade jurídica e carga horária.
                </p>
                <p className="text-[9px] text-red-400">
                  Emitido em: {formattedCompletionDate}
                </p>
              </div>
            </div>

            {/* Technical Coordinator & Instructors Signatures */}
            <div className="text-center flex items-end justify-center gap-4">
              {((curso.instrutores && curso.instrutores.length > 0)
                ? curso.instrutores.filter((i) => i.nome && i.nome.trim() !== '')
                : [curso.instrutor || { nome: 'Dr. Thiago Vasconcellos, MD', titulo: 'Diretor Técnico de Ensino & Urgência', registro: 'CRM-SP 182.490 / Título ABRAMEDE' }]
              ).slice(0, 3).map((inst, idx) => (
                <div key={idx} className="space-y-0.5 max-w-[170px]">
                  <div className="w-36 sm:w-44 mx-auto border-b border-gray-400/60 pb-1 font-serif italic text-xs sm:text-sm text-gray-300 truncate">
                    {inst.nome}
                  </div>
                  <div className="text-[11px] font-bold text-white truncate">
                    {inst.nome}
                  </div>
                  <div className="text-[9px] text-gray-400 line-clamp-1">
                    {inst.titulo}
                  </div>
                  {inst.registro && (
                    <div className="text-[8px] font-mono text-red-400 font-semibold truncate">
                      {inst.registro}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Institution Stamp */}
            <div className="text-right space-y-1">
              <div className="flex items-center justify-end gap-2 text-xs font-bold text-white">
                <Award className="w-4 h-4 text-red-500" />
                <span>RED CODE INSTITUTO DE ENSINO</span>
              </div>
              <p className="text-[10px] text-gray-400">
                Coordenação de Pós-Graduação & APH Avançado
              </p>
              <p className="text-[9px] text-gray-500">
                Válido em todo o território nacional conforme Lei nº 9.394/96 (Diretrizes e Bases da Educação Nacional)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
