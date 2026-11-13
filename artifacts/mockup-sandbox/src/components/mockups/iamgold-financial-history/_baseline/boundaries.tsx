import type { ReactNode } from 'react';
import { ArrowLeft, House, HandCoins, Gift, MessageCircle, UserRound } from './industrial-icons';
import { IndustrialNavFrame, ActiveNavPlaque } from './IndustrialNavFrame';
type MemberTransactionPage = {
  transactions: Array<{ id: string; type: string; amount: number; status: 'succeeded' | 'pending' | 'failed'; createdAt: string }>;
  nextCursor: string | null;
  summary: { total: number; succeeded: number; pending: number; failed: number; totalAmount: number };
};
export const goTo = (_target: string) => {};
export const goBack = (_target?: string) => {};
export const useMember = () => ({ user: { id: 'preview-only' } });
export const useMemberWallet = () => ({ data: undefined as { balance: number; credits: number } | undefined, isError: false, refetch: async () => {} });
export const listMemberTransactions = async (_params: unknown, _options: unknown): Promise<MemberTransactionPage> => ({ transactions: [], nextCursor: null, summary: { total: 0, succeeded: 0, pending: 0, failed: 0, totalAmount: 0 } });
export const useInfiniteQuery = (_options: {
  queryKey: unknown[]; initialPageParam: undefined | string;
  queryFn: (args: {pageParam: undefined | string; signal: AbortSignal}) => Promise<MemberTransactionPage>;
  getNextPageParam: (page: MemberTransactionPage) => string | undefined;
  enabled: boolean; staleTime: number; refetchInterval: number; refetchOnWindowFocus: string; retry: number;
}) => ({
  data: { pages: [] as MemberTransactionPage[] }, isLoading: false, isError: false,
  hasNextPage: false, isFetchingNextPage: false, refetch: async () => {}, fetchNextPage: async () => {},
});
export function Frame({ children }: { children: ReactNode }) {
  return <div className="ayala-frame"><div className="ayala-canvas">{children}</div></div>;
}
export function Header({title, onBack}: {title: string; onBack?: () => void}) {
  return <header className="ayala-header"><button className="ayala-head-btn" onClick={onBack} aria-label="Retour"><ArrowLeft size={22}/></button><span className="ayala-header-title">{title}</span></header>;
}
export function BottomNav({active}: {active: string}) {
  const items = [['Accueil','Home',House],['Investir','Investments',HandCoins],['Avis','Notice',Gift],['Forum','Forum',MessageCircle],['Compte','Account',UserRound]] as const;
  return <nav className="ayala-bottom" aria-label="Navigation principale"><IndustrialNavFrame/>{items.map(([label,target,Icon]) => <button key={target} className={`ayala-nav-item ${active===target?'active':''}`} onClick={() => goTo(target)}><ActiveNavPlaque active={active===target}/><span className="ayala-nav-icon">{target==='Notice'?<span className="ayala-gift"><Gift size={28}/></span>:<Icon size={22}/>}</span><span>{label}</span></button>)}</nav>;
}
