import { useEffect, useRef, useState } from 'react';
import { useSession } from '@/session';
import { IndustrialIcon, MissionMedal } from '@/components/industrial-icons';
import { RoyalMasthead, RoyalToolbar } from '@/iamgold-industrial-system/components/RoyalMasthead';
import { BottomNav, Frame, Support, copyLink, goBack, goTo } from './shared';
import { invitationLink, useMember } from './member-context';

const missionSchedule = [
  { count: 10, reward: 500 },
  { count: 20, reward: 1000 },
  { count: 50, reward: 3000 },
  { count: 100, reward: 7000 },
  { count: 200, reward: 15000 },
  { count: 500, reward: 35000 },
  { count: 1000, reward: 80000 },
  { count: 2000, reward: 180000 },
  { count: 5000, reward: 500000 },
];

function MissionRow({ count, reward, number }: { count: number; reward: number; number: number }) {
  return (
    <li className="iamgold-mission-row" data-testid={`mission-row-${String(number).padStart(2, '0')}`}>
      <div className="iamgold-mission-medal-wrap"><MissionMedal number={number} size={64}/></div>
      <article className="iamgold-mission-detail">
        <h3>Inviter à activer {count} personnes</h3>
        <div className="iamgold-mission-metrics">
          <div className="iamgold-mission-reward">
            <IndustrialIcon name="bullionStack" size={37}/>
            <span><b>FCFA {reward.toLocaleString('fr-FR')}.00</b><small>Récompense*</small></span>
          </div>
          <div className="iamgold-mission-stat"><b>{count.toLocaleString('fr-FR')}</b><small>Exigé</small></div>
          <div className="iamgold-mission-stat iamgold-mission-unknown"><b>—</b><small>Complété</small></div>
        </div>
      </article>
      <span className="iamgold-mission-add" aria-hidden="true"><IndustrialIcon name="groupAdd" size={43}/></span>
    </li>
  );
}

export default function Missions() {
  const { overview } = useMember();
  const { showNotice } = useSession();
  const link = invitationLink(overview.invitationCode);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

  const handleCopy = async () => {
    const success = await copyLink(link, showNotice);
    if (!success) return;
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 2200);
  };

  return (
    <Frame>
      <div className="royal-page iamgold-mission-page">
        <div className="ayala-scroll iamgold-mission-scroll">
          <RoyalMasthead/>
          <RoyalToolbar title="Récompense de mission" onBack={() => goBack()} action="help" actionLabel="Aide" onAction={() => goTo('Help')}/>

          <main className="iamgold-mission-main">
            <section className="iamgold-commission-panel" aria-labelledby="commission-title" data-testid="panel-commissions">
              <div className="iamgold-commission-copy">
                <h2 id="commission-title">Total des commissions obtenues</h2>
                <strong className="iamgold-commission-amount"><span>FCFA</span><b>—</b></strong>
                <small>Montant indisponible — aucune donnée de commission n’est fournie.</small>
              </div>
              <div className="iamgold-commission-art" aria-hidden="true">
                <img src={`${import.meta.env.BASE_URL}iamgold-industrial-art/reference-crops/royal-pedestal.webp`} alt=""/>
                <IndustrialIcon name="bullionStack" size={75}/>
                <IndustrialIcon name="gift" size={52}/>
                <IndustrialIcon name="coins" size={30}/>
              </div>
            </section>

            <section className="iamgold-referral-plaque" aria-label="Lien d’invitation">
              <span className="iamgold-referral-symbol"><IndustrialIcon name="share" size={39}/></span>
              <div className="iamgold-referral-copy">
                <b>Lien d’invitation</b>
                <span title={link} data-testid="text-invitation-link">{link}</span>
              </div>
              <button type="button" className={`iamgold-copy-button${copied ? ' is-copied' : ''}`} onClick={() => void handleCopy()} data-testid="button-copy-invitation">
                <IndustrialIcon name={copied ? 'check' : 'copy'} size={21}/><span>{copied ? 'Copié' : 'Copier'}</span>
              </button>
            </section>
            <p className="iamgold-copy-feedback" aria-live="polite">{copied ? 'Votre lien d’invitation a été copié.' : ''}</p>

            <section className="iamgold-mission-center" aria-labelledby="mission-center-title">
              <header className="iamgold-mission-heading">
                <span className="iamgold-mission-heading-icon"><IndustrialIcon name="target" size={37}/></span>
                <h2 id="mission-center-title">Centre de missions</h2>
                <span className="iamgold-heading-rivet" aria-hidden="true"/>
              </header>
              <p className="iamgold-mission-integrity-note">
                Récompense après validation selon un barème de référence non confirmé ; suivi des activations indisponible.
              </p>
              <ol className="iamgold-mission-list" aria-label="Six paliers principaux">
                {missionSchedule.slice(0, 6).map((mission, index) => (
                  <MissionRow key={mission.count} count={mission.count} reward={mission.reward} number={index + 1}/>
                ))}
              </ol>
              <details className="iamgold-extra-tiers">
                <summary><span>Autres paliers</span><small>3 paliers supplémentaires</small><IndustrialIcon name="chevron" size={20}/></summary>
                <ol className="iamgold-mission-list iamgold-secondary-list" start={7} aria-label="Paliers supplémentaires">
                  {missionSchedule.slice(6).map((mission, index) => (
                    <MissionRow key={mission.count} count={mission.count} reward={mission.reward} number={index + 7}/>
                  ))}
                </ol>
              </details>
              <p className="iamgold-mission-legal">Les seuils supplémentaires sont conservés à titre de référence locale.</p>
            </section>
          </main>
        </div>
        <Support/>
        <BottomNav active="Account"/>
      </div>
    </Frame>
  );
}
