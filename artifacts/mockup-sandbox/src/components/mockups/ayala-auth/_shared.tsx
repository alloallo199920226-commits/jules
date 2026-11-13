import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ChevronDown, ChevronLeft, Eye, EyeOff, Headphones, Link2, Repeat2 } from 'lucide-react';
import { dialingCountries, generateDemoOtp, invitationFromSearch, isPhoneValid, registrationRules } from '../ayala/_shared/registration';

export { dialingCountries, generateDemoOtp, invitationFromSearch, isPhoneValid, registrationRules };

export function BrandHeader() {
  return <div className="aa-brand-head"><img src="/__mockup/images/ayala-brand-header.png" alt="IAMGOLD — Bienvenue sur la plateforme Ayala" /></div>;
}

export function DemoNotice({ children }: { children: ReactNode }) {
  return <div className="aa-demo-notice" role="status">{children}</div>;
}

export function Toast({ message }: { message: string }) {
  if (!message) return null;
  return <div className="aa-toast" role="status">{message}</div>;
}

export function PasswordInput({
  id, value, onChange, placeholder, autoComplete = 'new-password', label = 'Afficher le mot de passe',
}: {
  id: string; value: string; onChange: (value: string) => void; placeholder: string;
  autoComplete?: string; label?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="aa-field">
      <input id={id} type={visible ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete={autoComplete} />
      <button type="button" className="aa-icon-button" onClick={() => setVisible((current) => !current)} aria-label={visible ? 'Masquer le mot de passe' : label} aria-pressed={visible}>
        {visible ? <Eye size={23} /> : <EyeOff size={23} />}
      </button>
    </div>
  );
}

function Flag({ id }: { id: string }) {
  const shapes: Record<string, ReactNode> = {
    BJ: <><path fill="#07884a" d="M0 0h12v16H0z" /><path fill="#f4d222" d="M12 0h18v8H12z" /><path fill="#d92736" d="M12 8h18v8H12z" /></>,
    BF: <><path fill="#df263b" d="M0 0h30v8H0z" /><path fill="#079447" d="M0 8h30v8H0z" /><path fill="#f6d32c" d="m15 4 1.3 3.2h3.4L17 9.2l1 3.2-3-2-3 2 1-3.2-2.7-2h3.4z" /></>,
    CM: <><path fill="#087b43" d="M0 0h10v16H0z" /><path fill="#d82438" d="M10 0h10v16H10z" /><path fill="#f4d32f" d="M20 0h10v16H20z" /><path fill="#f5d332" d="m15 5 .8 1.9h2l-1.6 1.2.6 2-1.8-1.2-1.8 1.2.6-2-1.6-1.2h2z" /></>,
    CI: <><path fill="#ef7d25" d="M0 0h10v16H0z" /><path fill="#fff" d="M10 0h10v16H10z" /><path fill="#07884a" d="M20 0h10v16H20z" /></>,
    FR: <><path fill="#1d4c9c" d="M0 0h10v16H0z" /><path fill="#fff" d="M10 0h10v16H10z" /><path fill="#e73543" d="M20 0h10v16H20z" /></>,
    GN: <><path fill="#d72a37" d="M0 0h10v16H0z" /><path fill="#f4d42d" d="M10 0h10v16H10z" /><path fill="#13864b" d="M20 0h10v16H20z" /></>,
    ML: <><path fill="#07874a" d="M0 0h10v16H0z" /><path fill="#f1d12c" d="M10 0h10v16H10z" /><path fill="#d82b39" d="M20 0h10v16H20z" /></>,
    NE: <><path fill="#e67825" d="M0 0h30v5H0z" /><path fill="#fff" d="M0 5h30v6H0z" /><circle cx="15" cy="8" r="2.5" fill="#e67825" /><path fill="#07874a" d="M0 11h30v5H0z" /></>,
    SN: <><path fill="#07874a" d="M0 0h10v16H0z" /><path fill="#f3d12d" d="M10 0h10v16H10z" /><path fill="#d6283a" d="M20 0h10v16H20z" /><path fill="#07874a" d="m15 4 .9 2.7h2.8l-2.3 1.7.9 2.7-2.3-1.7-2.3 1.7.9-2.7-2.3-1.7h2.8z" /></>,
    TG: <><path fill="#07874a" d="M0 0h30v3H0zM0 6h30v3H0zM0 12h30v4H0z" /><path fill="#f1d22e" d="M0 3h30v3H0zM0 9h30v3H0z" /><path fill="#d72b38" d="M0 0h12v9H0z" /><path fill="#f2d22e" d="m6 2 .8 1.7h1.9L7.2 5l.6 1.8L6 5.7l-1.8 1.1L4.8 5 3.3 3.7h1.9z" /></>,
  };
  return <svg className="aa-flag" viewBox="0 0 30 16" aria-hidden="true">{shapes[id] ?? shapes.SN}<rect x=".35" y=".35" width="29.3" height="15.3" rx="1" fill="none" stroke="#000" strokeOpacity=".09" strokeWidth=".7" /></svg>;
}

export function CountryPicker({
  id, value, onChange, error,
}: { id: string; value: string; onChange: (id: string) => void; error?: string }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const selected = dialingCountries.find((item) => item.id === value);
  const ordered = [...dialingCountries].sort((a, b) => {
    const priority = ['SN', 'CI', 'BJ', 'BF', 'CM'];
    return (priority.indexOf(a.id) < 0 ? 20 : priority.indexOf(a.id)) - (priority.indexOf(b.id) < 0 ? 20 : priority.indexOf(b.id));
  });
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  const keyboard = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape') { setOpen(false); return; }
    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); setOpen(true); return; }
    if (!open) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive((index) => (index + 1) % ordered.length); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActive((index) => (index + ordered.length - 1) % ordered.length); }
    if (event.key === 'Home') { event.preventDefault(); setActive(0); }
    if (event.key === 'End') { event.preventDefault(); setActive(ordered.length - 1); }
    if (event.key === 'Enter') { event.preventDefault(); onChange(ordered[active].id); setOpen(false); }
  };
  return (
    <div className="aa-country-wrap" ref={root}>
      <div className={`aa-field aa-country ${error ? 'has-error' : ''}`}>
        <button id={id} type="button" role="combobox" aria-expanded={open} aria-controls="aa-country-options" aria-label="Pays" onClick={() => setOpen((state) => !state)} onKeyDown={keyboard}>
          {selected ? <><Flag id={selected.id} /><span>{selected.name} ({selected.dialCode})</span></> : <span className="aa-placeholder">Veuillez sélectionner votre pays</span>}
          <ChevronDown size={17} className="aa-country-chevron" />
        </button>
      </div>
      {open && <div className="aa-country-menu" role="listbox" id="aa-country-options" aria-label="Choisir un pays">
        {ordered.map((item, index) => <button key={item.id} type="button" role="option" aria-selected={item.id === value} className={index === active ? 'is-active' : ''} onMouseEnter={() => setActive(index)} onClick={() => { onChange(item.id); setOpen(false); }}>
          <Flag id={item.id} /><span>{item.name} ({item.dialCode})</span>
        </button>)}
      </div>}
      {error && <div className="aa-error">{error}</div>}
    </div>
  );
}

