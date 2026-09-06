/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_MERCADO_PAGO_PUBLIC_KEY?: string;
  readonly VITE_MERCADO_PAGO_CHECKOUT_URL?: string;
  readonly VITE_ORGANIZATION_WHATSAPP?: string;
  readonly VITE_PIX_KEY?: string;
  readonly VITE_PIX_BENEFICIARY?: string;
  readonly VITE_PIX_CITY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
