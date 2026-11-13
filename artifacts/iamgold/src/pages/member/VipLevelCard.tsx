import type { VipLevelDefinition } from '@/config/vip-levels';
import { formatVipInvestment } from '@/config/vip-levels';
import { VipCrown } from '@/components/vip/VipCrown';

type VipLevelCardProps = {
  level: VipLevelDefinition;
  artwork: string;
  index: number;
};

export function VipLevelCard({ level, artwork, index }: VipLevelCardProps) {
  return (
    <article className={`vip-level-card vip-level-${level.level}`} data-testid={`card-vip-level-${level.level}`}>
      <div className="vip-level-identity" aria-label={`VIP ${level.level}`}>
        <VipCrown level={level.level} size={76} />
        <span className="vip-level-medallion">VIP {level.level}</span>
      </div>
      <div className="vip-level-details">
        <p>Ce niveau de VIP nécessite un montant d’investissement total de</p>
        <div className="vip-level-amount" aria-label={`FCFA ${formatVipInvestment(level.investmentRequired)}`}>
          <span>FCFA</span>
          <strong>{formatVipInvestment(level.investmentRequired)}</strong>
        </div>
      </div>
      <div className="vip-level-art" aria-hidden="true">
        <img src={`${import.meta.env.BASE_URL}${artwork}`} alt="" loading={index < 2 ? 'eager' : 'lazy'} decoding="async" />
      </div>
    </article>
  );
}
