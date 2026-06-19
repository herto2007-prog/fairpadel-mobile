/**
 * Formatea un número a moneda Guaraníes (Gs.)
 * Ejemplo: 1500000 -> Gs. 1.500.000
 */
export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return 'Gs. 0';
  
  return 'Gs. ' + amount.toLocaleString('es-PY', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Formatea un número con separador de miles sin símbolo de moneda
 */
export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return '0';
  
  return num.toLocaleString('es-PY');
}

/**
 * Parsea un string de moneda a número
 * Ejemplo: "1.500.000" -> 1500000
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^\d]/g, '');
  return parseInt(cleaned, 10) || 0;
}

/**
 * Formatea input de moneda en tiempo real
 * Útil para campos de formulario
 */
export function formatCurrencyInput(value: string): string {
  const num = parseCurrency(value);
  return formatNumber(num);
}
