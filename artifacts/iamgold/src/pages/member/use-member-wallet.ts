import { useGetMemberWallet } from '@workspace/api-client-react';
import { useMember } from './member-context';

/** One server-confirmed wallet for account, withdrawal and transaction history. */
export function useMemberWallet() {
  const { user } = useMember();
  return useGetMemberWallet({
    query: {
      queryKey: ['member-wallet', user.id],
      staleTime: 0,
      refetchInterval: 5000,
      refetchOnMount: 'always',
      refetchOnWindowFocus: 'always',
      retry: 1,
    },
  });
}
