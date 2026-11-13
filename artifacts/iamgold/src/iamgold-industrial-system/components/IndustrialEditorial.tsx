import { IndustrialIcon, type IndustrialIconName } from '@/components/industrial-icons';
import { goBack } from '@/pages/member/shared';

type MastheadVariant = 'notice' | 'help' | 'about';

export function EditorialMasthead({ title, variant, icon = 'refinery' }: {
  title: string;
  variant: MastheadVariant;
  tagline?: string;
  signature?: string;
  icon?: IndustrialIconName;
}) {
  return <header className={`industrial-masthead industrial-masthead-${variant}`}>
    <img className="industrial-masthead-panorama" src={`${import.meta.env.BASE_URL}iamgold-industrial-art/reference-crops/royal-panorama.webp`} alt="IAMGOLD, La plateforme AYALA — Fabrication & Raffinage d’Or"/>
    <div className="industrial-title-rail">
      <button type="button" onClick={() => goBack()} aria-label="Retour" className="industrial-back" data-testid="button-editorial-back">
        <IndustrialIcon name="arrowLeft" size={21}/>
      </button>
      <span className="industrial-title-icon"><IndustrialIcon name={icon} size={25}/></span>
      <h1>{title}</h1>
      <span className="industrial-title-rule" aria-hidden="true"/>
    </div>
  </header>;
}

export function IndustrialArrow() {
  return <span className="industrial-arrow" aria-hidden="true"><IndustrialIcon name="chevronRight" size={22}/></span>;
}
