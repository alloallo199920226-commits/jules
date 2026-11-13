import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { IndustrialIcon } from '@/components/industrial-icons';
import { logoutAccount, requestUploadUrl, updateMemberProfile, type UploadMetadataContentType } from '@workspace/api-client-react';
import { useSession } from '@/session';
import { Frame, Modal, goTo } from './shared';
import { useMember } from './member-context';
import { AccountMasthead, AccountSupport, AccountTitle, MetalPanel, MetalSubmit } from './AccountChrome';

const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
const maxAvatarSize = 5 * 1024 * 1024;

export default function ProfileSettings() {
  const { user } = useMember();
  const { setUser, showNotice } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const uploadedRef = useRef<{ file: File; path: string } | null>(null);
  const [nickname, setNickname] = useState(user.nickname);
  const [email, setEmail] = useState(user.email ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => () => requestRef.current?.abort(), []);

  const chooseImage = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    event.target.value = '';
    if (!selected) return;
    if (!allowedTypes.includes(selected.type) || selected.size > maxAvatarSize || selected.size < 1) {
      const message = 'Choisissez une image PNG, JPEG ou WebP de 5 Mo maximum.';
      setFormError(message);
      showNotice(message, 'error');
      return;
    }
    setFormError('');
    setFile(selected);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const cleanName = nickname.trim();
    if (!cleanName || cleanName.length > 60) {
      const message = 'Veuillez entrer un nom d’utilisateur valide.';
      setFormError(message); showNotice(message, 'error'); return;
    }
    const cleanEmail = email.trim();
    if (cleanEmail.length > 254 || (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))) {
      const message = 'Veuillez entrer une adresse e-mail valide.';
      setFormError(message); showNotice(message, 'error'); return;
    }
    const controller = new AbortController();
    requestRef.current = controller;
    setBusy(true);
    setFormError('');
    try {
      let avatarPath = user.avatarPath ?? null;
      if (file && uploadedRef.current?.file === file) avatarPath = uploadedRef.current.path;
      else if (file) {
        const ticket = await requestUploadUrl({
          name: file.name.slice(0, 180),
          size: file.size,
          contentType: file.type as UploadMetadataContentType,
        }, { signal: controller.signal });
        const uploaded = await fetch(ticket.uploadURL, {
          method: 'PUT', body: file, credentials: 'omit', signal: controller.signal,
          headers: { 'Content-Type': file.type },
        });
        if (!uploaded.ok) throw new Error('UPLOAD_FAILED');
        avatarPath = ticket.objectPath;
        uploadedRef.current = { file, path: avatarPath };
      }
      const result = await updateMemberProfile({
        nickname: cleanName,
        email: cleanEmail || null,
        avatarPath,
      }, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setUser(result.user);
      setNickname(result.user.nickname);
      setEmail(result.user.email ?? '');
      setFile(null);
      uploadedRef.current = null;
      const message = 'Profil enregistré.';
      setFormError(message);
      showNotice(message);
    } catch (error) {
      if (!controller.signal.aborted) {
        const message = (error as { data?: { error?: string } })?.data?.error ?? 'Impossible d’enregistrer le profil. Réessayez.';
        setFormError(message);
        showNotice(message, 'error');
      }
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
      if (!controller.signal.aborted) setBusy(false);
    }
  };

  const avatarSrc = preview || (user.avatarPath ? `${import.meta.env.BASE_URL}api/storage${user.avatarPath}` : '');

  const confirmLogout = async () => {
    if (logoutBusy) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setLogoutBusy(true);
    setLogoutError('');
    try {
      await logoutAccount({}, { signal: controller.signal });
      if (!controller.signal.aborted) setUser(null);
    } catch {
      if (!controller.signal.aborted) setLogoutError('La déconnexion a échoué. Votre session est toujours active. Réessayez.');
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
      if (!controller.signal.aborted) setLogoutBusy(false);
    }
  };

  const closeLogout = () => {
    if (logoutBusy) return;
    setLogoutOpen(false);
  };

  return <Frame><main className="supreme-account supreme-settings">
    <AccountMasthead page="profile"/>
    <AccountTitle title="Paramètres utilisateur" icon="settings"/>
    <div className="supreme-scroll supreme-profile-scroll">
      <MetalPanel className="supreme-profile-panel">
        <div className="supreme-profile-portrait">
          <div className="supreme-avatar-medallion" data-testid="img-profile-avatar">
            {avatarSrc ? <img src={avatarSrc} alt="Photo de profil" /> : <IndustrialIcon name="profile" size={54}/>}
            <button type="button" className="supreme-camera-button" onClick={() => inputRef.current?.click()} disabled={busy} aria-label="Choisir une photo de profil" data-testid="button-select-avatar"><IndustrialIcon name="camera" size={21}/></button>
          </div>
          <input ref={inputRef} className="supreme-file-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseImage} aria-label="Sélectionner une image" data-testid="input-avatar-file"/>
          <div className="supreme-avatar-copy">
            <strong>{file ? file.name : 'Cliquez pour changer l’image'}</strong>
            <span>{file ? 'Aperçu local prêt à être enregistré.' : 'Il est recommandé de télécharger des images 1:1 de plus de 100px'}</span>
            <small>PNG, JPEG ou WebP · 5 Mo maximum</small>
          </div>
          {file && <button type="button" className="supreme-clear-photo" onClick={() => { setFile(null); setFormError(''); }} disabled={busy} data-testid="button-clear-avatar">Effacer</button>}
        </div>

        <form className="supreme-profile-form" onSubmit={submit} noValidate>
          <div className="supreme-profile-row">
            <label className="supreme-profile-label" htmlFor="profile-phone"><IndustrialIcon name="phone" size={22}/><span>Numéro de mobile</span></label>
            <span className="supreme-profile-value"><input id="profile-phone" className="supreme-profile-input" value={user.phone} readOnly disabled aria-label="Numéro de mobile" data-testid="input-profile-phone"/><span className="supreme-readonly-note">IMMUTABLE</span></span>
          </div>
          <div className="supreme-profile-row">
            <label className="supreme-profile-label" htmlFor="profile-nickname"><IndustrialIcon name="profile" size={22}/><span>Nom d’utilisateur</span></label>
            <span className="supreme-profile-value supreme-clearable">
              <input id="profile-nickname" className="supreme-profile-input" value={nickname} onChange={event => setNickname(event.target.value)} disabled={busy} maxLength={60} autoComplete="nickname" data-testid="input-profile-nickname"/>
              <button type="button" onClick={() => setNickname('')} disabled={busy} aria-label="Effacer le nom d’utilisateur" data-testid="button-clear-nickname"><IndustrialIcon name="close" size={17}/></button>
            </span>
          </div>
          <div className="supreme-profile-row">
            <label className="supreme-profile-label" htmlFor="profile-email"><IndustrialIcon name="email" size={22}/><span>E-mail</span></label>
            <span className="supreme-profile-value supreme-clearable">
              <input id="profile-email" className="supreme-profile-input" value={email} onChange={event => setEmail(event.target.value)} disabled={busy} type="email" maxLength={254} autoComplete="email" placeholder="Veuillez entrer votre adresse e-mail" data-testid="input-profile-email"/>
              <button type="button" onClick={() => setEmail('')} disabled={busy} aria-label="Effacer l’e-mail" data-testid="button-clear-email"><IndustrialIcon name="close" size={17}/></button>
            </span>
          </div>
          {formError && <p className={`supreme-inline-feedback${formError === 'Profil enregistré.' ? ' is-success' : ''}`} role={formError === 'Profil enregistré.' ? 'status' : 'alert'} data-testid="status-profile-form">{formError}</p>}
          <MetalSubmit testId="button-save-profile" disabled={busy}>{busy ? 'Enregistrement…' : 'Confirmer'}</MetalSubmit>
        </form>
      </MetalPanel>

      <MetalPanel className="supreme-security-panel">
        <div className="supreme-section-heading"><IndustrialIcon name="secure" size={25}/><h2>Paramètres de sécurité</h2><span className="supreme-heading-rule"/></div>
        <button type="button" className="supreme-security-row" onClick={() => goTo('LoginPassword')} data-testid="button-login-password"><span className="supreme-security-icon"><IndustrialIcon name="lock" size={25}/></span><span>Mot de passe de connexion</span><IndustrialIcon className="supreme-security-chevron" name="chevronRight" size={22}/></button>
        <button type="button" className="supreme-security-row" onClick={() => goTo('TransactionPassword')} data-testid="button-transaction-password"><span className="supreme-security-icon"><IndustrialIcon name="key" size={25}/></span><span>Mot de passe de transaction</span><IndustrialIcon className="supreme-security-chevron" name="chevronRight" size={22}/></button>
        <div className="supreme-security-art" aria-hidden="true"><img src={`${import.meta.env.BASE_URL}iamgold-industrial-art/security-shield.webp`} alt=""/></div>
      </MetalPanel>

      <button type="button" className="supreme-logout" disabled={busy || logoutBusy} onClick={() => { setLogoutError(''); setLogoutOpen(true); }} data-testid="button-logout-dashboard"><IndustrialIcon name="logout" size={22}/><span>Se déconnecter</span></button>
      <AccountSupport/>
    </div>
    {logoutOpen && <Modal onClose={closeLogout} className="supreme-logout-layer" label="Confirmer la déconnexion">
      <div className="supreme-logout-dialog-icon"><IndustrialIcon name="logout" size={28}/></div>
      <p className="supreme-dialog-eyebrow">SÉCURITÉ DU COMPTE</p>
      <h2>Se déconnecter&nbsp;?</h2>
      <p className="supreme-dialog-copy">Votre session sera fermée sur cet appareil.</p>
      {logoutError && <p className="supreme-inline-feedback" role="alert" data-testid="status-logout-error">{logoutError}</p>}
      <div className="supreme-dialog-actions">
        <button type="button" className="supreme-dialog-cancel" onClick={closeLogout} disabled={logoutBusy} data-testid="button-cancel-logout">Annuler</button>
        <button type="button" className="supreme-dialog-confirm" onClick={confirmLogout} disabled={logoutBusy} data-testid="button-confirm-logout">{logoutBusy ? 'Déconnexion…' : 'Confirmer'}</button>
      </div>
    </Modal>}
  </main></Frame>;
}
