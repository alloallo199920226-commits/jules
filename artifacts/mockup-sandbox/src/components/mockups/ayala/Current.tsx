import { useEffect, useState, type FormEvent } from 'react';
import { Eye, EyeOff, Link2, Repeat2 } from 'lucide-react';
import './_current.css';
import { dialingCountries, generateDemoOtp, invitationFromSearch, isPhoneValid, registrationRules } from './_shared/registration';

export function Current() {
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [nick, setNick] = useState('');
  const [pwd, setPwd] = useState('');
  const [show, setShow] = useState(false);
  const [code, setCode] = useState(() => invitationFromSearch(window.location.search));
  const [otp, setOtp] = useState('');
  const [issuedOtp, setIssuedOtp] = useState('');
  const [otpDeadline, setOtpDeadline] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');

  const resetOtp = () => {
    setOtp('');
    setIssuedOtp('');
    setOtpDeadline(null);
    setSecondsLeft(0);
    setMsg('');
  };

  useEffect(() => {
    if (otpDeadline === null) return;
    const update = () => {
      const remaining = Math.max(0, Math.ceil((otpDeadline - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) setOtpDeadline(null);
    };
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [otpDeadline]);

  const sendDemoCode = () => {
    if (secondsLeft > 0) return;
    if (!country || !isPhoneValid(country, phone)) {
      setErrs((previous) => ({
        ...previous,
        ...(!country ? { country: 'Veuillez sélectionner votre pays' } : {}),
        phone: 'Veuillez saisir un numéro valide pour le pays sélectionné',
      }));
      return;
    }
    const generatedOtp = generateDemoOtp();
    setOtp(generatedOtp);
    setIssuedOtp(generatedOtp);
    setErrs((previous) => {
      const next = { ...previous };
      delete next.phone;
      delete next.country;
      delete next.otp;
      return next;
    });
    setSecondsLeft(registrationRules.resendDelaySeconds);
    setOtpDeadline(Date.now() + registrationRules.resendDelaySeconds * 1000);
    setMsg('');
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const x: Record<string, string> = {};
    if (!country) x.country = 'Veuillez sélectionner votre pays';
    if (!isPhoneValid(country, phone)) x.phone = 'Numéro invalide';
    if (!nick.trim()) x.nick = 'Surnom requis';
    if (pwd.length < registrationRules.minimumPasswordLength) x.pwd = `${registrationRules.minimumPasswordLength} caractères minimum`;
    if (!code.trim()) x.code = "Code d'invitation requis";
    if (!issuedOtp) x.otp = 'Cliquez sur Envoyer pour générer le code de démonstration';
    else if (!otpDeadline || Date.now() >= otpDeadline) x.otp = 'Code expiré : demandez un nouveau code';
    else if (otp !== issuedOtp) x.otp = 'Code de vérification incorrect';
    setErrs(x);
    setMsg(Object.keys(x).length ? '' : "Démonstration uniquement : aucun compte n'a été créé et aucune donnée n'a été envoyée.");
  };
  const E = ({ k }: { k: string }) => (errs[k] ? <div className="ig-err">{errs[k]}</div> : null);

  return (
    <div className="ig-page">
      <div className="ig-head">
        <img src="/__mockup/images/iamgold-current-header.png" alt="IAMGOLD — La plateforme Ayala" />
      </div>
      {secondsLeft > registrationRules.resendDelaySeconds - 4 && <div className="ig-toast" role="status" data-testid="toast-sms">Code démo généré — sans SMS</div>}
      <form className="ig-form" onSubmit={submit} noValidate>
        <label htmlFor="country">Pays</label>
        <div className="ig-field">
          <select id="country" value={country} onChange={(e) => { setCountry(e.target.value); resetOtp(); }} data-testid="input-country">
            <option value="" disabled>Sélectionnez votre pays</option>
            {dialingCountries.map((entry) => <option key={entry.id} value={entry.id}>{entry.name} ({entry.dialCode})</option>)}
          </select>
        </div>
        <E k="country" />
        <label htmlFor="phone">Numéro de téléphone</label>
        <div className="ig-field"><input id="phone" type="tel" autoComplete="tel-national" inputMode="numeric" placeholder="Votre numéro de téléphone" value={phone} onChange={(e) => {
          setPhone(e.target.value.replace(/\D/g, ''));
          resetOtp();
        }} data-testid="input-phone" /></div>
        <E k="phone" />
        <label htmlFor="nickname">Surnom</label>
        <div className="ig-field"><input id="nickname" autoComplete="nickname" placeholder="Votre surnom" value={nick} onChange={(e) => setNick(e.target.value)} data-testid="input-nickname" /></div>
        <E k="nick" />
        <label htmlFor="password">Mot de passe</label>
        <div className="ig-field">
          <input id="password" type={show ? 'text' : 'password'} placeholder="Votre mot de passe" value={pwd} onChange={(e) => setPwd(e.target.value)} autoComplete="new-password" data-testid="input-password" />
          <button type="button" className="ig-ic" onClick={() => setShow(!show)} aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={show} data-testid="button-toggle-password">
            {show ? <Eye size={24} /> : <EyeOff size={24} />}
          </button>
        </div>
        <E k="pwd" />
        <label htmlFor="invitation">Code d'invitation</label>
        <div className="ig-field">
          <input id="invitation" placeholder="Votre code d’invitation" value={code} onChange={(e) => setCode(e.target.value)} data-testid="input-invite" />
          <span className="ig-ic"><Link2 size={24} /></span>
        </div>
        <E k="code" />
        <label htmlFor="otp">Code de vérification (OTP)</label>
        <div className="ig-field">
          <input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={registrationRules.otpLength} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="Votre code de vérification" data-testid="input-otp" />
          {secondsLeft > 0
            ? <span className="ig-otp" aria-label={`Nouvel envoi disponible dans ${secondsLeft} secondes`} data-testid="otp-countdown">{secondsLeft}s</span>
            : <button type="button" className="ig-send" onClick={sendDemoCode} title="Remplir un code de démonstration, sans SMS réel" data-testid="button-send-otp">Envoyer</button>}
        </div>
        <E k="otp" />
        <button type="submit" className="ig-btn ig-pri" data-testid="button-register">S'inscrire</button>
        <button type="button" className="ig-btn ig-out" onClick={() => setMsg("Démonstration uniquement : aucune connexion n'est disponible.")} data-testid="button-login">Se connecter maintenant</button>
        {msg && <p className="ig-note" data-testid="text-demo">{msg}</p>}
      </form>
      <button type="button" className="ig-fab" aria-label="Support" onClick={() => setMsg('Démonstration uniquement : support non disponible.')} data-testid="button-support"><Repeat2 size={26} /></button>
    </div>
  );
}

export default Current;
