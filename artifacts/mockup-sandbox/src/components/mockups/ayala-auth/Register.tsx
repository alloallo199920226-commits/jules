import { useEffect, useState, type FormEvent } from 'react';
import { LinkMark, BrandHeader, CountryPicker, DemoNotice, OtpInput, PasswordInput, SupportButton, Toast, generateDemoOtp, invitationFromSearch, isPhoneValid, registrationRules } from './_shared';
import './_auth.css';

export function Register() {
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [invite, setInvite] = useState(() => invitationFromSearch(window.location.search));
  const [otp, setOtp] = useState('');
  const [issuedOtp, setIssuedOtp] = useState('');
  const [deadline, setDeadline] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
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
  const resetOtp = () => { setOtp(''); setIssuedOtp(''); setDeadline(null); setSeconds(0); };
  const generateOtp = () => {
    if (seconds > 0) return;
    if (!country || !isPhoneValid(country, phone)) {
      setErrors((previous) => ({ ...previous, ...(!country ? { country: 'Veuillez sélectionner votre pays' } : {}), phone: 'Veuillez saisir un numéro valide pour le pays sélectionné' }));
      return;
    }
    const demo = generateDemoOtp();
    setIssuedOtp(demo);
    setOtp(demo);
    setErrors((previous) => { const next = { ...previous }; delete next.country; delete next.phone; delete next.otp; return next; });
    const until = Date.now() + registrationRules.resendDelaySeconds * 1000;
    setDeadline(until);
    setSeconds(registrationRules.resendDelaySeconds);
    setToast('Code démo généré — aucun SMS envoyé');
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!country) next.country = 'Veuillez sélectionner votre pays';
    if (!isPhoneValid(country, phone)) next.phone = 'Numéro invalide';
    if (!nickname.trim()) next.nickname = 'Surnom requis';
    if (password.length < registrationRules.minimumPasswordLength) next.password = `${registrationRules.minimumPasswordLength} caractères minimum`;
    if (!invite.trim()) next.invite = "Code d'invitation requis";
    if (!issuedOtp) next.otp = 'Générez un code de démonstration (sans SMS)';
    else if (!deadline || Date.now() >= deadline) next.otp = 'Code expiré : demandez un nouveau code';
    else if (otp !== issuedOtp) next.otp = 'Code de vérification incorrect';
    setErrors(next);
    setNotice('');
    if (!Object.keys(next).length) {
      setNotice("Aperçu uniquement : aucun compte n’a été créé et aucune donnée n’a été envoyée.");
      setToast('Aucune inscription effectuée — aperçu uniquement');
    } else setToast('Vérifiez les champs — aperçu uniquement');
  };
  const setField = (field: string, message: string) => setErrors((previous) => {
    const next = { ...previous }; if (message) next[field] = message; else delete next[field]; return next;
  });
  return (
    <main className="aa-page aa-register">
      <BrandHeader />
      <form className="aa-form" onSubmit={submit} noValidate>
        <label className="aa-label first" htmlFor="register-country">Pays</label>
        <CountryPicker id="register-country" value={country} onChange={(id) => { setCountry(id); resetOtp(); setField('country', ''); setField('phone', ''); }} error={errors.country} />
        <label className="aa-label" htmlFor="register-phone">Numéro de téléphone</label>
        <div className={`aa-field ${errors.phone ? 'has-error' : ''}`}><input id="register-phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="Numéro de téléphone" value={phone} onChange={(event) => { setPhone(event.target.value.replace(/\D/g, '')); resetOtp(); setField('phone', ''); }} /></div>
        {errors.phone && <div className="aa-error">{errors.phone}</div>}
        <label className="aa-label" htmlFor="register-nickname">Surnom</label>
        <div className={`aa-field ${errors.nickname ? 'has-error' : ''}`}><input id="register-nickname" autoComplete="nickname" placeholder="Surnom" value={nickname} onChange={(event) => { setNickname(event.target.value); setField('nickname', ''); }} /></div>
        {errors.nickname && <div className="aa-error">{errors.nickname}</div>}
        <label className="aa-label" htmlFor="register-password">Mot de passe</label>
        <PasswordInput id="register-password" value={password} onChange={(value) => { setPassword(value); setField('password', ''); }} placeholder="Mot de passe de connexion" />
        {errors.password && <div className="aa-error">{errors.password}</div>}
        <label className="aa-label" htmlFor="register-invite">Code d'invitation</label>
        <div className={`aa-field ${errors.invite ? 'has-error' : ''}`}>
          <input id="register-invite" placeholder="Votre code d’invitation" value={invite} onChange={(event) => { setInvite(event.target.value); setField('invite', ''); }} />
          <span className="aa-icon-button" aria-hidden="true"><LinkMark /></span>
        </div>
        {errors.invite && <div className="aa-error">{errors.invite}</div>}
        <label className="aa-label" htmlFor="register-otp">Code de vérification (OTP)</label>
        <OtpInput id="register-otp" value={otp} onChange={(value) => { setOtp(value); setField('otp', ''); }} seconds={seconds} onSend={generateOtp} error={errors.otp} testId="register-demo-otp" />
        {issuedOtp && seconds > 0 && <DemoNotice>Code de démonstration : {issuedOtp} — local uniquement, aucun SMS</DemoNotice>}
        <button type="submit" className="aa-primary">S'inscrire</button>
        <button type="button" className="aa-secondary" onClick={() => window.location.assign('/__mockup/preview/ayala-auth/Login')}>Se connecter maintenant</button>
        {notice && <p className="aa-preview-note">{notice}</p>}
      </form>
      <SupportButton onClick={() => setToast('Support non disponible — aperçu uniquement')} />
      <Toast message={toast} />
    </main>
  );
}
export default Register;
