import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useSession } from '@/session';
import { Frame, BottomNav, Support, Modal, Icons, goTo, copyLink } from './shared';
import { invitationLink, useMember } from './member-context';
import { IndustrialArtwork } from '@/iamgold-industrial-system/icons/IndustrialArtwork';
import { HexagonalAction, MetalPanel } from '@/iamgold-industrial-system/components';

export default function Home({ announcement = false }: { announcement?: boolean }) {
  const [modal, setModal] = useState(true);
  const [copied, setCopied] = useState(false);
  const [telegramFeedback, setTelegramFeedback] = useState('');
  const [location] = useLocation();
  useEffect(() => { setModal(true); }, [location, announcement]);
  useEffect(() => { if (modal) setTelegramFeedback(''); }, [modal]);
  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [copied]);
  const { overview } = useMember();
  const { showNotice } = useSession();
  const link = invitationLink(overview.invitationCode);
  const shortcuts = [
    { label: 'Recharger', icon: 'bullionStack', artwork: 'bullion', target: 'Recharge' },
    { label: 'Retirer', icon: 'coinRise', artwork: 'coin-rise', target: 'Withdraw' },
    { label: 'Mon Équipe', icon: 'engineers', artwork: 'engineers', target: 'Invitation' },
    { label: 'Telegram', icon: 'send', artwork: 'telegram', target: 'Telegram' },
  ] as const;
  return <Frame><div className="ayala-scroll member-home-scroll">
    <header className="member-home-header"><img src={`${import.meta.env.BASE_URL}iamgold-home-header.webp`} alt="IAMGOLD — La plateforme Ayala, Fabrication & Raffinage d’Or"/></header>
    <main className="ayala-main member-home-main">
      <div className="member-brand-banner" aria-label="IAMGOLD, mining redefined">
        <MetalPanel shape="banner" className="member-home-banner-panel">
          <div className="member-banner-ore" aria-hidden="true"><IndustrialArtwork name="banner-ore"/></div>
          <div className="member-home-banner-wordmark"><img src={`${import.meta.env.BASE_URL}iamgold-wordmark-tight.webp`} alt="IAMGOLD — Mining. Redefined."/></div>
          <div className="member-banner-bullion" aria-hidden="true"><IndustrialArtwork name="banner-bullion"/></div>
        </MetalPanel>
      </div>
      <div className="member-home-shortcuts" aria-label="Actions rapides">
        <MetalPanel shape="tray" className="member-home-action-tray">
          <div className="member-home-action-grid">
            {shortcuts.map(({ label, icon, artwork, target }) => <HexagonalAction key={target} label={label} icon={icon} artwork={artwork} testId={`action-home-${target.toLowerCase()}`} onClick={() => target === 'Telegram' ? setModal(true) : goTo(target)}/>)}
          </div>
        </MetalPanel>
      </div>
      <section className="ayala-card member-home-section member-home-invitation" aria-label="Récompenses d’invitation">
        <MetalPanel shape="invite">
          <div className="member-invite-ore" aria-hidden="true"><IndustrialArtwork name="ore"/></div>
          <div className="member-home-section-heading"><Icons.Users size={28}/><b>Récompenses d’invitation</b></div>
          <div className="member-muted">Investissez ensemble, enrichissez-vous ensemble</div>
          <div className="member-invite-row"><Icons.Share2 size={28}/><div>Lien d’invitation<br/><span data-testid="text-invitation-link">{link}</span></div><button type="button" aria-live="polite" data-copied={copied} onClick={async () => setCopied(await copyLink(link, showNotice))} data-testid="button-copy-invitation">{copied ? 'Copié' : 'Copier'}</button></div>
        </MetalPanel>
      </section>
      <section className="ayala-card member-home-section member-home-activities" aria-label="Centre d’activités de bien-être">
        <MetalPanel shape="activities">
          <div className="member-home-section-heading"><Icons.Gift size={27}/><b>Centre d’activités de bien-être</b></div>
          <div className="member-home-activity-grid">
            <MetalPanel shape="activity-tile" className="member-home-activity-panel">
              <div className="member-activity"><span className="member-activity-icon"><IndustrialArtwork name="wheel-gift"/></span><div><b>Roue de la chance</b><small>Roue de la chance</small></div><button type="button" onClick={() => goTo('Lottery')} data-testid="button-home-lottery">Tirage au sort</button></div>
            </MetalPanel>
            <MetalPanel shape="activity-tile" className="member-home-activity-panel">
              <div className="member-activity"><span className="member-activity-icon"><IndustrialArtwork name="task-rewards"/></span><div><b>Récompenses de tâches</b><small>Centre de missions</small></div><button type="button" onClick={() => goTo('Missions')} data-testid="button-home-missions">Aller à</button></div>
            </MetalPanel>
          </div>
        </MetalPanel>
      </section>
    </main>
    <div className="member-home-support-row"><div className="member-home-support-prompt"><Icons.Info size={25}/>Besoin d’aide ?</div><Support inline/></div>
  </div><BottomNav active="Home" onHome={() => setModal(true)}/>
    {modal && <Modal className="member-welcome-dialog" label="Publication d’informations officielles" onClose={() => setModal(false)}><div className="member-telegram"><img src={`${import.meta.env.BASE_URL}telegram-popup.png`} width={70} height={70} alt=""/></div><h2>Publication d’informations officielles</h2><p>Suivez notre canal Telegram officiel pour obtenir les dernières nouvelles et informations sur le bien-être</p><button className="ayala-soft-button" onClick={() => setTelegramFeedback('Le canal Telegram n’est pas configuré.')}>Suivre maintenant</button>{telegramFeedback && <p className="member-telegram-feedback" role="alert">{telegramFeedback}</p>}</Modal>}
  </Frame>;
}
