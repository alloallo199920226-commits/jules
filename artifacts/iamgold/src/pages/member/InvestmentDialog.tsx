import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { IndustrialIcon } from '@/components/industrial-icons';
import { FinancialTable, InvestmentModal, MetallicButton, QuantitySelector } from '@/iamgold-industrial-system/components';
import {
  formatInvestmentAmount,
  getInvestmentTotals,
  MAX_PREVIEW_SHARES,
  type InvestmentProduct,
} from './investment-products';

type InvestmentDialogProps = {
  product: InvestmentProduct;
  onClose: () => void;
};

const MAX_SAFE_QUANTITY = Number.MAX_SAFE_INTEGER;

function formatDays(days: number | null) {
  return days === null ? '—' : `${days} ${days === 1 ? 'jour' : 'jours'}`;
}

export default function InvestmentDialog({ product, onClose }: InvestmentDialogProps) {
  const [quantityText, setQuantityText] = useState('1');
  const [unavailableMessage, setUnavailableMessage] = useState('');

  const safeLimit = useMemo(() => {
    const values = [product.unitPrice, product.dailyRevenue, product.totalRevenue]
      .filter((value): value is number => value !== null && Number.isFinite(value) && value > 0);
    const amountLimit = values.length
      ? Math.max(1, Math.floor(MAX_SAFE_QUANTITY / Math.max(...values.map(value => Math.round(value * 100)))))
      : MAX_PREVIEW_SHARES;
    return Math.max(1, Math.min(MAX_PREVIEW_SHARES, amountLimit));
  }, [product.dailyRevenue, product.totalRevenue, product.unitPrice]);

  const quantityLimit = product.maximumShares === null
    ? safeLimit
    : Math.max(1, Math.min(safeLimit, Math.floor(product.maximumShares)));
  const parsedQuantity = quantityText === '' ? null : Number(quantityText);
  const quantity = parsedQuantity !== null && Number.isSafeInteger(parsedQuantity) && parsedQuantity >= 1
    ? Math.min(parsedQuantity, quantityLimit)
    : null;
  const totals = quantity === null ? null : getInvestmentTotals(product, quantity);
  const canConfirm = product.unitPrice !== null && Number.isFinite(product.unitPrice) &&
    product.unitPrice >= 0 && quantity !== null;

  const setQuantity = (next: number) => {
    setQuantityText(String(Math.max(1, Math.min(quantityLimit, Math.floor(next)))));
  };

  const onQuantityChange = (value: string) => {
    if (/^\d*$/.test(value)) {
      setQuantityText(value !== '' && Number(value) > quantityLimit ? String(quantityLimit) : value);
    }
  };

  const normalizeQuantity = () => {
    if (quantity === null) setQuantityText('1');
    else setQuantityText(String(quantity));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canConfirm || totals?.amountToPay == null) return;
    setUnavailableMessage('Souscription indisponible : aucun service d’achat n’est relié à ce catalogue de référence.');
  };

  const money = (value: number | null | undefined) =>
    value === null || value === undefined || !Number.isFinite(value) ? '—' : formatInvestmentAmount(value);
  const rows = [
    { label: 'Prix unitaire', value: money(product.unitPrice), icon: 'coinRise' as const },
    { label: 'Revenu', value: formatDays(product.durationDays), icon: 'clock' as const },
    { label: 'Gains quotidiens', value: money(totals?.dailyRevenue), icon: 'coinRise' as const },
    { label: 'Revenu total', value: money(totals?.totalRevenue), icon: 'bullionStack' as const, emphasis: true, testId: 'total-revenue' },
    { label: 'Investissement maximal', value: product.maximumShares === null ? '—' : String(product.maximumShares), icon: 'orders' as const },
  ];

  return (
    <InvestmentModal productName={product.name} onClose={onClose}>
      <form className="product-dialog-shell" onSubmit={onSubmit}>
        <div className="product-dialog-scroll">
          <div className="product-dialog-panorama" aria-hidden="true">
            <img
              className="product-dialog-panorama-mining"
              src={`${import.meta.env.BASE_URL}iamgold-industrial-art/investment-modal-mining.webp`}
              alt=""
            />
            <img
              className="product-dialog-panorama-refinery"
              src={`${import.meta.env.BASE_URL}iamgold-industrial-art/investment-modal-refinery.webp`}
              alt=""
            />
            <svg className="product-dialog-panorama-frame" viewBox="0 0 1000 120" preserveAspectRatio="none">
              <path d="M32 2H968L998 22V98L970 118H30L2 98V22Z" className="panorama-bevel-outer" />
              <path d="M36 6H964L992 24V96L968 114H32L8 96V24Z" className="panorama-bevel-mid" />
              <path d="M48 11H952L982 27V91L961 107H39L18 91V28Z" className="panorama-bevel-inner" />
              <path d="M54 14H946M20 32V88M980 32V88" className="panorama-bevel-light" />
            </svg>
          </div>
          <div className="product-dialog-facts" aria-label="Résumé du lot">
            <div>
              <IndustrialIcon name="calendar" size={30} />
              <span className="product-dialog-fact-copy"><span>Durée du revenu</span><strong>{formatDays(product.durationDays)}</strong></span>
            </div>
            <div>
              <IndustrialIcon name="coins" size={34} />
              <span className="product-dialog-fact-copy"><span>Gains quotidiens</span><strong>{money(product.dailyRevenue)}</strong></span>
            </div>
          </div>

          <h2 className="product-dialog-title" data-testid="dialog-product-name">{product.name}</h2>

          <div className="product-dialog-identity">
            <div className="product-dialog-art" aria-hidden="true"><IndustrialIcon name="bullionStack" size={57} /></div>
            <div className="product-dialog-identity-copy">
              <strong>{product.name}</strong>
              <span>Offre de référence</span>
            </div>
            <IndustrialIcon name="oreCluster" size={49} className="product-dialog-ore" aria-hidden="true" />
          </div>

          <p className="product-dialog-reference-status" role="status">
            Catalogue de référence · aucune souscription disponible
          </p>

          <FinancialTable rows={rows} className="product-dialog-details" />

          <QuantitySelector
            quantityText={quantityText}
            quantity={quantity}
            quantityLimit={quantityLimit}
            onChange={onQuantityChange}
            onIncrement={delta => setQuantity((quantity ?? 1) + delta)}
            onBlur={normalizeQuantity}
          />
          {unavailableMessage && <p className="product-dialog-alert" role="alert" data-testid="investment-unavailable">{unavailableMessage}</p>}
        </div>

        <footer className="product-dialog-footer">
          <div className="product-dialog-pay">
            <span><IndustrialIcon name="wallet" size={27} />Montant à payer</span>
            <strong data-testid="amount-to-pay">{money(totals?.amountToPay)}</strong>
          </div>
          <MetallicButton
            className="product-dialog-confirm"
            type="submit"
            disabled={!canConfirm}
            data-testid="button-confirm-investment"
          >
            <IndustrialIcon name="bullion" size={29} />
            <span>Confirmer</span>
            <span className="investment-action-arrows" aria-hidden="true">››</span>
          </MetallicButton>
        </footer>
      </form>
    </InvestmentModal>
  );
}
