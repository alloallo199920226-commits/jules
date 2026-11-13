import { useId, useMemo, useState } from 'react';
import { BottomNav, Frame, goBack } from './_baseline/boundaries';
import { DEMONSTRATION_TRANSACTIONS, type DemoTransaction, type PreviewKind } from './preview-fixtures';
import './industrial-history-preview.css';

const pages: { kind: PreviewKind; title: string }[] = [
  { kind: 'recharges', title: 'Historique des recharges' },
  { kind: 'withdrawals', title: 'Historique des retraits' },
  { kind: 'balance', title: 'Historique du solde' },
];
const DEMO_NOW = new Date('2026-11-13T23:59:59');
const formatAmount = (amount: number) => `FCFA${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const statusText = { succeeded: 'Effectuée', pending: 'En attente', failed: 'Échouée' };

function Mark({ type }: { type: string }) {
  const goldId = `demo-gold-${useId().replace(/:/g, '')}`;
  const goldPaint = `url(#${goldId})`;
  const path = type === 'success' ? <><circle cx="12" cy="12" r="9" fill="#14753e" stroke="#4be084" strokeWidth="1.5"/><path d="m7.5 12 3 3 6-6" fill="none" stroke="#e9ffdf" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></> :
    type === 'failed' ? <><circle cx="12" cy="12" r="9" fill="#8d2825" stroke="#ff6a56" strokeWidth="1.5"/><path d="m8.5 8.5 7 7m0-7-7 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></> :
      type === 'pending' ? <><circle cx="12" cy="12" r="9" fill="#6e4f12" stroke="#edc24a" strokeWidth="1.5"/><path d="M12 7v5l3.5 2" fill="none" stroke="#fff0b6" strokeWidth="2" strokeLinecap="round"/></> :
        type === 'search' ? <><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="#f5cf65" strokeWidth="2.2"/><path d="m15 15 5 5" stroke="#f5cf65" strokeWidth="2.2" strokeLinecap="round"/></> :
          type === 'coins' ? <><ellipse cx="12" cy="6" rx="8" ry="3" fill={goldPaint}/><path d="M4 6v11c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2V6M4 11.5c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2" fill="none" stroke="#ffe594" strokeWidth="1.8"/></> :
            type === 'calendar' ? <><rect x="3.5" y="5" width="17" height="15" rx="2" fill="none" stroke="#f5cf65" strokeWidth="2"/><path d="M7.5 3.5v4M16.5 3.5v4M4 9h16m-11 4h.1m4 0h.1m4 0h.1M9 16h.1m4 0h.1" stroke="#f5cf65" strokeWidth="2" strokeLinecap="round"/></> :
              type === 'filter' ? <path d="M3 5h18l-7 8v5l-4 2v-7z" fill="none" stroke="#f5cf65" strokeWidth="2" strokeLinejoin="round"/> :
                type === 'download' ? <path d="M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4" fill="none" stroke="#f5cf65" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/> :
                  type === 'coins-small' ? <><ellipse cx="12" cy="7" rx="8" ry="3" fill={goldPaint}/><path d="M4 7v10c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2V7m-16 5c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2" fill="none" stroke="#ffe594" strokeWidth="1.8"/></> :
                    <><path d="m12 2 9 4v6c0 5.5-3.8 8.4-9 10-5.2-1.6-9-4.5-9-10V6z" fill={goldPaint} stroke="#ffedaa" strokeWidth="1.5"/><path d="m8 12 3 3 5-6" fill="none" stroke="#07223b" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id={goldId} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff1a5"/><stop offset=".48" stopColor="#e6b439"/><stop offset="1" stopColor="#95650e"/></linearGradient></defs>{path}</svg>;
}

