import { useEffect, useState, type FormEvent } from 'react';
import { BackButton, OtpInput, PasswordInput, Toast, generateDemoOtp, registrationRules, ReloadMark } from './_shared';
import './_auth.css';

export function TransactionPassword() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [issuedOtp, setIssuedOtp] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState('');
  useEffect(() => {
    if (deadline === null) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSeconds(left);
      if (!left) setDeadline(null);
    };
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [deadline]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);
  const sendCode = () => {
    if (seconds > 0) return;
    if (!phone.trim()) { setErrors((old) => ({ ...old, phone: 'Veuillez saisir votre numéro de mobile' })); return; }
    const demo = generateDemoOtp();
    const until = Date.now() + registrationRules.resendDelaySeconds * 1000;
    setIssuedOtp(demo); setOtp(demo); setDeadline(until); setSeconds(registrationRules.resendDelaySeconds);
    setErrors((old) => { const next = { ...old }; delete next.phone; delete next.otp; return next; });
    setToast(`Code démo ${demo} — aucun SMS envoyé`);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!phone.trim()) next.phone = 'Veuillez saisir votre numéro de mobile';
    if (password.length < 6) next.password = '6 caractères minimum';
    if (!issuedOtp) next.otp = 'Générez un code de démonstration (sans SMS)';
    else if (!deadline || Date.now() >= deadline) next.otp = 'Code expiré : demandez un nouveau code';
    else if (otp !== issuedOtp) next.otp = 'Code de vérification incorrect';
    setErrors(next);
    if (Object.keys(next).length) setToast('Vérifiez les champs — aperçu uniquement');
    else setToast('Aucune modification effectuée — aperçu uniquement');
  };
  return (
    <main className="aa-page aa-transaction">
      <header className="aa-tx-head">
        <BackButton onClick={() => window.location.assign('/__mockup/preview/ayala-auth/Login')} />
        <h1>Définir le mot de passe de transaction</h1>
      </header>
      <form className="aa-tx-form" onSubmit={submit} noValidate>
        <label className="aa-label" htmlFor="tx-phone">Numéro de mobile</label>
        <div className={`aa-field ${errors.phone ? 'has-error' : ''}`}><input id="tx-phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="Numéro de mobile" value={phone} onChange={(event) => { setPhone(event.target.value.replace(/\D/g, '')); setErrors((old) => { const next = { ...old }; delete next.phone; return next; }); }} /></div>
        {errors.phone && <div className="aa-error">{errors.phone}</div>}
        <label className="aa-label" htmlFor="tx-password">Mot de passe de transaction</label>
        <PasswordInput id="tx-password" value={password} onChange={(value) => { setPassword(value); setErrors((old) => { const next = { ...old }; delete next.password; return next; }); }} placeholder="Veuillez entrer un nouveau mot de passe" />
        {errors.password && <div className="aa-error">{errors.password}</div>}
        <label className="aa-label" htmlFor="tx-otp">Code de vérification (OTP)</label>
        <OtpInput id="tx-otp" value={otp} onChange={(value) => { setOtp(value); setErrors((old) => { const next = { ...old }; delete next.otp; return next; }); }} seconds={seconds} onSend={sendCode} error={errors.otp} testId="transaction-demo-otp" />
        {issuedOtp && seconds > 0 && <p className="aa-preview-note aa-tx-note">Code démo : {issuedOtp} — local uniquement, aucun SMS envoyé</p>}
        <button type="submit" className="aa-primary">Confirmer</button>
      </form>
      <button type="button" className="aa-support aa-tx-support" aria-label="Support indisponible en aperçu" onClick={() => setToast('Support non disponible — aperçu uniquement')}><span className="aa-headset"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 17v-2a11 11 0 0 1 22 0v7a4 4 0 0 1-4 4h-5v-4h5v-8a7 7 0 0 0-14 0v8h4v4h-4a4 4 0 0 1-4-4z" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 25c-1 3-4 4-8 4" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg></span></button>
      <button type="button" className="aa-tx-reload" aria-label="Actualiser (aperçu)" onClick={() => setToast('Actualisation disponible uniquement en aperçu')}><ReloadMark /></button>
      <Toast message={toast} />
    </main>
  );
}
export default TransactionPassword;
