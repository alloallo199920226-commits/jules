import { IndustrialIcon } from '@/components/industrial-icons';
import { Frame, goTo } from './shared';
import { EditorialMasthead, IndustrialArrow } from '@/iamgold-industrial-system/components/IndustrialEditorial';

export default function Help() {
  const reportDeposit = () => {
    try { sessionStorage.setItem('iamgold-support-draft', 'Bonjour, je souhaite signaler un dépôt qui n’a pas été reçu.'); } catch { /* optional prefill */ }
    goTo('Support');
  };
  return <Frame><div className="industrial-help">
    <EditorialMasthead title="Centre d’aide" variant="help" icon="support"/>
    <main className="industrial-help-content">
      <section className="industrial-help-hero" aria-labelledby="help-hero-title">
        <div className="industrial-help-hero-copy">
          <span className="industrial-eyebrow">ESPACE MEMBRE</span>
          <h2 id="help-hero-title">Service <em>Center</em></h2>
          <p>Un accompagnement complet à chaque étape, quand vous en avez besoin.</p>
        </div>
        <img className="industrial-help-portrait" src={`${import.meta.env.BASE_URL}iamgold-industrial-art/reference-crops/help-advisor-full.png`} alt="Conseillère IAMGOLD portant un casque de communication" />
        <div className="industrial-help-gold" aria-hidden="true"><img src={`${import.meta.env.BASE_URL}iamgold-industrial-art/bullion.webp`} alt=""/></div>
        <span className="industrial-hero-index" aria-hidden="true">01 / AIDE</span>
      </section>
      <section className="industrial-service-list" aria-label="Options d’aide">
        <button type="button" className="industrial-service service-support" onClick={() => goTo('Support')} data-testid="button-online-service">
          <span className="industrial-service-art"><img src={`${import.meta.env.BASE_URL}iamgold-industrial-art/help-headset.webp`} alt=""/><i/></span>
          <span className="industrial-service-copy"><strong>Service client en ligne</strong><small>Écrivez à l’équipe IAMGOLD et suivez la réponse ici.</small></span>
          <IndustrialArrow/>
        </button>
        <button type="button" className="industrial-service service-deposit" onClick={reportDeposit} data-testid="button-report-deposit">
          <span className="industrial-service-art"><img src={`${import.meta.env.BASE_URL}iamgold-industrial-art/help-deposit.webp`} alt=""/></span>
          <span className="industrial-service-copy"><strong>Votre dépôt n’a pas été reçu&nbsp;?</strong><small>Signalez votre dépôt à l’équipe via la messagerie.</small></span>
          <IndustrialArrow/>
        </button>
        <button type="button" className="industrial-service service-official" onClick={() => goTo('Announcement')} data-testid="button-official-information">
          <span className="industrial-service-art"><img src={`${import.meta.env.BASE_URL}iamgold-industrial-art/help-telegram.webp`} alt=""/></span>
          <span className="industrial-service-copy"><strong>Informations officielles</strong><small>Ouvrir la rubrique d’annonces de l’espace membre.</small><small className="industrial-reference-caption">Destination interne · annonces</small></span>
          <IndustrialArrow/>
        </button>
      </section>
      <footer className="industrial-help-foot"><span>IAMGOLD</span><span>Présentation de référence · espace membre</span></footer>
    </main>
  </div></Frame>;
}
