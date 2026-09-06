import React, { useState } from 'react';
import { FooterConfig, DEFAULT_FOOTER_CONFIG } from '../types';
import { DataService } from '../lib/supabase';
import {
  X,
  Save,
  RotateCcw,
  CheckCircle2,
  Mail,
  Phone,
  Instagram,
  Shield,
  Award,
  FileText,
  Building,
  Plus,
  Trash2,
  ExternalLink
} from 'lucide-react';

interface FooterSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: FooterConfig;
  onSave: (config: FooterConfig) => void;
}

export const FooterSettingsModal: React.FC<FooterSettingsModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onSave
}) => {
  const [formData, setFormData] = useState<FooterConfig>(currentConfig);
  const [newPadrao, setNewPadrao] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAddPadrao = () => {
    if (!newPadrao.trim()) return;
    setFormData((prev) => ({
      ...prev,
      padroes: [...prev.padroes, newPadrao.trim()]
    }));
    setNewPadrao('');
  };

  const handleRemovePadrao = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      padroes: prev.padroes.filter((_, i) => i !== index)
    }));
  };

  const handleRestoreDefaults = () => {
    if (window.confirm('Deseja restaurar as informações padrão oficiais da RED CODE?')) {
      setFormData(DEFAULT_FOOTER_CONFIG);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    DataService.saveFooterConfig(formData);
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0C0D12] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Personalização dos Dados do Rodapé
              </h2>
              <p className="text-xs text-gray-400">
                Altere contatos, redes sociais, Instagram oficial e informações institucionais.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Dados do rodapé atualizados com sucesso em toda a plataforma!</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Dados Gerais */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Nome da Instituição / Marca
              </label>
              <input
                type="text"
                value={formData.instituicao}
                onChange={(e) => setFormData({ ...formData, instituicao: e.target.value })}
                required
                className="input-dark text-xs sm:text-sm font-semibold"
                placeholder="RED CODE • Capacitação em Emergência"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Slogan / Tagline do Rodapé
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="input-dark text-xs"
                placeholder="Capacitação em Emergência"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Descrição Institucional
              </label>
              <textarea
                rows={3}
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                required
                className="input-dark text-xs leading-relaxed"
                placeholder="Descrição de excelência da instituição..."
              />
            </div>
          </div>

          {/* Redes Sociais & Contato */}
          <div className="pt-2 border-t border-white/10 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Instagram className="w-4 h-4 text-red-500" />
              Instagram Oficial & Canais de Atendimento
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Link do Instagram Oficial da Empresa *
                </label>
                <div className="relative flex items-center">
                  <Instagram className="w-4 h-4 text-pink-500 absolute left-3.5 pointer-events-none" />
                  <input
                    type="url"
                    value={formData.instagramUrl}
                    onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                    required
                    style={{ paddingLeft: '44px' }}
                    className="input-dark text-xs font-mono text-pink-300"
                    placeholder="https://www.instagram.com/red.code17"
                  />
                </div>
                {formData.instagramUrl && (
                  <a
                    href={formData.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-pink-400 hover:text-pink-300 mt-1 transition-colors"
                  >
                    <span>Testar link do Instagram</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Identificador / @ do Instagram
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-bold text-gray-400 select-none pointer-events-none">
                    @
                  </span>
                  <input
                    type="text"
                    value={formData.instagramHandle.replace(/^@/, '')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        instagramHandle: `@${e.target.value.replace(/^@/, '')}`
                      })
                    }
                    required
                    style={{ paddingLeft: '32px' }}
                    className="input-dark text-xs font-bold text-white"
                    placeholder="red.code17"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  E-mail Oficial de Contato
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    style={{ paddingLeft: '44px' }}
                    className="input-dark text-xs"
                    placeholder="red.codearea17@gmail.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Telefone / WhatsApp de Atendimento
                </label>
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    required
                    style={{ paddingLeft: '44px' }}
                    className="input-dark text-xs font-mono"
                    placeholder="(11) 97654-3210"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Padrões & Certificações */}
          <div className="pt-2 border-t border-white/10 space-y-3">
            <label className="block text-xs font-bold text-white uppercase tracking-wider">
              Padrões de Certificação (Itens Exibidos no Rodapé)
            </label>

            <div className="space-y-2">
              {formData.padroes.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs"
                >
                  <div className="flex items-center gap-2 text-gray-200">
                    <Award className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePadrao(idx)}
                    className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newPadrao}
                onChange={(e) => setNewPadrao(e.target.value)}
                placeholder="Ex: Certificado Digital em PDF com 20 Horas"
                className="input-dark text-xs flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPadrao();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddPadrao}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/15 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-red-400" />
                <span>Adicionar</span>
              </button>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-2 border-t border-white/10">
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Texto de Direitos Autorais (Copyright)
            </label>
            <input
              type="text"
              value={formData.copyright}
              onChange={(e) => setFormData({ ...formData, copyright: e.target.value })}
              className="input-dark text-xs"
              placeholder="RED CODE • Capacitação em Emergência. Todos os direitos reservados."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleRestoreDefaults}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Restaurar dados originais da RED CODE"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary inline-flex items-center gap-2 text-xs font-bold shadow-lg shadow-red-600/30 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Rodapé</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
