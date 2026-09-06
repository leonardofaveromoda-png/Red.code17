import React, { useState, useEffect, useRef } from 'react';
import { Inscricao, Minicurso } from '../types';
import { RedCodeLogo } from './RedCodeLogo';
import {
  buildParticipantTicketData,
  generateParticipantTicketQrCode,
  getParticipantWhatsAppShareUrl,
  getParticipantEmailShareUrl,
  buildWhatsAppTicketMessage
} from '../utils/participantTicket';
import {
  X,
  QrCode,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Award,
  Send,
  Mail,
  Copy,
  Check,
  Download,
  Printer,
  ShieldCheck,
  UserCheck,
  FileCheck
} from 'lucide-react';

interface ParticipantTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  inscricao: Inscricao | null;
  curso: Minicurso | null;
}

export const ParticipantTicketModal: React.FC<ParticipantTicketModalProps> = ({
  isOpen,
  onClose,
  inscricao,
  curso
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inscricao && curso) {
      generateParticipantTicketQrCode(inscricao, curso, 380).then((url) => {
        setQrCodeDataUrl(url);
      });
    }
  }, [isOpen, inscricao, curso]);

  if (!isOpen || !inscricao || !curso) return null;

  const ticketData = buildParticipantTicketData(inscricao, curso);
  const isPaid = inscricao.status_pagamento === 'pago';

  const handleCopyText = () => {
    const text = buildWhatsAppTicketMessage(ticketData);
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handlePrintTicket = () => {
    window.print();
  };

  const handleDownloadQr = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = `QR_Code_${ticketData.protocolo}_${ticketData.alunoNome.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const whatsAppUrl = getParticipantWhatsAppShareUrl(inscricao, curso);
  const emailUrl = getParticipantEmailShareUrl(inscricao, curso);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#0C0D12] border border-red-500/30 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header Modal Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Credencial Oficial & QR Code Único do Participante
              </h3>
              <p className="text-[11px] text-gray-400">
                Passe exclusivo de credenciamento gerado para confirmação de vaga
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Top Bar: Enviar ao Participante */}
        <div className="px-6 py-3 bg-gradient-to-r from-emerald-950/40 via-red-950/20 to-black/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Envio Imediato ao Aluno:</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
              title="Abrir WhatsApp com todos os dados e credencial já pré-preenchidos"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar via WhatsApp</span>
            </a>

            <a
              href={emailUrl}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Abrir cliente de e-mail com modelo de envio oficial"
            >
              <Mail className="w-3.5 h-3.5 text-red-400" />
              <span>Enviar E-mail</span>
            </a>

            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Copiar dados da confirmação para área de transferência"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Dados</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Ticket Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {/* THE OFFICIAL TICKET CARD */}
          <div
            ref={ticketRef}
            className="rounded-2xl bg-[#08090C] border-2 border-red-600/40 p-6 sm:p-8 space-y-6 relative shadow-2xl overflow-hidden"
            style={{
              backgroundImage: `
                radial-gradient(circle at 10% 10%, rgba(220, 38, 38, 0.15) 0%, transparent 40%),
                radial-gradient(circle at 90% 90%, rgba(220, 38, 38, 0.10) 0%, transparent 40%)
              `
            }}
          >
            {/* Header of Ticket */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div className="flex items-center gap-3.5 text-left">
                <RedCodeLogo size="sm" showTagline={false} variant="emblem" />
                <div>
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-xl font-black text-red-500 tracking-tight">RED</span>
                    <span className="text-xl font-black text-white tracking-wider">CODE</span>
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                    Capacitação em Emergência
                  </p>
                </div>
              </div>

              <div className="text-center sm:text-right">
                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-600/20 text-red-400 border border-red-500/30">
                  PASSE OFICIAL DE ACESSO
                </span>
                <p className="text-xs font-mono font-bold text-gray-300 mt-1">
                  {ticketData.protocolo}
                </p>
              </div>
            </div>

            {/* Main Ticket Grid: QR Code + Details */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* QR Code Container */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-white/[0.02] border border-white/10 rounded-2xl">
                <div className="p-3 bg-white rounded-xl shadow-xl">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt={`QR Code Oficial do Aluno ${ticketData.alunoNome}`}
                      className="w-48 h-48 object-contain rounded"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-gray-500 text-xs">
                      Gerando QR Code...
                    </div>
                  )}
                </div>

                <span className="text-[10px] font-mono text-gray-400 mt-3 text-center">
                  QR Code Único e Intransferível
                </span>

                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="mt-2 text-[11px] text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Baixar imagem do QR Code</span>
                </button>
              </div>

              {/* Information Column */}
              <div className="md:col-span-7 space-y-4">
                {/* Status de Pagamento Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">Status da Inscrição:</span>
                  {isPaid ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      PAGAMENTO CONFIRMADO VIA PIX
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      AGUARDANDO PAGAMENTO
                    </span>
                  )}
                </div>

                {/* Aluno & Documento */}
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Participante Credenciado
                  </span>
                  <p className="text-base font-bold text-white tracking-tight">
                    {ticketData.alunoNome}
                  </p>
                  <div className="flex items-center gap-4 text-xs font-mono text-gray-400">
                    <span>CPF: {ticketData.cpf}</span>
                    <span>•</span>
                    <span>WhatsApp: {ticketData.whatsapp}</span>
                  </div>
                </div>

                {/* Curso & Cronograma */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-gray-300">
                    <Award className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-semibold">
                        {ticketData.cursoTitulo}
                      </strong>
                      <span className="text-gray-400 text-[11px]">
                        Carga Horária Certificada: {ticketData.cargaHoraria}h com Simulação Prática
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="w-4 h-4 text-red-500 shrink-0" />
                    <span>
                      {ticketData.dataFormatada} às <strong className="text-white">{ticketData.horario}h</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="text-gray-300">{ticketData.local}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructors Section (Shows up to 3 instructors) */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase tracking-wider">
                <UserCheck className="w-4 h-4 text-red-500" />
                <span>Corpo Docente & Coordenação Técnica do Treinamento</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {ticketData.instrutores.map((instrutor, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-0.5"
                  >
                    <span className="text-[9px] uppercase font-bold tracking-wider text-red-400 block">
                      {idx === 0
                        ? 'Instrutor Principal'
                        : idx === 1
                        ? 'Instrutor Adjunto'
                        : 'Instrutor Especialista'}
                    </span>
                    <strong className="text-white block font-semibold truncate text-[11px]">
                      {instrutor.nome}
                    </strong>
                    <p className="text-[10px] text-gray-400 truncate">{instrutor.titulo}</p>
                    <span className="text-[9px] font-mono text-gray-500 block">
                      {instrutor.registro}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Ticket Info */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500">
              <div className="flex items-center gap-1.5 text-gray-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Credenciamento autenticado pela RED CODE • Protocolo: {ticketData.protocolo}</span>
              </div>
              <div className="text-gray-400 font-mono">
                E-mail Oficial: <strong className="text-white">{ticketData.emailOficial}</strong>
              </div>
            </div>
          </div>

          {/* Quick Guidance Box */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-xs text-gray-300 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-red-400" />
              Instruções para o Dia do Treinamento Prático:
            </h4>
            <ul className="list-disc list-inside space-y-1 text-gray-400 text-[11px] pl-1">
              <li>Apresente este QR Code (impresso ou na tela do celular) junto a um documento oficial com foto.</li>
              <li>Recomendamos o uso de calçado fechado e roupas confortáveis/operacionais para as estações práticas de megacódigo.</li>
              <li>Em caso de dúvidas, o canal de atendimento e validação é: <strong className="text-white">red.codearea17@gmail.com</strong>.</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrintTicket}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4 text-red-400" />
            <span>Imprimir Credencial</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
