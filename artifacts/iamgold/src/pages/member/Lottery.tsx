import { useEffect, useRef, useState } from 'react';
import { IndustrialIcon } from '@/components/industrial-icons';
import { RoyalMasthead, RoyalToolbar } from '@/iamgold-industrial-system/components/RoyalMasthead';
import { useMember } from './member-context';
import { Frame, Support, goBack, goTo } from './shared';
import { LotteryWheel } from './LotteryWheel';
import './lottery.css';

type LotteryRecord = {
  id?: string | number;
  phone?: string;
  reward?: string;
  prize?: string;
  createdAt?: string;
};

type LotteryOverview = {
  lotteryChances?: number;
  lotteryRecords?: LotteryRecord[];
};

type LotteryProps = {
  overview?: LotteryOverview;
};

export default function Lottery({ overview }: LotteryProps) {
  const [activeTab, setActiveTab] = useState<'rewards' | 'records'>('rewards');
  const [drawMessage, setDrawMessage] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { overview: accountOverview } = useMember();
  const chances = Math.max(0, accountOverview.lotteryChances ?? 0);
  const records = overview?.lotteryRecords ?? [];
  const unavailableDraw = () => setDrawMessage(chances > 0
    ? 'Le service de tirage n’est pas connecté. Aucun tirage n’a été effectué.'
    : 'Aucun tirage disponible. Le service de tirage n’est pas connecté.');
  const previewWheel = () => {
    if (previewing) return;
    setDrawMessage('');
    setPreviewing(true);
    previewTimer.current = setTimeout(() => {
      setPreviewing(false);
      previewTimer.current = null;
    }, 2700);
  };

  useEffect(() => () => {
    if (previewTimer.current) clearTimeout(previewTimer.current);
  }, []);

  return (
    <Frame preview={false}>
      <div className="lottery-page royal-page royal-lottery">
        <RoyalMasthead />
        <RoyalToolbar title="Tirage au sort" onBack={() => goBack('Home')} action="help" actionLabel="Aide" onAction={() => goTo('Help')} />

        <main className="lottery-scroll">
          <section className="lottery-main-card" aria-label="Tirage au sort">
            <div className="lottery-stage">
              <img className="lottery-stage-art lottery-stage-gift" src={`${import.meta.env.BASE_URL}iamgold-industrial-art/reference-crops/royal-gift-ore.png`} alt="" />
              <img className="lottery-stage-art lottery-stage-ore" src={`${import.meta.env.BASE_URL}iamgold-industrial-art/reference-crops/royal-ore-cart.png`} alt="" />
              <img className="lottery-stage-pedestal" src={`${import.meta.env.BASE_URL}iamgold-industrial-art/reference-crops/royal-pedestal.webp`} alt="" />
              <LotteryWheel chances={chances} onUnavailable={unavailableDraw} previewing={previewing} />
            </div>
            <button
              className="lottery-preview-button"
              type="button"
              onClick={previewWheel}
              disabled={previewing}
              aria-label={previewing ? 'Aperçu de rotation en cours' : 'Lancer un aperçu décoratif de la rotation'}
              data-testid="button-lottery-preview"
            >
              <span aria-hidden="true" className="lottery-preview-mark">↻</span>
              {previewing ? 'Aperçu de l’animation…' : 'Aperçu de l’animation'}
              <small>Décoratif · aucun tirage</small>
            </button>
            <p className="lottery-reference-caption" data-testid="text-lottery-chances">Les lots ci-dessus sont ceux de la maquette, non configurés côté serveur. Chances disponibles : {chances}.</p>
            {drawMessage && <div className="lottery-unavailable" role="status" data-testid="status-lottery-unavailable"><IndustrialIcon name="info" size={19} />{drawMessage}</div>}

            <button
              type="button"
              className="lottery-invite"
              onClick={() => goTo('Invitation')}
              data-testid="button-lottery-invite"
            >
              <IndustrialIcon name="team" size={24} /> Inviter des amis <IndustrialIcon name="chevronRight" size={19} />
            </button>

            <div className="lottery-rules">
              <h2><IndustrialIcon name="gift" size={27} /> Obtenir le nombre de tirages gratuits</h2>
              <p><b>01</b><span>Inviter un ami validé à s’activer — condition de référence, à confirmer.</span></p>
              <p><b>02</b><span>Un achat éligible peut accorder une chance — règle non confirmée par le service.</span></p>
            </div>
          </section>

          <section className="lottery-records-card" aria-label="Historique du tirage">
            <div className="lottery-tabs" role="tablist" aria-label="Historique">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'rewards'}
                id="lottery-tab-rewards"
                aria-controls="lottery-panel"
                className={activeTab === 'rewards' ? 'selected' : ''}
                onClick={() => setActiveTab('rewards')}
                data-testid="tab-lottery-rewards"
              >
                Notification de récompense
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'records'}
                id="lottery-tab-records"
                aria-controls="lottery-panel"
                className={activeTab === 'records' ? 'selected' : ''}
                onClick={() => setActiveTab('records')}
                data-testid="tab-lottery-records"
              >
                Mes enregistrements
              </button>
            </div>
            <div className="lottery-records-content" role="tabpanel" id="lottery-panel" aria-labelledby={activeTab === 'rewards' ? 'lottery-tab-rewards' : 'lottery-tab-records'}>
              {activeTab === 'rewards' && records.length > 0 ? <div className="lottery-record-grid">
                {records.map((record, index) => <article className="lottery-record" key={record.id ?? index}>
                  <span className="lottery-record-coin"><IndustrialIcon name="coin" size={23} /></span>
                  <span>{record.phone || '—'}</span>
                  <strong>{record.reward || record.prize || ''}</strong>
                </article>)}
              </div> : <>
                <div className="lottery-empty-art" aria-hidden="true"><IndustrialIcon name="rewards" size={53} /></div>
                <div className="lottery-empty" data-testid="empty-lottery-records">
                  {activeTab === 'rewards' ? 'Aucune notification de récompense' : 'Aucun enregistrement de tirage'}
                </div>
              </>}
            </div>
          </section>
          <Support inline availabilityUnknown />
        </main>
      </div>
    </Frame>
  );
}
