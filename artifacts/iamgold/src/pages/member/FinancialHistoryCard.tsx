import { useId } from 'react';
import { HistoryGlyph } from './FinancialHistoryIcons';

export type FinancialHistoryKind = 'withdrawals' | 'recharges' | 'balance';
export type FinancialHistoryStatus = 'succeeded' | 'pending' | 'failed';

export interface FinancialHistoryRecord {
  id?: string | number;
  title?: string;
  reference?: string;
  status?: FinancialHistoryStatus | string;
  amount?: number | string | null;
  receivedAmount?: number | string | null;
  taxAmount?: number | string | null;
  initiatedAt?: string | Date | null;
}

export function formatHistoryAmount(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string' && !/^-?\d+(?:\.\d+)?$/.test(value.trim())) return '—';
  const amount = Number(value);
  return Number.isFinite(amount) ? `FCFA${amount.toFixed(2)}` : '—';
}

export function formatHistoryDate(value: string | Date | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  // Preserve valid server wall-clock timestamps; never reinterpret them in a new timezone.
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
    const date = new Date(value.replace(' ', 'T') + 'Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 19).replace('T', ' ') === value
      ? value : '—';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function statusDetails(status: string | undefined) {
  switch (status?.toLowerCase()) {
    case 'succeeded':
    case 'success':
    case 'successful':
    case 'completed':
      return { className: 'succeeded', label: 'Effectuée' };
    case 'pending':
    case 'processing':
      return { className: 'pending', label: 'En attente' };
    case 'failed':
    case 'failure':
      return { className: 'failed', label: 'Échouée' };
    default:
      return { className: 'unknown', label: 'Statut inconnu' };
  }
}

export function FinancialHistoryCard({ record, kind }: {
  record: FinancialHistoryRecord;
  kind: FinancialHistoryKind;
}) {
  const withdrawals = kind === 'withdrawals';
  const status = statusDetails(record.status);
  const statusLabel = status.className === 'succeeded' && withdrawals ? 'Complété'
    : status.className === 'pending' && kind === 'recharges' ? 'En cours' : status.label;
  const amountValue = Number(record.amount);
  const formattedAmount = record.amount !== null && record.amount !== undefined && record.amount !== '' && Number.isFinite(amountValue)
    ? `${kind === 'balance' && amountValue > 0 ? '+' : kind === 'balance' && amountValue < 0 ? '−' : ''}${formatHistoryAmount(Math.abs(amountValue))}`
    : formatHistoryAmount(record.amount);
  const fields = [
    ...(record.reference ? [['Référence', String(record.reference)]] : []),
    [withdrawals ? 'Montant du retrait' : kind === 'balance' ? 'Montant' : 'Montant de la recharge', formattedAmount],
    ...(record.receivedAmount !== undefined ? [[withdrawals ? 'Montant reçu' : 'Montant crédité', formatHistoryAmount(record.receivedAmount)]] : []),
    ...(record.taxAmount !== undefined ? [['Montant de la taxe', formatHistoryAmount(record.taxAmount)]] : []),
    ['Date', formatHistoryDate(record.initiatedAt)],
  ];
  return (
    <article
      className={`financial-history-card financial-history-card--${status.className}`}
      data-testid="card-financial-history-record"
    >
      <div className="financial-history-card-heading">
        <span className="financial-history-card-emblem"><HistoryCardMark status={status.className}/></span>
        {kind === 'recharges' && <HistoryGlyph name="coins" className="financial-history-card-coin-mark" />}
        <div className="financial-history-card-title-wrap"><strong className="financial-history-card-title">{record.title ?? (withdrawals ? 'Retrait' : kind === 'balance' ? 'Mouvement du solde' : 'Recharge')}</strong>
          <span>{withdrawals ? 'Retrait' : kind === 'balance' ? 'Mouvement du solde' : 'Recharge'}</span></div>
        <strong data-testid="status-financial-history">{statusLabel}</strong>
      </div>
      <div className="financial-history-card-body">
        <div className={`financial-history-card-art financial-history-card-art--${status.className}`}>
          {kind === 'recharges' && (status.className === 'succeeded' || status.className === 'failed')
            ? <img src={`${import.meta.env.BASE_URL}iamgold-industrial-art/history/${status.className === 'failed' ? 'recharge-failed-illustration.png' : 'recharge-illustration.png'}`} alt="" />
            : <HistoryGlyph name={status.className === 'pending' || status.className === 'unknown' ? 'history' : withdrawals ? 'withdrawal' : 'coins'} />}
        </div>
        <dl className="financial-history-card-fields">
          {fields.map(([label, value]) => (
            <div className={`financial-history-field${label === 'Référence' ? ' financial-history-field--reference' : ''}`} key={label}>
              <dt className="financial-history-field-label">{label}</dt>
              <dd className={`financial-history-field-value${label.startsWith('Montant') ? ' financial-history-field-value--amount' : ''}`}>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}

function HistoryCardMark({ status }: { status: string }) {
  const gradientId = `medal-${useId().replace(/:/g, '')}`;
  return <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <defs><linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff0a4"/><stop offset=".44" stopColor="#d9a52d"/><stop offset="1" stopColor="#80530e"/></linearGradient></defs>
    <path d="M24 3 40 9v12c0 11-7 18-16 24C15 39 8 32 8 21V9z" fill={`url(#${gradientId})`} stroke="#ffdf79" strokeWidth="1.5"/>
    <path d="M24 7 36 11v10c0 8-4.7 13.6-12 19-7.3-5.4-12-11-12-19V11z" fill="#082b46" stroke="#f8d15d" strokeWidth="1"/>
    {status === 'failed' ? <path d="m18 17 12 12m0-12L18 29" stroke="#f05c4f" strokeWidth="4" strokeLinecap="round"/> :
      status === 'pending' ? <><circle cx="24" cy="23" r="9" fill="none" stroke="#ffd166" strokeWidth="2.5"/><path d="M24 17v7l5 3" fill="none" stroke="#ffd166" strokeWidth="2.5" strokeLinecap="round"/></> :
      status === 'unknown' ? <><path d="M20 18c0-6 10-6 10 0 0 4-6 4-6 8" fill="none" stroke="#ffe3a0" strokeWidth="3" strokeLinecap="round"/><circle cx="24" cy="32" r="1.7" fill="#ffe3a0"/></> :
        <path d="m17 23 5 5 10-11" fill="none" stroke="#3bd47b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>}
  </svg>;
}
