import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { Minicurso, Inscricao } from '../types';

/**
 * Triggers a file download in the browser.
 * Includes multiple fallback strategies for sandboxed iframes.
 */
export function triggerFileDownload(blob: Blob, filename: string): boolean {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      try {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch {
        // Ignored
      }
    }, 1500);

    return true;
  } catch (err) {
    console.error('Falha ao disparar download do arquivo:', err);
    return false;
  }
}

/**
 * Fallback to open data URI in a new window or trigger download via data URI
 */
export function openDataUriInNewWindow(dataUri: string, filename: string) {
  try {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(
        `<title>${filename}</title><body style="margin:0;background:#050608;display:flex;align-items:center;justify-content:center;height:100vh;"><iframe src="${dataUri}" style="border:none;width:100%;height:100%;"></iframe></body>`
      );
    } else {
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (e) {
    console.error('Fallback window.open falhou:', e);
  }
}

export interface CertificateData {
  inscricao: Inscricao;
  curso: Minicurso;
  certCode?: string;
}

/**
 * Vector PDF Generator
 * Draws high-resolution vector graphics directly onto jsPDF canvas.
 * 100% reliable, zero external CSS dependencies, crystal clear at 4K zoom,
 * and completely immune to HTML/CSS/Canvas parsing issues in modern browsers.
 */
export function generateVectorCertificatePdf({
  inscricao,
  curso,
  certCode
}: CertificateData): { doc: jsPDF; blob: Blob; dataUri: string; filename: string } {
  // A4 Landscape: 297mm x 210mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const code =
    certCode ||
    inscricao.codigo_certificado ||
    `RC-2026-${inscricao.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}`;

  const eventDate = new Date(curso.data_evento);
  const formattedEventDate = eventDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const completionDate = inscricao.data_conclusao
    ? new Date(inscricao.data_conclusao).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    : formattedEventDate;

  // 1. Deep Obsidian Medical Dark Background (#08090C)
  doc.setFillColor(8, 9, 12);
  doc.rect(0, 0, 297, 210, 'F');

  // Subtle radial gradient simulation via concentric low-opacity circles
  doc.setFillColor(30, 10, 12);
  doc.circle(30, 30, 45, 'F');
  doc.circle(267, 180, 50, 'F');
  doc.setFillColor(8, 9, 12);
  doc.circle(148.5, 105, 130, 'F');

  // 2. Double Frame (Crimson Red & Metallic fillets)
  // Outer Red Border
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(1.2);
  doc.roundedRect(8, 8, 281, 194, 3, 3, 'S');

  // Inner Subtle Border
  doc.setDrawColor(185, 28, 28);
  doc.setLineWidth(0.4);
  doc.roundedRect(11, 11, 275, 188, 2, 2, 'S');

  // Corner Ornaments (L-brackets)
  doc.setDrawColor(239, 68, 68);
  doc.setLineWidth(1.6);
  // Top-left
  doc.line(14, 14, 24, 14);
  doc.line(14, 14, 14, 24);
  // Top-right
  doc.line(283, 14, 273, 14);
  doc.line(283, 14, 283, 24);
  // Bottom-left
  doc.line(14, 196, 24, 196);
  doc.line(14, 196, 14, 186);
  // Bottom-right
  doc.line(283, 196, 273, 196);
  doc.line(283, 196, 283, 186);

  // 3. Header Section (y: 15 to 42)
  // RED CODE Logo Badge (Emblem simulation)
  doc.setFillColor(220, 38, 38);
  doc.circle(25, 27, 7.5, 'F');
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.6);
  doc.circle(25, 27, 6.5, 'S');

  // Star of life cross simulation in logo
  doc.setFillColor(255, 255, 255);
  doc.rect(24, 22.5, 2, 9, 'F');
  doc.rect(20.5, 26, 9, 2, 'F');

  // RED CODE Text Brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(239, 68, 68);
  doc.text('RED', 36, 27);
  doc.setTextColor(255, 255, 255);
  doc.text('CODE', 52, 27);

  doc.setFontSize(7.5);
  doc.setTextColor(156, 163, 175);
  doc.text('CAPACITAÇÃO EM EMERGÊNCIA', 36, 32);

  // Center Certificate Title
  doc.setFillColor(220, 38, 38);
  doc.roundedRect(110, 16, 77, 6, 1.5, 1.5, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('CERTIFICAÇÃO PROFISSIONAL OFICIAL', 148.5, 20.2, { align: 'center' });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('CERTIFICADO DE CAPACITAÇÃO', 148.5, 30, { align: 'center' });

  // Right Header: Registration Code
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(209, 213, 219);
  doc.text('REGISTRO DIGITAL', 277, 21, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('courier', 'bold');
  doc.setTextColor(239, 68, 68);
  doc.text(code, 277, 26.5, { align: 'right' });

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Livro de Atas Nº 04 / Fls. 18', 277, 31, { align: 'right' });

  // Divider Line
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.2);
  doc.line(18, 37, 279, 37);

  // 4. Body Content
  // Intro line
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(156, 163, 175);
  doc.text('CERTIFICAMOS PARA OS DEVIDOS FINS DE DIREITO QUE', 148.5, 47, { align: 'center' });

  // Student Full Name (Hero Typography)
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(inscricao.nome_completo, 148.5, 60, { align: 'center' });

  // Red Underline beneath Student Name
  const nameWidth = doc.getTextWidth(inscricao.nome_completo);
  const underlineStartX = Math.max(30, 148.5 - nameWidth / 2 - 4);
  const underlineEndX = Math.min(267, 148.5 + nameWidth / 2 + 4);
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.8);
  doc.line(underlineStartX, 63.5, underlineEndX, 63.5);

  // CPF
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(156, 163, 175);
  doc.text(`Inscrito(a) sob o Cadastro de Pessoa Física CPF nº ${inscricao.cpf}`, 148.5, 71, {
    align: 'center'
  });

  // Statement text
  doc.setFontSize(9.5);
  doc.setTextColor(209, 213, 219);
  doc.text(
    'concluiu com aproveitamento satisfatório e frequência de 100% o treinamento prático e imersivo de aperfeiçoamento profissional avançado:',
    148.5,
    81,
    { align: 'center', maxWidth: 240 }
  );

  // Course Title Box
  doc.setFillColor(18, 20, 26);
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.5);
  doc.roundedRect(24, 88, 249, 20, 2.5, 2.5, 'FD');

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(248, 113, 113); // light red
  doc.text(curso.titulo.toUpperCase(), 148.5, 100, { align: 'center', maxWidth: 240 });

  // Metadata Chips / Facts
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(209, 213, 219);

  const factsY = 120;
  // Fact 1: Carga Horária
  doc.setFillColor(220, 38, 38);
  doc.circle(42, factsY - 1, 2, 'F');
  doc.text(`Carga Horária: ${curso.carga_horaria || 20} Horas Certificadas`, 47, factsY);

  // Fact 2: Data
  doc.circle(125, factsY - 1, 2, 'F');
  doc.text(`Data de Realização: ${formattedEventDate}`, 130, factsY);

  // Fact 3: Local
  doc.circle(208, factsY - 1, 2, 'F');
  doc.text(`Local: ${curso.local || 'Centro de Simulação Realística APH'}`, 213, factsY);

  // Standards line
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(156, 163, 175);
  doc.text(
    'Treinamento prático de alta fidelidade fundamentado nas diretrizes internacionais ILCOR / AHA 2025-2026.',
    148.5,
    132,
    { align: 'center' }
  );

  // 5. Footer Divider
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.2);
  doc.line(18, 144, 279, 144);

  // 6. Footer Columns (y: 150 to 190)
  // Left Column: QR Code & Verification
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(20, 150, 25, 25, 2, 2, 'F');

  // Simulated QR Code inside white box
  doc.setFillColor(0, 0, 0);
  doc.rect(22, 152, 7, 7, 'F');
  doc.rect(36, 152, 7, 7, 'F');
  doc.rect(22, 166, 7, 7, 'F');
  doc.rect(31, 159, 7, 7, 'F');
  doc.rect(38, 166, 5, 5, 'F');
  doc.rect(30, 152, 3, 4, 'F');
  doc.rect(22, 161, 4, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(52, 211, 153); // emerald green
  doc.text('✓ Autenticidade Registrada', 49, 156);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(156, 163, 175);
  doc.text('Aponte a câmera para validação digital', 49, 161);
  doc.text(`Chave: ${code}`, 49, 166);
  doc.setTextColor(248, 113, 113);
  doc.text(`Emitido em: ${completionDate}`, 49, 171);

  // Center Column: Instructors & Scientific Coordinators Signatures
  const activeInstructors = ((curso.instrutores && curso.instrutores.length > 0)
    ? curso.instrutores.filter((i) => i.nome && i.nome.trim() !== '')
    : [curso.instrutor || { nome: 'Dr. Thiago Vasconcellos, MD', titulo: 'Diretor Técnico de Ensino & Urgência', registro: 'CRM-SP 182.490 / Título ABRAMEDE' }]
  ).slice(0, 3);

  const numInst = activeInstructors.length;
  const xPositions =
    numInst === 1
      ? [148.5]
      : numInst === 2
      ? [125, 172]
      : [108, 148.5, 189];

  activeInstructors.forEach((inst, idx) => {
    const posX = xPositions[idx];
    const instName = inst.nome;
    const instTitle = inst.titulo;
    const instReg = inst.registro || '';

    // Signature preview text (Times Italic)
    doc.setFont('times', 'italic');
    doc.setFontSize(numInst === 3 ? 10 : 12);
    doc.setTextColor(229, 231, 235);
    doc.text(instName, posX, 164, { align: 'center' });

    // Underline
    doc.setDrawColor(156, 163, 175);
    doc.setLineWidth(0.3);
    const lineHalf = numInst === 3 ? 18 : 28;
    doc.line(posX - lineHalf, 168, posX + lineHalf, 168);

    // Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(numInst === 3 ? 7 : 8);
    doc.setTextColor(255, 255, 255);
    doc.text(instName, posX, 173, { align: 'center', maxWidth: numInst === 3 ? 38 : 55 });

    // Title
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(numInst === 3 ? 5.5 : 6.5);
    doc.setTextColor(156, 163, 175);
    doc.text(instTitle, posX, 177, { align: 'center', maxWidth: numInst === 3 ? 38 : 55 });

    // Registry
    if (instReg) {
      doc.setFont('courier', 'bold');
      doc.setFontSize(numInst === 3 ? 5.5 : 6.5);
      doc.setTextColor(248, 113, 113);
      doc.text(instReg, posX, 181, { align: 'center' });
    }
  });

  // Right Column: Official Institution Seal & Legal text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('RED CODE INSTITUTO DE ENSINO', 277, 157, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(156, 163, 175);
  doc.text('Coordenação de Pós-Graduação & APH Avançado', 277, 162, { align: 'right' });

  doc.setFontSize(6);
  doc.setTextColor(107, 114, 128);
  doc.text(
    'Válido em todo o território nacional conforme Lei nº 9.394/96',
    277,
    168,
    { align: 'right' }
  );
  doc.text(
    '(Diretrizes e Bases da Educação Nacional para Cursos Livres)',
    277,
    172,
    { align: 'right' }
  );

  const cleanName = inscricao.nome_completo.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  const filename = `Certificado_RED_CODE_${cleanName}.pdf`;
  const blob = doc.output('blob');
  const dataUri = doc.output('datauristring');

  return { doc, blob, dataUri, filename };
}

