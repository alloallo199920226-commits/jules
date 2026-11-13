import { useEffect, useState } from 'react';
import { IndustrialIcon } from '@/components/industrial-icons';
import { Frame, BottomNav, Modal, goTo } from './shared';
import { EditorialMasthead, IndustrialArrow } from '@/iamgold-industrial-system/components/IndustrialEditorial';
import { apiRequest } from '@/lib/iamgold-api';

type MemberAnnouncement = {
  id: number;
  title: string;
  content: string;
  kind: string;
  audience: string;
  audienceLevel: string | null;
  status: string;
  publishedAt: string | null;
};

const storageKey = 'iamgold-reference-notice-read-v1';
const notices = [
  { title: 'Produits destinés aux membres VIP', date: '2026-04-16 08:14:12', art: 'notice-vip.webp', action: 'Vip' },
  { title: 'Avis d’urgence', date: '2026-04-14 09:35:05', art: 'notice-emergency.webp' },
  { title: 'Problème de connexion au compte', date: '2026-04-10 08:28:57', art: 'notice-account.webp' },
  { title: 'Tirage au sort', date: '2026-04-09 17:30:50', art: 'notice-draw.webp', action: 'Lottery' },
];

export default function Notice() {
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<MemberAnnouncement | null>(null);
  const [announcements, setAnnouncements] = useState<MemberAnnouncement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState('');
  const [retry, setRetry] = useState(0);
  const [read, setRead] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
      if (Array.isArray(saved) && saved.every(item => typeof item === 'string')) setRead(saved);
    } catch {
      setRead([]);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let loading = false;
    const load = async () => {
      if (loading || controller.signal.aborted) return;
      loading = true;
      try {
        const result = await apiRequest<{ announcements: MemberAnnouncement[] }>('/api/member/announcements', { signal: controller.signal });
        if (!controller.signal.aborted) {
          setAnnouncements(result.announcements.filter(item => item.status === 'published'));
          setAnnouncementsError('');
        }
      } catch (reason) {
        if (!controller.signal.aborted) setAnnouncementsError(reason instanceof Error ? reason.message : 'Les annonces publiées sont indisponibles.');
      } finally {
        if (!controller.signal.aborted) setAnnouncementsLoading(false);
        loading = false;
      }
    };
    void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, 15000);
    const onFocus = () => { void load(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [retry]);

  const openNotice = (title: string, action?: string) => {
    const next = [...new Set([...read, title])];
    setRead(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Consultation remains available for this visit. */ }
    if (action) goTo(action);
    else setSelected(title);
  };
  const openAnnouncement = (announcement: MemberAnnouncement) => {
    const key = `admin-announcement-${announcement.id}`;
    const next = [...new Set([...read, key])];
    setRead(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Keep the notice readable for this visit. */ }
    setSelectedAnnouncement(announcement);
  };

  return <Frame><div className="industrial-notice">
    <EditorialMasthead title="Notice" variant="notice" icon="alert"/>
    <main className="industrial-notice-list" aria-label="Avis et annonces">
      <div className="industrial-reference-note" role="note">
        <IndustrialIcon name="info" size={17}/>
        <span><strong>Annonces et avis</strong><br/>Les annonces publiées par IAMGOLD apparaissent ici, suivies des avis historiques de référence.</span>
      </div>
      <section className="industrial-published-announcements" aria-label="Annonces publiées">
        <h2>Annonces publiées</h2>
        {announcementsLoading && !announcements.length ? <div className="industrial-announcement-skeleton" role="status"><i/><i/></div> : null}
        {announcementsError && <p className="industrial-announcement-error" role="alert">{announcementsError}<button type="button" onClick={() => setRetry(value => value + 1)}>Réessayer</button></p>}
        {!announcementsLoading && !announcementsError && !announcements.length && <p className="industrial-announcement-empty">Aucune annonce publiée pour le moment.</p>}
        {announcements.map(announcement => {
          const key = `admin-announcement-${announcement.id}`;
          const isRead = read.includes(key);
          return <button type="button" className={`industrial-notice-card${isRead ? ' is-read' : ''}`} key={announcement.id} onClick={() => openAnnouncement(announcement)} data-testid={`button-published-announcement-${announcement.id}`}>
            <span className="industrial-notice-art" aria-hidden="true"><IndustrialIcon name={announcement.kind === 'notification' ? 'alert' : 'info'} size={26}/></span>
            <span className="industrial-notice-copy">
              <span className="industrial-notice-heading">{announcement.title}</span>
              <span className="industrial-notice-date"><IndustrialIcon name="calendar" size={16}/><span>{announcement.publishedAt ? new Date(announcement.publishedAt).toLocaleString('fr-FR') : 'Publication IAMGOLD'}</span></span>
              <span className="industrial-notice-status">{isRead ? 'Consulté sur cet appareil' : announcement.kind === 'notification' ? 'Notification publiée' : 'Annonce publiée'}</span>
            </span>
            <IndustrialArrow/>
          </button>;
        })}
      </section>
      <h2 className="industrial-reference-heading">Avis historiques de référence</h2>
      {notices.map((notice, index) => {
        const isRead = read.includes(notice.title);
        return <button type="button" className={`industrial-notice-card notice-card-${index + 1}${isRead ? ' is-read' : ''}`} key={notice.title}
          onClick={() => openNotice(notice.title, notice.action)} data-testid={`button-notice-${index + 1}`} aria-label={`${notice.title}, avis de référence, ${isRead ? 'consulté localement' : 'non consulté'}`}>
          <span className="industrial-notice-art" aria-hidden="true"><img src={`${import.meta.env.BASE_URL}iamgold-industrial-art/${notice.art}`} alt=""/></span>
          <span className="industrial-notice-copy">
            <span className="industrial-notice-heading">{notice.title}</span>
            <span className="industrial-notice-date"><IndustrialIcon name="calendar" size={16}/><span>Date de référence · {notice.date}</span></span>
            <span className="industrial-notice-status">{isRead ? 'Consulté sur cet appareil' : 'Non consulté · référence'}</span>
          </span>
          <IndustrialArrow/>
        </button>;
      })}
    </main>
    <div className="industrial-notice-support">
      <span><IndustrialIcon name="message" size={22}/><span>Une question sur l’espace membre&nbsp;?</span></span>
      <button type="button" onClick={() => goTo('Help')} data-testid="button-notice-help"><IndustrialIcon name="support" size={22}/> Assistance</button>
    </div>
    <BottomNav active="Notice"/>
    {selected && <Modal onClose={() => setSelected(null)} className="industrial-reference-modal" label="Avis de référence">
      <div className="industrial-modal-mark"><IndustrialIcon name="info" size={35}/></div>
      <p className="industrial-modal-kicker">AVIS DE RÉFÉRENCE</p>
      <h2>{selected}</h2>
      <p>Aucun contenu détaillé n’a été fourni pour cet avis. Il s’agit d’un exemple conservé à titre de référence, pas d’une actualité du système.</p>
      <button type="button" className="industrial-modal-close-action" onClick={() => setSelected(null)} data-testid="button-close-reference">Fermer</button>
    </Modal>}
    {selectedAnnouncement && <Modal onClose={() => setSelectedAnnouncement(null)} className="industrial-reference-modal" label="Annonce publiée">
      <div className="industrial-modal-mark"><IndustrialIcon name={selectedAnnouncement.kind === 'notification' ? 'alert' : 'info'} size={35}/></div>
      <p className="industrial-modal-kicker">{selectedAnnouncement.kind === 'notification' ? 'NOTIFICATION IAMGOLD' : 'ANNONCE IAMGOLD'}</p>
      <h2>{selectedAnnouncement.title}</h2>
      <p className="industrial-announcement-content">{selectedAnnouncement.content}</p>
      {selectedAnnouncement.publishedAt && <time>{new Date(selectedAnnouncement.publishedAt).toLocaleString('fr-FR')}</time>}
      <button type="button" className="industrial-modal-close-action" onClick={() => setSelectedAnnouncement(null)} data-testid="button-close-published-announcement">Fermer</button>
    </Modal>}
  </div></Frame>;
}
