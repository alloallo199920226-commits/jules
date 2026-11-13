import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, Eye, EyeOff, Headset, IndustrialIcon, RegisterIcon as SharedRegisterIcon, type RegisterIconName } from '@/components/industrial-icons';
import {
  issueInternalCode, loginAccount, registerAccount, setupTransactionPassword,
  logoutAccount, type InternalCodeInput, type TransactionPasswordInput,
} from '@workspace/api-client-react';
import { CountrySelect } from '@/components/country-select';
import './auth-geometry.css';
import './login.css';
import { dialingCountries, invitationFromSearch, isPhoneValid, registrationRules } from '@/lib/registration';
import { useSession } from '@/session';
import './registration.css';

function RegisterIcon({ name, size = 20 }: { name: RegisterIconName; size?: number }) {
  return <SharedRegisterIcon name={name} size={size}/>;
}

function apiMessage(error: unknown, fallback = 'Le serveur est indisponible. Veuillez réessayer.') {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = error.data;
    if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') return data.error;
    if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') return data.message;
  }
  if (error instanceof Error && error.message && error.message !== 'SESSION_UNAVAILABLE') return error.message;
  return fallback;
}

function logoutAndGo(setUser: (user: null) => void, setLocation: (path: string) => void, setError: (message: string) => void, busy: (value: boolean) => void) {
  busy(true);
  void logoutAccount({}).then(() => {
    setUser(null);
    setLocation('/login');
  }).catch((error: unknown) => {
    setError(apiMessage(error, 'La déconnexion a échoué. Veuillez réessayer.'));
  }).finally(() => busy(false));
}

