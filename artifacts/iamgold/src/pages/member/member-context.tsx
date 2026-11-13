import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getMemberOverview, type MemberOverview } from '@workspace/api-client-react';
import { SessionLoading, useSession } from '@/session';
import { useQueryClient } from '@tanstack/react-query';

const Context = createContext<MemberOverview | null>(null);
export function MemberProvider({ children }: { children: ReactNode }) {
  const { user, setUser, showNotice } = useSession();
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!user?.id) return;
    const accountId = user.id;
    const stream = new EventSource(`${import.meta.env.BASE_URL}api/member/wallet/events`, { withCredentials: true });
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ['member-wallet', accountId], exact: true });
      void queryClient.invalidateQueries({ queryKey: ['member-transactions', accountId] });
    };
    stream.addEventListener('wallet-changed', refresh);
    return () => {
      stream.removeEventListener('wallet-changed', refresh);
      stream.close();
    };
  }, [queryClient, user?.id]);
  const [overview, setOverview] = useState<MemberOverview | null>(null);
  const [error, setError] = useState(false);
  const [attempt, retry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    const load = () => getMemberOverview({ signal: controller.signal }).then(value => {
      if (controller.signal.aborted) return;
      setOverview(value); setUser(value.user); setError(false);
    }).catch((reason) => {
      if (controller.signal.aborted) return;
      if (reason.status === 401) setUser(null);
      else if (reason.status === 403 && user) setUser({ ...user, transactionPasswordSet: false });
      else { setError(true); showNotice('Impossible de charger votre compte. Réessayez.', 'error'); }
    });
    void load();
    const onFocus = () => { if (document.visibilityState === 'visible') void load(); };
    document.addEventListener('visibilitychange', onFocus);
    return () => { controller.abort(); document.removeEventListener('visibilitychange', onFocus); };
  }, [user?.id, attempt, setUser, showNotice]);
  if (error) return <div className="ig-state-page"><button type="button" onClick={() => retry(value => value + 1)}>Réessayer</button></div>;
  if (!overview) return <SessionLoading />;
  return <Context.Provider value={{ ...overview, user: user ?? overview.user }}>{children}</Context.Provider>;
}
export function useMember() {
  const overview = useContext(Context);
  if (!overview) throw new Error('Compte non chargé');
  return { user: overview.user, overview };
}
export function invitationLink(code: string) {
  const url = new URL(`${import.meta.env.BASE_URL}register`, window.location.origin);
  url.searchParams.set('invitation', code);
  return url.href;
}
