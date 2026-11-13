import { IndustrialIcon, type IndustrialIconName } from '@/components/industrial-icons';
import { Frame } from './shared';
import { EditorialMasthead } from '@/iamgold-industrial-system/components/IndustrialEditorial';

const process: { label: string; icon: IndustrialIconName; code: string }[] = [
  { label: 'Exploration', icon: 'oreCluster', code: '01' },
  { label: 'Extraction', icon: 'excavator', code: '02' },
  { label: 'Traitement', icon: 'plant', code: '03' },
  { label: 'Raffinage', icon: 'pour', code: '04' },
  { label: 'Fabrication d’or', icon: 'bullionStack', code: '05' },
];

const presence = [
  { icon: 'country' as const, label: 'Fièrement canadienne', note: 'Origines et identité canadiennes' },
  { icon: 'mine' as const, label: 'Présence mondiale', note: 'Une portée au-delà du Canada' },
  { icon: 'activity' as const, label: 'Portefeuille en croissance', note: 'Au Canada et au-delà' },
  { icon: 'secure' as const, label: 'Sécurité & responsabilité', note: 'Priorités inscrites dans le texte institutionnel' },
];

const values: { icon: IndustrialIconName; label: string; note: string }[] = [
  { icon: 'secure', label: 'Sécurité d’abord', note: 'La sécurité en premier.' },
  { icon: 'engineers', label: 'Nos personnes', note: 'Les personnes au cœur des priorités.' },
  { icon: 'ore', label: 'Responsabilité environnementale', note: 'L’environnement que nous partageons.' },
  { icon: 'team', label: 'Communautés partenaires', note: 'Les communautés où nous opérons.' },
  { icon: 'activity', label: 'Excellence opérationnelle', note: 'La valeur à long terme.' },
];

export default function About() {
  return <Frame><div className="industrial-about">
    <EditorialMasthead title="À propos de nous" variant="about" tagline="MINING. REDEFINED." signature="" icon="mine"/>
    <main className="industrial-about-content">
      <section className="industrial-about-intro">
        <div className="industrial-about-lead">
          <span className="industrial-eyebrow">PRÉSENTATION INSTITUTIONNELLE DE RÉFÉRENCE</span>
          <h2><span>IAMGOLD</span> est une entreprise minière moderne – fièrement canadienne avec une présence mondiale.</h2>
        </div>
        <figure className="industrial-mine-figure">
          <img src={`${import.meta.env.BASE_URL}iamgold-industrial-art/about-open-pit.webp`} alt="Vue de référence d’une mine à ciel ouvert, extraite de l’illustration fournie" />
          <figcaption><IndustrialIcon name="country" size={17}/> Canada · Présence mondiale</figcaption>
        </figure>
      </section>
      <article className="industrial-about-copy">
        <p>Nous sommes une entreprise minière différente. Une entreprise qui place les personnes, la finalité et la performance au cœur de tout ce que nous faisons. Nous exploitons avec une finalité, en plaçant la sécurité, la responsabilité et les personnes en premier. Nous nous tenons responsables les uns des autres, des communautés où nous opérons et de l’environnement que nous partageons tous. Avec un portefeuille en croissance au Canada et au-delà, nous nous concentrons sur l’excellence opérationnelle, la valeur à long terme et une culture basée sur la confiance, l’inclusion et la sécurité. Nous embrassons le changement et stimulons l’innovation à tous les niveaux, des systèmes plus intelligents aux meilleures pratiques de travail.</p>
        <div className="industrial-about-side-note"><IndustrialIcon name="bullionStack" size={56}/><span>Finalité<br/>Responsabilité<br/>Performance</span></div>
      </article>
      <section className="industrial-process-section" aria-labelledby="process-title">
        <div className="industrial-section-heading"><span>01 — CHAÎNE DE VALEUR</span><h2 id="process-title">Notre chaîne de valeur intégrée</h2></div>
        <p className="industrial-section-note">Frise illustrative du parcours industriel — elle ne décrit pas une activité opérée par cette plateforme.</p>
        <div className="industrial-process-rail">
          {process.map((item, index) => <div className={`industrial-process-step process-step-${index + 1}`} key={item.code}>
            <span className="industrial-process-code">{item.code}</span>
            <span className="industrial-process-icon"><IndustrialIcon name={item.icon} size={37}/></span>
            {index < process.length - 1 && <span className="industrial-process-link" aria-hidden="true"/>}
            <strong>{item.label}</strong>
          </div>)}
        </div>
      </section>
      <section className="industrial-presence-section" aria-labelledby="presence-title">
        <div className="industrial-section-heading"><span>02 — PRÉSENCE & PRIORITÉS</span><h2 id="presence-title">Ancrée au Canada,<br/>ouverte sur le monde.</h2></div>
        <div className="industrial-presence-grid">{presence.map(item => <article className="industrial-presence-tile" key={item.label}>
          <IndustrialIcon name={item.icon} size={31}/><h3>{item.label}</h3><p>{item.note}</p>
        </article>)}</div>
      </section>
      <section className="industrial-values-section" aria-labelledby="values-title">
        <div className="industrial-section-heading"><span>03 — CE QUI NOUS GUIDE</span><h2 id="values-title">Nos valeurs fondamentales</h2></div>
        <div className="industrial-values-rail">{values.map((item, index) => <article className="industrial-value" key={item.label}>
          <span className="industrial-value-index">0{index + 1}</span><IndustrialIcon name={item.icon} size={34}/><h3>{item.label}</h3><p>{item.note}</p>
        </article>)}</div>
        <p className="industrial-about-disclaimer">Présentation institutionnelle de référence. Cet espace membre n’est pas présenté comme le portail officiel d’une société cotée.</p>
      </section>
    </main>
  </div></Frame>;
}