export function RegisterPage() {
  const [, setLocation] = useLocation();
  const { user, status, setUser, showNotice } = useSession();
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [invitation, setInvitation] = useState(() => invitationFromSearch(window.location.search));
  const [otp, setOtp] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [deadline, setDeadline] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (deadline === null) return;
    const update = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(left);
      if (!left) setDeadline(null);
    };
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [deadline]);

  useEffect(() => {
    if (status !== 'ready' || !user) return;
    setLocation(user.transactionPasswordSet ? '/dashboard' : '/tradePassword');
  }, [status, user, setLocation]);

  const resetCode = () => {
    request.current?.abort();
    request.current = null;
    setSending(false);
    setSubmitting(false);
    setOtp('');
    setChallengeId('');
    setDeadline(null);
    setSecondsLeft(0);
    setErrors((old) => { const next = { ...old }; delete next.otp; return next; });
  };

  const sendCode = async () => {
    if (sending || submitting || secondsLeft > 0) return;
    if (!country || !isPhoneValid(country, phone)) {
      setErrors((old) => ({ ...old, ...(!country ? { country: 'Veuillez sélectionner votre pays' } : {}), phone: 'Veuillez saisir un numéro valide pour le pays sélectionné' }));
      showNotice(!country ? 'Veuillez sélectionner votre pays' : 'Veuillez saisir un numéro valide pour le pays sélectionné', 'error');
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setSending(true);
    setErrors((old) => { const next = { ...old }; delete next.otp; return next; });
    try {
      const result = await issueInternalCode({
        country: country as InternalCodeInput['country'], phone, purpose: 'registration',
      }, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setOtp(result.code);
      setChallengeId(result.challengeId);
      setDeadline(Date.now() + result.expiresIn * 1000);
      setSecondsLeft(result.expiresIn);
      showNotice('SMS envoyé');
    } catch (error) {
      if (!controller.signal.aborted) showNotice(apiMessage(error), 'error');
    } finally {
      if (!controller.signal.aborted) setSending(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting || sending) return;
    const next: Record<string, string> = {};
    if (!country) next.country = 'Veuillez sélectionner votre pays';
    if (!isPhoneValid(country, phone)) next.phone = 'Numéro invalide';
    if (!nickname.trim()) next.nickname = 'Surnom requis';
    if (nickname.trim().length > 60) next.nickname = '60 caractères maximum';
    if (password.length < registrationRules.minimumPasswordLength || password.length > 128) next.password = 'Le mot de passe doit contenir entre 6 et 128 caractères';
    if (!challengeId) next.otp = 'Cliquez sur ENVOYER pour obtenir un code interne';
    else if (!deadline || Date.now() >= deadline) next.otp = 'Code expiré : demandez un nouveau code';
    else if (!/^\d{6}$/.test(otp)) next.otp = 'Saisissez les six chiffres du code';
    setErrors(next);
    if (Object.keys(next).length) {
      showNotice(Object.values(next)[0], 'error');
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setSubmitting(true);
    try {
      const result = await registerAccount({
        country: country as InternalCodeInput['country'], phone, nickname: nickname.trim(), password,
        invitation: invitation.trim() || undefined, challengeId, code: otp, purpose: 'registration',
      }, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setUser(result.user);
      setLocation('/tradePassword');
    } catch (error) {
      if (!controller.signal.aborted) showNotice(apiMessage(error), 'error');
    } finally {
      if (!controller.signal.aborted) setSubmitting(false);
    }
  };

  return <div className="ig-page ig-register-page">
    <header className="ig-head ig-register-head" aria-label="IAMGOLD — La plateforme Ayala">
      <div className="ig-register-panorama" role="img" aria-label="Panorama industriel IAMGOLD" style={{ backgroundImage: `url("${import.meta.env.BASE_URL}iamgold-panorama.jpg")` }} />
    </header>
    <form className="ig-form ig-register-form" onSubmit={submit} noValidate>
      <div className="ig-register-headline"><span className="ig-register-emblem"><RegisterIcon name="profile" size={35}/></span><div><h1>Créer un <em>compte</em></h1><p>Rejoignez IAMGOLD et accédez à votre espace membre Ayala.</p></div></div>
      <label id="country-label" htmlFor="country" className="ig-reg-label"><RegisterIcon name="country"/>Pays</label>
      <CountrySelect displayCountry value={country} invalid={!!errors.country} onChange={(value) => {
        setCountry(value); setErrors((old) => { const next = { ...old }; delete next.country; delete next.phone; return next; }); resetCode();
      }} />
      <label htmlFor="phone" className="ig-reg-label"><RegisterIcon name="phone"/>Numéro de téléphone</label>
      <div className="ig-field ig-phone-field"><button type="button" className="ig-dial-code" aria-label="Choisir le pays et l’indicatif" data-testid="button-dial-code" onClick={() => {
        const selector = document.getElementById('country');
        selector?.focus();
        selector?.click();
      }}><span>{dialingCountries.find((entry) => entry.id === country)?.dialCode ?? 'Indic.'}</span><span className="ig-dial-chevron" aria-hidden="true">⌄</span></button><input id="phone" type="tel" autoComplete="tel-national" inputMode="numeric" placeholder="Numéro de téléphone" value={phone} onChange={(event) => {
        setPhone(event.target.value.replace(/\D/g, ''));
        setErrors((old) => { const next = { ...old }; delete next.phone; return next; });
        resetCode();
      }} data-testid="input-phone" /></div>
      <label htmlFor="nickname" className="ig-reg-label"><RegisterIcon name="person"/>Surnom</label>
      <div className="ig-field"><input id="nickname" autoComplete="nickname" placeholder="Surnom" value={nickname} onChange={(event) => setNickname(event.target.value)} data-testid="input-nickname" /></div>
      <label htmlFor="password" className="ig-reg-label"><RegisterIcon name="lock"/>Mot de passe</label>
      <div className="ig-field">
        <input id="password" type={showPassword ? 'text' : 'password'} placeholder="Mot de passe de connexion" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" data-testid="input-password" />
        <button type="button" className="ig-ic" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} data-testid="button-toggle-password"><RegisterIcon name={showPassword ? 'eye' : 'eye-off'} size={23}/></button>
      </div>
      <label htmlFor="invitation" className="ig-reg-label"><RegisterIcon name="invite"/>Code d'invitation</label>
      <div className="ig-field"><input id="invitation" maxLength={60} placeholder="Facultatif" aria-label="Code d’invitation (facultatif)" value={invitation} onChange={(event) => setInvitation(event.target.value)} data-testid="input-invite" /><span className="ig-ic"><RegisterIcon name="invite" size={21}/></span></div>
      <label htmlFor="otp" className="ig-reg-label"><RegisterIcon name="verify"/>Code de vérification (OTP)</label>
      <div className="ig-field"><input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} placeholder="Code à 6 chiffres" data-testid="input-otp" />
        {secondsLeft > 0 ? <span className="ig-otp" data-testid="otp-countdown">{secondsLeft}s</span> : <button type="button" className="ig-send" disabled={sending || submitting} onClick={sendCode} data-testid="button-send-otp"><span>{sending ? 'ENVOI…' : 'ENVOYER'}</span><RegisterIcon name="arrow" size={14}/></button>}
      </div>
      <button type="submit" className="ig-btn ig-pri ig-register-submit" disabled={submitting || sending} data-testid="button-register"><RegisterIcon name="join" size={26}/><span>{submitting ? 'Création du compte…' : "S'inscrire maintenant"}</span><RegisterIcon name="arrow" size={26}/></button>
      <button type="button" className="ig-btn ig-out" onClick={() => setLocation('/login')} data-testid="button-login"><RegisterIcon name="login" size={22}/><span>Se connecter maintenant</span></button>
      <div className="ig-register-trust" aria-label="Informations d’inscription"><div><RegisterIcon name="profile"/><span>Compte<br/>membre</span></div><i/><div><RegisterIcon name="swift"/><span>Étape<br/>suivante</span></div><i/><div><RegisterIcon name="help"/><span>Centre<br/>d’aide</span></div></div>
    </form>
    <button type="button" className="ig-fab ig-register-support" aria-label="Assistance" onClick={() => showNotice('Le support en ligne n’est pas disponible pour le moment.', 'error')} data-testid="button-support"><RegisterIcon name="support" size={25}/><span>Assistance</span></button>
  </div>;
}

export function LoginPage() {
  const [, setLocation] = useLocation();
  const { user, status, setUser, showNotice } = useSession();
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const recoveryClose = useRef<HTMLButtonElement>(null);
  const recoveryTrigger = useRef<HTMLButtonElement>(null);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (!recoveryOpen) return;
    recoveryClose.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setRecoveryOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      recoveryTrigger.current?.focus();
    };
  }, [recoveryOpen]);
  useEffect(() => {
    if (status === 'ready' && user) setLocation(user.transactionPasswordSet ? '/dashboard' : '/tradePassword');
  }, [status, user, setLocation]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const next: Record<string, string> = {};
    if (!country) next.country = 'Veuillez sélectionner votre pays';
    if (!isPhoneValid(country, phone)) next.phone = 'Numéro invalide';
    if (!password) next.password = 'Mot de passe requis';
    setErrors(next);
    if (Object.keys(next).length) {
      showNotice(Object.values(next)[0], 'error');
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    try {
      const result = await loginAccount({ country: country as InternalCodeInput['country'], phone, password }, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setUser(result.user);
      if (result.user.transactionPasswordSet) {
        setPassword('');
        showNotice('Connexion réussie.');
      }
      setLocation(result.user.transactionPasswordSet ? '/dashboard' : '/tradePassword');
    } catch (error) {
      if (!controller.signal.aborted) showNotice(apiMessage(error, 'Connexion impossible. Vérifiez vos informations.'), 'error');
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  };

  return <div className="ig-page ig-login-page" style={{ '--login-footer-image': `url("${import.meta.env.BASE_URL}iamgold-login-footer.jpg")` } as React.CSSProperties}>
    <header className="ig-login-hero" aria-label="IAMGOLD — La plateforme Ayala">
      <div className="ig-login-panorama" role="img" aria-label="Panorama minier IAMGOLD avec montagnes, lingots et camion industriel" style={{ backgroundImage: `url("${import.meta.env.BASE_URL}iamgold-login-header.jpg")` }}/>
      <span className="ig-login-orbit" aria-hidden="true"/>
    </header>
    <form className="ig-form ig-login-form" onSubmit={submit} noValidate>
      <div className="ig-login-heading">
        <span className="ig-login-emblem"><IndustrialIcon name="join" size={34}/></span>
        <div><h1>Se <em>connecter</em></h1><p>Accédez à votre compte IAMGOLD<br className="ig-login-small-break"/> en toute sécurité.</p></div>
      </div>
      <label id="country-label" className="ig-login-label" htmlFor="country"><IndustrialIcon name="country"/>Pays</label>
      <CountrySelect displayCountry value={country} invalid={!!errors.country} onChange={(value) => {
        request.current?.abort(); request.current = null; setBusy(false);
        setCountry(value); setErrors((old) => { const next = { ...old }; delete next.country; delete next.phone; return next; });
      }} />
      {errors.country && <p className="ig-login-error">{errors.country}</p>}
      <label className="ig-login-label" htmlFor="phone"><IndustrialIcon name="phone"/>Numéro de téléphone</label>
      <div className="ig-field ig-login-phone-field">
        <button type="button" className="ig-login-dial" aria-label="Choisir le pays et l’indicatif" data-testid="button-dial-code" onClick={() => {
          const selector = document.getElementById('country');
          selector?.focus();
          selector?.click();
        }}><span>{dialingCountries.find((entry) => entry.id === country)?.dialCode ?? 'Indic.'}</span><IndustrialIcon name="chevron" size={17}/></button>
        <input id="phone" type="tel" autoComplete="tel-national" inputMode="numeric" placeholder="Numéro de téléphone" value={phone} onChange={(event) => {
        request.current?.abort(); request.current = null; setBusy(false);
        setPhone(event.target.value.replace(/\D/g, ''));
        setErrors((old) => { const next = { ...old }; delete next.phone; return next; });
      }} data-testid="input-login-phone" />
      </div>
      {errors.phone && <p className="ig-login-error">{errors.phone}</p>}
      <label className="ig-login-label" htmlFor="login-password"><IndustrialIcon name="lock"/>Mot de passe</label>
      <div className="ig-field ig-login-password-field"><input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="Mot de passe de connexion" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" data-testid="input-login-password" />
        <button type="button" className="ig-ic ig-login-eye" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} data-testid="button-login-toggle-password"><IndustrialIcon name={showPassword ? 'eye' : 'eyeOff'} size={23}/></button></div>
      {errors.password && <p className="ig-login-error">{errors.password}</p>}
      <button ref={recoveryTrigger} type="button" className="ig-login-recovery" onClick={() => setRecoveryOpen(true)} data-testid="button-forgot-password">Mot de passe oublié&nbsp;?</button>
      <button type="submit" className="ig-btn ig-pri ig-login-submit" disabled={busy} data-testid="button-submit-login"><IndustrialIcon name="login" size={28}/><span>{busy ? 'Connexion…' : 'Se connecter'}</span></button>
      <div className="ig-login-divider"><span/>ou<span/></div>
      <Link className="ig-btn ig-out ig-login-register" href={`/${window.location.search}`} data-testid="link-create-account"><IndustrialIcon name="join" size={25}/><span>Créer un compte</span></Link>
      <div className="ig-login-trust" aria-label="Informations de connexion">
        <div><IndustrialIcon name="secure" size={31}/><span>Accès<br/>protégé</span></div><i/>
        <div><IndustrialIcon name="swift" size={31}/><span>Connexion<br/>directe</span></div><i/>
        <div><IndustrialIcon name="help" size={31}/><span>Centre<br/>d’aide</span></div>
      </div>
    </form>
    <button type="button" className="ig-fab ig-login-support" aria-label="Assistance" onClick={() => showNotice('Le support en ligne n’est pas disponible pour le moment.', 'error')} data-testid="button-support"><IndustrialIcon name="support" size={24}/><span>Assistance</span></button>
    {recoveryOpen && <div className="ig-recovery-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) setRecoveryOpen(false); }}>
      <section className="ig-recovery-dialog" role="dialog" aria-modal="true" aria-labelledby="ig-recovery-title" aria-describedby="ig-recovery-copy" onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        event.preventDefault();
        const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button')];
        const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
        buttons[(current + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus();
      }}>
        <button ref={recoveryClose} type="button" className="ig-recovery-close" onClick={() => setRecoveryOpen(false)} aria-label="Fermer" data-testid="button-close-recovery"><IndustrialIcon name="close" size={20}/></button>
        <span className="ig-recovery-mark"><IndustrialIcon name="lock" size={28}/></span>
        <h2 id="ig-recovery-title">Récupération du compte</h2>
        <p id="ig-recovery-copy">La réinitialisation automatique du mot de passe n’est pas disponible pour le moment. Aucun code ni changement de mot de passe ne sera effectué depuis cette page.</p>
        <p className="ig-recovery-note">Le service d’assistance en ligne est actuellement indisponible. Réessayez ultérieurement.</p>
        <button type="button" className="ig-recovery-confirm" onClick={() => setRecoveryOpen(false)} data-testid="button-dismiss-recovery">Compris</button>
      </section>
    </div>}
  </div>;
}

export function TransactionPasswordPage() {
  const [, setLocation] = useLocation();
  const { user, status, setUser, showNotice } = useSession();
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [otp, setOtp] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [deadline, setDeadline] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (deadline === null) return;
    const update = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(left);
      if (!left) setDeadline(null);
    };
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [deadline]);
  useEffect(() => {
    if (status !== 'ready') return;
    if (!user) setLocation('/login');
    else if (user.transactionPasswordSet) setLocation('/dashboard');
  }, [status, user, setLocation]);

  const sendCode = async () => {
    if (!user || sending || submitting || secondsLeft > 0) return;
    const controller = new AbortController();
    request.current = controller;
    setSending(true);
    try {
      const result = await issueInternalCode({
        country: user.country as InternalCodeInput['country'], phone: user.phone, purpose: 'transaction',
      }, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setChallengeId(result.challengeId);
      setOtp(result.code);
      setDeadline(Date.now() + result.expiresIn * 1000);
      setSecondsLeft(result.expiresIn);
      showNotice('SMS envoyé');
    } catch (error) {
      if (!controller.signal.aborted) showNotice(apiMessage(error), 'error');
    } finally {
      if (!controller.signal.aborted) setSending(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting || sending) return;
    const next: Record<string, string> = {};
    if (password.length < 6 || password.length > 128) next.password = 'Le mot de passe doit contenir entre 6 et 128 caractères';
    if (!challengeId) next.otp = 'Cliquez sur ENVOYER pour obtenir un nouveau code';
    else if (!deadline || Date.now() >= deadline) next.otp = 'Code expiré : demandez un nouveau code';
    else if (!/^\d{6}$/.test(otp)) next.otp = 'Saisissez les six chiffres du code';
    if (Object.keys(next).length) {
      showNotice(Object.values(next)[0], 'error');
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setSubmitting(true);
    try {
      const result = await setupTransactionPassword({
        password, challengeId, code: otp,
      } satisfies TransactionPasswordInput, { signal: controller.signal });
      if (controller.signal.aborted) return;
      showNotice('Mot de passe de transaction enregistré avec succès.');
      setUser(result.user);
      setLocation('/home');
    } catch (error) {
      if (!controller.signal.aborted) showNotice(apiMessage(error), 'error');
    } finally {
      if (!controller.signal.aborted) setSubmitting(false);
    }
  };

  const handleLogout = () => logoutAndGo(setUser, setLocation, (message) => showNotice(message, 'error'), setLogoutBusy);

  return <div className="ig-page">
    <div className="ig-topbar">
      <button className="ig-back" type="button" aria-label="Retour" onClick={() => setLocation('/register')} data-testid="button-back"><ArrowLeft size={22} /></button>
      <h1>Définir le mot de passe de<br /> transaction</h1>
    </div>
    <form className="ig-form ig-transaction-form" onSubmit={submit} noValidate>
      <label htmlFor="tx-phone">Numéro de mobile</label>
      <div className="ig-field"><input id="tx-phone" value={user?.phone ?? ''} readOnly disabled className="ig-readonly" data-testid="text-transaction-phone" /></div>
      <label htmlFor="tx-password">Mot de passe de transaction</label>
      <div className="ig-field"><input id="tx-password" type={visible ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Veuillez entrer un nouveau mot de passe" data-testid="input-transaction-password" />
        <button type="button" className="ig-ic" onClick={() => setVisible((value) => !value)} aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} data-testid="button-toggle-transaction-password">{visible ? <Eye size={24} /> : <EyeOff size={24} />}</button></div>
      <label htmlFor="tx-otp">Code de vérification (OTP)</label>
      <div className="ig-field"><input id="tx-otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} placeholder="Code de vérification" data-testid="input-transaction-otp" />
        {secondsLeft > 0 ? <span className="ig-otp" data-testid="transaction-otp-countdown">{secondsLeft}s</span> : <button type="button" className="ig-send" disabled={sending || submitting} onClick={sendCode} data-testid="button-send-transaction-otp">{sending ? 'ENVOI…' : 'ENVOYER'}</button>}
      </div>
      <button type="submit" className="ig-btn ig-pri" disabled={submitting || sending} data-testid="button-confirm-transaction">{submitting ? 'Enregistrement…' : 'Confirmer'}</button>
      <button type="button" className="ig-route-link" disabled={logoutBusy} onClick={handleLogout} data-testid="button-logout-transaction">{logoutBusy ? 'Déconnexion…' : 'Se déconnecter'}</button>
    </form>
    <button type="button" className="ig-transaction-support" aria-label="Support" onClick={() => showNotice('Support indisponible.', 'error')} data-testid="button-support"><Headset size={44} /></button>
  </div>;
}
