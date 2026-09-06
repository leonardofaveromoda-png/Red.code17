export type PaymentStatus = 'pendente' | 'pago' | 'cancelado';
export type CourseStatus = 'ativo' | 'encerrado';

export interface Instrutor {
  nome: string;
  titulo: string;
  registro: string;
  especialidade?: string;
}

export interface Minicurso {
  id: string;
  titulo: string;
  slug: string;
  descricao: string;
  data_evento: string; // ISO string
  vagas_limite: number;
  valor: number;
  status: CourseStatus;
  created_at: string;
  carga_horaria?: number; // horas
  local?: string;
  publico_alvo?: string;
  conteudo_programatico?: string[];
  instrutor?: Instrutor;
  instrutores?: Instrutor[]; // Suporte a múltiplos instrutores (ex: instrutor principal + mais 2 instrutores)
}

export interface Inscricao {
  id: string;
  minicurso_id: string;
  nome_completo: string;
  cpf: string;
  email: string;
  whatsapp: string;
  status_pagamento: PaymentStatus;
  comprovante_url?: string | null;
  created_at: string;
  valor_pago?: number;
  observacoes?: string;
  concluido?: boolean;
  data_conclusao?: string | null;
  codigo_certificado?: string | null;
  codigo_credencial?: string | null; // Protocolo único da credencial / ingresso do aluno
}

export interface RegistrationFormData {
  minicurso_id: string;
  nome_completo: string;
  cpf: string;
  email: string;
  whatsapp: string;
  termos_aceitos: boolean;
}

export interface NamingProposal {
  id: string;
  programName: string;
  programTagline: string;
  module1Name: string;
  module1Subtitle: string;
  authorityFocus: string;
  commercialAppeal: string;
}

export interface FooterConfig {
  instituicao: string;
  tagline: string;
  descricao: string;
  email: string;
  telefone: string;
  instagramUrl: string;
  instagramHandle: string;
  padroes: string[];
  copyright: string;
}

export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  instituicao: 'RED CODE • Capacitação em Emergência',
  tagline: 'APH Avançado & Suporte de Vida',
  descricao:
    'Instituto de excelência e imersão prática em Atendimento Pré-Hospitalar (APH), Suporte Avançado de Vida (SAV), Parada Cardiorrespiratória e Manejo Crítico de Vias Aéreas. Treinamentos fundamentados nas diretrizes ILCOR / AHA 2025-2026.',
  email: 'red.codearea17@gmail.com',
  telefone: '(11) 97654-3210',
  instagramUrl: 'https://www.instagram.com/red.code17?stkn=MXB0bmgxM2U2bGFkcw==',
  instagramHandle: '@red.code17',
  padroes: [
    'Certificado Digital em PDF com 20h',
    'Simulação Realística em Manequins de Alta Fidelidade',
    'Chave de Registro e Validação por QR Code'
  ],
  copyright: 'RED CODE • Capacitação em Emergência. Todos os direitos reservados.'
};
