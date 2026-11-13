import { Frame, goBack, Support } from './shared';
import { VIP_LEVELS } from '@/config/vip-levels';
import { IndustrialIcon } from '@/components/industrial-icons';
import { VipCrown } from '@/components/vip/VipCrown';
import { VipLevelCard } from './VipLevelCard';
import { RoyalMasthead, RoyalToolbar } from '@/iamgold-industrial-system/components/RoyalMasthead';
import './vip-page.css';

const tierArtwork = [
  'iamgold-industrial-art/ore.webp',
  'iamgold-industrial-art/bullion.webp',
  'iamgold-industrial-art/investment-modal-mining.webp',
  'iamgold-industrial-art/banner-bullion.webp',
  'iamgold-industrial-art/investment-modal-refinery.webp',
] as const;

export default function Vip() {
  return (
    <Frame>
      <div className="vip-page royal-page">
        <RoyalMasthead />
        <div className="vip-toolbar-wrap">
          <RoyalToolbar title="Niveau VIP" onBack={() => goBack()} />
          <span className="vip-toolbar-crown" aria-hidden="true"><VipCrown level={3} size={32} /></span>
        </div>
        <main className="vip-scroll" aria-label="Niveaux VIP et seuils officiels">
          <section className="vip-level-list" aria-label="Seuils d’investissement par niveau">
            {VIP_LEVELS.map(level => (
              <VipLevelCard
                key={level.level}
                level={level}
                artwork={tierArtwork[level.level]}
                index={level.level}
              />
            ))}
          </section>
          <section className="vip-industrial-panorama" role="img" aria-label="Mines, minerais et installations de raffinage IAMGOLD">
            <img className="vip-panorama-mine" src={`${import.meta.env.BASE_URL}iamgold-industrial-art/about-open-pit.webp`} alt="" />
            <img className="vip-panorama-refinery" src={`${import.meta.env.BASE_URL}iamgold-industrial-art/investment-modal-refinery.webp`} alt="" />
          </section>
          <section className="vip-support-panel" aria-label="Assistance">
            <div className="vip-support-copy">
              <span className="vip-support-emblem" aria-hidden="true"><IndustrialIcon name="support" size={23} /></span>
              <strong>Besoin d’aide ?</strong>
            </div>
            <Support inline />
          </section>
        </main>
      </div>
    </Frame>
  );
}
