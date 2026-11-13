import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { ImagePlus, MessageCircle, Send, ThumbsUp, CircleX as X, IndustrialIcon } from '@/components/industrial-icons';
import IamgoldMediaViewer, { downloadImage } from '@/components/iamgold-media-viewer';
import { getSupportPresence, listSupportMessages, reactSupportMessage, requestUploadUrl, sendSupportMessage, updateSupportPresence } from '@workspace/api-client-react';
import { useMember } from './member-context';
import { Frame, Header } from './shared';
import { readSupportOutbox, removeSupportOutbox, saveSupportOutbox, type SupportPendingSend } from './support-outbox';
import { reconcileSupportMessages, supportRequest } from './support-delivery';
import { formatSupportPresenceTime, isSupportPresenceOnline, sampleSupportPresence, type SampledSupportPresence } from './support-presence';
import './support-chat.css';
import { trackVisibleViewport } from '@/lib/visible-viewport';

type Message = {
  id: string;
  body: string;
  imagePath?: string | null;
  sender: 'member' | 'admin';
  createdAt: string;
  liked: boolean;
  likes: number;
  clientId?: string;
  sending?: boolean;
  failed?: boolean;
  seenAt?: string | null;
};

function sameMessages(a: Message[], b: Message[]) {
  return a.length === b.length && a.every((message, index) => {
    const other = b[index];
    return message.id === other.id && message.clientId === other.clientId &&
      message.body === other.body && message.imagePath === other.imagePath &&
      message.sender === other.sender && message.createdAt === other.createdAt &&
      message.liked === other.liked && message.likes === other.likes &&
      message.seenAt === other.seenAt && message.sending === other.sending &&
      message.failed === other.failed;
  });
}

const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
const maxBytes = 5 * 1024 * 1024;

