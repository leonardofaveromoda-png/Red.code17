import React, { useState, useEffect, useRef } from 'react';
import { Lock, KeyRound, Eye, EyeOff, X, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';
import { RedCodeLogo } from './RedCodeLogo';

interface CoordinationAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

export const COORDINATION_PASSWORD = 'Redc@de17';

export const CoordinationAuthModal: React.FC<CoordinationAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
      setIsSuccess(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = password.trim();

    if (!clean) {
      setError('Por favor, informe a senha de acesso.');
      return;
    }

    if (clean === COORDINATION_PASSWORD) {
      setError(null);
      setIsSuccess(true);
      setTimeout(() => {
        onAuthenticated();
      }, 350);
    } else {
      setError('Senha incorreta. Acesso restrito exclusivamente à Coordenação.');
      setPassword('');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0F1117] border border-red-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl shadow-red-950/40 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Voltar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Emblem */}
        <div className="text-center space-y-3">
          <div className="relative inline-flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500 shadow-lg shadow-red-600/20">
              <Lock className="w-8 h-8" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] shadow-md">
              <KeyRound className="w-3 h-3" />
            </div>
          </div>

          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-bold uppercase tracking-wider">
              Acesso Restrito
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              Área da Coordenação
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              Digite a senha institucional para acessar o painel de gestão, controle de inscrições e edição do evento.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Senha de Acesso:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-4 h-4 text-red-400" />
              </div>
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Digite a senha..."
                autoComplete="current-password"
                className="w-full pl-10 pr-11 py-3 bg-black/50 border border-white/15 focus:border-red-500 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white cursor-pointer"
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-2 text-xs text-red-400">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2 text-xs text-emerald-400 font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Acesso autorizado com sucesso! Entrando...</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isSuccess}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer disabled:opacity-60"
            >
              <span>Entrar na Coordenação</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar e Continuar como Aluno
            </button>
          </div>
        </form>

        {/* Security Notice */}
        <div className="pt-3 border-t border-white/5 text-center text-[10px] text-gray-500">
          <span>Sistema Seguro RED CODE • Sessão protegida</span>
        </div>
      </div>
    </div>
  );
};
