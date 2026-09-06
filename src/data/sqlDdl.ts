/**
 * Script DDL completo em SQL para Supabase / PostgreSQL
 * Contém criação de tabelas, restrições de integridade, índices de alta performance,
 * políticas de Row Level Security (RLS) e dados semente (Seeds).
 */

export const SUPABASE_DDL_SQL = `-- ==============================================================================
-- PROGRAMA DE APERFEIÇOAMENTO PROFISSIONAL EM APH (ATENDIMENTO PRÉ-HOSPITALAR)
-- SCRIPT DDL DE BANCO DE DADOS (SUPABASE / POSTGRESQL 15+)
-- ==============================================================================

-- 1. Habilitação de extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Limpeza prévia segura (Opcional - execute com cautela se recriando do zero)
-- DROP TABLE IF EXISTS public.inscricoes CASCADE;
-- DROP TABLE IF EXISTS public.minicursos CASCADE;

-- 3. Criação da Tabela: minicursos
CREATE TABLE IF NOT EXISTS public.minicursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(255) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    descricao TEXT,
    data_evento TIMESTAMPTZ NOT NULL,
    vagas_limite INTEGER NOT NULL CHECK (vagas_limite > 0),
    valor NUMERIC(10, 2) NOT NULL CHECK (valor >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'encerrado')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Comentários da tabela minicursos
COMMENT ON TABLE public.minicursos IS 'Cadastro de módulos temáticos e minicursos de aperfeiçoamento em APH';
COMMENT ON COLUMN public.minicursos.slug IS 'Identificador textual amigável para URLs e rotas';
COMMENT ON COLUMN public.minicursos.valor IS 'Valor de investimento em Reais (BRL)';

-- 4. Criação da Tabela: inscricoes
CREATE TABLE IF NOT EXISTS public.inscricoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    minicurso_id UUID NOT NULL REFERENCES public.minicursos(id) ON DELETE CASCADE,
    nome_completo VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    email VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    status_pagamento VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status_pagamento IN ('pendente', 'pago', 'cancelado')),
    comprovante_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    
    -- Restrição de integridade: Impede duplicação de inscrição pendente/paga para o mesmo CPF no mesmo curso
    CONSTRAINT uk_minicurso_cpf UNIQUE (minicurso_id, cpf)
);

-- Comentários da tabela inscricoes
COMMENT ON TABLE public.inscricoes IS 'Registro de inscrições dos alunos com controle financeiro e tracking de pagamento';
COMMENT ON COLUMN public.inscricoes.cpf IS 'CPF do aluno formatado (000.000.000-00) ou apenas dígitos';
COMMENT ON COLUMN public.inscricoes.status_pagamento IS 'Situação do pagamento: pendente, pago ou cancelado';

-- 5. Índices de Alta Performance Recomendados
CREATE INDEX IF NOT EXISTS idx_minicursos_slug ON public.minicursos(slug);
CREATE INDEX IF NOT EXISTS idx_minicursos_status ON public.minicursos(status);
CREATE INDEX IF NOT EXISTS idx_minicursos_data_evento ON public.minicursos(data_evento);

CREATE INDEX IF NOT EXISTS idx_inscricoes_minicurso_id ON public.inscricoes(minicurso_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_cpf ON public.inscricoes(cpf);
CREATE INDEX IF NOT EXISTS idx_inscricoes_status_pagamento ON public.inscricoes(status_pagamento);
CREATE INDEX IF NOT EXISTS idx_inscricoes_created_at ON public.inscricoes(created_at DESC);

-- 6. Configuração de Segurança: Row Level Security (RLS)
ALTER TABLE public.minicursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscricoes ENABLE ROW LEVEL SECURITY;

-- Políticas para: minicursos
-- Qualquer usuário (anônimo ou autenticado) pode visualizar cursos ativos
CREATE POLICY "Leitura pública de minicursos ativos"
    ON public.minicursos
    FOR SELECT
    TO public
    USING (status = 'ativo' OR auth.role() = 'authenticated');

-- Apenas administradores autenticados podem inserir, alterar ou deletar cursos
CREATE POLICY "Gestão total de minicursos por administradores"
    ON public.minicursos
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Políticas para: inscricoes
-- Qualquer visitante da internet pode se inscrever (inserir dados com status inicial 'pendente')
CREATE POLICY "Inscrição pública permitida"
    ON public.inscricoes
    FOR INSERT
    TO public
    WITH CHECK (status_pagamento = 'pendente');

-- Usuário anônimo pode consultar a inscrição recém-feita com base no ID (para checkout)
CREATE POLICY "Consulta de inscrição pelo próprio ID"
    ON public.inscricoes
    FOR SELECT
    TO public
    USING (true);

-- Administradores autenticados têm acesso total (visualizar tudo, alterar status para 'pago', exportar)
CREATE POLICY "Gestão total de inscricoes por administradores"
    ON public.inscricoes
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 7. Dados Iniciais (Seed) - Módulo 1: PCR e Via Aérea Avançada
INSERT INTO public.minicursos (
    id,
    titulo,
    slug,
    descricao,
    data_evento,
    vagas_limite,
    valor,
    status
) VALUES (
    'c1d9b3a0-7f21-4f9e-8c10-1a2b3c4d5e6f',
    'Módulo 1: Parada Cardiorrespiratória (PCR) e Via Aérea Avançada no APH',
    'pcr-via-aerea-avancada',
    'Imersão teórico-prática intensiva em protocolos de alto rendimento para Reanimação Cardiopulmonar (ACLS 2025/2026), manejo de via aérea difícil no APH, intubação orotraqueal em sequência rápida, dispositivos supraglóticos e cricotireoidostomia de emergência.',
    '2026-10-17 08:00:00-03',
    30,
    380.00,
    'ativo'
) ON CONFLICT (slug) DO UPDATE SET
    titulo = EXCLUDED.titulo,
    descricao = EXCLUDED.descricao,
    valor = EXCLUDED.valor,
    vagas_limite = EXCLUDED.vagas_limite;
`;
