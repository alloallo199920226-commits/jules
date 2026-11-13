import { Frame, BottomNav, Support, Icons, goTo } from './shared';
import { useMember } from './member-context';
import { useMemberWallet } from './use-member-wallet';
import { MemberGoldBadge } from '@/components/MemberGoldBadge';

export default function Account() {
  const { user } = useMember();
  const { data: wallet, isError } = useMemberWallet();
  const fmt = (amount: number) => `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`;
  const actions = [
    ['Recharger', 'bullionStack', 'Recharge'],
    ['Retirer', 'withdrawalHand', 'Withdraw'],
    ['Mes commandes', 'orders', 'Orders'],
    ['Mobile Money', 'mobileMoney', 'MobileMoney'],
  ] as const;
  return <Frame><div className="ayala-scroll member-account-scroll">
    <div className="account-industrial-hero" role="img" aria-label="Paysage minier IAMGOLD">
      <img src={`${import.meta.env.BASE_URL}iamgold-account-hero.webp`} alt="" />
    </div>
    <section className="account-identity-shell" aria-label="Profil et niveau de membre">
      <section className="ayala-profile-banner" aria-label="Profil du membre">
        <div className="ayala-profile-row">
          <button type="button" className="ayala-avatar member-avatar-link" aria-label="Modifier mon profil" onClick={() => goTo('Settings')} data-testid="button-account-profile">
            {user.avatarPath ? <img src={`/api/storage${user.avatarPath}`} alt=""/> : (user.nickname?.trim().charAt(0).toUpperCase() || 'I')}
          </button>
          <div className="member-profile-identity">
            <div className="ayala-member" title={user.nickname} data-testid="text-account-nickname">
              <span className="member-gold-name">{user.nickname}</span>
              {user.nickname?.trim() && <MemberGoldBadge size={26} />}
            </div>
            <div className="ayala-subline"><span data-testid="text-account-phone">{user.phone.slice(0,2)}***{user.phone.slice(-3)}</span><br/><span className="member-account-id" data-testid="text-account-id">ID {user.id}</span></div>
          </div>
          <button type="button" className="ayala-profile-icon" aria-label="Messages" onClick={() => goTo('Notice')} data-testid="button-account-notices"><Icons.MessageCircle size={22}/></button>
          <button type="button" className="ayala-profile-icon" aria-label="Paramètres" onClick={() => goTo('Settings')} data-testid="button-account-settings"><Icons.Settings size={22}/></button>
        </div>
        <div className="member-locked"><span className="account-status-mark" aria-hidden="true"/>Espace membre</div>
      </section>
      <button type="button" className="account-vip-card member-vip-link" onClick={() => goTo('Vip')} aria-label="Consulter les niveaux VIP" data-testid="button-account-vip">
        <span className="account-vip-art account-diamond-left" aria-hidden="true">
          <span className="account-crown"><Icons.Crown size={24}/></span>
          <Icons.Diamond size={61} className="account-diamond-art"/>
        </span>
        <span className="account-vip-copy">
          <span className="account-vip-kicker">ESPACE PRIVILÈGES</span>
          <span className="account-vip-title">Niveau VIP <b>indisponible</b></span>
          <span className="account-vip-caption">Les informations de niveau ne sont pas disponibles.</span>
          <span className="account-vip-track" role="img" aria-label="Progression VIP indisponible"><i/></span>
        </span>
        <span className="account-vip-art account-gift-right" aria-hidden="true"><Icons.Gift size={47} className="account-gift-art"/></span>
      </button>
    </section>
    <main className="member-account-main">
      <div className="ayala-card ayala-shortcuts" aria-label="Actions du compte">
        {actions.map(([label, icon, target]) => <button type="button" key={target} className="member-shortcut" onClick={() => goTo(target)} data-testid={`action-${target.toLowerCase()}`}>
          <span className={`account-action-plate account-action-${icon}`}><Icons.IndustrialIcon name={icon} size={43}/></span>
          <span className="ayala-shortcut-label">{label}</span>
        </button>)}
      </div>
      <section className="ayala-card member-income" aria-label="Mon revenu">
        <div className="account-income-heading"><strong>Mon revenu</strong><Icons.Bullion size={69} className="account-income-art" aria-hidden="true"/></div>
        <div className="member-income-links">
            <button type="button" onClick={() => goTo('BalanceHistory')} data-testid="button-recharge-balance">
             <span>Solde disponible</span><b aria-label={wallet ? fmt(wallet.balance) : 'Solde en chargement'} data-testid="text-recharge-balance">{wallet ? fmt(wallet.balance) : '—'}</b><small>{isError ? 'Actualisation indisponible' : 'Solde restant du portefeuille'}</small>
          </button>
          <button type="button" onClick={() => goTo('BalanceHistory')} data-testid="button-withdrawal-balance">
            <span>Revenus cumulés</span><b aria-label={wallet ? fmt(wallet.credits) : 'Revenus en chargement'} data-testid="text-withdrawal-balance">{wallet ? fmt(wallet.credits) : '—'}</b><small>Total reçu, non retirable en plus</small>
          </button>
        </div>
      </section>
      <div className="member-promo-grid">
        <button type="button" className="member-promo promo-0" onClick={() => goTo('Invitation')} data-testid="action-invitation">
          <b>Inviter des amis</b><small>Partagez votre lien d’invitation</small>
          <span className="account-promo-art account-team-art" aria-hidden="true"><Icons.IndustrialIcon name="team" size={53}/></span>
          <i className="account-promo-orbit" aria-hidden="true"/>
        </button>
        <button type="button" className="member-promo promo-1" onClick={() => goTo('Lottery')} data-testid="action-lottery">
          <b>Roue de la chance</b><small>Cadeaux divers</small>
          <span className="account-promo-art account-wheel-art" aria-hidden="true"><Icons.Wheel size={68}/></span>
          <i className="account-promo-orbit" aria-hidden="true"/>
        </button>
      </div>
      <section className="ayala-card member-services">
        <h2><span className="account-service-mark"><Icons.Refinery size={25}/></span>Service d’application</h2>
        <div className="member-service-links">
          <button type="button" onClick={() => goTo('BalanceHistory')} data-testid="link-account-balance-history"><span><Icons.Clock3 size={21}/>Historique du solde</span><Icons.ChevronRight size={17}/></button>
          <button type="button" onClick={() => goTo('Help')} data-testid="link-account-help"><span><Icons.Headset size={21}/>Centre d’aide</span><Icons.ChevronRight size={17}/></button>
          <button type="button" onClick={() => goTo('About')} data-testid="link-account-about"><span><Icons.Info size={21}/>À propos de nous</span><Icons.ChevronRight size={17}/></button>
        </div>
      </section>
    </main>
    <div className="account-support-row"><Support/></div>
  </div><BottomNav active="Account"/>
  </Frame>;
}
