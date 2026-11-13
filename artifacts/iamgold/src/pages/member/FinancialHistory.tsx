import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { listMemberTransactions } from '@workspace/api-client-react';
import { BottomNav, Frame, Header, goBack, goTo } from './shared';
import { useMemberWallet } from './use-member-wallet';
import { useMember } from './member-context';
import { FinancialHistoryCard, formatHistoryAmount, formatHistoryDate, type FinancialHistoryKind, type FinancialHistoryRecord } from './FinancialHistoryCard';
import { HistoryGlyph } from './FinancialHistoryIcons';
import './financial-history.css';

type Period = 'all' | '7d' | '30d' | '90d';
type StatusFilter = 'all' | 'succeeded' | 'pending' | 'failed';
type HistorySummary = { total: number; succeeded: number; pending: number; failed: number; totalAmount: number };
const labels: Record<string, string> = {
  forum_bonus: 'Prime de publication', admin_credit: 'Crédit administrateur', admin_debit: 'Débit administrateur',
  referral_bonus: 'Bonus de parrainage', commission: 'Commission de parrainage', wheel_reward: 'Gain du tirage de roue',
  mission_bonus: 'Prime de mission', task_bonus: 'Prime de tâche', product_income: 'Revenu de produit',
  daily_income: 'Revenu quotidien', income: 'Revenu', recharge: 'Recharge', withdrawal: 'Retrait', purchase: 'Achat de produit',
};
const tabs = [
  { kind: 'recharges', title: 'Recharges', target: 'BalanceDetails' },
  { kind: 'withdrawals', title: 'Retraits', target: 'WithdrawalHistory' },
  { kind: 'balance', title: 'Solde', target: 'BalanceHistory' },
] as const;
export interface FinancialHistoryProps {
  kind?: FinancialHistoryKind;
  records?: readonly FinancialHistoryRecord[];
  balance?: number | string | null;
}

function csvCell(value: unknown) {
  const text = value == null ? '' : String(value);
  const safeText = typeof value === 'string' && /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}

