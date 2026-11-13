import { BottomNav, Frame, Header, goBack, goTo, useMemberWallet, useMember, useInfiniteQuery, listMemberTransactions } from './_baseline/boundaries';
import { FinancialHistoryCard, formatHistoryAmount, formatHistoryDate, type FinancialHistoryKind, type FinancialHistoryRecord } from './_baseline/FinancialHistoryCard';
import './_group.css';

const transactionLabels: Record<string, string> = {
  forum_bonus: 'Prime de publication', admin_credit: 'Crédit administrateur', admin_debit: 'Débit administrateur',
  referral_bonus: 'Bonus de parrainage', commission: 'Commission de parrainage', wheel_reward: 'Gain du tirage de roue',
  mission_bonus: 'Prime de mission', task_bonus: 'Prime de tâche', product_income: 'Revenu de produit',
  daily_income: 'Revenu quotidien', income: 'Revenu', recharge: 'Recharge', withdrawal: 'Retrait', purchase: 'Achat de produit',
};
const historyTabs = [
  { kind: 'recharges', title: 'Recharges', target: 'BalanceDetails' },
  { kind: 'withdrawals', title: 'Retraits', target: 'WithdrawalHistory' },
  { kind: 'balance', title: 'Solde', target: 'BalanceHistory' },
] as const;

export interface FinancialHistoryProps {
  kind?: FinancialHistoryKind;
  records?: readonly FinancialHistoryRecord[];
  balance?: number | string | null;
}

export default function FinancialHistory({
  kind = 'balance',
  records = [],
  balance = null,
}: FinancialHistoryProps) {
  const withdrawals = kind === 'withdrawals';
  const title = kind === 'balance' ? 'Historique du solde' : withdrawals ? 'Historique des retraits' : 'Historique des recharges';
  const { user } = useMember();
  const { data: wallet, isError: walletError, refetch: refreshWallet } = useMemberWallet();
  const history = useInfiniteQuery({
    queryKey: ['member-transactions', user.id, kind],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) => listMemberTransactions({
      kind: kind === 'balance' ? 'all' : kind, cursor: pageParam,
    }, { signal }),
    getNextPageParam: page => page.nextCursor ?? undefined,
    enabled: !records.length,
    staleTime: 0,
    refetchInterval: 15000,
    refetchOnWindowFocus: 'always',
    retry: 1,
  });
  const transactions = history.data?.pages.flatMap(page => page.transactions) ?? [];
  const hasRecords = records.length > 0 || transactions.length > 0;

  return (
    <Frame>
      <div className="financial-history-page">
        <Header
          title={title}
          onBack={() => goBack(kind === 'balance' ? 'Account' : withdrawals ? 'Withdraw' : 'Recharge')}
        />
        <main className="financial-history-scroll">
          <nav className="financial-history-tabs" aria-label="Historiques financiers">
            {historyTabs.map(tab => <button key={tab.kind} type="button" aria-current={kind === tab.kind ? 'page' : undefined}
              onClick={() => goTo(tab.target)}>{tab.title}</button>)}
          </nav>
          {kind === 'balance' && <section className="financial-history-summary" aria-label="Solde et revenus cumulés">
            <p className="financial-history-summary-amount" data-testid="text-financial-history-balance">
              {(balance ?? wallet?.balance) === null || (balance ?? wallet?.balance) === undefined || balance === ''
                ? 'FCFA—'
                : formatHistoryAmount(balance ?? wallet?.balance)}
            </p>
            <span className="financial-history-summary-bonus">{wallet ? `${formatHistoryAmount(wallet.credits)} reçus au total · cumul historique, non retirable en plus du solde` : 'Revenus en chargement'}</span>
            {walletError && <button type="button" onClick={() => void refreshWallet()}>Actualisation indisponible · Réessayer</button>}
          </section>}
          {hasRecords ? (
            <section
              className="financial-history-records"
              aria-label={title}
            >
              {!records.length ? transactions.map(transaction=>(
                <article key={transaction.id} className={`financial-history-card financial-history-card--${transaction.status}`} data-testid="card-financial-history-record">
                  <header className="financial-history-card-status">
                    <strong>{transactionLabels[transaction.type] ?? transaction.type}</strong>
                    <span data-testid="status-financial-history">{transaction.status === 'pending'
                      ? withdrawals ? 'En attente' : 'En cours'
                      : transaction.status === 'failed' ? 'Échouée' : withdrawals ? 'Complété' : 'Effectuée'}</span>
                  </header>
                  <dl className="financial-history-card-fields">
                    <div className="financial-history-field"><dt>Montant</dt><dd>{kind === 'balance'
                      ? `${transaction.amount > 0 ? '+' : ''}${formatHistoryAmount(transaction.amount)}`
                      : formatHistoryAmount(Math.abs(transaction.amount))}</dd></div>
                    <div className="financial-history-field"><dt>Date</dt><dd><time dateTime={transaction.createdAt}>{formatHistoryDate(transaction.createdAt)}</time></dd></div>
                  </dl>
                </article>
              )) : records.map((record, index) => (
                <FinancialHistoryCard
                  key={record.id ?? `${record.status ?? 'unknown'}-${index}`}
                  record={record}
                  kind={kind}
                />
              ))}
            </section>
          ) : (
            <div className="financial-history-empty" data-testid="text-financial-history-empty">
              {history.isLoading ? 'Chargement des opérations…' : history.isError ? 'Impossible de charger les opérations.'
                : kind === 'recharges' ? 'Aucune recharge enregistrée' : withdrawals ? 'Aucun retrait enregistré' : 'Aucune transaction enregistrée'}
            </div>
          )}
          {history.isError && <button className="financial-history-more" type="button" onClick={() => void history.refetch()}>Impossible d’actualiser · Réessayer</button>}
          {history.hasNextPage && <button className="financial-history-more" type="button" disabled={history.isFetchingNextPage}
            onClick={() => void history.fetchNextPage()}>{history.isFetchingNextPage ? 'Chargement…' : 'Afficher les opérations précédentes'}</button>}
        </main>
        <BottomNav active="Account" />
      </div>
    </Frame>
  );
}