export default function SupportChat() {
  const { user } = useMember();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState(() => {
    try {
      const saved = sessionStorage.getItem('iamgold-support-draft') || '';
      sessionStorage.removeItem('iamgold-support-draft');
      return saved;
    } catch { return ''; }
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [loadError,setLoadError]=useState('');
  const [outboxReady,setOutboxReady]=useState(false);
  const [pending,setPending]=useState<SupportPendingSend | null>(null);
  const [pendingPreview,setPendingPreview]=useState('');
  const [attempt, setAttempt] = useState(0);
  const [viewer, setViewer] = useState<{src:string;alt:string}|null>(null);
  const [teamPresence, setTeamPresence] = useState<SampledSupportPresence | null>(null);
  const [teamOnline, setTeamOnline] = useState(false);
  const [presenceKnown, setPresenceKnown] = useState(false);
  const teamPresenceRef = useRef<SampledSupportPresence | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const composerTextareaRef = useRef<HTMLTextAreaElement>(null);
  const sendControllerRef = useRef<AbortController | null>(null);
  const retrySendRef = useRef<SupportPendingSend | null>(null);
  const mounted=useRef(false);
  const refreshing=useRef(false);
  const refreshAgainRef=useRef(false);
  const refreshCallbackRef=useRef<((signal?: AbortSignal, ensureAfterCurrent?: boolean) => Promise<void>) | null>(null);
  const sendingRef=useRef(false);
  const initialLoad = useRef(true);
  const nearBottomRef = useRef(true);
  const stickToBottomRef = useRef(false);
  const presenceClientIdRef = useRef<string | null>(null);
  if (!presenceClientIdRef.current) presenceClientIdRef.current = crypto.randomUUID();
  const queuedSeenIdsRef = useRef(new Set<string>());
  const ackedSeenIdsRef = useRef(new Set<string>());
  const presenceBusyRef = useRef(false);
  const presenceOfflinePendingRef = useRef(false);
  const presenceReadBusyRef = useRef(false);
  const refreshFailuresRef = useRef(0);
  const refreshRetryAtRef = useRef(0);
  const presenceFailuresRef = useRef(0);
  const presenceRetryAtRef = useRef(0);
  const presenceFlushTimerRef = useRef<number | null>(null);
  const viewerOpenRef = useRef(false);
  const previousViewerOpenRef = useRef(false);
  viewerOpenRef.current = Boolean(viewer);

  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(()=>{
    if(!pending?.file){setPendingPreview('');return;}
    const url=URL.createObjectURL(pending.file);
    setPendingPreview(url);
    return ()=>URL.revokeObjectURL(url);
  },[pending?.file]);

  useEffect(()=>{
    mounted.current=true;
    let active=true;
    void readSupportOutbox(user.id).then(saved=>{
      if(!active)return;
      if(saved){
        retrySendRef.current=saved;setPending(saved);setDraft(saved.body);setFile(saved.file);
        setMessages(current=>[...current,{
          id:`local-${saved.clientId}`,clientId:saved.clientId,body:saved.body,imagePath:saved.imagePath,
          sender:'member',createdAt:saved.createdAt,liked:false,likes:0,failed:true,
        }]);
        setError('Un message non confirmé a été restauré avec sa pièce jointe. Vous pouvez le renvoyer.');
      }
    }).catch(reason=>{
      if(active)setError(reason instanceof Error?reason.message:'Impossible de restaurer votre brouillon.');
    }).finally(()=>{if(active)setOutboxReady(true);});
    return ()=>{active=false;mounted.current=false;sendControllerRef.current?.abort();};
  },[user.id]);

  const refresh = useCallback(async (signal?: AbortSignal, ensureAfterCurrent = false) => {
    if(refreshing.current){if(ensureAfterCurrent)refreshAgainRef.current=true;return;}
    if(signal?.aborted)return;
    if(!ensureAfterCurrent&&Date.now()<refreshRetryAtRef.current)return;
    refreshing.current=true;
    try {
      const result = await supportRequest(signal=>listSupportMessages({signal}),signal,15000);
      if(signal?.aborted)return;
      setMessages(current => {
        const nextMessages = reconcileSupportMessages(current,result.messages).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
        if (sameMessages(current, nextMessages)) return current;
        if (nextMessages.length > current.length) stickToBottomRef.current = nearBottomRef.current;
        return nextMessages;
      });
      const queued=retrySendRef.current;
      if(queued&&result.messages.some(item=>item.sender==='member'&&item.clientId===queued.clientId)){
        await removeSupportOutbox(user.id,queued.clientId);
        if(retrySendRef.current?.clientId===queued.clientId&&!sendingRef.current){
          retrySendRef.current=null;setPending(null);
          setDraft(value=>value.trim()===queued.body?'':value);
          setFile(value=>value===queued.file?null:value);
          setError('');
        }
      }
      setLoadError('');
      refreshFailuresRef.current=0;
      refreshRetryAtRef.current=0;
      if (initialLoad.current) {
        initialLoad.current = false;
        stickToBottomRef.current = true;
        requestAnimationFrame(() => {
          const scroller = scrollRef.current;
          if (scroller) {
            scroller.scrollTop = scroller.scrollHeight;
            nearBottomRef.current = true;
            stickToBottomRef.current = false;
          }
        });
      }
    } catch (reason) {
      if (!signal?.aborted) {
        refreshFailuresRef.current++;
        refreshRetryAtRef.current=Date.now()+Math.min(30000,1000*2**Math.min(refreshFailuresRef.current,5));
        setLoadError(reason instanceof Error ? reason.message : 'Impossible de charger la conversation.');
      }
    } finally {
      refreshing.current=false;
      if (!signal?.aborted) setLoading(false);
      if(refreshAgainRef.current&&!signal?.aborted){
        refreshAgainRef.current=false;
        window.setTimeout(()=>{if(mounted.current)void refreshCallbackRef.current?.(undefined,true);},0);
      }
    }
  }, [user.id]);
  refreshCallbackRef.current=refresh;

  const readTeamPresence = useCallback(async (signal?: AbortSignal) => {
    if (presenceReadBusyRef.current || signal?.aborted || Date.now()<presenceRetryAtRef.current) return;
    presenceReadBusyRef.current = true;
    try {
      const value = await supportRequest(nextSignal => getSupportPresence({ signal: nextSignal }), signal, 10000);
      if (signal?.aborted) return;
      const sampled = sampleSupportPresence(value);
      teamPresenceRef.current = sampled;
      setTeamPresence(sampled);
      setTeamOnline(isSupportPresenceOnline(sampled));
      setPresenceKnown(true);
      presenceFailuresRef.current=0;
      presenceRetryAtRef.current=0;
    } catch {
      if(!signal?.aborted){
        presenceFailuresRef.current++;
        presenceRetryAtRef.current=Date.now()+Math.min(30000,1000*2**Math.min(presenceFailuresRef.current,5));
        setTeamOnline(false);
        setPresenceKnown(false);
      }
    } finally {
      presenceReadBusyRef.current = false;
    }
  }, []);

  const postMemberActivity = useCallback(async (active: boolean, keepalive = false) => {
    const clientId = presenceClientIdRef.current;
    if (!clientId) return;
    const isForeground = active && document.visibilityState === 'visible' && document.hasFocus() && !viewerOpenRef.current;
    if (!isForeground && presenceBusyRef.current) presenceOfflinePendingRef.current = true;
    if (!keepalive && presenceBusyRef.current) {
      if (!isForeground) presenceOfflinePendingRef.current = true;
      return;
    }
    const messageIds = isForeground ? [...queuedSeenIdsRef.current].slice(0, 100) : [];
    if (!keepalive) presenceBusyRef.current = true;
    try {
      await supportRequest(signal => updateSupportPresence(
        { clientId, active: isForeground, messageIds },
        { signal, keepalive },
      ), undefined, 10000);
      if (isForeground) {
        messageIds.forEach(id => {
          queuedSeenIdsRef.current.delete(id);
          ackedSeenIdsRef.current.add(id);
        });
        if (messageIds.length && mounted.current) void refresh(undefined,true);
      }
    } catch {
      // Failed acknowledgements stay queued and are retried on the next heartbeat.
    } finally {
      if (!keepalive) {
        presenceBusyRef.current = false;
        if (presenceOfflinePendingRef.current) {
          presenceOfflinePendingRef.current = false;
          void updateSupportPresence(
            { clientId, active: false, messageIds: [] },
            { keepalive: true },
          ).catch(() => undefined);
        }
      }
    }
  }, [refresh]);

  useEffect(() => {
    const controller = new AbortController();
    const announce = () => {
      const active = document.visibilityState === 'visible' && document.hasFocus() && !viewerOpenRef.current;
      void postMemberActivity(active, !active);
    };
    void readTeamPresence(controller.signal);
    announce();
    const heartbeat = window.setInterval(announce, 10000);
    const presencePoll = window.setInterval(() => {
      if (document.visibilityState === 'visible') void readTeamPresence(controller.signal);
      const sample = teamPresenceRef.current;
      if (sample && !isSupportPresenceOnline(sample)) setTeamOnline(false);
    }, 2500);
    const onVisibility = () => {
      announce();
      if (document.visibilityState === 'visible') void readTeamPresence(controller.signal);
    };
    const onFocus = () => announce();
    const onBlur = () => void postMemberActivity(false, true);
    const onPageHide = () => void postMemberActivity(false, true);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      controller.abort();
      window.clearInterval(heartbeat);
      window.clearInterval(presencePoll);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('pagehide', onPageHide);
      void postMemberActivity(false, true);
    };
  }, [postMemberActivity, readTeamPresence]);

  useEffect(() => {
    const isOpen = Boolean(viewer);
    if (isOpen === previousViewerOpenRef.current) return;
    previousViewerOpenRef.current = isOpen;
    void postMemberActivity(!isOpen, isOpen);
  }, [viewer, postMemberActivity]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller || viewer) return;
    const observer = new IntersectionObserver(entries => {
      if (document.visibilityState !== 'visible' || !document.hasFocus() || viewerOpenRef.current) return;
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).dataset.supportMessageId;
        const visibleHeight = entry.intersectionRect.height;
        const requiredHeight = Math.min(80, entry.boundingClientRect.height / 2);
        if (!entry.isIntersecting || visibleHeight < requiredHeight || !id || ackedSeenIdsRef.current.has(id)) continue;
        queuedSeenIdsRef.current.add(id);
        if (presenceFlushTimerRef.current !== null) window.clearTimeout(presenceFlushTimerRef.current);
        presenceFlushTimerRef.current = window.setTimeout(() => {
          presenceFlushTimerRef.current = null;
          void postMemberActivity(true);
        }, 180);
      }
    }, { root: scroller, threshold: [0, .25, .5, .75, 1] });
    scroller.querySelectorAll<HTMLElement>('[data-support-message-id]').forEach(message => observer.observe(message));
    return () => {
      observer.disconnect();
      if (presenceFlushTimerRef.current !== null) {
        window.clearTimeout(presenceFlushTimerRef.current);
        presenceFlushTimerRef.current = null;
      }
    };
  }, [messages, postMemberActivity, viewer]);

  useEffect(() => {
    const controller = new AbortController();
    if(!outboxReady)return;
    void refresh(controller.signal);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh(controller.signal);
    }, 2000);
    const onVisibility = () => { if (document.visibilityState === 'visible') void refresh(controller.signal); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refresh, attempt,outboxReady]);

  useEffect(() => {
    if (!stickToBottomRef.current) return;
    const frame = requestAnimationFrame(() => {
      const element = scrollRef.current;
      if (!element) return;
      // Follow after layout, without a smooth-scroll animation that can finish
      // against an obsolete height while the attachment composer collapses.
      element.scrollTop = element.scrollHeight;
      nearBottomRef.current = true;
      stickToBottomRef.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [messages.length]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const followBottom = () => {
      if (!nearBottomRef.current && !stickToBottomRef.current) return;
      scroller.scrollTop = scroller.scrollHeight;
      nearBottomRef.current = true;
    };
    const observer = new ResizeObserver(followBottom);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const frame = scrollRef.current?.closest<HTMLElement>('.ayala-frame');
    if (!frame) return;
    let restingHeight = window.innerHeight;
    const cleanup = trackVisibleViewport(frame, (height, layoutHeight) => {
      const focused = document.activeElement === composerTextareaRef.current;
      if (!focused) restingHeight = layoutHeight;
      frame.dataset.supportKeyboardOpen = String(focused && restingHeight - height > 120);
    });
    return () => {
      cleanup();
      delete frame.dataset.supportKeyboardOpen;
    };
  }, []);

  useEffect(() => {
    const field = composerTextareaRef.current;
    if (!field) return;
    field.style.height = 'auto';
    field.style.height = `${Math.min(field.scrollHeight, 96)}px`;
  }, [draft]);

  const onChooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0] || null;
    if (next && (!allowedTypes.includes(next.type) || next.size < 1 || next.size > maxBytes)) {
      setError('Choisissez une image PNG, JPEG ou WebP de 5 Mo maximum.');
      event.target.value = '';
      return;
    }
    setError('');
    setFile(next);
  };

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (sendingRef.current || !outboxReady || (!body && !file)) return;
    sendingRef.current=true;
    setSending(true);
    setError('');
    const controller = new AbortController();
    sendControllerRef.current = controller;
    const selectedFile = file;
    const previous = retrySendRef.current;
    const pending: SupportPendingSend = previous && previous.body === body && previous.file === selectedFile
      ? previous
      : { body, file: selectedFile, clientId: crypto.randomUUID(),createdAt:new Date().toISOString() };
    retrySendRef.current = pending;
    setPending(pending);
    const { clientId } = pending;
    const optimistic: Message = {
      id: `local-${clientId}`, clientId, body, imagePath: null, sender: 'member',
      createdAt: pending.createdAt, liked: false, likes: 0, sending: true,
    };
    stickToBottomRef.current = true;
    setMessages(current => [...current.filter(message=>!message.id.startsWith('local-')), optimistic]);
    try {
      await saveSupportOutbox(user.id,pending);
      const saved=await supportRequest(async signal=>{
        let imagePath = pending.imagePath;
        if (selectedFile && !imagePath) {
          const ticket = await requestUploadUrl({ name: selectedFile.name, size: selectedFile.size, contentType: selectedFile.type as 'image/png' | 'image/jpeg' | 'image/webp' }, {signal});
          const uploadResponse = await fetch(ticket.uploadURL, { method: 'PUT', headers: { 'Content-Type': selectedFile.type }, body: selectedFile, credentials: 'omit', signal });
          if (!uploadResponse.ok) throw new Error('Le transfert de l’image a échoué. Votre brouillon est conservé. Réessayez.');
          imagePath = ticket.objectPath;
          pending.imagePath = imagePath;
          await saveSupportOutbox(user.id,pending);
        }
        return sendSupportMessage({ body, ...(imagePath ? { imagePath } : {}), clientId }, {signal});
      },controller.signal);
      await removeSupportOutbox(user.id,clientId);
      if(!mounted.current)return;
      if (retrySendRef.current?.clientId === clientId) retrySendRef.current = null;
      setPending(null);setDraft('');setFile(null);
      setMessages(current => reconcileSupportMessages(current,[saved]).sort((a,b)=>a.createdAt.localeCompare(b.createdAt)));
    } catch (reason) {
      if (mounted.current) {
        setDraft(body);
        setFile(selectedFile);
        setMessages(current => current.map(message => message.clientId === clientId && message.id.startsWith('local-')?{...message,sending:false,failed:true}:message));
        setError(reason instanceof Error ? reason.message : 'Le message n’a pas été envoyé. Réessayez.');
      }
    } finally {
      sendingRef.current=false;
      if(mounted.current)setSending(false);
      if (sendControllerRef.current === controller) sendControllerRef.current = null;
    }
  };

  const toggleLike = async (message: Message) => {
    if (message.sending || message.id.startsWith('local-')) return;
    const liked = !message.liked;
    setMessages(current => current.map(item => item.id === message.id ? { ...item, liked, likes: Math.max(0, item.likes + (liked ? 1 : -1)) } : item));
    try {
      const result = await reactSupportMessage(message.id, { liked });
      setMessages(current => current.map(item => item.id === message.id ? { ...item, liked: result.liked ?? liked, likes: result.likes ?? item.likes } : item));
    } catch (reason) {
      setMessages(current => current.map(item => item.id === message.id ? message : item));
      setError(reason instanceof Error ? reason.message : 'La réaction n’a pas été enregistrée.');
    }
  };

  const presenceText = !presenceKnown
    ? 'Disponibilité non vérifiée'
    : teamOnline
      ? 'En ligne'
      : 'Hors ligne';
  const presenceDetails = `Première présence : ${formatSupportPresenceTime(teamPresence?.value.presence.firstSeenAt || '') || 'non renseignée'} · Dernière activité : ${formatSupportPresenceTime(teamPresence?.value.presence.lastSeenAt || '') || 'non renseignée'}`;

  return <Frame><div className="support-chat-page">
    <Header title="Service client"/>
    <div className="support-chat-intro"><span className="support-chat-mark"><MessageCircle size={20}/></span><div><strong>Conversation avec le support</strong><small>Vos messages sont privés et visibles par l’équipe IAMGOLD.</small><small className={`support-presence-status${teamOnline && presenceKnown ? ' is-online' : ''}`} aria-live="polite"><i aria-hidden="true"/>{presenceText}</small><small className="support-presence-timestamps">{presenceDetails}</small></div></div>
    <main className="support-chat-messages" ref={scrollRef} onScroll={event => { const node = event.currentTarget; nearBottomRef.current = node.scrollHeight - node.scrollTop - node.clientHeight < 100; }} aria-live="polite">
      {loading ? <div className="support-chat-skeleton"><i/><i/><i/></div> : messages.length === 0 ? <div className="support-chat-empty"><MessageCircle size={28}/><strong>Comment pouvons-nous vous aider&nbsp;?</strong><span>Écrivez votre demande. Vous pouvez joindre une image.</span></div> :
        messages.map(message => <article key={message.id} className={`support-message ${message.sender === 'member' ? 'is-own' : 'is-agent'}`} data-support-message-id={message.sender === 'admin' && !message.id.startsWith('local-') ? message.id : undefined} data-testid={`support-message-${message.id}`}>
          {message.sender === 'admin' && <span className="support-agent-label">Équipe IAMGOLD</span>}
          <div className="support-message-bubble">
            {message.body && <p>{message.body}</p>}
            {(message.imagePath||(message.id.startsWith('local-')&&pendingPreview)) && <div className="support-attachment"><button type="button" className="support-image-open" onClick={()=>setViewer({src:message.id.startsWith('local-')&&pendingPreview?pendingPreview:`/api/storage${message.imagePath}`,alt:'Image jointe à la conversation'})} aria-label="Afficher l’image en plein écran"><img className="support-message-image" src={message.id.startsWith('local-')&&pendingPreview?pendingPreview:`/api/storage${message.imagePath}`} alt="Image jointe à la conversation" loading="lazy"/></button>{!message.id.startsWith('local-')&&<button type="button" className="support-image-download" onClick={()=>downloadImage(`/api/storage${message.imagePath}`)} aria-label="Télécharger l’image"><IndustrialIcon name="download" size={16}/></button>}</div>}
            <footer><time>{new Date(message.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</time>{message.sender==='member'&&<span>{message.sending?'Envoi…':message.failed?'Non confirmé':message.seenAt?<span title={new Date(message.seenAt).toLocaleString('fr-FR')}>Lu à {new Date(message.seenAt).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</span>:'Envoyé'}</span>}</footer>
          </div>
          <button type="button" disabled={message.sending || message.id.startsWith('local-')} className={`support-like${message.liked ? ' liked' : ''}`} onClick={() => void toggleLike(message)} aria-label={message.liked ? 'Retirer la réaction' : 'Aimer le message'} data-testid={`button-like-message-${message.id}`}><ThumbsUp size={15}/>{message.likes > 0 && <span>{message.likes}</span>}</button>
        </article>)}
    </main>
    {(error||loadError) && <div className="support-chat-error" role="alert"><span>{error||loadError}</span>{loadError&&!error&&<button type="button" onClick={() => {refreshFailuresRef.current=0;refreshRetryAtRef.current=0;setAttempt(value => value + 1);}}>Recharger</button>}</div>}
    <form className="support-chat-composer" onSubmit={send}>
      {preview && <div className="support-chat-preview"><img src={preview} alt="Aperçu de la pièce jointe"/><button type="button" onClick={() => setFile(null)} aria-label="Retirer l’image"><X size={17}/></button></div>}
      <div className="support-chat-composer-row">
        <label className="support-attach" aria-label="Joindre une image"><ImagePlus size={20}/><input type="file" accept="image/png,image/jpeg,image/webp" onChange={onChooseFile} data-testid="input-support-image" disabled={sending||!outboxReady}/></label>
        <textarea ref={composerTextareaRef} value={draft} onChange={event => setDraft(event.target.value)} placeholder="Écrire un message…" maxLength={4000} aria-label="Votre message" data-testid="input-support-message" disabled={sending||!outboxReady}/>
        <button type="submit" disabled={sending || !outboxReady || (!draft.trim() && !file)} data-testid="button-send-support-message">{sending ? 'Envoi…' : <><Send size={17}/> {pending?'Réessayer':'Envoyer'}</>}</button>
      </div>
      <span className="support-chat-limit">PNG, JPEG, WebP · 5 Mo max</span>
    </form>
       {viewer&&<IamgoldMediaViewer src={viewer.src} alt={viewer.alt} onClose={()=>setViewer(null)}/>}
       <span className="support-chat-user" hidden>{user.nickname}</span>
  </div></Frame>;
}
