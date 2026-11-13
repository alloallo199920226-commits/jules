import { useEffect, useMemo, useState } from 'react';
import { Frame, Header, Support, goBack } from './shared';
import './financial.css';
import { apiRequest } from '@/lib/iamgold-api';
import './orders.css';

const tabs = ['Tout', 'En cours', 'Terminé'];
type MemberOrder = {
  id: string;
  productName?: string;
  name?: string;
  price?: number;
  amount?: number;
  dailyIncome?: number;
  totalIncome?: number;
  durationDays?: number;
  status?: string;
  source?: string;
  createdAt?: string;
};
const money = (value?: number) => value === undefined ? '—' : `${new Intl.NumberFormat('fr-FR').format(value)} FCFA`;
const stateLabel = (status = '') => {
  const value = status.toLowerCase();
  if (['active', 'running', 'in_progress', 'pending'].includes(value)) return 'En cours';
  if (['completed', 'finished', 'expired', 'complete'].includes(value)) return 'Terminé';
  return status;
};
export default function Orders() {
  const [selected, setSelected] = useState('Tout');
  const [orders, setOrders] = useState<MemberOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, retry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    apiRequest<{ orders: MemberOrder[] }>('/api/member/orders', { signal: controller.signal })
      .then(result => { setOrders(result.orders); setError(''); })
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Impossible de charger les commandes.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);
  const visible = useMemo(() => selected === 'Tout' ? orders : orders.filter(order => stateLabel(order.status) === selected), [orders, selected]);
  return <Frame><div className="finance-screen">
    <Header title="Mes commandes" onBack={() => goBack()} />
    <div className="finance-tabbar finance-orders-tabs" role="tablist" aria-label="Commandes">
      {tabs.map(tab => <button type="button" role="tab" aria-selected={selected === tab} key={tab} className={selected === tab ? 'active' : ''} onClick={() => setSelected(tab)}>{tab}</button>)}
    </div>
    <main className="member-orders-content" aria-live="polite">
      {loading ? <div className="member-orders-loading" role="status"><i/><i/><i/></div> : error ? <div className="finance-empty-area" role="alert"><p>{error}</p><button type="button" className="ayala-soft-button" onClick={() => retry(value => value + 1)}>Réessayer</button></div> : visible.length ? <section className="member-orders-list" aria-label="Commandes">
        {visible.map(order => <article className="member-order-card" key={order.id} data-testid={`member-order-${order.id}`}>
          <header><strong>{order.productName || order.name || 'Produit IAMGOLD'}</strong><span>{stateLabel(order.status) || '—'}</span></header>
          <p className={`member-order-source${order.source === 'admin' || order.source === 'admin_grant' ? ' is-admin' : ''}`}>
            {order.source === 'admin' || order.source === 'admin_grant' ? 'Octroi administratif' : order.source === 'purchase' ? 'Achat' : 'Origine non renseignée'}
          </p>
          <dl><div><dt>Montant</dt><dd>{money(order.price ?? order.amount)}</dd></div><div><dt>Revenu quotidien</dt><dd>{money(order.dailyIncome)}</dd></div><div><dt>Revenu total</dt><dd>{money(order.totalIncome)}</dd></div><div><dt>Durée</dt><dd>{order.durationDays === undefined ? '—' : `${order.durationDays} jours`}</dd></div></dl>
          {order.createdAt && <time>{new Date(order.createdAt).toLocaleString('fr-FR')}</time>}
        </article>)}
      </section> : <div className="finance-empty-area"><div className="finance-empty-face" aria-hidden="true"><span/><i/></div><p>{orders.length ? 'Aucune commande dans cette catégorie' : 'Aucune commande'}</p></div>}
    </main>
    <Support/>
  </div></Frame>;
}
