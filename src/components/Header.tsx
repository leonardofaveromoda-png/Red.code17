import React from 'react';
import {
  Activity,
  CreditCard,
  Users,
  FileCode2,
  Database,
  CheckCircle2,
  AlertCircle,
  Award,
  FileEdit,
  QrCode,
  Lock,
  Eye
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import { RedCodeLogo } from './RedCodeLogo';

export type AppView =
  | 'registration'
  | 'checkout'
  | 'admin'
  | 'certificates'
  | 'editor'
  | 'technical_specs'
  | 'student_portal';

interface HeaderProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  hasActiveCheckout: boolean;
  pendingCount: number;
  isStudentMode?: boolean;
  studentInscricaoId?: string | null;
  onUnlockAdmin?: () => void;
  onLockAdmin?: () => void;
  onSwitchToStudentView?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  hasActiveCheckout,
  pendingCount,
  isStudentMode = false,
  studentInscricaoId = null,
  onUnlockAdmin,
  onLockAdmin,
  onSwitchToStudentView
}) => {
  const isConnected = isSupabaseConfigured();

  return (
    <header className="sticky top-0 z-40 bg-[#08090C]/95 backdrop-blur-xl border-b border-white/10 text-[#F3F4F6] shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20">
          {/* Official RED CODE Logo & Branding */}
          <div
            onClick={() => onNavigate(studentInscricaoId ? 'student_portal' : 'registration')}
            className="flex items-center gap-3.5 cursor-pointer group select-none py-1"
            id="header-brand-link"
          >
            <RedCodeLogo size="sm" showTagline={false} variant="emblem" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-black text-xl sm:text-2xl text-red-500 tracking-tight drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]">
                  RED
                </span>
                <span className="font-black text-xl sm:text-2xl text-white tracking-wider">
                  CODE
                </span>
                <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[9px] uppercase font-bold tracking-widest rounded-full bg-red-600/20 text-red-400 border border-red-500/30">
                  {isStudentMode ? 'Portal do Aluno' : 'APH Avançado'}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-[9px] sm:text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                <span className="text-red-500">—</span>
                <span>Capacitação em Emergência</span>
                <span className="text-red-500">—</span>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {/* Se o aluno tem inscrição ativa ou está na visão de aluno, mostra aba do portal */}
            {studentInscricaoId && (
              <button
                id="nav-btn-student-portal"
                onClick={() => onNavigate('student_portal')}
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'student_portal'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                    : 'text-red-400 hover:text-white hover:bg-red-600/10 border border-red-500/20'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>Minha Inscrição & Credencial</span>
              </button>
            )}

            <button
              id="nav-btn-registration"
              onClick={() => onNavigate('registration')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentView === 'registration'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Cursos &</span> Inscrição
            </button>

            <button
              id="nav-btn-certificates"
              onClick={() => onNavigate('certificates')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentView === 'certificates'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              title="Consultar e baixar certificados em PDF"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Certificados</span>
            </button>

            {hasActiveCheckout && (
              <button
                id="nav-btn-checkout"
                onClick={() => onNavigate('checkout')}
                className={`relative px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'checkout'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Checkout</span>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute -top-0.5 -right-0.5" />
              </button>
            )}

            {/* SEPARADOR ESTREITO E BOTÕES ADMINISTRATIVOS: TOTALMENTE OCULTOS DO ALUNO */}
            {!isStudentMode ? (
              <>
                <div className="h-6 w-px bg-white/10 mx-1 hidden md:block" />

                <button
                  id="nav-btn-admin"
                  onClick={() => onNavigate('admin')}
                  className={`relative px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentView === 'admin'
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden md:inline">Painel do</span> Gestor
                  {pendingCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-red-500/30 text-red-300 border border-red-400/40">
                      {pendingCount}
                    </span>
                  )}
                </button>

                <button
                  id="nav-btn-editor"
                  onClick={() => onNavigate('editor')}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentView === 'editor'
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  title="Editar Dados do Evento"
                >
                  <FileEdit className="w-4 h-4 text-red-400" />
                  <span className="hidden lg:inline">Editar Evento</span>
                </button>

                <button
                  id="nav-btn-specs"
                  onClick={() => onNavigate('technical_specs')}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentView === 'technical_specs'
                      ? 'bg-white/15 text-white border border-white/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  title="Especificação Técnica e Script SQL Supabase"
                >
                  <FileCode2 className="w-4 h-4 text-red-400" />
                  <span className="hidden xl:inline">Docs &</span> SQL
                </button>

                {onSwitchToStudentView && (
                  <button
                    onClick={onSwitchToStudentView}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs flex items-center gap-1 border border-white/10 cursor-pointer"
                    title="Alternar para visão de Aluno"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Ver como Aluno</span>
                  </button>
                )}

                {onLockAdmin && (
                  <button
                    onClick={onLockAdmin}
                    className="px-2.5 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 text-xs flex items-center gap-1 border border-red-500/20 cursor-pointer transition-colors"
                    title="Bloquear Coordenação (Exigirá senha Redc@de17 novamente)"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span className="hidden md:inline font-semibold">Bloquear</span>
                  </button>
                )}
              </>
            ) : (
              /* MODO ALUNO: Botão de acesso seguro da coordenação (exige senha) */
              <button
                id="btn-coordination-login"
                onClick={onUnlockAdmin}
                className="ml-2 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-red-600/15 text-gray-400 hover:text-red-300 text-xs flex items-center gap-1.5 border border-white/10 hover:border-red-500/30 transition-all cursor-pointer"
                title="Acesso exclusivo da Coordenação (Requer senha institucional)"
              >
                <Lock className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline font-semibold">Coordenação</span>
              </button>
            )}
          </nav>

          {/* Database Status Indicator */}
          {!isStudentMode && (
            <div className="hidden 2xl:flex items-center gap-2 pl-3 border-l border-white/10 text-xs">
              <Database className="w-3.5 h-3.5 text-gray-500" />
              {isConnected ? (
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Supabase Ativo
                </span>
              ) : (
                <span
                  className="flex items-center gap-1 text-red-400 font-medium cursor-help"
                  title="Armazenamento local ativo com persistência."
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  Local Store
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
