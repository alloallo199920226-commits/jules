import { useState, type FormEvent } from 'react';
import { ChevronDown, Check, IndustrialIcon } from '@/components/industrial-icons';
import { useSession } from '@/session';
import { Frame, Modal, goTo } from './shared';
import { FinanceBalance, FinanceMasthead, FinancePanel, FinanceSupport, FinanceToolbar } from './FinanceChrome';
import { useMemberWallet } from './use-member-wallet';

export default function Withdraw() {
  const { showNotice } = useSession();
  const { data: wallet, isError: walletError } = useMemberWallet();
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [payType, setPayType] = useState<'FCFA' | 'USDT'>('USDT');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [alert, setAlert] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = Number(amount);
    if (!amount || !Number.isFinite(value) || value < 2000 || value > 1000000) {
      const message = 'Veuillez entrer un montant entre FCFA 2 000 et FCFA 1 000 000.';
      setAlert(message);
      showNotice(message, 'error');
      return;
    }
    if (!wallet || walletError || value > wallet.balance) {
      const message = !wallet || walletError
        ? 'Le solde ne peut pas être vérifié. Veuillez réessayer.'
        : 'Le montant dépasse votre solde disponible. Les revenus cumulés ne constituent pas un solde supplémentaire.';
      setAlert(message);
      showNotice(message, 'error');
      return;
    }
    if (!password) {
      const message = 'Veuillez entrer le mot de passe de transaction.';
      setAlert(message);
      showNotice(message, 'error');
      return;
    }
    setAlert('');
    setInviteOpen(true);
  };
  return <Frame><div className="finance-industrial"><div className="finance-screen">
    <FinanceMasthead page="withdraw"/>
    <FinanceToolbar title="Retirer" icon="withdrawalHand" historyTarget="WithdrawalHistory"/>
    <div className="finance-scroll finance-withdraw-scroll">
      <FinanceBalance page="withdraw"/>
      <form onSubmit={submit} noValidate>
        <FinancePanel title="Montant du retrait" icon="bullion" className="finance-field-panel">
          <div className="finance-metal-field">
          <input className="finance-input" data-testid="input-withdraw-amount" aria-label="Montant du retrait" type="number" inputMode="numeric" min="2000" max="1000000" placeholder="2 000 – 1 000 000" value={amount}
              onChange={event => { setAmount(event.target.value); setAlert(''); }} aria-describedby="withdraw-currency"/>
            <span className="finance-currency" id="withdraw-currency">FCFA</span>
          </div>
        </FinancePanel>
        <FinancePanel title="Mot de passe de transaction" icon="secure" className="finance-field-panel">
          <div className="finance-metal-field finance-password-wrap">
            <input className="finance-input" data-testid="input-transaction-password" aria-label="Mot de passe de transaction" type={showPassword ? 'text' : 'password'} placeholder="Veuillez entrer le mot de passe" value={password}
              onChange={event => { setPassword(event.target.value); setAlert(''); }} autoComplete="new-password"/>
            <button className="finance-input-icon" type="button" aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              onClick={() => setShowPassword(value => !value)} data-testid="button-toggle-transaction-password">
              <IndustrialIcon name={showPassword ? 'eyeOff' : 'eye'} size={20}/>
            </button>
          </div>
        </FinancePanel>
        <FinancePanel title="Compte Mobile Money" icon="mobileMoney" className="finance-field-panel">
          <div className="finance-metal-field">
            <button className="finance-account-picker" type="button" onClick={() => setInviteOpen(true)} data-testid="button-select-mobile-money-account">
              <span>Sélectionnez un compte Mobile Money</span><ChevronDown size={19}/>
            </button>
          </div>
          <p className="finance-service-note">Aucun compte lié n’est disponible dans le profil.</p>
        </FinancePanel>
        <FinancePanel title="Type de paiement" icon="coins" className="finance-field-panel">
          <div className="finance-pay-options">
            {(['FCFA', 'USDT'] as const).map(type => <label className="finance-radio-line" key={type}>
              <input type="radio" name="pay-type" value={type} checked={payType === type} onChange={() => setPayType(type)} data-testid={`radio-withdraw-type-${type.toLowerCase()}`}/>
              <span className="finance-pay-option">
                {type === 'FCFA' ? <IndustrialIcon name="bullionStack" size={27}/> : <span className="finance-usdt-token" aria-hidden="true">₮</span>}
                <span>{type}</span>{payType === type && <Check className="finance-pay-check" size={18}/>}
              </span>
            </label>)}
          </div>
        </FinancePanel>
        {alert && <div className="finance-inline-alert" role="alert" data-testid="alert-withdraw">{alert}</div>}
        <div className="finance-submit-bar finance-withdraw-submit-bar">
          <button type="submit" className="finance-primary" data-testid="button-withdraw-submit">
            <IndustrialIcon className="finance-button-art" name="withdrawalHand" size={31}/><span>Soumettre le retrait</span><span className="finance-arrow-mark" aria-hidden="true">»</span>
          </button>
        </div>
      </form>
      <button className="finance-history-row" type="button" onClick={() => goTo('WithdrawalHistory')} data-testid="button-withdraw-history-inline">
        <span><IndustrialIcon name="clock" size={21}/>Historique de retrait</span><ChevronDown className="finance-chevron-right" size={19}/>
      </button>
      <FinancePanel title="Explication" icon="info" className="finance-explanation">
        <span className="finance-reference-label">Conditions affichées à titre de référence — non vérifiées et non appliquées par un service connecté.</span>
        <ol>
          <li data-index="01">Marketing quotidien de 08:00:00 à 18:00:00</li>
          <li data-index="02">Retirer un montant entre 2 000 et 1 000 000 FCFA</li>
          <li data-index="03">La présentation indique une demande de retrait par jour</li>
          <li data-index="04">Taux de retrait affiché : 5 pour cent</li>
        </ol>
      </FinancePanel>
      <FinanceSupport/>
    </div>
    {inviteOpen && <Modal className="finance-modal-scrim" label="Compte Mobile Money non lié" onClose={() => setInviteOpen(false)}>
      <div className="finance-invite-icon"><IndustrialIcon name="mobileMoney" size={34}/></div>
      <h2>Compte Mobile Money non lié</h2>
      <p>Aucun compte Mobile Money n’est encore lié. Le service de retrait n’est pas connecté ; aucune demande ni transaction ne sera envoyée.</p>
      <button className="ayala-soft-button" type="button" onClick={() => goTo('MobileMoney')} data-testid="button-link-mobile-money">Associez votre compte Mobile Money</button>
    </Modal>}
  </div></div></Frame>;
}
