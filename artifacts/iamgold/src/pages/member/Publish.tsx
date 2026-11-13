import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { createForumPost, requestUploadUrl } from '@workspace/api-client-react';
import { useSession } from '@/session';
import { IndustrialIcon } from '@/components/industrial-icons';
import { AccountMasthead, AccountTitle, AccountSupport, MetalPanel, MetalSubmit } from './AccountChrome';
import PublishInstructions from './PublishInstructions';
import { Frame, goTo } from './shared';

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxBytes = 5 * 1024 * 1024;
const art = `${import.meta.env.BASE_URL}iamgold-industrial-art/`;

export default function Publish() {
  const [modal, setModal] = useState(true);
  const [consent, setConsent] = useState(false);
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);
  const { showNotice } = useSession();
  const request = useRef<AbortController | null>(null);
  const uploaded = useRef<{ file: File; path: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const setSelectedFile = (next: File | null) => {
    if (next && (next.size === 0 || !allowedTypes.includes(next.type) || next.size > maxBytes)) {
      const message = next.size === 0 ? 'Le fichier image est vide.' : 'Choisissez une image JPEG, PNG ou WebP de 5 Mo maximum.';
      setFeedback({ message, type: 'error' });
      showNotice(message, 'error');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setFeedback(null);
    if (next !== file) uploaded.current = null;
    setFile(next);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (selected) setSelectedFile(selected);
  };

  const submit = async () => {
    if (busy) return;
    if (!consent) {
      setFeedback({ message: 'Veuillez lire les informations et cocher « J’ai compris » pour autoriser la publication.', type: 'info' });
      setModal(true);
      return;
    }
    const trimmed = content.trim();
    if (!trimmed) {
      const message = 'Veuillez saisir le contenu de votre publication.';
      setFeedback({ message, type: 'error' }); showNotice(message, 'error'); return;
    }
    if (trimmed.length > 2000) {
      const message = 'Votre publication doit contenir 2 000 caractères maximum.';
      setFeedback({ message, type: 'error' }); showNotice(message, 'error'); return;
    }
    if (!file || file.size === 0 || !allowedTypes.includes(file.type) || file.size > maxBytes) {
      const message = 'Ajoutez une image JPEG, PNG ou WebP valide de 5 Mo maximum.';
      setFeedback({ message, type: 'error' }); showNotice(message, 'error'); return;
    }
    setFeedback(null);
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    try {
      let path = uploaded.current?.file === file ? uploaded.current.path : undefined;
      if (!path) {
        const ticket = await requestUploadUrl({ name: file.name, size: file.size, contentType: file.type as 'image/jpeg' | 'image/png' | 'image/webp' }, { signal: controller.signal });
        const response = await fetch(ticket.uploadURL, { method: 'PUT', body: file, headers: { 'Content-Type': file.type }, signal: controller.signal, credentials: 'omit' });
        if (!response.ok) throw new Error('Le transfert de l’image a échoué. Réessayez le téléversement.');
        path = ticket.objectPath;
        uploaded.current = { file, path };
      }
      await createForumPost({ content: trimmed, imagePath: path, consent: true }, { signal: controller.signal });
      if (controller.signal.aborted) return;
      showNotice('Publication envoyée, en attente de modération.');
      goTo('Forum');
    } catch (reason) {
      if (controller.signal.aborted) return;
      const error = reason as { data?: { error?: string }; message?: string };
      const message = error.data?.error ?? error.message ?? 'La publication a échoué. Réessayez.';
      setFeedback({ message, type: 'error' });
      showNotice(message, 'error');
    } finally {
      if (request.current === controller) request.current = null;
      if (!controller.signal.aborted) setBusy(false);
    }
  };

  return <Frame><div className="security-publish-supreme publish-page">
    <AccountMasthead page="money"/>
    <AccountTitle title="Publier" icon="productionlot" onHelp={() => setModal(true)}/>
    <main className="security-publish-scroll publish-scroll" data-testid="publish-scroll">
      <MetalPanel className="publish-form-panel">
        <form className="publish-form" onSubmit={event => { event.preventDefault(); void submit(); }}>
        <div className="publish-section-heading"><span className="publish-heading-mark"><IndustrialIcon name="productionlot" size={24}/></span><h2>Contenu</h2><span className="publish-heading-rule"/></div>
        <div className="publish-editor-wrap">
          <label className="publish-sr-only" htmlFor="post-content">Contenu de la publication</label>
          <textarea id="post-content" className="publish-editor" data-testid="input-post-content" maxLength={2000} value={content} onChange={event => setContent(event.target.value)} placeholder="Veuillez entrer le contenu…" disabled={busy}/>
          <span className="publish-counter" aria-live="polite">{content.length} / 2 000</span>
          <div className="publish-editor-art" aria-hidden="true"><IndustrialIcon name="orders" size={48}/><span>NOTE<br/>MEMBRE</span></div>
        </div>
        <div className="publish-proof-title"><IndustrialIcon name="mobileMoney" size={25}/><span>Preuve de retrait de la plateforme de téléchargement et de la banque.</span><IndustrialIcon name="chevronRight" size={20}/></div>
        <div className="publish-proof-layout">
          <div className={`publish-uploader${preview ? ' has-preview' : ''}`}>
            {preview ? <img className="publish-preview" src={preview} alt="Aperçu de l’image sélectionnée"/> : <div className="publish-upload-empty"><IndustrialIcon name="mobileMoney" size={43}/><IndustrialIcon name="arrow" size={24}/><strong>Ajouter une preuve</strong><span>JPEG, PNG ou WebP · 5 Mo maximum</span></div>}
            <input ref={inputRef} className="publish-file-input" id="proof-image" type="file" data-testid="input-post-image" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={handleFileChange}/>
            <div className="publish-file-actions">
              <button type="button" className="publish-file-action publish-file-select" onClick={() => inputRef.current?.click()} disabled={busy} data-testid="button-select-post-image">
                <IndustrialIcon name={preview ? 'camera' : 'arrow'} size={19}/>{preview ? 'Remplacer' : 'Choisir une image'}
              </button>
              {file && <button type="button" className="publish-file-action publish-file-clear" onClick={() => { setSelectedFile(null); if (inputRef.current) inputRef.current.value = ''; }} disabled={busy} data-testid="button-remove-post-image">
                <IndustrialIcon name="close" size={18}/>Supprimer
              </button>}
            </div>
            {file && <p className="publish-file-meta" data-testid="text-publish-image-meta">{file.name} · {(file.size / (1024 * 1024)).toFixed(2)} Mo</p>}
          </div>
          <div className="publish-proof-art" aria-hidden="true"><img src={`${art}forum-proof-still-life.webp`} alt=""/></div>
        </div>
        <p className="publish-privacy"><IndustrialIcon name="info" size={25}/><span>Votre publication et son image seront visibles par les membres du forum. Masquez les informations confidentielles. Aucune récompense n’est versée automatiquement.</span></p>
        <label className="publish-consent"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} data-testid="checkbox-publish-consent"/><span className="publish-checkmark" aria-hidden="true"><IndustrialIcon name="check" size={17}/></span><span>J’ai compris</span></label>
        {feedback && <p className={`publish-feedback is-${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'} data-testid="status-publish-feedback">{feedback.message}</p>}
        <MetalSubmit testId="button-publish-post" disabled={busy}>{busy ? 'Publication…' : 'Publier'}</MetalSubmit>
        <p className="publish-visibility-note"><IndustrialIcon name="secure" size={17}/> Publication destinée aux membres du forum. Vérifiez l’image avant l’envoi.</p>
        </form>
      </MetalPanel>
      <section className="publish-bottom-art" aria-label="Illustration industrielle de publication">
        <img src={`${art}security-vault-plinth.webp`} alt=""/>
        <div><span>PREUVE DOCUMENTÉE</span><strong>Une publication claire.<br/>Des données protégées.</strong></div>
      </section>
    </main>
    <AccountSupport/>
    {modal && <PublishInstructions onClose={() => setModal(false)}/>}
  </div></Frame>;
}
