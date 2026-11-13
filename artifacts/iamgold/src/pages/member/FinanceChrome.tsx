import type { ReactNode } from 'react';
import { IndustrialIcon, type IndustrialIconName } from '@/components/industrial-icons';
import { goBack, goTo } from './shared';
import { useMemberWallet } from './use-member-wallet';

export function FinanceMasthead({ page }: { page: 'recharge' | 'withdraw' }) {
  return <header className={`finance-masthead finance-masthead-${page}`}>
    <img className="finance-brand-panorama" src={`${import.meta.env.BASE_URL}iamgold-industrial-art/reference-crops/royal-panorama.webp`} alt="IAMGOLD, La plateforme AYALA — Fabrication & Raffinage d’Or"/>
  </header>;
}

export function FinanceToolbar({ title, icon, historyTarget }: {
  title: string;
  icon: IndustrialIconName;
  historyTarget: 'BalanceDetails' | 'WithdrawalHistory';
}) {
  return <header className="finance-toolbar">
    <button type="button" className="finance-tool-button" onClick={() => goBack()} aria-label="Retour" data-testid="button-finance-back">
      <IndustrialIcon name="arrowLeft" size={25}/>
    </button>
    <div className="finance-toolbar-title"><IndustrialIcon name={icon} size={30}/><span>{title}</span></div>
    <button type="button" className="finance-tool-button finance-tool-history" onClick={() => goTo(historyTarget)}
      aria-label={historyTarget === 'BalanceDetails' ? 'Historique des dépôts' : 'Historique de retrait'} data-testid="button-finance-history">
      <IndustrialIcon name={historyTarget === 'BalanceDetails' ? 'orders' : 'clock'} size={22}/>
      <span>Historique</span>
    </button>
  </header>;
}

export function FinanceBalance({ page }: { page: 'recharge' | 'withdraw' }) {
  const { data: wallet, isError, refetch } = useMemberWallet();
  return <section className="finance-balance" aria-label="Solde disponible du portefeuille" data-testid="status-finance-balance">
    <div className="finance-balance-copy">
      <span>{page === 'withdraw' ? 'Solde disponible pour le retrait' : 'Solde du compte'}</span>
      <strong data-testid="text-finance-balance">{wallet ? `FCFA ${new Intl.NumberFormat('fr-FR').format(wallet.balance)}` : 'FCFA —'}</strong>
      {isError && <button type="button" onClick={() => void refetch()}>Actualisation indisponible · Réessayer</button>}
    </div>
    <div className="finance-balance-art" aria-hidden="true">
      <img className="finance-balance-wallet" src={`${import.meta.env.BASE_URL}industrial-finance/${page}-wallet.webp`} alt="" />
      <img className="finance-balance-bullion" src={`${import.meta.env.BASE_URL}industrial-finance/${page}-bullion.webp`} alt="" />
    </div>
  </section>;
}

export function FinancePanel({ title, icon, children, className = '' }: {
  title: string;
  icon: IndustrialIconName;
  children: ReactNode;
  className?: string;
}) {
  return <section className={`finance-section ${className}`}>
    <h2 className="finance-section-heading"><IndustrialIcon name={icon} size={25}/><span>{title}</span></h2>
    {children}
  </section>;
}

export function FinanceSupport() {
  return <div className="finance-support">
    <div className="finance-support-prompt"><IndustrialIcon name="support" size={31}/><span>Besoin d’aide&nbsp;?</span></div>
    <button type="button" className="finance-support-button" onClick={() => goTo('Help')} data-testid="button-finance-support">
      <IndustrialIcon name="help" size={23}/><span>Assistance</span><i className="finance-status-unavailable" aria-label="Disponibilité non vérifiée"/>
    </button>
  </div>;
}

export function FinanceSubmitButton({ children, testId, formId }: { children: ReactNode; testId: string; formId?: string }) {
  return <button type="submit" className="finance-primary" data-testid={testId} form={formId}>
    <IndustrialIcon className="finance-button-art" name="bullionStack" size={31}/><span>{children}</span><span className="finance-arrow-mark" aria-hidden="true">»</span>
  </button>;
}
