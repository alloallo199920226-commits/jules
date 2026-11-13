export interface InvestmentProduct {
  id: string | number;
  category?: 'stable' | 'wellbeing' | 'activity';
  name: string;
  unitPrice: number | null;
  durationDays: number | null;
  dailyRevenue: number | null;
  totalRevenue: number | null;
  maximumShares: number | null;
}

// Existing reference offers, not an active financial catalogue.
// Missing terms must not be replaced by another platform's example values.
export const investmentProducts: readonly InvestmentProduct[] = [
  {
    id: 'stable-1', name: 'Stabiliser les investissements 1',
    unitPrice: 2000, durationDays: 100, dailyRevenue: 400, totalRevenue: 40000, maximumShares: null,
  },
  {
    id: 'stable-2', name: 'Stabiliser les investissements 2',
    unitPrice: null, durationDays: null, dailyRevenue: null, totalRevenue: null, maximumShares: null,
  },
];

// Technical preview limit only; this is not a configured product purchase limit.
export const MAX_PREVIEW_SHARES = 1_000_000;
const amountFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

export function formatInvestmentAmount(value: number | null): string {
  return value === null || !Number.isFinite(value) ? '—' : `${amountFormatter.format(value)} FCFA`;
}

export function getInvestmentTotals(product: InvestmentProduct, quantity: number) {
  const maximum = Math.min(product.maximumShares ?? MAX_PREVIEW_SHARES, MAX_PREVIEW_SHARES);
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > maximum) {
    throw new RangeError('Nombre de parts invalide.');
  }
  const multiply = (value: number | null) => {
    if (value === null) return null;
    const cents = Math.round(value * 100) * quantity;
    if (!Number.isSafeInteger(cents) || cents < 0) throw new RangeError('Montant invalide ou trop élevé.');
    return cents / 100;
  };
  return {
    amountToPay: multiply(product.unitPrice),
    totalRevenue: multiply(product.totalRevenue),
    dailyRevenue: multiply(product.dailyRevenue),
  };
}
