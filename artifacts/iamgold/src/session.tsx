import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { getCurrentSession, type AccountUser } from '@workspace/api-client-react';
import { IndustrialIcon } from '@/components/industrial-icons';

type SessionStatus = 'loading' | 'ready' | 'error';
type SessionContextValue = {
  user: AccountUser | null;
  status: SessionStatus;
  error: string;
  refresh: () => Promise<AccountUser | null>;
  setUser: (user: AccountUser | null) => void;
  showNotice: (message: string, kind?: 'success' | 'error') => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [notice, setNotice] = useState<{ message: string; kind: 'success' | 'error' } | null>(null);
  const showNotice = useCallback((message: string, kind: 'success' | 'error' = 'success') => {
    setNotice({ message, kind });
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const refresh = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const result = await getCurrentSession();
      setUser(result.user);
      setStatus('ready');
      return result.user;
    } catch {
      setStatus('error');
      setError('Impossible de vérifier votre session pour le moment. Vérifiez votre connexion puis réessayez.');
      throw new Error('SESSION_UNAVAILABLE');
    }
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setStatus('loading');
    getCurrentSession({ signal: controller.signal }).then((result) => {
      if (!active) return;
      setUser(result.user);
      setStatus('ready');
      setError('');
    }).catch(() => {
      if (!active || controller.signal.aborted) return;
      setStatus('error');
      setError('Impossible de vérifier votre session pour le moment. Vérifiez votre connexion puis réessayez.');
    });
    return () => { active = false; controller.abort(); };
  }, [attempt]);

  const retry = useCallback(async () => {
    setAttempt((value) => value + 1);
  }, []);

  return <SessionContext.Provider value={{ user, status, error, refresh, setUser, showNotice }}>
    {children}
    {notice && <div className="ig-global-notice" role={notice.kind === 'error' ? 'alert' : 'status'} aria-atomic="true" data-testid="notification-toast">
      {notice.kind === 'error' && <IndustrialIcon name="alert" size={19} className="ig-toast-alert-mark"/>}
      <span>{notice.message}</span>
    </div>}
    {status === 'error' && <div className="ig-state-page" role="alert">
      <div className="ig-state-card">
        <h1>Connexion au compte indisponible</h1>
        <p>{error}</p>
        <button type="button" onClick={retry} data-testid="button-retry-session">Réessayer</button>
      </div>
    </div>}
  </SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession doit être utilisé dans SessionProvider');
  return value;
}

export function SessionLoading() {
  return <div className="ig-state-page" aria-live="polite"><div className="ig-state-card">
    <p>Vérification de votre session…</p>
    <div className="ig-skeleton" aria-hidden="true" />
  </div></div>;
}
