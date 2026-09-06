/**
 * Utilitário de formatação de telefone (Brasil) e geração de link do WhatsApp
 */

export function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function formatWhatsApp(value: string): string {
  const digits = cleanPhone(value).slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function validateWhatsApp(phone: string): { isValid: boolean; message?: string } {
  const clean = cleanPhone(phone);
  if (!clean) {
    return { isValid: false, message: 'WhatsApp é obrigatório.' };
  }
  if (clean.length < 10 || clean.length > 11) {
    return { isValid: false, message: 'Número de WhatsApp inválido (deve conter DDD + 8 ou 9 dígitos).' };
  }
  // Valida DDD brasileiro (11 a 99)
  const ddd = parseInt(clean.slice(0, 2), 10);
  if (ddd < 11 || ddd > 99) {
    return { isValid: false, message: 'DDD inválido.' };
  }
  return { isValid: true };
}

export function buildWhatsAppLink(phone: string, text: string): string {
  const clean = cleanPhone(phone);
  // Adiciona o prefixo do Brasil (55) se não presente
  const internationalNumber = clean.startsWith('55') ? clean : `55${clean}`;
  return `https://wa.me/${internationalNumber}?text=${encodeURIComponent(text)}`;
}
