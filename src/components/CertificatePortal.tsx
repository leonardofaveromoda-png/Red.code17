import React, { useState, useEffect } from 'react';
import { Minicurso, Inscricao } from '../types';
import { DataService } from '../lib/supabase';
import { CertificateView } from './CertificateView';
import { RedCodeLogo } from './RedCodeLogo';
import {
  Award,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  Download,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Eye,
  FileText
} from 'lucide-react';
import { generateVectorCertificatePdf, triggerFileDownload } from '../utils/certificatePdf';

interface CertificatePortalProps {
  courses: Minicurso[];
  onNavigateToRegistration: () => void;
}

export const CertificatePortal: React.FC<CertificatePortalProps> = ({
  courses,
  onNavigateToRegistration
}) => {
  const [registrations, setRegistrations] = useState<Inscricao[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInscricao, setSelectedInscricao] = useState<Inscricao | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await DataService.getAllRegistrations();
      setRegistrations(res.data);
      setLoading(false);
    }
    load();
  }, []);

  // Filter registrations matching search query
  const filtered = registrations.filter((reg) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const cleanCpf = reg.cpf.replace(/\D/g, '');
    const searchClean = q.replace(/\D/g, '');
    return (
      reg.nome_completo.toLowerCase().includes(q) ||
      (searchClean && cleanCpf.includes(searchClean)) ||
      (reg.codigo_certificado && reg.codigo_certificado.toLowerCase().includes(q))
    );
  });

  const getCourseForRegistration = (reg: Inscricao): Minicurso => {
    return (
      courses.find((c) => c.id === reg.minicurso_id) || {
        id: reg.minicurso_id,
        titulo: 'Minicurso de Capacitação Avançada em APH',
        slug: 'aph-avancado',
        descricao: 'Capacitação imersiva RED CODE.',
        data_evento: '2026-10-17T08:00:00.000Z',
        vagas_limite: 30,
        valor: 380,
        status: 'ativo',
        created_at: new Date().toISOString(),
        carga_horaria: 20
      }
    );
  };

  // 1-Click direct PDF download from list
  const handleDirectDownload = (reg: Inscricao) => {
    setDownloadingId(reg.id);
    try {
      const course = getCourseForRegistration(reg);
      const { blob, filename } = generateVectorCertificatePdf({
        inscricao: reg,
        curso: course
      });
      triggerFileDownload(blob, filename);
    } catch (e) {
      console.error('Erro no download direto:', e);
      // Fallback: open view
      setSelectedInscricao(reg);
    } finally {
      setTimeout(() => setDownloadingId(null), 1000);
    }
  };

  // 1-Click quick approval for testing in demo
  const handleQuickApprove = async (reg: Inscricao) => {
    setApprovingId(reg.id);
    try {
      if (reg.status_pagamento !== 'pago') {
        await DataService.updatePaymentStatus(reg.id, 'pago');
      }
      const res = await DataService.updateCompletionStatus(reg.id, true);
      setRegistrations((prev) =>
        prev.map((i) =>
          i.id === reg.id
            ? {
                ...i,
                status_pagamento: 'pago',
                concluido: true,
                data_conclusao: new Date().toISOString(),
                codigo_certificado: `RC-2026-${reg.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}`,
                ...(res.data || {})
              }
            : i
        )
      );
    } catch (e) {
      console.error('Erro na aprovação rápida:', e);
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* If a certificate is selected to view */}
      {selectedInscricao ? (
        <CertificateView
          inscricao={selectedInscricao}
          curso={getCourseForRegistration(selectedInscricao)}
          onClose={() => setSelectedInscricao(null)}
          onStatusUpdated={(updated) => {
            setRegistrations((prev) =>
              prev.map((i) => (i.id === updated.id ? { ...i, ...updated } : i))
            );
            setSelectedInscricao(updated);
          }}
        />
      ) : (
        <>
          {/* Header Banner */}
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="badge-red inline-flex items-center gap-2">
                  <Award className="w-3.5 h-3.5" />
                  Portal Oficial de Certificação Digital
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Emissão & Validação de Certificados RED CODE
                </h1>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Consulte e baixe seu certificado oficial emitido pela RED CODE — Capacitação em Emergência. Todos os certificados contam com chave digital de autenticidade, carga horária certificada de 20 horas e estão disponíveis para download imediato em PDF HD e imagem PNG.
                </p>
              </div>

              <div className="shrink-0 flex items-center justify-center p-4 rounded-2xl bg-black/40 border border-white/10">
                <RedCodeLogo size="sm" showTagline={true} variant="horizontal" />
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-6 border border-white/10 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <Search className="w-4 h-4 text-red-500" />
                  Consultar seu Certificado
                </h2>
                <p className="text-xs text-gray-400">
                  Digite seu Nome Completo, CPF ou Código de Registro (Ex: RC-2026-...)
                </p>
              </div>
            </div>

            <div className="relative">
              <input
                id="input-search-certificate"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Digite seu CPF (ex: 142.890.345-21) ou seu nome..."
                className="input-dark pl-11 text-sm font-medium"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Registrations List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                Registros Localizados ({filtered.length})
              </h3>
              <span className="text-xs text-gray-400 font-mono">
                Critérios: Pagamento Confirmado + Conclusão Prática
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-gray-400">
                <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm">Buscando certificados na base de dados...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center bg-white/[0.02] border border-white/10 rounded-2xl space-y-3">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                <h4 className="text-base font-bold text-white">Nenhum registro encontrado</h4>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  Não localizamos inscrições com o termo informado. Verifique a digitação do CPF ou garanta que sua inscrição já foi submetida.
                </p>
                <button
                  onClick={onNavigateToRegistration}
                  className="btn-primary text-xs mt-2"
                >
                  Fazer Inscrição em um Minicurso
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map((reg) => {
                  const course = getCourseForRegistration(reg);
                  const isEligible = reg.status_pagamento === 'pago' && reg.concluido === true;

                  return (
                    <div
                      key={reg.id}
                      className={`p-6 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                        isEligible
                          ? 'bg-white/[0.04] border-red-500/40 hover:border-red-500 hover:shadow-xl hover:shadow-red-600/10'
                          : 'bg-white/[0.02] border-white/10 opacity-80'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono text-gray-400">
                            CPF: <strong className="text-gray-200">{reg.cpf}</strong>
                          </span>
                          {isEligible ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Pronto para Download
                            </span>
                          ) : reg.status_pagamento === 'pago' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Aguardando Conclusão Prática
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                              Pagamento Pendente
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="text-lg font-bold text-white tracking-tight">
                            {reg.nome_completo}
                          </h4>
                          <p className="text-xs text-red-400 font-semibold mt-0.5">
                            {course.titulo}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1 text-xs">
                          <div className="flex items-center justify-between text-gray-400">
                            <span>Carga Horária:</span>
                            <span className="text-white font-semibold">{course.carga_horaria || 20} Horas</span>
                          </div>
                          <div className="flex items-center justify-between text-gray-400">
                            <span>Status Pagamento:</span>
                            <span className={reg.status_pagamento === 'pago' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                              {reg.status_pagamento === 'pago' ? 'Confirmado' : 'Pendente'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-gray-400">
                            <span>Conclusão do Módulo:</span>
                            <span className={reg.concluido ? 'text-emerald-400 font-semibold' : 'text-gray-400 font-semibold'}>
                              {reg.concluido ? 'Validada pelo Instrutor' : 'Em Andamento'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 pt-3 border-t border-white/10">
                        {isEligible ? (
                          <div className="grid grid-cols-2 gap-2">
                            {/* Direct PDF Download */}
                            <button
                              id={`btn-direct-download-${reg.id}`}
                              onClick={() => handleDirectDownload(reg)}
                              disabled={downloadingId === reg.id}
                              className="btn-primary inline-flex items-center justify-center gap-1.5 text-xs shadow-md shadow-red-600/30 cursor-pointer"
                              title="Baixar arquivo PDF imediatamente"
                            >
                              {downloadingId === reg.id ? (
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                              <span>Baixar PDF</span>
                            </button>

                            {/* View Certificate */}
                            <button
                              id={`btn-open-cert-${reg.id}`}
                              onClick={() => setSelectedInscricao(reg)}
                              className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/15 text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-gray-300" />
                              <span>Visualizar</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs">
                            <span className="text-gray-400 text-[11px]">
                              Requer pagamento e validação prática.
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleQuickApprove(reg)}
                                disabled={approvingId === reg.id}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="Liberar certificado imediatamente para teste"
                              >
                                {approvingId === reg.id ? (
                                  <div className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Sparkles className="w-3 h-3" />
                                )}
                                <span>Liberar Teste</span>
                              </button>
                              <button
                                onClick={() => setSelectedInscricao(reg)}
                                className="text-red-400 hover:text-red-300 font-semibold underline underline-offset-2 text-[11px] cursor-pointer"
                              >
                                Detalhes
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
