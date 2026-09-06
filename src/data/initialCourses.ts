import { Minicurso } from '../types';

export const INITIAL_COURSES: Minicurso[] = [
  {
    id: 'c1d9b3a0-7f21-4f9e-8c10-1a2b3c4d5e6f',
    titulo: 'Módulo 1: Parada Cardiorrespiratória (PCR) e Via Aérea Avançada',
    slug: 'pcr-via-aerea-avancada',
    descricao:
      'Imersão teórico-prática intensiva em protocolos de alto rendimento para Reanimação Cardiopulmonar (ACLS 2025/2026), manejo de via aérea difícil no APH, intubação orotraqueal em sequência rápida, dispositivos supraglóticos e cricotireoidostomia de emergência.',
    data_evento: '2026-10-17T08:00:00.000Z',
    vagas_limite: 30,
    valor: 380.0,
    status: 'ativo',
    created_at: '2026-09-01T10:00:00.000Z',
    carga_horaria: 20,
    local: 'Centro de Simulação Realística APH - Auditório & Lab Prático',
    publico_alvo: 'Médicos, Enfermeiros, Técnicos de Enfermagem, Bombeiros e Socorristas do SAMU/Resgate',
    conteudo_programatico: [
      'Cadeia de Sobrevivência e Compressões Torácicas de Alta Fidelidade com Feedback em Tempo Real',
      'Ritmos Chocáveis (FV/TVSP) vs. Não Chocáveis (AESP/Assistolia): Farmacoterapia e Timing de Choques',
      'Via Aérea Difícil no Pré-Hospitalar: Algoritmo LEMON e Avaliação Anatômica Rápida',
      'Sequência Rápida de Intubação (SRI): Indutores, Bloqueadores Neuromusculares e Cuidados Hemodinâmicos',
      'Dispositivos Supraglóticos (Máscara Laríngea e Tubo Laríngeo) como Ponte e Resgate',
      'Capnografia Quantitativa em Onda (EtCO2): Monitorização da Eficácia da RCP e Confirmação de Tubo',
      'Acesso Cirúrgico de Emergência: Cricotireoidostomia por Punção e Cirúrgica guiada por marcos',
      'Estações Práticas de Megacódigo com Simuladores de Alta Fidelidade e Cenários Noturnos/Chuvosos'
    ],
    instrutor: {
      nome: 'Dr. Thiago Vasconcellos, MD',
      titulo: 'Especialista em Medicina de Emergência & Instrutor ACLS/PHTLS',
      registro: 'CRM-SP 182.490 / Título ABRAMEDE'
    },
    instrutores: [
      {
        nome: 'Dr. Thiago Vasconcellos, MD',
        titulo: 'Coordenação Médica & Especialista em Medicina de Emergência',
        registro: 'CRM-SP 182.490 / ABRAMEDE'
      },
      {
        nome: 'Dra. Juliana Mendes Silveira',
        titulo: 'Anestesiologista & Especialista em Via Aérea Difícil no APH',
        registro: 'CRM-SP 195.812 / SBA'
      },
      {
        nome: 'Enf. Roberto Albuquerque',
        titulo: 'Instrutor de Suporte Avançado de Vida e Resgate Aeromédico',
        registro: 'COREN-SP 148.920'
      }
    ]
  },
  {
    id: 'c2e8a1b2-3c4d-5e6f-7a8b-9c0d1e2f3a4b',
    titulo: 'Módulo 2: APH Tático, Controle Severo de Hemorragias e Protocolo MARCH',
    slug: 'aph-tatico-controle-hemorragias',
    descricao:
      'Treinamento imersivo em medicina tática e controle de sangramentos exanguinantes utilizando torniquetes de extremidade, agentes hemostáticos, selos de tórax e descompressão torácica com agulha.',
    data_evento: '2026-11-21T08:00:00.000Z',
    vagas_limite: 25,
    valor: 420.0,
    status: 'ativo',
    created_at: '2026-09-02T10:00:00.000Z',
    carga_horaria: 20,
    local: 'Campo de Instrução Tática Integrado - Base Operacional',
    publico_alvo: 'Profissionais de Saúde, Policiais, Bombeiros Militares e Operadores de Segurança',
    conteudo_programatico: [
      'Protocolo MARCH PAWS e Zonas de Cuidados Táticos (Care Under Fire, Tactical Field Care)',
      'Torniquetes CAT e SOFTT-W: Aplicação sob Estresse e Erros Comuns',
      'Agentes Hemostáticos de Última Geração (Kaolin e Quitosana): Técnica de Empacotamento de Feridas',
      'Pneumotórax Hipertensivo: Identificação e Descompressão por Agulha 14G e Toracostomia Digital'
    ],
    instrutor: {
      nome: 'Capitão Enf. Marcos Vinícius',
      titulo: 'Instrutor TECC (Tactical Emergency Casualty Care) e Coordenador de Resgate Aéreo',
      registro: 'COREN-SP 210.884'
    },
    instrutores: [
      {
        nome: 'Capitão Enf. Marcos Vinícius',
        titulo: 'Instrutor Chefe TECC e Coordenador de Resgate Aeromédico',
        registro: 'COREN-SP 210.884'
      },
      {
        nome: 'Dr. Leonardo Esteves, MD',
        titulo: 'Cirurgião do Trauma & Medicina Tática Operacional',
        registro: 'CRM-SP 176.430 / CBCD'
      },
      {
        nome: 'Sgt. Rodrigo Paiva',
        titulo: 'Operador Tático Policial & Especialista em Controle de Hemorragias',
        registro: 'CBMESP / Inst. TCCC'
      }
    ]
  }
];
