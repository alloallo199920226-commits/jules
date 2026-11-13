import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { IndustrialIcon } from '@/components/industrial-icons';
import { useSession } from '@/session';
import { Frame } from './shared';
import { AccountMasthead, AccountSupport, AccountTitle, MetalPanel, MetalSubmit } from './AccountChrome';

const operators = ["MoMo Côte d’Ivoire", 'Moov', 'MTN', 'Orange'];

export default function MobileMoney() {
  const { showNotice } = useSession();
  const [operator, setOperator] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [holder, setHolder] = useState('');
  const [phone, setPhone] = useState('');
  const [usdtEnabled, setUsdtEnabled] = useState(false);
  const [usdtAddress, setUsdtAddress] = useState('');
  const [transactionPassword, setTransactionPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [feedback, setFeedback] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const error = !operator ? 'Veuillez sélectionner Mobile Money.'
      : !holder.trim() ? 'Veuillez saisir le nom du titulaire.'
      : !/^\+?[0-9 ]{6,20}$/.test(phone.trim()) ? 'Veuillez saisir un numéro Mobile Money valide.'
      : usdtEnabled && !usdtAddress.trim() ? 'Veuillez saisir une adresse USDT TRC-20.'
      : !transactionPassword ? 'Veuillez saisir le mot de passe de transaction.'
      : 'Service de liaison Mobile Money non connecté.';
    setFeedback(error);
    showNotice(error, 'error');
  };

  const handleKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && dropdownOpen) {
      setDropdownOpen(false);
      document.getElementById('mm-operator')?.focus();
    } else if (dropdownOpen && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const options = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="option"]'));
      const index = options.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1
        : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
      options[next]?.focus();
    }
  };

  return <Frame><main className="supreme-account supreme-mobile">
    <AccountMasthead page="money"/>
    <AccountTitle title="Ajouter un compte Mobile Money" icon="mobileMoney"/>
    <div className="supreme-scroll supreme-money-scroll">
      <MetalPanel className="supreme-money-panel">
        <div className="supreme-panel-kicker"><IndustrialIcon name="mobileMoney" size={19}/><span>COORDONNÉES DE COMPTE</span><i aria-hidden="true"/></div>
        <form className="supreme-money-form" onSubmit={submit} noValidate>
          <label className="supreme-label" htmlFor="mm-operator"><IndustrialIcon name="mobileMoney" size={20}/>Mobile Money</label>
          <div className="supreme-dropdown" onKeyDown={handleKeys} onBlur={event => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropdownOpen(false);
          }}>
            <button id="mm-operator" type="button" className={`supreme-input supreme-dropdown-trigger${dropdownOpen ? ' is-open' : ''}`}
              aria-haspopup="listbox" aria-expanded={dropdownOpen} onClick={() => setDropdownOpen(open => !open)}
              data-testid="button-mobile-money-operator">
              <span>{operator || 'Sélectionnez Mobile Money'}</span><IndustrialIcon name="chevron" size={20}/>
            </button>
            {dropdownOpen && <div className="supreme-dropdown-menu" role="listbox" aria-label="Opérateur Mobile Money">
              <button type="button" className="supreme-dropdown-option supreme-dropdown-placeholder" onClick={() => { setOperator(''); setDropdownOpen(false); document.getElementById('mm-operator')?.focus(); }}>Sélectionnez Mobile Money</button>
              {operators.map((item, index) => <button type="button" key={item} role="option" aria-selected={operator === item}
                className="supreme-dropdown-option" data-testid={`option-mobile-money-${index}`}
                onClick={() => { setOperator(item); setDropdownOpen(false); document.getElementById('mm-operator')?.focus(); }}>
                <span className="supreme-operator-index">0{index + 1}</span><span>{item}</span>
                {operator === item && <IndustrialIcon name="check" size={18}/>}
              </button>)}
            </div>}
          </div>

          <label className="supreme-label" htmlFor="mm-holder"><IndustrialIcon name="profile" size={20}/>Nom du titulaire</label>
          <div className="supreme-input-wrap"><IndustrialIcon name="profile" size={19}/><input id="mm-holder" className="supreme-input" autoComplete="name" placeholder="Nom du titulaire du compte" value={holder} onChange={event => setHolder(event.target.value)} data-testid="input-mobile-money-holder"/></div>

          <label className="supreme-label" htmlFor="mm-phone"><IndustrialIcon name="phone" size={20}/>Numéro de compte Mobile Money</label>
          <div className="supreme-input-wrap"><IndustrialIcon name="card" size={19}/><input id="mm-phone" className="supreme-input" inputMode="tel" autoComplete="tel" placeholder="Numéro de compte Mobile Money" value={phone} onChange={event => setPhone(event.target.value)} data-testid="input-mobile-money-phone"/></div>

          <label className="supreme-usdt-toggle">
            <input type="checkbox" checked={usdtEnabled} onChange={event => setUsdtEnabled(event.target.checked)} data-testid="checkbox-usdt"/>
            <span className="supreme-checkmark"><IndustrialIcon name="check" size={15}/></span>
            <IndustrialIcon name="coin" size={21}/>
            <span>USDT TRC-20</span><small>OPTIONNEL</small>
          </label>
          {usdtEnabled && <div className="supreme-input-wrap supreme-usdt-field"><IndustrialIcon name="coin" size={19}/><input className="supreme-input" aria-label="Adresse USDT TRC-20" placeholder="Adresse USDT TRC-20" value={usdtAddress} onChange={event => setUsdtAddress(event.target.value)} data-testid="input-usdt-address"/></div>}

          <label className="supreme-label" htmlFor="mm-password"><IndustrialIcon name="lock" size={20}/>Mot de passe de transaction</label>
          <div className="supreme-input-wrap supreme-password-wrap">
            <IndustrialIcon name="lock" size={19}/>
            <input id="mm-password" className="supreme-input" type={passwordVisible ? 'text' : 'password'} autoComplete="new-password" placeholder="Mot de passe de transaction" value={transactionPassword} onChange={event => setTransactionPassword(event.target.value)} data-testid="input-mobile-money-password"/>
            <button type="button" className="supreme-eye" onClick={() => setPasswordVisible(value => !value)} aria-label={passwordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={passwordVisible} data-testid="button-toggle-mm-password"><IndustrialIcon name={passwordVisible ? 'eyeOff' : 'eye'} size={20}/></button>
          </div>
          {feedback && <p className="supreme-inline-feedback" role="alert" data-testid="status-mobile-money">{feedback}</p>}
          <MetalSubmit testId="button-submit-mobile-money">Confirmer</MetalSubmit>
          <p className="supreme-unavailable-note"><IndustrialIcon name="info" size={15}/>Aucune liaison ne sera enregistrée : ce service n’est pas connecté.</p>
        </form>
      </MetalPanel>

      <MetalPanel className="supreme-explanation">
        <div className="supreme-section-heading"><span className="supreme-book-glyph"><IndustrialIcon name="orders" size={23}/></span><h2>Explication</h2><span className="supreme-heading-rule"/></div>
        <ol>
          <li><span className="supreme-number">01</span><p>Vous ne pouvez ajouter qu’un seul compte Mobile Money pour effectuer un retrait.</p></li>
          <li><span className="supreme-number">02</span><p>Le numéro de compte Mobile Money ne doit pas contenir de lettres ni de caractères spéciaux.</p></li>
          <li><span className="supreme-number">03</span><p>Le nom du compte Mobile Money doit être en anglais et ne doit pas comporter de caractères spéciaux.</p></li>
          <li><span className="supreme-number">04</span><p>Veuillez saisir les informations correctes relatives à votre compte, sinon le retrait ne pourra pas aboutir.</p></li>
        </ol>
        <div className="supreme-explanation-art" aria-hidden="true"><IndustrialIcon name="secure" size={60}/><img src={`${import.meta.env.BASE_URL}iamgold-industrial-art/banner-bullion.webp`} alt=""/></div>
      </MetalPanel>
      <AccountSupport/>
    </div>
  </main></Frame>;
}
