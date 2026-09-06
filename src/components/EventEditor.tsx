import React, { useState } from 'react';
import { Minicurso, FooterConfig, DEFAULT_FOOTER_CONFIG } from '../types';
import { DataService } from '../lib/supabase';
import {
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  Users,
  BookOpen,
  UserCheck,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  Sparkles,
  ArrowLeft,
  Instagram,
  Mail,
  Phone,
  Building,
  RotateCcw,
  ExternalLink
} from 'lucide-react';

interface EventEditorProps {
  courses: Minicurso[];
  onCourseUpdated: (updatedCourses: Minicurso[]) => void;
  onBackToAdmin?: () => void;
  footerConfig?: FooterConfig;
  onFooterUpdated?: (config: FooterConfig) => void;
}

export const EventEditor: React.FC<EventEditorProps> = ({
  courses,
  onCourseUpdated,
  onBackToAdmin,
  footerConfig,
  onFooterUpdated
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    courses[0]?.id || ''
  );
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Course currently being edited
  const currentCourse =
    courses.find((c) => c.id === selectedCourseId) || courses[0];

  // Local form state initialized from current course
  const [titulo, setTitulo] = useState(currentCourse?.titulo || '');
  const [slug, setSlug] = useState(currentCourse?.slug || '');
  const [valor, setValor] = useState<number>(currentCourse?.valor || 380);
  const [dataEvento, setDataEvento] = useState(
    currentCourse?.data_evento ? currentCourse.data_evento.slice(0, 16) : '2026-10-17T08:00'
  );
  const [cargaHoraria, setCargaHoraria] = useState<number>(
    currentCourse?.carga_horaria || 20
  );
  const [vagasLimite, setVagasLimite] = useState<number>(
    currentCourse?.vagas_limite || 30
  );
  const [local, setLocal] = useState(
    currentCourse?.local || 'Centro de Simulação Realística APH - Auditório & Lab Prático'
  );
  const [descricao, setDescricao] = useState(currentCourse?.descricao || '');
  const [publicoAlvo, setPublicoAlvo] = useState(currentCourse?.publico_alvo || '');
  const [status, setStatus] = useState<'ativo' | 'encerrado'>(
    currentCourse?.status || 'ativo'
  );

  // Instructor 1 (Principal)
  const initialInst1 = currentCourse?.instrutores?.[0] || currentCourse?.instrutor;
  const initialInst2 = currentCourse?.instrutores?.[1];
  const initialInst3 = currentCourse?.instrutores?.[2];

  const [instrutorNome, setInstrutorNome] = useState(
    initialInst1?.nome || 'Dr. Thiago Vasconcellos, MD'
  );
  const [instrutorTitulo, setInstrutorTitulo] = useState(
    initialInst1?.titulo || 'Especialista em Medicina de Emergência & Instrutor APH'
  );
  const [instrutorRegistro, setInstrutorRegistro] = useState(
    initialInst1?.registro || 'CRM-SP 182.490 / Título ABRAMEDE'
  );

  // Instructor 2 (Adjunto)
  const [instrutor2Nome, setInstrutor2Nome] = useState(initialInst2?.nome || '');
  const [instrutor2Titulo, setInstrutor2Titulo] = useState(initialInst2?.titulo || '');
  const [instrutor2Registro, setInstrutor2Registro] = useState(initialInst2?.registro || '');

  // Instructor 3 (Especialista)
  const [instrutor3Nome, setInstrutor3Nome] = useState(initialInst3?.nome || '');
  const [instrutor3Titulo, setInstrutor3Titulo] = useState(initialInst3?.titulo || '');
  const [instrutor3Registro, setInstrutor3Registro] = useState(initialInst3?.registro || '');

  // Content list
  const [conteudoList, setConteudoList] = useState<string[]>(
    currentCourse?.conteudo_programatico || []
  );
  const [newTopicInput, setNewTopicInput] = useState('');

  // Footer & Institutional settings state
  const [footerData, setFooterData] = useState<FooterConfig>(() => {
    return footerConfig || DataService.getFooterConfig();
  });
  const [newPadraoInput, setNewPadraoInput] = useState('');

  const handleAddFooterPadrao = () => {
    if (!newPadraoInput.trim()) return;
    setFooterData((prev) => ({
      ...prev,
      padroes: [...prev.padroes, newPadraoInput.trim()]
    }));
    setNewPadraoInput('');
  };

  const handleRemoveFooterPadrao = (index: number) => {
    setFooterData((prev) => ({
      ...prev,
      padroes: prev.padroes.filter((_, i) => i !== index)
    }));
  };

  const handleRestoreFooterDefaults = () => {
    if (window.confirm('Restaurar os dados oficiais padrão do rodapé e Instagram da RED CODE?')) {
      setFooterData(DEFAULT_FOOTER_CONFIG);
    }
  };

  // When switching selected course, reload fields
  const handleSelectCourse = (id: string) => {
    setSelectedCourseId(id);
    const target = courses.find((c) => c.id === id);
    if (target) {
      setTitulo(target.titulo);
      setSlug(target.slug);
      setValor(target.valor);
      setDataEvento(target.data_evento ? target.data_evento.slice(0, 16) : '');
      setCargaHoraria(target.carga_horaria || 20);
      setVagasLimite(target.vagas_limite || 30);
      setLocal(target.local || '');
      setDescricao(target.descricao || '');
      setPublicoAlvo(target.publico_alvo || '');
      setStatus(target.status || 'ativo');
      const inst1 = target.instrutores?.[0] || target.instrutor;
      const inst2 = target.instrutores?.[1];
      const inst3 = target.instrutores?.[2];

      setInstrutorNome(inst1?.nome || '');
      setInstrutorTitulo(inst1?.titulo || '');
      setInstrutorRegistro(inst1?.registro || '');

      setInstrutor2Nome(inst2?.nome || '');
      setInstrutor2Titulo(inst2?.titulo || '');
      setInstrutor2Registro(inst2?.registro || '');

      setInstrutor3Nome(inst3?.nome || '');
      setInstrutor3Titulo(inst3?.titulo || '');
      setInstrutor3Registro(inst3?.registro || '');

      setConteudoList(target.conteudo_programatico || []);
      setSaveSuccess(false);
      setErrorMessage('');
    }
  };

  // Add topic to syllabus
  const handleAddTopic = () => {
    if (!newTopicInput.trim()) return;
    setConteudoList([...conteudoList, newTopicInput.trim()]);
    setNewTopicInput('');
  };

  // Remove topic
  const handleRemoveTopic = (index: number) => {
    setConteudoList(conteudoList.filter((_, idx) => idx !== index));
  };

  // Create brand new course template
  const handleCreateNewCourse = () => {
    const newId = crypto.randomUUID ? crypto.randomUUID() : `curso-${Date.now()}`;
    const newCourse: Minicurso = {
      id: newId,
      titulo: 'Novo Módulo de Treinamento RED CODE',
      slug: `novo-modulo-${Date.now().toString().slice(-4)}`,
      descricao: 'Descrição detalhada dos objetivos pedagógicos e procedimentos de emergência abordados.',
      data_evento: new Date(Date.now() + 3600000 * 24 * 30).toISOString(),
      vagas_limite: 25,
      valor: 390,
      status: 'ativo',
      created_at: new Date().toISOString(),
      carga_horaria: 20,
      local: 'Centro de Instrução & Simulação Realística',
      publico_alvo: 'Médicos, Enfermeiros e Socorristas',
      conteudo_programatico: [
        'Estação Prática de Simulação de Alta Fidelidade',
        'Procedimentos Críticos e Protocolos ILCOR 2025/2026'
      ],
      instrutor: {
        nome: 'Dr. Thiago Vasconcellos, MD',
        titulo: 'Coordenação Científica',
        registro: 'CRM-SP 182.490'
      },
      instrutores: [
        {
          nome: 'Dr. Thiago Vasconcellos, MD',
          titulo: 'Coordenação Científica',
          registro: 'CRM-SP 182.490'
        }
      ]
    };

    const updated = [...courses, newCourse];
    onCourseUpdated(updated);
    handleSelectCourse(newId);
  };

  // Submit all edits
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage('');

    try {
      const instrutoresList: { nome: string; titulo: string; registro: string }[] = [];
      if (instrutorNome.trim()) {
        instrutoresList.push({
          nome: instrutorNome.trim(),
          titulo: instrutorTitulo.trim(),
          registro: instrutorRegistro.trim()
        });
      }
      if (instrutor2Nome.trim()) {
        instrutoresList.push({
          nome: instrutor2Nome.trim(),
          titulo: instrutor2Titulo.trim(),
          registro: instrutor2Registro.trim()
        });
      }
      if (instrutor3Nome.trim()) {
        instrutoresList.push({
          nome: instrutor3Nome.trim(),
          titulo: instrutor3Titulo.trim(),
          registro: instrutor3Registro.trim()
        });
      }

      const updatedCourse: Minicurso = {
        ...currentCourse,
        id: currentCourse.id,
        titulo: titulo.trim(),
        slug: slug.trim(),
        valor: Number(valor),
        data_evento: new Date(dataEvento).toISOString(),
        carga_horaria: Number(cargaHoraria),
        vagas_limite: Number(vagasLimite),
        local: local.trim(),
        descricao: descricao.trim(),
        publico_alvo: publicoAlvo.trim(),
        status,
        conteudo_programatico: conteudoList,
        instrutor: {
          nome: instrutorNome.trim(),
          titulo: instrutorTitulo.trim(),
          registro: instrutorRegistro.trim()
        },
        instrutores: instrutoresList
      };

      const res = await DataService.updateCourse(updatedCourse);
      // Salva configurações do rodapé e redes sociais
      DataService.saveFooterConfig(footerData);
      if (onFooterUpdated) {
        onFooterUpdated(footerData);
      }

      if (res.success) {
        const refreshed = courses.map((c) =>
          c.id === updatedCourse.id ? updatedCourse : c
        );
        onCourseUpdated(refreshed);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 5000);
      } else {
        setErrorMessage(res.error || 'Erro ao persistir alterações.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao salvar dados do evento.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            {onBackToAdmin && (
              <button
                onClick={onBackToAdmin}
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer mb-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar ao Painel do Gestor</span>
              </button>
            )}
            <div className="badge-red inline-flex items-center gap-2">
              <FileEdit className="w-3.5 h-3.5" />
              Gestão Integral do Evento
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Área de Edição de Eventos & Minicursos
            </h1>
            <p className="text-sm text-gray-400 max-w-2xl">
              Edite todos os parâmetros operacionais e comerciais: título, valor do lote, data/hora, carga horária, local, grade curricular e dados do instrutor responsável pelo certificado.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleCreateNewCourse}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/15 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-red-400" />
              <span>Novo Módulo / Edição</span>
            </button>
          </div>
        </div>

        {/* Course Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-white/10">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">
            Módulo em Edição:
          </span>
          {courses.map((course) => (
            <button
              key={course.id}
              onClick={() => handleSelectCourse(course.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                course.id === selectedCourseId
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {course.titulo}
            </button>
          ))}
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>
            Todas as alterações do evento foram salvas com sucesso! A ficha de inscrição, o checkout e os certificados já estão atualizados.
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Edit Form */}
      <form onSubmit={handleSaveCourse} className="space-y-6">
        {/* Section 1: Informações Principais */}
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl space-y-5">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2 border-b border-white/10 pb-3">
            <BookOpen className="w-4 h-4 text-red-500" />
            1. Dados Principais & Comerciais
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Nome Completo do Minicurso / Evento *
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
                className="input-dark text-sm font-semibold"
                placeholder="Ex: Módulo 1: Parada Cardiorrespiratória (PCR) e Via Aérea Avançada"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Identificador Slug (URL Amigável) *
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="input-dark text-xs font-mono"
                placeholder="pcr-via-aerea-avancada"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Status da Edição
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ativo' | 'encerrado')}
                className="input-dark text-xs font-semibold"
              >
                <option value="ativo" className="bg-[#0A0B0E] text-white">Ativo (Inscrições Abertas)</option>
                <option value="encerrado" className="bg-[#0A0B0E] text-white">Encerrado (Vagas Esgotadas)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Valor da Inscrição (R$) *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs font-bold text-gray-400 select-none pointer-events-none">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valor}
                  onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
                  required
                  style={{ paddingLeft: '44px' }}
                  className="input-dark has-icon-left text-sm font-bold text-emerald-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Limite Total de Vagas Presenciais *
              </label>
              <div className="relative flex items-center">
                <Users className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="number"
                  min="1"
                  value={vagasLimite}
                  onChange={(e) => setVagasLimite(parseInt(e.target.value, 10) || 1)}
                  required
                  style={{ paddingLeft: '44px' }}
                  className="input-dark has-icon-left text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Data e Horário de Início *
              </label>
              <div className="relative flex items-center">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="datetime-local"
                  value={dataEvento}
                  onChange={(e) => setDataEvento(e.target.value)}
                  required
                  style={{ paddingLeft: '44px' }}
                  className="input-dark has-icon-left text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Carga Horária Certificada (Horas) *
              </label>
              <div className="relative flex items-center">
                <Clock className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="number"
                  min="1"
                  value={cargaHoraria}
                  onChange={(e) => setCargaHoraria(parseInt(e.target.value, 10) || 1)}
                  required
                  style={{ paddingLeft: '44px' }}
                  className="input-dark has-icon-left text-sm"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Local do Evento (Endereço, Auditório, Sala) *
              </label>
              <div className="relative flex items-center">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  required
                  style={{ paddingLeft: '44px' }}
                  className="input-dark has-icon-left text-xs"
                  placeholder="Ex: Centro de Simulação Realística APH - Auditório & Lab Prático, São Paulo - SP"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Descrição Geral do Treinamento
              </label>
              <textarea
                rows={3}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="input-dark text-xs leading-relaxed"
                placeholder="Detalhes dos cenários práticos, manequins, objetivos..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Público-Alvo
              </label>
              <input
                type="text"
                value={publicoAlvo}
                onChange={(e) => setPublicoAlvo(e.target.value)}
                className="input-dark text-xs"
                placeholder="Ex: Médicos, Enfermeiros, Técnicos de Enfermagem, Bombeiros e Socorristas"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Conteúdo Programático */}
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-red-500" />
                2. Conteúdo Programático & Grade Curricular
              </h2>
              <p className="text-xs text-gray-400">
                Tópicos abordados no treinamento prático e impressos no verso do certificado.
              </p>
            </div>
            <span className="text-xs font-mono text-gray-400">
              {conteudoList.length} tópicos cadastrados
            </span>
          </div>

          <div className="space-y-2">
            {conteudoList.map((topic, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5"
              >
                <span className="w-6 h-6 rounded-full bg-red-600/20 text-red-400 text-xs font-bold flex items-center justify-center shrink-0">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => {
                    const updated = [...conteudoList];
                    updated[index] = e.target.value;
                    setConteudoList(updated);
                  }}
                  className="bg-transparent border-none text-xs text-gray-200 focus:outline-none flex-1"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveTopic(index)}
                  className="p-1.5 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                  title="Remover tópico"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add new topic */}
          <div className="flex gap-2 pt-2">
            <input
              type="text"
              value={newTopicInput}
              onChange={(e) => setNewTopicInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTopic();
                }
              }}
              placeholder="Digite um novo tópico para a grade curricular..."
              className="input-dark text-xs flex-1"
            />
            <button
              type="button"
              onClick={handleAddTopic}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/15 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-red-400" />
              <span>Adicionar</span>
            </button>
          </div>
        </div>

        {/* Section 3: Instrutores & Corpo Docente (Até 3 Instrutores) */}
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl space-y-6">
          <div className="border-b border-white/10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-red-500" />
                3. Corpo Docente & Instrutores Oficiais (Até 3 Instrutores)
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Configure os instrutores que constarão na credencial do aluno com QR Code único e nas assinaturas dos certificados.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-red-600/20 text-red-400 border border-red-500/30 self-start sm:self-auto">
              3 Vagas de Instrutores
            </span>
          </div>

          <div className="space-y-6">
            {/* Instrutor 1 (Principal) */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-600/30 text-red-400 text-[11px] font-black flex items-center justify-center border border-red-500/40">
                    1
                  </span>
                  Instrutor 1 • Principal / Coordenador Técnico (Obrigatório)
                </span>
                <span className="text-[10px] text-red-400 font-semibold">* Assinatura principal</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={instrutorNome}
                    onChange={(e) => setInstrutorNome(e.target.value)}
                    required
                    className="input-dark text-xs font-semibold"
                    placeholder="Ex: Dr. Thiago Vasconcellos, MD"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Título / Cargo Acadêmico
                  </label>
                  <input
                    type="text"
                    value={instrutorTitulo}
                    onChange={(e) => setInstrutorTitulo(e.target.value)}
                    className="input-dark text-xs"
                    placeholder="Ex: Especialista em Medicina de Emergência"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Registro Profissional (CRM / COREN / etc.)
                  </label>
                  <input
                    type="text"
                    value={instrutorRegistro}
                    onChange={(e) => setInstrutorRegistro(e.target.value)}
                    className="input-dark text-xs font-mono text-red-400"
                    placeholder="Ex: CRM-SP 182.490 / Título ABRAMEDE"
                  />
                </div>
              </div>
            </div>

            {/* Instrutor 2 (Adjunto / Convidado) */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white/10 text-gray-300 text-[11px] font-black flex items-center justify-center border border-white/20">
                    2
                  </span>
                  Instrutor 2 • Adjunto / Co-Instrutor (Opcional)
                </span>
                <span className="text-[10px] text-gray-400 font-medium">Segundo Instrutor</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={instrutor2Nome}
                    onChange={(e) => setInstrutor2Nome(e.target.value)}
                    className="input-dark text-xs font-semibold"
                    placeholder="Ex: Dra. Juliana Mendes Silveira"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Título / Cargo Acadêmico
                  </label>
                  <input
                    type="text"
                    value={instrutor2Titulo}
                    onChange={(e) => setInstrutor2Titulo(e.target.value)}
                    className="input-dark text-xs"
                    placeholder="Ex: Anestesiologista & Via Aérea Difícil"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Registro Profissional
                  </label>
                  <input
                    type="text"
                    value={instrutor2Registro}
                    onChange={(e) => setInstrutor2Registro(e.target.value)}
                    className="input-dark text-xs font-mono text-red-400"
                    placeholder="Ex: CRM-SP 195.812 / SBA"
                  />
                </div>
              </div>
            </div>

            {/* Instrutor 3 (Especialista / Prática) */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white/10 text-gray-300 text-[11px] font-black flex items-center justify-center border border-white/20">
                    3
                  </span>
                  Instrutor 3 • Especialista / Estações Práticas (Opcional)
                </span>
                <span className="text-[10px] text-gray-400 font-medium">Terceiro Instrutor</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={instrutor3Nome}
                    onChange={(e) => setInstrutor3Nome(e.target.value)}
                    className="input-dark text-xs font-semibold"
                    placeholder="Ex: Enf. Roberto Albuquerque"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Título / Cargo Acadêmico
                  </label>
                  <input
                    type="text"
                    value={instrutor3Titulo}
                    onChange={(e) => setInstrutor3Titulo(e.target.value)}
                    className="input-dark text-xs"
                    placeholder="Ex: Resgate Aeromédico e Emergência"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Registro Profissional
                  </label>
                  <input
                    type="text"
                    value={instrutor3Registro}
                    onChange={(e) => setInstrutor3Registro(e.target.value)}
                    className="input-dark text-xs font-mono text-red-400"
                    placeholder="Ex: COREN-SP 148.920"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Dados do Rodapé, Instagram Oficial & Contatos */}
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Building className="w-4 h-4 text-red-500" />
                4. Dados do Rodapé, Instagram Oficial & Contatos
              </h2>
              <p className="text-xs text-gray-400">
                Altere os dados exibidos no rodapé do site em tempo real (redes sociais, telefones, e-mail e normas).
              </p>
            </div>

            <button
              type="button"
              onClick={handleRestoreFooterDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
              title="Restaurar valores padrão oficiais da RED CODE"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Instagram Oficial */}
            <div className="md:col-span-2 p-4 rounded-2xl bg-gradient-to-r from-pink-950/20 via-red-950/20 to-transparent border border-pink-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-pink-500" />
                  Instagram Oficial da Empresa de Treinamento
                </span>
                {footerData.instagramUrl && (
                  <a
                    href={footerData.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-pink-400 hover:text-pink-300 font-semibold transition-colors"
                  >
                    <span>Abrir Perfil Oficial</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Link URL do Instagram Oficial *
                  </label>
                  <div className="relative flex items-center">
                    <Instagram className="w-4 h-4 text-pink-500 absolute left-3.5 pointer-events-none" />
                    <input
                      type="url"
                      value={footerData.instagramUrl}
                      onChange={(e) =>
                        setFooterData({ ...footerData, instagramUrl: e.target.value })
                      }
                      required
                      style={{ paddingLeft: '44px' }}
                      className="input-dark has-icon-left text-xs font-mono text-pink-300"
                      placeholder="https://www.instagram.com/red.code17?stkn=..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Identificador / @ do Instagram *
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-xs font-bold text-gray-400 select-none pointer-events-none">
                      @
                    </span>
                    <input
                      type="text"
                      value={footerData.instagramHandle.replace(/^@/, '')}
                      onChange={(e) =>
                        setFooterData({
                          ...footerData,
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
              </div>
            </div>

            {/* Nome da Instituição */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Nome da Instituição (Rodapé)
              </label>
              <input
                type="text"
                value={footerData.instituicao}
                onChange={(e) =>
                  setFooterData({ ...footerData, instituicao: e.target.value })
                }
                required
                className="input-dark text-xs font-semibold"
                placeholder="RED CODE • Capacitação em Emergência"
              />
            </div>

            {/* Slogan */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Slogan / Tagline do Rodapé
              </label>
              <input
                type="text"
                value={footerData.tagline}
                onChange={(e) =>
                  setFooterData({ ...footerData, tagline: e.target.value })
                }
                className="input-dark text-xs"
                placeholder="Capacitação em Emergência"
              />
            </div>

            {/* E-mail de Contato */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                E-mail Oficial de Atendimento
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="email"
                  value={footerData.email}
                  onChange={(e) =>
                    setFooterData({ ...footerData, email: e.target.value })
                  }
                  required
                  style={{ paddingLeft: '44px' }}
                  className="input-dark has-icon-left text-xs"
                  placeholder="contato@redcode.med.br"
                />
              </div>
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Telefone / WhatsApp de Atendimento
              </label>
              <div className="relative flex items-center">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={footerData.telefone}
                  onChange={(e) =>
                    setFooterData({ ...footerData, telefone: e.target.value })
                  }
                  required
                  style={{ paddingLeft: '44px' }}
                  className="input-dark has-icon-left text-xs font-mono"
                  placeholder="(11) 97654-3210"
                />
              </div>
            </div>

            {/* Descrição Geral */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Texto Institucional do Rodapé
              </label>
              <textarea
                rows={3}
                value={footerData.descricao}
                onChange={(e) =>
                  setFooterData({ ...footerData, descricao: e.target.value })
                }
                required
                className="input-dark text-xs leading-relaxed"
              />
            </div>

            {/* Padrões & Certificação list */}
            <div className="md:col-span-2 space-y-3">
              <label className="block text-xs font-bold text-white uppercase tracking-wider">
                Padrões & Certificação (Tópicos do Rodapé)
              </label>
              <div className="space-y-2">
                {footerData.padroes.map((padrao, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs"
                  >
                    <span className="text-gray-300">{padrao}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFooterPadrao(idx)}
                      className="p-1 rounded-lg text-gray-500 hover:text-red-400 hover:bg-white/5 transition-colors"
                      title="Remover tópico"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newPadraoInput}
                  onChange={(e) => setNewPadraoInput(e.target.value)}
                  placeholder="Novo tópico para o rodapé (ex: Certificado Digital com 20 Horas)..."
                  className="input-dark text-xs flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFooterPadrao();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddFooterPadrao}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/15 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-red-400" />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>

            {/* Copyright */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Texto de Direitos Autorais (Copyright)
              </label>
              <input
                type="text"
                value={footerData.copyright}
                onChange={(e) =>
                  setFooterData({ ...footerData, copyright: e.target.value })
                }
                className="input-dark text-xs"
                placeholder="RED CODE • Capacitação em Emergência. Todos os direitos reservados."
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-4 pt-2">
          {onBackToAdmin && (
            <button
              type="button"
              onClick={onBackToAdmin}
              className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-xs sm:text-sm cursor-pointer"
            >
              Cancelar
            </button>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary inline-flex items-center gap-2 text-xs sm:text-sm shadow-xl shadow-red-600/30 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Todas as Alterações</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
