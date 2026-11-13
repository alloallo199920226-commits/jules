import { IndustrialIcon, type IndustrialIconName } from '@/components/industrial-icons';

export type FinancialRow = {
  label: string;
  value: string;
  icon: IndustrialIconName;
  emphasis?: boolean;
  testId?: string;
};

export function FinancialTable({ rows, className = '' }: { rows: FinancialRow[]; className?: string }) {
  return (
    <dl className={`ig-financial-table ${className}`}>
      {rows.map(row => (
        <div className={`ig-financial-row${row.emphasis ? ' is-emphasis' : ''}`} key={row.label} data-testid={row.testId}>
          <dt><IndustrialIcon name={row.icon} size={23} /><span>{row.label}</span></dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
