import { useEffect, useRef, useState } from 'react';
import { useGetSupportPresence } from '@workspace/api-client-react';
import { useMember } from '@/pages/member/member-context';

/** All member Assistance buttons share one authenticated, expiring server query. */
export function useSupportAvailability() {
  const { user } = useMember();
  const query = useGetSupportPresence({
    query: {
      queryKey: ['iamgold-support-availability', user.id],
      refetchInterval: 4000,
      refetchIntervalInBackground: false,
      retry: false,
      staleTime: 2000,
    },
  });
  const deadline = useRef(0);
  const [, tick] = useState(0);
  useEffect(() => {
    const presence = query.data?.presence;
    const ttl = presence?.onlineUntil && query.data
      ? Date.parse(presence.onlineUntil) - Date.parse(query.data.serverNow)
      : 0;
    deadline.current = performance.now() + Math.max(0, Math.min(30_000, ttl || 0));
    tick(value => value + 1);
  }, [query.data, query.dataUpdatedAt]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') tick(value => value + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);
  return {
    known: !!query.data && !query.isError,
    online: !!query.data?.presence.online && !query.isError && navigator.onLine && performance.now() < deadline.current,
  };
}
