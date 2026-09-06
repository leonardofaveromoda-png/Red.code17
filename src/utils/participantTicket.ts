import QRCode from 'qrcode';
import { Inscricao, Minicurso, Instrutor } from '../types';

export interface ParticipantTicketData {
  protocolo: string;
  alunoNome: string;
  cpf: string;
  email: string;
  whatsapp: string;
  cursoTitulo: string;
  dataEvento: string;
  dataFormatada: string;
  horario: string;
  local: string;
  cargaHoraria: number;
  statusPagamento: string;
  valorPago: number;
  dataConfirmacao: string;
  instrutores: Instrutor[];
  emailOficial: string;
  codigoAutenticacao: string;
}

/**
 * Retorna lista normalizada de instrutores (até 3 instrutores)
 */
export function getCourseInstructors(curso: Minicurso): Instrutor[] {
  if (curso.instrutores && curso.instrutores.length > 0) {
    return curso.instrutores.filter((inst) => inst.nome && inst.nome.trim() !== '');
  }
  if (curso.instrutor && curso.instrutor.nome) {
    return [curso.instrutor];
  }
  return [
    {
      nome: 'Dr. Thiago Vasconcellos, MD',
      titulo: 'Coordenação Médica de Urgência',
      registro: 'CRM-SP 182.490 / Título ABRAMEDE'
    }
  ];
}

/**
 * Gera o protocolo oficial único da credencial do aluno
 */
export function getParticipantProtocol(inscricao: Inscricao): string {
  if (inscricao.codigo_credencial) return inscricao.codigo_credencial;
  const hash = inscricao.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
  return `RC-PASS-2026-${hash}`;
}

/**
 * Monta o objeto com todos os dados consolidados da confirmação da inscrição
 */
export function buildParticipantTicketData(
  inscricao: Inscricao,
  curso: Minicurso
): ParticipantTicketData {
  const protocolo = getParticipantProtocol(inscricao);
  const eventDate = new Date(curso.data_evento);
  const dataFormatada = eventDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const horario = eventDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const instrutores = getCourseInstructors(curso);

  return {
    protocolo,
    alunoNome: inscricao.nome_completo,
    cpf: inscricao.cpf,
    email: inscricao.email,
    whatsapp: inscricao.whatsapp,
    cursoTitulo: curso.titulo,
    dataEvento: curso.data_evento,
    dataFormatada,
    horario: horario === '00:00' ? '08:00' : horario,
    local: curso.local || 'Centro de Simulação Realística APH - Auditório & Lab Prático',
    cargaHoraria: curso.carga_horaria || 20,
    statusPagamento: inscricao.status_pagamento === 'pago' ? 'PAGO / CONFIRMADO' : 'PENDENTE',
    valorPago: inscricao.valor_pago || curso.valor,
    dataConfirmacao: new Date().toLocaleDateString('pt-BR'),
    instrutores,
    emailOficial: 'red.codearea17@gmail.com',
    codigoAutenticacao: `AUTH-${protocolo}-${Date.now().toString(36).toUpperCase()}`
  };
}

/**
 * Gera a string de payload que é gravada dentro do QR Code Único
 * Quando escaneado, apresenta todos os dados de autenticidade da inscrição
 */
export function buildTicketQrPayload(ticketData: ParticipantTicketData): string {
  const instrutoresText = ticketData.instrutores.map((i) => `${i.nome} (${i.registro})`).join('; ');
  return [
    `RED CODE • CREDENCIAL OFICIAL DE PARTICIPANTE`,
    `Protocolo: ${ticketData.protocolo}`,
    `Aluno: ${ticketData.alunoNome}`,
    `CPF: ${ticketData.cpf}`,
    `Curso: ${ticketData.cursoTitulo}`,
    `Data: ${ticketData.dataFormatada} às ${ticketData.horario}`,
    `Local: ${ticketData.local}`,
    `Carga Horária: ${ticketData.cargaHoraria}h`,
    `Status: ${ticketData.statusPagamento}`,
    `Instrutores: ${instrutoresText}`,
    `Contato Oficial: ${ticketData.emailOficial}`,
    `Autenticação: ${ticketData.codigoAutenticacao}`
  ].join('\n');
}

/**
 * Gera QR Code Único de alta resolução como Data URL (PNG)
 */
