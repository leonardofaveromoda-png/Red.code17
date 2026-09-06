/**
 * Algoritmo oficial de validação e formatação de CPF (Cadastro de Pessoas Físicas)
 * Valida formato e os 2 dígitos verificadores através do cálculo ponderado módulo 11.
 */

export function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

export function formatCPF(value: string): string {
  const digits = cleanCPF(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

export function validateCPF(cpf: string): { isValid: boolean; message?: string } {
  const clean = cleanCPF(cpf);

  if (!clean) {
    return { isValid: false, message: 'CPF é obrigatório.' };
  }

  if (clean.length !== 11) {
    return { isValid: false, message: 'CPF incompleto (deve conter 11 dígitos).' };
  }

  // Rejeita sequências de dígitos repetidos conhecidas (ex: 111.111.111-11, 000.000.000-00)
  if (/^(\d)\1{10}$/.test(clean)) {
    return { isValid: false, message: 'CPF inválido (dígitos repetidos).' };
  }

  // 1º Dígito Verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let rest = 11 - (sum % 11);
  const digit1 = rest >= 10 ? 0 : rest;

  if (digit1 !== parseInt(clean.charAt(9), 10)) {
    return { isValid: false, message: 'CPF inválido (1º dígito verificador incorreto).' };
  }

  // 2º Dígito Verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  rest = 11 - (sum % 11);
  const digit2 = rest >= 10 ? 0 : rest;

  if (digit2 !== parseInt(clean.charAt(10), 10)) {
    return { isValid: false, message: 'CPF inválido (2º dígito verificador incorreto).' };
  }

  return { isValid: true };
}
