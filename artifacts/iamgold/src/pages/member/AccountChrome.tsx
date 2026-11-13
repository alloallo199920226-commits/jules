import type { ReactNode } from 'react';
import { IndustrialIcon, type IndustrialIconName } from '@/components/industrial-icons';
import { Support, goBack } from './shared';

export function AccountMasthead({ page }: { page: 'money' | 'profile' }) {
  return <section className={`supreme-masthead supreme-masthead-${page}`} aria-label="IAMGOLD — plateforme Ayala">
    <img className="supreme-brand-panorama" src={`${import.meta.env.BASE_URL}iamgold-industrial-art/reference-crops/royal-panorama.webp`} alt="IAMGOLD, La plateforme AYALA — Fabrication & Raffinage d’Or"/>
  </section>;
}

export function AccountTitle({ title, icon, onHelp }: { title: string; icon: IndustrialIconName; onHelp?: () => void }) {
  return <header className="supreme-title-rail">
    <button type="button" className="supreme-back" onClick={() => goBack()} aria-label="Retour" data-testid="button-account-back"><IndustrialIcon name="arrowLeft" size={23}/></button>
    <IndustrialIcon name={icon} size={27}/>
    <h1>{title}</h1>
    {onHelp ? <button type="button" className="supreme-publish-help" onClick={onHelp} aria-label="Informations sur la publication" data-testid="button-publish-help"><IndustrialIcon name="info" size={22}/></button> : <span className="supreme-rail-end" aria-hidden="true"/>}
  </header>;
}

export function MetalPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  const hasMobileMoneyArt = className.includes('supreme-money-panel');
  return <section className={`supreme-panel ${className}`}>
    {hasMobileMoneyArt && <div className="supreme-money-art-column" aria-hidden="true">
      <img src={`${import.meta.env.BASE_URL}iamgold-industrial-art/mobile-account-stage.webp`} alt="" />
    </div>}
    <div className={hasMobileMoneyArt ? 'supreme-money-content' : 'supreme-panel-content'}>
      {children}
    </div>
  </section>;
}

export function MetalSubmit({ children, disabled = false, testId }: { children: ReactNode; disabled?: boolean; testId: string }) {
  return <button className="supreme-submit" type="submit" disabled={disabled} data-testid={testId}>
    <span className="supreme-submit-arrow" aria-hidden="true">‹‹</span>
    <IndustrialIcon name="secure" size={30}/>
    <span>{children}</span>
    <span className="supreme-submit-arrow" aria-hidden="true">››</span>
  </button>;
}

export function AccountSupport() {
  return <div className="supreme-support-rail">
    <div className="supreme-support-help"><IndustrialIcon name="help" size={27}/><span>Besoin d’aide&nbsp;?</span></div>
    <span className="supreme-support-divider" aria-hidden="true"/>
    <Support inline availabilityUnknown/>
  </div>;
}
