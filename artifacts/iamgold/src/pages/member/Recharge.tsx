import { useState, type FormEvent } from 'react';
import { Check, IndustrialIcon } from '@/components/industrial-icons';
import { useSession } from '@/session';
import { Frame, goTo } from './shared';
import { FinanceBalance, FinanceMasthead, FinancePanel, FinanceSubmitButton, FinanceSupport, FinanceToolbar } from './FinanceChrome';

const amounts = [2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000];
const channels = ['Burkina Faso', 'Cameroon', 'Senegal', "Côte d’Ivoire", 'Benin', 'UsdtPay'];
const flags = ['flag-burkina', 'flag-cameroon', 'flag-senegal', 'flag-civ', 'flag-benin', 'finance-usdt-mark'];

export default function Recharge() {
  const { showNotice } = useSession();
  const [amount, setAmount] = useState('2000');
  const [channel, setChannel] = useState(channels[0]);
  const [alert, setAlert] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const numeric = Number(amount);
    if (!amount || !Number.isFinite(numeric) || numeric < 2000) {
      const message = 'Veuillez saisir un montant valide (minimum FCFA 2 000).';
      setAlert(message);
      showNotice(message, 'error');
      return;
    }
    if (!channel) {
      const message = 'Veuillez sélectionner un canal local.';
      setAlert(message);
      showNotice(message, 'error');
      return;
    }
    const message = 'Service de recharge non connecté.';
    setAlert(message);
    showNotice(message, 'error');
  };
  return <Frame><div className="finance-industrial"><div className="finance-screen">
    <FinanceMasthead page="recharge"/>
    <FinanceToolbar title="Recharger" icon="deposit" historyTarget="BalanceDetails"/>
    <form id="recharge-form" className="finance-scroll finance-recharge-scroll" onSubmit={submit} noValidate>
      <FinanceBalance page="recharge"/>
      <FinancePanel title="Montant de la recharge" icon="bullion">
        <label className="finance-label" htmlFor="recharge-amount">Saisissez le montant</label>
        <div className="finance-metal-field">
          <input id="recharge-amount" className="finance-input" data-testid="input-recharge-amount" type="number" inputMode="numeric" min="2000" step="1" value={amount} onChange={event => { setAmount(event.target.value); setAlert(''); }} aria-describedby="recharge-currency"/>
          <span className="finance-currency" id="recharge-currency">FCFA</span>
        </div>
      </FinancePanel>
      <FinancePanel title="Montant rapide" icon="coins" className="finance-quick-panel">
        <div className="finance-amount-grid">{amounts.map(value => <button type="button" key={value} data-testid={`button-recharge-amount-${value}`}
          aria-pressed={Number(amount) === value} className={`finance-amount-chip ${Number(amount) === value ? 'selected' : ''}`}
          onClick={() => { setAmount(String(value)); setAlert(''); }}>
          <span>{value.toLocaleString('fr-FR')}</span><small>FCFA</small>{Number(amount) === value && <Check size={14}/>}
        </button>)}</div>
      </FinancePanel>
      <FinancePanel title="Canal de paiement" icon="mobileMoney">
        <div className="finance-channel-list" role="radiogroup" aria-label="Canal local de recharge">
          {channels.map((item, index) => <label className="finance-channel-row" key={item}>
            <input type="radio" name="recharge-channel" value={item} checked={channel === item} onChange={() => { setChannel(item); setAlert(''); }} data-testid={`radio-recharge-channel-${index}`}/>
            <span className="finance-radio-custom" aria-hidden="true"/>
            <span className="finance-channel-box">
              <span className={`finance-flag ${flags[index]}`} aria-hidden="true">{item === 'UsdtPay' ? 'USDT' : null}</span>
              <span>{item}</span><Check size={18}/>
            </span>
          </label>)}
        </div>
        <p className="finance-service-note"><strong>Options locales non connectées.</strong> Aucun prestataire de paiement n’est configuré pour ces canaux.</p>
      </FinancePanel>
      {alert && <div className="finance-inline-alert" role="alert" data-testid="alert-recharge">{alert}</div>}
      <FinanceSupport/>
    </form>
    <div className="finance-submit-bar"><FinanceSubmitButton formId="recharge-form" testId="button-recharge-submit">Recharger maintenant</FinanceSubmitButton></div>
  </div></div></Frame>;
}