export async function generateParticipantTicketQrCode(
  inscricao: Inscricao,
  curso: Minicurso,
  size = 360
): Promise<string> {
  const ticketData = buildParticipantTicketData(inscricao, curso);
  const payload = buildTicketQrPayload(ticketData);

  try {
    const dataUrl = await QRCode.toDataURL(payload, {
      width: size,
      margin: 2,
      color: {
        dark: '#08090C',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    return dataUrl;
  } catch (err) {
    console.error('Erro ao gerar QR Code do participante:', err);
    // Fallback via endpoint se houver falha na geração local
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(
      payload
    )}`;
  }
}

/**
 * Origem de produção pública padrão para compartilhamento livre (sem exigir conta Google)
 */
export const DEFAULT_PUBLIC_APP_URL =
  'https://ais-pre-rjwfo7f4ztrejf4orpwy3j-395162306193.us-west1.run.app';

/**
 * Retorna a origem pública da aplicação acessível para qualquer pessoa sem login Google.
 * Regra do Google AI Studio / Cloud Run:
 * - O endereço 'ais-dev-*.run.app' é o contêiner interno de desenvolvimento do criador logado no Google.
 *   Se alguém não logado no Google tentar abrir o ais-dev-, o Cloud Run retorna 404 (Page not found).
 * - O endereço 'ais-pre-*.run.app' é o endereço PÚBLICO E COMPARTILHÁVEL aberto para todos os alunos e navegadores.
 */
export function getEffectivePublicOrigin(): string {
  if (typeof window === 'undefined') return DEFAULT_PUBLIC_APP_URL;

  // 1. Verifica se o gestor definiu uma URL base personalizada
  try {
    const custom = localStorage.getItem('red_code_public_base_url');
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/$/, '');
    }
  } catch {
    // Continua para auto-detecção
  }

  const origin = window.location.origin || '';

  // 2. Se estiver no subdomínio ais-dev- do Cloud Run / AI Studio, converte automaticamente para ais-pre-
  // Isso resolve de forma imediata o erro "Page not found" para alunos sem conta Google!
  if (origin.includes('ais-dev-')) {
    return origin.replace('ais-dev-', 'ais-pre-');
  }

  if (origin.includes('ais-pre-')) {
    return origin;
  }

  // Se estiver em localhost ou IP de rede, mantém a origem local
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return origin;
  }

  return origin || DEFAULT_PUBLIC_APP_URL;
}

/**
 * Permite ao gestor configurar ou limpar um domínio público personalizado (ex: https://meusite.com)
 */
export function setCustomPublicBaseUrl(url: string): void {
  try {
    if (!url || !url.trim()) {
      localStorage.removeItem('red_code_public_base_url');
    } else {
      localStorage.setItem('red_code_public_base_url', url.trim().replace(/\/$/, ''));
    }
  } catch (e) {
    console.warn('Erro ao salvar URL pública personalizada:', e);
  }
}

export function getCustomPublicBaseUrl(): string {
  try {
    return localStorage.getItem('red_code_public_base_url') || '';
  } catch {
    return '';
  }
}

/**
 * Gera a URL oficial de acompanhamento do aluno (Portal do Aluno)
 * Livre de login em conta Google e utilizável em qualquer celular/navegador
 */
export function getStudentPortalUrl(inscricaoId: string): string {
  try {
    const base = getEffectivePublicOrigin();
    return `${base}/?inscricao=${encodeURIComponent(inscricaoId)}`;
  } catch {
    return `/?inscricao=${encodeURIComponent(inscricaoId)}`;
  }
}

/**
 * Gera a URL oficial de inscrição pública para divulgação aos candidatos
 * Livre de login em conta Google e utilizável em qualquer celular/navegador
 */
export function getPublicRegistrationUrl(courseSlug?: string): string {
  try {
    const base = getEffectivePublicOrigin();
    return courseSlug
      ? `${base}/?link=inscricao&curso=${encodeURIComponent(courseSlug)}`
      : `${base}/?link=inscricao`;
  } catch {
    return `/?link=inscricao`;
  }
}

/**
 * Monta mensagem de texto para WhatsApp com todos os detalhes e o link de acompanhamento
 */
export function buildWhatsAppTicketMessage(ticketData: ParticipantTicketData, inscricaoId?: string): string {
  const instrutoresList = ticketData.instrutores
    .map((inst, idx) => `  ${idx + 1}. *${inst.nome}* - ${inst.titulo} (${inst.registro})`)
    .join('\n');

  const portalLink = inscricaoId ? getStudentPortalUrl(inscricaoId) : getEffectivePublicOrigin();

  return `🚨 *RED CODE - CONFIRMAÇÃO OFICIAL DE INSCRIÇÃO* 🚨
*Treinamento Prático & Imersivo APH Avançado*
━━━━━━━━━━━━━━━━━━━━━
Olá, *${ticketData.alunoNome}*!
Sua inscrição para o treinamento foi registrada com sucesso!

📋 *DADOS DA SUA INSCRIÇÃO:*
• *Protocolo Oficial:* \`${ticketData.protocolo}\`
• *CPF:* ${ticketData.cpf}
• *Status Financeiro:* *${ticketData.statusPagamento}*
• *Valor:* R$ ${ticketData.valorPago.toFixed(2).replace('.', ',')}

📚 *DETALHES DO TREINAMENTO:*
• *Curso:* ${ticketData.cursoTitulo}
• *Data:* ${ticketData.dataFormatada}
• *Horário de Apresentação:* ${ticketData.horario}h
• *Local:* ${ticketData.local}
• *Carga Horária Certificada:* ${ticketData.cargaHoraria} Horas

👨‍🏫 *CORPO DOCENTE / INSTRUTORES:*
${instrutoresList}

━━━━━━━━━━━━━━━━━━━━━
🎟️ *PORTAL DO ALUNO, QR CODE & CERTIFICADO:*
Acesse sua página exclusiva de acompanhamento para ver sua Credencial com QR Code e baixar seu Certificado Oficial em PDF (acesso público livre sem necessidade de login):
🔗 *Link de Acompanhamento:*
${portalLink}

📧 *Canal Oficial da Organização:* ${ticketData.emailOficial}
Nos vemos no treinamento prático!`;
}

/**
 * Monta o link para envio via WhatsApp Web / App
 */
export function getParticipantWhatsAppShareUrl(
  inscricao: Inscricao,
  curso: Minicurso
): string {
  const ticketData = buildParticipantTicketData(inscricao, curso);
  const message = buildWhatsAppTicketMessage(ticketData, inscricao.id);
  const cleanPhone = inscricao.whatsapp.replace(/\D/g, '');
  const phone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
}

/**
 * Monta o link mailto para envio oficial de e-mail ao aluno
 */
export function getParticipantEmailShareUrl(
  inscricao: Inscricao,
  curso: Minicurso
): string {
  const ticketData = buildParticipantTicketData(inscricao, curso);
  const subject = `[RED CODE] Confirmação de Inscrição e Credencial • ${curso.titulo}`;
  const body = buildWhatsAppTicketMessage(ticketData, inscricao.id).replace(/\*/g, '');
  return `mailto:${inscricao.email}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}
