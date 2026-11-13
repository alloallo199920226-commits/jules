import './_group-premium.css';
import { Frame, BottomNav, Support, Icons, goTo } from './_shared-premium';
import { useMember } from './_member-context';

export default function Account() {
  const { user } = useMember();
  const actions = [['Recharger', Icons.Gem, '#6159c9', 'Recharge'], ['Retirer', Icons.HandCoins, '#e84f9d', 'Withdraw'], ['Mes commandes', Icons.ClipboardList, '#1db3d0', 'Orders'], ['Mobile Money', Icons.CircleDollarSign, '#32d18d', 'MobileMoney']] as const;
  return <Frame><div className="ayala-scroll">
    <section className="ayala-profile-banner">
      <div className="ayala-profile-row"><button type="button" className="ayala-avatar member-avatar-link" aria-label="Modifier mon profil" onClick={() => goTo('Settings')}>{user.avatarPath ? <img src={`/api/storage${user.avatarPath}`} alt=""/> : 'I'}</button><div className="member-profile-identity"><div className="ayala-member" data-testid="text-account-nickname">{user.nickname}</div><div className="ayala-subline">{user.phone.slice(0,2)}***{user.phone.slice(-3)}<br/><span className="member-account-id">ID {user.id}</span></div></div>
        <button className="ayala-profile-icon" aria-label="Messages" onClick={() => goTo('Notice')}><Icons.MessageCircle size={22}/></button><button className="ayala-profile-icon" aria-label="Paramètres" data-testid="button-account-settings" onClick={() => goTo('Settings')}><Icons.Settings size={22}/></button>
      </div><div className="member-locked">Non déverrouillé</div>
      <button type="button" className="ayala-diamond member-vip-link" onClick={() => goTo('Vip')} aria-label="Consulter les niveaux VIP"><div className="member-row"><div className="ayala-diamond-title"><Icons.Gem size={22}/> Membre Diamant</div><Icons.Gift size={34} color="#e4c4ff"/></div><div className="member-vip-description">Mise à niveau VIP1 manque encore —</div><div className="ayala-progress"/></button>
    </section>
    <main className="member-account-main">
      <div className="ayala-card ayala-shortcuts">{actions.map(([label,Icon,color,target]) => <button key={label} className="member-shortcut" onClick={() => goTo(target)} data-testid={`action-${target.toLowerCase()}`}><span className="ayala-shortcut-icon" style={{background: color}}><Icon size={24}/></span><span className="ayala-shortcut-label">{label}</span></button>)}</div>
      <section className="ayala-card member-income"><strong>Mon revenu</strong><div className="member-income-links"><button type="button" onClick={() => goTo('BalanceDetails')}><span>Solde de recharge</span><b aria-label="Solde indisponible">—</b></button><button type="button" onClick={() => goTo('WithdrawalHistory')}><span>Solde de retrait</span><b aria-label="Solde indisponible">—</b></button></div></section>
      <div className="member-promo-grid">{[['Inviter des amis','Invitez des amis pour gagner une commission','Invitation'],['Roue de la chance','Cadeaux divers','Lottery']].map(([title,description,target],index) => <button key={target} className={`member-promo promo-${index}`} onClick={() => goTo(target)}><b>{title}</b><small>{description}</small><span>{index ? <Icons.Gift size={27}/> : <Icons.Users size={27}/>}</span></button>)}</div>
      <section className="ayala-card member-services"><h2>Service d’application</h2><div className="member-service-links"><button onClick={() => goTo('Help')}>Centre d’aide</button><button onClick={() => goTo('About')}>À propos de nous</button></div></section>
    </main>
  </div><Support/><BottomNav active="Account"/>
  </Frame>;
}
