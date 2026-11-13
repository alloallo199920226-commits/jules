export type PreviewKind = 'recharges' | 'withdrawals' | 'balance';
export type DemoTransaction = {
  id: string;
  title: string;
  amount: number;
  status: 'succeeded' | 'pending' | 'failed';
  date: string;
  kind: PreviewKind;
  reference: string;
};

// Explicitly synthetic, presentation-only examples. The production history never imports this file.
export const DEMONSTRATION_TRANSACTIONS: DemoTransaction[] = [
  { id: 'demo-r-1', title: 'Recharge', amount: 2000, status: 'succeeded', date: '2026-11-13 17:18:28', kind: 'recharges', reference: 'DEMO-100000000001' },
  { id: 'demo-r-2', title: 'Recharge', amount: 2000, status: 'failed', date: '2026-11-13 16:54:04', kind: 'recharges', reference: 'DEMO-100000000002' },
  { id: 'demo-w-1', title: 'Retrait', amount: 12500, status: 'pending', date: '2026-11-12 10:42:17', kind: 'withdrawals', reference: 'DEMO-200000000001' },
  { id: 'demo-w-2', title: 'Retrait', amount: 7500, status: 'succeeded', date: '2026-11-09 09:16:52', kind: 'withdrawals', reference: 'DEMO-200000000002' },
  { id: 'demo-b-1', title: 'Crédit administrateur', amount: 50000, status: 'succeeded', date: '2026-11-13 13:47:10', kind: 'balance', reference: 'DEMO-300000000001' },
];
