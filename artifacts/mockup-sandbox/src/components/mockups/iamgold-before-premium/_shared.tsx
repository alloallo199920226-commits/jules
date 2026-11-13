import { type ReactNode } from 'react';
const navigate = (..._args: unknown[]) => {};
import { ArrowLeft, Headset, House, CircleDollarSign, MessageCircle, UserRound, Gift, HandCoins, ClipboardList, Users, Send, Settings, Clock3, Gem, Camera, Share2, LogOut } from 'lucide-react';
import './_group.css';

const routes: Record<string, string> = {
  Home: 'home', Account: 'dashboard', Investments: 'investments', Notice: 'notice',
  Invitation: 'invitation', Team: 'team', Team1: 'team/1', Team2: 'team/2', Team3: 'team/3',
  Forum: 'forum', Publish: 'publish', Missions: 'tasks', Lottery: 'lottery',
  Recharge: 'recharge', Withdraw: 'withdraw', MobileMoney: 'bankCardInfo',
  Orders: 'orders', WithdrawalHistory: 'withdrawalRecord', BalanceDetails: 'balanceDetails',
  Settings: 'info', LoginPassword: 'password', TransactionPassword: 'tradePassword',
  Help: 'help', About: 'about', Vip: 'vip', Announcement: 'announcement',
};
export const goTo = (name: string) => navigate(`${import.meta.env.BASE_URL}${routes[name] ?? 'home'}`, {
  state: { memberOrigin: window.location.pathname },
});
export function goBack(fallback = 'Account') {
  const previous = window.history.state?.memberOrigin;
  const allowed = [...Object.values(routes), 'my', 'account', 'missions', 'invest', 'announcement'];
  if (typeof previous === 'string' && allowed.some(path => previous === `${import.meta.env.BASE_URL}${path}`)) {
    window.history.back();
  } else goTo(fallback);
}
export function Frame({ children }: { children: ReactNode; preview?: boolean }) {
  return <div className="ayala-frame"><div className="ayala-canvas">{children}</div></div>;
}
export function Header({ title, help = false, onBack, onHelp }: { title: string; help?: boolean; onBack?: () => void; onHelp?: () => void }) {
  return <header className="ayala-header"><button className="ayala-head-btn" onClick={onBack ?? (() => goBack())} aria-label="Retour"><ArrowLeft size={22}/></button><span className="ayala-header-title">{title}</span>{help && <button className="ayala-head-help" onClick={onHelp ?? (() => goTo('Help'))} aria-label="Aide">?</button>}</header>;
}
export function BottomNav({ active, onHome }: { active: string; onHome?: () => void }) {
  const items = [['Accueil','Home',House],['Investir','Investments',HandCoins],['Avis','Invitation',Gift],['Forum','Forum',MessageCircle],['Compte','Account',UserRound]] as const;
  return <nav className="ayala-bottom" aria-label="Navigation principale">{items.map(([label,target,Icon]) => <button key={target} className={`ayala-nav-item ${active === target || (target === 'Invitation' && active === 'Notice') ? 'active' : ''}`} onClick={() => { goTo(target); if (target === 'Home') onHome?.(); }} data-testid={`nav-${target.toLowerCase()}`} aria-current={active === target || (target === 'Invitation' && active === 'Notice') ? 'page' : undefined}><span className="ayala-nav-icon">{target === 'Invitation' ? <span className="ayala-gift"><Gift size={28}/></span> : <Icon size={22}/>}</span><span>{label}</span></button>)}</nav>;
}
export function Support() {
  return <button className="ayala-support" aria-label="Assistance" onClick={() => goTo('Help')}><Headset size={29}/></button>;
}

export const Icons = { ArrowLeft, Headset, House, CircleDollarSign, MessageCircle, UserRound, Gift, HandCoins, ClipboardList, Users, Send, Settings, Clock3, Gem, Camera, Share2, LogOut };
