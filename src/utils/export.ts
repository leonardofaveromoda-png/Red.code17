import { Inscricao, Minicurso } from '../types';

/**
 * Utilitário de exportação para CSV e TSV com suporte a UTF-8 BOM (Byte Order Mark),
 * garantindo que caracteres acentuados e CPFs não percam os zeros à esquerda no Microsoft Excel.
 */

export function exportRegistrationsToCSV(
  inscricoes: Inscricao[],
  cursosMap: Record<string, Minicurso>,
  fileName = 'inscricoes_aph.csv'
) {
  const headers = [
    'ID Inscrição',
    'Data/Hora',
    'Minicurso',
    'Nome Completo',
    'CPF',
    'WhatsApp',
    'E-mail',
    'Status Pagamento',
    'Valor (R$)',
    'Comprovante Enviado'
  ];

  const rows = inscricoes.map((item) => {
    const curso = cursosMap[item.minicurso_id];
    const cursoTitulo = curso ? curso.titulo : 'Não identificado';
    const valor = curso ? curso.valor.toFixed(2).replace('.', ',') : '0,00';
    const dataFormatada = new Date(item.created_at).toLocaleString('pt-BR');
    const comprovanteStatus = item.comprovante_url ? 'SIM (Anexado)' : 'NÃO';

    return [
      `"${item.id}"`,
      `"${dataFormatada}"`,
      `"${cursoTitulo.replace(/"/g, '""')}"`,
      `"${item.nome_completo.replace(/"/g, '""')}"`,
      // Força o Excel a tratar CPF como texto puro para não truncar zeros iniciais
      `"=""${item.cpf}"""`,
      `"=""${item.whatsapp}"""`,
      `"${item.email.replace(/"/g, '""')}"`,
      `"${item.status_pagamento.toUpperCase()}"`,
      `"${valor}"`,
      `"${comprovanteStatus}"`
    ].join(';');
  });

  // \uFEFF é o UTF-8 BOM essencial para o Excel no Windows
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  downloadBlob(csvContent, fileName, 'text/csv;charset=utf-8;');
}

export function exportRegistrationsToTSV(
  inscricoes: Inscricao[],
  cursosMap: Record<string, Minicurso>,
  fileName = 'inscricoes_aph.tsv'
) {
  const headers = [
    'ID Inscrição',
    'Data/Hora',
    'Minicurso',
    'Nome Completo',
    'CPF',
    'WhatsApp',
    'E-mail',
    'Status Pagamento',
    'Valor (R$)',
    'Comprovante'
  ];

  const rows = inscricoes.map((item) => {
    const curso = cursosMap[item.minicurso_id];
    const cursoTitulo = curso ? curso.titulo : 'Não identificado';
    const valor = curso ? curso.valor.toFixed(2) : '0.00';
    const dataFormatada = new Date(item.created_at).toLocaleString('pt-BR');

    return [
      item.id,
      dataFormatada,
      cursoTitulo.replace(/\t/g, ' '),
      item.nome_completo.replace(/\t/g, ' '),
      item.cpf,
      item.whatsapp,
      item.email,
      item.status_pagamento.toUpperCase(),
      valor,
      item.comprovante_url ? 'SIM' : 'NÃO'
    ].join('\t');
  });

  const tsvContent = '\uFEFF' + [headers.join('\t'), ...rows].join('\r\n');
  downloadBlob(tsvContent, fileName, 'text/tab-separated-values;charset=utf-8;');
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
