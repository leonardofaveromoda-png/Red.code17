import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Copy,
  Check,
  CreditCard,
  Upload,
  MessageCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  ExternalLink,
  ArrowLeft,
  DollarSign,
  Award
} from 'lucide-react';
import { Inscricao, Minicurso } from '../types';
import { generatePixPayload, getPixQrCodeUrl } from '../utils/pix';
import { buildWhatsAppLink } from '../utils/phone';
import { DataService } from '../lib/supabase';
import { RedCodeLogo } from './RedCodeLogo';
import { ParticipantTicketModal } from './ParticipantTicketModal';
import { getStudentPortalUrl } from '../utils/participantTicket';

interface CheckoutScreenProps {
  inscricao: Inscricao;
  curso: Minicurso;
  onBackToForm: () => void;
  onPaymentConfirmed?: () => void;
  onGoToStudentPortal?: () => void;
}

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
  inscricao: initialInscricao,
  curso,
  onBackToForm,
  onPaymentConfirmed,
  onGoToStudentPortal
}) => {
  const [inscricao, setInscricao] = useState<Inscricao>(initialInscricao);
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedPortalLink, setCopiedPortalLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'pix' | 'card'>('pix');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(1800); // 30 minutos
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);

  // Configurações do PIX Oficial RED CODE
  const pixKey = import.meta.env.VITE_PIX_KEY || 'financeiro@redcode.med.br';
  const pixBeneficiary = import.meta.env.VITE_PIX_BENEFICIARY || 'RED CODE CAPACITACAO EM EMERGENCIA LTDA';
  const pixCity = import.meta.env.VITE_PIX_CITY || 'SAO PAULO';
  const orgWhatsApp = import.meta.env.VITE_ORGANIZATION_WHATSAPP || '5511999999999';
  const mercadoPagoUrl =
    import.meta.env.VITE_MERCADO_PAGO_CHECKOUT_URL ||
    `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=redcode-${curso.slug}`;

  // Gera o Payload PIX Copia e Cola Oficial (EMV QRCPS com CRC16)
  const pixCode = generatePixPayload({
    pixKey,
    merchantName: pixBeneficiary,
    merchantCity: pixCity,
    amount: curso.valor,
    txId: inscricao.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)
  });

  const pixQrCodeUrl = getPixQrCodeUrl(pixCode, 360);

  // Contador regressivo de 30 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  // Upload simulado/armazenamento de comprovante em base64 / storage
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        await DataService.saveComprovante(inscricao.id, base64Data);
        setInscricao((prev) => ({ ...prev, comprovante_url: base64Data }));
        setUploadSuccess(true);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Falha no upload do comprovante:', err);
      setIsUploading(false);
    }
  };

  // Monta link WhatsApp pré-preenchido com dados da inscrição
  const whatsAppMessage = `Olá equipe de Coordenação da RED CODE!
Acabei de realizar minha inscrição no minicurso:
📚 *${curso.titulo}*

📋 *Dados do Aluno:*
• *Nome:* ${inscricao.nome_completo}
• *CPF:* ${inscricao.cpf}
• *WhatsApp:* ${inscricao.whatsapp}
• *Inscrição ID:* #${inscricao.id.slice(0, 8)}
• *Valor:* R$ ${curso.valor.toFixed(2).replace('.', ',')}

Estou enviando este contato para validação manual do meu pagamento. Segue o comprovante anexo:`;

  const whatsAppLink = buildWhatsAppLink(orgWhatsApp, whatsAppMessage);

  // Confirmação funcional do pagamento (gera credencial e abre QR Code único)
  const handleConfirmPayment = async () => {
    setIsConfirmingPayment(true);
    try {
      const res = await DataService.updatePaymentStatus(inscricao.id, 'pago');
      const updated: Inscricao = {
        ...inscricao,
        status_pagamento: 'pago',
        codigo_credencial:
          res.data?.codigo_credencial ||
          inscricao.codigo_credencial ||
          `RC-PASS-2026-${inscricao.id.slice(0, 8).toUpperCase()}`
      };
      setInscricao(updated);
      setIsTicketModalOpen(true);
      if (onPaymentConfirmed) onPaymentConfirmed();
    } catch (err) {
      console.error('Erro ao confirmar pagamento:', err);
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const handleSimulatePayment = handleConfirmPayment;

  const isPaid = inscricao.status_pagamento === 'pago';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Back button & Title */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToForm}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-red-400" />
          Voltar para os detalhes do curso
        </button>

        <span className="text-xs text-gray-400 font-mono">
          Protocolo: #{inscricao.id.slice(0, 8)}
        </span>
      </div>

      {/* Success Banner if Paid */}
      {isPaid ? (
        <div className="rounded-3xl bg-emerald-600/20 border border-emerald-500/40 text-white p-6 sm:p-8 shadow-2xl space-y-5 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Pagamento Confirmado com Sucesso!
                </h2>
                <p className="text-emerald-200 text-xs sm:text-sm">
                  Sua vaga no <span className="font-semibold text-white">{curso.titulo}</span> está 100% garantida na RED CODE.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsTicketModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer self-start sm:self-auto"
            >
              <QrCode className="w-4 h-4" />
              <span>Ver Minha Credencial & QR Code</span>
            </button>
          </div>
          <div className="p-4 rounded-xl bg-black/40 text-xs sm:text-sm text-gray-300 leading-relaxed border border-white/10 space-y-2">
            <p>
              Enviamos os detalhes do cronograma prático para o seu e-mail (<strong className="text-white">{inscricao.email}</strong>) e coordenação RED CODE (<strong className="text-white">red.codearea17@gmail.com</strong>).
            </p>
            <p className="text-xs text-red-300">
              * Ao término do treinamento, o instrutor validará sua conclusão e seu <strong>Certificado Digital Oficial em PDF</strong> ficará disponível imediatamente na aba <strong>Certificados</strong>.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-red-600/10 border border-red-500/20 p-4 sm:p-5 flex items-start gap-3 backdrop-blur-xl">
          <Clock className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-gray-300 space-y-1">
            <div className="flex items-center gap-2 font-bold text-white">
              <span>Inscrição Registrada! Aguardando Confirmação do Pagamento</span>
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[11px] font-mono">
                {formatTimer(timerSeconds)}
              </span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Sua vaga fica pré-reservada por 30 minutos na RED CODE. Efetue o pagamento via PIX abaixo e confirme para obter sua credencial com QR Code único.
            </p>
          </div>
        </div>
      )}

      {/* Link de Acompanhamento do Aluno & Portal */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-950/40 via-[#11131A] to-[#11131A] border border-red-500/30 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center border border-red-500/30 shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-white text-sm font-bold">Seu Link Permanente de Acompanhamento</h4>
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-bold uppercase border border-red-500/30">
                Portal do Aluno
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Guarde este link exclusivo para consultar o status do pagamento, ver sua credencial com QR Code e baixar seu certificado após o curso.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <button
            onClick={() => {
              const url = getStudentPortalUrl(inscricao.id);
              navigator.clipboard.writeText(url);
              setCopiedPortalLink(true);
              setTimeout(() => setCopiedPortalLink(false), 2500);
            }}
            className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedPortalLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Link Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-300" />
                <span>Copiar Meu Link</span>
              </>
            )}
          </button>

          {onGoToStudentPortal && (
            <button
              onClick={onGoToStudentPortal}
              className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-red-600/30 transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir Portal do Aluno</span>
            </button>
          )}
        </div>
      </div>

      {/* Resumo da Inscrição */}
      <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <span className="badge-red">
              Resumo do Checkout RED CODE
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-white mt-2 tracking-tight">
              {curso.titulo}
            </h3>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-gray-400 uppercase tracking-widest block">Total a Pagar</span>
            <span className="text-3xl font-mono font-bold text-red-400">
              R$ {curso.valor.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>

        {/* Candidate Details Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
            <span className="text-gray-500 block uppercase tracking-wider font-medium text-[10px]">Aluno(a) Cadastrado(a)</span>
            <strong className="text-white text-sm block mt-0.5 truncate font-semibold">
              {inscricao.nome_completo}
            </strong>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
            <span className="text-gray-500 block uppercase tracking-wider font-medium text-[10px]">CPF do Participante</span>
            <strong className="text-white text-sm block mt-0.5 font-mono font-semibold">
              {inscricao.cpf}
            </strong>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
            <span className="text-gray-500 block uppercase tracking-wider font-medium text-[10px]">WhatsApp Informado</span>
            <strong className="text-white text-sm block mt-0.5 font-mono font-semibold">
              {inscricao.whatsapp}
            </strong>
          </div>
        </div>
      </div>

      {/* Payment Methods Section */}
      {!isPaid && (
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
          {/* Method Tabs */}
          <div className="flex gap-3 border-b border-white/10 pb-4">
            <button
              id="tab-pay-pix"
              onClick={() => setActiveTab('pix')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'pix'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>PIX Oficial (Chave Direta / QR Code)</span>
            </button>

            <button
              id="tab-pay-card"
              onClick={() => setActiveTab('card')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'card'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Cartão de Crédito em até 12x</span>
            </button>
          </div>

          {/* TAB 1: PIX */}
          {activeTab === 'pix' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* QR Code Container */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-white/[0.03] border border-white/10 rounded-2xl">
                  <div className="p-3 bg-white rounded-xl shadow-lg border border-white/10">
                    <img
                      src={pixQrCodeUrl}
                      alt="QR Code PIX para pagamento"
                      className="w-56 h-56 object-contain rounded-lg"
                    />
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium mt-3 text-center">
                    Abra o app do seu banco &gt; Pagar com PIX &gt; Ler QR Code
                  </span>
                </div>

                {/* Copia e Cola & Info */}
                <div className="md:col-span-7 space-y-4">
                  <div>
                    <h4 className="text-base font-bold text-white tracking-tight">
                      Chave PIX & Código Copia e Cola
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">
                      Se estiver no celular, copie a chave ou o código oficial abaixo e cole no seu banco:
                    </p>
                  </div>

                  {/* PIX Key Details */}
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Chave PIX (E-mail):</span>
                      <strong className="text-white font-mono text-red-400">{pixKey}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Beneficiário:</span>
                      <strong className="text-white">{pixBeneficiary}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Cidade:</span>
                      <strong className="text-white">{pixCity}</strong>
                    </div>
                  </div>

                  {/* Copy PIX Code Box */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Código PIX Copia e Cola (Padrão Banco Central)
                    </label>
                    <div className="relative">
                      <textarea
                        readOnly
                        value={pixCode}
                        rows={3}
                        className="w-full p-3 pr-28 text-[11px] font-mono bg-black/60 text-red-400 rounded-xl border border-white/10 resize-none focus:outline-none"
                      />
                      <button
                        id="btn-copy-pix-code"
                        onClick={handleCopyPix}
                        className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-red-600/30 cursor-pointer"
                      >
                        {copiedPix ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar PIX</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Comprovante & WhatsApp Direct Confirmation */}
              <div className="pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Upload File */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                  <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-wider">
                    <Upload className="w-4 h-4 text-red-400" />
                    <span>Anexar Comprovante PIX</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Envie a foto ou PDF do comprovante para o gestor validar sua matrícula:
                  </p>

                  <label className="inline-block w-full">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="w-full py-2.5 px-4 rounded-xl border border-dashed border-white/20 hover:border-red-500/50 bg-white/5 hover:bg-white/10 text-center text-xs font-semibold text-gray-300 cursor-pointer transition-all flex items-center justify-center gap-2">
                      {isUploading ? (
                        <span>Enviando arquivo...</span>
                      ) : uploadSuccess ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Comprovante Anexado com Sucesso!
                        </span>
                      ) : (
                        <span>Selecionar Imagem / Comprovante</span>
                      )}
                    </div>
                  </label>
                </div>

                {/* WhatsApp Conciliation */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                  <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-wider">
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <span>Envio Direto via WhatsApp</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Envie mensagem diretamente para o plantão da RED CODE com seus dados pré-carregados:
                  </p>

                  <a
                    href={whatsAppLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Avisar Coordenação pelo WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Botão Oficial e Funcional de Confirmação do Pagamento */}
              <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02] p-4 sm:p-5 rounded-2xl border border-white/5">
                <div className="space-y-1">
                  <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Validação Automática ou Manual
                  </span>
                  <p className="text-xs text-gray-300">
                    Já realizou o PIX pelo seu banco? Clique no botão ao lado para confirmar o pagamento e gerar sua <strong>Credencial Oficial com QR Code Único</strong>.
                  </p>
                </div>

                <button
                  id="btn-confirm-pix-checkout"
                  disabled={isConfirmingPayment}
                  onClick={handleConfirmPayment}
                  className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 transition-all cursor-pointer shrink-0 border border-emerald-400/30"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>{isConfirmingPayment ? 'Validando Pagamento...' : 'Confirmar Pagamento PIX'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CARTÃO MERCADO PAGO */}
          {activeTab === 'card' && (
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-6 text-center sm:text-left">
              <div className="space-y-2">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-600/20 text-red-400 border border-red-500/30">
                    Mercado Pago
                  </span>
                  <span className="text-xs text-gray-400">Pagamento Seguro com Proteção ao Aluno</span>
                </div>
                <h4 className="text-lg font-bold text-white tracking-tight">
                  Cartão de Crédito em até 12x
                </h4>
                <p className="text-xs sm:text-sm text-gray-400 max-w-xl">
                  Parcele sua inscrição com aprovação imediata via checkout seguro do Mercado Pago.
                </p>
              </div>

              {/* Installment preview table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/10">
                  <span className="text-gray-500 block">1x sem juros</span>
                  <strong className="text-white font-mono">R$ {curso.valor.toFixed(2).replace('.', ',')}</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/10">
                  <span className="text-gray-500 block">3x de</span>
                  <strong className="text-white font-mono">
                    R$ {(curso.valor / 3).toFixed(2).replace('.', ',')}
                  </strong>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/10">
                  <span className="text-gray-500 block">6x de</span>
                  <strong className="text-white font-mono">
                    R$ {((curso.valor * 1.05) / 6).toFixed(2).replace('.', ',')}
                  </strong>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/10">
                  <span className="text-gray-500 block">12x de</span>
                  <strong className="text-white font-mono">
                    R$ {((curso.valor * 1.12) / 12).toFixed(2).replace('.', ',')}
                  </strong>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
                <a
                  id="btn-mercadopago-redirect"
                  href={mercadoPagoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs sm:text-sm shadow-xl shadow-red-600/30"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pagar com Cartão no Mercado Pago</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <span className="text-[11px] text-gray-500">
                  Ambiente criptografado SSL de 256 bits
                </span>
              </div>
            </div>
          )}

          {/* Demonstration Mode Simulation Button */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-500">
            <span>Demonstração do Sistema:</span>
            <button
              onClick={handleSimulatePayment}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-red-400 hover:text-red-300 border border-white/10 transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>[Demo] Simular Aprovação Imediata de Pagamento</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal da Credencial Oficial & QR Code Único do Participante */}
      {isTicketModalOpen && (
        <ParticipantTicketModal
          isOpen={isTicketModalOpen}
          onClose={() => setIsTicketModalOpen(false)}
          inscricao={inscricao}
          curso={curso}
        />
      )}
    </div>
  );
};
