import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { IndustrialIcon } from '@/components/industrial-icons';
import { changeLoginPassword, changeTransactionPassword, issueInternalCode, type InternalCodeInput } from '@workspace/api-client-react';
import { useSession } from '@/session';
import { AccountMasthead, AccountTitle, AccountSupport, MetalPanel, MetalSubmit } from './AccountChrome';
import { Frame, goBack } from './shared';
import { useMember } from './member-context';

type Kind = 'login' | 'transaction';
const art = `${import.meta.env.BASE_URL}iamgold-industrial-art/`;

export default function PasswordSettings({ kind = 'login' }: { kind?: Kind }) {
  const { user } = useMember();
  const { setUser, showNotice } = useSession();
  const controllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);
  const successTimerRef = useRef<number | null>(null);
  const deadlineRef = useRef(0);
  const cooldownDeadlineRef = useRef(0);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [code, setCode] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [codeSeconds, setCodeSeconds] = useState(0);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [requestingCode, setRequestingCode] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);
  const transaction = kind === 'transaction';

  useLayoutEffect(() => {
    controllerRef.current?.abort();
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    if (successTimerRef.current !== null) window.clearTimeout(successTimerRef.current);
    controllerRef.current = null;
    timerRef.current = null;
    successTimerRef.current = null;
    setOldPassword('');
    setNewPassword('');
    setCode('');
    setChallengeId('');
    setSeconds(0);
    setCodeSeconds(0);
    setBusy(false);
    setRequestingCode(false);
    setShowOld(false);
    setShowNew(false);
    setFeedback(null);
    deadlineRef.current = 0;
    cooldownDeadlineRef.current = 0;
  }, [kind]);

  useEffect(() => () => {
    controllerRef.current?.abort();
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    if (successTimerRef.current !== null) window.clearTimeout(successTimerRef.current);
  }, []);

  const sendCode = async () => {
    if (busy || requestingCode || seconds > 0) return;
    setFeedback(null);
    const controller = new AbortController();
    controllerRef.current = controller;
    setRequestingCode(true);
    try {
      const issued = await issueInternalCode({
        country: user.country as InternalCodeInput['country'],
        phone: user.phone,
        purpose: 'transaction-change',
      }, { signal: controller.signal });
      if (controller.signal.aborted) return;
      deadlineRef.current = issued.expiresAt;
      cooldownDeadlineRef.current = Date.now() + 60_000;
      setChallengeId(issued.challengeId);
      setCode(issued.code);
      setCodeSeconds(Math.max(0, Math.ceil((issued.expiresAt - Date.now()) / 1000)));
      setSeconds(60);
      setFeedback({ message: 'Code de vérification reçu et renseigné. Vérifiez son délai de validité avant de confirmer.', type: 'success' });
      showNotice('SMS envoyé');
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        const cooldown = Math.max(0, Math.ceil((cooldownDeadlineRef.current - Date.now()) / 1000));
        const validFor = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
        setSeconds(cooldown);
        setCodeSeconds(validFor);
        if (cooldown === 0 && validFor === 0 && timerRef.current !== null) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }, 1000);
    } catch (error) {
      if (!controller.signal.aborted) {
        const message = (error as { data?: { error?: string } })?.data?.error ?? 'Impossible d’envoyer le code.';
        setFeedback({ message, type: 'error' });
        showNotice(message, 'error');
      }
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
      if (!controller.signal.aborted) setRequestingCode(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || requestingCode) return;
    if (oldPassword.length < 6 || oldPassword.length > 128 || newPassword.length < 6 || newPassword.length > 128) {
      const message = 'Les mots de passe doivent contenir entre 6 et 128 caractères.';
      setFeedback({ message, type: 'error' }); showNotice(message, 'error'); return;
    }
    if (transaction && (!challengeId || !/^\d{6}$/.test(code))) {
      const message = 'Veuillez entrer le code de vérification à 6 chiffres.';
      setFeedback({ message, type: 'error' }); showNotice(message, 'error'); return;
    }
    if (transaction && Date.now() >= deadlineRef.current) {
      const message = 'Le code a expiré. Demandez un nouveau code.';
      setFeedback({ message, type: 'error' }); showNotice(message, 'error'); return;
    }
    setFeedback(null);
    const controller = new AbortController();
    controllerRef.current = controller;
    setBusy(true);
    try {
      const result = transaction
        ? await changeTransactionPassword({ oldPassword, newPassword, challengeId, code }, { signal: controller.signal })
        : await changeLoginPassword({ oldPassword, newPassword }, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setUser(result.user);
      setOldPassword('');
      setNewPassword('');
      setCode('');
      setChallengeId('');
      setFeedback({ message: 'Mot de passe modifié.', type: 'success' });
      showNotice('Mot de passe modifié');
      successTimerRef.current = window.setTimeout(() => {
        successTimerRef.current = null;
        goBack('Settings');
      }, 700);
    } catch (error) {
      if (!controller.signal.aborted) {
        const message = (error as { data?: { error?: string } })?.data?.error ?? 'Impossible de modifier le mot de passe.';
        setFeedback({ message, type: 'error' });
        showNotice(message, 'error');
      }
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
      if (!controller.signal.aborted) setBusy(false);
    }
  };

  const title = transaction ? 'Modifier le mot de passe de transaction' : 'Réinitialiser le mot de passe de connexion';
  return <Frame><div className="security-publish-supreme security-page">
    <AccountMasthead page="profile"/>
    <AccountTitle title={title} icon={transaction ? 'key' : 'secure'}/>
    <main className="security-publish-scroll" data-testid="security-password-scroll">
      <MetalPanel className="security-form-panel">
        <div className="security-credential-art" aria-hidden="true">
          <img src={`${art}security-credentials-emblem.webp`} alt=""/>
          <span>{transaction ? 'ACCÈS TRANSACTIONNEL' : 'PROTECTION DU COMPTE'}</span>
        </div>
        <form className="security-password-form" noValidate onSubmit={submit}>
          <label className="security-field">
            <span className="security-field-label"><IndustrialIcon name="phone" size={20}/>Numéro de mobile</span>
            <span className="security-input-shell security-phone-shell"><input className="security-input" value={user.phone} readOnly aria-label="Numéro de mobile associé au compte" data-testid="input-password-phone"/></span>
          </label>
          <label className="security-field">
            <span className="security-field-label"><IndustrialIcon name="lock" size={20}/>{transaction ? 'Ancien mot de passe de transaction' : 'Ancien mot de passe'}</span>
            <span className="security-input-shell">
              <input className="security-input" type={showOld ? 'text' : 'password'} autoComplete="current-password" value={oldPassword} onChange={event => setOldPassword(event.target.value)} disabled={busy || requestingCode} maxLength={128} placeholder="Ancien mot de passe" data-testid="input-old-password"/>
              <button type="button" className="security-eye" onClick={() => setShowOld(value => !value)} aria-label={showOld ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} data-testid="button-toggle-old-password"><IndustrialIcon name={showOld ? 'eyeOff' : 'eye'} size={22}/></button>
            </span>
          </label>
          <label className="security-field">
            <span className="security-field-label"><IndustrialIcon name={transaction ? 'key' : 'secure'} size={20}/>{transaction ? 'Nouveau mot de passe de transaction' : 'Nouveau mot de passe'}</span>
            <span className="security-input-shell">
              <input className="security-input" type={showNew ? 'text' : 'password'} autoComplete="new-password" value={newPassword} onChange={event => setNewPassword(event.target.value)} disabled={busy || requestingCode} maxLength={128} placeholder="Nouveau mot de passe" data-testid="input-new-password"/>
              <button type="button" className="security-eye" onClick={() => setShowNew(value => !value)} aria-label={showNew ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} data-testid="button-toggle-new-password"><IndustrialIcon name={showNew ? 'eyeOff' : 'eye'} size={22}/></button>
            </span>
            <small className="security-field-hint">Entre 6 et 128 caractères. Choisissez un mot de passe différent de l’ancien.</small>
          </label>
          {transaction && <label className="security-field">
            <span className="security-field-label"><IndustrialIcon name="verify" size={20}/>Code de vérification (OTP)</span>
            <span className="security-code-row">
              <input className="security-input security-otp-input" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} disabled={busy || requestingCode} maxLength={6} placeholder="6 chiffres" data-testid="input-transaction-code"/>
              <button type="button" className="security-send-code" onClick={sendCode} disabled={busy || requestingCode || seconds > 0} data-testid="button-send-code">
                <IndustrialIcon name="verify" size={19}/>{requestingCode ? 'Envoi…' : seconds > 0 ? `Renvoyer ${seconds}s` : 'Envoyer'}
              </button>
            </span>
            {(challengeId || seconds > 0) && <small className={`security-code-status${codeSeconds === 0 ? ' is-expired' : ''}`} role="status" data-testid="status-transaction-code">{codeSeconds > 0 ? `Code valide encore ${codeSeconds}s · renvoi disponible dans ${seconds}s` : 'Code expiré. Demandez un nouveau code.'}</small>}
          </label>}
          {feedback && <p className={`security-feedback is-${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'} data-testid="status-password-feedback">{feedback.message}</p>}
          <MetalSubmit testId="button-confirm-password" disabled={busy || requestingCode}>{busy ? 'Enregistrement…' : 'Confirmer'}</MetalSubmit>
        </form>
      </MetalPanel>
      <section className="security-vault-scene" aria-label="Protection numérique des identifiants">
        <img src={`${art}security-vault-plinth.webp`} alt="Coffre numérique et lingots sur une plateforme métallique"/>
        <span>IDENTIFIANTS PRIVÉS · PROTECTION DU COMPTE</span>
      </section>
    </main>
    <AccountSupport/>
  </div></Frame>;
}