export function OtpInput({
  id, value, onChange, seconds, onSend, error, testId,
}: { id: string; value: string; onChange: (value: string) => void; seconds: number; onSend: () => void; error?: string; testId?: string }) {
  return <>
    <div className={`aa-field aa-otp-field ${error ? 'has-error' : ''}`}>
      <input id={id} inputMode="numeric" autoComplete="one-time-code" maxLength={registrationRules.otpLength} value={value} onChange={(event) => onChange(event.target.value.replace(/\D/g, ''))} placeholder="Veuillez entrer le code de vérification" aria-label="Code de vérification (OTP)" />
      {seconds > 0 ? <span className="aa-countdown" aria-label={`Nouvel envoi disponible dans ${seconds} secondes`}>{seconds}s</span> : <button type="button" className="aa-send" onClick={onSend} data-testid={testId}>ENVOYER</button>}
    </div>
    {error && <div className="aa-error">{error}</div>}
  </>;
}

export function SupportButton({ onClick }: { onClick: () => void }) {
  return <button className="aa-support" aria-label="Support (aperçu)" type="button" onClick={onClick}><Headphones size={24} /></button>;
}

export function BackButton({ onClick }: { onClick: () => void }) {
  return <button type="button" className="aa-back" onClick={onClick} aria-label="Retour"><ChevronLeft size={27} /></button>;
}

export function LinkMark() { return <Link2 size={22} aria-hidden="true" />; }
export function ReloadMark() { return <Repeat2 size={24} aria-hidden="true" />; }
