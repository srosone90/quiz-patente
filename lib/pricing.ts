// ============================================================
// PREZZI B2B AUTOSCUOLE
// Modifica qui i prezzi per tutti i pacchetti scuola
// ============================================================

export interface LicensePricing {
  id: string
  label: string
  labelShort: string
  pricePerCode: number   // in euro
  isBeta: boolean        // se true, non disponibile nell'acquisto B2B
}

export const B2B_LICENSE_PRICING: LicensePricing[] = [
  { id: 'ab',        label: 'Patente A e B',     labelShort: 'A/B',     pricePerCode: 5,  isBeta: false },
  { id: 'am',        label: 'Patente AM',         labelShort: 'AM',      pricePerCode: 4,  isBeta: false },
  { id: 'cd',        label: 'Patente C e D',      labelShort: 'C/D',     pricePerCode: 8,  isBeta: false },
  { id: 'cqc',       label: 'CQC',                labelShort: 'CQC',     pricePerCode: 8,  isBeta: false },
  { id: 'nautica',   label: 'Patente Nautica',    labelShort: 'Nautica', pricePerCode: 7,  isBeta: false },
  { id: 'adr',       label: 'ADR',                labelShort: 'ADR',     pricePerCode: 7,  isBeta: false },
  { id: 'cap_kb',    label: 'CAP KB',             labelShort: 'CAP KB',  pricePerCode: 5,  isBeta: false },
  { id: 'revisione', label: 'Revisione Patenti',  labelShort: 'Revisione', pricePerCode: 4, isBeta: false },
  { id: 'taxi_ncc',  label: 'Taxi / NCC',         labelShort: 'Taxi/NCC', pricePerCode: 5, isBeta: true  },
]

// Licenze disponibili per la vendita B2B (escluse quelle in beta)
export const B2B_AVAILABLE_LICENSES = B2B_LICENSE_PRICING.filter(l => !l.isBeta)

// Numero minimo di codici per ordine
export const B2B_MIN_CODES = 5

// Durata predefinita dei codici in giorni
export const B2B_CODE_DURATION_DAYS = 180

// Tipo di piano assegnato ai codici B2B
export const B2B_PLAN_TYPE = 'senza_pensieri' as const

/**
 * Calcola il totale di un ordine dato una lista di voci { licenseId, quantity }
 */
export function calculateOrderTotal(
  items: Array<{ licenseId: string; quantity: number }>
): number {
  return items.reduce((total, item) => {
    const pricing = B2B_LICENSE_PRICING.find(l => l.id === item.licenseId)
    if (!pricing) return total
    return total + pricing.pricePerCode * item.quantity
  }, 0)
}

/**
 * Restituisce il prezzo di una licenza in centesimi (per Stripe)
 */
export function getPriceInCents(licenseId: string): number {
  const pricing = B2B_LICENSE_PRICING.find(l => l.id === licenseId)
  if (!pricing) return 0
  return Math.round(pricing.pricePerCode * 100)
}
