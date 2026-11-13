/**
 * Catalogue officiel fourni pour la page Niveau VIP.
 * Ces seuils d'affichage ne prouvent pas le niveau effectif d'un compte.
 */
export const VIP_LEVELS = [
  { level: 0, investmentRequired: 0 },
  { level: 1, investmentRequired: 2_000 },
  { level: 2, investmentRequired: 20_000 },
  { level: 3, investmentRequired: 1_000_000 },
  { level: 4, investmentRequired: 4_000_000 },
] as const;

export type VipLevelDefinition = (typeof VIP_LEVELS)[number];

export function formatVipInvestment(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
    .format(amount).replace(/[\u00a0\u202f]/g, ' ');
}
