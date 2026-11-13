import { useEffect, useState, type FormEvent } from 'react';
import { BrandHeader, CountryPicker, PasswordInput, Toast } from './_shared';
import './_auth.css';

export function Login() {
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState('');
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!country) next.country = 'Veuillez sélectionner votre pays';
    if (!phone.trim()) next.phone = 'Veuillez saisir votre numéro de téléphone';
    if (!password) next.password = 'Veuillez saisir votre mot de passe';
    setErrors(next);
    setToast(Object.keys(next).length ? 'Vérifiez les champs — aperçu uniquement' : 'Connexion non effectuée — aperçu uniquement');
  };
  return (
    <main className="aa-page aa-login">
      <BrandHeader />
      <form className="aa-form aa-login-form" onSubmit={submit} noValidate>
        <label className="aa-label first">Pays</label>
        <CountryPicker id="login-country" value={country} onChange={(id) => { setCountry(id); setErrors((old) => { const next = { ...old }; delete next.country; return next; }); }} error={errors.country} />
        <label className="aa-label" htmlFor="login-phone">Numéro de téléphone</label>
        <div className={`aa-field ${errors.phone ? 'has-error' : ''}`}><input id="login-phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="Numéro de téléphone" value={phone} onChange={(event) => { setPhone(event.target.value.replace(/\D/g, '')); setErrors((old) => { const next = { ...old }; delete next.phone; return next; }); }} /></div>
        {errors.phone && <div className="aa-error">{errors.phone}</div>}
        <label className="aa-label" htmlFor="login-password">Mot de passe</label>
        <PasswordInput id="login-password" value={password} onChange={(value) => { setPassword(value); setErrors((old) => { const next = { ...old }; delete next.password; return next; }); }} placeholder="Mot de passe de connexion" autoComplete="current-password" />
        {errors.password && <div className="aa-error">{errors.password}</div>}
        <button type="submit" className="aa-primary">Se connecter maintenant</button>
        <button type="button" className="aa-secondary" onClick={() => window.location.assign('/__mockup/preview/ayala-auth/Register')}>Pas de compte, s'inscrire maintenant</button>
      </form>
      <Toast message={toast} />
    </main>
  );
}
export default Login;
