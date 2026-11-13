import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Eye, Heart, MessageCircle, Send, IndustrialIcon } from '@/components/industrial-icons';
import IamgoldMediaViewer, { downloadImage } from '@/components/iamgold-media-viewer';
import { addForumComment, listForumComments, listForumPosts, reactForumPost, recordForumView, type ForumPost } from '@workspace/api-client-react';
import { useMember } from './member-context';
import { Frame, Header, BottomNav, Support, goTo } from './shared';
import PublishInstructions from './PublishInstructions';
import './forum-interactions.css';
import { MemberGoldBadge } from '@/components/MemberGoldBadge';
import { RoyalMasthead } from '@/iamgold-industrial-system/components/RoyalMasthead';

type ForumItem = ForumPost;
type Comment = { id: string; body: string; authorName: string; createdAt: string };

const amount = (value: number) => `${new Intl.NumberFormat('fr-FR').format(value)} FCFA`;

export default function Forum() {
  const { user } = useMember();
  const [expanded, setExpanded] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const [posts, setPosts] = useState<ForumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [attempt, retry] = useState(0);
  const [failed, setFailed] = useState(false);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState('');
  const [pendingAction, setPendingAction] = useState('');
  const [viewer, setViewer] = useState<{src:string;alt:string}|null>(null);
  const postRequest = useRef<AbortController | null>(null);
  const commentRequest = useRef<AbortController | null>(null);
  const draftRef = useRef(commentDraft);
  const viewedPosts = useRef(new Set<string>());
  draftRef.current = commentDraft;
  const approvedIds = posts.filter(post => post.status === 'approved').map(post => post.id).join(',');

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        const id=(entry.target as HTMLElement).dataset.forumViewId;
        if(!entry.isIntersecting||!id||viewedPosts.current.has(id))return;
        viewedPosts.current.add(id);observer.unobserve(entry.target);
        void recordForumView(id,{}).then(result=>setPosts(current=>current.map(post=>post.id===id?{...post,views:result.views??post.views}:post)))
          .catch(()=>viewedPosts.current.delete(id));
      });
    },{threshold:.5});
    document.querySelectorAll('[data-forum-view-id]').forEach(element=>observer.observe(element));
    return ()=>observer.disconnect();
  },[approvedIds]);

  const loadPosts = useCallback(async (signal: AbortSignal) => {
    try {
      const result = await listForumPosts({ signal });
      if (!signal.aborted) { setPosts(result); setFailed(false); }
    } catch {
      if (!signal.aborted) setFailed(true);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    postRequest.current = controller;
    void loadPosts(controller.signal);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void loadPosts(controller.signal);
    }, 5000);
    const visibility = () => { if (document.visibilityState === 'visible') void loadPosts(controller.signal); };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', visibility);
      if (postRequest.current === controller) postRequest.current = null;
    };
  }, [attempt, loadPosts]);

  const loadComments = useCallback(async (postId: string, signal: AbortSignal) => {
    try {
      const result = await listForumComments(postId, { signal });
      if (!signal.aborted) { setComments(result.comments); setCommentsError(''); }
    } catch (reason) {
      if (!signal.aborted) setCommentsError(reason instanceof Error ? reason.message : 'Commentaires indisponibles.');
    } finally {
      if (!signal.aborted) setCommentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!expandedComments) return;
    const controller = new AbortController();
    commentRequest.current = controller;
    setCommentsLoading(true);
    void loadComments(expandedComments, controller.signal);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void loadComments(expandedComments, controller.signal);
    }, 3000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      if (commentRequest.current === controller) commentRequest.current = null;
    };
  }, [expandedComments, loadComments]);

  const viewPost = async (post: ForumItem) => {
    if (post.status !== 'approved' || pendingAction) return;
    setPendingAction(`view-${post.id}`);
    try {
      const result = await recordForumView(post.id,{});
      setPosts(current => current.map(item => item.id === post.id ? { ...item, views: result.views ?? item.views } : item));
    } catch { /* Keep the current count visible; periodic refresh will reconcile it. */ }
    finally { setPendingAction(''); }
  };

  const toggleLike = async (post: ForumItem) => {
    if (post.status !== 'approved' || pendingAction) return;
    const liked = !post.liked;
    setPendingAction(`like-${post.id}`);
    setPosts(current => current.map(item => item.id === post.id ? { ...item, liked, likes: Math.max(0, (item.likes || 0) + (liked ? 1 : -1)) } : item));
    try {
      const result = await reactForumPost(post.id, { liked });
      setPosts(current => current.map(item => item.id === post.id ? { ...item, liked: result.liked ?? liked, likes: result.likes ?? item.likes } : item));
    } catch (reason) {
      setPosts(current => current.map(item => item.id === post.id ? { ...item, liked: post.liked, likes: post.likes } : item));
      setCommentsError(reason instanceof Error ? reason.message : 'La réaction n’a pas été enregistrée.');
    } finally { setPendingAction(''); }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(current => current === postId ? null : postId);
    setComments([]);
    setCommentsError('');
  };

  const submitComment = async (event: FormEvent) => {
    event.preventDefault();
    const postId = expandedComments;
    const body = commentDraft.trim();
    if (!postId || !body || pendingAction) return;
    setPendingAction(`comment-${postId}`);
    setCommentsError('');
    const draft = body;
    setCommentDraft('');
    try {
      await addForumComment(postId, { body });
      const controller = commentRequest.current;
      if (controller && !controller.signal.aborted) await loadComments(postId, controller.signal);
      setPosts(current => current.map(item => String(item.id) === postId ? { ...item, commentCount: (item.commentCount || 0) + 1 } : item));
    } catch (reason) {
      setCommentDraft(current => current || draft);
      setCommentsError(reason instanceof Error ? reason.message : 'Le commentaire n’a pas été envoyé.');
    } finally { setPendingAction(''); }
  };

  return <Frame><div className="ayala-scroll community-page">
    <RoyalMasthead/>
    <div className="community-toolbar-wrap"><Header title="Forum" help onHelp={() => setHelpOpen(true)}/></div>
    <section className="member-forum-banner"><div className="member-row"><div className="ayala-avatar">{user.nickname[0]?.toUpperCase()}</div><div className="member-forum-identity"><span className="member-gold-name">{user.nickname}</span>{user.nickname?.trim() && <MemberGoldBadge size={24} />}<small>ID {user.id.slice(0, 8)}</small></div><button className="ayala-soft-button" onClick={() => goTo('Publish')} data-testid="button-open-publish">Publier</button></div></section>
    <main className="ayala-main">
      <button className="member-forum-rules" onClick={() => setExpanded(value => !value)} aria-expanded={expanded}><b>Description de la récompense</b>{expanded && <><strong>Partagez des captures d’écran de retrait</strong><p>Chaque publication est vérifiée avant sa diffusion. Une éventuelle prime est accordée par l’équipe après modération et n’est jamais automatique.</p></>}</button>
      {loading ? <div className="forum-loading" role="status" aria-label="Chargement des publications"><i/><i/></div> : failed ? <div className="member-empty" role="alert"><p>Impossible de charger le forum.</p><button className="ayala-soft-button" onClick={() => retry(value => value + 1)}>Réessayer</button></div> : posts.length === 0 ? <p className="member-empty" data-testid="forum-empty">Aucune publication pour le moment.</p> : posts.map(post => {
        const approved = post.status === 'approved';
        const statusLabel = post.status === 'pending' ? 'En attente de modération' : post.status === 'rejected' ? 'Publication refusée' : '';
        return <article className="ayala-card member-post" key={post.id} data-testid={`forum-post-${post.id}`}>
          <header><div className="ayala-avatar">{post.authorName[0]?.toUpperCase()}</div><div className="forum-author-identity"><span className="forum-author-name"><b>{post.authorName}</b><MemberGoldBadge size={22} /></span><small>{post.authorPhoneMasked}</small></div>{!approved && <span className={`forum-review-status ${post.status || 'pending'}`}>{statusLabel || 'En attente'}</span>}</header>
          {post.bonus ? <div className="forum-bonus-total"><span>Prime cumulée</span><strong>{amount(post.bonus)}</strong></div> : null}
          <p>{post.content}</p>
           <div className="forum-attachment"><button type="button" className="forum-image-open" onClick={()=>setViewer({src:`/api/storage${post.imagePath}`,alt:'Image jointe à la publication'})} aria-label="Afficher l’image en plein écran"><img src={`/api/storage${post.imagePath}`} alt="Image jointe à la publication" loading="lazy" data-forum-view-id={approved?post.id:undefined}/></button><button type="button" className="forum-image-download" onClick={()=>downloadImage(`/api/storage${post.imagePath}`)} aria-label="Télécharger l’image"><IndustrialIcon name="download" size={17}/></button></div>
          {post.status === 'rejected' && post.reviewNote && <p className="forum-review-note"><b>Note de modération</b>{post.reviewNote}</p>}
          <div className="forum-post-controls">
            <button type="button" onClick={() => void viewPost(post)} disabled={!approved || pendingAction === `view-${post.id}`} aria-label="Compter la consultation" data-testid={`button-view-post-${post.id}`}><Eye size={17}/><span>{post.views || 0} vues</span></button>
            <button type="button" className={post.liked ? 'is-liked' : ''} onClick={() => void toggleLike(post)} disabled={!approved || pendingAction === `like-${post.id}`} aria-pressed={Boolean(post.liked)} data-testid={`button-like-post-${post.id}`}><Heart size={17}/><span>{post.likes || 0} J’aime</span></button>
            <button type="button" onClick={() => toggleComments(String(post.id))} disabled={!approved} aria-expanded={expandedComments === String(post.id)} data-testid={`button-comments-post-${post.id}`}><MessageCircle size={17}/><span>{post.commentCount || 0} commentaires</span></button>
          </div>
          {expandedComments === String(post.id) && approved && <section className="forum-comments" aria-label="Commentaires">
            {commentsLoading && !comments.length ? <p className="forum-comment-loading">Chargement des commentaires…</p> : comments.length ? comments.map(comment => <article className="forum-comment" key={comment.id}><div className="forum-comment-author"><b>{comment.authorName}</b><MemberGoldBadge size={22} /></div><p>{comment.body}</p><time>{new Date(comment.createdAt).toLocaleString('fr-FR')}</time></article>) : <p className="forum-comment-loading">Aucun commentaire pour le moment.</p>}
            {commentsError && <p className="forum-comment-error" role="alert">{commentsError}</p>}
            <form className="forum-comment-form" onSubmit={submitComment}><input aria-label="Votre commentaire" value={commentDraft} maxLength={1000} onChange={event => setCommentDraft(event.target.value)} placeholder="Ajouter un commentaire…" data-testid={`input-comment-${post.id}`}/><button type="submit" disabled={!commentDraft.trim() || pendingAction === `comment-${post.id}`} aria-label="Publier le commentaire" data-testid={`button-send-comment-${post.id}`}><Send size={17}/></button></form>
          </section>}
          <footer>Date : {new Date(post.createdAt).toLocaleString('fr-FR')}</footer>
        </article>;
      })}
    </main>
    <Support inline/><BottomNav active="Forum"/>{viewer&&<IamgoldMediaViewer src={viewer.src} alt={viewer.alt} onClose={()=>setViewer(null)}/ >}{helpOpen && <PublishInstructions onClose={() => setHelpOpen(false)}/>}
  </div></Frame>;
}
