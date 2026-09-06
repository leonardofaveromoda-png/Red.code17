/**
 * Utilitário de Geração de Código PIX Padrão Banco Central do Brasil (EMV-QRCPS)
 * Inclui cálculo de CRC-16 (polinômio 0x1021 / 0xFFFF) e montagem de payload 'Copia e Cola'.
 */

function formatField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Cálculo de CRC16 CCITT (0xFFFF) exigido pela especificação do PIX
 */
export function calculateCRC16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export interface PixPayloadParams {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  txId?: string;
}

/**
 * Gera a string 'PIX Copia e Cola' oficial compatível com qualquer aplicativo bancário
 */
export function generatePixPayload({
  pixKey,
  merchantName,
  merchantCity,
  amount,
  txId = '***',
}: PixPayloadParams): string {
  // Limpa caracteres especiais da chave e nomes
  const cleanMerchantName = merchantName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .slice(0, 25)
    .toUpperCase();

  const cleanMerchantCity = merchantCity
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .slice(0, 15)
    .toUpperCase();

  const formattedAmount = amount.toFixed(2);

  // 00: Payload Format Indicator
  let payload = formatField('00', '01');

  // 26: Merchant Account Information (GUI + Key)
  const gui = formatField('00', 'br.gov.bcb.pix');
  const key = formatField('01', pixKey);
  payload += formatField('26', `${gui}${key}`);

  // 52: Merchant Category Code (0000 geral)
  payload += formatField('52', '0000');

  // 53: Transaction Currency (986 = Real Brasileiro)
  payload += formatField('53', '986');

  // 54: Transaction Amount
  payload += formatField('54', formattedAmount);

  // 58: Country Code (BR)
  payload += formatField('58', 'BR');

  // 59: Merchant Name
  payload += formatField('59', cleanMerchantName);

  // 60: Merchant City
  payload += formatField('60', cleanMerchantCity);

  // 62: Additional Data Field Template (TxID)
  const sanitizedTxId = (txId || '***').replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || '***';
  const txField = formatField('05', sanitizedTxId);
  payload += formatField('62', txField);

  // 63: CRC16 (inicia com id 63 e tamanho 04)
  payload += '6304';
  const crc = calculateCRC16(payload);

  return `${payload}${crc}`;
}

/**
 * URL do QR code gerado para renderização imediata de alta fidelidade
 */
export function getPixQrCodeUrl(pixString: string, size = 320): string {
  // Gera QR Code via endpoint seguro e com cache
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(
    pixString,
  )}`;
}