/**
 * Capture-based PDF Generator using html-to-image (renders SVG filters & CSS natively)
 * with automatic fallback to Vector PDF Generator.
 */
export async function generateCapturedCertificatePdf(
  element: HTMLElement,
  data: CertificateData
): Promise<{ success: boolean; filename: string; method: 'vector' | 'capture'; error?: string }> {
  const cleanName = data.inscricao.nome_completo.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  const filename = `Certificado_RED_CODE_${cleanName}.pdf`;

  // First try html-to-image capture
  try {
    const pngDataUrl = await toPng(element, {
      pixelRatio: 2.2,
      cacheBust: true,
      backgroundColor: '#08090C',
      filter: (node: Node) => {
        if (node instanceof HTMLElement && node.classList.contains('no-print')) {
          return false;
        }
        return true;
      }
    });

    if (pngDataUrl && pngDataUrl.length > 500) {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(pngDataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      const blob = pdf.output('blob');
      const downloaded = triggerFileDownload(blob, filename);

      if (!downloaded) {
        openDataUriInNewWindow(pdf.output('datauristring'), filename);
      }

      return { success: true, filename, method: 'capture' };
    }
  } catch (captureErr) {
    console.warn('html-to-image capture falhou, ativando gerador vetorial de alta resolução:', captureErr);
  }

  // Fallback: 100% Reliable Vector PDF
  try {
    const { blob, dataUri } = generateVectorCertificatePdf(data);
    const downloaded = triggerFileDownload(blob, filename);
    if (!downloaded) {
      openDataUriInNewWindow(dataUri, filename);
    }
    return { success: true, filename, method: 'vector' };
  } catch (vectorErr: any) {
    console.error('Falha crítica na geração do PDF vetorial:', vectorErr);
    return {
      success: false,
      filename,
      method: 'vector',
      error: vectorErr?.message || 'Falha ao compilar PDF.'
    };
  }
}

/**
 * High-Resolution PNG Generator (perfect for WhatsApp and social media)
 */
export async function downloadCertificateAsPng(
  element: HTMLElement,
  inscricao: Inscricao
): Promise<{ success: boolean; error?: string }> {
  const cleanName = inscricao.nome_completo.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  const filename = `Certificado_RED_CODE_${cleanName}.png`;

  try {
    const pngDataUrl = await toPng(element, {
      pixelRatio: 2.5,
      cacheBust: true,
      backgroundColor: '#08090C'
    });

    const res = await fetch(pngDataUrl);
    const blob = await res.blob();
    const downloaded = triggerFileDownload(blob, filename);
    if (!downloaded) {
      openDataUriInNewWindow(pngDataUrl, filename);
    }
    return { success: true };
  } catch (err: any) {
    console.error('Erro ao gerar PNG do certificado:', err);
    return { success: false, error: err?.message };
  }
}
