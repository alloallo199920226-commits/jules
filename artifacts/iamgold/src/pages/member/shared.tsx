import { useEffect, useRef, type ReactNode } from 'react';
import { navigate } from 'wouter/use-browser-location';
import { useLocation } from 'wouter';
import { ArrowLeft, Headset, House, CircleDollarSign, MessageCircle, UserRound, Gift, HandCoins, ClipboardList, Users, Send, Settings, Clock3, Gem, Camera, Share2, LogOut, IndustrialIcon, Diamond, Crown, Bullion, Wheel, Refinery, Info, ChevronRight, Rewards, WithdrawalHand, MobileMoneyIcon } from '@/components/industrial-icons';
import { ActiveNavPlaque, IndustrialNavFrame } from '@/iamgold-industrial-system/components/IndustrialNavFrame';
import { useSupportAvailability } from '@/hooks/use-support-availability';
import '@/components/support-availability.css';
import './member.css';

const routes: Record<string, string> = {
  Home: 'home', Account: 'dashboard', Investments: 'investments', Notice: 'notice',
  Invitation: 'invitation', Team: 'team', Team1: 'team/1', Team2: 'team/2', Team3: 'team/3',
  Forum: 'forum', Publish: 'publish', Missions: 'tasks', Lottery: 'lottery',
  Recharge: 'recharge', Withdraw: 'withdraw', MobileMoney: 'bankCardInfo',
  Orders: 'orders', WithdrawalHistory: 'withdrawalRecord', BalanceDetails: 'balanceDetails', BalanceHistory: 'balanceHistory',
  Settings: 'info', LoginPassword: 'password', TransactionPassword: 'tradePassword',
   Help: 'help', Support: 'support', About: 'about', Vip: 'vip', Announcement: 'announcement',
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
  const [location] = useLocation();
  const normalizedPath = location.replace(/\/+$/, '') || '/';
  const routeActive: Record<string, string> = {
    '/home': 'Home', '/announcement': 'Home',
    '/investments': 'Investments', '/invest': 'Investments',
    '/notice': 'Notice', '/forum': 'Forum',
    '/dashboard': 'Account', '/account': 'Account', '/my': 'Account',
  };
  const currentActive = routeActive[normalizedPath] ?? active;
  const items = [['Accueil','Home',House],['Investir','Investments',HandCoins],['Avis','Notice',Gift],['Forum','Forum',MessageCircle],['Compte','Account',UserRound]] as const;
  return <nav className="ayala-bottom" aria-label="Navigation principale"><IndustrialNavFrame/>{items.map(([label,target,Icon]) => {
    const selected = currentActive === target;
    return <button key={target} className={`ayala-nav-item ${selected ? 'active' : ''}`} onClick={() => { goTo(target); if (target === 'Home') onHome?.(); }} data-testid={`nav-${target.toLowerCase()}`} aria-current={selected ? 'page' : undefined}>
      <ActiveNavPlaque active={selected}/>
      <span className="ayala-nav-icon">{target === 'Notice' ? <span className="ayala-gift"><Gift size={28}/></span> : <Icon size={22}/>}</span><span>{label}</span>
    </button>;
  })}</nav>;
}
export function Support({ inline = false }: { inline?: boolean; availabilityUnknown?: boolean }) {
  const availability = useSupportAvailability();
  const status = availability.known ? (availability.online ? 'En ligne' : 'Hors ligne') : 'Présence indisponible';
  return <button type="button" className={`ayala-support${inline ? ' ayala-support-inline' : ''}`} aria-label={`Assistance. ${status}.`} onClick={() => goTo('Help')} data-testid="button-support"><Headset size={inline ? 25 : 29}/>{inline && <><span>Assistance</span><i className="member-support-status" style={{ background: availability.online ? '#31d765' : '#87919b', boxShadow: availability.online ? '0 0 5px #31d76555' : 'none' }} role="img" aria-label={status} title={status}/></>}</button>;
}
export function Logo({ small = false }: { small?: boolean }) {
  return <img className="ayala-logo" style={small ? { width: 82 } : undefined} src={`${import.meta.env.BASE_URL}ayala-logo.png`} alt="IAMGOLD"/>;
}
export function HeaderLogo() { return <div className="member-brand"><Logo/></div>; }
export function Modal({ children, onClose, className = '', label = 'Information' }: { children: ReactNode; onClose: () => void; className?: string; label?: string }) {
  const dialog = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
      if (event.key !== 'Tab') return;
      const nodes = dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex]:not([tabindex="-1"])');
      if (!nodes?.length) { event.preventDefault(); dialog.current?.focus(); return; }
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); previous?.focus(); };
  }, []);
  return <div className={`ayala-modal-scrim ${className}`} onClick={event => { if (event.target === event.currentTarget) onCloseRef.current(); }}><div ref={dialog} tabIndex={-1} className="ayala-modal" role="dialog" aria-modal="true" aria-label={label} onClick={event => event.stopPropagation()}><button type="button" className="ayala-modal-close" onClick={() => onCloseRef.current()} aria-label="Fermer">×</button>{children}</div></div>;
}
export const Icons = { ArrowLeft, Headset, House, CircleDollarSign, MessageCircle, UserRound, Gift, HandCoins, ClipboardList, Users, Send, Settings, Clock3, Gem, Camera, Share2, LogOut, IndustrialIcon, Diamond, Crown, Bullion, Wheel, Refinery, Info, ChevronRight, Rewards, WithdrawalHand, MobileMoneyIcon };
export async function copyLink(link: string, showNotice: (message: string, kind?: 'success' | 'error') => void, successMessage = 'Lien copié') {
  try { await navigator.clipboard.writeText(link); showNotice(successMessage); return true; }
  catch { showNotice('La copie n’est pas autorisée dans ce navigateur.', 'error'); return false; }
}
