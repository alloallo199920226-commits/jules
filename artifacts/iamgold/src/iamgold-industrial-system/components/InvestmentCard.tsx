import { IndustrialIcon } from '@/components/industrial-icons';
import { formatInvestmentAmount, type InvestmentProduct } from '@/pages/member/investment-products';
import { FinancialTable } from './FinancialTable';
import { MetallicButton } from './MetallicButton';

type InvestmentCardProps = {
  product: InvestmentProduct;
  illustration: 'truck' | 'excavator';
  onSelect: () => void;
};

export function InvestmentCard({ product, illustration, onSelect }: InvestmentCardProps) {
  const rows = [
    { label: 'Prix unitaire', value: formatInvestmentAmount(product.unitPrice), icon: 'coinRise' as const },
    { label: 'Revenu', value: product.durationDays === null ? '—' : `${product.durationDays} jours`, icon: 'clock' as const },
    { label: 'Gains quotidiens', value: formatInvestmentAmount(product.dailyRevenue), icon: 'coinRise' as const },
    { label: 'Revenu total', value: formatInvestmentAmount(product.totalRevenue), icon: 'bullionStack' as const, emphasis: true },
  ];
  return (
    <article className="investment-card" data-testid={`card-product-${product.id}`}>
      <svg className="investment-card-frame" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M5 1H91L99 7V92L94 99H7L1 94V9Z" className="investment-card-frame-outer" />
        <path d="M7 3H90L97 8V91L92 97H8L3 92V10Z" className="investment-card-frame-inner" />
        <path d="M11 5H88M5 14V85M95 16V84M12 95H86" className="investment-card-frame-highlight" />
      </svg>
      <div className={`investment-card-scene investment-card-scene--${illustration}`} aria-hidden="true">
        <img
          className="investment-scene-photo"
          src={`${import.meta.env.BASE_URL}iamgold-industrial-art/${illustration === 'truck' ? 'investment-stable-1' : 'investment-stable-2'}.webp`}
          alt=""
        />
        <div className="investment-scene-glint" />
        <span className="investment-scene-index">VISUEL D’ILLUSTRATION</span>
      </div>
      <div className="investment-card-content">
        <div className="investment-product-heading">
          <span className="investment-product-mark"><IndustrialIcon name="bullionStack" size={38} /></span>
          <div>
            <p className="investment-card-kicker">LOT DE RÉFÉRENCE</p>
            <h2>{product.name}</h2>
          </div>
        </div>
        <p className="investment-reference-status">Catalogue de référence · souscription indisponible</p>
        <FinancialTable rows={rows} className="investment-card-table" />
        <MetallicButton type="button" className="investment-card-action" onClick={onSelect} data-testid={`button-invest-${product.id}`}>
          <IndustrialIcon name="bullion" size={27} />
          <span>Investir maintenant</span>
          <span className="investment-action-arrows" aria-hidden="true">››</span>
        </MetallicButton>
      </div>
    </article>
  );
}