export function HistoryPreview({ initialKind }: { initialKind: PreviewKind }) {
  const [kind, setKind] = useState(initialKind);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('all');
  const [status, setStatus] = useState('all');
  const page = pages.find(item => item.kind === kind)!;
  const rows = useMemo(() => DEMONSTRATION_TRANSACTIONS.filter(item => item.kind === kind &&
    (!search || item.reference.toLowerCase().includes(search.toLowerCase())) &&
    (status === 'all' || item.status === status) &&
    (period === 'all' || DEMO_NOW.getTime() - new Date(item.date.replace(' ', 'T')).getTime() <= Number.parseInt(period, 10) * 86400000)), [kind, search, status, period]);
  const total = rows.length;
  const succeeded = rows.filter(item => item.status === 'succeeded').length;
  const failed = rows.filter(item => item.status === 'failed').length;
  const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0);

  function exportCsv() {
    const csv = [['Référence', 'Opération', 'Montant', 'Statut', 'Date'], ...rows.map(row => [row.reference, row.title, row.amount, statusText[row.status], row.date])]
      .map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `iamgold-demo-${kind}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return <Frame>
    <div className={`history-preview-page history-preview-page--${kind}`}>
      <div className="history-demo-ribbon">APERÇU · DONNÉES DE DÉMONSTRATION</div>
      <header className="history-preview-header">
        <img className="history-header-art" src="/__mockup/images/header.png" alt="" />
        <button className="history-preview-back" type="button" onClick={() => goBack('Account')} aria-label="Retour">‹</button>
        <div className="history-preview-title">{page.title}</div>
      </header>
      <main className="history-preview-scroll">
        <nav className="history-preview-tabs" aria-label="Historiques financiers">
          {pages.map(tab => <button type="button" key={tab.kind} aria-current={tab.kind === kind ? 'page' : undefined} onClick={() => { setKind(tab.kind); setSearch(''); setPeriod('all'); setStatus('all'); }}>
            <Mark type={tab.kind === 'recharges' ? 'coins' : tab.kind === 'withdrawals' ? 'download' : 'bullion'}/><span>{tab.kind === 'recharges' ? 'Recharges' : tab.kind === 'withdrawals' ? 'Retraits' : 'Solde'}</span>
          </button>)}
        </nav>
        {kind === 'balance' ? <section className="history-preview-balance">
          <Mark type="coins"/><div><span>CUMUL HISTORIQUE REÇU</span><strong>FCFA50 000.00</strong><p>Reçus au total · cumul historique,<br/> non retirable en plus du solde</p></div>
        </section> : <section className="history-preview-stats" aria-label="Synthèse">
          <div><Mark type="coins"/><span>Total</span><b>{total}</b></div><div><Mark type="success"/><span>Effectuées</span><b>{succeeded}</b></div><div><Mark type="failed"/><span>Échouées</span><b>{failed}</b></div><div><Mark type="coins-small"/><span>Montant total</span><b>{formatAmount(totalAmount)}</b></div>
        </section>}
        <section className="history-preview-filters">
          <label className="history-preview-search"><Mark type="search"/><input maxLength={120} value={search} onChange={event => setSearch(event.target.value)} placeholder="Rechercher une référence…" aria-label="Rechercher une référence"/></label>
          <label className="history-preview-select"><Mark type="calendar"/><select value={period} onChange={event => setPeriod(event.target.value)} aria-label="Période"><option value="all">Période</option><option value="7d">7 jours</option><option value="30d">30 jours</option><option value="90d">90 jours</option></select></label>
          <label className="history-preview-select"><Mark type="filter"/><select value={status} onChange={event => setStatus(event.target.value)} aria-label="Statut"><option value="all">Statut</option><option value="succeeded">Effectuée</option><option value="pending">En attente</option><option value="failed">Échouée</option></select></label>
          <button className="history-preview-export" type="button" onClick={exportCsv} aria-label="Exporter les résultats en CSV"><Mark type="download"/></button>
        </section>
        <section className={`history-preview-list${kind === 'balance' ? ' history-preview-list-balance' : ''}`} aria-label={page.title}>
          {rows.map(item => <Transaction key={item.id} item={item} balance={kind === 'balance'}/>)}
          {!rows.length && <div className="history-preview-empty"><Mark type="bullion"/><b>Aucune opération correspondante</b><span>Les opérations de démonstration apparaîtront ici.</span></div>}
        </section>
        <div className="history-preview-refinery"><img src="/__mockup/images/refinery-footer.png" alt="" /></div>
      </main>
      <BottomNav active="Account"/>
    </div>
  </Frame>;
}

function Transaction({ item, balance }: { item: DemoTransaction; balance: boolean }) {
  return <article className={`history-preview-card history-preview-card-${item.status}`}>
    <header><Mark type={item.status}/>{item.kind === 'recharges' && <Mark type="coins-small"/>}<div><strong>{item.title}</strong></div><b className={`history-preview-badge badge-${item.status}`}>{statusText[item.status]}</b></header>
    <div className="history-preview-card-body">
      <div className={`history-preview-card-art history-preview-card-art-${item.status}`}>
        {item.kind === 'recharges'
          ? <img src={`/__mockup/images/${item.status === 'failed' ? 'recharge-failed-illustration.png' : 'recharge-illustration.png'}`} alt="" />
          : <Mark type={item.kind === 'withdrawals' ? 'download' : 'coins'}/>}
      </div>
      <dl>
        <div><dt>Référence</dt><dd>{item.reference}</dd></div>
        <div><dt>Montant</dt><dd className={balance ? 'history-positive' : ''}>{balance && '+'}{formatAmount(item.amount)}</dd></div>
        <div><dt>Date</dt><dd>{item.date}</dd></div>
      </dl>
    </div>
  </article>;
}