export default function FinancialHistory({ kind = 'balance', records = [], balance = null }: FinancialHistoryProps) {
  const isBalance = kind === 'balance';
  const isWithdrawal = kind === 'withdrawals';
  const title = isBalance ? 'Historique du solde' : isWithdrawal ? 'Historique des retraits' : 'Historique des recharges';
  const { user } = useMember();
  const { data: wallet, isError: walletError, refetch: refreshWallet } = useMemberWallet();
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<Period>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  useEffect(() => {
    setSearch('');
    setPeriod('all');
    setStatus('all');
    setExportError('');
  }, [kind, user.id]);
  const availableBalance = balance ?? wallet?.balance;
  const historyArtStyle = {
    '--history-header-art': `url("${import.meta.env.BASE_URL}iamgold-industrial-art/history/header.png")`,
    '--history-ore-art': `url("${import.meta.env.BASE_URL}iamgold-industrial-art/banner-ore.webp")`,
  } as CSSProperties;
  const params = useMemo(() => ({
    kind: isBalance ? 'all' as const : kind,
    search: search.trim() || undefined,
    period,
    status,
  }), [isBalance, kind, search, period, status]);
  const history = useInfiniteQuery({
    queryKey: ['member-transactions', user.id, kind, params],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) => listMemberTransactions({ ...params, cursor: pageParam }, { signal }),
    getNextPageParam: page => page.nextCursor ?? undefined,
    enabled: records.length === 0,
    staleTime: 0,
    refetchInterval: 15000,
    refetchOnWindowFocus: 'always',
    retry: 1,
  });
  const transactions = history.data?.pages.flatMap(page => page.transactions) ?? [];
  const summary: HistorySummary | undefined = history.data?.pages[0]?.summary;
  const hasRecords = records.length > 0 || transactions.length > 0;

  async function exportCsv() {
    if (records.length || exporting) return;
    setExporting(true);
    setExportError('');
    try {
      const all = [];
      let cursor: string | undefined;
      do {
        const page = await listMemberTransactions({ ...params, cursor });
        all.push(...page.transactions);
        cursor = page.nextCursor ?? undefined;
      } while (cursor);
      const rows = [
        ['Référence', 'Opération', 'Montant', 'Statut', 'Date'],
        ...all.map(item => [item.id, labels[item.type] ?? item.type, item.amount, item.status, formatHistoryDate(item.createdAt)]),
      ];
      const blob = new Blob(['\ufeff' + rows.map(row => row.map(csvCell).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${kind}-iamgold.csv`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch {
      setExportError('Export impossible pour le moment. Réessayez.');
    } finally {
      setExporting(false);
    }
  }

  return <Frame>
    <div className={`financial-history-page financial-history-page--${kind}`} style={historyArtStyle}>
      <Header title={title} onBack={() => goBack(isBalance ? 'Account' : isWithdrawal ? 'Withdraw' : 'Recharge')} />
      <main className="financial-history-scroll">
        <nav className="financial-history-tabs" aria-label="Historiques financiers">
          {tabs.map(tab => <button key={tab.kind} type="button" aria-current={kind === tab.kind ? 'page' : undefined}
            onClick={() => goTo(tab.target)} data-testid={`tab-history-${tab.kind}`}>
            <HistoryGlyph name={tab.kind === 'recharges' ? 'recharge' : tab.kind === 'withdrawals' ? 'withdrawal' : 'bullion'} />
            <span>{tab.title}</span>
          </button>)}
        </nav>

        {isBalance ? <section className="financial-history-balance-panel" aria-label="Cumul historique des crédits">
          <HistoryGlyph name="coins" className="financial-history-balance-icon" />
          <div className="financial-history-balance-copy">
            <span className="financial-history-eyebrow">Cumul historique reçu</span>
            <strong data-testid="text-financial-history-credits">{wallet ? formatHistoryAmount(wallet.credits) : 'FCFA—'}</strong>
            <p>Reçus au total · cumul historique, non retirable en plus du solde</p>
            {availableBalance !== null && availableBalance !== undefined && availableBalance !== '' &&
              <span className="financial-history-available">Solde disponible : {formatHistoryAmount(availableBalance)}</span>}
          </div>
          <span className="financial-history-ore" aria-hidden="true" />
          {walletError && <button type="button" className="financial-history-inline-retry" onClick={() => void refreshWallet()}>Réessayer</button>}
        </section> : <section className="financial-history-stats" aria-label="Synthèse des transactions">
          <div className="history-stat"><HistoryGlyph name="coins"/><span>Total</span><strong>{summary ? summary.total : '—'}</strong></div>
          <div className="history-stat"><HistoryGlyph name="success"/><span>Effectuées</span><strong>{summary ? summary.succeeded : '—'}</strong></div>
          <div className="history-stat"><HistoryGlyph name="failed"/><span>Échouées</span><strong>{summary ? summary.failed : '—'}</strong></div>
          <div className="history-stat history-stat--amount"><HistoryGlyph name="coins"/><span>Montant total</span><strong>{summary ? formatHistoryAmount(summary.totalAmount) : 'FCFA—'}</strong></div>
        </section>}

        <section className="financial-history-tools" aria-label="Recherche et filtres">
          <label className="history-search">
            <HistoryGlyph name="search"/>
            <input type="search" maxLength={120} value={search} onChange={event => setSearch(event.target.value)} placeholder="Rechercher une référence…" aria-label="Rechercher une référence" data-testid="input-history-search"/>
          </label>
          <label className="history-select"><HistoryGlyph name="calendar"/><select value={period} onChange={event => setPeriod(event.target.value as Period)} aria-label="Période" data-testid="select-history-period">
            <option value="all">Période</option><option value="7d">7 jours</option><option value="30d">30 jours</option><option value="90d">90 jours</option>
          </select></label>
          <label className="history-select"><HistoryGlyph name="filter"/><select value={status} onChange={event => setStatus(event.target.value as StatusFilter)} aria-label="Statut" data-testid="select-history-status">
            <option value="all">Statut</option><option value="succeeded">Effectuée</option><option value="pending">En attente</option><option value="failed">Échouée</option>
          </select></label>
          <button className="history-export" type="button" onClick={() => void exportCsv()} disabled={exporting || records.length > 0} aria-label="Exporter les résultats en CSV" title={records.length ? 'Export indisponible pour les données fournies' : 'Exporter en CSV'} data-testid="button-history-export">
            <HistoryGlyph name="download"/><span className="sr-only">{exporting ? 'Préparation du fichier' : 'Exporter en CSV'}</span>
          </button>
        </section>
        {exportError && <p className="financial-history-export-error" role="status">{exportError}</p>}

        {history.isError && <div className="financial-history-error" role="alert">
          <strong>Historique momentanément indisponible</strong><span>Les opérations n’ont pas pu être chargées.</span>
          <button type="button" onClick={() => void history.refetch()}>Réessayer</button>
        </div>}
        {history.isLoading && !records.length ? <section className="financial-history-records" aria-label="Chargement des transactions" aria-busy="true">
          {[0, 1].map(item => <div className="history-skeleton" key={item}><i/><i/><i/><i/></div>)}
        </section> : hasRecords ? <section className="financial-history-records" aria-label={title}>
          {!records.length ? transactions.map(transaction => <FinancialHistoryCard key={transaction.id} kind={kind} record={{
            id: transaction.id, status: transaction.status, amount: transaction.amount, initiatedAt: transaction.createdAt,
            title: labels[transaction.type] ?? transaction.type, reference: transaction.id,
          }} />) : records.map((record, index) => <FinancialHistoryCard key={record.id ?? `${record.status ?? 'unknown'}-${index}`} record={record} kind={kind}/>)}
        </section> : <section className="financial-history-empty" data-testid="text-financial-history-empty">
          <HistoryGlyph name="history"/><strong>{history.isError ? 'Aucun résultat à afficher' : search || status !== 'all' || period !== 'all' ? 'Aucune opération correspondante' : isWithdrawal ? 'Aucun retrait enregistré' : isBalance ? 'Aucune transaction enregistrée' : 'Aucune recharge enregistrée'}</strong>
          <span>{history.isError ? 'Réessayez dans quelques instants.' : 'Vos opérations confirmées apparaîtront ici.'}</span>
        </section>}
        {history.hasNextPage && <button className="financial-history-more" type="button" disabled={history.isFetchingNextPage} onClick={() => void history.fetchNextPage()}>{history.isFetchingNextPage ? 'Chargement…' : 'Afficher les opérations précédentes'}</button>}
        <div className="financial-history-refinery" aria-hidden="true">
          <img src={`${import.meta.env.BASE_URL}iamgold-industrial-art/history/refinery-footer.png`} alt="" />
        </div>
      </main>
      <BottomNav active="Account"/>
    </div>
  </Frame>;
}
