import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Award,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Minicurso, RegistrationFormData, Inscricao } from '../types';
import { formatCPF, validateCPF } from '../utils/cpf';
import { formatWhatsApp, validateWhatsApp } from '../utils/phone';
import { DataService } from '../lib/supabase';
import { RedCodeLogo } from './RedCodeLogo';

interface PublicRegistrationProps {
  courses: Minicurso[];
  selectedCourse: Minicurso;
  onSelectCourse: (course: Minicurso) => void;
  onRegistrationSuccess: (inscricao: Inscricao, course: Minicurso) => void;
}

export const PublicRegistration: React.FC<PublicRegistrationProps> = ({
  courses,
  selectedCourse,
  onSelectCourse,
  onRegistrationSuccess
}) => {
  const [formData, setFormData] = useState<RegistrationFormData>({
    minicurso_id: selectedCourse.id,
    nome_completo: '',
    cpf: '',
    email: '',
    whatsapp: '',
    termos_aceitos: true
  });

  const [errors, setErrors] = useState<{
    nome_completo?: string;
    cpf?: string;
    email?: string;
    whatsapp?: string;
    termos_aceitos?: string;
    general?: string;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cpfValidationStatus, setCpfValidationStatus] = useState<{
    isValid: boolean;
    checked: boolean;
    message?: string;
  }>({ isValid: false, checked: false });

  // Sincroniza id do curso quando o curso selecionado mudar
  React.useEffect(() => {
    setFormData((prev) => ({ ...prev, minicurso_id: selectedCourse.id }));
  }, [selectedCourse]);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatCPF(raw);
    setFormData((prev) => ({ ...prev, cpf: formatted }));

    if (formatted.length === 14) {
      const validation = validateCPF(formatted);
      setCpfValidationStatus({
        isValid: validation.isValid,
        checked: true,
        message: validation.message
      });
      if (!validation.isValid) {
        setErrors((prev) => ({ ...prev, cpf: validation.message }));
      } else {
        setErrors((prev) => {
          const rest = { ...prev };
          delete rest.cpf;
          return rest;
        });
      }
    } else {
      setCpfValidationStatus({ isValid: false, checked: false });
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatWhatsApp(raw);
    setFormData((prev) => ({ ...prev, whatsapp: formatted }));
    if (errors.whatsapp) {
      setErrors((prev) => {
        const rest = { ...prev };
        delete rest.whatsapp;
        return rest;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Nome Completo
    const trimmedName = formData.nome_completo.trim();
    if (!trimmedName) {
      newErrors.nome_completo = 'O nome completo é obrigatório.';
    } else if (trimmedName.split(/\s+/).length < 2) {
      newErrors.nome_completo = 'Por favor, informe seu nome e sobrenome completo.';
    }

    // CPF
    const cpfVal = validateCPF(formData.cpf);
    if (!cpfVal.isValid) {
      newErrors.cpf = cpfVal.message || 'CPF inválido.';
    }

    // E-mail
    if (!formData.email.trim()) {
      newErrors.email = 'O e-mail é obrigatório.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'E-mail com formato inválido.';
    }

    // WhatsApp
    const phoneVal = validateWhatsApp(formData.whatsapp);
    if (!phoneVal.isValid) {
      newErrors.whatsapp = phoneVal.message || 'WhatsApp inválido.';
    }

    // Termos
    if (!formData.termos_aceitos) {
      newErrors.termos_aceitos = 'Você precisa aceitar os termos do programa.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const res = await DataService.createRegistration(formData, selectedCourse);
      if (res.success && res.data) {
        onRegistrationSuccess(res.data, selectedCourse);
      } else {
        setErrors({ general: res.error || 'Erro ao registrar sua inscrição.' });
      }
    } catch (err: any) {
      setErrors({ general: err.message || 'Falha de comunicação com o servidor.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatação de data
  const dataEvento = new Date(selectedCourse.data_evento);
  const dataFormatada = dataEvento.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Official RED CODE Hero Banner */}
      <section className="relative rounded-3xl overflow-hidden bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 sm:p-10 lg:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="badge-red">
                Inscrições Abertas • Turma Presencial
              </span>
              <span className="hidden sm:inline-block text-xs font-mono text-gray-400">
                Padrão ILCOR / AHA 2025-2026
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
              <MapPin className="w-4 h-4 text-red-400" />
              <span>{selectedCourse.local || 'Centro de Simulação Realística APH'}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-red-500 font-black tracking-tight text-xl sm:text-2xl drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                RED
              </span>
              <span className="text-white font-black tracking-wider text-xl sm:text-2xl">
                CODE
              </span>
              <span className="text-gray-500 mx-1">|</span>
              <span className="text-xs uppercase tracking-widest text-gray-300 font-bold">
                Capacitação em Emergência
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {selectedCourse.titulo}
            </h1>
          </div>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-3xl">
            {selectedCourse.descricao}
          </p>

          {/* Key Facts Pill Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10 mt-6">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <span className="text-[11px] text-gray-400 block uppercase tracking-widest font-medium">Data</span>
                <span className="text-xs sm:text-sm font-mono font-bold text-white">{dataFormatada}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
              <Clock className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <span className="text-[11px] text-gray-400 block uppercase tracking-widest font-medium">Carga Horária</span>
                <span className="text-xs sm:text-sm font-mono font-bold text-white">{selectedCourse.carga_horaria || 20} Horas</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
              <Users className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <span className="text-[11px] text-gray-400 block uppercase tracking-widest font-medium">Vagas Limite</span>
                <span className="text-xs sm:text-sm font-mono font-bold text-red-400">
                  {selectedCourse.vagas_limite} Participantes
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
              <Award className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <span className="text-[11px] text-gray-400 block uppercase tracking-widest font-medium">Investimento</span>
                <span className="text-xs sm:text-sm font-mono font-bold text-white">
                  R$ {selectedCourse.valor.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Two-Column Layout: Course Content / Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Course Highlights & Syllabus */}
        <div className="lg:col-span-6 space-y-8">
          {/* Module Switcher if more courses */}
          {courses.length > 1 && (
            <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-5 border border-white/10 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Selecione o Módulo / Edição Desejada:
              </span>
              <div className="grid grid-cols-1 gap-2">
                {courses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => onSelectCourse(course)}
                    className={`text-left p-3 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${
                      course.id === selectedCourse.id
                        ? 'bg-red-600/15 border-red-500/40 text-white font-bold'
                        : 'border-white/10 hover:bg-white/5 text-gray-300'
                    }`}
                  >
                    <span>{course.titulo}</span>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-black/40 border border-white/10 text-red-400">
                      R$ {course.valor.toFixed(2).replace('.', ',')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Programmatic Content Highlights */}
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/10 space-y-5">
            <div className="flex items-center gap-2.5 text-white">
              <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
                <Stethoscope className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                Conteúdo Programático & Grade Curricular
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Metodologia imersiva de <strong className="text-white">Simulação Realística com manequins computadorizados de alta fidelidade</strong> e estresse operacional controlado:
            </p>

            <ul className="space-y-3 pt-2">
              {selectedCourse.conteudo_programatico?.map((topic, i) => (
                <li key={i} className="flex items-start gap-3 text-xs sm:text-sm text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{topic}</span>
                </li>
              ))}
            </ul>

            {/* Instructor Card */}
            {selectedCourse.instrutor && (
              <div className="pt-6 border-t border-white/10 mt-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/30 text-red-300 font-extrabold flex items-center justify-center shrink-0 text-sm font-mono">
                  {selectedCourse.instrutor.nome.slice(0, 2)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Coordenação Científica: {selectedCourse.instrutor.nome}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {selectedCourse.instrutor.titulo} • {selectedCourse.instrutor.registro}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Value Proposition guarantees */}
          <div className="p-5 rounded-2xl bg-red-600/10 border border-red-500/30 flex items-start gap-4">
            <ShieldCheck className="w-6 h-6 text-red-400 shrink-0 mt-1" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">
                Certificação Digital Reconhecida com Registro Individual
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Após a confirmação do pagamento e conclusão do treinamento prático pelo instrutor, seu certificado digital oficial em PDF estará liberado para download com chave hash de autenticidade e QR Code.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Public Registration Form */}
        <div className="lg:col-span-6">
          <div className="bg-white/[0.04] backdrop-blur-xl rounded-3xl p-6 sm:p-8 lg:p-10 border border-white/10 shadow-2xl space-y-6">
            <div className="space-y-2 border-b border-white/10 pb-5">
              <span className="badge-red">
                Inscrição Imediata
              </span>
              <h3 className="text-2xl font-bold text-white tracking-tight pt-2">
                Reserva Técnica de Vaga
              </h3>
              <p className="text-xs sm:text-sm text-gray-400">
                Preencha seus dados técnicos para emissão da credencial e garantia de vaga com status <span className="text-red-400 font-mono font-medium">pendente</span> até o checkout.
              </p>
            </div>

            {/* Error Banner */}
            {errors.general && (
              <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs sm:text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Atenção no cadastro:</strong>
                  <span>{errors.general}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Nome Completo */}
              <div className="space-y-1.5">
                <label
                  htmlFor="field-nome-completo"
                  className="block text-xs font-medium text-gray-400 uppercase tracking-wide"
                >
                  Nome Completo (como constará no certificado) *
                </label>
                <input
                  id="field-nome-completo"
                  type="text"
                  required
                  placeholder="Ex: Dra. Gabriela Albuquerque Prado"
                  value={formData.nome_completo}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, nome_completo: e.target.value }));
                    if (errors.nome_completo) {
                      setErrors((prev) => {
                        const rest = { ...prev };
                        delete rest.nome_completo;
                        return rest;
                      });
                    }
                  }}
                  className={`input-dark ${
                    errors.nome_completo ? 'border-red-500/50 bg-red-500/10' : ''
                  }`}
                />
                {errors.nome_completo && (
                  <p className="text-xs text-red-400 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.nome_completo}
                  </p>
                )}
              </div>

              {/* CPF com validação algorítmica */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="field-cpf"
                    className="block text-xs font-medium text-gray-400 uppercase tracking-wide"
                  >
                    CPF (apenas números ou formatado) *
                  </label>
                  {cpfValidationStatus.checked && (
                    <span
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                        cpfValidationStatus.isValid
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {cpfValidationStatus.isValid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-red-400" />
                          CPF Válido
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 text-red-400" />
                          Dígitos Incorretos
                        </>
                      )}
                    </span>
                  )}
                </div>
                <input
                  id="field-cpf"
                  type="text"
                  required
                  maxLength={14}
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={handleCpfChange}
                  className={`input-dark font-mono ${
                    errors.cpf ? 'border-red-500/50 bg-red-500/10' : ''
                  }`}
                />
                {errors.cpf && (
                  <p className="text-xs text-red-400 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.cpf}
                  </p>
                )}
              </div>

              {/* WhatsApp e E-mail em Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* WhatsApp */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="field-whatsapp"
                    className="block text-xs font-medium text-gray-400 uppercase tracking-wide"
                  >
                    WhatsApp (com DDD) *
                  </label>
                  <input
                    id="field-whatsapp"
                    type="tel"
                    required
                    maxLength={15}
                    placeholder="(11) 98765-4321"
                    value={formData.whatsapp}
                    onChange={handlePhoneChange}
                    className={`input-dark font-mono ${
                      errors.whatsapp ? 'border-red-500/50 bg-red-500/10' : ''
                    }`}
                  />
                  {errors.whatsapp && (
                    <p className="text-xs text-red-400 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.whatsapp}
                    </p>
                  )}
                </div>

                {/* E-mail */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="field-email"
                    className="block text-xs font-medium text-gray-400 uppercase tracking-wide"
                  >
                    E-mail Profissional *
                  </label>
                  <input
                    id="field-email"
                    type="email"
                    required
                    placeholder="seu.email@hospital.med.br"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, email: e.target.value }));
                      if (errors.email) {
                        setErrors((prev) => {
                          const rest = { ...prev };
                          delete rest.email;
                          return rest;
                        });
                      }
                    }}
                    className={`input-dark ${
                      errors.email ? 'border-red-500/50 bg-red-500/10' : ''
                    }`}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-400 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Termos & Aceite */}
              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.termos_aceitos}
                    onChange={(e) => setFormData((prev) => ({ ...prev, termos_aceitos: e.target.checked }))}
                    className="mt-1 w-4 h-4 rounded text-red-600 bg-white/5 border-white/20 focus:ring-red-500"
                  />
                  <span className="text-xs text-gray-400 leading-relaxed">
                    Declaro ciência sobre o regulamento de turmas com vagas limitadas, presença obrigatória de 100% para emissão do certificado digital e concordo com o contato da equipe RED CODE via WhatsApp para suporte e conciliação.
                  </span>
                </label>
                {errors.termos_aceitos && (
                  <p className="text-xs text-red-400 font-medium mt-1">
                    {errors.termos_aceitos}
                  </p>
                )}
              </div>

              {/* Resumo do Pedido / Botão de Avanço */}
              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="flex items-center justify-between text-white">
                  <span className="text-xs uppercase tracking-wider font-medium text-gray-400">
                    Total do Investimento:
                  </span>
                  <span className="text-2xl font-mono font-bold text-red-400">
                    R$ {selectedCourse.valor.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <button
                  id="btn-submit-registration"
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full shadow-lg shadow-red-600/30 py-3.5 text-sm uppercase tracking-wider font-bold flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Gravando inscrição no sistema...
                    </span>
                  ) : (
                    <>
                      <span>Prosseguir para Pagamento</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 opacity-60">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-mono">
                    RED CODE Capacitação em Emergência
                  </span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
