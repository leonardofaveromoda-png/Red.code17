import React, { useState, useEffect } from 'react';
import { Header, AppView } from './components/Header';
import { PublicRegistration } from './components/PublicRegistration';
import { CheckoutScreen } from './components/CheckoutScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { CertificatePortal } from './components/CertificatePortal';
import { CertificateView } from './components/CertificateView';
import { EventEditor } from './components/EventEditor';
import { BrandingAndArchitecture } from './components/BrandingAndArchitecture';
import { RedCodeLogo } from './components/RedCodeLogo';
import { FooterSettingsModal } from './components/FooterSettingsModal';
import { StudentPortal } from './components/StudentPortal';
import { CoordinationAuthModal } from './components/CoordinationAuthModal';
import { Minicurso, Inscricao, FooterConfig } from './types';
import { INITIAL_COURSES } from './data/initialCourses';
import { DataService } from './lib/supabase';
import {
  Award,
  Phone,
  Mail,
  Instagram,
  Sliders,
  ExternalLink,
  Lock,
  X,
  KeyRound,
  ShieldCheck,
  QrCode
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('registration');
  const [courses, setCourses] = useState<Minicurso[]>(INITIAL_COURSES);
  const [selectedCourse, setSelectedCourse] = useState<Minicurso>(INITIAL_COURSES[0]);
  const [activeInscricao, setActiveInscricao] = useState<Inscricao | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(1);
  const [footerConfig, setFooterConfig] = useState<FooterConfig>(() => {
    return DataService.getFooterConfig();
  });
  const [isFooterModalOpen, setIsFooterModalOpen] = useState(false);

  // Isolamento do Modo Aluno vs. Painel do Gestor com Senha institucional: Redc@de17
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('redcode_coord_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [isStudentMode, setIsStudentMode] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('redcode_coord_auth') !== 'true';
    } catch {
      return true;
    }
  });
  const [studentInscricaoId, setStudentInscricaoId] = useState<string | null>(null);

  // Modal de autenticação para desbloquear painel da coordenação (Senha: Redc@de17)
  const [isAdminPromptOpen, setIsAdminPromptOpen] = useState<boolean>(false);
  const [pendingTargetView, setPendingTargetView] = useState<AppView>('admin');

  // Modal de visualização direta de certificado
  const [activeCertificate, setActiveCertificate] = useState<{
    inscricao: Inscricao;
    course: Minicurso;
  } | null>(null);

  // Roteamento inteligente baseado em URL no carregamento inicial e navegação
  useEffect(() => {
    const handleUrlChange = () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const hash = window.location.hash || '';
        const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
        const hashParams = new URLSearchParams(
          cleanHash.includes('?') ? cleanHash.split('?')[1] : cleanHash
        );

        // Suporte a ?inscricao=... ou #inscricao=... ou ?aluno=... ou #/aluno/...
        let inscricaoParam =
          searchParams.get('inscricao') ||
          searchParams.get('aluno') ||
          searchParams.get('id') ||
          hashParams.get('inscricao') ||
          hashParams.get('aluno') ||
          hashParams.get('id');

        if (!inscricaoParam && cleanHash.startsWith('/aluno/')) {
          inscricaoParam = cleanHash.replace('/aluno/', '').split('?')[0];
        }

        const linkParam =
          searchParams.get('link') ||
          searchParams.get('view') ||
          hashParams.get('link') ||
          hashParams.get('view');

        const adminParam = searchParams.get('admin') || hashParams.get('admin');

        const isHashRegistration =
          cleanHash === '/inscricao' ||
          cleanHash === 'inscricao' ||
          cleanHash.startsWith('/inscricao');

        if (inscricaoParam) {
          // Aluno acessando seu link exclusivo permanente
          setIsStudentMode(true);
          setStudentInscricaoId(inscricaoParam);
          setCurrentView('student_portal');
        } else if (
          linkParam === 'inscricao' ||
          linkParam === 'cadastro' ||
          isHashRegistration ||
          window.location.pathname === '/inscricao'
        ) {
          // Link de inscrição oficial enviado ao candidato (ambiente 100% isolado)
          setIsStudentMode(true);
          setCurrentView('registration');
        } else if (adminParam === 'true' || adminParam === 'gestor') {
          const isAuth = sessionStorage.getItem('redcode_coord_auth') === 'true';
          if (isAuth) {
            setIsStudentMode(false);
            setIsAdminAuthenticated(true);
            setCurrentView('admin');
          } else {
            setIsStudentMode(true);
            setIsAdminAuthenticated(false);
            setPendingTargetView('admin');
            setIsAdminPromptOpen(true);
          }
        }
      } catch (err) {
        console.error('Erro ao ler parâmetros da URL:', err);
      }
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Carrega cursos do DataService (Supabase ou Local)
  useEffect(() => {
    async function loadData() {
      const res = await DataService.getCourses();
      if (res.data && res.data.length > 0) {
        setCourses(res.data);
        setSelectedCourse(res.data[0]);
      }
      const regs = await DataService.getAllRegistrations();
      const pend = regs.data.filter((i) => i.status_pagamento === 'pendente').length;
      setPendingCount(pend);
    }
    loadData();

    const handleSync = async () => {
      const regs = await DataService.getAllRegistrations();
      const pend = regs.data.filter((i) => i.status_pagamento === 'pendente').length;
      setPendingCount(pend);
    };

    window.addEventListener('redcode_inscricoes_sync', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('redcode_inscricoes_sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const handleRegistrationSuccess = (inscricao: Inscricao, course: Minicurso) => {
    setActiveInscricao(inscricao);
    setSelectedCourse(course);
    setStudentInscricaoId(inscricao.id);
    setIsStudentMode(true); // Garante que o aluno fique isolado na experiência do aluno
    setPendingCount((prev) => prev + 1);
    setCurrentView('checkout');

    // Atualiza a URL para que o aluno possa recarregar ou compartilhar a qualquer momento
    try {
      const newUrl = `${window.location.pathname}?inscricao=${inscricao.id}`;
      window.history.pushState({ inscricaoId: inscricao.id }, '', newUrl);
    } catch (e) {
      console.warn('Erro ao atualizar history:', e);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePaymentConfirmed = async () => {
    const regs = await DataService.getAllRegistrations();
    const pend = regs.data.filter((i) => i.status_pagamento === 'pendente').length;
    setPendingCount(pend);
  };

  const handleCoursesUpdated = (updatedCourses: Minicurso[]) => {
    setCourses(updatedCourses);
    const match = updatedCourses.find((c) => c.id === selectedCourse.id);
    if (match) {
      setSelectedCourse(match);
    } else if (updatedCourses.length > 0) {
      setSelectedCourse(updatedCourses[0]);
    }
  };

  // Trata navegação protegida: se o usuário tenta acessar telas admin sem senha Redc@de17
  const handleNavigate = (view: AppView) => {
    if (view === 'admin' || view === 'editor' || view === 'technical_specs') {
      if (!isAdminAuthenticated) {
        setPendingTargetView(view);
        setIsAdminPromptOpen(true);
        return;
      }
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Desbloqueio seguro após validação da senha Redc@de17
  const handleCoordinationAuthenticated = () => {
    setIsAdminAuthenticated(true);
    setIsStudentMode(false);
    try {
      sessionStorage.setItem('redcode_coord_auth', 'true');
    } catch {}
    setIsAdminPromptOpen(false);
    setCurrentView(pendingTargetView || 'admin');
    setPendingTargetView('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Bloqueio manual da área da coordenação (exigirá senha novamente)
  const handleLockAdmin = () => {
    setIsAdminAuthenticated(false);
    setIsStudentMode(true);
    try {
      sessionStorage.removeItem('redcode_coord_auth');
    } catch {}
    setCurrentView('registration');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050608] text-[#F3F4F6] font-sans relative overflow-x-hidden selection:bg-red-600 selection:text-white">
      {/* Background Atmosphere: RED CODE Crimson Medical Glow */}
      <div className="medical-gradient fixed inset-0 pointer-events-none opacity-40 z-0" />

      {/* Header com Navegação e Isolamento de Aluno */}
      <div className="relative z-40">
        <Header
          currentView={currentView}
          onNavigate={handleNavigate}
          hasActiveCheckout={Boolean(activeInscricao)}
          pendingCount={pendingCount}
          isStudentMode={!isAdminAuthenticated}
          studentInscricaoId={studentInscricaoId}
          onUnlockAdmin={() => {
            setPendingTargetView('admin');
            setIsAdminPromptOpen(true);
          }}
          onLockAdmin={handleLockAdmin}
          onSwitchToStudentView={() => {
            setCurrentView(studentInscricaoId ? 'student_portal' : 'registration');
          }}
        />
      </div>

      {/* Modal de Certificado Aberto Diretamente */}
      {activeCertificate && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md overflow-y-auto p-4 sm:p-6 flex items-start justify-center">
          <div className="w-full max-w-6xl my-6">
            <CertificateView
              inscricao={activeCertificate.inscricao}
              curso={activeCertificate.course}
              onClose={() => setActiveCertificate(null)}
              onStatusUpdated={(updated) => {
                setActiveCertificate({
                  ...activeCertificate,
                  inscricao: updated
                });
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative z-10">
        {/* ROTA DO ALUNO: Portal de Acompanhamento e Baixa de Certificado (Sem Permissão de Edição) */}
        {currentView === 'student_portal' && (
          <StudentPortal
            inscricaoId={studentInscricaoId || activeInscricao?.id || ''}
            onNavigateToRegistration={() => setCurrentView('registration')}
            onOpenCertificateModal={(inscricao, course) => {
              setActiveCertificate({ inscricao, course });
            }}
          />
        )}

        {currentView === 'registration' && (
          <PublicRegistration
            courses={courses}
            selectedCourse={selectedCourse}
            onSelectCourse={setSelectedCourse}
            onRegistrationSuccess={handleRegistrationSuccess}
          />
        )}

        {currentView === 'checkout' && (
          activeInscricao ? (
            <CheckoutScreen
              inscricao={activeInscricao}
              curso={selectedCourse}
              onBackToForm={() => setCurrentView('registration')}
              onPaymentConfirmed={handlePaymentConfirmed}
              onGoToStudentPortal={() => {
                setStudentInscricaoId(activeInscricao.id);
                setCurrentView('student_portal');
              }}
            />
          ) : (
            <div className="max-w-xl mx-auto my-16 p-8 bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10 text-center space-y-4 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-red-600/15 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
                <RedCodeLogo size="sm" showTagline={false} variant="emblem" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Nenhuma Inscrição Ativa em Aberto
              </h2>
              <p className="text-sm text-gray-400">
                Selecione o minicurso desejado e preencha seus dados cadastrais para gerar a chave PIX ou realizar o pagamento.
              </p>
              <button
                onClick={() => setCurrentView('registration')}
                className="btn-primary shadow-lg shadow-red-600/30 cursor-pointer text-sm font-semibold"
              >
                Ver Cursos & Fazer Inscrição
              </button>
            </div>
          )
        )}

        {currentView === 'certificates' && (
          <CertificatePortal
            courses={courses}
            onNavigateToRegistration={() => setCurrentView('registration')}
          />
        )}

        {currentView === 'editor' && isAdminAuthenticated && (
          <EventEditor
            courses={courses}
            onCourseUpdated={handleCoursesUpdated}
            onBackToAdmin={() => setCurrentView('admin')}
            footerConfig={footerConfig}
            onFooterUpdated={(cfg) => setFooterConfig(cfg)}
          />
        )}

        {currentView === 'admin' && isAdminAuthenticated && (
          <AdminDashboard
            courses={courses}
            onOpenSpecs={() => setCurrentView('technical_specs')}
            onOpenEditor={() => setCurrentView('editor')}
            onOpenFooterSettings={() => setIsFooterModalOpen(true)}
            onOpenStudentPortal={(id) => {
              setStudentInscricaoId(id);
              setCurrentView('student_portal');
            }}
            onOpenCertificate={(inscricao, course) =>
              setActiveCertificate({ inscricao, course })
            }
          />
        )}

        {currentView === 'technical_specs' && isAdminAuthenticated && <BrandingAndArchitecture />}

        {/* Bloqueio de segurança se tentar visualizar tela de coordenação sem autenticação */}
        {(currentView === 'admin' || currentView === 'editor' || currentView === 'technical_specs') && !isAdminAuthenticated && (
          <div className="max-w-md mx-auto my-20 p-8 bg-[#0F1117] border border-red-500/30 rounded-3xl text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-red-600/15 border border-red-500/30 text-red-500 flex items-center justify-center mx-auto shadow-lg shadow-red-600/20">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="px-2.5 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-bold uppercase tracking-wider">
                Acesso Restrito
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">Área da Coordenação</h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Esta área exige autenticação com a senha da Coordenação RED CODE (<span className="text-red-400 font-mono font-semibold">Redc@de17</span>).
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsAdminPromptOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-600/30 cursor-pointer"
              >
                Digitar Senha de Acesso
              </button>
              <button
                onClick={() => setCurrentView('registration')}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Voltar ao Início
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer Oficial RED CODE — Customizável pelo Gestor e Seguro para o Aluno */}
      <footer className="relative z-10 bg-[#08090C] text-gray-400 border-t border-white/10 py-12 mt-16 text-xs backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-3">
                <RedCodeLogo size="sm" showTagline={false} variant="emblem" />
                <div>
                  <h3 className="text-white font-extrabold text-base tracking-tight">
                    {footerConfig.empresa}
                  </h3>
                  <p className="text-[11px] text-red-500 font-bold uppercase tracking-wider">
                    {footerConfig.subtitulo}
                  </p>
                </div>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed max-w-md">
                {footerConfig.descricao}
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
                Navegação do Aluno
              </h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setCurrentView('registration')}
                    className="hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Inscrição nos Cursos
                  </button>
                </li>
                {studentInscricaoId && (
                  <li>
                    <button
                      onClick={() => setCurrentView('student_portal')}
                      className="text-red-400 hover:text-red-300 font-semibold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <QrCode className="w-3 h-3" />
                      <span>Meu Status & Credencial</span>
                    </button>
                  </li>
                )}
                <li>
                  <button
                    onClick={() => setCurrentView('certificates')}
                    className="hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Consulta de Certificados
                  </button>
                </li>
                <li>
                  <a
                    href={footerConfig.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-red-400 transition-colors flex items-center gap-1.5"
                  >
                    <Instagram className="w-3.5 h-3.5 text-red-400" />
                    <span>Instagram Oficial</span>
                    <ExternalLink className="w-3 h-3 text-gray-500" />
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
                Canais Oficiais
              </h4>
              <div className="space-y-2.5">
                <div className="text-gray-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <a
                    href={`mailto:${footerConfig.email}`}
                    className="hover:text-white transition-colors"
                  >
                    {footerConfig.email}
                  </a>
                </div>
                <div className="text-gray-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>{footerConfig.telefone}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-500">
            <span>
              &copy; {new Date().getFullYear()} {footerConfig.copyright}
            </span>
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setCurrentView('certificates')}
                className="hover:text-red-400 transition-colors cursor-pointer text-gray-400"
              >
                Certificados
              </button>

              {/* Botões administrativos: EXIBIDOS SOMENTE SE AUTENTICADO COMO COORDENAÇÃO */}
              {isAdminAuthenticated ? (
                <>
                  <span className="text-gray-700">•</span>
                  <button
                    onClick={() => setCurrentView('admin')}
                    className="hover:text-red-400 transition-colors cursor-pointer text-gray-400"
                  >
                    Painel do Gestor
                  </button>
                  <span className="text-gray-700">•</span>
                  <button
                    onClick={() => setCurrentView('editor')}
                    className="hover:text-red-400 transition-colors cursor-pointer text-gray-400"
                  >
                    Editor do Evento
                  </button>
                  <span className="text-gray-700">•</span>
                  <button
                    onClick={() => setIsFooterModalOpen(true)}
                    className="hover:text-red-400 text-gray-400 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Sliders className="w-3 h-3 text-red-400" />
                    <span>Alterar Rodapé</span>
                  </button>
                  <span className="text-gray-700">•</span>
                  <button
                    onClick={() => setCurrentView('technical_specs')}
                    className="hover:text-red-400 transition-colors cursor-pointer text-gray-400"
                  >
                    Arquitetura & Script SQL
                  </button>
                  <span className="text-gray-700">•</span>
                  <button
                    onClick={handleLockAdmin}
                    className="hover:text-red-400 text-red-400/80 transition-colors cursor-pointer flex items-center gap-1 font-semibold"
                    title="Bloquear Área da Coordenação"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Bloquear</span>
                  </button>
                </>
              ) : (
                <>
                  <span className="text-gray-700">•</span>
                  <button
                    onClick={() => {
                      setPendingTargetView('admin');
                      setIsAdminPromptOpen(true);
                    }}
                    className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer flex items-center gap-1 font-medium"
                  >
                    <Lock className="w-3 h-3 text-red-500/70" />
                    <span>Acesso da Coordenação</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* Modal de Configuração do Rodapé (Apenas para Gestor Autenticado) */}
      {isAdminAuthenticated && (
        <FooterSettingsModal
          isOpen={isFooterModalOpen}
          onClose={() => setIsFooterModalOpen(false)}
          currentConfig={footerConfig}
          onSave={(updated) => setFooterConfig(updated)}
        />
      )}

      {/* Modal de Autenticação da Coordenação (Senha institucional: Redc@de17) */}
      <CoordinationAuthModal
        isOpen={isAdminPromptOpen}
        onClose={() => setIsAdminPromptOpen(false)}
        onAuthenticated={handleCoordinationAuthenticated}
      />
    </div>
  );
}
