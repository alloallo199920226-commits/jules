import React from 'react';

export type FinancialHistoryKind = 'withdrawals' | 'recharges' | 'balance';
export type FinancialHistoryStatus = 'succeeded' | 'pending' | 'failed';

export interface FinancialHistoryRecord {
  id?: string | number;
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
      return { className: 'succeeded', label: 'Réussi' };
    case 'pending':
    case 'processing':
      return { className: 'pending', label: 'En traitement' };
    case 'failed':
    case 'failure':
      return { className: 'failed', label: 'Échoué' };
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
  const fields = [
    [withdrawals ? 'Montant de retrait' : 'Montant du dépôt', formatHistoryAmount(record.amount)],
    [withdrawals ? 'Montant reçu' : 'Montant crédité', formatHistoryAmount(record.receivedAmount)],
    ['Montant de la taxe', formatHistoryAmount(record.taxAmount)],
    ['Heure d’initiation', formatHistoryDate(record.initiatedAt)],
  ];
  return (
    <article
      className={`financial-history-card financial-history-card--${status.className}`}
      data-testid="card-financial-history-record"
    >
      <div className="financial-history-card-status">
        <span>{withdrawals ? 'Statut du retrait' : 'Statut du dépôt'}</span>
        <strong data-testid="status-financial-history">{status.label}</strong>
      </div>
      <dl className="financial-history-card-fields">
        {fields.map(([label, value]) => (
          <div className="financial-history-field" key={label}>
            <dt className="financial-history-field-label">{label}</dt>
            <dd className="financial-history-field-value">{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
